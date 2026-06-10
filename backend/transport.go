package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// ─── MODELS ───────────────────────────────────────────────────────────────────

type Vehicle struct {
	ID           uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	Number       string  `gorm:"uniqueIndex;not null" json:"number"`
	BusNo        string  `json:"busNo"`
	Type         string  `json:"type"`    // Bus / Van
	Status       string  `json:"status"`  // Active / In Parking
	MileageKmpl  float64 `json:"mileageKmpl"`
	Route        string  `json:"route"`
	Driver       string  `json:"driver"`
	LastFC       string  `json:"lastFC"`
	NextFC       string  `json:"nextFC"`
	MileageTrend []MileageTrend `gorm:"foreignKey:VehicleNumber;references:Number" json:"trend"`
}

type MileageTrend struct {
	ID            uint    `gorm:"primaryKey;autoIncrement" json:"-"`
	VehicleNumber string  `json:"-"`
	Day           string  `json:"day"`
	KPI           float64 `json:"kpi"`
}

type Driver struct {
	ID           uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string         `json:"name"`
	ImgURL       string         `json:"img"`
	Status       string         `json:"status"`   // Present / Absent
	TodayBus     string         `json:"todayBus"`
	TodayRoute   string         `json:"todayRoute"`
	VehicleType  string         `json:"vehicleType"` // Bus, Van, Car, EV
	Schedule     []DriverSchedule `gorm:"foreignKey:DriverID" json:"schedule"`
}

type DriverSchedule struct {
	ID            uint   `gorm:"primaryKey;autoIncrement" json:"-"`
	DriverID      uint   `json:"-"`
	Date          string `json:"date"`
	MorningRoute  string `json:"morningRoute"`
	MorningBus    string `json:"morningBus"`
	EveningRoute  string `json:"eveningRoute"`
	EveningBus    string `json:"eveningBus"`
	SpecialPlace  string `json:"specialPlace"`
	SpecialOut    string `json:"specialOut"`
	SpecialReturn string `json:"specialReturn"`
	CarOrEV       string `json:"carOrEV"`
}

type DailyOp struct {
	ID       uint   `gorm:"primaryKey;autoIncrement" json:"-"`
	Date     string `gorm:"uniqueIndex" json:"date"`
	Vehicles int    `json:"vehicles"`
	Trips    int    `json:"trips"`
}

type FuelLog struct {
	ID       uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	Vehicle  string  `json:"vehicle"`
	Date     string  `json:"date"`
	Litres   float64 `json:"litres"`
	Odometer float64 `json:"odometer"`
	KMDriven float64 `json:"kmDriven"`
	Mileage  float64 `json:"mileage"`
}

type RouteTrip struct {
	ID    uint   `gorm:"primaryKey;autoIncrement" json:"-"`
	Route string `json:"route"`
	Date  string `json:"date"`
	Trips int    `json:"trips"`
}

type GPSDevice struct {
	ID       uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Vehicle  string `gorm:"uniqueIndex" json:"vehicle"`
	Status   string `json:"status"`   // Active / Inactive
	LastPing string `json:"lastPing"`
	Provider string `json:"provider"`
}

type VehicleMaintenance struct {
	ID          uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Vehicle     string `json:"vehicle"`
	CostRupees  string `json:"cost"`
	Service     string `json:"service"`
	Status      string `json:"status"` // Completed / Pending
	ServiceDate string `json:"date"`
}

type BreakdownIncident struct {
	ID            uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Vehicle       string `json:"vehicle"`
	Issue         string `json:"issue"`
	DowntimeHours int    `json:"downtimeHours"`
	IncidentDate  string `json:"incidentDate"`
}

