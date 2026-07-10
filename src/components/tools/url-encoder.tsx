"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, Trash2, ArrowRight, ArrowLeft, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";

export default function UrlEncoder() {
  const [plainText, setPlainText] = useState("");
  const [encodedText, setEncodedText] = useState("");
  const [encodeFullUri, setEncodeFullUri] = useState(false);
  const [lastAction, setLastAction] = useState<"encode" | "decode" | null>(null);
  const [copiedSide, setCopiedSide] = useState<"plain" | "encoded" | null>(null);

  const { toast } = useToast();

  const handleEncode = useCallback(() => {
    try {
      const result = encodeFullUri
        ? encodeURI(plainText)
        : encodeURIComponent(plainText);
      setEncodedText(result);
      setLastAction("encode");
    } catch {
      toast({
        title: "Encoding Error",
        description: "Failed to encode the input text.",
        variant: "destructive",
      });
    }
  }, [plainText, encodeFullUri, toast]);

  const handleDecode = useCallback(() => {
    try {
      const result = encodeFullUri
        ? decodeURI(encodedText)
        : decodeURIComponent(encodedText);
      setPlainText(result);
      setLastAction("decode");
    } catch {
      toast({
        title: "Decoding Error",
        description: "The encoded text contains invalid sequences.",
        variant: "destructive",
      });
    }
  }, [encodedText, encodeFullUri, toast]);

  const handleClear = () => {
    setPlainText("");
    setEncodedText("");
    setLastAction(null);
  };

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

  const handlePlainTextChange = (value: string) => {
    setPlainText(value);
    if (value === "") {
      setEncodedText("");
      setLastAction(null);
      return;
    }
    // Real-time encode left → right
    try {
      const result = encodeFullUri
        ? encodeURI(value)
        : encodeURIComponent(value);
      setEncodedText(result);
      setLastAction("encode");
    } catch {
      // Silently ignore encoding errors during typing
    }
  };

  const handleEncodedTextChange = (value: string) => {
    setEncodedText(value);
    if (value === "") {
      setPlainText("");
      setLastAction(null);
      return;
    }
    // Real-time decode right → left
    try {
      const result = encodeFullUri
        ? decodeURI(value)
        : decodeURIComponent(value);
      setPlainText(result);
      setLastAction("decode");
    } catch {
      // Silently ignore decoding errors during typing
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Globe className="h-5 w-5 text-emerald-500" />
            URL Encoder / Decoder
          </CardTitle>
          <div className="flex items-center gap-2.5">
            <Label
              htmlFor="full-uri-toggle"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Encode full URI
            </Label>
            <Switch
              id="full-uri-toggle"
              checked={encodeFullUri}
              onCheckedChange={(checked) => {
                setEncodeFullUri(checked);
                // Re-apply current action with new mode
                if (lastAction === "encode" && plainText) {
                  try {
                    const result = checked
                      ? encodeURI(plainText)
                      : encodeURIComponent(plainText);
                    setEncodedText(result);
                  } catch {
                    /* ignore */
                  }
                } else if (lastAction === "decode" && encodedText) {
                  try {
                    const result = checked
                      ? decodeURI(encodedText)
                      : decodeURIComponent(encodedText);
                    setPlainText(result);
                  } catch {
                    /* ignore */
                  }
                }
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          {/* Left panel — Plain Text */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">
                Plain Text
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {plainText.length} chars
              </span>
            </div>
            <Textarea
              placeholder="Enter plain text..."
              value={plainText}
              onChange={(e) => handlePlainTextChange(e.target.value)}
              className="min-h-[180px] font-mono text-sm resize-y bg-background/50 border-border/50 focus-visible:ring-emerald-500/30"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEncode()}
                className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <ArrowRight className="h-4 w-4 mr-1.5" />
                Encode
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(plainText, "plain")}
                disabled={!plainText}
                className="border-border/50"
              >
                {copiedSide === "plain" ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Center arrow indicators */}
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

          {/* Right panel — URL Encoded */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">
                URL Encoded
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {encodedText.length} chars
              </span>
            </div>
            <Textarea
              placeholder="Enter encoded text..."
              value={encodedText}
              onChange={(e) => handleEncodedTextChange(e.target.value)}
              className="min-h-[180px] font-mono text-sm resize-y bg-background/50 border-border/50 focus-visible:ring-emerald-500/30"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDecode()}
                className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Decode
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(encodedText, "encoded")}
                disabled={!encodedText}
                className="border-border/50"
              >
                {copiedSide === "encoded" ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

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

        {/* Mode hint */}
        <p className="text-xs text-muted-foreground/60 text-center">
          {encodeFullUri
            ? "Using encodeURI / decodeURI — encodes full URI, leaves :/?# etc. intact"
            : "Using encodeURIComponent / decodeURIComponent — encodes all special characters"}
        </p>
      </CardContent>
    </Card>
  );
}