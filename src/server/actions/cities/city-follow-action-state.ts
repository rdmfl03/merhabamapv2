export type CityFollowActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const idleCityFollowActionState: CityFollowActionState = { status: "idle" };
