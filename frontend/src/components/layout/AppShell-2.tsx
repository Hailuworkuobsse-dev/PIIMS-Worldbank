import { useSyncStore } from "@/stores/sync.store";

function OfflineBanner() {
  const { t } = useTranslation();
  const online = useSyncStore((s) => s.online);
  if (online) return null;
  return (
    <Banner tone="warning" className="rounded-none border-x-0 border-t-0">
      {t("a11y.offlineBanner")}
    </Banner>
  );
}