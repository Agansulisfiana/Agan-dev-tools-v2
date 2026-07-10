"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Terminal, Search, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";

interface CmdEntry {
  cmd: string;
  desc: string;
  category: string;
  os: "linux" | "windows" | "both";
}

const COMMANDS: CmdEntry[] = [
  // Linux File Operations
  { cmd: "ls -la", desc: "List all files with details", category: "File Operations", os: "linux" },
  { cmd: "cd /path/to/dir", desc: "Change directory", category: "File Operations", os: "linux" },
  { cmd: "pwd", desc: "Print working directory", category: "File Operations", os: "linux" },
  { cmd: "cp -r src dest", desc: "Copy files/directories recursively", category: "File Operations", os: "linux" },
  { cmd: "mv src dest", desc: "Move or rename files", category: "File Operations", os: "linux" },
  { cmd: "rm -rf dir", desc: "Remove directory forcefully", category: "File Operations", os: "linux" },
  { cmd: "mkdir -p a/b/c", desc: "Create nested directories", category: "File Operations", os: "linux" },
  { cmd: "find / -name '*.log'", desc: "Find files by name pattern", category: "File Operations", os: "linux" },
  { cmd: "ln -s target link", desc: "Create symbolic link", category: "File Operations", os: "linux" },
  { cmd: "chmod 755 file", desc: "Set file permissions", category: "File Operations", os: "linux" },
  { cmd: "chown user:group file", desc: "Change file ownership", category: "File Operations", os: "linux" },
  { cmd: "du -sh *", desc: "Disk usage summary", category: "File Operations", os: "linux" },
  { cmd: "df -h", desc: "Disk free space", category: "File Operations", os: "linux" },
  { cmd: "touch file.txt", desc: "Create empty file / update timestamp", category: "File Operations", os: "linux" },
  // Linux Text Processing
  { cmd: "grep -rn 'pattern' /path", desc: "Search pattern recursively in files", category: "Text Processing", os: "linux" },
  { cmd: "sed -i 's/old/new/g' file", desc: "Find and replace in file", category: "Text Processing", os: "linux" },
  { cmd: "awk '{print $1}' file.txt", desc: "Process text column-wise", category: "Text Processing", os: "linux" },
  { cmd: "sort file.txt | uniq", desc: "Sort and remove duplicates", category: "Text Processing", os: "linux" },
  { cmd: "wc -l file.txt", desc: "Count lines in file", category: "Text Processing", os: "linux" },
  { cmd: "head -n 20 file.txt", desc: "Show first 20 lines", category: "Text Processing", os: "linux" },
  { cmd: "tail -f /var/log/syslog", desc: "Follow log file in real-time", category: "Text Processing", os: "linux" },
  { cmd: "cat file.txt", desc: "Display file contents", category: "Text Processing", os: "linux" },
  { cmd: "diff file1 file2", desc: "Compare two files", category: "Text Processing", os: "linux" },
  { cmd: "tr 'a-z' 'A-Z' < file", desc: "Translate characters", category: "Text Processing", os: "linux" },
  // Linux Network
  { cmd: "curl -X GET https://api.example.com", desc: "HTTP request", category: "Network", os: "linux" },
  { cmd: "wget https://example.com/file.zip", desc: "Download file", category: "Network", os: "linux" },
  { cmd: "scp file user@host:/path", desc: "Copy file over SSH", category: "Network", os: "linux" },
  { cmd: "ssh user@host", desc: "Connect via SSH", category: "Network", os: "linux" },
  { cmd: "netstat -tlnp", desc: "Show listening ports", category: "Network", os: "linux" },
  { cmd: "ss -tlnp", desc: "Socket statistics (modern netstat)", category: "Network", os: "linux" },
  { cmd: "ip addr show", desc: "Show network interfaces", category: "Network", os: "linux" },
  { cmd: "ping -c 4 google.com", desc: "Ping host 4 times", category: "Network", os: "linux" },
  { cmd: "nslookup example.com", desc: "DNS lookup", category: "Network", os: "linux" },
  { cmd: "dig example.com", desc: "DNS lookup (detailed)", category: "Network", os: "linux" },
  { cmd: "traceroute google.com", desc: "Trace packet route", category: "Network", os: "linux" },
  // Linux Process
  { cmd: "ps aux", desc: "List all running processes", category: "Process Management", os: "linux" },
  { cmd: "top", desc: "Interactive process monitor", category: "Process Management", os: "linux" },
  { cmd: "htop", desc: "Enhanced process monitor", category: "Process Management", os: "linux" },
  { cmd: "kill -9 PID", desc: "Force kill process", category: "Process Management", os: "linux" },
  { cmd: "bg / fg", desc: "Background / foreground job", category: "Process Management", os: "linux" },
  { cmd: "nohup cmd &", desc: "Run command immune to hangups", category: "Process Management", os: "linux" },
  { cmd: "systemctl status nginx", desc: "Check service status", category: "Process Management", os: "linux" },
  { cmd: "journalctl -u nginx -f", desc: "Follow service logs", category: "Process Management", os: "linux" },
  // Linux Archive
  { cmd: "tar -czf archive.tar.gz dir/", desc: "Create gzipped tar archive", category: "Archives", os: "linux" },
  { cmd: "tar -xzf archive.tar.gz", desc: "Extract gzipped tar archive", category: "Archives", os: "linux" },
  { cmd: "zip -r archive.zip dir/", desc: "Create zip archive", category: "Archives", os: "linux" },
  { cmd: "unzip archive.zip", desc: "Extract zip archive", category: "Archives", os: "linux" },
  // Windows Commands
  { cmd: "dir", desc: "List directory contents", category: "File Operations", os: "windows" },
  { cmd: "cd /d C:\\path", desc: "Change drive and directory", category: "File Operations", os: "windows" },
  { cmd: "copy source dest", desc: "Copy file", category: "File Operations", os: "windows" },
  { cmd: "xcopy /E /I src dest", desc: "Copy directory recursively", category: "File Operations", os: "windows" },
  { cmd: "robocopy src dest /E", desc: "Robust file copy", category: "File Operations", os: "windows" },
  { cmd: "move src dest", desc: "Move / rename file", category: "File Operations", os: "windows" },
  { cmd: "del /F /Q file", desc: "Force delete file", category: "File Operations", os: "windows" },
  { cmd: "rmdir /S /Q dir", desc: "Remove directory recursively", category: "File Operations", os: "windows" },
  { cmd: "mkdir dir", desc: "Create directory", category: "File Operations", os: "windows" },
  { cmd: "type file.txt", desc: "Display file contents", category: "Text Processing", os: "windows" },
  { cmd: "findstr /S /I 'pattern' *.txt", desc: "Search string in files", category: "Text Processing", os: "windows" },
  { cmd: "ipconfig /all", desc: "Show network configuration", category: "Network", os: "windows" },
  { cmd: "ping -n 4 google.com", desc: "Ping host", category: "Network", os: "windows" },
  { cmd: "netstat -ano", desc: "Show all connections with PID", category: "Network", os: "windows" },
  { cmd: "tasklist", desc: "List running processes", category: "Process Management", os: "windows" },
  { cmd: "taskkill /F /PID 1234", desc: "Force kill process by PID", category: "Process Management", os: "windows" },
  { cmd: "systeminfo", desc: "System information", category: "System", os: "windows" },
  { cmd: "whoami", desc: "Show current user", category: "System", os: "windows" },
  { cmd: "echo %PATH%", desc: "Show environment variable", category: "System", os: "windows" },
  { cmd: "set VAR=value", desc: "Set environment variable", category: "System", os: "windows" },
  { cmd: "PowerShell -Command 'Get-Process'", desc: "Run PowerShell command", category: "System", os: "windows" },
];

