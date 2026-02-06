import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { useProfileStore } from '@/store/profile.store';
import { useSessionsStore } from '@/store/sessions.store';
import { ConversationMessage, QuickReply, TodayIntent } from '@/types';
import { generateAIEntryConversation } from '@/services/ai.service';

// ============================================
// TYPES
// ============================================

type AIEntryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AIEntry'>;
};

// ============================================
// COMPONENT
// ============================================

export function AIEntryScreen({ navigation }: AIEntryScreenProps) {
  const { profile, program } = useProfileStore();
  const { sessions } = useSessionsStore();
  
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<TodayIntent | null>(null);

  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    setIsLoading(true);
    try {
      const result = await generateAIEntryConversation(
        profile,
        program,
        sessions
      );
      
      setMessages([{
        id: Date.now().toString(),
        role: 'ai',
        content: result.message,
        timestamp: Date.now(),
      }]);
      
      setQuickReplies(result.quickReplies);
    } catch (error) {
      console.error('Failed to generate AI conversation:', error);
      // Fallback message
      setMessages([{
        id: Date.now().toString(),
        role: 'ai',
        content: 'What would you like to do today?',
        timestamp: Date.now(),
      }]);
      setQuickReplies(getDefaultQuickReplies());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultQuickReplies = (): QuickReply[] => [
    { id: '1', label: '✅ Continue training', value: TodayIntent.CONTINUE_TRAINING },
    { id: '2', label: '🚶 Walk casually', value: TodayIntent.WALK_CASUAL },
    { id: '3', label: '💤 Rest day', value: TodayIntent.REST_DAY },
  ];

  const handleQuickReply = (reply: QuickReply) => {
    // Add user message
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: reply.label,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    const intent = reply.value as TodayIntent;
    setSelectedIntent(intent);
    
    // Route based on intent
    routeByIntent(intent);
  };

  const routeByIntent = (intent: TodayIntent) => {
    switch (intent) {
      case TodayIntent.CONTINUE_TRAINING:
        navigation.navigate('PreRun', { intent: 'TRAINING' });
        break;
      case TodayIntent.WALK_CASUAL:
        navigation.navigate('ActiveRun', { 
          mode: 'WALK',
          affectsProgression: false 
        });
        break;
      case TodayIntent.REST_DAY:
        navigation.navigate('Home');
        break;
      case TodayIntent.EASY_RUN:
        navigation.navigate('ActiveRun', { 
          mode: 'EASY',
          affectsProgression: false 
        });
        break;
      default:
        navigation.navigate('Home');
    }
  };

  const handleSend = () => {
    if (!userInput.trim()) return;
    
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    
    // For MVP, we'll just treat text input as intent selection
    // In full version, this would call AI to parse intent
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>FlexRun</Text>
            <Text style={styles.subtitle}>AI Coach</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === 'ai' ? styles.aiBubble : styles.userBubble,
              ]}
            >
              <Text style={styles.messageText}>{msg.content}</Text>
            </View>
          ))}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#4a90e2" />
            </View>
          )}
        </ScrollView>

        {/* Quick Replies */}
        {quickReplies.length > 0 && !selectedIntent && (
          <View style={styles.quickRepliesContainer}>
            {quickReplies.map((reply) => (
              <TouchableOpacity
                key={reply.id}
                style={styles.quickReplyButton}
                onPress={() => handleQuickReply(reply)}
              >
                <Text style={styles.quickReplyText}>{reply.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Text Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            value={userInput}
            onChangeText={setUserInput}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSend}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a3e',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4a90e2',
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    padding: 12,
  },
  quickRepliesContainer: {
    padding: 16,
    gap: 8,
  },
  quickReplyButton: {
    backgroundColor: '#2a2a3e',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  quickReplyText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    color: '#fff',
    padding: 12,
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
