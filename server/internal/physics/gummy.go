package physics

import (
	"math"
	"math/rand"

	"github.com/valter-silva-au/gummy-bots/server/internal/store"
)

// CategoryColors maps task categories to gummy colors.
var CategoryColors = map[string]string{
	"comms":      "#4a90ff",
	"calendar":   "#44cc66",
	"info":       "#ff8833",
	"urgent":     "#ff4455",
	"automation": "#aa66ff",
}

// GenerateGummy creates a gummy from a task based on its properties.
func GenerateGummy(task *store.Task) *store.Gummy {
	color := CategoryColors[task.Category]
	if color == "" {
		color = "#ff8833" // default to info
	}

	// Size scales with complexity (1-5 → 0.7-1.3)
	size := 0.7 + float64(task.Complexity-1)*0.15
	size = math.Max(0.7, math.Min(1.3, size))

	// Orbit radius: urgent tasks orbit closer (lower radius)
	baseRadius := 180.0
	priorityOffset := float64(10-task.Priority) * 5 // Higher priority = closer
	orbitRadius := baseRadius - priorityOffset + (rand.Float64()-0.5)*20

	// Orbit speed: urgent tasks orbit faster
	baseSpeed := 10000.0
	speedFactor := 1.0 + float64(task.Priority-5)*0.05
	orbitSpeed := baseSpeed / speedFactor + (rand.Float64()-0.5)*2000

	return &store.Gummy{
		TaskID:      task.ID,
		Color:       color,
		Size:        size,
		OrbitRadius: math.Max(120, math.Min(200, orbitRadius)),
		OrbitSpeed:  math.Max(6000, math.Min(14000, orbitSpeed)),
		Status:      "orbiting",
	}
}
