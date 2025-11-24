import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>⚠️ Configuration Error</Text>
            <Text style={styles.message}>
              The app encountered a configuration error and cannot start.
            </Text>
            {this.state.error && (
              <>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorMessage}>
                  {this.state.error.message}
                </Text>
              </>
            )}
            <Text style={styles.instructions}>
              Please contact the app administrator to configure the required
              environment variables.
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#424242",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#616161",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: "#d32f2f",
    marginBottom: 24,
    textAlign: "center",
    fontFamily: "monospace",
    paddingHorizontal: 16,
  },
  instructions: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    fontStyle: "italic",
  },
});
