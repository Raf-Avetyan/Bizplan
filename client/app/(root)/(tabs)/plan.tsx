import React, { useCallback, useState, useRef } from "react";
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

  const handleScroll = (event: any) => {
    const position = event.nativeEvent.contentOffset.y;
    setSavedScrollPosition(position);
  };

  const handlePageClick = (pageIndex: number) => {
    if (!companyAdditionalData?.business_plan) return;

    const currentPage = companyAdditionalData.business_plan.presentation?.pages?.[pageIndex];

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

  const showLoading = isLoadingCompany || (activeCompany && isLoadingCompanyAdditional);
  const showCreateNewCompany = !activeCompany && !isLoadingCompany;
  const showBusinessPlan = companyAdditionalData?.business_plan;
  const showPlanCreatedNoData = activeCompany && !companyAdditionalData?.business_plan && !isLoadingCompanyAdditional;

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
                  businessPlan={companyAdditionalData.business_plan as BusinessPlanTemplate}
                  handlePageClick={handlePageClick}
                  refreshControl={refreshControl}
                />
                {tocVisible && renderTOCMenu()}
              </View>
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
                    onPress={() => router.push("/(root)/(tabs)/(dashboard)" as any)}
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
      tableOfContents: "Оглавление",
      generateBusinessPlan: "Сгенерировать бизнес-план",
      noPlanBody: (name: string) =>
        `${name || "Компания"} готова. Запустите генерацию из панели и вернитесь сюда для просмотра и редактирования страниц.`,
      startGeneration: "Начать генерацию",
    };
  }

  if (language === "hy") {
    return {
      tableOfContents: "Բովանդակություն",
      generateBusinessPlan: "Գեներացնել բիզնես պլան",
      noPlanBody: (name: string) =>
        `${name || "Ընկերությունը"} պատրաստ է։ Սկսեք գեներացիան dashboard-ից և վերադարձեք այստեղ՝ էջերը դիտելու ու խմբագրելու համար։`,
      startGeneration: "Սկսել գեներացիան",
    };
  }

  return {
    tableOfContents: "Table of Contents",
    generateBusinessPlan: "Generate business plan",
    noPlanBody: (name: string) =>
      `${name || "Your company"} is ready. Start generation from the dashboard and come back here to review and edit the pages.`,
    startGeneration: "Start generation",
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
    justifyContent: "center",
    paddingHorizontal: 18,
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
