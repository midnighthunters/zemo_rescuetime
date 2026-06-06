import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { AnimalCard } from "../../src/components/AnimalCard";
import { EmptyState } from "../../src/components/EmptyState";
import { MotionView, PulseView } from "../../src/components/Motion";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { UiSprite } from "../../src/components/UiSprite";
import type { UiSpriteKey } from "../../src/data/ui.generated";
import type { Animal } from "../../src/data/types";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useRescue } from "../../src/state/RescueProvider";
import { type AppColors, useAppTheme } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { formatRescueDate } from "../../src/utils/date";

type AnimalSectionProps = {
  title: string;
  sectionKind: "waiting" | "safe";
  animals: Animal[];
  emptyTitle: string;
  emptyMessage: string;
  emptySpriteKey: UiSpriteKey;
};

function AnimalSection({
  title,
  sectionKind,
  animals,
  emptyTitle,
  emptyMessage,
  emptySpriteKey
}: AnimalSectionProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);
  const { locale, t } = useLanguage();
  const {
    getAnimalStatus,
    getAnimalMetrics,
    rescueProgress,
    getMilestone
  } = useRescue();

  const renderItem = useCallback(({ item, index }: { item: Animal; index: number }) => {
    const status = getAnimalStatus(item.id);
    const metrics = getAnimalMetrics(item.id);
    const milestone = getMilestone(item.id);
    const concealed = sectionKind === "waiting" && index >= 2;

    const handlePress = () => {
      if (concealed) {
        return;
      }

      if (status === "pro_locked") {
        router.push("/paywall");
        return;
      }

      router.push(`/animal/${item.id}`);
    };

    return (
      <View style={styles.cardSlot}>
        <AnimalCard
          animal={item}
          onPress={handlePress}
          progress={metrics?.progress}
          requiredSteps={milestone?.unlockSteps ?? 0}
          rescuedDate={formatRescueDate(
            rescueProgress.rescuedDates[item.id],
            locale,
            t("common.today")
          )}
          concealed={concealed}
          status={status}
        />
      </View>
    );
  }, [
    sectionKind,
    getAnimalStatus,
    getAnimalMetrics,
    getMilestone,
    locale,
    rescueProgress.rescuedDates,
    styles.cardSlot,
    t
  ]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Ionicons
            color={theme.colors.primary}
            name={sectionKind === "waiting" ? "time" : "heart"}
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
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={5}
          renderItem={renderItem}
          scrollEnabled={false}
          removeClippedSubviews={false}
        />
      )}
    </View>
  );
}

export default function AnimalsScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);
  const { formatNumber: formatLocalizedNumber, t } = useLanguage();
  const { lockedAnimals, unlockedAnimals } = useRescue();
  const [showSafeOnly, setShowSafeOnly] = useState(false);

  return (
    <ScreenContainer>
      <MotionView style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={styles.kickerPill}>
            <Ionicons color={theme.colors.primaryDark} name="paw" size={18} />
            <Text style={styles.kicker}>{t("animals.collection")}</Text>
          </View>
          <Text style={styles.title}>{t("animals.rescueAlbum")}</Text>
          <Text style={styles.subtitle}>
            {t("animals.subtitle")}
          </Text>
        </View>
        <PulseView floatDistance={5} pulseScale={1.03}>
          <UiSprite spriteKey="collectionAnimalAlbum" size={142} />
        </PulseView>
      </MotionView>

      <MotionView delay={80} style={styles.summaryRow}>
        <Pressable
            accessibilityLabel={t("animals.showSafe")}
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
            <Text style={styles.summaryValue}>
              {formatLocalizedNumber(unlockedAnimals.length)}
            </Text>
            <Text style={styles.summaryLabel}>{t("animals.safe")}</Text>
          </View>
          <Ionicons color={theme.colors.primaryDark} name="chevron-forward" size={22} />
        </Pressable>
      </MotionView>

      {!showSafeOnly ? (
        <AnimalSection
          animals={lockedAnimals}
          emptyMessage={t("animals.emptyWaitingMessage")}
          emptySpriteKey="emptyAnimalWave"
          emptyTitle={t("animals.emptyWaitingTitle")}
          sectionKind="waiting"
          title={t("animals.waiting")}
        />
      ) : (
        <View>
          <Pressable
            accessibilityLabel={t("animals.backToWaiting")}
            accessibilityRole="button"
            onPress={() => setShowSafeOnly(false)}
            style={({ pressed }) => [
              styles.backToWaitingButton,
              pressed && styles.summaryPressed
            ]}
          >
            <Ionicons color={theme.colors.primaryDark} name="arrow-back" size={18} />
            <Text style={styles.backToWaitingText}>
              {t("animals.backToWaiting")}
            </Text>
          </Pressable>
        </View>
      )}
      <AnimalSection
        animals={unlockedAnimals}
        emptyMessage={t("animals.emptySafeMessage")}
        emptySpriteKey="emptySanctuaryNest"
        emptyTitle={t("animals.emptySafeTitle")}
        sectionKind="safe"
        title={t("animals.safeHome")}
      />
    </ScreenContainer>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  cardSlot: {
    flex: 0.5,
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