type Trip struct {
	ID              uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	Date            string  `json:"date"`
	BusNumber       string  `json:"busNumber"`
	TripType        string  `json:"tripType"` // Morning / Evening / Afternoon / Special
	RouteName       string  `json:"routeName"` // Serves as Place Travelled for Special trips
	DriverName      string  `json:"driverName"`
	StartTime       string  `json:"startTime"` // Can hold Date & Time for Special trips
	EndTime         string  `json:"endTime"`
	StartKM         float64 `json:"startKM"`
	EndKM           float64 `json:"endKM"`
	Distance        float64 `json:"distance"`
	StudentCount    int     `json:"studentCount"`
	Attendance      int     `json:"attendance"`
	FuelUsage       float64 `json:"fuelUsage"`
	Remarks         string  `json:"remarks"`

	// Special Trip specific fields
	Purpose         string  `json:"purpose"`
	RequestedBy     string  `json:"requestedBy"`
	ApprovedBy      string  `json:"approvedBy"`
	ApprovalStatus  string  `json:"approvalStatus"` // Pending, Approved, Rejected
	TripStatus      string  `json:"tripStatus"` // Pending Approval, Approved, In Progress, Completed, Cancelled
	ExpectedEndTime string  `json:"expectedEndTime"`
	ActualEndTime   string  `json:"actualEndTime"`
}

type TransportStudent struct {
	ID            uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name          string `json:"name"`
	RollNumber    string `gorm:"uniqueIndex;not null" json:"rollNumber"`
	Year          string `json:"year"`
	BoardingPoint string `json:"boardingPoint"`
	RouteAssigned string `json:"routeAssigned"`
	BusAssigned   string `json:"busAssigned"`
	Status        string `json:"status"` // Active / Discontinued
}

// ─── SEED ─────────────────────────────────────────────────────────────────────

func seedTransport() {
	fmt.Println("Transport seed cleared. Ready for user data entry.")
}

// ─── RESPONSE PAYLOAD ─────────────────────────────────────────────────────────

type TransportPayload struct {
	Vehicles     []Vehicle            `json:"vehicles"`
	Drivers      []Driver             `json:"drivers"`
	DailyOps     []DailyOp            `json:"dailyOps"`
	FuelLogs     []FuelLog            `json:"fuelByVehicle"`
	RouteTrips   []RouteTrip          `json:"routeTrips"`
	GPS          []GPSDevice          `json:"gps"`
	Maintenance  []VehicleMaintenance `json:"maintenance"`
	Breakdowns   []BreakdownIncident  `json:"breakdowns"`
	Trips        []Trip               `json:"trips"`
	Students     []TransportStudent   `json:"students"`
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

func handleGetTransport(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }

	var payload TransportPayload
	DB.Preload("MileageTrend").Find(&payload.Vehicles)
	DB.Preload("Schedule").Find(&payload.Drivers)
	DB.Order("date asc").Find(&payload.DailyOps)
	DB.Order("date desc").Find(&payload.FuelLogs)
	DB.Order("date desc").Find(&payload.RouteTrips)
	DB.Find(&payload.GPS)
	DB.Order("service_date desc").Find(&payload.Maintenance)
	DB.Order("incident_date desc").Find(&payload.Breakdowns)
	DB.Order("date desc").Find(&payload.Trips)
	DB.Order("name asc").Find(&payload.Students)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}

