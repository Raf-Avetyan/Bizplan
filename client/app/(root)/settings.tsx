import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  CheckCircle2,
  Globe2,
  LayoutTemplate,
  MonitorCog,
  RotateCcw,
  Sparkles,
} from "lucide-react-native";
import {
  useSettings,
  type AppSettings,
  type DensityMode,
  type Language,
  type RoutePreference,
  type ThemeMode,
} from "@/lib/settings-context";
import { useToast } from "@/components/ui/Toast/Toast";

export default function SettingsScreen() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const toast = useToast();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const compact = settings.density === "compact";
  const palette = getSettingsPalette(isDark);
  const t = getSettingsCopy(settings.language);

  function updateAndConfirm<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    updateSetting(key, value);
    toast.showToast(t.savedTitle, t.savedBody, "success");
  }

  return (
    <LinearGradient
      colors={palette.gradient}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.content, compact && { padding: 14, paddingBottom: 96, gap: 10 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.eyebrow, { color: palette.eyebrow }]}>{t.workspace}</Text>
          <Text style={[styles.title, { color: palette.text }]}>{t.settings}</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            {t.subtitle}
          </Text>

          <View
            style={[
              styles.statusCard,
              { backgroundColor: palette.successSoft, borderColor: palette.successBorder },
            ]}
          >
            <CheckCircle2 size={18} color="#34D399" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: palette.text }]}>{t.statusTitle}</Text>
              <Text style={[styles.statusBody, { color: palette.muted }]}>
                {t.statusBody}
              </Text>
            </View>
          </View>

          <SettingsSelectCard
            icon={Globe2}
            title={t.language}
            body={t.languageBody}
            options={[
              { label: t.english, value: "en" },
              { label: t.russian, value: "ru" },
              { label: t.armenian, value: "hy" },
            ]}
            value={settings.language}
            palette={palette}
            onChange={(value) => updateAndConfirm("language", value as Language)}
          />

          <SettingsSelectCard
            icon={MonitorCog}
            title={t.defaultRoute}
            body={t.defaultRouteBody}
            options={[
              { label: t.dashboard, value: "/(root)/(tabs)/(dashboard)" },
              { label: t.companies, value: "/(root)/companies" },
              { label: t.plan, value: "/(root)/(tabs)/plan" },
            ]}
            value={settings.defaultRoute}
            palette={palette}
            onChange={(value) => updateAndConfirm("defaultRoute", value as RoutePreference)}
          />

          <SettingsSelectCard
            icon={LayoutTemplate}
            title={t.themePreference}
            body={t.themeBody}
            options={[
              { label: t.dark, value: "dark" },
              { label: t.light, value: "light" },
              { label: t.system, value: "system" },
            ]}
            value={settings.theme}
            palette={palette}
            onChange={(value) => updateAndConfirm("theme", value as ThemeMode)}
          />

          <SettingsSelectCard
            icon={Sparkles}
            title={t.density}
            body={t.densityBody}
            options={[
              { label: t.comfortable, value: "comfortable" },
              { label: t.compact, value: "compact" },
            ]}
            value={settings.density}
            palette={palette}
            onChange={(value) => updateAndConfirm("density", value as DensityMode)}
          />

          <ToggleCard
            title={t.showProfileEmail}
            body={t.showProfileEmailBody}
            value={settings.showProfileEmail}
            palette={palette}
            onChange={(value) => updateAndConfirm("showProfileEmail", value)}
          />

          <ToggleCard
            title={t.enableAiCompanySetup}
            body={t.enableAiCompanySetupBody}
            value={settings.enableAiCompanyDraft}
            palette={palette}
            onChange={(value) => updateAndConfirm("enableAiCompanyDraft", value)}
          />

          <ToggleCard
            title={t.showFinancialFields}
            body={t.showFinancialFieldsBody}
            value={settings.showFinancialFields}
            palette={palette}
            onChange={(value) => updateAndConfirm("showFinancialFields", value)}
          />

          <ToggleCard
            title={t.autoGeneratePlanOnCreate}
            body={t.autoGeneratePlanOnCreateBody}
            value={settings.autoGeneratePlanOnCreate}
            palette={palette}
            onChange={(value) => updateAndConfirm("autoGeneratePlanOnCreate", value)}
          />

          <ToggleCard
            title={t.openPlanAfterGeneration}
            body={t.openPlanAfterGenerationBody}
            value={settings.openPlanAfterGeneration}
            palette={palette}
            onChange={(value) => updateAndConfirm("openPlanAfterGeneration", value)}
          />

          <ToggleCard
            title={t.confirmCompanyDeletion}
            body={t.confirmCompanyDeletionBody}
            value={settings.confirmBeforeDeleteCompany}
            palette={palette}
            onChange={(value) => updateAndConfirm("confirmBeforeDeleteCompany", value)}
          />

          <ToggleCard
            title={t.reducedMotion}
            body={t.reducedMotionBody}
            value={settings.reducedMotion}
            palette={palette}
            onChange={(value) => updateAndConfirm("reducedMotion", value)}
          />

          <Pressable
            style={[
              styles.resetButton,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
            onPress={() =>
              toast.showConfirm(
                t.resetTitle,
                t.resetConfirmBody,
                () => {
                  resetSettings();
                  toast.showToast(t.resetDoneTitle, t.resetDoneBody, "success");
                },
                { confirmText: t.reset, cancelText: t.cancel, type: "warning" },
              )
            }
          >
            <RotateCcw size={16} color={palette.text} />
            <Text style={[styles.resetButtonText, { color: palette.text }]}>{t.resetAllSettings}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function SettingsSelectCard({
  icon: Icon,
  title,
  body,
  value,
  options,
  palette,
  onChange,
}: {
  icon: any;
  title: string;
  body: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  palette: ReturnType<typeof getSettingsPalette>;
  onChange: (value: string) => void;
}) {
  return (
    <LinearGradient
      colors={palette.cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor: palette.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: palette.primary }]}>
          <Icon size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.cardBody, { color: palette.muted }]}>{body}</Text>
        </View>
      </View>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.optionChip,
                { backgroundColor: palette.chip, borderColor: palette.border },
                selected && { backgroundColor: palette.primary, borderColor: palette.primary },
              ]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.optionChipText, { color: selected ? "#fff" : palette.mutedStrong }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </LinearGradient>
  );
}

