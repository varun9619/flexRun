package com.flexrun.app.presentation.screens.aientry

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.flexrun.app.domain.model.RunIntent
import com.flexrun.app.presentation.components.ChatBubble
import com.flexrun.app.presentation.components.QuickActionChip
import com.flexrun.app.presentation.components.TypingIndicator
import kotlinx.coroutines.flow.collectLatest

@Composable
fun AIEntryScreen(
    onNavigateToPreRun: (RunIntent) -> Unit = {},
    viewModel: AIEntryViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val listState = rememberLazyListState()
    
    LaunchedEffect(Unit) {
        viewModel.navigationEvent.collectLatest { event ->
            when (event) {
                is AIEntryViewModel.NavigationEvent.NavigateToPreRun -> {
                    onNavigateToPreRun(event.intent)
                }
            }
        }
    }
    
    // Auto-scroll to bottom when new messages arrive
    LaunchedEffect(state.messages.size) {
        if (state.messages.isNotEmpty()) {
            listState.animateScrollToItem(state.messages.size - 1)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Header
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 2.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "FlexRun",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = if (state.isOnline) "AI Coach Online" else "Offline Mode",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (state.isOnline) 
                            MaterialTheme.colorScheme.tertiary 
                        else 
                            MaterialTheme.colorScheme.error
                    )
                }
            }
        }

        // Chat messages
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            state = listState,
            contentPadding = PaddingValues(vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(state.messages) { message ->
                ChatBubble(
                    message = message.content,
                    isFromUser = message.isFromUser
                )
                
                // Show Start Run button after AI suggests a run
                if (!message.isFromUser && message.intent != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { viewModel.startRun(message.intent!!) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Start Run 🏃")
                    }
                }
            }
            
            if (state.isLoading) {
                item {
                    TypingIndicator()
                }
            }
        }

        // Quick actions
        Surface(
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Quick Actions",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(state.quickActions) { action ->
                        QuickActionChip(
                            emoji = action.emoji,
                            label = action.label,
                            onClick = { 
                                viewModel.onEvent(AIEntryEvent.QuickActionSelected(action))
                            }
                        )
                    }
                }
            }
        }

        // Input field
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 8.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = state.inputText,
                    onValueChange = { viewModel.onEvent(AIEntryEvent.UpdateInput(it)) },
                    placeholder = { Text("Tell me about your run...") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(24.dp),
                    singleLine = true
                )
                
                FilledIconButton(
                    onClick = { viewModel.onEvent(AIEntryEvent.SendMessage) },
                    enabled = state.inputText.isNotBlank() && !state.isLoading
                ) {
                    Icon(
                        imageVector = Icons.Default.Send,
                        contentDescription = "Send"
                    )
                }
            }
        }
    }
}
