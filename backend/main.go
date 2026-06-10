package main

import (
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func initDB() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		LogWarn("DB", "No .env file found, using system environment variables")
	}

	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")
	sslmode := os.Getenv("DB_SSLMODE")

	dsn := "host=" + host + " user=" + user + " password=" + password +
		" dbname=" + dbname + " port=" + port + " sslmode=" + sslmode

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		LogError("DB", "Failed to connect to database: %v", err)
		LogWarn("DB", "Make sure PostgreSQL is running and credentials are correct.")
	} else {
		LogInfo("DB", "Connected to PostgreSQL successfully (host=%s db=%s)", host, dbname)

		// Commenting out DROP TABLE statements so data persists across restarts
		// DB.Exec("DROP TABLE IF EXISTS mileage_trends CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS fuel_logs CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS gps_devices CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS vehicle_maintenances CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS breakdown_incidents CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS driver_schedules CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS daily_ops CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS route_trips CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS drivers CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS vehicles CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS trips CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS transport_students CASCADE;")

		// DB.Exec("DROP TABLE IF EXISTS chiller_logs CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS chiller_equipments CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS chiller_staffs CASCADE;")
		// DB.Exec("DROP TABLE IF EXISTS chiller_billing_params CASCADE;")

		// Hostel tables
		LogInfo("DB", "AutoMigrate: Hostel tables")
		DB.AutoMigrate(&HostelBlock{}, &Warden{}, &StudentDetail{}, &MaintenanceTicket{}, &DailyUsage{}, &HostelFloorDetail{})

		// Transport tables
		LogInfo("DB", "AutoMigrate: Transport tables")
		DB.AutoMigrate(&Vehicle{}, &MileageTrend{}, &Driver{}, &DriverSchedule{}, &DailyOp{}, &FuelLog{}, &RouteTrip{}, &GPSDevice{}, &VehicleMaintenance{}, &BreakdownIncident{}, &Trip{}, &TransportStudent{})
		seedTransport()

		// Chiller tables
		LogInfo("DB", "AutoMigrate: Chiller tables")
		DB.AutoMigrate(&ChillerLog{}, &ChillerEquipment{}, &ChillerStaff{}, &ChillerBillingParam{}, &ChillerOperatingLog{}, &AhuUnit{}, &SplitAcUnit{}, &VrvUnit{}, &ColdRoomUnit{}, &ChillerBreakdown{}, &ChillerPlantSpecification{}, &ChillerUnitSpecification{})
		seedChiller()

		// Mess tables
		LogInfo("DB", "AutoMigrate: Mess tables")
		DB.AutoMigrate(&MessBlock{}, &MessEquipment{}, &MessWasteLog{}, &MessStaff{}, &MessMenu{})
		seedMess()

		// Horticulture tables
		LogInfo("DB", "AutoMigrate: Horticulture tables")
		DB.AutoMigrate(&HorticulturePlant{}, &HorticultureLocation{}, &PlantLocationQuantity{}, &HorticultureMaint{})
		seedHorticulture()

		// Plumbing tables
		LogInfo("DB", "AutoMigrate: Plumbing tables")
		DB.Exec("DROP TABLE IF EXISTS plumbing_sumps CASCADE;")
		DB.Exec("DROP TABLE IF EXISTS plumbing_ohts CASCADE;")
		DB.AutoMigrate(&PlumbingMotor{}, &PlumbingSump{}, &PlumbingOHT{}, &PlumbingManpower{}, &PlumbingRuntimeLog{})
		seedPlumbing()
	}
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

// lm is shorthand for LoggingMiddleware
func lm(h http.HandlerFunc) http.HandlerFunc { return LoggingMiddleware(h) }

