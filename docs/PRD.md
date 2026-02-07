# FlexRun - Product Requirements Document (PRD)

**Version**: 2.0  
**Last Updated**: February 6, 2026  
**Platform**: Native Android (Kotlin)  
**Status**: Active Development

---

## 1. Product Overview

### 1.1 Vision Statement
FlexRun is a conversation-first AI running coach that transforms how runners train by replacing complex UIs with natural conversation. The app learns from each run, adapts to the runner's state, and provides real-time voice guidance.

### 1.2 Target Users

| User Segment | Description | Key Needs |
|--------------|-------------|-----------|
| Beginner Runners | New to running, overwhelmed by apps | Simple guidance, encouragement, gradual progression |
| Intermediate Runners | 6-12 months experience, want to improve | Structured training, pace targets, performance tracking |
| Experienced Runners | 1+ years, training for races | Advanced programs, detailed analytics, race preparation |
| Returning Runners | Coming back after break/injury | Safe progression, recovery focus, confidence building |

### 1.3 Core Value Proposition
- **Conversation-First**: "Just tell me what you want to do"
- **Adaptive Intelligence**: Every run makes the coach smarter
- **Real-Time Coaching**: Voice guidance when you need it
- **Privacy-First**: All data stays on your device

---

## 2. Functional Requirements

### 2.1 User Authentication & Profile

#### FR-2.1.1: First Launch Onboarding
**Priority**: P0 (Critical)

| Requirement | Description |
|-------------|-------------|
| Goal Input | User enters their running goal (5K, 10K, Half Marathon, Marathon, General Fitness) |
| Experience Level | Beginner, Intermediate, Experienced, Returning Runner |
| Current Fitness | Can run: <1km, 1-3km, 3-5km, 5-10km, 10km+ without stopping |
| Weekly Availability | How many days per week can they run (2-7) |
| Preferred Units | Kilometers or Miles |

**Acceptance Criteria**:
- [ ] Onboarding completes in <2 minutes
- [ ] All data stored locally using Room/DataStore
- [ ] Skip option available (uses sensible defaults)
- [ ] Progress indicator shows completion status

#### FR-2.1.2: Profile Management
**Priority**: P1 (High)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name/Nickname | String | Optional | Used in voice coaching |
| Age | Integer | Optional | For heart rate calculations |
| Weight | Float (kg) | Optional | For calorie calculations |
| Running Goal | Enum | Yes | Primary training focus |
| Experience Level | Enum | Yes | Affects pace recommendations |
| Units | Enum | Yes | km/mi, kg/lbs |

---

### 2.2 AI Entry & Conversation Interface

#### FR-2.2.1: Main Conversation Screen
**Priority**: P0 (Critical)

This is the **primary entry point** of the application.

**Screen Elements**:
```
┌─────────────────────────────────────┐
│  FlexRun                        ⚙️  │
├─────────────────────────────────────┤
│                                     │
│  🏃 "What do you want to do today?" │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Type your message...           ││
│  └─────────────────────────────────┘│
│                                     │
│  Quick Actions:                     │
│  [Easy Run] [Tempo] [Long Run]      │
│  [Intervals] [Recovery] [Just Track]│
│                                     │
│  Recent:                            │
│  Yesterday: Easy Run 5.2km          │
│  Tuesday: Tempo 4.8km               │
│                                     │
├─────────────────────────────────────┤
│  🏠 Home  │  📊 History  │  👤 Profile│
└─────────────────────────────────────┘
```

**Acceptance Criteria**:
- [ ] AI greeting message displayed on launch
- [ ] Text input field with send button
- [ ] 6 quick action buttons always visible
- [ ] Last 2-3 runs shown as context
- [ ] Voice input button (optional for v1)

#### FR-2.2.2: Intent Recognition
**Priority**: P0 (Critical)

The AI must recognize and classify user intent from natural language:

| Intent Type | Example Phrases | Output |
|-------------|-----------------|--------|
| EASY_RUN | "easy 5k", "light jog", "take it easy" | RunType.EASY |
| TEMPO_RUN | "tempo run", "push myself", "threshold pace" | RunType.TEMPO |
| LONG_RUN | "long run", "distance today", "going far" | RunType.LONG |
| INTERVAL | "intervals", "speed work", "track session" | RunType.INTERVAL |
| RECOVERY | "recovery", "very light", "just moving" | RunType.RECOVERY |
| RACE_PREP | "race prep", "race pace", "simulation" | RunType.RACE_PREP |
| JUST_TRACK | "just track", "free run", "no coaching" | RunType.FREE |

