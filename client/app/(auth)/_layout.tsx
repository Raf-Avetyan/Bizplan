import { Stack } from "expo-router";
import React from "react";

export default function OnBoardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#1e1e1e" },
      }}
    >
      <Stack.Screen
        name="onBoarding"
        options={{
          title: "OnBoarding",
        }}
      />
    </Stack>
  );
}
