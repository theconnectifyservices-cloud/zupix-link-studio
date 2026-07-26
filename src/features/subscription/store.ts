import { create } from "zustand";
import type { PlanCode, FeatureKey } from "./plans";

interface UpgradeContext {
  feature?: FeatureKey;
  suggestedPlan?: PlanCode;
  reason?: string;
}

interface SubscriptionUIState {
  upgradeOpen: boolean;
  upgradeContext: UpgradeContext;
  openUpgrade: (ctx?: UpgradeContext) => void;
  closeUpgrade: () => void;
}

export const useSubscriptionUI = create<SubscriptionUIState>((set) => ({
  upgradeOpen: false,
  upgradeContext: {},
  openUpgrade: (ctx = {}) => set({ upgradeOpen: true, upgradeContext: ctx }),
  closeUpgrade: () => set({ upgradeOpen: false, upgradeContext: {} }),
}));
