```
  ██████╗ ██╗  ██╗██████╗ ███████╗ ██████╗██╗  ██╗
 ██╔════╝ ██║  ██║██╔══██╗██╔════╝██╔════╝██║ ██╔╝
 ██║  ███╗███████║██║  ██║█████╗  ██║     █████╔╝
 ██║   ██║██╔══██║██║  ██║██╔══╝  ██║     ██╔═██╗
 ╚██████╔╝██║  ██║██████╔╝███████╗╚██████╗██║  ██╗
  ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝
```

A terminal UI dashboard for managing your GitHub repositories — built with [Ink](https://github.com/vadimdemedes/ink) and React.

---

<img width="1470" height="956" alt="Screenshot 2026-02-25 at 08 36 33" src="https://github.com/user-attachments/assets/131f8515-ee9e-48a6-bb28-7d4110e06a0f" />

## Features

- **Split-view layout** — repo list on the left, README preview on the right
- **Markdown rendering** — parses and renders README files with syntax highlighting for headings, code, lists, links, and more
- **Repo management** — rename, toggle visibility (public/private), create, and delete repos
- **Clone URLs** — copy SSH or HTTPS clone URLs to clipboard
- **Keyboard-driven** — fully navigable with keyboard shortcuts, no mouse needed
- **Scrollable README** — Tab to switch panes, scroll with j/k or arrow keys
- **Flicker-free rendering** — synchronized terminal output (BSU)

---

## Requirements

- Node.js 18+
- A GitHub personal access token with **`repo`** and **`delete_repo`** scopes

---

## Setup

```bash
git clone https://github.com/your-username/ghdeck.git
cd ghdeck
npm install
```

Create a `.env` file in the project root:

```env
GITHUB_USER=your-github-username
GITHUB_TOKEN=ghp_your_personal_access_token
```

---

## Run

```bash
npm start
```

---

## Key bindings

### List screen

| Key | Action |
|-----|--------|
| `↑` / `k` | Move cursor up |
| `↓` / `j` | Move cursor down |
| `Tab` | Switch focus to README pane |
| `Enter` / `Space` | Open detail view |
| `n` | Create new repository |
| `r` | Rename repository |
| `v` | Toggle public / private |
| `c` | Show clone URLs |
| `s` | Mark / unmark for deletion |
| `d` | Delete all marked repos |
| `q` | Quit |

### README pane (Tab to focus)

| Key | Action |
|-----|--------|
| `↑` / `k` | Scroll up |
| `↓` / `j` | Scroll down |
| `PageUp` | Scroll up 10 lines |
| `PageDown` | Scroll down 10 lines |
| `Tab` | Switch focus back to repo list |

### Detail view

| Key | Action |
|-----|--------|
| `Esc` / `←` | Back to list |
| `r` | Rename |
| `v` | Toggle visibility |
| `c` | Clone URLs |
| `s` | Mark / unmark for deletion |
| `q` | Quit |

### Clone screen

| Key | Action |
|-----|--------|
| `1` | Copy SSH URL to clipboard |
| `2` | Copy HTTPS URL to clipboard |
| `Esc` | Back |

### Rename / Create screens

| Key | Action |
|-----|--------|
| any char | Type |
| `Backspace` | Delete last character |
| `Enter` | Confirm |
| `Esc` | Cancel |

---

## Stack

| | |
|---|---|
| Runtime | [tsx](https://github.com/privatenumber/tsx) (no build step) |
| UI | [Ink](https://github.com/vadimdemedes/ink) v5 + React 18 |
| GitHub API | [@octokit/rest](https://github.com/octokit/rest.js) |
| Markdown | [remark](https://github.com/remarkjs/remark) + remark-gfm |
| Language | TypeScript |

---

## License

MIT
