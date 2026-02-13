# Tree Shaking Bundle Size Comparison

Comparison of bundle sizes for `@twilio/flex-sdk@3.0.0` with tree shaking enabled vs disabled across Vite and Webpack bundlers.

## 1. Vite (Tree Shaking Enabled)

**Build command:** `npm run build`
**Output directory:** `dist-vite/`

| File | Size | Gzip |
|------|------|------|
| index-DJt-wiA0.js | 698.78 kB | 209.12 kB |
| index-DZUnjs4r.js | 311.59 kB | 78.70 kB |
| startRecording-NNPjxF08.js | 21.14 kB | 8.10 kB |
| profiler-BY_2kXHo.js | 5.69 kB | 2.62 kB |
| index.html | 0.42 kB | 0.28 kB |
| **Total** | **1,037.62 kB** | **298.82 kB** |

## 2. Vite (Tree Shaking Disabled)

**Build command:** `npm run build:no-tree-shake`
**Output directory:** `dist-vite-no-treeshake/`

| File | Size | Gzip |
|------|------|------|
| index-BmIt23b-.js | 1,819.23 kB | 498.32 kB |
| index-DrP3N8D4.js | 311.67 kB | 78.75 kB |
| startRecording-DUE0BoBc.js | 21.14 kB | 8.10 kB |
| profiler-BxWXPT0N.js | 5.01 kB | 2.29 kB |
| index.html | 0.42 kB | 0.28 kB |
| **Total** | **2,157.47 kB** | **587.74 kB** |

## 3. Webpack (Tree Shaking Enabled)

**Build command:** `npm run build:webpack`
**Output directory:** `dist-webpack/`

| File | Size |
|------|------|
| bundle.js | 702.00 kB |
| 777.bundle.js (recorder) | 19.90 kB |
| 12.bundle.js (profiler) | 4.91 kB |
| 92.bundle.js | 0.40 kB |
| index.html | 0.36 kB |
| **Total** | **727.57 kB** |

## 4. Webpack (Tree Shaking Disabled)

**Build command:** `npm run build:webpack:no-tree-shake`
**Output directory:** `dist-webpack-no-treeshake/`

| File | Size |
|------|------|
| bundle.js | 1,659.00 kB |
| 777.bundle.js (recorder) | 21.20 kB |
| 12.bundle.js (profiler) | 5.14 kB |
| 92.bundle.js | 0.40 kB |
| index.html | 0.36 kB |
| **Total** | **1,686.10 kB** |

## Summary

| Bundler | Tree Shaking | Total Size | Reduction |
|---------|-------------|------------|-----------|
| Vite | Enabled | 1,037.62 kB | **51.9%** smaller |
| Vite | Disabled | 2,157.47 kB | baseline |
| Webpack | Enabled | 727.57 kB | **56.9%** smaller |
| Webpack | Disabled | 1,686.10 kB | baseline |
