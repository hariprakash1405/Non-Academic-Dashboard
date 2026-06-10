package main

import (
	"encoding/json"
	"net/http"
)

// --- Chiller Operating Log (BIT Chiller Units Table) ---
// Stores per-slot operating hours for 3 chiller units + 4 pumps
// Time slots: slot1=6AM-10AM, slot2=10AM-6PM, slot3=6PM-10PM, slot4=10PM-6AM

type ChillerOperatingLog struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Date string `gorm:"uniqueIndex" json:"date"`

	// DAIKIN Unit-I (185 KW) - Operating Hours per slot
	Unit1Slot1 float64 `json:"unit1Slot1"` // 6AM-10AM
	Unit1Slot2 float64 `json:"unit1Slot2"` // 10AM-6PM
	Unit1Slot3 float64 `json:"unit1Slot3"` // 6PM-10PM
	Unit1Slot4 float64 `json:"unit1Slot4"` // 10PM-6AM

	// DAIKIN Unit-II (185 KW) - Operating Hours per slot
	Unit2Slot1 float64 `json:"unit2Slot1"`
	Unit2Slot2 float64 `json:"unit2Slot2"`
	Unit2Slot3 float64 `json:"unit2Slot3"`
	Unit2Slot4 float64 `json:"unit2Slot4"`

	// DUNHAM-BUSH Unit-III (240 KW) - Operating Hours per slot
	Unit3Slot1 float64 `json:"unit3Slot1"`
	Unit3Slot2 float64 `json:"unit3Slot2"`
	Unit3Slot3 float64 `json:"unit3Slot3"`
	Unit3Slot4 float64 `json:"unit3Slot4"`

	// Chiller Peak/Non-Peak/Night Hour Totals
	ChillerPeakHours    float64 `json:"chillerPeakHours"`
	ChillerNonPeakHours float64 `json:"chillerNonPeakHours"`
	ChillerNightHours   float64 `json:"chillerNightHours"`

	// Pump Unit-I (18.65 kW) - Operating Hours per slot
	Pump1Slot1 float64 `json:"pump1Slot1"`
	Pump1Slot2 float64 `json:"pump1Slot2"`
	Pump1Slot3 float64 `json:"pump1Slot3"`
	Pump1Slot4 float64 `json:"pump1Slot4"`

	// Pump Unit-II (18.65 kW) - Operating Hours per slot
	Pump2Slot1 float64 `json:"pump2Slot1"`
	Pump2Slot2 float64 `json:"pump2Slot2"`
	Pump2Slot3 float64 `json:"pump2Slot3"`
	Pump2Slot4 float64 `json:"pump2Slot4"`

	// Pump Unit-III (18.5 kW) - Operating Hours per slot
	Pump3Slot1 float64 `json:"pump3Slot1"`
	Pump3Slot2 float64 `json:"pump3Slot2"`
	Pump3Slot3 float64 `json:"pump3Slot3"`
	Pump3Slot4 float64 `json:"pump3Slot4"`

	// Pump Unit-IV (18.65 kW) - Operating Hours per slot
	Pump4Slot1 float64 `json:"pump4Slot1"`
	Pump4Slot2 float64 `json:"pump4Slot2"`
	Pump4Slot3 float64 `json:"pump4Slot3"`
	Pump4Slot4 float64 `json:"pump4Slot4"`

	// Pump Peak/Non-Peak/Night Hour Totals
	PumpPeakHours    float64 `json:"pumpPeakHours"`
	PumpNonPeakHours float64 `json:"pumpNonPeakHours"`
	PumpNightHours   float64 `json:"pumpNightHours"`
}

