"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Search,
  Menu,
  Wrench,
  Github,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChiptunePlayer } from "@/components/chiptune-player";
import { useAppStore } from "@/stores/app-store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { categories, searchTools, type ToolInfo } from "@/lib/tools-data";

function SearchDialog() {
  const { searchOpen, setSearchOpen, setActiveTool } = useAppStore();
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchTools(query), [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [searchOpen, setSearchOpen]);

  const handleSelect = (tool: ToolInfo) => {
    setActiveTool(tool.id);
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
      <CommandInput
        placeholder="Search tools..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No tools found.</CommandEmpty>
        {categories.map((cat) => {
          const catTools = results.filter((t) => t.category === cat.id);
          if (catTools.length === 0) return null;
          return (
            <React.Fragment key={cat.id}>
              <CommandGroup heading={cat.name}>
                {catTools.map((tool) => (
                  <CommandItem
                    key={tool.id}
                    value={tool.id}
                    onSelect={() => handleSelect(tool)}
                  >
                    <tool.icon className="mr-2 h-4 w-4" />
                    <span>{tool.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}

export function AppHeader() {
  const { toggleSidebar, setSearchOpen } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <SearchDialog />
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">
            Agan <span className="text-primary">Dev Tools</span>
          </h1>
        </div>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 gap-2 text-muted-foreground sm:flex"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search tools...</span>
          <kbd className="pointer-events-none ml-1 inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:hidden"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>

        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}

        <ChiptunePlayer />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          asChild
        >
          <a
            href="https://github.com/agansulisfiana/agan-dev-tools-v2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
          </a>
        </Button>
      </header>
    </>
  );
}