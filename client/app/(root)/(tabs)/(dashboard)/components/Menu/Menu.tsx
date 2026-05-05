import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  Facebook,
  FileChartColumn,
  FileText,
  Folder,
  Instagram,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  PieChart,
  PencilRuler,
  Presentation,
  SearchCheck,
  UserRound,
  UsersRound,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, Pressable, View, useColorScheme } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useToast } from "@/components/ui/Toast/Toast";
import type { ComponentType } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "@/lib/settings-context";
import axiosClient from "@/api/axios-client";

type MenuProps = {
  isMenuOpen: boolean;
};

type MenuItem = {
  label: string;
  description: string;
  route: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

const Menu = ({ isMenuOpen }: MenuProps) => {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getMenuPalette(isDark);
  const t = getMenuCopy(settings.language);
  const [userName, setUserName] = useState(t.profile);
  const menuOpacity = useSharedValue(0);
  const menuTranslateX = useSharedValue(-320);

  useEffect(() => {
    void loadUserName();
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      menuOpacity.value = withTiming(1, {
        duration: 220,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      });
      menuTranslateX.value = withTiming(0, {
        duration: 220,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      });
      return;
    }

    menuOpacity.value = withTiming(0, {
      duration: 180,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    });
    menuTranslateX.value = withTiming(-140, {
      duration: 180,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    });
  }, [isMenuOpen, menuOpacity, menuTranslateX]);

  const animatedMenuStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
    transform: [{ translateX: menuTranslateX.value }],
  }));

  const initials = useMemo(() => {
    const parts = userName.split(" ").filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "BP";
  }, [userName]);

  async function loadUserName() {
    try {
      const profile = await axiosClient.get("/user/profile") as { name?: string };
      if (profile?.name?.trim()) {
        setUserName(profile.name.trim());
        return;
      }

      const raw = await AsyncStorage.getItem("user");
      if (!raw) return;

      const parsed = JSON.parse(raw) as { name?: string };
      if (parsed?.name?.trim()) {
        setUserName(parsed.name.trim());
      }
    } catch {
      // Keep fallback label.
    }
  }

  async function logout() {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("user");
    router.replace("/(auth)/auth");
  }

  return (
    <Animated.View
      style={[
        styles.drawer,
        { backgroundColor: palette.background, borderRightColor: palette.border },
        animatedMenuStyle,
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 54, 94), paddingBottom: 24 },
        ]}
      >
        <LinearHeader initials={initials} userName={userName} palette={palette} t={t} />

        <MenuSection title={t.workspace} items={getWorkspaceItems(t)} palette={palette} />
        <MenuSection title={t.createAndPlan} items={getContentItems(t)} palette={palette} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom + 58, 78),
            borderTopColor: palette.border,
          },
        ]}
      >
        <Pressable
          style={[styles.profileCard, { backgroundColor: palette.card, borderColor: palette.border }]}
          onPress={() => router.push("/profile" as any)}
        >
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileTextWrap}>
            <Text style={[styles.profileTitle, { color: palette.text }]} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={[styles.profileSubtitle, { color: palette.muted }]}>{t.openProfile}</Text>
          </View>
          <UserRound size={18} color={palette.muted} />
        </Pressable>

        <Pressable
          style={[
            styles.logoutButton,
            {
              backgroundColor: palette.logoutBackground,
              borderColor: palette.logoutBorder,
            },
          ]}
          onPress={() =>
            toast.showConfirm(
              t.logout,
              t.logoutConfirm,
              () => {
                void logout();
              },
              {
                type: "warning",
                confirmText: t.logout,
                cancelText: t.stay,
              },
            )
          }
        >
          <LogOut size={18} color={palette.logoutText} />
          <Text style={[styles.logoutText, { color: palette.logoutText }]}>{t.logout}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

