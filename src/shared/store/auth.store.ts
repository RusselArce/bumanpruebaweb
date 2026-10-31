import { create } from "zustand";
import type { User, Subscription } from "@supabase/supabase-js";
import { supabase } from "@/shared/utils/supabase";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

type AuthStore = {
  loginGoogle: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>(() => ({
  loginGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  },
  cerrarSesion: async () => {
    await supabase.auth.signOut();
  },
}));

type SubscriptionStore = {
  user: User | null;
  authSub: Subscription | null;
  setUser: (user: User | null) => void;
  init: () => Promise<void>;
  destroy: () => void;
};

export const useSubcription = create<SubscriptionStore>((set, get) => ({
  user: null,
  authSub: null,

  setUser: (user) => set({ user }),

  init: async () => {
    if (get().authSub) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ user: session?.user ?? null });
    } catch (e: any) {
      const isAbort =
        e?.name === "AbortError" ||
        String(e?.message ?? "").toLowerCase().includes("aborted");

      if (isAbort) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          set({ user: user ?? null });
        } catch {
          set({ user: null });
        }
      } else {
        throw e;
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({ user });

      if (!user) {
        useEmpresaStore.getState().setItemSelect(null);
      }
    });

    set({ authSub: subscription });
  },

  destroy: () => {
    const sub = get().authSub;
    if (sub) sub.unsubscribe();
    set({ authSub: null });
  },
}));
