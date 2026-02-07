package com.flexrun.app.presentation.screens.prerun

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flexrun.app.domain.model.RunIntent
import com.flexrun.app.domain.model.RunType
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PreRunViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _state = MutableStateFlow(PreRunState())
    val state: StateFlow<PreRunState> = _state.asStateFlow()

    private val _navigationEvent = MutableSharedFlow<NavigationEvent>()
    val navigationEvent = _navigationEvent.asSharedFlow()

    sealed class NavigationEvent {
        data object NavigateToActiveRun : NavigationEvent()
        data object NavigateBack : NavigationEvent()
    }

    private val tips = mapOf(
        RunType.EASY to listOf(
            "Keep your pace conversational - you should be able to chat!",
            "Focus on enjoying the run, not the speed.",
            "Easy runs build your aerobic base.",
            "Remember: slow is smooth, smooth is fast!"
        ),
        RunType.TEMPO to listOf(
            "Maintain a 'comfortably hard' effort.",
            "You should be able to speak in short phrases.",
            "Focus on steady breathing throughout.",
            "Tempo runs improve your lactate threshold!"
        ),
        RunType.INTERVAL to listOf(
            "Give 90-95% effort during work intervals.",
            "Recovery is just as important as the speed work.",
            "Focus on form during the fast segments.",
            "Intervals make you faster and stronger!"
        ),
        RunType.LONG_RUN to listOf(
            "Start slower than you think you should.",
            "Stay fueled and hydrated throughout.",
            "Break it into mental segments.",
            "Long runs build mental toughness!"
        ),
        RunType.RECOVERY to listOf(
            "Keep it very easy - slower than you think.",
            "Listen to your body today.",
            "Recovery runs flush out fatigue.",
            "This is active rest - enjoy it!"
        ),
        RunType.RACE to listOf(
            "Trust your training!",
            "Start conservative, finish strong.",
            "Visualize your success.",
            "You've got this! 🏁"
        )
    )

    init {
        updateTip()
    }

    fun initializeFromIntent(intent: RunIntent) {
        _state.value = PreRunState.fromIntent(intent)
        updateTip()
        calculatePace()
    }

    fun onEvent(event: PreRunEvent) {
        when (event) {
            is PreRunEvent.UpdateDistance -> updateDistance(event.distance)
            is PreRunEvent.UpdateDuration -> updateDuration(event.duration)
            is PreRunEvent.ToggleWarmUp -> toggleWarmUp(event.enabled)
            is PreRunEvent.ToggleCoolDown -> toggleCoolDown(event.enabled)
            is PreRunEvent.ToggleVoiceCoaching -> toggleVoiceCoaching(event.enabled)
            is PreRunEvent.StartRun -> startRun()
            is PreRunEvent.GoBack -> goBack()
        }
    }

    private fun updateDistance(distance: Float) {
        _state.update { it.copy(distance = distance) }
        calculatePace()
    }

    private fun updateDuration(duration: Int) {
        _state.update { it.copy(estimatedDuration = duration) }
        calculatePace()
    }

    private fun toggleWarmUp(enabled: Boolean) {
        _state.update { it.copy(warmUpEnabled = enabled) }
    }

    private fun toggleCoolDown(enabled: Boolean) {
        _state.update { it.copy(coolDownEnabled = enabled) }
    }

    private fun toggleVoiceCoaching(enabled: Boolean) {
        _state.update { it.copy(voiceCoachingEnabled = enabled) }
    }

    private fun calculatePace() {
        val distance = _state.value.distance
        val duration = _state.value.estimatedDuration
        
        if (distance > 0) {
            val paceMinutes = duration / distance
            val minutes = paceMinutes.toInt()
            val seconds = ((paceMinutes - minutes) * 60).toInt()
            val paceString = String.format("%d:%02d", minutes, seconds)
            _state.update { it.copy(targetPace = paceString) }
        }
    }

    private fun updateTip() {
        val runType = _state.value.runType
        val tipsList = tips[runType] ?: tips[RunType.EASY]!!
        val randomTip = tipsList.random()
        _state.update { it.copy(tip = randomTip) }
    }

    private fun startRun() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            // TODO: Create run session in database
            _navigationEvent.emit(NavigationEvent.NavigateToActiveRun)
        }
    }

    private fun goBack() {
        viewModelScope.launch {
            _navigationEvent.emit(NavigationEvent.NavigateBack)
        }
    }
}
