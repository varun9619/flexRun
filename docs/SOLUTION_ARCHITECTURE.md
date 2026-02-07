# FlexRun - Solution Architecture Document

**Version**: 1.0  
**Last Updated**: February 6, 2026  
**Platform**: Native Android (Kotlin)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Compose  │ │ Compose  │ │ Compose  │ │ Compose  │            │
│  │   UI     │ │   UI     │ │   UI     │ │   UI     │            │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│       │            │            │            │                   │
│  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐            │
│  │ViewModel│ │ViewModel│ │ViewModel│ │ViewModel│            │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            │
├───────┴────────────┴────────────┴────────────┴───────────────────┤
│                         DOMAIN LAYER                             │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐        │
│  │   Use Cases    │ │   Use Cases    │ │   Use Cases    │        │
│  │  (Interactors) │ │  (Interactors) │ │  (Interactors) │        │
│  └───────┬────────┘ └───────┬────────┘ └───────┬────────┘        │
│          │                  │                  │                 │
│  ┌───────┴──────────────────┴──────────────────┴───────┐         │
│  │              Domain Models / Entities                │         │
│  └─────────────────────────┬───────────────────────────┘         │
├────────────────────────────┴─────────────────────────────────────┤
│                          DATA LAYER                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│  │  Repository  │ │  Repository  │ │  Repository  │              │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘              │
│         │                │                │                      │
│  ┌──────┴────┐    ┌──────┴────┐    ┌──────┴────┐                 │
│  │ Local DB  │    │ Location  │    │ OpenAI   │                 │
│  │   (Room)  │    │  Service  │    │   API    │                 │
│  └───────────┘    └───────────┘    └──────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **UI** | Jetpack Compose | Modern declarative UI |
| **Navigation** | Navigation Compose | Type-safe navigation |
| **State Management** | ViewModel + StateFlow | Reactive state |
| **DI** | Hilt | Dependency injection |
| **Database** | Room | Local persistence |
| **Preferences** | DataStore | Settings storage |
| **Networking** | Retrofit + OkHttp | API calls |
| **Location** | FusedLocationProvider | GPS tracking |
| **Speech** | Android TTS | Voice coaching |
| **Async** | Kotlin Coroutines + Flow | Concurrency |
| **Testing** | JUnit, Espresso, Mockk | Testing |

### 1.3 Project Structure

