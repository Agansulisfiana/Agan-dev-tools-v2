"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Check,
  Trash2,
  FileJson,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";

const SAMPLE_JSON = `{
  "name": "Agan Dev Tools",
  "version": "2.4.0",
  "description": "A comprehensive suite of developer utilities",
  "features": [
    "JSON Formatter",
    "Base64 Encoder",
    "Regex Tester",
    "Color Picker"
  ],
  "author": {
    "name": "Agan Labs",
    "email": "dev@agan.tools",
    "social": {
      "github": "https://github.com/agan-labs",
      "twitter": "@agandevtools"
    }
  },
  "config": {
    "darkMode": true,
    "fontSize": 14,
    "theme": "emerald",
    "autoSave": true,
    "maxHistory": 50
  },
  "dependencies": {
    "react": "^19.0.0",
    "next": "^16.0.0",
    "typescript": "^5.0.0"
  },
  "stats": {
    "users": 128500,
    "downloads": 3200000,
    "rating": 4.9,
    "active": true,
    "deprecated": false,
    "license": null
  }
}`;

function getColorClass(token: string): string {
  if (token.startsWith('"') && token.endsWith('"')) {
    return "text-emerald-400";
  }
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(token)) {
    return "text-amber-400";
  }
  if (token === "true" || token === "false" || token === "null") {
    return "text-purple-400";
  }
  return "text-zinc-300";
}

function highlightJSON(json: string): string {
  return json.replace(
    /("(?:\\.|[^"\\])*")\s*:/g,
    '<span class="text-emerald-300 font-semibold">$1</span>:'
  ).replace(
    /:\s*("(?:\\.|[^"\\])*")/g,
    ': <span class="text-emerald-400">$1</span>'
  ).replace(
    /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    ': <span class="text-amber-400">$1</span>'
  ).replace(
    /:\s*(true|false|null)\b/g,
    ': <span class="text-purple-400">$1</span>'
  ).replace(
    /[\[\]]/g,
    '<span class="text-zinc-500">$&</span>'
  ).replace(
    /\{/g,
    '<span class="text-zinc-500">{</span>'
  ).replace(
    /\}/g,
    '<span class="text-zinc-500">}</span>'
  );
}

function countKeys(obj: unknown): number {
  if (obj === null || typeof obj !== "object") return 0;
  if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + countKeys(item), 0);
  }
  const record = obj as Record<string, unknown>;
  let count = Object.keys(record).length;
  for (const value of Object.values(record)) {
    count += countKeys(value);
  }
  return count;
}

function getNestingDepth(obj: unknown, depth = 0): number {
  if (obj === null || typeof obj !== "object") return depth;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return depth;
    return Math.max(...obj.map((item) => getNestingDepth(item, depth + 1)));
  }
  const record = obj as Record<string, unknown>;
  const values = Object.values(record);
  if (values.length === 0) return depth;
  return Math.max(
    ...values.map((v) => getNestingDepth(v, depth + 1))
  );
}

