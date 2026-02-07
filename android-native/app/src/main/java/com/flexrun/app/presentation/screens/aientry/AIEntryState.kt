package com.flexrun.app.presentation.screens.aientry

import com.flexrun.app.domain.model.ChatMessage
import com.flexrun.app.domain.model.RunType

data class AIEntryState(
    val messages: List<ChatMessage> = emptyList(),
    val inputText: String = "",
    val isLoading: Boolean = false,
    val isOnline: Boolean = true,
    val quickActions: List<QuickAction> = defaultQuickActions
)

data class QuickAction(
    val type: RunType,
    val emoji: String,
    val label: String
)

val defaultQuickActions = listOf(
    QuickAction(RunType.EASY, "🚶", "Easy Run"),
    QuickAction(RunType.TEMPO, "🏃", "Tempo"),
    QuickAction(RunType.INTERVAL, "⚡", "Intervals"),
    QuickAction(RunType.LONG_RUN, "🛤️", "Long Run"),
    QuickAction(RunType.RECOVERY, "🧘", "Recovery"),
    QuickAction(RunType.RACE, "🏁", "Race")
)

sealed class AIEntryEvent {
    data class UpdateInput(val text: String) : AIEntryEvent()
    data object SendMessage : AIEntryEvent()
    data class QuickActionSelected(val action: QuickAction) : AIEntryEvent()
    data object ClearConversation : AIEntryEvent()
}
