import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  primary: string;
  primaryContrast: string;
  primarySoft: string;
  secondary: string;
  secondaryContrast: string;
  secondarySoft: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderMuted: string;
  shadow: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  headerBackground: string;
  headerText: string;
  headerSubtitle: string;
  heroGradient: [string, string];
  highlightBackground: string;
  highlightText: string;
  highlightMuted: string;
  highlightButton: string;
  highlightButtonText: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  dangerText: string;
  warning: string;
  warningSoft: string;
  warningText: string;
  info: string;
  infoSoft: string;
  fabBackground: string;
  fabIcon: string;
};

const themePalettes: Record<ThemeMode, ThemeColors> = {
  light: {
    background: '#f8fafc',
    backgroundElevated: '#f1f5f9',
    surface: '#ffffff',
    surfaceAlt: '#eff6ff',
    surfaceMuted: '#e2e8f0',
    primary: '#2563eb',
    primaryContrast: '#f8fafc',
    primarySoft: '#3b82f633',
    secondary: '#22d3ee',
    secondaryContrast: '#0f172a',
    secondarySoft: '#22d3ee22',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    textInverse: '#f8fafc',
    border: '#cbd5f5',
    borderMuted: '#e2e8f0',
    shadow: '#0f172a',
    inputBackground: '#f8fafc',
    inputBorder: '#cbd5f5',
    inputText: '#0f172a',
    inputPlaceholder: '#94a3b8',
    headerBackground: '#1d4ed8',
    headerText: '#eff6ff',
    headerSubtitle: '#bfdbfe',
    heroGradient: ['#0f172a', '#1e3a8a'],
    highlightBackground: '#0f172a',
    highlightText: '#f8fafc',
    highlightMuted: '#94a3b8',
    highlightButton: '#22d3ee',
    highlightButtonText: '#0f172a',
    success: '#22c55e',
    successSoft: '#22c55e33',
    danger: '#ef4444',
    dangerSoft: '#ef444433',
    dangerText: '#fee2e2',
    warning: '#f97316',
    warningSoft: '#f9731633',
    warningText: '#ea580c',
    info: '#38bdf8',
    infoSoft: '#38bdf822',
    fabBackground: '#22d3ee',
    fabIcon: '#0f172a',
  },
  dark: {
    background: '#0f172a',
    backgroundElevated: '#111827',
    surface: '#1f2937',
    surfaceAlt: '#0f172a',
    surfaceMuted: '#1e293b',
    primary: '#60a5fa',
    primaryContrast: '#0f172a',
    primarySoft: '#60a5fa33',
    secondary: '#38bdf8',
    secondaryContrast: '#0f172a',
    secondarySoft: '#38bdf822',
    textPrimary: '#e2e8f0',
    textSecondary: '#cbd5f5',
    textMuted: '#94a3b8',
    textInverse: '#0f172a',
    border: '#1f2937',
    borderMuted: '#1e3a8a',
    shadow: '#000000',
    inputBackground: '#0f172a',
    inputBorder: '#1e3a8a',
    inputText: '#f8fafc',
    inputPlaceholder: '#94a3b8',
    headerBackground: '#1d4ed8',
    headerText: '#eff6ff',
    headerSubtitle: '#bfdbfe',
    heroGradient: ['#1e3a8a', '#0b1120'],
    highlightBackground: '#1e293b',
    highlightText: '#f8fafc',
    highlightMuted: '#cbd5f5',
    highlightButton: '#38bdf8',
    highlightButtonText: '#0f172a',
    success: '#22c55e',
    successSoft: '#14532d',
    danger: '#ef4444',
    dangerSoft: '#7f1d1d',
    dangerText: '#fee2e2',
    warning: '#f97316',
    warningSoft: '#7c2d12',
    warningText: '#fbbf24',
    info: '#38bdf8',
    infoSoft: '#1e3a8a',
    fabBackground: '#38bdf8',
    fabIcon: '#0f172a',
  },
};

type ThemeContextValue = {
  mode: ThemeMode;
  loaded: boolean;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'food-storage-theme-mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [loaded, setLoaded] = useState(false);

  const persistMode = useCallback(async (nextMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // ignore persistence errors
    }
  }, []);

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      setModeState(nextMode);
      void persistMode(nextMode);
    },
    [persistMode],
  );

  const toggleTheme = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  useEffect(() => {
    const loadMode = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored);
        } else {
          const system = Appearance.getColorScheme();
          if (system === 'dark') {
            setModeState('dark');
          }
        }
      } catch {
        // ignore load errors
      } finally {
        setLoaded(true);
      }
    };

    void loadMode();
  }, []);

  const colors = useMemo(() => themePalettes[mode], [mode]);

  const value = useMemo(
    () => ({
      mode,
      loaded,
      colors,
      isDark: mode === 'dark',
      setMode,
      toggleTheme,
    }),
    [mode, loaded, colors, setMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }

  return context;
};
