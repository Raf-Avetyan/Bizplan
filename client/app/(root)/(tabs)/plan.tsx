import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from 'moti';
import { ArrowRight, Sparkles, X } from 'lucide-react-native';
import BusinessPlanRenderer, { tableOfContents } from '../../../components/plan/BusinessPlanRenderer';
import { router, useFocusEffect } from 'expo-router';
import { BusinessPlanTemplate } from '@/types/business-plan.types';
import { useActiveCompany, useCompanyAdditionalData } from '@/hooks/useCompanyQueries';
import CreateCompanyScreen from "../create-company";
import { useSettings } from "@/lib/settings-context";
import { companyService } from "@/services/company.service";
import type { SupportedPlanLanguage } from "@/types/company.types";

export default function PlansScreen() {
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getPlanPalette(isDark);
  const t = getPlanCopy(settings.language);
  const [tocVisible, setTocVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [savedScrollPosition, setSavedScrollPosition] = useState(0);
  const [isReturningFromEdit, setIsReturningFromEdit] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResolvingVariant, setIsResolvingVariant] = useState(false);
  const [isSubmittingGeneration, setIsSubmittingGeneration] = useState(false);

  const {
    data: activeCompany,
    isLoading: isLoadingCompany,
    refetch: refetchActiveCompany,
  } = useActiveCompany();

  const {
    data: companyAdditionalData,
    isLoading: isLoadingCompanyAdditional,
    refetch: refetchCompanyAdditionalData,
  } = useCompanyAdditionalData(activeCompany?.id);

  const selectedLanguage = settings.language as SupportedPlanLanguage;
  const generationStatus = companyAdditionalData?.business_plan_generation;
  const sourceBusinessPlan = companyAdditionalData?.business_plan;
  const translatedBusinessPlan =
    selectedLanguage === "en"
      ? sourceBusinessPlan
      : companyAdditionalData?.business_plan_translations?.[selectedLanguage];
  const waitingForTranslation =
    selectedLanguage !== "en" && Boolean(sourceBusinessPlan) && !translatedBusinessPlan;
  const displayedBusinessPlan = translatedBusinessPlan;
  const isPlanGenerating = generationStatus?.status === "generating";
  const shouldRequestTranslation = Boolean(
    activeCompany?.id &&
    sourceBusinessPlan &&
    selectedLanguage !== "en" &&
    !companyAdditionalData?.business_plan_translations?.[selectedLanguage] &&
    generationStatus?.status !== "generating"
  );

  const handleScroll = (event: any) => {
    const position = event.nativeEvent.contentOffset.y;
    setSavedScrollPosition(position);
  };

  const handlePageClick = (pageIndex: number) => {
    if (!displayedBusinessPlan) return;

    const currentPage = displayedBusinessPlan.presentation?.pages?.[pageIndex];

    if (currentPage?.type === 'toc') {
      toggleTOC();
    } else {
      setIsReturningFromEdit(true);
      router.push({
        pathname: '/(root)/(modals)/business-plan-edit',
        params: {
          pageIndex: pageIndex.toString(),
        }
      });
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (isReturningFromEdit && scrollViewRef.current && savedScrollPosition > 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: savedScrollPosition,
            animated: false,
          });
        }, 100);
        setIsReturningFromEdit(false);
      }
    }, [savedScrollPosition, isReturningFromEdit])
  );

  useEffect(() => {
    if (!activeCompany?.id || !isPlanGenerating) return;

    const timer = setInterval(() => {
      void refetchCompanyAdditionalData();
    }, 2500);

    return () => clearInterval(timer);
  }, [activeCompany?.id, isPlanGenerating, refetchCompanyAdditionalData]);

  useEffect(() => {
    let cancelled = false;

    async function resolveTranslationVariant() {
      if (!activeCompany?.id || !shouldRequestTranslation || isResolvingVariant) return;

      try {
        setIsResolvingVariant(true);
        await companyService.generateBusinessPlan(activeCompany.id, {
          language: selectedLanguage,
          overwrite: false,
        });
        if (!cancelled) {
          await refetchCompanyAdditionalData();
        }
      } finally {
        if (!cancelled) {
          setIsResolvingVariant(false);
        }
      }
    }

    void resolveTranslationVariant();

    return () => {
      cancelled = true;
    };
  }, [
    activeCompany?.id,
    isResolvingVariant,
    refetchCompanyAdditionalData,
    selectedLanguage,
    shouldRequestTranslation,
  ]);
  const hasBusinessPlan = Boolean(displayedBusinessPlan);
  const isGenerationPending = isPlanGenerating || isResolvingVariant || isSubmittingGeneration;
  const showLoading =
    isLoadingCompany ||
    (activeCompany && isLoadingCompanyAdditional) ||
    waitingForTranslation ||
    (!hasBusinessPlan && isGenerationPending);
  const showCreateNewCompany = !activeCompany && !isLoadingCompany;
  const showPlanFailed = Boolean(
    activeCompany &&
    !hasBusinessPlan &&
    !showLoading &&
    generationStatus?.status === "failed"
  );
  const showPlanCreatedNoData = Boolean(
    activeCompany &&
    !hasBusinessPlan &&
    !showLoading &&
    !showPlanFailed
  );
  const showBusinessPlan = hasBusinessPlan && !showLoading;

  useEffect(() => {
    if (!isSubmittingGeneration) return;

    if (hasBusinessPlan || generationStatus?.status === "ready" || generationStatus?.status === "failed") {
      setIsSubmittingGeneration(false);
    }
  }, [generationStatus?.status, hasBusinessPlan, isSubmittingGeneration]);

  const startGeneration = useCallback(async () => {
    if (!activeCompany?.id) return;

    setIsSubmittingGeneration(true);
    void refetchCompanyAdditionalData();

    try {
      await companyService.generateBusinessPlan(activeCompany.id, {
        overwrite: true,
        language: selectedLanguage,
      });
    } catch (error) {
      setIsSubmittingGeneration(false);
      throw error;
    } finally {
      await refetchCompanyAdditionalData();
    }
  }, [activeCompany?.id, refetchCompanyAdditionalData, selectedLanguage]);

  const getPlanFailureMessage = () => {
    const raw = generationStatus?.error?.trim();

    if (!raw) {
      return t.planGenerationFailedBody;
    }

    const lowered = raw.toLowerCase();
    if (
      lowered.includes("property value in json") ||
      lowered.includes("unexpected token") ||
      lowered.includes("json at position") ||
      lowered.includes("invalid json")
    ) {
      return t.planGenerationJsonFailedBody;
    }

    return raw;
  };

  const toggleTOC = () => {
    setTocVisible(!tocVisible);
  };

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refetchActiveCompany();
      if (activeCompany?.id) {
        await refetchCompanyAdditionalData();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [activeCompany?.id, refetchActiveCompany, refetchCompanyAdditionalData]);

  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor={palette.text}
      colors={["#4D2FB2"]}
    />
  );

  const renderTOCMenu = () => (
    <View style={[styles.tocMenu, { backgroundColor: palette.card, borderLeftColor: palette.border }]}>
      <View style={[styles.tocHeader, { borderBottomColor: palette.border }]}>
        <Text style={[styles.tocTitle, { color: palette.text }]}>{t.tableOfContents}</Text>
        <TouchableOpacity onPress={toggleTOC} style={styles.closeButtonContainer}>
          <X size={24} color={palette.text} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.tocContent}>
        {tableOfContents.map((section, index) => (
          <View key={index} style={styles.tocSection}>
            <Text style={[styles.tocSectionTitle, { color: palette.text }]}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[styles.tocItem, { borderColor: palette.border, backgroundColor: palette.chip }]}
                onPress={() => {
                  toggleTOC();
                  if (scrollViewRef.current) {
                    const estimatedPosition = (item.page - 1) * 500;
                    scrollViewRef.current.scrollTo({
                      y: estimatedPosition,
                      animated: true,
                    });
                  }
                }}
              >
                <Text style={[styles.tocItemText, { color: palette.muted }]}>{item.name}</Text>
                <Text style={[styles.tocPageNumber, { color: palette.text }]}>{item.page}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderSkeletons = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.skeletonContainer}
      refreshControl={refreshControl}
    >
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonPageWrapper}>
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.6 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
              delay: i * 150,
            }}
            style={{ width: '100%' }}
          >
            <View style={[styles.skeletonTitle, { marginTop: 10, width: '40%', backgroundColor: palette.skeleton }]} />

            <View style={[styles.skeletonPage, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <View style={styles.skeletonContent}>
                <View style={[styles.skeletonTitle, { backgroundColor: palette.skeleton }]} />
                <View style={[styles.skeletonLine, { backgroundColor: palette.skeletonSoft }]} />
                <View style={[styles.skeletonLineShort, { backgroundColor: palette.skeletonSoft }]} />
                <View style={[styles.skeletonLine, { marginTop: 20, backgroundColor: palette.skeletonSoft }]} />
                <View style={[styles.skeletonLine, { backgroundColor: palette.skeletonSoft }]} />
                <View style={[styles.skeletonLineShort, { backgroundColor: palette.skeletonSoft }]} />
              </View>
              <View style={[styles.skeletonLine, { backgroundColor: palette.skeletonSoft }]} />
            </View>

            <View style={[styles.skeletonAddMorePages, { backgroundColor: palette.skeleton }]} />
          </MotiView>
        </View>
      ))}
    </ScrollView>
  );

  if (showCreateNewCompany) {
    return <CreateCompanyScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <LinearGradient
        colors={palette.gradient}
        style={{ flex: 1 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.6, 1]}
      >
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            {showLoading && renderSkeletons()}
            {showBusinessPlan && (
              <View style={styles.container}>
                <BusinessPlanRenderer
                  ref={scrollViewRef}
                  onScroll={handleScroll}
                  businessPlan={displayedBusinessPlan as BusinessPlanTemplate}
                  handlePageClick={handlePageClick}
                  refreshControl={refreshControl}
                />
                {tocVisible && renderTOCMenu()}
              </View>
            )}
            {showPlanFailed && (
              <ScrollView
                contentContainerStyle={styles.noPlanWrap}
                refreshControl={refreshControl}
              >
                <View style={[styles.noPlanCard, { backgroundColor: palette.card, borderColor: palette.border }]}>

                  <View style={styles.noPlanIcon}>
                    <Sparkles size={22} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.noPlanTitle, { color: palette.text }]}>{t.planGenerationFailedTitle}</Text>
                  <Text style={[styles.noPlanBody, { color: palette.muted }]}>

                    {getPlanFailureMessage()}
                  </Text>
                  <TouchableOpacity
                    style={styles.noPlanButton}
                    onPress={() => {
                      void startGeneration();
                    }}
                  >
                    <Text style={styles.noPlanButtonText}>{t.retryGeneration}</Text>
                    <ArrowRight size={16} color="#0F172A" />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
            {showPlanCreatedNoData && (
              <ScrollView
                contentContainerStyle={styles.noPlanWrap}
                refreshControl={refreshControl}
              >
                <View style={[styles.noPlanCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                  <View style={styles.noPlanIcon}>
                    <Sparkles size={22} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.noPlanTitle, { color: palette.text }]}>{t.generateBusinessPlan}</Text>
                  <Text style={[styles.noPlanBody, { color: palette.muted }]}>
                    {t.noPlanBody(activeCompany?.businessName || "")}
                  </Text>
                  <TouchableOpacity
                    style={styles.noPlanButton}
                    onPress={() => {
                      void startGeneration();
                    }}
                  >
                    <Text style={styles.noPlanButtonText}>{t.startGeneration}</Text>
                    <ArrowRight size={16} color="#0F172A" />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
          <StatusBar backgroundColor={isDark ? "#001941" : "#f8fbff"} barStyle={isDark ? "light-content" : "dark-content"} />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

function getPlanPalette(isDark: boolean) {
  return {
    background: isDark ? "#090B14" : "#F8FAFC",
    gradient: isDark
      ? (["#090B14", "#111827", "#183B35"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "#CBD5E1" : "#475569",
    card: isDark ? "rgba(15,23,42,0.90)" : "rgba(255,255,255,0.94)",
    chip: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.045)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)",
    skeleton: isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)",
    skeletonSoft: isDark ? "rgba(255,255,255,0.055)" : "rgba(15,23,42,0.06)",
  };
}

function getPlanCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      tableOfContents: "\u0421\u043e\u0434\u0435\u0440\u0436\u0430\u043d\u0438\u0435",
      generateBusinessPlan: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0431\u0438\u0437\u043d\u0435\u0441-\u043f\u043b\u0430\u043d",
      noPlanBody: (name: string) =>
        `${name || "\u0412\u0430\u0448\u0430 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u044f"} \u0433\u043e\u0442\u043e\u0432\u0430. \u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u0435 \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044e \u0431\u0438\u0437\u043d\u0435\u0441-\u043f\u043b\u0430\u043d\u0430, \u0447\u0442\u043e\u0431\u044b \u043f\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0438 \u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0435\u0433\u043e \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b.`,
      startGeneration: "\u041d\u0430\u0447\u0430\u0442\u044c \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044e",
      planGenerationFailedTitle: "\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043d\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043b\u0430\u0441\u044c",
      planGenerationFailedBody: "\u0411\u0438\u0437\u043d\u0435\u0441-\u043f\u043b\u0430\u043d \u0435\u0449\u0435 \u043d\u0435 \u0433\u043e\u0442\u043e\u0432. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0441\u043d\u043e\u0432\u0430 \u0438\u043b\u0438 \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u0435 \u044d\u0442\u0443 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443 \u0447\u0435\u0440\u0435\u0437 \u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0441\u0435\u043a\u0443\u043d\u0434.",
      planGenerationJsonFailedBody: "\u0418\u0418 \u0432\u0435\u0440\u043d\u0443\u043b \u043d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 JSON. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0437\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044e \u0435\u0449\u0435 \u0440\u0430\u0437.",
      retryGeneration: "\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044e",
    };
  }

  if (language === "hy") {
    return {
      tableOfContents: "\u0532\u0578\u057e\u0561\u0576\u0564\u0561\u056f\u0578\u0582\u0569\u0575\u0578\u0582\u0576",
      generateBusinessPlan: "\u054d\u057f\u0565\u0572\u056e\u0565\u056c \u0562\u056b\u0566\u0576\u0565\u057d \u057a\u056c\u0561\u0576",
      noPlanBody: (name: string) =>
        `${name || "\u0541\u0565\u0580 \u0568\u0576\u056f\u0565\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0568"} \u057a\u0561\u057f\u0580\u0561\u057d\u057f \u0567\u0589 \u054d\u056f\u057d\u0565\u0584 \u0562\u056b\u0566\u0576\u0565\u057d \u057a\u056c\u0561\u0576\u056b \u0563\u0565\u0576\u0565\u0580\u0561\u0581\u056b\u0561\u0576, \u0578\u0580\u057a\u0565\u057d\u0566\u056b \u0561\u0575\u057d\u057f\u0565\u0572 \u0564\u056b\u057f\u0565\u0584 \u0587 \u056d\u0574\u0562\u0561\u0563\u0580\u0565\u0584 \u0567\u057b\u0565\u0580\u0568\u0589`,
      startGeneration: "\u054d\u056f\u057d\u0565\u056c \u0563\u0565\u0576\u0565\u0580\u0561\u0581\u056b\u0561\u0576",
      planGenerationFailedTitle: "\u0533\u0565\u0576\u0565\u0580\u0561\u0581\u056b\u0561\u0576 \u0579\u056b \u0561\u057e\u0561\u0580\u057f\u057e\u0565\u056c",
      planGenerationFailedBody: "\u0532\u056b\u0566\u0576\u0565\u057d \u057a\u056c\u0561\u0576\u0568 \u0564\u0565\u057c \u057a\u0561\u057f\u0580\u0561\u057d\u057f \u0579\u0567\u0589 \u053f\u0580\u056f\u0576\u0565\u0584 \u0570\u0561\u0580\u0581\u0578\u0582\u0574\u0568 \u056f\u0561\u0574 \u0574\u056b \u0584\u0561\u0576\u056b \u057e\u0561\u0575\u0580\u056f\u0575\u0561\u0576\u056b\u0581 \u0569\u0561\u0580\u0574\u0561\u0581\u0580\u0565\u0584 \u0561\u0575\u057d \u0567\u057b\u0568\u0589",
      planGenerationJsonFailedBody: "\u0531\u0532-\u0576 \u057e\u0565\u0580\u0561\u0564\u0561\u0580\u0571\u0580\u0565\u0581 \u057d\u056d\u0561\u056c JSON\u0589 \u053d\u0576\u0564\u0580\u0578\u0582\u0574 \u0565\u0576\u0584 \u0576\u0578\u0580\u056b\u0581 \u0563\u0565\u0576\u0565\u0580\u0561\u0581\u0576\u0565\u056c \u0562\u056b\u0566\u0576\u0565\u057d \u057a\u056c\u0561\u0576\u0568\u0589",
      retryGeneration: "\u053f\u0580\u056f\u0576\u0565\u056c \u0563\u0565\u0576\u0565\u0580\u0561\u0581\u056b\u0561\u0576",
    };
  }

  return {
    tableOfContents: "Table of Contents",
    generateBusinessPlan: "Generate business plan",
    noPlanBody: (name: string) =>
      `${name || "Your company"} is ready. Start business plan generation to review and edit the pages here.`,
    startGeneration: "Start generation",
    planGenerationFailedTitle: "Generation did not finish",
    planGenerationFailedBody: "The business plan is still not ready. Try the request again or refresh this page in a few seconds.",
    planGenerationJsonFailedBody: "The AI returned invalid JSON. Please try generating the business plan again.",
    retryGeneration: "Retry generation",
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tocMenu: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 300,
    borderLeftWidth: 1,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  tocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  tocTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#001941',
  },
  closeButtonContainer: {
    padding: 5,
  },
  tocContent: {
    flex: 1,
    padding: 20,
  },
  tocSection: {
    marginBottom: 20,
  },
  tocSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#001941',
    marginBottom: 10,
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  tocItemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  tocPageNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  skeletonContainer: {
    paddingHorizontal: 10,
    paddingBottom: 50,
    alignItems: 'center',
  },
  skeletonPageWrapper: {
    width: '90%',
    marginBottom: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  skeletonPage: {
    height: 480,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 24,
    width: '60%',
    borderRadius: 6,
    marginBottom: 25,
  },
  skeletonAddMorePages: {
    height: 60,
    marginTop: 30,
    marginBottom: 15,
    width: '100%',
    borderRadius: 12,
  },
  skeletonLine: {
    height: 12,
    width: '100%',
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonLineShort: {
    height: 12,
    width: '80%',
    borderRadius: 4,
    marginBottom: 10,
  },
  noPlanWrap: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: "45%"
  },
  noPlanCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  noPlanIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#4D2FB2",
    alignItems: "center",
    justifyContent: "center",
  },
  noPlanTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  noPlanBody: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 22,
    maxHeight: 200
  },
  noPlanButton: {
    marginTop: 4,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  noPlanButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
});









