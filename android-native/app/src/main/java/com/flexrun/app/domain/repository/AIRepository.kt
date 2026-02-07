package com.flexrun.app.domain.repository

import com.flexrun.app.domain.model.ChatMessage
import kotlinx.coroutines.flow.Flow

interface AIRepository {
    suspend fun sendMessage(message: String, conversationHistory: List<ChatMessage>): Result<ChatMessage>
    suspend fun recognizeIntent(message: String): Result<ChatMessage>
    fun isOnline(): Flow<Boolean>
}
