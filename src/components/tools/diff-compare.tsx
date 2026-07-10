"use client";

import { useState, useMemo } from "react";
import { diffLines } from "diff";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightLeft,
  GitCompare,
  Plus,
  Minus,
  Equal,
  RotateCcw,
  ArrowRight,
  Trash2,
} from "lucide-react";

interface DiffLine {
  type: "added" | "removed" | "changed" | "unchanged";
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

interface DiffStats {
  additions: number;
  deletions: number;
  changes: number;
  unchanged: number;
}

function computeDiff(
  original: string,
  modified: string,
  options: {
    ignoreWhitespace: boolean;
    ignoreCase: boolean;
    inlineMode: boolean;
  }
): { lines: DiffLine[]; stats: DiffStats } {
  const diffOptions: { ignoreWhitespace?: boolean; ignoreCase?: boolean } = {};
  if (options.ignoreWhitespace) {
    diffOptions.ignoreWhitespace = true;
  }
  if (options.ignoreCase) {
    diffOptions.ignoreCase = true;
  }

  const changes = diffLines(original, modified, diffOptions);

  const lines: DiffLine[] = [];
  const stats: DiffStats = { additions: 0, deletions: 0, changes: 0, unchanged: 0 };

  let oldLine = 0;
  let newLine = 0;

  // Pair up removed+added blocks as "changed"
  const processed: { type: string; content: string; count: number }[] = [];
  let i = 0;
  while (i < changes.length) {
    const part = changes[i]!;
    if (
      part.removed &&
      i + 1 < changes.length &&
      changes[i + 1]!.added
    ) {
      // Pair removed + added as changed
      const removedPart = part;
      const addedPart = changes[i + 1]!;
      const maxCount = Math.max(removedPart.count || 0, addedPart.count || 0);
      processed.push({
        type: "changed-removed",
        content: removedPart.value,
        count: removedPart.count || 0,
      });
      processed.push({
        type: "changed-added",
        content: addedPart.value,
        count: addedPart.count || 0,
      });
      i += 2;
    } else {
      processed.push({
        type: part.added ? "added" : part.removed ? "removed" : "unchanged",
        content: part.value,
        count: part.count || 0,
      });
      i++;
    }
  }

  for (const part of processed) {
    const partLines = part.content.split("\n");
    // Remove trailing empty line from split
    if (partLines.length > 0 && partLines[partLines.length - 1] === "") {
      partLines.pop();
    }

    for (const line of partLines) {
      if (part.type === "added") {
        newLine++;
        lines.push({
          type: "added",
          newLineNumber: newLine,
          content: line,
        });
        stats.additions++;
      } else if (part.type === "removed") {
        oldLine++;
        lines.push({
          type: "removed",
          oldLineNumber: oldLine,
          content: line,
        });
        stats.deletions++;
      } else if (part.type === "changed-removed") {
        oldLine++;
        lines.push({
          type: "changed",
          oldLineNumber: oldLine,
          content: line,
        });
        stats.deletions++;
      } else if (part.type === "changed-added") {
        newLine++;
        lines.push({
          type: "changed",
          newLineNumber: newLine,
          content: line,
        });
        stats.additions++;
      } else {
        oldLine++;
        newLine++;
        lines.push({
          type: "unchanged",
          oldLineNumber: oldLine,
          newLineNumber: newLine,
          content: line,
        });
        stats.unchanged++;
      }
    }
  }

  // Count changes: a "change" is when we have both a removed and added block
  // We count it as the number of lines that were modified (min of added/removed pairs)
  // For simplicity, changes = min(additions from changed blocks, deletions from changed blocks)
  // Since we already counted additions/deletions for changed, we separate them
  // Actually let's recalculate: changed = lines where both old and new exist
  // Let me recount properly
  let changeCount = 0;
  let addCount = 0;
  let removeCount = 0;
  let unchangedCount = 0;

  // Re-process to properly count
  let j = 0;
  while (j < processed.length) {
    const p = processed[j];
    if (p.type === "changed-removed" && j + 1 < processed.length && processed[j + 1].type === "changed-added") {
      const rmLines = p.content.split("\n").filter((l, idx, arr) => !(idx === arr.length - 1 && l === ""));
      const addLines = processed[j + 1].content.split("\n").filter((l, idx, arr) => !(idx === arr.length - 1 && l === ""));
      changeCount += Math.max(rmLines.length, addLines.length);
      j += 2;
    } else if (p.type === "added") {
      const lns = p.content.split("\n").filter((l, idx, arr) => !(idx === arr.length - 1 && l === ""));
      addCount += lns.length;
      j++;
    } else if (p.type === "removed") {
      const lns = p.content.split("\n").filter((l, idx, arr) => !(idx === arr.length - 1 && l === ""));
      removeCount += lns.length;
      j++;
    } else {
      const lns = p.content.split("\n").filter((l, idx, arr) => !(idx === arr.length - 1 && l === ""));
      unchangedCount += lns.length;
      j++;
    }
  }

  stats.additions = addCount;
  stats.deletions = removeCount;
  stats.changes = changeCount;
  stats.unchanged = unchangedCount;

  return { lines, stats };
}

function InlineDiffView({
  lines,
  showLineNumbers,
}: {
  lines: DiffLine[];
  showLineNumbers: boolean;
}) {
  return (
    <div className="font-mono text-sm leading-6 overflow-x-auto">
      {lines.map((line, idx) => {
        let bgClass = "";
        let textClass = "text-muted-foreground";
        let prefix = " ";
        let prefixClass = "text-muted-foreground/50";

        switch (line.type) {
          case "added":
            bgClass = "bg-emerald-500/15";
            textClass = "text-emerald-400";
            prefix = "+";
            prefixClass = "text-emerald-500";
            break;
          case "removed":
            bgClass = "bg-red-500/15";
            textClass = "text-red-400";
            prefix = "-";
            prefixClass = "text-red-500";
            break;
          case "changed":
            bgClass = "bg-amber-500/15";
            textClass = "text-amber-400";
            prefix = "~";
            prefixClass = "text-amber-500";
            break;
          case "unchanged":
            bgClass = "";
            textClass = "text-muted-foreground";
            prefix = " ";
            prefixClass = "text-muted-foreground/30";
            break;
        }

        return (
          <div
            key={idx}
            className={`flex ${bgClass} hover:brightness-110 transition-all`}
          >
            {showLineNumbers && (
              <div className="flex shrink-0 select-none">
                <span className="w-12 text-right pr-3 text-muted-foreground/40 border-r border-border/30">
                  {line.oldLineNumber ?? ""}
                </span>
                <span className="w-12 text-right pr-3 text-muted-foreground/40 border-r border-border/30">
                  {line.newLineNumber ?? ""}
                </span>
              </div>
            )}
            <span className={`shrink-0 w-5 text-center select-none ${prefixClass}`}>
              {prefix}
            </span>
            <span className={`flex-1 whitespace-pre pl-1 ${textClass}`}>
              {line.content || " "}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SideBySideDiffView({
  lines,
  showLineNumbers,
}: {
  lines: DiffLine[];
  showLineNumbers: boolean;
}) {
  // Build left and right side rows
  // For unchanged lines, they appear on both sides
  // For added lines, left side is empty
  // For removed lines, right side is empty
  // For changed lines (paired), show both

  // Re-pair changed lines: we need to pair changed-removed with changed-added
  // Let's rebuild the pairs from the lines array
  interface Row {
    leftType: DiffLine["type"] | "empty";
    leftContent: string;
    leftLineNum?: number;
    rightType: DiffLine["type"] | "empty";
    rightContent: string;
    rightLineNum?: number;
  }

  const rows: Row[] = [];
  let i = 0;
  const lineArr = [...lines];

  // Identify changed pairs: they come in sequences
  // A changed line with oldLineNumber but no newLineNumber is the "left" of a change
  // A changed line with newLineNumber but no oldLineNumber is the "right" of a change
  const changedLefts: DiffLine[] = [];
  const changedRights: DiffLine[] = [];

  for (const line of lineArr) {
    if (line.type === "changed") {
      if (line.oldLineNumber !== undefined && line.newLineNumber === undefined) {
        changedLefts.push(line);
      } else if (line.newLineNumber !== undefined && line.oldLineNumber === undefined) {
        changedRights.push(line);
      }
    }
  }

  let leftIdx = 0;
  let rightIdx = 0;

  for (const line of lineArr) {
    if (line.type === "unchanged") {
      rows.push({
        leftType: "unchanged",
        leftContent: line.content,
        leftLineNum: line.oldLineNumber,
        rightType: "unchanged",
        rightContent: line.content,
        rightLineNum: line.newLineNumber,
      });
    } else if (line.type === "added") {
      rows.push({
        leftType: "empty",
        leftContent: "",
        rightType: "added",
        rightContent: line.content,
        rightLineNum: line.newLineNumber,
      });
    } else if (line.type === "removed") {
      rows.push({
        leftType: "removed",
        leftContent: line.content,
        leftLineNum: line.oldLineNumber,
        rightType: "empty",
        rightContent: "",
      });
    } else if (line.type === "changed") {
      // Skip — already handled via pairing below
      continue;
    }
  }

  // Rebuild properly: iterate and pair changed sequences
  const rows2: Row[] = [];
  let ci = 0;
  while (ci < lineArr.length) {
    const line = lineArr[ci];
    if (line.type === "changed" && line.oldLineNumber !== undefined && line.newLineNumber === undefined) {
      // Start of a changed pair sequence
      const lefts: DiffLine[] = [];
      const rights: DiffLine[] = [];
      while (ci < lineArr.length && lineArr[ci].type === "changed" && lineArr[ci].oldLineNumber !== undefined) {
        lefts.push(lineArr[ci]);
        ci++;
      }
      while (ci < lineArr.length && lineArr[ci].type === "changed" && lineArr[ci].newLineNumber !== undefined) {
        rights.push(lineArr[ci]);
        ci++;
      }
      const maxLen = Math.max(lefts.length, rights.length);
      for (let k = 0; k < maxLen; k++) {
        const left = lefts[k];
        const right = rights[k];
        rows2.push({
          leftType: "changed",
          leftContent: left?.content ?? "",
          leftLineNum: left?.oldLineNumber,
          rightType: "changed",
          rightContent: right?.content ?? "",
          rightLineNum: right?.newLineNumber,
        });
      }
    } else if (line.type === "unchanged") {
      rows2.push({
        leftType: "unchanged",
        leftContent: line.content,
        leftLineNum: line.oldLineNumber,
        rightType: "unchanged",
        rightContent: line.content,
        rightLineNum: line.newLineNumber,
      });
      ci++;
    } else if (line.type === "added") {
      rows2.push({
        leftType: "empty",
        leftContent: "",
        rightType: "added",
        rightContent: line.content,
        rightLineNum: line.newLineNumber,
      });
      ci++;
    } else if (line.type === "removed") {
      rows2.push({
        leftType: "removed",
        leftContent: line.content,
        leftLineNum: line.oldLineNumber,
        rightType: "empty",
        rightContent: "",
      });
      ci++;
    } else {
      ci++;
    }
  }

  function getStyle(type: string) {
    switch (type) {
      case "added":
        return { bg: "bg-emerald-500/15", text: "text-emerald-400" };
      case "removed":
        return { bg: "bg-red-500/15", text: "text-red-400" };
      case "changed":
        return { bg: "bg-amber-500/15", text: "text-amber-400" };
      case "unchanged":
        return { bg: "", text: "text-muted-foreground" };
      default:
        return { bg: "bg-muted/30", text: "text-muted-foreground/40" };
    }
  }

  function getPrefix(type: string) {
    switch (type) {
      case "added":
        return { char: "+", cls: "text-emerald-500" };
      case "removed":
        return { char: "-", cls: "text-red-500" };
      case "changed":
        return { char: "~", cls: "text-amber-500" };
      default:
        return { char: " ", cls: "text-muted-foreground/30" };
    }
  }

  return (
    <div className="flex font-mono text-sm leading-6 overflow-x-auto">
      {/* Left side */}
      <div className="flex-1 min-w-0 border-r border-border/50">
        <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-2 py-1 text-xs text-muted-foreground font-sans border-b border-border/50">
          Original
        </div>
        {rows2.map((row, idx) => {
          const style = getStyle(row.leftType);
          const prefix = getPrefix(row.leftType);
          return (
            <div
              key={`left-${idx}`}
              className={`flex ${style.bg} hover:brightness-110 transition-all`}
            >
              {showLineNumbers && (
                <span className="w-12 shrink-0 text-right pr-3 text-muted-foreground/40 border-r border-border/30 select-none">
                  {row.leftLineNum ?? ""}
                </span>
              )}
              <span className={`shrink-0 w-5 text-center select-none ${prefix.cls}`}>
                {prefix.char}
              </span>
              <span className={`flex-1 whitespace-pre pl-1 ${style.text}`}>
                {row.leftContent || " "}
              </span>
            </div>
          );
        })}
      </div>
      {/* Right side */}
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-2 py-1 text-xs text-muted-foreground font-sans border-b border-border/50">
          Modified
        </div>
        {rows2.map((row, idx) => {
          const style = getStyle(row.rightType);
          const prefix = getPrefix(row.rightType);
          return (
            <div
              key={`right-${idx}`}
              className={`flex ${style.bg} hover:brightness-110 transition-all`}
            >
              {showLineNumbers && (
                <span className="w-12 shrink-0 text-right pr-3 text-muted-foreground/40 border-r border-border/30 select-none">
                  {row.rightLineNum ?? ""}
                </span>
              )}
              <span className={`shrink-0 w-5 text-center select-none ${prefix.cls}`}>
                {prefix.char}
              </span>
              <span className={`flex-1 whitespace-pre pl-1 ${style.text}`}>
                {row.rightContent || " "}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DiffCompare() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [result, setResult] = useState<{
    lines: DiffLine[];
    stats: DiffStats;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"inline" | "side-by-side">("inline");

  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const handleCompare = () => {
    const { lines, stats } = computeDiff(original, modified, {
      ignoreWhitespace,
      ignoreCase,
      inlineMode: viewMode === "inline",
    });
    setResult({ lines, stats });
  };

  const handleSwap = () => {
    const temp = original;
    setOriginal(modified);
    setModified(temp);
    setResult(null);
  };

  const handleClear = () => {
    setOriginal("");
    setModified("");
    setResult(null);
  };

  const totalChanges = result
    ? result.stats.additions + result.stats.deletions + result.stats.changes
    : 0;

  return (
    <div className="space-y-6">
      {/* Input Panel */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <GitCompare className="h-4 w-4 text-primary" />
              Text Compare
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwap}
                className="gap-1.5"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Swap
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
              <Button size="sm" onClick={handleCompare} className="gap-1.5">
                Compare
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Options Row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <Switch
                id="ignore-whitespace"
                checked={ignoreWhitespace}
                onCheckedChange={setIgnoreWhitespace}
              />
              <Label
                htmlFor="ignore-whitespace"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Ignore whitespace
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="ignore-case"
                checked={ignoreCase}
                onCheckedChange={setIgnoreCase}
              />
              <Label
                htmlFor="ignore-case"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Ignore case
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-line-numbers"
                checked={showLineNumbers}
                onCheckedChange={setShowLineNumbers}
              />
              <Label
                htmlFor="show-line-numbers"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Line numbers
              </Label>
            </div>
          </div>

          {/* Textareas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="original-text"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <Minus className="h-3.5 w-3.5 text-red-400" />
                Original
              </Label>
              <Textarea
                id="original-text"
                placeholder="Paste original text here..."
                value={original}
                onChange={(e) => {
                  setOriginal(e.target.value);
                  setResult(null);
                }}
                className="font-mono text-sm min-h-[200px] resize-y bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="modified-text"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5 text-emerald-400" />
                Modified
              </Label>
              <Textarea
                id="modified-text"
                placeholder="Paste modified text here..."
                value={modified}
                onChange={(e) => {
                  setModified(e.target.value);
                  setResult(null);
                }}
                className="font-mono text-sm min-h-[200px] resize-y bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-primary" />
                Diff Result
              </CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Stats badges */}
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {result.stats.additions}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/20 gap-1"
                  >
                    <Minus className="h-3 w-3" />
                    {result.stats.deletions}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {result.stats.changes}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground gap-1"
                  >
                    <Equal className="h-3 w-3" />
                    {result.stats.unchanged}
                  </Badge>
                </div>
                {/* Summary */}
                <span className="text-xs text-muted-foreground">
                  {totalChanges > 0
                    ? `${totalChanges} line${totalChanges !== 1 ? "s" : ""} changed`
                    : "No changes detected"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "inline" | "side-by-side")}
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="inline" className="gap-1.5 text-xs">
                  <span className="font-mono">{"<>"}</span>
                  Inline
                </TabsTrigger>
                <TabsTrigger value="side-by-side" className="gap-1.5 text-xs">
                  <span className="font-mono">{"||"}</span>
                  Side by Side
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inline" className="mt-0">
                {result.lines.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Equal className="h-8 w-8 mx-auto text-muted-foreground/50" />
                      <p className="text-sm">Identical content — no differences found.</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/50 bg-card overflow-auto max-h-[500px]">
                    <InlineDiffView
                      lines={result.lines}
                      showLineNumbers={showLineNumbers}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="side-by-side" className="mt-0">
                {result.lines.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Equal className="h-8 w-8 mx-auto text-muted-foreground/50" />
                      <p className="text-sm">Identical content — no differences found.</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/50 bg-card overflow-auto max-h-[500px]">
                    <SideBySideDiffView
                      lines={result.lines}
                      showLineNumbers={showLineNumbers}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}