import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { ArrowRight, BarChart3, BriefcaseBusiness, Compass, Lightbulb, Presentation } from 'lucide-react-native';
import { Company } from '@/types/company.types';
import { UseMutationResult } from '@tanstack/react-query';
import { CardDataItem } from '@/constants/DashboardCardData';
import { getRelativeTime } from '@/utils/time-utils';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '@/lib/settings-context';

interface CardProps {
   data: CardDataItem;
   companyData: Company;
   isCreatingBizPlan: boolean;
   addBusinessPlan: UseMutationResult<Company, Error, {
      companyId: string;
      data: any;
   }, unknown>;
}

function getPreviewIcon(type: string) {
   switch (type) {
      case 'business-plan':
         return BriefcaseBusiness;
      case 'financials':
         return BarChart3;
      case 'pitch-desk':
         return Presentation;
      case 'radar':
         return Compass;
      default:
         return Lightbulb;
   }
}

const Card = ({ data, companyData, isCreatingBizPlan, addBusinessPlan }: CardProps) => {
   const { settings } = useSettings();
   const colorScheme = useColorScheme();
   const resolvedTheme =
      settings.theme === 'system' ? (colorScheme === 'light' ? 'light' : 'dark') : settings.theme;
   const isDark = resolvedTheme === 'dark';
   const palette = getToolCardPalette(isDark);
   const t = getToolCardCopy(settings.language);
   const isGeneratableCard = data.type === 'business-plan';
   const isGenerating = isCreatingBizPlan || addBusinessPlan.isPending;
   const creationTime = getRelativeTime(companyData.createdAt);
   const createdDate = new Date(companyData.createdAt).toLocaleDateString(t.locale, {
      month: 'short',
      day: 'numeric',
   });
   const PreviewIcon = getPreviewIcon(data.type);
   const translatedTitle = t.titles[data.type] ?? data.title;
   const translatedDescription = t.descriptions[data.type] ?? data.description ?? t.openTool;

   return (
      <TouchableOpacity
         style={styles.cardPressable}
         activeOpacity={0.92}
         onPress={() => router.push(data.path)}
      >
         <LinearGradient
            colors={palette.outerGlow}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.outerGlow}
         >
            <LinearGradient
               colors={palette.cardGradient}
               start={{ x: 0, y: 0 }}
               end={{ x: 1, y: 1 }}
               style={[styles.card, { borderColor: palette.border }]}
            >
               <View
                  style={[
                     styles.cardTop,
                     {
                        opacity: isGenerating && isGeneratableCard ? 0.62 : 1,
                        backgroundColor: palette.previewBackground,
                        borderColor: palette.previewBorder,
                     },
                  ]}
               >
                  <LinearGradient
                     colors={palette.previewGradient}
                     start={{ x: 0, y: 0 }}
                     end={{ x: 1, y: 1 }}
                     style={styles.previewContainer}
                  >
                     <View style={styles.previewHeader}>
                        <View style={[styles.previewIconWrap, { backgroundColor: palette.iconBackground }]}>
                           <PreviewIcon size={28} color="#E6B84C" strokeWidth={2.2} />
                        </View>
                        <View style={[styles.previewHighlight, { backgroundColor: palette.highlight }]} />
                     </View>

                     <View style={styles.previewSkeletonRow}>
                        <View style={[styles.previewSkeletonLine, { backgroundColor: palette.skeleton }]} />
                        <View style={[styles.previewSkeletonLine, { backgroundColor: palette.skeleton }]} />
                        <View style={[styles.previewSkeletonLine, { backgroundColor: palette.skeleton }]} />
                        <View style={[styles.previewSkeletonLine, { backgroundColor: palette.skeleton }]} />
                     </View>
                     <View style={[styles.previewSkeletonRow, styles.previewSkeletonRowSecond]}>
                        <View style={[styles.previewSkeletonLineWide, { backgroundColor: palette.skeletonSoft }]} />
                        <View style={[styles.previewSkeletonLine, { backgroundColor: palette.skeleton }]} />
                        <View style={[styles.previewSkeletonLineWide, { backgroundColor: palette.skeletonSoft }]} />
                     </View>

                     <View style={[styles.previewBadge, { backgroundColor: palette.badgeBackground, borderColor: palette.badgeBorder }]}>
                        <Text style={[styles.previewBadgeText, { color: palette.badgeText }]}>{t.previewLabels[data.type] ?? t.tool}</Text>
                     </View>
                  </LinearGradient>

               </View>

               <View style={[styles.separatorLine, { backgroundColor: palette.separator }]} />

               <View style={styles.cardBottom}>
                  <View style={styles.titleRow}>
                     <Text style={[styles.cardBottomTitle, { color: palette.text }]} numberOfLines={2}>{translatedTitle}</Text>
                     <ArrowRight size={19} color={palette.arrow} />
                  </View>

                  <Text style={[styles.cardBottomDesc, { color: palette.muted }]} numberOfLines={3}>
                     {translatedDescription}
                  </Text>

                  {!isGenerating && isGeneratableCard ? (
                     <Text style={[styles.timeAgoText, { color: palette.meta }]}>{t.ready(createdDate)}</Text>
                  ) : (
                     <Text style={[styles.timeAgoText, { color: palette.meta }]}>{t.updated(creationTime)}</Text>
                  )}

                  {isGenerating && isGeneratableCard ? (
                     <View style={styles.cardLoadingContainer}>
                        <LottieView
                           source={require('@/assets/lottie/simple-loading.json')}
                           autoPlay
                           loop
                           style={{ width: 20, height: 20 }}
                        />
                        <Text style={[styles.generatingText, { color: palette.meta }]}>{t.generating}</Text>
                     </View>
                  ) : null}
               </View>
            </LinearGradient>
         </LinearGradient>
      </TouchableOpacity>
   );
};

