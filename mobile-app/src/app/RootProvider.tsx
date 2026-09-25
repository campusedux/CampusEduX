import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";

/**
 * Wraps the app with every cross-cutting provider: gesture handler root,
 * safe-area context, and React Query for server-state (jobs, projects,
 * placement data, etc. in later modules).
 */
export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}><ErrorBoundary scope="root">{children}</ErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default RootProvider;
