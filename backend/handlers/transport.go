package handlers

import (
	"fmt"
	"backend/models"
	"encoding/json"
	"net/http"
	"time"
	
)

// ─── MODELS ───────────────────────────────────────────────────────────────────

























// ─── SEED ─────────────────────────────────────────────────────────────────────

func (h *APIHandler) Transport() {
	fmt.Println("Transport seed cleared. Ready for user data entry.")
}

// ─── RESPONSE PAYLOAD ─────────────────────────────────────────────────────────



// ─── HANDLERS ─────────────────────────────────────────────────────────────────

func (h *APIHandler) GetTransport(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" { return }

	TransportCache.mu.RLock()
	if time.Since(TransportCache.lastUpdate) < TransportCache.ttl && TransportCache.data != nil {
		TransportCache.mu.RUnlock()
		w.Header().Set("Content-Type", "application/json")
		w.Write(TransportCache.data)
		return
	}
	TransportCache.mu.RUnlock()


	

	var payload models.TransportPayload
	h.DB.Preload("models.MileageTrend").Find(&payload.Vehicles)
	h.DB.Preload("Schedule").Find(&payload.Drivers)
	h.DB.Order("date asc").Find(&payload.DailyOps)
	h.DB.Order("date desc").Find(&payload.FuelLogs)
	h.DB.Order("date desc").Find(&payload.RouteTrips)
	h.DB.Find(&payload.GPS)
	h.DB.Order("service_date desc").Find(&payload.Maintenance)
	h.DB.Order("incident_date desc").Find(&payload.Breakdowns)
	h.DB.Order("date desc").Find(&payload.Trips)
	h.DB.Order("name asc").Find(&payload.Students)

	
	


	jsonData, err := json.Marshal(payload)
	if err == nil {
		TransportCache.mu.Lock()
		TransportCache.data = jsonData
		TransportCache.lastUpdate = time.Now()
		TransportCache.mu.Unlock()
	}

	w.Header().Set("Content-Type", "application/json")
	if err == nil {
		w.Write(jsonData)
	} else {
		json.NewEncoder(w).Encode(payload)
	}
}