```
app/
├── src/main/
│   ├── java/com/flexrun/
│   │   ├── FlexRunApplication.kt
│   │   │
│   │   ├── di/                           # Dependency Injection
│   │   │   ├── AppModule.kt
│   │   │   ├── DatabaseModule.kt
│   │   │   ├── NetworkModule.kt
│   │   │   └── LocationModule.kt
│   │   │
│   │   ├── data/                         # Data Layer
│   │   │   ├── local/
│   │   │   │   ├── db/
│   │   │   │   │   ├── FlexRunDatabase.kt
│   │   │   │   │   ├── dao/
│   │   │   │   │   │   ├── RunSessionDao.kt
│   │   │   │   │   │   └── UserProfileDao.kt
│   │   │   │   │   └── entity/
│   │   │   │   │       ├── RunSessionEntity.kt
│   │   │   │   │       └── UserProfileEntity.kt
│   │   │   │   └── datastore/
│   │   │   │       └── SettingsDataStore.kt
│   │   │   │
│   │   │   ├── remote/
│   │   │   │   ├── api/
│   │   │   │   │   └── OpenAIApi.kt
│   │   │   │   └── dto/
│   │   │   │       ├── IntentRequestDto.kt
│   │   │   │       └── IntentResponseDto.kt
│   │   │   │
│   │   │   └── repository/
│   │   │       ├── RunRepository.kt
│   │   │       ├── ProfileRepository.kt
│   │   │       └── AIRepository.kt
│   │   │
│   │   ├── domain/                       # Domain Layer
│   │   │   ├── model/
│   │   │   │   ├── RunSession.kt
│   │   │   │   ├── UserProfile.kt
│   │   │   │   ├── RunType.kt
│   │   │   │   ├── LocationPoint.kt
│   │   │   │   └── PaceRange.kt
│   │   │   │
│   │   │   └── usecase/
│   │   │       ├── ai/
│   │   │       │   ├── RecognizeIntentUseCase.kt
│   │   │       │   └── GenerateCoachingMessageUseCase.kt
│   │   │       ├── run/
│   │   │       │   ├── StartRunUseCase.kt
│   │   │       │   ├── PauseRunUseCase.kt
│   │   │       │   ├── StopRunUseCase.kt
│   │   │       │   └── CalculatePaceUseCase.kt
│   │   │       ├── history/
│   │   │       │   ├── GetRunHistoryUseCase.kt
│   │   │       │   └── GetRunDetailsUseCase.kt
│   │   │       └── profile/
│   │   │           ├── GetProfileUseCase.kt
│   │   │           └── UpdateProfileUseCase.kt
│   │   │
│   │   ├── presentation/                 # Presentation Layer
│   │   │   ├── navigation/
│   │   │   │   ├── FlexRunNavHost.kt
│   │   │   │   └── Screen.kt
│   │   │   │
│   │   │   ├── theme/
│   │   │   │   ├── Color.kt
│   │   │   │   ├── Type.kt
│   │   │   │   └── Theme.kt
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── FlexRunButton.kt
│   │   │   │   ├── MetricCard.kt
│   │   │   │   ├── QuickActionChip.kt
│   │   │   │   └── RunHistoryItem.kt
│   │   │   │
│   │   │   └── screens/
│   │   │       ├── onboarding/
│   │   │       │   ├── OnboardingScreen.kt
│   │   │       │   └── OnboardingViewModel.kt
│   │   │       ├── aientry/
│   │   │       │   ├── AIEntryScreen.kt
│   │   │       │   └── AIEntryViewModel.kt
│   │   │       ├── prerun/
│   │   │       │   ├── PreRunScreen.kt
│   │   │       │   └── PreRunViewModel.kt
│   │   │       ├── activerun/
│   │   │       │   ├── ActiveRunScreen.kt
│   │   │       │   └── ActiveRunViewModel.kt
│   │   │       ├── postrun/
│   │   │       │   ├── PostRunScreen.kt
│   │   │       │   └── PostRunViewModel.kt
│   │   │       ├── history/
│   │   │       │   ├── HistoryScreen.kt
│   │   │       │   └── HistoryViewModel.kt
│   │   │       └── settings/
│   │   │           ├── SettingsScreen.kt
│   │   │           └── SettingsViewModel.kt
│   │   │
│   │   └── service/                      # Background Services
│   │       ├── LocationTrackingService.kt
│   │       └── VoiceCoachingService.kt
│   │
│   └── res/
│       ├── values/
│       │   ├── strings.xml
│       │   └── themes.xml
│       └── raw/
│           └── voice_phrases.json
│
├── src/test/                             # Unit Tests
│   └── java/com/flexrun/
│       ├── domain/usecase/
│       └── data/repository/
│
└── src/androidTest/                      # Instrumented Tests
    └── java/com/flexrun/
        ├── ui/
        └── data/
```

---

## 2. Component Architecture

### 2.1 Data Layer

#### 2.1.1 Room Database Schema

```kotlin
@Database(
    entities = [
        RunSessionEntity::class,
        UserProfileEntity::class,
        LocationPointEntity::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class FlexRunDatabase : RoomDatabase() {
    abstract fun runSessionDao(): RunSessionDao
    abstract fun userProfileDao(): UserProfileDao
    abstract fun locationPointDao(): LocationPointDao
}
```

**Entity Relationships**:
```
┌─────────────────┐       ┌─────────────────┐
│   UserProfile   │       │   RunSession    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──1:N──│ id (PK)         │
│ name            │       │ userId (FK)     │
│ experienceLevel │       │ runType         │
│ goal            │       │ startTime       │
│ units           │       │ endTime         │
└─────────────────┘       │ distanceKm      │
                          │ durationMs      │
                          └────────┬────────┘
                                   │
                                   │ 1:N
                                   ▼
                          ┌─────────────────┐
                          │ LocationPoint   │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ sessionId (FK)  │
                          │ latitude        │
                          │ longitude       │
                          │ timestamp       │
                          └─────────────────┘
```