**AI Prompt Structure**:
```kotlin
data class IntentRequest(
    val userMessage: String,
    val recentRuns: List<RunSummary>,  // Last 3 runs
    val userProfile: UserProfile,
    val daysSinceLastRun: Int
)

data class IntentResponse(
    val runType: RunType,
    val suggestedDistance: Float?,  // km
    val suggestedDuration: Int?,    // minutes
    val suggestedPace: PaceRange?,
    val coachMessage: String,       // Displayed to user
    val confidence: Float           // 0-1
)
```

**Acceptance Criteria**:
- [ ] Intent recognized within 2 seconds
- [ ] Fallback to "JUST_TRACK" if confidence < 0.6
- [ ] Coach responds with personalized message
- [ ] Handles typos and informal language

#### FR-2.2.3: Conversation Context
**Priority**: P1 (High)

The AI should maintain context within a session:

| Context Element | Usage |
|-----------------|-------|
| Last message | Understand follow-up questions |
| User profile | Personalize recommendations |
| Recent runs | Avoid overtraining, suggest recovery |
| Time of day | Morning vs evening run considerations |
| Day of week | Weekend long runs, weekday shorter runs |

---

### 2.3 Pre-Run Configuration

#### FR-2.3.1: Run Configuration Screen
**Priority**: P0 (Critical)

After intent recognition, display a confirmation/adjustment screen:

```
┌─────────────────────────────────────┐
│  ← Back           Ready to Run      │
├─────────────────────────────────────┤
│                                     │
│  🎯 Easy Run                        │
│                                     │
│  "Great choice! An easy run will    │
│   help maintain your base fitness   │
│   while staying fresh."             │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  📏 Distance    [5.0] km   [+] [-]  │
│  ⏱️  Duration    [30] min   [+] [-]  │
│  🏃 Target Pace [6:00-6:30] /km     │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  🔊 Voice Coaching    [ON]          │
│  📍 Save Route        [ON]          │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  💡 Warm up for 5 minutes before    │
│     starting. Stay hydrated!        │
│                                     │
│        [ ▶️ START RUN ]             │
│                                     │
└─────────────────────────────────────┘
```

**Configurable Parameters**:

| Parameter | Type | Default | Range |
|-----------|------|---------|-------|
| Distance | Float | AI suggested | 0.5 - 50 km |
| Duration | Int | AI suggested | 5 - 300 min |
| Target Pace | PaceRange | Based on fitness | Varies |
| Voice Coaching | Boolean | true | - |
| Save Route | Boolean | true | - |

**Acceptance Criteria**:
- [ ] All AI suggestions editable
- [ ] Increment/decrement buttons work smoothly
- [ ] Start button prominent and accessible
- [ ] Pre-run tips rotate based on run type

---

### 2.4 Active Run Tracking

#### FR-2.4.1: GPS Location Tracking
**Priority**: P0 (Critical)

**Technical Requirements**:

| Requirement | Specification |
|-------------|---------------|
| Location Provider | FusedLocationProviderClient |
| Update Interval | 1-3 seconds (adaptive) |
| Accuracy | High accuracy mode |
| Background Mode | Foreground service with notification |
| Battery Optimization | Kalman filtering, adaptive intervals |

**Data Collected**:
```kotlin
data class LocationPoint(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double?,
    val accuracy: Float,
    val speed: Float?,
    val timestamp: Long
)
```

**Acceptance Criteria**:
- [ ] Tracking continues when screen off
- [ ] Tracking continues when app backgrounded
- [ ] Location accuracy < 10 meters in open areas
- [ ] Battery usage < 5% per hour of tracking

#### FR-2.4.2: Active Run Screen
**Priority**: P0 (Critical)

