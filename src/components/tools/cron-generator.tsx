'use client';

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";
import cronstrue from "cronstrue";

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

type FieldMode = "every" | "specific" | "range" | "step";

interface FieldConfig {
  mode: FieldMode;
  specificValue: string;
  rangeStart: string;
  rangeEnd: string;
  stepValue: string;
}

interface FieldMeta {
  key: string;
  label: string;
  min: number;
  max: number;
  presets: { label: string; value: string }[];
}

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */

const DEFAULT_CONFIG: FieldConfig = {
  mode: "every",
  specificValue: "",
  rangeStart: "",
  rangeEnd: "",
  stepValue: "",
};

const FIELD_DEFS: FieldMeta[] = [
  {
    key: "minute",
    label: "Minute",
    min: 0,
    max: 59,
    presets: [
      { label: "Every (*)", value: "*" },
      { label: "Every 5 min", value: "*/5" },
      { label: "Every 10 min", value: "*/10" },
      { label: "Every 15 min", value: "*/15" },
      { label: "Every 30 min", value: "*/30" },
      { label: "At :00", value: "0" },
      { label: "At :15", value: "15" },
      { label: "At :30", value: "30" },
      { label: "At :45", value: "45" },
    ],
  },
  {
    key: "hour",
    label: "Hour",
    min: 0,
    max: 23,
    presets: [
      { label: "Every (*)", value: "*" },
      { label: "Every 2 hours", value: "*/2" },
      { label: "Every 4 hours", value: "*/4" },
      { label: "Every 6 hours", value: "*/6" },
      { label: "Every 12 hours", value: "*/12" },
      { label: "Midnight", value: "0" },
      { label: "6 AM", value: "6" },
      { label: "9 AM", value: "9" },
      { label: "Noon", value: "12" },
      { label: "6 PM", value: "18" },
    ],
  },
  {
    key: "dayOfMonth",
    label: "Day of Month",
    min: 1,
    max: 31,
    presets: [
      { label: "Every (*)", value: "*" },
      { label: "1st", value: "1" },
      { label: "10th", value: "10" },
      { label: "15th", value: "15" },
      { label: "20th", value: "20" },
      { label: "Last (31st)", value: "31" },
    ],
  },
  {
    key: "month",
    label: "Month",
    min: 1,
    max: 12,
    presets: [
      { label: "Every (*)", value: "*" },
      { label: "January", value: "1" },
      { label: "April", value: "4" },
      { label: "July", value: "7" },
      { label: "October", value: "10" },
      { label: "December", value: "12" },
    ],
  },
  {
    key: "dayOfWeek",
    label: "Day of Week",
    min: 0,
    max: 6,
    presets: [
      { label: "Every (*)", value: "*" },
      { label: "Weekdays (Mon-Fri)", value: "1-5" },
      { label: "Weekend", value: "0,6" },
      { label: "Monday", value: "1" },
      { label: "Tuesday", value: "2" },
      { label: "Wednesday", value: "3" },
      { label: "Thursday", value: "4" },
      { label: "Friday", value: "5" },
      { label: "Saturday", value: "6" },
      { label: "Sunday", value: "0" },
    ],
  },
];

const COMMON_PRESETS = [
  { label: "Every minute", expression: "* * * * *" },
  { label: "Every hour", expression: "0 * * * *" },
  { label: "Daily at midnight", expression: "0 0 * * *" },
  { label: "Every Monday", expression: "0 0 * * 1" },
  { label: "Weekdays at 9 AM", expression: "0 9 * * 1-5" },
  { label: "Monthly on 1st", expression: "0 0 1 * *" },
];

/* ═══════════════════════════════════════════════════════════
   Utility Functions
   ═══════════════════════════════════════════════════════════ */

/** Parse a single cron field string back into a FieldConfig (for applying presets). */
function parseFieldToConfig(field: string): FieldConfig {
  const cfg: FieldConfig = { ...DEFAULT_CONFIG };

  if (field === "*") {
    cfg.mode = "every";
  } else if (field.includes("/")) {
    cfg.mode = "step";
    const parts = field.split("/");
    cfg.stepValue = parts[1] ?? "";
  } else if (field.includes("-") && !field.includes(",")) {
    cfg.mode = "range";
    const [s, e] = field.split("-");
    cfg.rangeStart = s ?? "";
    cfg.rangeEnd = e ?? "";
  } else {
    cfg.mode = "specific";
    cfg.specificValue = field;
  }

  return cfg;
}

