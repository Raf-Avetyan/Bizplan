import React, { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Building2,
  LogOut,
  Mail,
  PencilLine,
  Save,
  Settings,
  UserCircle2,
} from "lucide-react-native";
import axiosClient from "@/api/axios-client";
import { useToast } from "@/components/ui/Toast/Toast";
import { useSettings } from "@/lib/settings-context";
import { useActiveCompany, useCompanies } from "@/hooks/useCompanyQueries";
import { UserProfile } from "@/types/auth.types";

export default function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getProfilePalette(isDark);
  const t = getProfileCopy(settings.language);
  const { data: activeCompany, refetch: refetchActiveCompany } = useActiveCompany();
  const { data: companies = [], refetch: refetchCompanies } = useCompanies();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    void fetchUserProfile();
  }, []);

  async function handleLogout() {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("user");
    router.replace("/(auth)/auth");
  }

  async function fetchUserProfile() {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("auth_token");

      if (!token) {
        toast.showToast(t.authRequired, t.loginToContinue, "warning");
        router.replace("/(auth)/auth");
        return;
      }

      const userData: UserProfile = await axiosClient.get("/user/profile");
      setProfile(userData);
      setName(userData.name);
    } catch (error: any) {
      const message = error?.message || t.failedLoadProfile;

      if (error?.status === 401 || String(message).includes("Unauthorized")) {
        toast.showToast(t.sessionExpired, t.loginAgain, "warning");
        await handleLogout();
        return;
      }

      toast.showToast(t.profileError, message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchUserProfile(),
        refetchActiveCompany(),
        refetchCompanies(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchActiveCompany, refetchCompanies]);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.showToast(t.nameRequired, t.enterNameBeforeSaving, "warning");
      return;
    }

    try {
      setIsSaving(true);
      const updatedUser: UserProfile = await axiosClient.patch("/user/profile", {
        name: trimmedName,
      });

      setProfile(updatedUser);
      setName(updatedUser.name);
      setIsEditing(false);
      toast.showToast(t.profileUpdated, t.nameSaved, "success");
    } catch (error: any) {
      const message = error?.message || t.failedUpdateProfile;

      if (error?.status === 401 || String(message).includes("Unauthorized")) {
        toast.showToast(t.sessionExpired, t.loginAgain, "warning");
        await handleLogout();
        return;
      }

      toast.showToast(t.updateFailed, message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  const joinedLabel = useMemo(() => {
    if (!profile?.createdAt) return t.notAvailable;
    const date = new Date(profile.createdAt);
    if (Number.isNaN(date.getTime())) return profile.createdAt;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [profile?.createdAt, t]);

  return (
    <LinearGradient
      colors={palette.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          style={styles.keyboardWrap}
        >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 + insets.bottom }]}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={palette.text}
              colors={["#4D2FB2"]}
            />
          }
        >
          <LinearGradient
            colors={palette.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: palette.border }]}
          >
            <View style={[styles.avatarWrap, { backgroundColor: palette.avatarBackground }]}>
              <UserCircle2 size={52} color={palette.avatarIcon} />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={[styles.eyebrow, { color: palette.eyebrow }]}>{t.account}</Text>
              <Text style={[styles.heroTitle, { color: palette.text }]}>
                {profile?.name || (isLoading ? t.loadingProfile : t.yourProfile)}
              </Text>
              <Text style={[styles.heroBody, { color: palette.muted }]}>
                {t.heroBody}
              </Text>
            </View>
          </LinearGradient>

          {isLoading ? (
            <View style={[styles.loadingCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <ActivityIndicator color="#A78BFA" />
              <Text style={[styles.loadingText, { color: palette.muted }]}>{t.loadingProfile}</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryRow}>
                <SummaryCard
                  label={t.companies}
                  value={String(companies.length)}
                  hint={t.savedInAccount}
                  palette={palette}
                />
                <SummaryCard
                  label={t.active}
                  value={activeCompany?.businessName || t.none}
                  hint={t.currentCompanyContext}
                  palette={palette}
                />
              </View>

              <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderText}>
                    <Text style={[styles.cardEyebrow, { color: palette.eyebrow }]}>{t.personalDetails}</Text>
                    <Text style={[styles.cardTitle, { color: palette.text }]}>{t.profileInformation}</Text>
                  </View>
                  {!isEditing ? (
                    <Pressable style={[styles.ghostButton, { backgroundColor: palette.chip, borderColor: palette.border }]} onPress={() => setIsEditing(true)}>
                      <PencilLine size={16} color={palette.text} />
                      <Text style={[styles.ghostButtonText, { color: palette.text }]} numberOfLines={1}>{t.edit}</Text>
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.infoBlock}>
                  <Text style={[styles.label, { color: palette.muted }]}>{t.name}</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    editable={isEditing && !isSaving}
                    placeholder={t.yourName}
                    placeholderTextColor={palette.placeholder}
                    style={[
                      styles.input,
                      { backgroundColor: palette.input, borderColor: palette.border, color: palette.text },
                      !isEditing && { color: palette.muted },
                    ]}
                  />
                </View>

                <View style={styles.infoBlock}>
                  <Text style={[styles.label, { color: palette.muted }]}>{t.email}</Text>
                  <View style={[styles.infoPill, { backgroundColor: palette.input, borderColor: palette.border }]}>
                    <Mail size={16} color={palette.muted} />
                    <Text style={[styles.infoPillText, { color: palette.text }]}>
                      {settings.showProfileEmail ? profile?.email || t.noEmail : t.hiddenBySettings}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaGrid}>
                  <MetaTile label={t.userId} value={profile?.id || t.unavailable} palette={palette} />
                  <MetaTile label={t.joined} value={joinedLabel} palette={palette} />
                  <MetaTile
                    label={t.activePlanId}
                    value={profile?.activeBusinessPlanId || t.notAssigned}
                    palette={palette}
                  />
                </View>

                {isEditing ? (
                  <View style={styles.actionRow}>
                    <Pressable
                      style={[styles.primaryAction, isSaving && styles.disabledAction]}
                      onPress={() => void handleSave()}
                      disabled={isSaving}
                    >
                      <Save size={16} color="#0F172A" />
                      <Text style={styles.primaryActionText}>
                        {isSaving ? t.saving : t.saveChanges}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.secondaryAction, { backgroundColor: palette.chip, borderColor: palette.border }]}
                      onPress={() => {
                        setName(profile?.name || "");
                        setIsEditing(false);
                      }}
                      disabled={isSaving}
                    >
                      <Text style={[styles.secondaryActionText, { color: palette.text }]}>{t.cancel}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Text style={[styles.cardEyebrow, { color: palette.eyebrow }]}>{t.shortcuts}</Text>
                <Text style={[styles.cardTitle, { color: palette.text }]}>{t.openAccountTools}</Text>

                <ShortcutButton
                  icon={<Building2 size={18} color="#FFFFFF" />}
                  title={t.companies}
                  description={t.companiesShortcut}
                  onPress={() => router.push("/companies")}
                  palette={palette}
                />
                <ShortcutButton
                  icon={<Settings size={18} color="#FFFFFF" />}
                  title={t.settings}
                  description={t.settingsShortcut}
                  onPress={() => router.push("/settings")}
                  palette={palette}
                />
                <ShortcutButton
                  icon={<LogOut size={18} color="#FCA5A5" />}
                  title={t.logout}
                  description={t.logoutShortcut}
                  danger
                  onPress={() =>
                    toast.showConfirm(
                      t.logout,
                      t.logoutConfirm,
                      () => {
                        void handleLogout();
                      },
                      {
                        type: "warning",
                        confirmText: t.logout,
                        cancelText: t.stay,
                      },
                    )
                  }
                  palette={palette}
                />
              </View>
            </>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  palette,
}: {
  label: string;
  value: string;
  hint: string;
  palette: ReturnType<typeof getProfilePalette>;
}) {
  return (
    <LinearGradient
      colors={palette.cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.summaryCard, { borderColor: palette.border }]}
    >
      <Text style={[styles.summaryLabel, { color: palette.eyebrow }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: palette.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.summaryHint, { color: palette.muted }]}>{hint}</Text>
    </LinearGradient>
  );
}

