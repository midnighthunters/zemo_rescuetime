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
  /** Meaningful label; omit for decorative art. */
  accessibilityLabel?: string;
  /** Explicitly hide purely decorative artwork from screen readers. */
  accessibilityIgnore?: boolean;
};

export function UiSprite({
  accessibilityIgnore = true,
  accessibilityLabel,
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

  const isDecorative = accessibilityIgnore && !accessibilityLabel;

  return (
    <Image
      accessibilityElementsHidden={isDecorative}
      accessibilityLabel={accessibilityLabel}
      accessible={!isDecorative}
      contentFit={contentFit}
      importantForAccessibility={isDecorative ? "no-hide-descendants" : "auto"}
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