func handleAddChillerOperatingLog(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var payload struct {
		Date string `json:"date"`
		ChillerWaterIn float64 `json:"chillerWaterIn"`
		ChillerWaterOut float64 `json:"chillerWaterOut"`
		CondenserWaterIn float64 `json:"condenserWaterIn"`
		CondenserWaterOut float64 `json:"condenserWaterOut"`
		RatePeak float64 `json:"ratePeak"`
		RateOffPeak float64 `json:"rateOffPeak"`
		RateNight float64 `json:"rateNight"`
		
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

	// 1. Create/Update ChillerOperatingLog
	var opLog ChillerOperatingLog
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

	var existingOp []ChillerOperatingLog
	DB.Where("date = ?", opLog.Date).Limit(1).Find(&existingOp)
	if len(existingOp) > 0 {
		opLog.ID = existingOp[0].ID
		DB.Save(&opLog)
	} else {
		DB.Create(&opLog)
	}

	// 2. Create/Update ChillerLog (For charts)
	totalChillerHrs := opLog.ChillerPeakHours + opLog.ChillerNonPeakHours + opLog.ChillerNightHours
	totalPumpHrs := opLog.PumpPeakHours + opLog.PumpNonPeakHours + opLog.PumpNightHours
	// Estimated power: Chiller=185kW, Pump=18.65kW
	energyConsumed := (totalChillerHrs * 185) + (totalPumpHrs * 18.65)
	
	// Rough cooling load calculation (placeholder)
	coolingLoad := totalChillerHrs * 400 

	var cLog ChillerLog
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

	var existingLog []ChillerLog
	DB.Where("date = ?", cLog.Date).Limit(1).Find(&existingLog)
	if len(existingLog) > 0 {
		cLog.ID = existingLog[0].ID
		DB.Save(&cLog)
	} else {
		DB.Create(&cLog)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(opLog)
}

func handleGetChillerOperatingLogs(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var logs []ChillerOperatingLog
	DB.Order("date desc").Limit(30).Find(&logs)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func handleGetBreakdowns(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	var b []ChillerBreakdown
	DB.Order("date desc").Find(&b)
	json.NewEncoder(w).Encode(b)
}

func handleAddBreakdowns(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	var input []ChillerBreakdown
	json.NewDecoder(r.Body).Decode(&input)
	for _, unit := range input {
		DB.Create(&unit)
	}
	w.WriteHeader(http.StatusOK)
}

func handleUpdateBreakdown(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	var input ChillerBreakdown
	json.NewDecoder(r.Body).Decode(&input)
	DB.Save(&input)
	w.WriteHeader(http.StatusOK)
}

func handleDeleteBreakdown(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	id := r.URL.Query().Get("id")
	DB.Delete(&ChillerBreakdown{}, id)
	w.WriteHeader(http.StatusOK)
}

// --- Models ---

type ChillerLog struct {
	ID               uint    `gorm:"primaryKey" json:"id"`
	Date             string  `gorm:"uniqueIndex" json:"date"`
	ChilledIn        float64 `json:"chilledIn"`
	ChilledOut       float64 `json:"chilledOut"`
	CondenserIn      float64 `json:"condenserIn"`
	CondenserOut     float64 `json:"condenserOut"`
	DaysOperated     int     `json:"daysOperated"`
	RunHours         float64 `json:"runHours"`
	CoolingLoad      float64 `json:"coolingLoad"`
	EnergyConsumed   float64 `json:"energyConsumed"`
	RefrigerantLevel float64 `json:"refrigerantLevel"`
	ConsLoad         float64 `json:"consLoad"`
	ConsHr           float64 `json:"consHr"`
	COP              float64 `json:"cop"`
}

type AhuUnit struct {
	ID       uint    `gorm:"primaryKey" json:"id"`
	SNo      int     `json:"sNo,omitempty"`
	Block    string  `json:"block,omitempty"`
	Floor    string  `json:"floor,omitempty"`
	Loc      string  `json:"loc,omitempty"`
	Type     string  `json:"type,omitempty"`
	Cap      float64 `json:"cap,omitempty"`
	Qty      int     `json:"qty,omitempty"`
	TotCap   float64 `json:"totCap,omitempty"`
	Hp       float64 `json:"hp,omitempty"`
	TotHp    float64 `json:"totHp,omitempty"`
	Area     float64 `json:"area,omitempty"`
	SubTotal string  `json:"subTotal,omitempty"`
}

type SplitAcUnit struct {
	ID     uint    `gorm:"primaryKey" json:"id"`
	SNo    int     `json:"sno,omitempty"`
	Make   string  `json:"make,omitempty"`
	Ton    float64 `json:"ton,omitempty"`
	Model  string  `json:"model,omitempty"`
	Block  string  `json:"block,omitempty"`
	Dept   string  `json:"dept,omitempty"`
	Qty    int     `json:"qty,omitempty"`
	TotTon float64 `json:"totTon,omitempty"`
	Loc    string  `json:"loc,omitempty"`
}

type VrvUnit struct {
	ID     uint    `gorm:"primaryKey" json:"id"`
	SNo    int     `json:"sno,omitempty"`
	Make   string  `json:"make,omitempty"`
	Ton    float64 `json:"ton,omitempty"`
	Model  string  `json:"model,omitempty"`
	Block  string  `json:"block,omitempty"`
	Dept   string  `json:"dept,omitempty"`
	Qty    int     `json:"qty,omitempty"`
	TotTon float64 `json:"totTon,omitempty"`
	Loc    string  `json:"loc,omitempty"`
	Notes  string  `json:"notes,omitempty"`
}

type ChillerBreakdown struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	Date       string `json:"date,omitempty"`
	Equipment  string `json:"equipment,omitempty"`
	Issue      string `json:"issue,omitempty"`
	Resolution string `json:"resolution,omitempty"`
	Status     string `json:"status,omitempty"`
}

type ColdRoomUnit struct {
	ID     uint    `gorm:"primaryKey" json:"id"`
	SNo    int     `json:"sno,omitempty"`
	Make   string  `json:"make,omitempty"`
	Ton    float64 `json:"ton,omitempty"`
	Model  string  `json:"model,omitempty"`
	Block  string  `json:"block,omitempty"`
	Dept   string  `json:"dept,omitempty"`
	Qty    int     `json:"qty,omitempty"`
	TotTon float64 `json:"totTon,omitempty"`
	Loc    string  `json:"loc,omitempty"`
}

type ChillerEquipment struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `json:"name"`
	Model       string `json:"model"`
	Capacity    string `json:"capacity"`
	Type        string `json:"type"`
	Status      string `json:"status"`
	Load        string `json:"load"`
	TempIn      string `json:"tempIn"`
	TempOut     string `json:"tempOut"`
	Refrigerant string `json:"refrigerant"`
	LastService string `json:"lastService"`
	NextService string `json:"nextService"`
	Health      int    `json:"health"`
}

type ChillerStaff struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	Name       string `json:"name"`
	Role       string `json:"role"`
	Shift      string `json:"shift"`
	Attendance string `json:"attendance"`
	Contact    string `json:"contact"`
	DateJoined string `json:"dateJoined"`
}


