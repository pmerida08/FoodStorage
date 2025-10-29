import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/providers/ToastProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import type { ThemeColors } from '@/providers/ThemeProvider';

type Mode = 'signin' | 'signup';

export const AuthScreen = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail('');
      setPassword('');
      setFullName('');
    }
  }, [user]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showToast({ title: 'Sign in failed', message: error.message, type: 'error' });
    } else {
      showToast({ title: 'Welcome back!', message: 'Signed in successfully', type: 'success' });
    }

    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      showToast({ title: 'Sign up failed', message: error.message, type: 'error' });
    } else {
      showToast({
        title: 'Check your inbox',
        message: 'We sent you a confirmation email to complete sign up.',
        type: 'success',
      });
      setFullName('');
      setPassword('');
    }

    setLoading(false);
  };

  const handleSubmit = () => {
    if (mode === 'signin') {
      void handleSignIn();
    } else {
      void handleSignUp();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.highlightBackground }]}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Food Storage</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin' ? 'Sign in to continue' : 'Create a new account'}
        </Text>

        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentButton, mode === 'signin' && styles.segmentButtonActive]}
            onPress={() => setMode('signin')}
          >
            <Text style={[styles.segmentLabel, mode === 'signin' && styles.segmentLabelActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, mode === 'signup' && styles.segmentButtonActive]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.segmentLabel, mode === 'signup' && styles.segmentLabelActive]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'signup' && (
          <View style={styles.field}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Doe"
              placeholderTextColor={colors.inputPlaceholder}
              style={styles.input}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitLabel}>{loading ? 'Please wait...' : 'Continue'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMode} style={styles.switch}>
          <Text style={styles.switchLabel}>
            {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already registered? Sign In'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingTop: 96,
      paddingHorizontal: 24,
      paddingBottom: 48,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.highlightText,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.highlightMuted,
      marginBottom: 32,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
      padding: 4,
      marginBottom: 32,
    },
    segmentButton: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    segmentButtonActive: {
      backgroundColor: colors.primary,
    },
    segmentLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
    },
    segmentLabelActive: {
      color: colors.primaryContrast,
    },
    field: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: colors.inputText,
      fontSize: 16,
    },
    submitButton: {
      marginTop: 12,
      borderRadius: 12,
      backgroundColor: colors.secondary,
      paddingVertical: 16,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.secondaryContrast,
    },
    switch: {
      marginTop: 24,
      alignItems: 'center',
    },
    switchLabel: {
      color: colors.highlightMuted,
      fontSize: 14,
    },
  });
