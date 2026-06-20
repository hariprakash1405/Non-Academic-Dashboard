package handlers

import (
	"strings"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"fmt"
	"backend/models"
	"encoding/json"
	"net/http"
	
	"time"
)

func isResidentWarden(role string) bool {
	r := strings.ToLower(role)
	return !(strings.Contains(r, "cleaner") || strings.Contains(r, "keeper") || strings.Contains(r, "security"))
}

// --- Models ---

// --- Handlers ---

func (h *APIHandler) GetHostels(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" { return }

	HostelCache.mu.RLock()
	if time.Since(HostelCache.lastUpdate) < HostelCache.ttl && HostelCache.data != nil {
		HostelCache.mu.RUnlock()
		w.Header().Set("Content-Type", "application/json")
		w.Write(HostelCache.data)
		return
	}
	HostelCache.mu.RUnlock()


	

	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var blocks []models.HostelBlock
	h.DB.Preload("Wardens").Preload("ResidentList").Preload("Complaints").Preload("FloorDetails").Preload("AbsentList").Find(&blocks)

	// Self-healing: Ensure existing DB records perfectly match actual array lengths
	for i := range blocks {
		occupyingWardens := 0
		for _, w := range blocks[i].Wardens {
			if isResidentWarden(w.Role) {
				occupyingWardens++
			}
		}
		actualOccupied := len(blocks[i].ResidentList) + occupyingWardens
		if blocks[i].Occupied != actualOccupied {
			blocks[i].Occupied = actualOccupied
			blocks[i].VacantBeds = blocks[i].Beds - actualOccupied
			h.DB.Model(&models.HostelBlock{}).Where("name = ?", blocks[i].Name).Updates(map[string]interface{}{
				"occupied":    blocks[i].Occupied,
				"vacant_beds": blocks[i].VacantBeds,
			})
		}
	}

	var usages []models.DailyUsage
	h.DB.Find(&usages)

	usageMap := make(map[string][]models.DailyUsage)
	for _, u := range usages {
		usageMap[u.Block] = append(usageMap[u.Block], u)
	}

	var maintenance []models.MaintenanceTicket
	h.DB.Find(&maintenance)

	response := map[string]interface{}{
		"blocks":      blocks,
		"dailyUsage":  usageMap,
		"maintenance": maintenance,
	}

	
	


	jsonData, err := json.Marshal(response)
	if err == nil {
		HostelCache.mu.Lock()
		HostelCache.data = jsonData
		HostelCache.lastUpdate = time.Now()
		HostelCache.mu.Unlock()
	}

	w.Header().Set("Content-Type", "application/json")
	if err == nil {
		w.Write(jsonData)
	} else {
		json.NewEncoder(w).Encode(response)
	}
}

