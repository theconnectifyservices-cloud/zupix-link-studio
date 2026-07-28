import { createFileRoute } from "@tanstack/react-router";
import { MySubscriptionPage } from "@/features/subscription/components/my-subscription-page";

export const Route = createFileRoute("/_authenticated/app/my-subscription")({
  head: () => ({
    meta: [
      { title: "My Subscription Plan · ZUPIX Link Studio" },
      { name: "description", content: "View your current plan, usage limits, renewal date and billing history." },
    ],
  }),
  component: MySubscriptionPage,
});
