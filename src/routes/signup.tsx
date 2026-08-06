import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  plan: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/signup")({
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    const s = search as { plan?: string };
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (data.session) throw redirect({ to: "/app" });
      if (s.plan) {
        window.sessionStorage.setItem("zupix:selected_plan", s.plan);
        if (s.plan !== "udaan") window.sessionStorage.setItem("zupix:auth_intent", "trial");
      }
    }
    throw redirect({
      to: "/auth",
      search: { mode: "signup", ...(s.plan ? { plan: s.plan } : {}) },
    });
  },
});
