package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
)

type PlumbingMotor struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	MotorID       string `json:"motorId"`
	Location      string `json:"location"`
	Type          string `json:"type"`
	Power         string `json:"power"`
	OpHours       string `json:"opHours"`
	NextService   string `json:"nextService"`
	Status        string  `json:"status"`
	ConnectedTank string  `json:"connectedTank"`
	Kw            float64 `gorm:"-" json:"kw"`
	Kwh           float64 `gorm:"-" json:"kwh"`
}

type PlumbingSump struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	SumpID    string  `json:"sumpId"`
	Location  string  `json:"location"`
	Length    float64 `json:"length"`
	Width     float64 `json:"width"`
	Depth     float64 `json:"depth"`
	CubicFt   float64 `json:"cubicFt"`
	Capacity  int     `json:"capacity"`
	ZoneType  string  `json:"zoneType"`
	Status    string  `json:"status"`
}

type PlumbingOHT struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	OHTID       string  `json:"ohtId"`
	Location    string  `json:"location"`
	Length      float64 `json:"length"`
	Width       float64 `json:"width"`
	Depth       float64 `json:"depth"`
	CubicFt     float64 `json:"cubicFt"`
	Capacity    int     `json:"capacity"`
	ZoneType    string  `json:"zoneType"`
	LastCleaned string  `json:"lastCleaned"`
	Status      string  `json:"status"`
}

type PlumbingManpower struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	EmpID        string `json:"empId"`
	Name         string `json:"name"`
	Designation  string `json:"designation"`
	Contact      string `json:"contact"`
	Skill        string `json:"skill"`
	Type         string `json:"type"`
	Shift        string `json:"shift"`
	Status       string `json:"status"`
	Attendance   string `json:"attendance"`
	AssignedArea string `json:"assignedArea"`
}

type PlumbingRuntimeLog struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	Date       string `json:"date"`
	MotorID    string `json:"motorId"`
	PeakRun    string `json:"peakRun"`
	OffPeakRun string `json:"offPeakRun"`
	NightRun   string `json:"nightRun"`
	S1         string `json:"s1"`
	S2         string `json:"s2"`
	S3         string `json:"s3"`
	S4         string `json:"s4"`
}

func handleGetPlumbing(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var motors []PlumbingMotor
	var sumps []PlumbingSump
	var ohts []PlumbingOHT
	var manpower []PlumbingManpower
	var runtimes []PlumbingRuntimeLog

	DB.Find(&motors)
	DB.Find(&sumps)
	DB.Find(&ohts)
	DB.Find(&manpower)
	DB.Find(&runtimes)

	for i := range motors {
		var hp float64
		fmt.Sscanf(motors[i].Power, "%f", &hp)
		
		kw := (hp * 745.7) / 1000
		motors[i].Kw = kw

		// Determine hours from latest runtime or default OpHours
		var hrs float64
		var found bool
		for j := len(runtimes) - 1; j >= 0; j-- {
			if runtimes[j].MotorID == motors[i].MotorID {
				s1, _ := strconv.ParseFloat(runtimes[j].S1, 64)
				s2, _ := strconv.ParseFloat(runtimes[j].S2, 64)
				s3, _ := strconv.ParseFloat(runtimes[j].S3, 64)
				s4, _ := strconv.ParseFloat(runtimes[j].S4, 64)
				hrs = s1 + s2 + s3 + s4
				found = true
				break
			}
		}
		if !found {
			fmt.Sscanf(motors[i].OpHours, "%f", &hrs)
		}
		motors[i].Kwh = kw * hrs
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"motors":   motors,
		"sumps":    sumps,
		"ohts":     ohts,
		"manpower": manpower,
		"runtimes": runtimes,
	})
}

func handleAddPlumbingMotors(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var data []PlumbingMotor
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			DB.Create(&v)
		}
	}
	w.WriteHeader(http.StatusOK)
}

