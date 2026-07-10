"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlaskConical, Send, Clock, Copy, Check, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";

interface HeaderRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const STATUS_COLORS: Record<string, string> = {
  "2": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "3": "text-amber-400 bg-amber-500/10 border-amber-500/30",
  "4": "text-orange-400 bg-orange-500/10 border-orange-500/30",
  "5": "text-red-400 bg-red-500/10 border-red-500/30",
};

export default function HttpRequestTester() {
  const { toast } = useToast();
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [headers, setHeaders] = useState<HeaderRow[]>([
    { id: "1", key: "Content-Type", value: "application/json", enabled: true },
    { id: "2", key: "Accept", value: "*/*", enabled: true },
  ]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    time: number;
    size: number;
    headers: Record<string, string>;
    body: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("body");

  const updateHeader = (id: string, field: "key" | "value" | "enabled", val: string | boolean) => {
    setHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: val } : h)));
  };

  const addHeader = () => {
    setHeaders((prev) => [...prev, { id: Date.now().toString(), key: "", value: "", enabled: true }]);
  };

  const removeHeader = (id: string) => {
    setHeaders((prev) => prev.filter((h) => h.id !== id));
  };

  const sendRequest = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setResponse(null);

    try {
      const start = performance.now();
      const headerObj: Record<string, string> = {};
      headers.filter((h) => h.enabled && h.key).forEach((h) => {
        headerObj[h.key] = h.value;
      });

      const fetchOpts: RequestInit = {
        method,
        headers: headerObj,
      };

      if (!["GET", "HEAD"].includes(method) && body) {
        fetchOpts.body = body;
      }

      const res = await fetch(url, fetchOpts);
      const elapsed = Math.round(performance.now() - start);
      const resBody = await res.text();
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });

      setResponse({
        status: res.status,
        statusText: res.statusText,
        time: elapsed,
        size: new Blob([resBody]).size,
        headers: resHeaders,
        body: resBody,
      });
    } catch (err) {
      setResponse({
        status: 0,
        statusText: err instanceof Error ? err.message : "Request failed",
        time: 0,
        size: 0,
        headers: {},
        body: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, [url, method, headers, body]);

  const statusColor = response ? STATUS_COLORS[String(response.status)[0]] || "" : "";
  const isJson = response?.body?.trim().startsWith("{") || response?.body?.trim().startsWith("[");

  return (
    <div className="space-y-6">
      {/* Request */}
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <FlaskConical className="h-5 w-5 text-primary" />
            HTTP Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Bar */}
          <div className="flex gap-2">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-32 font-mono font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m} className="font-mono font-bold">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="font-mono flex-1"
              onKeyDown={(e) => e.key === "Enter" && sendRequest()}
            />
            <Button onClick={sendRequest} disabled={loading || !url}>
              {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>

          {/* Headers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Headers</Label>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addHeader}>
                <Plus className="mr-1 h-3 w-3" /> Add
              </Button>
            </div>
            <div className="space-y-1.5">
              {headers.map((h) => (
                <div key={h.id} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={h.enabled}
                    onChange={(e) => updateHeader(h.id, "enabled", e.target.checked)}
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                  <Input
                    value={h.key}
                    onChange={(e) => updateHeader(h.id, "key", e.target.value)}
                    placeholder="Header name"
                    className="font-mono text-xs h-8"
                  />
                  <Input
                    value={h.value}
                    onChange={(e) => updateHeader(h.id, "value", e.target.value)}
                    placeholder="Value"
                    className="font-mono text-xs h-8"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeHeader(h.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          {!["GET", "HEAD"].includes(method) && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Request Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Response</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`font-mono text-xs ${statusColor}`}>
                  {response.status} {response.statusText}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="mr-1 h-3 w-3" />
                  {response.time}ms
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {(response.size / 1024).toFixed(1)} KB
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">Headers ({Object.keys(response.headers).length})</TabsTrigger>
              </TabsList>
              <TabsContent value="body" className="mt-3">
                <div className="relative">
                  <pre className="max-h-[500px] overflow-auto rounded-md border border-border/50 bg-muted/30 p-4 font-mono text-sm whitespace-pre-wrap break-words">
                    {isJson ? (
                      <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(response.body) }} />
                    ) : (
                      response.body
                    )}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={() => {
                      copyToClipboard(response.body);
                      toast({ title: "Copied" });
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="headers" className="mt-3">
                <div className="max-h-[300px] overflow-auto rounded-md border border-border/50 bg-muted/30 p-2">
                  {Object.entries(response.headers).map(([k, v]) => (
                    <div key={k} className="flex gap-3 px-2 py-1.5 text-xs hover:bg-muted/60 rounded">
                      <code className="shrink-0 font-medium text-primary">{k}:</code>
                      <code className="text-muted-foreground">{v}</code>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let color = "text-amber-400";
        if (/^"/.test(match)) {
          color = /:$/.test(match) ? "text-emerald-400 font-semibold" : "text-emerald-400";
        } else if (/true|false/.test(match)) {
          color = "text-purple-400";
        } else if (/null/.test(match)) {
          color = "text-rose-400";
        }
        return `<span class="${color}">${match}</span>`;
      }
    );
}