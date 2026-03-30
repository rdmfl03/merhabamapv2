import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { formatEventDateRange } from "@/lib/events";
import type { FeedDiscoveryBundle } from "@/server/queries/discovery/get-feed-discovery";

type FeedDiscoveryBlocksProps = {
  locale: AppLocale;
  discovery: FeedDiscoveryBundle;
};

export async function FeedDiscoveryBlocks({ locale, discovery }: FeedDiscoveryBlocksProps) {
  const { places, events, collections, isLocalScope, isCategoryScope } = discovery;
  const hasAny = places.length > 0 || events.length > 0 || collections.length > 0;
  if (!hasAny) {
    return null;
  }

  const t = await getTranslations("feed.discovery");

  const scopeNote = isCategoryScope
    ? t("footnoteCategory")
    : isLocalScope
      ? t("footnoteLocal")
      : t("footnoteGlobal");

  return (
    <div className="space-y-10 border-t border-border/60 pt-10">
      <p className="text-xs text-muted-foreground">{scopeNote}</p>

      {places.length > 0 ? (
        <section className="space-y-3" aria-labelledby="feed-discovery-places-heading">
          <h2 id="feed-discovery-places-heading" className="text-sm font-semibold text-foreground">
            {isCategoryScope
              ? t("placesTitleCategory")
              : isLocalScope
                ? t("placesTitleLocal")
                : t("placesTitle")}
          </h2>
          <ul className="space-y-2">
            {places.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/places/${encodeURIComponent(p.slug)}`}
                  className="flex flex-col gap-0.5 rounded-xl border border-border/70 bg-card/60 px-3 py-2.5 text-left transition-colors hover:border-brand/30 hover:bg-brand/[0.03]"
                >
                  <span className="font-medium text-brand underline-offset-2">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.cityLabel} · {t(`placeReason.${p.reason}`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {events.length > 0 ? (
        <section className="space-y-3" aria-labelledby="feed-discovery-events-heading">
          <h2 id="feed-discovery-events-heading" className="text-sm font-semibold text-foreground">
            {isLocalScope ? t("eventsTitleLocal") : t("eventsTitle")}
          </h2>
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/events/${encodeURIComponent(e.slug)}`}
                  className="flex flex-col gap-0.5 rounded-xl border border-border/70 bg-card/60 px-3 py-2.5 text-left transition-colors hover:border-brand/30 hover:bg-brand/[0.03]"
                >
                  <span className="font-medium text-brand underline-offset-2 hover:underline">
                    {e.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {e.cityLabel} · {formatEventDateRange(locale, e.startsAt, null)} ·{" "}
                    {t(`eventReason.${e.reason}`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {collections.length > 0 ? (
        <section className="space-y-3" aria-labelledby="feed-discovery-collections-heading">
          <h2 id="feed-discovery-collections-heading" className="text-sm font-semibold text-foreground">
            {isLocalScope ? t("collectionsTitleLocal") : t("collectionsTitle")}
          </h2>
          <ul className="space-y-2">
            {collections.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/collections/${c.id}`}
                  className="flex flex-col gap-0.5 rounded-xl border border-border/70 bg-card/60 px-3 py-2.5 text-left transition-colors hover:border-brand/30 hover:bg-brand/[0.03]"
                >
                  <span className="font-medium text-brand underline-offset-2 hover:underline">
                    {c.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t(`collectionReason.${c.reason}`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
