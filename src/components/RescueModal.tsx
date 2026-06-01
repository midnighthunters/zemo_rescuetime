import { Image } from "expo-image";
import { Modal, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";

import { colors } from "../theme/colors";
import { shadows } from "../theme/shadows";
import { spacing } from "../theme/spacing";
import { AppButton } from "./AppButton";

type RescueModalProps = {
  visible: boolean;
  animalName: string;
  animalImage?: ImageSourcePropType;
  onViewAnimals: () => void;
  onNextRescue: () => void;
};

export function RescueModal({
  visible,
  animalName,
  animalImage,
  onViewAnimals,
  onNextRescue
}: RescueModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {animalImage ? (
            <Image contentFit="contain" source={animalImage} style={styles.image} />
          ) : null}
          <Text style={styles.title}>You Rescued {animalName}!</Text>
          <Text style={styles.copy}>
            Your steps gave {animalName} freedom, food, and a safe home.
          </Text>
          <View style={styles.buttonRow}>
            <AppButton
              icon="paw"
              onPress={onViewAnimals}
              title="View My Animals"
              variant="secondary"
            />
            <AppButton
              icon="arrow-forward"
              onPress={onNextRescue}
              title="Next Rescue"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    gap: spacing.sm,
    width: "100%"
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    gap: spacing.lg,
    margin: spacing.xl,
    maxWidth: 420,
    padding: spacing.xl,
    width: "90%",
    ...shadows.card
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center"
  },
  image: {
    height: 190,
    width: 190
  },
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(34,48,71,0.42)",
    flex: 1,
    justifyContent: "center"
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center"
  }
});
