import { StyleSheet } from "react-native";

export const loadingStyles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4D2FB2",
    zIndex: 999,
  },
  lottie: {
    width: 200,
    height: 200,
    position: "relative",
    marginBottom: 30,
  },
});
