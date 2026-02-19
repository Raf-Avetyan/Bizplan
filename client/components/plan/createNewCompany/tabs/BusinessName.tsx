import { FlashList } from '@shopify/flash-list';
import LottieView from 'lottie-react-native';
import { Sparkles, RefreshCw } from 'lucide-react-native';
import { MotiView } from 'moti';
import { View, TouchableOpacity, Text } from 'react-native';

interface IBusinessName {
   isGeneratingBusinessNames: boolean
   generatedBusinessNames: string[]
   handleGenerateBusinessNames: () => Promise<void>
   generateBusinessNamesItem: ({ item, index }: {
      item: string;
      index: number;
   }) => React.JSX.Element
}

export default function BusinessName({
   isGeneratingBusinessNames,
   generatedBusinessNames,
   generateBusinessNamesItem,
   handleGenerateBusinessNames
}: IBusinessName) {
   return <View>
      {isGeneratingBusinessNames ? (
         <View className="flex flex-row items-center  py-4 gap-2">
            <LottieView
               source={require("@/assets/lottie/simple-loading.json")}
               autoPlay
               loop
               style={{ width: 22, height: 22 }}
            />
            <Text
               className=" text-[16px] font-Arm_Hmks_Bebas_Neue tracking-[1px]"
               style={{ color: "#8645ff" }}
            >
               Անվանումների ստեղծում...
            </Text>
         </View>
      ) : (
         <View
            className="flex flex-row items-center justify-between"
            style={{ marginBottom: 20 }}
         >
            <View className="flex flex-row items-center gap-2">
               <Sparkles size={20} color="#8645ff" />
               <Text
                  className="text-[16px] font-Arm_Hmks_Bebas_Neue tracking-[1px]"
                  style={{ color: "#8645ff" }}
               >
                  Անվանումներ ձեր բիզնեսի համար:
               </Text>
            </View>
            <TouchableOpacity
               onPress={() => handleGenerateBusinessNames()}
            >
               <RefreshCw size={20} color="#8645ff" />
            </TouchableOpacity>
         </View>
      )}
      {!isGeneratingBusinessNames && (
         <MotiView
            from={{
               opacity: 0,
               height: 0,
            }}
            animate={{
               opacity: 1,
               height: generatedBusinessNames.length ? 160 : 0,
            }}
            transition={{
               type: "timing",
               duration: 500,
            }}
            style={{
               height: 40,
               marginBottom: generatedBusinessNames.length
                  ? 20
                  : 0,
            }}
         >
            <FlashList
               data={generatedBusinessNames}
               renderItem={generateBusinessNamesItem}
               scrollEnabled={true}
            />
         </MotiView>
      )}
   </View>
}