```
┌─────────────────────────────────────┐
│           ACTIVE RUN         [||]   │
├─────────────────────────────────────┤
│                                     │
│           ⏱️ 15:32                   │
│         ELAPSED TIME                │
│                                     │
│  ┌─────────────┬─────────────┐      │
│  │    2.45     │   6:20     │      │
│  │     km      │   /km      │      │
│  │  Distance   │ Curr Pace  │      │
│  └─────────────┴─────────────┘      │
│                                     │
│  ┌─────────────┬─────────────┐      │
│  │   6:15      │   2.55     │      │
│  │   /km       │    km      │      │
│  │  Avg Pace   │ Remaining  │      │
│  └─────────────┴─────────────┘      │
│                                     │
│  ─────────────────────────────────  │
│  │██████████░░░░░░░░│ 49%           │
│  ─────────────────────────────────  │
│                                     │
│  🔊 "Perfect pace, keep it steady"  │
│                                     │
│      [⏸️ PAUSE]    [⏹️ STOP]         │
│                                     │
└─────────────────────────────────────┘
```

**Real-Time Metrics**:

| Metric | Update Frequency | Calculation |
|--------|------------------|-------------|
| Elapsed Time | 1 second | Simple timer |
| Distance | GPS update | Cumulative point-to-point |
| Current Pace | 5 seconds | Last 100m average |
| Average Pace | 10 seconds | Total time / total distance |
| Progress | Distance update | Distance / target distance |

**Acceptance Criteria**:
- [ ] All metrics update smoothly
- [ ] Screen remains on during run (configurable)
- [ ] Pause button freezes all metrics
- [ ] Stop button requires confirmation

#### FR-2.4.3: Voice Coaching During Run
**Priority**: P0 (Critical)

**Coaching Trigger Types**:

| Trigger | Condition | Example Message |
|---------|-----------|-----------------|
| Distance Milestone | Every 1km (or 0.5mi) | "One kilometer complete. Pace: 6 minutes 15 seconds." |
| Time Milestone | Every 5 minutes | "15 minutes. You're doing great." |
| Pace Warning (Slow) | Current > target + 15s | "You're running a bit slow, try to pick it up." |
| Pace Warning (Fast) | Current < target - 15s | "Easy there, you're ahead of pace. Save energy." |
| Final Push | Last 500m | "Final 500 meters! Strong finish!" |
| Completion | Target reached | "Target distance reached! Amazing work!" |
| Encouragement | Random interval | "You've got this! Stay focused." |

**Voice Coaching Settings**:

| Setting | Options | Default |
|---------|---------|---------|
| Enabled | On/Off | On |
| Frequency | Minimal, Normal, Verbose | Normal |
| Distance Alerts | On/Off | On |
| Time Alerts | On/Off | On |
| Pace Alerts | On/Off | On |
| Volume | 0-100% | 80% |

**Hybrid Voice Approach** (Recommended):
1. **Pre-generated phrases**: Common announcements (milestones, basic encouragement)
2. **AI-generated phrases**: Complex situational coaching (adapting to performance)

```kotlin
// Pre-generated (fast, no API call)
val preGenerated = mapOf(
    "1km" to "One kilometer complete.",
    "2km" to "Two kilometers. Keep going!",
    "halfway" to "You're halfway there!",
    "pace_slow" to "Try to pick up the pace a bit.",
    "pace_fast" to "Easy there, save some energy.",
    "final_500m" to "Final 500 meters! Push through!"
)

// AI-generated (for complex situations)
suspend fun generateCoachingMessage(context: RunContext): String {
    // Call OpenAI only for nuanced situations
}
```

**Acceptance Criteria**:
- [ ] Voice does not interrupt music/podcasts (uses audio focus)
- [ ] Voice is clear and audible during exercise
- [ ] Pre-generated messages have <100ms latency
- [ ] AI messages cached to avoid repeated API calls

---

### 2.5 Post-Run Experience

#### FR-2.5.1: Run Completion Screen
**Priority**: P0 (Critical)

```
┌─────────────────────────────────────┐
│           🎉 RUN COMPLETE! 🎉        │
├─────────────────────────────────────┤
│                                     │
│  "Excellent easy run! You nailed    │
│   your target pace perfectly."      │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│       5.02 km  │  31:28             │
│       Distance │  Duration          │
│                                     │
│       6:16/km  │  312 cal           │
│       Avg Pace │  Calories          │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  📈 This Run vs Last Easy Run:      │
│     Pace: 5 sec/km faster ⬆️         │
│     Distance: Same                  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  🗺️ [View Route Map]                │
│                                     │
│  💬 How did it feel?                │
│  [Too Easy] [Good] [Hard] [Too Hard]│
│                                     │
│  [📤 Share]  [💾 Save]  [🏠 Done]    │
│                                     │
└─────────────────────────────────────┘
```

