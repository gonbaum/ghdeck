import "dotenv/config";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { render, Box, Text, useInput, useApp, useStdout } from "ink";
import { Octokit } from "@octokit/rest";
import { execSync } from "child_process";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

const GITHUB_USERNAME = process.env.GITHUB_USER ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

type Repo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  stargazers_count: number;
  pushed_at: string | null;
  description: string | null;
  language: string | null;
  html_url: string;
  clone_url: string;
  ssh_url: string;
};

type Screen = "list" | "detail" | "confirm" | "rename" | "clone" | "create";

// Header layout constants
// Logo: 6 lines · border: 2 lines = 8 lines (FIXED — never changes)
const HEADER_LINES = 8;
// Hints bar: 1 line
const HINTS_LINES = 1;
// List box borders: top + bottom = 2 lines
const LIST_BORDER_LINES = 2;
// Scroll indicators (reserved even when not shown, keeps height stable)
const INDICATOR_LINES = 2;
const OVERHEAD = HEADER_LINES + HINTS_LINES + LIST_BORDER_LINES + INDICATOR_LINES; // 13

// Width of the compact list pane in the split-view layout
const LIST_SPLIT_WIDTH = 32;

function timeAgo(date: string | null): string {
  if (!date) return "never";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function copyToClipboard(text: string): void {
  const platform = process.platform;
  if (platform === "darwin") {
    execSync("pbcopy", { input: text });
  } else if (platform === "win32") {
    execSync("clip", { input: text });
  } else {
    try {
      execSync("xclip -selection clipboard", { input: text });
    } catch {
      execSync("xsel --clipboard --input", { input: text });
    }
  }
}

function stripMarkdown(md: string): string {
  return (
    md
      .replace(/```[^\n]*\n([\s\S]*?)```/g, (_, code) => code.trim())
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/^\|.*\|$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim()
  );
}

type MdNode = {
  type: string;
  children?: MdNode[];
  value?: string;
  depth?: number;
  url?: string;
  ordered?: boolean;
  lang?: string;
};

const mdParser = unified().use(remarkParse).use(remarkGfm);

function collectText(node: MdNode): string {
  if (node.type === "html") return "";
  if (node.value) return node.value;
  return (node.children ?? []).map(collectText).join("");
}

function MarkdownRenderer({ content, width, scroll, height }: { content: string; width: number; scroll: number; height: number }) {
  const tree = mdParser.parse(content) as unknown as MdNode;
  const lines: React.ReactNode[] = [];
  flattenMdNode(tree, width, lines, 0);
  const totalLines = lines.length;
  const maxScroll = Math.max(0, totalLines - height);
  const clampedScroll = Math.min(scroll, maxScroll);
  const visible = lines.slice(clampedScroll, clampedScroll + height);
  return (
    <Box flexDirection="column" width={width}>
      {visible.map((line, i) => (
        <Box key={clampedScroll + i} width={width}>{line}</Box>
      ))}
    </Box>
  );
}

function flattenMdNode(node: MdNode, width: number, lines: React.ReactNode[], indent: number): void {
  switch (node.type) {
    case "root":
      for (const child of node.children ?? []) {
        flattenMdNode(child, width, lines, indent);
      }
      break;
    case "heading": {
      const color = node.depth === 1 ? "cyan" : node.depth === 2 ? "magenta" : undefined;
      const text = collectText(node);
      lines.push(<Text bold color={color} wrap="truncate">{text}</Text>);
      lines.push(<Text> </Text>);
      break;
    }
    case "paragraph": {
      const text = collectText(node);
      const maxW = width - indent;
      const wrapped = wrapText(text, maxW);
      for (const wl of wrapped) {
        lines.push(<Text wrap="truncate">{wl}</Text>);
      }
      lines.push(<Text> </Text>);
      break;
    }
    case "list":
      for (const child of node.children ?? []) {
        flattenMdNode(child, width, lines, indent);
      }
      lines.push(<Text> </Text>);
      break;
    case "listItem":
      for (let ci = 0; ci < (node.children ?? []).length; ci++) {
        const child = node.children![ci];
        if (child.type === "paragraph") {
          const text = collectText(child);
          const maxW = width - indent - 2;
          const wrapped = wrapText(text, maxW);
          for (let wi = 0; wi < wrapped.length; wi++) {
            const prefix = wi === 0 ? "• " : "  ";
            lines.push(<Text wrap="truncate">{prefix}{wrapped[wi]}</Text>);
          }
        } else {
          flattenMdNode(child, width, lines, indent + 2);
        }
      }
      break;
    case "blockquote":
      for (const child of node.children ?? []) {
        if (child.type === "paragraph") {
          const text = collectText(child);
          const maxW = width - indent - 2;
          const wrapped = wrapText(text, maxW);
          for (const wl of wrapped) {
            lines.push(<Text dimColor wrap="truncate">│ {wl}</Text>);
          }
        } else {
          flattenMdNode(child, width, lines, indent + 2);
        }
      }
      lines.push(<Text> </Text>);
      break;
    case "code": {
      const codeLines = (node.value ?? "").split("\n");
      for (const cl of codeLines) {
        lines.push(<Text color="yellow" wrap="truncate">{cl}</Text>);
      }
      lines.push(<Text> </Text>);
      break;
    }
    case "thematicBreak":
      lines.push(<Text dimColor>{"─".repeat(Math.min(width, 40))}</Text>);
      lines.push(<Text> </Text>);
      break;
    case "table":
      for (const row of node.children ?? []) {
        const cells = (row.children ?? []).map((cell) => collectText(cell));
        lines.push(<Text wrap="truncate">{cells.join(" │ ")}</Text>);
      }
      lines.push(<Text> </Text>);
      break;
    case "html":
      break;
    default:
      if (node.children) {
        for (const child of node.children) {
          flattenMdNode(child, width, lines, indent);
        }
      } else if (node.value) {
        lines.push(<Text wrap="truncate">{node.value}</Text>);
      }
      break;
  }
}

function wrapText(text: string, width: number): string[] {
  if (width <= 0) return [text];
  const result: string[] = [];
  const words = text.split(/\s+/);
  let line = "";
  for (const word of words) {
    if (!word) continue;
    if (line.length === 0) {
      line = word;
    } else if (line.length + 1 + word.length <= width) {
      line += " " + word;
    } else {
      result.push(line);
      line = word;
    }
  }
  if (line) result.push(line);
  if (result.length === 0) result.push("");
  return result;
}

// ── LAZYGH logo — 6 lines, cyan → green gradient ──────────────
// Memoized: never re-renders (no props, no deps)
const Logo = React.memo(function Logo() {
  return (
    <Box flexDirection="column">
      <Text color="cyanBright" bold>{"██╗      █████╗ ███████╗██╗   ██╗ ██████╗ ██╗  ██╗"}</Text>
      <Text color="cyan"       bold>{"██║     ██╔══██╗╚══███╔╝╚██╗ ██╔╝██╔════╝ ██║  ██║"}</Text>
      <Text color="cyan"       bold>{"██║     ███████║  ███╔╝  ╚████╔╝ ██║  ███╗███████║"}</Text>
      <Text color="green"      bold>{"██║     ██╔══██║ ███╔╝    ╚██╔╝  ██║   ██║██╔══██║"}</Text>
      <Text color="green"      bold>{"███████╗██║  ██║███████╗   ██║   ╚██████╔╝██║  ██║"}</Text>
      <Text color="greenBright" bold>{"╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝"}</Text>
    </Box>
  );
});

// ── k9s-style key hint badge ──────────────────────────────────
// Map verbose key names to readable symbols
const KEY_SYMBOL: Record<string, string> = {
  enter: "↵",
  esc:   "⎋",
  backspace: "⌫",
  space: "␣",
};

const Hint = React.memo(function Hint({ keys, action }: { keys: string; action: string }) {
  const label = KEY_SYMBOL[keys] ?? keys;
  return (
    <Box marginRight={2}>
      <Text backgroundColor="cyan" color="black">{` ${label} `}</Text>
      <Text color="magenta"> {action}</Text>
    </Box>
  );
});

// ── Memoized repo row — only re-renders when its own props change ──
// With 20 visible rows and 2 changing per keypress, this skips 18 reconciliations.
const RepoRow = React.memo(function RepoRow({
  repo, isCursor, isSelected, compact = false,
}: {
  repo: Repo;
  isCursor: boolean;
  isSelected: boolean;
  compact?: boolean;
}) {
  const nameWidth = compact ? 20 : 36;
  return (
    <Box gap={1} paddingX={1}>
      <Text color={isSelected ? "red" : undefined}>{isSelected ? "◆" : " "}</Text>
      <Text color={isCursor ? "cyan" : undefined} bold={isCursor} inverse={isCursor}>
        {truncate(repo.name, nameWidth).padEnd(nameWidth)}
      </Text>
      <Text color={repo.private ? "yellow" : "green"} bold>
        {compact
          ? repo.private ? "⊘" : "◉"
          : repo.private ? "⊘ priv " : "◉ pub  "}
      </Text>
      {!compact && (
        <>
          <Text color="magenta">
            {(repo.language ? truncate(repo.language, 11) : "").padEnd(11)}
          </Text>
          <Text dimColor>{timeAgo(repo.pushed_at)}</Text>
        </>
      )}
    </Box>
  );
});

function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nav, setNav] = useState({ cursor: 0, scrollOffset: 0 });
  const { cursor, scrollOffset } = nav;
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [screen, setScreen] = useState<Screen>("list");
  const [deleted, setDeleted] = useState<string[]>([]);
  const [renameValue, setRenameValue] = useState("");
  const [createName, setCreateName] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [readmeScroll, setReadmeScroll] = useState(0);
  const [focusPane, setFocusPane] = useState<"list" | "readme">("list");

  const terminalHeight = stdout?.rows ?? 24;
  const terminalWidth = stdout?.columns ?? 80;
  // How many repo rows fit in the remaining space after fixed chrome
  const visibleCount = Math.max(3, terminalHeight - OVERHEAD);

  // ── README split-pane state ──
  const readmeCache = useRef<Map<number, string>>(new Map());
  const readmeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [readme, setReadme] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);

  // On terminal resize, clamp scrollOffset so cursor stays visible
  useEffect(() => {
    setNav((prev) => {
      let { scrollOffset } = prev;
      if (prev.cursor < scrollOffset) scrollOffset = prev.cursor;
      else if (prev.cursor >= scrollOffset + visibleCount) scrollOffset = prev.cursor - visibleCount + 1;
      return scrollOffset === prev.scrollOffset ? prev : { ...prev, scrollOffset };
    });
  }, [visibleCount]);

  useEffect(() => {
    setReadmeScroll(0);
  }, [cursor]);

  // Single atomic nav update — one setState, one render, no jitter.
  // useCallback keeps the reference stable so useInput doesn't re-subscribe every render.
  const moveCursor = useCallback((delta: number) => {
    setNav((prev) => {
      const cursor = Math.max(0, Math.min(repos.length - 1, prev.cursor + delta));
      let scrollOffset = prev.scrollOffset;
      if (cursor < scrollOffset) scrollOffset = cursor;
      else if (cursor >= scrollOffset + visibleCount) scrollOffset = cursor - visibleCount + 1;
      return { cursor, scrollOffset };
    });
  }, [repos.length, visibleCount]);

  useEffect(() => {
    octokit
      .paginate(octokit.repos.listForUser, {
        username: GITHUB_USERNAME,
        per_page: 100,
        sort: "pushed",
      })
      .then((data) => {
        setRepos(data as Repo[]);
        setLoading(false);
      })
      .catch((e: any) => {
        setLoading(false);
        setNotification(`✗ ${e.message}`);
      });
  }, []);

  useEffect(() => {
    if (screen !== "list") return;
    const repo = repos[cursor];
    if (!repo) return;

    if (readmeTimer.current) clearTimeout(readmeTimer.current);

    if (readmeCache.current.has(repo.id)) {
      setReadme(readmeCache.current.get(repo.id)!);
      setReadmeLoading(false);
      return;
    }

    setReadmeLoading(true);
    setReadme(null);

    readmeTimer.current = setTimeout(async () => {
      try {
        const { data } = await octokit.repos.getReadme({
          owner: GITHUB_USERNAME,
          repo: repo.name,
        });
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        readmeCache.current.set(repo.id, content);
        setReadme(content);
      } catch {
        readmeCache.current.set(repo.id, "");
        setReadme("");
      }
      setReadmeLoading(false);
    }, 200);
  }, [cursor, repos, screen]);

  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  }

  useInput((input, key) => {
    if (screen === "list") {
      if (key.tab) {
        setFocusPane((p) => (p === "list" ? "readme" : "list"));
        return;
      }
      if (focusPane === "list") {
        if (key.upArrow || input === "k") moveCursor(-1);
        if (key.downArrow || input === "j") moveCursor(1);
        if (input === " " || key.return) setScreen("detail");
        if (input === "s") toggleSelected(cursor);
        if (input === "r" && repos[cursor]) {
          setRenameValue(repos[cursor].name);
          setScreen("rename");
        }
        if (input === "v" && repos[cursor] && !updating) handleToggleVisibility();
        if (input === "c" && repos[cursor]) setScreen("clone");
        if (input === "n") { setCreateName(""); setScreen("create"); }
        if (input === "d" && selected.size > 0) setScreen("confirm");
      }
      if (focusPane === "readme") {
        if (key.upArrow || input === "k") setReadmeScroll((s) => Math.max(0, s - 1));
        if (key.downArrow || input === "j") setReadmeScroll((s) => s + 1);
        if (key.pageDown) setReadmeScroll((s) => s + 10);
        if (key.pageUp) setReadmeScroll((s) => Math.max(0, s - 10));
      }
      if (input === "q") exit();
    }

    if (screen === "detail") {
      if (key.escape || key.leftArrow) setScreen("list");
      if (input === "s") { toggleSelected(cursor); setScreen("list"); }
      if (input === "r" && repos[cursor]) {
        setRenameValue(repos[cursor].name);
        setScreen("rename");
      }
      if (input === "v" && repos[cursor] && !updating) handleToggleVisibility();
      if (input === "c" && repos[cursor]) setScreen("clone");
      if (input === "q") exit();
    }

    if (screen === "confirm") {
      if (input === "y" || input === "Y") handleDelete();
      if (input === "n" || input === "N" || key.escape) setScreen("list");
    }

    if (screen === "rename") {
      if (key.escape) { setScreen("list"); return; }
      if (key.return) { handleRename(); return; }
      if (key.backspace || key.delete) { setRenameValue((v) => v.slice(0, -1)); return; }
      if (input && !key.ctrl && !key.meta && input.length === 1)
        setRenameValue((v) => v + input);
    }

    if (screen === "create") {
      if (key.escape) { setScreen("list"); return; }
      if (key.return) { handleCreate(); return; }
      if (key.backspace || key.delete) { setCreateName((v) => v.slice(0, -1)); return; }
      if (input && !key.ctrl && !key.meta && input.length === 1) setCreateName((v) => v + input);
    }

    if (screen === "clone") {
      if (key.escape) setScreen("list");
      if (input === "1" && repos[cursor]) {
        try { copyToClipboard(repos[cursor].ssh_url); showNotification("✓ SSH URL copied"); }
        catch { showNotification("✗ Copy failed"); }
      }
      if (input === "2" && repos[cursor]) {
        try { copyToClipboard(repos[cursor].clone_url); showNotification("✓ HTTPS URL copied"); }
        catch { showNotification("✗ Copy failed"); }
      }
    }
  });

  function toggleSelected(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  async function handleDelete() {
    const toDelete = repos.filter((_, i) => selected.has(i));
    const names: string[] = [];
    for (const repo of toDelete) {
      try {
        await octokit.repos.delete({ owner: GITHUB_USERNAME, repo: repo.name });
        names.push(repo.name);
      } catch (e: any) {
        showNotification(`✗ Failed: ${repo.name}`);
      }
    }
    if (names.length) setDeleted((d) => [...d, ...names]);
    setRepos((prev) => prev.filter((_, i) => !selected.has(i)));
    setSelected(new Set());
    setScreen("list");
  }

  async function handleRename() {
    const repo = repos[cursor];
    if (!repo || !renameValue.trim() || renameValue === repo.name || updating) return;
    setUpdating(true);
    setScreen("list");
    try {
      const { data } = await octokit.repos.update({
        owner: GITHUB_USERNAME,
        repo: repo.name,
        name: renameValue.trim(),
      });
      setRepos((prev) =>
        prev.map((r, i) =>
          i === cursor
            ? { ...r, name: data.name, full_name: data.full_name, html_url: data.html_url,
                clone_url: data.clone_url ?? r.clone_url, ssh_url: data.ssh_url ?? r.ssh_url }
            : r
        )
      );
      showNotification(`✓ Renamed → ${data.name}`);
    } catch (e: any) {
      showNotification(`✗ Rename failed`);
    }
    setUpdating(false);
  }

  async function handleToggleVisibility() {
    const repo = repos[cursor];
    if (!repo || updating) return;
    setUpdating(true);
    try {
      const { data } = await octokit.repos.update({
        owner: GITHUB_USERNAME,
        repo: repo.name,
        private: !repo.private,
      });
      setRepos((prev) =>
        prev.map((r, i) => (i === cursor ? { ...r, private: data.private } : r))
      );
      showNotification(`✓ Now ${data.private ? "private" : "public"}`);
    } catch (e: any) {
      showNotification(`✗ ${e.message ?? "Toggle failed"}`);
    }
    setUpdating(false);
  }

  async function handleCreate() {
    const name = createName.trim();
    if (!name || updating) return;
    setUpdating(true);
    setScreen("list");
    try {
      const { data } = await octokit.repos.createForAuthenticatedUser({ name });
      setRepos((prev) => [data as Repo, ...prev]);
      setNav((prev) => ({ cursor: 0, scrollOffset: 0 }));
      showNotification(`✓ Created ${data.name}`);
    } catch (e: any) {
      showNotification(`✗ ${e.message ?? "Create failed"}`);
    }
    setUpdating(false);
  }

  const selectedRepo = repos[cursor];

  // ── Loading / error ───────────────────────────────────────────
  if (loading) {
    return (
      <Box padding={1}>
        <Text color="yellow">⟳ Loading repos for {GITHUB_USERNAME}…</Text>
      </Box>
    );
  }

  // ── Create screen ─────────────────────────────────────────────
  if (screen === "create") {
    return (
      <Box flexDirection="column" padding={1} gap={1}>
        <Text bold color="cyan">New repository</Text>
        <Box borderStyle="round" borderColor="cyan" paddingX={1} width={60}>
          <Text>{createName}<Text color="white" bold>█</Text></Text>
        </Box>
        <Box gap={0}>
          <Hint keys="enter" action="create" />
          <Hint keys="esc" action="cancel" />
        </Box>
      </Box>
    );
  }

  // ── Rename screen ─────────────────────────────────────────────
  if (screen === "rename" && selectedRepo) {
    return (
      <Box flexDirection="column" padding={1} gap={1}>
        <Box gap={2}>
          <Text bold color="cyan">Rename</Text>
          <Text dimColor>{selectedRepo.full_name}</Text>
        </Box>
        <Box borderStyle="round" borderColor="cyan" paddingX={1} width={60}>
          <Text>{renameValue}<Text color="white" bold>█</Text></Text>
        </Box>
        <Box gap={0}>
          <Hint keys="enter" action="confirm" />
          <Hint keys="esc" action="cancel" />
        </Box>
      </Box>
    );
  }

  // ── Clone screen ──────────────────────────────────────────────
  if (screen === "clone" && selectedRepo) {
    return (
      <Box flexDirection="column" padding={1} gap={1}>
        <Box gap={2}>
          <Text bold color="cyan">Clone</Text>
          <Text dimColor>{selectedRepo.full_name}</Text>
          {notification && (
            <Text color={notification.startsWith("✓") ? "green" : "red"}>{notification}</Text>
          )}
        </Box>
        <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} gap={1}>
          <Box gap={2}>
            <Text bold color="yellow">1</Text>
            <Text dimColor>SSH  </Text>
            <Text color="cyan">{selectedRepo.ssh_url}</Text>
          </Box>
          <Box gap={2}>
            <Text bold color="yellow">2</Text>
            <Text dimColor>HTTPS</Text>
            <Text color="cyan">{selectedRepo.clone_url}</Text>
          </Box>
        </Box>
        <Box gap={0}>
          <Hint keys="1" action="copy SSH" />
          <Hint keys="2" action="copy HTTPS" />
          <Hint keys="esc" action="back" />
        </Box>
      </Box>
    );
  }

  // ── Detail screen ─────────────────────────────────────────────
  if (screen === "detail" && selectedRepo) {
    const isSelected = selected.has(cursor);
    return (
      <Box flexDirection="column" padding={1} gap={1}>
        <Box gap={2}>
          <Text bold color="cyan">{selectedRepo.full_name}</Text>
          <Text color={selectedRepo.private ? "yellow" : "green"} bold>
            {selectedRepo.private ? "⊘ private" : "◉ public"}
          </Text>
          {isSelected && <Text color="red">◆ marked</Text>}
          {notification && (
            <Text color={notification.startsWith("✓") ? "green" : "red"}>{notification}</Text>
          )}
        </Box>
        <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1} gap={1}>
          {selectedRepo.description
            ? <Text wrap="wrap">{selectedRepo.description}</Text>
            : <Text dimColor>No description.</Text>}
          <Box flexDirection="column" gap={0} marginTop={1}>
            <Row label="language" value={selectedRepo.language ?? "—"} color="magenta" />
            <Row label="stars"    value={`⭐ ${selectedRepo.stargazers_count}`} />
            <Row label="pushed"   value={timeAgo(selectedRepo.pushed_at)} color="yellow" />
            <Row label="url"      value={selectedRepo.html_url} color="blue" />
          </Box>
        </Box>
        <Box gap={0} flexWrap="wrap">
          <Hint keys="esc" action="back" />
          <Hint keys="s" action={isSelected ? "unmark" : "mark"} />
          <Hint keys="r" action="rename" />
          <Hint keys="v" action="visibility" />
          <Hint keys="c" action="clone" />
        <Hint keys="tab" action="pane" />
        <Hint keys="q" action="quit" />
        </Box>
      </Box>
    );
  }

  // ── Confirm screen ────────────────────────────────────────────
  if (screen === "confirm") {
    const toDelete = repos.filter((_, i) => selected.has(i));
    return (
      <Box flexDirection="column" padding={1} gap={1}>
        <Text color="red" bold>⚠ Delete {toDelete.length} repo{toDelete.length > 1 ? "s" : ""}?</Text>
        <Box flexDirection="column">
          {toDelete.map((r) => <Text key={r.id} color="red"> • {r.full_name}</Text>)}
        </Box>
        <Text>Press <Text color="green" bold>y</Text> to confirm or <Text color="yellow" bold>n</Text> to cancel.</Text>
      </Box>
    );
  }

  // ── List screen ───────────────────────────────────────────────
  const visibleRepos = repos.slice(scrollOffset, scrollOffset + visibleCount);
  const aboveCount  = scrollOffset;
  const belowCount  = Math.max(0, repos.length - (scrollOffset + visibleCount));

  // Status line text — always renders as one line (space = placeholder)
  const statusLine =
    notification ? notification
    : updating    ? "⟳ updating…"
    : selected.size > 0 ? `◆ ${selected.size} marked for deletion`
    : deleted.length > 0 ? `✓ Deleted: ${deleted.join(", ")}`
    : " ";
  const statusColor =
    notification?.startsWith("✓") ? "green"
    : notification?.startsWith("✗") ? "red"
    : updating ? "yellow"
    : selected.size > 0 ? "red"
    : "green";

  return (
    // ┌ Outer container: hard-capped to terminal height ─────────────┐
    <Box flexDirection="column" height={terminalHeight} overflow="hidden">

      {/* ── Fixed header: logo (6 lines) + info (6 lines) = 8 with border ── */}
      <Box borderStyle="round" borderColor="cyan" flexDirection="row" gap={2} paddingX={1}>
        <Logo />

        {/*
          Info column is ALWAYS exactly 6 lines tall — same as the logo.
          Using " " (non-empty space) as placeholder keeps line count stable
          so the header box never changes height and can't push the list off-screen.
        */}
        <Box flexDirection="column" justifyContent="center" gap={0} height={6}>
          <Box gap={1}>
            <Text bold color="cyanBright">lazygh</Text>
            <Text dimColor>·</Text>
            <Text color="white">@{GITHUB_USERNAME}</Text>
          </Box>
          <Box gap={1}>
            <Text bold color="yellow">{cursor + 1}</Text>
            <Text dimColor>/</Text>
            <Text color="white">{repos.length}</Text>
            <Text dimColor>repos</Text>
          </Box>
          <Text> </Text>
          <Text> </Text>
          <Text color={statusColor as any}>{statusLine}</Text>
          <Text> </Text>
        </Box>
      </Box>

      {/* ── Key hints bar — always 1 line ── */}
      <Box>
        <Hint keys="↑↓/jk" action="nav" />
        <Hint keys="enter" action="detail" />
        <Hint keys="n" action="new" />
        <Hint keys="r" action="rename" />
        <Hint keys="v" action="vis" />
        <Hint keys="c" action="clone" />
        <Hint keys="s" action="select" />
        {selected.size > 0 && <Hint keys="d" action="delete" />}
        <Hint keys="tab" action="readme" />
        <Hint keys="q" action="quit" />
      </Box>

      {/* ── Main content: list (left) + README (right) ── */}
      <Box flexDirection="row" height={visibleCount + LIST_BORDER_LINES + INDICATOR_LINES} overflow="hidden">
        {/* ── Repo list — fixed width in split mode ── */}
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={focusPane === "list" ? "cyanBright" : "gray"}
          width={LIST_SPLIT_WIDTH}
          overflow="hidden"
        >
          <Box paddingX={1}>
            {aboveCount > 0 ? (
              <Text dimColor>↑ {aboveCount} above</Text>
            ) : (
              <Text> </Text>
            )}
          </Box>

          {visibleRepos.map((repo, vi) => (
            <RepoRow
              key={repo.id}
              repo={repo}
              isCursor={vi + scrollOffset === cursor}
              isSelected={selected.has(vi + scrollOffset)}
              compact
            />
          ))}

          <Box paddingX={1}>
            {belowCount > 0 ? (
              <Text dimColor>↓ {belowCount} below</Text>
            ) : (
              <Text> </Text>
            )}
          </Box>
        </Box>

        {/* ── README pane — fills remaining width ── */}
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={focusPane === "readme" ? "cyanBright" : "gray"}
          width={terminalWidth - LIST_SPLIT_WIDTH}
          paddingX={1}
          overflow="hidden"
        >
          {readmeLoading ? (
            <Text color="yellow">⟳ loading readme…</Text>
          ) : readme ? (
            <MarkdownRenderer content={readme} width={terminalWidth - LIST_SPLIT_WIDTH - 4} scroll={readmeScroll} height={visibleCount} />
          ) : readme === "" ? (
            <Text dimColor>No README found.</Text>
          ) : (
            <Text dimColor>…</Text>
          )}
        </Box>
      </Box>

    </Box>
    // └──────────────────────────────────────────────────────────────┘
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box gap={2}>
      <Text dimColor>{label.padEnd(10)}</Text>
      <Text color={color as any}>{value}</Text>
    </Box>
  );
}

