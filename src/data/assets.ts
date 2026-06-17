import type { ImageSourcePropType } from "react-native";

export const jailSprites = {
  gate: require("../../public/data/cage/gate.webp") as ImageSourcePropType,
  openJail: require("../../public/data/cage/open-jail.webp") as ImageSourcePropType,
  platform: require("../../public/data/cage/platform.webp") as ImageSourcePropType,
  top: require("../../public/data/cage/top.webp") as ImageSourcePropType
} as const;