func handleUpdateDriverStatus(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct {
		ID            uint   `json:"id"`
		Status        string `json:"status"`
		MorningRoute  string `json:"morningRoute"`
		MorningBus    string `json:"morningBus"`
		EveningRoute  string `json:"eveningRoute"`
		EveningBus    string `json:"eveningBus"`
		SpecialPlace  string `json:"specialPlace"`
		SpecialOut    string `json:"specialOut"`
		SpecialReturn string `json:"specialReturn"`
		CarOrEV       string `json:"carOrEV"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	var driver Driver
	if err := DB.First(&driver, req.ID).Error; err != nil {
		http.Error(w, "Driver not found", 404); return
	}
	if req.Status != "" { driver.Status = req.Status }
	DB.Save(&driver)

	todayStr := time.Now().Format("2006-01-02")
	var sched DriverSchedule
	if err := DB.Where("driver_id = ? AND date = ?", req.ID, todayStr).First(&sched).Error; err != nil {
		sched = DriverSchedule{DriverID: req.ID, Date: todayStr}
	}
	sched.MorningRoute = req.MorningRoute
	sched.MorningBus = req.MorningBus
	sched.EveningRoute = req.EveningRoute
	sched.EveningBus = req.EveningBus
	sched.SpecialPlace = req.SpecialPlace
	sched.SpecialOut = req.SpecialOut
	sched.SpecialReturn = req.SpecialReturn
	sched.CarOrEV = req.CarOrEV
	
	if sched.ID == 0 {
		DB.Create(&sched)
	} else {
		DB.Save(&sched)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(driver)
}

func handleUpdateVehicleStatus(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct {
		Number string `json:"number"`
		Status string `json:"status"`
		Route  string `json:"route"`
		Driver string `json:"driver"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	var vehicle Vehicle
	if err := DB.Where("number = ?", req.Number).First(&vehicle).Error; err != nil {
		http.Error(w, "Vehicle not found", 404); return
	}
	if req.Status != "" { vehicle.Status = req.Status }
	if req.Route != "" { vehicle.Route = req.Route }
	if req.Driver != "" { vehicle.Driver = req.Driver }
	DB.Save(&vehicle)

	// Sync vehicle info back to driver
	if vehicle.Driver != "" {
		DB.Model(&Driver{}).Where("name = ?", vehicle.Driver).Updates(map[string]interface{}{
			"today_bus":   vehicle.Number,
			"today_route": vehicle.Route,
			"status":      "Present",
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vehicle)
}

func handleEditVehicle(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req Vehicle
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	var vehicle Vehicle
	if err := DB.Where("number = ?", req.Number).First(&vehicle).Error; err != nil {
		http.Error(w, "Vehicle not found", 404); return
	}

	vehicle.BusNo = req.BusNo
	vehicle.Type = req.Type
	vehicle.Status = req.Status
	vehicle.MileageKmpl = req.MileageKmpl
	vehicle.Route = req.Route
	vehicle.Driver = req.Driver
	vehicle.LastFC = req.LastFC
	vehicle.NextFC = req.NextFC

	DB.Save(&vehicle)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vehicle)
}

func handleAddFuelLog(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct {
		Vehicle      string  `json:"vehicle"`
		Date         string  `json:"date"`
		Litres       float64 `json:"litres"`
		Odometer     float64 `json:"odometer"`
		PrevOdometer float64 `json:"prevOdometer"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	fuelLog := FuelLog{
		Vehicle:  req.Vehicle,
		Date:     req.Date,
		Litres:   req.Litres,
		Odometer: req.Odometer,
	}

	// Calculate using provided prevOdometer or fetch from DB
	if req.PrevOdometer > 0 && req.Odometer > req.PrevOdometer {
		fuelLog.KMDriven = req.Odometer - req.PrevOdometer
		if req.Litres > 0 {
			fuelLog.Mileage = fuelLog.KMDriven / req.Litres
		}
	} else {
		var prevLog FuelLog
		err := DB.Where("vehicle = ?", req.Vehicle).Order("date desc, id desc").First(&prevLog).Error
		if err == nil && prevLog.Odometer > 0 && req.Odometer > prevLog.Odometer {
			fuelLog.KMDriven = req.Odometer - prevLog.Odometer
			if req.Litres > 0 {
				fuelLog.Mileage = fuelLog.KMDriven / req.Litres
			}
		}
	}

	DB.Create(&fuelLog)

	// Calculate and insert/update mileage trend
	if req.Litres > 0 && fuelLog.KMDriven > 0 {
		kpi := fuelLog.KMDriven / req.Litres
		DB.Create(&MileageTrend{
			VehicleNumber: req.Vehicle,
			Day:           req.Date,
			KPI:           kpi,
		})
	}

	var all []FuelLog
	DB.Order("date desc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func handleAddMaintenance(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req VehicleMaintenance
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}
	if req.Vehicle == "" || req.Service == "" {
		http.Error(w, "Vehicle and service are required", 400); return
	}
	if req.ServiceDate == "" {
		req.ServiceDate = time.Now().Format("2006-01-02")
	}
	if req.Status == "" { req.Status = "Pending" }
	DB.Create(&req)

	var all []VehicleMaintenance
	DB.Order("service_date desc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func handleUpdateMaintenanceStatus(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct {
		ID     uint   `json:"id"`
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	DB.Model(&VehicleMaintenance{}).Where("id = ?", req.ID).Update("status", req.Status)

	var all []VehicleMaintenance
	DB.Order("service_date desc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func handleUpdateGPSStatus(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct {
		Vehicle  string `json:"vehicle"`
		Status   string `json:"status"`
		LastPing string `json:"lastPing"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	DB.Model(&GPSDevice{}).Where("vehicle = ?", req.Vehicle).Updates(map[string]interface{}{
		"status":    req.Status,
		"last_ping": req.LastPing,
	})

	var all []GPSDevice
	DB.Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func handleAddVehicle(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct {
		Number      string  `json:"number"`
		BusNo       string  `json:"busNo"`
		Type        string  `json:"type"`
		Status      string  `json:"status"`
		MileageKmpl float64 `json:"mileageKmpl"`
		Route       string  `json:"route"`
		Driver      string  `json:"driver"`
		LastFC      string  `json:"lastFC"`
		NextFC      string  `json:"nextFC"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}
	if req.Number == "" || req.Type == "" {
		http.Error(w, "Vehicle number and type are required", 400); return
	}

	// Duplicate check
	var existing Vehicle
	if err := DB.Where("number = ?", req.Number).First(&existing).Error; err == nil {
		http.Error(w, "Vehicle number already exists", 409); return
	}

	v := Vehicle{
		Number: req.Number, BusNo: req.BusNo, Type: req.Type, Status: req.Status,
		MileageKmpl: req.MileageKmpl, Route: req.Route, Driver: req.Driver,
		LastFC: req.LastFC, NextFC: req.NextFC,
	}
	if v.Status == "" { v.Status = "Active" }
	DB.Create(&v)

	// Also create a blank GPS entry for new vehicle
	DB.Create(&GPSDevice{Vehicle: v.Number, Status: "Inactive", LastPing: "Never", Provider: "Unassigned"})

	var all []Vehicle
	DB.Preload("MileageTrend").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func handleAddDriver(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct {
		Name       string `json:"name"`
		Phone      string `json:"phone"`
		License    string `json:"license"`
		Status     string `json:"status"`
		TodayBus   string `json:"todayBus"`
		TodayRoute string `json:"todayRoute"`
		ImgURL     string `json:"imgURL"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}
	if req.Name == "" {
		http.Error(w, "Driver name is required", 400); return
	}

	// Duplicate check
	var existing Driver
	if err := DB.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		http.Error(w, "Driver with this name already exists", 409); return
	}

	if req.Status == "" { req.Status = "Present" }
	if req.TodayBus == "" { req.TodayBus = "N/A" }
	if req.TodayRoute == "" { req.TodayRoute = "Free Today" }
	if req.ImgURL == "" { req.ImgURL = "https://i.pravatar.cc/150?u=" + req.Name }

	d := Driver{Name: req.Name, ImgURL: req.ImgURL, Status: req.Status, TodayBus: req.TodayBus, TodayRoute: req.TodayRoute}
	DB.Create(&d)

	var all []Driver
	DB.Preload("Schedule").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func handleDeleteVehicle(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct { Number string `json:"number"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}
	if req.Number == "" { http.Error(w, "Number required", 400); return }

	DB.Where("vehicle_number = ?", req.Number).Delete(&MileageTrend{})
	DB.Where("vehicle = ?", req.Number).Delete(&FuelLog{})
	DB.Where("vehicle = ?", req.Number).Delete(&GPSDevice{})
	DB.Where("vehicle = ?", req.Number).Delete(&VehicleMaintenance{})
	DB.Where("number = ?", req.Number).Delete(&Vehicle{})

	var all []Vehicle
	DB.Preload("MileageTrend").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func handleDeleteDriver(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct { ID uint `json:"id"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}
	if req.ID == 0 { http.Error(w, "ID required", 400); return }

	DB.Where("driver_id = ?", req.ID).Delete(&DriverSchedule{})
	DB.Delete(&Driver{}, req.ID)

	var all []Driver
	DB.Preload("Schedule").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func handleAddTrip(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req Trip
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	// 1. Validation: Date + Bus Number + Trip Type uniqueness (only for non-Special trips)
	if req.TripType != "Special" {
		var existing Trip
		if err := DB.Where("bus_number = ? AND date = ? AND trip_type = ?", req.BusNumber, req.Date, req.TripType).First(&existing).Error; err == nil {
			http.Error(w, fmt.Sprintf("Duplicate Trip: A %s trip for bus %s on %s already exists.", req.TripType, req.BusNumber, req.Date), 409); return
		}

		// 2. Validation: End KM > Start KM (only for non-Special trips or if they provided it)
		if req.EndKM <= req.StartKM && req.EndKM != 0 {
			http.Error(w, "Validation Error: End KM must be greater than Start KM.", 400); return
		}

		// 3. Validation: Driver availability conflict
		var driverConflict Trip
		if err := DB.Where("driver_name = ? AND date = ? AND trip_type = ?", req.DriverName, req.Date, req.TripType).First(&driverConflict).Error; err == nil {
			http.Error(w, fmt.Sprintf("Driver Conflict: Driver %s is already assigned to bus %s for the %s trip on this date.", req.DriverName, driverConflict.BusNumber, req.TripType), 409); return
		}
	} else {
		// Special Trip Validation
		if req.ExpectedEndTime < req.StartTime {
			http.Error(w, "Validation Error: Expected End Time cannot be before Start Time.", 400); return
		}
		req.TripStatus = "Pending Approval"
	}

	// Calculate distance
	if req.EndKM > req.StartKM {
		req.Distance = req.EndKM - req.StartKM
	}

	// For normal trips, set as Completed automatically
	if req.TripType != "Special" {
		req.TripStatus = "Completed"
	}

	// Save Trip
	if err := DB.Create(&req).Error; err != nil {
		http.Error(w, err.Error(), 500); return
	}

	// 4. Auto-sync Driver and Vehicle (Only for normal trips or when Special trip completes)
	if req.TripType != "Special" {
	if req.BusNumber != "" && req.DriverName != "" {
		DB.Model(&Vehicle{}).Where("number = ?", req.BusNumber).Updates(map[string]interface{}{
			"driver": req.DriverName,
			"route":  req.RouteName,
		})
		DB.Model(&Driver{}).Where("name = ?", req.DriverName).Updates(map[string]interface{}{
			"today_bus":   req.BusNumber,
			"today_route": req.RouteName,
			"status":      "Present",
		})
		
		// Update DriverSchedule
		var driver Driver
		if err := DB.Where("name = ?", req.DriverName).First(&driver).Error; err == nil {
			var ds DriverSchedule
			if err := DB.Where("driver_id = ? AND date = ?", driver.ID, req.Date).First(&ds).Error; err != nil {
				ds = DriverSchedule{DriverID: driver.ID, Date: req.Date}
			}
			if req.TripType == "Morning" {
				ds.MorningRoute = req.RouteName
				ds.MorningBus = req.BusNumber
			} else if req.TripType == "Evening" {
				ds.EveningRoute = req.RouteName
				ds.EveningBus = req.BusNumber
			} else if req.TripType == "Special" {
				ds.SpecialPlace = req.RouteName
			}
			DB.Save(&ds)
		}
	}

	// Increment daily ops
	var op DailyOp
	if err := DB.Where("date = ?", req.Date).First(&op).Error; err != nil {
		op = DailyOp{Date: req.Date, Vehicles: 1, Trips: 1}
		DB.Create(&op)
	} else {
		var uniqueBusesCount int64
		DB.Model(&Trip{}).Where("date = ?", req.Date).Distinct("bus_number").Count(&uniqueBusesCount)
		op.Trips++
		op.Vehicles = int(uniqueBusesCount)
		DB.Save(&op)
	}
	}

	var all []Trip
	DB.Order("date desc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func handleUpdateTripStatus(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct {
		ID             uint    `json:"id"`
		TripStatus     string  `json:"tripStatus"` // "Approved", "In Progress", "Completed", "Cancelled"
		ApprovedBy     string  `json:"approvedBy"`
		ActualEndTime  string  `json:"actualEndTime"`
		StartKM        float64 `json:"startKM"`
		EndKM          float64 `json:"endKM"`
		Remarks        string  `json:"remarks"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	var trip Trip
	if err := DB.First(&trip, req.ID).Error; err != nil {
		http.Error(w, "Trip not found", 404); return
	}

	if req.TripStatus == "Approved" {
		if trip.TripStatus != "Pending Approval" {
			http.Error(w, "Invalid transition: Trip can only be approved if it is Pending Approval.", 400)
			return
		}
		trip.TripStatus = req.TripStatus
		trip.ApprovedBy = req.ApprovedBy
		trip.ApprovalStatus = "Approved"
		
		// Set Bus and Driver to Active/Assigned in advance
		DB.Model(&Vehicle{}).Where("number = ?", trip.BusNumber).Update("status", "Active")
		DB.Model(&Driver{}).Where("name = ?", trip.DriverName).Updates(map[string]interface{}{
			"status": "Assigned",
		})

		// Create DriverSchedule entries for all dates in range
		if trip.StartTime != "" && trip.ExpectedEndTime != "" {
			layout := "2006-01-02T15:04"
			startT, err1 := time.Parse(layout, trip.StartTime)
			endT, err2 := time.Parse(layout, trip.ExpectedEndTime)
			if err1 == nil && err2 == nil {
				var driver Driver
				if err := DB.Where("name = ?", trip.DriverName).First(&driver).Error; err == nil {
					// Iterate from start to end by days
					for t := startT; t.Before(endT) || t.Format("2006-01-02") == endT.Format("2006-01-02"); t = t.AddDate(0, 0, 1) {
						dateStr := t.Format("2006-01-02")
						var ds DriverSchedule
						if err := DB.Where("driver_id = ? AND date = ?", driver.ID, dateStr).First(&ds).Error; err != nil {
							ds = DriverSchedule{DriverID: driver.ID, Date: dateStr}
						}
						ds.SpecialPlace = trip.Purpose
						if ds.SpecialPlace == "" {
							ds.SpecialPlace = trip.RouteName
						}
						ds.SpecialOut = startT.Format("15:04")
						ds.SpecialReturn = endT.Format("15:04")
						DB.Save(&ds)
					}
				}
			}
		}
	} else if req.TripStatus == "In Progress" {
		if trip.TripStatus != "Approved" {
			http.Error(w, "Invalid transition: Trip can only be started if it is Approved.", 400)
			return
		}
		if req.StartKM <= 0 {
			http.Error(w, "Validation Error: Start KM is mandatory and must be greater than 0.", 400)
			return
		}
		trip.TripStatus = req.TripStatus
		// Start of trip - Bus is occupied, Driver is on duty
		trip.StartKM = req.StartKM
		DB.Model(&Vehicle{}).Where("number = ?", trip.BusNumber).Updates(map[string]interface{}{
			"status": "Occupied",
			"driver": trip.DriverName,
			"route":  trip.Purpose, // or Place Travelled
		})
		DB.Model(&Driver{}).Where("name = ?", trip.DriverName).Updates(map[string]interface{}{
			"status":      "On Duty",
			"today_bus":   trip.BusNumber,
			"today_route": trip.Purpose,
		})
	} else if req.TripStatus == "Completed" {
		if trip.TripStatus != "In Progress" {
			http.Error(w, "Invalid transition: Trip can only be completed if it is In Progress.", 400)
			return
		}
		if req.EndKM <= 0 {
			http.Error(w, "Validation Error: End KM is mandatory and must be greater than 0.", 400)
			return
		}
		if req.EndKM <= trip.StartKM {
			http.Error(w, "Validation Error: End KM must be greater than Start KM.", 400)
			return
		}
		if req.ActualEndTime == "" {
			http.Error(w, "Validation Error: Completion time is mandatory.", 400)
			return
		}

		trip.TripStatus = req.TripStatus
		trip.ActualEndTime = req.ActualEndTime
		trip.EndKM = req.EndKM
		trip.Distance = req.EndKM - trip.StartKM

		if req.Remarks != "" {
			trip.Remarks = req.Remarks
		}

		// Free up resources
		DB.Model(&Vehicle{}).Where("number = ?", trip.BusNumber).Update("status", "Active")
		DB.Model(&Driver{}).Where("name = ?", trip.DriverName).Update("status", "Present")

		// Update Daily Ops
		var op DailyOp
		if err := DB.Where("date = ?", trip.Date).First(&op).Error; err != nil {
			op = DailyOp{Date: trip.Date, Vehicles: 1, Trips: 1}
			DB.Create(&op)
		} else {
			var uniqueBusesCount int64
			DB.Model(&Trip{}).Where("date = ?", trip.Date).Where("trip_status = ?", "Completed").Distinct("bus_number").Count(&uniqueBusesCount)
			op.Trips++
			op.Vehicles = int(uniqueBusesCount)
			DB.Save(&op)
		}
	} else if req.TripStatus == "Cancelled" {
		if trip.TripStatus != "Pending Approval" {
			http.Error(w, "Invalid transition: Trip can only be cancelled if it is Pending Approval.", 400)
			return
		}
		trip.TripStatus = req.TripStatus
		trip.ApprovalStatus = "Rejected"
		// Free resources if they were booked
		DB.Model(&Vehicle{}).Where("number = ?", trip.BusNumber).Update("status", "Active")
		DB.Model(&Driver{}).Where("name = ?", trip.DriverName).Update("status", "Present")
	}

	DB.Save(&trip)

	var all []Trip
	DB.Order("date desc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func handleDeleteTrip(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct { ID uint `json:"id"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	var trip Trip
	if err := DB.First(&trip, req.ID).Error; err == nil {
		var op DailyOp
		if err2 := DB.Where("date = ?", trip.Date).First(&op).Error; err2 == nil {
			if op.Trips > 0 { op.Trips-- }
			DB.Delete(&trip)
			var uniqueBusesCount int64
			DB.Model(&Trip{}).Where("date = ?", trip.Date).Distinct("bus_number").Count(&uniqueBusesCount)
			op.Vehicles = int(uniqueBusesCount)
			DB.Save(&op)
		} else {
			DB.Delete(&trip)
		}
	}

	var all []Trip
	DB.Order("date desc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func handleAddStudent(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req TransportStudent
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}
	if req.RollNumber == "" || req.Name == "" {
		http.Error(w, "Name and Roll Number are required", 400); return
	}

	var existing TransportStudent
	if err := DB.Where("roll_number = ?", req.RollNumber).First(&existing).Error; err == nil {
		http.Error(w, "Student with this Roll Number is already registered.", 409); return
	}

	if req.Status == "" { req.Status = "Active" }
	if err := DB.Create(&req).Error; err != nil {
		http.Error(w, err.Error(), 500); return
	}

	var all []TransportStudent
	DB.Order("name asc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func handleDeleteStudent(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct { ID uint `json:"id"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	DB.Delete(&TransportStudent{}, req.ID)

	var all []TransportStudent
	DB.Order("name asc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}
