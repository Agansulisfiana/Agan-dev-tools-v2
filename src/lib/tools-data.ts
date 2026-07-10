import {
  Braces,
  KeyRound,
  Hash,
  Lock,
  Globe,
  FileText,
  QrCode,
  ScanBarcode,
  Palette,
  Clock,
  Regex,
  Terminal,
  Diff,
  FolderSearch,
  Ruler,
  Network,
  Server,
  FlaskConical,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";

export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  keywords: string[];
}

export interface ToolCategory {
  id: string;
  name: string;
  tools: ToolInfo[];
}

export const categories: ToolCategory[] = [
  {
    id: "encoders",
    name: "Encoders & Decoders",
    tools: [
      {
        id: "json-formatter",
        name: "JSON Formatter",
        description: "Format, validate, and beautify JSON data with syntax highlighting",
        icon: Braces,
        category: "encoders",
        keywords: ["json", "format", "beautify", "validate", "pretty print"],
      },
      {
        id: "base64",
        name: "Base64 Codec",
        description: "Encode and decode Base64 strings and files",
        icon: FileText,
        category: "encoders",
        keywords: ["base64", "encode", "decode", "binary", "ascii"],
      },
      {
        id: "url-encoder",
        name: "URL Encoder",
        description: "Encode and decode URL components and query parameters",
        icon: Globe,
        category: "encoders",
        keywords: ["url", "encode", "decode", "percent", "uri", "query"],
      },
      {
        id: "jwt-decoder",
        name: "JWT Decoder",
        description: "Decode and inspect JSON Web Tokens with header and payload",
        icon: KeyRound,
        category: "encoders",
        keywords: ["jwt", "token", "decode", "json web token", "header", "payload"],
      },
    ],
  },
  {
    id: "generators",
    name: "Generators",
    tools: [
      {
        id: "password-generator",
        name: "Password Generator",
        description: "Generate strong, customizable passwords with various options",
        icon: Lock,
        category: "generators",
        keywords: ["password", "generate", "strong", "random", "secure"],
      },
      {
        id: "hash-generator",
        name: "Hash Generator",
        description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes",
        icon: Hash,
        category: "generators",
        keywords: ["hash", "md5", "sha1", "sha256", "sha512", "checksum"],
      },
      {
        id: "uuid-generator",
        name: "UUID Generator",
        description: "Generate UUID v4 and v7 unique identifiers in bulk",
        icon: Fingerprint,
        category: "generators",
        keywords: ["uuid", "guid", "unique", "id", "random", "v4", "v7"],
      },
      {
        id: "qr-generator",
        name: "QR Code Generator",
        description: "Generate QR codes from text, URLs, or any data",
        icon: QrCode,
        category: "generators",
        keywords: ["qr", "qrcode", "qr code", "generate", "scan"],
      },
      {
        id: "barcode-generator",
        name: "Barcode Generator",
        description: "Generate CODE128, EAN, UPC, and other barcode formats",
        icon: ScanBarcode,
        category: "generators",
        keywords: ["barcode", "code128", "ean", "upc", "generate"],
      },
    ],
  },
  {
    id: "converters",
    name: "Converters",
    tools: [
      {
        id: "color-picker",
        name: "Color Picker",
        description: "Convert colors between HEX, RGB, HSL, and other formats",
        icon: Palette,
        category: "converters",
        keywords: ["color", "hex", "rgb", "hsl", "picker", "converter"],
      },
      {
        id: "timestamp-converter",
        name: "Timestamp Converter",
        description: "Convert between Unix timestamps, ISO 8601, and human dates",
        icon: Clock,
        category: "converters",
        keywords: ["timestamp", "unix", "epoch", "date", "time", "iso", "convert"],
      },
      {
        id: "unit-converter",
        name: "Unit Converter",
        description: "Convert between various units of measurement",
        icon: Ruler,
        category: "converters",
        keywords: ["unit", "convert", "measurement", "length", "weight", "temperature"],
      },
    ],
  },
  {
    id: "text",
    name: "Text & Code",
    tools: [
      {
        id: "regex-tester",
        name: "Regex Tester",
        description: "Test and debug regular expressions with real-time matching",
        icon: Regex,
        category: "text",
        keywords: ["regex", "regexp", "regular expression", "test", "match", "pattern"],
      },
      {
        id: "diff-compare",
        name: "Diff Compare",
        description: "Compare two texts and highlight differences side by side",
        icon: Diff,
        category: "text",
        keywords: ["diff", "compare", "difference", "text", "side by side"],
      },
      {
        id: "cron-generator",
        name: "Cron Generator",
        description: "Build and explain cron expressions with a visual editor",
        icon: Clock,
        category: "text",
        keywords: ["cron", "schedule", "expression", "job", "timer", "crontab"],
      },
    ],
  },
  {
    id: "network",
    name: "Network & Web",
    tools: [
      {
        id: "http-tester",
        name: "HTTP Request Tester",
        description: "Test HTTP/HTTPS requests with custom headers and body",
        icon: FlaskConical,
        category: "network",
        keywords: ["http", "request", "api", "rest", "get", "post", "test"],
      },
      {
        id: "network-tools",
        name: "Network Calculator",
        description: "IP address, CIDR, and subnet calculator tools",
        icon: Network,
        category: "network",
        keywords: ["ip", "cidr", "subnet", "network", "mask", "calculator"],
      },
    ],
  },
  {
    id: "sysadmin",
    name: "Sysadmin & Utils",
    tools: [
      {
        id: "command-cheatsheet",
        name: "Command Cheatsheet",
        description: "Quick reference for Linux and Windows command line",
        icon: Terminal,
        category: "sysadmin",
        keywords: ["command", "linux", "windows", "cli", "terminal", "cheatsheet"],
      },
      {
        id: "file-hash",
        name: "File Hash Checker",
        description: "Calculate and verify file checksums (MD5, SHA, etc.)",
        icon: FolderSearch,
        category: "sysadmin",
        keywords: ["file", "hash", "checksum", "verify", "integrity", "md5", "sha"],
      },
    ],
  },
];

export const allTools: ToolInfo[] = categories.flatMap((c) => c.tools);

export function getToolById(id: string): ToolInfo | undefined {
  return allTools.find((t) => t.id === id);
}

export function searchTools(query: string): ToolInfo[] {
  const q = query.toLowerCase().trim();
  if (!q) return allTools;
  return allTools.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.includes(q))
  );
}