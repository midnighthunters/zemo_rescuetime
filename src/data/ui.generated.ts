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
  onboardingScaredPuppy: require("../../assets/generated/ui/ui_001.png") as ImageSourcePropType,
  onboardingRescuerWater: require("../../assets/generated/ui/ui_002.png") as ImageSourcePropType,
  onboardingCageBreak: require("../../assets/generated/ui/ui_003.png") as ImageSourcePropType,
  onboardingHappyFamily: require("../../assets/generated/ui/ui_004.png") as ImageSourcePropType,
  onboardingHopefulPanda: require("../../assets/generated/ui/ui_005.png") as ImageSourcePropType,
  onboardingFootprintTrail: require("../../assets/generated/ui/ui_006.png") as ImageSourcePropType,
  onboardingOwlGuide: require("../../assets/generated/ui/ui_007.png") as ImageSourcePropType,
  onboardingSafeTurtle: require("../../assets/generated/ui/ui_008.png") as ImageSourcePropType,
  homeAnimalInCage: require("../../assets/generated/ui/ui_009.png") as ImageSourcePropType,
  homeCageOpening: require("../../assets/generated/ui/ui_010.png") as ImageSourcePropType,
  homeAnimalSteppingOut: require("../../assets/generated/ui/ui_011.png") as ImageSourcePropType,
  homeGoldenFootprint: require("../../assets/generated/ui/ui_012.png") as ImageSourcePropType,
  homeRescueBackpack: require("../../assets/generated/ui/ui_013.png") as ImageSourcePropType,
  homeSanctuaryIsland: require("../../assets/generated/ui/ui_014.png") as ImageSourcePropType,
  homeProgressRingMascot: require("../../assets/generated/ui/ui_015.png") as ImageSourcePropType,
  homeRescuerFlag: require("../../assets/generated/ui/ui_016.png") as ImageSourcePropType,
  careWaterBowl: require("../../assets/generated/ui/ui_017.png") as ImageSourcePropType,
  careFoodBowl: require("../../assets/generated/ui/ui_018.png") as ImageSourcePropType,
  careMedkit: require("../../assets/generated/ui/ui_019.png") as ImageSourcePropType,
  careBlanket: require("../../assets/generated/ui/ui_020.png") as ImageSourcePropType,
  careGroomingBrush: require("../../assets/generated/ui/ui_021.png") as ImageSourcePropType,
  careMoodHeartMeter: require("../../assets/generated/ui/ui_022.png") as ImageSourcePropType,
  careRewardChest: require("../../assets/generated/ui/ui_023.png") as ImageSourcePropType,
  careHandTreat: require("../../assets/generated/ui/ui_024.png") as ImageSourcePropType,
  progressPawTrophy: require("../../assets/generated/ui/ui_025.png") as ImageSourcePropType,
  progressWeeklyCalendar: require("../../assets/generated/ui/ui_026.png") as ImageSourcePropType,
  progressTimelineTrail: require("../../assets/generated/ui/ui_027.png") as ImageSourcePropType,
  progressCompletedBadge: require("../../assets/generated/ui/ui_028.png") as ImageSourcePropType,
  progressMountainTrail: require("../../assets/generated/ui/ui_029.png") as ImageSourcePropType,
  progressConfettiBurst: require("../../assets/generated/ui/ui_030.png") as ImageSourcePropType,
  progressPortraitMedal: require("../../assets/generated/ui/ui_031.png") as ImageSourcePropType,
  progressGemJar: require("../../assets/generated/ui/ui_032.png") as ImageSourcePropType,
  collectionLockedBubble: require("../../assets/generated/ui/ui_033.png") as ImageSourcePropType,
  collectionUnlockedFrame: require("../../assets/generated/ui/ui_034.png") as ImageSourcePropType,
  collectionLockedPetHouse: require("../../assets/generated/ui/ui_035.png") as ImageSourcePropType,
  collectionSafeHomeFrame: require("../../assets/generated/ui/ui_036.png") as ImageSourcePropType,
  collectionAnimalAlbum: require("../../assets/generated/ui/ui_037.png") as ImageSourcePropType,
  collectionSleepingCushion: require("../../assets/generated/ui/ui_038.png") as ImageSourcePropType,
  collectionMysteryCrate: require("../../assets/generated/ui/ui_039.png") as ImageSourcePropType,
  collectionPremiumBadge: require("../../assets/generated/ui/ui_040.png") as ImageSourcePropType,
  proSanctuaryGate: require("../../assets/generated/ui/ui_041.png") as ImageSourcePropType,
  proCrownedBadge: require("../../assets/generated/ui/ui_042.png") as ImageSourcePropType,
  proAnimalFamily: require("../../assets/generated/ui/ui_043.png") as ImageSourcePropType,
  proGoldenKey: require("../../assets/generated/ui/ui_044.png") as ImageSourcePropType,
  proDeluxeHouse: require("../../assets/generated/ui/ui_045.png") as ImageSourcePropType,
  proRescueMap: require("../../assets/generated/ui/ui_046.png") as ImageSourcePropType,
  proTreasureChest: require("../../assets/generated/ui/ui_047.png") as ImageSourcePropType,
  proOwlShopkeeper: require("../../assets/generated/ui/ui_048.png") as ImageSourcePropType,
  emptySettingsAnimal: require("../../assets/generated/ui/ui_049.png") as ImageSourcePropType,
  emptySleepingPedometer: require("../../assets/generated/ui/ui_050.png") as ImageSourcePropType,
  emptySanctuaryNest: require("../../assets/generated/ui/ui_051.png") as ImageSourcePropType,
  emptyOwlChecklist: require("../../assets/generated/ui/ui_052.png") as ImageSourcePropType,
  emptyPawCloud: require("../../assets/generated/ui/ui_053.png") as ImageSourcePropType,
  emptyPermissionPhone: require("../../assets/generated/ui/ui_054.png") as ImageSourcePropType,
  emptyLostPathSign: require("../../assets/generated/ui/ui_055.png") as ImageSourcePropType,
  emptyAnimalWave: require("../../assets/generated/ui/ui_056.png") as ImageSourcePropType,
  microPawConfetti: require("../../assets/generated/ui/ui_057.png") as ImageSourcePropType,
  microGiftAnimal: require("../../assets/generated/ui/ui_058.png") as ImageSourcePropType,
  microHeartBubble: require("../../assets/generated/ui/ui_059.png") as ImageSourcePropType,
  microRescueRibbon: require("../../assets/generated/ui/ui_060.png") as ImageSourcePropType,
  microWalkingShoe: require("../../assets/generated/ui/ui_061.png") as ImageSourcePropType,
  microMoodTrail: require("../../assets/generated/ui/ui_062.png") as ImageSourcePropType,
  microJumpingAnimal: require("../../assets/generated/ui/ui_063.png") as ImageSourcePropType,
  microTabOwl: require("../../assets/generated/ui/ui_064.png") as ImageSourcePropType
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
