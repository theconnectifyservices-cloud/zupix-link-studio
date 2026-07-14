import { z } from "zod";

const RESERVED = new Set([
  "admin",
  "administrator",
  "root",
  "api",
  "www",
  "app",
  "auth",
  "login",
  "signup",
  "signin",
  "logout",
  "dashboard",
  "settings",
  "profile",
  "account",
  "user",
  "users",
  "help",
  "support",
  "about",
  "contact",
  "privacy",
  "terms",
  "blog",
  "docs",
  "pricing",
  "zupix",
  "link",
  "links",
  "bio",
  "home",
  "explore",
  "discover",
  "trending",
  "new",
  "test",
  "demo",
  "null",
  "undefined",
]);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters")
  .max(50, "Too long")
  .regex(/^[a-z0-9_-]+$/, "Lowercase letters, numbers, hyphen, underscore only")
  .refine((v) => !RESERVED.has(v), "This slug is reserved");

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  slug: slugSchema,
  category: z.enum([
    "creator",
    "business",
    "agency",
    "personal",
    "portfolio",
    "product",
    "event",
    "other",
  ]),
  description: z.string().trim().max(280).optional().or(z.literal("")),
});

export const renameProjectSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type RenameProjectInput = z.infer<typeof renameProjectSchema>;

export const PROJECT_CATEGORIES = [
  { value: "creator", label: "Creator" },
  { value: "business", label: "Business" },
  { value: "agency", label: "Agency" },
  { value: "personal", label: "Personal" },
  { value: "portfolio", label: "Portfolio" },
  { value: "product", label: "Product" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
] as const;
