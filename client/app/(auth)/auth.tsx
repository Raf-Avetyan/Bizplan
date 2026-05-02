import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import SignUp from "@/components/auth/sign-up/SignUp";
import { useSettings } from "@/lib/settings-context";

export default function Auth() {
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";

  return (
    <SafeAreaView style={{ backgroundColor: isDark ? "#0a1b1f" : "#F8FAFC", flex: 1 }}>
      <SignUp />
      <StatusBar style={isDark ? "light" : "dark"} />
    </SafeAreaView>
  );
}