func (h *APIHandler) UpdateUsage(w http.ResponseWriter, r *http.Request) {
	HostelCache.mu.Lock()
	HostelCache.data = nil
	HostelCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var input struct {
		Block  string `json:"block"`
		Values struct {
			Water       string `json:"water"`
			Electricity string `json:"electricity"`
			Occupancy   string `json:"occupancy"`
			Complaints  string `json:"complaints"`
		} `json:"values"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	targetDate := time.Now().Format("02 Jan")
	if input.Block != "" {
		var existing models.DailyUsage
		err := h.DB.Where("block = ? AND date = ?", input.Block, targetDate).First(&existing).Error
		if err == nil {
			// Merge and update existing record
			if input.Values.Water != "" {
				fmt.Sscanf(input.Values.Water, "%f", &existing.Water)
			}
			if input.Values.Electricity != "" {
				fmt.Sscanf(input.Values.Electricity, "%f", &existing.Power)
			}
			h.DB.Save(&existing)
		} else {
			// Create a new record
			newUsage := models.DailyUsage{
				Block: input.Block,
				Date:  targetDate,
			}
			if input.Values.Water != "" {
				fmt.Sscanf(input.Values.Water, "%f", &newUsage.Water)
			}
			if input.Values.Electricity != "" {
				fmt.Sscanf(input.Values.Electricity, "%f", &newUsage.Power)
			}
			h.DB.Create(&newUsage)
		}
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "Data updated successfully")
}

func (h *APIHandler) UpdateBlock(w http.ResponseWriter, r *http.Request) {
	HostelCache.mu.Lock()
	HostelCache.data = nil
	HostelCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var input models.HostelBlock
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		http.Error(w, "Block name is required", http.StatusBadRequest)
		return
	}

	var existing models.HostelBlock
	exists := false
	if err := h.DB.First(&existing, "name = ?", input.Name).Error; err == nil {
		exists = true
	}

	// Validation and Merging Logic
	if !exists {
		// New block requires total beds and occupied
		if input.Beds <= 0 {
			http.Error(w, "Total beds capacity is required for a new block", http.StatusBadRequest)
			return
		}
		if input.Occupied <= 0 {
			http.Error(w, "No. of students (occupied) is required for a new block", http.StatusBadRequest)
			return
		}
	} else {
		// Existing block: beds, occupied, and staff count are optional
		if input.Beds <= 0 {
			input.Beds = existing.Beds
		}
		if input.Occupied <= 0 {
			input.Occupied = existing.Occupied
		}
		if input.Type == "" {
			input.Type = existing.Type
		}
		if input.Gender == "" {
			input.Gender = existing.Gender
		}
		if input.StaffCount <= 0 {
			input.StaffCount = existing.StaffCount
		}
	}

	// Strict Data Consistency Checks
	if input.Occupied > input.Beds {
		http.Error(w, fmt.Sprintf("Validation Error: No. of students (occupied: %d) cannot exceed total beds capacity (beds: %d)", input.Occupied, input.Beds), http.StatusBadRequest)
		return
	}

	// Filter out empty rows (similar to the frontend) before checking length
	var cleanedResidents []models.StudentDetail
	for _, res := range input.ResidentList {
		if res.Name != "" || res.RollNo != "" || res.RoomNo != "" {
			cleanedResidents = append(cleanedResidents, res)
		}
	}
	input.ResidentList = cleanedResidents

	// We dynamically calculate exact occupancy based on the actual objects provided
	occupyingWardens := 0
	for _, w := range input.Wardens {
		if isResidentWarden(w.Role) {
			occupyingWardens++
		}
	}
	input.Occupied = len(input.ResidentList) + occupyingWardens
	input.VacantBeds = input.Beds - input.Occupied

	var cleanedWardens []models.Warden
	for _, w := range input.Wardens {
		if w.Name != "" || w.Phone != "" {
			cleanedWardens = append(cleanedWardens, w)
		}
	}
	input.Wardens = cleanedWardens

	if len(input.Wardens) == 0 {
		http.Error(w, "Validation Error: At least one models.Warden or Support Staff detail is required", http.StatusBadRequest)
		return
	}

	var cleanedAbsentList []models.AbsentStudentDetail
	for _, res := range input.AbsentList {
		if res.Name != "" || res.RollNo != "" || res.RoomNo != "" {
			cleanedAbsentList = append(cleanedAbsentList, res)
		}
	}
	input.AbsentList = cleanedAbsentList
	input.AttendanceUnexcused = len(input.AbsentList)

	// GORM Transaction to securely update block and overwrite collections
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// Clear old associated records so additions/removals are applied completely
		if err := tx.Where("hostel_block_name = ?", input.Name).Delete(&models.Warden{}).Error; err != nil {
			return err
		}
		if err := tx.Where("hostel_block_name = ?", input.Name).Delete(&models.StudentDetail{}).Error; err != nil {
			return err
		}
		if err := tx.Where("hostel_block_name = ?", input.Name).Delete(&models.AbsentStudentDetail{}).Error; err != nil {
			return err
		}
		if err := tx.Where("hostel_block_name = ?", input.Name).Delete(&models.HostelFloorDetail{}).Error; err != nil {
			return err
		}

		// Save the block (temporarily clear associations to manage inserts manually)
		complaints := input.Complaints
		input.Complaints = nil

		residents := input.ResidentList
		input.ResidentList = nil

		wardens := input.Wardens
		input.Wardens = nil

		floorDetails := input.FloorDetails
		input.FloorDetails = nil

		if err := tx.Clauses(clause.OnConflict{UpdateAll: true}).Create(&input).Error; err != nil {
			return err
		}

		if len(residents) > 0 {
			for i := range residents {
				residents[i].HostelBlockName = input.Name
			}
			if err := tx.Clauses(clause.OnConflict{UpdateAll: true}).Create(&residents).Error; err != nil {
				return err
			}
		}

		if len(wardens) > 0 {
			for i := range wardens {
				wardens[i].HostelBlockName = input.Name
			}
			if err := tx.Clauses(clause.OnConflict{UpdateAll: true}).Create(&wardens).Error; err != nil {
				return err
			}
		}

		if len(floorDetails) > 0 {
			for i := range floorDetails {
				floorDetails[i].HostelBlockName = input.Name
				floorDetails[i].ID = 0 // Assign new IDs
			}
			if err := tx.Create(&floorDetails).Error; err != nil {
				return err
			}
		}

		// Upsert only the newly given daily complaints / tickets
		for _, ticket := range complaints {
			ticket.HostelBlockName = input.Name
			if err := tx.Clauses(clause.OnConflict{UpdateAll: true}).Create(&ticket).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		http.Error(w, "Error saving to database: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var blocks []models.HostelBlock
	h.DB.Preload("Wardens").Preload("ResidentList").Preload("Complaints").Preload("FloorDetails").Preload("AbsentList").Find(&blocks)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(blocks)
}

func (h *APIHandler) RaiseComplaint(w http.ResponseWriter, r *http.Request) {
	HostelCache.mu.Lock()
	HostelCache.data = nil
	HostelCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var ticket models.MaintenanceTicket
	if err := json.NewDecoder(r.Body).Decode(&ticket); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if ticket.Block == "" {
		http.Error(w, "Block name is required", http.StatusBadRequest)
		return
	}
	if ticket.Type == "" {
		http.Error(w, "Complaint category is required", http.StatusBadRequest)
		return
	}
	if ticket.Desc == "" {
		http.Error(w, "Description is required", http.StatusBadRequest)
		return
	}

	// Generate ID if empty
	if ticket.ID == "" {
		ticket.ID = fmt.Sprintf("TKT-%d", time.Now().UnixNano()/1e6%100000)
	}
	if ticket.Date == "" {
		ticket.Date = time.Now().Format("02 Jan")
	}
	if ticket.Status == "" {
		ticket.Status = "Pending"
	}
	if ticket.TAT == "" {
		ticket.TAT = "24 Hours" // Default TAT
	}
	ticket.HostelBlockName = ticket.Block

	// Save to DB
	if err := h.DB.Clauses(clause.OnConflict{UpdateAll: true}).Create(&ticket).Error; err != nil {
		http.Error(w, "Error saving complaint: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch all blocks to return updated state
	var blocks []models.HostelBlock
	h.DB.Preload("Wardens").Preload("ResidentList").Preload("Complaints").Preload("FloorDetails").Preload("AbsentList").Find(&blocks)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(blocks)
}

func (h *APIHandler) UpdateComplaintStatus(w http.ResponseWriter, r *http.Request) {
	HostelCache.mu.Lock()
	HostelCache.data = nil
	HostelCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var input struct {
		ID     string `json:"id"`
		Status string `json:"status"` // "Ongoing", "Resolved", "Pending"
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var ticket models.MaintenanceTicket
	if err := h.DB.First(&ticket, "id = ?", input.ID).Error; err != nil {
		http.Error(w, "Ticket not found", http.StatusNotFound)
		return
	}

	ticket.Status = input.Status
	if input.Status == "Resolved" {
		ticket.TAT = "Completed"
	}
	h.DB.Save(&ticket)

	// Fetch all blocks to return updated state
	var blocks []models.HostelBlock
	h.DB.Preload("Wardens").Preload("ResidentList").Preload("Complaints").Preload("FloorDetails").Preload("AbsentList").Find(&blocks)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(blocks)
}

func (h *APIHandler) RenameBlock(w http.ResponseWriter, r *http.Request) {
	HostelCache.mu.Lock()
	HostelCache.data = nil
	HostelCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var req struct {
		OldName string `json:"oldName"`
		NewName string `json:"newName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.OldName == "" || req.NewName == "" {
		http.Error(w, "Old name and new name are required", http.StatusBadRequest)
		return
	}

	// Transaction to safely update primary key and cascade references
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Check if new name already exists
		var existing models.HostelBlock
		if err := tx.Where("name = ?", req.NewName).First(&existing).Error; err == nil {
			return fmt.Errorf("a block named '%s' already exists", req.NewName)
		}

		// 2. Fetch the existing block
		var block models.HostelBlock
		if err := tx.Where("name = ?", req.OldName).First(&block).Error; err != nil {
			return fmt.Errorf("block '%s' not found", req.OldName)
		}

		// 3. Since GORM doesn't natively support primary key changes with CASCADE out-of-the-box,
		// we update using raw SQL queries under replica session role to bypass primary key catch-22 constraint errors.
		if err := tx.Exec("SET session_replication_role = 'replica';").Error; err != nil {
			return err
		}

		// Update hostel_blocks name
		if err := tx.Exec("UPDATE hostel_blocks SET name = ? WHERE name = ?", req.NewName, req.OldName).Error; err != nil {
			tx.Exec("SET session_replication_role = 'origin';")
			return err
		}

		// Update wardens references
		if err := tx.Exec("UPDATE wardens SET hostel_block_name = ? WHERE hostel_block_name = ?", req.NewName, req.OldName).Error; err != nil {
			tx.Exec("SET session_replication_role = 'origin';")
			return err
		}

		// Update student_details references
		if err := tx.Exec("UPDATE student_details SET hostel_block_name = ? WHERE hostel_block_name = ?", req.NewName, req.OldName).Error; err != nil {
			tx.Exec("SET session_replication_role = 'origin';")
			return err
		}

		// Update hostel_floor_details references
		if err := tx.Exec("UPDATE hostel_floor_details SET hostel_block_name = ? WHERE hostel_block_name = ?", req.NewName, req.OldName).Error; err != nil {
			tx.Exec("SET session_replication_role = 'origin';")
			return err
		}

		// Update maintenance_tickets references & Block text field
		if err := tx.Exec("UPDATE maintenance_tickets SET hostel_block_name = ?, block = ? WHERE hostel_block_name = ?", req.NewName, req.NewName, req.OldName).Error; err != nil {
			tx.Exec("SET session_replication_role = 'origin';")
			return err
		}

		// Update daily_usages block names
		if err := tx.Exec("UPDATE daily_usages SET block = ? WHERE block = ?", req.NewName, req.OldName).Error; err != nil {
			tx.Exec("SET session_replication_role = 'origin';")
			return err
		}

		// Restore default trigger checks
		if err := tx.Exec("SET session_replication_role = 'origin';").Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch fresh data and return
	var blocks []models.HostelBlock
	h.DB.Preload("Wardens").Preload("ResidentList").Preload("Complaints").Preload("FloorDetails").Preload("AbsentList").Find(&blocks)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(blocks)
}

