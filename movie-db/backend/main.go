package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// ---------- models ----------

type Movie struct {
	ID          int64   `json:"id"`
	Title       string  `json:"title"`
	Year        int     `json:"year"`
	Genre       string  `json:"genre"`
	Rating      float64 `json:"rating"`
	Description string  `json:"description"`
}

type User struct {
	ID    int64  `json:"id"`
	Email string `json:"email"`
}

type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type resetPasswordRequest struct {
	Email       string `json:"email"`
	NewPassword string `json:"new_password"`
}

// ---------- globals ----------

var db *sql.DB

func main() {
	rand.Seed(time.Now().UnixNano())

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		envOr("DB_HOST", "localhost"),
		envOr("DB_PORT", "5432"),
		envOr("DB_USER", "movie_user"),
		envOr("DB_PASSWORD", "movie_pass"),
		envOr("DB_NAME", "movie_db"),
	)

	// Retry connecting for up to ~60s: the db container may still be starting.
	var err error
	for i := 0; i < 30; i++ {
		db, err = sql.Open("postgres", dsn)
		if err == nil {
			err = db.Ping()
		}
		if err == nil {
			break
		}
		log.Printf("waiting for database (%d/30): %v", i+1, err)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("could not connect to database: %v", err)
	}
	log.Println("connected to database")

	if err := migrate(); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := seedIfEmpty(); err != nil {
		log.Fatalf("seed: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", handleHome)
	mux.HandleFunc("POST /register", handleRegister)
	mux.HandleFunc("POST /login", handleLogin)
	mux.HandleFunc("POST /reset-password", handleResetPassword)
	mux.HandleFunc("GET /movies", handleListMovies)
	mux.HandleFunc("GET /movies/{id}", handleGetMovie)

	port := envOr("PORT", "8080")
	log.Printf("movie-db API listening on :%s", port)
	if err := http.ListenAndServe(":"+port, withCORS(withLogging(mux))); err != nil {
		log.Fatal(err)
	}
}

// ---------- database ----------

func migrate() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id BIGSERIAL PRIMARY KEY,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)`,
		`CREATE TABLE IF NOT EXISTS movies (
			id BIGSERIAL PRIMARY KEY,
			title TEXT NOT NULL,
			year INT NOT NULL,
			genre TEXT NOT NULL,
			rating NUMERIC(3,1) NOT NULL,
			description TEXT NOT NULL
		)`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			return err
		}
	}
	log.Println("schema ready (users, movies)")
	return nil
}

// seedIfEmpty inserts 200 procedurally generated movie entries on first run.
func seedIfEmpty() error {
	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM movies`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		log.Printf("movies already seeded (%d rows), skipping", count)
		return nil
	}

	adj := []string{"Shadow", "Echo", "Nova", "Crimson", "Silver", "Phantom", "Golden",
		"Frozen", "Burning", "Silent", "Lost", "Hidden", "Distant", "Endless", "Broken",
		"Rising", "Fallen", "Wandering", "Forgotten", "Electric", "Midnight", "Solar",
		"Ancient", "Wild", "Neon", "Velvet", "Savage", "Gentle", "Rapid", "Twilight"}
	noun := []string{"Horizon", "Empire", "Journey", "Kingdom", "Dream", "Night", "Storm",
		"City", "Forest", "Ocean", "Desert", "Mountain", "River", "Star", "Moon", "Sun",
		"Wind", "Fire", "Ice", "Thunder", "Valley", "Harbor", "Signal", "Protocol",
		"Memory", "Mirage", "Oracle", "Frontier", "Legacy", "Paradox"}
	genres := []string{"Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Romance",
		"Thriller", "Fantasy", "Adventure", "Mystery"}
	openers := []string{
		"A gripping story of", "An unforgettable tale about", "A stunning journey through",
		"A haunting meditation on", "A thrilling ride into", "A heartfelt portrait of",
		"An epic saga spanning", "A darkly comic look at", "A breathtaking exploration of",
		"A quiet, powerful drama about",
	}
	themes := []string{
		"a lone survivor", "two estranged siblings", "a detective chasing the truth",
		"an unlikely friendship", "a city on the brink", "a forgotten promise",
		"a young inventor", "a retired spy", "a family secret", "the last frontier",
		"a time traveler", "a runaway robot", "a small town", "a ruthless rival",
		"a hidden archive", "an orphaned pilot", "a haunted lighthouse", "a desert caravan",
		"a broken clockmaker", "a star-crossed crew",
	}
	enders := []string{
		"who must face their past.", "and the choices that define them.",
		"in a world on the edge.", "before time runs out.", "against impossible odds.",
		"with nothing left to lose.", "in the shadow of a great secret.",
		"where every moment counts.", "and the cost of redemption.",
		"in a place that never sleeps.", "caught between two worlds.",
		"whose courage changes everything.", "and the journey home.",
		"at the heart of a conspiracy.", "in search of a lost legend.",
		"and the bonds that hold them.", "when everything is at stake.",
		"through a landscape of wonder.", "and the dawn of a new era.",
		"as the world watches.", "and the silence between them.",
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(`INSERT INTO movies (title, year, genre, rating, description) VALUES ($1, $2, $3, $4, $5)`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for i := 0; i < 200; i++ {
		title := adj[rand.Intn(len(adj))] + " " + noun[rand.Intn(len(noun))]
		if rand.Intn(10) == 0 {
			title += " " + strconv.Itoa(rand.Intn(90)+2)
		}
		year := 1970 + rand.Intn(55)
		genre := genres[rand.Intn(len(genres))]
		rating := float64(rand.Intn(81)+10) / 10.0 // 1.0 - 9.0
		desc := openers[rand.Intn(len(openers))] + " " +
			themes[rand.Intn(len(themes))] + " " +
			enders[rand.Intn(len(enders))]
		if _, err := stmt.Exec(title, year, genre, rating, desc); err != nil {
			tx.Rollback()
			return err
		}
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	log.Println("seeded 200 movies")
	return nil
}

// ---------- handlers ----------

func handleHome(w http.ResponseWriter, r *http.Request) {
	var movieCount, userCount int
	db.QueryRow(`SELECT COUNT(*) FROM movies`).Scan(&movieCount)
	db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&userCount)
	writeJSON(w, http.StatusOK, map[string]any{
		"service":     "movie-db-api",
		"version":     "1.0.0",
		"status":      "ok",
		"movies":      movieCount,
		"users":       userCount,
		"dev_mode":    envOr("DEV_MODE", "true") == "true",
		"endpoints": []string{
			"POST /register",
			"POST /login",
			"POST /reset-password",
			"GET  /movies?search=",
			"GET  /movies/{id}",
			"GET  /",
		},
	})
}

func handleRegister(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || !strings.Contains(req.Email, "@") {
		writeError(w, http.StatusBadRequest, "a valid email is required")
		return
	}
	if len(req.Password) < 6 {
		writeError(w, http.StatusBadRequest, "password must be at least 6 characters")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not hash password")
		return
	}

	var u User
	err = db.QueryRow(
		`INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email`,
		req.Email, string(hash),
	).Scan(&u.ID, &u.Email)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") {
			writeError(w, http.StatusConflict, "email already registered")
			return
		}
		log.Printf("register: %v", err)
		writeError(w, http.StatusInternalServerError, "could not create user")
		return
	}

	// DEV mode: accounts are auto-confirmed, no email verification step.
	log.Printf("registered user %d (%s) [DEV mode, auto-confirmed]", u.ID, u.Email)
	writeJSON(w, http.StatusCreated, map[string]any{
		"message": "registration successful (DEV mode: auto-confirmed, no verification email)",
		"user":    u,
	})
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	var u User
	var hash string
	err := db.QueryRow(
		`SELECT id, email, password_hash FROM users WHERE email = $1`,
		req.Email,
	).Scan(&u.ID, &u.Email, &hash)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}
	if err != nil {
		log.Printf("login: %v", err)
		writeError(w, http.StatusInternalServerError, "could not query user")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	// DEV mode: return a simple placeholder token (no JWT infra needed).
	writeJSON(w, http.StatusOK, map[string]any{
		"message": "login successful",
		"user":    u,
		"token":   fmt.Sprintf("dev-token-%d-%d", u.ID, time.Now().Unix()),
	})
}

