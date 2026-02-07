package com.flexrun.app.presentation.screens.onboarding

import com.flexrun.app.domain.model.ExperienceLevel
import com.flexrun.app.domain.model.RunningGoal
import com.flexrun.app.domain.model.Units

data class OnboardingState(
    val currentPage: Int = 0,
    val selectedGoal: RunningGoal? = null,
    val selectedExperience: ExperienceLevel? = null,
    val selectedDays: Set<Int> = setOf(1, 3, 5), // Mon, Wed, Fri default
    val selectedUnits: Units = Units.KILOMETERS,
    val isLoading: Boolean = false,
    val canProceed: Boolean = false
) {
    val totalPages = 4
    val progress: Float = (currentPage + 1) / totalPages.toFloat()
}

sealed class OnboardingEvent {
    data object NavigateNext : OnboardingEvent()
    data object NavigateBack : OnboardingEvent()
    data class SelectGoal(val goal: RunningGoal) : OnboardingEvent()
    data class SelectExperience(val experience: ExperienceLevel) : OnboardingEvent()
    data class ToggleDay(val day: Int) : OnboardingEvent()
    data class SelectUnits(val units: Units) : OnboardingEvent()
    data object CompleteOnboarding : OnboardingEvent()
}