function getToolCardPalette(isDark: boolean) {
   return {
      outerGlow: isDark
         ? (["rgba(77,47,178,0.46)", "rgba(24,59,53,0.24)", "rgba(0,255,218,0.26)"] as const)
         : (["rgba(77,47,178,0.20)", "rgba(14,165,233,0.16)", "rgba(16,185,129,0.18)"] as const),
      card: isDark ? 'rgba(9, 15, 28, 0.98)' : 'rgba(255, 255, 255, 0.96)',
      cardGradient: isDark
         ? (['rgba(9, 15, 28, 0.98)', 'rgba(10, 30, 38, 0.98)'] as const)
         : (['rgba(255,255,255,0.98)', 'rgba(239,253,246,0.96)', 'rgba(239,246,255,0.96)'] as const),
      border: isDark ? 'rgba(114, 137, 166, 0.22)' : 'rgba(15, 23, 42, 0.10)',
      previewBackground: isDark ? 'rgba(12, 34, 44, 0.76)' : 'rgba(241, 245, 249, 0.95)',
      previewBorder: isDark ? 'rgba(139, 229, 215, 0.20)' : 'rgba(15, 118, 110, 0.16)',
      previewGradient: isDark
         ? (["rgba(34,38,54,0.96)", "rgba(16,48,45,0.94)"] as const)
         : (["rgba(255,255,255,0.96)", "rgba(226,247,241,0.96)"] as const),
      iconBackground: isDark ? 'rgba(17, 29, 43, 0.58)' : 'rgba(255,255,255,0.80)',
      highlight: isDark ? 'rgba(228, 184, 78, 0.20)' : 'rgba(223, 174, 85, 0.22)',
      skeleton: isDark ? 'rgba(198, 215, 232, 0.14)' : 'rgba(15, 23, 42, 0.12)',
      skeletonSoft: isDark ? 'rgba(198, 215, 232, 0.12)' : 'rgba(15, 23, 42, 0.10)',
      badgeBackground: isDark ? 'rgba(163, 210, 202, 0.22)' : 'rgba(15, 118, 110, 0.12)',
      badgeBorder: isDark ? 'rgba(180, 223, 215, 0.24)' : 'rgba(15, 118, 110, 0.18)',
      badgeText: isDark ? 'rgba(224, 245, 240, 0.86)' : '#0F766E',
      separator: isDark ? 'rgba(62, 84, 104, 0.52)' : 'rgba(15, 23, 42, 0.08)',
      text: isDark ? '#FFFFFF' : '#0F172A',
      muted: isDark ? 'rgba(208, 224, 240, 0.74)' : '#475569',
      meta: isDark ? 'rgba(167, 188, 210, 0.86)' : '#64748B',
      arrow: isDark ? 'rgba(210, 227, 245, 0.86)' : '#334155',
   };
}

