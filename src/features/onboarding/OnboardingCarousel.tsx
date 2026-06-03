import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
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
            <View style={styles.imageContainer}>
              <Image contentFit="contain" source={item.image} style={styles.image} />
            </View>
          </Pressable>
        )}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      />
      {isLast && (
        <View style={styles.controls}>
          <AppButton
            icon="heart"
            onPress={handleNext}
            title="Start Rescuing"
            variant="primary"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl
  },
  image: {
    height: "80%",
    width: "100%"
  },
  controls: {
    bottom: spacing.xl,
    left: spacing.lg,
    position: "absolute",
    right: spacing.lg
  },
  root: {
    flex: 1
  },
  slide: {
    flex: 1
  }
});
