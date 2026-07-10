"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Trash2, KeyRound, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";

interface DecodedJWT {
  valid: boolean;
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  error: string | null;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) {
    if (pad === 1) base64 += "===";
    else if (pad === 2) base64 += "==";
    else base64 += "=";
  }
  return decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

function decodeJWT(token: string): DecodedJWT {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return {
      valid: false,
      header: null,
      payload: null,
      signature: "",
      error: "Invalid JWT format. Expected 3 parts separated by dots.",
    };
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return {
      valid: true,
      header,
      payload,
      signature: parts[2],
      error: null,
    };
  } catch {
    return {
      valid: false,
      header: null,
      payload: null,
      signature: parts[2] || "",
      error: "Failed to decode JWT. Ensure it is a valid Base64URL-encoded token.",
    };
  }
}

function syntaxHighlight(json: string): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "text-emerald-400"; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "text-sky-400"; // key
        } else {
          cls = "text-amber-300"; // string
        }
      } else if (/true|false/.test(match)) {
        cls = "text-purple-400"; // boolean
      } else if (/null/.test(match)) {
        cls = "text-rose-400"; // null
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function formatExpirationStatus(
  exp: number | undefined | null
): { label: string; variant: "default" | "destructive" | "secondary" | "outline" } {
  if (exp == null) {
    return { label: "No expiration", variant: "secondary" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (exp < now) {
    const expiredAgo = now - exp;
    const days = Math.floor(expiredAgo / 86400);
    const hours = Math.floor((expiredAgo % 86400) / 3600);
    if (days > 0) {
      return { label: `Expired ${days}d ${hours}h ago`, variant: "destructive" };
    }
    const minutes = Math.floor((expiredAgo % 3600) / 60);
    return { label: `Expired ${hours}h ${minutes}m ago`, variant: "destructive" };
  }
  const remaining = exp - now;
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  if (days > 0) {
    return { label: `Valid for ${days}d ${hours}h`, variant: "default" };
  }
  const minutes = Math.floor((remaining % 3600) / 60);
  return { label: `Valid for ${hours}h ${minutes}m`, variant: "default" };
}

export default function JWTDecoder() {
  const [token, setToken] = useState("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const { toast } = useToast();

  const decoded = useMemo(() => {
    if (!token.trim()) {
      return { valid: false, header: null, payload: null, signature: "", error: null } as DecodedJWT;
    }
    return decodeJWT(token);
  }, [token]);

  const expirationStatus = useMemo(() => {
    if (!decoded.valid || !decoded.payload) return null;
    const exp = decoded.payload.exp as number | undefined;
    return formatExpirationStatus(exp);
  }, [decoded]);

  const expDate = useMemo(() => {
    if (!decoded.valid || !decoded.payload) return null;
    const exp = decoded.payload.exp as number | undefined;
    if (exp == null) return null;
    return new Date(exp * 1000);
  }, [decoded]);

  const handleCopy = async (section: string, content: unknown) => {
    try {
      const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
      await copyToClipboard(text);
      setCopiedSection(section);
      toast({
        title: "Copied",
        description: `${section} copied to clipboard.`,
      });
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setToken("");
    setCopiedSection(null);
  };

  const renderHighlightedJSON = (obj: Record<string, unknown>) => {
    const json = JSON.stringify(obj, null, 2);
    const highlighted = syntaxHighlight(json);
    return (
      <pre className="text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap break-all font-mono bg-muted/30 rounded-md p-4 border border-border/50">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    );
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-500" />
              JWT Token
            </CardTitle>
            <div className="flex items-center gap-2">
              {token && (
                <>
                  <Badge
                    variant={decoded.valid ? "default" : "destructive"}
                    className={
                      decoded.valid
                        ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30"
                        : ""
                    }
                  >
                    {decoded.valid ? "Valid Format" : "Malformed"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="text-muted-foreground hover:text-rose-400 h-8 px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste your JWT token here..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono text-sm min-h-[120px] resize-y bg-muted/30 border-border/50 focus-visible:ring-emerald-500/30"
            spellCheck={false}
          />
          {decoded.error && (
            <div className="flex items-start gap-2 mt-3 text-rose-400 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{decoded.error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decoded Sections */}
      {token.trim() && decoded.valid && (
        <div className="grid gap-6">
          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {(decoded.header?.alg as string) && (
              <Badge variant="outline" className="text-xs font-mono border-border/60">
                Algorithm: <span className="text-emerald-400 ml-1">{decoded.header.alg as string}</span>
              </Badge>
            )}
            {(decoded.header?.typ as string) && (
              <Badge variant="outline" className="text-xs font-mono border-border/60">
                Type: <span className="text-sky-400 ml-1">{decoded.header.typ as string}</span>
              </Badge>
            )}
            {expirationStatus && (
              <Badge
                variant={expirationStatus.variant}
                className={
                  expirationStatus.variant === "default"
                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30"
                    : expirationStatus.variant === "destructive"
                      ? "bg-rose-600/20 text-rose-400 border-rose-500/30 hover:bg-rose-600/30"
                      : ""
                }
              >
                <Clock className="h-3 w-3 mr-1" />
                {expirationStatus.label}
              </Badge>
            )}
            {expDate && (
              <span className="text-xs text-muted-foreground">
                Expires: {expDate.toLocaleDateString()} {expDate.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Header Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Header</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy("Header", decoded.header)}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === "Header" ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="ml-1.5 text-xs">{copiedSection === "Header" ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>{decoded.header && renderHighlightedJSON(decoded.header)}</CardContent>
          </Card>

          {/* Payload Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Payload</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy("Payload", decoded.payload)}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === "Payload" ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="ml-1.5 text-xs">{copiedSection === "Payload" ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>{decoded.payload && renderHighlightedJSON(decoded.payload)}</CardContent>
          </Card>

          {/* Signature Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Signature</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy("Signature", decoded.signature)}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  {copiedSection === "Signature" ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="ml-1.5 text-xs">{copiedSection === "Signature" ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-md p-4 border border-border/50">
                <p className="font-mono text-sm text-muted-foreground break-all leading-relaxed">
                  {decoded.signature}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-3 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Signature cannot be verified client-side. The signature string is displayed for reference only.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!token.trim() && (
        <Card className="border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted/50 p-4 mb-4">
              <KeyRound className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm">
              Paste a JWT token above to decode it instantly.
            </p>
            <p className="text-muted-foreground/50 text-xs mt-1.5">
              Header, payload, and signature will be displayed in real-time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}