func handleResetPassword(w http.ResponseWriter, r *http.Request) {
	var req resetPasswordRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if len(req.NewPassword) < 6 {
		writeError(w, http.StatusBadRequest, "new password must be at least 6 characters")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not hash password")
		return
	}

	res, err := db.Exec(`UPDATE users SET password_hash = $1 WHERE email = $2`, string(hash), req.Email)
	if err != nil {
		log.Printf("reset-password: %v", err)
		writeError(w, http.StatusInternalServerError, "could not update password")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		writeError(w, http.StatusNotFound, "no account found for that email")
		return
	}

	// DEV mode: password reset completes immediately, no reset link sent.
	writeJSON(w, http.StatusOK, map[string]any{
		"message": "password reset successful (DEV mode: no reset email sent)",
	})
}

func handleListMovies(w http.ResponseWriter, r *http.Request) {
	search := strings.TrimSpace(r.URL.Query().Get("search"))

	query := `SELECT id, title, year, genre, rating, description FROM movies`
	args := []any{}
	if search != "" {
		query += ` WHERE title ILIKE $1 OR genre ILIKE $1 OR description ILIKE $1`
		args = append(args, "%"+search+"%")
	}
	perPage := 200
	if v := r.URL.Query().Get("per_page"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 200 {
			perPage = n
		}
	}
	query += fmt.Sprintf(` ORDER BY rating DESC, title ASC LIMIT $%d`, len(args)+1)
	args = append(args, perPage)

	rows, err := db.Query(query, args...)
	if err != nil {
		log.Printf("list movies: %v", err)
		writeError(w, http.StatusInternalServerError, "could not list movies")
		return
	}
	defer rows.Close()

	movies := []Movie{}
	for rows.Next() {
		var m Movie
		if err := rows.Scan(&m.ID, &m.Title, &m.Year, &m.Genre, &m.Rating, &m.Description); err != nil {
			log.Printf("scan movie: %v", err)
			writeError(w, http.StatusInternalServerError, "could not read movies")
			return
		}
		movies = append(movies, m)
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"count":  len(movies),
		"search": search,
		"movies": movies,
	})
}

func handleGetMovie(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id < 1 {
		writeError(w, http.StatusBadRequest, "invalid movie id")
		return
	}

	var m Movie
	err = db.QueryRow(
		`SELECT id, title, year, genre, rating, description FROM movies WHERE id = $1`,
		id,
	).Scan(&m.ID, &m.Title, &m.Year, &m.Genre, &m.Rating, &m.Description)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "movie not found")
		return
	}
	if err != nil {
		log.Printf("get movie: %v", err)
		writeError(w, http.StatusInternalServerError, "could not query movie")
		return
	}
	writeJSON(w, http.StatusOK, m)
}

// ---------- helpers ----------

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func readJSON(r *http.Request, dst any) error {
	defer r.Body.Close()
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s (%s)", r.Method, r.URL.Path, time.Since(start))
	})
}