#### 2.1.2 Repository Pattern

```kotlin
interface RunRepository {
    // Create
    suspend fun saveRunSession(session: RunSession): Result<String>
    suspend fun saveLocationPoint(point: LocationPoint): Result<Unit>
    
    // Read
    fun getRunSessionsFlow(): Flow<List<RunSession>>
    suspend fun getRunSession(id: String): Result<RunSession>
    suspend fun getLocationPoints(sessionId: String): Result<List<LocationPoint>>
    
    // Stats
    suspend fun getWeeklyStats(): Result<WeeklyStats>
    suspend fun getPersonalRecords(): Result<PersonalRecords>
}

class RunRepositoryImpl @Inject constructor(
    private val runSessionDao: RunSessionDao,
    private val locationPointDao: LocationPointDao
) : RunRepository {
    // Implementation with proper mapping between entities and domain models
}
```

### 2.2 Domain Layer

#### 2.2.1 Use Cases

```kotlin
class RecognizeIntentUseCase @Inject constructor(
    private val aiRepository: AIRepository,
    private val profileRepository: ProfileRepository,
    private val runRepository: RunRepository
) {
    suspend operator fun invoke(userMessage: String): Result<IntentResponse> {
        // 1. Get user profile
        val profile = profileRepository.getProfile().getOrThrow()
        
        // 2. Get recent runs for context
        val recentRuns = runRepository.getRecentRuns(limit = 3).getOrThrow()
        
        // 3. Build request
        val request = IntentRequest(
            userMessage = userMessage,
            profile = profile,
            recentRuns = recentRuns
        )
        
        // 4. Call AI
        return aiRepository.recognizeIntent(request)
    }
}
```

#### 2.2.2 Domain Models

```kotlin
data class RunSession(
    val id: String,
    val runType: RunType,
    val startTime: Instant,
    val endTime: Instant?,
    val distanceKm: Float,
    val durationMs: Long,
    val averagePaceSecondsPerKm: Int,
    val targetPace: PaceRange?,
    val locationPoints: List<LocationPoint>,
    val perceivedEffort: PerceivedEffort?,
    val notes: String?
)

enum class RunType {
    EASY, TEMPO, LONG, INTERVAL, RECOVERY, RACE_PREP, FREE
}

data class PaceRange(
    val minSecondsPerKm: Int,
    val maxSecondsPerKm: Int
) {
    fun formatDisplay(): String {
        val minMin = minSecondsPerKm / 60
        val minSec = minSecondsPerKm % 60
        val maxMin = maxSecondsPerKm / 60
        val maxSec = maxSecondsPerKm % 60
        return "$minMin:${minSec.toString().padStart(2, '0')} - $maxMin:${maxSec.toString().padStart(2, '0')}/km"
    }
}
```

### 2.3 Presentation Layer

#### 2.3.1 ViewModel State Pattern

```kotlin
data class ActiveRunUiState(
    val isRunning: Boolean = false,
    val isPaused: Boolean = false,
    val elapsedTimeMs: Long = 0L,
    val distanceKm: Float = 0f,
    val currentPaceSecondsPerKm: Int = 0,
    val averagePaceSecondsPerKm: Int = 0,
    val targetDistanceKm: Float = 0f,
    val progressPercent: Float = 0f,
    val lastCoachingMessage: String = "",
    val isGpsAcquired: Boolean = false
)

sealed interface ActiveRunEvent {
    data object StartRun : ActiveRunEvent
    data object PauseRun : ActiveRunEvent
    data object ResumeRun : ActiveRunEvent
    data object StopRun : ActiveRunEvent
    data class LocationUpdate(val point: LocationPoint) : ActiveRunEvent
}

@HiltViewModel
class ActiveRunViewModel @Inject constructor(
    private val startRunUseCase: StartRunUseCase,
    private val pauseRunUseCase: PauseRunUseCase,
    private val stopRunUseCase: StopRunUseCase,
    private val calculatePaceUseCase: CalculatePaceUseCase,
    private val voiceCoachingService: VoiceCoachingService
) : ViewModel() {

    private val _uiState = MutableStateFlow(ActiveRunUiState())
    val uiState: StateFlow<ActiveRunUiState> = _uiState.asStateFlow()

    fun onEvent(event: ActiveRunEvent) {
        when (event) {
            is ActiveRunEvent.StartRun -> startRun()
            is ActiveRunEvent.PauseRun -> pauseRun()
            is ActiveRunEvent.ResumeRun -> resumeRun()
            is ActiveRunEvent.StopRun -> stopRun()
            is ActiveRunEvent.LocationUpdate -> updateLocation(event.point)
        }
    }
}
```

