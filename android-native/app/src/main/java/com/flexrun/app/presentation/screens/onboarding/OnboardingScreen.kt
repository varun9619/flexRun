package com.flexrun.app.presentation.screens.onboarding

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.airbnb.lottie.compose.*
import com.flexrun.app.R
import com.flexrun.app.domain.model.ExperienceLevel
import com.flexrun.app.domain.model.RunningGoal
import com.flexrun.app.domain.model.Units
import com.flexrun.app.presentation.components.DayChip
import com.flexrun.app.presentation.components.SelectionCard
import com.flexrun.app.presentation.components.UnitToggle
import kotlinx.coroutines.flow.collectLatest

@Composable
fun OnboardingScreen(
    onComplete: () -> Unit,
    viewModel: OnboardingViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.navigationEvent.collectLatest { event ->
            when (event) {
                is OnboardingViewModel.NavigationEvent.NavigateToHome -> onComplete()
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Progress indicator
        if (state.currentPage > 0) {
            LinearProgressIndicator(
                progress = { state.progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
        }

        // Content with animation
        AnimatedContent(
            targetState = state.currentPage,
            transitionSpec = {
                if (targetState > initialState) {
                    slideInHorizontally { width -> width } togetherWith
                            slideOutHorizontally { width -> -width }
                } else {
                    slideInHorizontally { width -> -width } togetherWith
                            slideOutHorizontally { width -> width }
                }
            },
            modifier = Modifier.weight(1f),
            label = "onboarding_content"
        ) { page ->
            when (page) {
                0 -> WelcomePage()
                1 -> GoalSelectionPage(
                    selectedGoal = state.selectedGoal,
                    onGoalSelected = { viewModel.onEvent(OnboardingEvent.SelectGoal(it)) }
                )
                2 -> ExperiencePage(
                    selectedExperience = state.selectedExperience,
                    onExperienceSelected = { viewModel.onEvent(OnboardingEvent.SelectExperience(it)) }
                )
                3 -> SchedulePage(
                    selectedDays = state.selectedDays,
                    selectedUnits = state.selectedUnits,
                    onDayToggle = { viewModel.onEvent(OnboardingEvent.ToggleDay(it)) },
                    onUnitsSelected = { viewModel.onEvent(OnboardingEvent.SelectUnits(it)) }
                )
            }
        }

        // Bottom navigation buttons
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (state.currentPage > 0) {
                OutlinedButton(
                    onClick = { viewModel.onEvent(OnboardingEvent.NavigateBack) },
                    modifier = Modifier.weight(1f).height(56.dp)
                ) {
                    Text("Back")
                }
            }
            
            Button(
                onClick = {
                    if (state.currentPage == state.totalPages - 1) {
                        viewModel.onEvent(OnboardingEvent.CompleteOnboarding)
                    } else {
                        viewModel.onEvent(OnboardingEvent.NavigateNext)
                    }
                },
                modifier = Modifier
                    .weight(if (state.currentPage > 0) 1f else 2f)
                    .height(56.dp),
                enabled = when (state.currentPage) {
                    0 -> true
                    1 -> state.selectedGoal != null
                    2 -> state.selectedExperience != null
                    3 -> state.selectedDays.isNotEmpty()
                    else -> true
                }
            ) {
                Text(
                    text = if (state.currentPage == state.totalPages - 1) "Get Started" else "Continue",
                    style = MaterialTheme.typography.titleMedium
                )
            }
        }
    }
}

@Composable
private fun WelcomePage() {
    // Lottie animation composition
    val composition by rememberLottieComposition(LottieCompositionSpec.RawRes(R.raw.jogger))
    val progress by animateLottieCompositionAsState(
        composition = composition,
        iterations = LottieConstants.IterateForever,
        isPlaying = true,
        speed = 1f,
        restartOnPlay = false
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Lottie Animation
        LottieAnimation(
            composition = composition,
            progress = { progress },
            modifier = Modifier.size(200.dp)
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = "Welcome to FlexRun",
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        Text(
            text = "Your AI Running Coach",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = "Just tell me what you want to do today,\nand I'll guide you through your run.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun GoalSelectionPage(
    selectedGoal: RunningGoal?,
    onGoalSelected: (RunningGoal) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp)
    ) {
        Text(
            text = "What's your running goal?",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "This helps me personalize your training",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        val goals = listOf(
            RunningGoal.FIRST_5K to "🎯",
            RunningGoal.FASTER_5K to "⚡",
            RunningGoal.FIRST_10K to "🏁",
            RunningGoal.HALF_MARATHON to "🏃",
            RunningGoal.MARATHON to "🏅",
            RunningGoal.GENERAL_FITNESS to "💪"
        )
        
        goals.forEach { (goal, icon) ->
            SelectionCard(
                title = goal.displayName,
                subtitle = goal.description,
                icon = icon,
                isSelected = selectedGoal == goal,
                onClick = { onGoalSelected(goal) }
            )
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun ExperiencePage(
    selectedExperience: ExperienceLevel?,
    onExperienceSelected: (ExperienceLevel) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp)
    ) {
        Text(
            text = "What's your experience level?",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "I'll adjust the intensity accordingly",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        val experiences = listOf(
            ExperienceLevel.BEGINNER to "🌱",
            ExperienceLevel.INTERMEDIATE to "🌿",
            ExperienceLevel.EXPERIENCED to "🌳",
            ExperienceLevel.RETURNING to "🔄"
        )
        
        experiences.forEach { (experience, icon) ->
            SelectionCard(
                title = experience.displayName,
                subtitle = experience.description,
                icon = icon,
                isSelected = selectedExperience == experience,
                onClick = { onExperienceSelected(experience) }
            )
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun SchedulePage(
    selectedDays: Set<Int>,
    selectedUnits: Units,
    onDayToggle: (Int) -> Unit,
    onUnitsSelected: (Units) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp)
    ) {
        Text(
            text = "When do you want to run?",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "Select your preferred running days",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Days of week
        val days = listOf("M" to 1, "T" to 2, "W" to 3, "T" to 4, "F" to 5, "S" to 6, "S" to 7)
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            days.forEach { (label, dayNum) ->
                DayChip(
                    day = label,
                    isSelected = selectedDays.contains(dayNum),
                    onClick = { onDayToggle(dayNum) }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(40.dp))
        
        Text(
            text = "Preferred units",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onBackground
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        UnitToggle(
            option1 = "Kilometers",
            option2 = "Miles",
            selectedOption = if (selectedUnits == Units.KILOMETERS) 0 else 1,
            onOptionSelected = { 
                onUnitsSelected(if (it == 0) Units.KILOMETERS else Units.MILES)
            }
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Summary
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            )
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Your plan",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "${selectedDays.size} runs per week",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}
