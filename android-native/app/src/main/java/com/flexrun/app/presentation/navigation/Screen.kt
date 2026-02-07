package com.flexrun.app.presentation.navigation

sealed class Screen(val route: String) {
    data object Splash : Screen("splash")
    data object Onboarding : Screen("onboarding")
    data object AIEntry : Screen("ai_entry")
    data object PreRun : Screen("pre_run")
    data object ActiveRun : Screen("active_run")
    data object PostRun : Screen("post_run/{sessionId}") {
        fun createRoute(sessionId: String) = "post_run/$sessionId"
    }
    data object History : Screen("history")
    data object RunDetail : Screen("run_detail/{sessionId}") {
        fun createRoute(sessionId: String) = "run_detail/$sessionId"
    }
    data object Settings : Screen("settings")
}
