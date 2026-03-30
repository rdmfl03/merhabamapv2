import type { UserActivationSignals } from "@/server/queries/user/get-user-activation-signals";

export type ActivationFocus = "cities" | "saves" | "more" | null;

/**
 * Deterministic next-step hint for home. No hidden scores.
 * Priority: followed cities → saves → soft optional step → hidden once there is a list or contribution too.
 */
export function computeActivationFocus(signals: UserActivationSignals): ActivationFocus {
  const saves = signals.savedPlaces + signals.savedEvents;
  const contributions = signals.contributionPlaces + signals.contributionEvents;

  if (signals.followedCityCount === 0) {
    return "cities";
  }

  if (saves === 0) {
    return "saves";
  }

  const hasListsOrContributions =
    signals.collectionsCount > 0 || contributions > 0;
  if (!hasListsOrContributions) {
    return "more";
  }

  return null;
}
