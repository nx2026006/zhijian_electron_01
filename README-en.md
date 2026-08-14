# nowCreate — Desktop Image Batch Compression Tool

![GitHub stars](https://img.shields.io/github/stars/nx2026006/zhijian_electron_01)
![License](https://img.shields.io/badge/license-MIT-blue)
![Electron](https://img.shields.io/badge/Electron-28-blue)
![Vue](https://img.shields.io/badge/Vue-3.4-green)

A **desktop image batch compression tool** built with **Electron + Vue 3**. Batch import, custom quality control, CDN upload and result export — all in one window.

## Features

- **Batch compress**: multi-image import, drag & drop, concurrent processing
- **Quality control**: light (90) / medium (75) / deep (50) + custom (10–100)
- **Real-time progress**: per-image progress bars with instant status
- **Before/after comparison**: size diff and compression ratio visualization
- **File export**: overwrite original files or export to a chosen directory
- **Token management**: auto-loaded on startup, guided setup dialog if missing

## Requirements

| Dependency | Version |
|------------|---------|
| Node.js | >= 18 |
| Yarn | 1.22+ |
| Electron | 28+ (bundles Node v20.18.0) |

## Quick Start

```bash
# install dependencies
yarn install

# start dev server
yarn dev

# production build
yarn build
```

## API Key Configuration

Create a `.env` file in the project root:

```env
NX_API_KEY=your_api_key
```

The app reads it automatically on startup. If missing, clicking "Start compress" opens an input dialog and writes the key into `.env`.


## Tech Stack

| Tech | Version | Purpose |
|------|---------|---------|
| Electron | ^28 | Desktop framework |
| electron-vite | ^2 | Build tooling |
| Vue 3 | ^3.4 | Renderer framework |
| Element Plus | ^2.7 | UI component library |
| Pinia | ^2.1 | State management |
| Vue Router | ^4.3 | Routing (hash mode) |
| Axios | latest | HTTP client |
| Sass | ~1.77 | CSS preprocessing |

## Compression Flow

1. Import images (button / drag & drop / folder) → thumbnail list
2. Choose compression quality and mode
3. Click "Start compress" → pre-check first batch → concurrent compression for the rest
4. Each image shows its own progress bar (0 → ~90% → 100%)
5. On completion, overwrite originals or export to a new directory

## Startup Notes

- **`ELECTRON_RUN_AS_NODE=1`**: if set in the system env, Electron won't launch normally; `yarn dev` auto-clears it via `scripts/start-dev.js`
- **sass version**: pinned to `~1.77.0`; 1.80+ requires Node >= 20.19
- **Build output**: `out/` directory, split into `main` / `preload` / `renderer`
- **Single-instance lock**: launching again activates the existing window instead of creating a new one

## License

MIT