func handleDeletePlumbingMotor(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	id := r.URL.Query().Get("id")
	if id != "" {
		DB.Delete(&PlumbingMotor{}, id)
	}
	w.WriteHeader(http.StatusOK)
}

func handleAddPlumbingSumps(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var data []PlumbingSump
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			DB.Create(&v)
		}
	}
	w.WriteHeader(http.StatusOK)
}

func handleDeletePlumbingSump(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	id := r.URL.Query().Get("id")
	if id != "" {
		DB.Delete(&PlumbingSump{}, id)
	}
	w.WriteHeader(http.StatusOK)
}

func handleAddPlumbingOHTs(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var data []PlumbingOHT
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			DB.Create(&v)
		}
	}
	w.WriteHeader(http.StatusOK)
}

func handleDeletePlumbingOHT(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	id := r.URL.Query().Get("id")
	if id != "" {
		DB.Delete(&PlumbingOHT{}, id)
	}
	w.WriteHeader(http.StatusOK)
}

func handleAddPlumbingManpower(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var data []PlumbingManpower
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			DB.Create(&v)
		}
	}
	w.WriteHeader(http.StatusOK)
}

func handleDeletePlumbingManpower(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	id := r.URL.Query().Get("id")
	if id != "" {
		DB.Delete(&PlumbingManpower{}, id)
	}
	w.WriteHeader(http.StatusOK)
}

func handleAddPlumbingRuntime(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var data []PlumbingRuntimeLog
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			var existing PlumbingRuntimeLog
			if DB.Where("date = ? AND motor_id = ?", v.Date, v.MotorID).First(&existing).Error == nil {
				existing.PeakRun = v.PeakRun
				existing.OffPeakRun = v.OffPeakRun
				existing.NightRun = v.NightRun
				existing.S1 = v.S1
				existing.S2 = v.S2
				existing.S3 = v.S3
				existing.S4 = v.S4
				DB.Save(&existing)
			} else {
				DB.Create(&v)
			}
		}
	}
	w.WriteHeader(http.StatusOK)
}

