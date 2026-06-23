package models

import "time"

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"uniqueIndex"`
	Password  string    `json:"password"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`      // dev_admin, admin, unit_head
	UnitName        string    `json:"unitName"` // Primary unit
	AccessibleUnits string    `json:"accessibleUnits"` // Comma-separated list of additional accessible units
	Status          bool      `json:"status" gorm:"default:true"`
	DashboardAccess bool      `json:"dashboardAccess" gorm:"default:false"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}
