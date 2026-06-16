package handlers

import (
	"gorm.io/gorm"
	"net/http"
	"sync"
	"time"
)

type APIHandler struct {
	DB *gorm.DB
}

// Re-using the APICache logic for the handlers
type APICache struct {
	mu         sync.RWMutex
	data       []byte
	lastUpdate time.Time
	ttl        time.Duration
}

var (
	MessCache         = &APICache{ttl: 1 * time.Minute}
	ChillerCache      = &APICache{ttl: 1 * time.Minute}
	TransportCache    = &APICache{ttl: 1 * time.Minute}
	HostelCache       = &APICache{ttl: 1 * time.Minute}
	PlumbingCache     = &APICache{ttl: 1 * time.Minute}
	HorticultureCache = &APICache{ttl: 1 * time.Minute}
)

func EnableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}
