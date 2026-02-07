package com.flexrun.app.presentation.screens.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flexrun.app.domain.model.ExperienceLevel
import com.flexrun.app.domain.model.RunningGoal
import com.flexrun.app.domain.model.Units
import com.flexrun.app.domain.model.UserProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class OnboardingViewModel @Inject constructor() : ViewModel() {

    private val _state = MutableStateFlow(OnboardingState())
    val state: StateFlow<OnboardingState> = _state.asStateFlow()

    private val _navigationEvent = MutableSharedFlow<NavigationEvent>()
    val navigationEvent = _navigationEvent.asSharedFlow()

    sealed class NavigationEvent {
        data object NavigateToHome : NavigationEvent()
    }

    fun onEvent(event: OnboardingEvent) {
        when (event) {
            is OnboardingEvent.NavigateNext -> navigateNext()
            is OnboardingEvent.NavigateBack -> navigateBack()
            is OnboardingEvent.SelectGoal -> selectGoal(event.goal)
            is OnboardingEvent.SelectExperience -> selectExperience(event.experience)
            is OnboardingEvent.ToggleDay -> toggleDay(event.day)
            is OnboardingEvent.SelectUnits -> selectUnits(event.units)
            is OnboardingEvent.CompleteOnboarding -> completeOnboarding()
        }
    }

    private fun navigateNext() {
        _state.update { currentState ->
            if (currentState.currentPage < currentState.totalPages - 1) {
                currentState.copy(currentPage = currentState.currentPage + 1)
            } else {
                currentState
            }
        }
        updateCanProceed()
    }

    private fun navigateBack() {
        _state.update { currentState ->
            if (currentState.currentPage > 0) {
                currentState.copy(currentPage = currentState.currentPage - 1)
            } else {
                currentState
            }
        }
        updateCanProceed()
    }

    private fun selectGoal(goal: RunningGoal) {
        _state.update { it.copy(selectedGoal = goal) }
        updateCanProceed()
    }

    private fun selectExperience(experience: ExperienceLevel) {
        _state.update { it.copy(selectedExperience = experience) }
        updateCanProceed()
    }

    private fun toggleDay(day: Int) {
        _state.update { currentState ->
            val currentDays = currentState.selectedDays.toMutableSet()
            if (currentDays.contains(day)) {
                if (currentDays.size > 1) { // Keep at least one day selected
                    currentDays.remove(day)
                }
            } else {
                currentDays.add(day)
            }
            currentState.copy(selectedDays = currentDays)
        }
        updateCanProceed()
    }

    private fun selectUnits(units: Units) {
        _state.update { it.copy(selectedUnits = units) }
        updateCanProceed()
    }

    private fun updateCanProceed() {
        _state.update { currentState ->
            val canProceed = when (currentState.currentPage) {
                0 -> true // Welcome page
                1 -> currentState.selectedGoal != null
                2 -> currentState.selectedExperience != null
                3 -> currentState.selectedDays.isNotEmpty()
                else -> true
            }
            currentState.copy(canProceed = canProceed)
        }
    }

    private fun completeOnboarding() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            
            // Create user profile
            val profile = UserProfile(
                id = UUID.randomUUID().toString(),
                runningGoal = _state.value.selectedGoal ?: RunningGoal.GENERAL_FITNESS,
                experienceLevel = _state.value.selectedExperience ?: ExperienceLevel.BEGINNER,
                preferredUnits = _state.value.selectedUnits,
                daysPerWeek = _state.value.selectedDays.size,
                isOnboardingComplete = true
            )
            
            // TODO: Save profile to repository
            
            _state.update { it.copy(isLoading = false) }
            _navigationEvent.emit(NavigationEvent.NavigateToHome)
        }
    }
}
