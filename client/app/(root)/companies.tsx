import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Building2, MapPin, Plus, Star, Trash2 } from "lucide-react-native";
import { router } from "expo-router";
import { useActiveCompany, useCompanies, useDeleteCompany, useSetActiveCompany } from "@/hooks/useCompanyQueries";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/components/ui/Toast/Toast";
import { Company } from "@/types/company.types";

export default function CompaniesScreen() {
  const [query, setQuery] = useState("");
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getCompaniesPalette(isDark);
  const t = getCompaniesCopy(settings.language);
  const toast = useToast();
  const { data: companies = [], isLoading } = useCompanies();
  const { data: activeCompany } = useActiveCompany();
  const setActiveCompany = useSetActiveCompany();
  const deleteCompany = useDeleteCompany();

  const filteredCompanies = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return companies;

    return companies.filter((company) =>
      [company.businessName, company.place, company.idea, ...company.uniqueTags]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [companies, query]);

  async function handleSetActive(companyId: string, businessName: string) {
    try {
      await setActiveCompany.mutateAsync(companyId);
      toast.showToast(t.activeCompany, t.companyNowActive(businessName), "success");
    } catch (error: any) {
      toast.showToast(t.error, error?.message || t.failedSetActive, "error");
    }
  }

  async function handleDelete(company: Company) {
    const runDelete = async () => {
      try {
        await deleteCompany.mutateAsync(company.id);
        toast.showToast(t.deleted, t.companyRemoved(company.businessName), "success");
      } catch (error: any) {
        toast.showToast(t.error, error?.message || t.failedDelete, "error");
      }
    };

    if (!settings.confirmBeforeDeleteCompany) {
      await runDelete();
      return;
    }

    toast.showConfirm(
      t.deleteCompanyQuestion,
      t.deleteCompanyBody(company.businessName),
      () => {
        void runDelete();
      },
      {
        type: "warning",
        confirmText: t.delete,
        cancelText: t.cancel,
      },
    );
  }

  async function handleOpenPlan(company: Company) {
    try {
      if (company.id !== activeCompany?.id) {
        await setActiveCompany.mutateAsync(company.id);
      }
      router.push("/(root)/(tabs)/plan" as any);
    } catch (error: any) {
      toast.showToast(t.error, error?.message || t.failedOpenPlan, "error");
    }
  }

  return (
    <LinearGradient
      colors={palette.gradient}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      locations={[0, 0.6, 1]}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          style={{ flex: 1 }}
        >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: palette.eyebrow }]}>{t.workspace}</Text>
              <Text style={[styles.title, { color: palette.text }]}>{t.companies}</Text>
              <Text style={[styles.subtitle, { color: palette.muted }]}>
                {t.subtitle}
              </Text>
            </View>
            <TouchableOpacity style={styles.createButton} onPress={() => router.push("/create-company")}>
              <Plus size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.toolbar}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t.searchCompanies}
              placeholderTextColor={palette.placeholder}
              style={[styles.searchInput, { color: palette.text, backgroundColor: palette.card, borderColor: palette.border }]}
            />
            <View style={[styles.counterPill, { backgroundColor: palette.chip, borderColor: palette.border }]}>
              <Text style={[styles.counterText, { color: palette.mutedStrong }]}>{t.savedCount(companies.length)}</Text>
            </View>
          </View>

          {isLoading ? (
            <View style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>{t.loadingCompanies}</Text>
            </View>
          ) : filteredCompanies.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <View style={styles.emptyIcon}>
                <Building2 size={24} color="#fff" />
              </View>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>{t.noCompanies}</Text>
              <Text style={[styles.emptyBody, { color: palette.muted }]}>
                {t.noCompaniesBody}
              </Text>
              <TouchableOpacity style={styles.primaryAction} onPress={() => router.push("/create-company")}>
                <Text style={styles.primaryActionText}>{t.createCompany}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredCompanies.map((company) => {
                const isActive = company.id === activeCompany?.id;
                return (
                  <LinearGradient
                    key={company.id}
                    colors={isActive ? palette.activeCardGradient : palette.cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.companyCard,
                      { borderColor: palette.border },
                      isActive && { borderColor: "rgba(122,95,255,0.65)" },
                    ]}
                  >
                    <View style={styles.companyTop}>
                      <View style={styles.companyIcon}>
                        <Building2 size={18} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.companyName, { color: palette.text }]}>{company.businessName}</Text>
                        <View style={styles.locationRow}>
                          <MapPin size={12} color={palette.muted} />
                          <Text style={[styles.locationText, { color: palette.muted }]}>{company.place}</Text>
                        </View>
                      </View>
                      {isActive ? (
                        <View style={styles.activeBadge}>
                          <Star size={12} color="#fff" fill="#fff" />
                          <Text style={styles.activeBadgeText}>{t.active}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={[styles.ideaText, { color: palette.mutedStrong }]}>{company.idea}</Text>

                    <View style={styles.tagsRow}>
                      {company.uniqueTags.slice(0, 4).map((tag) => (
                        <View key={tag} style={[styles.tag, { backgroundColor: palette.chip }]}>
                          <Text style={[styles.tagText, { color: palette.mutedStrong }]}>{tag.trim()}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[
                          styles.secondaryAction,
                          { backgroundColor: palette.chip, borderColor: palette.border },
                          isActive && styles.secondaryActionActive,
                        ]}
                        disabled={setActiveCompany.isPending}
                        onPress={() => void handleSetActive(company.id, company.businessName)}
                      >
                        <Text style={[styles.secondaryActionText, { color: isActive ? "#FFFFFF" : palette.text }]}>{isActive ? t.active : t.setActive}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.secondaryAction, { backgroundColor: palette.chip, borderColor: palette.border }]}
                        onPress={() => void handleOpenPlan(company)}
                      >
                        <Text style={[styles.secondaryActionText, { color: palette.text }]}>
                          {company.additionalData?.business_plan ? t.openPlan : t.openPlanner}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.iconAction, { backgroundColor: palette.chip, borderColor: palette.border }]}
                        disabled={deleteCompany.isPending}
                        onPress={() => void handleDelete(company)}
                      >
                        <Trash2 size={16} color="#ff9090" />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                );
              })}
            </View>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getCompaniesPalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#4D2FB2", "#2B1A66", "#050510"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "rgba(255,255,255,0.68)" : "#475569",
    mutedStrong: isDark ? "rgba(255,255,255,0.76)" : "#334155",
    eyebrow: isDark ? "rgba(255,255,255,0.6)" : "#64748B",
    placeholder: isDark ? "rgba(255,255,255,0.45)" : "#718096",
    card: isDark ? "rgba(12,16,26,0.72)" : "rgba(255,255,255,0.88)",
    cardGradient: isDark
      ? (["rgba(12,16,26,0.78)", "rgba(24,59,53,0.42)"] as const)
      : (["rgba(255,255,255,0.98)", "rgba(239,253,246,0.92)", "rgba(238,247,255,0.94)"] as const),
    activeCard: isDark ? "rgba(32,22,56,0.82)" : "rgba(238,232,255,0.92)",
    activeCardGradient: isDark
      ? (["rgba(32,22,56,0.88)", "rgba(24,59,53,0.48)"] as const)
      : (["rgba(248,245,255,0.98)", "rgba(238,232,255,0.95)", "rgba(236,253,245,0.92)"] as const),
    chip: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.04)",
    border: isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)",
  };
}

function getCompaniesCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      workspace: "Компании",
      companies: "Компании",
      subtitle: "Управляйте компаниями, меняйте активную и быстрее переходите к планированию.",
      searchCompanies: "Поиск компаний",
      savedCount: (count: number) => `${count} сохранено`,
      loadingCompanies: "Загружаем компании...",
      noCompanies: "Пока нет компаний",
      noCompaniesBody: "Создайте первую компанию, чтобы открыть планы, поиск и инструменты панели.",
      createCompany: "Создать компанию",
      activeCompany: "Активная компания",
      companyNowActive: (name: string) => `${name} теперь активна.`,
      error: "Ошибка",
      failedSetActive: "Не удалось сделать компанию активной.",
      deleted: "Удалено",
      companyRemoved: (name: string) => `${name} удалена.`,
      failedDelete: "Не удалось удалить компанию.",
      deleteCompanyQuestion: "Удалить компанию?",
      deleteCompanyBody: (name: string) => `Это навсегда удалит ${name} из вашего аккаунта.`,
      delete: "Удалить",
      cancel: "Отмена",
      failedOpenPlan: "Не удалось открыть план этой компании.",
      active: "Активна",
      setActive: "Сделать активной",
      openPlan: "Открыть план",
      openPlanner: "Открыть планирование",
    };
  }

  if (language === "hy") {
    return {
      workspace: "Ընկերություններ",
      companies: "Ընկերություններ",
      subtitle: "Կառավարեք ընկերությունները, փոխեք ակտիվը և արագ անցեք պլանավորմանը։",
      searchCompanies: "Որոնել ընկերություններ",
      savedCount: (count: number) => `${count} պահված`,
      loadingCompanies: "Բեռնվում են ընկերությունները...",
      noCompanies: "Ընկերություններ դեռ չկան",
      noCompaniesBody: "Ստեղծեք առաջին ընկերությունը՝ պլանները, որոնումը և dashboard գործիքները բացելու համար։",
      createCompany: "Ստեղծել ընկերություն",
      activeCompany: "Ակտիվ ընկերություն",
      companyNowActive: (name: string) => `${name}-ը հիմա ակտիվ է։`,
      error: "Սխալ",
      failedSetActive: "Չհաջողվեց դարձնել ակտիվ ընկերություն։",
      deleted: "Ջնջված է",
      companyRemoved: (name: string) => `${name}-ը հեռացվեց։`,
      failedDelete: "Չհաջողվեց ջնջել ընկերությունը։",
      deleteCompanyQuestion: "Ջնջե՞լ ընկերությունը",
      deleteCompanyBody: (name: string) => `Սա ընդմիշտ կհեռացնի ${name}-ը ձեր հաշվից։`,
      delete: "Ջնջել",
      cancel: "Չեղարկել",
      failedOpenPlan: "Չհաջողվեց բացել այս ընկերության պլանը։",
      active: "Ակտիվ",
      setActive: "Դարձնել ակտիվ",
      openPlan: "Բացել պլանը",
      openPlanner: "Բացել պլանավորումը",
    };
  }

  return {
    workspace: "Companies",
    companies: "Companies",
    subtitle: "Manage companies, switch the active one, and jump into planning faster.",
    searchCompanies: "Search companies",
    savedCount: (count: number) => `${count} saved`,
    loadingCompanies: "Loading companies...",
    noCompanies: "No companies yet",
    noCompaniesBody: "Create your first company to unlock plans, search, and dashboard tools.",
    createCompany: "Create company",
    activeCompany: "Active company",
    companyNowActive: (name: string) => `${name} is now active.`,
    error: "Error",
    failedSetActive: "Failed to set active company.",
    deleted: "Deleted",
    companyRemoved: (name: string) => `${name} was removed.`,
    failedDelete: "Failed to delete company.",
    deleteCompanyQuestion: "Delete company?",
    deleteCompanyBody: (name: string) => `This will permanently remove ${name} from your account.`,
    delete: "Delete",
    cancel: "Cancel",
    failedOpenPlan: "Failed to open this company plan.",
    active: "Active",
    setActive: "Set active",
    openPlan: "Open plan",
    openPlanner: "Open planner",
  };
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontFamily: "REM-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 36,
    fontFamily: "Gabarito",
    marginTop: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "REM-Regular",
    marginTop: 8,
  },
  createButton: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "rgba(122,95,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  toolbar: {
    marginTop: 18,
    gap: 12,
  },
  searchInput: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: "#fff",
    fontFamily: "REM-Regular",
    fontSize: 15,
  },
  counterPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  counterText: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 13,
    fontFamily: "REM-Medium",
  },
  emptyCard: {
    marginTop: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 22,
    alignItems: "center",
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(122,95,255,0.82)",
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Gabarito",
    marginTop: 14,
  },
  emptyBody: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "REM-Regular",
    textAlign: "center",
    marginTop: 8,
  },
  primaryAction: {
    marginTop: 18,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "rgba(122,95,255,0.95)",
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "REM-Bold",
  },
  list: {
    marginTop: 18,
    gap: 14,
  },
  companyCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(12,16,26,0.72)",
    padding: 18,
  },
  companyCardActive: {
    borderColor: "rgba(122,95,255,0.65)",
    backgroundColor: "rgba(32,22,56,0.82)",
  },
  companyTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  companyIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(122,95,255,0.92)",
  },
  companyName: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Gabarito",
  },
  locationRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontFamily: "REM-Regular",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "rgba(122,95,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "REM-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  ideaText: {
    marginTop: 14,
    color: "rgba(255,255,255,0.76)",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "REM-Regular",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  tagText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "REM-Medium",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 10,
  },
  secondaryActionActive: {
    backgroundColor: "rgba(122,95,255,0.94)",
  },
  secondaryActionText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "REM-Bold",
    textAlign: "center",
  },
  iconAction: {
    width: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
});
