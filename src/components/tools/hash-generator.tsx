"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Upload, FileText, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";

// ─── MD5 (Web Crypto doesn't support it) ─────────────────────────────────────

function md5(input: string): string {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(
    q: number,
    a: number,
    b: number,
    x: number,
    s: number,
    t: number
  ) {
    return safeAdd(
      bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s),
      b
    );
  }
  function md5ff(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number
  ) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number
  ) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number
  ) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number
  ) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function binlMD5(x: number[], len: number) {
    x[len >> 5] |= 0x80 << (len % 32);
    x[((len + 64) >>> 9) << 4 + 14] = len;
    let a = 1732584193,
      b = -271733879,
      c = -1732584194,
      d = 271733878;
    for (let i = 0; i < x.length; i += 16) {
      const oa = a,
        ob = b,
        oc = c,
        od = d;
      a = md5ff(a, b, c, d, x[i], 7, -680876936);
      d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
      a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
      d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = md5hh(d, a, b, c, x[i], 11, -358537222);
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
      a = md5ii(a, b, c, d, x[i], 6, -198630844);
      d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
      a = safeAdd(a, oa);
      b = safeAdd(b, ob);
      c = safeAdd(c, oc);
      d = safeAdd(d, od);
    }
    return [a, b, c, d];
  }
  function rstrMD5(s: string) {
    const bin = binlMD5(str2binl(s), s.length * 8);
    return bin.map((x) => x.toString(16).padStart(8, "0")).join("");
  }
  function str2binl(str: string) {
    const bin: number[] = [];
    const mask = (1 << 8) - 1;
    for (let i = 0; i < str.length * 8; i += 8)
      bin[i >> 5] |= (str.charCodeAt(i / 8) & mask) << (i % 32);
    return bin;
  }
  const utf8 = unescape(encodeURIComponent(input));
  return rstrMD5(utf8);
}

// ─── SHA via Web Crypto API ─────────────────────────────────────────────────

async function shaHash(algorithm: string, text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function shaFileHash(
  algorithm: string,
  buffer: ArrayBuffer
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function md5Buffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const utf8 = unescape(encodeURIComponent(binary));
  return md5(utf8);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

interface HashResult {
  algorithm: string;
  value: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function HashGenerator() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"text" | "file">("text");
  const [inputText, setInputText] = useState("");
  const [hashes, setHashes] = useState<HashResult[]>([]);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const hasInput = useMemo(
    () => (mode === "text" ? inputText.length > 0 : !!fileBuffer),
    [mode, inputText.length, fileBuffer]
  );

  const inputSourceKey = useMemo(
    () => (mode === "text" ? inputText : fileBuffer),
    [mode, inputText, fileBuffer]
  );

  // Compute hashes via effect (only when there is actual input)
  useEffect(() => {
    if (!hasInput || !inputSourceKey) return;

    let cancelled = false;

    async function compute() {
      if (mode === "text" && typeof inputSourceKey === "string") {
        const text = inputSourceKey;
        const [md5Hash, sha1, sha256, sha512] = await Promise.all([
          Promise.resolve(md5(text)),
          shaHash("SHA-1", text),
          shaHash("SHA-256", text),
          shaHash("SHA-512", text),
        ]);
        if (!cancelled) {
          setHashes([
            { algorithm: "MD5", value: md5Hash },
            { algorithm: "SHA-1", value: sha1 },
            { algorithm: "SHA-256", value: sha256 },
            { algorithm: "SHA-512", value: sha512 },
          ]);
        }
      } else if (mode === "file" && inputSourceKey instanceof ArrayBuffer) {
        const buf = inputSourceKey;
        const [md5Hash, sha1, sha256, sha512] = await Promise.all([
          Promise.resolve(md5Buffer(buf)),
          shaFileHash("SHA-1", buf),
          shaFileHash("SHA-256", buf),
          shaFileHash("SHA-512", buf),
        ]);
        if (!cancelled) {
          setHashes([
            { algorithm: "MD5", value: md5Hash },
            { algorithm: "SHA-1", value: sha1 },
            { algorithm: "SHA-256", value: sha256 },
            { algorithm: "SHA-512", value: sha512 },
          ]);
        }
      }
    }

    compute();
    return () => {
      cancelled = true;
    };
  }, [hasInput, inputSourceKey, mode]);

  // Derive displayed hashes: empty when no input
  const displayHashes = hasInput ? hashes : [];

  const processFile = useCallback((file: File) => {
    setFileInfo({ name: file.name, size: file.size, type: file.type });

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        setFileBuffer(reader.result);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleCopy = useCallback(
    async (value: string, index: number) => {
      try {
        await copyToClipboard(value);
        setCopiedIndex(index);
        toast({
          title: "Copied!",
          description: "Hash copied to clipboard.",
        });
        setTimeout(() => setCopiedIndex(null), 2000);
      } catch {
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const inputSize =
    mode === "file" && fileInfo
      ? formatBytes(fileInfo.size)
      : formatBytes(new TextEncoder().encode(inputText).length);

  return (
    <div className="w-full space-y-6">
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as "text" | "file")}
        className="w-full"
      >
        <TabsList className="bg-muted w-full sm:w-auto">
          <TabsTrigger value="text" className="gap-2">
            <FileText className="h-4 w-4" />
            Text
          </TabsTrigger>
          <TabsTrigger value="file" className="gap-2">
            <Upload className="h-4 w-4" />
            File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-4 space-y-4">
          <div className="relative">
            <Textarea
              placeholder="Enter text to hash..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[140px] resize-y font-mono text-sm"
            />
            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
              {inputText.length} chars · {inputSize}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="file" className="mt-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed
              p-8 text-center transition-colors cursor-pointer
              ${
                isDragOver
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }
            `}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) processFile(file);
              };
              input.click();
            }}
            role="button"
            tabIndex={0}
            aria-label="Upload a file to hash"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const input = document.createElement("input");
                input.type = "file";
                input.onchange = (ev) => {
                  const file = (ev.target as HTMLInputElement).files?.[0];
                  if (file) processFile(file);
                };
                input.click();
              }
            }}
          >
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              tabIndex={-1}
              aria-hidden="true"
            />

            <div
              className={`rounded-full p-3 ${
                isDragOver
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Upload className="h-6 w-6" />
            </div>

            {fileInfo ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {fileInfo.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fileInfo.type || "Unknown type"} · {formatBytes(fileInfo.size)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Click or drop to replace
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Drop a file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Any file type is supported
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Hash Results */}
      {displayHashes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span>Input size: {inputSize}</span>
          </div>

          <div className="space-y-2">
            {displayHashes.map((hash, index) => (
              <Card
                key={hash.algorithm}
                className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-colors hover:border-border"
              >
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                  <Badge
                    variant="outline"
                    className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold min-w-[72px] justify-center"
                  >
                    {hash.algorithm}
                  </Badge>

                  <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-muted/50 px-3 py-2 font-mono text-xs leading-relaxed text-foreground/90 scrollbar-thin">
                    {hash.value}
                  </code>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => handleCopy(hash.value, index)}
                    aria-label={`Copy ${hash.algorithm} hash`}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {displayHashes.length === 0 && mode === "text" && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/20 py-12 text-center">
          <Hash className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Start typing to generate hashes in real-time
          </p>
        </div>
      )}
    </div>
  );
}