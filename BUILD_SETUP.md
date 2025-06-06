# Build Setup - TSWriter

This project has been converted from a monorepo structure to a normal repository structure.

## Changes Made

### Repository Structure

- **Before**: Monorepo with workspaces configuration
- **After**: Normal repository with all dependencies in root `node_modules`

### Directory Structure

```
ts-writer/
├── src/
│   ├── components/          # All React/SolidJS components
│   │   ├── Layout/
│   │   ├── Editor/
│   │   ├── Chapters/
│   │   ├── Book/
│   │   ├── Ideas/
│   │   ├── Settings/
│   │   └── *.tsx files
│   ├── stores/              # State management
│   ├── services/            # API and external services
│   ├── types/               # TypeScript type definitions
│   ├── config/              # Configuration files
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── node_modules/            # Dependencies (now in root)
├── dist/                    # Build output
├── package.json             # Merged dependencies
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
└── index.html               # Entry HTML file
```

### Package.json Changes

- Removed `workspaces` configuration
- Merged all dependencies from `src/package.json` into root `package.json`
- Updated scripts to run directly from root
- Added `@types/node` for proper TypeScript support

### Configuration Updates

- **tsconfig.json**: Updated path aliases for new structure
- **vite.config.ts**: Added proper path resolution for aliases
- **tailwind.config.js**: Updated content paths
- **index.html**: Created entry point for Vite

## Available Scripts

```bash
# Development server
yarn dev

# Production build
yarn build

# Preview production build
yarn preview
```

## Path Aliases

The following path aliases are configured:

- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@stores/*` → `src/stores/*`
- `@services/*` → `src/services/*`
- `@types/*` → `src/types/*`
- `@config/*` → `src/config/*`

## Dependencies

### Production Dependencies

- `solid-js` - SolidJS framework
- `@thisbeyond/solid-dnd` - Drag and drop functionality
- `marked` - Markdown parsing
- `gapi-script` - Google API integration
- `idb` - IndexedDB wrapper
- `uuid` - UUID generation

### Development Dependencies

- `vite` - Build tool and dev server
- `vite-plugin-solid` - SolidJS plugin for Vite
- `typescript` - TypeScript compiler
- `tailwindcss` - CSS framework
- `@tailwindcss/typography` - Typography plugin
- `autoprefixer` - CSS autoprefixer
- `postcss` - CSS processor
- `@types/*` - TypeScript type definitions

## Build Status

✅ **Build working**: `yarn build` completes successfully
✅ **Dev server working**: `yarn dev` starts development server
✅ **Dependencies resolved**: All imports and path aliases working
✅ **Node modules in root**: Single `node_modules` directory at project root
