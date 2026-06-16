package models

import "time"

type MessBlock struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Name     string `gorm:"unique" json:"name"`
	Capacity int    `json:"capacity"`
	Occupied int    `json:"occupied"`
	Gender   string `json:"gender"`
}

type MessEquipment struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	BlockName string `json:"blockName"`
	Name      string `json:"name"`
	Total     int    `json:"total"`
	Working   int    `json:"working"`
	Damaged   int    `json:"damaged"`
	Status    string `json:"status"`
}

type MessWasteLog struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	Date           time.Time `gorm:"type:date" json:"date"`
	BlockName      string    `json:"blockName"`
	Breakfast      int       `json:"breakfast"`
	Lunch          int       `json:"lunch"`
	Dinner         int       `json:"dinner"`
	Total          int       `json:"total"`
	BreakfastCount int       `json:"breakfastCount"`
	LunchCount     int       `json:"lunchCount"`
	DinnerCount    int       `json:"dinnerCount"`
}

type MessStaff struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	BlockName string `json:"blockName"`
	Name      string `json:"name"`
	Role      string `json:"role"`
	Shift     string `json:"shift"`
	Contact   string `json:"contact"`
}

type MessMenu struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	BlockName string `json:"blockName"`
	MonthYear string `json:"monthYear"`
	MenuJSON  string `json:"menuJSON" gorm:"type:text"`
}
