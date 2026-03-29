import { isDisplayableMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * Subset of {@link ResolvedEntityImage} used for attribution UI.
 * Optional fields match a future API shape; only values actually present are rendered.
 */
export type PlaceImageAttributionInput = {
  attributionText?: string | null;
  attributionUrl?: string | null;
  sourceUrl?: string | null;
  sourceProvider?: string | null;
  imageLicense?: string | null;
  imageDetailUrl?: string | null;
  imageAttributionText?: string | null;
  imageSource?: string | null;
  imageAttributionRequired?: boolean | null;
};

export type PlaceImageAttributionLabels = {
  license: string;
  sourceLink: string;
  rightsLink: string;
  provider: string;
  requiredNotice: string;
};

function pickDisplayableUrl(url: string | null | undefined): string | null {
  const t = url?.trim();
  return t && isDisplayableMediaUrl(t) ? t : null;
}

export function placeImageAttributionHasContent(model: PlaceImageAttributionInput): boolean {
  const text = (model.imageAttributionText ?? model.attributionText)?.trim();
  const license = model.imageLicense?.trim();
  const detail = pickDisplayableUrl(model.imageDetailUrl);
  const source = pickDisplayableUrl(model.sourceUrl);
  const rights = pickDisplayableUrl(model.attributionUrl);
  const prov = (model.imageSource ?? model.sourceProvider)?.trim();
  return Boolean(
    license ||
      text ||
      detail ||
      source ||
      rights ||
      prov ||
      model.imageAttributionRequired,
  );
}

export function attributionLabelsForLocale(locale: "de" | "tr"): PlaceImageAttributionLabels {
  if (locale === "tr") {
    return {
      license: "Lisans",
      sourceLink: "Kaynak",
      rightsLink: "Ek bilgi",
      provider: "Saglayici",
      requiredNotice:
        "Bu gorsel icin atıf veya ek bilgi gerekebilir; veriler hazir oldugunda burada gorunecektir.",
    };
  }
  return {
    license: "Lizenz",
    sourceLink: "Quelle",
    rightsLink: "Weitere Angaben",
    provider: "Anbieter",
    requiredNotice:
      "Für dieses Bild können Namensnennung oder weitere Angaben erforderlich sein — sobald Daten vorliegen, erscheinen sie hier.",
  };
}

type PlaceImageAttributionProps = {
  model: PlaceImageAttributionInput;
  variant: "compact" | "detail";
  labels: PlaceImageAttributionLabels;
};

export function PlaceImageAttribution({ model, variant, labels }: PlaceImageAttributionProps) {
  if (!placeImageAttributionHasContent(model)) {
    return null;
  }

  const text = (model.imageAttributionText ?? model.attributionText)?.trim();
  const license = model.imageLicense?.trim();
  const detailUrl = pickDisplayableUrl(model.imageDetailUrl);
  const sourcePageUrl = pickDisplayableUrl(model.sourceUrl);
  const quelleUrl = detailUrl ?? sourcePageUrl;
  const rightsUrl = pickDisplayableUrl(model.attributionUrl);
  const secondaryRightsUrl =
    rightsUrl && quelleUrl && rightsUrl !== quelleUrl ? rightsUrl : null;
  const singleUrlWhenNoQuelle = !quelleUrl && rightsUrl ? rightsUrl : null;
  const provider = (model.imageSource ?? model.sourceProvider)?.trim();

  const linkClassDetail =
    "text-sm font-medium text-brand underline-offset-2 hover:underline break-all";
  const linkClassCompact =
    "text-[11px] font-medium text-brand underline-offset-2 hover:underline break-all";

  return (
    <div
      className={cn(
        variant === "compact"
          ? "border-t border-border/50 bg-muted/20 px-2 py-1.5"
          : "space-y-2",
      )}
    >
      {model.imageAttributionRequired ? (
        <p
          className={cn(
            "rounded-lg bg-amber-50/90 px-2 py-1.5 text-amber-950/90 dark:bg-amber-950/30 dark:text-amber-50/95",
            variant === "compact" ? "text-[11px] leading-snug" : "text-xs leading-relaxed",
          )}
        >
          {labels.requiredNotice}
        </p>
      ) : null}

      {license ? (
        <p
          className={cn(
            "text-muted-foreground",
            variant === "compact" ? "text-[11px] leading-snug" : "text-sm leading-relaxed",
          )}
        >
          <span className="font-semibold text-foreground/90">{labels.license}:</span>{" "}
          <span className="break-words">{license}</span>
        </p>
      ) : null}

      {text ? (
        <p
          className={cn(
            "text-muted-foreground",
            variant === "compact"
              ? "line-clamp-2 text-[11px] leading-snug"
              : "text-sm leading-relaxed break-words",
          )}
        >
          {text}
        </p>
      ) : null}

      {quelleUrl || secondaryRightsUrl || singleUrlWhenNoQuelle ? (
        <div
          className={cn(
            "flex flex-wrap items-baseline gap-x-3 gap-y-1",
            variant === "compact" && "gap-x-2",
          )}
        >
          {quelleUrl ? (
            <a
              href={quelleUrl}
              target="_blank"
              rel="noreferrer"
              className={variant === "compact" ? linkClassCompact : linkClassDetail}
            >
              {labels.sourceLink}
            </a>
          ) : null}
          {secondaryRightsUrl ? (
            <a
              href={secondaryRightsUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                variant === "compact" ? linkClassCompact : linkClassDetail,
                "font-normal text-muted-foreground",
              )}
            >
              {labels.rightsLink}
            </a>
          ) : null}
          {singleUrlWhenNoQuelle ? (
            <a
              href={singleUrlWhenNoQuelle}
              target="_blank"
              rel="noreferrer"
              className={variant === "compact" ? linkClassCompact : linkClassDetail}
            >
              {labels.sourceLink}
            </a>
          ) : null}
        </div>
      ) : null}

      {provider ? (
        <p
          className={cn(
            "text-muted-foreground",
            variant === "compact" ? "text-[10px] leading-snug" : "text-xs leading-relaxed",
          )}
        >
          <span className="font-medium text-foreground/80">{labels.provider}:</span>{" "}
          <span className="break-all">{provider}</span>
        </p>
      ) : null}
    </div>
  );
}
