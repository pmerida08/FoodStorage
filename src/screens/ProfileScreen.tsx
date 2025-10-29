import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { useAuth } from '@/providers/AuthProvider';
import type { ThemeColors } from '@/providers/ThemeProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useToast } from '@/providers/ToastProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Profile = Database['public']['Tables']['profiles']['Row'];

const profileQueryKey = (userId: string | undefined) => ['profile', userId] as const;

export const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const { colors, mode, toggleTheme } = useThemeMode();
  const queryClient = useQueryClient();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const {
    data: profile,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: profileQueryKey(user?.id),
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Missing user identifier.');
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, updated_at, created_at')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (nextFullName: string) => {
      if (!user?.id) {
        throw new Error('You need to be signed in.');
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: nextFullName || null, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData<Profile | undefined>(profileQueryKey(user?.id), updatedProfile);
      showToast({ title: 'Profile updated', message: 'Your name has been saved.', type: 'success' });
    },
    onError: (updateError: unknown) => {
      const message =
        updateError instanceof Error ? updateError.message : 'Unable to update profile right now.';
      showToast({ title: 'Update failed', message, type: 'error' });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      showToast({ title: 'Signed out', message: 'You have been logged out safely.', type: 'success' });
    },
    onError: (signOutError: unknown) => {
      const message =
        signOutError instanceof Error ? signOutError.message : 'Unable to sign out right now.';
      showToast({ title: 'Sign out failed', message, type: 'error' });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword: current, newPassword: next }: { currentPassword: string; newPassword: string }) => {
      if (!user?.email) {
        throw new Error('We could not verify your email address.');
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });

      if (verifyError) {
        throw verifyError;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: next });

      if (updateError) {
        throw updateError;
      }
    },
    onSuccess: () => {
      showToast({ title: 'Password updated', message: 'Your password has been changed.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (updateError: unknown) => {
      const message =
        updateError instanceof Error ? updateError.message : 'Unable to update password right now.';
      showToast({ title: 'Update failed', message, type: 'error' });
    },
  });

  const displayEmail = user?.email ?? 'Unknown email';
  const isDirty = useMemo(() => {
    const current = profile?.full_name ?? '';
    return current !== fullName;
  }, [profile?.full_name, fullName]);
  const isValidName = fullName.trim().length > 0;

  const canSaveProfile = isDirty && isValidName && !updateProfileMutation.isPending;

  const passwordLengthOk = newPassword.length >= 6;
  const passwordsMatch = newPassword === confirmPassword;
  const canChangePassword =
    !!currentPassword && passwordLengthOk && passwordsMatch && !changePasswordMutation.isPending;

  const handleSaveProfile = () => {
    if (!canSaveProfile) {
      return;
    }

    updateProfileMutation.mutate(fullName.trim());
  };

  const handleChangePassword = () => {
    if (!canChangePassword) {
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  if (isLoading && !profile) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>
            Loading your profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorState}>
          <Text style={[styles.errorTitle, { color: colors.danger }]}>
            We could not load your profile.
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error instanceof Error ? error.message : 'Please try again.'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryLabel}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={[styles.title, { color: colors.primaryContrast }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: colors.primaryContrast }]}>
            Update your personal information and app settings.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            styles.firstCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Personal information
          </Text>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Full name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Pablo Mérida"
              placeholderTextColor={colors.inputPlaceholder}
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                },
              ]}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Email address</Text>
            <View
              style={[
                styles.readOnlyField,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.readOnlyValue, { color: colors.textSecondary }]}>
                {displayEmail}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.success,
                opacity: canSaveProfile ? 1 : 0.6,
              },
            ]}
            onPress={handleSaveProfile}
            disabled={!canSaveProfile}
          >
            <Text style={[styles.primaryButtonLabel, { color: colors.textInverse }]}>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save changes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dangerButton,
              {
                backgroundColor: colors.danger,
                opacity: logoutMutation.isPending ? 0.6 : 1,
              },
            ]}
            onPress={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <Text style={[styles.dangerButtonLabel, { color: colors.textInverse }]}>
              {logoutMutation.isPending ? 'Signing out...' : 'Log out'}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Settings</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Dark mode</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                Switch between light and dark themes.
              </Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.borderMuted, true: colors.primary }}
              thumbColor={mode === 'dark' ? '#f8fafc' : colors.secondaryContrast}
              ios_backgroundColor={colors.borderMuted}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Change password</Text>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Current password</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.inputPlaceholder}
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                },
              ]}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>New password</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={colors.inputPlaceholder}
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                },
              ]}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Confirm new password
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor={colors.inputPlaceholder}
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                },
              ]}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {!passwordsMatch && confirmPassword.length > 0 && (
            <Text style={[styles.helperText, { color: colors.danger }]}>
              Passwords do not match.
            </Text>
          )}
          {!passwordLengthOk && newPassword.length > 0 && (
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              Password should be at least 6 characters long.
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                opacity: canChangePassword ? 1 : 0.6,
              },
            ]}
            onPress={handleChangePassword}
            disabled={!canChangePassword}
          >
            <Text style={[styles.primaryButtonLabel, { color: colors.primaryContrast }]}>
              {changePasswordMutation.isPending ? 'Updating...' : 'Change password'}
            </Text>
          </TouchableOpacity>
        </View>

        {profile?.updated_at && (
          <Text style={[styles.updatedAt, { color: colors.textMuted }]}>
            Last updated {new Date(profile.updated_at).toLocaleString()}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 72,
      paddingBottom: 36,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      gap: 8,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
    },
    subtitle: {
      fontSize: 16,
    },
    card: {
      marginHorizontal: 24,
      marginTop: 24,
      borderRadius: 20,
      padding: 24,
      gap: 20,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 12 },
      elevation: 3,
      borderWidth: 1,
    },
    firstCard: {
      marginTop: 20,
    },
    sectionHeading: {
      fontSize: 18,
      fontWeight: '700',
    },
    field: {
      gap: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
    },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
    },
    readOnlyField: {
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    readOnlyValue: {
      fontSize: 16,
    },
    primaryButton: {
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryButtonLabel: {
      fontSize: 16,
      fontWeight: '700',
    },
    dangerButton: {
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    dangerButtonLabel: {
      fontSize: 16,
      fontWeight: '700',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    settingCopy: {
      flex: 1,
      gap: 4,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    settingSubtitle: {
      fontSize: 14,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: 12,
    },
    helperText: {
      fontSize: 13,
      marginTop: -4,
    },
    updatedAt: {
      marginTop: 16,
      marginHorizontal: 24,
      fontSize: 14,
      textAlign: 'center',
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 24,
    },
    loadingLabel: {
      fontSize: 15,
    },
    errorState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      paddingHorizontal: 24,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    errorMessage: {
      fontSize: 14,
      textAlign: 'center',
    },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 999,
    },
    retryLabel: {
      color: colors.primaryContrast,
      fontWeight: '600',
    },
  });
