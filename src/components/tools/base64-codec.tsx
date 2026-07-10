"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Check,
  Trash2,
  ArrowRight,
  ArrowLeft,
  FileText,
  Globe,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte)
  ).join("");
  return btoa(binString);
}

function base64ToUtf8(base64: string): string {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, (char) =>
    char.codePointAt(0)!
  );
  return new TextDecoder().decode(bytes);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte)
  ).join("");
  return btoa(binString);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export default function Base64Codec() {
  const [plainText, setPlainText] = useState("");
  const [encodedText, setEncodedText] = useState("");
  const [lastAction, setLastAction] = useState<"encode" | "decode" | null>(null);
  const [copiedSide, setCopiedSide] = useState<"plain" | "encoded" | null>(null);
  const [includeDataUri, setIncludeDataUri] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileMime, setFileMime] = useState("application/octet-stream");
  const [fileInputKey, setFileInputKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const handleCopy = async (text: string, side: "plain" | "encoded") => {
    try {
      await copyToClipboard(text);
      setCopiedSide(side);
      toast({
        title: "Copied",
        description: "Text copied to clipboard.",
      });
      setTimeout(() => setCopiedSide(null), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Could not copy text to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setPlainText("");
    setEncodedText("");
    setLastAction(null);
    setFileName("");
    setFileMime("application/octet-stream");
    setFileInputKey((k) => k + 1);
  };

  // Text mode handlers
  const handlePlainTextChange = (value: string) => {
    setPlainText(value);
    if (value === "") {
      setEncodedText("");
      setLastAction(null);
      return;
    }
    try {
      const result = utf8ToBase64(value);
      setEncodedText(result);
      setLastAction("encode");
    } catch {
      /* ignore */
    }
  };

  const handleEncodedTextChange = (value: string) => {
    setEncodedText(value);
    if (value === "") {
      setPlainText("");
      setLastAction(null);
      return;
    }
    try {
      const result = base64ToUtf8(value);
      setPlainText(result);
      setLastAction("decode");
    } catch {
      /* ignore */
    }
  };

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setFileMime(file.type || "application/octet-stream");

      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result as ArrayBuffer;
        let base64 = arrayBufferToBase64(buffer);

        if (includeDataUri) {
          base64 = `data:${file.type || "application/octet-stream"};base64,${base64}`;
        }

        setEncodedText(base64);
        setPlainText("");
        setLastAction("encode");
        toast({
          title: "File Encoded",
          description: `${file.name} (${formatBytes(file.size)}) converted to Base64.`,
        });
      };
      reader.onerror = () => {
        toast({
          title: "File Read Error",
          description: "Failed to read the file.",
          variant: "destructive",
        });
      };
      reader.readAsArrayBuffer(file);
    },
    [includeDataUri, toast]
  );

  // Size calculations
  const plainBytes = new TextEncoder().encode(plainText).length;
  const encodedBytes = new TextEncoder().encode(encodedText).length;

  const renderPanel = (
    side: "plain" | "encoded",
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    byteCount: number,
    arrowIcon: React.ReactNode,
    actionLabel: string,
    onAction: () => void
  ) => (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {value.length} chars · {formatBytes(byteCount)}
        </span>
      </div>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[180px] font-mono text-sm resize-y bg-background/50 border-border/50 focus-visible:ring-emerald-500/30"
      />
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          {arrowIcon}
          {actionLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopy(value, side)}
          disabled={!value}
          className="border-border/50"
        >
          {copiedSide === side ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-emerald-500" />
            Base64 Encode / Decode
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="bg-muted/50 w-full sm:w-auto">
            <TabsTrigger
              value="text"
              className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 flex-1 sm:flex-initial"
            >
              <Globe className="h-4 w-4 mr-1.5" />
              Text Mode
            </TabsTrigger>
            <TabsTrigger
              value="file"
              className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 flex-1 sm:flex-initial"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              File Mode
            </TabsTrigger>
          </TabsList>

          {/* Text Mode */}
          <TabsContent value="text" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
              {/* Left panel — Plain Text */}
              {renderPanel(
                "plain",
                "Plain Text",
                plainText,
                handlePlainTextChange,
                "Enter plain text...",
                plainBytes,
                <ArrowRight className="h-4 w-4 mr-1.5" />,
                "Encode",
                () => {
                  try {
                    const result = utf8ToBase64(plainText);
                    setEncodedText(result);
                    setLastAction("encode");
                  } catch {
                    toast({
                      title: "Encoding Error",
                      description: "Failed to encode the input text.",
                      variant: "destructive",
                    });
                  }
                }
              )}

              {/* Center arrow indicators (desktop) */}
              <div className="hidden lg:flex flex-col items-center justify-center gap-2 pt-8">
                <div
                  className={`rounded-full p-1.5 transition-colors ${
                    lastAction === "encode"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-muted-foreground/40"
                  }`}
                >
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div
                  className={`rounded-full p-1.5 transition-colors ${
                    lastAction === "decode"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-muted-foreground/40"
                  }`}
                >
                  <ArrowLeft className="h-5 w-5" />
                </div>
              </div>

              {/* Mobile arrows */}
              <div className="flex lg:hidden items-center justify-center gap-3">
                <div
                  className={`rounded-full p-1.5 transition-colors ${
                    lastAction === "encode"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-muted-foreground/40"
                  }`}
                >
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div
                  className={`rounded-full p-1.5 transition-colors ${
                    lastAction === "decode"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-muted-foreground/40"
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                </div>
              </div>

              {/* Right panel — Base64 */}
              {renderPanel(
                "encoded",
                "Base64",
                encodedText,
                handleEncodedTextChange,
                "Enter Base64 string...",
                encodedBytes,
                <ArrowLeft className="h-4 w-4 mr-1.5" />,
                "Decode",
                () => {
                  try {
                    const result = base64ToUtf8(encodedText);
                    setPlainText(result);
                    setLastAction("decode");
                  } catch {
                    toast({
                      title: "Decoding Error",
                      description: "Invalid Base64 string.",
                      variant: "destructive",
                    });
                  }
                }
              )}
            </div>

            {/* Size comparison */}
            {(plainBytes > 0 || encodedBytes > 0) && (
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/70">
                <span>
                  Original:{" "}
                  <span className="text-emerald-400 font-medium">
                    {formatBytes(plainBytes)}
                  </span>
                </span>
                <span className="text-border">→</span>
                <span>
                  Encoded:{" "}
                  <span className="text-emerald-400 font-medium">
                    {formatBytes(encodedBytes)}
                  </span>
                </span>
                {plainBytes > 0 && (
                  <span className="text-muted-foreground/50">
                    ({((encodedBytes / plainBytes) * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
            )}

            {/* Clear button */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!plainText && !encodedText}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Clear All
              </Button>
            </div>
          </TabsContent>

          {/* File Mode */}
          <TabsContent value="file" className="mt-4 space-y-4">
            {/* File upload area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  Upload File
                </Label>
                <div className="flex items-center gap-2.5">
                  <Label
                    htmlFor="data-uri-toggle"
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                  >
                    Include data: URI prefix
                  </Label>
                  <Switch
                    id="data-uri-toggle"
                    checked={includeDataUri}
                    onCheckedChange={(checked) => {
                      setIncludeDataUri(checked);
                      // Re-encode if we already have a result
                      if (encodedText && fileName) {
                        const pureBase64 = encodedText.includes(",")
                          ? encodedText.split(",").slice(1).join(",")
                          : encodedText;
                        if (checked) {
                          setEncodedText(
                            `data:${fileMime};base64,${pureBase64}`
                          );
                        } else {
                          setEncodedText(pureBase64);
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <input
                ref={fileInputRef}
                key={fileInputKey}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />

              <Button
                variant="outline"
                className="w-full h-24 border-dashed border-2 border-border/60 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-muted-foreground hover:text-emerald-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">
                    {fileName ? fileName : "Click to select a file"}
                  </span>
                  {fileName && (
                    <span className="text-xs text-muted-foreground/60">
                      Click to change file
                    </span>
                  )}
                </div>
              </Button>
            </div>

            {/* Base64 output */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-muted-foreground">
                  Base64 Output
                </Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {encodedText.length > 0
                    ? `${encodedText.length} chars · ${formatBytes(encodedBytes)}`
                    : "No data"}
                </span>
              </div>
              <Textarea
                placeholder="Base64 output will appear here..."
                value={encodedText}
                readOnly
                className="min-h-[180px] font-mono text-sm resize-y bg-background/50 border-border/50"
              />
              <div className="flex items-center gap-2">
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(encodedText, "encoded")}
                  disabled={!encodedText}
                  className="border-border/50"
                >
                  {copiedSide === "encoded" ? (
                    <Check className="h-4 w-4 text-emerald-400 mr-1.5" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1.5" />
                  )}
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={!encodedText && !fileName}
                  className="text-muted-foreground hover:text-destructive border-border/50"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Clear
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}