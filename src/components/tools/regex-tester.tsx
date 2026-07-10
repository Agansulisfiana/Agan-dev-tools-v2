"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Regex, AlertCircle, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

const COMMON_PATTERNS = [
  { name: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", description: "Basic email validation" },
  { name: "URL", pattern: "https?://[\\w\\-]+(\\.[\\w\\-]+)+[\\w\\-.,@?^=%&:/~+#]*", description: "HTTP/HTTPS URL" },
  { name: "IPv4", pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b", description: "IPv4 address" },
  { name: "Phone (US)", pattern: "\\(?(\\d{3})\\)?[-.\\s]?(\\d{3})[-.\\s]?(\\d{4})", description: "US phone number formats" },
  { name: "Date (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", description: "ISO date format" },
  { name: "Hex Color", pattern: "#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b", description: "CSS hex color" },
  { name: "HTML Tag", pattern: "<(/?)([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>", description: "Opening/closing HTML tags" },
  { name: "Number", pattern: "-?\\d+(?:\\.\\d+)?", description: "Integer or decimal number" },
];

interface FlagOption {
  key: string;
  label: string;
  char: string;
  description: string;
}

const FLAGS: FlagOption[] = [
  { key: "global", label: "Global", char: "g", description: "Find all matches" },
  { key: "caseInsensitive", label: "Case Insensitive", char: "i", description: "Ignore case" },
  { key: "multiline", label: "Multiline", char: "m", description: "^ and $ match line breaks" },
  { key: "dotall", label: "Dotall", char: "s", description: ". matches newlines" },
  { key: "unicode", label: "Unicode", char: "u", description: "Unicode support" },
];

interface MatchResult {
  match: string;
  index: number;
  groups: Record<string, string> | null;
}

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({
    global: true,
    caseInsensitive: false,
    multiline: false,
    dotall: false,
    unicode: false,
  });
  const [showPatterns, setShowPatterns] = useState(false);

  const flagString = useMemo(() => {
    return Object.entries(flags)
      .filter(([, v]) => v)
      .map(([k]) => FLAGS.find((f) => f.key === k)?.char || "")
      .join("");
  }, [flags]);

  const toggleFlag = useCallback((key: string) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const matchResults = useMemo((): { results: MatchResult[]; highlighted: React.ReactNode[]; error: string | null } => {
    if (!pattern || !testString) {
      return { results: [], highlighted: [testString || ""], error: null };
    }

    try {
      const regex = new RegExp(pattern, flagString);

      const results: MatchResult[] = [];
      let match: RegExpExecArray | null;

      if (flagString.includes("g")) {
        const localRegex = new RegExp(pattern, flagString);
        while ((match = localRegex.exec(testString)) !== null) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.groups || (match.length > 1 ? Object.fromEntries(
              Array.from({ length: match.length - 1 }, (_, i) => [String(i + 1), match![i + 1] || ""])
            ) : null),
          });
          if (match[0].length === 0) localRegex.lastIndex++;
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.groups || (match.length > 1 ? Object.fromEntries(
              Array.from({ length: match.length - 1 }, (_, i) => [String(i + 1), match![i + 1] || ""])
            ) : null),
          });
        }
      }

      // Build highlighted text
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      results.forEach((r, i) => {
        if (r.index > lastIndex) {
          parts.push(testString.slice(lastIndex, r.index));
        }
        parts.push(
          <mark
            key={`match-${i}`}
            className="rounded-sm bg-emerald-500/30 text-emerald-300 px-0.5"
          >
            {r.match}
          </mark>
        );
        lastIndex = r.index + r.match.length;
      });
      if (lastIndex < testString.length) {
        parts.push(testString.slice(lastIndex));
      }

      return { results, highlighted: parts, error: null };
    } catch (e) {
      return { results: [], highlighted: [testString], error: e instanceof Error ? e.message : "Invalid regex" };
    }
  }, [pattern, testString, flagString]);

  const applyPattern = (p: string) => {
    setPattern(p);
    setShowPatterns(false);
  };

  return (
    <div className="space-y-6">
      {/* Pattern Input */}
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Regex className="h-5 w-5 text-primary" />
              Regular Expression
            </CardTitle>
            <div className="font-mono text-xs text-muted-foreground">
              /{pattern}/{flagString}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-mono text-primary">/</span>
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter regex pattern..."
              className="pl-8 pr-16 font-mono"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-mono text-primary">
              /{flagString}
            </span>
          </div>

          {matchResults.error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {matchResults.error}
            </div>
          )}

          {/* Flags */}
          <div className="flex flex-wrap gap-2">
            {FLAGS.map((flag) => (
              <button
                key={flag.key}
                onClick={() => toggleFlag(flag.key)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  flags[flag.key]
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                }`}
                title={flag.description}
              >
                <span className="font-mono font-bold">{flag.char}</span>
                {flag.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test String */}
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-muted-foreground">
            Test String
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter text to test against the regex..."
            className="min-h-[120px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Highlighted Result */}
      {testString && pattern && !matchResults.error && (
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Matches
              </CardTitle>
              <Badge variant={matchResults.results.length > 0 ? "default" : "secondary"}>
                {matchResults.results.length} match{matchResults.results.length !== 1 ? "es" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/50 bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
                {matchResults.highlighted}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Details */}
      {matchResults.results.length > 0 && (
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-muted-foreground">
              Match Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {matchResults.results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-md border border-border/40 bg-muted/20 p-3 text-sm"
                >
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">
                    #{i + 1}
                  </Badge>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div>
                      <span className="text-muted-foreground text-xs">Value: </span>
                      <code className="text-primary font-mono text-xs">{r.match}</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Index: </span>
                      <span className="font-mono text-xs">{r.index}</span>
                    </div>
                    {r.groups && Object.keys(r.groups).length > 0 && (
                      <div>
                        <span className="text-muted-foreground text-xs">Groups: </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(r.groups).map(([key, val]) => (
                            <Badge key={key} variant="secondary" className="text-xs font-mono">
                              ${key}: {val || "(empty)"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Common Patterns */}
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <button
            onClick={() => setShowPatterns(!showPatterns)}
            className="flex w-full items-center justify-between text-left"
          >
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <BookOpen className="h-4 w-4 text-primary" />
              Common Patterns
            </CardTitle>
            {showPatterns ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {showPatterns && (
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {COMMON_PATTERNS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPattern(p.pattern)}
                  className="group rounded-md border border-border/40 bg-muted/20 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                    {p.name}
                  </div>
                  <div className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    {p.pattern}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground/70">
                    {p.description}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}