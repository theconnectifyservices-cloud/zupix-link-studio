import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

/** Mobile hamburger trigger opening the sidebar in a sheet. */
export function MobileSidebarTrigger() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="[&>aside]:!flex [&>aside]:!w-full [&>aside]:!h-dvh [&>aside]:!static">
          <Sidebar />
        </div>
      </SheetContent>
    </Sheet>
  );
}
