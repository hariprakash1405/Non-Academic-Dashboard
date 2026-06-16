package models

type HorticulturePlant struct {
	ID             string                  `gorm:"primaryKey" json:"id"`
	Name           string                  `json:"name"`
	ScientificName string                  `json:"scientificName"`
	Category       string                  `json:"category"`    // "Tree", "Flowering Plant", "Medicinal Plant", "Shrub", "Lawn Plant", "Indoor Plant", etc.
	Age            string                  `json:"age"`         // e.g. "3 Years"
	Quantity       int                     `json:"quantity"`    // Cached sum of quantities across locations
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
