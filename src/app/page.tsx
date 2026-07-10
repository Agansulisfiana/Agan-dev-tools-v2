"use client";

import { useAppStore } from "@/stores/app-store";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { getToolById } from "@/lib/tools-data";
import { ToolErrorBoundary } from "@/components/tool-error-boundary";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

function ToolLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded-lg bg-muted" />
      <div className="h-48 rounded-lg bg-muted" />
      <div className="h-32 rounded-lg bg-muted" />
      <div className="h-24 rounded-lg bg-muted" />
    </div>
  );
}

// Pre-declare all dynamic tool components at module level
const toolComponentMap: Record<string, ComponentType> = {
  "json-formatter": dynamic(() => import("@/components/tools/json-formatter"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "jwt-decoder": dynamic(() => import("@/components/tools/jwt-decoder"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "hash-generator": dynamic(() => import("@/components/tools/hash-generator"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "password-generator": dynamic(() => import("@/components/tools/password-generator"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "uuid-generator": dynamic(() => import("@/components/tools/uuid-generator"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "url-encoder": dynamic(() => import("@/components/tools/url-encoder"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "base64": dynamic(() => import("@/components/tools/base64-codec"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "color-picker": dynamic(() => import("@/components/tools/color-picker"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "timestamp-converter": dynamic(() => import("@/components/tools/timestamp-converter"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "regex-tester": dynamic(() => import("@/components/tools/regex-tester"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "qr-generator": dynamic(() => import("@/components/tools/qr-generator"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "cron-generator": dynamic(() => import("@/components/tools/cron-generator"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "diff-compare": dynamic(() => import("@/components/tools/diff-compare"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "barcode-generator": dynamic(() => import("@/components/tools/barcode-generator"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "unit-converter": dynamic(() => import("@/components/tools/unit-converter"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "network-tools": dynamic(() => import("@/components/tools/network-tools"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "command-cheatsheet": dynamic(() => import("@/components/tools/command-cheatsheet"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "http-tester": dynamic(() => import("@/components/tools/http-tester"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
  "file-hash": dynamic(() => import("@/components/tools/file-hash"), { loading: () => <ToolLoadingSkeleton />, ssr: false }),
};

function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-6 rounded-2xl bg-primary/10 p-5">
        <svg className="h-16 w-16 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Welcome to <span className="text-primary">Agan Dev Tools</span>
      </h2>
      <p className="mt-3 max-w-md text-muted-foreground">
        A modern developer toolkit with 19 productivity tools for programmers,
        system administrators, and IT professionals. Select a tool from the sidebar
        or press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">Ctrl+K</kbd> to search.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
        {[
          { label: "Tools", value: "19+" },
          { label: "Categories", value: "6" },
          { label: "Offline", value: "Yes" },
          { label: "License", value: "MIT" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border/50 bg-card/80 p-3">
            <div className="text-xl font-bold text-primary">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { activeToolId } = useAppStore();
  const toolInfo = getToolById(activeToolId);
  const ToolComponent = toolComponentMap[activeToolId];
  const ToolIcon = toolInfo?.icon;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            {toolInfo && ToolComponent ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      {ToolIcon && <ToolIcon className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">{toolInfo.name}</h2>
                      <p className="text-sm text-muted-foreground">{toolInfo.description}</p>
                    </div>
                  </div>
                </div>
                <ToolErrorBoundary>
                  <ToolComponent />
                </ToolErrorBoundary>
              </div>
            ) : (
              <WelcomePage />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}