#### 2.3.2 Compose UI Example

```kotlin
@Composable
fun ActiveRunScreen(
    viewModel: ActiveRunViewModel = hiltViewModel(),
    onRunComplete: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    
    // Keep screen on during run
    KeepScreenOn()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Elapsed Time - Large display
        Text(
            text = formatDuration(uiState.elapsedTimeMs),
            style = MaterialTheme.typography.displayLarge,
            color = MaterialTheme.colorScheme.primary
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Metrics Grid
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            MetricCard(
                value = String.format("%.2f", uiState.distanceKm),
                unit = "km",
                label = "Distance"
            )
            MetricCard(
                value = formatPace(uiState.currentPaceSecondsPerKm),
                unit = "/km",
                label = "Curr Pace"
            )
        }
        
        // Progress bar
        LinearProgressIndicator(
            progress = uiState.progressPercent,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp)
        )
        
        // Coaching message
        Text(
            text = uiState.lastCoachingMessage,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.weight(1f))
        
        // Control buttons
        Row(
            horizontalArrangement = Arrangement.SpaceEvenly,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (uiState.isPaused) {
                FlexRunButton(
                    text = "Resume",
                    onClick = { viewModel.onEvent(ActiveRunEvent.ResumeRun) }
                )
            } else {
                FlexRunButton(
                    text = "Pause",
                    onClick = { viewModel.onEvent(ActiveRunEvent.PauseRun) }
                )
            }
            
            FlexRunButton(
                text = "Stop",
                variant = ButtonVariant.Secondary,
                onClick = { viewModel.onEvent(ActiveRunEvent.StopRun) }
            )
        }
    }
}
```

---

## 3. Background Services

### 3.1 Location Tracking Service

```kotlin
@AndroidEntryPoint
class LocationTrackingService : Service() {

    @Inject lateinit var fusedLocationClient: FusedLocationProviderClient
    
    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { location ->
                // Emit to repository/viewmodel
                broadcastLocation(location)
            }
        }
    }
    
    private val locationRequest = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY,
        1000L // 1 second interval
    ).apply {
        setMinUpdateIntervalMillis(500L)
        setMaxUpdateDelayMillis(2000L)
    }.build()

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        startLocationUpdates()
        return START_STICKY
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FlexRun Active")
            .setContentText("Tracking your run...")
            .setSmallIcon(R.drawable.ic_run)
            .setOngoing(true)
            .build()
    }
}
```

### 3.2 Voice Coaching Service

```kotlin
@AndroidEntryPoint
class VoiceCoachingService @Inject constructor(
    private val textToSpeech: TextToSpeech,
    private val phraseRepository: PhraseRepository
) {
    
    private val speechQueue = Channel<String>(Channel.BUFFERED)
    
    // Pre-loaded phrases for instant playback
    private val preloadedPhrases = mapOf(
        "1km" to "One kilometer complete.",
        "2km" to "Two kilometers. Keep going!",
        "3km" to "Three kilometers. You're doing great!",
        "halfway" to "You're halfway there! Stay strong.",
        "pace_slow" to "Try to pick up the pace a bit.",
        "pace_fast" to "Easy there, save some energy for later.",
        "final_500m" to "Final 500 meters! Push through!",
        "complete" to "Run complete! Amazing work today."
    )
    
    suspend fun speak(phraseKey: String) {
        val text = preloadedPhrases[phraseKey] ?: return
        speakText(text)
    }
    
    suspend fun speakCustom(text: String) {
        speakText(text)
    }
    
    private fun speakText(text: String) {
        textToSpeech.speak(
            text,
            TextToSpeech.QUEUE_ADD,
            null,
            UUID.randomUUID().toString()
        )
    }
    
    // Coaching logic
    fun checkAndCoach(runState: ActiveRunState) {
        // Distance milestones
        val kmCompleted = runState.distanceKm.toInt()
        if (kmCompleted > lastAnnouncedKm) {
            speak("${kmCompleted}km")
            lastAnnouncedKm = kmCompleted
        }
        
        // Pace alerts
        if (runState.currentPace > runState.targetPace.maxSecondsPerKm + 15) {
            speak("pace_slow")
        } else if (runState.currentPace < runState.targetPace.minSecondsPerKm - 15) {
            speak("pace_fast")
        }
        
        // Final push
        val remaining = runState.targetDistance - runState.distanceKm
        if (remaining <= 0.5f && !announcedFinal) {
            speak("final_500m")
            announcedFinal = true
        }
    }
}
```

