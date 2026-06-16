package models

type HostelFloorDetail struct {
	ID              uint   `gorm:"primaryKey" json:"id"`
	HostelBlockName string `gorm:"index" json:"hostelBlockName"`
	FloorNumber     int    `json:"floorNumber"`
	TotalRooms      int    `json:"totalRooms"`
	RoomTypes       string `json:"roomTypes"`
	TotalBeds       int    `json:"totalBeds"`
}

type HostelBlock struct {
	Name         string              `gorm:"primaryKey" json:"name"`
	Beds         int                 `json:"beds"`
	Occupied     int                 `json:"occupied"`
	Type         string              `json:"type"`
	Gender       string              `json:"gender"`
	StaffCount   int                 `json:"staffCount"`
	Remarks      string              `json:"remarks"`
	Wardens      []Warden            `gorm:"foreignKey:HostelBlockName" json:"wardens"`
	ResidentList []StudentDetail     `gorm:"foreignKey:HostelBlockName" json:"residentList"`
	Complaints   []MaintenanceTicket `gorm:"foreignKey:HostelBlockName" json:"complaints"`

	NumFloors    int                 `json:"numFloors"`
	TotalRooms   int                 `json:"totalRooms"`
	FloorDetails []HostelFloorDetail `gorm:"foreignKey:HostelBlockName" json:"floorDetails"`

	ChiefWardenCount       int `json:"chiefWardenCount"`
	DeputyWardenCount      int `json:"deputyWardenCount"`
	SeniorCaretakerCount   int `json:"seniorCaretakerCount"`
	CareTakerAttenderCount int `json:"careTakerAttenderCount"`
	HouseKeeperCount       int `json:"houseKeeperCount"`
	BathroomCleanerCount   int `json:"bathroomCleanerCount"`
	SecurityCount          int `json:"securityCount"`

	VacantBeds           int `json:"vacantBeds"`
	MaintenanceRoomsBeds int `json:"maintenanceRoomsBeds"`

	AllocatedCapacity   int     `json:"allocatedCapacity"`
	WaterCoolersCount   int     `json:"waterCoolersCount"`
	BathroomsPerFloor   float64 `json:"bathroomsPerFloor"`
	ToiletsPerFloor     float64 `json:"toiletsPerFloor"`
	SolarHeaterCapacity string  `json:"solarHeaterCapacity"`
	WifiAccessPoints    int     `json:"wifiAccessPoints"`
	CctvCameras         int     `json:"cctvCameras"`
	CaretakerCount      int     `json:"caretakerCount"`
	CommonRoom          string  `json:"commonRoom"`
	ReadingRoom         string  `json:"readingRoom"`
	ParentWaitingRoom   string  `json:"parentWaitingRoom"`
}

type Warden struct {
	Phone           string `gorm:"primaryKey" json:"phone"`
	HostelBlockName string `json:"-"`
	Name            string `json:"name"`
	Role            string `json:"role"` // "Warden" or "Support Staff"
	Floor           string `json:"floor"`
}

type StudentDetail struct {
	RollNo          string `gorm:"primaryKey" json:"rollNo"`
	HostelBlockName string `json:"-"`
	Name            string `json:"name"`
	RoomNo          string `json:"roomNo"`
}

type MaintenanceTicket struct {
	ID              string `gorm:"primaryKey" json:"id"`
	HostelBlockName string `json:"-"`
	Block           string `json:"block"`
	UnitNo          string `json:"unitNo"`
	Type            string `json:"type"`
	Desc            string `json:"desc"`
	Priority        string `json:"priority"`
	TAT             string `json:"tat"`
	Status          string `json:"status"` // "Ongoing", "Resolved", "Pending"
	Date            string `json:"date"`
	AssignedHead    string `json:"assignedHead"`
}

type DailyUsage struct {
	ID    uint    `gorm:"primaryKey" json:"-"`
	Block string  `gorm:"uniqueIndex:idx_block_date" json:"block"`
	Date  string  `gorm:"uniqueIndex:idx_block_date" json:"date"`
	Water float64 `json:"water"`
	Power float64 `json:"power"`
}
