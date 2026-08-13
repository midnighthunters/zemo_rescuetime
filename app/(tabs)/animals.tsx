import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { AnimalCard } from "../../src/components/AnimalCard";
import { AppText } from "../../src/components/AppText";
import { EmptyState } from "../../src/components/EmptyState";
import { MotionView } from "../../src/components/Motion";
import { PremiumCard } from "../../src/components/PremiumCard";
import { ScreenScaffold } from "../../src/components/ScreenScaffold";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { SegmentedControl } from "../../src/components/SegmentedControl";
import type { Animal } from "../../src/data/types";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useRescue } from "../../src/state/RescueProvider";
import { useResponsiveLayout } from "../../src/theme/layout";
import { spacing } from "../../src/theme/spacing";
import { formatRescueDate } from "../../src/utils/date";

type AlbumFilter = "waiting" | "safe";

/** Only the first two waiting animals stay visible; later ones remain a mystery. */
const VISIBLE_WAITING_COUNT = 2;

export default function AnimalsScreen() {
  const layout = useResponsiveLayout();
  const styles = useMemo(() => createStyles(), []);
  const { formatNumber: formatLocalizedNumber, locale, t } = useLanguage();
  const {
    getAnimalMetrics,
    getAnimalStatus,
    getMilestone,
    lockedAnimals,
    rescueProgress,
    unlockedAnimals
  } = useRescue();
  const [filter, setFilter] = useState<AlbumFilter>("waiting");

  const data = filter === "waiting" ? lockedAnimals : unlockedAnimals;

  const renderItem = useCallback(
    ({ index, item }: { index: number; item: Animal }) => {
      const status = getAnimalStatus(item.id);
      const metrics = getAnimalMetrics(item.id);
      const milestone = getMilestone(item.id);
      const concealed = filter === "waiting" && index >= VISIBLE_WAITING_COUNT;

      const handlePress = () => {
        if (status === "pro_locked") {
          router.push("/paywall");
          return;
        }

        router.push(`/animal/${item.id}`);
      };

      return (
        <View style={[styles.cardSlot, { width: `${100 / layout.gridColumns}%` }]}>
          <AnimalCard
            animal={item}
            concealed={concealed}
            onPress={handlePress}
            progress={metrics?.progress}
            requiredSteps={milestone?.unlockSteps ?? 0}
            rescuedDate={formatRescueDate(
              rescueProgress.rescuedDates[item.id],
              locale,
              t("common.today")
            )}
            status={status}
          />
        </View>
      );
    },
    [
      filter,
      getAnimalMetrics,
      getAnimalStatus,
      getMilestone,
      layout.gridColumns,
      locale,
      rescueProgress.rescuedDates,
      styles.cardSlot,
      t
    ]
  );

  const filterOptions = useMemo(
    () => [
      { label: t("animals.waiting"), value: "waiting" as const },
      { label: t("animals.safe"), value: "safe" as const }
    ],
    [t]
  );

  return (
    <ScreenScaffold scroll={false}>
      <ScreenHeader
        eyebrow={t("animals.collection")}
        subtitle={t("animals.subtitle")}
        title={t("animals.rescueAlbum")}
      />

      <MotionView delay={60}>
        <PremiumCard gap={spacing.s12} variant="standard">
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <AppText role="metric">
                {formatLocalizedNumber(unlockedAnimals.length)}
              </AppText>
              <AppText role="caption" tone="secondary">
                {t("animals.safe")}
              </AppText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <AppText role="metric">
                {formatLocalizedNumber(lockedAnimals.length)}
              </AppText>
              <AppText role="caption" tone="secondary">
                {t("animals.waiting")}
              </AppText>
            </View>
          </View>
          <SegmentedControl
            onChange={setFilter}
            options={filterOptions}
            value={filter}
          />
        </PremiumCard>
      </MotionView>

      <FlatList
        columnWrapperStyle={layout.gridColumns > 1 ? styles.column : undefined}
        contentContainerStyle={styles.listContent}
        data={data}
        initialNumToRender={layout.gridColumns * 3}
        key={`album-${filter}-${layout.gridColumns}`}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            message={
              filter === "waiting"
                ? t("animals.emptyWaitingMessage")
                : t("animals.emptySafeMessage")
            }
            spriteKey={
              filter === "waiting" ? "emptyAnimalWave" : "emptySanctuaryNest"
            }
            title={
              filter === "waiting"
                ? t("animals.emptyWaitingTitle")
                : t("animals.emptySafeTitle")
            }
          />
        }
        maxToRenderPerBatch={layout.gridColumns * 2}
        numColumns={layout.gridColumns}
        removeClippedSubviews={false}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        windowSize={7}
      />
    </ScreenScaffold>
  );
}

function createStyles() {
  return StyleSheet.create({
    cardSlot: {
      paddingHorizontal: spacing.s4
    },
    column: {
      marginHorizontal: -spacing.s4
    },
    list: {
      flex: 1
    },
    listContent: {
      gap: spacing.s12,
      paddingBottom: spacing.s8,
      paddingTop: spacing.s4
    },
    summaryDivider: {
      backgroundColor: "transparent",
      width: spacing.s12
    },
    summaryItem: {
      flex: 1,
      gap: 2
    },
    summaryRow: {
      alignItems: "center",
      flexDirection: "row"
    }
  });
}
