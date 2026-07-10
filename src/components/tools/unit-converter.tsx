"use client";

import { useState, useMemo } from "react";
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
import { Ruler, ArrowRight } from "lucide-react";

interface UnitDef {
  id: string;
  name: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

interface UnitCategory {
  name: string;
  units: UnitDef[];
}

const CATEGORIES: Record<string, UnitCategory> = {
  length: {
    name: "Length",
    units: [
      { id: "mm", name: "Millimeter (mm)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: "cm", name: "Centimeter (cm)", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: "m", name: "Meter (m)", toBase: (v) => v, fromBase: (v) => v },
      { id: "km", name: "Kilometer (km)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "in", name: "Inch (in)", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: "ft", name: "Foot (ft)", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: "yd", name: "Yard (yd)", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: "mi", name: "Mile (mi)", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    ],
  },
  weight: {
    name: "Weight",
    units: [
      { id: "mg", name: "Milligram (mg)", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { id: "g", name: "Gram (g)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: "kg", name: "Kilogram (kg)", toBase: (v) => v, fromBase: (v) => v },
      { id: "lb", name: "Pound (lb)", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
      { id: "oz", name: "Ounce (oz)", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
      { id: "t", name: "Metric Ton (t)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    ],
  },
  temperature: {
    name: "Temperature",
    units: [
      { id: "c", name: "Celsius", toBase: (v) => v, fromBase: (v) => v },
      { id: "f", name: "Fahrenheit", toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
      { id: "k", name: "Kelvin", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  data: {
    name: "Data",
    units: [
      { id: "b", name: "Byte (B)", toBase: (v) => v, fromBase: (v) => v },
      { id: "kb", name: "Kilobyte (KB)", toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { id: "mb", name: "Megabyte (MB)", toBase: (v) => v * 1024 ** 2, fromBase: (v) => v / 1024 ** 2 },
      { id: "gb", name: "Gigabyte (GB)", toBase: (v) => v * 1024 ** 3, fromBase: (v) => v / 1024 ** 3 },
      { id: "tb", name: "Terabyte (TB)", toBase: (v) => v * 1024 ** 4, fromBase: (v) => v / 1024 ** 4 },
    ],
  },
  speed: {
    name: "Speed",
    units: [
      { id: "ms", name: "m/s", toBase: (v) => v, fromBase: (v) => v },
      { id: "kmh", name: "km/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { id: "mph", name: "mph", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { id: "kn", name: "Knot", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    ],
  },
  area: {
    name: "Area",
    units: [
      { id: "mm2", name: "mm2", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { id: "m2", name: "m2", toBase: (v) => v, fromBase: (v) => v },
      { id: "km2", name: "km2", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: "ha", name: "Hectare", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      { id: "acre", name: "Acre", toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
      { id: "ft2", name: "ft2", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
    ],
  },
};

const catKeys = Object.keys(CATEGORIES);

export default function UnitConverter() {
  const [category, setCategory] = useState("length");
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [fromValue, setFromValue] = useState("1");

  const cat = CATEGORIES[category];
  const fromUnit = cat.units[fromIdx] ?? cat.units[0];
  const toUnit = cat.units[toIdx] ?? cat.units[1];

  const toValue = useMemo(() => {
    const num = parseFloat(fromValue);
    if (isNaN(num)) return "";
    const base = fromUnit.toBase(num);
    const result = toUnit.fromBase(base);
    return Number.isInteger(result) ? result.toString() : result.toPrecision(10).replace(/\.?0+$/, "");
  }, [fromValue, fromUnit, toUnit]);

  const handleCategoryChange = (key: string) => {
    setCategory(key);
    setFromIdx(0);
    setToIdx(1);
    setFromValue("1");
  };

  const swap = () => {
    setFromIdx(toIdx);
    setToIdx(fromIdx);
    setFromValue(toValue || "0");
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Ruler className="h-5 w-5 text-primary" />
            Unit Converter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {catKeys.map((key) => (
              <button
                key={key}
                onClick={() => handleCategoryChange(key)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  category === key
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {CATEGORIES[key].name}
              </button>
            ))}
          </div>

          <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Select value={String(fromIdx)} onValueChange={(v) => setFromIdx(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cat.units.map((u, i) => (
                    <SelectItem key={u.id} value={String(i)}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
                className="font-mono text-lg"
                placeholder="Enter value"
              />
            </div>

            <Button variant="ghost" size="icon" className="mt-1 h-10 w-10" onClick={swap}>
              <ArrowRight className="h-4 w-4 rotate-90 sm:rotate-0" />
            </Button>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Select value={String(toIdx)} onValueChange={(v) => setToIdx(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cat.units.map((u, i) => (
                    <SelectItem key={u.id} value={String(i)}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={toValue}
                readOnly
                className="font-mono text-lg bg-muted/50"
                placeholder="Result"
              />
            </div>
          </div>

          <div className="rounded-md border border-border/40 bg-muted/20 p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Reference (1 {fromUnit.name})
            </h4>
            <div className="flex flex-wrap gap-2">
              {cat.units
                .filter((u) => u.id !== fromUnit.id)
                .map((u) => {
                  const num = parseFloat(fromValue) || 0;
                  const base = fromUnit.toBase(num);
                  const val = u.fromBase(base);
                  return (
                    <span key={u.id} className="rounded-md bg-muted/60 px-2.5 py-1 text-xs">
                      <span className="font-mono font-medium">{Number.isInteger(val) ? val : val.toPrecision(6).replace(/\.?0+$/, "")}</span>{" "}
                      <span className="text-muted-foreground">{u.id}</span>
                    </span>
                  );
                })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}