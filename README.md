# FlexRun

AI-powered adaptive running coach for Android.

## 🏃 Features

- **AI-generated training sessions** tailored to your goals
- **Real-time GPS tracking** with pace and distance
- **Audio coaching prompts** during runs
- **Pre-run intent selection** (Training, Easy, Walk, Recovery)
- **Post-run AI feedback** and difficulty adjustment
- **Progress tracking** that adapts to your performance

## 🛠️ Tech Stack

- React Native + Expo
- TypeScript
- expo-location (GPS tracking)
- expo-speech (Audio prompts)
- react-native-mmkv (Fast local storage)
- Zustand (State management)
- OpenAI API (Session generation & feedback)

## 📁 Project Structure

```
src/
├── types/           # TypeScript interfaces & enums
├── services/        # Core services (AI, Location, Speech, Storage)
├── engine/          # State machine, prompt engine, pace calculations
├── store/           # Zustand stores (profile, sessions, active run)
├── screens/         # UI screens
├── navigation/      # React Navigation setup
├── ai/              # LLM prompts and templates
└── components/      # Reusable UI components
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android development)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure AI API key:
   - Open `src/services/ai.service.ts`
   - Set your OpenAI API key (or configure via environment variable)

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on Android:
   ```bash
   npm run android
   ```

## 📱 Screens

| Screen | Description |
|--------|-------------|
| Onboarding | Goal selection, experience level, pace setup |
| Home | Dashboard with weekly stats and quick start |
| Pre-Run | Intent selection and session preview |
| Active Run | Live metrics, state display, controls |
| Post-Run | Run summary, AI feedback, splits |
| History | All past runs with stats |
| Settings | Profile and preferences |

## 🎯 Session Intent Types

| Intent | Affects Progress | Coaching |
|--------|-----------------|----------|
| TRAINING | ✅ Yes | Full |
| EASY | ✅ Yes | Minimal |
| WALK | ❌ No | Off |
| RECOVERY | ❌ No | Minimal |

## 🤖 AI Features

The AI coach handles three responsibilities:

1. **Generate Sessions** - Creates interval plans based on goal and fitness
2. **Post-Run Feedback** - Analyzes performance and suggests improvements
3. **Difficulty Adjustment** - Adapts training load based on execution

## ⚠️ Android Permissions

Required permissions (configured in `app.json`):
- `ACCESS_FINE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`
- `FOREGROUND_SERVICE`

## 📝 MVP Limitations

- No heart rate integration
- No wearable sync
- No map display
- Basic background tracking (may be interrupted by battery optimization)
- Single user profile

## 📄 License

MIT
