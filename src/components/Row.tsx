import React from "react";
import { Box, Text } from "ink";

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box gap={2}>
      <Text dimColor>{label.padEnd(10)}</Text>
      <Text color={color as any}>{value}</Text>
    </Box>
  );
}

export default Row;
