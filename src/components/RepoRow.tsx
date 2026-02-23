import React from "react";
import { Box, Text } from "ink";
import { Repo } from "../types";
import { truncate, timeAgo } from "../utils/formatting";

// Memoized: only re-renders when its own props change.
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

export default RepoRow;
