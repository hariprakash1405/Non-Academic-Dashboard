package models

type ChillerOperatingLog struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Date string `gorm:"uniqueIndex" json:"date"`

	// DAIKIN Unit-I (185 KW) - Operating Hours per slot
	Unit1Slot1 float64 `json:"unit1Slot1"` // 6AM-10AM
	Unit1Slot2 float64 `json:"unit1Slot2"` // 10AM-6PM
	Unit1Slot3 float64 `json:"unit1Slot3"` // 6PM-10PM
	Unit1Slot4 float64 `json:"unit1Slot4"` // 10PM-6AM

	// DAIKIN Unit-II (185 KW) - Operating Hours per slot
	Unit2Slot1 float64 `json:"unit2Slot1"`
	Unit2Slot2 float64 `json:"unit2Slot2"`
	Unit2Slot3 float64 `json:"unit2Slot3"`
	Unit2Slot4 float64 `json:"unit2Slot4"`

	// DUNHAM-BUSH Unit-III (240 KW) - Operating Hours per slot
	Unit3Slot1 float64 `json:"unit3Slot1"`
	Unit3Slot2 float64 `json:"unit3Slot2"`
	Unit3Slot3 float64 `json:"unit3Slot3"`
	Unit3Slot4 float64 `json:"unit3Slot4"`

	// Chiller Peak/Non-Peak/Night Hour Totals
	ChillerPeakHours    float64 `json:"chillerPeakHours"`
	ChillerNonPeakHours float64 `json:"chillerNonPeakHours"`
	ChillerNightHours   float64 `json:"chillerNightHours"`

	// Pump Unit-I (18.65 kW) - Operating Hours per slot
	Pump1Slot1 float64 `json:"pump1Slot1"`
	Pump1Slot2 float64 `json:"pump1Slot2"`
	Pump1Slot3 float64 `json:"pump1Slot3"`
	Pump1Slot4 float64 `json:"pump1Slot4"`

	// Pump Unit-II (18.65 kW) - Operating Hours per slot
	Pump2Slot1 float64 `json:"pump2Slot1"`
	Pump2Slot2 float64 `json:"pump2Slot2"`
	Pump2Slot3 float64 `json:"pump2Slot3"`
	Pump2Slot4 float64 `json:"pump2Slot4"`

	// Pump Unit-III (18.5 kW) - Operating Hours per slot
	Pump3Slot1 float64 `json:"pump3Slot1"`
	Pump3Slot2 float64 `json:"pump3Slot2"`
	Pump3Slot3 float64 `json:"pump3Slot3"`
	Pump3Slot4 float64 `json:"pump3Slot4"`

	// Pump Unit-IV (18.65 kW) - Operating Hours per slot
	Pump4Slot1 float64 `json:"pump4Slot1"`
	Pump4Slot2 float64 `json:"pump4Slot2"`
	Pump4Slot3 float64 `json:"pump4Slot3"`
	Pump4Slot4 float64 `json:"pump4Slot4"`

	// Pump Peak/Non-Peak/Night Hour Totals
	PumpPeakHours    float64 `json:"pumpPeakHours"`
	PumpNonPeakHours float64 `json:"pumpNonPeakHours"`
	PumpNightHours   float64 `json:"pumpNightHours"`
}

type ChillerLog struct {
	ID               uint    `gorm:"primaryKey" json:"id"`
	Date             string  `gorm:"uniqueIndex" json:"date"`
	ChilledIn        float64 `json:"chilledIn"`
	ChilledOut       float64 `json:"chilledOut"`
	CondenserIn      float64 `json:"condenserIn"`
	CondenserOut     float64 `json:"condenserOut"`
	DaysOperated     int     `json:"daysOperated"`
	RunHours         float64 `json:"runHours"`
	CoolingLoad      float64 `json:"coolingLoad"`
	EnergyConsumed   float64 `json:"energyConsumed"`
	RefrigerantLevel float64 `json:"refrigerantLevel"`
	ConsLoad         float64 `json:"consLoad"`
	ConsHr           float64 `json:"consHr"`
	COP              float64 `json:"cop"`
}

type AhuUnit struct {
	ID       uint    `gorm:"primaryKey" json:"id"`
	SNo      int     `json:"sNo,omitempty"`
	Block    string  `json:"block,omitempty"`
	Floor    string  `json:"floor,omitempty"`
	Loc      string  `json:"loc,omitempty"`
	Type     string  `json:"type,omitempty"`
	Cap      float64 `json:"cap,omitempty"`
	Qty      int     `json:"qty,omitempty"`
	TotCap   float64 `json:"totCap,omitempty"`
	Hp       float64 `json:"hp,omitempty"`
	TotHp    float64 `json:"totHp,omitempty"`
	Area     float64 `json:"area,omitempty"`
	SubTotal string  `json:"subTotal,omitempty"`
}

