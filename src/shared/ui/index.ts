/**
 * Shared UI barrel. Wraps shadcn/ui primitives + custom foundation components
 * so features import from a single stable path: `@/shared/ui`.
 */
export * from "@/components/ui/button";
export * from "@/components/ui/input";
export * from "@/components/ui/textarea";
export * from "@/components/ui/select";
export * from "@/components/ui/checkbox";
export * from "@/components/ui/radio-group";
export * from "@/components/ui/switch";
export * from "@/components/ui/card";
export * from "@/components/ui/avatar";
export * from "@/components/ui/badge";
export * from "@/components/ui/dialog";
export * from "@/components/ui/drawer";
export * from "@/components/ui/tabs";
export * from "@/components/ui/accordion";
export * from "@/components/ui/tooltip";
export * from "@/components/ui/dropdown-menu";
export * from "@/components/ui/alert";
export * from "@/components/ui/progress";
export * from "@/components/ui/skeleton";
export * from "@/components/ui/table";
export * from "@/components/ui/pagination";
export * from "@/components/ui/breadcrumb";
export * from "@/components/ui/label";
export * from "@/components/ui/separator";
export * from "@/components/ui/sheet";
export * from "@/components/ui/popover";
export * from "@/components/ui/command";
export * from "@/components/ui/scroll-area";
export * from "@/components/ui/form";

// Custom foundation primitives
export * from "./spinner";
export * from "./empty-state";
export * from "./error-state";
export * from "./search-input";
export * from "./file-upload";
export * from "./image-upload";
export * from "./page-loader";
export * from "./card-loader";
export * from "./button-loader";
export { toast } from "sonner";
export { Toaster } from "@/components/ui/sonner";
