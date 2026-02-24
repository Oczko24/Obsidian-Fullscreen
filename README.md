# Obsidian Fullscreen Plugin

A highly optimized, lightweight, and blazing-fast plugin for a true Fullscreen (Zen Mode) experience in Obsidian.
Unlike other fullscreen plugins that rely on heavy Javascript calculations or native Electron maximize events, this plugin uses a pristine **CSS-based architecture** that instantly hides distracting UI elements (Sidebars, Tabs, Ribbon, Status bar, Canvas controls) by toggling a single class on the app body.

## Features

- **Zero-Lag Toggling**: Instantly hides the UI using CSS.
- **Mobile & Desktop Support**: Works identically on all devices.
- **Multi-Touch / Click Support**: Double or triple click/tap the screen to toggle fullscreen (perfect for mobile!).
- **Granular Control**: Choose exactly which parts of the interface you want hidden.
- **Maximum Minimalism**: No bloated loops, no heavy DOM querying. It just works.

---

## Installation

You will be able to install this plugin from the official community plugins list in Obsidian soon.

For now:

1. Go to the [Releases](https://github.com/Oczko24/Obsidian-Fullscreen/releases) page of this repository.
2. Download `main.js`, `styles.css`, and `manifest.json`.
3. Create a folder `fullscreen-focus` inside your vault's `.obsidian/plugins/` directory.
4. Place the downloaded files in that folder.
5. In Obsidian settings, go to Community plugins, disable Safe mode, and enable "Obsidian Fullscreen".
