# Bundle Size Comparison

Bundle sizes for `@twilio/conversations@2.6.0` across Vite and Webpack bundlers.

> **Note:** The `@twilio/conversations` SDK ships pre-bundled browser builds and does not support tree shaking.

## 1. Vite

**Build command:** `npm run build`
**Output directory:** `dist-vite/`

| File | Size | Gzip |
|------|------|------|
| index-ULmEu3ho.js | 700.37 kB | 177.53 kB |
| index.html | 0.36 kB | 0.25 kB |
| **Total** | **700.73 kB** | **177.78 kB** |

## 2. Webpack

**Build command:** `npm run build:webpack`
**Output directory:** `dist-webpack/`

| File | Size |
|------|------|
| bundle.js | 622.00 kB |
| index.html | 0.30 kB |
| **Total** | **622.30 kB** |

## Summary

| Bundler | Total Size |
|---------|------------|
| Vite | 700.73 kB |
| Webpack | 622.30 kB |
