import { z } from "zod";

const RESERVED = new Set([
  "admin","administrator","root","api","www","app","auth","login","signup","signin",
  "logout","dashboard","settings","profile","account","user","users","help","support",
  "about","contact","privacy","terms","blog","docs","pricing","zupix","link","links",
  "bio","home","explore","discover","trending","new","test","demo","null","undefined",
  "system","staff","moderator","mod","owner","me","you","it","onboarding","billing",
  "workspace","workspaces","org","organization","team","teams","invite","share",
]);

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Must be at least 3 characters")
  .max(30, "Must be less than 30 characters")
  .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, and underscores only")
  .refine((v) => !RESERVED.has(v), "This username is reserved");

export const emailSchema = z.string().trim().email("Invalid email").max(255);

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "Too long")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[0-9]/, "Add a number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password required"),
  remember: z.boolean().optional(),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export const onboardingSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your name").max(80),
  username: usernameSchema,
  accountType: z.enum(["creator", "business", "agency", "personal"]),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  country: z.string().trim().max(60).optional().or(z.literal("")),
  timezone: z.string().trim().max(60).optional().or(z.literal("")),
  language: z.string().trim().max(10).optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
