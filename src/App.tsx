import React, { useState } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { Screen } from "./types";
import { OVERHEAD, LIST_SPLIT_WIDTH, LIST_BORDER_LINES, INDICATOR_LINES } from "./constants";
import { GITHUB_USERNAME, GITHUB_TOKEN } from "./services/github";
import { copyToClipboard } from "./utils/clipboard";
import { timeAgo } from "./utils/formatting";
import Logo from "./components/Logo";
import Hint from "./components/Hint";
import Row from "./components/Row";
import RepoRow from "./components/RepoRow";
import MarkdownRenderer from "./components/MarkdownRenderer";
import TextInputModal from "./components/TextInputModal";
import { useRepoList } from "./hooks/useRepoList";
import { useNavigation } from "./hooks/useNavigation";
import { useReadme } from "./hooks/useReadme";

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();

  const terminalHeight = stdout?.rows ?? 24;
  const terminalWidth = stdout?.columns ?? 80;
  const visibleCount = Math.max(3, terminalHeight - OVERHEAD);

  const {
    repos, loading, updating, deleted,
    notification, showNotification,
    handleDelete, handleRename, handleToggleVisibility, handleCreate,
  } = useRepoList();

  const { cursor, scrollOffset, moveCursor, resetNav } = useNavigation(repos.length, visibleCount);

  const [screen, setScreen] = useState<Screen>("list");
  const { readme, readmeLoading, readmeScroll, setReadmeScroll } = useReadme(cursor, repos, screen);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [renameValue, setRenameValue] = useState("");
  const [createName, setCreateName] = useState("");
  const [focusPane, setFocusPane] = useState<"list" | "readme">("list");

  function toggleSelected(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  useInput((input, key) => {
    if (screen === "list") {
      if (key.tab) { setFocusPane((p) => (p === "list" ? "readme" : "list")); return; }
      if (focusPane === "list") {
        if (key.upArrow || input === "k") moveCursor(-1);
        if (key.downArrow || input === "j") moveCursor(1);
        if (input === " " || key.return) setScreen("detail");
        if (input === "s") toggleSelected(cursor);
        if (input === "r" && repos[cursor]) { setRenameValue(repos[cursor].name); setScreen("rename"); }
        if (input === "v" && repos[cursor] && !updating) handleToggleVisibility(cursor);
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
      if (input === "r" && repos[cursor]) { setRenameValue(repos[cursor].name); setScreen("rename"); }
      if (input === "v" && repos[cursor] && !updating) handleToggleVisibility(cursor);
      if (input === "c" && repos[cursor]) setScreen("clone");
      if (input === "q") exit();
    }

    if (screen === "confirm") {
      if (input === "y" || input === "Y") { handleDelete(selected).then(() => { setSelected(new Set()); setScreen("list"); }); }
      if (input === "n" || input === "N" || key.escape) setScreen("list");
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

  const selectedRepo = repos[cursor];

  // ── Missing config ─────────────────────────────────────────────
  if (!GITHUB_USERNAME || !GITHUB_TOKEN) {
    return (
      <Box flexDirection="column" padding={1} gap={1}>
        <Logo />
        <Text color="red" bold>Missing environment variables</Text>
        {!GITHUB_USERNAME && <Text color="yellow">  GITHUB_USER is not set</Text>}
        {!GITHUB_TOKEN && <Text color="yellow">  GITHUB_TOKEN is not set</Text>}
        <Text> </Text>
        <Text dimColor>Create a .env file in the project root:</Text>
        <Text color="cyan">  GITHUB_USER=your-github-username</Text>
        <Text color="cyan">  GITHUB_TOKEN=ghp_your_personal_access_token</Text>
        <Text> </Text>
        <Text dimColor>Press q to quit.</Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box padding={1}>
        <Text color="yellow">⟳ Loading repos for {GITHUB_USERNAME}…</Text>
      </Box>
    );
  }

  if (screen === "create") {
    return (
      <TextInputModal
        title="New repository"
        value={createName}
        onChange={setCreateName}
        onConfirm={() => handleCreate(createName, () => { resetNav(); setScreen("list"); })}
        onCancel={() => setScreen("list")}
      />
    );
  }

  if (screen === "rename" && selectedRepo) {
    return (
      <TextInputModal
        title="Rename"
        hint={selectedRepo.full_name}
        value={renameValue}
        onChange={setRenameValue}
        onConfirm={() => handleRename(cursor, renameValue).then(() => setScreen("list"))}
        onCancel={() => setScreen("list")}
      />
    );
  }

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
  const aboveCount = scrollOffset;
  const belowCount = Math.max(0, repos.length - (scrollOffset + visibleCount));

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
    <Box flexDirection="column" height={terminalHeight} overflow="hidden">

      <Box borderStyle="round" borderColor="cyan" flexDirection="row" gap={2} paddingX={1}>
        <Logo />
        <Box flexDirection="column" justifyContent="center" gap={0} height={6}>
          <Box gap={1}>
            <Text bold color="cyanBright">ghdeck</Text>
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

      <Box flexDirection="row" height={visibleCount + LIST_BORDER_LINES + INDICATOR_LINES} overflow="hidden">
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={focusPane === "list" ? "cyanBright" : "gray"}
          width={LIST_SPLIT_WIDTH}
          overflow="hidden"
        >
          <Box paddingX={1}>
            {aboveCount > 0 ? <Text dimColor>↑ {aboveCount} above</Text> : <Text> </Text>}
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
            {belowCount > 0 ? <Text dimColor>↓ {belowCount} below</Text> : <Text> </Text>}
          </Box>
        </Box>

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
  );
}
