"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, FileCheck, Hash, Copy, Check, Trash2, ShieldCheck, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";

interface HashResult {
  algorithm: string;
  hash: string;
}

async function computeFileHash(
  file: File,
  algorithm: string
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function computeMD5(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  function safeAdd(x: number, y: number) { const lsw = (x & 0xffff) + (y & 0xffff); const msw = (x >> 16) + (y >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xffff); }
  function bitRotateLeft(num: number, cnt: number) { return (num << cnt) | (num >>> (32 - cnt)); }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }

  const len = uint8.length * 8;
  const words: number[] = [];
  for (let i = 0; i < uint8.length; i += 4) {
    words.push(
      uint8[i] || 0,
      (uint8[i + 1] || 0) << 8,
      (uint8[i + 2] || 0) << 16,
      (uint8[i + 3] || 0) << 24
    );
  }
  words[len >> 5] |= 0x80 << (len % 32);
  words[((len + 64) >>> 9 << 4) + 14] = len;

  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;

  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const T = [
    -680876936,-389564586,606105819,-1044525330,-176418897,1200080426,-1473231341,-45705983,
    1770035416,-1958414417,-42063,-1990404162,1804603682,-40341101,-1502002290,1236535329,
    -165796510,-1069501632,643717713,-373897302,-701558691,38016083,-660478335,-405537848,
    568446438,-1019803690,-187363961,1163531501,-1444681467,-51403784,1735328473,-1926607734,
    -378558,-2022574463,1839030562,-35309556,-1530992060,1272893353,-155497632,-1094730640,
    681279174,-358537222,-722521979,76029189,-640364487,-421815835,530742520,-995338651,
    -198630844,1126891415,-1416354905,-57434055,1700485571,-1894986606,-1051523,-2054922799,
    1873313359,-30611744,-1560198380,1309151649,-145523070,-1120210379,718787259,-343485551
  ];

  for (let i = 0; i < words.length; i += 16) {
    const oa = a, ob = b, oc = c, od = d;
    for (let j = 0; j < 64; j++) {
      const k = i + [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,1,6,11,0,5,10,15,4,9,14,3,8,13,2,7,12,5,8,11,14,1,4,7,10,13,0,3,6,9,12,15,2,0,7,14,5,12,3,10,1,8,15,6,13,4,11,2,9][j];
      let f: number, g: number;
      if (j < 16) { f = (b & c) | (~b & d); g = j; }
      else if (j < 32) { f = (d & b) | (c & ~d); g = (5 * j + 1) % 16; }
      else if (j < 48) { f = b ^ c ^ d; g = (3 * j + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * j) % 16; }
      f = safeAdd(f, a);
      f = safeAdd(f, words[k] || 0);
      f = safeAdd(f, T[j]);
      const rotated = bitRotateLeft(f, S[j]);
      a = d; d = c; c = b;
      b = safeAdd(b, rotated);
    }
    a = safeAdd(a, oa); b = safeAdd(b, ob); c = safeAdd(c, oc); d = safeAdd(d, od);
  }

  return [a, b, c, d].map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

export default function FileHashChecker() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<HashResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState<"match" | "mismatch" | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const computeHashes = useCallback(async (f: File) => {
    setLoading(true);
    try {
      const [sha1, sha256, sha512, md5] = await Promise.all([
        computeFileHash(f, "SHA-1"),
        computeFileHash(f, "SHA-256"),
        computeFileHash(f, "SHA-512"),
        computeMD5(f),
      ]);
      setHashes([
        { algorithm: "MD5", hash: md5 },
        { algorithm: "SHA-1", hash: sha1 },
        { algorithm: "SHA-256", hash: sha256 },
        { algorithm: "SHA-512", hash: sha512 },
      ]);
    } catch (err) {
      toast({ title: "Error", description: "Failed to compute hashes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleFile = (f: File) => {
    setFile(f);
    setHashes([]);
    setVerifyHash("");
    setVerifyResult(null);
    computeHashes(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const copy = async (hash: string, algo: string) => {
    await copyToClipboard(hash);
    setCopied(algo);
    toast({ title: "Copied", description: `${algo} hash copied.` });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleVerify = () => {
    if (!verifyHash.trim()) { setVerifyResult(null); return; }
    const normalized = verifyHash.trim().toLowerCase();
    const match = hashes.some((h) => h.hash.toLowerCase() === normalized);
    setVerifyResult(match ? "match" : "mismatch");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* File Input */}
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileCheck className="h-5 w-5 text-primary" />
            File Hash Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <Upload className={`h-10 w-10 ${dragOver ? "text-primary" : "text-muted-foreground/50"}`} />
            <div className="text-center">
              <p className="text-sm font-medium">Drop a file here or click to browse</p>
              <p className="mt-1 text-xs text-muted-foreground">All processing is done locally in your browser</p>
            </div>
          </div>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {file && (
            <div className="flex items-center justify-between rounded-md border border-border/40 bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.size)} &middot; {file.type || "unknown type"}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setHashes([]); setVerifyResult(null); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading && (
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="flex items-center justify-center gap-3 p-8">
            <Hash className="h-5 w-5 animate-pulse text-primary" />
            <span className="text-sm text-muted-foreground">Computing hashes...</span>
          </CardContent>
        </Card>
      )}

      {!loading && hashes.length > 0 && (
        <>
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Computed Hashes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hashes.map((h) => (
                <div key={h.algorithm} className="flex items-center justify-between gap-3 rounded-md border border-border/30 bg-muted/20 px-3 py-2.5">
                  <Badge variant="outline" className="shrink-0 font-mono text-xs">{h.algorithm}</Badge>
                  <code className="flex-1 truncate font-mono text-xs text-foreground/80">{h.hash}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copy(h.hash, h.algorithm)}>
                    {copied === h.algorithm ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Verify */}
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Verify Hash</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={verifyHash}
                  onChange={(e) => { setVerifyHash(e.target.value); setVerifyResult(null); }}
                  placeholder="Paste expected hash to verify..."
                  className="font-mono text-sm flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
                <Button onClick={handleVerify} variant="outline">Verify</Button>
              </div>
              {verifyResult && (
                <div className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
                  verifyResult === "match"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}>
                  {verifyResult === "match" ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
                  {verifyResult === "match" ? "Hash matches! File integrity verified." : "Hash does NOT match. File may be corrupted or modified."}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}