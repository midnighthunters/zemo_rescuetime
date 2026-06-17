import type { ImageSourcePropType } from "react-native";

export type UiSpriteKey =
  | "onboardingScaredPuppy"
  | "onboardingRescuerWater"
  | "onboardingCageBreak"
  | "onboardingHappyFamily"
  | "onboardingHopefulPanda"
  | "onboardingFootprintTrail"
  | "onboardingOwlGuide"
  | "onboardingSafeTurtle"
  | "homeAnimalInCage"
  | "homeCageOpening"
  | "homeAnimalSteppingOut"
  | "homeGoldenFootprint"
  | "homeRescueBackpack"
  | "homeSanctuaryIsland"
  | "homeProgressRingMascot"
  | "homeRescuerFlag"
  | "careWaterBowl"
  | "careFoodBowl"
  | "careMedkit"
  | "careBlanket"
  | "careGroomingBrush"
  | "careMoodHeartMeter"
  | "careRewardChest"
  | "careHandTreat"
  | "progressPawTrophy"
  | "progressWeeklyCalendar"
  | "progressTimelineTrail"
  | "progressCompletedBadge"
  | "progressMountainTrail"
  | "progressConfettiBurst"
  | "progressPortraitMedal"
  | "progressGemJar"
  | "collectionLockedBubble"
  | "collectionUnlockedFrame"
  | "collectionLockedPetHouse"
  | "collectionSafeHomeFrame"
  | "collectionAnimalAlbum"
  | "collectionSleepingCushion"
  | "collectionMysteryCrate"
  | "collectionPremiumBadge"
  | "proSanctuaryGate"
  | "proCrownedBadge"
  | "proAnimalFamily"
  | "proGoldenKey"
  | "proDeluxeHouse"
  | "proRescueMap"
  | "proTreasureChest"
  | "proOwlShopkeeper"
  | "emptySettingsAnimal"
  | "emptySleepingPedometer"
  | "emptySanctuaryNest"
  | "emptyOwlChecklist"
  | "emptyPawCloud"
  | "emptyPermissionPhone"
  | "emptyLostPathSign"
  | "emptyAnimalWave"
  | "microPawConfetti"
  | "microGiftAnimal"
  | "microHeartBubble"
  | "microRescueRibbon"
  | "microWalkingShoe"
  | "microMoodTrail"
  | "microJumpingAnimal"
  | "microTabOwl";

