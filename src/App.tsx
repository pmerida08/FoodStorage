import { ErrorBoundary } from "@/components/ErrorBoundary";
import "@/lib/i18n";
import { RootNavigator } from "@/navigation/RootNavigator";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider, useThemeMode } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

const ThemeStatusBar = () => {
  const { mode } = useThemeMode();
  return <StatusBar style={mode === "dark" ? "light" : "dark"} />;
};

export const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <ToastProvider>
                <ThemeStatusBar />
                <RootNavigator />
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;
