import React, { forwardRef, useState } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   ActivityIndicator,
   Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BusinessPlanTemplate } from '@/types/business-plan.types';
import { Page, PageBlock } from '@/app/(root)/(tabs)/(dashboard)/components/Content';
import CoverPage from '@/app/(root)/(tabs)/(dashboard)/components/business-plan-pages/CoverPage';
import { useActiveCompany } from '@/hooks/useCompanyQueries';
import { MotiView } from 'moti';
import { Image as LucideImage } from 'lucide-react-native';

type BusinessPlanRendererProps = {
   businessPlan: BusinessPlanTemplate;
   handlePageClick: (pageIndex: number) => void;
   onScroll?: (event: any) => void;
   initialLoadCount?: number;
   loadMoreCount?: number;
};

export const tableOfContents = [
   {
      title: 'Overview', items: [
         { name: 'Executive Summary', page: 2 },
         { name: 'SWOT Analysis', page: 3 },
         { name: 'Business Models', page: 4 },
         { name: 'Viability Analysis', page: 5 },
      ]
   },
   {
      title: 'Market Research', items: [
         { name: 'Industry Overview', page: 6 },
         { name: 'Target Audience', page: 7 },
         { name: 'Market Size & Trends', page: 8 },
         { name: 'Competitor Analysis', page: 9 },
      ]
   },
   {
      title: 'Products & Services', items: [
         { name: 'Core Offering', page: 10 },
         { name: 'Expansion Opportunities', page: 11 },
         { name: 'Secondary Offering', page: 12 },
         { name: 'Customer Service', page: 13 },
      ]
   },
   {
      title: 'Sales & Marketing', items: [
         { name: 'Marketing Overview', page: 14 },
         { name: 'Branding & Identity', page: 15 },
         { name: 'Customer Retention', page: 16 },
         { name: 'Online Presence', page: 17 },
         { name: 'Social Media', page: 18 },
         { name: 'SEO & Content', page: 19 },
         { name: 'Digital Marketing', page: 20 },
         { name: 'Community Engagement', page: 21 },
      ]
   },
   {
      title: 'Financials', items: [
         { name: 'Revenue', page: 22 },
         { name: 'Expenses', page: 23 },
         { name: 'Financing', page: 24 },
         { name: 'Dividends', page: 25 },
      ]
   },
   {
      title: 'Taxes', items: [
         { name: 'Profit & Loss', page: 26 },
         { name: 'Balance Sheet', page: 27 },
         { name: 'Cash Flow', page: 28 },
         { name: 'Funding Plan', page: 29 },
      ]
   },
   {
      title: 'Operations', items: [
         { name: 'Team & Roles', page: 30 },
         { name: 'Operation Plan', page: 31 },
         { name: 'Risk Analysis', page: 32 },
         { name: 'Regulatory Compliance', page: 33 },
      ]
   },
   {
      title: 'Implementation Plan', items: [
         { name: 'Pre-Launch', page: 34 },
         { name: 'Post-Launch', page: 35 },
         { name: '5 Year Plan', page: 36 },
      ]
   },
];

