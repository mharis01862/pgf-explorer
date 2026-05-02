# Data Dictionary

This database is derived from `database/Data.csv` and normalized into linked tables suitable for a web platform or relational database.

## Core tables

### `papers.json`

- `paper_id`: Integer identifier from the source CSV
- `title`: Study title
- `year`: Publication year
- `journal_id`: Foreign key to `journals.json`
- `country_id`: Foreign key to `countries.json`
- `doi`: Cleaned DOI string
- `raw_doi`: DOI as stored in the CSV
- `pdf_filename`: Expected source PDF filename
- `pdf_available`: Whether the corresponding PDF exists
- `pdf_url`: Expected public path for the PDF
- `number_of_genes_identified`: Parsed integer from the source field
- `phylogenetic_structure`: Reported phylogenetic grouping summary
- `duplication_summary`: Reported duplication description
- `expression_summary`: RNA-seq expression field as stored in source data

### `paper_organisms.json`

- `paper_id`: Linked paper
- `organism_id`: Linked organism
- `organism_name`: Human-readable scientific name
- `role`: `primary` or `secondary`

### `paper_gene_families.json`

- `paper_id`: Linked paper
- `gene_family_id`: Linked gene family

### `paper_tools.json`

- `paper_id`: Linked paper
- `tool_id`: Linked tool
- `tool_name`: Tool label
- `category`: Broad workflow category
- `source_column`: Original CSV column from which the tool was extracted
- `detail`: Raw supporting value

### `validations.json`

- `paper_id`: Linked paper
- `rna_seq_used`: Boolean where detectable
- `experimental_validation_qpcr`: Boolean where detectable
- `hmm_used`: Boolean derived from HMMER field
- `blast_used`: Boolean derived from BLAST field
- `blast_threshold`: Parsed threshold where stated
- `pfam_ids`: Parsed Pfam identifiers from the HMMER field

### `results.json`

- `paper_id`: Linked paper
- `number_of_genes_identified`: Parsed gene count
- `phylogenetic_structure`: Grouping structure
- `duplication_pattern`: Duplication description
- `expression_analysis`: RNA-seq field

## Lookup tables

- `countries.json`
- `journals.json`
- `organisms.json`
- `gene_families.json`
- `genome_sources.json`
- `keywords.json`
- `tools.json`
- `authors.json`

Each lookup table contains:

- `id`: Integer identifier
- `name`: Cleaned display value
- `slug`: URL-friendly key

## Frontend-specific file

### `search_index.json`

This is a denormalized convenience file for the static website. It joins the main paper record with:

- journal name
- country name
- primary and secondary organisms
- gene families
- authors
- tools
- keywords
- validation flags

It is intended for fast client-side filtering and should be regenerated rather than edited manually.
