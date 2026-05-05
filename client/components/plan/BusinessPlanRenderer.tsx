import React, { forwardRef, useState } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   ActivityIndicator,
   Image,
   Pressable,
   RefreshControlProps,
   TouchableOpacity,
   useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { BusinessPlanTemplate } from '@/types/business-plan.types';
import { Page, PageBlock } from '@/app/(root)/(tabs)/(dashboard)/components/Content';
import CoverPage from '@/app/(root)/(tabs)/(dashboard)/components/business-plan-pages/CoverPage';
import { useActiveCompany } from '@/hooks/useCompanyQueries';
import { MotiView, AnimatePresence } from 'moti';
import { Image as LucideImage, MoreHorizontal, Upload } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useSettings } from '@/lib/settings-context';

type BusinessPlanRendererProps = {
   businessPlan: BusinessPlanTemplate;
   handlePageClick: (pageIndex: number) => void;
   onScroll?: (event: any) => void;
   initialLoadCount?: number;
   loadMoreCount?: number;
   refreshControl?: React.ReactElement<RefreshControlProps>;
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

const SCALE_KEYS = new Set([
   'fontSize',
   'margin',
   'marginTop',
   'marginRight',
   'marginBottom',
   'marginLeft',
   'marginVertical',
   'marginHorizontal',
   'padding',
   'paddingTop',
   'paddingRight',
   'paddingBottom',
   'paddingLeft',
   'paddingVertical',
   'paddingHorizontal',
   'letterSpacing',
   'height',
   'minHeight',
   'maxHeight',
   'borderRadius',
]);

const scaleStyleObject = (style: any, factor: number) => {
   if (!style || factor >= 1 || typeof style !== 'object') {
      return style;
   }

   const scaled: Record<string, any> = {};
   for (const [key, value] of Object.entries(style)) {
      if (typeof value === 'number' && SCALE_KEYS.has(key)) {
         scaled[key] = Math.max(1, value * factor);
      } else {
         scaled[key] = value;
      }
   }

   return scaled;
};

export const renderBlockContent = (block: PageBlock, key: number, contentScale: number = 1) => {
   const scaledBlockStyles = scaleStyleObject(block.styles, contentScale);
   const compactHeadingStyle = contentScale < 1 ? { fontSize: Math.max(8, 24 * contentScale + 4), lineHeight: Math.max(8, 28 * contentScale + 8) } : null;
   const compactTextStyle = contentScale < 1 ? { fontSize: Math.max(5, 14 * contentScale + 4), lineHeight: Math.max(5, 20 * contentScale + 8) } : null;
   const compactListStyle = contentScale < 1 ? { fontSize: Math.max(5, 14 * contentScale + 4), lineHeight: Math.max(5, 20 * contentScale + 8) } : null;
   const compactBlockSpacing = contentScale < 1 ? { marginBottom: 5, marginTop: 0, marginVertical: 2 } : null;
   const compactBulletStyle = contentScale < 1 ? { fontSize: Math.max(6, 16 * contentScale), marginRight: 3 } : null;
   const compactListItemStyle = contentScale < 1 ? { marginBottom: 1 } : null;
   switch (block.type) {
      case 'heading':
         return (
            <Text style={[styles.headingText, compactBlockSpacing, scaledBlockStyles, compactHeadingStyle]} key={key}>
               {typeof block.content === 'string' ? block.content : 'Heading'}
            </Text>
         );
      case 'paragraph':
         return (
            <Text style={[styles.paragraphText, compactBlockSpacing, scaledBlockStyles, compactTextStyle]} key={key}>
               {typeof block.content === 'string' ? block.content : 'Paragraph'}
            </Text>
         );
      case 'list': {
         const items = Array.isArray(block.content) ? block.content : [];

         const renderListItems = (columnItems: any[]) =>
            columnItems.map((item, index) => {
               const itemText =
                  typeof item === 'string'
                     ? item
                     : typeof item === 'number' || typeof item === 'boolean'
                        ? String(item)
                        : JSON.stringify(item);

               return (
                  <View
                     key={`${index}-${itemText}`}
                     style={[styles.listItem, compactListItemStyle]}
                  >
                     <View
                        style={[
                           styles.bulletDot,
                           compactBulletStyle,
                           {
                              backgroundColor:
                                 (scaledBlockStyles as any)?.color || '#333',
                           },
                        ]}
                     />

                     <Text
                        style={[
                           styles.listText,
                           scaledBlockStyles,
                           compactListStyle,
                        ]}
                     >
                        {itemText}
                     </Text>
                  </View>
               );
            });

         return (
            <View style={[compactBlockSpacing, scaledBlockStyles]} key={key}>
               {renderListItems(items)}
            </View>
         );
      }
      case 'divider':
         return <View style={[styles.divider, scaledBlockStyles]} key={key} />;
      case 'image':
         const hasImage = typeof block.content === 'string' && (
            block.content.startsWith('http') ||
            block.content.startsWith('file') ||
            block.content.startsWith('content') ||
            block.content.startsWith('data:image')
         );
         const imgBorderRadius = Number(block.styles?.borderRadius) || 0;
         const imgResizeMode = (block.metadata?.resizeMode || 'cover') as 'cover' | 'contain' | 'stretch';
         const imgBorderStyle = block.metadata?.borderStyle || 'none';
         const imgCaption = block.metadata?.caption || '';
         const borderFrameStyle = imgBorderStyle === 'thin' ? { borderWidth: 1, borderColor: '#ddd' }
            : imgBorderStyle === 'medium' ? { borderWidth: 2, borderColor: '#999' }
               : imgBorderStyle === 'shadow' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }
                  : {};
         return (
            <View key={key}>
               <View style={[styles.imageContainer, scaledBlockStyles, { height: scaledBlockStyles?.height || 200, padding: 0, borderRadius: imgBorderRadius === 999 ? Number(scaledBlockStyles?.height || 200) : imgBorderRadius, overflow: 'hidden' as const }, borderFrameStyle]}>
                  {hasImage ? (
                     <Image
                        source={{ uri: block.content as string }}
                        style={[styles.blockImage, { width: '100%', height: '100%' }]}
                        resizeMode={imgResizeMode}
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
               {imgCaption ? <Text style={{ fontSize: contentScale < 1 ? Math.max(8, 11 * contentScale) : 11, color: '#888', textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>{imgCaption}</Text> : null}
            </View>
         );
      default:
         return (
            <Text style={[styles.defaultText, compactBlockSpacing, scaledBlockStyles, compactTextStyle]} key={key}>
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
   refreshControl,
}, ref) => {
   const {
      data: activeCompany,
   } = useActiveCompany();
   const { settings } = useSettings();
   const colorScheme = useColorScheme();
   const resolvedTheme =
      settings.theme === 'system' ? (colorScheme === 'light' ? 'light' : 'dark') : settings.theme;
   const isDark = resolvedTheme === 'dark';
   const palette = getRendererPalette(isDark);

   const [isNavigating, setIsNavigating] = useState(false);
   const [lastClickedPage, setLastClickedPage] = useState<number | null>(null);

   const [loadedSections, setLoadedSections] = useState<{ [key: string]: number }>({});
   const [loadingSections, setLoadingSections] = useState<{ [key: string]: boolean }>({});
   const [showMenu, setShowMenu] = useState(false);
   const [isExporting, setIsExporting] = useState(false);

   const prepareImages = async () => {
      if (!businessPlan || !businessPlan.presentation?.pages) return {};

      const imageMap: { [key: string]: string } = {};
      const pages = businessPlan.presentation.pages;

      for (const page of pages) {
         if (page.blocks) {
            for (const block of page.blocks) {
               if (block.type === 'image' && typeof block.content === 'string') {
                  const uri = block.content;
                  if (uri.startsWith('http') || uri.startsWith('data:')) {
                     imageMap[uri] = uri;
                  } else if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('/')) {
                     try {
                        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
                        imageMap[uri] = `data:image/jpeg;base64,${base64}`;
                     } catch (e) {
                        console.error('Error reading local image:', uri, e);
                        imageMap[uri] = uri;
                     }
                  }
               }
            }
         }
      }
      return imageMap;
   };

   const generatePdfHtml = (imageMap: { [key: string]: string }) => {
      if (!businessPlan || !businessPlan.presentation?.pages) return '';

      const pages = businessPlan.presentation.pages;
      const businessName = businessPlan.metadata.business_name;

      let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: 0; size: 1000px 1414px; }
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Helvetica', 'Arial', sans-serif;
            background-color: #f5f5f5;
          }
          .page {
            width: 1000px;
            padding: 60px;
            box-sizing: border-box;
            background-color: white;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          .page-content { 
             flex: 1; 
             display: flex; 
             flex-direction: column;
             height: 100% !important;
          }
          
          /* Cover Page Styles */
          .cover-container { 
            height: 1175px !important;
            display: flex; 
            flex-direction: column; 
            justify-content: space-between; 
          }
          .logo-box {
            width: 200px;
            height: 100px;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            font-weight: bold;
            color: #666;
            margin-bottom: 40px;
          }
          .cover-title {
            font-size: 64px;
            font-weight: 800;
            color: #001941;
            text-transform: uppercase;
            margin-bottom: 10px;
          }
          .cover-subtitle {
            font-size: 28px;
            font-weight: 500;
            color: #666;
            letter-spacing: 2px;
          }
          .contact-info { font-size: 16px; color: #666; line-height: 1.6; margin-top: 60px; }

          /* TOC Styles */
         .toc-container {
            height: 1175px !important;
          }
          .toc-title { font-size: 32px; font-weight: bold; text-align: center; margin-bottom: 40px; color: #001941; }
          .toc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .toc-section { margin-bottom: 30px; }
          .toc-header { 
            display: flex; 
            justify-content: space-between; 
            border-bottom: 2px solid #eee; 
            padding-bottom: 5px; 
            margin-bottom: 10px;
            font-size: 18px;
            font-weight: bold;
            color: #001941;
            text-transform: uppercase;
          }
          .toc-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 16px; color: #333; }

          /* Content Styles */
          .heading { font-size: 42px; font-weight: bold; margin-bottom: 20px; color: #001941; }
          .paragraph { font-size: 20px; line-height: 1.6; color: #333; margin-bottom: 20px; }
          .list-container { margin-bottom: 20px; }
          .list-item { display: flex; align-items: flex-start; margin-bottom: 10px; font-size: 20px; color: #333; }
          .list-bullet { margin-right: 15px; font-weight: bold; }
          .divider { height: 4px; background-color: #001941; margin: 30px 0; width: 80%; }
          .image-wrap { margin: 30px 0; text-align: center; }
          .block-img { max-width: 100%; border-radius: 12px; }
          .caption { font-size: 16px; color: #888; font-style: italic; margin-top: 10px; }
        </style>
      </head>
      <body>
      `;

      pages.forEach((page) => {
         html += `<div class="page">`;
         html += `<div class="page-content">`;

         if (page.type === 'cover') {
            html += `
            <div class="cover-container">
              <div class="logo-box">LOGO</div>
              <div>
                <div class="cover-title">${activeCompany?.businessName || businessName}</div>
                <div class="cover-subtitle">BUSINESS PLAN</div>
              </div>
              <div class="contact-info">
                <div>NAME@EXAMPLE.COM</div>
                <div>416 656 1234</div>
                <div>EXAMPLE.COM</div>
                <div>123 ELM STREET, TORONTO, ON</div>
              </div>
            </div>`;
         } else if (page.type === 'toc') {
            html += `<div class="toc-container"><div class="toc-title">Table Of Contents</div>`;
            html += `<div class="toc-grid">`;

            const renderCol = (items: typeof tableOfContents, startIdx: number) => {
               let colHtml = '<div class="toc-column">';
               items.forEach((section, idx) => {
                  colHtml += `
                  <div class="toc-section">
                    <div class="toc-header">
                      <span>${section.title}</span>
                      <span>${(startIdx + idx) * 4 + 1}</span>
                    </div>`;
                  section.items.forEach(item => {
                     colHtml += `
                     <div class="toc-item">
                       <span>${item.name}</span>
                       <span>${item.page}</span>
                     </div>`;
                  });
                  colHtml += `</div>`;
               });
               colHtml += '</div>';
               return colHtml;
            };

            html += renderCol(tableOfContents.slice(0, Math.ceil(tableOfContents.length / 2)), 0);
            html += renderCol(tableOfContents.slice(Math.ceil(tableOfContents.length / 2)), Math.ceil(tableOfContents.length / 2));
            html += `</div>`;
         } else {
            page.blocks?.forEach(block => {
               if (block.type === 'heading') {
                  html += `<div class="heading">${block.content}</div>`;
               } else if (block.type === 'paragraph') {
                  html += `<div class="paragraph">${block.content}</div>`;
               } else if (block.type === 'list' && Array.isArray(block.content)) {
                  html += `<div class="list-container">`;
                  block.content.forEach(item => {
                     html += `<div class="list-item"><span class="list-bullet">вЂў</span><span>${item}</span></div>`;
                  });
                  html += `</div>`;
               } else if (block.type === 'divider') {
                  html += `<div class="divider"></div>`;
               } else if (block.type === 'image') {
                  const uri = typeof block.content === 'string' ? block.content : '';
                  const processedUri = imageMap[uri] || uri;
                  if (processedUri) {
                     html += `
                    <div class="image-wrap">
                      <img src="${processedUri}" class="block-img" style="max-height: ${block.styles?.height ? Number(block.styles.height) * 2 : 500}px; object-fit: cover;" />
                      ${block.metadata?.caption ? `<div class="caption">${block.metadata.caption}</div>` : ''}
                    </div>`;
                  }
               }
            });
         }

         html += `</div></div></div>`;
      });

      html += `</body></html>`;
      return html;
   };

   const exportToPdf = async () => {
      try {
         setIsExporting(true);
         setShowMenu(false);

         const imageMap = await prepareImages();
         const html = generatePdfHtml(imageMap);

         const { uri } = await Print.printToFileAsync({
            html,
            base64: false
         });

         await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Export ${businessPlan.metadata.business_name} PDF`,
            UTI: 'com.adobe.pdf'
         });
      } catch (err) {
         console.error('PDF Export Error:', err);
      } finally {
         setIsExporting(false);
      }
   };

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
            <View key={section.id} style={[styles.sectionContainer, { backgroundColor: palette.sectionCard, borderColor: palette.border }]}>
               <View style={styles.sectionHeaderRow}>
                  <View>
                     <Text style={[styles.sectionEyebrow, { color: palette.eyebrow }]}>Plan section</Text>
                     <Text style={[styles.sectionHeader, { color: palette.text }]}>{section.title}</Text>
                  </View>
                  <Text style={[styles.sectionCount, { color: palette.muted }]}>
                     {sectionPages.length} pages
                  </Text>
               </View>

               <View style={styles.pagesRow}>
                  {visiblePages.map((page: Page) => {
                     const isDocumentSection = section.id === 'document';
                     const contentScale = isDocumentSection ? 1 : 0.35;
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
                                 {page.blocks.map((block: PageBlock, key: number) => renderBlockContent(block, key, contentScale))}
                              </View>
                           );
                           break;

                        default:
                           pageContent = (
                              <View style={styles.pageContent}>
                                 {page.blocks?.map((block: PageBlock, key: number) => renderBlockContent(block, key, contentScale))}
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
                              <View style={[styles.pageContainer, { backgroundColor: palette.previewShell, borderColor: palette.pageBorder }]}>
                                 {(page.type !== 'toc' && page.type !== 'cover') && (
                                    <LinearGradient
                                       colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,1)']}
                                       locations={[0, 0.3, 1]}
                                       style={styles.pageGradientOverlay}
                                    />
                                 )}
                                 <View style={[styles.pageShadow, { backgroundColor: palette.pageShadow }]} />
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
                           <View style={[styles.pageSkeleton, { backgroundColor: palette.card, borderColor: palette.border }]}>
                              <View style={[styles.skeletonTitle, { backgroundColor: palette.skeleton }]} />
                              <View style={styles.skeletonContent}>
                                 <View style={[styles.skeletonLine, { backgroundColor: palette.skeletonSoft }]} />
                                 <View style={[styles.skeletonLineShort, { backgroundColor: palette.skeletonSoft }]} />
                                 <View style={[styles.skeletonLine, { marginTop: 20, backgroundColor: palette.skeletonSoft }]} />
                                 <View style={[styles.skeletonLine, { backgroundColor: palette.skeletonSoft }]} />
                                 <View style={[styles.skeletonLineShort, { backgroundColor: palette.skeletonSoft }]} />
                              </View>
                           </View>
                        </MotiView>
                     ))
                  )}

                  {hasMore && !isLoadingThisSection && (
                     <TouchableOpacity
                        style={[styles.loadMoreButton, { backgroundColor: palette.chip, borderColor: palette.border }]}
                        onPress={() => handleLoadMore(section.id, sectionPages.length)}
                     >
                        <Text style={[styles.loadMoreText, { color: palette.text }]}>
                           Load {remainingCount} More {remainingCount === 1 ? 'Page' : 'Pages'}
                        </Text>
                        <Text style={[styles.loadMoreSubtext, { color: palette.muted }]}>
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
         refreshControl={refreshControl}
      >
         {isExporting && (
            <View style={styles.exportOverlay}>
               <ActivityIndicator size="large" color="#4D2FB2" />
               <Text style={styles.exportText}>Generating PDF...</Text>
            </View>
         )}

         <View style={styles.inlineHeader}>
            <Text style={[styles.inlineHeaderTitle, { color: palette.text }]}>
               {activeCompany?.businessName || businessPlan.metadata.business_name}
            </Text>
            <Text style={[styles.inlineHeaderSubtitle, { color: palette.muted }]}>
               {businessPlan.presentation?.pages?.length ?? 0} pages · {businessPlan.presentation?.sections?.length ?? 0} sections
            </Text>
         </View>

         <View style={styles.topActions} pointerEvents="box-none">
            <TouchableOpacity
               style={[styles.actionButton, { backgroundColor: palette.card, borderColor: palette.border }]}
               onPress={() => setShowMenu(!showMenu)}
               activeOpacity={0.8}
            >
               <MoreHorizontal size={22} color={palette.text} />
            </TouchableOpacity>

            <AnimatePresence>
               {showMenu && (
                  <>
                     <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        onPress={() => setShowMenu(false)}
                     />
                     <MotiView
                        from={{ opacity: 0, scale: 0.9, translateY: -10 }}
                        animate={{ opacity: 1, scale: 1, translateY: 0 }}
                        exit={{ opacity: 0, scale: 0.9, translateY: -10 }}
                        transition={{ type: 'timing', duration: 150 }}
                        style={[styles.dropdownMenuWrapper, { backgroundColor: palette.menu, borderColor: palette.border }]}
                     >
                        <TouchableOpacity
                           style={[styles.menuOption, { backgroundColor: palette.chip }]}
                           onPress={() => {
                              setShowMenu(false);
                              exportToPdf();
                           }}
                           activeOpacity={0.6}
                        >
                           <View style={[styles.menuIconCircle, { backgroundColor: palette.iconCircle }]}>
                              <Upload size={18} color={palette.text} />
                           </View>
                           <Text style={[styles.menuOptionText, { color: palette.text }]}>Export to PDF</Text>
                        </TouchableOpacity>
                     </MotiView>
                  </>
               )}
            </AnimatePresence>
         </View>

         {renderPages()}
         <View style={styles.bottomSpacer} />
      </ScrollView>
   );
});

function getRendererPalette(isDark: boolean) {
   return {
      text: isDark ? '#FFFFFF' : '#0F172A',
      muted: isDark ? '#CBD5E1' : '#475569',
      eyebrow: isDark ? 'rgba(229,231,235,0.62)' : '#64748B',
      card: isDark ? 'rgba(15,23,42,0.84)' : 'rgba(255,255,255,0.92)',
      heroCard: isDark ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.92)',
      sectionCard: isDark ? 'rgba(15,23,42,0.32)' : 'rgba(255,255,255,0.54)',
      chip: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.045)',
      border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.10)',
      pageBorder: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.12)',
      previewShell: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.035)',
      pageShadow: isDark ? 'rgba(0,0,0,0.22)' : 'rgba(15,23,42,0.08)',
      menu: isDark ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.98)',
      iconCircle: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(77,47,178,0.10)',
      skeleton: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.14)',
      skeletonSoft: isDark ? 'rgba(255,255,255,0.065)' : 'rgba(15,23,42,0.08)',
   };
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   scrollContent: {
      paddingTop: 8,
      paddingBottom: 28,
      paddingHorizontal: 12,
   },
   inlineHeader: {
      marginBottom: 10,
   },
   inlineHeaderTitle: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '900',
   },
   inlineHeaderSubtitle: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '600',
   },
   sectionContainer: {
      marginBottom: 14,
      paddingTop: 20,
      paddingBottom: 2,
   },
   sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 0,
      marginBottom: 8,
   },
   sectionEyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 4,
   },
   sectionHeader: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '900',
   },
   sectionCount: {
      fontSize: 12,
      fontWeight: '800',
      paddingHorizontal: 10,
      paddingVertical: 6,
   },
   pagesRow: {
      gap: 10,
   },
   pagesWrapper: {},
   pageWrapper: {
      alignItems: 'center',
      marginBottom: 12,
      borderRadius: 20,
      overflow: "hidden"
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
      borderRadius: 20,
      marginTop: 20,
      borderWidth: 1,
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
      padding: 16,
      minHeight: 420,
      height: 500,
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
      marginBottom: 12,
   },
   section: {
      marginBottom: 12,
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
      fontWeight: '900',
   },
   bulletDot: {
      width: 3,
      height: 3,
      borderRadius: 999,
      backgroundColor: '#333',
      marginTop: 6,
      marginRight: 8,
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
      padding: 16,
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
      padding: 15,
      borderRadius: 18,
      marginVertical: 10,
      marginHorizontal: 16,
      alignItems: 'center',
      borderWidth: 1,
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
      padding: 16,
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
   topActions: {
      position: 'absolute',
      top: 24,
      left: 0,
      right: 25,
      bottom: 0,
      zIndex: 1000,
      alignItems: 'flex-end',
   },
   actionButton: {
      width: 42,
      height: 42,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      overflow: 'hidden',
   },
   dropdownMenuWrapper: {
      position: 'absolute',
      top: 50,
      right: 0,
      width: 200,
      borderRadius: 22,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 12,
      zIndex: 2001,
      padding: 6,
      display: "flex",
      gap: 4,
      borderWidth: 1,
      overflow: 'hidden',
   },
   menuOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, .05)',
      gap: 14,
   },
   menuIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
   },
   menuOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#eee',
      letterSpacing: 0.3,
   },
   exportOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
   },
   exportText: {
      color: 'white',
      marginTop: 15,
      fontSize: 16,
      fontWeight: '600',
   },
});

export default BusinessPlanRenderer





