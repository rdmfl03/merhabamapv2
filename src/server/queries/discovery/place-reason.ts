import type { DiscoveryPlaceReason } from "./types";

export function pickPlaceDiscoveryReason(args: {
  saves: number;
  comments: number;
  listed: number;
}): DiscoveryPlaceReason {
  const { saves, comments, listed } = args;
  const max = Math.max(saves, comments, listed);
  if (max === 0) {
    return "mixed";
  }
  const top = [saves, comments, listed].filter((n) => n === max).length;
  if (top > 1) {
    return "mixed";
  }
  if (max === saves) {
    return "saved";
  }
  if (max === comments) {
    return "comments";
  }
  return "listed";
}
