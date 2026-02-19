import React from "react";
import { IIconProps } from ".";
import Svg, { G, Path } from "react-native-svg";

const FileIcon = ({
  width = 24,
  height = 24,
  fill = "gray",
  selectedTab,
}: IIconProps) => {
  return (
    <Svg viewBox="0 0 24 24" fill="transparent" width={width} height={height}>
      <G id="SVGRepo_bgCarrier" strokeWidth="0"></G>
      <G
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={selectedTab === "plan" ? fill : "#b5b5b5"}
        strokeWidth="1.4"
      ></G>
      <G id="SVGRepo_iconCarrier">
        <Path
          d="M19 9V17.8C19 18.9201 19 19.4802 18.782 19.908C18.5903 20.2843 18.2843 20.5903 17.908 20.782C17.4802 21 16.9201 21 15.8 21H8.2C7.07989 21 6.51984 21 6.09202 20.782C5.71569 20.5903 5.40973 20.2843 5.21799 19.908C5 19.4802 5 18.9201 5 17.8V6.2C5 5.07989 5 4.51984 5.21799 4.09202C5.40973 3.71569 5.71569 3.40973 6.09202 3.21799C6.51984 3 7.0799 3 8.2 3H13M19 9L13 3M19 9H14C13.4477 9 13 8.55228 13 8V3"
          stroke={selectedTab === "plan" ? fill : "#b5b5b5"}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></Path>
      </G>
    </Svg>
  );
};

export default FileIcon;
