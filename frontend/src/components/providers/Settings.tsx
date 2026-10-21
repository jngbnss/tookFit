"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { StoreSettings } from "@/lib/api/types";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const SettingsContext = createContext<StoreSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({ settings, children }: { settings: StoreSettings; children: ReactNode }) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
