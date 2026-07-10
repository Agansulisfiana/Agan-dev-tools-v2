"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Copy, Check, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard as safeCopyToClipboard } from "@/lib/utils";

// ── Color conversion utilities ──────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  );
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      case bn:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let rn = 0,
    gn = 0,
    bn = 0;

  if (h < 60) {
    rn = c;
    gn = x;
  } else if (h < 120) {
    rn = x;
    gn = c;
  } else if (h < 180) {
    gn = c;
    bn = x;
  } else if (h < 240) {
    gn = x;
    bn = c;
  } else if (h < 300) {
    rn = x;
    bn = c;
  } else {
    rn = c;
    bn = x;
  }

  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
  };
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Color scheme generators ─────────────────────────────────────────────────

function getComplementary(h: number, s: number, l: number): string {
  const comp = (h + 180) % 360;
  const rgb = hslToRgb(comp, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function getAnalogous(h: number, s: number, l: number): string[] {
  return [
    ((h - 30 + 360) % 360),
    h,
    ((h + 30) % 360),
  ].map((hue) => {
    const rgb = hslToRgb(hue, s, l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  });
}

function getTriadic(h: number, s: number, l: number): string[] {
  return [
    h,
    ((h + 120) % 360),
    ((h + 240) % 360),
  ].map((hue) => {
    const rgb = hslToRgb(hue, s, l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  });
}

// ── CopyButton sub-component ────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = useCallback(() => {
    safeCopyToClipboard(text).then(() => {
      setCopied(true);
      toast({
        title: `${label} copied`,
        description: `"${text}" is in your clipboard.`,
      });
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text, label, toast]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-emerald-400"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ColorPicker() {
  const [hex, setHex] = useState("#10b981");
  const [r, setR] = useState(16);
  const [g, setG] = useState(185);
  const [b, setB] = useState(129);
  const [h, setH] = useState(160);
  const [s, setS] = useState(84);
  const [l, setL] = useState(39);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const { toast } = useToast();

  // Add hex to recent colors list
  const addToRecent = useCallback((newHex: string) => {
    setRecentColors((prev) => {
      if (prev[0] === newHex) return prev;
      const filtered = prev.filter((c) => c !== newHex);
      return [newHex, ...filtered].slice(0, 10);
    });
  }, []);

  // Sync all formats when HEX changes (source of truth for native picker)
  const updateFromHex = useCallback((newHex: string) => {
    const rgb = hexToRgb(newHex);
    if (!rgb) return;
    setHex(newHex);
    setR(rgb.r);
    setG(rgb.g);
    setB(rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    setH(hsl.h);
    setS(hsl.s);
    setL(hsl.l);
    addToRecent(newHex);
  }, [addToRecent]);

  // Sync all from RGB
  const updateFromRgb = useCallback((nr: number, ng: number, nb: number) => {
    setR(nr);
    setG(ng);
    setB(nb);
    const newHex = rgbToHex(nr, ng, nb);
    setHex(newHex);
    const hsl = rgbToHsl(nr, ng, nb);
    setH(hsl.h);
    setS(hsl.s);
    setL(hsl.l);
    addToRecent(newHex);
  }, [addToRecent]);

  // Sync all from HSL
  const updateFromHsl = useCallback((nh: number, ns: number, nl: number) => {
    setH(nh);
    setS(ns);
    setL(nl);
    const rgb = hslToRgb(nh, ns, nl);
    setR(rgb.r);
    setG(rgb.g);
    setB(rgb.b);
    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setHex(newHex);
    addToRecent(newHex);
  }, [addToRecent]);

  // Derived values
  const cssColor = `rgb(${r}, ${g}, ${b})`;
  const rgbString = `rgb(${r}, ${g}, ${b})`;
  const hslString = `hsl(${h}, ${s}%, ${l}%)`;

  const whiteContrast = getContrastRatio(r, g, b, 255, 255, 255);
  const blackContrast = getContrastRatio(r, g, b, 0, 0, 0);
  const whitePass = whiteContrast >= 4.5;
  const blackPass = blackContrast >= 4.5;

  const complementary = getComplementary(h, s, l);
  const analogous = getAnalogous(h, s, l);
  const triadic = getTriadic(h, s, l);

  const handleHexInput = (value: string) => {
    let v = value;
    if (!v.startsWith("#")) v = "#" + v;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      updateFromHex(v);
    }
    setHex(v);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr] xl:grid-cols-[auto_1fr_1fr]">
      {/* ── Large Color Preview ─────────────────────────────────────── */}
      <Card className="row-span-3">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <div
            className="h-56 w-56 rounded-2xl border border-border shadow-2xl transition-colors duration-200 sm:h-64 sm:w-64"
            style={{ backgroundColor: hex }}
            aria-label="Color preview"
          />
          <p className="text-center text-lg font-semibold tracking-wide text-foreground">
            {hex.toUpperCase()}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Palette className="h-3.5 w-3.5" />
            <span>{hslString}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Pickers & Inputs ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Color Picker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Native color picker */}
          <div className="flex items-center gap-4">
            <Label className="w-20 shrink-0 text-sm font-medium">Pick</Label>
            <input
              type="color"
              value={hex}
              onChange={(e) => updateFromHex(e.target.value)}
              className="h-12 w-20 cursor-pointer rounded-lg border border-border bg-transparent p-1"
              aria-label="Color picker"
            />
            <Input
              value={hex}
              onChange={(e) => handleHexInput(e.target.value)}
              onBlur={(e) => {
                if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
                  updateFromHex(rgbToHex(r, g, b));
                }
              }}
              className="h-12 flex-1 font-mono text-base uppercase"
              maxLength={7}
              aria-label="HEX color code"
            />
            <CopyButton text={hex.toUpperCase()} label="HEX" />
          </div>

          {/* RGB Sliders */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">RGB</Label>

            {/* Red */}
            <div className="flex items-center gap-3">
              <Label className="w-6 shrink-0 text-xs font-bold text-red-400">
                R
              </Label>
              <Slider
                value={[r]}
                min={0}
                max={255}
                step={1}
                onValueChange={([v]) => updateFromRgb(v, g, b)}
                className="flex-1 [&_[role=slider]]:border-red-400 [&_[role=slider]]:bg-red-400 [&>span:first-child]:bg-red-400/30"
                aria-label="Red channel"
              />
              <Input
                type="number"
                min={0}
                max={255}
                value={r}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                  updateFromRgb(v, g, b);
                }}
                className="h-8 w-16 text-center text-xs font-mono"
                aria-label="Red value"
              />
            </div>

            {/* Green */}
            <div className="flex items-center gap-3">
              <Label className="w-6 shrink-0 text-xs font-bold text-green-400">
                G
              </Label>
              <Slider
                value={[g]}
                min={0}
                max={255}
                step={1}
                onValueChange={([v]) => updateFromRgb(r, v, b)}
                className="flex-1 [&_[role=slider]]:border-green-400 [&_[role=slider]]:bg-green-400 [&>span:first-child]:bg-green-400/30"
                aria-label="Green channel"
              />
              <Input
                type="number"
                min={0}
                max={255}
                value={g}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                  updateFromRgb(r, v, b);
                }}
                className="h-8 w-16 text-center text-xs font-mono"
                aria-label="Green value"
              />
            </div>

            {/* Blue */}
            <div className="flex items-center gap-3">
              <Label className="w-6 shrink-0 text-xs font-bold text-blue-400">
                B
              </Label>
              <Slider
                value={[b]}
                min={0}
                max={255}
                step={1}
                onValueChange={([v]) => updateFromRgb(r, g, v)}
                className="flex-1 [&_[role=slider]]:border-blue-400 [&_[role=slider]]:bg-blue-400 [&>span:first-child]:bg-blue-400/30"
                aria-label="Blue channel"
              />
              <Input
                type="number"
                min={0}
                max={255}
                value={b}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                  updateFromRgb(r, g, v);
                }}
                className="h-8 w-16 text-center text-xs font-mono"
                aria-label="Blue value"
              />
            </div>

            {/* RGB copy row */}
            <div className="flex items-center gap-2 pl-9">
              <code className="flex-1 truncate text-xs text-muted-foreground">
                {rgbString}
              </code>
              <CopyButton text={rgbString} label="RGB" />
            </div>
          </div>

          {/* HSL Inputs */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">HSL</Label>

            {/* Hue */}
            <div className="flex items-center gap-3">
              <Label className="w-6 shrink-0 text-xs font-bold text-amber-400">
                H
              </Label>
              <Slider
                value={[h]}
                min={0}
                max={360}
                step={1}
                onValueChange={([v]) => updateFromHsl(v, s, l)}
                className="flex-1 [&_[role=slider]]:border-amber-400 [&_[role=slider]]:bg-amber-400 [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-red-500 [&>span:first-child]:via-green-500 [&>span:first-child]:to-blue-500 [&>span:first-child]:bg-clip-padding"
                aria-label="Hue"
              />
              <Input
                type="number"
                min={0}
                max={360}
                value={h}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
                  updateFromHsl(v, s, l);
                }}
                className="h-8 w-16 text-center text-xs font-mono"
                aria-label="Hue value"
              />
            </div>

            {/* Saturation */}
            <div className="flex items-center gap-3">
              <Label className="w-6 shrink-0 text-xs font-bold text-cyan-400">
                S
              </Label>
              <Slider
                value={[s]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => updateFromHsl(h, v, l)}
                className="flex-1 [&_[role=slider]]:border-cyan-400 [&_[role=slider]]:bg-cyan-400 [&>span:first-child]:bg-cyan-400/30"
                aria-label="Saturation"
              />
              <Input
                type="number"
                min={0}
                max={100}
                value={s}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                  updateFromHsl(h, v, l);
                }}
                className="h-8 w-16 text-center text-xs font-mono"
                aria-label="Saturation value"
              />
            </div>

            {/* Lightness */}
            <div className="flex items-center gap-3">
              <Label className="w-6 shrink-0 text-xs font-bold text-pink-400">
                L
              </Label>
              <Slider
                value={[l]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => updateFromHsl(h, s, v)}
                className="flex-1 [&_[role=slider]]:border-pink-400 [&_[role=slider]]:bg-pink-400 [&>span:first-child]:bg-pink-400/30"
                aria-label="Lightness"
              />
              <Input
                type="number"
                min={0}
                max={100}
                value={l}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                  updateFromHsl(h, s, v);
                }}
                className="h-8 w-16 text-center text-xs font-mono"
                aria-label="Lightness value"
              />
            </div>

            {/* HSL copy row */}
            <div className="flex items-center gap-2 pl-9">
              <code className="flex-1 truncate text-xs text-muted-foreground">
                {hslString}
              </code>
              <CopyButton text={hslString} label="HSL" />
            </div>
          </div>

          {/* CSS color copy */}
          <div className="flex items-center gap-2">
            <Label className="w-20 shrink-0 text-sm font-medium">CSS</Label>
            <code className="flex-1 truncate rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs font-mono text-muted-foreground">
              {cssColor}
            </code>
            <CopyButton text={cssColor} label="CSS" />
          </div>
        </CardContent>
      </Card>

      {/* ── Color Schemes ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Color Schemes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Complementary */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Complementary
            </p>
            <div className="flex gap-2">
              {[hex, complementary].map((c) => (
                <button
                  key={c}
                  onClick={() => updateFromHex(c)}
                  className="group relative h-12 flex-1 rounded-lg border border-border transition-transform hover:scale-105"
                  style={{ backgroundColor: c }}
                  aria-label={`Select ${c}`}
                >
                  <span className="absolute inset-x-0 -bottom-5 text-center text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {c.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Analogous */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Analogous
            </p>
            <div className="flex gap-2">
              {analogous.map((c) => (
                <button
                  key={c}
                  onClick={() => updateFromHex(c)}
                  className="group relative h-12 flex-1 rounded-lg border border-border transition-transform hover:scale-105"
                  style={{ backgroundColor: c }}
                  aria-label={`Select ${c}`}
                >
                  <span className="absolute inset-x-0 -bottom-5 text-center text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {c.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Triadic */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Triadic
            </p>
            <div className="flex gap-2">
              {triadic.map((c) => (
                <button
                  key={c}
                  onClick={() => updateFromHex(c)}
                  className="group relative h-12 flex-1 rounded-lg border border-border transition-transform hover:scale-105"
                  style={{ backgroundColor: c }}
                  aria-label={`Select ${c}`}
                >
                  <span className="absolute inset-x-0 -bottom-5 text-center text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {c.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recent
              </p>
              <div className="flex flex-wrap gap-2">
                {recentColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateFromHex(c)}
                    className="h-8 w-8 rounded-md border border-border transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                    aria-label={`Select recent color ${c}`}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Contrast Checker ────────────────────────────────────────── */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">WCAG AA Contrast Checker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* White text */}
            <div className="space-y-2 rounded-xl border border-border p-4">
              <div
                className="flex h-16 items-center justify-center rounded-lg text-lg font-bold text-white"
                style={{ backgroundColor: hex }}
              >
                White Text
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      whitePass
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {whitePass ? "✓" : "✗"}
                  </span>
                  <span className="text-sm font-medium">
                    {whitePass ? "Pass" : "Fail"}
                  </span>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {whiteContrast.toFixed(2)}:1
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Requires ≥ 4.5:1 for normal text
              </p>
            </div>

            {/* Black text */}
            <div className="space-y-2 rounded-xl border border-border p-4">
              <div
                className="flex h-16 items-center justify-center rounded-lg text-lg font-bold text-black"
                style={{ backgroundColor: hex }}
              >
                Black Text
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      blackPass
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {blackPass ? "✓" : "✗"}
                  </span>
                  <span className="text-sm font-medium">
                    {blackPass ? "Pass" : "Fail"}
                  </span>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {blackContrast.toFixed(2)}:1
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Requires ≥ 4.5:1 for normal text
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}