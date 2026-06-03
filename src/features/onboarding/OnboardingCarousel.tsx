import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from "react-native";

import { onboardingSlides, type OnboardingSlide } from "../../data/onboarding";
import { useAppTheme } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { AppButton } from "../../components/AppButton";

type OnboardingCarouselProps = {
  onDone: () => void;
};

export function OnboardingCarousel({ onDone }: OnboardingCarouselProps) {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
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
    <View style={[styles.root, { backgroundColor: theme.colors.backgroundBottom }]}>
      <FlatList
        ref={listRef}
        data={onboardingSlides}
        horizontal
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleMomentumEnd}
        pagingEnabled
        renderItem={({ item }) => (
          <Pressable
            accessibilityLabel="Onboarding image"
            accessibilityRole="button"
            onPress={handleNext}
            style={[styles.slide, { width }]}
          >
            <Image contentFit="cover" source={item.image} style={styles.image} />
            <View style={styles.scrim} />
            <View style={styles.copyPanel}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </Pressable>
        )}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.controls}>
        <View style={styles.dots}>
          {onboardingSlides.map((slide, slideIndex) => (
            <View
              key={slide.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    slideIndex === index ? theme.colors.primary : "rgba(255,255,255,0.62)",
                  width: slideIndex === index ? 24 : 8
                }
              ]}
            />
          ))}
        </View>
        <AppButton
          icon={isLast ? "heart" : "arrow-forward"}
          onPress={handleNext}
          title={isLast ? "Start Rescuing" : "Next"}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: "100%",
    width: "100%"
  },
  controls: {
    bottom: spacing.xl,
    gap: spacing.md,
    left: spacing.lg,
    position: "absolute",
    right: spacing.lg
  },
  copyPanel: {
    bottom: 150,
    gap: spacing.sm,
    left: spacing.lg,
    position: "absolute",
    right: spacing.lg
  },
  dot: {
    borderRadius: 8,
    height: 8
  },
  dots: {
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  root: {
    flex: 1
  },
  slide: {
    flex: 1
  },
  scrim: {
    backgroundColor: "rgba(34,48,71,0.28)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23,
    textShadowColor: "rgba(0,0,0,0.24)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 5
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 39,
    textShadowColor: "rgba(0,0,0,0.28)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 6
  }
});
