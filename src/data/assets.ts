import type { ImageSourcePropType } from "react-native";

export const jailSprites = {
  gate: require("../../public/data/cage/gate.png") as ImageSourcePropType,
  openJail: require("../../public/data/cage/open-jail.png") as ImageSourcePropType,
  platform: require("../../public/data/cage/platform.png") as ImageSourcePropType,
  top: require("../../public/data/cage/top.png") as ImageSourcePropType
} as const;
