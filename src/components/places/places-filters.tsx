import { Search } from "lucide-react";

import { ListingCategoryMultiSelect } from "@/components/filters/listing-category-multi-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LISTING_ALL_CITIES_SLUG } from "@/lib/listing-city-filter";

type FilterOption = {
  slug: string;
  label: string;
};

type PlacesFiltersProps = {
  locale: "de" | "tr";
  /** Preserve `?layout=grid` when submitting the filter form. */
  preserveGridLayout?: boolean;
  values: {
    city?: string;
    categories?: string[];
    q?: string;
    sort?: string;
  };
  cities: FilterOption[];
  categories: FilterOption[];
  labels: {
    searchPlaceholder: string;
    city: string;
    category: string;
    sort: string;
    pickCityFirst: string;
    allCities: string;
    allCategories: string;
    categoriesFilterLabel: string;
    categoriesFilterHint: string;
    categoriesDropdownAll: string;
    categoriesDropdownMultiple: string;
    recommended: string;
    newest: string;
    apply: string;
    reset: string;
  };
};

export function PlacesFilters({
  locale,
  preserveGridLayout = false,
  values,
  cities,
  categories,
  labels,
}: PlacesFiltersProps) {
  return (
    <form
      method="get"
      action={`/${locale}/places`}
      className="grid gap-2.5 rounded-[1.4rem] border border-border bg-white/95 p-3 shadow-soft sm:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto_auto]"
    >
      {preserveGridLayout ? <input type="hidden" name="layout" value="grid" /> : null}
      <label className="relative block">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={values.q}
          placeholder={labels.searchPlaceholder}
          className="pl-11"
        />
      </label>

      <label className="block">
        <span className="sr-only">{labels.city}</span>
        <select
          name="city"
          defaultValue={values.city ?? ""}
          className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{labels.pickCityFirst}</option>
          <option value={LISTING_ALL_CITIES_SLUG}>{labels.allCities}</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block min-w-0">
        <span className="sr-only">{labels.category}</span>
        <ListingCategoryMultiSelect
          key={[...(values.categories ?? [])].sort().join("\0")}
          options={categories.map((category) => ({
            value: category.slug,
            label: category.label,
          }))}
          defaultSelected={values.categories ?? []}
          labels={{
            filterLabel: labels.categoriesFilterLabel,
            hint: labels.categoriesFilterHint,
            dropdownAll: labels.categoriesDropdownAll,
            dropdownMultiple: labels.categoriesDropdownMultiple,
          }}
        />
      </label>

      <label className="block">
        <span className="sr-only">{labels.sort}</span>
        <select
          name="sort"
          defaultValue={values.sort ?? "recommended"}
          className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="recommended">{labels.recommended}</option>
          <option value="newest">{labels.newest}</option>
        </select>
      </label>

      <Button type="submit">{labels.apply}</Button>
      <Button variant="outline" asChild>
        <a href={`/${locale}/places`}>{labels.reset}</a>
      </Button>
    </form>
  );
}
