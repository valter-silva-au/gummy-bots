package connector

import (
	"github.com/valter-silva-au/gummy-bots/server/internal/api"
	"github.com/valter-silva-au/gummy-bots/server/internal/store"
)

// Connector represents a service that generates gummies (e.g., Gmail, Calendar).
type Connector interface {
	Name() string
	Start(db *store.DB, hub *api.Hub) error
	Stop() error
}