export const renderBlockContent = (block: PageBlock, key: number) => {
   switch (block.type) {
      case 'heading':
         return (
            <Text style={[styles.headingText, block.styles]} key={key}>
               {typeof block.content === 'string' ? block.content : 'Heading'}
            </Text>
         );
      case 'paragraph':
         return (
            <Text style={[styles.paragraphText, block.styles]} key={key}>
               {typeof block.content === 'string' ? block.content : 'Paragraph'}
            </Text>
         );
      case 'list':
         const items = Array.isArray(block.content) ? block.content : [];
         return (
            <View style={block.styles} key={key}>
               {items.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                     <Text style={styles.bullet}>•</Text>
                     <Text style={[styles.listText, block.styles]}>{item}</Text>
                  </View>
               ))}
            </View>
         );
      case 'divider':
         return <View style={[styles.divider, block.styles]} key={key} />;
      case 'image':
         const hasImage = typeof block.content === 'string' && (
            block.content.startsWith('http') ||
            block.content.startsWith('file') ||
            block.content.startsWith('content') ||
            block.content.startsWith('data:image')
         );
         return (
            <View style={[styles.imageContainer, block.styles, { height: block.styles?.height || 200, padding: 0 }]} key={key}>
               {hasImage ? (
                  <Image
                     source={{ uri: block.content as string }}
                     style={[styles.blockImage, { width: '100%', height: '100%' }]}
                     resizeMode="cover"
                  />
               ) : (
                  <View style={styles.imagePlaceholder}>
                     <LucideImage size={48} color="#ccc" />
                     <Text style={styles.imageText}>
                        {typeof block.content === 'string' ? block.content : 'Image'}
                     </Text>
                  </View>
               )}
            </View>
         );
      default:
         return (
            <Text style={[styles.defaultText, block.styles]} key={key}>
               {typeof block.content === 'string' ? block.content : JSON.stringify(block.content)}
            </Text>
         );
   }
};

