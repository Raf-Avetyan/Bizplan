import { FlashList } from '@shopify/flash-list';
import LottieView from 'lottie-react-native';
import { Sparkles, RefreshCw } from 'lucide-react-native';
import { MotiView } from 'moti';
import { View, TouchableOpacity, Text } from 'react-native';

interface IUniqueIdeas {
   isGeneratingIdeas: boolean,
   handleGenerateUniqueTags: () => Promise<void>
   generatedIdeas: string[]
   generateUniqueIdeasItem: ({ item, index }: {
      item: string;
      index: number;
   }) => React.JSX.Element
}

export default function UniqueIdeas(
   {
      isGeneratingIdeas,
      handleGenerateUniqueTags,
      generatedIdeas,
      generateUniqueIdeasItem
   }: IUniqueIdeas) {
   return <View>
      {isGeneratingIdeas ? (
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
               Յուրահատուկությունների ստեղծում...
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
                  Յուրահատուկություններ ձեզ համար:
               </Text>
            </View>
            <TouchableOpacity
               onPress={() => handleGenerateUniqueTags()}
            >
               <RefreshCw size={20} color="#8645ff" />
            </TouchableOpacity>
         </View>
      )}
      {!isGeneratingIdeas && (
         <MotiView
            from={{
               opacity: 0,
               height: 0,
            }}
            animate={{
               opacity: 1,
               height:
                  generatedIdeas.length >= 4
                     ? 160
                     : generatedIdeas.length == 3
                        ? 120
                        : generatedIdeas.length == 2
                           ? 80
                           : generatedIdeas.length == 1
                              ? 40
                              : 0,
            }}
            transition={{
               type: "timing",
               duration: 500,
            }}
            style={{
               height:
                  generatedIdeas.length < 12
                     ? 160
                     : generatedIdeas.length == 3
                        ? 120
                        : generatedIdeas.length == 2
                           ? 80
                           : generatedIdeas.length == 1
                              ? 40
                              : 0,
               marginBottom: generatedIdeas.length ? 20 : 0,
            }}
         >
            <FlashList
               data={generatedIdeas}
               renderItem={generateUniqueIdeasItem}
               scrollEnabled={true}
            />
         </MotiView>
      )}
   </View>
}