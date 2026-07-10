"use client";

import { useEffect, useRef } from "react";
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
import { Download, ScanBarcode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JsBarcode from "jsbarcode";

const FORMATS = [
  { value: "CODE128", label: "CODE 128 (Auto)" },
  { value: "CODE128A", label: "CODE 128A" },
  { value: "CODE128B", label: "CODE 128B" },
  { value: "CODE128C", label: "CODE 128C" },
  { value: "EAN13", label: "EAN-13" },
  { value: "EAN8", label: "EAN-8" },
  { value: "UPC", label: "UPC-A" },
  { value: "CODE39", label: "CODE 39" },
  { value: "ITF14", label: "ITF-14" },
  { value: "MSI", label: "MSI" },
  { value: "pharmacode", label: "Pharmacode" },
];

export default function BarcodeGenerator() {
  const { toast } = useToast();
  const svgRef = useRef<SVGSVGElement>(null);

  const generateBarcode = (text: string, format: string) => {
    if (!svgRef.current || !text) return;
    try {
      JsBarcode(svgRef.current, text, {
        format,
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch {
      // Invalid input for format
    }
  };

  const handleDownload = (format: string) => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx!.scale(2, 2);
      ctx!.fillStyle = "#ffffff";
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `barcode-${Date.now()}.png`;
      a.click();
      toast({ title: "Downloaded", description: `Barcode saved as PNG (${format}).` });
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopySvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(svgData).then(() => {
        toast({ title: "Copied", description: "SVG copied to clipboard." });
      });
    } else {
      // Fallback for non-HTTPS contexts
      const textarea = document.createElement("textarea");
      textarea.value = svgData;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast({ title: "Copied", description: "SVG copied to clipboard." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <ScanBarcode className="h-5 w-5 text-primary" />
              Barcode Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Barcode Format</Label>
              <Select defaultValue="CODE128" onValueChange={(v) => {
                const input = document.getElementById("barcode-text") as HTMLInputElement;
                if (input) generateBarcode(input.value, v);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Value</Label>
              <Input
                id="barcode-text"
                placeholder="Enter barcode value..."
                defaultValue="AganDevTools-2024"
                className="font-mono"
                onChange={(e) => {
                  const select = document.querySelector("[data-slot='select-trigger']") as unknown as HTMLSelectElement;
                  const format = document.querySelector("[data-state]")?.textContent?.includes("EAN") ? "EAN13" : "CODE128";
                  generateBarcode(e.target.value, format);
                }}
              />
              <p className="text-xs text-muted-foreground">
                For EAN-13 use 13 digits, EAN-8 use 8 digits, UPC-A use 12 digits.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => {
                  const input = document.getElementById("barcode-text") as HTMLInputElement;
                  if (input) {
                    const sel = document.querySelector("[data-state=open] [role='option'][data-state='checked']")?.getAttribute("data-value") || "CODE128";
                    handleDownload(sel);
                  }
                }}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download PNG
              </Button>
              <Button variant="outline" onClick={handleCopySvg}>
                Copy SVG
              </Button>
            </div>

            <div className="rounded-md border border-border/40 bg-muted/20 p-3 text-xs text-muted-foreground">
              <strong className="text-foreground/80">Tips:</strong>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>CODE 128 supports all ASCII characters</li>
                <li>EAN-13 requires exactly 13 digits (12 + check digit)</li>
                <li>EAN-8 requires exactly 8 digits</li>
                <li>UPC-A requires exactly 12 digits</li>
                <li>CODE 39 supports uppercase, digits, and - . $ / + % space</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="flex items-center justify-center p-6">
            <div className="rounded-xl border-2 border-border/50 bg-white p-6 shadow-lg">
              <svg ref={svgRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}