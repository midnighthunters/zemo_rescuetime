import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "../../components/AppButton";
import { onboardingSlides, type OnboardingSlide } from "../../data/onboarding";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

type OnboardingCarouselProps = {
  onDone: () => void;
};

export function OnboardingCarousel({ onDone }: OnboardingCarouselProps) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === onboardingSlides.length - 1;

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(onboardingSlides.length - 1, nextIndex)));
  };

  const handleNext = () => {
    if (isLast) {
      onDone();
      return;
    }

    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={onboardingSlides}
        horizontal
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleMomentumEnd}
        pagingEnabled
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Image contentFit="cover" source={item.image} style={styles.image} />
            <LinearGradient
              colors={["rgba(34,48,71,0.08)", "rgba(34,48,71,0.62)"]}
              style={styles.overlay}
            />
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.copyWrap}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
            </SafeAreaView>
          </View>
        )}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      />

      <SafeAreaView edges={["bottom"]} style={styles.controls}>
        <View style={styles.dots}>
          {onboardingSlides.map((slide, dotIndex) => (
            <View
              key={slide.id}
              style={[styles.dot, dotIndex === index && styles.activeDot]}
            />
          ))}
        </View>
        <View style={styles.buttonRow}>
          <AppButton onPress={onDone} title="Skip" variant="ghost" />
          <AppButton
            icon={isLast ? "checkmark" : "arrow-forward"}
            onPress={handleNext}
            title={isLast ? "Start Rescuing" : "Continue"}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: colors.primary,
    width: 28
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  controls: {
    backgroundColor: colors.backgroundBottom,
    borderTopColor: "rgba(255,255,255,0.8)",
    borderTopWidth: 1,
    bottom: 0,
    gap: spacing.lg,
    left: 0,
    padding: spacing.lg,
    position: "absolute",
    right: 0
  },
  copyWrap: {
    gap: spacing.md,
    marginTop: "auto",
    padding: spacing.xl,
    paddingBottom: 150
  },
  dot: {
    backgroundColor: "#B7C4D6",
    borderRadius: 8,
    height: 8,
    width: 8
  },
  dots: {
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  image: {
    height: "100%",
    position: "absolute",
    width: "100%"
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  root: {
    backgroundColor: colors.backgroundBottom,
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  slide: {
    flex: 1
  },
  subtitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26
  },
  title: {
    color: colors.white,
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 42
  }
});
