package main

import (
	"backend/handlers"
	"backend/models"
	"net/http"
	"os"
	"time"

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
		sqlDB, err := DB.DB()
		if err == nil {
			sqlDB.SetMaxIdleConns(10)
			sqlDB.SetMaxOpenConns(100)
			sqlDB.SetConnMaxLifetime(time.Hour)
		}

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
		DB.AutoMigrate(&models.HostelBlock{}, &models.Warden{}, &models.StudentDetail{}, &models.AbsentStudentDetail{}, &models.MaintenanceTicket{}, &models.DailyUsage{}, &models.HostelFloorDetail{})

		// Transport tables
		LogInfo("DB", "AutoMigrate: Transport tables")
		DB.AutoMigrate(&models.Vehicle{}, &models.MileageTrend{}, &models.Driver{}, &models.DriverSchedule{}, &models.DailyOp{}, &models.FuelLog{}, &models.RouteTrip{}, &models.GPSDevice{}, &models.VehicleMaintenance{}, &models.BreakdownIncident{}, &models.Trip{}, &models.TransportStudent{})

		// Chiller tables
		LogInfo("DB", "AutoMigrate: Chiller tables")
		DB.AutoMigrate(&models.ChillerLog{}, &models.ChillerEquipment{}, &models.ChillerStaff{}, &models.ChillerBillingParam{}, &models.ChillerOperatingLog{}, &models.AhuUnit{}, &models.SplitAcUnit{}, &models.VrvUnit{}, &models.ColdRoomUnit{}, &models.ChillerBreakdown{}, &models.ChillerPlantSpecification{}, &models.ChillerUnitSpecification{})

		// Mess tables
		LogInfo("DB", "AutoMigrate: Mess tables")
		DB.AutoMigrate(&models.MessBlock{}, &models.MessEquipment{}, &models.MessWasteLog{}, &models.MessStaff{}, &models.MessMenu{})

		// Horticulture tables
		LogInfo("DB", "AutoMigrate: Horticulture tables")
		DB.AutoMigrate(&models.HorticulturePlant{}, &models.HorticultureLocation{}, &models.PlantLocationQuantity{}, &models.HorticultureMaint{})

		// Plumbing tables
		LogInfo("DB", "AutoMigrate: Plumbing tables")
		DB.Exec("DROP TABLE IF EXISTS plumbing_sumps CASCADE;")
		DB.Exec("DROP TABLE IF EXISTS plumbing_ohts CASCADE;")
		DB.AutoMigrate(&models.PlumbingMotor{}, &models.PlumbingSump{}, &models.PlumbingOHT{}, &models.PlumbingManpower{}, &models.PlumbingRuntimeLog{}, &models.PlumbingRiverIntakeLog{})

		// PowerHouse tables
		LogInfo("DB", "AutoMigrate: PowerHouse tables")
		DB.AutoMigrate(&models.PhTransformer{}, &models.PhDGSet{}, &models.PhUps{}, &models.PhSolarPv{}, &models.PhStaff{}, &models.PhDynamicLog{}, &models.PhDailyMetric{})
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

	api := &handlers.APIHandler{DB: DB}

	// Seed data
	api.Transport()
	api.Chiller()
	api.Horticulture()
	api.Plumbing()

	// Powerhouse routes
	http.HandleFunc("/api/powerhouse/data", lm(api.HandlePowerHouseData))
	http.HandleFunc("/api/powerhouse", lm(api.GetPowerHouseData))
	http.HandleFunc("/api/powerhouse/trend", lm(api.GetPowerHouseTrendData))

	LogInfo("HTTP", "Registering routes...")

	// Hostel routes
	http.HandleFunc("/api/hostels", lm(api.GetHostels))
	http.HandleFunc("/api/hostels/update", lm(api.UpdateUsage))
	http.HandleFunc("/api/hostels/update-block", lm(api.UpdateBlock))
	http.HandleFunc("/api/hostels/raise-complaint", lm(api.RaiseComplaint))
	http.HandleFunc("/api/hostels/update-complaint-status", lm(api.UpdateComplaintStatus))
	http.HandleFunc("/api/hostels/rename-block", lm(api.RenameBlock))
	http.HandleFunc("/api/hostels/add-block", lm(api.AddBlock))
	http.HandleFunc("/api/hostels/delete-block", lm(api.DeleteBlock))

	// Transport routes
	http.HandleFunc("/api/transport", lm(api.GetTransport))
	http.HandleFunc("/api/transport/update-driver", lm(api.UpdateDriverStatus))
	http.HandleFunc("/api/transport/update-vehicle", lm(api.UpdateVehicleStatus))
	http.HandleFunc("/api/transport/add-fuel-log", lm(api.AddFuelLog))
	http.HandleFunc("/api/transport/add-maintenance", lm(api.AddMaintenance))
	http.HandleFunc("/api/transport/update-maintenance", lm(api.UpdateMaintenanceStatus))
	http.HandleFunc("/api/transport/update-gps", lm(api.UpdateGPSStatus))
	http.HandleFunc("/api/transport/add-vehicle", lm(api.AddVehicle))
	http.HandleFunc("/api/transport/edit-vehicle", lm(api.EditVehicle))
	http.HandleFunc("/api/transport/add-driver", lm(api.AddDriver))
	http.HandleFunc("/api/transport/delete-vehicle", lm(api.DeleteVehicle))
	http.HandleFunc("/api/transport/delete-driver", lm(api.DeleteDriver))
	http.HandleFunc("/api/transport/add-trip", lm(api.AddTrip))
	http.HandleFunc("/api/transport/update-trip-status", lm(api.UpdateTripStatus))
	http.HandleFunc("/api/transport/delete-trip", lm(api.DeleteTrip))
	http.HandleFunc("/api/transport/add-student", lm(api.AddStudent))
	http.HandleFunc("/api/transport/delete-student", lm(api.DeleteStudent))

	// Chiller routes
	http.HandleFunc("/api/chiller", lm(api.GetChiller))
	http.HandleFunc("/api/chiller/add-log", lm(api.AddChillerLog))
	http.HandleFunc("/api/chiller/update-billing", lm(api.UpdateChillerBilling))
	http.HandleFunc("/api/chiller/update-equipment", lm(api.UpdateChillerEquipment))
	http.HandleFunc("/api/chiller/update-staff", lm(api.UpdateChillerStaff))
	http.HandleFunc("/api/chiller/add-operating-log", lm(api.AddChillerOperatingLog))
	http.HandleFunc("/api/chiller/operating-logs", lm(api.GetChillerOperatingLogs))
	http.HandleFunc("/api/chiller/ahu-units", lm(api.GetAhuUnits))
	http.HandleFunc("/api/chiller/add-ahu-units", lm(api.AddAhuUnits))
	http.HandleFunc("/api/chiller/update-ahu-unit", lm(api.UpdateAhuUnit))
	http.HandleFunc("/api/chiller/delete-ahu-unit", lm(api.DeleteAhuUnit))
	http.HandleFunc("/api/chiller/split-ac", lm(api.GetSplitAc))
	http.HandleFunc("/api/chiller/add-split-ac", lm(api.AddSplitAc))
	http.HandleFunc("/api/chiller/update-split-ac", lm(api.UpdateSplitAc))
	http.HandleFunc("/api/chiller/delete-split-ac", lm(api.DeleteSplitAc))
	http.HandleFunc("/api/chiller/vrv-units", lm(api.GetVrv))
	http.HandleFunc("/api/chiller/add-vrv-units", lm(api.AddVrv))
	http.HandleFunc("/api/chiller/update-vrv-unit", lm(api.UpdateVrv))
	http.HandleFunc("/api/chiller/delete-vrv-unit", lm(api.DeleteVrv))
	http.HandleFunc("/api/chiller/cold-room", lm(api.GetColdRoom))
	http.HandleFunc("/api/chiller/add-cold-room", lm(api.AddColdRoom))
	http.HandleFunc("/api/chiller/update-cold-room", lm(api.UpdateColdRoom))
	http.HandleFunc("/api/chiller/delete-cold-room", lm(api.DeleteColdRoom))
	http.HandleFunc("/api/chiller/breakdowns", lm(api.GetBreakdowns))
	http.HandleFunc("/api/chiller/add-breakdowns", lm(api.AddBreakdowns))
	http.HandleFunc("/api/chiller/update-breakdown", lm(api.UpdateBreakdown))
	http.HandleFunc("/api/chiller/delete-breakdown", lm(api.DeleteBreakdown))
	http.HandleFunc("/api/chiller/staff", lm(api.GetChillerStaff))
	http.HandleFunc("/api/chiller/add-staff", lm(api.AddChillerStaff))
	http.HandleFunc("/api/chiller/delete-staff", lm(api.DeleteChillerStaff))
	http.HandleFunc("/api/chiller/equipment", lm(api.GetChillerEquipment))
	http.HandleFunc("/api/chiller/add-equipment", lm(api.AddChillerEquipment))
	http.HandleFunc("/api/chiller/delete-equipment", lm(api.DeleteChillerEquipment))
	http.HandleFunc("/api/chiller/plant-specs", lm(api.GetPlantSpecs))
	http.HandleFunc("/api/chiller/add-plant-specs", lm(api.AddPlantSpecs))
	http.HandleFunc("/api/chiller/update-plant-spec", lm(api.UpdatePlantSpec))
	http.HandleFunc("/api/chiller/delete-plant-spec", lm(api.DeletePlantSpec))
	http.HandleFunc("/api/chiller/unit-specs", lm(api.GetUnitSpecs))
	http.HandleFunc("/api/chiller/add-unit-specs", lm(api.AddUnitSpecs))
	http.HandleFunc("/api/chiller/update-unit-spec", lm(api.UpdateUnitSpec))
	http.HandleFunc("/api/chiller/delete-unit-spec", lm(api.DeleteUnitSpec))

	// Mess routes
	http.HandleFunc("/api/mess/data", lm(api.HandleGetMessData))
	http.HandleFunc("/api/mess/log-waste", lm(api.HandleAddMessWaste))
	http.HandleFunc("/api/mess/staff", lm(api.HandleAddMessStaff))
	http.HandleFunc("/api/mess/update-staff", lm(api.HandleUpdateMessStaff))
	http.HandleFunc("/api/mess/delete-staff", lm(api.HandleDeleteMessStaff))
	http.HandleFunc("/api/mess/equipment", lm(api.HandleAddMessEquipment))
	http.HandleFunc("/api/mess/update-equipment", lm(api.HandleUpdateMessEquipment))
	http.HandleFunc("/api/mess/delete-equipment", lm(api.HandleDeleteMessEquipment))
	http.HandleFunc("/api/mess/menu", lm(api.HandleAddMessMenu))
	http.HandleFunc("/api/mess/menu-pdf", lm(api.HandleAddMessMenuPDF))

	// Horticulture routes
	http.HandleFunc("/api/horticulture", lm(api.GetHorticulture))
	http.HandleFunc("/api/horticulture/add-location", lm(api.AddLocation))
	http.HandleFunc("/api/horticulture/delete-location", lm(api.DeleteLocation))
	http.HandleFunc("/api/horticulture/add-plant", lm(api.AddOrUpdatePlant))
	http.HandleFunc("/api/horticulture/delete-plant", lm(api.DeletePlant))
	http.HandleFunc("/api/horticulture/update-maintenance", lm(api.UpdateMaintenance))

	// Plumbing routes
	http.HandleFunc("/api/plumbing", lm(api.GetPlumbing))
	http.HandleFunc("/api/plumbing/add-motors", lm(api.AddPlumbingMotors))
	http.HandleFunc("/api/plumbing/delete-motor", lm(api.DeletePlumbingMotor))
	http.HandleFunc("/api/plumbing/add-sumps", lm(api.AddPlumbingSumps))
	http.HandleFunc("/api/plumbing/delete-sump", lm(api.DeletePlumbingSump))
	http.HandleFunc("/api/plumbing/add-ohts", lm(api.AddPlumbingOHTs))
	http.HandleFunc("/api/plumbing/delete-oht", lm(api.DeletePlumbingOHT))
	http.HandleFunc("/api/plumbing/add-manpower", lm(api.AddPlumbingManpower))
	http.HandleFunc("/api/plumbing/delete-manpower", lm(api.DeletePlumbingManpower))
	http.HandleFunc("/api/plumbing/add-runtime", lm(api.AddPlumbingRuntime))
	http.HandleFunc("/api/plumbing/add-river-intake", lm(api.AddPlumbingRiverIntake))

	serverPort := os.Getenv("SERVER_PORT")
	if serverPort == "" {
		serverPort = "8085"
	}
	LogInfo("HTTP", "Backend server starting on :%s", serverPort)
	if err := http.ListenAndServe(":"+serverPort, nil); err != nil {
		LogError("HTTP", "Server stopped: %v", err)
	}
}