**Data Captured**:

| Field | Source | Notes |
|-------|--------|-------|
| Total Distance | GPS | Cumulative |
| Total Duration | Timer | Start to end |
| Average Pace | Calculated | Duration / Distance |
| Best Pace | Min of splits | Per-km best |
| Elevation Gain | GPS altitude | If available |
| Calories | Formula | Based on weight, distance, pace |
| Route | GPS points | Full route polyline |
| Perceived Effort | User input | 1-4 scale |

**Acceptance Criteria**:
- [ ] Summary displays within 1 second of stopping
- [ ] AI generates personalized completion message
- [ ] Comparison with similar past runs
- [ ] Route map renders correctly
- [ ] Share generates image card

#### FR-2.5.2: Run Saved Confirmation
**Priority**: P1 (High)

After saving, the run is stored locally:

```kotlin
@Entity(tableName = "runs")
data class RunSession(
    @PrimaryKey val id: String,
    val userId: String,
    val runType: RunType,
    val startTime: Long,
    val endTime: Long,
    val distanceKm: Float,
    val durationMs: Long,
    val averagePaceSecondsPerKm: Int,
    val bestPaceSecondsPerKm: Int?,
    val elevationGainM: Float?,
    val caloriesBurned: Int?,
    val perceivedEffort: Int?, // 1-4
    val routePolyline: String?, // Encoded polyline
    val weather: String?, // JSON
    val notes: String?,
    val createdAt: Long
)
```

---

### 2.6 History & Analytics

#### FR-2.6.1: Run History List
**Priority**: P1 (High)

```
┌─────────────────────────────────────┐
│  📊 History                    🔍   │
├─────────────────────────────────────┤
│                                     │
│  This Week                          │
│  ─────────────────────────────────  │
│  │🏃│ Today 8:30 AM                 │
│  │  │ Easy Run • 5.0 km • 31:15     │
│  ─────────────────────────────────  │
│  │🏃│ Yesterday 6:45 PM             │
│  │  │ Tempo • 4.8 km • 24:00        │
│  ─────────────────────────────────  │
│                                     │
│  Last Week                          │
│  ─────────────────────────────────  │
│  │🏃│ Sunday 7:00 AM                │
│  │  │ Long Run • 12.5 km • 1:18:45  │
│  ─────────────────────────────────  │
│                                     │
│  Weekly Stats                       │
│  ┌────────┬────────┬────────┐       │
│  │ 22.3km │ 4 runs │ 2:14:00│       │
│  │Distance│  Runs  │  Time  │       │
│  └────────┴────────┴────────┘       │
│                                     │
└─────────────────────────────────────┘
```

**Filtering Options**:
- Date range (This week, This month, Custom)
- Run type (Easy, Tempo, Long, etc.)
- Distance range

**Acceptance Criteria**:
- [ ] Runs grouped by week
- [ ] Weekly summary stats shown
- [ ] Tap on run opens detail view
- [ ] Infinite scroll pagination

#### FR-2.6.2: Run Detail View
**Priority**: P1 (High)

Shows complete information for a single run:
- Full metrics (pace, distance, duration, elevation)
- Route map with start/end markers
- Split times per kilometer
- AI-generated insights about the run
- Comparison with similar runs

#### FR-2.6.3: Progress Analytics
**Priority**: P2 (Medium)

- Weekly/monthly distance totals (bar chart)
- Pace trend over time (line chart)
- Personal records board
- Training consistency streak

---

### 2.7 Settings & Preferences

#### FR-2.7.1: Settings Screen
**Priority**: P1 (High)

**Settings Categories**:

