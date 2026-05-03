CREATE TABLE countries (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE journals (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE organisms (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE gene_families (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE genome_sources (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE keywords (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE tools (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category TEXT
);

CREATE TABLE authors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE papers (
  paper_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER,
  journal_id INTEGER REFERENCES journals(id),
  country_id INTEGER REFERENCES countries(id),
  doi TEXT,
  raw_doi TEXT,
  pdf_filename TEXT,
  pdf_available BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,
  number_of_genes_identified INTEGER,
  phylogenetic_structure TEXT,
  duplication_summary TEXT,
  expression_summary TEXT
);

CREATE TABLE paper_authors (
  paper_id INTEGER REFERENCES papers(paper_id),
  author_id INTEGER REFERENCES authors(id),
  author_name TEXT NOT NULL,
  PRIMARY KEY (paper_id, author_id)
);

CREATE TABLE paper_organisms (
  paper_id INTEGER REFERENCES papers(paper_id),
  organism_id INTEGER REFERENCES organisms(id),
  organism_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('primary', 'secondary')),
  PRIMARY KEY (paper_id, organism_id, role)
);

CREATE TABLE paper_gene_families (
  paper_id INTEGER REFERENCES papers(paper_id),
  gene_family_id INTEGER REFERENCES gene_families(id),
  PRIMARY KEY (paper_id, gene_family_id)
);

CREATE TABLE paper_genome_sources (
  paper_id INTEGER REFERENCES papers(paper_id),
  genome_source_id INTEGER REFERENCES genome_sources(id),
  genome_source_name TEXT NOT NULL,
  PRIMARY KEY (paper_id, genome_source_id)
);

CREATE TABLE paper_keywords (
  paper_id INTEGER REFERENCES papers(paper_id),
  keyword_id INTEGER REFERENCES keywords(id),
  keyword TEXT NOT NULL,
  PRIMARY KEY (paper_id, keyword_id)
);

CREATE TABLE paper_tools (
  paper_id INTEGER REFERENCES papers(paper_id),
  tool_id INTEGER REFERENCES tools(id),
  tool_name TEXT NOT NULL,
  category TEXT,
  source_column TEXT,
  detail TEXT,
  PRIMARY KEY (paper_id, tool_id, source_column)
);

CREATE TABLE validations (
  paper_id INTEGER PRIMARY KEY REFERENCES papers(paper_id),
  rna_seq_used BOOLEAN,
  experimental_validation_qpcr BOOLEAN,
  hmm_used BOOLEAN,
  blast_used BOOLEAN,
  blast_threshold TEXT
);

CREATE TABLE validation_pfam_ids (
  paper_id INTEGER REFERENCES papers(paper_id),
  pfam_id TEXT NOT NULL,
  PRIMARY KEY (paper_id, pfam_id)
);

CREATE TABLE results_summary (
  paper_id INTEGER PRIMARY KEY REFERENCES papers(paper_id),
  number_of_genes_identified INTEGER,
  phylogenetic_structure TEXT,
  duplication_pattern TEXT,
  expression_analysis TEXT
);