function sortKeysDeep(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortKeysDeep);
  const record = obj as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort()) {
    sorted[key] = sortKeysDeep(record[key]);
  }
  return sorted;
}

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorPosition, setErrorPosition] = useState<{ line: number; column: number } | null>(null);
  const [indentSize, setIndentSize] = useState("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{
    lines: number;
    bytes: number;
    keys: number;
    depth: number;
  } | null>(null);
  const { toast } = useToast();

  const formatAndValidate = () => {
    setError(null);
    setErrorPosition(null);
    setStats(null);
    setOutput("");

    if (!input.trim()) {
      setError("Please enter some JSON to format.");
      return;
    }

    try {
      let parsed: unknown = JSON.parse(input);

      if (sortKeys) {
        parsed = sortKeysDeep(parsed);
      }

      const indent = parseInt(indentSize, 10);
      const formatted = JSON.stringify(parsed, null, indent);
      setOutput(formatted);

      const lines = formatted.split("\n").length;
      const bytes = new TextEncoder().encode(formatted).length;
      const keys = countKeys(parsed);
      const depth = getNestingDepth(parsed);

      setStats({ lines, bytes, keys, depth });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);

      const posMatch = message.match(/position\s+(\d+)/i);
      if (posMatch) {
        const pos = parseInt(posMatch[1], 10);
        const before = input.substring(0, pos);
        const line = (before.match(/\n/g) || []).length + 1;
        const column = pos - before.lastIndexOf("\n");
        setErrorPosition({ line, column });
      }
    }
  };

  const copyOutput = async () => {
    if (!output) return;
    try {
      await copyToClipboard(output);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Formatted JSON copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setError(null);
    setErrorPosition(null);
    setStats(null);
    setCopied(false);
  };

  const loadSample = () => {
    setInput(SAMPLE_JSON);
    setOutput("");
    setError(null);
    setErrorPosition(null);
    setStats(null);
  };

  return (
    <div className="space-y-4">
      {/* Options Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Indent:</span>
          <Select value={indentSize} onValueChange={setIndentSize}>
            <SelectTrigger className="w-[80px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 spaces</SelectItem>
              <SelectItem value="4">4 spaces</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant={sortKeys ? "default" : "outline"}
          size="sm"
          onClick={() => setSortKeys(!sortKeys)}
          className={
            sortKeys
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "text-zinc-400"
          }
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Sort Keys
        </Button>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={loadSample}>
          <FileJson className="h-3.5 w-3.5 mr-1.5" />
          Sample Data
        </Button>
        <Button variant="outline" size="sm" onClick={clearAll}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Clear
        </Button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Column */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <FileJson className="h-4 w-4 text-emerald-500" />
              Input JSON
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Textarea
              placeholder='Paste your JSON here...\n\nExample:\n{"key": "value"}'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[400px] lg:min-h-[480px] font-mono text-sm bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 resize-none focus-visible:ring-emerald-500/30"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {input.length > 0
                  ? `${new TextEncoder().encode(input).length} bytes`
                  : "No input"}
              </span>
              <Button
                onClick={formatAndValidate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                Format & Validate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Column */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                {error ? (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <FileJson className="h-4 w-4 text-emerald-500" />
                )}
                {error ? "Error" : output ? "Formatted Output" : "Output"}
              </CardTitle>
              {output && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyOutput}
                  className="h-7 px-2 text-zinc-400 hover:text-zinc-200"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 min-h-[400px] lg:min-h-[480px] flex flex-col justify-start">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p className="text-red-400 font-medium text-sm">
                      Invalid JSON
                    </p>
                    <p className="text-red-300/80 text-sm font-mono break-all">
                      {error}
                    </p>
                    {errorPosition && (
                      <div className="flex gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className="text-red-400 border-red-500/30 text-xs"
                        >
                          Line {errorPosition.line}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-red-400 border-red-500/30 text-xs"
                        >
                          Column {errorPosition.column}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {output && !error && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 min-h-[400px] lg:min-h-[480px] overflow-auto">
                <pre
                  className="text-sm font-mono leading-relaxed whitespace-pre break-words"
                  dangerouslySetInnerHTML={{
                    __html: highlightJSON(output),
                  }}
                />
              </div>
            )}

            {/* Empty State */}
            {!output && !error && (
              <div className="rounded-lg border border-zinc-800 border-dashed bg-zinc-950/50 min-h-[400px] lg:min-h-[480px] flex items-center justify-center">
                <div className="text-center space-y-2">
                  <FileJson className="h-10 w-10 text-zinc-700 mx-auto" />
                  <p className="text-zinc-600 text-sm">
                    Formatted JSON will appear here
                  </p>
                  <p className="text-zinc-700 text-xs">
                    Paste JSON on the left and click &quot;Format &amp; Validate&quot;
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Bar */}
      {stats && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                Stats
              </span>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="bg-zinc-800 text-zinc-300 text-xs font-mono"
                >
                  {stats.lines} line{stats.lines !== 1 ? "s" : ""}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-zinc-800 text-zinc-300 text-xs font-mono"
                >
                  {stats.bytes.toLocaleString()} bytes
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-zinc-800 text-emerald-400 text-xs font-mono"
                >
                  {stats.keys} key{stats.keys !== 1 ? "s" : ""}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-zinc-800 text-amber-400 text-xs font-mono"
                >
                  depth: {stats.depth}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}