type ChillerPlantSpecification struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Parameter string `json:"parameter"`
	Value     string `json:"value"`
	Unit      string `json:"unit"`
	Remarks   string `json:"remarks"`
}

type ChillerUnitSpecification struct {
	ID    uint   `gorm:"primaryKey" json:"id"`
	Param string `json:"param"`
	Unit1 string `json:"unit1"`
	Unit2 string `json:"unit2"`
	Unit3 string `json:"unit3"`
}

type ChillerBillingParam struct {
	ID                    uint    `gorm:"primaryKey" json:"id"`
	RateOffPeak           float64 `json:"rateOffPeak"`
	RatePeak              float64 `json:"ratePeak"`
	RateNight             float64 `json:"rateNight"`
	DailyOperHours        float64 `json:"dailyOperHours"`
	PeakHours             float64 `json:"peakHours"`
	AvgCoolingLoadTr      float64 `json:"avgCoolingLoadTr"`
	Chiller1Active        bool    `json:"chiller1Active"`
	Chiller2Active        bool    `json:"chiller2Active"`
	Chiller3Active        bool    `json:"chiller3Active"`
	PumpCondensePower     float64 `json:"pumpCondensePower"`
	PumpChilledPower      float64 `json:"pumpChilledPower"`
	PumpCoolingTowerPower float64 `json:"pumpCoolingTowerPower"`
}

