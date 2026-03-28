package physics

import (
	"testing"
)

// TestAllAchievementsHaveRequiredFields verifies achievement definitions.
func TestAllAchievementsHaveRequiredFields(t *testing.T) {
	if len(AllAchievements) == 0 {
		t.Fatal("AllAchievements should not be empty")
	}

	for _, ach := range AllAchievements {
		if ach.ID == "" {
			t.Errorf("Achievement missing ID: %+v", ach)
		}
		if ach.Name == "" {
			t.Errorf("Achievement %s missing Name", ach.ID)
		}
		if ach.Description == "" {
			t.Errorf("Achievement %s missing Description", ach.ID)
		}
		if ach.Icon == "" {
			t.Errorf("Achievement %s missing Icon", ach.ID)
		}
	}
}

// TestAchievementDefByID tests achievement lookup by ID.
func TestAchievementDefByID(t *testing.T) {
	tests := []struct {
		id       string
		expected bool // true if should exist
	}{
		{"first_catch", true},
		{"speed_demon", true},
		{"combo_master", true},
		{"century", true},
		{"inbox_zero", true},
		{"level_10", true},
		{"level_25", true},
		{"week_warrior", true},
		{"nonexistent", false},
		{"", false},
	}

	for _, tt := range tests {
		t.Run(tt.id, func(t *testing.T) {
			def := AchievementDefByID(tt.id)
			if tt.expected && def == nil {
				t.Errorf("Expected to find achievement %s, got nil", tt.id)
			}
			if !tt.expected && def != nil {
				t.Errorf("Expected nil for %s, got %+v", tt.id, def)
			}
			if def != nil && def.ID != tt.id {
				t.Errorf("Expected ID %s, got %s", tt.id, def.ID)
			}
		})
	}
}

// TestCheckAchievements_FirstCatch tests first_catch achievement.
func TestCheckAchievements_FirstCatch(t *testing.T) {
	ctx := CheckContext{
		TotalExecutions: 1,
		ComboCount:      1,
		XPGained:        10,
		Level:           1,
		StreakDays:      1,
		ActiveGummies:   5,
		ComboMultiplier: 1.0,
	}

	already := make(map[string]bool)
	unlocked := CheckAchievements(ctx, already)

	found := false
	for _, id := range unlocked {
		if id == "first_catch" {
			found = true
			break
		}
	}

	if !found {
		t.Error("Expected first_catch to be unlocked on first execution")
	}

	// Should not unlock again if already have it
	already["first_catch"] = true
	unlocked = CheckAchievements(ctx, already)
	for _, id := range unlocked {
		if id == "first_catch" {
			t.Error("first_catch should not unlock twice")
		}
	}
}

// TestCheckAchievements_SpeedDemon tests speed_demon achievement (3+ combo).
func TestCheckAchievements_SpeedDemon(t *testing.T) {
	ctx := CheckContext{
		TotalExecutions: 3,
		ComboCount:      3,
		XPGained:        20,
		Level:           1,
		StreakDays:      1,
		ActiveGummies:   0,
		ComboMultiplier: 2.0,
	}

	already := make(map[string]bool)
	unlocked := CheckAchievements(ctx, already)

	found := false
	for _, id := range unlocked {
		if id == "speed_demon" {
			found = true
			break
		}
	}

	if !found {
		t.Error("Expected speed_demon to be unlocked with combo >= 3")
	}

	// Should not unlock with combo < 3
	ctx.ComboCount = 2
	unlocked = CheckAchievements(ctx, already)
	for _, id := range unlocked {
		if id == "speed_demon" {
			t.Error("speed_demon should not unlock with combo < 3")
		}
	}
}

// TestCheckAchievements_ComboMaster tests combo_master achievement (5x multiplier).
func TestCheckAchievements_ComboMaster(t *testing.T) {
	ctx := CheckContext{
		TotalExecutions: 5,
		ComboCount:      5,
		XPGained:        30,
		Level:           1,
		StreakDays:      1,
		ActiveGummies:   0,
		ComboMultiplier: 3.0,
	}

	already := make(map[string]bool)
	unlocked := CheckAchievements(ctx, already)

	found := false
	for _, id := range unlocked {
		if id == "combo_master" {
			found = true
			break
		}
	}

	if !found {
		t.Error("Expected combo_master to be unlocked with 3.0x multiplier")
	}
}

// TestCheckAchievements_Century tests century achievement (100+ XP).
func TestCheckAchievements_Century(t *testing.T) {
	ctx := CheckContext{
		TotalExecutions: 1,
		ComboCount:      5,
		XPGained:        120,
		Level:           1,
		StreakDays:      1,
		ActiveGummies:   0,
		ComboMultiplier: 3.0,
	}

	already := make(map[string]bool)
	unlocked := CheckAchievements(ctx, already)

	found := false
	for _, id := range unlocked {
		if id == "century" {
			found = true
			break
		}
	}

	if !found {
		t.Error("Expected century to be unlocked with XP >= 100")
	}

	// Should not unlock with XP < 100
	ctx.XPGained = 99
	unlocked = CheckAchievements(ctx, already)
	for _, id := range unlocked {
		if id == "century" {
			t.Error("century should not unlock with XP < 100")
		}
	}
}

