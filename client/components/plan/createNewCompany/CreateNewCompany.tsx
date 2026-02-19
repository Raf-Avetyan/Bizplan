import LottieView from "lottie-react-native";
import React, { useState, useEffect } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Plus } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { MotiView } from "moti";
import { useAiChat } from "@/hooks/Chat/useAiChat";
import BusinessName from './tabs/BusinessName';
import BusinessIdea from './tabs/BusinessIdea';
import SliderButton from './ui/buttons/SliderButton';
import UniqueIdeas from './tabs/UniqueIdeas';
import OurPolicyInfo from './ui/OurPolicyInfo';
import { router } from 'expo-router';
import { useCreateCompany } from '@/hooks/useCompanyQueries';

export default function CreateNewCompany() {
   const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
   const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
   const [generatedBusinessNames, setGeneratedBusinessNames] = useState<string[]>([]);
   const [generatedBusinessIdeas, setGeneratedBusinessIdeas] = useState<string[]>([]);
   const [isGeneratingBusinessIdeas, setIsGeneratingBusinessIdeas] = useState(false);
   const [isGeneratingBusinessNames, setIsGeneratingBusinessNames] = useState(false);
   const [tabs, setTabs] = useState<["idea", "place", "unique", "businessName"]>(["idea", "place", "unique", "businessName"]);
   const [activeTab, setActiveTab] = useState<{
      name: "idea" | "place" | "unique" | "businessName"; id: number
   }>({ name: "idea", id: 0 });

   const chat = useAiChat({ history: [] });
   const createCompanyMutation = useCreateCompany();

   const lottieAnimations = {
      idea: { id: 0, url: require("@/assets/lottie/idea.json") },
      place: { id: 1, url: require("@/assets/lottie/locaton.json") },
      unique: { id: 2, url: require("@/assets/lottie/fingerprint.json") },
      businessName: { id: 3, url: require("@/assets/lottie/name.json") },
   };

   const [inputText, setInputText] = useState<{
      idea: string;
      place: string;
      uniqueTags: string[];
      businessName: string;
   }>({ idea: "", place: "", uniqueTags: [], businessName: "" });

   const handleSwipe = (event: any) => {
      if (event.nativeEvent.state === State.END) {
         const { translationX } = event.nativeEvent;

         if (translationX < -10) {
            setActiveTab((prev) => {
               const currentIndex = tabs.indexOf(prev.name);
               const nextIndex = (currentIndex + 1) % tabs.length;

               if (tabs[currentIndex] === "idea" && inputText.idea.trim().length >= 5) return { name: tabs[nextIndex], id: nextIndex }
               if (tabs[currentIndex] === "place" && inputText.place.trim().length) return { name: tabs[nextIndex], id: nextIndex }
               if (tabs[currentIndex] === "unique" && inputText.uniqueTags.length >= 3) return { name: tabs[nextIndex], id: nextIndex }
               if (tabs[currentIndex] === "businessName" && inputText.businessName.trim().length >= 5) {
                  return { name: tabs[nextIndex], id: nextIndex };
               }

               return { name: tabs[currentIndex], id: currentIndex };
            });
         } else if (translationX > 10) {
            setActiveTab((prev) => {
               const currentIndex = tabs.indexOf(prev.name);
               const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;

               if (tabs[prevIndex] === "idea" && inputText.idea.trim().length >= 5) return { name: tabs[prevIndex], id: prevIndex }
               if (tabs[prevIndex] === "place" && inputText.place.trim().length) return { name: tabs[prevIndex], id: prevIndex }
               if (tabs[prevIndex] === "unique" && inputText.uniqueTags.length >= 3) return { name: tabs[prevIndex], id: prevIndex }
               if (tabs[prevIndex] === "businessName" && inputText.businessName.trim().length) {
                  return { name: tabs[prevIndex], id: prevIndex };
               }

               return { name: tabs[currentIndex], id: currentIndex };
            });
         }
      }
   };

   const handleCreateCompany = async () => {
      try {
         await createCompanyMutation.mutateAsync({
            businessName: inputText.businessName,
            place: inputText.place,
            idea: inputText.idea,
            uniqueTags: inputText.uniqueTags,
         });

         router.push("/(root)/(tabs)/(dashboard)")
      } catch (error: any) {
         Alert.alert("Error", "Failed to create company");
      }
   };

   function handleInputText(value: string) {
      if (activeTab.name === "idea") setInputText((prev) => ({ ...prev, idea: value }))
      if (activeTab.name === "place") setInputText((prev) => ({ ...prev, place: value }))
      if (activeTab.name === "unique") {
         setInputText((prev) => ({
            ...prev,
            uniqueTags: value.length === 0 ? [] : value.split(","),
         }));
      }
      if (activeTab.name === "businessName") setInputText((prev) => ({ ...prev, businessName: value }))
   }

   useEffect(() => {
      handleGenerateUniqueTags();
      handleGenerateBusinessNames();
      handleGenerateBusinessIdeas();
   }, [activeTab.name]);

   const handleGenerateUniqueTags = async () => {
      if (activeTab.name === "unique") {
         try {
            setIsGeneratingIdeas(true);

            const response = await chat.sendMessage({
               message: `Say 12 unique business characteristics, separate them by comma without numbers, in three or four words that make ${inputText.idea
                  } business unique in ${inputText.place
                  }, say only the uniqueness without explanation, and do not say similar ones like ${generatedIdeas
                     .map((word) => `${word}`)
                     .join(
                        ",",
                     )}. Say in Armenian language without translation in English, And do not say anything else in your answer.`,
            });

            if (response?.text) {
               const aiText = response.text;
               const generatedIdeas = aiText.split(/,\s*/);
               setGeneratedIdeas(generatedIdeas);
            }
         } finally {
            setIsGeneratingIdeas(false);
         }
      }
   };

   const handleGenerateBusinessNames = async () => {
      if (activeTab.name === "businessName") {
         try {
            setIsGeneratingBusinessNames(true);

            const response = await chat.sendMessage({
               message: `Say 12 unique names in English (translation in Armenian in parentheses) for ${inputText.idea
                  } business, separate them by comma without numbers, say only the names without explanation, and do not say similar ones like ${generatedBusinessNames
                     .map((word) => `${word}`)
                     .join(
                        ",",
                     )}. And do not say anything else in your answer.`,
            });

            if (response?.text) {
               const aiText = response.text;
               const generatedBusinessNames = aiText.split(/,\s*/);
               setGeneratedBusinessNames(generatedBusinessNames);
            }
         } finally {
            setIsGeneratingBusinessNames(false);
         }
      }
   };

   const handleGenerateBusinessIdeas = async () => {
      if (activeTab.name === "idea") {
         try {
            setIsGeneratingBusinessIdeas(true);

            const response = await chat.sendMessage({
               message: `Say 12 business ideas in three or four words in Armenian, separate them by comma without numbers, say only the ideas without explanation, and do not say similar ones like ${generatedBusinessIdeas
                  .map((word) => `${word}`)
                  .join(
                     ",",
                  )}. And do not say anything else in your answer.`,
            });

            if (response?.text) {
               const aiText = response.text;
               const generatedBusinessIdeas = aiText.split(/,\s*/);

               setGeneratedBusinessIdeas(generatedBusinessIdeas);
            }
         } finally {
            setIsGeneratingBusinessIdeas(false);
         }
      }
   };

   const generateUniqueIdeasItem = ({ item, index }: { item: string; index: number; }) => (
      <MotiView
         from={{ opacity: 0, scale: 0.5, translateY: 10, }}
         animate={{ opacity: 1, scale: 1, translateY: 0 }}
         transition={{ type: "timing", duration: 500, delay: index * 100 }}
      >
         <TouchableOpacity
            onPress={() => {
               setInputText((prev) => ({
                  ...prev,
                  uniqueTags: [
                     ...prev.uniqueTags,
                     generatedIdeas[index].trim().replace(/^[, ]+|[, ]+$/g, ""),
                  ],
               }));

               setGeneratedIdeas((prev) => prev.toSpliced(index, 1));
            }}
            className="px-3 py-2 bg-white/10 rounded-lg mb-2 flex flex-row items-center justify-between"
         >
            <View className="max-w-[80%]">
               <Text
                  className="text-white text-[14px] font-Arm_Hmks_Bebas_Neue"
                  numberOfLines={1}
                  ellipsizeMode="tail"
               >
                  {item}
               </Text>
            </View>
            <View>
               <Plus color="#8645ff" size={20} />
            </View>
         </TouchableOpacity>
      </MotiView>
   );

   const generateBusinessNamesItem = ({ item, index }: { item: string; index: number }) => (
      <MotiView
         from={{ opacity: 0, scale: 0.5, translateY: 10 }}
         animate={{ opacity: 1, scale: 1, translateY: 0 }}
         transition={{ type: "timing", duration: 500, delay: index * 100 }}
      >
         <TouchableOpacity
            onPress={() => {
               setInputText((prev) => ({
                  ...prev,
                  businessName: item.trim(),
               }));

               setGeneratedBusinessNames([]);
            }}
            className="px-3 py-2 bg-white/10 rounded-lg mb-2 flex flex-row items-center justify-between"
         >
            <View className="max-w-[80%]">
               <Text
                  className="text-white text-[14px] font-Arm_Hmks_Bebas_Neue"
                  numberOfLines={1}
                  ellipsizeMode="tail"
               >
                  {item}
               </Text>
            </View>
            <View>
               <Plus color="#8645ff" size={20} />
            </View>
         </TouchableOpacity>
      </MotiView>
   );

   const generateBusinessIdeasItem = ({ item, index }: { item: string; index: number }) => (
      <MotiView
         from={{ opacity: 0, scale: 0.5, translateY: 10 }}
         animate={{ opacity: 1, scale: 1, translateY: 0 }}
         transition={{ type: "timing", duration: 500, delay: index * 100 }}
      >
         <TouchableOpacity
            onPress={() => {
               setInputText((prev) => ({
                  ...prev,
                  idea: item.trim(),
               }));

               setGeneratedBusinessIdeas([]);
               setInputText((prev) => ({
                  ...prev,
                  uniqueTags: [],
                  businessName: "",
               }));
            }}
            className="px-3 py-2 bg-white/10 rounded-lg mb-2 flex flex-row items-center justify-between"
         >
            <View className="max-w-[80%]">
               <Text
                  className="text-white text-[14px] font-Arm_Hmks_Bebas_Neue"
                  numberOfLines={1}
                  ellipsizeMode="tail"
               >
                  {item}
               </Text>
            </View>
            <View>
               <Plus color="#8645ff" size={20} />
            </View>
         </TouchableOpacity>
      </MotiView>
   );

   const isNextDisabled = (() => {
      if (activeTab.name === "idea") return inputText.idea.trim().length < 5
      if (activeTab.name === "place") return inputText.place.trim().length === 0
      if (activeTab.name === "unique") return inputText.uniqueTags.length < 3
      if (activeTab.name === "businessName") {
         return (
            inputText.businessName.trim().length < 3 ||
            inputText.idea.trim().length < 5 ||
            inputText.place.trim().length === 0 ||
            inputText.uniqueTags.length < 3
         );
      }

      return false;
   })();

   return (
      <View className="flex flex-col justify-center items-center gap-2 pt-2 pb-8">
         <View
            className={cn(
               "flex flex-row items-center justify-center w-[90%] relative h-9 gap-2",
               {
                  "justify-center": activeTab.id < 1,
               },
            )}
         >
            {[...Array.from({ length: 4 })].map((_, index) => {
               const targetTab = tabs[index];
               const canGo = (() => {
                  const { idea, place, uniqueTags, businessName } = inputText;

                  if (targetTab === "idea") return true;
                  if (targetTab === "place") return idea.trim().length >= 5;
                  if (targetTab === "unique") return idea.trim().length >= 5 && place.trim().length > 0;
                  if (targetTab === "businessName")
                     return (
                        idea.trim().length >= 5 &&
                        place.trim().length > 0 &&
                        uniqueTags.length >= 3
                     );
                  return false;
               })();

               return (
                  <TouchableOpacity
                     key={index}
                     onPress={() => {
                        if (!canGo) return;
                        setActiveTab({ name: targetTab as any, id: index });
                     }}
                     style={{
                        width: 35,
                        height: activeTab.id === index ? 6 : 5,
                        backgroundColor: activeTab.id === index ? "#e2e1df" : "#e2e1df49",
                        opacity: canGo ? 1 : 0.3,
                     }}
                     className="rounded-full"
                  ></TouchableOpacity>
               );
            })}
         </View>
         <PanGestureHandler onHandlerStateChange={handleSwipe}>
            <View className="border border-white/20 py-4 min-h-[350px] rounded-[18px] w-[90%] overflow-hidden px-5">
               <View>
                  <View className="flex justify-center items-center">
                     <LottieView
                        source={lottieAnimations[activeTab.name].url}
                        autoPlay
                        loop
                        style={{ width: 220, height: 200 }}
                     />
                  </View>
                  <View className="flex flex-col">
                     <View>
                        <Text className="text-white text-[34px] text-center font-Arm_Hmks_Bebas_Neue">
                           {activeTab.name === "idea" && "Ինչ է ձեր բիզնես \n գաղափարը?"}
                           {activeTab.name === "place" && "Որտեղ եք կզբաղվելու \n բիզնեսով?"}
                           {activeTab.name === "unique" && "Ի՞նչն է դարձնում ձեր \n բիզնեսը յուրահատուկ?"}
                           {activeTab.name === "businessName" && "Ինչպես կարող է անվանվել \n ձեր բիզնեսը?"}
                        </Text>
                     </View>
                     <TextInput
                        onChange={e => handleInputText(e.nativeEvent.text)}
                        multiline
                        value={
                           activeTab.name === "idea"
                              ? inputText.idea
                              : activeTab.name === "place"
                                 ? inputText.place
                                 : activeTab.name === "unique"
                                    ? inputText.uniqueTags
                                       .map((tag) => tag.trim())
                                       .join(", ")
                                    : activeTab.name === "businessName"
                                       ? inputText.businessName
                                       : ""
                        }
                        numberOfLines={3}
                        placeholder={`${activeTab.name === "idea"
                           ? "Օր.՝ օնլայն խանութ, հավելված, ծառայություն..."
                           : activeTab.name === "place"
                              ? "Օր․՝ Երևան, Հայաստան"
                              : activeTab.name === "unique"
                                 ? "Օր․՝ ամբողջովին բնական բաղադրիչներ, ջերմ մթնոլորտ..."
                                 : "Օր․՝ բիզնեսի անվանում"
                           } `}
                        className={cn(
                           "px-4 border border-white/10 py-[16px] rounded-[8px] placeholder:text-white/20 placeholder:font-Arm_Hmks_Bebas_Neue text-white mt-5",
                           {
                              "mb-5":
                                 !isGeneratingIdeas &&
                                 !isGeneratingBusinessNames &&
                                 !isGeneratingBusinessIdeas
                           },
                        )}
                     />
                     {activeTab.name === "unique" && (
                        <UniqueIdeas
                           isGeneratingIdeas={isGeneratingIdeas}
                           handleGenerateUniqueTags={handleGenerateUniqueTags}
                           generatedIdeas={generatedIdeas}
                           generateUniqueIdeasItem={generateUniqueIdeasItem}
                        />
                     )}
                     {activeTab.name === "businessName" && (
                        <BusinessName
                           isGeneratingBusinessNames={isGeneratingBusinessNames}
                           handleGenerateBusinessNames={handleGenerateBusinessNames}
                           generatedBusinessNames={generatedBusinessNames}
                           generateBusinessNamesItem={generateBusinessNamesItem}
                        />
                     )}
                     {activeTab.name === "idea" && (
                        <BusinessIdea
                           isGeneratingBusinessIdeas={isGeneratingBusinessIdeas}
                           handleGenerateBusinessIdeas={handleGenerateBusinessIdeas}
                           generatedBusinessIdeas={generatedBusinessIdeas}
                           generateBusinessIdeasItem={generateBusinessIdeasItem}
                        />
                     )}
                     <SliderButton
                        isNextDisabled={isNextDisabled}
                        setActiveTab={setActiveTab}
                        inputText={inputText}
                        activeTab={activeTab}
                        isLoading={createCompanyMutation.isPending}
                        onCreate={handleCreateCompany}
                     />
                  </View>
               </View>
            </View>
         </PanGestureHandler>
         <OurPolicyInfo />
      </View>
   );
}