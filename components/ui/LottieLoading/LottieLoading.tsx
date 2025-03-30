import LottieView from "lottie-react-native";
import { ChevronLeft } from "lucide-react-native";
import {
  View,
  ImageBackground,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/types/navigation.types";
import { loadingStyles } from "@/app/(root)";

type LottieLoadingProps = {
  isLoading: boolean;
  navigation?: NativeStackScreenProps<
    RootStackParamList,
    "Home" | "Plan" | "Chat" | "Financial" | "Dashboard"
  >["navigation"];
  lottieURL: { background: ImageSourcePropType; loading: string };
};

const LottieLoading = ({
  isLoading,
  navigation,
  lottieURL,
}: LottieLoadingProps) => {
  return (
    isLoading && (
      <View style={loadingStyles.loadingContainer}>
        <ImageBackground
          style={loadingStyles.loadingContainer}
          source={lottieURL.background}
          resizeMode="cover"
          className="flex-1"
        >
          <LottieView
            source={lottieURL.loading}
            autoPlay
            loop
            style={[loadingStyles.lottie, { bottom: 10 }]}
          />
          {navigation && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute z-50 top-[10px] left-[5px]"
            >
              <ChevronLeft size={36} color="whitesmoke" strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </ImageBackground>
      </View>
    )
  );
};
export default LottieLoading;
