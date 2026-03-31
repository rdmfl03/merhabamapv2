export type PlaceCollectionActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export const idlePlaceCollectionActionState: PlaceCollectionActionState = {
  status: "idle",
};
