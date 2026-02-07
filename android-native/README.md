# FlexRun Native Android

This is the native Kotlin Android implementation of FlexRun.

## Project Setup

This project uses:
- Kotlin 1.9.22
- Jetpack Compose
- Hilt for dependency injection
- Room for local database
- Retrofit for API calls
- Material 3 Design

## Required Configuration

Before building, create a `local.properties` file in the project root with your API key:

```properties
OPENAI_API_KEY=your_openai_api_key_here
```

## Building the Project

```bash
./gradlew build
```

## Running on Emulator/Device

```bash
./gradlew installDebug
```

## Documentation

See the `docs/` folder in the parent directory for:
- PRD.md - Product Requirements
- SOLUTION_ARCHITECTURE.md - Technical Architecture
- UI_UX_SPECIFICATION.md - Design System
- IMPLEMENTATION_TRACKER.md - Development Roadmap

## Project Structure

```
app/src/main/java/com/flexrun/app/
├── data/              # Data layer (repositories, DAOs, entities)
├── di/                # Dependency injection modules
├── domain/            # Domain models and use cases
├── presentation/      # UI layer (Compose screens, ViewModels)
└── service/           # Background services
```

## Status

This is the initial project setup (Sprint 1). Core features are being implemented according to the PRD.
