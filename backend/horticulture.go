package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// --- Models ---

type HorticulturePlant struct {
	ID             string                  `gorm:"primaryKey" json:"id"`
	Name           string                  `json:"name"`
	ScientificName string                  `json:"scientificName"`
	Category       string                  `json:"category"` // "Tree", "Flowering Plant", "Medicinal Plant", "Shrub", "Lawn Plant", "Indoor Plant", etc.
	Age            string                  `json:"age"`      // e.g. "3 Years"
	Quantity       int                     `json:"quantity"` // Cached sum of quantities across locations
	DatePlanted    string                  `json:"datePlanted"` // e.g. "2024-03-12"
	Status         string                  `json:"status"`      // "Healthy", "Needs Attention", "Diseased", "Removed"
	ImageURL       string                  `json:"imageUrl"`    // Image path or URL
	Remarks        string                  `json:"remarks"`
	Locations      []PlantLocationQuantity `gorm:"foreignKey:PlantID;constraint:OnDelete:CASCADE" json:"locations"`
	Maintenance    []HorticultureMaint     `gorm:"foreignKey:PlantID;constraint:OnDelete:CASCADE" json:"maintenance"`
}

type HorticultureLocation struct {
	Name        string `gorm:"primaryKey" json:"name"`
	Description string `json:"description"`
}

type PlantLocationQuantity struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	PlantID      string `gorm:"uniqueIndex:idx_plant_loc" json:"plantId"`
	LocationName string `gorm:"uniqueIndex:idx_plant_loc" json:"locationName"`
	Quantity     int    `json:"quantity"`
}

type HorticultureMaint struct {
	ID                     uint   `gorm:"primaryKey" json:"id"`
	PlantID                string `gorm:"uniqueIndex:idx_plant_maint_loc" json:"plantId"`
	LocationName           string `gorm:"uniqueIndex:idx_plant_maint_loc" json:"locationName"`
	WateringSchedule       string `json:"wateringSchedule"`
	FertilizerSchedule     string `json:"fertilizerSchedule"`
	PruningSchedule        string `json:"pruningSchedule"`
	PestControlSchedule    string `json:"pestControlSchedule"`
	LastMaintenanceDate    string `json:"lastMaintenanceDate"`
	NextMaintenanceDueDate string `json:"nextMaintenanceDueDate"`
	AssignedStaff          string `json:"assignedStaff"`
}

// --- Handlers ---

