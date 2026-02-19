import React from "react";
import { IIconProps } from ".";
import Svg, { G, Path } from "react-native-svg";

const DolarIcon = ({
  width = 24,
  height = 24,
  fill = "gray",
  selectedTab,
}: IIconProps) => {
  return (
    <Svg
      viewBox="0 0 24 24"
      role="img"
      aria-labelledby="dolarIconTitle"
      stroke={selectedTab === "financial" ? fill : "#b5b5b5"}
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={width}
      height={height}
      fill="transparent"
      color="#000000"
    >
      <G id="SVGRepo_bgCarrier" strokeWidth="0"></G>
      <G
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></G>
      <G id="SVGRepo_iconCarrier">
        <Path d="M12 4L12 6M12 18L12 20M15.5 8C15.1666667 6.66666667 14 6 12 6 9 6 8.5 7.95652174 8.5 9 8.5 13.140327 15.5 10.9649412 15.5 15 15.5 16.0434783 15 18 12 18 10 18 8.83333333 17.3333333 8.5 16"></Path>
      </G>
    </Svg>
  );
};

export default DolarIcon;