func main() {
	initDB()

	LogInfo("HTTP", "Registering routes...")

	// Hostel routes
	http.HandleFunc("/api/hostels", lm(handleGetHostels))
	http.HandleFunc("/api/hostels/update", lm(handleUpdateUsage))
	http.HandleFunc("/api/hostels/update-block", lm(handleUpdateBlock))
	http.HandleFunc("/api/hostels/raise-complaint", lm(handleRaiseComplaint))
	http.HandleFunc("/api/hostels/update-complaint-status", lm(handleUpdateComplaintStatus))
	http.HandleFunc("/api/hostels/rename-block", lm(handleRenameBlock))
	http.HandleFunc("/api/hostels/add-block", lm(handleAddBlock))
	http.HandleFunc("/api/hostels/delete-block", lm(handleDeleteBlock))

	// Transport routes
	http.HandleFunc("/api/transport", lm(handleGetTransport))
	http.HandleFunc("/api/transport/update-driver", lm(handleUpdateDriverStatus))
	http.HandleFunc("/api/transport/update-vehicle", lm(handleUpdateVehicleStatus))
	http.HandleFunc("/api/transport/add-fuel-log", lm(handleAddFuelLog))
	http.HandleFunc("/api/transport/add-maintenance", lm(handleAddMaintenance))
	http.HandleFunc("/api/transport/update-maintenance", lm(handleUpdateMaintenanceStatus))
	http.HandleFunc("/api/transport/update-gps", lm(handleUpdateGPSStatus))
	http.HandleFunc("/api/transport/add-vehicle", lm(handleAddVehicle))
	http.HandleFunc("/api/transport/edit-vehicle", lm(handleEditVehicle))
	http.HandleFunc("/api/transport/add-driver", lm(handleAddDriver))
	http.HandleFunc("/api/transport/delete-vehicle", lm(handleDeleteVehicle))
	http.HandleFunc("/api/transport/delete-driver", lm(handleDeleteDriver))
	http.HandleFunc("/api/transport/add-trip", lm(handleAddTrip))
	http.HandleFunc("/api/transport/update-trip-status", lm(handleUpdateTripStatus))
	http.HandleFunc("/api/transport/delete-trip", lm(handleDeleteTrip))
	http.HandleFunc("/api/transport/add-student", lm(handleAddStudent))
	http.HandleFunc("/api/transport/delete-student", lm(handleDeleteStudent))

	// Chiller routes
	http.HandleFunc("/api/chiller", lm(handleGetChiller))
	http.HandleFunc("/api/chiller/add-log", lm(handleAddChillerLog))
	http.HandleFunc("/api/chiller/update-billing", lm(handleUpdateChillerBilling))
	http.HandleFunc("/api/chiller/update-equipment", lm(handleUpdateChillerEquipment))
	http.HandleFunc("/api/chiller/update-staff", lm(handleUpdateChillerStaff))
	http.HandleFunc("/api/chiller/add-operating-log", lm(handleAddChillerOperatingLog))
	http.HandleFunc("/api/chiller/operating-logs", lm(handleGetChillerOperatingLogs))
	http.HandleFunc("/api/chiller/ahu-units", lm(handleGetAhuUnits))
	http.HandleFunc("/api/chiller/add-ahu-units", lm(handleAddAhuUnits))
	http.HandleFunc("/api/chiller/update-ahu-unit", lm(handleUpdateAhuUnit))
	http.HandleFunc("/api/chiller/delete-ahu-unit", lm(handleDeleteAhuUnit))
	http.HandleFunc("/api/chiller/split-ac", lm(handleGetSplitAc))
	http.HandleFunc("/api/chiller/add-split-ac", lm(handleAddSplitAc))
	http.HandleFunc("/api/chiller/update-split-ac", lm(handleUpdateSplitAc))
	http.HandleFunc("/api/chiller/delete-split-ac", lm(handleDeleteSplitAc))
	http.HandleFunc("/api/chiller/vrv-units", lm(handleGetVrv))
	http.HandleFunc("/api/chiller/add-vrv-units", lm(handleAddVrv))
	http.HandleFunc("/api/chiller/update-vrv-unit", lm(handleUpdateVrv))
	http.HandleFunc("/api/chiller/delete-vrv-unit", lm(handleDeleteVrv))
	http.HandleFunc("/api/chiller/cold-room", lm(handleGetColdRoom))
	http.HandleFunc("/api/chiller/add-cold-room", lm(handleAddColdRoom))
	http.HandleFunc("/api/chiller/update-cold-room", lm(handleUpdateColdRoom))
	http.HandleFunc("/api/chiller/delete-cold-room", lm(handleDeleteColdRoom))
	http.HandleFunc("/api/chiller/breakdowns", lm(handleGetBreakdowns))
	http.HandleFunc("/api/chiller/add-breakdowns", lm(handleAddBreakdowns))
	http.HandleFunc("/api/chiller/update-breakdown", lm(handleUpdateBreakdown))
	http.HandleFunc("/api/chiller/delete-breakdown", lm(handleDeleteBreakdown))
	http.HandleFunc("/api/chiller/staff", lm(handleGetChillerStaff))
	http.HandleFunc("/api/chiller/add-staff", lm(handleAddChillerStaff))
	http.HandleFunc("/api/chiller/delete-staff", lm(handleDeleteChillerStaff))
	http.HandleFunc("/api/chiller/equipment", lm(handleGetChillerEquipment))
	http.HandleFunc("/api/chiller/add-equipment", lm(handleAddChillerEquipment))
	http.HandleFunc("/api/chiller/delete-equipment", lm(handleDeleteChillerEquipment))
	http.HandleFunc("/api/chiller/plant-specs", lm(handleGetPlantSpecs))
	http.HandleFunc("/api/chiller/add-plant-specs", lm(handleAddPlantSpecs))
	http.HandleFunc("/api/chiller/update-plant-spec", lm(handleUpdatePlantSpec))
	http.HandleFunc("/api/chiller/delete-plant-spec", lm(handleDeletePlantSpec))
	http.HandleFunc("/api/chiller/unit-specs", lm(handleGetUnitSpecs))
	http.HandleFunc("/api/chiller/add-unit-specs", lm(handleAddUnitSpecs))
	http.HandleFunc("/api/chiller/update-unit-spec", lm(handleUpdateUnitSpec))
	http.HandleFunc("/api/chiller/delete-unit-spec", lm(handleDeleteUnitSpec))

	// Mess routes
	http.HandleFunc("/api/mess/data", lm(handleGetMessData))
	http.HandleFunc("/api/mess/log-waste", lm(handleAddMessWaste))
	http.HandleFunc("/api/mess/staff", lm(handleAddMessStaff))
	http.HandleFunc("/api/mess/equipment", lm(handleAddMessEquipment))
	http.HandleFunc("/api/mess/menu", lm(handleAddMessMenu))
	http.HandleFunc("/api/mess/menu-pdf", lm(handleAddMessMenuPDF))

	// Horticulture routes
	http.HandleFunc("/api/horticulture", lm(handleGetHorticulture))
	http.HandleFunc("/api/horticulture/add-location", lm(handleAddLocation))
	http.HandleFunc("/api/horticulture/delete-location", lm(handleDeleteLocation))
	http.HandleFunc("/api/horticulture/add-plant", lm(handleAddOrUpdatePlant))
	http.HandleFunc("/api/horticulture/delete-plant", lm(handleDeletePlant))
	http.HandleFunc("/api/horticulture/update-maintenance", lm(handleUpdateMaintenance))

	// Plumbing routes
	http.HandleFunc("/api/plumbing", lm(handleGetPlumbing))
	http.HandleFunc("/api/plumbing/add-motors", lm(handleAddPlumbingMotors))
	http.HandleFunc("/api/plumbing/delete-motor", lm(handleDeletePlumbingMotor))
	http.HandleFunc("/api/plumbing/add-sumps", lm(handleAddPlumbingSumps))
	http.HandleFunc("/api/plumbing/delete-sump", lm(handleDeletePlumbingSump))
	http.HandleFunc("/api/plumbing/add-ohts", lm(handleAddPlumbingOHTs))
	http.HandleFunc("/api/plumbing/delete-oht", lm(handleDeletePlumbingOHT))
	http.HandleFunc("/api/plumbing/add-manpower", lm(handleAddPlumbingManpower))
	http.HandleFunc("/api/plumbing/delete-manpower", lm(handleDeletePlumbingManpower))
	http.HandleFunc("/api/plumbing/add-runtime", lm(handleAddPlumbingRuntime))

	serverPort := os.Getenv("SERVER_PORT")
	if serverPort == "" {
		serverPort = "8085"
	}
	LogInfo("HTTP", "Backend server starting on :%s", serverPort)
	if err := http.ListenAndServe(":"+serverPort, nil); err != nil {
		LogError("HTTP", "Server stopped: %v", err)
	}
}