---

## 4. API Integration

### 4.1 OpenAI Service

```kotlin
interface OpenAIApi {
    @POST("v1/chat/completions")
    suspend fun chatCompletion(
        @Body request: ChatCompletionRequest
    ): Response<ChatCompletionResponse>
}

@Serializable
data class ChatCompletionRequest(
    val model: String = "gpt-4o-mini",
    val messages: List<Message>,
    val temperature: Float = 0.7f,
    val max_tokens: Int = 500
)

@Serializable
data class Message(
    val role: String,  // "system", "user", "assistant"
    val content: String
)
```

### 4.2 AI Repository Implementation

```kotlin
class AIRepositoryImpl @Inject constructor(
    private val openAIApi: OpenAIApi,
    private val responseCache: LruCache<String, IntentResponse>
) : AIRepository {

    private val systemPrompt = """
        You are FlexRun, an AI running coach. Analyze the user's message and determine their running intent.
        
        Always respond with valid JSON in this exact format:
        {
          "run_type": "EASY|TEMPO|LONG|INTERVAL|RECOVERY|RACE_PREP|FREE",
          "suggested_distance_km": <float>,
          "suggested_duration_min": <int>,
          "target_pace_min_km": <float>,
          "coach_message": "<encouraging message, 2-3 sentences>",
          "confidence": <float 0-1>
        }
    """.trimIndent()

    override suspend fun recognizeIntent(request: IntentRequest): Result<IntentResponse> {
        // Check cache first
        val cacheKey = request.hashCode().toString()
        responseCache.get(cacheKey)?.let { return Result.success(it) }
        
        return try {
            val userMessage = buildUserMessage(request)
            val response = openAIApi.chatCompletion(
                ChatCompletionRequest(
                    messages = listOf(
                        Message("system", systemPrompt),
                        Message("user", userMessage)
                    )
                )
            )
            
            if (response.isSuccessful) {
                val content = response.body()?.choices?.firstOrNull()?.message?.content
                val intentResponse = parseIntentResponse(content)
                responseCache.put(cacheKey, intentResponse)
                Result.success(intentResponse)
            } else {
                Result.failure(ApiException(response.code(), response.message()))
            }
        } catch (e: Exception) {
            // Fallback to default response
            Result.success(createDefaultResponse(request))
        }
    }
    
    private fun createDefaultResponse(request: IntentRequest): IntentResponse {
        return IntentResponse(
            runType = RunType.FREE,
            suggestedDistance = 5.0f,
            suggestedDuration = 30,
            targetPace = null,
            coachMessage = "Let's track your run! Start whenever you're ready.",
            confidence = 0.5f
        )
    }
}
```

---

## 5. Navigation

### 5.1 Navigation Graph

