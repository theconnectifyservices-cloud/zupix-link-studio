import { createFileRoute } from "@tanstack/react-router";
import { QACenter } from "@/features/qa";

export const Route = createFileRoute("/_authenticated/app/qa")({
  component: QACenter,
  head: () => ({
    meta: [
      { title: "Production QA — ZUPIX Link Studio" },
      { name: "description", content: "Release certification, accessibility, SEO and compliance status." },
    ],
  }),
});