func (h *APIHandler) UpdateDriverStatus(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
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

	var driver models.Driver
	if err := h.DB.First(&driver, req.ID).Error; err != nil {
		http.Error(w, "models.Driver not found", 404); return
	}
	if req.Status != "" { driver.Status = req.Status }
	h.DB.Save(&driver)

	todayStr := time.Now().Format("2006-01-02")
	var sched models.DriverSchedule
	if err := h.DB.Where("driver_id = ? AND date = ?", req.ID, todayStr).First(&sched).Error; err != nil {
		sched = models.DriverSchedule{DriverID: req.ID, Date: todayStr}
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
		h.DB.Create(&sched)
	} else {
		h.DB.Save(&sched)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(driver)
}

func (h *APIHandler) UpdateVehicleStatus(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
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

	var vehicle models.Vehicle
	if err := h.DB.Where("number = ?", req.Number).First(&vehicle).Error; err != nil {
		http.Error(w, "models.Vehicle not found", 404); return
	}
	if req.Status != "" { vehicle.Status = req.Status }
	if req.Route != "" { vehicle.Route = req.Route }
	if req.Driver != "" { vehicle.Driver = req.Driver }
	h.DB.Save(&vehicle)

	// Sync vehicle info back to driver
	if vehicle.Driver != "" {
		h.DB.Model(&models.Driver{}).Where("name = ?", vehicle.Driver).Updates(map[string]interface{}{
			"today_bus":   vehicle.Number,
			"today_route": vehicle.Route,
			"status":      "Present",
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vehicle)
}

func (h *APIHandler) EditVehicle(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req models.Vehicle
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	var vehicle models.Vehicle
	if err := h.DB.Where("number = ?", req.Number).First(&vehicle).Error; err != nil {
		http.Error(w, "models.Vehicle not found", 404); return
	}

	vehicle.BusNo = req.BusNo
	vehicle.Type = req.Type
	vehicle.Status = req.Status
	vehicle.MileageKmpl = req.MileageKmpl
	vehicle.Route = req.Route
	vehicle.Driver = req.Driver
	vehicle.LastFC = req.LastFC
	vehicle.NextFC = req.NextFC

	h.DB.Save(&vehicle)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vehicle)
}

func (h *APIHandler) AddFuelLog(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct {
Vehicle string  `json:"vehicle"`
		Date         string  `json:"date"`
		Litres       float64 `json:"litres"`
		Odometer     float64 `json:"odometer"`
		PrevOdometer float64 `json:"prevOdometer"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	fuelLog := models.FuelLog{
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
		var prevLog models.FuelLog
		err := h.DB.Where("vehicle = ?", req.Vehicle).Order("date desc, id desc").First(&prevLog).Error
		if err == nil && prevLog.Odometer > 0 && req.Odometer > prevLog.Odometer {
			fuelLog.KMDriven = req.Odometer - prevLog.Odometer
			if req.Litres > 0 {
				fuelLog.Mileage = fuelLog.KMDriven / req.Litres
			}
		}
	}

	h.DB.Create(&fuelLog)

	// Calculate and insert/update mileage trend
	if req.Litres > 0 && fuelLog.KMDriven > 0 {
		kpi := fuelLog.KMDriven / req.Litres
		h.DB.Create(&models.MileageTrend{
			VehicleNumber: req.Vehicle,
			Day:           req.Date,
			KPI:           kpi,
		})
	}

	var all []models.FuelLog
	h.DB.Order("date desc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func (h *APIHandler) AddMaintenance(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req models.VehicleMaintenance
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}
	if req.Vehicle == "" || req.Service == "" {
		http.Error(w, "models.Vehicle and service are required", 400); return
	}
	if req.ServiceDate == "" {
		req.ServiceDate = time.Now().Format("2006-01-02")
	}
	if req.Status == "" { req.Status = "Pending" }
	h.DB.Create(&req)

	var all []models.VehicleMaintenance
	h.DB.Order("service_date desc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func (h *APIHandler) UpdateMaintenanceStatus(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct {
		ID     uint   `json:"id"`
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	h.DB.Model(&models.VehicleMaintenance{}).Where("id = ?", req.ID).Update("status", req.Status)

	var all []models.VehicleMaintenance
	h.DB.Order("service_date desc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func (h *APIHandler) UpdateGPSStatus(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct {
Vehicle string `json:"vehicle"`
		Status   string `json:"status"`
		LastPing string `json:"lastPing"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	h.DB.Model(&models.GPSDevice{}).Where("vehicle = ?", req.Vehicle).Updates(map[string]interface{}{
		"status":    req.Status,
		"last_ping": req.LastPing,
	})

	var all []models.GPSDevice
	h.DB.Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func (h *APIHandler) AddVehicle(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct {
		Number      string  `json:"number"`
		BusNo       string  `json:"busNo"`
		Type        string  `json:"type"`
		Status      string  `json:"status"`
		MileageKmpl float64 `json:"mileageKmpl"`
		Route       string  `json:"route"`
Driver string  `json:"driver"`
		LastFC      string  `json:"lastFC"`
		NextFC      string  `json:"nextFC"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}
	if req.Number == "" || req.Type == "" {
		http.Error(w, "models.Vehicle number and type are required", 400); return
	}

	// Duplicate check
	var existing models.Vehicle
	if err := h.DB.Where("number = ?", req.Number).First(&existing).Error; err == nil {
		http.Error(w, "models.Vehicle number already exists", 409); return
	}

	v := models.Vehicle{
		Number: req.Number, BusNo: req.BusNo, Type: req.Type, Status: req.Status,
		MileageKmpl: req.MileageKmpl, Route: req.Route, Driver: req.Driver,
		LastFC: req.LastFC, NextFC: req.NextFC,
	}
	if v.Status == "" { v.Status = "Active" }
	h.DB.Create(&v)

	// Also create a blank GPS entry for new vehicle
	h.DB.Create(&models.GPSDevice{Vehicle: v.Number, Status: "Inactive", LastPing: "Never", Provider: "Unassigned"})

	var all []models.Vehicle
	h.DB.Preload("models.MileageTrend").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func (h *APIHandler) AddDriver(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
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
		http.Error(w, "models.Driver name is required", 400); return
	}

	// Duplicate check
	var existing models.Driver
	if err := h.DB.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		http.Error(w, "models.Driver with this name already exists", 409); return
	}

	if req.Status == "" { req.Status = "Present" }
	if req.TodayBus == "" { req.TodayBus = "N/A" }
	if req.TodayRoute == "" { req.TodayRoute = "Free Today" }
	if req.ImgURL == "" { req.ImgURL = "https://i.pravatar.cc/150?u=" + req.Name }

	d := models.Driver{Name: req.Name, ImgURL: req.ImgURL, Status: req.Status, TodayBus: req.TodayBus, TodayRoute: req.TodayRoute}
	h.DB.Create(&d)

	var all []models.Driver
	h.DB.Preload("Schedule").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func (h *APIHandler) DeleteVehicle(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct { Number string `json:"number"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}
	if req.Number == "" { http.Error(w, "Number required", 400); return }

	h.DB.Where("vehicle_number = ?", req.Number).Delete(&models.MileageTrend{})
	h.DB.Where("vehicle = ?", req.Number).Delete(&models.FuelLog{})
	h.DB.Where("vehicle = ?", req.Number).Delete(&models.GPSDevice{})
	h.DB.Where("vehicle = ?", req.Number).Delete(&models.VehicleMaintenance{})
	h.DB.Where("number = ?", req.Number).Delete(&models.Vehicle{})

	var all []models.Vehicle
	h.DB.Preload("models.MileageTrend").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func (h *APIHandler) DeleteDriver(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct { ID uint `json:"id"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}
	if req.ID == 0 { http.Error(w, "ID required", 400); return }

	h.DB.Where("driver_id = ?", req.ID).Delete(&models.DriverSchedule{})
	h.DB.Delete(&models.Driver{}, req.ID)

	var all []models.Driver
	h.DB.Preload("Schedule").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func (h *APIHandler) AddTrip(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req models.Trip
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	// 1. Validation: Date + Bus Number + models.Trip Type uniqueness (only for non-Special trips)
	if req.TripType != "Special" {
		var existing models.Trip
		if err := h.DB.Where("bus_number = ? AND date = ? AND trip_type = ?", req.BusNumber, req.Date, req.TripType).First(&existing).Error; err == nil {
			http.Error(w, fmt.Sprintf("Duplicate Trip: A %s trip for bus %s on %s already exists.", req.TripType, req.BusNumber, req.Date), 409); return
		}

		// 2. Validation: End KM > Start KM (only for non-Special trips or if they provided it)
		if req.EndKM <= req.StartKM && req.EndKM != 0 {
			http.Error(w, "Validation Error: End KM must be greater than Start KM.", 400); return
		}

		// 3. Validation: models.Driver availability conflict
		var driverConflict models.Trip
		if err := h.DB.Where("driver_name = ? AND date = ? AND trip_type = ?", req.DriverName, req.Date, req.TripType).First(&driverConflict).Error; err == nil {
			http.Error(w, fmt.Sprintf("models.Driver Conflict: models.Driver %s is already assigned to bus %s for the %s trip on this date.", req.DriverName, driverConflict.BusNumber, req.TripType), 409); return
		}
	} else {
		// Special models.Trip Validation
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

	// Save models.Trip
	if err := h.DB.Create(&req).Error; err != nil {
		http.Error(w, err.Error(), 500); return
	}

	// 4. Auto-sync models.Driver and models.Vehicle (Only for normal trips or when Special trip completes)
	if req.TripType != "Special" {
	if req.BusNumber != "" && req.DriverName != "" {
		h.DB.Model(&models.Vehicle{}).Where("number = ?", req.BusNumber).Updates(map[string]interface{}{
			"driver": req.DriverName,
			"route":  req.RouteName,
		})
		h.DB.Model(&models.Driver{}).Where("name = ?", req.DriverName).Updates(map[string]interface{}{
			"today_bus":   req.BusNumber,
			"today_route": req.RouteName,
			"status":      "Present",
		})
		
		// Update models.DriverSchedule
		var driver models.Driver
		if err := h.DB.Where("name = ?", req.DriverName).First(&driver).Error; err == nil {
			var ds models.DriverSchedule
			if err := h.DB.Where("driver_id = ? AND date = ?", driver.ID, req.Date).First(&ds).Error; err != nil {
				ds = models.DriverSchedule{DriverID: driver.ID, Date: req.Date}
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
			h.DB.Save(&ds)
		}
	}

	// Increment daily ops
	var op models.DailyOp
	if err := h.DB.Where("date = ?", req.Date).First(&op).Error; err != nil {
		op = models.DailyOp{Date: req.Date, Vehicles: 1, Trips: 1}
		h.DB.Create(&op)
	} else {
		var uniqueBusesCount int64
		h.DB.Model(&models.Trip{}).Where("date = ?", req.Date).Distinct("bus_number").Count(&uniqueBusesCount)
		op.Trips++
		op.Vehicles = int(uniqueBusesCount)
		h.DB.Save(&op)
	}
	}

	var all []models.Trip
	h.DB.Order("date desc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func (h *APIHandler) UpdateTripStatus(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
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

	var trip models.Trip
	if err := h.DB.First(&trip, req.ID).Error; err != nil {
		http.Error(w, "models.Trip not found", 404); return
	}

	if req.TripStatus == "Approved" {
		if trip.TripStatus != "Pending Approval" {
			http.Error(w, "Invalid transition: models.Trip can only be approved if it is Pending Approval.", 400)
			return
		}
		trip.TripStatus = req.TripStatus
		trip.ApprovedBy = req.ApprovedBy
		trip.ApprovalStatus = "Approved"
		
		// Set Bus and models.Driver to Active/Assigned in advance
		h.DB.Model(&models.Vehicle{}).Where("number = ?", trip.BusNumber).Update("status", "Active")
		h.DB.Model(&models.Driver{}).Where("name = ?", trip.DriverName).Updates(map[string]interface{}{
			"status": "Assigned",
		})

		// Create models.DriverSchedule entries for all dates in range
		if trip.StartTime != "" && trip.ExpectedEndTime != "" {
			layout := "2006-01-02T15:04"
			startT, err1 := time.Parse(layout, trip.StartTime)
			endT, err2 := time.Parse(layout, trip.ExpectedEndTime)
			if err1 == nil && err2 == nil {
				var driver models.Driver
				if err := h.DB.Where("name = ?", trip.DriverName).First(&driver).Error; err == nil {
					// Iterate from start to end by days
					for t := startT; t.Before(endT) || t.Format("2006-01-02") == endT.Format("2006-01-02"); t = t.AddDate(0, 0, 1) {
						dateStr := t.Format("2006-01-02")
						var ds models.DriverSchedule
						if err := h.DB.Where("driver_id = ? AND date = ?", driver.ID, dateStr).First(&ds).Error; err != nil {
							ds = models.DriverSchedule{DriverID: driver.ID, Date: dateStr}
						}
						ds.SpecialPlace = trip.Purpose
						if ds.SpecialPlace == "" {
							ds.SpecialPlace = trip.RouteName
						}
						ds.SpecialOut = startT.Format("15:04")
						ds.SpecialReturn = endT.Format("15:04")
						h.DB.Save(&ds)
					}
				}
			}
		}
	} else if req.TripStatus == "In Progress" {
		if trip.TripStatus != "Approved" {
			http.Error(w, "Invalid transition: models.Trip can only be started if it is Approved.", 400)
			return
		}
		if req.StartKM <= 0 {
			http.Error(w, "Validation Error: Start KM is mandatory and must be greater than 0.", 400)
			return
		}
		trip.TripStatus = req.TripStatus
		// Start of trip - Bus is occupied, models.Driver is on duty
		trip.StartKM = req.StartKM
		h.DB.Model(&models.Vehicle{}).Where("number = ?", trip.BusNumber).Updates(map[string]interface{}{
			"status": "Occupied",
			"driver": trip.DriverName,
			"route":  trip.Purpose, // or Place Travelled
		})
		h.DB.Model(&models.Driver{}).Where("name = ?", trip.DriverName).Updates(map[string]interface{}{
			"status":      "On Duty",
			"today_bus":   trip.BusNumber,
			"today_route": trip.Purpose,
		})
	} else if req.TripStatus == "Completed" {
		if trip.TripStatus != "In Progress" {
			http.Error(w, "Invalid transition: models.Trip can only be completed if it is In Progress.", 400)
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
		h.DB.Model(&models.Vehicle{}).Where("number = ?", trip.BusNumber).Update("status", "Active")
		h.DB.Model(&models.Driver{}).Where("name = ?", trip.DriverName).Update("status", "Present")

		// Update Daily Ops
		var op models.DailyOp
		if err := h.DB.Where("date = ?", trip.Date).First(&op).Error; err != nil {
			op = models.DailyOp{Date: trip.Date, Vehicles: 1, Trips: 1}
			h.DB.Create(&op)
		} else {
			var uniqueBusesCount int64
			h.DB.Model(&models.Trip{}).Where("date = ?", trip.Date).Where("trip_status = ?", "Completed").Distinct("bus_number").Count(&uniqueBusesCount)
			op.Trips++
			op.Vehicles = int(uniqueBusesCount)
			h.DB.Save(&op)
		}
	} else if req.TripStatus == "Cancelled" {
		if trip.TripStatus != "Pending Approval" {
			http.Error(w, "Invalid transition: models.Trip can only be cancelled if it is Pending Approval.", 400)
			return
		}
		trip.TripStatus = req.TripStatus
		trip.ApprovalStatus = "Rejected"
		// Free resources if they were booked
		h.DB.Model(&models.Vehicle{}).Where("number = ?", trip.BusNumber).Update("status", "Active")
		h.DB.Model(&models.Driver{}).Where("name = ?", trip.DriverName).Update("status", "Present")
	}

	h.DB.Save(&trip)

	var all []models.Trip
	h.DB.Order("date desc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func (h *APIHandler) DeleteTrip(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct { ID uint `json:"id"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	var trip models.Trip
	if err := h.DB.First(&trip, req.ID).Error; err == nil {
		var op models.DailyOp
		if err2 := h.DB.Where("date = ?", trip.Date).First(&op).Error; err2 == nil {
			if op.Trips > 0 { op.Trips-- }
			h.DB.Delete(&trip)
			var uniqueBusesCount int64
			h.DB.Model(&models.Trip{}).Where("date = ?", trip.Date).Distinct("bus_number").Count(&uniqueBusesCount)
			op.Vehicles = int(uniqueBusesCount)
			h.DB.Save(&op)
		} else {
			h.DB.Delete(&trip)
		}
	}

	var all []models.Trip
	h.DB.Order("date desc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func (h *APIHandler) AddStudent(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req models.TransportStudent
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}
	if req.RollNumber == "" || req.Name == "" {
		http.Error(w, "Name and Roll Number are required", 400); return
	}

	var existing models.TransportStudent
	if err := h.DB.Where("roll_number = ?", req.RollNumber).First(&existing).Error; err == nil {
		http.Error(w, "Student with this Roll Number is already registered.", 409); return
	}

	if req.Status == "" { req.Status = "Active" }
	if err := h.DB.Create(&req).Error; err != nil {
		http.Error(w, err.Error(), 500); return
	}

	var all []models.TransportStudent
	h.DB.Order("name asc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}

func (h *APIHandler) DeleteStudent(w http.ResponseWriter, r *http.Request) {
	TransportCache.mu.Lock()
	TransportCache.data = nil
	TransportCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" { return }
	if r.Method != "POST" { http.Error(w, "Method not allowed", 405); return }

	var req struct { ID uint `json:"id"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400); return
	}

	h.DB.Delete(&models.TransportStudent{}, req.ID)

	var all []models.TransportStudent
	h.DB.Order("name asc").Find(&all)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
}