const OS_FILTERS = [
  { value: "all", label: "All" },
  { value: "linux", label: "Linux" },
  { value: "windows", label: "Windows" },
] as const;

export default function CommandCheatsheet() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [osFilter, setOsFilter] = useState<string>("all");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = COMMANDS;
    if (osFilter !== "all") {
      result = result.filter((c) => c.os === osFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.cmd.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, osFilter]);

  const categories = useMemo(() => {
    const cats = new Set(filtered.map((c) => c.category));
    return Array.from(cats);
  }, [filtered]);

  const copy = async (cmd: string) => {
    await copyToClipboard(cmd);
    setCopied(cmd);
    toast({ title: "Copied", description: "Command copied to clipboard." });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Terminal className="h-5 w-5 text-primary" />
            Command Cheatsheet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {OS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setOsFilter(f.value)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  osFilter === f.value
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} commands found</p>
        </CardContent>
      </Card>

      {categories.map((cat) => (
        <Card key={cat} className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{cat}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {filtered
              .filter((c) => c.category === cat)
              .map((entry) => (
                <div
                  key={entry.cmd}
                  className="group flex items-center justify-between gap-3 rounded-md border border-border/30 bg-muted/10 px-3 py-2.5 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <code className="text-sm font-mono text-foreground">{entry.cmd}</code>
                    <p className="mt-0.5 text-xs text-muted-foreground">{entry.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      {entry.os}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => copy(entry.cmd)}
                    >
                      {copied === entry.cmd ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}