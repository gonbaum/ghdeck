import React from "react";
import { Box } from "ink";
import { mdParser, flattenMdNode } from "../utils/markdown";

function MarkdownRenderer({ content, width, scroll, height }: {
  content: string;
  width: number;
  scroll: number;
  height: number;
}) {
  const tree = mdParser.parse(content) as any;
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

export default MarkdownRenderer;
