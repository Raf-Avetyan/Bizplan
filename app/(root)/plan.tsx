import LottieView from "lottie-react-native";
import React, { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  NativeSyntheticEvent,
  TextInputChangeEventData,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { cn } from "@/lib/utils";
import { useAnimatedKeyboard, useAnimatedStyle } from "react-native-reanimated";
import { MotiView } from "moti";
import { GoogleGenAI } from "@google/genai";
import LottieLoading from "@/components/ui/LottieLoading/LottieLoading";
import { useIsKeyboardVisible } from "@/hooks/useIsKeyboardVisible";
import { RootStackParamList } from "@/types/navigation.types";
import { FlashList } from "@shopify/flash-list";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyDuVCs_kbbaAeAo8kHr4OGBOVIvnnlRxAk",
});

export default function PlanScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [generatedBusinessNames, setGeneratedBusinessNames] = useState<
    string[]
  >([]);
  const [generatedBusinessIdeas, setGeneratedBusinessIdeas] = useState<
    string[]
  >([]);
  const [isGeneratingBusinessIdeas, setIsGeneratingBusinessIdeas] =
    useState(false);
  const [isGeneratingBusinessNames, setIsGeneratingBusinessNames] =
    useState(false);
  const [tabs, setTabs] = useState<["idea", "place", "unique", "businessName"]>(
    ["idea", "place", "unique", "businessName"]
  );
  const [activeTab, setActiveTab] = useState<{
    name: "idea" | "place" | "unique" | "businessName";
    id: number;
  }>({ name: "idea", id: 0 });

  const keyboard = useAnimatedKeyboard();

  useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboard.height.value }],
  }));

  const chat = ai.chats.create({
    model: "gemini-2.0-flash",
    history: [],
  });

  const [lottieAnimations, setLottieSnimations] = useState({
    idea: { id: 0, url: require("../../assets/lottie/idea.json") },
    place: { id: 1, url: require("../../assets/lottie/locaton.json") },
    unique: { id: 2, url: require("../../assets/lottie/fingerprint.json") },
    businessName: { id: 3, url: require("../../assets/lottie/name.json") },
  });
  const [loadingLottieAnimations, setLoadingLottieAnimations] = useState({
    first: require("../../assets/lottie/business.json"),
    main: require("../../assets/lottie/loading.json"),
  });

  const [inputText, setInputText] = useState<{
    idea: string;
    place: string;
    uniqueTags: string[];
    businessName: string;
  }>({ idea: "", place: "", uniqueTags: [], businessName: "" });

  const generateIdeasItem = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.5,
        translateY: 10,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        translateY: 0,
      }}
      transition={{
        type: "timing",
        duration: 500,
        delay: index * 100,
      }}
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

  const generateBusinessNamesItem = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.5,
        translateY: 10,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        translateY: 0,
      }}
      transition={{
        type: "timing",
        duration: 500,
        delay: index * 100,
      }}
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

  const generateBusinessIdeasItem = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.5,
        translateY: 10,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        translateY: 0,
      }}
      transition={{
        type: "timing",
        duration: 500,
        delay: index * 100,
      }}
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

  const handleSwipe = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;

      if (translationX < -10) {
        setActiveTab((prev) => {
          const currentIndex = tabs.indexOf(prev.name);
          const nextIndex = (currentIndex + 1) % tabs.length;

          if (
            tabs[currentIndex] === "idea" &&
            inputText.idea.trim().length >= 5
          ) {
            return { name: tabs[nextIndex], id: nextIndex };
          }
          if (tabs[currentIndex] === "place" && inputText.place.trim().length) {
            return { name: tabs[nextIndex], id: nextIndex };
          }
          if (
            tabs[currentIndex] === "unique" &&
            inputText.uniqueTags.length >= 3
          ) {
            return { name: tabs[nextIndex], id: nextIndex };
          }
          if (
            tabs[currentIndex] === "businessName" &&
            inputText.businessName.trim().length >= 5
          ) {
            return { name: tabs[nextIndex], id: nextIndex };
          }
          return { name: tabs[currentIndex], id: currentIndex };
        });
      } else if (translationX > 10) {
        setActiveTab((prev) => {
          const currentIndex = tabs.indexOf(prev.name);
          const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;

          if (tabs[prevIndex] === "idea" && inputText.idea.trim().length >= 5) {
            return { name: tabs[prevIndex], id: prevIndex };
          }

          if (tabs[prevIndex] === "place" && inputText.place.trim().length) {
            return { name: tabs[prevIndex], id: prevIndex };
          }
          if (
            tabs[prevIndex] === "unique" &&
            inputText.uniqueTags.length >= 3
          ) {
            return { name: tabs[prevIndex], id: prevIndex };
          }
          if (
            tabs[prevIndex] === "businessName" &&
            inputText.businessName.trim().length
          ) {
            return { name: tabs[prevIndex], id: prevIndex };
          }
          return { name: tabs[currentIndex], id: currentIndex };
        });
      }
    }
  };

  const [isMainVisible, setIsMainVisible] = useState(false);
  const isKeyboardVisible = useIsKeyboardVisible();

  const navigation =
    useNavigation<
      NativeStackScreenProps<RootStackParamList, "Plan">["navigation"]
    >();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      if (isMainVisible) {
        navigation.replace("Dashboard", {
          businessPlanData: {
            idea: inputText.idea,
            place: inputText.place,
            uniqueTags: inputText.uniqueTags,
            businessName: inputText.businessName,
          },
        });
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [isMainVisible]);

  function handleInputText(value: string) {
    if (activeTab.name === "idea") {
      setInputText((prev) => ({ ...prev, idea: value }));
    }
    if (activeTab.name === "place") {
      setInputText((prev) => ({ ...prev, place: value }));
    }
    if (activeTab.name === "unique") {
      setInputText((prev) => ({
        ...prev,
        uniqueTags: value.length === 0 ? [] : value.split(","),
      }));
    }
    if (activeTab.name === "businessName") {
      setInputText((prev) => ({ ...prev, businessName: value }));
    }
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
          message: `Say 12 unique business characteristics, separate them by comma without numbers, in three or four words that make ${
            inputText.idea
          } business unique in ${
            inputText.place
          }, say only the uniqueness without explanation, and do not say similar ones like ${generatedIdeas
            .map((word) => `${word}`)
            .join(
              ","
            )}. Say in Armenian language without translation in English, And do not say anything else in the end of your answer.`,
        });

        if (response?.text) {
          const aiText = response.text;
          const generatedIdeas = aiText.split(/,\s*/);

          setGeneratedIdeas(generatedIdeas);
        }
      } catch (error) {
        console.error("Error sending message:", error);
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
          message: `Say 12 unique names in English (translation in Armenian in parentheses) for ${
            inputText.idea
          } business, separate them by comma without numbers, say only the names without explanation, and do not say similar ones like ${generatedBusinessNames
            .map((word) => `${word}`)
            .join(
              ","
            )}. And do not say anything else in the end of your answer.`,
        });

        if (response?.text) {
          const aiText = response.text;
          const generatedBusinessNames = aiText.split(/,\s*/);

          setGeneratedBusinessNames(generatedBusinessNames);
        }
      } catch (error) {
        console.error("Error sending message:", error);
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
          message: `Say 4 business ideas in three or four words in Armenian, separate them by comma without numbers, say only the ideas without explanation, and do not say similar ones like ${generatedBusinessIdeas
            .map((word) => `${word}`)
            .join(
              ","
            )}. And do not say anything else in the end of your answer.`,
        });

        if (response?.text) {
          const aiText = response.text;
          const generatedBusinessIdeas = aiText.split(/,\s*/);

          setGeneratedBusinessIdeas(generatedBusinessIdeas);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsGeneratingBusinessIdeas(false);
      }
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bluredsecondarybg.jpg")}
      resizeMode="cover"
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <LottieLoading
          isLoading={isLoading}
          navigation={navigation}
          lottieURL={{
            background: require("../../assets/images/bluredsecondarybg.jpg"),
            loading: require("../../assets/lottie/loading.json"),
          }}
        />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute z-50 top-[10px] left-[10px]"
        >
          {!isKeyboardVisible && (
            <ChevronLeft size={36} color="whitesmoke" strokeWidth={1.5} />
          )}
        </TouchableOpacity>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <View className="flex flex-col justify-center items-center gap-4 pt-2 pb-8">
              <View
                style={{ marginBottom: -5 }}
                className={cn(
                  "flex flex-row items-center justify-between w-[90%] relative h-9",
                  {
                    "justify-center": activeTab.id < 1,
                  }
                )}
              >
                <TouchableOpacity
                  className="absolute"
                  style={{
                    display: activeTab.id < 1 ? "none" : "flex",
                  }}
                  onPress={() =>
                    setActiveTab(({ id }) => ({
                      name: tabs[id - 1],
                      id: id - 1,
                    }))
                  }
                >
                  <ChevronLeft size={25} color={"#fff"} />
                </TouchableOpacity>
                <View></View>
                <View className="flex flex-row gap-2 items-center">
                  {[...Array.from({ length: 4 })].map((_, index) => (
                    <TouchableOpacity
                      onPress={() =>
                        setActiveTab({ name: tabs[index], id: index })
                      }
                      className="rounded-full"
                      key={index}
                      style={{
                        width: 35,
                        height: activeTab.id === index ? 6 : 5,
                        backgroundColor:
                          activeTab.id === index ? "#e2e1df" : "#e2e1df49",
                      }}
                    ></TouchableOpacity>
                  ))}
                </View>
                <View style={{ display: activeTab.id < 1 ? "none" : "flex" }} />
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
                          {activeTab.name === "idea" &&
                            "Ինչ է ձեր բիզնես \n գաղափարը?"}
                          {activeTab.name === "place" &&
                            "Որտեղ եք կզբաղվելու \n բիզնեսով?"}
                          {activeTab.name === "unique" &&
                            "Ի՞նչն է դարձնում ձեր \n բիզնեսը յուրահատուկ?"}
                          {activeTab.name === "businessName" &&
                            "Ինչպես կարող է անվանվել \n ձեր բիզնեսը?"}
                        </Text>
                      </View>
                      <TextInput
                        onChange={(
                          e: NativeSyntheticEvent<TextInputChangeEventData>
                        ) => handleInputText(e.nativeEvent.text)}
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
                        placeholder={`${
                          activeTab.name === "idea"
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
                              !isGeneratingBusinessIdeas,
                          }
                        )}
                      />
                      {activeTab.name === "unique" && (
                        <View>
                          {isGeneratingIdeas ? (
                            <View className="flex flex-row items-center">
                              <LottieView
                                source={require("../../assets/lottie/simple-loading.json")}
                                autoPlay
                                loop
                                style={{ width: 50, height: 50 }}
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
                                renderItem={generateIdeasItem}
                                estimatedItemSize={12}
                                scrollEnabled={true}
                              />
                            </MotiView>
                          )}
                        </View>
                      )}
                      {activeTab.name === "businessName" && (
                        <View>
                          {isGeneratingBusinessNames ? (
                            <View className="flex flex-row items-center">
                              <LottieView
                                source={require("../../assets/lottie/simple-loading.json")}
                                autoPlay
                                loop
                                style={{ width: 50, height: 50 }}
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
                                estimatedItemSize={12}
                                scrollEnabled={true}
                              />
                            </MotiView>
                          )}
                        </View>
                      )}
                      {activeTab.name === "idea" && (
                        <View>
                          {isGeneratingBusinessIdeas ? (
                            <View className="flex flex-row items-center">
                              <LottieView
                                source={require("../../assets/lottie/simple-loading.json")}
                                autoPlay
                                loop
                                style={{ width: 50, height: 50 }}
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
                                estimatedItemSize={12}
                                scrollEnabled={true}
                              />
                            </MotiView>
                          )}
                        </View>
                      )}
                      <TouchableOpacity
                        className="flex flex-row items-center justify-center bg-[#01a06d] rounded-[8px] gap-2"
                        onPress={() => {
                          setActiveTab((prevTab) => {
                            let newName = "";
                            if (
                              prevTab.name === "idea" &&
                              inputText.idea.trim().length >= 5
                            )
                              newName = "place";
                            if (
                              prevTab.name === "place" &&
                              inputText.place.trim().length
                            )
                              newName = "unique";
                            if (
                              prevTab.name === "unique" &&
                              inputText.uniqueTags.length >= 3
                            )
                              newName = "businessName";
                            if (
                              prevTab.name === "businessName" &&
                              inputText.businessName.trim().length
                            ) {
                              setIsMainVisible(true);
                              setIsLoading(true);
                            }

                            if (newName === "") {
                              return prevTab;
                            } else {
                              return {
                                name: newName as
                                  | "idea"
                                  | "place"
                                  | "unique"
                                  | "businessName",
                                id: prevTab.id + 1,
                              };
                            }
                          });
                        }}
                      >
                        <Text
                          className="font-Arm_Hmks_Bebas_Neue text-white text-[20px] py-3"
                          style={{ letterSpacing: 1 }}
                        >
                          Հաջորդ
                        </Text>
                        <ChevronRight size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </PanGestureHandler>
              <View className="flex flex-row items-center gap-3">
                <Lock size={16} color="#ffffffaf" />
                <View className="flex flex-col">
                  <Text className="text-white/40 text-[12px] font-Arm_Hmks_Bebas_Neue">
                    Մասնավոր և անվտանգ։ Տեսեք մեր{" "}
                    <Text className="text-blue-700 font-Arm_Hmks_Bebas_Neue">
                      գաղտնիության քաղաքականությունը։
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <StatusBar backgroundColor="#001941" barStyle="light-content" />
      </SafeAreaView>
    </ImageBackground>
  );
}
