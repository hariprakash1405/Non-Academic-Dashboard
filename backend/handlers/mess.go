package handlers

import (
	"backend/models"
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"os/exec"
	"time"
)

// ocrSemaphore limits concurrent Python OCR jobs to prevent CPU/RAM exhaustion
var ocrSemaphore = make(chan struct{}, 1)

func (h *APIHandler) HandleGetMessData(w http.ResponseWriter, r *http.Request) {
	MessCache.mu.Lock()
	MessCache.data = nil
	MessCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	MessCache.mu.RLock()
	if time.Since(MessCache.lastUpdate) < MessCache.ttl && MessCache.data != nil {
		MessCache.mu.RUnlock()
		w.Header().Set("Content-Type", "application/json")
		w.Write(MessCache.data)
		return
	}
	MessCache.mu.RUnlock()

	var blocks []models.MessBlock
	h.DB.Find(&blocks)

	var needsSeed bool
	if len(blocks) == 0 {
		needsSeed = true
	}
	for _, b := range blocks {
		if b.Name == "" {
			h.DB.Delete(&models.MessBlock{}, b.ID)
			needsSeed = true
		}
	}
	if needsSeed {
		h.SeedMess()
		h.DB.Find(&blocks)
	}

	var equipment []models.MessEquipment
	h.DB.Find(&equipment)

	var wasteLogs []models.MessWasteLog
	h.DB.Find(&wasteLogs)

	var staff []models.MessStaff
	h.DB.Find(&staff)

	var menus []models.MessMenu
	h.DB.Find(&menus)

	response := map[string]interface{}{
		"blocks":    blocks,
		"equipment": equipment,
		"wasteLogs": wasteLogs,
		"staff":     staff,
		"menus":     menus,
	}

	jsonData, err := json.Marshal(response)
	if err == nil {
		MessCache.mu.Lock()
		MessCache.data = jsonData
		MessCache.lastUpdate = time.Now()
		MessCache.mu.Unlock()
	}

	w.Header().Set("Content-Type", "application/json")
	if err == nil {
		w.Write(jsonData)
	} else {
		json.NewEncoder(w).Encode(response)
	}
}