/** Convert a FieldConfig into the cron field string. */
function fieldToValue(config: FieldConfig): string {
  switch (config.mode) {
    case "every":
      return "*";
    case "specific":
      return config.specificValue.trim() || "*";
    case "range":
      if (config.rangeStart.trim() && config.rangeEnd.trim()) {
        return `${config.rangeStart.trim()}-${config.rangeEnd.trim()}`;
      }
      return "*";
    case "step":
      if (config.stepValue.trim()) {
        return `*/${config.stepValue.trim()}`;
      }
      return "*";
    default:
      return "*";
  }
}

/**
 * Parse a cron field into a set of matching integer values.
 * Handles: star, specific (5), comma-separated (1,3,5), range (1-5), step (star/5, 1-30/2).
 */
function parseFieldValues(
  field: string,
  min: number,
  max: number
): Set<number> {
  const values = new Set<number>();
  const parts = field.split(",");

  for (const part of parts) {
    const t = part.trim();
    if (t === "*") {
      for (let i = min; i <= max; i++) values.add(i);
    } else if (t.includes("/")) {
      const [rangeStr, stepStr] = t.split("/");
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) continue;

      let start = min;
      let end = max;

      if (rangeStr !== "*") {
        if (rangeStr.includes("-")) {
          const [s, e] = rangeStr.split("-").map(Number);
          if (!isNaN(s) && !isNaN(e)) {
            start = s;
            end = e;
          }
        } else {
          const n = parseInt(rangeStr, 10);
          if (!isNaN(n)) start = n;
        }
      }

      for (let i = start; i <= end; i += step) values.add(i);
    } else if (t.includes("-")) {
      const [s, e] = t.split("-").map(Number);
      if (!isNaN(s) && !isNaN(e)) {
        for (let i = s; i <= e; i++) values.add(i);
      }
    } else {
      const n = parseInt(t, 10);
      if (!isNaN(n)) values.add(n);
    }
  }

  return values;
}

/**
 * Calculate the next `count` execution times for a 5-field cron expression
 * starting from the current time (next minute).
 */
function getNextRuns(expression: string, count: number = 5): Date[] {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return [];

  try {
    const minutes = parseFieldValues(fields[0], 0, 59);
    const hours = parseFieldValues(fields[1], 0, 23);
    const doms = parseFieldValues(fields[2], 1, 31);
    const months = parseFieldValues(fields[3], 1, 12);
    const dows = parseFieldValues(fields[4], 0, 6);

    if (
      minutes.size === 0 ||
      hours.size === 0 ||
      doms.size === 0 ||
      months.size === 0 ||
      dows.size === 0
    ) {
      return [];
    }

    const sortedMinutes = [...minutes].sort((a, b) => a - b);
    const sortedHours = [...hours].sort((a, b) => a - b);
    const sortedMonths = [...months].sort((a, b) => a - b);

    const results: Date[] = [];
    const now = new Date();
    // Start from the next whole minute
    let d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes() + 1,
      0,
      0
    );

    let iterations = 0;
    const maxIterations = 524288;

    while (results.length < count && iterations < maxIterations) {
      iterations++;

      const month = d.getMonth() + 1;
      const dom = d.getDate();
      const dow = d.getDay();
      const hour = d.getHours();
      const minute = d.getMinutes();

      const matches =
        months.has(month) &&
        doms.has(dom) &&
        dows.has(dow) &&
        hours.has(hour) &&
        minutes.has(minute);

      if (matches) {
        results.push(new Date(d));
      }

      // ── Advance efficiently ──────────────────────────
      if (!months.has(month)) {
        const nextM = sortedMonths.find((x) => x > month);
        if (nextM !== undefined) {
          d = new Date(
            d.getFullYear(),
            nextM - 1,
            1,
            sortedHours[0],
            sortedMinutes[0],
            0,
            0
          );
        } else {
          d = new Date(
            d.getFullYear() + 1,
            sortedMonths[0] - 1,
            1,
            sortedHours[0],
            sortedMinutes[0],
            0,
            0
          );
        }
      } else if (!doms.has(dom) || !dows.has(dow)) {
        // Skip to the next day at the first valid hour/minute
        d = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate() + 1,
          sortedHours[0],
          sortedMinutes[0],
          0,
          0
        );
      } else if (!hours.has(hour)) {
        const nextH = sortedHours.find((x) => x > hour);
        if (nextH !== undefined) {
          d = new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            nextH,
            sortedMinutes[0],
            0,
            0
          );
        } else {
          d = new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate() + 1,
            sortedHours[0],
            sortedMinutes[0],
            0,
            0
          );
        }
      } else {
        // Within the right hour – advance one minute
        d = new Date(d.getTime() + 60_000);
      }
    }

    return results;
  } catch {
    return [];
  }
}