export const uiSprites: Record<UiSpriteKey, ImageSourcePropType> = {
  onboardingScaredPuppy: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_08 PM (1)/sprite_000_sprite_0.webp") as ImageSourcePropType,
  onboardingRescuerWater: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_08 PM (1)/sprite_001_sprite_1.webp") as ImageSourcePropType,
  onboardingCageBreak: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_08 PM (1)/sprite_002_sprite_2.webp") as ImageSourcePropType,
  onboardingHappyFamily: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_08 PM (1)/sprite_003_sprite_3.webp") as ImageSourcePropType,
  onboardingHopefulPanda: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_08 PM (1)/sprite_004_sprite_4.webp") as ImageSourcePropType,
  onboardingFootprintTrail: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_08 PM (1)/sprite_005_sprite_5.webp") as ImageSourcePropType,
  onboardingOwlGuide: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_08 PM (1)/sprite_006_sprite_6.webp") as ImageSourcePropType,
  onboardingSafeTurtle: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_08 PM (1)/sprite_007_sprite_7.webp") as ImageSourcePropType,
  homeAnimalInCage: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (2)/sprite_000_sprite_0.webp") as ImageSourcePropType,
  homeCageOpening: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (2)/sprite_001_sprite_1.webp") as ImageSourcePropType,
  homeAnimalSteppingOut: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (2)/sprite_002_sprite_2.webp") as ImageSourcePropType,
  homeGoldenFootprint: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (2)/sprite_003_sprite_3.webp") as ImageSourcePropType,
  homeRescueBackpack: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (2)/sprite_004_sprite_4.webp") as ImageSourcePropType,
  homeSanctuaryIsland: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (2)/sprite_005_sprite_5.webp") as ImageSourcePropType,
  homeProgressRingMascot: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (2)/sprite_006_sprite_6.webp") as ImageSourcePropType,
  homeRescuerFlag: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (2)/sprite_007_sprite_7.webp") as ImageSourcePropType,
  careWaterBowl: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (3)/sprite_000_sprite_0.webp") as ImageSourcePropType,
  careFoodBowl: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (3)/sprite_001_sprite_1.webp") as ImageSourcePropType,
  careMedkit: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (3)/sprite_002_sprite_2.webp") as ImageSourcePropType,
  careBlanket: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (3)/sprite_003_sprite_3.webp") as ImageSourcePropType,
  careGroomingBrush: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (3)/sprite_004_sprite_4.webp") as ImageSourcePropType,
  careMoodHeartMeter: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (3)/sprite_005_sprite_5.webp") as ImageSourcePropType,
  careRewardChest: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (3)/sprite_006_sprite_6.webp") as ImageSourcePropType,
  careHandTreat: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (3)/sprite_007_sprite_7.webp") as ImageSourcePropType,
  progressPawTrophy: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (4)/sprite_000_sprite_0.webp") as ImageSourcePropType,
  progressWeeklyCalendar: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (4)/sprite_001_sprite_1.webp") as ImageSourcePropType,
  progressTimelineTrail: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (4)/sprite_002_sprite_2.webp") as ImageSourcePropType,
  progressCompletedBadge: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (4)/sprite_003_sprite_3.webp") as ImageSourcePropType,
  progressMountainTrail: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (4)/sprite_004_sprite_4.webp") as ImageSourcePropType,
  progressConfettiBurst: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (4)/sprite_005_sprite_5.webp") as ImageSourcePropType,
  progressPortraitMedal: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (4)/sprite_006_sprite_6.webp") as ImageSourcePropType,
  progressGemJar: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (4)/sprite_007_sprite_7.webp") as ImageSourcePropType,
  collectionLockedBubble: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (5)/sprite_000_sprite_0.webp") as ImageSourcePropType,
  collectionUnlockedFrame: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (5)/sprite_001_sprite_1.webp") as ImageSourcePropType,
  collectionLockedPetHouse: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (5)/sprite_002_sprite_2.webp") as ImageSourcePropType,
  collectionSafeHomeFrame: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (5)/sprite_003_sprite_3.webp") as ImageSourcePropType,
  collectionAnimalAlbum: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (5)/sprite_004_sprite_4.webp") as ImageSourcePropType,
  collectionSleepingCushion: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (5)/sprite_005_sprite_5.webp") as ImageSourcePropType,
  collectionMysteryCrate: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (5)/sprite_006_sprite_6.webp") as ImageSourcePropType,
  collectionPremiumBadge: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (5)/sprite_007_sprite_7.webp") as ImageSourcePropType,
  proSanctuaryGate: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (6)/sprite_000_sprite_0.webp") as ImageSourcePropType,
  proCrownedBadge: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (6)/sprite_001_sprite_1.webp") as ImageSourcePropType,
  proAnimalFamily: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (6)/sprite_002_sprite_2.webp") as ImageSourcePropType,
  proGoldenKey: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (6)/sprite_003_sprite_3.webp") as ImageSourcePropType,
  proDeluxeHouse: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (6)/sprite_004_sprite_4.webp") as ImageSourcePropType,
  proRescueMap: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (6)/sprite_005_sprite_5.webp") as ImageSourcePropType,
  proTreasureChest: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (6)/sprite_006_sprite_6.webp") as ImageSourcePropType,
  proOwlShopkeeper: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_10 PM (6)/sprite_007_sprite_7.webp") as ImageSourcePropType,
  emptySettingsAnimal: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (7)/sprite_000_sprite_0.webp") as ImageSourcePropType,
  emptySleepingPedometer: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (7)/sprite_001_sprite_1.webp") as ImageSourcePropType,
  emptySanctuaryNest: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (7)/sprite_002_sprite_2.webp") as ImageSourcePropType,
  emptyOwlChecklist: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (7)/sprite_003_sprite_3.webp") as ImageSourcePropType,
  emptyPawCloud: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (7)/sprite_004_sprite_4.webp") as ImageSourcePropType,
  emptyPermissionPhone: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (7)/sprite_005_sprite_5.webp") as ImageSourcePropType,
  emptyLostPathSign: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (7)/sprite_006_sprite_6.webp") as ImageSourcePropType,
  emptyAnimalWave: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (7)/sprite_007_sprite_7.webp") as ImageSourcePropType,
  microPawConfetti: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (8)/sprite_000_sprite_0.webp") as ImageSourcePropType,
  microGiftAnimal: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (8)/sprite_001_sprite_1.webp") as ImageSourcePropType,
  microHeartBubble: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (8)/sprite_002_sprite_2.webp") as ImageSourcePropType,
  microRescueRibbon: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (8)/sprite_003_sprite_3.webp") as ImageSourcePropType,
  microWalkingShoe: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (8)/sprite_004_sprite_4.webp") as ImageSourcePropType,
  microMoodTrail: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (8)/sprite_005_sprite_5.webp") as ImageSourcePropType,
  microJumpingAnimal: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (8)/sprite_006_sprite_6.webp") as ImageSourcePropType,
  microTabOwl: require("../../public/data/ui/ChatGPT Image Jun 2, 2026, 10_37_11 PM (8)/sprite_007_sprite_7.webp") as ImageSourcePropType
};