func (h *APIHandler) HandleAddMessWaste(w http.ResponseWriter, r *http.Request) {
	MessCache.mu.Lock()
	MessCache.data = nil
	MessCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Date           string `json:"date"`
		BlockName      string `json:"blockName"`
		Breakfast      int    `json:"breakfast"`
		Lunch          int    `json:"lunch"`
		Dinner         int    `json:"dinner"`
		BreakfastCount int    `json:"breakfastCount"`
		LunchCount     int    `json:"lunchCount"`
		DinnerCount    int    `json:"dinnerCount"`
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

	total := req.Breakfast + req.Lunch + req.Dinner

	log := models.MessWasteLog{
		Date:           parsedDate,
		BlockName:      req.BlockName,
		Breakfast:      req.Breakfast,
		Lunch:          req.Lunch,
		Dinner:         req.Dinner,
		Total:          total,
		BreakfastCount: req.BreakfastCount,
		LunchCount:     req.LunchCount,
		DinnerCount:    req.DinnerCount,
	}

	if err := h.DB.Create(&log).Error; err != nil {
		http.Error(w, "Failed to save waste log", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Waste log added successfully"})
}

func (h *APIHandler) HandleAddMessStaff(w http.ResponseWriter, r *http.Request) {
	MessCache.mu.Lock()
	MessCache.data = nil
	MessCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req []models.MessStaff
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if len(req) > 0 {
		if err := h.DB.Create(&req).Error; err != nil {
			http.Error(w, "Failed to save staff", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Staff added successfully"})
}

func (h *APIHandler) HandleUpdateMessStaff(w http.ResponseWriter, r *http.Request) {
	MessCache.mu.Lock()
	MessCache.data = nil
	MessCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req models.MessStaff
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.DB.Save(&req).Error; err != nil {
		http.Error(w, "Failed to update staff", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Staff updated successfully"})
}

func (h *APIHandler) HandleDeleteMessStaff(w http.ResponseWriter, r *http.Request) {
	MessCache.mu.Lock()
	MessCache.data = nil
	MessCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID is required", http.StatusBadRequest)
		return
	}

	if err := h.DB.Delete(&models.MessStaff{}, id).Error; err != nil {
		http.Error(w, "Failed to delete staff", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Staff deleted successfully"})
}

func (h *APIHandler) HandleAddMessEquipment(w http.ResponseWriter, r *http.Request) {
	MessCache.mu.Lock()
	MessCache.data = nil
	MessCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req []models.MessEquipment
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if len(req) > 0 {
		if err := h.DB.Create(&req).Error; err != nil {
			http.Error(w, "Failed to save equipment", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Equipment added successfully"})
}

func (h *APIHandler) HandleUpdateMessEquipment(w http.ResponseWriter, r *http.Request) {
	MessCache.mu.Lock()
	MessCache.data = nil
	MessCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req models.MessEquipment
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.DB.Save(&req).Error; err != nil {
		http.Error(w, "Failed to update equipment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Equipment updated successfully"})
}

func (h *APIHandler) HandleDeleteMessEquipment(w http.ResponseWriter, r *http.Request) {
	MessCache.mu.Lock()
	MessCache.data = nil
	MessCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID is required", http.StatusBadRequest)
		return
	}

	if err := h.DB.Delete(&models.MessEquipment{}, id).Error; err != nil {
		http.Error(w, "Failed to delete equipment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Equipment deleted successfully"})
}

func (h *APIHandler) HandleAddMessMenu(w http.ResponseWriter, r *http.Request) {
	MessCache.mu.Lock()
	MessCache.data = nil
	MessCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req models.MessMenu
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.DB.Where("block_name = ? AND month_year = ?", req.BlockName, req.MonthYear).Delete(&models.MessMenu{})

	if err := h.DB.Create(&req).Error; err != nil {
		http.Error(w, "Failed to save menu", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Menu saved successfully"})
}

func (h *APIHandler) HandleAddMessMenuPDF(w http.ResponseWriter, r *http.Request) {
	MessCache.mu.Lock()
	MessCache.data = nil
	MessCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	err := r.ParseMultipartForm(10 << 20)
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

	tempFile, err := os.CreateTemp("", "menu-*.pdf")
	if err != nil {
		http.Error(w, "Failed to create temp file", http.StatusInternalServerError)
		return
	}

	_, err = io.Copy(tempFile, file)
	if err != nil {
		http.Error(w, "Failed to save temp file", http.StatusInternalServerError)
		return
	}
	tempFile.Close()

	go func(filePath, bName, mYear string) {
		defer os.Remove(filePath)

		// Acquire semaphore token to prevent server overload
		ocrSemaphore <- struct{}{}
		defer func() { <-ocrSemaphore }()

		cmd := exec.Command("python", "parse_pdf.py", filePath)
		var out bytes.Buffer
		cmd.Stdout = &out
		if err := cmd.Run(); err != nil {
			return
		}

		output := out.String()
		var parsedMenus []interface{}
		if err := json.Unmarshal([]byte(output), &parsedMenus); err != nil {
			return
		}

		menuJSON, _ := json.Marshal(parsedMenus)
		reqObj := models.MessMenu{
			BlockName: bName,
			MonthYear: mYear,
			MenuJSON:  string(menuJSON),
		}

		h.DB.Where("block_name = ? AND month_year = ?", reqObj.BlockName, reqObj.MonthYear).Delete(&models.MessMenu{})
		h.DB.Create(&reqObj)
	}(tempFile.Name(), blockName, monthYear)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{"message": "PDF Menu is being parsed in the background."})
}

// Seed Initial Mess Data if empty
func (h *APIHandler) SeedMess() {
	var count int64
	h.DB.Model(&models.MessBlock{}).Count(&count)
	if count == 0 {
		blocks := []models.MessBlock{
			{Name: "Boys Day Scholar", Capacity: 250, Occupied: 220, Gender: "boys"},
			{Name: "Boys Hostel", Capacity: 400, Occupied: 385, Gender: "boys"},
			{Name: "Girls", Capacity: 180, Occupied: 165, Gender: "girls"},
		}
		h.DB.Create(&blocks)

		equipment := []models.MessEquipment{
			{BlockName: "Boys Hostel", Name: "Grinder", Total: 6, Working: 6, Damaged: 0, Status: "Working"},
			{BlockName: "Boys Hostel", Name: "Fridge", Total: 4, Working: 3, Damaged: 1, Status: "Partial Working"},
			{BlockName: "Boys Hostel", Name: "Oven", Total: 2, Working: 2, Damaged: 0, Status: "Working"},
			{BlockName: "Girls", Name: "Grinder", Total: 3, Working: 3, Damaged: 0, Status: "Working"},
			{BlockName: "Girls", Name: "Fridge", Total: 3, Working: 2, Damaged: 1, Status: "Partial Working"},
			{BlockName: "Boys Day Scholar", Name: "Grinder", Total: 4, Working: 3, Damaged: 1, Status: "Partial Working"},
		}
		h.DB.Create(&equipment)
	}
}
