import React from "react";
import { Box, Text } from "ink";

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

export default Hint;
