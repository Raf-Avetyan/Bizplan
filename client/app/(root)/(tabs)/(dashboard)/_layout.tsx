import { Stack } from 'expo-router';

export default function DashboardLayout() {
   return (
      <Stack screenOptions={{ headerShown: false }}>
         <Stack.Screen name="index" />
         <Stack.Screen name="marketing-tools" />
         <Stack.Screen name="my-documents" />
      </Stack>
   );
}
