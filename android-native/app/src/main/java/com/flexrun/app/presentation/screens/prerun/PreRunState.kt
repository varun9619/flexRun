package com.flexrun.app.presentation.screens.prerun

import com.flexrun.app.domain.model.RunIntent
import com.flexrun.app.domain.model.RunType

data class PreRunState(
    val runType: RunType = RunType.EASY,
    val distance: Float = 5.0f,
    val estimatedDuration: Int = 30,
    val targetPace: String = "6:00",
    val warmUpEnabled: Boolean = true,
    val coolDownEnabled: Boolean = true,
    val voiceCoachingEnabled: Boolean = true,
    val tip: String = "Remember to stay hydrated!",
    val isLoading: Boolean = false
) {
    companion object {
        fun fromIntent(intent: RunIntent): PreRunState {
            return PreRunState(
                runType = intent.type,
                distance = intent.distance ?: when (intent.type) {
                    RunType.EASY -> 5.0f
                    RunType.TEMPO -> 5.0f
                    RunType.INTERVAL -> 3.0f
                    RunType.LONG_RUN -> 15.0f
                    RunType.RECOVERY -> 3.0f
                    RunType.RACE -> 5.0f
                },
                estimatedDuration = intent.duration ?: 30,
                warmUpEnabled = intent.warmUp,
                coolDownEnabled = intent.coolDown,
                voiceCoachingEnabled = intent.coachingEnabled
            )
        }
    }
}

sealed class PreRunEvent {
    data class UpdateDistance(val distance: Float) : PreRunEvent()
    data class UpdateDuration(val duration: Int) : PreRunEvent()
    data class ToggleWarmUp(val enabled: Boolean) : PreRunEvent()
    data class ToggleCoolDown(val enabled: Boolean) : PreRunEvent()
    data class ToggleVoiceCoaching(val enabled: Boolean) : PreRunEvent()
    data object StartRun : PreRunEvent()
    data object GoBack : PreRunEvent()
}
