type MediaAttributionProps = {
  attributionText?: string | null;
  attributionUrl?: string | null;
  className?: string;
};

function getAttributionLabel(
  attributionText: string | null | undefined,
  attributionUrl: string | null | undefined,
) {
  if (attributionText?.trim()) {
    return attributionText.trim();
  }

  if (!attributionUrl) {
    return null;
  }

  try {
    return new URL(attributionUrl).hostname.replace(/^www\./, "");
  } catch {
    return attributionUrl;
  }
}

export function MediaAttribution({
  attributionText,
  attributionUrl,
  className,
}: MediaAttributionProps) {
  const label = getAttributionLabel(attributionText, attributionUrl);

  if (!label) {
    return null;
  }

  if (attributionUrl) {
    return (
      <a
        href={attributionUrl}
        target="_blank"
        rel="noreferrer"
        className={className ?? "text-xs text-muted-foreground underline-offset-4 hover:underline"}
      >
        {label}
      </a>
    );
  }

  return (
    <p className={className ?? "text-xs text-muted-foreground"}>
      {label}
    </p>
  );
}
