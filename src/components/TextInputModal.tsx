import React from "react";
import { Box, Text, useInput } from "ink";
import Hint from "./Hint";

type Props = {
  title: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

function TextInputModal({ title, hint, value, onChange, onConfirm, onCancel }: Props) {
  useInput((input, key) => {
    if (key.escape) { onCancel(); return; }
    if (key.return) { onConfirm(); return; }
    if (key.backspace || key.delete) { onChange(value.slice(0, -1)); return; }
    if (input && !key.ctrl && !key.meta && input.length === 1) onChange(value + input);
  });

  return (
    <Box flexDirection="column" padding={1} gap={1}>
      <Box gap={2}>
        <Text bold color="cyan">{title}</Text>
        {hint && <Text dimColor>{hint}</Text>}
      </Box>
      <Box borderStyle="round" borderColor="cyan" paddingX={1} width={60}>
        <Text>{value}<Text color="white" bold>█</Text></Text>
      </Box>
      <Box gap={0}>
        <Hint keys="enter" action="confirm" />
        <Hint keys="esc" action="cancel" />
      </Box>
    </Box>
  );
}

export default TextInputModal;
