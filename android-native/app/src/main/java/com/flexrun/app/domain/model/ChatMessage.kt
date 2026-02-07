package com.flexrun.app.domain.model

data class ChatMessage(
    val id: String,
    val content: String,
    val isFromUser: Boolean,
    val timestamp: Long = System.currentTimeMillis(),
    val intent: RunIntent? = null
)

data class RunIntent(
    val type: RunType,
    val distance: Float? = null,
    val duration: Int? = null,
    val targetPace: String? = null,
    val warmUp: Boolean = true,
    val coolDown: Boolean = true,
    val coachingEnabled: Boolean = true
)
