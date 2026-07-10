"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Network, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";

function ipToLong(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function longToIp(long: number): string {
  return [(long >>> 24) & 255, (long >>> 16) & 255, (long >>> 8) & 255, long & 255].join(".");
}

function calculateCIDR(ip: string, cidr: number) {
  const ipLong = ipToLong(ip);
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const network = (ipLong & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;
  const firstHost = cidr >= 31 ? network : (network + 1) >>> 0;
  const lastHost = cidr >= 31 ? broadcast : (broadcast - 1) >>> 0;
  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = cidr >= 31 ? (cidr === 32 ? 1 : 2) : totalHosts - 2;

  return {
    networkAddress: longToIp(network),
    broadcastAddress: longToIp(broadcast),
    subnetMask: longToIp(mask),
    wildcardMask: longToIp(~mask >>> 0),
    firstHost: longToIp(firstHost),
    lastHost: longToIp(lastHost),
    totalHosts,
    usableHosts,
    ipClass: getIPClass(ipLong),
    isPrivate: isPrivateIP(ipLong),
    binarySubnet: mask.toString(2).padStart(32, "0"),
    cidrNotation: `${longToIp(network)}/${cidr}`,
  };
}

function getIPClass(ip: number): string {
  const first = (ip >>> 24) & 255;
  if (first < 128) return "A";
  if (first < 192) return "B";
  if (first < 224) return "C";
  if (first < 240) return "D (Multicast)";
  return "E (Reserved)";
}

function isPrivateIP(ip: number): boolean {
  const f = (ip >>> 24) & 255;
  const s = (ip >>> 16) & 255;
  if (f === 10) return true;
  if (f === 172 && s >= 16 && s <= 31) return true;
  if (f === 192 && s === 168) return true;
  if (f === 127) return true;
  return false;
}

function isValidIP(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = parseInt(p, 10);
    return !isNaN(n) && n >= 0 && n <= 255 && p === String(n);
  });
}

function InfoRow({ label, value, copied, onCopy, copyLabel }: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: (text: string, label: string) => void;
  copyLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/30 bg-muted/20 px-3 py-2.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <code className="truncate font-mono text-foreground">{value}</code>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => onCopy(value, copyLabel || label)}
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function NetworkTools() {
  const { toast } = useToast();
  const [ip, setIp] = useState("192.168.1.100");
  const [cidr, setCidr] = useState(24);
  const [copied, setCopied] = useState<string | null>(null);

  const result = useMemo(() => {
    if (!isValidIP(ip) || cidr < 0 || cidr > 32) return null;
    return calculateCIDR(ip, cidr);
  }, [ip, cidr]);

  const copy = async (text: string, label: string) => {
    await copyToClipboard(text);
    setCopied(label);
    toast({ title: "Copied", description: `${label} copied.` });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Network className="h-5 w-5 text-primary" />
            CIDR / Subnet Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">IP Address</Label>
              <Input
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.1.0"
                className={`font-mono ${ip && !isValidIP(ip) ? "border-destructive" : ""}`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">CIDR Prefix</Label>
              <Input
                type="number"
                min={0}
                max={32}
                value={cidr}
                onChange={(e) => setCidr(parseInt(e.target.value) || 0)}
                className="font-mono w-24"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>/0 (0.0.0.0/0)</span>
              <span>/{cidr}</span>
              <span>/32 (single host)</span>
            </div>
            <input
              type="range"
              min={0}
              max={32}
              value={cidr}
              onChange={(e) => setCidr(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Results for {result.cidrNotation}</CardTitle>
              <div className="flex gap-1.5">
                <Badge variant={result.isPrivate ? "secondary" : "outline"}>
                  {result.isPrivate ? "Private" : "Public"}
                </Badge>
                <Badge variant="outline">Class {result.ipClass}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow label="Network Address" value={result.networkAddress} copied={copied === "Network Address"} onCopy={copy} />
            <InfoRow label="Broadcast Address" value={result.broadcastAddress} copied={copied === "Broadcast Address"} onCopy={copy} />
            <InfoRow label="Subnet Mask" value={result.subnetMask} copied={copied === "Subnet Mask"} onCopy={copy} />
            <InfoRow label="Wildcard Mask" value={result.wildcardMask} copied={copied === "Wildcard Mask"} onCopy={copy} />
            <InfoRow label="First Host" value={result.firstHost} copied={copied === "First Host"} onCopy={copy} />
            <InfoRow label="Last Host" value={result.lastHost} copied={copied === "Last Host"} onCopy={copy} />
            <InfoRow label="Total Hosts" value={result.totalHosts.toLocaleString()} copied={copied === "Total Hosts"} onCopy={copy} />
            <InfoRow label="Usable Hosts" value={result.usableHosts.toLocaleString()} copied={copied === "Usable Hosts"} onCopy={copy} />
            <div className="rounded-md border border-border/30 bg-muted/20 px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Binary Subnet Mask: </span>
              <code className="font-mono text-xs">
                {result.binarySubnet.slice(0, cidr)}
                <span className="text-muted-foreground/50">{result.binarySubnet.slice(cidr)}</span>
                <span className="ml-2 text-xs text-muted-foreground">({cidr} bits)</span>
              </code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}