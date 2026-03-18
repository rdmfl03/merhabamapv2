import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FilterOption = {
  value: string;
  label: string;
};

type EventsFiltersProps = {
  locale: "de" | "tr";
  values: {
    city?: string;
    category?: string;
    date?: string;
    q?: string;
    sort?: string;
  };
  cities: FilterOption[];
  categories: FilterOption[];
  dateOptions: FilterOption[];
  labels: {
    searchPlaceholder: string;
    allCities: string;
    allCategories: string;
    allDates: string;
    sort: string;
    soonest: string;
    newest: string;
    apply: string;
    reset: string;
  };
};

export function EventsFilters({
  locale,
  values,
  cities,
  categories,
  dateOptions,
  labels,
}: EventsFiltersProps) {
  return (
    <form
      action={`/${locale}/events`}
      className="grid gap-2.5 rounded-[1.4rem] border border-border bg-white/95 p-3 shadow-soft sm:grid-cols-2 xl:grid-cols-[1.2fr_0.75fr_0.75fr_0.75fr_0.75fr_auto_auto]"
    >
      <label className="relative block">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={values.q}
          placeholder={labels.searchPlaceholder}
          className="pl-11"
        />
      </label>

      <select
        name="city"
        defaultValue={values.city ?? ""}
        className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{labels.allCities}</option>
        {cities.map((city) => (
          <option key={city.value} value={city.value}>
            {city.label}
          </option>
        ))}
      </select>

      <select
        name="category"
        defaultValue={values.category ?? ""}
        className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{labels.allCategories}</option>
        {categories.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>

      <select
        name="date"
        defaultValue={values.date ?? ""}
        className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{labels.allDates}</option>
        {dateOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        name="sort"
        defaultValue={values.sort ?? "soonest"}
        className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="soonest">{labels.soonest}</option>
        <option value="newest">{labels.newest}</option>
      </select>

      <Button type="submit">{labels.apply}</Button>
      <Button variant="outline" asChild>
        <a href={`/${locale}/events`}>{labels.reset}</a>
      </Button>
    </form>
  );
}
