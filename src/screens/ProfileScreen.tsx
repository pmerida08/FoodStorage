import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { useAuth } from '@/providers/AuthProvider';
import type { ThemeColors } from '@/providers/ThemeProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useToast } from '@/providers/ToastProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
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
  const { t } = useTranslation();
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
      showToast({ title: t('profile.updateSuccess'), message: t('profile.updateSuccessMsg'), type: 'success' });
    },
    onError: (updateError: unknown) => {
      const message =
        updateError instanceof Error ? updateError.message : t('profile.updateErrorMsg');
      showToast({ title: t('profile.updateError'), message, type: 'error' });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      showToast({ title: t('profile.signOutSuccess'), message: t('profile.signOutSuccessMsg'), type: 'success' });
    },
    onError: (signOutError: unknown) => {
      const message =
        signOutError instanceof Error ? signOutError.message : t('profile.signOutErrorMsg');
      showToast({ title: t('profile.signOutError'), message, type: 'error' });
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
      showToast({ title: t('profile.passwordUpdateSuccess'), message: t('profile.passwordUpdateSuccessMsg'), type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (updateError: unknown) => {
      const message =
        updateError instanceof Error ? updateError.message : t('profile.passwordUpdateErrorMsg');
      showToast({ title: t('profile.passwordUpdateError'), message, type: 'error' });
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
            {t('profile.loading')}
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
            {t('profile.loadError')}
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error instanceof Error ? error.message : t('profile.tryAgain')}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryLabel}>{t('profile.tryAgain')}</Text>
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
          <Text style={[styles.title, { color: colors.primaryContrast }]}>{t('profile.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.primaryContrast }]}>
            {t('profile.subtitle')}
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
            {t('profile.personalInfo')}
          </Text>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('profile.fullName')}</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('profile.fullNamePlaceholder')}
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
            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('profile.emailAddress')}</Text>
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
              {updateProfileMutation.isPending ? t('profile.saving') : t('profile.saveChanges')}
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
              {logoutMutation.isPending ? t('profile.signingOut') : t('profile.logOut')}
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
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>{t('profile.settings')}</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{t('profile.darkMode')}</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                {t('profile.darkModeDesc')}
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

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{t('profile.changePassword')}</Text>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('profile.currentPassword')}</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={t('profile.enterCurrentPassword')}
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
            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('profile.newPassword')}</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('profile.enterNewPassword')}
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
              {t('profile.confirmPassword')}
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('profile.reenterPassword')}
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
              {t('profile.passwordsNoMatch')}
            </Text>
          )}
          {!passwordLengthOk && newPassword.length > 0 && (
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              {t('profile.passwordLength')}
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
              {changePasswordMutation.isPending ? t('profile.updating') : t('profile.changePassword')}
            </Text>
          </TouchableOpacity>
        </View>

        {profile?.updated_at && (
          <Text style={[styles.updatedAt, { color: colors.textMuted }]}>
            {t('profile.lastUpdated')} {new Date(profile.updated_at).toLocaleString()}
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