function LinearHeader({
  initials,
  userName,
  palette,
  t,
}: {
  initials: string;
  userName: string;
  palette: ReturnType<typeof getMenuPalette>;
  t: ReturnType<typeof getMenuCopy>;
}) {
  return (
    <View style={[styles.headerCard, { backgroundColor: palette.headerCard, borderColor: palette.border }]}>
      <View style={styles.headerAvatar}>
        <Text style={styles.headerAvatarText}>{initials}</Text>
      </View>
      <Text style={[styles.headerTitle, { color: palette.text }]}>{t.welcomeBack}</Text>
      <Text style={[styles.headerBody, { color: palette.muted }]} numberOfLines={2}>
        {t.headerBody(userName)}
      </Text>
    </View>
  );
}

function MenuSection({
  title,
  items,
  palette,
}: {
  title: string;
  items: MenuItem[];
  palette: ReturnType<typeof getMenuPalette>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.eyebrow }]}>{title}</Text>
      <View style={styles.sectionItems}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.label}
              style={[styles.menuItem, { backgroundColor: palette.card, borderColor: palette.border }]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuIconWrap}>
                <Icon size={18} color="#FFFFFF" strokeWidth={1.8} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuLabel, { color: palette.text }]}>{item.label}</Text>
                <Text style={[styles.menuDescription, { color: palette.muted }]}>{item.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function getMenuPalette(isDark: boolean) {
  return {
    background: isDark ? "#08101F" : "#F8FAFC",
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#475569",
    eyebrow: isDark ? "rgba(229,231,235,0.62)" : "#64748B",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.10)",
    card: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.88)",
    headerCard: isDark ? "rgba(77,47,178,0.18)" : "rgba(77,47,178,0.08)",
    logoutBackground: isDark ? "rgba(127,29,29,0.18)" : "rgba(254,226,226,0.95)",
    logoutBorder: isDark ? "rgba(248,113,113,0.18)" : "rgba(220,38,38,0.22)",
    logoutText: isDark ? "#FECACA" : "#991B1B",
  };
}

function getWorkspaceItems(t: ReturnType<typeof getMenuCopy>): MenuItem[] {
  return [
    { label: t.dashboard, description: t.dashboardDescription, route: "/(root)/(tabs)/(dashboard)", icon: LayoutDashboard },
    { label: t.aiConsultant, description: t.aiConsultantDescription, route: "/(root)/(modals)/chat", icon: MessageCircle },
    { label: t.marketingTools, description: t.marketingToolsDescription, route: "/(root)/(tabs)/(dashboard)/marketing-tools", icon: PencilRuler },
    { label: t.pitchDeck, description: t.pitchDeckDescription, route: "/(root)/(tabs)/(dashboard)/pitch-deck", icon: Presentation },
    { label: t.financials, description: t.financialsDescription, route: "/(root)/(tabs)/(dashboard)/financials", icon: PieChart },
    { label: t.marketResearch, description: t.marketResearchDescription, route: "/(root)/(tabs)/(dashboard)/market-research", icon: SearchCheck },
    { label: t.guides, description: t.guidesDescription, route: "/(root)/(tabs)/(dashboard)/guides", icon: FileText },
    { label: t.myDocuments, description: t.myDocumentsDescription, route: "/(root)/(tabs)/(dashboard)/my-documents", icon: Folder },
    { label: t.companies, description: t.companiesDescription, route: "/companies", icon: UsersRound },
  ];
}

function getContentItems(t: ReturnType<typeof getMenuCopy>): MenuItem[] {
  return [
    { label: t.businessPlan, description: t.businessPlanDescription, route: "/(root)/(tabs)/plan", icon: FileText },
    { label: t.marketingStrategy, description: t.marketingStrategyDescription, route: "/(root)/(tabs)/(dashboard)/marketing-strategy", icon: PencilRuler },
    { label: t.facebookPost, description: t.facebookPostDescription, route: "/(root)/(tabs)/(dashboard)/facebook-post", icon: Facebook },
    { label: t.instagramPost, description: t.instagramPostDescription, route: "/(root)/(tabs)/(dashboard)/instagram-post", icon: Instagram },
    { label: t.productSalesSheet, description: t.productSalesSheetDescription, route: "/(root)/(tabs)/(dashboard)/product-sales-sheet", icon: FileChartColumn },
    { label: t.salesFollowUpEmail, description: t.salesFollowUpEmailDescription, route: "/(root)/(tabs)/(dashboard)/sales-follow-up-email", icon: Mail },
  ];
}

function getMenuCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      profile: "Профиль",
      workspace: "Основное",
      createAndPlan: "Создать и планировать",
      openProfile: "Открыть профиль",
      logout: "Выйти",
      logoutConfirm: "Выйти из аккаунта?",
      stay: "Остаться",
      welcomeBack: "С возвращением",
      headerBody: (name: string) => `${name}. Инструменты плана, AI-помощь и действия аккаунта в одном месте.`,
      dashboard: "Панель",
      dashboardDescription: "Обзор и инструменты плана",
      aiConsultant: "AI-консультант",
      aiConsultantDescription: "Открыть чат с контекстом компании",
      marketingTools: "Маркетинг-инструменты",
      marketingToolsDescription: "Открыть весь набор инструментов",
      myDocuments: "Мои документы",
      myDocumentsDescription: "Созданные материалы и файлы",
      pitchDeck: "Pitch deck",
      pitchDeckDescription: "Открыть визуальный редактор и презентации",
      financials: "Финансы",
      financialsDescription: "Прогнозы, cash flow и финансовые блоки",
      marketResearch: "Исследование рынка",
      marketResearchDescription: "Новости, конкуренты и рыночные инсайты",
      guides: "Гайды",
      guidesDescription: "Операционные и бизнес-гайды",
      companies: "Компании",
      companiesDescription: "Менять и управлять компаниями",
      businessPlan: "Бизнес-план",
      businessPlanDescription: "Открыть текущий план",
      marketingStrategy: "Маркетинговая стратегия",
      marketingStrategyDescription: "Планировать бренд и рост",
      facebookPost: "Пост Facebook",
      facebookPostDescription: "Быстро создать social-контент",
      instagramPost: "Пост Instagram",
      instagramPostDescription: "Создать текст визуальной кампании",
      productSalesSheet: "Sales sheet продукта",
      productSalesSheetDescription: "Подготовить sales-материалы",
      salesFollowUpEmail: "Follow-up email",
      salesFollowUpEmailDescription: "Написать следующее письмо",
    };
  }

  if (language === "hy") {
    return {
      profile: "Պրոֆիլ",
      workspace: "Հիմնական",
      createAndPlan: "Ստեղծել և պլանավորել",
      openProfile: "Բացել պրոֆիլը",
      logout: "Դուրս գալ",
      logoutConfirm: "Դո՞ւրս գալ հաշվից։",
      stay: "Մնալ",
      welcomeBack: "Բարի վերադարձ",
      headerBody: (name: string) => `${name}. Պլանի գործիքներ, AI օգնություն և հաշվի գործողություններ մեկ տեղում։`,
      dashboard: "Վահանակ",
      dashboardDescription: "Ամփոփում և պլանի գործիքներ",
      aiConsultant: "AI խորհրդատու",
      aiConsultantDescription: "Բացել ընկերության կոնտեքստով չատը",
      marketingTools: "Մարքեթինգ գործիքներ",
      marketingToolsDescription: "Բացել գործիքների ամբողջ հավաքածուն",
      myDocuments: "Իմ փաստաթղթերը",
      myDocumentsDescription: "Ստեղծված նյութեր և ֆայլեր",
      pitchDeck: "Pitch deck",
      pitchDeckDescription: "Բացել visual editor-ը և presentation-ները",
      financials: "Ֆինանսներ",
      financialsDescription: "Կանխատեսումներ, cash flow և ֆինանսական բլոկներ",
      marketResearch: "Շուկայի ուսումնասիրություն",
      marketResearchDescription: "Նորություններ, մրցակիցներ և շուկայական insight-ներ",
      guides: "Գայդեր",
      guidesDescription: "Գործառնական և բիզնես ուղեցույցներ",
      companies: "Ընկերություններ",
      companiesDescription: "Փոխել և կառավարել ընկերությունները",
      businessPlan: "Բիզնես պլան",
      businessPlanDescription: "Բացել ընթացիկ պլանը",
      marketingStrategy: "Մարքեթինգ ռազմավարություն",
      marketingStrategyDescription: "Պլանավորել բրենդն ու աճը",
      facebookPost: "Facebook post",
      facebookPostDescription: "Արագ ստեղծել social կոնտենտ",
      instagramPost: "Instagram post",
      instagramPostDescription: "Ստեղծել visual campaign copy",
      productSalesSheet: "Product sales sheet",
      productSalesSheetDescription: "Պատրաստել sales collateral",
      salesFollowUpEmail: "Follow-up email",
      salesFollowUpEmailDescription: "Գրել հաջորդ outreach նամակը",
    };
  }

  return {
    profile: "Profile",
    workspace: "Main",
    createAndPlan: "Create and plan",
    openProfile: "Open profile",
    logout: "Logout",
    logoutConfirm: "Do you want to sign out of your account?",
    stay: "Stay",
    welcomeBack: "Welcome back",
    headerBody: (name: string) => `${name}. Open plan tools, AI help, and account actions from one place.`,
    dashboard: "Dashboard",
    dashboardDescription: "Overview and plan tools",
    aiConsultant: "AI Consultant",
    aiConsultantDescription: "Open the company-aware chat",
    marketingTools: "Marketing Tools",
    marketingToolsDescription: "Open the full tool collection",
    myDocuments: "My Documents",
    myDocumentsDescription: "Generated outputs and files",
    pitchDeck: "Pitch Deck",
    pitchDeckDescription: "Open the visual editor and presentations",
    financials: "Financials",
    financialsDescription: "Forecasts, cash flow, and finance blocks",
    marketResearch: "Market Research",
    marketResearchDescription: "News, competitors, and market insight",
    guides: "Guides",
    guidesDescription: "Operational and business guides",
    companies: "Companies",
    companiesDescription: "Switch and manage companies",
    businessPlan: "Business Plan",
    businessPlanDescription: "Open the current plan",
    marketingStrategy: "Marketing Strategy",
    marketingStrategyDescription: "Plan brand and growth moves",
    facebookPost: "Facebook Post",
    facebookPostDescription: "Draft social content quickly",
    instagramPost: "Instagram Post",
    instagramPostDescription: "Build visual campaign copy",
    productSalesSheet: "Product Sales Sheet",
    productSalesSheetDescription: "Prepare sales collateral",
    salesFollowUpEmail: "Sales Follow-Up Email",
    salesFollowUpEmailDescription: "Write the next outreach message",
  };
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "84%",
    backgroundColor: "#08101F",
    zIndex: 2000,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.06)",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 18,
  },
  headerCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(77,47,178,0.18)",
    padding: 18,
    gap: 8,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#4D2FB2",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  headerEyebrow: {
    color: "rgba(229,231,235,0.62)",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  headerBody: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: "rgba(229,231,235,0.62)",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  sectionItems: {
    gap: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 14,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(77,47,178,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextWrap: {
    flex: 1,
    gap: 3,
  },
  menuLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  menuDescription: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 14,
  },
  avatarBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#183B35",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  profileTextWrap: {
    flex: 1,
    gap: 2,
  },
  profileTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  profileSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.18)",
    backgroundColor: "rgba(127,29,29,0.18)",
    paddingVertical: 14,
  },
  logoutText: {
    color: "#FECACA",
    fontSize: 14,
    fontWeight: "800",
  },
});

export default Menu;