// TestCheckAchievements_InboxZero tests inbox_zero achievement.
func TestCheckAchievements_InboxZero(t *testing.T) {
	ctx := CheckContext{
		TotalExecutions: 10,
		ComboCount:      1,
		XPGained:        10,
		Level:           1,
		StreakDays:      1,
		ActiveGummies:   0, // All cleared
		ComboMultiplier: 1.0,
	}

	already := make(map[string]bool)
	unlocked := CheckAchievements(ctx, already)

	found := false
	for _, id := range unlocked {
		if id == "inbox_zero" {
			found = true
			break
		}
	}

	if !found {
		t.Error("Expected inbox_zero to be unlocked with 0 active gummies")
	}

	// Should not unlock if gummies remain
	ctx.ActiveGummies = 1
	unlocked = CheckAchievements(ctx, already)
	for _, id := range unlocked {
		if id == "inbox_zero" {
			t.Error("inbox_zero should not unlock with active gummies remaining")
		}
	}
}

// TestCheckAchievements_LevelMilestones tests level-based achievements.
func TestCheckAchievements_LevelMilestones(t *testing.T) {
	tests := []struct {
		name                string
		level               int
		alreadyHas          []string
		expectedAchievements []string
	}{
		{"level 10 first time", 10, []string{}, []string{"level_10"}},
		{"level 15 already has 10", 15, []string{"level_10"}, []string{}},
		{"level 25 first time", 25, []string{"level_10"}, []string{"level_25"}},
		{"level 5 no achievement", 5, []string{}, []string{}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := CheckContext{
				TotalExecutions: 1,
				ComboCount:      1,
				XPGained:        10,
				Level:           tt.level,
				StreakDays:      1,
				ActiveGummies:   0,
				ComboMultiplier: 1.0,
			}

			already := make(map[string]bool)
			for _, ach := range tt.alreadyHas {
				already[ach] = true
			}

			unlocked := CheckAchievements(ctx, already)

			for _, expected := range tt.expectedAchievements {
				found := false
				for _, id := range unlocked {
					if id == expected {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("Expected achievement %s to be unlocked at level %d", expected, tt.level)
				}
			}
		})
	}
}

// TestCheckAchievements_WeekWarrior tests week_warrior achievement (7-day streak).
func TestCheckAchievements_WeekWarrior(t *testing.T) {
	ctx := CheckContext{
		TotalExecutions: 7,
		ComboCount:      1,
		XPGained:        10,
		Level:           1,
		StreakDays:      7,
		ActiveGummies:   0,
		ComboMultiplier: 1.0,
	}

	already := make(map[string]bool)
	unlocked := CheckAchievements(ctx, already)

	found := false
	for _, id := range unlocked {
		if id == "week_warrior" {
			found = true
			break
		}
	}

	if !found {
		t.Error("Expected week_warrior to be unlocked with 7-day streak")
	}

	// Should not unlock with streak < 7
	ctx.StreakDays = 6
	unlocked = CheckAchievements(ctx, already)
	for _, id := range unlocked {
		if id == "week_warrior" {
			t.Error("week_warrior should not unlock with streak < 7")
		}
	}
}

// TestCheckAchievements_NoTrigger tests that no achievements unlock when conditions aren't met.
func TestCheckAchievements_NoTrigger(t *testing.T) {
	ctx := CheckContext{
		TotalExecutions: 0,
		ComboCount:      1,
		XPGained:        10,
		Level:           1,
		StreakDays:      1,
		ActiveGummies:   5,
		ComboMultiplier: 1.0,
	}

	// Mark all achievements as already unlocked
	already := make(map[string]bool)
	for _, ach := range AllAchievements {
		already[ach.ID] = true
	}

	unlocked := CheckAchievements(ctx, already)

	if len(unlocked) > 0 {
		t.Errorf("Expected no achievements to unlock when all already have them, got %v", unlocked)
	}
}

// TestCheckAchievements_MultipleUnlocks tests multiple achievements unlocking at once.
func TestCheckAchievements_MultipleUnlocks(t *testing.T) {
	ctx := CheckContext{
		TotalExecutions: 1,
		ComboCount:      5,
		XPGained:        120,
		Level:           10,
		StreakDays:      7,
		ActiveGummies:   0,
		ComboMultiplier: 3.0,
	}

	already := make(map[string]bool)
	unlocked := CheckAchievements(ctx, already)

	// Should unlock: first_catch, speed_demon, combo_master, century, inbox_zero, level_10, week_warrior
	expectedCount := 7
	if len(unlocked) != expectedCount {
		t.Errorf("Expected %d achievements to unlock, got %d: %v",
			expectedCount, len(unlocked), unlocked)
	}

	// Verify specific achievements are present
	expected := []string{"first_catch", "speed_demon", "combo_master", "century", "inbox_zero", "level_10", "week_warrior"}
	for _, exp := range expected {
		found := false
		for _, id := range unlocked {
			if id == exp {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected achievement %s to be unlocked", exp)
		}
	}
}
