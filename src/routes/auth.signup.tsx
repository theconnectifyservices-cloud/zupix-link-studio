import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  plan: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/signup")({
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (data.session) throw redirect({ to: "/app" });
      if (search.plan) {
        window.sessionStorage.setItem("zupix:selected_plan", search.plan);
        if (search.plan !== "udaan") window.sessionStorage.setItem("zupix:auth_intent", "trial");
      }
    }
    throw redirect({
      to: "/auth",
      search: { mode: "signup", ...(search.plan ? { plan: search.plan } : {}) },
    });
  },
});
