import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { useSettings } from "@/lib/settings-context";

export default function RootLayout() {
   const { settings } = useSettings();
   const colorScheme = useColorScheme();
   const resolvedTheme =
      settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
   const contentBg = resolvedTheme === "dark" ? "#0a1b1f" : "#F4F7FB";

   return (
      <Stack
         screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: contentBg },
            animation: settings.reducedMotion ? "none" : "default",
         }}
      >
         <Stack.Screen name="(tabs)" />
         <Stack.Screen name="companies" />
         <Stack.Screen name="create-company" />
         <Stack.Screen name="settings" />
         <Stack.Screen name="(modals)/chat" />
         <Stack.Screen name="(modals)/business-plan-edit" />
         <Stack.Screen name="notifications/index" />
      </Stack>
   );
}
