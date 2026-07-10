"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, RefreshCw, Fingerprint, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";

// ── UUID Generation ──────────────────────────────────────────────

function generateUUIDv4(): string {
  return crypto.randomUUID();
}

function generateUUIDv7(): string {
  const timestamp = Date.now().toString(16).padStart(12, "0");

  // 10 random bytes → 20 hex chars (4 + 4 + 12 for groups 3, 4, 5)
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  // Assemble: 12 ts + 4 rand (group 3) + 4 rand (group 4) + 12 rand (group 5)
  let hex = timestamp + rand.slice(0, 4) + rand.slice(4, 8) + rand.slice(8, 20);

  // Set version bits → first char of group 3 to '7'
  hex = hex.substring(0, 12) + "7" + hex.substring(13);

  // Set variant bits → first char of group 4 to '8' (binary 10xx)
  hex = hex.substring(0, 16) + "8" + hex.substring(17);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// ── Formatting ───────────────────────────────────────────────────

function formatUUID(
  uuid: string,
  uppercase: boolean,
  hyphens: boolean
): string {
  let result = uuid;
  if (!hyphens) result = result.replace(/-/g, "");
  if (uppercase) result = result.toUpperCase();
  return result;
}

// ── Component ────────────────────────────────────────────────────

export default function UUIDGenerator() {
  const { toast } = useToast();

  const [version, setVersion] = useState<"v4" | "v7">("v4");
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [uuids, setUuids] = useState<string[]>([]);
  const [bulkCount, setBulkCount] = useState(10);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generate = useCallback(
    (count: number) => {
      const fn = version === "v4" ? generateUUIDv4 : generateUUIDv7;
      const results = Array.from({ length: count }, () =>
        formatUUID(fn(), uppercase, hyphens)
      );
      setUuids(results);
      setCopiedIdx(null);
      setCopiedAll(false);
    },
    [version, uppercase, hyphens]
  );

  const handleSingle = () => generate(1);
  const handleBulk = () => {
    const count = Math.min(100, Math.max(1, bulkCount));
    generate(count);
  };

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await copyToClipboard(text);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
    } catch {
      toast({ title: "Error", description: "Failed to copy.", variant: "destructive" });
    }
  };

  const handleCopyOne = async (idx: number) => {
    await handleCopyToClipboard(uuids[idx], "UUID");
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAll = async () => {
    await handleCopyToClipboard(uuids.join("\n"), "All UUIDs");
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // ── Structure diagram pieces ───────────────────────────────────
  const segments = [
    { label: "time_low", chars: "xxxxxxxx", color: "text-emerald-400", len: 8 },
    { label: "time_mid", chars: "xxxx", color: "text-teal-400", len: 4 },
    { label: "time_hi & ver", chars: "xxxx", color: "text-green-400", len: 4 },
    { label: "clock_seq & var", chars: "xxxx", color: "text-lime-400", len: 4 },
    { label: "node", chars: "xxxxxxxxxxxx", color: "text-emerald-300", len: 12 },
  ];

  return (
    <div className="space-y-6">
      {/* ── Generator Card ────────────────────────────────────── */}
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Fingerprint className="h-5 w-5 text-emerald-500" />
            UUID Generator
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Version & Options row */}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
            {/* Version selector */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Version
              </Label>
              <Select
                value={version}
                onValueChange={(v) => setVersion(v as "v4" | "v7")}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v4">UUID v4 (Random)</SelectItem>
                  <SelectItem value="v7">UUID v7 (Time-based)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Uppercase toggle */}
            <div className="flex flex-col items-start gap-1.5 pt-5">
              <div className="flex items-center gap-2">
                <Switch
                  id="uppercase"
                  checked={uppercase}
                  onCheckedChange={setUppercase}
                />
                <Label htmlFor="uppercase" className="cursor-pointer text-sm">
                  Uppercase
                </Label>
              </div>
            </div>

            {/* Hyphens toggle */}
            <div className="flex flex-col items-start gap-1.5 pt-5">
              <div className="flex items-center gap-2">
                <Switch
                  id="hyphens"
                  checked={hyphens}
                  onCheckedChange={setHyphens}
                />
                <Label htmlFor="hyphens" className="cursor-pointer text-sm">
                  Hyphens
                </Label>
              </div>
            </div>
          </div>

          {/* Single generate */}
          <Button
            onClick={handleSingle}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate UUID
          </Button>

          {/* Bulk section */}
          <div className="border-border/50 space-y-3 rounded-lg border p-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Layers className="h-4 w-4" />
              Bulk Generate
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="bulk-count" className="text-xs text-muted-foreground">
                  Count (1–100)
                </Label>
                <Input
                  id="bulk-count"
                  type="number"
                  min={1}
                  max={100}
                  value={bulkCount}
                  onChange={(e) => setBulkCount(Number(e.target.value))}
                  className="w-28"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleBulk}
                className="border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/10 hover:text-emerald-300"
              >
                <Layers className="mr-2 h-4 w-4" />
                Generate {Math.min(100, Math.max(1, bulkCount))} UUIDs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Results Card ──────────────────────────────────────── */}
      {uuids.length > 0 && (
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-medium text-muted-foreground">
              Generated UUIDs
              <span className="ml-2 text-xs text-muted-foreground/60">
                ({uuids.length})
              </span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAll}
              className="h-8 gap-1.5 text-xs text-emerald-400 hover:text-emerald-300"
            >
              {copiedAll ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy All
            </Button>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="custom-scrollbar max-h-96 space-y-1.5 overflow-y-auto rounded-md border border-border/50 bg-muted/30 p-2">
              {uuids.map((uuid, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors hover:bg-muted/60"
                >
                  <code className="truncate text-sm font-mono text-foreground/90">
                    {uuid}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    onClick={() => handleCopyOne(idx)}
                  >
                    {copiedIdx === idx ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── UUID Format Info Card ─────────────────────────────── */}
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Layers className="h-5 w-5 text-emerald-500" />
            UUID Format Structure
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Visual diagram */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/40 p-4 font-mono text-sm">
            {segments.map((seg, i) => (
              <span key={seg.label}>
                <span className={seg.color}>{seg.chars}</span>
                {i < segments.length - 1 && (
                  <span className="mx-1 text-muted-foreground">-</span>
                )}
              </span>
            ))}
          </div>

          {/* Segment lengths */}
          <div className="flex flex-wrap items-center gap-1 justify-center text-xs font-mono text-muted-foreground/70">
            <span className="w-[8.25ch] text-center">8</span>
            <span className="mx-1 w-2 text-center">-</span>
            <span className="w-[4.25ch] text-center">4</span>
            <span className="mx-1 w-2 text-center">-</span>
            <span className="w-[4.25ch] text-center">4</span>
            <span className="mx-1 w-2 text-center">-</span>
            <span className="w-[4.25ch] text-center">4</span>
            <span className="mx-1 w-2 text-center">-</span>
            <span className="w-[12.25ch] text-center">12</span>
          </div>

          {/* Color legend */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {segments.map((seg) => (
              <div
                key={seg.label}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <span
                  className={`inline-block h-3 w-3 rounded-sm ${seg.color.replace("text-", "bg-").replace("-400", "-500/70").replace("-300", "-400/70")}`}
                />
                <span className="font-medium text-foreground/80">{seg.label}</span>
                <span className="text-xs text-muted-foreground/60">
                  ({seg.len} hex chars)
                </span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-2 rounded-lg border border-border/40 bg-muted/20 p-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground/80">UUID v4</strong> — Randomly generated.
              Version nibble is <code className="text-emerald-400">4</code> in the
              3rd group. Provides 122 bits of randomness.
            </p>
            <p>
              <strong className="text-foreground/80">UUID v7</strong> — Time-ordered.
              First 48 bits are a millisecond-precision Unix timestamp.
              Version nibble is <code className="text-emerald-400">7</code> in the
              3rd group. Sortable by generation time.
            </p>
            <p>
              <strong className="text-foreground/80">Variant</strong> — The first 2 bits
              of the 4th group are <code className="text-emerald-400">10</code> (RFC&nbsp;4122
              variant), making the first hex digit one of{" "}
              <code className="text-emerald-400">8</code>,{" "}
              <code className="text-emerald-400">9</code>,{" "}
              <code className="text-emerald-400">a</code>,{" "}
              <code className="text-emerald-400">b</code>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}