// ── Synchronized-output patch ─────────────────────────────────────────────────
// Ink rewrites every output line on each render. The terminal processes those
// escape sequences one by one, producing a brief "partial frame" window — the
// visible jitter. Fix: collect all stdout.write() calls that happen within the
// same JS event-loop tick into one buffer, then flush it wrapped in a
// CSI ?2026 (Begin/End Synchronized Update) pair. The terminal applies the
// whole frame atomically. Terminals that don't support ?2026 ignore the
// sequences harmlessly (no change in behaviour for them).
(function patchSyncOutput() {
  const _write = process.stdout.write.bind(process.stdout);
  let buf = "";
  let cbs: Array<() => void> = [];
  let pending = false;

  function flush() {
    pending = false;
    const out = buf;
    const callbacks = cbs;
    buf = "";
    cbs = [];
    if (out) _write("\x1b[?2026h" + out + "\x1b[?2026l");
    for (const cb of callbacks) cb();
  }

  process.stdout.write = function (data: any, enc?: any, cb?: any): boolean {
    if (typeof enc === "function") { cb = enc; }
    buf += typeof data === "string" ? data : (data as Buffer).toString("utf8");
    if (cb) cbs.push(cb);
    if (!pending) { pending = true; setImmediate(flush); }
    return true;
  } as typeof process.stdout.write;
})();

render(<App />);
