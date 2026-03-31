export type EventParticipationActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const idleEventParticipationActionState: EventParticipationActionState = {
  status: "idle",
};