func (h *APIHandler) AddBlock(w http.ResponseWriter, r *http.Request) {
	HostelCache.mu.Lock()
	HostelCache.data = nil
	HostelCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var req struct {
		Name                   string                     `json:"name"`
		Beds                   int                        `json:"beds"`
		Occupied               int                        `json:"occupied"`
		Type                   string                     `json:"type"`
		Gender                 string                     `json:"gender"`
		StaffCount             int                        `json:"staffCount"`
		Remarks                string                     `json:"remarks"`
		WardenName             string                     `json:"wardenName"`
		WardenPhone            string                     `json:"wardenPhone"`
		NumFloors              int                        `json:"numFloors"`
		TotalRooms             int                        `json:"totalRooms"`
		FloorDetails           []models.HostelFloorDetail `json:"floorDetails"`
		ChiefWardenCount       int                        `json:"chiefWardenCount"`
		DeputyWardenCount      int                        `json:"deputyWardenCount"`
		SeniorCaretakerCount   int                        `json:"seniorCaretakerCount"`
		CareTakerAttenderCount int                        `json:"careTakerAttenderCount"`
		HouseKeeperCount       int                        `json:"houseKeeperCount"`
		BathroomCleanerCount   int                        `json:"bathroomCleanerCount"`
		SecurityCount          int                        `json:"securityCount"`
		VacantBeds             int                        `json:"vacantBeds"`
		MaintenanceRoomsBeds   int                        `json:"maintenanceRoomsBeds"`

		AllocatedCapacity   int     `json:"allocatedCapacity"`
		WaterCoolersCount   int     `json:"waterCoolersCount"`
		BathroomsPerFloor   float64 `json:"bathroomsPerFloor"`
		ToiletsPerFloor     float64 `json:"toiletsPerFloor"`
		SolarHeaterCapacity string  `json:"solarHeaterCapacity"`
		WifiAccessPoints    int     `json:"wifiAccessPoints"`
		CctvCameras         int     `json:"cctvCameras"`
		CaretakerCount      int     `json:"caretakerCount"`
		CommonRoom          string  `json:"commonRoom"`
		ReadingRoom         string  `json:"readingRoom"`
		ParentWaitingRoom   string  `json:"parentWaitingRoom"`

		AttendancePresent   int `json:"attendancePresent"`
		AttendancePermitted int `json:"attendancePermitted"`
		AttendanceUnexcused int `json:"attendanceUnexcused"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Block name is required", http.StatusBadRequest)
		return
	}
	if req.Beds < 0 {
		http.Error(w, "Total beds capacity cannot be negative", http.StatusBadRequest)
		return
	}
	if req.Occupied < 0 {
		http.Error(w, "Occupied count cannot be negative", http.StatusBadRequest)
		return
	}

	// Check if already exists
	var existing models.HostelBlock
	if err := h.DB.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		http.Error(w, fmt.Sprintf("A block named '%s' already exists", req.Name), http.StatusBadRequest)
		return
	}

	// Seed transaction
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		newBlock := models.HostelBlock{
			Name:                   req.Name,
			Beds:                   req.Beds,
			Occupied:               req.Occupied,
			Type:                   req.Type,
			Gender:                 req.Gender,
			StaffCount:             req.StaffCount,
			Remarks:                req.Remarks,
			NumFloors:              req.NumFloors,
			TotalRooms:             req.TotalRooms,
			FloorDetails:           req.FloorDetails,
			ChiefWardenCount:       req.ChiefWardenCount,
			DeputyWardenCount:      req.DeputyWardenCount,
			SeniorCaretakerCount:   req.SeniorCaretakerCount,
			CareTakerAttenderCount: req.CareTakerAttenderCount,
			HouseKeeperCount:       req.HouseKeeperCount,
			BathroomCleanerCount:   req.BathroomCleanerCount,
			SecurityCount:          req.SecurityCount,
			VacantBeds:             req.VacantBeds,
			MaintenanceRoomsBeds:   req.MaintenanceRoomsBeds,
			AllocatedCapacity:      req.AllocatedCapacity,
			WaterCoolersCount:      req.WaterCoolersCount,
			BathroomsPerFloor:      req.BathroomsPerFloor,
			ToiletsPerFloor:        req.ToiletsPerFloor,
			SolarHeaterCapacity:    req.SolarHeaterCapacity,
			WifiAccessPoints:       req.WifiAccessPoints,
			CctvCameras:            req.CctvCameras,
			CaretakerCount:         req.CaretakerCount,
			CommonRoom:             req.CommonRoom,
			ReadingRoom:            req.ReadingRoom,
			ParentWaitingRoom:      req.ParentWaitingRoom,
			AttendancePresent:      req.AttendancePresent,
			AttendancePermitted:    req.AttendancePermitted,
			AttendanceUnexcused:    req.AttendanceUnexcused,
		}

		if err := tx.Create(&newBlock).Error; err != nil {
			return err
		}

		// Create default warden if provided
		if req.WardenName != "" && req.WardenPhone != "" {
			w := models.Warden{
				Name:            req.WardenName,
				Phone:           req.WardenPhone,
				HostelBlockName: req.Name,
				Role:            "models.Warden",
			}
			if err := tx.Create(&w).Error; err != nil {
				return err
			}
		}

		// Seed a default usage record for today
		targetDate := time.Now().Format("02 Jan")
		usage := models.DailyUsage{
			Block: req.Name,
			Date:  targetDate,
			Water: 0.0,
			Power: 0.0,
		}
		if err := tx.Create(&usage).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var blocks []models.HostelBlock
	h.DB.Preload("Wardens").Preload("ResidentList").Preload("Complaints").Preload("FloorDetails").Preload("AbsentList").Find(&blocks)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(blocks)
}

func (h *APIHandler) DeleteBlock(w http.ResponseWriter, r *http.Request) {
	HostelCache.mu.Lock()
	HostelCache.data = nil
	HostelCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var req struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Block name is required", http.StatusBadRequest)
		return
	}

	// Transaction to delete block and all associated records cascadingly
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// Delete Wardens
		if err := tx.Exec("DELETE FROM wardens WHERE hostel_block_name = ?", req.Name).Error; err != nil {
			return err
		}
		// Delete Student Details
		if err := tx.Exec("DELETE FROM student_details WHERE hostel_block_name = ?", req.Name).Error; err != nil {
			return err
		}
		// Delete Floor Details
		if err := tx.Exec("DELETE FROM hostel_floor_details WHERE hostel_block_name = ?", req.Name).Error; err != nil {
			return err
		}
		// Delete Maintenance Tickets
		if err := tx.Exec("DELETE FROM maintenance_tickets WHERE hostel_block_name = ?", req.Name).Error; err != nil {
			return err
		}
		// Delete Daily Usages
		if err := tx.Exec("DELETE FROM daily_usages WHERE block = ?", req.Name).Error; err != nil {
			return err
		}
		// Delete Hostel Block
		if err := tx.Exec("DELETE FROM hostel_blocks WHERE name = ?", req.Name).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return updated block list
	var blocks []models.HostelBlock
	h.DB.Preload("Wardens").Preload("ResidentList").Preload("Complaints").Preload("FloorDetails").Preload("AbsentList").Find(&blocks)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(blocks)
}