export const onboardingUiSprites = [
  uiSprites.onboardingScaredPuppy,
  uiSprites.onboardingRescuerWater,
  uiSprites.onboardingCageBreak,
  uiSprites.onboardingHappyFamily,
  uiSprites.onboardingHopefulPanda,
  uiSprites.onboardingFootprintTrail,
  uiSprites.onboardingOwlGuide,
  uiSprites.onboardingSafeTurtle
] as const;

export const homeUiSprites = [
  uiSprites.homeAnimalInCage,
  uiSprites.homeCageOpening,
  uiSprites.homeAnimalSteppingOut,
  uiSprites.homeGoldenFootprint,
  uiSprites.homeRescueBackpack,
  uiSprites.homeSanctuaryIsland,
  uiSprites.homeProgressRingMascot,
  uiSprites.homeRescuerFlag
] as const;

export const careUiSprites = [
  uiSprites.careWaterBowl,
  uiSprites.careFoodBowl,
  uiSprites.careMedkit,
  uiSprites.careBlanket,
  uiSprites.careGroomingBrush,
  uiSprites.careMoodHeartMeter,
  uiSprites.careRewardChest,
  uiSprites.careHandTreat
] as const;

export const progressUiSprites = [
  uiSprites.progressPawTrophy,
  uiSprites.progressWeeklyCalendar,
  uiSprites.progressTimelineTrail,
  uiSprites.progressCompletedBadge,
  uiSprites.progressMountainTrail,
  uiSprites.progressConfettiBurst,
  uiSprites.progressPortraitMedal,
  uiSprites.progressGemJar
] as const;

export const collectionUiSprites = [
  uiSprites.collectionLockedBubble,
  uiSprites.collectionUnlockedFrame,
  uiSprites.collectionLockedPetHouse,
  uiSprites.collectionSafeHomeFrame,
  uiSprites.collectionAnimalAlbum,
  uiSprites.collectionSleepingCushion,
  uiSprites.collectionMysteryCrate,
  uiSprites.collectionPremiumBadge
] as const;

export const proUiSprites = [
  uiSprites.proSanctuaryGate,
  uiSprites.proCrownedBadge,
  uiSprites.proAnimalFamily,
  uiSprites.proGoldenKey,
  uiSprites.proDeluxeHouse,
  uiSprites.proRescueMap,
  uiSprites.proTreasureChest,
  uiSprites.proOwlShopkeeper
] as const;

export const emptyUiSprites = [
  uiSprites.emptySettingsAnimal,
  uiSprites.emptySleepingPedometer,
  uiSprites.emptySanctuaryNest,
  uiSprites.emptyOwlChecklist,
  uiSprites.emptyPawCloud,
  uiSprites.emptyPermissionPhone,
  uiSprites.emptyLostPathSign,
  uiSprites.emptyAnimalWave
] as const;

export const microUiSprites = [
  uiSprites.microPawConfetti,
  uiSprites.microGiftAnimal,
  uiSprites.microHeartBubble,
  uiSprites.microRescueRibbon,
  uiSprites.microWalkingShoe,
  uiSprites.microMoodTrail,
  uiSprites.microJumpingAnimal,
  uiSprites.microTabOwl
] as const;
