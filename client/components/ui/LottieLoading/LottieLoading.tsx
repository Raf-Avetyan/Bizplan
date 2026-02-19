import { loadingStyles } from '@/constants/Styles';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from "lottie-react-native";

type LottieLoadingProps = {
  isLoading: boolean;
  lottieURL: { loading: string };
};

const LottieLoading = ({
  isLoading,
  lottieURL,
}: LottieLoadingProps) => {
  return (
    isLoading && (
      <LinearGradient
        colors={["#4D2FB2", "rgba(0,0,0,0.9)"]}
        style={loadingStyles.loadingContainer}
      >
        <LottieView
          source={lottieURL.loading}
          autoPlay
          loop
          style={[loadingStyles.lottie, { bottom: 10 }]}
        />
      </LinearGradient>
    )
  );
};
export default LottieLoading;
