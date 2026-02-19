import { Stack } from "expo-router";

export default function RootLayout() {
   return (
      <Stack screenOptions={{ headerShown: false }}>
         <Stack.Screen name="(tabs)" />
         <Stack.Screen name="(modals)/chat" options={{ presentation: "modal" }} />
         <Stack.Screen name="(modals)/business-plan-edit" />
         <Stack.Screen name="notifications/index" />
      </Stack>
   );
}