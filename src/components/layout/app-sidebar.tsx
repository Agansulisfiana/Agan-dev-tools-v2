"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { categories } from "@/lib/tools-data";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChevronDown, Wrench } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function SidebarNav() {
  const { activeToolId, setActiveTool, setSidebarOpen } = useAppStore();
  const [openCats, setOpenCats] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categories.forEach((c) => {
      initial[c.id] = true;
    });
    return initial;
  });

  const toggleCat = (id: string) => {
    setOpenCats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToolClick = (id: string) => {
    setActiveTool(id);
    // Close sidebar on mobile only
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <ScrollArea className="flex-1 min-h-0 px-2 py-3">
        <nav className="flex flex-col gap-1">
          {categories.map((cat) => (
            <Collapsible
              key={cat.id}
              open={openCats[cat.id]}
              onOpenChange={() => toggleCat(cat.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {cat.name}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      openCats[cat.id] && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-0.5 pb-1">
                  {cat.tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeToolId === tool.id;
                    return (
                      <Button
                        key={tool.id}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "h-9 justify-start gap-2.5 px-3 text-sm font-normal",
                          isActive &&
                            "bg-primary/10 text-primary font-medium"
                        )}
                        onClick={() => handleToolClick(tool.id)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{tool.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t border-border p-3">
        <p className="text-center text-xs text-muted-foreground">
          19 tools &middot; MIT License
        </p>
      </div>
    </>
  );
}

export function AppSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <>
      {/* Desktop sidebar - always visible, scrollable */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-sidebar"
      >
        <SidebarNav />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle className="flex items-center gap-2 text-left">
              <Wrench className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold tracking-tight">
                Agan <span className="text-primary">Dev Tools</span>
              </span>
            </SheetTitle>
          </SheetHeader>
          <SidebarNav />
        </SheetContent>
      </Sheet>
    </>
  );
}