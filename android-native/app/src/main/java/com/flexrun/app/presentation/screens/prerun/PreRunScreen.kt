package com.flexrun.app.presentation.screens.prerun

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.flexrun.app.domain.model.RunIntent
import com.flexrun.app.domain.model.RunType
import com.flexrun.app.presentation.components.RunTypeBadge
import com.flexrun.app.presentation.components.ValueStepper
import kotlinx.coroutines.flow.collectLatest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PreRunScreen(
    runIntent: RunIntent? = null,
    onNavigateToActiveRun: () -> Unit = {},
    onNavigateBack: () -> Unit = {},
    viewModel: PreRunViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    
    LaunchedEffect(runIntent) {
        runIntent?.let { viewModel.initializeFromIntent(it) }
    }
    
    LaunchedEffect(Unit) {
        viewModel.navigationEvent.collectLatest { event ->
            when (event) {
                is PreRunViewModel.NavigationEvent.NavigateToActiveRun -> onNavigateToActiveRun()
                is PreRunViewModel.NavigationEvent.NavigateBack -> onNavigateBack()
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Configure Run") },
                navigationIcon = {
                    IconButton(onClick = { viewModel.onEvent(PreRunEvent.GoBack) }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
        ) {
            // Run Type Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                RunTypeBadge(runType = state.runType)
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Target Pace Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Target Pace",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Text(
                        text = "${state.targetPace} /km",
                        style = MaterialTheme.typography.displayMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Distance Stepper
            Text(
                text = "Distance",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))
            ValueStepper(
                value = state.distance,
                unit = "km",
                onValueChange = { viewModel.onEvent(PreRunEvent.UpdateDistance(it)) },
                minValue = 0.5f,
                maxValue = 50f,
                step = 0.5f
            )
            
            Spacer(modifier = Modifier.height(20.dp))
            
            // Duration Stepper
            Text(
                text = "Estimated Duration",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))
            ValueStepper(
                value = state.estimatedDuration.toFloat(),
                unit = "min",
                onValueChange = { viewModel.onEvent(PreRunEvent.UpdateDuration(it.toInt())) },
                minValue = 5f,
                maxValue = 240f,
                step = 5f
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Toggles Section
            Text(
                text = "Options",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(12.dp))
            
            ToggleRow(
                label = "Warm-up",
                subtitle = "5 min easy jog",
                checked = state.warmUpEnabled,
                onCheckedChange = { viewModel.onEvent(PreRunEvent.ToggleWarmUp(it)) }
            )
            
            ToggleRow(
                label = "Cool-down",
                subtitle = "5 min easy jog",
                checked = state.coolDownEnabled,
                onCheckedChange = { viewModel.onEvent(PreRunEvent.ToggleCoolDown(it)) }
            )
            
            ToggleRow(
                label = "Voice Coaching",
                subtitle = "Audio cues during run",
                checked = state.voiceCoachingEnabled,
                onCheckedChange = { viewModel.onEvent(PreRunEvent.ToggleVoiceCoaching(it)) }
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Tip Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.tertiaryContainer
                )
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "💡",
                        style = MaterialTheme.typography.headlineMedium
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = state.tip,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onTertiaryContainer
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Start Run Button
            Button(
                onClick = { viewModel.onEvent(PreRunEvent.StartRun) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = !state.isLoading
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text(
                        text = "Start Run 🏃",
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
    }
}

@Composable
private fun ToggleRow(
    label: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}
