import { FlashList } from '@shopify/flash-list';
import LottieView from 'lottie-react-native';
import { Sparkles, RefreshCw } from 'lucide-react-native';
import { MotiView } from 'moti';
import { View, TouchableOpacity, Text } from 'react-native';

interface IBusinessIdea {
   isGeneratingBusinessIdeas: boolean
   handleGenerateBusinessIdeas: () => Promise<void>
   generatedBusinessIdeas: string[]
   generateBusinessIdeasItem: ({ item, index }: {
      item: string;
      index: number;
   }) => React.JSX.Element
}

export default function BusinessIdea({
   isGeneratingBusinessIdeas,
   handleGenerateBusinessIdeas,
   generatedBusinessIdeas,
   generateBusinessIdeasItem
}: IBusinessIdea) {
   return <View>
      {isGeneratingBusinessIdeas ? (
         <View className="flex flex-row items-center py-4 gap-2">
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
               Գաղափարների ստեղծում...
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
                  Գաղափարներ ձեր բիզնեսի համար:
               </Text>
            </View>
            <TouchableOpacity
               onPress={() => handleGenerateBusinessIdeas()}
            >
               <RefreshCw size={20} color="#8645ff" />
            </TouchableOpacity>
         </View>
      )}
      {!isGeneratingBusinessIdeas && (
         <MotiView
            from={{
               opacity: 0,
               height: 0,
            }}
            animate={{
               opacity: 1,
               height: generatedBusinessIdeas.length ? 160 : 0,
            }}
            transition={{
               type: "timing",
               duration: 500,
            }}
            style={{
               height: 40,
               marginBottom: generatedBusinessIdeas.length
                  ? 20
                  : 0,
            }}
         >
            <FlashList
               data={generatedBusinessIdeas}
               renderItem={generateBusinessIdeasItem}
               scrollEnabled={true}
            />
         </MotiView>
      )}
   </View>
}