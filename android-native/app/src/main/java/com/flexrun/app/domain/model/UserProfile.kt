package com.flexrun.app.domain.model

data class UserProfile(
    val id: String,
    val name: String? = null,
    val age: Int? = null,
    val weightKg: Float? = null,
    val runningGoal: RunningGoal = RunningGoal.GENERAL_FITNESS,
    val experienceLevel: ExperienceLevel = ExperienceLevel.BEGINNER,
    val preferredUnits: Units = Units.KILOMETERS,
    val daysPerWeek: Int = 3,
    val isOnboardingComplete: Boolean = false
)

enum class RunningGoal(val displayName: String, val description: String) {
    FIRST_5K("Complete my first 5K", "Perfect for beginners, 12-week plan"),
    FASTER_5K("Run a faster 5K", "Improve your personal best time"),
    FIRST_10K("Complete my first 10K", "Build endurance, 10-week journey"),
    HALF_MARATHON("Train for a half marathon", "21.1 km of achievement"),
    MARATHON("Train for a marathon", "The ultimate running challenge"),
    GENERAL_FITNESS("General fitness & health", "Stay active, feel great")
}

enum class ExperienceLevel(val displayName: String, val description: String) {
    BEGINNER("New to Running", "Just getting started with running"),
    INTERMEDIATE("Casual Runner", "Run 1-2 times per week"),
    EXPERIENCED("Regular Runner", "Run 3+ times per week"),
    RETURNING("Returning Runner", "Getting back into the habit")
}

enum class Units(val displayName: String) {
    KILOMETERS("Kilometers"),
    MILES("Miles")
}
