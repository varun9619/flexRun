package com.flexrun.app.data.repository

import com.flexrun.app.data.remote.OpenAIApi
import com.flexrun.app.data.remote.ChatCompletionRequest
import com.flexrun.app.data.remote.ChatMessage as ApiChatMessage
import com.flexrun.app.domain.model.ChatMessage
import com.flexrun.app.domain.model.RunIntent
import com.flexrun.app.domain.model.RunType
import com.flexrun.app.domain.repository.AIRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AIRepositoryImpl @Inject constructor(
    private val openAIApi: OpenAIApi
) : AIRepository {

    private val _isOnline = MutableStateFlow(true)

    private val systemPrompt = """
You are FlexRun, an AI running coach. You help users plan and execute their runs.

When a user tells you about their run plans, respond in a friendly, encouraging way and extract the following information:
- Run type (easy, tempo, interval, long_run, recovery, race)
- Distance (in km or miles)
- Duration (in minutes)
- Target pace (if mentioned)

Keep responses concise (1-2 sentences) and motivating. If the user's intent is clear, end your response with a suggestion to start the run.

Examples:
User: "I want to do a 5k easy run"
Response: "Great choice! A 5K easy run is perfect for building your base. Ready to lace up and get started?"

User: "Let's do some intervals today"
Response: "Love the energy! Interval training is great for building speed. Let's set up a session for you."
""".trimIndent()

    override suspend fun sendMessage(
        message: String,
        conversationHistory: List<ChatMessage>
    ): Result<ChatMessage> {
        return try {
            val messages = mutableListOf<ApiChatMessage>()
            
            // Add system prompt
            messages.add(ApiChatMessage(role = "system", content = systemPrompt))
            
            // Add conversation history
            conversationHistory.forEach { chat ->
                messages.add(
                    ApiChatMessage(
                        role = if (chat.isFromUser) "user" else "assistant",
                        content = chat.content
                    )
                )
            }
            
            // Add current message
            messages.add(ApiChatMessage(role = "user", content = message))
            
            val request = ChatCompletionRequest(
                model = "gpt-4o-mini",
                messages = messages,
                max_tokens = 150,
                temperature = 0.7
            )
            
            val response = openAIApi.createChatCompletion(request)
            val aiContent = response.choices.firstOrNull()?.message?.content 
                ?: "I'm ready to help you with your run. What would you like to do today?"
            
            _isOnline.value = true
            val intent = parseIntent(message)
            
            Result.success(
                ChatMessage(
                    id = UUID.randomUUID().toString(),
                    content = aiContent,
                    isFromUser = false,
                    intent = intent
                )
            )
        } catch (e: Exception) {
            _isOnline.value = false
            // Return fallback response
            Result.success(getFallbackResponse(message))
        }
    }

    override suspend fun recognizeIntent(message: String): Result<ChatMessage> {
        return sendMessage(message, emptyList())
    }

    override fun isOnline(): Flow<Boolean> = _isOnline

    private fun parseIntent(message: String): RunIntent? {
        val lowerMessage = message.lowercase()
        
        val runType = when {
            lowerMessage.contains("easy") -> RunType.EASY
            lowerMessage.contains("tempo") -> RunType.TEMPO
            lowerMessage.contains("interval") || lowerMessage.contains("speed") -> RunType.INTERVAL
            lowerMessage.contains("long") -> RunType.LONG_RUN
            lowerMessage.contains("recovery") || lowerMessage.contains("rest") -> RunType.RECOVERY
            lowerMessage.contains("race") || lowerMessage.contains("competition") -> RunType.RACE
            else -> RunType.EASY
        }
        
        // Extract distance
        val distanceRegex = Regex("""(\d+(?:\.\d+)?)\s*(k|km|kilometer|mi|mile)?""")
        val distanceMatch = distanceRegex.find(lowerMessage)
        val distance = distanceMatch?.groupValues?.get(1)?.toFloatOrNull()
        
        // Extract duration
        val durationRegex = Regex("""(\d+)\s*(min|minute|hour|h)?""")
        val durationMatch = durationRegex.find(lowerMessage)
        val duration = durationMatch?.groupValues?.get(1)?.toIntOrNull()
        
        return RunIntent(
            type = runType,
            distance = distance,
            duration = duration
        )
    }

    private fun getFallbackResponse(message: String): ChatMessage {
        val intent = parseIntent(message)
        val runTypeName = intent?.type?.name?.lowercase()?.replace("_", " ") ?: "run"
        
        val response = when {
            message.lowercase().contains("easy") -> 
                "An easy run sounds perfect! I'll set that up for you. Ready when you are! 🏃‍♂️"
            message.lowercase().contains("tempo") -> 
                "Tempo runs are great for building speed endurance! Let's get you set up."
            message.lowercase().contains("interval") -> 
                "Intervals will really boost your speed! Let me configure a session for you. ⚡"
            message.lowercase().contains("long") -> 
                "Long runs build your endurance foundation. I'll prepare a comfortable pace for you. 🛤️"
            else -> 
                "I'm ready to help you with your $runTypeName. Tap 'Start Run' when you're ready!"
        }
        
        return ChatMessage(
            id = UUID.randomUUID().toString(),
            content = response,
            isFromUser = false,
            intent = intent
        )
    }
}
