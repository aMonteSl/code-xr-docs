# CodeXR exported analysis

This folder is a self-contained snapshot of a CodeXR analysis
(**express**, directory, exported 2026-07-29T15:24:32.544Z).

## How to open it

Serve the folder with any static HTTP server and open the reported URL
(opening `index.html` via `file://` will NOT work: the scene loads its
data with fetch, which browsers block on the file protocol):

```bash
npx serve .
```

```bash
python -m http.server 8080
```

## What works in this export

- **Classic analysis**: fully, including the Field Mapping panel and the in-room guide.
- **Dependency graph**: interactive exploration of the exported dataset; re-analysis requires CodeXR.
- **Historical comparison**: fully interactive across the exported revisions. Offline comparisons: pick any two of the 40 exported sources.
- **Project evolution**: create and play movies from the exported revisions. Offline movies from the 40 exported sources (Auto, Range or Manual).

Live source re-analysis and collaboration require CodeXR. Historical
comparisons and Project Evolution movies can be created without CodeXR when
their git timeline was selected for this export. An internet connection is
still required for the A-Frame/BabiaXR CDN scripts the scene loads.
