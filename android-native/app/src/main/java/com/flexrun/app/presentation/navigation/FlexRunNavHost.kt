package com.flexrun.app.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.flexrun.app.domain.model.RunIntent
import com.flexrun.app.domain.model.RunType
import com.flexrun.app.presentation.screens.aientry.AIEntryScreen
import com.flexrun.app.presentation.screens.onboarding.OnboardingScreen
import com.flexrun.app.presentation.screens.prerun.PreRunScreen
import com.flexrun.app.presentation.screens.splash.SplashScreen

// Temporary storage for run intent (will be replaced by proper state management)
private var pendingRunIntent: RunIntent? = null

@Composable
fun FlexRunNavHost(
    navController: NavHostController,
    startDestination: String = Screen.Splash.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Splash.route) {
            SplashScreen(
                onNavigateToOnboarding = {
                    navController.navigate(Screen.Onboarding.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                onNavigateToHome = {
                    navController.navigate(Screen.AIEntry.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Onboarding.route) {
            OnboardingScreen(
                onComplete = {
                    navController.navigate(Screen.AIEntry.route) {
                        popUpTo(Screen.Onboarding.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.AIEntry.route) {
            AIEntryScreen(
                onNavigateToPreRun = { intent ->
                    pendingRunIntent = intent
                    navController.navigate(Screen.PreRun.route)
                }
            )
        }
        
        composable(Screen.PreRun.route) {
            PreRunScreen(
                runIntent = pendingRunIntent ?: RunIntent(type = RunType.EASY),
                onNavigateToActiveRun = {
                    navController.navigate(Screen.ActiveRun.route)
                },
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(Screen.ActiveRun.route) {
            // Placeholder - will be implemented in Sprint 5
            androidx.compose.material3.Text("Active Run Screen - Coming Soon!")
        }
        
        // TODO: Add remaining screens
        // composable(Screen.PostRun.route) { PostRunScreen() }
        // composable(Screen.History.route) { HistoryScreen() }
        // composable(Screen.Settings.route) { SettingsScreen() }
    }
}
