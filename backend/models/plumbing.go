package models

type PlumbingMotor struct {
	ID            uint    `gorm:"primaryKey" json:"id"`
	MotorID       string  `json:"motorId"`
	Location      string  `json:"location"`
	Type          string  `json:"type"`
	Power         string  `json:"power"`
	OpHours       string  `json:"opHours"`
	NextService   string  `json:"nextService"`
	Status        string  `json:"status"`
	ConnectedTank string  `json:"connectedTank"`
	Kw            float64 `gorm:"-" json:"kw"`
	Kwh           float64 `gorm:"-" json:"kwh"`
}

type PlumbingSump struct {
	ID       uint    `gorm:"primaryKey" json:"id"`
	SumpID   string  `json:"sumpId"`
	Location string  `json:"location"`
	Length   float64 `json:"length"`
	Width    float64 `json:"width"`
	Depth    float64 `json:"depth"`
	CubicFt  float64 `json:"cubicFt"`
	Capacity int     `json:"capacity"`
	ZoneType string  `json:"zoneType"`
	Status   string  `json:"status"`
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
