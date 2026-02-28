import "react-native-reanimated";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/Toast/Toast';

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

  if (!loaded) {
    return null;
  }

  const queryClient = new QueryClient({
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
  });

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0a1b1f" }}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Stack screenOptions={{ contentStyle: { backgroundColor: "#0a1b1f" } }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="(root)"
              options={{ headerShown: false, animation: "none" }}
            />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </ToastProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