function ToggleCard({
  title,
  body,
  value,
  palette,
  onChange,
}: {
  title: string;
  body: string;
  value: boolean;
  palette: ReturnType<typeof getSettingsPalette>;
  onChange: (next: boolean) => void;
}) {
  return (
    <LinearGradient
      colors={palette.cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor: palette.border }]}
    >
      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.cardBody, { color: palette.muted }]}>{body}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: palette.switchOff, true: palette.primary }}
          thumbColor="#FFFFFF"
        />
      </View>
    </LinearGradient>
  );
}

function getSettingsPalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#090B14", "#111827", "#183B35"] as const)
      : (["#F8FAFC", "#EDF7F3", "#E7EEF9"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "rgba(255,255,255,0.68)" : "#475569",
    mutedStrong: isDark ? "rgba(255,255,255,0.76)" : "#334155",
    eyebrow: isDark ? "rgba(255,255,255,0.60)" : "#64748B",
    card: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.82)",
    cardGradient: isDark
      ? (["rgba(255,255,255,0.09)", "rgba(24,59,53,0.16)"] as const)
      : (["rgba(255,255,255,0.98)", "rgba(240,253,250,0.94)", "rgba(239,246,255,0.94)"] as const),
    chip: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.04)",
    border: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.10)",
    primary: "#4D2FB2",
    switchOff: isDark ? "rgba(148,163,184,0.34)" : "rgba(100,116,139,0.28)",
    successSoft: isDark ? "rgba(6,78,59,0.22)" : "rgba(209,250,229,0.85)",
    successBorder: isDark ? "rgba(52,211,153,0.20)" : "rgba(16,185,129,0.28)",
  };
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 120,
    gap: 14,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    marginTop: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 4,
  },
  statusCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.20)",
    backgroundColor: "rgba(6,78,59,0.22)",
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  statusTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  statusBody: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(77,47,178,0.95)",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  cardBody: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  optionRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionChip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  optionChipSelected: {
    backgroundColor: "rgba(77,47,178,0.95)",
    borderColor: "rgba(77,47,178,0.95)",
  },
  optionChipText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "800",
  },
  optionChipTextSelected: {
    color: "#fff",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  resetButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  resetButtonText: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },
});

