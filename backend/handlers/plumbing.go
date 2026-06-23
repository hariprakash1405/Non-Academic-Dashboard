package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"backend/models"
)

func (h *APIHandler) GetPlumbing(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	PlumbingCache.mu.RLock()
	if time.Since(PlumbingCache.lastUpdate) < PlumbingCache.ttl && PlumbingCache.data != nil {
		PlumbingCache.mu.RUnlock()
		w.Header().Set("Content-Type", "application/json")
		w.Write(PlumbingCache.data)
		return
	}
	PlumbingCache.mu.RUnlock()


	

	var motors []models.PlumbingMotor
	var sumps []models.PlumbingSump
	var ohts []models.PlumbingOHT
	var manpower []models.PlumbingManpower
	var runtimes []models.PlumbingRuntimeLog
	var riverIntakes []models.PlumbingRiverIntakeLog
	var borewells []models.PlumbingBorewell
	var wells []models.PlumbingWell

	h.DB.Find(&motors)
	h.DB.Find(&sumps)
	h.DB.Find(&ohts)
	h.DB.Find(&manpower)
	h.DB.Find(&runtimes)
	h.DB.Find(&riverIntakes)
	h.DB.Find(&borewells)
	h.DB.Find(&wells)

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

	payload := map[string]interface{}{
		"motors":       motors,
		"sumps":        sumps,
		"ohts":         ohts,
		"manpower":     manpower,
		"runtimes":     runtimes,
		"riverIntakes": riverIntakes,
		"borewells":    borewells,
		"wells":        wells,
	}
	jsonData, err := json.Marshal(payload)
	if err == nil {
		PlumbingCache.mu.Lock()
		PlumbingCache.data = jsonData
		PlumbingCache.lastUpdate = time.Now()
		PlumbingCache.mu.Unlock()
	}

	w.Header().Set("Content-Type", "application/json")
	if err == nil {
		w.Write(jsonData)
	} else {
		json.NewEncoder(w).Encode(payload)
	}
}

func (h *APIHandler) AddPlumbingMotors(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var data []models.PlumbingMotor
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			h.DB.Save(&v)
		}
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) DeletePlumbingMotor(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	id := r.URL.Query().Get("id")
	if id != "" {
		h.DB.Delete(&models.PlumbingMotor{}, id)
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) AddPlumbingSumps(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var data []models.PlumbingSump
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			h.DB.Save(&v)
		}
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) DeletePlumbingSump(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	id := r.URL.Query().Get("id")
	if id != "" {
		h.DB.Delete(&models.PlumbingSump{}, id)
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) AddPlumbingOHTs(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var data []models.PlumbingOHT
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			h.DB.Save(&v)
		}
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) DeletePlumbingOHT(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	id := r.URL.Query().Get("id")
	if id != "" {
		h.DB.Delete(&models.PlumbingOHT{}, id)
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) AddPlumbingManpower(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var data []models.PlumbingManpower
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			h.DB.Save(&v)
		}
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) DeletePlumbingManpower(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	id := r.URL.Query().Get("id")
	if id != "" {
		h.DB.Delete(&models.PlumbingManpower{}, id)
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) AddPlumbingRuntime(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var data []models.PlumbingRuntimeLog
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			var existing models.PlumbingRuntimeLog
			if h.DB.Where("date = ? AND motor_id = ?", v.Date, v.MotorID).First(&existing).Error == nil {
				existing.PeakRun = v.PeakRun
				existing.OffPeakRun = v.OffPeakRun
				existing.NightRun = v.NightRun
				existing.S1 = v.S1
				existing.S2 = v.S2
				existing.S3 = v.S3
				existing.S4 = v.S4
				h.DB.Save(&existing)
			} else {
				h.DB.Create(&v)
			}
		}
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) Plumbing() {
}

func (h *APIHandler) AddPlumbingRiverIntake(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()

	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var data []models.PlumbingRiverIntakeLog
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			var existing models.PlumbingRiverIntakeLog
			if h.DB.Where("date = ?", v.Date).First(&existing).Error == nil {
				existing.Intake = v.Intake
				existing.Borewell = v.Borewell
				existing.Well = v.Well
				existing.Remarks = v.Remarks
				h.DB.Save(&existing)
			} else {
				v.ID = 0
				h.DB.Save(&v)
			}
		}
	} else {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) AddPlumbingBorewell(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var data []models.PlumbingBorewell
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			h.DB.Save(&v)
		}
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) DeletePlumbingBorewell(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	id := r.URL.Query().Get("id")
	if id != "" {
		h.DB.Delete(&models.PlumbingBorewell{}, id)
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) AddPlumbingWell(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var data []models.PlumbingWell
	if err := json.NewDecoder(r.Body).Decode(&data); err == nil {
		for _, v := range data {
			h.DB.Save(&v)
		}
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) DeletePlumbingWell(w http.ResponseWriter, r *http.Request) {
	PlumbingCache.mu.Lock()
	PlumbingCache.data = nil
	PlumbingCache.mu.Unlock()
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	id := r.URL.Query().Get("id")
	if id != "" {
		h.DB.Delete(&models.PlumbingWell{}, id)
	}
	w.WriteHeader(http.StatusOK)
}
