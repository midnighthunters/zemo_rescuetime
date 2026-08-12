import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "../../components/AppButton";
import { MotionView, PulseView } from "../../components/Motion";
import { onboardingSlides, type OnboardingSlide } from "../../data/onboarding";
import { useLanguage } from "../../i18n/LanguageProvider";
import { type AppColors, useAppTheme } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

type OnboardingCarouselProps = {
  onDone: () => Promise<void>;
  onSkipPermission: () => Promise<void>;
};

export function OnboardingCarousel({
  onDone,
  onSkipPermission,
}: OnboardingCarouselProps) {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const styles = createStyles(theme.colors, theme.isDark);
  const { t } = useLanguage();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [index, setIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLast = index === onboardingSlides.length - 1;

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(onboardingSlides.length - 1, nextIndex)));
  };

  const moveToNextSlide = () => {
    const nextIndex = Math.min(index + 1, onboardingSlides.length - 1);

    // Update eagerly so button presses do not depend on a platform-specific
    // momentum event (web does not consistently emit it for scrollToIndex).
    setIndex(nextIndex);
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  const finish = async (requestStepAccess: boolean) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (requestStepAccess) {
        await onDone();
      } else {
        await onSkipPermission();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={[styles.root, { backgroundColor: theme.colors.backgroundBottom }]}
    >
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>🐾</Text>
        </View>
        <Text style={styles.brandText}>Rescue Steps</Text>
      </View>

      <FlatList
        ref={listRef}
        accessibilityRole="adjustable"
        contentInsetAdjustmentBehavior="automatic"
        data={onboardingSlides}
        getItemLayout={(_, itemIndex) => ({
          length: width,
          offset: width * itemIndex,
          index: itemIndex,
        })}
        horizontal
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleMomentumEnd}
        pagingEnabled
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <MotionView direction="fade" style={styles.illustrationCard}>
              <PulseView
                floatDistance={5}
                pulseScale={1.02}
                style={styles.imagePulse}
              >
                <Image
                  accessibilityLabel={item.title}
                  contentFit="contain"
                  source={item.image}
                  style={styles.image}
                />
              </PulseView>
            </MotionView>
            <View style={styles.copy}>
              <Text accessibilityRole="header" style={styles.title}>
                {item.title}
              </Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              {item.requestsStepAccess ? (
                <View style={styles.privacyPill}>
                  <Text style={styles.privacyIcon}>🔒</Text>
                  <Text style={styles.privacyText}>
                    Read-only access. The app never writes Health data.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={styles.list}
      />

      <View style={styles.controls}>
        <View
          accessibilityLabel={`Page ${index + 1} of ${onboardingSlides.length}`}
          style={styles.pageDots}
        >
          {onboardingSlides.map((slide, dotIndex) => (
            <View
              key={slide.id}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>

        {isLast ? (
          <View style={styles.finalActions}>
            <AppButton
              icon="heart"
              loading={isSubmitting}
              onPress={() => void finish(true)}
              title={t("onboarding.enableSteps")}
              variant="primary"
            />
            <AppButton
              disabled={isSubmitting}
              onPress={() => void finish(false)}
              title={t("common.notNow")}
              variant="ghost"
            />
          </View>
        ) : (
          <AppButton
            icon="arrow-forward"
            onPress={moveToNextSlide}
            title={t("onboarding.next")}
            variant="primary"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    brandMark: {
      alignItems: "center",
      backgroundColor: colors.surfaceSoft,
      borderRadius: 12,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    brandMarkText: {
      fontSize: 19,
    },
    brandRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    brandText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: -0.2,
    },
    controls: {
      gap: spacing.md,
      paddingBottom: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    copy: {
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    dot: {
      backgroundColor: colors.border,
      borderRadius: 4,
      height: 7,
      width: 7,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
    finalActions: {
      gap: spacing.sm,
    },
    illustrationCard: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: isDark ? colors.surfaceSoft : "#F0FAF4",
      borderColor: colors.border,
      borderCurve: "continuous",
      borderRadius: 32,
      borderWidth: 1,
      height: "52%",
      justifyContent: "center",
      maxHeight: 430,
      minHeight: 240,
      overflow: "hidden",
      padding: spacing.xl,
      width: "86%",
    },
    image: {
      height: "100%",
      width: "100%",
    },
    imagePulse: {
      height: "92%",
      width: "92%",
    },
    list: {
      flex: 1,
    },
    pageDots: {
      alignItems: "center",
      flexDirection: "row",
      gap: 7,
      justifyContent: "center",
      minHeight: 16,
    },
    privacyIcon: {
      fontSize: 14,
    },
    privacyPill: {
      alignItems: "center",
      backgroundColor: colors.surfaceSoft,
      borderCurve: "continuous",
      borderRadius: 14,
      flexDirection: "row",
      gap: spacing.xs,
      marginTop: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    privacyText: {
      color: colors.muted,
      flexShrink: 1,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 16,
      textAlign: "center",
    },
    root: {
      flex: 1,
    },
    slide: {
      gap: spacing.xl,
      height: "100%",
      justifyContent: "center",
      paddingBottom: spacing.md,
      paddingTop: spacing.md,
    },
    subtitle: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 23,
      maxWidth: 430,
      textAlign: "center",
    },
    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: "900",
      letterSpacing: -0.7,
      lineHeight: 35,
      textAlign: "center",
    },
  });
}
