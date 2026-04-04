import { describe, expect, it } from "vitest";

import {
  collapsePlaceCategoryFilterTokens,
  expandPlaceCategoryFilterTokensForQuery,
} from "@/lib/place-category-filter-groups";

describe("place-category-filter-groups", () => {
  it("expands multi-slug visual keys to all member slugs", () => {
    expect(expandPlaceCategoryFilterTokensForQuery(["cafe"])?.sort()).toEqual(
      ["cafes", "cafes-teahouses"].sort(),
    );
    expect(expandPlaceCategoryFilterTokensForQuery(["dining"])?.sort()).toEqual(
      ["catering", "gastronomy", "restaurants"].sort(),
    );
    expect(expandPlaceCategoryFilterTokensForQuery(["spiritual"])?.sort()).toEqual(
      ["mosques", "religious-sites"].sort(),
    );
    expect(expandPlaceCategoryFilterTokensForQuery(["retail"])?.sort()).toEqual(
      ["markets", "retail"].sort(),
    );
  });

  it("expands a single member slug to the full visual group", () => {
    expect(expandPlaceCategoryFilterTokensForQuery(["cafes"])?.sort()).toEqual(
      ["cafes", "cafes-teahouses"].sort(),
    );
    expect(expandPlaceCategoryFilterTokensForQuery(["catering"])?.sort()).toEqual(
      ["catering", "gastronomy", "restaurants"].sort(),
    );
  });

  it("leaves single-slug categories unchanged", () => {
    expect(expandPlaceCategoryFilterTokensForQuery(["bakeries"])).toEqual(["bakeries"]);
  });

  it("collapses member slugs and keys into one token per group", () => {
    expect(collapsePlaceCategoryFilterTokens(["cafes", "cafes-teahouses"])).toEqual(["cafe"]);
    expect(collapsePlaceCategoryFilterTokens(["cafe"])).toEqual(["cafe"]);
    expect(collapsePlaceCategoryFilterTokens(["restaurants", "catering"])).toEqual(["dining"]);
  });

  it("dedupes when expanding overlapping tokens", () => {
    const expanded = expandPlaceCategoryFilterTokensForQuery(["cafe", "cafes-teahouses"]);
    expect(expanded?.sort()).toEqual(["cafes", "cafes-teahouses"].sort());
  });
});
