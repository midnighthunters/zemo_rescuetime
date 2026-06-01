import { router } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { AnimalCard } from "../../src/components/AnimalCard";
import { EmptyState } from "../../src/components/EmptyState";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import type { Animal } from "../../src/data/types";
import { useRescue } from "../../src/state/RescueProvider";
import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { formatRescueDate } from "../../src/utils/date";

type AnimalSectionProps = {
  title: string;
  animals: Animal[];
  emptyTitle: string;
  emptyMessage: string;
};

function AnimalSection({
  title,
  animals,
  emptyTitle,
  emptyMessage
}: AnimalSectionProps) {
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
        <EmptyState title={emptyTitle} message={emptyMessage} />
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
  const { lockedAnimals, unlockedAnimals } = useRescue();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Animal Collection</Text>
        <Text style={styles.subtitle}>
          Locked friends wait for care. Rescued friends stay safe here.
        </Text>
      </View>

      <AnimalSection
        animals={lockedAnimals}
        emptyMessage="You rescued everyone. You are a hero."
        emptyTitle="No locked animals"
        title="Locked Animals"
      />
      <AnimalSection
        animals={unlockedAnimals}
        emptyMessage="No animals rescued yet. Your first rescue starts today."
        emptyTitle="Your safe home is waiting"
        title="Unlocked Animals"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardSlot: {
    flex: 1,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xs
  },
  header: {
    gap: spacing.xs
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
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900"
  }
});
