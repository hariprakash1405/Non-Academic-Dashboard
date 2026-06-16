package handlers

import (
	"backend/models"
	"encoding/json"
	"net/http"
	
	"time"
)

// --- Chiller Operating Log (BIT Chiller Units Table) ---
// Stores per-slot operating hours for 3 chiller units + 4 pumps
// Time slots: slot1=6AM-10AM, slot2=10AM-6PM, slot3=6PM-10PM, slot4=10PM-6AM

func (h *APIHandler) AddChillerOperatingLog(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

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

	var payload struct {
		Date              string  `json:"date"`
		ChillerWaterIn    float64 `json:"chillerWaterIn"`
		ChillerWaterOut   float64 `json:"chillerWaterOut"`
		CondenserWaterIn  float64 `json:"condenserWaterIn"`
		CondenserWaterOut float64 `json:"condenserWaterOut"`
		RatePeak          float64 `json:"ratePeak"`
		RateOffPeak       float64 `json:"rateOffPeak"`
		RateNight         float64 `json:"rateNight"`

		Unit1Slot1 float64 `json:"unit1Slot1"`
		Unit1Slot2 float64 `json:"unit1Slot2"`
		Unit1Slot3 float64 `json:"unit1Slot3"`
		Unit1Slot4 float64 `json:"unit1Slot4"`
		Unit2Slot1 float64 `json:"unit2Slot1"`
		Unit2Slot2 float64 `json:"unit2Slot2"`
		Unit2Slot3 float64 `json:"unit2Slot3"`
		Unit2Slot4 float64 `json:"unit2Slot4"`
		Unit3Slot1 float64 `json:"unit3Slot1"`
		Unit3Slot2 float64 `json:"unit3Slot2"`
		Unit3Slot3 float64 `json:"unit3Slot3"`
		Unit3Slot4 float64 `json:"unit3Slot4"`

		Pump1Slot1 float64 `json:"pump1Slot1"`
		Pump1Slot2 float64 `json:"pump1Slot2"`
		Pump1Slot3 float64 `json:"pump1Slot3"`
		Pump1Slot4 float64 `json:"pump1Slot4"`
		Pump2Slot1 float64 `json:"pump2Slot1"`
		Pump2Slot2 float64 `json:"pump2Slot2"`
		Pump2Slot3 float64 `json:"pump2Slot3"`
		Pump2Slot4 float64 `json:"pump2Slot4"`
		Pump3Slot1 float64 `json:"pump3Slot1"`
		Pump3Slot2 float64 `json:"pump3Slot2"`
		Pump3Slot3 float64 `json:pump3Slot3"`
		Pump3Slot4 float64 `json:"pump3Slot4"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 1. Create/Update models.ChillerOperatingLog
	var opLog models.ChillerOperatingLog
	opLog.Date = payload.Date
	opLog.Unit1Slot1 = payload.Unit1Slot1
	opLog.Unit1Slot2 = payload.Unit1Slot2
	opLog.Unit1Slot3 = payload.Unit1Slot3
	opLog.Unit1Slot4 = payload.Unit1Slot4
	opLog.Unit2Slot1 = payload.Unit2Slot1
	opLog.Unit2Slot2 = payload.Unit2Slot2
	opLog.Unit2Slot3 = payload.Unit2Slot3
	opLog.Unit2Slot4 = payload.Unit2Slot4
	opLog.Unit3Slot1 = payload.Unit3Slot1
	opLog.Unit3Slot2 = payload.Unit3Slot2
	opLog.Unit3Slot3 = payload.Unit3Slot3
	opLog.Unit3Slot4 = payload.Unit3Slot4
	opLog.Pump1Slot1 = payload.Pump1Slot1
	opLog.Pump1Slot2 = payload.Pump1Slot2
	opLog.Pump1Slot3 = payload.Pump1Slot3
	opLog.Pump1Slot4 = payload.Pump1Slot4
	opLog.Pump2Slot1 = payload.Pump2Slot1
	opLog.Pump2Slot2 = payload.Pump2Slot2
	opLog.Pump2Slot3 = payload.Pump2Slot3
	opLog.Pump2Slot4 = payload.Pump2Slot4
	opLog.Pump3Slot1 = payload.Pump3Slot1
	opLog.Pump3Slot2 = payload.Pump3Slot2
	opLog.Pump3Slot3 = payload.Pump3Slot3
	opLog.Pump3Slot4 = payload.Pump3Slot4

	opLog.ChillerPeakHours = opLog.Unit1Slot1 + opLog.Unit2Slot1 + opLog.Unit3Slot1
	opLog.ChillerNonPeakHours = (opLog.Unit1Slot2 + opLog.Unit1Slot3) + (opLog.Unit2Slot2 + opLog.Unit2Slot3) + (opLog.Unit3Slot2 + opLog.Unit3Slot3)
	opLog.ChillerNightHours = opLog.Unit1Slot4 + opLog.Unit2Slot4 + opLog.Unit3Slot4

	opLog.PumpPeakHours = opLog.Pump1Slot1 + opLog.Pump2Slot1 + opLog.Pump3Slot1
	opLog.PumpNonPeakHours = (opLog.Pump1Slot2 + opLog.Pump1Slot3) + (opLog.Pump2Slot2 + opLog.Pump2Slot3) + (opLog.Pump3Slot2 + opLog.Pump3Slot3)
	opLog.PumpNightHours = opLog.Pump1Slot4 + opLog.Pump2Slot4 + opLog.Pump3Slot4

	var existingOp []models.ChillerOperatingLog
	h.DB.Where("date = ?", opLog.Date).Limit(1).Find(&existingOp)
	if len(existingOp) > 0 {
		opLog.ID = existingOp[0].ID
		h.DB.Save(&opLog)
	} else {
		h.DB.Create(&opLog)
	}

	// 2. Create/Update models.ChillerLog (For charts)
	totalChillerHrs := opLog.ChillerPeakHours + opLog.ChillerNonPeakHours + opLog.ChillerNightHours
	totalPumpHrs := opLog.PumpPeakHours + opLog.PumpNonPeakHours + opLog.PumpNightHours
	// Estimated power: Chiller=185kW, Pump=18.65kW
	energyConsumed := (totalChillerHrs * 185) + (totalPumpHrs * 18.65)

	// Rough cooling load calculation (placeholder)
	coolingLoad := totalChillerHrs * 400

	var cLog models.ChillerLog
	cLog.Date = payload.Date
	cLog.ChilledIn = payload.ChillerWaterIn
	cLog.ChilledOut = payload.ChillerWaterOut
	cLog.CondenserIn = payload.CondenserWaterIn
	cLog.CondenserOut = payload.CondenserWaterOut
	cLog.DaysOperated = 1
	cLog.RunHours = totalChillerHrs
	cLog.CoolingLoad = coolingLoad
	cLog.EnergyConsumed = energyConsumed
	if coolingLoad > 0 {
		cLog.ConsLoad = energyConsumed / coolingLoad
	}
	if totalChillerHrs > 0 {
		cLog.ConsHr = energyConsumed / totalChillerHrs
	}
	if energyConsumed > 0 {
		cLog.COP = (coolingLoad * 3.51685) / energyConsumed
	}

	var existingLog []models.ChillerLog
	h.DB.Where("date = ?", cLog.Date).Limit(1).Find(&existingLog)
	if len(existingLog) > 0 {
		cLog.ID = existingLog[0].ID
		h.DB.Save(&cLog)
	} else {
		h.DB.Create(&cLog)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(opLog)
}

func (h *APIHandler) GetChillerOperatingLogs(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var logs []models.ChillerOperatingLog
	h.DB.Order("date desc").Limit(30).Find(&logs)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (h *APIHandler) GetBreakdowns(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	var b []models.ChillerBreakdown
	h.DB.Order("date desc").Find(&b)
	json.NewEncoder(w).Encode(b)
}

func (h *APIHandler) AddBreakdowns(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	var input []models.ChillerBreakdown
	json.NewDecoder(r.Body).Decode(&input)
	for _, unit := range input {
		h.DB.Create(&unit)
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) UpdateBreakdown(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	var input models.ChillerBreakdown
	json.NewDecoder(r.Body).Decode(&input)
	h.DB.Save(&input)
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) DeleteBreakdown(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	id := r.URL.Query().Get("id")
	h.DB.Delete(&models.ChillerBreakdown{}, id)
	w.WriteHeader(http.StatusOK)
}

// --- Models ---

func (h *APIHandler) Chiller() {
	var count int64
	h.DB.Model(&models.ChillerEquipment{}).Count(&count)

	// (JSON seeding logic removed as requested)

	// Seed Equipment
	equipments := []models.ChillerEquipment{
		{Name: "DAIKIN / McQuay Unit-I", Model: "McQuay / PFS3252DARY", Capacity: "306 TR", Type: "Water-Cooled Screw Chiller", Status: "Running", Load: "78%", TempIn: "12.2°C", TempOut: "7.1°C", Refrigerant: "R134a", LastService: "2026-01-25", NextService: "2026-07-25", Health: 98},
		{Name: "DAIKIN / McQuay Unit-II", Model: "McQuay / PFS3252DARY", Capacity: "306 TR", Type: "Water-Cooled Screw Chiller", Status: "Standby", Load: "0%", TempIn: "-", TempOut: "-", Refrigerant: "R134a", LastService: "2026-01-25", NextService: "2026-07-25", Health: 95},
		{Name: "DUNHAM-BUSH Unit-III", Model: "WCFX 46TR AU 5ARJ5B", Capacity: "400 TR", Type: "Water-Cooled Screw Chiller", Status: "Running", Load: "65%", TempIn: "11.8°C", TempOut: "7.0°C", Refrigerant: "R134a", LastService: "2026-01-25", NextService: "2026-07-25", Health: 96},
		{Name: "Primary Pump CHW-01", Model: "-", Capacity: "22 kW", Type: "Chilled Water Pump", Status: "Active", Load: "-", TempIn: "-", TempOut: "-", Refrigerant: "-", LastService: "2026-02-15", NextService: "2026-08-10", Health: 92},
		{Name: "Condenser Pump CW-01", Model: "-", Capacity: "18.5 kW", Type: "Condenser Water Pump", Status: "Active", Load: "-", TempIn: "-", TempOut: "-", Refrigerant: "-", LastService: "2026-03-01", NextService: "2026-09-01", Health: 94},
	}
	if count == 0 {
		h.DB.Create(&equipments)
	}
	// Seed Staff
	staffs := []models.ChillerStaff{
		{Name: "Selvakumar R", Role: "Senior A/C Mechanic", Shift: "General Shift", Attendance: "Present", Contact: "6383458394", DateJoined: "07/01/2012"},
		{Name: "Ranganathan R", Role: "Electrician", Shift: "Morning Shift", Attendance: "Present", Contact: "N/A", DateJoined: "N/A"},
		{Name: "Karan M", Role: "Chiller Plant Operator", Shift: "Evening Shift", Attendance: "Present", Contact: "6381198991", DateJoined: "02/04/2024"},
		{Name: "Vignesh R", Role: "Chiller Plant Operator", Shift: "Night Shift", Attendance: "Present", Contact: "744827303", DateJoined: "13/04/2026"},
	}
	var staffCount int64
	h.DB.Model(&models.ChillerStaff{}).Count(&staffCount)
	if staffCount == 0 {
		h.DB.Create(&staffs)
	}
	// (Seeding dummy logs removed so the DB only uses real user data)
	// Seed Billing Params
	billingParam := models.ChillerBillingParam{
		RateOffPeak:           10.41,
		RatePeak:              12.58,
		RateNight:             10.00,
		DailyOperHours:        7.5,
		PeakHours:             1.5,
		AvgCoolingLoadTr:      1000,
		Chiller1Active:        true,
		Chiller2Active:        true,
		Chiller3Active:        true,
		PumpCondensePower:     74,
		PumpChilledPower:      88,
		PumpCoolingTowerPower: 22,
	}
	var bpCount int64
	h.DB.Model(&models.ChillerBillingParam{}).Count(&bpCount)
	if bpCount == 0 {
		h.DB.Create(&billingParam)
	}
}

// --- Handlers ---

func (h *APIHandler) GetChiller(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	// 1. Check if we have valid, unexpired cache
	ChillerCache.mu.RLock()
	if time.Since(ChillerCache.lastUpdate) < ChillerCache.ttl && ChillerCache.data != nil {
		ChillerCache.mu.RUnlock()
		w.Header().Set("Content-Type", "application/json")
		w.Write(ChillerCache.data)
		return
	}
	ChillerCache.mu.RUnlock()

	var logs []models.ChillerLog
	h.DB.Order("date desc").Find(&logs)

	var equipments []models.ChillerEquipment
	h.DB.Order("id asc").Find(&equipments)

	var staff []models.ChillerStaff
	h.DB.Order("id asc").Find(&staff)

	var billingParams models.ChillerBillingParam
	if err := h.DB.First(&billingParams).Error; err != nil {
		billingParams = models.ChillerBillingParam{
			RateOffPeak:           10.41,
			RatePeak:              12.58,
			RateNight:             10.00,
			DailyOperHours:        7.5,
			PeakHours:             1.5,
			AvgCoolingLoadTr:      1000,
			Chiller1Active:        true,
			Chiller2Active:        true,
			Chiller3Active:        true,
			PumpCondensePower:     74,
			PumpChilledPower:      88,
			PumpCoolingTowerPower: 22,
		}
		h.DB.Create(&billingParams)
	}

	response := map[string]interface{}{
		"logs":          logs,
		"equipments":    equipments,
		"staff":         staff,
		"billingParams": billingParams,
	}

	jsonData, err := json.Marshal(response)
	if err == nil {
		// Update cache
		ChillerCache.mu.Lock()
		ChillerCache.data = jsonData
		ChillerCache.lastUpdate = time.Now()
		ChillerCache.mu.Unlock()
	}

	w.Header().Set("Content-Type", "application/json")
	if err == nil {
		w.Write(jsonData)
	} else {
		json.NewEncoder(w).Encode(response)
	}
}

func (h *APIHandler) AddChillerLog(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

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

	var input models.ChillerLog
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Automatic Calculations
	if input.CoolingLoad > 0 {
		input.ConsLoad = input.EnergyConsumed / input.CoolingLoad
	} else {
		input.ConsLoad = 0
	}

	if input.RunHours > 0 {
		input.ConsHr = input.EnergyConsumed / input.RunHours
	} else {
		input.ConsHr = 0
	}

	if input.EnergyConsumed > 0 {
		input.COP = (input.CoolingLoad * 3.51685) / input.EnergyConsumed
	} else {
		input.COP = 0
	}

	var existing []models.ChillerLog
	h.DB.Where("date = ?", input.Date).Limit(1).Find(&existing)
	if len(existing) > 0 {
		input.ID = existing[0].ID
		h.DB.Save(&input)
	} else {
		h.DB.Create(&input)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(input)
}

func (h *APIHandler) UpdateChillerBilling(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

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

	var input models.ChillerBillingParam
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var existing []models.ChillerBillingParam
	h.DB.Limit(1).Find(&existing)
	if len(existing) > 0 {
		input.ID = existing[0].ID
		h.DB.Save(&input)
	} else {
		h.DB.Create(&input)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(input)
}

// -- GET, POST, DELETE Handlers for Equipments --
func (h *APIHandler) GetChillerEquipment(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	var units []models.ChillerEquipment
	h.DB.Find(&units)
	json.NewEncoder(w).Encode(units)
}
func (h *APIHandler) AddChillerEquipment(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	var input []models.ChillerEquipment
	json.NewDecoder(r.Body).Decode(&input)
	for _, unit := range input {
		h.DB.Create(&unit)
	}
	w.WriteHeader(http.StatusOK)
}
func (h *APIHandler) DeleteChillerEquipment(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	id := r.URL.Query().Get("id")
	h.DB.Delete(&models.ChillerEquipment{}, id)
	w.WriteHeader(http.StatusOK)
}

// -- GET, POST, DELETE Handlers for Staff --
func (h *APIHandler) GetChillerStaff(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	var units []models.ChillerStaff
	h.DB.Find(&units)
	json.NewEncoder(w).Encode(units)
}
func (h *APIHandler) AddChillerStaff(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	var input []models.ChillerStaff
	json.NewDecoder(r.Body).Decode(&input)
	for _, unit := range input {
		h.DB.Create(&unit)
	}
	w.WriteHeader(http.StatusOK)
}
func (h *APIHandler) DeleteChillerStaff(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	id := r.URL.Query().Get("id")
	h.DB.Delete(&models.ChillerStaff{}, id)
	w.WriteHeader(http.StatusOK)
}

// -- Handlers for Plant Specifications --
func (h *APIHandler) GetPlantSpecs(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	var units []models.ChillerPlantSpecification
	h.DB.Find(&units)
	json.NewEncoder(w).Encode(units)
}
func (h *APIHandler) AddPlantSpecs(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	var input []models.ChillerPlantSpecification
	json.NewDecoder(r.Body).Decode(&input)
	for _, unit := range input {
		h.DB.Create(&unit)
	}
	w.WriteHeader(http.StatusOK)
}
func (h *APIHandler) UpdatePlantSpec(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	var input models.ChillerPlantSpecification
	json.NewDecoder(r.Body).Decode(&input)
	h.DB.Save(&input)
	w.WriteHeader(http.StatusOK)
}
func (h *APIHandler) DeletePlantSpec(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	id := r.URL.Query().Get("id")
	h.DB.Delete(&models.ChillerPlantSpecification{}, id)
	w.WriteHeader(http.StatusOK)
}

// -- Handlers for Unit Specifications --
func (h *APIHandler) GetUnitSpecs(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	var units []models.ChillerUnitSpecification
	h.DB.Find(&units)
	json.NewEncoder(w).Encode(units)
}
func (h *APIHandler) AddUnitSpecs(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	var input []models.ChillerUnitSpecification
	json.NewDecoder(r.Body).Decode(&input)
	for _, unit := range input {
		h.DB.Create(&unit)
	}
	w.WriteHeader(http.StatusOK)
}
func (h *APIHandler) UpdateUnitSpec(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	var input models.ChillerUnitSpecification
	json.NewDecoder(r.Body).Decode(&input)
	h.DB.Save(&input)
	w.WriteHeader(http.StatusOK)
}
func (h *APIHandler) DeleteUnitSpec(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	id := r.URL.Query().Get("id")
	h.DB.Delete(&models.ChillerUnitSpecification{}, id)
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) UpdateChillerEquipment(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

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

	var input models.ChillerEquipment
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.DB.Save(&input)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(input)
}

func (h *APIHandler) UpdateChillerStaff(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

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

	var input models.ChillerStaff
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.DB.Save(&input)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(input)
}

func (h *APIHandler) GetAhuUnits(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var units []models.AhuUnit
	h.DB.Order("id asc").Find(&units)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(units)
}

func (h *APIHandler) AddAhuUnits(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

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

	var newUnits []models.AhuUnit
	if err := json.NewDecoder(r.Body).Decode(&newUnits); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if len(newUnits) > 0 {
		h.DB.Create(&newUnits)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(newUnits)
}

func (h *APIHandler) UpdateAhuUnit(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "PUT" && r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var input models.AhuUnit
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.ID == 0 {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}

	h.DB.Save(&input)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(input)
}

func (h *APIHandler) DeleteAhuUnit(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}

	h.DB.Delete(&models.AhuUnit{}, idStr)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success":true}`))
}

