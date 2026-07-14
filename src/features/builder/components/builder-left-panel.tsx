import { useState } from "react";
import { Plus, Layers, Files } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlocksPanel } from "./blocks-panel";
import { LayersPanel } from "./layers-panel";
import { PagesPanel } from "./pages-panel";

/** Left sidebar with Add / Layers / Pages tabs. */
export function BuilderLeftPanel() {
  const [tab, setTab] = useState("blocks");
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b p-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="blocks" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add
            </TabsTrigger>
            <TabsTrigger value="layers" className="gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" /> Layers
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5 text-xs">
              <Files className="h-3.5 w-3.5" /> Pages
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <TabsContent value="blocks" className="mt-0"><BlocksPanel /></TabsContent>
          <TabsContent value="layers" className="mt-0"><LayersPanel /></TabsContent>
          <TabsContent value="pages" className="mt-0"><PagesPanel /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