function getSettingsCopy(language: Language) {
  if (language === "ru") {
    return {
      workspace: "Настройки",
      settings: "Настройки",
      subtitle: "Настройте язык, тему, стартовый экран, подтверждения и параметры создания плана.",
      statusTitle: "Настройки активны",
      statusBody:
        "Настройки сохраняются локально и применяются в профиле, создании компании, маршрутах входа и генерации плана.",
      english: "Английский",
      russian: "Русский",
      armenian: "Армянский",
      dashboard: "Панель",
      companies: "Компании",
      plan: "План",
      dark: "Темная",
      light: "Светлая",
      system: "Системная",
      comfortable: "Удобная",
      compact: "Компактная",
      language: "Язык",
      languageBody: "Выберите язык интерфейса на этом устройстве.",
      defaultRoute: "Маршрут по умолчанию",
      defaultRouteBody: "Куда открывать приложение после входа.",
      themePreference: "Тема",
      themeBody: "Сохраните темную, светлую или системную тему для экранов приложения.",
      density: "Плотность",
      densityBody: "Комфортные или компактные интервалы между элементами.",
      showProfileEmail: "Показывать email в профиле",
      showProfileEmailBody: "Показывать или скрывать email в профиле.",
      enableAiCompanySetup: "Включить AI при создании компании",
      enableAiCompanySetupBody: "Показывать поле AI-подсказки в форме создания компании.",
      showFinancialFields: "Показывать финансовые поля",
      showFinancialFieldsBody: "Показывать стартовые расходы, доход, затраты и финансирование.",
      autoGeneratePlanOnCreate: "Автогенерация плана при создании",
      autoGeneratePlanOnCreateBody: "После создания компании сразу запускать генерацию плана.",
      openPlanAfterGeneration: "Открывать план после генерации",
      openPlanAfterGenerationBody: "После генерации переходить в раздел плана.",
      confirmCompanyDeletion: "Подтверждать удаление компании",
      confirmCompanyDeletionBody: "Спрашивать перед удалением компании из аккаунта.",
      reducedMotion: "Уменьшить анимации",
      reducedMotionBody: "Сохранить предпочтение уменьшенной анимации.",
      savedTitle: "Настройка сохранена",
      savedBody: "Предпочтение обновлено на этом устройстве.",
      resetTitle: "Сбросить настройки",
      resetConfirmBody: "Это вернет стандартные настройки языка, темы и планирования.",
      resetDoneTitle: "Настройки сброшены",
      resetDoneBody: "Восстановлены значения по умолчанию.",
      reset: "Сбросить",
      cancel: "Отмена",
      resetAllSettings: "Сбросить все настройки",
    };
  }

  if (language === "hy") {
    return {
      workspace: "Կարգավորումներ",
      settings: "Կարգավորումներ",
      subtitle: "Կարգավորեք լեզուն, թեման, մեկնարկային էջը, հաստատումները և պլանի ստեղծման ընտրանքները։",
      statusTitle: "Կարգավորումները ակտիվ են",
      statusBody:
        "Կարգավորումները պահվում են սարքում և կիրառվում են պրոֆիլում, ընկերության ստեղծման, մուտքի երթուղու և պլանի գեներացիայի մեջ։",
      english: "Անգլերեն",
      russian: "Ռուսերեն",
      armenian: "Հայերեն",
      dashboard: "Վահանակ",
      companies: "Ընկերություններ",
      plan: "Պլան",
      dark: "Մուգ",
      light: "Բաց",
      system: "Համակարգային",
      comfortable: "Հարմար",
      compact: "Կոմպակտ",
      language: "Լեզու",
      languageBody: "Ընտրեք սարքում պահվող ինտերֆեյսի լեզուն։",
      defaultRoute: "Լռելյայն բացվող էջ",
      defaultRouteBody: "Ընտրեք՝ մուտքից հետո որ էջը բացվի։",
      themePreference: "Թեմա",
      themeBody: "Сохраните темную, светлую или системную тему для экранов приложения.",
      density: "Խտություն",
      densityBody: "Հարմար կամ կոմպակտ բացատներ տարրերի միջև։",
      showProfileEmail: "Ցույց տալ email-ը պրոֆիլում",
      showProfileEmailBody: "Показывать или скрывать email в профиле.",
      enableAiCompanySetup: "Միացնել AI-ն ընկերության ստեղծման ժամանակ",
      enableAiCompanySetupBody: "Ցույց տալ AI հուշման դաշտը ստեղծման ձևում։",
      showFinancialFields: "Ցույց տալ ֆինանսական դաշտերը",
      showFinancialFieldsBody: "Ցույց տալ մեկնարկային ծախս, եկամուտ, ծախս և ֆինանսավորում։",
      autoGeneratePlanOnCreate: "Ավտոգեներացնել պլանը ստեղծման պահին",
      autoGeneratePlanOnCreateBody: "Ընկերություն ստեղծելուց հետո ավտոմատ սկսել պլանի գեներացիան։",
      openPlanAfterGeneration: "Բացել պլանը գեներացիայից հետո",
      openPlanAfterGenerationBody: "Գեներացիայից հետո բացել պլանի էջը։",
      confirmCompanyDeletion: "Հաստատել ընկերության ջնջումը",
      confirmCompanyDeletionBody: "Спрашивать перед удалением компании из аккаунта.",
      reducedMotion: "Նվազեցնել անիմացիաները",
      reducedMotionBody: "Сохранить предпочтение уменьшенной анимации.",
      savedTitle: "Կարգավորումը պահպանվեց",
      savedBody: "Նախընտրությունը թարմացվեց այս սարքում։",
      resetTitle: "Վերականգնել կարգավորումները",
      resetConfirmBody: "Это вернет стандартные настройки языка, темы и планирования.",
      resetDoneTitle: "Կարգավորումները վերականգնվեցին",
      resetDoneBody: "Լռելյայն արժեքները վերականգնվել են։",
      reset: "Վերականգնել",
      cancel: "Չեղարկել",
      resetAllSettings: "Վերականգնել բոլոր կարգավորումները",
    };
  }

  return {
    workspace: "Preferences",
    settings: "Settings",
    subtitle: "Control language, theme, start screen, confirmations, and plan-creation behavior.",
    statusTitle: "Settings are active",
    statusBody:
      "Preferences are saved locally and used across profile, company creation, login routing, and plan generation.",
    english: "English",
    russian: "Russian",
    armenian: "Armenian",
    dashboard: "Dashboard",
    companies: "Companies",
    plan: "Plan",
    dark: "Dark",
    light: "Light",
    system: "System",
    comfortable: "Comfortable",
    compact: "Compact",
    language: "Language",
    languageBody: "Choose the language preference stored on this device.",
    defaultRoute: "Default route",
    defaultRouteBody: "Choose where the app should open after login.",
    themePreference: "Theme preference",
    themeBody: "Сохраните темную, светлую или системную тему для экранов приложения.",
    density: "Density",
    densityBody: "Comfortable spacing or a tighter compact layout.",
    showProfileEmail: "Show profile email",
    showProfileEmailBody: "Показывать или скрывать email в профиле.",
    enableAiCompanySetup: "Enable AI company setup",
    enableAiCompanySetupBody: "Show the AI prompt box on company creation forms.",
    showFinancialFields: "Show financial fields",
    showFinancialFieldsBody:
      "Display startup cost, revenue, cost, and funding fields while creating a company.",
    autoGeneratePlanOnCreate: "Auto-generate plan on create",
    autoGeneratePlanOnCreateBody:
      "After creating a company, jump into the planning flow automatically.",
    openPlanAfterGeneration: "Open plan after generation",
    openPlanAfterGenerationBody:
      "Send create-and-generate actions into the plan page instead of the dashboard.",
    confirmCompanyDeletion: "Confirm company deletion",
    confirmCompanyDeletionBody: "Спрашивать перед удалением компании из аккаунта.",
    reducedMotion: "Reduced motion",
    reducedMotionBody: "Сохранить предпочтение уменьшенной анимации.",
    savedTitle: "Setting saved",
    savedBody: "Your preference was updated on this device.",
    resetTitle: "Reset settings",
    resetConfirmBody: "Это вернет стандартные настройки языка, темы и планирования.",
    resetDoneTitle: "Settings reset",
    resetDoneBody: "Default preferences were restored.",
    reset: "Reset",
    cancel: "Cancel",
    resetAllSettings: "Reset all settings",
  };
}
