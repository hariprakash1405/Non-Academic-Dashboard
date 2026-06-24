package handlers

import (
	"backend/models"
	"encoding/json"
	"net/http"
	"context"
	"google.golang.org/api/idtoken"

	"gorm.io/gorm"
)

func (h *APIHandler) Login(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	var user models.User
	if err := h.DB.Where("username = ? AND password = ?", creds.Username, creds.Password).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	if !user.Status {
		http.Error(w, "Account is inactive", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *APIHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	var req struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Verify the token
	// Client ID: 893806898567-037h0vi68gbrs5n1tmidlaphsv6n9mj0.apps.googleusercontent.com
	clientID := "893806898567-037h0vi68gbrs5n1tmidlaphsv6n9mj0.apps.googleusercontent.com"
	payload, err := idtoken.Validate(context.Background(), req.Token, clientID)
	if err != nil {
		http.Error(w, "Invalid Google token", http.StatusUnauthorized)
		return
	}

	emailInter, ok := payload.Claims["email"]
	if !ok {
		http.Error(w, "Email not provided by Google", http.StatusUnauthorized)
		return
	}
	email := emailInter.(string)

	var user models.User
	if err := h.DB.Where("email = ?", email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "User not found for this email", http.StatusUnauthorized)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	if !user.Status {
		http.Error(w, "Account is inactive", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}


func (h *APIHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	var users []models.User
	h.DB.Order("id asc").Find(&users)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *APIHandler) AddOrUpdateUser(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if user.ID == 0 {
		h.DB.Create(&user)
	} else {
		h.DB.Save(&user)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *APIHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	var req struct {
		ID uint `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.ID == 0 {
		http.Error(w, "User ID required", http.StatusBadRequest)
		return
	}

	if err := h.DB.Delete(&models.User{}, req.ID).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User deleted successfully"})
}

func (h *APIHandler) BulkAddUsers(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	var users []models.User
	if err := json.NewDecoder(r.Body).Decode(&users); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for _, user := range users {
		var existing models.User
		if h.DB.Where("username = ?", user.Username).First(&existing).Error == nil {
			// Update existing
			user.ID = existing.ID
			h.DB.Save(&user)
		} else {
			// Create new
			h.DB.Create(&user)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Bulk users processed successfully"})
}
