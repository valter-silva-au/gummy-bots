package physics

import (
	"testing"
	"time"
)

// TestLevelForXP tests level calculation based on XP thresholds.
func TestLevelForXP(t *testing.T) {
	tests := []struct {
		xp       int
		expected int
	}{
		{0, 1},
		{50, 1},
		{99, 1},
		{100, 2},
		{299, 2},
		{300, 3},
		{600, 4},
		{1000, 5},
		{1500, 6},
		{2200, 7},
		{3000, 8},
		{10000, 13},
		{36000, 20},
		{200000, 31}, // Beyond defined thresholds
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			got := LevelForXP(tt.xp)
			if got != tt.expected {
				t.Errorf("LevelForXP(%d) = %d; want %d", tt.xp, got, tt.expected)
			}
		})
	}
}

// TestBaseXP tests base XP calculation for different complexity levels.
func TestBaseXP(t *testing.T) {
	tests := []struct {
		complexity int
		expected   int
	}{
		{1, 10},
		{2, 25},
		{3, 50},
		{4, 80},
		{5, 120},
		{6, 120}, // Max complexity
		{0, 10},  // Below min
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			got := BaseXP(tt.complexity)
			if got != tt.expected {
				t.Errorf("BaseXP(%d) = %d; want %d", tt.complexity, got, tt.expected)
			}
		})
	}
}

// TestCalculateXP tests XP calculation with combo multipliers.
func TestCalculateXP(t *testing.T) {
	tests := []struct {
		complexity int
		comboCount int
		expected   int
	}{
		{1, 0, 10},   // Base XP, no combo
		{1, 1, 10},   // Base XP, 1x multiplier
		{1, 2, 15},   // 10 * 1.5 = 15
		{1, 3, 20},   // 10 * 2.0 = 20
		{1, 5, 30},   // 10 * 3.0 = 30
		{3, 5, 150},  // 50 * 3.0 = 150
		{5, 5, 360},  // 120 * 3.0 = 360
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			got := CalculateXP(tt.complexity, tt.comboCount)
			if got != tt.expected {
				t.Errorf("CalculateXP(%d, %d) = %d; want %d",
					tt.complexity, tt.comboCount, got, tt.expected)
			}
		})
	}
}

// TestComboMultiplier tests combo multiplier thresholds.
func TestComboMultiplier(t *testing.T) {
	tests := []struct {
		comboCount int
		expected   float64
	}{
		{0, 1.0},
		{1, 1.0},
		{2, 1.5},
		{3, 2.0},
		{4, 2.0},
		{5, 3.0},
		{10, 3.0},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			got := ComboMultiplier(tt.comboCount)
			if got != tt.expected {
				t.Errorf("ComboMultiplier(%d) = %.1f; want %.1f",
					tt.comboCount, got, tt.expected)
			}
		})
	}
}

// TestXPForNextLevel tests XP threshold calculation for next level.
func TestXPForNextLevel(t *testing.T) {
	tests := []struct {
		level    int
		expected int
	}{
		{1, 100},
		{2, 300},
		{3, 600},
		{10, 6600},
		{20, 43000},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			got := XPForNextLevel(tt.level)
			if got != tt.expected {
				t.Errorf("XPForNextLevel(%d) = %d; want %d", tt.level, got, tt.expected)
			}
		})
	}
}

// TestXPProgress tests progress calculation within a level.
func TestXPProgress(t *testing.T) {
	tests := []struct {
		xp       int
		level    int
		expected float64
	}{
		{0, 1, 0.0},       // Level 1 start (0 / 100)
		{50, 1, 0.5},      // Level 1 halfway (50 / 100)
		{100, 2, 0.0},     // Level 2 start (100 - 100) / (300 - 100) = 0
		{200, 2, 0.5},     // Level 2 halfway (200 - 100) / (300 - 100) = 0.5
		{300, 3, 0.0},     // Level 3 start
		{450, 3, 0.5},     // Level 3 halfway (450 - 300) / (600 - 300) = 0.5
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			got := XPProgress(tt.xp, tt.level)
			if abs(got-tt.expected) > 0.01 {
				t.Errorf("XPProgress(%d, %d) = %.2f; want %.2f",
					tt.xp, tt.level, got, tt.expected)
			}
		})
	}
}

func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

// TestUpdateStreak tests streak increment and reset logic.
func TestUpdateStreak(t *testing.T) {
	now := time.Now().UTC()
	today := now.Format("2006-01-02")
	yesterday := now.AddDate(0, 0, -1).Format("2006-01-02")
	twoDaysAgo := now.AddDate(0, 0, -2).Format("2006-01-02")

	tests := []struct {
		name         string
		lastDate     string
		currentDays  int
		expectedDays int
		expectedDate string
	}{
		{
			name:         "same day - no change",
			lastDate:     today,
			currentDays:  5,
			expectedDays: 5,
			expectedDate: today,
		},
		{
			name:         "consecutive day - increment",
			lastDate:     yesterday,
			currentDays:  5,
			expectedDays: 6,
			expectedDate: today,
		},
		{
			name:         "streak broken - reset to 1",
			lastDate:     twoDaysAgo,
			currentDays:  5,
			expectedDays: 1,
			expectedDate: today,
		},
		{
			name:         "first time - initialize to 1",
			lastDate:     "",
			currentDays:  0,
			expectedDays: 1,
			expectedDate: today,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotDays, gotDate := UpdateStreak(tt.lastDate, tt.currentDays)
			if gotDays != tt.expectedDays {
				t.Errorf("UpdateStreak() days = %d; want %d", gotDays, tt.expectedDays)
			}
			if gotDate != tt.expectedDate {
				t.Errorf("UpdateStreak() date = %s; want %s", gotDate, tt.expectedDate)
			}
		})
	}
}

// TestComboTrackerRecord tests combo tracking with rapid completions.
func TestComboTrackerRecord(t *testing.T) {
	// Use shorter window for testing
	tracker := &ComboTracker{
		window: 100 * time.Millisecond,
	}

	// Record 3 rapid completions
	count1 := tracker.Record()
	if count1 != 1 {
		t.Errorf("First record should return 1, got %d", count1)
	}

	count2 := tracker.Record()
	if count2 != 2 {
		t.Errorf("Second record should return 2, got %d", count2)
	}

	count3 := tracker.Record()
	if count3 != 3 {
		t.Errorf("Third record should return 3, got %d", count3)
	}

	// Wait for window to expire
	time.Sleep(150 * time.Millisecond)

	count4 := tracker.Record()
	if count4 != 1 {
		t.Errorf("After window expires, count should reset to 1, got %d", count4)
	}
}

// TestComboTrackerConcurrency tests thread safety of ComboTracker.
func TestComboTrackerConcurrency(t *testing.T) {
	tracker := NewComboTracker()
	done := make(chan bool, 10)

	// Launch 10 goroutines recording simultaneously
	for i := 0; i < 10; i++ {
		go func() {
			tracker.Record()
			done <- true
		}()
	}

	// Wait for all to complete
	for i := 0; i < 10; i++ {
		<-done
	}

	// Should have 10 records (no race condition)
	count := tracker.Record()
	if count != 11 {
		t.Errorf("After 10 concurrent records + 1, expected 11, got %d", count)
	}
}
