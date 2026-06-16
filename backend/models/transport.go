package models

type Vehicle struct {
	ID           uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Number       string         `gorm:"uniqueIndex;not null" json:"number"`
	BusNo        string         `json:"busNo"`
	Type         string         `json:"type"`   // Bus / Van
	Status       string         `json:"status"` // Active / In Parking
	MileageKmpl  float64        `json:"mileageKmpl"`
	Route        string         `json:"route"`
	Driver       string         `json:"driver"`
	LastFC       string         `json:"lastFC"`
	NextFC       string         `json:"nextFC"`
	MileageTrend []MileageTrend `gorm:"foreignKey:VehicleNumber;references:Number" json:"trend"`
}

type MileageTrend struct {
	ID            uint    `gorm:"primaryKey;autoIncrement" json:"-"`
	VehicleNumber string  `json:"-"`
	Day           string  `json:"day"`
	KPI           float64 `json:"kpi"`
}

type Driver struct {
	ID          uint             `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string           `json:"name"`
	ImgURL      string           `json:"img"`
	Status      string           `json:"status"` // Present / Absent
	TodayBus    string           `json:"todayBus"`
	TodayRoute  string           `json:"todayRoute"`
	VehicleType string           `json:"vehicleType"` // Bus, Van, Car, EV
	Schedule    []DriverSchedule `gorm:"foreignKey:DriverID" json:"schedule"`
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
	Status   string `json:"status"` // Active / Inactive
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
	ID           uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	Date         string  `json:"date"`
	BusNumber    string  `json:"busNumber"`
	TripType     string  `json:"tripType"`  // Morning / Evening / Afternoon / Special
	RouteName    string  `json:"routeName"` // Serves as Place Travelled for Special trips
	DriverName   string  `json:"driverName"`
	StartTime    string  `json:"startTime"` // Can hold Date & Time for Special trips
	EndTime      string  `json:"endTime"`
	StartKM      float64 `json:"startKM"`
	EndKM        float64 `json:"endKM"`
	Distance     float64 `json:"distance"`
	StudentCount int     `json:"studentCount"`
	Attendance   int     `json:"attendance"`
	FuelUsage    float64 `json:"fuelUsage"`
	Remarks      string  `json:"remarks"`

	// Special Trip specific fields
	Purpose         string `json:"purpose"`
	RequestedBy     string `json:"requestedBy"`
	ApprovedBy      string `json:"approvedBy"`
	ApprovalStatus  string `json:"approvalStatus"` // Pending, Approved, Rejected
	TripStatus      string `json:"tripStatus"`     // Pending Approval, Approved, In Progress, Completed, Cancelled
	ExpectedEndTime string `json:"expectedEndTime"`
	ActualEndTime   string `json:"actualEndTime"`
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

type TransportPayload struct {
	Vehicles    []Vehicle            `json:"vehicles"`
	Drivers     []Driver             `json:"drivers"`
	DailyOps    []DailyOp            `json:"dailyOps"`
	FuelLogs    []FuelLog            `json:"fuelByVehicle"`
	RouteTrips  []RouteTrip          `json:"routeTrips"`
	GPS         []GPSDevice          `json:"gps"`
	Maintenance []VehicleMaintenance `json:"maintenance"`
	Breakdowns  []BreakdownIncident  `json:"breakdowns"`
	Trips       []Trip               `json:"trips"`
	Students    []TransportStudent   `json:"students"`
}
