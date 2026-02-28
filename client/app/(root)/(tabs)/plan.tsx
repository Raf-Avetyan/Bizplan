import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from 'moti';
import { X } from 'lucide-react-native';
import CreateNewCompany from '@/components/plan/createNewCompany/CreateNewCompany';
import BusinessPlanRenderer, { tableOfContents } from '../../../components/plan/BusinessPlanRenderer';
import { router, useFocusEffect } from 'expo-router';
import { BusinessPlanTemplate } from '@/types/business-plan.types';
import { useActiveCompany, useCompanyAdditionalData } from '@/hooks/useCompanyQueries';

export default function PlansScreen() {
  const [tocVisible, setTocVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [savedScrollPosition, setSavedScrollPosition] = useState(0);
  const [isReturningFromEdit, setIsReturningFromEdit] = useState(false);

  const {
    data: activeCompany,
    isLoading: isLoadingCompany,
  } = useActiveCompany();

  const {
    data: companyAdditionalData,
    isLoading: isLoadingCompanyAdditional
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

  const renderTOCMenu = () => (
    <View style={styles.tocMenu}>
      <View style={styles.tocHeader}>
        <Text style={styles.tocTitle}>Table of Contents</Text>
        <TouchableOpacity onPress={toggleTOC} style={styles.closeButtonContainer}>
          <X size={24} color="#001941" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.tocContent}>
        {tableOfContents.map((section, index) => (
          <View key={index} style={styles.tocSection}>
            <Text style={styles.tocSectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.tocItem}
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
                <Text style={styles.tocItemText}>{item.name}</Text>
                <Text style={styles.tocPageNumber}>{item.page}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderSkeletons = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.skeletonContainer}>
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
            <View style={[styles.skeletonTitle, { marginTop: 10, width: '40%' }]} />

            <View style={styles.skeletonPage}>
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonLine} />
                <View style={styles.skeletonLineShort} />
                <View style={[styles.skeletonLine, { marginTop: 20 }]} />
                <View style={styles.skeletonLine} />
                <View style={styles.skeletonLineShort} />
              </View>
              <View style={styles.skeletonLine} />
            </View>

            <View style={styles.skeletonAddMorePages} />
          </MotiView>
        </View>
      ))}
    </ScrollView>
  );

  if (showCreateNewCompany) {
    return (
      <View className="flex-1 bg-[#4D2FB2]">
        <LinearGradient
          colors={["#4D2FB2", "#2B1A66", "#050510"]}
          style={{ flex: 1 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          locations={[0, 0.6, 1]}
        >
          <SafeAreaView className="flex-1">
            <ScrollView
              contentContainerStyle={{
                flex: 1,
                display: "flex",
              }}
            >
              <CreateNewCompany />
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#4D2FB2]">
      <LinearGradient
        colors={["#4D2FB2", "#2B1A66", "#050510"]}
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
                />
                {tocVisible && renderTOCMenu()}
              </View>
            )}
            {showPlanCreatedNoData && renderSkeletons()}
          </KeyboardAvoidingView>
          <StatusBar backgroundColor="#001941" barStyle="light-content" />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
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
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#e8e8e8',
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
    paddingVertical: 8,
    paddingHorizontal: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 480,
    borderRadius: 18,
    padding: 20,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 24,
    width: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    marginBottom: 25,
  },
  skeletonAddMorePages: {
    height: 60,
    marginTop: 30,
    marginBottom: 15,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  skeletonLine: {
    height: 12,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonLineShort: {
    height: 12,
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    marginBottom: 10,
  },
});