import { Audio } from "expo-av";

const unlockChime = require("../../../assets/audio/unlock-chime.wav");

export type UnlockChimeSound = Audio.Sound;

export async function playUnlockChime(volume = 0.42) {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    staysActiveInBackground: false
  });

  const { sound } = await Audio.Sound.createAsync(unlockChime, {
    shouldPlay: true,
    volume
  });

  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync().catch(() => undefined);
    }
  });

  return sound;
}
