import { useLanguage } from "../i18n/LanguageProvider";
import { StatusChip } from "./StatusChip";

/** Small gold Pro marker. Always paired with a lock icon, never color alone. */
export function ProBadge() {
  const { t } = useLanguage();

  return <StatusChip icon="star" label={t("common.pro")} tone="pro" />;
}
