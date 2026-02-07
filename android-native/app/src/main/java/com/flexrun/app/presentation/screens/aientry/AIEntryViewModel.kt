package com.flexrun.app.presentation.screens.aientry

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flexrun.app.domain.model.ChatMessage
import com.flexrun.app.domain.model.RunIntent
import com.flexrun.app.domain.repository.AIRepository
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
class AIEntryViewModel @Inject constructor(
    private val aiRepository: AIRepository
) : ViewModel() {

    private val _state = MutableStateFlow(AIEntryState())
    val state: StateFlow<AIEntryState> = _state.asStateFlow()

    private val _navigationEvent = MutableSharedFlow<NavigationEvent>()
    val navigationEvent = _navigationEvent.asSharedFlow()

    sealed class NavigationEvent {
        data class NavigateToPreRun(val intent: RunIntent) : NavigationEvent()
    }

    init {
        // Add welcome message
        val welcomeMessage = ChatMessage(
            id = UUID.randomUUID().toString(),
            content = "Hey! 👋 What would you like to do today? You can tell me about your run plans or tap a quick action below.",
            isFromUser = false
        )
        _state.update { it.copy(messages = listOf(welcomeMessage)) }
        
        // Observe online status
        viewModelScope.launch {
            aiRepository.isOnline().collect { online ->
                _state.update { it.copy(isOnline = online) }
            }
        }
    }

    fun onEvent(event: AIEntryEvent) {
        when (event) {
            is AIEntryEvent.UpdateInput -> updateInput(event.text)
            is AIEntryEvent.SendMessage -> sendMessage()
            is AIEntryEvent.QuickActionSelected -> handleQuickAction(event.action)
            is AIEntryEvent.ClearConversation -> clearConversation()
        }
    }

    private fun updateInput(text: String) {
        _state.update { it.copy(inputText = text) }
    }

    private fun sendMessage() {
        val message = _state.value.inputText.trim()
        if (message.isEmpty()) return

        val userMessage = ChatMessage(
            id = UUID.randomUUID().toString(),
            content = message,
            isFromUser = true
        )

        _state.update { 
            it.copy(
                messages = it.messages + userMessage,
                inputText = "",
                isLoading = true
            )
        }

        viewModelScope.launch {
            val result = aiRepository.sendMessage(message, _state.value.messages)
            result.onSuccess { aiResponse ->
                _state.update { 
                    it.copy(
                        messages = it.messages + aiResponse,
                        isLoading = false
                    )
                }
            }.onFailure {
                _state.update { it.copy(isLoading = false) }
            }
        }
    }

    private fun handleQuickAction(action: QuickAction) {
        val userMessage = ChatMessage(
            id = UUID.randomUUID().toString(),
            content = "I want to do ${action.label.lowercase()}",
            isFromUser = true
        )

        _state.update { 
            it.copy(
                messages = it.messages + userMessage,
                isLoading = true
            )
        }

        viewModelScope.launch {
            val result = aiRepository.sendMessage(userMessage.content, _state.value.messages)
            result.onSuccess { aiResponse ->
                _state.update { 
                    it.copy(
                        messages = it.messages + aiResponse,
                        isLoading = false
                    )
                }
            }.onFailure {
                _state.update { it.copy(isLoading = false) }
            }
        }
    }

    private fun clearConversation() {
        val welcomeMessage = ChatMessage(
            id = UUID.randomUUID().toString(),
            content = "Hey! 👋 What would you like to do today?",
            isFromUser = false
        )
        _state.update { it.copy(messages = listOf(welcomeMessage)) }
    }

    fun startRun(intent: RunIntent) {
        viewModelScope.launch {
            _navigationEvent.emit(NavigationEvent.NavigateToPreRun(intent))
        }
    }
}