func handleGetHorticulture(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	if DB == nil {
		http.Error(w, "Database not connected", http.StatusInternalServerError)
		return
	}

	var plants []HorticulturePlant
	DB.Preload("Locations").Preload("Maintenance").Find(&plants)

	// Ensure Quantity is correctly summed up from locations
	for i := range plants {
		sum := 0
		for _, loc := range plants[i].Locations {
			sum += loc.Quantity
		}
		if plants[i].Quantity != sum {
			plants[i].Quantity = sum
			DB.Model(&HorticulturePlant{}).Where("id = ?", plants[i].ID).Update("quantity", sum)
		}
	}

	var locations []HorticultureLocation
	DB.Find(&locations)

	var plantLocs []PlantLocationQuantity
	DB.Find(&plantLocs)

	var maints []HorticultureMaint
	DB.Find(&maints)

	response := map[string]interface{}{
		"plants":      plants,
		"locations":   locations,
		"plantLocs":   plantLocs,
		"maintenance": maints,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleAddLocation(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input HorticultureLocation
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		http.Error(w, "Location Name is required", http.StatusBadRequest)
		return
	}

	if err := DB.Clauses(clause.OnConflict{UpdateAll: true}).Create(&input).Error; err != nil {
		http.Error(w, "Failed to save location: "+err.Error(), http.StatusInternalServerError)
		return
	}

	handleGetHorticulture(w, r)
}

func handleDeleteLocation(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := DB.Transaction(func(tx *gorm.DB) error {
		// Delete plant location links
		if err := tx.Where("location_name = ?", input.Name).Delete(&PlantLocationQuantity{}).Error; err != nil {
			return err
		}
		// Delete maintenance
		if err := tx.Where("location_name = ?", input.Name).Delete(&HorticultureMaint{}).Error; err != nil {
			return err
		}
		// Delete location
		if err := tx.Where("name = ?", input.Name).Delete(&HorticultureLocation{}).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		http.Error(w, "Failed to delete location: "+err.Error(), http.StatusInternalServerError)
		return
	}

	handleGetHorticulture(w, r)
}

func handleAddOrUpdatePlant(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input HorticulturePlant
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.ID == "" {
		input.ID = fmt.Sprintf("HRT-%d", time.Now().UnixNano()/1e6%100000)
	}

	if input.Name == "" || input.Category == "" {
		http.Error(w, "Name and Category are required", http.StatusBadRequest)
		return
	}

	// Calculate total quantity from locations
	totalQty := 0
	for _, loc := range input.Locations {
		totalQty += loc.Quantity
	}
	input.Quantity = totalQty

	err := DB.Transaction(func(tx *gorm.DB) error {
		// Save plant info
		if err := tx.Clauses(clause.OnConflict{UpdateAll: true}).Create(&input).Error; err != nil {
			return err
		}

		// Delete old location links to replace with new ones
		if err := tx.Where("plant_id = ?", input.ID).Delete(&PlantLocationQuantity{}).Error; err != nil {
			return err
		}

		// Save locations
		for _, loc := range input.Locations {
			loc.PlantID = input.ID
			if err := tx.Clauses(clause.OnConflict{UpdateAll: true}).Create(&loc).Error; err != nil {
				return err
			}
		}

		// Save maintenance schedules if provided
		for _, maint := range input.Maintenance {
			maint.PlantID = input.ID
			if err := tx.Clauses(clause.OnConflict{UpdateAll: true}).Create(&maint).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		http.Error(w, "Failed to save plant species: "+err.Error(), http.StatusInternalServerError)
		return
	}

	handleGetHorticulture(w, r)
}

func handleDeletePlant(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("plant_id = ?", input.ID).Delete(&PlantLocationQuantity{}).Error; err != nil {
			return err
		}
		if err := tx.Where("plant_id = ?", input.ID).Delete(&HorticultureMaint{}).Error; err != nil {
			return err
		}
		if err := tx.Where("id = ?", input.ID).Delete(&HorticulturePlant{}).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		http.Error(w, "Failed to delete plant: "+err.Error(), http.StatusInternalServerError)
		return
	}

	handleGetHorticulture(w, r)
}

func handleUpdateMaintenance(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input HorticultureMaint
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.PlantID == "" || input.LocationName == "" {
		http.Error(w, "PlantID and LocationName are required", http.StatusBadRequest)
		return
	}

	if err := DB.Clauses(clause.OnConflict{UpdateAll: true}).Create(&input).Error; err != nil {
		http.Error(w, "Failed to save maintenance info: "+err.Error(), http.StatusInternalServerError)
		return
	}

	handleGetHorticulture(w, r)
}

func seedHorticulture() {
	var count int64
	DB.Model(&HorticultureLocation{}).Count(&count)
	if count == 0 {
		locations := []HorticultureLocation{
			{Name: "Main Entrance", Description: "Primary gateway and front garden landscaping"},
			{Name: "Academic Blocks", Description: "Courtyards and indoor corridors of teaching buildings"},
			{Name: "Hostel Areas", Description: "Surrounding residential quarters and lawns"},
			{Name: "Playground", Description: "Sports fields periphery and open space lines"},
			{Name: "Parking Area", Description: "Shady trees lining vehicular parking grids"},
			{Name: "Garden Zones", Description: "Central botanical park and themed gardens"},
			{Name: "Temple Area", Description: "Spiritual sanctuary gardens and floral borders"},
			{Name: "Administrative Block", Description: "Main admin building frontage and lobby"},
			{Name: "Staff Quarters", Description: "Residential gardens for university employees"},
		}
		DB.Create(&locations)
	}

	DB.Model(&HorticulturePlant{}).Count(&count)
	if count == 0 {
		// Seed Plants
		plants := []HorticulturePlant{
			{
				ID:             "HRT-10001",
				Name:           "Mango Tree",
				ScientificName: "Mangifera indica",
				Category:       "Tree",
				Age:            "5 Years",
				Quantity:       45,
				DatePlanted:    "2021-06-15",
				Status:         "Healthy",
				ImageURL:       "",
				Remarks:        "Bearing fruits during summer. Needs periodic checks for stem borer.",
			},
			{
				ID:             "HRT-10002",
				Name:           "Neem Tree",
				ScientificName: "Azadirachta indica",
				Category:       "Tree",
				Age:            "10 Years",
				Quantity:       23,
				DatePlanted:    "2016-08-20",
				Status:         "Healthy",
				ImageURL:       "",
				Remarks:        "Provides excellent shade. Highly resistant to pests.",
			},
			{
				ID:             "HRT-10003",
				Name:           "Aloe Vera",
				ScientificName: "Aloe barbadensis miller",
				Category:       "Medicinal Plant",
				Age:            "1 Year",
				Quantity:       80,
				DatePlanted:    "2025-05-10",
				Status:         "Healthy",
				ImageURL:       "",
				Remarks:        "Low watering required. Fast propagating succulent.",
			},
			{
				ID:             "HRT-10004",
				Name:           "Red Rose",
				ScientificName: "Rosa",
				Category:       "Flowering Plant",
				Age:            "8 Months",
				Quantity:       120,
				DatePlanted:    "2025-10-05",
				Status:         "Needs Attention",
				ImageURL:       "",
				Remarks:        "Requires pruning and fertilizer application. Mildew signs on leaves.",
			},
			{
				ID:             "HRT-10005",
				Name:           "Tulsi",
				ScientificName: "Ocimum sanctum",
				Category:       "Medicinal Plant",
				Age:            "1.5 Years",
				Quantity:       60,
				DatePlanted:    "2024-11-12",
				Status:         "Healthy",
				ImageURL:       "",
				Remarks:        "Sacred basil. High religious and therapeutic value.",
			},
			{
				ID:             "HRT-10006",
				Name:           "Bougainvillea",
				ScientificName: "Bougainvillea spectabilis",
				Category:       "Shrub",
				Age:            "2 Years",
				Quantity:       75,
				DatePlanted:    "2024-04-18",
				Status:         "Healthy",
				ImageURL:       "",
				Remarks:        "Vibrant pink flowers. Excellent for compound borders.",
			},
			{
				ID:             "HRT-10007",
				Name:           "Hibiscus",
				ScientificName: "Hibiscus rosa-sinensis",
				Category:       "Flowering Plant",
				Age:            "2 Years",
				Quantity:       40,
				DatePlanted:    "2024-05-30",
				Status:         "Diseased",
				ImageURL:       "",
				Remarks:        "Mealybug infestation noticed. Treated with neem oil.",
			},
			{
				ID:             "HRT-10008",
				Name:           "Golden Pothos (Money Plant)",
				ScientificName: "Epipremnum aureum",
				Category:       "Indoor Plant",
				Age:            "6 Months",
				Quantity:       35,
				DatePlanted:    "2025-12-01",
				Status:         "Healthy",
				ImageURL:       "",
				Remarks:        "Potted hanging baskets. Good for air purification.",
			},
		}
		DB.Create(&plants)

		// Seed Plant Locations
		locQuantities := []PlantLocationQuantity{
			{PlantID: "HRT-10001", LocationName: "Main Entrance", Quantity: 15},
			{PlantID: "HRT-10001", LocationName: "Administrative Block", Quantity: 8},
			{PlantID: "HRT-10001", LocationName: "Hostel Areas", Quantity: 12},
			{PlantID: "HRT-10001", LocationName: "Playground", Quantity: 10},

			{PlantID: "HRT-10002", LocationName: "Garden Zones", Quantity: 10},
			{PlantID: "HRT-10002", LocationName: "Staff Quarters", Quantity: 5},
			{PlantID: "HRT-10002", LocationName: "Hostel Areas", Quantity: 8},

			{PlantID: "HRT-10003", LocationName: "Academic Blocks", Quantity: 30},
			{PlantID: "HRT-10003", LocationName: "Garden Zones", Quantity: 50},

			{PlantID: "HRT-10004", LocationName: "Main Entrance", Quantity: 40},
			{PlantID: "HRT-10004", LocationName: "Administrative Block", Quantity: 20},
			{PlantID: "HRT-10004", LocationName: "Garden Zones", Quantity: 60},

			{PlantID: "HRT-10005", LocationName: "Temple Area", Quantity: 50},
			{PlantID: "HRT-10005", LocationName: "Academic Blocks", Quantity: 10},

			{PlantID: "HRT-10006", LocationName: "Main Entrance", Quantity: 30},
			{PlantID: "HRT-10006", LocationName: "Parking Area", Quantity: 45},

			{PlantID: "HRT-10007", LocationName: "Temple Area", Quantity: 25},
			{PlantID: "HRT-10007", LocationName: "Administrative Block", Quantity: 15},

			{PlantID: "HRT-10008", LocationName: "Academic Blocks", Quantity: 20},
			{PlantID: "HRT-10008", LocationName: "Administrative Block", Quantity: 15},
		}
		DB.Create(&locQuantities)

		// Seed Maintenance schedules
		maints := []HorticultureMaint{
			{
				PlantID:                "HRT-10001",
				LocationName:           "Main Entrance",
				WateringSchedule:       "Alternate Days",
				FertilizerSchedule:     "Bi-monthly",
				PruningSchedule:        "Annual (Winter)",
				PestControlSchedule:    "Quarterly",
				LastMaintenanceDate:    "2026-05-10",
				NextMaintenanceDueDate: "2026-06-10",
				AssignedStaff:          "Ramesh Kumar",
			},
			{
				PlantID:                "HRT-10001",
				LocationName:           "Administrative Block",
				WateringSchedule:       "Alternate Days",
				FertilizerSchedule:     "Bi-monthly",
				PruningSchedule:        "Annual (Winter)",
				PestControlSchedule:    "Quarterly",
				LastMaintenanceDate:    "2026-05-12",
				NextMaintenanceDueDate: "2026-06-12",
				AssignedStaff:          "Ramesh Kumar",
			},
			{
				PlantID:                "HRT-10004",
				LocationName:           "Main Entrance",
				WateringSchedule:       "Daily",
				FertilizerSchedule:     "Monthly",
				PruningSchedule:        "Bi-monthly",
				PestControlSchedule:    "Monthly",
				LastMaintenanceDate:    "2026-04-20",
				NextMaintenanceDueDate: "2026-05-20", // Past due -> Needs Attention
				AssignedStaff:          "Suresh Pillai",
			},
			{
				PlantID:                "HRT-10007",
				LocationName:           "Temple Area",
				WateringSchedule:       "Daily",
				FertilizerSchedule:     "Monthly",
				PruningSchedule:        "Quarterly",
				PestControlSchedule:    "Monthly",
				LastMaintenanceDate:    "2026-05-02",
				NextMaintenanceDueDate: "2026-06-02", // Past/due soon -> Diseased
				AssignedStaff:          "Selvam M.",
			},
		}
		DB.Create(&maints)
	}
}
