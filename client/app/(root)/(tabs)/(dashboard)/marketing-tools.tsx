import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  ArrowRight,
  Facebook,
  FileChartColumn,
  Folder,
  Instagram,
  Mail,
  Megaphone,
  TrendingUp,
} from "lucide-react-native";
import { getToolDocumentCounts, ToolDocumentType } from "@/lib/tool-documents";
import { useSettings } from "@/lib/settings-context";

function getTools(t: ReturnType<typeof getMarketingToolsCopy>): Array<{
  title: string;
  description: string;
  route: string;
  type: ToolDocumentType;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}> {
  return [
  {
    title: t.marketingStrategy,
    description: t.marketingStrategyBody,
    route: "/(root)/(tabs)/(dashboard)/marketing-strategy",
    type: "marketing-strategy",
    icon: TrendingUp,
  },
  {
    title: t.facebookPost,
    description: t.facebookPostBody,
    route: "/(root)/(tabs)/(dashboard)/facebook-post",
    type: "facebook-post",
    icon: Facebook,
  },
  {
    title: t.instagramPost,
    description: t.instagramPostBody,
    route: "/(root)/(tabs)/(dashboard)/instagram-post",
    type: "instagram-post",
    icon: Instagram,
  },
  {
    title: t.productSalesSheet,
    description: t.productSalesSheetBody,
    route: "/(root)/(tabs)/(dashboard)/product-sales-sheet",
    type: "product-sales-sheet",
    icon: FileChartColumn,
  },
  {
    title: t.salesFollowUpEmail,
    description: t.salesFollowUpEmailBody,
    route: "/(root)/(tabs)/(dashboard)/sales-follow-up-email",
    type: "sales-follow-up-email",
    icon: Mail,
  },
  ];
}

export default function MarketingToolsScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getMarketingToolsPalette(isDark);
  const t = getMarketingToolsCopy(settings.language);
  const [counts, setCounts] = useState<Record<ToolDocumentType, number> | null>(null);
  const tools = getTools(t);

  useEffect(() => {
    void getToolDocumentCounts().then(setCounts);
  }, []);

  const totalDocuments = counts ? Object.values(counts).reduce((sum, value) => sum + value, 0) : 0;

  return (
    <LinearGradient
      colors={palette.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.headerButton, { backgroundColor: palette.headerButton, borderColor: palette.border }]}
            >
              <ArrowLeft size={20} color={palette.text} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/(root)/(tabs)/(dashboard)/my-documents")}
              style={[styles.headerButton, { backgroundColor: palette.headerButton, borderColor: palette.border }]}
            >
              <Folder size={20} color={palette.text} />
            </Pressable>
          </View>

          <LinearGradient
            colors={palette.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={[styles.badge, { backgroundColor: palette.badgeBackground, borderColor: palette.badgeBorder }]}>
              <Megaphone size={13} color={palette.accent} />
              <Text style={[styles.badgeText, { color: palette.heroEyebrow }]}>{t.dashboardTool}</Text>
            </View>
            <Text style={[styles.heroTitle, { color: palette.heroText }]}>{t.marketingTools}</Text>
            <Text style={[styles.heroBody, { color: palette.heroMuted }]}>
              {t.heroBody}
            </Text>
            <View style={[styles.summaryPill, { backgroundColor: palette.heroChip }]}>
              {counts ? (
                <>
                  <Text style={[styles.summaryValue, { color: palette.heroText }]}>{totalDocuments}</Text>
                  <Text style={[styles.summaryLabel, { color: palette.heroMuted }]}>{t.savedMarketingDocuments}</Text>
                </>
              ) : (
                <ActivityIndicator color={palette.heroText} />
              )}
            </View>
          </LinearGradient>

          <View style={styles.toolGrid}>
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Pressable
                  key={tool.title}
                  onPress={() => router.push(tool.route as any)}
                  style={styles.toolCardPressable}

                >
                  <LinearGradient
                    colors={palette.cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.toolCard, { borderColor: palette.border }]}
                  >
                    <LinearGradient
                      colors={getToolVisualGradient(index)}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.toolVisual}
                    >
                      <View style={styles.visualGrid} />
                      <View style={styles.toolIconWrap}>
                        <Icon size={28} color="#DFAE55" strokeWidth={2.2} />
                      </View>
                      <View style={styles.visualLines}>
                        {Array.from({ length: 8 }).map((_, lineIndex) => (
                          <View key={lineIndex} style={styles.visualLine} />
                        ))}
                      </View>
                      <View style={styles.visualBadge}>
                        <Text style={styles.visualBadgeText}>{counts ? t.savedCount(counts[tool.type]) : t.loading}</Text>
                      </View>
                    </LinearGradient>

                    <View style={styles.toolTextWrap}>
                      <View style={styles.toolTitleRow}>
                        <Text style={[styles.toolTitle, { color: palette.text }]}>{tool.title}</Text>
                        <ArrowRight size={18} color={palette.arrow} />
                      </View>
                      <Text style={[styles.toolDescription, { color: palette.muted }]}>{tool.description}</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}


