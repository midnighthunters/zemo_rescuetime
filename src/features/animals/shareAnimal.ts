import {
  Alert,
  Image as RNImage,
  NativeModules,
  Platform,
  Share,
  type ImageSourcePropType
} from "react-native";

import { getAnimalFunFacts } from "../../data/animalFacts";
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  type AppLanguage
} from "../../i18n/languages";
import { translate } from "../../i18n/translations";

type ShareAnimalUnlockOptions = {
  animalName: string;
  happyImage?: ImageSourcePropType;
  language?: AppLanguage;
};

type NativeShareAnimalOptions = {
  animalName: string;
  factCopy?: string;
  imageUri?: string;
  message: string;
  title: string;
};

type NativeShareAnimalModule = {
  shareAnimalCard?: (options: NativeShareAnimalOptions) => Promise<void>;
};

const ShareAnimalModule = NativeModules.ShareAnimalModule as
  | NativeShareAnimalModule
  | undefined;

function getImageUri(image?: ImageSourcePropType) {
  if (!image) {
    return undefined;
  }

  return RNImage.resolveAssetSource(image)?.uri;
}

async function sharePlainAnimal(options: {
  animalName: string;
  dialogTitle: string;
  imageUri?: string;
  message: string;
  title: string;
}) {
  await Share.share(
    {
      message: options.message,
      title: options.title,
      url: options.imageUri
    },
    {
      dialogTitle: options.dialogTitle
    }
  );
}

export async function shareAnimalUnlock({
  animalName,
  happyImage,
  language = DEFAULT_LANGUAGE
}: ShareAnimalUnlockOptions) {
  const appLanguage = normalizeLanguage(language);
  const [fact] = getAnimalFunFacts(animalName);
  const imageUri = getImageUri(happyImage);
  const title = translate(appLanguage, "share.title", { animal: animalName });
  const dialogTitle = translate(appLanguage, "share.dialogTitle", {
    animal: animalName
  });
  const messageLines = [
    translate(appLanguage, "share.messageIntro", { animal: animalName }),
    fact ? translate(appLanguage, "share.funFact", { fact: fact.copy }) : undefined,
    translate(appLanguage, "share.messageOutro")
  ].filter(Boolean);
  const message = messageLines.join("\n\n");

  try {
    if (Platform.OS === "android" && ShareAnimalModule?.shareAnimalCard) {
      await ShareAnimalModule.shareAnimalCard({
        animalName,
        factCopy: fact?.copy,
        imageUri,
        message,
        title
      });
      return;
    }

    await sharePlainAnimal({ animalName, dialogTitle, imageUri, message, title });
  } catch {
    try {
      await sharePlainAnimal({ animalName, dialogTitle, imageUri, message, title });
    } catch {
      Alert.alert(
        translate(appLanguage, "share.alertTitle"),
        translate(appLanguage, "share.alertMessage")
      );
    }
  }
}