| Category | Settings |
|----------|----------|
| Profile | Name, Age, Weight, Goal, Experience |
| Units | Distance (km/mi), Weight (kg/lbs), Pace format |
| Voice Coaching | Enable/disable, Frequency, Volume, Language |
| Display | Keep screen on, Dark mode |
| Privacy | Data storage info, Clear data option |
| About | Version, Licenses, Support |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Metric | Target |
|--------|--------|
| App Launch Time | < 2 seconds |
| AI Response Time | < 3 seconds |
| GPS Lock Time | < 10 seconds |
| Battery Usage | < 5% per hour while tracking |
| APK Size | < 30 MB |

### 3.2 Reliability

| Metric | Target |
|--------|--------|
| Crash Rate | < 1% of sessions |
| GPS Accuracy | < 5% deviation from actual distance |
| Data Loss Prevention | Zero loss of run data |
| Offline Capability | Core tracking works without internet |

### 3.3 Security & Privacy

| Requirement | Implementation |
|-------------|----------------|
| Data Storage | All user data stored locally only |
| API Key Security | Stored in BuildConfig, not in code |
| No Analytics | No third-party tracking (v1) |
| Permissions | Only request location when needed |

### 3.4 Compatibility

| Requirement | Specification |
|-------------|---------------|
| Min Android Version | Android 8.0 (API 26) |
| Target Android Version | Android 14 (API 34) |
| Screen Sizes | Phone (all sizes), Tablet (basic support) |

---

## 4. API Specifications

### 4.1 OpenAI Integration

**Model**: GPT-4o-mini  
**Usage**: Intent recognition, coaching messages, insights

**Intent Recognition Prompt**:
```
You are FlexRun, an AI running coach. Analyze the user's message and determine their running intent.

User Profile:
- Experience: {experience_level}
- Goal: {running_goal}
- Recent runs: {last_3_runs}

User Message: "{user_message}"

Respond with JSON:
{
  "run_type": "EASY|TEMPO|LONG|INTERVAL|RECOVERY|RACE_PREP|FREE",
  "suggested_distance_km": float,
  "suggested_duration_min": int,
  "target_pace_min_km": float,
  "coach_message": "string (2-3 sentences, encouraging)",
  "confidence": float (0-1)
}
```

**Rate Limiting**:
- Max 10 API calls per run session
- Cache responses for identical queries
- Fallback to local processing if API fails

---

## 5. Appendix

### 5.1 Run Types Definition

| Run Type | Effort Level | Typical Pace | Purpose |
|----------|--------------|--------------|---------|
| Easy | 60-70% max HR | Conversational | Base building, recovery |
| Tempo | 80-85% max HR | Comfortably hard | Lactate threshold |
| Long | 65-75% max HR | Slow, steady | Endurance building |
| Interval | 90-95% max HR | Fast bursts | Speed development |
| Recovery | 50-60% max HR | Very easy | Active recovery |
| Race Prep | Race pace | Goal pace | Race simulation |
| Free | User controlled | Any | Unstructured |

### 5.2 Pace Calculation Formula

```kotlin
// User's easy pace based on fitness level
fun calculateEasyPace(fitnessLevel: FitnessLevel): PaceRange {
    return when (fitnessLevel) {
        BEGINNER -> PaceRange(7.0, 8.0)      // 7:00-8:00 /km
        INTERMEDIATE -> PaceRange(5.5, 6.5)  // 5:30-6:30 /km
        ADVANCED -> PaceRange(4.5, 5.5)      // 4:30-5:30 /km
        ELITE -> PaceRange(4.0, 4.5)         // 4:00-4:30 /km
    }
}

// Adjust pace by run type
fun adjustPaceForRunType(basePace: PaceRange, runType: RunType): PaceRange {
    return when (runType) {
        EASY -> basePace
        TEMPO -> basePace * 0.85      // 15% faster
        LONG -> basePace * 1.1        // 10% slower
        INTERVAL -> basePace * 0.75   // 25% faster
        RECOVERY -> basePace * 1.2    // 20% slower
        else -> basePace
    }
}
```

### 5.3 Glossary

| Term | Definition |
|------|------------|
| Pace | Time per distance unit (e.g., 6:00/km) |
| Split | Time for a specific segment (usually 1km) |
| PR | Personal Record - best time for a distance |
| Tempo | Sustained hard effort at lactate threshold |
| Fartlek | Unstructured speed play |
| Cadence | Steps per minute |
| Negative Split | Running second half faster than first |

---

**Document End**