type SplitAcUnit struct {
	ID     uint    `gorm:"primaryKey" json:"id"`
	SNo    int     `json:"sno,omitempty"`
	Make   string  `json:"make,omitempty"`
	Ton    float64 `json:"ton,omitempty"`
	Model  string  `json:"model,omitempty"`
	Block  string  `json:"block,omitempty"`
	Dept   string  `json:"dept,omitempty"`
	Qty    int     `json:"qty,omitempty"`
	TotTon float64 `json:"totTon,omitempty"`
	Loc    string  `json:"loc,omitempty"`
}

type VrvUnit struct {
	ID     uint    `gorm:"primaryKey" json:"id"`
	SNo    int     `json:"sno,omitempty"`
	Make   string  `json:"make,omitempty"`
	Ton    float64 `json:"ton,omitempty"`
	Model  string  `json:"model,omitempty"`
	Block  string  `json:"block,omitempty"`
	Dept   string  `json:"dept,omitempty"`
	Qty    int     `json:"qty,omitempty"`
	TotTon float64 `json:"totTon,omitempty"`
	Loc    string  `json:"loc,omitempty"`
	Notes  string  `json:"notes,omitempty"`
}

type ChillerBreakdown struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	Date       string `json:"date,omitempty"`
	Equipment  string `json:"equipment,omitempty"`
	Issue      string `json:"issue,omitempty"`
	Resolution string `json:"resolution,omitempty"`
	Status     string `json:"status,omitempty"`
}

type ColdRoomUnit struct {
	ID     uint    `gorm:"primaryKey" json:"id"`
	SNo    int     `json:"sno,omitempty"`
	Make   string  `json:"make,omitempty"`
	Ton    float64 `json:"ton,omitempty"`
	Model  string  `json:"model,omitempty"`
	Block  string  `json:"block,omitempty"`
	Dept   string  `json:"dept,omitempty"`
	Qty    int     `json:"qty,omitempty"`
	TotTon float64 `json:"totTon,omitempty"`
	Loc    string  `json:"loc,omitempty"`
}

type ChillerEquipment struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `json:"name"`
	Model       string `json:"model"`
	Capacity    string `json:"capacity"`
	Type        string `json:"type"`
	Status      string `json:"status"`
	Load        string `json:"load"`
	TempIn      string `json:"tempIn"`
	TempOut     string `json:"tempOut"`
	Refrigerant string `json:"refrigerant"`
	LastService string `json:"lastService"`
	NextService string `json:"nextService"`
	Health      int    `json:"health"`
}

type ChillerStaff struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	Name       string `json:"name"`
	Role       string `json:"role"`
	Shift      string `json:"shift"`
	Attendance string `json:"attendance"`
	Contact    string `json:"contact"`
	DateJoined string `json:"dateJoined"`
}

type ChillerPlantSpecification struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Parameter string `json:"parameter"`
	Value     string `json:"value"`
	Unit      string `json:"unit"`
	Remarks   string `json:"remarks"`
}

type ChillerUnitSpecification struct {
	ID    uint   `gorm:"primaryKey" json:"id"`
	Param string `json:"param"`
	Unit1 string `json:"unit1"`
	Unit2 string `json:"unit2"`
	Unit3 string `json:"unit3"`
}

type ChillerBillingParam struct {
	ID                    uint    `gorm:"primaryKey" json:"id"`
	RateOffPeak           float64 `json:"rateOffPeak"`
	RatePeak              float64 `json:"ratePeak"`
	RateNight             float64 `json:"rateNight"`
	DailyOperHours        float64 `json:"dailyOperHours"`
	PeakHours             float64 `json:"peakHours"`
	AvgCoolingLoadTr      float64 `json:"avgCoolingLoadTr"`
	Chiller1Active        bool    `json:"chiller1Active"`
	Chiller2Active        bool    `json:"chiller2Active"`
	Chiller3Active        bool    `json:"chiller3Active"`
	PumpCondensePower     float64 `json:"pumpCondensePower"`
	PumpChilledPower      float64 `json:"pumpChilledPower"`
	PumpCoolingTowerPower float64 `json:"pumpCoolingTowerPower"`
}
