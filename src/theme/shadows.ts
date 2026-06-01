import { Platform } from "react-native";

import { colors } from "./colors";

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 }
    },
    android: {
      elevation: 4
    },
    default: {}
  })
};