func (h *APIHandler) GetSplitAc(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var units []models.SplitAcUnit
	h.DB.Order("id").Find(&units)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(units)
}

func (h *APIHandler) AddSplitAc(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

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

	var newUnits []models.SplitAcUnit
	if err := json.NewDecoder(r.Body).Decode(&newUnits); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if len(newUnits) > 0 {
		h.DB.Create(&newUnits)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(newUnits)
}

func (h *APIHandler) UpdateSplitAc(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "PUT" && r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var input models.SplitAcUnit
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.ID == 0 {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}

	h.DB.Save(&input)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(input)
}

func (h *APIHandler) DeleteSplitAc(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}

	h.DB.Delete(&models.SplitAcUnit{}, idStr)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success":true}`))
}

// --- VRV Units API ---
func (h *APIHandler) GetVrv(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	var units []models.VrvUnit
	h.DB.Order("s_no asc").Find(&units)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(units)
}

func (h *APIHandler) AddVrv(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var newUnits []models.VrvUnit
	if err := json.NewDecoder(r.Body).Decode(&newUnits); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	h.DB.Create(&newUnits)
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) UpdateVrv(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var input models.VrvUnit
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	h.DB.Save(&input)
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) DeleteVrv(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	idStr := r.URL.Query().Get("id")
	h.DB.Delete(&models.VrvUnit{}, idStr)
	w.WriteHeader(http.StatusOK)
}

// --- Cold Room Units API ---
func (h *APIHandler) GetColdRoom(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	var units []models.ColdRoomUnit
	h.DB.Order("s_no asc").Find(&units)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(units)
}

func (h *APIHandler) AddColdRoom(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var newUnits []models.ColdRoomUnit
	if err := json.NewDecoder(r.Body).Decode(&newUnits); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	h.DB.Create(&newUnits)
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) UpdateColdRoom(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var input models.ColdRoomUnit
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	h.DB.Save(&input)
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) DeleteColdRoom(w http.ResponseWriter, r *http.Request) {
	ChillerCache.mu.Lock()
	ChillerCache.data = nil
	ChillerCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	idStr := r.URL.Query().Get("id")
	h.DB.Delete(&models.ColdRoomUnit{}, idStr)
	w.WriteHeader(http.StatusOK)
}
