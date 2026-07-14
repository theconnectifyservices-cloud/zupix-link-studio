import { createFileRoute } from "@tanstack/react-router";
import { useThemeStore } from "@/stores/theme.store";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/settings/preferences")({
  component: PreferencesSettings,
});

function PreferencesSettings() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label>Appearance</Label>
        <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