const BusinessPlanRenderer = forwardRef<ScrollView, BusinessPlanRendererProps>(({
   businessPlan,
   handlePageClick,
   onScroll,
   initialLoadCount = 1,
   loadMoreCount = 2,
}, ref) => {
   const {
      data: activeCompany,
   } = useActiveCompany();

   const [isNavigating, setIsNavigating] = useState(false);
   const [lastClickedPage, setLastClickedPage] = useState<number | null>(null);

   const [loadedSections, setLoadedSections] = useState<{ [key: string]: number }>({});
   const [loadingSections, setLoadingSections] = useState<{ [key: string]: boolean }>({});

   const handlePagePress = (pageNumber: number) => {
      if (isNavigating || lastClickedPage === pageNumber) {
         return;
      }

      setIsNavigating(true);
      setLastClickedPage(pageNumber);

      handlePageClick(pageNumber);

      setTimeout(() => {
         setIsNavigating(false);
         setLastClickedPage(null);
      }, 1000);
   };

   const handleLoadMore = (sectionId: string, totalPages: number) => {
      if (loadingSections[sectionId]) return;

      setLoadingSections(prev => ({
         ...prev,
         [sectionId]: true
      }));

      setTimeout(() => {
         setLoadedSections(prev => ({
            ...prev,
            [sectionId]: totalPages
         }));

         setLoadingSections(prev => ({
            ...prev,
            [sectionId]: false
         }));
      }, 500);
   };

   const renderPages = () => {
      if (!businessPlan.presentation?.sections || !businessPlan.presentation?.pages) return [];

      const sections = businessPlan.presentation.sections;
      const pages = businessPlan.presentation.pages;

      return sections.map((section: { id: string; title: string }) => {
         const sectionPages = pages.filter(page => page.section === section.id);
         const loadedCount = loadedSections[section.id] || initialLoadCount;
         const visiblePages = sectionPages.slice(0, loadedCount);
         const hasMore = sectionPages.length > loadedCount;
         const remainingCount = sectionPages.length - loadedCount;
         const isLoadingThisSection = loadingSections[section.id] || false;

         if (visiblePages.length === 0) return null;

         return (
            <View key={section.id} style={styles.sectionContainer}>
               <Text style={styles.sectionHeader}>{section.title}</Text>

               <View style={styles.pagesRow}>
                  {visiblePages.map((page: Page) => {
                     let pageContent;

                     switch (page.type) {
                        case 'cover':
                           pageContent = <CoverPage company={activeCompany!} size='normal' />
                           break;

                        case 'toc':
                           pageContent = (
                              <View style={styles.pageContent}>
                                 <Text style={styles.tocMainTitle}>Table Of Contents</Text>
                                 <View style={styles.tocColumns}>
                                    <View style={styles.tocColumn}>
                                       {tableOfContents.slice(0, Math.ceil(tableOfContents.length / 2)).map((section, sectionIndex) => (
                                          <View key={sectionIndex} style={styles.tocSection}>
                                             <View style={styles.tocSectionHeader}>
                                                <Text style={styles.tocSectionTitle}>{section.title}</Text>
                                                <Text style={styles.tocSectionNumber}>
                                                   {sectionIndex === 0 ? '1' :
                                                      sectionIndex === 1 ? '5' :
                                                         sectionIndex === 2 ? '9' :
                                                            sectionIndex === 3 ? '13' :
                                                               (sectionIndex + 1) * 4 - 3}
                                                </Text>
                                             </View>
                                             {section.items.map((item, itemIndex) => (
                                                <View key={itemIndex} style={styles.tocItem}>
                                                   <View style={styles.tocItemLeft}>
                                                      <Text style={styles.tocItemText}>{item.name}</Text>
                                                   </View>
                                                   <Text style={styles.tocPageNumber}>{item.page}</Text>
                                                </View>
                                             ))}
                                          </View>
                                       ))}
                                    </View>

                                    <View style={styles.tocColumn}>
                                       {tableOfContents.slice(Math.ceil(tableOfContents.length / 2)).map((section, sectionIndex) => (
                                          <View key={sectionIndex} style={styles.tocSection}>
                                             <View style={styles.tocSectionHeader}>
                                                <Text style={styles.tocSectionTitle}>{section.title}</Text>
                                                <Text style={styles.tocSectionNumber}>
                                                   {sectionIndex === 0 ? '17' :
                                                      sectionIndex === 1 ? '21' :
                                                         sectionIndex === 2 ? '25' :
                                                            sectionIndex === 3 ? '29' :
                                                               (Math.ceil(tableOfContents.length / 2) + sectionIndex) * 4 - 3}
                                                </Text>
                                             </View>
                                             {section.items.map((item, itemIndex) => (
                                                <View key={itemIndex} style={styles.tocItem}>
                                                   <View style={styles.tocItemLeft}>
                                                      <Text style={styles.tocItemText}>{item.name}</Text>
                                                   </View>
                                                   <Text style={styles.tocPageNumber}>{item.page}</Text>
                                                </View>
                                             ))}
                                          </View>
                                       ))}
                                    </View>
                                 </View>
                              </View>
                           );
                           break;

                        case 'content':
                           pageContent = (
                              <View style={styles.pageContent}>
                                 {page.blocks.map((block: PageBlock, key: number) => renderBlockContent(block, key))}
                              </View>
                           );
                           break;

                        default:
                           pageContent = (
                              <View style={styles.pageContent}>
                                 {page.blocks?.map((block: PageBlock, key: number) => renderBlockContent(block, key))}
                                 <View style={styles.pageFooter}>
                                    <Text style={styles.pageNumber}>{page.pageNumber}</Text>
                                    <Text style={styles.pageTitleFooter}>{page.title}</Text>
                                    <Text style={styles.businessNameFooter}>
                                       {businessPlan.metadata.business_name}
                                    </Text>
                                 </View>
                              </View>
                           );
                     }

                     return (
                        <TouchableOpacity
                           key={page.id}
                           style={styles.viewContainer}
                           onPress={() => handlePagePress(page.pageNumber)}
                           activeOpacity={0.9}
                           disabled={isNavigating}
                        >
                           <View style={styles.pageWrapper}>
                              <View style={styles.pageContainer}>
                                 {(page.type !== 'toc' && page.type !== 'cover') && (
                                    <LinearGradient
                                       colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,1)']}
                                       locations={[0, 0.3, 1]}
                                       style={styles.pageGradientOverlay}
                                    />
                                 )}
                                 <View style={styles.pageShadow} />
                                 <View style={styles.page}>
                                    {pageContent}
                                 </View>
                              </View>
                           </View>
                        </TouchableOpacity>
                     )
                  })}

                  {isLoadingThisSection && (
                     Array.from({ length: remainingCount }).map((_, index) => (
                        <MotiView
                           key={`skeleton-${index}`}
                           from={{ opacity: 0.3 }}
                           animate={{ opacity: 0.6 }}
                           transition={{
                              type: 'timing',
                              duration: 1000,
                              loop: true,
                              delay: index * 100,
                           }}
                           style={styles.pageSkeletonWrapper}
                        >
                           <View style={styles.pageSkeleton}>
                              <View style={styles.skeletonTitle} />
                              <View style={styles.skeletonContent}>
                                 <View style={styles.skeletonLine} />
                                 <View style={styles.skeletonLineShort} />
                                 <View style={[styles.skeletonLine, { marginTop: 20 }]} />
                                 <View style={styles.skeletonLine} />
                                 <View style={styles.skeletonLineShort} />
                              </View>
                           </View>
                        </MotiView>
                     ))
                  )}

                  {hasMore && !isLoadingThisSection && (
                     <TouchableOpacity
                        style={styles.loadMoreButton}
                        onPress={() => handleLoadMore(section.id, sectionPages.length)}
                     >
                        <Text style={styles.loadMoreText}>
                           Load {remainingCount} More {remainingCount === 1 ? 'Page' : 'Pages'}
                        </Text>
                        <Text style={styles.loadMoreSubtext}>
                           Show all {sectionPages.length} pages
                        </Text>
                     </TouchableOpacity>
                  )}
               </View >
            </View >
         );
      });
   };

   return (
      <ScrollView
         ref={ref}
         onScroll={onScroll}
         scrollEventThrottle={16}
         style={styles.container}
         showsVerticalScrollIndicator={true}
         contentContainerStyle={styles.scrollContent}
      >
         {renderPages()}
         <View style={styles.bottomSpacer} />
      </ScrollView>
   );
});

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   scrollContent: {
      paddingVertical: 15,
      paddingHorizontal: 10,
   },
   sectionContainer: {
      marginBottom: 30,
   },
   sectionHeader: {
      fontSize: 22,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 24,
      paddingHorizontal: 16,
   },
   pagesRow: {},
   pagesWrapper: {},
   pageWrapper: {
      alignItems: 'center',
      marginBottom: 20,
      borderRadius: 12
   },
   pageGradientOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 120,
      zIndex: 999,
      backgroundColor: 'transparent',
   },
   pageContainer: {
      width: '90%',
      position: 'relative',
      overflow: "hidden",
      borderRadius: 18,
      borderWidth: 2,
      borderColor: '#e8e8e8',
   },
   pageShadow: {
      position: 'absolute',
      top: 5,
      left: 5,
      right: -5,
      bottom: -5,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
   },
   page: {
      backgroundColor: '#ffffff',
      padding: 20,
      height: 480,
      overflow: "hidden",
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
      position: 'relative',
      zIndex: 1,
   },
   // Cover Page Styles

   pageContent: {
      flex: 1,
   },
   tocColumns: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
   },
   tocColumn: {
      flex: 1,
      marginRight: 10,
   },
   tocMainTitle: {
      fontSize: 10,
      fontWeight: '500',
      color: '#001941',
      marginBottom: 20,
      textAlign: 'center',
   },
   tocSection: {
      marginBottom: 15,
   },
   tocSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
      borderBottomWidth: .5,
      paddingBottom: 2,
      borderStyle: "solid",
      borderBottomColor: "rgba(0, 0, 0, .05)"
   },
   tocSectionTitle: {
      fontSize: 7,
      fontWeight: '600',
      color: '#001941',
      textTransform: 'uppercase',
      flex: 1,
   },
   tocSectionNumber: {
      fontSize: 7,
      fontWeight: '700',
      color: '#001941',
      marginLeft: 8,
   },
   tocItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
   },
   tocItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
   },
   tocItemText: {
      fontSize: 6,
      color: '#333',
      flex: 1,
   },
   tocPageNumber: {
      fontSize: 6,
      color: '#666',
      fontWeight: '500',
   },
   // SWOT Analysis Styles
   pageTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#001941',
      marginBottom: 6,
   },
   pageSubtitle: {
      fontSize: 13,
      color: '#666',
      marginBottom: 16,
   },
   section: {
      marginBottom: 16,
   },
   sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#001941',
      marginBottom: 6,
   },
   sectionText: {
      fontSize: 13,
      lineHeight: 18,
      color: '#333',
      marginBottom: 3,
   },
   swotGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginVertical: 12,
   },
   swotCard: {
      flex: 1,
      minWidth: '48%',
      padding: 12,
      borderRadius: 6,
      borderLeftWidth: 3,
      marginBottom: 12,
   },
   strengthCard: {
      backgroundColor: '#e8f5e9',
      borderLeftColor: '#4CAF50',
   },
   weaknessCard: {
      backgroundColor: '#ffebee',
      borderLeftColor: '#f44336',
   },
   opportunityCard: {
      backgroundColor: '#e3f2fd',
      borderLeftColor: '#2196F3',
   },
   threatCard: {
      backgroundColor: '#fff3e0',
      borderLeftColor: '#ff9800',
   },
   swotTitle: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 6,
   },
   strengthTitle: {
      color: '#2e7d32',
   },
   weaknessTitle: {
      color: '#c62828',
   },
   opportunityTitle: {
      color: '#1565c0',
   },
   threatTitle: {
      color: '#ef6c00',
   },
   swotItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 4,
   },
   swotBullet: {
      marginRight: 6,
      fontSize: 11,
   },
   swotText: {
      fontSize: 12,
      lineHeight: 16,
      color: '#333',
      flex: 1,
   },
   pageFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 25,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#e8e8e8',
   },
   pageNumber: {
      fontSize: 10,
      color: '#999',
      fontWeight: '500',
   },
   pageTitleFooter: {
      fontSize: 10,
      color: '#666',
      fontWeight: '500',
   },
   businessNameFooter: {
      fontSize: 9,
      color: '#999',
      fontStyle: 'italic',
   },
   bottomSpacer: {
      height: 30,
   },
   viewContainer: {
      flex: 1,
   },
   headingText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#001941',
      marginBottom: 10,
   },
   paragraphText: {
      fontSize: 14,
      lineHeight: 20,
      color: '#333',
      marginBottom: 15,
   },
   headingInput: {
      fontSize: 24,
      fontWeight: 'bold',
   },
   listInput: {
      fontSize: 14,
   },
   listItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 5,
   },
   bullet: {
      marginRight: 8,
      fontSize: 16,
   },
   listText: {
      fontSize: 14,
      lineHeight: 20,
      flex: 1,
   },
   divider: {
      height: 2,
      backgroundColor: '#001941',
      marginVertical: 20,
      width: '80%',
   },
   imageContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      borderRadius: 8,
      marginVertical: 15,
      overflow: 'hidden',
   },
   blockImage: {
      borderRadius: 8,
   },
   imagePlaceholder: {
      alignItems: 'center',
      padding: 20,
   },
   imageText: {
      fontSize: 16,
      color: '#666',
   },
   defaultText: {
      fontSize: 14,
      color: '#333',
   },
   loadMoreButton: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      padding: 15,
      borderRadius: 8,
      marginVertical: 10,
      marginHorizontal: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      borderStyle: 'dashed',
   },
   loadMoreText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
   },
   loadMoreSubtext: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 12,
      marginTop: 4,
   },
   loadMoreButtonLoading: {
      opacity: 0.7,
   },
   pageSkeletonWrapper: {
      alignItems: 'center',
      marginBottom: 20,
   },
   pageSkeleton: {
      width: '90%',
      height: 480,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 18,
      padding: 20,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   skeletonTitle: {
      height: 24,
      width: '60%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 6,
      marginBottom: 20,
   },
   skeletonContent: {
      flex: 1,
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

export default BusinessPlanRenderer