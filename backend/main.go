package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os/exec"
	"runtime"

	"loadforge/pkg/api"
	"loadforge/pkg/db"
	"loadforge/pkg/engine"
)

//go:embed dist/*
var distFS embed.FS

func main() {
	port := flag.Int("port", 8080, "Port to run LoadForge server on")
	dbPath := flag.String("db", "", "Path to SQLite database file")
	openBrowser := flag.Bool("browser", false, "Open browser automatically on start")
	flag.Parse()

	log.Println("==================================================")
	log.Println("⚡ LoadForge - Advanced Load Testing Platform")
	log.Println("==================================================")

	database, err := db.InitDB(*dbPath)
	if err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v", err)
	}

	execEngine := engine.NewExecutionEngine()
	wsHub := api.NewWSHub()
	server := api.NewServer(database, execEngine, wsHub)

	mux := http.NewServeMux()
	server.RegisterRoutes(mux)

	// Serve Frontend Static Bundle or Fallback
	distSub, err := fs.Sub(distFS, "dist")
	if err == nil {
		fileServer := http.FileServer(http.FS(distSub))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if len(r.URL.Path) > 1 && !r.URL.Query().Has("api") {
				// Check if file exists
				f, err := distSub.Open(r.URL.Path[1:])
				if err == nil {
					_ = f.Close()
					fileServer.ServeHTTP(w, r)
					return
				}
			}
			// Fallback to SPA index.html or simple response if dist empty
			indexFile, err := distSub.Open("index.html")
			if err == nil {
				_ = indexFile.Close()
				r.URL.Path = "/"
				fileServer.ServeHTTP(w, r)
				return
			}
			w.Header().Set("Content-Type", "text/html")
			fmt.Fprintf(w, "<h1>⚡ LoadForge Backend API Running on port %d</h1><p>Frontend dev server available at http://localhost:5173</p>", *port)
		})
	}

	addr := fmt.Sprintf(":%d", *port)
	serverURL := fmt.Sprintf("http://localhost:%d", *port)
	log.Printf("Server listening at %s", serverURL)

	if *openBrowser {
		go openURL(serverURL)
	}

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}

func openURL(url string) {
	var err error
	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	}
	if err != nil {
		log.Printf("Could not open browser automatically: %v", err)
	}
}
