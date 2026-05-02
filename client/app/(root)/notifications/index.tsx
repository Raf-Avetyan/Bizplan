import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Bell, FileText, Sparkles } from "lucide-react-native";
import { useActiveCompany, useCompanies } from "@/hooks/useCompanyQueries";
import { getToolDocuments, ToolDocument } from "@/lib/tool-documents";
import { useSettings } from "@/lib/settings-context";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  route: string;
  tone: "primary" | "success" | "warning";
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getNotificationsPalette(isDark);
  const t = getNotificationsCopy(settings.language);
  const { data: activeCompany, refetch: refetchActiveCompany } = useActiveCompany();
  const { data: companies = [], refetch: refetchCompanies } = useCompanies();
  const [documents, setDocuments] = useState<ToolDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    void loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setIsLoading(true);
      setDocuments(await getToolDocuments());
    } finally {
      setIsLoading(false);
    }
  }

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        loadDocuments(),
        refetchActiveCompany(),
        refetchCompanies(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchActiveCompany, refetchCompanies]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    if (!companies.length) {
      items.push({
        id: "no-companies",
        title: t.createFirstCompany,
        body: t.createFirstCompanyBody,
        actionLabel: t.createCompany,
        route: "/create-company",
        tone: "warning",
      });
    }

    if (activeCompany) {
      items.push({
        id: "active-company",
        title: t.activeCompanyTitle(activeCompany.businessName),
        body: t.activeCompanyBody,
        actionLabel: t.openDashboard,
        route: "/(root)/(tabs)/(dashboard)",
        tone: "primary",
      });

      if (activeCompany.additionalData?.business_plan) {
        items.push({
          id: "active-plan",
          title: t.businessPlanAvailable,
          body: t.businessPlanAvailableBody(activeCompany.businessName),
          actionLabel: t.openPlan,
          route: "/(root)/(tabs)/plan",
          tone: "success",
        });
      }
    }

    documents.slice(0, 5).forEach((document) => {
      items.push({
        id: document.id,
        title: t.documentSaved(document.title),
        body: t.documentSavedBody(document.type, document.companyName),
        actionLabel: t.openDocuments,
        route: "/(root)/(tabs)/(dashboard)/my-documents",
        tone: "primary",
      });
    });

    return items;
  }, [activeCompany, companies.length, documents, t]);

  return (
    <LinearGradient
      colors={palette.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={palette.text}
              colors={["#4D2FB2"]}
            />
          }
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={[styles.headerButton, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <ArrowLeft size={20} color={palette.text} />
            </Pressable>
          </View>

          <LinearGradient
            colors={palette.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: palette.border }]}
          >
            <View style={[styles.badge, { backgroundColor: palette.badgeBackground, borderColor: palette.badgeBorder }]}>
              <Bell size={13} color={palette.accent} />
              <Text style={[styles.badgeText, { color: palette.text }]}>{t.homeShortcut}</Text>
            </View>
            <Text style={[styles.heroTitle, { color: palette.text }]}>{t.notifications}</Text>
            <Text style={[styles.heroBody, { color: palette.muted }]}>
              {t.subtitle}
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={palette.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { borderColor: palette.border }]}
          >
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{t.recentActivity}</Text>
            {isLoading ? (
              <ActivityIndicator color="#A78BFA" />
            ) : notifications.length === 0 ? (
              <Text style={[styles.emptyText, { color: palette.muted }]}>{t.noActivity}</Text>
            ) : (
              <View style={styles.list}>
                {notifications.map((item) => (
                  <View key={item.id} style={[styles.noticeCard, getNoticeToneStyle(item.tone, isDark)]}>
                    <View style={styles.noticeTop}>
                      <View style={[styles.noticeIconWrap, { backgroundColor: palette.noticeIconBackground }]}>
                        {item.tone === "success" ? (
                          <FileText size={16} color={palette.noticeIconColor} />
                        ) : (
                          <Sparkles size={16} color={palette.noticeIconColor} />
                        )}
                      </View>
                      <View style={styles.noticeTextWrap}>
                        <Text style={[styles.noticeTitle, { color: palette.text }]}>{item.title}</Text>
                        <Text style={[styles.noticeBody, { color: palette.muted }]}>{item.body}</Text>
                      </View>
                    </View>
                    <Pressable
                      style={[styles.noticeButton, { backgroundColor: palette.chip, borderColor: palette.border }]}
                      onPress={() => router.push(item.route as any)}
                    >
                      <Text style={[styles.noticeButtonText, { color: palette.text }]}>{item.actionLabel}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const toneStyles = StyleSheet.create({
  primary: {
    borderColor: "rgba(167,139,250,0.22)",
    backgroundColor: "rgba(77,47,178,0.16)",
  },
  success: {
    borderColor: "rgba(52,211,153,0.22)",
    backgroundColor: "rgba(6,78,59,0.28)",
  },
  warning: {
    borderColor: "rgba(223,174,85,0.25)",
    backgroundColor: "rgba(120,53,15,0.22)",
  },
});

function getNoticeToneStyle(tone: NotificationItem["tone"], isDark: boolean) {
  if (tone === "success") {
    return {
      borderColor: isDark ? "rgba(52,211,153,0.22)" : "rgba(16,185,129,0.28)",
      backgroundColor: isDark ? "rgba(6,78,59,0.28)" : "rgba(209,250,229,0.72)",
    };
  }

  if (tone === "warning") {
    return {
      borderColor: isDark ? "rgba(223,174,85,0.25)" : "rgba(217,119,6,0.28)",
      backgroundColor: isDark ? "rgba(120,53,15,0.22)" : "rgba(254,243,199,0.76)",
    };
  }

  return {
    borderColor: isDark ? "rgba(167,139,250,0.22)" : "rgba(109,40,217,0.22)",
    backgroundColor: isDark ? "rgba(77,47,178,0.16)" : "rgba(237,233,254,0.76)",
  };
}

function getNotificationsPalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#090B14", "#111827", "#183B35"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    heroGradient: isDark
      ? (["rgba(77,47,178,0.96)", "rgba(24,59,53,0.92)", "rgba(9,11,20,0.94)"] as const)
      : (["#FFFFFF", "#F4FBFF", "#EEF7FF"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "#CBD5E1" : "#475569",
    card: isDark ? "rgba(15,23,42,0.84)" : "rgba(255,255,255,0.88)",
    cardGradient: isDark
      ? (["rgba(15,23,42,0.86)", "rgba(18,49,46,0.72)"] as const)
      : (["rgba(255,255,255,0.98)", "rgba(240,253,250,0.94)", "rgba(239,246,255,0.94)"] as const),
    chip: isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.72)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)",
    badgeBackground: isDark ? "rgba(9,11,20,0.28)" : "rgba(255,255,255,0.80)",
    badgeBorder: isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.10)",
    accent: isDark ? "#DFAE55" : "#B7791F",
    noticeIconBackground: isDark ? "rgba(255,255,255,0.12)" : "rgba(77,47,178,0.12)",
    noticeIconColor: isDark ? "#FFFFFF" : "#4D2FB2",
  };
}

function getNotificationsCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      createFirstCompany: "Создайте первую компанию",
      createFirstCompanyBody: "Создайте компанию, чтобы включить генерацию плана, AI-помощь и бизнес-инструменты.",
      createCompany: "Создать компанию",
      activeCompanyTitle: (name: string) => `Активная компания: ${name}`,
      activeCompanyBody: "Панель, AI-консультант и инструменты плана теперь работают вокруг этой компании.",
      openDashboard: "Открыть панель",
      businessPlanAvailable: "Бизнес-план готов",
      businessPlanAvailableBody: (name: string) => `У ${name} уже есть созданный бизнес-план для просмотра.`,
      openPlan: "Открыть план",
      documentSaved: (title: string) => `${title} сохранен`,
      documentSavedBody: (type: string, companyName?: string | null) =>
        `${type} сохранен для ${companyName ?? "общего использования"}.`,
      openDocuments: "Открыть документы",
      homeShortcut: "Быстрый доступ",
      notifications: "Уведомления",
      subtitle: "Активность компаний, планов и созданных документов появляется здесь.",
      recentActivity: "Последняя активность",
      noActivity: "Активности пока нет. Создайте компанию или откройте план, и обновления появятся здесь.",
    };
  }

  if (language === "hy") {
    return {
      createFirstCompany: "Ստեղծեք առաջին ընկերությունը",
      createFirstCompanyBody: "Создайте компанию, чтобы включить генерацию плана, AI-помощь и бизнес-инструменты.",
      createCompany: "Ստեղծել ընկերություն",
      activeCompanyTitle: (name: string) => `Ակտիվ ընկերություն՝ ${name}`,
      activeCompanyBody: "Dashboard-ը, AI խորհրդատուն և պլանի գործիքները հիմա կենտրոնացած են այս ընկերության շուրջ։",
      openDashboard: "Բացել dashboard-ը",
      businessPlanAvailable: "Բիզնես պլանը պատրաստ է",
      businessPlanAvailableBody: (name: string) => `${name}-ի համար արդեն կա ստեղծված բիզնես պլան։`,
      openPlan: "Բացել պլանը",
      documentSaved: (title: string) => `${title}-ը պահված է`,
      documentSavedBody: (type: string, companyName?: string | null) =>
        `${type}-ը պահված է ${companyName ?? "ընդհանուր օգտագործման"} համար։`,
      openDocuments: "Բացել փաստաթղթերը",
      homeShortcut: "Արագ մուտք",
      notifications: "Ծանուցումներ",
      subtitle: "Ընկերությունների, պլանների և ստեղծված փաստաթղթերի ակտիվությունը կհայտնվի այստեղ։",
      recentActivity: "Վերջին ակտիվություն",
      noActivity: "Активности пока нет. Создайте компанию или откройте план, и обновления появятся здесь.",
    };
  }

  return {
    createFirstCompany: "Create your first company",
    createFirstCompanyBody: "Создайте компанию, чтобы включить генерацию плана, AI-помощь и бизнес-инструменты.",
    createCompany: "Create company",
    activeCompanyTitle: (name: string) => `Active company: ${name}`,
    activeCompanyBody: "Your dashboard, AI consultant, and plan tools are now centered around this company.",
    openDashboard: "Open dashboard",
    businessPlanAvailable: "Business plan available",
    businessPlanAvailableBody: (name: string) => `${name} already has a generated business plan ready to review.`,
    openPlan: "Open plan",
    documentSaved: (title: string) => `${title} saved`,
    documentSavedBody: (type: string, companyName?: string | null) =>
      `${type} was saved for ${companyName ?? "general use"}.`,
    openDocuments: "Open documents",
    homeShortcut: "Home shortcut",
    notifications: "Notifications",
    subtitle: "Activity across your companies, plans, and generated tool documents appears here.",
    recentActivity: "Recent activity",
    noActivity: "Активности пока нет. Создайте компанию или откройте план, и обновления появятся здесь.",
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
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyText: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
  },
  list: {
    gap: 10,
  },
  noticeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  noticeTop: {
    flexDirection: "row",
    gap: 12,
  },
  noticeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  noticeTextWrap: {
    flex: 1,
    gap: 4,
  },
  noticeTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  noticeBody: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
  },
  noticeButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noticeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