function getToolVisualGradient(index: number) {
  const gradients = [
    ["rgba(77,47,178,0.96)", "rgba(24,59,53,0.92)"] as const,
    ["rgba(24,59,53,0.96)", "rgba(223,174,85,0.70)"] as const,
    ["rgba(17,24,39,0.98)", "rgba(77,47,178,0.88)"] as const,
    ["rgba(1,160,109,0.88)", "rgba(24,59,53,0.96)"] as const,
    ["rgba(24,59,53,0.92)", "rgba(14,165,233,0.68)"] as const,
  ];
  return gradients[index % gradients.length];
}
function getMarketingToolsCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      dashboardTool: "Инструмент панели",
      marketingTools: "Маркетинг-инструменты",
      heroBody: "Создавайте стратегию, посты, письма и sales-материалы для активной компании, затем сохраняйте результаты в документах.",
      savedMarketingDocuments: "сохраненных маркетинг-документов",
      loading: "Загрузка...",
      savedCount: (count: number) => `${count} сохранено`,
      marketingStrategy: "Маркетинговая стратегия",
      marketingStrategyBody: "Постройте план каналов и кампаний для активной компании.",
      facebookPost: "Пост Facebook",
      facebookPostBody: "Создайте social copy с hooks, CTA и messaging angles.",
      instagramPost: "Пост Instagram",
      instagramPostBody: "Сгенерируйте captions, visual direction и hashtags.",
      productSalesSheet: "Sales sheet продукта",
      productSalesSheetBody: "Создайте sales-ready one-pagers и positioning docs.",
      salesFollowUpEmail: "Follow-up email",
      salesFollowUpEmailBody: "Подготовьте polished email sequences и follow-up drafts.",
    };
  }

  if (language === "hy") {
    return {
      dashboardTool: "Dashboard գործիք",
      marketingTools: "Մարքեթինգ գործիքներ",
      heroBody: "Ստեղծեք ռազմավարություն, post-եր, նամակներ և sales նյութեր ակտիվ ընկերության համար, հետո պահեք արդյունքները փաստաթղթերում։",
      savedMarketingDocuments: "պահված մարքեթինգ փաստաթուղթ",
      loading: "Բեռնվում է...",
      savedCount: (count: number) => `${count} պահված`,
      marketingStrategy: "Մարքեթինգ ռազմավարություն",
      marketingStrategyBody: "Կառուցեք channel և campaign պլան ակտիվ ընկերության համար։",
      facebookPost: "Facebook post",
      facebookPostBody: "Ստեղծեք social copy hooks, CTA և messaging angles-ով։",
      instagramPost: "Instagram post",
      instagramPostBody: "Գեներացրեք captions, visual direction և hashtags։",
      productSalesSheet: "Product sales sheet",
      productSalesSheetBody: "Ստեղծեք sales-ready one-pagers և positioning docs։",
      salesFollowUpEmail: "Follow-up email",
      salesFollowUpEmailBody: "Պատրաստեք polished email sequences և follow-up drafts։",
    };
  }

  return {
    dashboardTool: "Dashboard tool",
    marketingTools: "Marketing tools",
    heroBody: "Create strategy, posts, emails, and sales materials for the active company, then save the results in documents.",
    savedMarketingDocuments: "saved marketing documents",
    loading: "Loading...",
    savedCount: (count: number) => `${count} saved`,
    marketingStrategy: "Marketing strategy",
    marketingStrategyBody: "Build a channel and campaign plan for your active company.",
    facebookPost: "Facebook post",
    facebookPostBody: "Create social copy with hooks, CTA, and messaging angles.",
    instagramPost: "Instagram post",
    instagramPostBody: "Generate captions, visual direction, and hashtags.",
    productSalesSheet: "Product sales sheet",
    productSalesSheetBody: "Write sales-ready one-pagers and product positioning docs.",
    salesFollowUpEmail: "Sales follow-up email",
    salesFollowUpEmailBody: "Prepare polished email sequences and follow-up drafts.",
  };
}

function getMarketingToolsPalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#090B14", "#111827", "#183B35"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    heroGradient: isDark
      ? (["rgba(77,47,178,0.96)", "rgba(24,59,53,0.92)", "rgba(9,11,20,0.94)"] as const)
      : (["rgba(255,255,255,0.98)", "rgba(238,232,255,0.94)", "rgba(232,246,241,0.96)"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "#A8B0C0" : "#475569",
    heroText: isDark ? "#FFFFFF" : "#0F172A",
    heroMuted: isDark ? "#CBD5E1" : "#475569",
    heroEyebrow: isDark ? "#E5E7EB" : "#64748B",
    card: isDark ? "rgba(15,23,42,0.84)" : "rgba(255,255,255,0.90)",
    cardGradient: isDark
      ? (["rgba(15,23,42,0.86)", "rgba(18,49,46,0.72)"] as const)
      : (["rgba(255,255,255,0.98)", "rgba(240,253,250,0.94)", "rgba(239,246,255,0.94)"] as const),
    headerButton: isDark ? "rgba(15,23,42,0.84)" : "rgba(255,255,255,0.88)",
    heroChip: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.72)",
    badgeBackground: isDark ? "rgba(9,11,20,0.28)" : "rgba(255,255,255,0.72)",
    badgeBorder: isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.10)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)",
    accent: isDark ? "#DFAE55" : "#B7791F",
    arrow: isDark ? "#FFFFFF" : "#334155",
  };
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    gap: 12,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(9,11,20,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    color: "#E5E7EB",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  heroBody: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
  },
  summaryPill: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 12,
    alignSelf: "flex-start",
    minWidth: 150,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  summaryLabel: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
  toolGrid: {
    gap: 12,
  },
  toolCardPressable: {
    borderRadius: 26,
  },
  toolCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    overflow: "hidden",
  },
  toolVisual: {
    height: 160,
    margin: 16,
    marginBottom: 0,
    borderRadius: 24,
    overflow: "hidden",
    padding: 18,
  },
  visualGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  toolIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(15,23,42,0.52)",
    alignItems: "center",
    justifyContent: "center",
  },
  visualLines: {
    marginTop: 34,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  visualLine: {
    width: "22%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  visualBadge: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  visualBadgeText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: "800",
  },
  toolTextWrap: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 8,
  },
  toolTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toolTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
  },
  toolDescription: {
    color: "#A8B0C0",
    fontSize: 14,
    lineHeight: 21,
  },
});