function getToolCardCopy(language: 'en' | 'ru' | 'hy') {
   if (language === 'ru') {
      return {
         locale: 'ru-RU',
         tool: 'ИНСТРУМЕНТ',
         openTool: 'Открыть инструмент',
         generating: 'Генерируем...',
         ready: (date: string) => `Готово - ${date}`,
         updated: (time: string) => `Обновлено - ${time}`,
         previewLabels: {
            'business-plan': 'ПЛАН',
            financials: 'ФИНАНСЫ',
            'pitch-desk': 'ПИТЧ',
            radar: 'РАДАР',
            executive: 'ГАЙДЫ',
            competitor: 'АНАЛИЗ',
         } as Record<string, string>,
         titles: {
            'business-plan': 'Бизнес-план',
            financials: 'Финансы',
            'pitch-desk': 'Питч-дек',
            radar: 'Радар',
            executive: 'Гайды',
            competitor: 'Исследование рынка',
         } as Record<string, string>,
         descriptions: {
            'business-plan': 'Резюме, рынок, операции и план роста',
            financials: 'Выручка, расходы, cash flow и финансирование',
            'pitch-desk': 'Подготовьте материалы для инвесторов и партнеров',
            radar: 'Отслеживайте конкурентов, новости, соцсети и события',
            executive: 'Персональные гайды, созданные для вас',
            competitor: 'Аудитория, персоны и отраслевые ориентиры',
         } as Record<string, string>,
      };
   }

   if (language === 'hy') {
      return {
         locale: 'hy-AM',
         tool: 'ԳՈՐԾԻՔ',
         openTool: 'Բացել գործիքը',
         generating: 'Գեներացվում է...',
         ready: (date: string) => `Պատրաստ է - ${date}`,
         updated: (time: string) => `Թարմացված - ${time}`,
         previewLabels: {
            'business-plan': 'ՊԼԱՆ',
            financials: 'ՖԻՆԱՆՍՆԵՐ',
            'pitch-desk': 'ՓԻՉ',
            radar: 'ՌԱԴԱՐ',
            executive: 'ԳԱՅԴԵՐ',
            competitor: 'ՀԵՏԱԶՈՏՈՒՄ',
         } as Record<string, string>,
         titles: {
            'business-plan': 'Բիզնես պլան',
            financials: 'Ֆինանսներ',
            'pitch-desk': 'Pitch deck',
            radar: 'Ռադար',
            executive: 'Գայդեր',
            competitor: 'Շուկայի հետազոտություն',
         } as Record<string, string>,
         descriptions: {
            'business-plan': 'Ամփոփում, շուկա, օպերացիաներ և աճի պլան',
            financials: 'Եկամուտ, ծախսեր, cash flow և ֆինանսավորում',
            'pitch-desk': 'Պատրաստեք նյութեր ներդրողների և գործընկերների համար',
            radar: 'Հետևեք մրցակիցներին, նորություններին, սոցցանցերին և իրադարձություններին',
            executive: 'Ձեզ համար ստեղծված անհատական գայդեր',
            competitor: 'Լսարան, personas և ոլորտային benchmarks',
         } as Record<string, string>,
      };
   }

   return {
      locale: 'en-US',
      tool: 'TOOL',
      openTool: 'Open tool',
      generating: 'Generating...',
      ready: (date: string) => `Ready - ${date}`,
      updated: (time: string) => `Updated - ${time}`,
      previewLabels: {
         'business-plan': 'PLAN',
         financials: 'FINANCIALS',
         'pitch-desk': 'PITCH',
         radar: 'RADAR',
         executive: 'GUIDES',
         competitor: 'RESEARCH',
      } as Record<string, string>,
      titles: {
         'business-plan': 'Business plan',
         financials: 'Financials',
         'pitch-desk': 'Pitch deck',
         radar: 'Radar',
         executive: 'Guides',
         competitor: 'Market research',
      } as Record<string, string>,
      descriptions: {
         'business-plan': 'Executive summary, market, operations, and growth plan',
         financials: 'Revenue, costs, cash flow, and funding overview',
         'pitch-desk': 'Secure funding and impress partners',
         radar: 'Track competitors, news, social media, and local events',
         executive: 'Bespoke guides generated just for you',
         competitor: 'Audience, personas, and industry benchmarks',
      } as Record<string, string>,
   };
}