func seedChiller() {
	var count int64
	DB.Model(&ChillerEquipment{}).Count(&count)
	
	// (JSON seeding logic removed as requested)

	// Seed Equipment
	equipments := []ChillerEquipment{
		{Name: "DAIKIN / McQuay Unit-I", Model: "McQuay / PFS3252DARY", Capacity: "306 TR", Type: "Water-Cooled Screw Chiller", Status: "Running", Load: "78%", TempIn: "12.2°C", TempOut: "7.1°C", Refrigerant: "R134a", LastService: "2026-01-25", NextService: "2026-07-25", Health: 98},
		{Name: "DAIKIN / McQuay Unit-II", Model: "McQuay / PFS3252DARY", Capacity: "306 TR", Type: "Water-Cooled Screw Chiller", Status: "Standby", Load: "0%", TempIn: "-", TempOut: "-", Refrigerant: "R134a", LastService: "2026-01-25", NextService: "2026-07-25", Health: 95},
		{Name: "DUNHAM-BUSH Unit-III", Model: "WCFX 46TR AU 5ARJ5B", Capacity: "400 TR", Type: "Water-Cooled Screw Chiller", Status: "Running", Load: "65%", TempIn: "11.8°C", TempOut: "7.0°C", Refrigerant: "R134a", LastService: "2026-01-25", NextService: "2026-07-25", Health: 96},
		{Name: "Primary Pump CHW-01", Model: "-", Capacity: "22 kW", Type: "Chilled Water Pump", Status: "Active", Load: "-", TempIn: "-", TempOut: "-", Refrigerant: "-", LastService: "2026-02-15", NextService: "2026-08-10", Health: 92},
		{Name: "Condenser Pump CW-01", Model: "-", Capacity: "18.5 kW", Type: "Condenser Water Pump", Status: "Active", Load: "-", TempIn: "-", TempOut: "-", Refrigerant: "-", LastService: "2026-03-01", NextService: "2026-09-01", Health: 94},
	}
	if count == 0 {
		DB.Create(&equipments)
	}
	// Seed Staff
	staffs := []ChillerStaff{
		{Name: "Selvakumar R", Role: "Senior A/C Mechanic", Shift: "General Shift", Attendance: "Present", Contact: "6383458394", DateJoined: "07/01/2012"},
		{Name: "Ranganathan R", Role: "Electrician", Shift: "Morning Shift", Attendance: "Present", Contact: "N/A", DateJoined: "N/A"},
		{Name: "Karan M", Role: "Chiller Plant Operator", Shift: "Evening Shift", Attendance: "Present", Contact: "6381198991", DateJoined: "02/04/2024"},
		{Name: "Vignesh R", Role: "Chiller Plant Operator", Shift: "Night Shift", Attendance: "Present", Contact: "744827303", DateJoined: "13/04/2026"},
	}
	var staffCount int64
	DB.Model(&ChillerStaff{}).Count(&staffCount)
	if staffCount == 0 {
		DB.Create(&staffs)
	}
	// (Seeding dummy logs removed so the DB only uses real user data)
	// Seed Billing Params
	billingParam := ChillerBillingParam{
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
	DB.Model(&ChillerBillingParam{}).Count(&bpCount)
	if bpCount == 0 {
		DB.Create(&billingParam)
	}
}

// --- Handlers ---

func handleGetChiller(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var logs []ChillerLog
	DB.Order("date desc").Find(&logs)

	var equipments []ChillerEquipment
	DB.Order("id asc").Find(&equipments)

	var staff []ChillerStaff
	DB.Order("id asc").Find(&staff)

	var billingParams ChillerBillingParam
	if err := DB.First(&billingParams).Error; err != nil {
		billingParams = ChillerBillingParam{
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
		DB.Create(&billingParams)
	}

	response := map[string]interface{}{
		"logs":          logs,
		"equipments":    equipments,
		"staff":         staff,
		"billingParams": billingParams,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleAddChillerLog(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var input ChillerLog
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

	var existing []ChillerLog
	DB.Where("date = ?", input.Date).Limit(1).Find(&existing)
	if len(existing) > 0 {
		input.ID = existing[0].ID
		DB.Save(&input)
	} else {
		DB.Create(&input)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(input)
}

func handleUpdateChillerBilling(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var input ChillerBillingParam
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var existing []ChillerBillingParam
	DB.Limit(1).Find(&existing)
	if len(existing) > 0 {
		input.ID = existing[0].ID
		DB.Save(&input)
	} else {
		DB.Create(&input)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(input)
}


// -- GET, POST, DELETE Handlers for Equipments --
func handleGetChillerEquipment(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	var units []ChillerEquipment
	DB.Find(&units)
	json.NewEncoder(w).Encode(units)
}
func handleAddChillerEquipment(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	var input []ChillerEquipment
	json.NewDecoder(r.Body).Decode(&input)
	for _, unit := range input {
		DB.Create(&unit)
	}
	w.WriteHeader(http.StatusOK)
}
func handleDeleteChillerEquipment(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	id := r.URL.Query().Get("id")
	DB.Delete(&ChillerEquipment{}, id)
	w.WriteHeader(http.StatusOK)
}

// -- GET, POST, DELETE Handlers for Staff --
func handleGetChillerStaff(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	var units []ChillerStaff
	DB.Find(&units)
	json.NewEncoder(w).Encode(units)
}
func handleAddChillerStaff(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	var input []ChillerStaff
	json.NewDecoder(r.Body).Decode(&input)
	for _, unit := range input {
		DB.Create(&unit)
	}
	w.WriteHeader(http.StatusOK)
}
func handleDeleteChillerStaff(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	id := r.URL.Query().Get("id")
	DB.Delete(&ChillerStaff{}, id)
	w.WriteHeader(http.StatusOK)
}

// -- Handlers for Plant Specifications --
func handleGetPlantSpecs(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	var units []ChillerPlantSpecification
	DB.Find(&units)
	json.NewEncoder(w).Encode(units)
}
func handleAddPlantSpecs(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	var input []ChillerPlantSpecification
	json.NewDecoder(r.Body).Decode(&input)
	for _, unit := range input {
		DB.Create(&unit)
	}
	w.WriteHeader(http.StatusOK)
}
func handleUpdatePlantSpec(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	var input ChillerPlantSpecification
	json.NewDecoder(r.Body).Decode(&input)
	DB.Save(&input)
	w.WriteHeader(http.StatusOK)
}
func handleDeletePlantSpec(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	id := r.URL.Query().Get("id")
	DB.Delete(&ChillerPlantSpecification{}, id)
	w.WriteHeader(http.StatusOK)
}

// -- Handlers for Unit Specifications --
func handleGetUnitSpecs(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	var units []ChillerUnitSpecification
	DB.Find(&units)
	json.NewEncoder(w).Encode(units)
}
func handleAddUnitSpecs(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	var input []ChillerUnitSpecification
	json.NewDecoder(r.Body).Decode(&input)
	for _, unit := range input {
		DB.Create(&unit)
	}
	w.WriteHeader(http.StatusOK)
}
func handleUpdateUnitSpec(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	var input ChillerUnitSpecification
	json.NewDecoder(r.Body).Decode(&input)
	DB.Save(&input)
	w.WriteHeader(http.StatusOK)
}
func handleDeleteUnitSpec(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	id := r.URL.Query().Get("id")
	DB.Delete(&ChillerUnitSpecification{}, id)
	w.WriteHeader(http.StatusOK)
}

func handleUpdateChillerEquipment(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var input ChillerEquipment
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	DB.Save(&input)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(input)
}

func handleUpdateChillerStaff(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var input ChillerStaff
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	DB.Save(&input)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(input)
}

func handleGetAhuUnits(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var units []AhuUnit
	DB.Order("id asc").Find(&units)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(units)
}

func handleAddAhuUnits(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var newUnits []AhuUnit
	if err := json.NewDecoder(r.Body).Decode(&newUnits); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if len(newUnits) > 0 {
		DB.Create(&newUnits)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(newUnits)
}

func handleUpdateAhuUnit(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "PUT" && r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var input AhuUnit
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.ID == 0 {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}

	DB.Save(&input)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(input)
}

func handleDeleteAhuUnit(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}

	DB.Delete(&AhuUnit{}, idStr)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success":true}`))
}

func handleGetSplitAc(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var units []SplitAcUnit
	DB.Order("id").Find(&units)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(units)
}

func handleAddSplitAc(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var newUnits []SplitAcUnit
	if err := json.NewDecoder(r.Body).Decode(&newUnits); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if len(newUnits) > 0 {
		DB.Create(&newUnits)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(newUnits)
}

func handleUpdateSplitAc(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "PUT" && r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var input SplitAcUnit
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.ID == 0 {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}

	DB.Save(&input)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(input)
}

func handleDeleteSplitAc(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}

	DB.Delete(&SplitAcUnit{}, idStr)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success":true}`))
}
// --- VRV Units API ---
func handleGetVrv(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	var units []VrvUnit
	DB.Order("s_no asc").Find(&units)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(units)
}

func handleAddVrv(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", http.StatusMethodNotAllowed); return }
	var newUnits []VrvUnit
	if err := json.NewDecoder(r.Body).Decode(&newUnits); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	DB.Create(&newUnits)
	w.WriteHeader(http.StatusOK)
}

func handleUpdateVrv(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "PUT" { http.Error(w, "Method not allowed", http.StatusMethodNotAllowed); return }
	var input VrvUnit
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	DB.Save(&input)
	w.WriteHeader(http.StatusOK)
}

func handleDeleteVrv(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "DELETE" { http.Error(w, "Method not allowed", http.StatusMethodNotAllowed); return }
	idStr := r.URL.Query().Get("id")
	DB.Delete(&VrvUnit{}, idStr)
	w.WriteHeader(http.StatusOK)
}

// --- Cold Room Units API ---
func handleGetColdRoom(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	var units []ColdRoomUnit
	DB.Order("s_no asc").Find(&units)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(units)
}

func handleAddColdRoom(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", http.StatusMethodNotAllowed); return }
	var newUnits []ColdRoomUnit
	if err := json.NewDecoder(r.Body).Decode(&newUnits); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	DB.Create(&newUnits)
	w.WriteHeader(http.StatusOK)
}

func handleUpdateColdRoom(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "PUT" { http.Error(w, "Method not allowed", http.StatusMethodNotAllowed); return }
	var input ColdRoomUnit
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	DB.Save(&input)
	w.WriteHeader(http.StatusOK)
}

func handleDeleteColdRoom(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "DELETE" { http.Error(w, "Method not allowed", http.StatusMethodNotAllowed); return }
	idStr := r.URL.Query().Get("id")
	DB.Delete(&ColdRoomUnit{}, idStr)
	w.WriteHeader(http.StatusOK)
}
