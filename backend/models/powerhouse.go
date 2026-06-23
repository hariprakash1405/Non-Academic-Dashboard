package models

import "time"

type PhTransformer struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Date       string    `json:"date"`
	SvcNum     string    `json:"svcNum"`
	Type       string    `json:"type"`
	Load       string    `json:"load"`
	Voltage    string    `json:"voltage"`
	RatingMake string    `json:"ratingMake"`
	Year       string    `json:"year"`
	Feeders    string    `json:"feeders"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type PhDGSet struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Date        string    `json:"date"`
	RatingMake  string    `json:"ratingMake"`
	Count       string    `json:"count"`
	Year        string    `json:"year"`
	LastService string    `json:"lastService"`
	FuelCap     string    `json:"fuelCap"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type PhUps struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Date        string    `json:"date"`
	Location    string    `json:"location"`
	RatingMake  string    `json:"ratingMake"`
	LastAmc     string    `json:"lastAmc"`
	NextAmc     string    `json:"nextAmc"`
	BatteryCap  string    `json:"batteryCap"`
	BatteryDate string    `json:"batteryDate"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type PhSolarPv struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Date            string    `json:"date"`
	Location        string    `json:"location"`
	Capacity        string    `json:"capacity"`
	Panels          string    `json:"panels"`
	PanelWatts      string    `json:"panelWatts"`
	InverterRating  string    `json:"inverterRating"`
	InverterService string    `json:"inverterService"`
	Type            string    `json:"type"`
	CleaningFreq    string    `json:"cleaningFreq"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type PhStaff struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Date       string    `json:"date"`
	Name       string    `json:"name"`
	Role       string    `json:"role"`
	Shift      string    `json:"shift"`
	Attendance string    `json:"attendance"`
	Contact    string    `json:"contact"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type PhDynamicLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Date        string    `json:"date"`
	SourceType  string    `json:"sourceType"` // 'eb', 'solar', 'dg'
	Hour        string    `json:"hour"`
	Value       string    `json:"value"`      // Consumption
	Generation  string    `json:"generation"` // Only for solar
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type PhFeederDynamicLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Date      string    `json:"date"`
	FeederID  string    `json:"feederId"`
	Hour      string    `json:"hour"`
	Value     string    `json:"value"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type PhDailyMetric struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Date        string    `json:"date"`
	DGFuelUsage float64   `json:"dgDailyFuel"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type PowerHousePayload struct {
	Date          string            `json:"date"`
	Transformers  []PhTransformer   `json:"transformers"`
	DGSets        []PhDGSet         `json:"dgSets"`
	Ups           []PhUps           `json:"ups"`
	SolarPv       []PhSolarPv       `json:"solarPv"`
	Staff         []PhStaff         `json:"staff"`
	EbDynamic     []PhDynamicLog       `json:"ebDynamic"`
	SolarDynamic  []PhDynamicLog       `json:"solarDynamic"`
	DgDynamic     []PhDynamicLog       `json:"dgDynamic"`
	FeederDynamic []PhFeederDynamicLog `json:"feederDynamic"`
	DgDailyFuel   float64              `json:"dgDailyFuel"`
}
