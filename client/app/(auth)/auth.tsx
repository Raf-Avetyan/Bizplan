import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import SignUp from "@/components/auth/sign-up/SignUp";
import { useSettings } from "@/lib/settings-context";

export default function Auth() {
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const topColor = isDark ? "#24114A" : "#6A48E0";
  const bottomColor = isDark ? "#24114A" : "#D7D2FF";

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(bottomColor).catch(() => undefined);
    NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark").catch(() => undefined);
  }, [bottomColor, isDark]);

  return (
    <SafeAreaView style={{ backgroundColor: topColor, flex: 1 }}>
      <SignUp />
      <StatusBar style={isDark ? "light" : "dark"} />
    </SafeAreaView>
  );
}
