"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Copy, Check, QrCode, Link, Wifi, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

type PresetType = "text" | "url" | "wifi" | "email" | "vcard";

export default function QRGenerator() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [preset, setPreset] = useState<PresetType>("text");
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState(256);
  const [ecLevel, setEcLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [margin, setMargin] = useState(2);
  const [copied, setCopied] = useState(false);
  const [qrSrc, setQrSrc] = useState("");

  // WiFi fields
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiType, setWifiType] = useState("WPA");

  // Email fields
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // vCard fields
  const [vcardName, setVcardName] = useState("");
  const [vcardPhone, setVcardPhone] = useState("");
  const [vcardEmail, setVcardEmail] = useState("");

  const getQRContent = useCallback((): string => {
    switch (preset) {
      case "url":
        return text || "https://";
      case "wifi":
        return `WIFI:T:${wifiType};S:${wifiSsid};P:${wifiPass};;`;
      case "email":
        const params: string[] = [];
        if (emailSubject) params.push(`subject=${encodeURIComponent(emailSubject)}`);
        if (emailBody) params.push(`body=${encodeURIComponent(emailBody)}`);
        return `mailto:${emailTo}${params.length ? `?${params.join("&")}` : ""}`;
      case "vcard":
        return [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `FN:${vcardName}`,
          vcardPhone ? `TEL:${vcardPhone}` : "",
          vcardEmail ? `EMAIL:${vcardEmail}` : "",
          "END:VCARD",
        ].filter(Boolean).join("\n");
      default:
        return text;
    }
  }, [preset, text, wifiSsid, wifiPass, wifiType, emailTo, emailSubject, emailBody, vcardName, vcardPhone, vcardEmail]);

  const qrContent = getQRContent();

  useEffect(() => {
    QRCode.toDataURL(qrContent || " ", {
      width: size,
      margin,
      errorCorrectionLevel: ecLevel,
      color: { dark: fgColor, light: bgColor },
    }).then(setQrSrc).catch(() => setQrSrc(""));
  }, [qrContent, size, margin, ecLevel, fgColor, bgColor]);

  const handleDownload = () => {
    if (!qrSrc) return;
    const a = document.createElement("a");
    a.href = qrSrc;
    a.download = `qrcode-${Date.now()}.png`;
    a.click();
    toast({ title: "Downloaded", description: "QR code saved as PNG." });
  };

  const handleCopy = async () => {
    if (!qrSrc) return;
    try {
      const response = await fetch(qrSrc);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      toast({ title: "Copied", description: "QR code copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy image.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        {/* Options Panel */}
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <QrCode className="h-5 w-5 text-primary" />
              QR Code Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs value={preset} onValueChange={(v) => setPreset(v as PresetType)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="text" className="text-xs gap-1"><QrCode className="h-3.5 w-3.5 hidden sm:block" />Text</TabsTrigger>
                <TabsTrigger value="url" className="text-xs gap-1"><Link className="h-3.5 w-3.5 hidden sm:block" />URL</TabsTrigger>
                <TabsTrigger value="wifi" className="text-xs gap-1"><Wifi className="h-3.5 w-3.5 hidden sm:block" />WiFi</TabsTrigger>
                <TabsTrigger value="email" className="text-xs gap-1"><Mail className="h-3.5 w-3.5 hidden sm:block" />Email</TabsTrigger>
                <TabsTrigger value="vcard" className="text-xs gap-1"><User className="h-3.5 w-3.5 hidden sm:block" />vCard</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-4">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter any text..."
                  className="min-h-[100px] font-mono text-sm"
                />
              </TabsContent>

              <TabsContent value="url" className="mt-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">URL</Label>
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="https://example.com"
                    className="font-mono"
                  />
                </div>
              </TabsContent>

              <TabsContent value="wifi" className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Network Name (SSID)</Label>
                  <Input value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} placeholder="MyWiFi" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Password</Label>
                  <Input value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} type="password" placeholder="password123" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Encryption</Label>
                  <Select value={wifiType} onValueChange={setWifiType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WPA">WPA/WPA2</SelectItem>
                      <SelectItem value="WEP">WEP</SelectItem>
                      <SelectItem value="nopass">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="email" className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="email@example.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Hello" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Body</Label>
                  <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Message body..." className="min-h-[80px]" />
                </div>
              </TabsContent>

              <TabsContent value="vcard" className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  <Input value={vcardName} onChange={(e) => setVcardName(e.target.value)} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input value={vcardPhone} onChange={(e) => setVcardPhone(e.target.value)} placeholder="+1234567890" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input value={vcardEmail} onChange={(e) => setVcardEmail(e.target.value)} placeholder="john@example.com" type="email" />
                </div>
              </TabsContent>
            </Tabs>

            {/* QR Options */}
            <div className="space-y-4 border-t border-border/40 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">QR Options</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Size: {size}px</Label>
                  <Slider value={[size]} min={100} max={500} step={16} onValueChange={([v]) => setSize(v)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Margin: {margin}</Label>
                  <Slider value={[margin]} min={0} max={10} step={1} onValueChange={([v]) => setMargin(v)} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Error Correction</Label>
                  <Select value={ecLevel} onValueChange={(v) => setEcLevel(v as "L" | "M" | "Q" | "H")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Low (7%)</SelectItem>
                      <SelectItem value="M">Medium (15%)</SelectItem>
                      <SelectItem value="Q">Quartile (25%)</SelectItem>
                      <SelectItem value="H">High (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Foreground</Label>
                  <div className="flex gap-2">
                    <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-border" />
                    <Input value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Background</Label>
                  <div className="flex gap-2">
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-border" />
                    <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Preview */}
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center gap-4 p-6">
            <div className="rounded-xl border-2 border-border/50 bg-white p-4 shadow-lg">
              {qrSrc ? (
                <img src={qrSrc} alt="QR Code" width={size} height={size} style={{ width: Math.min(size, 280), height: Math.min(size, 280) }} />
              ) : (
                <div className="flex items-center justify-center" style={{ width: Math.min(size, 280), height: Math.min(size, 280) }}>
                  <QrCode className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownload} disabled={!qrSrc} size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download
              </Button>
              <Button onClick={handleCopy} disabled={!qrSrc} variant="outline" size="sm">
                {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}