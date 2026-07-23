package api

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"loadforge/pkg/models"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Localhost execution
	},
}

type WSHub struct {
	mu      sync.Mutex
	clients map[*websocket.Conn]bool
}

func NewWSHub() *WSHub {
	return &WSHub{
		clients: make(map[*websocket.Conn]bool),
	}
}

func (h *WSHub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	h.mu.Lock()
	h.clients[conn] = true
	h.mu.Unlock()

	defer func() {
		h.mu.Lock()
		delete(h.clients, conn)
		h.mu.Unlock()
		conn.Close()
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func (h *WSHub) BroadcastSnapshot(snap models.MetricSnapshot) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if len(h.clients) == 0 {
		return
	}

	payload, err := json.Marshal(snap)
	if err != nil {
		return
	}

	for conn := range h.clients {
		_ = conn.WriteMessage(websocket.TextMessage, payload)
	}
}
