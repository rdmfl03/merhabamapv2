import type { DiscoveryEventReason } from "./types";

export function pickEventDiscoveryReason(args: {
  participation: number;
  comments: number;
  saved: number;
}): DiscoveryEventReason {
  const { participation, comments, saved } = args;
  const max = Math.max(participation, comments, saved);
  if (max === 0) {
    return "mixed";
  }
  const top = [participation, comments, saved].filter((n) => n === max).length;
  if (top > 1) {
    return "mixed";
  }
  if (max === participation) {
    return "participation";
  }
  if (max === comments) {
    return "comments";
  }
  return "saved";
}
