
import { useEffect, useRef, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { MotiView } from "moti";
import { ViewStyle, TextStyle } from "react-native";
import { useActiveCompany, useAddBusinessPlan, useCompanyAdditionalData } from "@/hooks/useCompanyQueries";
import { Company, CompanyAdditionalDataDto } from "@/types/company.types";
import { BusinessPlanTemplate } from "@/types/business-plan.types";
import Card from "./Card/Card";
import { cardData, CardDataItem } from "@/constants/DashboardCardData";
import { useToast } from "@/components/ui/Toast/Toast";
import { companyService } from "@/services/company.service";
import { useSettings } from "@/lib/settings-context";

type ContentProps = {
  companyData: Company;
};

export interface PageBlock {
  id: string;
  type: "heading" | "paragraph" | "list" | "table" | "image" | "chart" | "divider" | "quote";
  content: string | Array<any> | PageBlock[];
  styles: TextStyle &
  ViewStyle & {
    width?: number | string;
    height?: number | string;
  };
  metadata?: {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    listType?: "bullet" | "number" | "check";
    imageSrc?: string;
    chartType?: string;
    author?: string;
    caption?: string;
    resizeMode?: string;
    borderStyle?: string;
  };
}

export interface Page {
  id: string;
  pageNumber: number;
  type: "cover" | "toc" | "content" | "financial" | "custom";
  title: string;
  section?: string;
  blocks: PageBlock[];
  styles: TextStyle &
  ViewStyle & {
    width?: number | string;
    height?: number | string;
  };
  formatting: {
    backgroundColor: string;
    backgroundImage?: string;
    border?: string;
    shadow?: string;
  };
}

type CompanyAdditionalDataWithPlan = CompanyAdditionalDataDto & {
  business_plan?: BusinessPlanTemplate;
  business_plan_translations?: Partial<Record<"en" | "ru" | "hy", BusinessPlanTemplate>>;
  business_plan_generation?: {
    status?: "idle" | "generating" | "ready" | "failed";
    language?: "en" | "ru" | "hy";
    error?: string | null;
  };
};

const Content = ({ companyData }: ContentProps) => {
  const toast = useToast();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();

  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;

  const isDark = resolvedTheme === "dark";
  const skeletonPalette = getContentSkeletonPalette(isDark);
  const t = getContentCopy(settings.language);

  const [isCreatingBizPlan, setIsCreatingBizPlan] = useState(false);
  const pendingPlanSuccessToastRef = useRef(false);
  const generationStartedRef = useRef(false);
  const quotaToastShownRef = useRef(false);

  const {
    data: activeCompany,
    isLoading: isActiveCompanyDataLoading,
    error: activePlanError,
    refetch: refreshActivePlanData,
  } = useActiveCompany();

  const {
    data: companyAdditionalData,
    isLoading: isAdditionalDataLoading,
    refetch: refetchAdditionalData,
  } = useCompanyAdditionalData(activeCompany?.id);

  const addBusinessPlan = useAddBusinessPlan();

  const additionalData = companyAdditionalData as CompanyAdditionalDataWithPlan | undefined;

  const selectedLanguage = settings.language as "en" | "ru" | "hy";
  const basePlan = additionalData?.business_plan;
  const translatedPlan =
    selectedLanguage !== "en"
      ? additionalData?.business_plan_translations?.[selectedLanguage]
      : undefined;

  const planToUse = translatedPlan ?? basePlan;
  const planHasPages =
    Boolean(planToUse?.presentation?.pages?.length) &&
    Boolean(planToUse?.presentation?.sections?.length);

  const generateBusinessPlan = async (): Promise<void> => {
    if (!activeCompany?.id || isCreatingBizPlan) {
      return;
    }

    try {
      pendingPlanSuccessToastRef.current = true;
      setIsCreatingBizPlan(true);

      await companyService.generateBusinessPlan(activeCompany.id, {
        overwrite: !basePlan,
        language: selectedLanguage,
      });

      await refetchAdditionalData?.();
    } catch (error) {
      console.error("Error generating business plan:", error);

      const errorMessage =
        error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);

      const isQuotaError =
        errorMessage.includes("429") ||
        errorMessage.toLowerCase().includes("quota") ||
        errorMessage.toLowerCase().includes("rate limit");

      pendingPlanSuccessToastRef.current = false;

      if (isQuotaError && !quotaToastShownRef.current) {
        quotaToastShownRef.current = true;
        toast.showToast(t.aiLimitReached, t.aiLimitBody, "warning", 5000);
        return;
      }

      toast.showToast(t.error, t.planGenerationFailed, "error");
    } finally {
      setIsCreatingBizPlan(false);
    }
  };

  useEffect(() => {
    if (!activeCompany?.id || isAdditionalDataLoading || generationStartedRef.current) {
      return;
    }

    if (!planHasPages) {
      generationStartedRef.current = true;
      generateBusinessPlan();
    }
  }, [activeCompany?.id, isAdditionalDataLoading, planHasPages]);

  useEffect(() => {
    if (pendingPlanSuccessToastRef.current && planHasPages && !isCreatingBizPlan) {
      pendingPlanSuccessToastRef.current = false;
      toast.showToast(t.success, t.planReady, "success");
    }
  }, [planHasPages, isCreatingBizPlan, toast, t.success, t.planReady]);

  const renderContent = () => {
    if (isActiveCompanyDataLoading || isAdditionalDataLoading || isCreatingBizPlan) {
      return (
        <View style={styles.container}>
          <View style={styles.cardsGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={[styles.cardSkeleton, { borderColor: skeletonPalette.border }]}>
                <MotiView
                  from={{ opacity: 0.3 }}
                  animate={{ opacity: 0.6 }}
                  transition={{
                    type: "timing",
                    duration: 1000,
                    loop: true,
                  }}
                  style={[
                    styles.cardTopSkeleton,
                    {
                      backgroundColor: skeletonPalette.surface,
                      borderColor: skeletonPalette.border,
                    },
                  ]}
                />
                <View style={styles.cardBottomSkeleton}>
                  <MotiView
                    from={{ opacity: 0.3 }}
                    animate={{ opacity: 0.6 }}
                    transition={{
                      type: "timing",
                      duration: 1000,
                      loop: true,
                    }}
                    style={[styles.titleSkeleton, { backgroundColor: skeletonPalette.line }]}
                  />
                  <MotiView
                    from={{ opacity: 0.2 }}
                    animate={{ opacity: 0.4 }}
                    transition={{
                      type: "timing",
                      duration: 1000,
                      loop: true,
                    }}
                    style={[styles.descSkeleton, { backgroundColor: skeletonPalette.lineSoft }]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (activePlanError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t.activePlanError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refreshActivePlanData()}>
            <Text style={styles.retryButtonText}>{t.tryAgain}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.cardsGrid}>
          {cardData.map((data) => (
            <Card
              key={data.id}
              addBusinessPlan={addBusinessPlan}
              data={data as CardDataItem}
              companyData={companyData}
              isCreatingBizPlan={isCreatingBizPlan}
            />
          ))}
        </View>
      </View>
    );
  };

  return renderContent();
};

function getContentSkeletonPalette(isDark: boolean) {
  return {
    surface: isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)",
    line: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.14)",
    lineSoft: isDark ? "rgba(255,255,255,0.065)" : "rgba(15,23,42,0.08)",
    border: isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)",
  };
}

function getContentCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      aiLimitReached: "Лимит AI исчерпан",
      aiLimitBody: "Квота AI-провайдера исчерпана. Попробуйте позже или используйте ключ с большей квотой.",
      error: "Ошибка",
      planGenerationFailed: "Генерация бизнес-плана не удалась. Проверьте NVIDIA NIM API key и попробуйте снова.",
      success: "Готово",
      planReady: "Ваш бизнес-план готов.",
      activePlanError: "Ошибка загрузки",
      tryAgain: "Попробовать снова",
    };
  }

  if (language === "hy") {
    return {
      aiLimitReached: "AI-ի լիմիտը ավարտվել է",
      aiLimitBody: "AI provider-ի քվոտան ավարտվել է։ Փորձեք ավելի ուշ կամ օգտագործեք ավելի մեծ քվոտայով key։",
      error: "Սխալ",
      planGenerationFailed: "Բիզնես պլանի գեներացիան ձախողվեց։ Ստուգեք NVIDIA NIM API key-ը և փորձեք նորից։",
      success: "Պատրաստ է",
      planReady: "Ձեր բիզնես պլանը պատրաստ է։",
      activePlanError: "Բեռնման սխալ",
      tryAgain: "Կրկին փորձել",
    };
  }

  return {
    aiLimitReached: "AI limit reached",
    aiLimitBody: "The AI provider quota is reached. Try later or use a key with more quota.",
    error: "Error",
    planGenerationFailed: "Business plan generation failed. Check NVIDIA NIM API key and try again.",
    success: "Done",
    planReady: "Your business plan is ready.",
    activePlanError: "Loading error",
    tryAgain: "Try again",
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 16,
  },
  cardSkeleton: {
    width: "48%",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardTopSkeleton: {
    height: 90,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cardBottomSkeleton: {
    padding: 14,
    gap: 8,
  },
  titleSkeleton: {
    height: 16,
    width: "70%",
    borderRadius: 8,
  },
  descSkeleton: {
    height: 12,
    width: "90%",
    borderRadius: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#c62828",
    marginBottom: 12,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#001941",
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});

export default Content;
