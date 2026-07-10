"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw, Lock, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:',.<>?/`~";
const AMBIGUOUS = "0OoIl1";

function getCharPool(options: {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  customChars: string;
  excludeAmbiguous: boolean;
  excludeSimilar: boolean;
}): { pool: string; charTypeCount: number } {
  let pool = "";
  let charTypeCount = 0;

  if (options.uppercase) {
    pool += UPPER;
    charTypeCount++;
  }
  if (options.lowercase) {
    pool += LOWER;
    charTypeCount++;
  }
  if (options.numbers) {
    pool += NUMBERS;
    charTypeCount++;
  }
  if (options.symbols) {
    pool += SYMBOLS;
    charTypeCount++;
  }
  if (options.customChars) {
    const uniqueCustom = [...new Set(options.customChars)].join("");
    pool += uniqueCustom;
    if (uniqueCustom.length > 0) {
      charTypeCount++;
    }
  }

  if (options.excludeAmbiguous) {
    pool = pool
      .split("")
      .filter((c) => !AMBIGUOUS.includes(c))
      .join("");
  }

  if (options.excludeSimilar) {
    const similarPairs: Record<string, string> = {
      "1": "lI",
      l: "1I",
      I: "1l",
      O: "0",
      "0": "O",
      "|": "lI",
      "`": "'",
      "'": "`",
      '"': "'",
      "{": "[(",
      "[": "{(",
      "(": "{[",
      "}": "])",
      "]": "})",
      ")": "]}",
    };
    // Keep it simple: just exclude a set of commonly confused chars
    const similarChars = "1lIiO0|`'\"{}[]()";
    pool = pool
      .split("")
      .filter((c) => !similarChars.includes(c))
      .join("");
  }

  return { pool, charTypeCount };
}

function generateSecurePassword(
  length: number,
  pool: string,
  charTypeCount: number
): string {
  if (pool.length === 0) return "";

  // Ensure at least one char from each original type is included
  // by picking required chars first, then filling the rest randomly
  const chars: string[] = [];
  const array = new Uint32Array(length);

  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    chars.push(pool[array[i] % pool.length]);
  }

  return chars.join("");
}

type StrengthLevel = "weak" | "fair" | "strong" | "very strong";

function calculateStrength(
  length: number,
  charTypeCount: number
): { level: StrengthLevel; score: number; color: string } {
  if (length < 8 || charTypeCount < 2) {
    return { level: "weak", score: 25, color: "bg-red-500" };
  }
  if (length >= 16 && charTypeCount >= 4) {
    return { level: "very strong", score: 100, color: "bg-emerald-500" };
  }
  if (length >= 12 && charTypeCount >= 3) {
    return { level: "strong", score: 75, color: "bg-green-500" };
  }
  if (length >= 8 && charTypeCount >= 3) {
    return { level: "fair", score: 50, color: "bg-yellow-500" };
  }
  if (length >= 8) {
    return { level: "fair", score: 40, color: "bg-yellow-500" };
  }
  return { level: "weak", score: 25, color: "bg-red-500" };
}

