import React, { useMemo } from "react";
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
import { useRouter } from "expo-router";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  FileText,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react-native";
import { useActiveCompany, useCompanies } from "@/hooks/useCompanyQueries";
import { useSettings } from "@/lib/settings-context";

export default function HomeScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getHomePalette(isDark);
  const t = getHomeCopy(settings.language);
  const { data: activeCompany, isLoading: activeCompanyLoading } = useActiveCompany();
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();

  const generatedPlans = useMemo(
    () => companies.filter((company) => company.additionalData?.business_plan).length,
    [companies],
  );

  const totalPages = useMemo(
    () =>
      companies.reduce(
        (count, company) => count + (company.additionalData?.business_plan?.metadata?.total_pages ?? 0),
        0,
      ),
    [companies],
  );

  const isLoading = activeCompanyLoading || companiesLoading;

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
        >
          <View style={styles.topActions}>
            <IconButton
              label={t.ai}
              onPress={() => router.push("/(root)/(modals)/chat")}
              icon={<MessageCircle size={20} color={palette.text} />}
              palette={palette}
            />
            <IconButton
              label={t.alerts}
              onPress={() => router.push("/notifications")}
              icon={<Bell size={20} color={palette.text} />}
              palette={palette}
            />
          </View>

          <LinearGradient
            colors={palette.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: palette.border }]}
          >
            <View style={[styles.badge, { backgroundColor: palette.chip, borderColor: palette.border }]}>
              <Sparkles size={14} color="#DFAE55" />
              <Text style={[styles.badgeText, !isDark && styles.lightBody]}>{t.commandCenter}</Text>
            </View>

            <Text style={[styles.heroTitle, !isDark && styles.lightTitle]}>
              {t.heroTitle}
            </Text>
            <Text style={[styles.heroBody, !isDark && styles.lightBody]}>
              {t.heroBody}
            </Text>

            <View style={styles.heroMetaRow}>
              <View style={[styles.heroMetaPill, { backgroundColor: palette.chip }]}>
                <Building2 size={14} color={isDark ? "#D1D5DB" : "#334155"} />
                <Text style={[styles.heroMetaText, !isDark && styles.lightBody]}>
                  {activeCompany ? activeCompany.businessName : t.noActiveCompany}
                </Text>
              </View>
              <View style={[styles.heroMetaPill, { backgroundColor: palette.chip }]}>
                <FileText size={14} color={isDark ? "#D1D5DB" : "#334155"} />
                <Text style={[styles.heroMetaText, !isDark && styles.lightBody]}>
                  {t.generatedPlans(generatedPlans)}
                </Text>
              </View>
            </View>

            <View style={styles.heroActionRow}>
              <PrimaryButton
                label={activeCompany ? t.openActivePlan : t.createCompany}
                onPress={() =>
                  router.push(activeCompany ? "/(root)/(tabs)/plan" : "/create-company")
                }
              />
              <SecondaryButton
                label={t.manageCompanies}
                onPress={() => router.push("/companies")}
                palette={palette}
              />
            </View>
          </LinearGradient>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionEyebrow, !isDark && styles.lightEyebrow]}>{t.workspaceOverview}</Text>
            <Text style={[styles.sectionTitle, !isDark && styles.lightTitle]}>{t.everythingAtGlance}</Text>
          </View>

          {isLoading ? (
            <View style={[styles.loadingCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <ActivityIndicator color="#A78BFA" />
              <Text style={[styles.loadingText, { color: palette.muted }]}>{t.loadingWorkspace}</Text>
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                <StatCard
                  label={t.companies}
                  value={String(companies.length)}
                  hint={t.savedInAccount}
                  icon={<Building2 size={18} color="#DFAE55" />}
                  palette={palette}
                />
                <StatCard
                  label={t.plans}
                  value={String(generatedPlans)}
                  hint={t.generatedWithAi}
                  icon={<FileText size={18} color="#A78BFA" />}
                  palette={palette}
                />
                <StatCard
                  label={t.pages}
                  value={String(totalPages)}
                  hint={t.acrossPlans}
                  icon={<BarChart3 size={18} color="#34D399" />}
                  palette={palette}
                />
              </View>

              <View style={styles.featureGrid}>
                <FeatureCard
                  icon={<BarChart3 size={20} color="#A78BFA" />}
                  title={t.planning}
                  body={t.planningBody}
                  palette={palette}
                />
                <FeatureCard
                  icon={<TrendingUp size={20} color="#34D399" />}
                  title={t.growth}
                  body={t.growthBody}
                  palette={palette}
                />
                <FeatureCard
                  icon={<ShieldCheck size={20} color="#DFAE55" />}
                  title={t.control}
                  body={t.controlBody}
                  palette={palette}
                />
              </View>

              <View style={styles.splitRow}>
                <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
                  <Text style={[styles.panelEyebrow, { color: palette.eyebrow }]}>{t.activeCompany}</Text>
                  <Text style={[styles.panelTitle, { color: palette.text }]}>
                    {activeCompany ? activeCompany.businessName : t.noCompanySelected}
                  </Text>
                  <Text style={[styles.panelBody, { color: palette.muted }]}>
                    {activeCompany
                      ? activeCompany.idea
                      : t.noCompanyBody}
                  </Text>

                  <View style={styles.tagRow}>
                    {activeCompany?.uniqueTags?.slice(0, 3).map((tag) => (
                      <View key={tag} style={[styles.tag, { backgroundColor: palette.chip, borderColor: palette.border }]}>
                        <Text style={[styles.tagText, { color: palette.text }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    style={styles.inlineLink}
                    onPress={() =>
                      router.push(activeCompany ? "/(root)/(tabs)/plan" : "/create-company")
                    }
                  >
                    <Text style={styles.inlineLinkText}>
                      {activeCompany ? t.continueWorking : t.startFirstCompany}
                    </Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </Pressable>
                </View>

                <View style={[styles.panel, { backgroundColor: palette.accentCard, borderColor: palette.border }]}>
                  <Text style={[styles.panelEyebrow, { color: palette.eyebrow }]}>{t.quickMoves}</Text>
                  <QuickLink
                    label={t.aiConsultant}
                    description={t.aiConsultantBody}
                    onPress={() => router.push("/(root)/(modals)/chat")}
                    palette={palette}
                  />
                  <QuickLink
                    label={t.dashboardTools}
                    description={t.dashboardToolsBody}
                    onPress={() => router.push("/(root)/(tabs)/(dashboard)")}
                    palette={palette}
                  />
                  <QuickLink
                    label={t.profile}
                    description={t.profileBody}
                    onPress={() => router.push("/(root)/(tabs)/profile")}
                    palette={palette}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function IconButton({
  label,
  icon,
  onPress,
  palette,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  palette: ReturnType<typeof getHomePalette>;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.iconButton, { backgroundColor: palette.card, borderColor: palette.border }]}>
      {icon}
      <Text style={[styles.iconButtonLabel, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
  palette,
}: {
  label: string;
  onPress: () => void;
  palette: ReturnType<typeof getHomePalette>;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.secondaryButton, { backgroundColor: palette.chip, borderColor: palette.border }]}>
      <Text style={[styles.secondaryButtonText, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  palette,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  palette: ReturnType<typeof getHomePalette>;
}) {
  return (
    <LinearGradient
      colors={palette.cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.statCard, { borderColor: palette.border }]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: palette.chip }]}>{icon}</View>
      <Text style={[styles.statLabel, { color: palette.eyebrow }]}>{label}</Text>
      <Text style={[styles.statValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.statHint, { color: palette.muted }]}>{hint}</Text>
    </LinearGradient>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  palette,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  palette: ReturnType<typeof getHomePalette>;
}) {
  return (
    <LinearGradient
      colors={palette.cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.featureCard, { borderColor: palette.border }]}
    >
      <View style={[styles.featureIcon, { backgroundColor: palette.chip }]}>{icon}</View>
      <Text style={[styles.featureTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.featureBody, { color: palette.muted }]}>{body}</Text>
    </LinearGradient>
  );
}

function QuickLink({
  label,
  description,
  onPress,
  palette,
}: {
  label: string;
  description: string;
  onPress: () => void;
  palette: ReturnType<typeof getHomePalette>;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.quickLink, { backgroundColor: palette.chip, borderColor: palette.border }]}>
      <View style={styles.quickLinkTextWrap}>
        <Text style={[styles.quickLinkLabel, { color: palette.text }]}>{label}</Text>
        <Text style={[styles.quickLinkDescription, { color: palette.muted }]}>{description}</Text>
      </View>
      <ArrowRight size={16} color={palette.text} />
    </Pressable>
  );
}

function getHomeCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      ai: "AI",
      alerts: "Уведомления",
      commandCenter: "Центр управления Bizplan",
      heroTitle: "Быстро двигайте компанию от идеи к готовому бизнес-плану.",
      heroBody: "Следите за активной компанией, открывайте инструменты плана и AI-консультанта без лишних переходов.",
      noActiveCompany: "Нет активной компании",
      generatedPlans: (count: number) => `${count} ${count === 1 ? "созданный план" : "созданных планов"}`,
      openActivePlan: "Открыть активный план",
      createCompany: "Создать компанию",
      manageCompanies: "Управлять компаниями",
      workspaceOverview: "Обзор бизнеса",
      everythingAtGlance: "Все важное под рукой",
      loadingWorkspace: "Загружаем данные бизнеса...",
      companies: "Компании",
      savedInAccount: "Сохранено в аккаунте",
      plans: "Планы",
      generatedWithAi: "Создано с AI",
      pages: "Страницы",
      acrossPlans: "Во всех созданных планах",
      planning: "Планирование",
      planningBody: "Быстро открывайте текущий бизнес-план, финансы и страницы документа.",
      growth: "Рост",
      growthBody: "Переходите к поиску, контент-инструментам и анализу конкурентов.",
      control: "Контроль",
      controlBody: "Активная компания, настройки и профиль всегда рядом.",
      activeCompany: "Активная компания",
      noCompanySelected: "Компания не выбрана",
      noCompanyBody: "Создайте компанию, чтобы открыть генерацию плана, AI-помощь и инструменты панели.",
      continueWorking: "Продолжить работу",
      startFirstCompany: "Создать первую компанию",
      quickMoves: "Быстрые действия",
      aiConsultant: "AI-консультант",
      aiConsultantBody: "Задавайте вопросы и получайте советы для активной компании.",
      dashboardTools: "Инструменты панели",
      dashboardToolsBody: "Откройте сетку бизнес-инструментов и модули созданного плана.",
      profile: "Профиль",
      profileBody: "Обновите данные аккаунта и настройки приложения.",
    };
  }

  if (language === "hy") {
    return {
      ai: "AI",
      alerts: "Ծանուցումներ",
      commandCenter: "Bizplan կառավարման կենտրոն",
      heroTitle: "Գաղափարից արագ անցեք պատրաստ բիզնես պլանի։",
      heroBody: "Հետևեք ակտիվ ընկերությանը, բացեք պլանի գործիքները և AI խորհրդատուին առանց հոսքից դուրս գալու։",
      noActiveCompany: "Ակտիվ ընկերություն չկա",
      generatedPlans: (count: number) => `${count} ստեղծված պլան`,
      openActivePlan: "Բացել ակտիվ պլանը",
      createCompany: "Ստեղծել ընկերություն",
      manageCompanies: "Կառավարել ընկերությունները",
      workspaceOverview: "Բիզնեսի ամփոփում",
      everythingAtGlance: "Ամենակարևորը մեկ տեղում",
      loadingWorkspace: "Բեռնվում են բիզնեսի տվյալները...",
      companies: "Ընկերություններ",
      savedInAccount: "Պահված է հաշվում",
      plans: "Պլաններ",
      generatedWithAi: "Ստեղծված AI-ով",
      pages: "Էջեր",
      acrossPlans: "Ստեղծված պլաններում",
      planning: "Պլանավորում",
      planningBody: "Արագ բացեք ընթացիկ բիզնես պլանը, ֆինանսները և փաստաթղթի էջերը։",
      growth: "Աճ",
      growthBody: "Անցեք որոնման, կոնտենտ գործիքների և մրցակիցների վերլուծության հոսքերին։",
      control: "Կառավարում",
      controlBody: "Ակտիվ ընկերությունը, կարգավորումները և պրոֆիլը պահեք մոտ։",
      activeCompany: "Ակտիվ ընկերություն",
      noCompanySelected: "Ընկերություն ընտրված չէ",
      noCompanyBody: "Ստեղծեք ընկերություն՝ պլանի գեներացիան, AI ուղեցույցը և dashboard գործիքները բացելու համար։",
      continueWorking: "Շարունակել աշխատանքը",
      startFirstCompany: "Սկսել առաջին ընկերությունը",
      quickMoves: "Արագ քայլեր",
      aiConsultant: "AI խորհրդատու",
      aiConsultantBody: "Հարցեր տվեք և ստացեք ուղեցույց ակտիվ ընկերության համար։",
      dashboardTools: "Dashboard գործիքներ",
      dashboardToolsBody: "Բացեք բիզնես գործիքների ցանցը և ստեղծված պլանի մոդուլները։",
      profile: "Պրոֆիլ",
      profileBody: "Թարմացրեք հաշվի տվյալները և հավելվածի կարգավորումները։",
    };
  }

  return {
    ai: "AI",
    alerts: "Alerts",
    commandCenter: "Bizplan command center",
    heroTitle: "Move from company idea to business plan faster.",
    heroBody: "Track your active company, jump into plan tools, and open the AI consultant without leaving the app flow.",
    noActiveCompany: "No active company",
    generatedPlans: (count: number) => `${count} generated ${count === 1 ? "plan" : "plans"}`,
    openActivePlan: "Open active plan",
    createCompany: "Create company",
    manageCompanies: "Manage companies",
    workspaceOverview: "Business overview",
    everythingAtGlance: "Everything important at a glance",
    loadingWorkspace: "Loading business data...",
    companies: "Companies",
    savedInAccount: "Saved in your account",
    plans: "Plans",
    generatedWithAi: "Generated with AI",
    pages: "Pages",
    acrossPlans: "Across generated plans",
    planning: "Planning",
    planningBody: "Open the current business plan, financials, and document pages quickly.",
    growth: "Growth",
    growthBody: "Jump into search, content tools, and competitor-focused workflows.",
    control: "Control",
    controlBody: "Keep your active company, settings, and profile actions close by.",
    activeCompany: "Active company",
    noCompanySelected: "No company selected",
    noCompanyBody: "Create a company to unlock plan generation, AI guidance, and the dashboard tools.",
    continueWorking: "Continue working",
    startFirstCompany: "Start your first company",
    quickMoves: "Quick moves",
    aiConsultant: "AI consultant",
    aiConsultantBody: "Ask questions and get guidance for the active company.",
    dashboardTools: "Dashboard tools",
    dashboardToolsBody: "Open the business tool grid and generated plan modules.",
    profile: "Profile",
    profileBody: "Update your account details and app preferences.",
  };
}

function getHomePalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#090B14", "#111827", "#183B35"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    heroGradient: isDark
      ? (["rgba(77,47,178,0.95)", "rgba(24,59,53,0.92)", "rgba(9,11,20,0.96)"] as const)
      : (["#FFFFFF", "#F4FBFF", "#EEF7FF"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "#CBD5E1" : "#475569",
    eyebrow: isDark ? "rgba(229,231,235,0.65)" : "#64748B",
    card: isDark ? "rgba(15,23,42,0.84)" : "rgba(255,255,255,0.88)",
    cardGradient: isDark
      ? (["rgba(15,23,42,0.90)", "rgba(24,59,53,0.70)"] as const)
      : (["rgba(255,255,255,0.98)", "rgba(239,253,246,0.94)", "rgba(238,247,255,0.94)"] as const),
    accentCard: isDark ? "rgba(24,59,53,0.86)" : "rgba(236,253,245,0.88)",
    chip: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)",
  };
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 18,
  },
  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.72)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconButtonLabel: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    gap: 14,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(9,11,20,0.34)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    color: "#E5E7EB",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 31,
    lineHeight: 35,
    fontWeight: "800",
  },
  heroBody: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 14,
    lineHeight: 22,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroMetaText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "600",
  },
  heroActionRow: {
    gap: 10,
  },
  primaryButton: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
  },
  sectionHeader: {
    gap: 4,
  },
  sectionEyebrow: {
    color: "rgba(229,231,235,0.65)",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 28,
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
  loadingCard: {
    borderRadius: 24,
    backgroundColor: "rgba(15,23,42,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 32,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#CBD5E1",
    fontSize: 14,
  },
  statsRow: {
    gap: 12,
  },
  statCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    padding: 16,
    gap: 6,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    color: "rgba(229,231,235,0.7)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  statHint: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },
  featureGrid: {
    gap: 12,
  },
  featureCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(8,15,31,0.78)",
    padding: 16,
    gap: 10,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  featureBody: {
    color: "#A8B0C0",
    fontSize: 13,
    lineHeight: 20,
  },
  splitRow: {
    gap: 12,
  },
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    padding: 18,
    gap: 12,
  },
  panelAccent: {
    backgroundColor: "rgba(24,59,53,0.86)",
  },
  panelEyebrow: {
    color: "rgba(229,231,235,0.65)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  panelTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
  },
  panelBody: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "600",
  },
  inlineLink: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#4D2FB2",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineLinkText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(9,11,20,0.28)",
    padding: 14,
  },
  quickLinkTextWrap: {
    flex: 1,
    gap: 4,
  },
  quickLinkLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  quickLinkDescription: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
  },
});
