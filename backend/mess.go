package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"os/exec"
	"time"
)

// --- Models ---

type MessBlock struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Name     string `gorm:"unique" json:"name"`
	Capacity int    `json:"capacity"`
	Occupied int    `json:"occupied"`
	Gender   string `json:"gender"`
}

type MessEquipment struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	BlockName string `json:"blockName"`
	Name      string `json:"name"`
	Total     int    `json:"total"`
	Working   int    `json:"working"`
	Damaged   int    `json:"damaged"`
	Status    string `json:"status"`
}

type MessWasteLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Date      time.Time `gorm:"type:date" json:"date"`
	BlockName string    `json:"blockName"`
	Breakfast int       `json:"breakfast"`
	Lunch     int       `json:"lunch"`
	Dinner    int       `json:"dinner"`
	Total     int       `json:"total"`
}

type MessStaff struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	BlockName string `json:"blockName"`
	Name      string `json:"name"`
	Role      string `json:"role"`
	Shift     string `json:"shift"`
	Contact   string `json:"contact"`
}

type MessMenu struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	BlockName string `json:"blockName"`
	MonthYear string `json:"monthYear"`
	MenuJSON  string `json:"menuJSON" gorm:"type:text"`
}

// --- Handlers ---

func handleGetMessData(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var blocks []MessBlock
	DB.Find(&blocks)

	// Auto-fix: if there are blocks with empty names, delete them and re-seed
	var needsSeed bool
	for _, b := range blocks {
		if b.Name == "" {
			DB.Delete(&MessBlock{}, b.ID)
			needsSeed = true
		}
	}
	if needsSeed {
		seedMess()
		DB.Find(&blocks)
	}

	var equipment []MessEquipment
	DB.Find(&equipment)

	var wasteLogs []MessWasteLog
	DB.Find(&wasteLogs)

	var staff []MessStaff
	DB.Find(&staff)

	var menus []MessMenu
	DB.Find(&menus)

	response := map[string]interface{}{
		"blocks":    blocks,
		"equipment": equipment,
		"wasteLogs": wasteLogs,
		"staff":     staff,
		"menus":     menus,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleAddMessWaste(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Date      string `json:"date"`
		BlockName string `json:"blockName"`
		Breakfast int    `json:"breakfast"`
		Lunch     int    `json:"lunch"`
		Dinner    int    `json:"dinner"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		http.Error(w, "Invalid date format. Expected YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	// Calculate total
	total := req.Breakfast + req.Lunch + req.Dinner

	log := MessWasteLog{
		Date:      parsedDate,
		BlockName: req.BlockName,
		Breakfast: req.Breakfast,
		Lunch:     req.Lunch,
		Dinner:    req.Dinner,
		Total:     total,
	}

	if err := DB.Create(&log).Error; err != nil {
		http.Error(w, "Failed to save waste log", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Waste log added successfully"})
}

func handleAddMessStaff(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req MessStaff
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := DB.Create(&req).Error; err != nil {
		http.Error(w, "Failed to save staff", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Staff added successfully"})
}

func handleAddMessEquipment(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req MessEquipment
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := DB.Create(&req).Error; err != nil {
		http.Error(w, "Failed to save equipment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Equipment added successfully"})
}

func handleAddMessMenu(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req MessMenu
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Delete existing menu for this block and monthYear to replace it
	DB.Where("block_name = ? AND month_year = ?", req.BlockName, req.MonthYear).Delete(&MessMenu{})

	if err := DB.Create(&req).Error; err != nil {
		http.Error(w, "Failed to save menu", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Menu saved successfully"})
}

func handleAddMessMenuPDF(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	err := r.ParseMultipartForm(10 << 20) // 10MB limit
	if err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	blockName := r.FormValue("blockName")
	monthYear := r.FormValue("monthYear")
	if blockName == "" || monthYear == "" {
		http.Error(w, "blockName and monthYear are required", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("menuPdf")
	if err != nil {
		http.Error(w, "menuPdf file is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Create temp file
	tempFile, err := os.CreateTemp("", "menu-*.pdf")
	if err != nil {
		http.Error(w, "Failed to create temp file", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile.Name())

	_, err = io.Copy(tempFile, file)
	if err != nil {
		http.Error(w, "Failed to save temp file", http.StatusInternalServerError)
		return
	}
	tempFile.Close()

	// Run python script
	cmd := exec.Command("python", "parse_pdf.py", tempFile.Name())
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err = cmd.Run()
	if err != nil {
		http.Error(w, "Failed to parse PDF: "+stderr.String()+" | Output: "+out.String(), http.StatusInternalServerError)
		return
	}

	output := out.String()
	// Output should be a JSON array of menus or an error object
	var parsedMenus []interface{}
	if err := json.Unmarshal([]byte(output), &parsedMenus); err != nil {
		// Maybe it returned an error object
		var errObj map[string]string
		if err2 := json.Unmarshal([]byte(output), &errObj); err2 == nil && errObj["error"] != "" {
			http.Error(w, "Python Error: "+errObj["error"], http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to parse python output: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Save to DB
	menuJSON, _ := json.Marshal(parsedMenus)
	req := MessMenu{
		BlockName: blockName,
		MonthYear: monthYear,
		MenuJSON:  string(menuJSON),
	}

	DB.Where("block_name = ? AND month_year = ?", req.BlockName, req.MonthYear).Delete(&MessMenu{})

	if err := DB.Create(&req).Error; err != nil {
		http.Error(w, "Failed to save menu to database", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "PDF Menu parsed and saved successfully"})
}

// Seed Initial Mess Data if empty
func seedMess() {
	var count int64
	DB.Model(&MessBlock{}).Count(&count)
	if count == 0 {
		blocks := []MessBlock{
			{Name: "Boys Day Scholar", Capacity: 250, Occupied: 220, Gender: "boys"},
			{Name: "Boys Hostel", Capacity: 400, Occupied: 385, Gender: "boys"},
			{Name: "Girls", Capacity: 180, Occupied: 165, Gender: "girls"},
		}
		DB.Create(&blocks)

		equipment := []MessEquipment{
			{BlockName: "Boys Hostel", Name: "Grinder", Total: 6, Working: 6, Damaged: 0, Status: "Working"},
			{BlockName: "Boys Hostel", Name: "Fridge", Total: 4, Working: 3, Damaged: 1, Status: "Partial Working"},
			{BlockName: "Boys Hostel", Name: "Oven", Total: 2, Working: 2, Damaged: 0, Status: "Working"},
			{BlockName: "Girls", Name: "Grinder", Total: 3, Working: 3, Damaged: 0, Status: "Working"},
			{BlockName: "Girls", Name: "Fridge", Total: 3, Working: 2, Damaged: 1, Status: "Partial Working"},
			{BlockName: "Boys Day Scholar", Name: "Grinder", Total: 4, Working: 3, Damaged: 1, Status: "Partial Working"},
		}
		DB.Create(&equipment)
	}
}
