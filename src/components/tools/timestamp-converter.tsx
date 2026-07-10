"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Clock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function toRFC2822(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const d = date.getUTCDate();
  const dayName = days[date.getUTCDay()];
  const monthName = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hh = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${dayName}, ${pad(d)} ${monthName} ${year} ${hh}:${mm}:${ss} +0000`;
}

function toRelativeTime(target: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - target.getTime();
  const absDiff = Math.abs(diffMs);
  const isFuture = diffMs < 0;
  const suffix = isFuture ? "from now" : "ago";

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ${suffix}`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ${suffix}`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ${suffix}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ${suffix}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ${suffix}`;
  if (seconds > 0) return `${seconds} second${seconds > 1 ? "s" : ""} ${suffix}`;
  return "just now";
}

function detectAndConvert(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Pure numeric — treat as Unix timestamp
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    // Heuristic: if > 10^12 it's ms, else seconds
    if (num > 1e12) {
      return new Date(num);
    } else {
      return new Date(num * 1000);
    }
  }

  // ISO 8601
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function formatDuration(ms: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  display: string;
} {
  const abs = Math.abs(ms);
  const totalSeconds = Math.floor(abs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  if (seconds > 0 || parts.length === 0)
    parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);

  return { days, hours, minutes, seconds, totalSeconds, display: parts.join(", ") };
}

function getTimezoneInfo(): { name: string; offset: string } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMin = new Date().getTimezoneOffset();
    const sign = offsetMin <= 0 ? "+" : "-";
    const absMin = Math.abs(offsetMin);
    const h = Math.floor(absMin / 60);
    const m = absMin % 60;
    const offsetStr = `UTC${sign}${h}${m > 0 ? `:${String(m).padStart(2, "0")}` : ""}`;
    return { name: tz, offset: offsetStr };
  } catch {
    return { name: "Unknown", offset: "UTC" };
  }
}

// ─── Copy Button ────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    copyToClipboard(value).then(() => {
      setCopied(true);
      toast({ title: "Copied!", description: "Copied to clipboard." });
      setTimeout(() => setCopied(false), 1500);
    });
  }, [value, toast]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

// ─── Format Row ─────────────────────────────────────────────────────────────

function FormatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-muted/30 px-3 py-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={`truncate font-mono text-sm ${
            highlight ? "text-emerald-400 font-semibold" : "text-foreground"
          }`}
        >
          {value || "—"}
        </span>
      </div>
      <CopyButton value={value} />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function TimestampConverter() {
  const { toast } = useToast();

  // Live clock
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const tzInfo = getTimezoneInfo();
  const liveSeconds = Math.floor(now / 1000);
  const liveMillis = now;

  // ── Timestamp → Date conversion ──
  const [tsInput, setTsInput] = useState("");
  const parsedDate = detectAndConvert(tsInput);

  // ── Date → Timestamp conversion ──
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const dateFromPickers = (() => {
    if (!dateStr) return null;
    const combined = timeStr ? `${dateStr}T${timeStr}` : dateStr;
    const d = new Date(combined);
    return isNaN(d.getTime()) ? null : d;
  })();

  // Which conversion to show in the result area
  const activeDate = parsedDate || dateFromPickers || null;

  // ── Relative time calculator ──
  const [relTs1, setRelTs1] = useState("");
  const [relTs2, setRelTs2] = useState("");
  const relDate1 = detectAndConvert(relTs1);
  const relDate2 = detectAndConvert(relTs2);
  const relResult = (() => {
    if (!relDate1 || !relDate2) return null;
    const diff = relDate2.getTime() - relDate1.getTime();
    return formatDuration(diff);
  })();

  // ── Custom format ──
  const [customFormat, setCustomFormat] = useState("YYYY-MM-DD HH:mm:ss");

  function applyCustomFormat(date: Date, fmt: string): string {
    const pad = (n: number, w = 2) => String(n).padStart(w, "0");
    return fmt
      .replace("YYYY", String(date.getFullYear()))
      .replace("YY", String(date.getFullYear()).slice(-2))
      .replace("MM", pad(date.getMonth() + 1))
      .replace("DD", pad(date.getDate()))
      .replace("HH", pad(date.getHours()))
      .replace("mm", pad(date.getMinutes()))
      .replace("ss", pad(date.getSeconds()))
      .replace("SSS", pad(date.getMilliseconds(), 3));
  }

  // ── Now button ──
  const handleNow = () => {
    const d = new Date();
    setTsInput(String(Math.floor(d.getTime() / 1000)));
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    setDateStr(`${y}-${m}-${day}`);
    setTimeStr(`${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`);
    toast({ title: "Set to now", description: "Timestamp updated to current time." });
  };

  function pad2(n: number) {
    return String(n).padStart(2, "0");
  }

  // ── Live clock display ──
  const liveDate = new Date(now);
  const liveTimeString = liveDate.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const liveDateString = liveDate.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Hero: Live Timestamp ── */}
      <Card className="border-border/60 bg-gradient-to-br from-card via-card to-emerald-950/20 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4 text-emerald-400" />
              Current Timestamp
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                {tzInfo.offset}
              </Badge>
              <Badge variant="secondary" className="text-xs font-normal">
                {tzInfo.name}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seconds */}
          <div className="group relative rounded-lg border border-border/50 bg-background/60 px-4 py-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Unix (seconds)
              </span>
              <CopyButton value={String(liveSeconds)} />
            </div>
            <p className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {liveSeconds}
            </p>
          </div>

          {/* Milliseconds */}
          <div className="group relative rounded-lg border border-border/50 bg-background/60 px-4 py-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Unix (milliseconds)
              </span>
              <CopyButton value={String(liveMillis)} />
            </div>
            <p className="font-mono text-lg font-semibold tracking-tight text-muted-foreground sm:text-xl">
              {liveMillis}
            </p>
          </div>

          {/* Live date/time */}
          <div className="flex flex-col items-center gap-1 pt-1 text-center">
            <p className="font-mono text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
              {liveTimeString}
            </p>
            <p className="text-sm text-muted-foreground">{liveDateString}</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Input & Conversion ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Input */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Input</CardTitle>
              <Button size="sm" variant="outline" onClick={handleNow} className="gap-1.5 text-xs">
                <Clock className="h-3 w-3" />
                Now
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Unix timestamp input */}
            <div className="space-y-2">
              <Label htmlFor="ts-input" className="text-xs font-medium text-muted-foreground">
                Unix Timestamp
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="ts-input"
                  type="text"
                  placeholder="e.g. 1700000000 or 1700000000000"
                  value={tsInput}
                  onChange={(e) => setTsInput(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Auto-detects seconds vs milliseconds by magnitude
              </p>
            </div>

            {/* Date/Time pickers */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Or enter a date
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="font-mono text-sm"
                />
                <Input
                  type="time"
                  step="1"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Auto-detect badge */}
            {tsInput && parsedDate && (
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 text-xs"
              >
                Detected as{" "}
                {Number(tsInput.trim()) > 1e12 ? "milliseconds" : "seconds"}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Right: Results */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Conversions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {activeDate ? (
              <>
                <FormatRow
                  label="Unix (seconds)"
                  value={String(Math.floor(activeDate.getTime() / 1000))}
                />
                <FormatRow
                  label="Unix (milliseconds)"
                  value={String(activeDate.getTime())}
                />
                <FormatRow label="ISO 8601" value={activeDate.toISOString()} />
                <FormatRow
                  label="RFC 2822"
                  value={toRFC2822(activeDate)}
                />
                <FormatRow
                  label="Relative"
                  value={toRelativeTime(activeDate, new Date(now))}
                  highlight
                />
                <FormatRow
                  label="Custom"
                  value={applyCustomFormat(activeDate, customFormat || "YYYY-MM-DD HH:mm:ss")}
                />
              </>
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Enter a timestamp or pick a date to see conversions
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Custom Format ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Custom Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="YYYY-MM-DD HH:mm:ss"
              value={customFormat}
              onChange={(e) => setCustomFormat(e.target.value)}
              className="font-mono text-sm flex-1"
            />
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["YYYY-MM-DD", "HH:mm:ss", "YYYY/MM/DD", "DD.MM.YYYY", "MM/DD/YYYY HH:mm"].map(
                (f) => (
                  <Button
                    key={f}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] font-mono"
                    onClick={() => setCustomFormat(f)}
                  >
                    {f}
                  </Button>
                ),
              )}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Tokens: <code className="font-mono text-foreground/80">YYYY</code> year,{" "}
            <code className="font-mono text-foreground/80">MM</code> month,{" "}
            <code className="font-mono text-foreground/80">DD</code> day,{" "}
            <code className="font-mono text-foreground/80">HH</code> hour,{" "}
            <code className="font-mono text-foreground/80">mm</code> minute,{" "}
            <code className="font-mono text-foreground/80">ss</code> second,{" "}
            <code className="font-mono text-foreground/80">SSS</code> ms
          </p>
        </CardContent>
      </Card>

      {/* ── Relative Time Calculator ── */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Relative Time Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid items-end gap-3 sm:grid-cols-[1fr,auto,1fr]">
            <div className="space-y-2">
              <Label htmlFor="rel-ts1" className="text-xs font-medium text-muted-foreground">
                Timestamp A
              </Label>
              <Input
                id="rel-ts1"
                type="text"
                placeholder="e.g. 1700000000"
                value={relTs1}
                onChange={(e) => setRelTs1(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center justify-center pb-0.5">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rel-ts2" className="text-xs font-medium text-muted-foreground">
                Timestamp B
              </Label>
              <Input
                id="rel-ts2"
                type="text"
                placeholder="e.g. 1700003600"
                value={relTs2}
                onChange={(e) => setRelTs2(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>

          {relResult ? (
            <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Difference (B − A)
              </p>
              <p className="font-mono text-lg font-bold text-emerald-400">
                {relResult.display}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <Badge variant="secondary" className="font-mono text-xs">
                  {relResult.totalSeconds.toLocaleString()}s total
                </Badge>
                {relResult.days > 0 && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {relResult.days}d {relResult.hours}h {relResult.minutes}m {relResult.seconds}s
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border/60 py-6">
              <p className="text-sm text-muted-foreground">
                Enter two timestamps to calculate the difference
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}