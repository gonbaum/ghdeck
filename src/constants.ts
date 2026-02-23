// Header layout constants
// Logo: 6 lines · border: 2 lines = 8 lines (FIXED — never changes)
export const HEADER_LINES = 8;
// Hints bar: 1 line
export const HINTS_LINES = 1;
// List box borders: top + bottom = 2 lines
export const LIST_BORDER_LINES = 2;
// Scroll indicators (reserved even when not shown, keeps height stable)
export const INDICATOR_LINES = 2;
export const OVERHEAD = HEADER_LINES + HINTS_LINES + LIST_BORDER_LINES + INDICATOR_LINES; // 13

// Width of the compact list pane in the split-view layout
export const LIST_SPLIT_WIDTH = 32;
