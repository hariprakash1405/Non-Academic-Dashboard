package handlers

import (
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func (h *APIHandler) HandlePowerHouseData(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload models.PowerHousePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	tx := h.DB.Begin()

	// Clear existing static data
	tx.Exec("DELETE FROM ph_transformers")
	tx.Exec("DELETE FROM ph_dg_sets")
	tx.Exec("DELETE FROM ph_ups")
	tx.Exec("DELETE FROM ph_solar_pvs")
	tx.Exec("DELETE FROM ph_staffs")

	// Save static data
	if len(payload.Transformers) > 0 {
		for i := range payload.Transformers {
			payload.Transformers[i].Date = payload.Date
		}
		tx.Create(&payload.Transformers)
	}

	if len(payload.DGSets) > 0 {
		for i := range payload.DGSets {
			payload.DGSets[i].Date = payload.Date
		}
		tx.Create(&payload.DGSets)
	}

	if len(payload.Ups) > 0 {
		for i := range payload.Ups {
			payload.Ups[i].Date = payload.Date
		}
		tx.Create(&payload.Ups)
	}

	if len(payload.SolarPv) > 0 {
		for i := range payload.SolarPv {
			payload.SolarPv[i].Date = payload.Date
		}
		tx.Create(&payload.SolarPv)
	}

	if len(payload.Staff) > 0 {
		for i := range payload.Staff {
			payload.Staff[i].Date = payload.Date
		}
		tx.Create(&payload.Staff)
	}

	// Save dynamic data incrementally (upsert) to prevent collisions
	var allDynamic []models.PhDynamicLog
	for _, l := range payload.EbDynamic {
		l.SourceType = "eb"
		l.Date = payload.Date
		allDynamic = append(allDynamic, l)
	}
	for _, l := range payload.SolarDynamic {
		l.SourceType = "solar"
		l.Date = payload.Date
		allDynamic = append(allDynamic, l)
	}
	for _, l := range payload.DgDynamic {
		l.SourceType = "dg"
		l.Date = payload.Date
		allDynamic = append(allDynamic, l)
	}

	for _, log := range allDynamic {
		if log.Value == "" && log.Generation == "" {
			continue // Skip truly empty slots so we don't accidentally clear others' work if submitted concurrently
		}
		var existing models.PhDynamicLog
		tx.Where("date = ? AND source_type = ? AND hour = ?", log.Date, log.SourceType, log.Hour).First(&existing)
		if existing.ID != 0 {
			existing.Value = log.Value
			existing.Generation = log.Generation
			tx.Save(&existing)
		} else {
			tx.Create(&log)
		}
	}

	for _, l := range payload.FeederDynamic {
		l.Date = payload.Date
		if l.Value == "" {
			continue
		}
		var existing models.PhFeederDynamicLog
		tx.Where("date = ? AND feeder_id = ? AND hour = ?", l.Date, l.FeederID, l.Hour).First(&existing)
		if existing.ID != 0 {
			existing.Value = l.Value
			tx.Save(&existing)
		} else {
			tx.Create(&l)
		}
	}

	// Save Daily Metric
	var metric models.PhDailyMetric
	tx.Where("date = ?", payload.Date).First(&metric)
	metric.Date = payload.Date
	metric.DGFuelUsage = payload.DgDailyFuel

	if metric.ID == 0 {
		tx.Create(&metric)
	} else {
		tx.Save(&metric)
	}

	tx.Commit()

	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) GetPowerHouseData(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	date := r.URL.Query().Get("date")
	
	var payload models.PowerHousePayload
	if date != "" {
		payload.Date = date
		
		// Get daily metric
		var metric models.PhDailyMetric
		h.DB.Where("date = ?", date).First(&metric)
		payload.DgDailyFuel = metric.DGFuelUsage

		// Get dynamic logs for date
		var dynamicLogs []models.PhDynamicLog
		h.DB.Where("date = ?", date).Find(&dynamicLogs)
		
		for _, log := range dynamicLogs {
			if log.SourceType == "eb" {
				payload.EbDynamic = append(payload.EbDynamic, log)
			} else if log.SourceType == "solar" {
				payload.SolarDynamic = append(payload.SolarDynamic, log)
			} else if log.SourceType == "dg" {
				payload.DgDynamic = append(payload.DgDynamic, log)
			}
		}

		var feederLogs []models.PhFeederDynamicLog
		h.DB.Where("date = ?", date).Find(&feederLogs)
		payload.FeederDynamic = feederLogs
	} else {
		// Just get the most recent date's dynamic data if date not provided
		var lastMetric models.PhDailyMetric
		h.DB.Order("date desc").First(&lastMetric)
		payload.Date = lastMetric.Date
		payload.DgDailyFuel = lastMetric.DGFuelUsage

		var dynamicLogs []models.PhDynamicLog
		h.DB.Where("date = ?", lastMetric.Date).Find(&dynamicLogs)
		for _, log := range dynamicLogs {
			if log.SourceType == "eb" {
				payload.EbDynamic = append(payload.EbDynamic, log)
			} else if log.SourceType == "solar" {
				payload.SolarDynamic = append(payload.SolarDynamic, log)
			} else if log.SourceType == "dg" {
				payload.DgDynamic = append(payload.DgDynamic, log)
			}
		}

		var feederLogs []models.PhFeederDynamicLog
		h.DB.Where("date = ?", lastMetric.Date).Find(&feederLogs)
		payload.FeederDynamic = feederLogs
	}

	// Always get static data regardless of date since it's global inventory
	h.DB.Find(&payload.Transformers)
	h.DB.Find(&payload.DGSets)
	h.DB.Find(&payload.Ups)
	h.DB.Find(&payload.SolarPv)
	h.DB.Find(&payload.Staff)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}

type DailyTrendPoint struct {
	Date        string  `json:"date"`
	Consumption float64 `json:"consumption"`
	SolarGen    float64 `json:"solarGen"`
	DGFuel      float64 `json:"dgFuel"`
	PF          float64 `json:"pf"`
	PeakMw      float64 `json:"peakMw"`
}

type MonthTrendPoint struct {
	Month string  `json:"month"`
	Solar float64 `json:"solar"`
	DG    float64 `json:"dg"`
	EB    float64 `json:"eb"`
}

type FeederDailyPoint struct {
	Date  string  `json:"date"`
	Units float64 `json:"units"`
}

type FeederMonthlyPoint struct {
	Month string  `json:"month"`
	Units float64 `json:"units"`
}

type PowerHouseTrendPayload struct {
	Daily         []DailyTrendPoint                   `json:"daily"`
	Monthly       []MonthTrendPoint                   `json:"monthly"`
	FeederDaily   map[string][]FeederDailyPoint   `json:"feederDaily"`
	FeederMonthly map[string][]FeederMonthlyPoint `json:"feederMonthly"`
}

func (h *APIHandler) GetPowerHouseTrendData(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if h.DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	month := r.URL.Query().Get("month") // format "YYYY-MM"
	if month == "" {
		month = time.Now().Format("2006-01")
	}

	// Parse year and month to get number of days
	t, err := time.Parse("2006-01", month)
	if err != nil {
		http.Error(w, "Invalid month format. Expected YYYY-MM", http.StatusBadRequest)
		return
	}

	year, m, _ := t.Date()
	lastDay := time.Date(year, m+1, 0, 0, 0, 0, 0, time.UTC).Day()

	// 1. Initialize daily trend map
	trendMap := make(map[string]*DailyTrendPoint)
	var dailyTrends []DailyTrendPoint

	for day := 1; day <= lastDay; day++ {
		dateStr := fmt.Sprintf("%s-%02d", month, day)
		point := &DailyTrendPoint{
			Date:        dateStr,
			Consumption: 0.0,
			SolarGen:    0.0,
			DGFuel:      0.0,
			PF:          0.98,
			PeakMw:      0.0,
		}
		trendMap[dateStr] = point
	}

	// Fetch dynamic logs for this month
	var dynamicLogs []models.PhDynamicLog
	h.DB.Where("date LIKE ?", month+"-%").Find(&dynamicLogs)

	type hourlyLoad struct {
		eb    float64
		solar float64
		dg    float64
	}
	dayHourlyLoads := make(map[string]map[string]*hourlyLoad)

	for _, log := range dynamicLogs {
		point, exists := trendMap[log.Date]
		if !exists {
			continue
		}

		val := 0.0
		if log.Value != "" {
			fmt.Sscanf(log.Value, "%f", &val)
		}

		if _, ok := dayHourlyLoads[log.Date]; !ok {
			dayHourlyLoads[log.Date] = make(map[string]*hourlyLoad)
		}
		if _, ok := dayHourlyLoads[log.Date][log.Hour]; !ok {
			dayHourlyLoads[log.Date][log.Hour] = &hourlyLoad{}
		}

		if log.SourceType == "eb" {
			point.Consumption += val
			dayHourlyLoads[log.Date][log.Hour].eb = val
		} else if log.SourceType == "solar" {
			genVal := 0.0
			if log.Generation != "" {
				fmt.Sscanf(log.Generation, "%f", &genVal)
			}
			point.SolarGen += genVal
			dayHourlyLoads[log.Date][log.Hour].solar = val
		} else if log.SourceType == "dg" {
			dayHourlyLoads[log.Date][log.Hour].dg = val
		}
	}

	// Calculate Peak MW
	for date, hours := range dayHourlyLoads {
		maxTotal := 0.0
		for _, hl := range hours {
			total := hl.eb + hl.solar + hl.dg
			if total > maxTotal {
				maxTotal = total
			}
		}
		if point, exists := trendMap[date]; exists {
			point.PeakMw = maxTotal / 1000.0
		}
	}

	// Fetch daily metrics (diesel fuel usage) for this month
	var dailyMetrics []models.PhDailyMetric
	h.DB.Where("date LIKE ?", month+"-%").Find(&dailyMetrics)
	for _, dm := range dailyMetrics {
		if point, exists := trendMap[dm.Date]; exists {
			point.DGFuel = dm.DGFuelUsage
		}
	}

	for day := 1; day <= lastDay; day++ {
		dateStr := fmt.Sprintf("%s-%02d", month, day)
		dailyTrends = append(dailyTrends, *trendMap[dateStr])
	}

	// 2. Initialize monthly trend
	monthsName := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}
	monthlyTrends := make([]MonthTrendPoint, 12)
	for i, name := range monthsName {
		monthlyTrends[i] = MonthTrendPoint{
			Month: name,
			Solar: 0.0,
			DG:    0.0,
			EB:    0.0,
		}
	}

	// Fetch all logs for this year
	yearStr := fmt.Sprintf("%d", year)
	var yearlyLogs []models.PhDynamicLog
	h.DB.Where("date LIKE ?", yearStr+"-%").Find(&yearlyLogs)

	for _, log := range yearlyLogs {
		// Parse month index from date string YYYY-MM-DD
		if len(log.Date) >= 7 {
			var logY, logM int
			fmt.Sscanf(log.Date[:7], "%d-%d", &logY, &logM)
			if logM >= 1 && logM <= 12 {
				val := 0.0
				if log.Value != "" {
					fmt.Sscanf(log.Value, "%f", &val)
				}
				if log.SourceType == "eb" {
					monthlyTrends[logM-1].EB += val
				} else if log.SourceType == "solar" {
					monthlyTrends[logM-1].Solar += val
				}
			}
		}
	}

	// Fetch yearly daily metrics for DG fuel usage
	var yearlyMetrics []models.PhDailyMetric
	h.DB.Where("date LIKE ?", yearStr+"-%").Find(&yearlyMetrics)
	for _, ym := range yearlyMetrics {
		if len(ym.Date) >= 7 {
			var logY, logM int
			fmt.Sscanf(ym.Date[:7], "%d-%d", &logY, &logM)
			if logM >= 1 && logM <= 12 {
				monthlyTrends[logM-1].DG += ym.DGFuelUsage
			}
		}
	}

	// 3. Feeder Trends
	feederDaily := make(map[string][]FeederDailyPoint)
	feederMonthly := make(map[string][]FeederMonthlyPoint)

	var feederLogsMonth []models.PhFeederDynamicLog
	h.DB.Where("date LIKE ?", month+"-%").Find(&feederLogsMonth)

	feederDailyMap := make(map[string]map[string]float64)
	for _, l := range feederLogsMonth {
		if feederDailyMap[l.FeederID] == nil {
			feederDailyMap[l.FeederID] = make(map[string]float64)
		}
		val := 0.0
		fmt.Sscanf(l.Value, "%f", &val)
		feederDailyMap[l.FeederID][l.Date] += val
	}

	for fId, dates := range feederDailyMap {
		var points []FeederDailyPoint
		for day := 1; day <= lastDay; day++ {
			dateStr := fmt.Sprintf("%s-%02d", month, day)
			points = append(points, FeederDailyPoint{Date: dateStr, Units: dates[dateStr]})
		}
		feederDaily[fId] = points
	}

	var feederLogsYear []models.PhFeederDynamicLog
	h.DB.Where("date LIKE ?", yearStr+"-%").Find(&feederLogsYear)

	feederMonthlyMap := make(map[string]map[int]float64)
	for _, l := range feederLogsYear {
		if len(l.Date) >= 7 {
			var logY, logM int
			fmt.Sscanf(l.Date[:7], "%d-%d", &logY, &logM)
			if logM >= 1 && logM <= 12 {
				if feederMonthlyMap[l.FeederID] == nil {
					feederMonthlyMap[l.FeederID] = make(map[int]float64)
				}
				val := 0.0
				fmt.Sscanf(l.Value, "%f", &val)
				feederMonthlyMap[l.FeederID][logM] += val
			}
		}
	}

	for fId, months := range feederMonthlyMap {
		var points []FeederMonthlyPoint
		for i, name := range monthsName {
			points = append(points, FeederMonthlyPoint{Month: name, Units: months[i+1]})
		}
		feederMonthly[fId] = points
	}

	payload := PowerHouseTrendPayload{
		Daily:         dailyTrends,
		Monthly:       monthlyTrends,
		FeederDaily:   feederDaily,
		FeederMonthly: feederMonthly,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}
