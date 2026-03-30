import type { Metadata } from "next";

export const robotsNoIndex: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
};

export const robotsIndexFollow: NonNullable<Metadata["robots"]> = {
  index: true,
  follow: true,
};
