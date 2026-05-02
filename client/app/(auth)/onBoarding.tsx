import { router } from "expo-router";
import React, { useState } from "react";
import { Text, Button, StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieLoading from "@/components/ui/LottieLoading/LottieLoading";
import { useSettings } from "@/lib/settings-context";

const OnBoarding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#001941" : "#F8FAFC" }]}>
      <LottieLoading
        isLoading={isLoading}
        lottieURL={{
          loading: require("@/assets/lottie/business.json"),
        }}
      />
      <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>OnBoarding</Text>
      <Button title="Go to Auth" onPress={() => router.push("/(auth)/auth")} />
    </SafeAreaView>
  );
};

export default OnBoarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
});
