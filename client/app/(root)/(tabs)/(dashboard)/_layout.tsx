import { Stack } from 'expo-router';

export default function DashboardLayout() {
   return (
      <Stack screenOptions={{ headerShown: false }}>
         <Stack.Screen name="index" />
         <Stack.Screen name="marketing-tools" />
         <Stack.Screen name="financials" />
         <Stack.Screen name="pitch-deck" />
         <Stack.Screen name="guides" />
         <Stack.Screen name="market-research" />
         <Stack.Screen name="my-documents" />
         <Stack.Screen name="marketing-strategy" />
         <Stack.Screen name="facebook-post" />
         <Stack.Screen name="instagram-post" />
         <Stack.Screen name="product-sales-sheet" />
         <Stack.Screen name="sales-follow-up-email" />
      </Stack>
   );
}

