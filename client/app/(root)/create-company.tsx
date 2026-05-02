import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import { useCreateCompany } from "@/hooks/useCompanyQueries";
import { useToast } from "@/components/ui/Toast/Toast";
import { useSettings } from "@/lib/settings-context";
import { generateCompanyDraft } from "@/lib/company-ai";

export default function CreateCompanyScreen() {
  const toast = useToast();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getCreateCompanyPalette(isDark);
  const t = getCreateCompanyCopy(settings.language);
  const createCompany = useCreateCompany();

  const [businessName, setBusinessName] = useState("");
  const [idea, setIdea] = useState("");
  const [place, setPlace] = useState("");
  const [tags, setTags] = useState("");
  const [startupCost, setStartupCost] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [fundingNeeded, setFundingNeeded] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [createMode, setCreateMode] = useState<"create" | "generate" | null>(null);

  function buildPayload() {
    return {
      businessName: businessName.trim(),
      idea: idea.trim(),
      place: place.trim() || "Remote",
      uniqueTags: tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      financialData: settings.showFinancialFields
        ? {
            startupCost: startupCost === "" ? undefined : Number(startupCost),
            monthlyRevenue: monthlyRevenue === "" ? undefined : Number(monthlyRevenue),
            monthlyCost: monthlyCost === "" ? undefined : Number(monthlyCost),
            fundingNeeded: fundingNeeded === "" ? undefined : Number(fundingNeeded),
          }
        : undefined,
    };
  }

  async function handleGenerateDraft() {
    if (!settings.enableAiCompanyDraft) {
      toast.showToast(t.aiSetupDisabled, t.enableAiSetup, "warning");
      return;
    }
    if (!aiPrompt.trim()) {
      toast.showToast(t.describeBusiness, t.writePromptFirst, "warning");
      return;
    }

    try {
      setIsGeneratingDraft(true);
      const draft = await generateCompanyDraft(aiPrompt, buildPayload());
      setBusinessName(draft.businessName);
      setIdea(draft.idea);
      setPlace(draft.place);
      setTags(draft.uniqueTags.join(", "));
      setStartupCost(draft.financialData?.startupCost !== undefined ? String(draft.financialData.startupCost) : "");
      setMonthlyRevenue(draft.financialData?.monthlyRevenue !== undefined ? String(draft.financialData.monthlyRevenue) : "");
      setMonthlyCost(draft.financialData?.monthlyCost !== undefined ? String(draft.financialData.monthlyCost) : "");
      setFundingNeeded(draft.financialData?.fundingNeeded !== undefined ? String(draft.financialData.fundingNeeded) : "");
      toast.showToast(t.draftReady, t.draftReadyBody, "success");
    } catch (error: any) {
      toast.showToast(t.error, error?.message || t.failedGenerateDraft, "error");
    } finally {
      setIsGeneratingDraft(false);
    }
  }

  async function handleSubmit(mode: "create" | "generate") {
    const payload = buildPayload();
    if (!payload.businessName || !payload.idea) {
      toast.showToast(t.missingFields, t.nameIdeaRequired, "warning");
      return;
    }

    try {
      setCreateMode(mode);
      await createCompany.mutateAsync(payload);

      if (mode === "generate" || settings.autoGeneratePlanOnCreate) {
        const targetRoute = settings.openPlanAfterGeneration
          ? "/(root)/(tabs)/plan"
          : "/(root)/(tabs)/(dashboard)";
        toast.showToast(
          t.companyCreated,
          settings.openPlanAfterGeneration
            ? t.openingPlanFlow
            : t.openingDashboard,
          "success",
        );
        router.replace(targetRoute as any);
        return;
      }

      toast.showToast(t.companyCreated, t.companyReady, "success");
      router.replace("/companies" as any);
    } catch (error: any) {
      toast.showToast(t.error, error?.message || t.failedCreateCompany, "error");
    } finally {
      setCreateMode(null);
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
          keyboardVerticalOffset={0}
          style={{ flex: 1 }}
        >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            settings.density === "compact" && styles.contentCompact,
            { paddingBottom: 180 + insets.bottom },
          ]}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={18} color={palette.text} />
            <Text style={[styles.backText, { color: palette.text }]}>{t.back}</Text>
          </TouchableOpacity>

          <Text style={[styles.eyebrow, { color: palette.eyebrow }]}>{t.workspace}</Text>
          <Text style={[styles.title, { color: palette.text }]}>{t.createCompany}</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            {t.subtitle}
          </Text>

          {settings.enableAiCompanyDraft ? (
            <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <View style={styles.panelHeader}>
                <View style={styles.panelIcon}>
                  <Sparkles size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.panelTitle, { color: palette.text }]}>{t.aiCompanySetup}</Text>
                  <Text style={[styles.panelBody, { color: palette.muted }]}>{t.aiCompanySetupBody}</Text>
                </View>
              </View>
              <TextInput
                value={aiPrompt}
                onChangeText={setAiPrompt}
                multiline
                placeholder={t.aiPromptPlaceholder}
                placeholderTextColor={palette.placeholder}
                style={[styles.input, styles.textarea, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
              />
              <TouchableOpacity style={styles.aiButton} onPress={() => void handleGenerateDraft()} disabled={isGeneratingDraft}>
                {isGeneratingDraft ? <ActivityIndicator color="#fff" /> : <Sparkles size={16} color="#fff" />}
                <Text style={styles.aiButtonText}>{isGeneratingDraft ? t.generating : t.generateFields}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.fieldLabel, { color: palette.label }]}>{t.businessName}</Text>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder={t.companyNamePlaceholder}
              placeholderTextColor={palette.placeholder}
              style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
            />

            <Text style={[styles.fieldLabel, { color: palette.label }]}>{t.idea}</Text>
            <TextInput
              value={idea}
              onChangeText={setIdea}
              multiline
              placeholder={t.ideaPlaceholder}
              placeholderTextColor={palette.placeholder}
              style={[styles.input, styles.textarea, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: palette.label }]}>{t.location}</Text>
                <TextInput
                  value={place}
                  onChangeText={setPlace}
                  placeholder="Yerevan, Armenia"
                  placeholderTextColor={palette.placeholder}
                  style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: palette.label }]}>{t.tags}</Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="AI, SaaS, Research"
              placeholderTextColor={palette.placeholder}
              style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
            />

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: palette.label }]}>{t.financialFields}</Text>
                <Text style={[styles.switchHint, { color: palette.muted }]}>{t.controlledFromSettings}</Text>
              </View>
              <Switch value={settings.showFinancialFields} disabled />
            </View>

            {settings.showFinancialFields ? (
              <>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: palette.label }]}>{t.startupCost}</Text>
                    <TextInput value={startupCost} onChangeText={setStartupCost} keyboardType="numeric" style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: palette.label }]}>{t.monthlyRevenue}</Text>
                    <TextInput value={monthlyRevenue} onChangeText={setMonthlyRevenue} keyboardType="numeric" style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]} />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: palette.label }]}>{t.monthlyCost}</Text>
                    <TextInput value={monthlyCost} onChangeText={setMonthlyCost} keyboardType="numeric" style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: palette.label }]}>{t.fundingNeeded}</Text>
                    <TextInput value={fundingNeeded} onChangeText={setFundingNeeded} keyboardType="numeric" style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]} />
                  </View>
                </View>
              </>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            disabled={createMode !== null}
            onPress={() => void handleSubmit("create")}
          >
            <Text style={styles.primaryButtonText}>
              {createMode === "create" ? t.creating : t.createCompany}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            disabled={createMode !== null}
            onPress={() => void handleSubmit("generate")}
          >
            <Text style={styles.secondaryButtonText}>
              {createMode === "generate" ? t.creating : t.createGeneratePlan}
            </Text>
          </TouchableOpacity>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 160,
  },
  contentCompact: {
    padding: 14,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  backText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "REM-Medium",
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
    fontSize: 34,
    lineHeight: 38,
    fontFamily: "Gabarito",
    marginTop: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "REM-Regular",
    marginTop: 10,
  },
  panel: {
    marginTop: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 18,
    gap: 10,
  },
  panelHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  panelIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(122,95,255,0.95)",
  },
  panelTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Gabarito",
  },
  panelBody: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "REM-Regular",
    marginTop: 3,
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontFamily: "REM-Bold",
    marginTop: 8,
    marginBottom: 3,
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,10,16,0.42)",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: "REM-Regular",
  },
  textarea: {
    minHeight: 108,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  switchRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  switchHint: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 12,
    fontFamily: "REM-Regular",
    marginTop: 4,
  },
  aiButton: {
    marginTop: 2,
    borderRadius: 18,
    backgroundColor: "rgba(122,95,255,0.95)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  aiButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "REM-Bold",
  },
  primaryButton: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: "rgba(122,95,255,0.95)",
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "REM-Bold",
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "REM-Bold",
  },
});

function getCreateCompanyPalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#4D2FB2", "#2B1A66", "#050510"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    label: isDark ? "rgba(255,255,255,0.88)" : "#172033",
    muted: isDark ? "rgba(255,255,255,0.70)" : "#475569",
    eyebrow: isDark ? "rgba(255,255,255,0.60)" : "#64748B",
    placeholder: isDark ? "rgba(255,255,255,0.45)" : "#718096",
    card: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.86)",
    input: isDark ? "rgba(8,10,16,0.42)" : "rgba(255,255,255,0.92)",
    border: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)",
  };
}

function getCreateCompanyCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      aiSetupDisabled: "AI-настройка отключена",
      enableAiSetup: "Сначала включите AI-настройку компании в Settings.",
      describeBusiness: "Опишите бизнес",
      writePromptFirst: "Сначала напишите короткое описание идеи.",
      draftReady: "Черновик готов",
      draftReadyBody: "AI заполнил поля компании.",
      error: "Ошибка",
      failedGenerateDraft: "Не удалось создать AI-черновик компании.",
      missingFields: "Не хватает полей",
      nameIdeaRequired: "Название бизнеса и идея обязательны.",
      companyCreated: "Компания создана",
      openingPlanFlow: "Открываем поток генерации плана.",
      openingDashboard: "Открываем панель для генерации плана.",
      companyReady: "Новая компания готова.",
      failedCreateCompany: "Не удалось создать компанию.",
      back: "Назад",
      workspace: "Новая компания",
      createCompany: "Создать компанию",
      subtitle: "Сначала создайте запись компании, затем сохраните ее или запустите генерацию плана.",
      aiCompanySetup: "AI-настройка компании",
      aiCompanySetupBody: "Опишите идею, и AI подготовит поля.",
      aiPromptPlaceholder: "Опишите бизнес, который хотите построить...",
      generating: "Генерируем...",
      generateFields: "Сгенерировать поля",
      businessName: "Название бизнеса",
      companyNamePlaceholder: "Название компании",
      idea: "Идея",
      ideaPlaceholder: "Что вы создаете?",
      location: "Локация",
      tags: "Теги",
      financialFields: "Финансовые поля",
      controlledFromSettings: "Управляется из Settings.",
      startupCost: "Стартовые расходы",
      monthlyRevenue: "Месячная выручка",
      monthlyCost: "Месячные расходы",
      fundingNeeded: "Нужное финансирование",
      creating: "Создаем...",
      createGeneratePlan: "Создать + сгенерировать план",
    };
  }

  if (language === "hy") {
    return {
      aiSetupDisabled: "AI setup-ը անջատված է",
      enableAiSetup: "Նախ միացրեք AI company setup-ը Settings-ում։",
      describeBusiness: "Նկարագրեք բիզնեսը",
      writePromptFirst: "Նախ գրեք կարճ բիզնես prompt։",
      draftReady: "Draft-ը պատրաստ է",
      draftReadyBody: "AI-ը լրացրեց ընկերության դաշտերը։",
      error: "Սխալ",
      failedGenerateDraft: "Չհաջողվեց գեներացնել ընկերության draft-ը։",
      missingFields: "Դաշտեր են պակասում",
      nameIdeaRequired: "Բիզնեսի անունը և գաղափարը պարտադիր են։",
      companyCreated: "Ընկերությունը ստեղծվեց",
      openingPlanFlow: "Բացվում է պլանի գեներացիայի հոսքը։",
      openingDashboard: "Բացվում է dashboard-ը՝ պլանի գեներացիան սկսելու համար։",
      companyReady: "Ձեր նոր ընկերությունը պատրաստ է։",
      failedCreateCompany: "Չհաջողվեց ստեղծել ընկերությունը։",
      back: "Հետ",
      workspace: "Նոր ընկերություն",
      createCompany: "Ստեղծել ընկերություն",
      subtitle: "Նախ ստեղծեք ընկերության գրառումը, հետո պահեք այն կամ միացրեք պլանի գեներացիան։",
      aiCompanySetup: "AI company setup",
      aiCompanySetupBody: "Նկարագրեք գաղափարը, և AI-ը կլրացնի դաշտերը։",
      aiPromptPlaceholder: "Նկարագրեք բիզնեսը, որը ուզում եք կառուցել...",
      generating: "Գեներացվում է...",
      generateFields: "Գեներացնել դաշտերը",
      businessName: "Բիզնեսի անուն",
      companyNamePlaceholder: "Ընկերության անունը",
      idea: "Գաղափար",
      ideaPlaceholder: "Ի՞նչ եք կառուցում",
      location: "Տեղադրություն",
      tags: "Թեգեր",
      financialFields: "Ֆինանսական դաշտեր",
      controlledFromSettings: "Կառավարվում է Settings-ից։",
      startupCost: "Սկզբնական ծախս",
      monthlyRevenue: "Ամսական եկամուտ",
      monthlyCost: "Ամսական ծախս",
      fundingNeeded: "Պահանջվող ֆինանսավորում",
      creating: "Ստեղծվում է...",
      createGeneratePlan: "Ստեղծել + գեներացնել պլան",
    };
  }

  return {
    aiSetupDisabled: "AI setup disabled",
    enableAiSetup: "Enable AI company setup in Settings first.",
    describeBusiness: "Describe the business",
    writePromptFirst: "Write a short business prompt first.",
    draftReady: "Draft ready",
    draftReadyBody: "AI filled the company fields for you.",
    error: "Error",
    failedGenerateDraft: "Failed to generate company draft.",
    missingFields: "Missing fields",
    nameIdeaRequired: "Business name and idea are required.",
    companyCreated: "Company created",
    openingPlanFlow: "Opening the plan flow for generation.",
    openingDashboard: "Opening dashboard to start plan generation.",
    companyReady: "Your new company is ready.",
    failedCreateCompany: "Failed to create company.",
    back: "Back",
    workspace: "New company",
    createCompany: "Create company",
    subtitle: "Build the company record first, then create it alone or create it and trigger the planning flow.",
    aiCompanySetup: "AI company setup",
    aiCompanySetupBody: "Describe the idea and let AI draft the fields.",
    aiPromptPlaceholder: "Describe the business you want to build...",
    generating: "Generating...",
    generateFields: "Generate fields",
    businessName: "Business name",
    companyNamePlaceholder: "Your company name",
    idea: "Idea",
    ideaPlaceholder: "What are you building?",
    location: "Location",
    tags: "Tags",
    financialFields: "Financial fields",
    controlledFromSettings: "Controlled from Settings.",
    startupCost: "Startup cost",
    monthlyRevenue: "Monthly revenue",
    monthlyCost: "Monthly cost",
    fundingNeeded: "Funding needed",
    creating: "Creating...",
    createGeneratePlan: "Create + generate plan",
  };
}
