import { router } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { AnimalCard } from "../../src/components/AnimalCard";
import { EmptyState } from "../../src/components/EmptyState";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { UiSprite } from "../../src/components/UiSprite";
import type { UiSpriteKey } from "../../src/data/ui.generated";
import type { Animal } from "../../src/data/types";
import { useRescue } from "../../src/state/RescueProvider";
import { type AppColors, useAppTheme } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { formatRescueDate } from "../../src/utils/date";
import { formatNumber } from "../../src/utils/format";

type AnimalSectionProps = {
  title: string;
  animals: Animal[];
  emptyTitle: string;
  emptyMessage: string;
  emptySpriteKey: UiSpriteKey;
};

function AnimalSection({
  title,
  animals,
  emptyTitle,
  emptyMessage,
  emptySpriteKey
}: AnimalSectionProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors);
  const {
    getAnimalStatus,
    getAnimalMetrics,
    rescueProgress,
    getMilestone
  } = useRescue();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {animals.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMessage} spriteKey={emptySpriteKey} />
      ) : (
        <FlatList
          data={animals}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => {
            const status = getAnimalStatus(item.id);
            const metrics = getAnimalMetrics(item.id);
            const milestone = getMilestone(item.id);

            return (
              <View style={styles.cardSlot}>
                <AnimalCard
                  animal={item}
                  onPress={() => {
                    if (status === "pro_locked") {
                      router.push("/paywall");
                      return;
                    }

                    router.push(`/animal/${item.id}`);
                  }}
                  progress={metrics?.progress}
                  requiredSteps={milestone?.unlockSteps ?? 0}
                  rescuedDate={formatRescueDate(rescueProgress.rescuedDates[item.id])}
                  status={status}
                />
              </View>
            );
          }}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

export default function AnimalsScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors);
  const { lockedAnimals, unlockedAnimals } = useRescue();
  const totalAnimals = lockedAnimals.length + unlockedAnimals.length;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Collection</Text>
          <Text style={styles.title}>Rescue Album</Text>
          <Text style={styles.subtitle}>
            Tap a card to see its gate, mood, and step target.
          </Text>
        </View>
        <UiSprite spriteKey="collectionAnimalAlbum" size={96} />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <UiSprite spriteKey="microHeartBubble" size={36} />
          <View>
            <Text style={styles.summaryValue}>{formatNumber(unlockedAnimals.length)}</Text>
            <Text style={styles.summaryLabel}>Safe</Text>
          </View>
        </View>
        <View style={styles.summaryItem}>
          <UiSprite spriteKey="collectionMysteryCrate" size={36} />
          <View>
            <Text style={styles.summaryValue}>{formatNumber(lockedAnimals.length)}</Text>
            <Text style={styles.summaryLabel}>Waiting</Text>
          </View>
        </View>
        <View style={styles.summaryItem}>
          <UiSprite spriteKey="microRescueRibbon" size={36} />
          <View>
            <Text style={styles.summaryValue}>{formatNumber(totalAnimals)}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>
      </View>

      <AnimalSection
        animals={lockedAnimals}
        emptyMessage="Every waiting card is cleared."
        emptySpriteKey="emptyAnimalWave"
        emptyTitle="No waiting animals"
        title="Waiting"
      />
      <AnimalSection
        animals={unlockedAnimals}
        emptyMessage="Your first rescue starts with today's pedometer count."
        emptySpriteKey="emptySanctuaryNest"
        emptyTitle="Safe home is waiting"
        title="Safe Home"
      />
    </ScreenContainer>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  cardSlot: {
    flex: 1,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xs
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs
  },
  kicker: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21
  },
  summaryItem: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 62,
    padding: spacing.sm
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  summaryValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900"
  }
  });
}