```kotlin
sealed class Screen(val route: String) {
    data object Splash : Screen("splash")
    data object Onboarding : Screen("onboarding")
    data object AIEntry : Screen("ai_entry")
    data object PreRun : Screen("pre_run/{runType}/{distance}/{duration}") {
        fun createRoute(runType: String, distance: Float, duration: Int): String {
            return "pre_run/$runType/$distance/$duration"
        }
    }
    data object ActiveRun : Screen("active_run/{sessionId}") {
        fun createRoute(sessionId: String): String = "active_run/$sessionId"
    }
    data object PostRun : Screen("post_run/{sessionId}") {
        fun createRoute(sessionId: String): String = "post_run/$sessionId"
    }
    data object History : Screen("history")
    data object RunDetail : Screen("run_detail/{sessionId}") {
        fun createRoute(sessionId: String): String = "run_detail/$sessionId"
    }
    data object Settings : Screen("settings")
}

@Composable
fun FlexRunNavHost(
    navController: NavHostController,
    startDestination: String
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Splash.route) {
            SplashScreen(
                onComplete = { isOnboarded ->
                    val destination = if (isOnboarded) Screen.AIEntry.route else Screen.Onboarding.route
                    navController.navigate(destination) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.AIEntry.route) {
            AIEntryScreen(
                onRunConfigured = { runType, distance, duration ->
                    navController.navigate(Screen.PreRun.createRoute(runType, distance, duration))
                }
            )
        }
        
        // ... other screens
    }
}
```

### 5.2 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────┐     ┌─────────────┐     ┌───────────────┐          │
│  │ Splash  │────▶│ Onboarding  │────▶│   AI Entry    │◀─────┐   │
│  └─────────┘     └─────────────┘     └───────┬───────┘      │   │
│       │                                      │              │   │
│       │ (if onboarded)                       ▼              │   │
│       └─────────────────────────────▶┌───────────────┐      │   │
│                                      │   Pre-Run     │      │   │
│                                      │ Configuration │      │   │
│                                      └───────┬───────┘      │   │
│                                              │              │   │
│                                              ▼              │   │
│                                      ┌───────────────┐      │   │
│                                      │  Active Run   │      │   │
│                                      │  (Tracking)   │      │   │
│                                      └───────┬───────┘      │   │
│                                              │              │   │
│                                              ▼              │   │
│       ┌─────────────┐                ┌───────────────┐      │   │
│       │   History   │◀───────────────│   Post-Run    │──────┘   │
│       └──────┬──────┘                │   Summary     │          │
│              │                       └───────────────┘          │
│              ▼                                                  │
│       ┌─────────────┐                                           │
│       │ Run Detail  │                                           │
│       └─────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Security & Privacy

### 6.1 API Key Management

```kotlin
// In local.properties (NOT committed to git)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

// In build.gradle.kts
android {
    buildTypes {
        release {
            buildConfigField("String", "OPENAI_API_KEY", 
                "\"${project.findProperty("OPENAI_API_KEY") ?: ""}\"")
        }
        debug {
            buildConfigField("String", "OPENAI_API_KEY", 
                "\"${project.findProperty("OPENAI_API_KEY") ?: ""}\"")
        }
    }
}

// Usage in code
val apiKey = BuildConfig.OPENAI_API_KEY
```

### 6.2 Data Storage Security

- **All data stored locally** using Room with SQLite
- **No cloud sync** in v1 (privacy-first design)
- **No analytics tracking** - no Firebase, Amplitude, etc.
- **Location data** stored only for route visualization
- **Clear data option** in settings

---

## 7. Testing Strategy

### 7.1 Unit Tests

| Module | Test Coverage Target |
|--------|---------------------|
| Use Cases | 90% |
| Repositories | 85% |
| ViewModels | 80% |
| Utilities | 95% |

### 7.2 Integration Tests

- Database operations with in-memory Room
- API calls with MockWebServer
- Navigation flows

### 7.3 UI Tests

- Critical user flows with Espresso
- Compose snapshot testing

---

## 8. Build & Deployment

### 8.1 Build Variants

| Variant | Purpose | API Key | Logging |
|---------|---------|---------|---------|
| debug | Development | Test key | Verbose |
| staging | QA Testing | Test key | Info |
| release | Production | Prod key | Error only |

### 8.2 Release Checklist

- [ ] All tests passing
- [ ] ProGuard rules verified
- [ ] API key in release keystore
- [ ] Version code/name updated
- [ ] Change log written
- [ ] APK signed with release key

---

**Document End**