func seedPlumbing() {
	var count int64
	DB.Model(&PlumbingMotor{}).Count(&count)
	if count == 0 {
		motors := []PlumbingMotor{
			{MotorID: "MTR-01", Location: "Main Pump House", Type: "Submersible", Power: "10 HP", Status: "Active", NextService: "12-Jun-2026", ConnectedTank: "OHT-01"},
			{MotorID: "MTR-02", Location: "STP Transfer", Type: "Centrifugal", Power: "5 HP", Status: "Active", NextService: "15-Jul-2026", ConnectedTank: "SMP-01"},
			{MotorID: "MTR-03", Location: "Hostel Block A Sump", Type: "Submersible", Power: "7.5 HP", Status: "Maintenance", NextService: "01-Jun-2026", ConnectedTank: "SMP-02"},
			{MotorID: "MTR-04", Location: "Admin Block Booster", Type: "Centrifugal", Power: "2 HP", Status: "Active", NextService: "20-Aug-2026", ConnectedTank: "OHT-01"},
			{MotorID: "MTR-05", Location: "Sports Complex Sump", Type: "Submersible", Power: "5 HP", Status: "Active", NextService: "05-Sep-2026", ConnectedTank: "SMP-03"},
		}
		for _, m := range motors {
			DB.Create(&m)
		}
	}

	DB.Model(&PlumbingSump{}).Count(&count)
	if count == 0 {
		sumps := []PlumbingSump{
			{SumpID: "SMP-01", Location: "Main Tank (Sump)", Length: 25.25, Width: 26.00, Depth: 9.75, CubicFt: 6400.88, Capacity: 180000, ZoneType: "Main / Central", Status: "Active"},
			{SumpID: "SMP-02", Location: "Narmada Hostel Sump", Length: 30.50, Width: 21.00, Depth: 10.00, CubicFt: 6405.00, Capacity: 181369, ZoneType: "Boys Hostel", Status: "Active"},
			{SumpID: "SMP-03", Location: "Emerald Hostel Back Side Sump", Length: 40.00, Width: 11.00, Depth: 9.50, CubicFt: 4180.00, Capacity: 118364, ZoneType: "Girls Hostel", Status: "Active"},
			{SumpID: "SMP-04", Location: "Staff Quarters Sump", Length: 21.00, Width: 11.00, Depth: 8.00, CubicFt: 1848.00, Capacity: 52329, ZoneType: "Staff Quarters", Status: "Active"},
			{SumpID: "SMP-05", Location: "Sapphire Hostel Back Side Sump", Length: 34.00, Width: 18.75, Depth: 12.75, CubicFt: 8128.00, Capacity: 230159, ZoneType: "Girls Hostel", Status: "Active"},
			{SumpID: "SMP-06", Location: "Fire Safety UG Sump", Length: 33.75, Width: 25.00, Depth: 21.00, CubicFt: 17718.80, Capacity: 502232, ZoneType: "Fire Safety", Status: "Active"},
			{SumpID: "SMP-07", Location: "RO Plant - Raw Water Sump", Length: 15.00, Width: 9.60, Depth: 6.00, CubicFt: 864.00, Capacity: 26000, ZoneType: "RO Plant", Status: "Active"},
			{SumpID: "SMP-08", Location: "RO Plant - RO Water Sump", Length: 15.00, Width: 9.60, Depth: 6.00, CubicFt: 864.00, Capacity: 26000, ZoneType: "RO Plant", Status: "Active"},
			{SumpID: "SMP-09", Location: "Training Academy Sump - Raw", Length: 21.00, Width: 7.00, Depth: 6.00, CubicFt: 2988.00, Capacity: 40000, ZoneType: "Training Academy", Status: "Active"},
			{SumpID: "SMP-10", Location: "Training Academy Sump - Treated", Length: 21.00, Width: 7.00, Depth: 6.00, CubicFt: 2988.00, Capacity: 40000, ZoneType: "Training Academy", Status: "Active"},
		}
		for _, s := range sumps {
			DB.Create(&s)
		}
	}

	DB.Model(&PlumbingOHT{}).Count(&count)
	if count == 0 {
		ohts := []PlumbingOHT{
			{OHTID: "OHT-01", Location: "Main Tank OHT", Length: 24.00, Width: 24.00, Depth: 7.00, CubicFt: 4032.00, Capacity: 120000, ZoneType: "Main / Central", Status: "Active"},
			{OHTID: "OHT-02", Location: "Sapphire Hostel (North-1)", Length: 21.00, Width: 7.00, Depth: 6.00, CubicFt: 2988.00, Capacity: 40000, ZoneType: "Girls Hostel", Status: "Active"},
			{OHTID: "OHT-03", Location: "Sapphire Hostel (South-1)", Length: 21.00, Width: 7.00, Depth: 6.00, CubicFt: 2988.00, Capacity: 40000, ZoneType: "Girls Hostel", Status: "Active"},
			{OHTID: "OHT-04", Location: "Sapphire Hostel (North-2)", Length: 16.50, Width: 9.50, Depth: 6.00, CubicFt: 940.00, Capacity: 26000, ZoneType: "Girls Hostel", Status: "Active"},
			{OHTID: "OHT-05", Location: "Sapphire Hostel (South-2)", Length: 16.50, Width: 9.50, Depth: 6.00, CubicFt: 940.00, Capacity: 26000, ZoneType: "Girls Hostel", Status: "Active"},
			{OHTID: "OHT-06", Location: "Sapphire Hostel (North-3)", Length: 16.50, Width: 9.50, Depth: 6.00, CubicFt: 940.00, Capacity: 26000, ZoneType: "Girls Hostel", Status: "Active"},
			{OHTID: "OHT-07", Location: "Sapphire Hostel (South-3)", Length: 16.50, Width: 9.50, Depth: 6.00, CubicFt: 940.00, Capacity: 26000, ZoneType: "Girls Hostel", Status: "Active"},
			{OHTID: "OHT-08", Location: "Emerald Hostel (North-1)", Length: 21.00, Width: 7.00, Depth: 6.00, CubicFt: 2988.00, Capacity: 40000, ZoneType: "Girls Hostel", Status: "Active"},
			{OHTID: "OHT-09", Location: "Emerald Hostel (South-1)", Length: 21.00, Width: 7.00, Depth: 6.00, CubicFt: 2988.00, Capacity: 40000, ZoneType: "Girls Hostel", Status: "Active"},
			{OHTID: "OHT-10", Location: "Emerald Hostel (North-2)", Length: 16.50, Width: 9.50, Depth: 6.00, CubicFt: 940.00, Capacity: 26000, ZoneType: "Girls Hostel", Status: "Active"},
			{OHTID: "OHT-11", Location: "Emerald Hostel (South-2)", Length: 16.50, Width: 9.50, Depth: 6.00, CubicFt: 940.00, Capacity: 26000, ZoneType: "Girls Hostel", Status: "Active"},
			{OHTID: "OHT-12", Location: "Emerald Hostel (North-3)", Length: 16.50, Width: 9.50, Depth: 6.00, CubicFt: 940.00, Capacity: 26000, ZoneType: "Girls Hostel", Status: "Active"},
			{OHTID: "OHT-13", Location: "Emerald Hostel (South-3)", Length: 16.50, Width: 9.50, Depth: 6.00, CubicFt: 940.00, Capacity: 26000, ZoneType: "Girls Hostel", Status: "Active"},
			{OHTID: "OHT-14", Location: "Diamond Hostel", Length: 16.50, Width: 11.00, Depth: 6.00, CubicFt: 1089.00, Capacity: 30000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-15", Location: "Ruby Hostel OHT - 1", Length: 16.50, Width: 11.00, Depth: 6.00, CubicFt: 1089.00, Capacity: 30000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-16", Location: "Ruby Hostel OHT - 2", Length: 16.50, Width: 11.00, Depth: 6.00, CubicFt: 1089.00, Capacity: 30000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-17", Location: "Ganga Hostel", Length: 23.00, Width: 19.00, Depth: 7.00, CubicFt: 3059.00, Capacity: 85000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-18", Location: "Yamuna Hostel", Length: 23.00, Width: 19.00, Depth: 7.00, CubicFt: 3059.00, Capacity: 85000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-19", Location: "Cauvery Hostel", Length: 16.50, Width: 11.00, Depth: 6.00, CubicFt: 1089.00, Capacity: 30000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-20", Location: "Narmada (West)", Length: 16.50, Width: 11.00, Depth: 6.00, CubicFt: 1089.00, Capacity: 30000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-21", Location: "Narmada (East)", Length: 16.50, Width: 11.00, Depth: 6.00, CubicFt: 1089.00, Capacity: 30000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-22", Location: "Bhavani (South)", Length: 33.00, Width: 7.25, Depth: 6.00, CubicFt: 1435.00, Capacity: 40000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-23", Location: "Bhavani (North)", Length: 33.00, Width: 7.25, Depth: 6.00, CubicFt: 1435.00, Capacity: 40000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-25", Location: "Girl's Dining Hall (East)", Length: 25.00, Width: 21.00, Depth: 6.50, CubicFt: 3412.00, Capacity: 95000, ZoneType: "Dining", Status: "Active"},
			{OHTID: "OHT-26", Location: "Girl's Dining Hall (West)", Length: 25.00, Width: 21.00, Depth: 6.50, CubicFt: 3412.00, Capacity: 95000, ZoneType: "Dining", Status: "Active"},
			{OHTID: "OHT-27", Location: "Boy's Dining (Above Kitchen)", Length: 23.00, Width: 16.00, Depth: 8.00, CubicFt: 2944.00, Capacity: 82000, ZoneType: "Dining", Status: "Active"},
			{OHTID: "OHT-28", Location: "Boy's Dining (In Between Kitchen)", Length: 21.00, Width: 29.00, Depth: 6.25, CubicFt: 3806.00, Capacity: 105000, ZoneType: "Dining", Status: "Active"},
			{OHTID: "OHT-29", Location: "Mechanical Block OHT", Length: 15.00, Width: 15.00, Depth: 6.50, CubicFt: 1462.50, Capacity: 40000, ZoneType: "Academic Block", Status: "Active"},
			{OHTID: "OHT-30", Location: "Mechatronics Block OHT - North (1)", Length: 15.00, Width: 15.00, Depth: 6.50, CubicFt: 1462.50, Capacity: 40000, ZoneType: "Academic Block", Status: "Active"},
			{OHTID: "OHT-31", Location: "Mechatronics Block OHT - North (2)", Length: 15.00, Width: 15.00, Depth: 6.50, CubicFt: 1462.50, Capacity: 40000, ZoneType: "Academic Block", Status: "Active"},
			{OHTID: "OHT-32", Location: "Mechatronics Block OHT - North (3)", Length: 15.00, Width: 15.00, Depth: 6.50, CubicFt: 1462.50, Capacity: 40000, ZoneType: "Academic Block", Status: "Active"},
			{OHTID: "OHT-33", Location: "Coral Hostel OHT", Length: 16.50, Width: 9.50, Depth: 6.00, CubicFt: 940.00, Capacity: 26000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-34", Location: "Pearl Hostel OHT (East)", Length: 21.00, Width: 7.00, Depth: 6.00, CubicFt: 2988.00, Capacity: 40000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-35", Location: "Pearl Hostel OHT (West)", Length: 21.00, Width: 7.00, Depth: 6.00, CubicFt: 2988.00, Capacity: 40000, ZoneType: "Boys Hostel", Status: "Active"},
			{OHTID: "OHT-36", Location: "Training Academy OHT", Length: 16.50, Width: 11.00, Depth: 6.00, CubicFt: 1089.00, Capacity: 30000, ZoneType: "Training Academy", Status: "Active"},
			{OHTID: "OHT-37", Location: "Learning Centre OHT East", Length: 15.00, Width: 9.60, Depth: 6.00, CubicFt: 864.00, Capacity: 26000, ZoneType: "Academic Block", Status: "Active"},
			{OHTID: "OHT-38", Location: "Learning Centre OHT West", Length: 15.00, Width: 9.60, Depth: 6.00, CubicFt: 864.00, Capacity: 26000, ZoneType: "Academic Block", Status: "Active"},
			{OHTID: "OHT-39", Location: "Staff Quarters L Block OHT - East", Length: 15.00, Width: 9.60, Depth: 6.00, CubicFt: 864.00, Capacity: 26000, ZoneType: "Staff Quarters", Status: "Active"},
			{OHTID: "OHT-40", Location: "Staff Quarters L Block OHT - West", Length: 15.00, Width: 9.60, Depth: 6.00, CubicFt: 864.00, Capacity: 26000, ZoneType: "Staff Quarters", Status: "Active"},
			{OHTID: "OHT-41", Location: "Staff Quarters M Block OHT - East", Length: 15.00, Width: 9.60, Depth: 6.00, CubicFt: 864.00, Capacity: 26000, ZoneType: "Staff Quarters", Status: "Active"},
			{OHTID: "OHT-42", Location: "Staff Quarters M Block OHT - West", Length: 15.00, Width: 9.60, Depth: 6.00, CubicFt: 864.00, Capacity: 26000, ZoneType: "Staff Quarters", Status: "Active"},
			{OHTID: "OHT-43", Location: "Staff Quarters A to E Block (Type 1)", Length: 0.0, Width: 0.0, Depth: 0.0, CubicFt: 0.0, Capacity: 80000, ZoneType: "Staff Quarters", Status: "Active"},
			{OHTID: "OHT-44", Location: "Staff Quarters A to E Block (Type 2)", Length: 0.0, Width: 0.0, Depth: 0.0, CubicFt: 0.0, Capacity: 192000, ZoneType: "Staff Quarters", Status: "Active"},
		}
		for _, o := range ohts {
			DB.Create(&o)
		}
	}
}
