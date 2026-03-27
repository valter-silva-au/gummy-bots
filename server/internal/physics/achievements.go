package physics

// AchievementDef describes an achievement and its display metadata.
type AchievementDef struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
}

// AllAchievements is the master list of achievement definitions.
var AllAchievements = []AchievementDef{
	{ID: "first_catch", Name: "First Catch", Description: "Execute your first task", Icon: "🎯"},
	{ID: "speed_demon", Name: "Speed Demon", Description: "Catch 3 gummies in 10 seconds", Icon: "⚡"},
	{ID: "combo_master", Name: "Combo Master", Description: "Reach 5x combo multiplier", Icon: "🔥"},
	{ID: "century", Name: "Century", Description: "Earn 100+ XP in one action", Icon: "💯"},
	{ID: "inbox_zero", Name: "Inbox Zero", Description: "Clear all gummies in one session", Icon: "📭"},
	{ID: "level_10", Name: "Rising Star", Description: "Reach level 10", Icon: "⭐"},
	{ID: "level_25", Name: "Power User", Description: "Reach level 25", Icon: "🏆"},
	{ID: "week_warrior", Name: "Week Warrior", Description: "Maintain a 7-day streak", Icon: "🗓️"},
}

// AchievementDefByID returns the definition for a given achievement ID.
func AchievementDefByID(id string) *AchievementDef {
	for _, a := range AllAchievements {
		if a.ID == id {
			return &a
		}
	}
	return nil
}

// CheckContext holds the state needed to check achievement conditions.
type CheckContext struct {
	TotalExecutions int     // lifetime count of executed gummies
	ComboCount      int     // current combo count in the 30s window
	XPGained        int     // XP from this single action
	Level           int     // user's current level
	StreakDays      int     // current streak
	ActiveGummies   int     // remaining active gummies after execution
	ComboMultiplier float64 // current combo multiplier
}

// CheckAchievements returns achievement IDs that should be unlocked given context.
// already is a set of IDs the user already has — those are skipped.
func CheckAchievements(ctx CheckContext, already map[string]bool) []string {
	var unlocked []string

	check := func(id string, cond bool) {
		if cond && !already[id] {
			unlocked = append(unlocked, id)
		}
	}

	check("first_catch", ctx.TotalExecutions >= 1)
	check("speed_demon", ctx.ComboCount >= 3)
	check("combo_master", ctx.ComboMultiplier >= 3.0)
	check("century", ctx.XPGained >= 100)
	check("inbox_zero", ctx.ActiveGummies == 0)
	check("level_10", ctx.Level >= 10)
	check("level_25", ctx.Level >= 25)
	check("week_warrior", ctx.StreakDays >= 7)

	return unlocked
}
