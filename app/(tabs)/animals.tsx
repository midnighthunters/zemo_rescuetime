import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { AnimalCard } from "../../src/components/AnimalCard";
import { EmptyState } from "../../src/components/EmptyState";
import { MotionView, PulseView } from "../../src/components/Motion";
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
    <MotionView direction="fade" style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Ionicons
            color={theme.colors.primary}
            name={title === "Waiting" ? "time" : "heart"}
            size={24}
          />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionLine} />
      </View>
      {animals.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMessage} spriteKey={emptySpriteKey} />
      ) : (
        <FlatList
          data={animals}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item, index }) => {
            const status = getAnimalStatus(item.id);
            const metrics = getAnimalMetrics(item.id);
            const milestone = getMilestone(item.id);
            const concealed = title === "Waiting" && index >= 2;

            return (
              <View style={styles.cardSlot}>
                <AnimalCard
                  animal={item}
                  onPress={() => {
                    if (concealed) {
                      return;
                    }

                    if (status === "pro_locked") {
                      router.push("/paywall");
                      return;
                    }

                    router.push(`/animal/${item.id}`);
                  }}
                  progress={metrics?.progress}
                  requiredSteps={milestone?.unlockSteps ?? 0}
                  rescuedDate={formatRescueDate(rescueProgress.rescuedDates[item.id])}
                  concealed={concealed}
                  status={status}
                />
              </View>
            );
          }}
          scrollEnabled={false}
        />
      )}
    </MotionView>
  );
}

export default function AnimalsScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme.colors);
  const { lockedAnimals, unlockedAnimals } = useRescue();
  const [showSafeOnly, setShowSafeOnly] = useState(false);

  return (
    <ScreenContainer>
      <MotionView style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={styles.kickerPill}>
            <Ionicons color={theme.colors.primaryDark} name="paw" size={18} />
            <Text style={styles.kicker}>Collection</Text>
          </View>
          <Text style={styles.title}>Rescue Album</Text>
          <Text style={styles.subtitle}>
            Tap a card to see its gate, mood, and step target.
          </Text>
        </View>
        <PulseView floatDistance={5} pulseScale={1.03}>
          <UiSprite spriteKey="collectionAnimalAlbum" size={142} />
        </PulseView>
      </MotionView>

      <MotionView delay={80} style={styles.summaryRow}>
        <Pressable
          accessibilityLabel="Show safe animals"
          accessibilityRole="button"
          onPress={() => setShowSafeOnly(true)}
          style={({ pressed }) => [
            styles.summaryItem,
            styles.summaryItemSingle,
            pressed && styles.summaryPressed
          ]}
        >
          <UiSprite spriteKey="microHeartBubble" size={58} />
          <View>
            <Text style={styles.summaryValue}>{formatNumber(unlockedAnimals.length)}</Text>
            <Text style={styles.summaryLabel}>Safe</Text>
          </View>
          <Ionicons color={theme.colors.primaryDark} name="chevron-forward" size={22} />
        </Pressable>
      </MotionView>

      {!showSafeOnly ? (
        <AnimalSection
          animals={lockedAnimals}
          emptyMessage="Every waiting card is cleared."
          emptySpriteKey="emptyAnimalWave"
          emptyTitle="No waiting animals"
          title="Waiting"
        />
      ) : (
        <MotionView direction="fade">
        <Pressable
          accessibilityLabel="Back to waiting animals"
          accessibilityRole="button"
          onPress={() => setShowSafeOnly(false)}
          style={({ pressed }) => [
            styles.backToWaitingButton,
            pressed && styles.summaryPressed
          ]}
        >
          <Ionicons color={theme.colors.primaryDark} name="arrow-back" size={18} />
          <Text style={styles.backToWaitingText}>Waiting Animals</Text>
        </Pressable>
        </MotionView>
      )}
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
  backToWaitingButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  backToWaitingText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  kicker: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  kickerPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceSoft,
    borderColor: "#CBEED8",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  section: {
    gap: spacing.md
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  sectionLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900"
  },
  sectionTitleWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
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
    minHeight: 86,
    padding: spacing.sm
  },
  summaryItemSingle: {
    flex: 0,
    justifyContent: "space-between",
    maxWidth: 360,
    width: "100%"
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  summaryPressed: {
    transform: [{ scale: 0.99 }]
  },
  summaryValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 48,
    fontWeight: "900"
  }
  });
}