/** Human-readable description via cronstrue, with safe fallback. */
function getCronDescription(expression: string): string {
  try {
    const trimmed = expression.trim();
    if (!trimmed || trimmed.split(/\s+/).length !== 5) {
      return "Invalid cron expression";
    }
    return cronstrue.toString(trimmed, {
      throwExceptionOnParseError: false,
    });
  } catch {
    return "Unable to parse this expression";
  }
}

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */

function FieldCard({
  meta,
  config,
  onUpdate,
  onPreset,
}: {
  meta: FieldMeta;
  config: FieldConfig;
  onUpdate: (updates: Partial<FieldConfig>) => void;
  onPreset: (value: string) => void;
}) {
  return (
    <Card className="bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold tracking-tight">
            {meta.label}
          </CardTitle>
          <Select
            value={config.mode}
            onValueChange={(v) => onUpdate({ mode: v as FieldMode })}
          >
            <SelectTrigger className="h-7 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="every">Every (*)</SelectItem>
              <SelectItem value="specific">Specific</SelectItem>
              <SelectItem value="range">Range</SelectItem>
              <SelectItem value="step">Step</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Mode-specific inputs */}
        {config.mode === "specific" && (
          <Input
            type="text"
            placeholder={`${meta.min}-${meta.max} (e.g. 5 or 1,3,5)`}
            value={config.specificValue}
            onChange={(e) => onUpdate({ specificValue: e.target.value })}
            className="h-8 text-xs font-mono"
          />
        )}

        {config.mode === "range" && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={meta.min}
              max={meta.max}
              placeholder="Start"
              value={config.rangeStart}
              onChange={(e) => onUpdate({ rangeStart: e.target.value })}
              className="h-8 text-xs font-mono"
            />
            <span className="text-muted-foreground text-xs shrink-0">&ndash;</span>
            <Input
              type="number"
              min={meta.min}
              max={meta.max}
              placeholder="End"
              value={config.rangeEnd}
              onChange={(e) => onUpdate({ rangeEnd: e.target.value })}
              className="h-8 text-xs font-mono"
            />
          </div>
        )}

        {config.mode === "step" && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs whitespace-nowrap shrink-0">
              Every
            </span>
            <Input
              type="number"
              min="1"
              max={meta.max}
              placeholder="N"
              value={config.stepValue}
              onChange={(e) => onUpdate({ stepValue: e.target.value })}
              className="h-8 text-xs font-mono"
            />
          </div>
        )}

        {config.mode === "every" && (
          <div className="h-8 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground">
            *
          </div>
        )}

        {/* Field-specific presets */}
        <Select onValueChange={onPreset}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Quick preset\u2026" />
          </SelectTrigger>
          <SelectContent>
            {meta.presets.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

function ExpressionDisplay({
  expression,
  copiedExpr,
  onCopy,
}: {
  expression: string;
  copiedExpr: string | null;
  onCopy: (expr: string) => void;
}) {
  return (
    <div className="relative rounded-xl bg-zinc-950 border border-zinc-800 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <code className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-emerald-400 break-all">
          {expression}
        </code>
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-9 w-9"
          onClick={() => onCopy(expression)}
          aria-label="Copy cron expression"
        >
          {copiedExpr === expression ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function DescriptionBox({ description }: { description: string }) {
  return (
    <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-500/5 px-4 py-3">
      <p className="text-sm font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function NextRunsCard({ runs }: { runs: Date[] }) {
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Next 5 Executions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {runs.length > 0 ? (
          <ul className="space-y-2">
            {runs.map((run, i) => (
              <li key={i} className="flex items-start gap-3">
                <Badge
                  variant="secondary"
                  className="mt-0.5 shrink-0 h-5 w-5 items-center justify-center p-0 text-[10px] font-bold"
                >
                  {i + 1}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground leading-relaxed">
                  {fmt(run)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No valid execution times found. Check the expression.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */

export default function CronGenerator() {
  const { toast } = useToast();
  const [copiedExpr, setCopiedExpr] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, FieldConfig>>(() => ({
    minute: { ...DEFAULT_CONFIG },
    hour: { ...DEFAULT_CONFIG },
    dayOfMonth: { ...DEFAULT_CONFIG },
    month: { ...DEFAULT_CONFIG },
    dayOfWeek: { ...DEFAULT_CONFIG },
  }));
  const [manualExpr, setManualExpr] = useState("0 0 * * *");

  /* ── Derived values ─────────────────────────────────── */
  const builtExpr = useMemo(
    () => FIELD_DEFS.map((f) => fieldToValue(fields[f.key])).join(" "),
    [fields]
  );
  const builtDesc = useMemo(() => getCronDescription(builtExpr), [builtExpr]);
  const builtNextRuns = useMemo(() => getNextRuns(builtExpr, 5), [builtExpr]);
  const manualDesc = useMemo(() => getCronDescription(manualExpr), [manualExpr]);
  const manualNextRuns = useMemo(() => getNextRuns(manualExpr, 5), [manualExpr]);

  /* ── Handlers ───────────────────────────────────────── */
  const updateField = useCallback(
    (key: string, updates: Partial<FieldConfig>) => {
      setFields((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...updates },
      }));
    },
    []
  );

  const applyCommonPreset = useCallback((expr: string) => {
    const parts = expr.split(" ");
    if (parts.length !== 5) return;
    const keys = FIELD_DEFS.map((f) => f.key);
    const updated: Record<string, FieldConfig> = {};
    keys.forEach((key, i) => {
      updated[key] = parseFieldToConfig(parts[i]);
    });
    setFields(updated);
  }, []);

  const applyFieldPreset = useCallback((key: string, value: string) => {
    setFields((prev) => ({
      ...prev,
      [key]: parseFieldToConfig(value),
    }));
  }, []);

  const handleCopyToClipboard = useCallback(
    async (expr: string) => {
      try {
        await copyToClipboard(expr);
        setCopiedExpr(expr);
        toast({
          title: "Copied!",
          description: "Cron expression copied to clipboard.",
        });
        setTimeout(() => setCopiedExpr(null), 2000);
      } catch {
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder" className="gap-2">
            <Zap className="h-4 w-4" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="parser" className="gap-2">
            <Clock className="h-4 w-4" />
            Parser
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════ BUILDER TAB ═══════════════════ */}
        <TabsContent value="builder" className="mt-6 space-y-6">
          {/* Common presets */}
          <section>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
              Common Presets
            </Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_PRESETS.map((preset) => (
                <Badge
                  key={preset.label}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors py-1.5 px-3 text-xs"
                  onClick={() => applyCommonPreset(preset.expression)}
                >
                  {preset.label}
                </Badge>
              ))}
            </div>
          </section>

          {/* 5 field cards */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {FIELD_DEFS.map((meta) => (
                <FieldCard
                  key={meta.key}
                  meta={meta}
                  config={fields[meta.key]}
                  onUpdate={(u) => updateField(meta.key, u)}
                  onPreset={(v) => applyFieldPreset(meta.key, v)}
                />
              ))}
            </div>
          </section>

          {/* Expression display */}
          <ExpressionDisplay
            expression={builtExpr}
            copiedExpr={copiedExpr}
            onCopy={handleCopyToClipboard}
          />

          {/* Description */}
          <DescriptionBox description={builtDesc} />

          {/* Next 5 runs */}
          <NextRunsCard runs={builtNextRuns} />
        </TabsContent>

        {/* ═══════════════════ PARSER TAB ═══════════════════ */}
        <TabsContent value="parser" className="mt-6 space-y-6">
          <section className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Paste a Cron Expression
            </Label>
            <div className="flex gap-3">
              <Input
                value={manualExpr}
                onChange={(e) => setManualExpr(e.target.value)}
                placeholder="* * * * *"
                className="font-mono text-base sm:text-lg tracking-wider"
                spellCheck={false}
              />
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
                onClick={() => handleCopyToClipboard(manualExpr.trim())}
                aria-label="Copy cron expression"
              >
                {copiedExpr === manualExpr.trim() ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {manualExpr.trim().split(/\s+/).length !== 5 && (
              <p className="text-xs text-destructive">
                A standard cron expression has exactly 5 fields separated by spaces.
              </p>
            )}
          </section>

          {/* Parsed expression display */}
          <ExpressionDisplay
            expression={manualExpr.trim() || "* * * * *"}
            copiedExpr={copiedExpr}
            onCopy={handleCopyToClipboard}
          />

          {/* Description */}
          <DescriptionBox description={manualDesc} />

          {/* Next 5 runs */}
          <NextRunsCard runs={manualNextRuns} />
        </TabsContent>
      </Tabs>
    </div>
  );
}