function MetaTile({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: ReturnType<typeof getProfilePalette>;
}) {
  return (
    <View style={[styles.metaTile, { backgroundColor: palette.chip, borderColor: palette.border }]}>
      <Text style={[styles.metaLabel, { color: palette.eyebrow }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

function ShortcutButton({
  icon,
  title,
  description,
  danger = false,
  onPress,
  palette,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  danger?: boolean;
  onPress: () => void;
  palette: ReturnType<typeof getProfilePalette>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.shortcutButton,
        { backgroundColor: palette.chip, borderColor: palette.border },
        danger && { backgroundColor: palette.dangerBackground, borderColor: palette.dangerBorder },
      ]}
    >
      <View style={[styles.shortcutIcon, danger && { backgroundColor: palette.dangerIconBackground }]}>{icon}</View>
      <View style={styles.shortcutTextWrap}>
        <Text style={[styles.shortcutTitle, { color: danger ? palette.dangerText : palette.text }]}>{title}</Text>
        <Text style={[styles.shortcutDescription, { color: palette.muted }]}>{description}</Text>
      </View>
    </Pressable>
  );
}

function getProfilePalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#090B14", "#111827", "#183B35"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    heroGradient: isDark
      ? (["rgba(77,47,178,0.96)", "rgba(26,32,44,0.92)"] as const)
      : (["#FFFFFF", "#F4FBFF"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "#CBD5E1" : "#475569",
    eyebrow: isDark ? "rgba(229,231,235,0.65)" : "#64748B",
    card: isDark ? "rgba(15,23,42,0.84)" : "rgba(255,255,255,0.88)",
    cardGradient: isDark
      ? (["rgba(15,23,42,0.86)", "rgba(19,45,43,0.72)"] as const)
      : (["rgba(255,255,255,0.98)", "rgba(240,253,250,0.94)", "rgba(239,246,255,0.94)"] as const),
    input: isDark ? "rgba(2,6,23,0.65)" : "rgba(255,255,255,0.94)",
    chip: isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.04)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)",
    placeholder: isDark ? "#64748B" : "#718096",
    avatarBackground: isDark ? "rgba(255,255,255,0.14)" : "rgba(77,47,178,0.10)",
    avatarIcon: isDark ? "#FFFFFF" : "#4D2FB2",
    dangerBackground: isDark ? "rgba(127,29,29,0.16)" : "rgba(254,226,226,0.92)",
    dangerBorder: isDark ? "rgba(248,113,113,0.18)" : "rgba(220,38,38,0.22)",
    dangerIconBackground: isDark ? "rgba(127,29,29,0.5)" : "rgba(220,38,38,0.16)",
    dangerText: isDark ? "#FECACA" : "#991B1B",
  };
}

function getProfileCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      authRequired: "Требуется вход",
      loginToContinue: "Войдите, чтобы продолжить.",
      failedLoadProfile: "Не удалось загрузить профиль.",
      sessionExpired: "Сессия истекла",
      loginAgain: "Войдите снова.",
      profileError: "Ошибка профиля",
      nameRequired: "Нужно имя",
      enterNameBeforeSaving: "Введите имя перед сохранением.",
      profileUpdated: "Профиль обновлен",
      nameSaved: "Ваше имя сохранено.",
      failedUpdateProfile: "Не удалось обновить профиль.",
      updateFailed: "Обновление не удалось",
      notAvailable: "Недоступно",
      account: "Аккаунт",
      loadingProfile: "Загружаем профиль...",
      yourProfile: "Ваш профиль",
      heroBody: "Данные аккаунта, активная компания, настройки и быстрые действия в одном месте.",
      companies: "Компании",
      savedInAccount: "Сохранено в аккаунте",
      active: "Активная",
      none: "Нет",
      currentCompanyContext: "Текущий контекст компании",
      personalDetails: "Личные данные",
      profileInformation: "Информация профиля",
      edit: "Изменить",
      name: "Имя",
      yourName: "Ваше имя",
      email: "Email",
      noEmail: "Email отсутствует",
      hiddenBySettings: "Скрыто настройками",
      userId: "ID пользователя",
      unavailable: "Недоступно",
      joined: "Регистрация",
      activePlanId: "ID активного плана",
      notAssigned: "Не назначен",
      saving: "Сохраняем...",
      saveChanges: "Сохранить изменения",
      cancel: "Отмена",
      shortcuts: "Быстрые ссылки",
      openAccountTools: "Инструменты аккаунта",
      companiesShortcut: "Меняйте активную компанию и управляйте сохраненными бизнесами.",
      settings: "Настройки",
      settingsShortcut: "Обновите язык, тему, плотность и поведение приложения.",
      logout: "Выйти",
      logoutShortcut: "Безопасно выйти из аккаунта.",
      logoutConfirm: "Вы уверены, что хотите выйти из Bizplan?",
      stay: "Остаться",
    };
  }

  if (language === "hy") {
    return {
      authRequired: "Մուտքը պարտադիր է",
      loginToContinue: "Շարունակելու համար մուտք գործեք։",
      failedLoadProfile: "Չհաջողվեց բեռնել պրոֆիլը։",
      sessionExpired: "Սեսիան ավարտվել է",
      loginAgain: "Խնդրում ենք նորից մուտք գործել։",
      profileError: "Պրոֆիլի սխալ",
      nameRequired: "Անունը պարտադիր է",
      enterNameBeforeSaving: "Պահելուց առաջ մուտքագրեք ձեր անունը։",
      profileUpdated: "Պրոֆիլը թարմացվեց",
      nameSaved: "Ձեր անունը պահվեց։",
      failedUpdateProfile: "Չհաջողվեց թարմացնել պրոֆիլը։",
      updateFailed: "Թարմացումը ձախողվեց",
      notAvailable: "Հասանելի չէ",
      account: "Հաշիվ",
      loadingProfile: "Բեռնվում է պրոֆիլը...",
      yourProfile: "Ձեր պրոֆիլը",
      heroBody: "Данные аккаунта, активная компания, настройки и быстрые действия в одном месте.",
      companies: "Ընկերություններ",
      savedInAccount: "Պահված է այս հաշվում",
      active: "Ակտիվ",
      none: "Չկա",
      currentCompanyContext: "Ընթացիկ ընկերության կոնտեքստ",
      personalDetails: "Անձնական տվյալներ",
      profileInformation: "Պրոֆիլի տեղեկատվություն",
      edit: "Խմբագրել",
      name: "Անուն",
      yourName: "Ձեր անունը",
      email: "Email",
      noEmail: "Email չկա",
      hiddenBySettings: "Թաքցված է կարգավորումներով",
      userId: "Օգտատիրոջ ID",
      unavailable: "Հասանելի չէ",
      joined: "Միացել է",
      activePlanId: "Ակտիվ պլանի ID",
      notAssigned: "Նշանակված չէ",
      saving: "Պահվում է...",
      saveChanges: "Պահել փոփոխությունները",
      cancel: "Չեղարկել",
      shortcuts: "Կարճ հղումներ",
      openAccountTools: "Բացել հաշվի գործիքները",
      companiesShortcut: "Փոխեք ակտիվ ընկերությունը և կառավարեք պահված բիզնեսները։",
      settings: "Կարգավորումներ",
      settingsShortcut: "Թարմացրեք լեզուն, թեման, խտությունը և հավելվածի վարքագիծը։",
      logout: "Դուրս գալ",
      logoutShortcut: "Безопасно выйти из аккаунта.",
      logoutConfirm: "Վստա՞հ եք, որ ուզում եք դուրս գալ Bizplan-ից։",
      stay: "Մնալ",
    };
  }

  return {
    authRequired: "Authentication required",
    loginToContinue: "Please log in to continue.",
    failedLoadProfile: "Failed to load profile.",
    sessionExpired: "Session expired",
    loginAgain: "Please log in again.",
    profileError: "Profile error",
    nameRequired: "Name required",
    enterNameBeforeSaving: "Please enter your name before saving.",
    profileUpdated: "Profile updated",
    nameSaved: "Your name has been saved.",
    failedUpdateProfile: "Failed to update profile.",
    updateFailed: "Update failed",
    notAvailable: "Not available",
    account: "Account",
    loadingProfile: "Loading profile...",
    yourProfile: "Your profile",
    heroBody: "Данные аккаунта, активная компания, настройки и быстрые действия в одном месте.",
    companies: "Companies",
    savedInAccount: "Saved in this account",
    active: "Active",
    none: "None",
    currentCompanyContext: "Current company context",
    personalDetails: "Personal details",
    profileInformation: "Profile information",
    edit: "Edit",
    name: "Name",
    yourName: "Your name",
    email: "Email",
    noEmail: "No email",
    hiddenBySettings: "Hidden by settings",
    userId: "User ID",
    unavailable: "Unavailable",
    joined: "Joined",
    activePlanId: "Active plan ID",
    notAssigned: "Not assigned",
    saving: "Saving...",
    saveChanges: "Save changes",
    cancel: "Cancel",
    shortcuts: "Shortcuts",
    openAccountTools: "Open account tools",
    companiesShortcut: "Switch active company and manage saved businesses.",
    settings: "Settings",
    settingsShortcut: "Update language, theme, density, and app behavior.",
    logout: "Logout",
    logoutShortcut: "Безопасно выйти из аккаунта.",
    logoutConfirm: "Are you sure you want to log out of Bizplan?",
    stay: "Stay",
  };
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 16,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarWrap: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: "rgba(229,231,235,0.68)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "800",
  },
  heroBody: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
  },
  loadingCard: {
    borderRadius: 24,
    backgroundColor: "rgba(15,23,42,0.84)",
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
  summaryRow: {
    gap: 12,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    gap: 4,
  },
  summaryLabel: {
    color: "rgba(229,231,235,0.65)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  summaryHint: {
    color: "#94A3B8",
    fontSize: 12,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardEyebrow: {
    color: "rgba(229,231,235,0.65)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
  },
  ghostButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    maxWidth: 132,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ghostButtonText: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
  },
  infoBlock: {
    gap: 8,
  },
  label: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(2,6,23,0.65)",
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#FFFFFF",
    fontSize: 15,
  },
  inputDisabled: {
    color: "#CBD5E1",
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(2,6,23,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  infoPillText: {
    flex: 1,
    color: "#E5E7EB",
    fontSize: 14,
  },
  metaGrid: {
    gap: 10,
  },
  metaTile: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 14,
    gap: 6,
  },
  metaLabel: {
    color: "rgba(229,231,235,0.62)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 19,
  },
  actionRow: {
    gap: 10,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
  },
  primaryActionText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  disabledAction: {
    opacity: 0.7,
  },
  secondaryAction: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryActionText: {
    color: "#E5E7EB",
    fontSize: 15,
    fontWeight: "700",
  },
  shortcutButton: {
    flexDirection: "row",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 14,
  },
  shortcutDanger: {
    borderColor: "rgba(248,113,113,0.18)",
    backgroundColor: "rgba(127,29,29,0.16)",
  },
  shortcutIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#4D2FB2",
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutDangerIcon: {
    backgroundColor: "rgba(127,29,29,0.5)",
  },
  shortcutTextWrap: {
    flex: 1,
    gap: 4,
  },
  shortcutTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  shortcutDangerTitle: {
    color: "#FECACA",
  },
  shortcutDescription: {
    color: "#A8B0C0",
    fontSize: 12,
    lineHeight: 18,
  },
});
