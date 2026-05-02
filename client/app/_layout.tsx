import "react-native-reanimated";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo } from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/Toast/Toast';
import { SettingsProvider, useSettings } from "@/lib/settings-context";

SplashScreen.preventAutoHideAsync();
import "@/global.css";


export default function MainLayout() {
  const [loaded] = useFonts({
    Arm_Hmks_Bebas_Neue: require("../assets/fonts/Arm_Hmks_Bebas_Neue/Arm_Hmks_Bebas_Neue.ttf"),
    Gabarito: require("../assets/fonts/Gabarito/Gabarito.ttf"),
    "REM-Regular": require("../assets/fonts/REM/REM-Regular.ttf"),
    "REM-Light": require("../assets/fonts/REM/REM-Light.ttf"),
    "REM-Medium": require("../assets/fonts/REM/REM-Medium.ttf"),
    "REM-Bold": require("../assets/fonts/REM/REM-Bold.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: true,
            refetchOnMount: true
          },
        },
      }),
    [],
  );

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <AppNavigator />
      </SettingsProvider>
    </QueryClientProvider>
  );
}

function AppNavigator() {
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const appBackground = isDark ? "#0a1b1f" : "#F4F7FB";

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: appBackground }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ToastProvider>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: appBackground },
            animation: settings.reducedMotion ? "none" : "default",
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(root)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
