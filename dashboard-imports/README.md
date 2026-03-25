# Dashboard Imports

Drop exactly one full Code-XR export folder inside each project directory before running `npm run build` or `npm run deploy`.

- `dashboard-imports/babia-xr/<your-export-folder>/`
- `dashboard-imports/express/<your-export-folder>/`
- `dashboard-imports/jetuml/<your-export-folder>/`

Each export must be self-contained and include its own `index.html`.

If a project folder contains more than one export, the build will fail to avoid ambiguity.
