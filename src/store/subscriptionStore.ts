import { create } from "zustand";

type SubscriptionState = {
  isPro: boolean;
  setPro: (isPro: boolean) => void;
};

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPro: false,
  setPro: (isPro) => set({ isPro }),
}));
