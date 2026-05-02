import React, { useCallback, useMemo, useState } from "react";
import {
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
import { useRouter } from "expo-router";
import {
  AlignJustify,
  ArrowRight,
  FileText,
  MessageCircle,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react-native";
import Menu from "./components/Menu/Menu";
import Content from "./components/Content";
import LottieLoading from "@/components/ui/LottieLoading/LottieLoading";
import { useActiveCompany, useCompanies } from "@/hooks/useCompanyQueries";
import { useSettings } from "@/lib/settings-context";

export default function DashboardScreen() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getDashboardPalette(isDark);
  const t = getDashboardCopy(settings.language);

  const { data: activeCompany, isLoading, refetch } = useActiveCompany();
  const { data: companies = [] } = useCompanies();

  const generatedPlans = useMemo(
    () => companies.filter((company) => company.additionalData?.business_plan).length,
    [companies],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <LinearGradient
      colors={palette.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <LottieLoading
          isLoading={isLoading}
          lottieURL={{ loading: require("@/assets/lottie/spinner.json") }}
        />

        <View style={styles.header}>
          <Pressable onPress={() => setIsMenuOpen((current) => !current)} style={[styles.iconButton, { backgroundColor: palette.card, borderColor: palette.border }]}>
            {isMenuOpen ? <X size={22} color={palette.text} /> : <AlignJustify size={22} color={palette.text} />}
          </Pressable>

          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerEyebrow, !isDark && styles.lightEyebrow]}>{t.dashboard}</Text>
            <Text style={[styles.headerTitle, !isDark && styles.lightTitle]}>
              {activeCompany ? activeCompany.businessName : t.commandCenter}
            </Text>
          </View>

          <Pressable onPress={() => void onRefresh()} style={[styles.iconButton, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <RefreshCw size={20} color={palette.text} />
          </Pressable>
        </View>

        {isMenuOpen ? (
          <>
            <Pressable style={styles.overlay} onPress={() => setIsMenuOpen(false)} />
            <Menu isMenuOpen={isMenuOpen} />
          </>
        ) : null}

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="rgba(255,255,255,0.7)"
            />
          }
        >
          <LinearGradient
            colors={palette.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: palette.border }]}
          >
            <View style={[styles.heroBadge, { backgroundColor: palette.chip, borderColor: palette.border }]}>
              <Sparkles size={13} color="#DFAE55" />
              <Text style={[styles.heroBadgeText, !isDark && styles.lightBody]}>{t.mobileDashboard}</Text>
            </View>
            <Text style={[styles.heroTitle, !isDark && styles.lightTitle]}>{t.heroTitle}</Text>
            <Text style={[styles.heroBody, !isDark && styles.lightBody]}>
              {t.heroBody}
            </Text>

            <View style={styles.heroStatsRow}>
              <View style={[styles.heroStatPill, { backgroundColor: palette.chip }]}>
                <Text style={[styles.heroStatValue, !isDark && styles.lightTitle]}>{companies.length}</Text>
                <Text style={[styles.heroStatLabel, !isDark && styles.lightBody]}>{t.companies}</Text>
              </View>
              <View style={[styles.heroStatPill, { backgroundColor: palette.chip }]}>
                <Text style={[styles.heroStatValue, !isDark && styles.lightTitle]}>{generatedPlans}</Text>
                <Text style={[styles.heroStatLabel, !isDark && styles.lightBody]}>{t.plans}</Text>
              </View>
            </View>

            <View style={styles.heroActions}>
              <Pressable
                style={styles.primaryButton}
                onPress={() =>
                  router.push(activeCompany ? "/(root)/(tabs)/plan" : "/create-company")
                }
              >
                <FileText size={16} color="#0F172A" />
                <Text style={styles.primaryButtonText}>
                  {activeCompany ? t.openPlan : t.createCompany}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, { backgroundColor: palette.chip, borderColor: palette.border }]}
                onPress={() => router.push("/(root)/(modals)/chat")}
              >
                <MessageCircle size={16} color={palette.text} />
                <Text style={[styles.secondaryButtonText, { color: palette.text }]}>{t.aiConsultant}</Text>
              </Pressable>
            </View>
          </LinearGradient>

          {activeCompany ? (
            <>
              <View style={[styles.activeCompanyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Text style={[styles.activeCompanyEyebrow, !isDark && styles.lightEyebrow]}>{t.activeCompany}</Text>
                <Text style={[styles.activeCompanyTitle, !isDark && styles.lightTitle]}>{activeCompany.businessName}</Text>
                <Text style={[styles.activeCompanyBody, !isDark && styles.lightBody]}>{activeCompany.idea}</Text>
                <Pressable
                  style={styles.inlineAction}
                  onPress={() => router.push("/(root)/(tabs)/plan")}
                >
                  <Text style={styles.inlineActionText}>{t.continueToBusinessPlan}</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </Pressable>
              </View>

              <Content companyData={activeCompany} />
            </>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>{t.noActiveCompany}</Text>
              <Text style={[styles.emptyBody, { color: palette.muted }]}>
                {t.noActiveCompanyBody}
              </Text>
              <Pressable style={styles.emptyButton} onPress={() => router.push("/create-company")}>
                <Text style={styles.emptyButtonText}>{t.createFirstCompany}</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getDashboardPalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#090B14", "#111827", "#183B35"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    heroGradient: isDark
      ? (["rgba(77,47,178,0.96)", "rgba(24,59,53,0.92)", "rgba(9,11,20,0.94)"] as const)
      : (["#FFFFFF", "#F4FBFF", "#EEF7FF"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "#CBD5E1" : "#475569",
    card: isDark ? "rgba(15,23,42,0.84)" : "rgba(255,255,255,0.90)",
    chip: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.045)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)",
  };
}

function getDashboardCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      dashboard: "Панель",
      commandCenter: "Центр управления",
      mobileDashboard: "Панель планирования",
      heroTitle: "Управляйте планом, компанией и AI-инструментами в одном потоке.",
      heroBody: "Открывайте бизнес-план, маркетинговые инструменты, документы и AI-помощь для активной компании.",
      companies: "Компании",
      plans: "Планы",
      openPlan: "Открыть план",
      createCompany: "Создать компанию",
      aiConsultant: "AI-консультант",
      activeCompany: "Активная компания",
      continueToBusinessPlan: "Перейти к бизнес-плану",
      noActiveCompany: "Активной компании пока нет",
      noActiveCompanyBody: "Сначала создайте компанию, чтобы панель могла генерировать и организовывать инструменты плана.",
      createFirstCompany: "Создать первую компанию",
    };
  }

  if (language === "hy") {
    return {
      dashboard: "Վահանակ",
      commandCenter: "Կառավարման կենտրոն",
      mobileDashboard: "Պլանավորման վահանակ",
      heroTitle: "Կառավարեք պլանը, ընկերությունը և AI գործիքները մեկ հոսքում։",
      heroBody: "Բացեք բիզնես պլանը, մարքեթինգ գործիքները, փաստաթղթերը և AI օգնությունը ակտիվ ընկերության համար։",
      companies: "Ընկերություններ",
      plans: "Պլաններ",
      openPlan: "Բացել պլանը",
      createCompany: "Ստեղծել ընկերություն",
      aiConsultant: "AI խորհրդատու",
      activeCompany: "Ակտիվ ընկերություն",
      continueToBusinessPlan: "Շարունակել դեպի բիզնես պլան",
      noActiveCompany: "Ակտիվ ընկերություն դեռ չկա",
      noActiveCompanyBody: "Նախ ստեղծեք ընկերություն, որպեսզի dashboard-ը գեներացնի և կազմակերպի պլանի գործիքները։",
      createFirstCompany: "Ստեղծել առաջին ընկերությունը",
    };
  }

  return {
    dashboard: "Dashboard",
    commandCenter: "Command center",
    mobileDashboard: "Planning dashboard",
    heroTitle: "Manage your plan, company, and AI tools in one flow.",
    heroBody: "Open the business plan, marketing tools, saved documents, and AI support for the active company.",
    companies: "Companies",
    plans: "Plans",
    openPlan: "Open plan",
    createCompany: "Create company",
    aiConsultant: "AI consultant",
    activeCompany: "Active company",
    continueToBusinessPlan: "Continue to business plan",
    noActiveCompany: "No active company yet",
    noActiveCompanyBody: "Create a company first so the dashboard can generate and organize your plan tools.",
    createFirstCompany: "Create your first company",
  };
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3000,
  },
  headerTextWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  headerEyebrow: {
    color: "rgba(229,231,235,0.62)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 1500,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 120,
    gap: 16,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    gap: 12,
  },
  heroBadge: {
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
  heroBadgeText: {
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
  heroStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  heroStatPill: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 12,
    gap: 2,
  },
  heroStatValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  heroStatLabel: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
  heroActions: {
    gap: 10,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  activeCompanyCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    padding: 18,
    gap: 10,
  },
  activeCompanyEyebrow: {
    color: "rgba(229,231,235,0.62)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  activeCompanyTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  activeCompanyBody: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
  },
  inlineAction: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#4D2FB2",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    padding: 20,
    gap: 12,
    alignItems: "flex-start",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  emptyBody: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
  },
  emptyButton: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emptyButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  lightCardBorder: {
    borderColor: "rgba(15, 23, 42, 0.08)",
  },
  lightEyebrow: {
    color: "rgba(15,23,42,0.58)",
  },
  lightTitle: {
    color: "#0f172a",
  },
  lightBody: {
    color: "#334155",
  },
});
