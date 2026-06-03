import type { ImageSourcePropType } from "react-native";

export const jailSprites = {
  gate: require("../../assets/generated/jail/gate.png") as ImageSourcePropType,
  openJail: require("../../assets/generated/jail/open-jail.png") as ImageSourcePropType,
  platform: require("../../assets/generated/jail/platform.png") as ImageSourcePropType,
  top: require("../../assets/generated/jail/top.png") as ImageSourcePropType
} as const;
