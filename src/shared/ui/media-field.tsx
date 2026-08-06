/**
 * MediaField — universal media upload + picker control.
 *
 * Replaces raw "…URL" text inputs across the app. Users can:
 *   • Upload from computer (drag/drop, paste, file picker inside MediaPicker)
 *   • Choose from the workspace Media Library
 *   • Paste an external URL (advanced)
 *   • Preview, replace and remove the asset
 *
 * Backed by the existing `ImageField` used inside the Bio Builder so a single
 * upload UX is shared everywhere (Payments admin, White-label, SEO, SMTP,
 * Enterprise, Agency onboarding, etc.).
 */
export { ImageField as MediaField } from "@/features/builder/components/image-field";
export type { CropShape } from "@/features/media/components/file-picker";
