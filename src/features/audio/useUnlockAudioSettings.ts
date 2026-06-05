import { useCallback, useEffect, useState } from "react";

import { getAppSettings, saveAppSettings } from "../../storage/rescueStorage";

const DEFAULT_UNLOCK_AUDIO_ENABLED = true;

export function useUnlockAudioSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [unlockAudioEnabled, setUnlockAudioEnabledState] = useState(
    DEFAULT_UNLOCK_AUDIO_ENABLED
  );

  useEffect(() => {
    let mounted = true;

    getAppSettings()
      .then((settings) => {
        if (!mounted) {
          return;
        }

        setUnlockAudioEnabledState(
          settings.unlockAudioEnabled ?? DEFAULT_UNLOCK_AUDIO_ENABLED
        );
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setUnlockAudioEnabled = useCallback(async (enabled: boolean) => {
    setUnlockAudioEnabledState(enabled);
    const settings = await getAppSettings();
    await saveAppSettings({
      ...settings,
      unlockAudioEnabled: enabled
    });
  }, []);

  return {
    isLoading,
    unlockAudioEnabled,
    setUnlockAudioEnabled
  };
}
