import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import CoverPage from '../business-plan-pages/CoverPage';
import { StyleSheet } from 'react-native';
import { Company } from '@/types/company.types';
import { UseMutationResult } from '@tanstack/react-query';
import { CardDataItem } from '@/constants/DashboardCardData';
import { getRelativeTime } from '@/utils/time-utils';

interface CardProps {
   data: CardDataItem;
   companyData: Company;
   isCreatingBizPlan: boolean;
   addBusinessPlan: UseMutationResult<Company, Error, {
      companyId: string;
      data: any;
   }, unknown>;
}

const Card = ({ data, companyData, isCreatingBizPlan, addBusinessPlan }: CardProps) => {
   const isGeneratableCheck = (data.type === "business-plan" || data.type === "financials");
   const isGenerating = isCreatingBizPlan || addBusinessPlan.isPending;

   const creationTime = getRelativeTime(companyData.createdAt);

   return (
      <TouchableOpacity style={styles.card} onPress={() =>
         router.push(data.path)
      }>
         <View style={[styles.cardTop, { opacity: isGenerating && isGeneratableCheck ? 0.6 : 1 }]}>
            {data.type === 'business-plan' ? (
               <View style={styles.pageWrapper}>
                  <View style={styles.pageContainer}>
                     <View style={styles.page}>
                        <CoverPage company={companyData} size='small' />
                     </View>
                  </View>
                  <View style={[styles.page, styles.backPageOne]}></View>
                  <View style={[styles.page, styles.backPageTwo]}></View>
               </View>
            ) : (
               <Image source={data.thumbnail} style={{ height: "100%", width: "100%", borderRadius: 8, resizeMode: "contain" }} />
            )}
         </View>

         <View style={styles.cardBottom}>
            <View>
               <Text style={styles.cardBottomTitle}>{data.title}</Text>
               {data.description && (
                  <Text style={styles.cardBottomDesc}>{data.description}</Text>
               )}

               {!isGenerating && isGeneratableCheck && (<Text style={styles.timeAgoText}>{creationTime}</Text>)}
            </View>

            {(isGenerating && (data.type === "business-plan" || data.type === "financials")) && (
               <View style={styles.cardLoadingContainer}>
                  <LottieView
                     source={require("@/assets/lottie/simple-loading.json")}
                     autoPlay
                     loop
                     style={{ width: 20, height: 20 }}
                  />
                  <Text style={{ color: "rgba(255, 255, 255, .5)" }}>Generating..</Text>
               </View>
            )}
         </View>
      </TouchableOpacity>
   );
};

const styles = StyleSheet.create({
   cardTop: {
      borderColor: "rgba(255, 255, 255, .1)",
      borderWidth: 1,
      backgroundColor: "rgba(255, 255, 255, .03)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 6,
      borderRadius: 12,
      height: 120,
   },
   cardBottom: {
      paddingTop: 8,
      display: "flex",
      paddingLeft: 2,
   },
   cardBottomTitle: {
      color: "white",
      marginBottom: 2,
      fontWeight: "600",
   },
   cardBottomDesc: {
      color: "rgba(255, 255, 255, .5)",
      fontSize: 12,
      marginBottom: 4,
   },
   timeAgoText: {
      color: "rgba(255, 255, 255, 0.3)",
      fontSize: 11,
      marginTop: 4,
   },
   cardLoadingContainer: {
      display: "flex",
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      marginTop: 4,
   },
   card: {
      width: "48%"
   },
   pageWrapper: {
      width: "45%",
      position: "relative",
   },
   page: {
      backgroundColor: '#ffffff',
      height: "100%",
      padding: 8,
      borderColor: "rgba(0, 0, 0, .1)",
      borderWidth: 1
   },
   pageContainer: {
      position: 'relative',
      overflow: "hidden",
      borderRadius: 8
   },
   backPageOne: {
      position: "absolute",
      width: "100%",
      top: 0,
      left: 6,
      backgroundColor: "#fff",
      zIndex: -1,
      transform: [{ scaleY: .95 }],
      borderRadius: 8,
      borderColor: "rgba(0, 0, 0, .1)",
      borderWidth: 1,
   },
   backPageTwo: {
      position: "absolute",
      width: "100%",
      top: 0,
      left: 11,
      backgroundColor: "#fff",
      zIndex: -2,
      transform: [{ scaleY: .9 }],
      borderRadius: 8,
      borderColor: "rgba(0, 0, 0, .1)",
      borderWidth: 1
   },
   cardsGrid: {
      display: "flex",
      gap: 14,
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 10
   }
});

export default Card;