"use client";

const SAVED_PLACES_STORAGE_KEY = "merhabamap:saved-place-ids";
const SAVED_PLACES_CHANGE_EVENT = "merhabamap:saved-places-change";

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function emitSavedPlacesChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(SAVED_PLACES_CHANGE_EVENT));
}

function parseSavedPlaceIds(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return Array.from(
      new Set(parsed.filter((value): value is string => typeof value === "string")),
    );
  } catch {
    return [];
  }
}

function writeSavedPlaceIds(placeIds: string[]) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(SAVED_PLACES_STORAGE_KEY, JSON.stringify(placeIds));
    emitSavedPlacesChange();
  } catch {
    // Ignore storage errors to keep the UI stable.
  }
}

export function getSavedPlaceIds() {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  return parseSavedPlaceIds(storage.getItem(SAVED_PLACES_STORAGE_KEY));
}

export function getSavedPlaceCount() {
  return getSavedPlaceIds().length;
}

export function isPlaceSaved(placeId: string) {
  if (!placeId) {
    return false;
  }

  return getSavedPlaceIds().includes(placeId);
}

export function savePlace(placeId: string) {
  if (!placeId) {
    return;
  }

  writeSavedPlaceIds([...getSavedPlaceIds(), placeId]);
}

export function unsavePlace(placeId: string) {
  if (!placeId) {
    return;
  }

  writeSavedPlaceIds(getSavedPlaceIds().filter((savedPlaceId) => savedPlaceId !== placeId));
}

export function toggleSavedPlace(placeId: string) {
  if (!placeId) {
    return false;
  }

  if (isPlaceSaved(placeId)) {
    unsavePlace(placeId);
    return false;
  }

  savePlace(placeId);
  return true;
}

export function subscribeToSavedPlaces(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== SAVED_PLACES_STORAGE_KEY) {
      return;
    }

    onChange();
  };

  const handleChange = () => {
    onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SAVED_PLACES_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SAVED_PLACES_CHANGE_EVENT, handleChange);
  };
}
