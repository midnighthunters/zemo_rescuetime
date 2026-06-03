import { Image, type ImageContentFit } from "expo-image";
import type { ImageStyle, StyleProp } from "react-native";

import { uiSprites, type UiSpriteKey } from "../data/ui.generated";

type UiSpriteProps = {
  spriteKey: UiSpriteKey;
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
};

export function UiSprite({
  spriteKey,
  size,
  width,
  height,
  style,
  contentFit = "contain"
}: UiSpriteProps) {
  const source = uiSprites[spriteKey];

  if (!source) {
    return null;
  }

  return (
    <Image
      contentFit={contentFit}
      source={source}
      style={[
        {
          height: height ?? size,
          width: width ?? size
        },
        style
      ]}
    />
  );
}
