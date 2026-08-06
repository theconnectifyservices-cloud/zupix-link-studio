import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PlanCode, FeatureKey } from "./plans";

export interface UpgradeContext {
  feature?: FeatureKey;
  suggestedPlan?: PlanCode;
  reason?: string;
  // Metadata for the enterprise feature dialog
  featureName?: string;
  benefits?: string[];
  illustration?: string;
}

interface SubscriptionUIState {
  upgradeOpen: boolean;
  featureDialogOpen: boolean;
  upgradeContext: UpgradeContext;
  dismissedFeatures: Record<string, number>; // timestamp of dismissal
  
  openUpgrade: (ctx?: UpgradeContext) => void;
  closeUpgrade: () => void;
  
  openFeatureDialog: (ctx: UpgradeContext) => void;
  closeFeatureDialog: () => void;
  
  isDismissed: (featureKey: string) => boolean;
  dismissFeature: (featureKey: string) => void;
}

export const useSubscriptionUI = create<SubscriptionUIState>()(
  persist(
    (set, get) => ({
      upgradeOpen: false,
      featureDialogOpen: false,
      upgradeContext: {},
      dismissedFeatures: {},

      openUpgrade: (ctx = {}) => set({ 
        upgradeOpen: true, 
        featureDialogOpen: false, 
        upgradeContext: ctx 
      }),
      
      closeUpgrade: () => set({ upgradeOpen: false, upgradeContext: {} }),

      openFeatureDialog: (ctx) => {
        const featureKey = ctx.feature || ctx.featureName || "unknown";
        // If it's explicitly called, we usually show it even if dismissed, 
        // but the caller can check isDismissed first.
        set({ 
          featureDialogOpen: true, 
          upgradeOpen: false, 
          upgradeContext: ctx 
        });
      },

      closeFeatureDialog: () => set({ featureDialogOpen: false, upgradeContext: {} }),

      isDismissed: (featureKey) => {
        const timestamp = get().dismissedFeatures[featureKey];
        if (!timestamp) return false;
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return now - timestamp < twentyFourHours;
      },

      dismissFeature: (featureKey) => {
        set((state) => ({
          dismissedFeatures: {
            ...state.dismissedFeatures,
            [featureKey]: Date.now(),
          },
          featureDialogOpen: false,
        }));
      },
    }),
    {
      name: "zupix-subscription-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ dismissedFeatures: state.dismissedFeatures }),
    }
  )
);