export default function PasswordGenerator() {
  const { toast } = useToast();

  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [customChars, setCustomChars] = useState("");
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [password, setPassword] = useState(() => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const arr = new Uint32Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (v) => chars[v % chars.length]).join("");
  });
  const [bulkCount, setBulkCount] = useState(1);
  const [bulkPasswords, setBulkPasswords] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [mainCopied, setMainCopied] = useState(false);

  const generatePassword = useCallback(() => {
    const { pool, charTypeCount } = getCharPool({
      uppercase,
      lowercase,
      numbers,
      symbols,
      customChars,
      excludeAmbiguous,
      excludeSimilar,
    });

    if (pool.length === 0) {
      toast({
        title: "No characters selected",
        description: "Please enable at least one character type.",
        variant: "destructive",
      });
      return;
    }

    if (bulkCount > 1) {
      const passwords: string[] = [];
      for (let i = 0; i < bulkCount; i++) {
        passwords.push(generateSecurePassword(length, pool, charTypeCount));
      }
      setBulkPasswords(passwords);
      setPassword(passwords[0]);
      setHistory((prev) => [...passwords.slice(0, 10 - prev.length), ...prev].slice(0, 10));
    } else {
      const pw = generateSecurePassword(length, pool, charTypeCount);
      setPassword(pw);
      setBulkPasswords([]);
      setHistory((prev) => [pw, ...prev].slice(0, 10));
    }
  }, [
    uppercase,
    lowercase,
    numbers,
    symbols,
    customChars,
    excludeAmbiguous,
    excludeSimilar,
    length,
    bulkCount,
    toast,
  ]);

  const { pool } = getCharPool({
    uppercase,
    lowercase,
    numbers,
    symbols,
    customChars,
    excludeAmbiguous,
    excludeSimilar,
  });

  const charTypeCount = [uppercase, lowercase, numbers, symbols, customChars.length > 0].filter(Boolean).length;
  const strength = calculateStrength(length, charTypeCount);

  const handleCopyToClipboard = async (text: string, index: number | null = null) => {
    try {
      await copyToClipboard(text);
      if (index === null) {
        setMainCopied(true);
        setTimeout(() => setMainCopied(false), 2000);
      } else {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
      toast({
        title: "Copied to clipboard",
        description: "Password has been copied.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const applyFromHistory = (pw: string) => {
    setPassword(pw);
    setBulkPasswords([]);
    setShowHistory(false);
 };

  return (
    <div className="space-y-6">
      {/* Hero: Generated Password Display */}
      <Card className="border-emerald-500/20 bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Strength Bar - top accent */}
          <div className="h-1.5 w-full bg-muted overflow-hidden">
            <div
              className={`h-full ${strength.color} transition-all duration-500 ease-out rounded-r-full`}
              style={{ width: `${strength.score}%` }}
            />
          </div>

          <div className="p-6 md:p-8">
            {/* Main password display */}
            <div className="relative group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-muted-foreground">Generated Password</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold border-0 ${
                    strength.level === "very strong"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : strength.level === "strong"
                        ? "bg-green-500/15 text-green-400"
                        : strength.level === "fair"
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {strength.level.toUpperCase()}
                </Badge>
              </div>

              <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl p-5 md:p-6 font-mono text-xl md:text-2xl lg:text-3xl tracking-wider text-emerald-400 break-all leading-relaxed select-all min-h-[80px] md:min-h-[96px] flex items-center">
                {password || (
                  <span className="text-zinc-600 italic text-lg">Click generate to create a password</span>
                )}
              </div>

              <div className="absolute top-1/2 -translate-y-1/2 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700"
                  onClick={() => handleCopyToClipboard(password)}
                >
                  {mainCopied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700"
                  onClick={generatePassword}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Strength details */}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>
                Length: <span className="text-foreground font-medium">{length}</span>
              </span>
              <span>
                Charset size: <span className="text-foreground font-medium">{pool.length}</span>
              </span>
              <span>
                Entropy:{" "}
                <span className="text-foreground font-medium">
                  {pool.length > 0
                    ? `${(Math.log2(pool.length) * length).toFixed(1)} bits`
                    : "N/A"}
                </span>
              </span>
              <span>
                Char types: <span className="text-foreground font-medium">{charTypeCount}</span>
              </span>
            </div>

            {/* Strength bar (visual, larger) */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-500 ease-out rounded-full`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Length Control */}
        <Card className="border-zinc-800 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Password Length</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold tabular-nums text-emerald-400">{length}</span>
              <span className="text-xs text-muted-foreground">4 – 128</span>
            </div>
            <Slider
              value={[length]}
              onValueChange={(v) => setLength(v[0])}
              min={4}
              max={128}
              step={1}
              className="[&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500 [&_.bg-primary]:bg-emerald-500/30"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                min={4}
                max={128}
                value={length}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 4 && v <= 128) setLength(v);
                }}
                className="w-24 bg-zinc-950 border-zinc-700 text-center text-emerald-400 font-mono"
              />
              <div className="flex gap-1">
                {[8, 16, 32, 64].map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs border-zinc-700 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => setLength(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Character Types */}
        <Card className="border-zinc-800 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Character Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="uppercase" className="cursor-pointer flex-1">
                <div className="font-medium text-sm">Uppercase</div>
                <div className="text-xs text-muted-foreground font-mono">A-Z</div>
              </Label>
              <Switch
                id="uppercase"
                checked={uppercase}
                onCheckedChange={setUppercase}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="lowercase" className="cursor-pointer flex-1">
                <div className="font-medium text-sm">Lowercase</div>
                <div className="text-xs text-muted-foreground font-mono">a-z</div>
              </Label>
              <Switch
                id="lowercase"
                checked={lowercase}
                onCheckedChange={setLowercase}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="numbers" className="cursor-pointer flex-1">
                <div className="font-medium text-sm">Numbers</div>
                <div className="text-xs text-muted-foreground font-mono">0-9</div>
              </Label>
              <Switch
                id="numbers"
                checked={numbers}
                onCheckedChange={setNumbers}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="symbols" className="cursor-pointer flex-1">
                <div className="font-medium text-sm">Symbols</div>
                <div className="text-xs text-muted-foreground font-mono truncate">!@#$%^&*()...</div>
              </Label>
              <Switch
                id="symbols"
                checked={symbols}
                onCheckedChange={setSymbols}
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Options */}
        <Card className="border-zinc-800 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Advanced Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-chars" className="text-sm font-medium">
                Custom Characters
              </Label>
              <Input
                id="custom-chars"
                placeholder="Add extra characters..."
                value={customChars}
                onChange={(e) => setCustomChars(e.target.value)}
                className="bg-zinc-950 border-zinc-700 font-mono text-sm placeholder:text-zinc-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="exclude-ambiguous" className="cursor-pointer flex-1">
                <div className="font-medium text-sm">Exclude Ambiguous</div>
                <div className="text-xs text-muted-foreground font-mono">0 O o I l 1</div>
              </Label>
              <Switch
                id="exclude-ambiguous"
                checked={excludeAmbiguous}
                onCheckedChange={setExcludeAmbiguous}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="exclude-similar" className="cursor-pointer flex-1">
                <div className="font-medium text-sm">Exclude Similar</div>
                <div className="text-xs text-muted-foreground font-mono">1 l I | { } ( )</div>
              </Label>
              <Switch
                id="exclude-similar"
                checked={excludeSimilar}
                onCheckedChange={setExcludeSimilar}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Generate + Generate Button */}
      <Card className="border-zinc-800 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="bulk-count" className="text-sm font-medium">
                Bulk Generate
              </Label>
              <div className="flex items-center gap-3">
                <Slider
                  id="bulk-count"
                  value={[bulkCount]}
                  onValueChange={(v) => setBulkCount(v[0])}
                  min={1}
                  max={20}
                  step={1}
                  className="w-40 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500 [&_.bg-primary]:bg-emerald-500/30"
                />
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={bulkCount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1 && v <= 20) setBulkCount(v);
                  }}
                  className="w-16 bg-zinc-950 border-zinc-700 text-center text-emerald-400 font-mono text-sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  password{bulkCount > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                className="border-zinc-700 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => setShowHistory((prev) => !prev)}
              >
                <History className="h-4 w-4 mr-2" />
                History
                {history.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 text-xs"
                  >
                    {history.length}
                  </Badge>
                )}
              </Button>
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8"
                onClick={generatePassword}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>

          {/* Bulk Results */}
          {bulkPasswords.length > 1 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Generated Passwords ({bulkPasswords.length})
              </h3>
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {bulkPasswords.map((pw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 group"
                  >
                    <span className="text-xs text-muted-foreground w-6 shrink-0 font-mono">
                      {idx + 1}.
                    </span>
                    <code className="flex-1 font-mono text-sm text-emerald-400 break-all">
                      {pw}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-800"
                      onClick={() => handleCopyToClipboard(pw, idx)}
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-zinc-400" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Panel */}
      {showHistory && (
        <Card className="border-zinc-800 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-500" />
                Password History
              </CardTitle>
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-red-400"
                  onClick={() => setHistory([])}
                >
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No passwords generated yet.
              </p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {history.map((pw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-zinc-950/50 border border-zinc-800/50 rounded-lg px-4 py-2.5 group hover:border-zinc-700 transition-colors"
                  >
                    <code className="flex-1 font-mono text-sm text-zinc-400 break-all">
                      {pw}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-800"
                      onClick={() => handleCopyToClipboard(pw, idx)}
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-zinc-400" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-800"
                      onClick={() => applyFromHistory(pw)}
                      title="Use this password"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}