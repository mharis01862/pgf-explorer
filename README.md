# PGF-Explorer: An Interactive Database for Plant Gene Family Meta-Analysis

This folder contains a web-hostable first version of the curated database behind the plant genome-wide gene family meta-analysis.

## What is included

- `data/`
  - Normalized JSON tables generated from `database/Data.csv`
  - `search_index.json` for fast frontend filtering
  - `stats.json` for dashboard summaries
- `database/`
  - Self-contained PDF library copied into the web bundle as `database/<Paper ID>.pdf`
- `index.html`
  - A lightweight searchable frontend
- `app.js`
  - Client-side filtering and rendering logic
- `styles.css`
  - Frontend styling
- `schema.sql`
  - A relational SQL schema for migration into PostgreSQL, MySQL, or SQLite
- `scripts/build-database.mjs`
  - The generator that converts the raw CSV into normalized web-ready data files

## Source assumptions

- Raw metadata lives in `database/Data.csv`
- Source PDFs live in `database/<Paper ID>.pdf`
- PDF names correspond directly to the `Paper ID` field in the CSV
- The deployable site bundle keeps its own mirrored PDF folder in `interactive_database/database/`

## Rebuild the database

From the project root:

```powershell
node interactive_database\scripts\build-database.mjs
```

## Local preview

Because the frontend loads JSON with `fetch`, preview it through a simple static server instead of opening `index.html` directly as a file.

Example with Node:

```powershell
npx serve .
```

Then open:

- `http://localhost:3000/interactive_database/`

## Recommended hosting options

- GitHub Pages for the fully self-contained static bundle
- Netlify or Vercel for direct static deployment
- Supabase or PostgreSQL later if you want authenticated editing, APIs, or advanced querying

## Recommended next upgrades

- Standardize species names against NCBI Taxonomy
- Collapse synonymous tool names into controlled vocabularies
- Add abstract text or short study summaries from the PDFs
- Add an API layer on top of the normalized tables
- Add cross-study comparison views by species, gene family, toolset, and validation status

## License

This project is dual-licensed:
- **Software Code:** The website code (HTML, CSS, JavaScript, Node.js scripts) is licensed under the [MIT License](LICENSE).
- **Dataset and Content:** The curated academic data, CSVs, JSONs, and PDF metadata are licensed under the [Creative Commons Attribution 4.0 International (CC BY 4.0) License](https://creativecommons.org/licenses/by/4.0/). You are free to share and adapt the data, provided you give appropriate credit.
