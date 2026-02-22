```
██╗      █████╗ ███████╗██╗   ██╗ ██████╗ ██╗  ██╗
██║     ██╔══██╗╚══███╔╝╚██╗ ██╔╝██╔════╝ ██║  ██║
██║     ███████║  ███╔╝  ╚████╔╝ ██║  ███╗███████║
██║     ██╔══██║ ███╔╝    ╚██╔╝  ██║   ██║██╔══██║
███████╗██║  ██║███████╗   ██║   ╚██████╔╝██║  ██║
╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
```

A lazy terminal UI for managing your GitHub repositories — built with [Ink](https://github.com/vadimdemedes/ink) (React for CLIs) and TypeScript.

---

## Features

- **Browse** all your repos with a scrollable, framed list
- **Detail view** — description, language, stars, last push, URL
- **Create** a new repository without leaving the terminal
- **Rename** any repo with an inline text editor
- **Toggle visibility** — flip public ↔ private in one keypress
- **Copy clone URLs** — SSH or HTTPS straight to your clipboard
- **Delete** one or many repos (with a confirmation prompt)
- Flicker-free rendering via synchronized terminal output (BSU)

---

## Requirements

- Node.js 18+
- A GitHub personal access token with **`repo`** and **`delete_repo`** scopes

---

## Setup

```bash
git clone https://github.com/your-username/lazygh
cd lazygh
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
| `enter` / `space` | Open detail view |
| `n` | Create new repository |
| `r` | Rename repository |
| `v` | Toggle public / private |
| `c` | Show clone URLs |
| `s` | Mark / unmark for deletion |
| `d` | Delete all marked repos |
| `q` | Quit |

### Detail view

| Key | Action |
|-----|--------|
| `esc` / `←` | Back to list |
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
| `esc` | Back |

### Rename / Create screens

| Key | Action |
|-----|--------|
| any char | Type |
| `backspace` | Delete last character |
| `↵` | Confirm |
| `esc` | Cancel |

---

## Stack

| | |
|---|---|
| Runtime | [tsx](https://github.com/privatenumber/tsx) (no build step) |
| UI | [Ink](https://github.com/vadimdemedes/ink) v5 + React 18 |
| GitHub API | [@octokit/rest](https://github.com/octokit/rest.js) |
| Language | TypeScript |
