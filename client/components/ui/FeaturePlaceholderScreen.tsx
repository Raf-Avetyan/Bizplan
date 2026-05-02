import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ComponentType } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { useSettings } from "@/lib/settings-context";

type Action = {
  label: string;
  route: string;
};

type FeaturePlaceholderScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  actions: Action[];
};

export default function FeaturePlaceholderScreen({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: FeaturePlaceholderScreenProps) {
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getPlaceholderPalette(isDark);

  return (
    <LinearGradient
      colors={palette.gradient}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      locations={[0, 0.6, 1]}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <LinearGradient
            colors={palette.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { borderColor: palette.border }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: palette.iconBg }]}>
              <Icon size={28} color="#fff" strokeWidth={1.8} />
            </View>
            <Text style={[styles.eyebrow, { color: palette.eyebrow }]}>{eyebrow}</Text>
            <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
            <Text style={[styles.description, { color: palette.muted }]}>{description}</Text>
          </LinearGradient>

          <View style={styles.actions}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[styles.actionButton, { backgroundColor: palette.actionBg, borderColor: palette.border }]}
                onPress={() => router.push(action.route as any)}
              >
                <Text style={[styles.actionText, { color: palette.text }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getPlaceholderPalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#4D2FB2", "#2B1A66", "#050510"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "rgba(255,255,255,0.74)" : "#475569",
    eyebrow: isDark ? "rgba(255,255,255,0.62)" : "#64748B",
    card: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.86)",
    cardGradient: isDark
      ? (["rgba(255,255,255,0.10)", "rgba(24,59,53,0.18)"] as const)
      : (["rgba(255,255,255,0.98)", "rgba(240,253,250,0.94)", "rgba(239,246,255,0.94)"] as const),
    actionBg: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.9)",
    iconBg: isDark ? "rgba(255,255,255,0.14)" : "#4D2FB2",
    border: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.10)",
  };
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 22,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: 18,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontFamily: "REM-Bold",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 30,
    lineHeight: 34,
    fontFamily: "Gabarito",
    marginTop: 8,
  },
  description: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 15,
    lineHeight: 23,
    fontFamily: "REM-Regular",
    marginTop: 12,
  },
  actions: {
    marginTop: 18,
    gap: 12,
  },
  actionButton: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  actionText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "REM-Bold",
  },
});