const styles = StyleSheet.create({
   cardPressable: {
      width: '100%',
      borderRadius: 26,
   },
   outerGlow: {
      borderRadius: 26,
      padding: 1,
      shadowColor: '#00FFDA',
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
   },
   card: {
      width: '100%',
      borderRadius: 25,
      borderWidth: 1,
      borderColor: 'rgba(114, 137, 166, 0.22)',
      backgroundColor: 'rgba(9, 15, 28, 0.98)',
      overflow: 'hidden',
   },
   cardTop: {
      height: 178,
      marginHorizontal: 18,
      marginTop: 18,
      marginBottom: 16,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(139, 229, 215, 0.20)',
      backgroundColor: 'rgba(12, 34, 44, 0.76)',
      position: 'relative',
   },
   previewContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingVertical: 18,
      justifyContent: 'flex-start',
   },
   previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   previewIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: 'rgba(17, 29, 43, 0.58)',
      alignItems: 'center',
      justifyContent: 'center',
   },
   previewHighlight: {
      width: 118,
      height: 118,
      borderRadius: 90,
      backgroundColor: 'rgba(228, 184, 78, 0.20)',
      position: 'absolute',
      left: 42,
      top: -32,
   },
   previewSkeletonRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 42,
   },
   previewSkeletonRowSecond: {
      marginTop: 9,
   },
   previewSkeletonLine: {
      height: 8,
      flex: 1,
      borderRadius: 999,
      backgroundColor: 'rgba(198, 215, 232, 0.14)',
   },
   previewSkeletonLineWide: {
      height: 8,
      flex: 1.3,
      borderRadius: 999,
      backgroundColor: 'rgba(198, 215, 232, 0.12)',
   },
   previewBadge: {
      alignSelf: 'flex-end',
      marginTop: 17,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: 'rgba(180, 223, 215, 0.24)',
      backgroundColor: 'rgba(163, 210, 202, 0.22)',
   },
   previewBadgeText: {
      color: 'rgba(224, 245, 240, 0.86)',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.7,
   },
   separatorLine: {
      height: 1,
      backgroundColor: 'rgba(62, 84, 104, 0.52)',
   },
   cardBottom: {
      paddingHorizontal: 24,
      paddingTop: 22,
      paddingBottom: 24,
      gap: 10,
   },
   titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
   },
   cardBottomTitle: {
      flex: 1,
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 32,
      lineHeight: 36,
      letterSpacing: -0.4,
   },
   cardBottomDesc: {
      color: 'rgba(208, 224, 240, 0.74)',
      fontSize: 15,
      lineHeight: 22,
      minHeight: 44,
   },
   timeAgoText: {
      color: 'rgba(167, 188, 210, 0.86)',
      fontSize: 13,
      marginTop: 2,
      fontWeight: '600',
   },
   cardLoadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
   },
   generatingText: {
      color: 'rgba(191, 213, 231, 0.78)',
      fontSize: 14,
      fontWeight: '600',
   },
});

export default Card;




