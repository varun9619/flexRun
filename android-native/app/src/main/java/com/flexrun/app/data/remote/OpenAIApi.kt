package com.flexrun.app.data.remote

import retrofit2.http.Body
import retrofit2.http.POST

interface OpenAIApi {

    @POST("v1/chat/completions")
    suspend fun createChatCompletion(
        @Body request: ChatCompletionRequest
    ): ChatCompletionResponse
}

data class ChatCompletionRequest(
    val model: String = "gpt-4o-mini",
    val messages: List<ChatMessage>,
    val temperature: Double = 0.7,
    val max_tokens: Int = 500
) {
    // Alternate constructor for compatibility
    constructor(
        model: String,
        messages: List<ChatMessage>,
        maxTokens: Int,
        temperature: Double
    ) : this(model, messages, temperature, maxTokens)
}

data class ChatMessage(
    val role: String,  // "system", "user", "assistant"
    val content: String
)

data class ChatCompletionResponse(
    val id: String,
    val choices: List<Choice>
)

data class Choice(
    val message: ChatMessage,
    val finish_reason: String?
)
