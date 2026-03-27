package physics

import (
	"time"
)

// LevelThresholds defines cumulative XP needed for each level.
var LevelThresholds = []int{
	0,     // Level 1
	100,   // Level 2
	300,   // Level 3
	600,   // Level 4
	1000,  // Level 5
	1500,  // Level 6
	2200,  // Level 7
	3000,  // Level 8
	4000,  // Level 9
	5200,  // Level 10
	6600,  // Level 11
	8200,  // Level 12
	10000, // Level 13
	12000, // Level 14
	14500, // Level 15
	17500, // Level 16
	21000, // Level 17
	25000, // Level 18
	30000, // Level 19
	36000, // Level 20
	43000, // Level 21
	51000, // Level 22
	60000, // Level 23
	70000, // Level 24
	81000, // Level 25
	93000, // Level 26
	106000, // Level 27
	120000, // Level 28
	136000, // Level 29
	154000, // Level 30
	175000, // Level 31+
}

// BaseXP returns XP for a task based on complexity (1-5).
func BaseXP(complexity int) int {
	switch {
	case complexity <= 1:
		return 10
	case complexity == 2:
		return 25
	case complexity == 3:
		return 50
	case complexity == 4:
		return 80
	default:
		return 120
	}
}

// CalculateXP returns total XP with combo multiplier.
func CalculateXP(complexity int, comboCount int) int {
	base := BaseXP(complexity)
	multiplier := ComboMultiplier(comboCount)
	return int(float64(base) * multiplier)
}

// ComboMultiplier returns the XP multiplier based on rapid completions.
func ComboMultiplier(comboCount int) float64 {
	switch {
	case comboCount >= 5:
		return 3.0
	case comboCount >= 3:
		return 2.0
	case comboCount >= 2:
		return 1.5
	default:
		return 1.0
	}
}

// LevelForXP returns the level for a given total XP.
func LevelForXP(xp int) int {
	for i := len(LevelThresholds) - 1; i >= 0; i-- {
		if xp >= LevelThresholds[i] {
			return i + 1
		}
	}
	return 1
}

// XPForNextLevel returns XP needed for the next level.
func XPForNextLevel(level int) int {
	if level < len(LevelThresholds) {
		return LevelThresholds[level]
	}
	// Beyond defined levels: geometric growth
	last := LevelThresholds[len(LevelThresholds)-1]
	for i := len(LevelThresholds); i <= level; i++ {
		last = int(float64(last) * 1.15)
	}
	return last
}

// XPProgress returns current progress within the level (0.0 to 1.0).
func XPProgress(xp int, level int) float64 {
	currentThreshold := 0
	if level > 1 && level-1 < len(LevelThresholds) {
		currentThreshold = LevelThresholds[level-1]
	}
	nextThreshold := XPForNextLevel(level)
	range_ := nextThreshold - currentThreshold
	if range_ <= 0 {
		return 0
	}
	progress := float64(xp-currentThreshold) / float64(range_)
	if progress > 1 {
		return 1
	}
	return progress
}

// UpdateStreak checks if the streak should be incremented or reset.
func UpdateStreak(lastDate string, currentDays int) (int, string) {
	today := time.Now().UTC().Format("2006-01-02")

	if lastDate == today {
		return currentDays, today
	}

	yesterday := time.Now().UTC().AddDate(0, 0, -1).Format("2006-01-02")
	if lastDate == yesterday {
		return currentDays + 1, today
	}

	// Streak broken
	return 1, today
}

// ComboTracker tracks rapid task completions.
type ComboTracker struct {
	timestamps []time.Time
	window     time.Duration
}

func NewComboTracker() *ComboTracker {
	return &ComboTracker{
		window: 30 * time.Second,
	}
}

func (c *ComboTracker) Record() int {
	now := time.Now()
	c.timestamps = append(c.timestamps, now)

	// Prune old timestamps
	cutoff := now.Add(-c.window)
	var valid []time.Time
	for _, t := range c.timestamps {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}
	c.timestamps = valid
	return len(c.timestamps)
}
