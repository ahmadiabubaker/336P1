# CS336 Project 1 (Fall 2026) — Working Notes for Claude

Rutgers CS336, Principles of Information & Data Management.
Two deliverables: (1) an ER diagram of the HMDA data, (2) a PostgreSQL load/unload
round-trip on the iLab machines. 4 points total (2 + 2). Team of 2.

**Source documents in this folder (do not modify):**
- `Project 1 Fall 2026 CS336.pdf` — the assignment spec and rubrics.
- `CS336 Recitation 2.pdf` — iLab / ssh / scp / psql walkthrough (Zihan Chen, Sep 22).

---

## 1. The data — VERIFIED against the actual download

File: `hmda_2017_nj_all-records_labels.csv` (278 MB, downloaded 2026-09-27)
Source: https://www.consumerfinance.gov/data-research/hmda/historic-data/
Options used: 2017 / New Jersey / All records / Plain language labels and HMDA codes.

**Measured facts (profiled, not guessed):**

- **349,563 data rows**, **78 columns**, no ragged rows.
- **Line endings: LF** (not CRLF). No normalization needed.
- **File ends with a trailing newline.**
- Encoding: ASCII.

### Critical formatting discoveries

These four drive every decision downstream.

1. **The header row is UNQUOTED; every data field is QUOTED — including empties as `""`.**
   Row 2 begins `"2017","62-1532940","Department of Housing..."`.
   Postgres's default CSV export quotes only when necessary, so a default export will
   NOT match. You need `FORCE_QUOTE *`, which quotes all data fields but leaves the
   header unquoted — exactly reproducing this asymmetry.

2. **NULL vs empty string is the central round-trip problem.** A quoted `""` reads as
   an empty *string*. But once a column is cast to `integer`/`numeric`, empties must
   become NULL — and Postgres writes NULL as an *unquoted* empty field, which
   `FORCE_QUOTE` does not touch. The export must therefore wrap every column as
   `COALESCE(col::text, '') AS col` so NULLs come back as quotable empty strings.

3. **The float columns are already float32 artifacts stored as strings.**
   `minority_population` = `27.829999923706055`, `tract_to_msamd_income` =
   `144.7100067138672` — up to 17 decimal places (histogram: 1–17 places).
   `numeric` preserves the input scale exactly and round-trips. `real` would print
   `27.83`. This is the rubric's "lose precision on the floating point numbers" trap,
   confirmed present in the data.

4. **Three columns are zero-padded fixed-width** — casting them to a number and back
   silently destroys the padding:
   | Column | Format | Always | Example |
   |---|---|---|---|
   | `respondent_id` | 10 chars, mixed | 10/10 | `0000026647`, `62-1532940` |
   | `census_tract_number` | `NNNN.NN` | 7/7 | `0049.00`, `6035.06` |
   | `rate_spread` | `NN.NN` | 5/5 | `01.50`, `04.95` |

   `respondent_id` must be `text` (it contains hyphens). The other two are each
   uniformly fixed-width, so you may either keep them `text`, or use the proper
   numeric type and re-pad on export with `lpad(col::text, 7, '0')` /
   `lpad(col::text, 5, '0')`. The second is the stronger answer for the type rubric.

### Four columns are 100% empty in this file

`edit_status_name`, `edit_status`, `application_date_indicator`, and —
importantly — **`sequence_number`**.

This explains the assignment's wording. The HMDA column `sequence_number` ships blank;
you *fill* it with 1..349563 in file order and make it the primary key.

**Judgment call to document in the README:** the spec says the export script must
include "removal of the sequence number." Physically dropping the column would leave
77 columns and break the header, so `diff` would fail. The correct reading is to keep
the column in position 71 and emit it as empty (`'' AS sequence_number`), matching the
original file. Say so explicitly in README §1 or §3.

### Verified per-column type decisions

- `text`: all 25 `*_name` label columns, `agency_abbr`, `state_name`, `state_abbr`,
  `county_name`, `msamd_name`, `respondent_id`, and the three all-empty columns.
- `integer`: `as_of_year`, `agency_code`, `loan_type`, `property_type`,
  `loan_purpose`, `owner_occupancy`, `loan_amount_000s` (max 260000),
  `preapproval`, `action_taken`, `msamd`, `state_code`, `county_code`,
  all race/ethnicity/sex codes, `applicant_income_000s` (max 7,073,040),
  `purchaser_type`, `denial_reason_1..3`, `hoepa_status`, `lien_status`,
  `population`, `hud_median_family_income`, `number_of_owner_occupied_units`,
  `number_of_1_to_4_family_units`, `sequence_number` (the new PK).
- `numeric`: `minority_population`, `tract_to_msamd_income`, plus `rate_spread` and
  `census_tract_number` if you take the lpad-on-export route.

### Cardinality facts useful for the ER diagram

- `msamd`, `county_code`, `census_tract_number` are empty on ~0.2% of rows → the
  Loan→Location relationship is **optional** (zero-or-one), not mandatory. Mark it.
- `applicant_income_000s` empty on 14.5% of rows.
- `applicant_race_2` populated on 0.5%, `_3` on <0.05%, `_4`/`_5` on a handful →
  the one-to-many Race modeling is justified by the data, not just by theory.
- `denial_reason_1` populated on 10.6% of rows (only denials have one), `_2` on 2.0%,
  `_3` on 0.3%.
- `state_name`/`state_abbr`/`state_code` are single-valued (New Jersey / NJ / 34) —
  still must appear somewhere in the diagram.
- Distinct code values per field are all small and closed (e.g. `action_taken` 1–8,
  `purchaser_type` 0–9, `denial_reason` 1–9) → clean lookup entities.

## 2. Senior-DB-engineer review — where the points actually go

These are the traps. Treat each as a checklist item.

### ER diagram (2 pts)

- The rubric gives **zero** for: any cardinality mistake, any missing notation,
  inventing any attribute other than `locationID`, or adding/removing more than 1–2
  attributes. Unusually harsh — completeness beats elegance here.
- Every CSV column must appear in **at least one** table. Build the coverage checklist
  mechanically from the real header (command above) and tick each one off.
- Crow's foot / Oracle notation only, from the Oracle link on the course slides.
  Correct-but-wrong-notation caps the score at 1.25.
- **draw.io is mandatory.** Export to PDF for submission; keep the `.drawio` source.
- Target 10–15 entities. Natural decomposition: Loan/Application (the fact), Applicant,
  CoApplicant, Institution/Respondent, Agency, Location (tract / county / MSA — this is
  where `locationID` earns its keep), CensusTract demographics, Action, DenialReason
  (1..3 → a real one-to-many), Race (applicant_race_1..5 → one-to-many), Ethnicity,
  Sex, LoanType, PropertyType, Purpose, LienStatus, HOEPAStatus, PurchaserType.
- The repeating groups (`applicant_race_1..5`, `denial_reason_1..3`) are the single
  most-tested judgment call. Modeling them as separate one-to-many entities is the
  defensible answer, and it is the same reasoning that reappears in the next project's
  normalization step.
- The `_name`/code pairs are a lookup-table pattern: the code is the FK, the name is
  the lookup's descriptive attribute. Keeping both on the fact table is the
  denormalized answer — acceptable under this project's "each table = a real-world
  entity" wording, but state which rule you applied in README §3.
- Normalization is explicitly **not** required yet. Don't over-engineer.

### PostgreSQL load (2 pts)

- Table must be named `Preliminary`. Postgres folds unquoted identifiers to lowercase
  (`preliminary`). Do **not** create it as `"Preliminary"` with quotes — you will fight
  the quoting forever afterwards.
- Strategy the spec recommends and I endorse: load **everything as `text`** first, then
  `ALTER TABLE ... ALTER COLUMN ... TYPE ... USING ...`. A directly-typed COPY will die
  on the first empty field.
- **Types are graded.** `text` for sentences and labels, `integer` for counts and
  codes, `numeric` for money and rates. **Use `numeric`, never `real` /
  `double precision`, for `rate_spread`, `tract_to_msamd_income`,
  `minority_population`** — the rubric docks a full point for "losing precision on the
  floating point numbers", and binary floats will not round-trip to a byte-identical
  CSV.
- Empty strings in the CSV are **not** NULL on a text load. Either use
  `WITH (FORMAT CSV, HEADER, NULL '')`, or handle `''` in the USING clause:
  `USING NULLIF(col, '')::numeric`. Getting this wrong is the usual cause of
  `invalid input syntax for type integer: ""`.
- `census_tract_number` looks numeric but is a formatted code (e.g. `0001.00`) — keep
  it `text`, or you destroy the trailing zeros and break the round-trip.
- `respondent_id` is a code with leading zeros. **`text`.** Same for any `*_code` you
  are tempted to make an integer.
- `sequence_number` must become the **primary key with sequential numbers**, keeping
  the original column name. Note the subtlety: HMDA already ships a `sequence_number`
  column, and the spec wants it *replaced* by a generated sequential PK. Assign it in
  the CSV's original row order (see below) and document the choice in the README.
- **Round-trip fidelity is the real test.** `diff original.csv exported.csv` must be
  empty. What breaks it:
  - *Row order* — you need a deterministic order, which is exactly why the PK is
    assigned in file order, so the export is `ORDER BY sequence_number`.
  - *The `sequence_number` column itself* must be excluded from the export
    (`\copy (SELECT <all other cols> ...) TO ...`). Leaving it in is an explicit
    1.5-point deduction in the rubric.
  - *Header row* must match exactly → `WITH (FORMAT CSV, HEADER)`.
  - *NULL rendering* must be an empty unquoted field → `NULL ''` on the way out too.
  - *Quoting* — Postgres quotes only when needed; if the source CSV quotes more
    aggressively, `FORCE_QUOTE` the affected columns.
  - *Line endings / trailing newline* — the CFPB file may be CRLF. Check with
    `file hmda.csv` and `head -1 hmda.csv | xxd | tail -2`. Normalize once, up front,
    and say so in the README.
- Use `\copy` (psql, client-side), **not** `COPY` — you don't have server-filesystem
  rights on the shared iLab Postgres.
- Scripts run with `\i script.sql` from the directory you launched `postgres` from.
- Graders may inspect the live iLab database. Leave `preliminary` populated in the
  database of whichever teammate is named in README §5.

### Submission checklist

- [ ] ER diagram as **PDF** (exported from draw.io)
- [ ] Screenshots of `SELECT X,Y,Z FROM Preliminary;` covering **every** attribute
      (~78 columns → plan on 15–25 screenshots at 3–5 columns each; generate the
      SELECT list from the header so no column is skipped)
- [ ] `load.sql` — creates the table, loads the CSV, adds the sequence_number PK
- [ ] `export.sql` — writes the CSV back out, minus sequence_number
- [ ] `README.txt` with sections 0–5 exactly as listed in the spec
- [ ] Both teammates' full names and netids (§0)
- [ ] §5 names whose iLab database holds the data

### Honesty policy

AI is permitted, but the work must comply with *every* part of the spec or a
significant penalty applies. Cite any copied code, including from official Postgres
docs. A fully-explained bug in the README earns half credit — so write real
known-issues notes rather than hiding problems.

---

## 3. Environment (from Recitation 2)

```bash
ssh <netid>@ilab.cs.rutgers.edu        # or a named box: basic / cave / command / meltdown
                                       # load: https://report.cs.rutgers.edu/nagiosnotes/iLab-machines.html
scp hmda_2017_nj.csv <netid>@ilab.cs.rutgers.edu:~/cs336/
postgres                               # course script; drops you into psql on your netid DB
```

Inside psql: `\i script.sql`, `\d preliminary`, `\copy`, `\timing`, `\q`.
The iLab filesystem is shared, so any machine sees your files. The CSV is large — mind
your home quota and `gzip` it when idle.

---

## 4. Skills worth pulling in

Available Claude Code skills that map onto real work here. Load only what the task at
hand needs.

### Directly useful

| Skill | Use it for |
|---|---|
| `engineering-skills:senior-data-engineer` | The core one. Data modeling, CSV→database ingestion, type inference, data-quality checks, row-count/checksum reconciliation. Best fit for the load + round-trip half. |
| `engineering-skills:senior-backend` | PostgreSQL specifics — DDL, `COPY` semantics, indexing, query tuning. Second opinion on the type decisions. |
| `engineering-skills:senior-architect` | Entity decomposition and the "which attributes belong to which entity" argument; also emits Mermaid/PlantUML for a fast draft before redrawing in draw.io. |
| `pdf` | Reading the CFPB field-definition PDFs and the two course PDFs; assembling the final ER-diagram PDF if needed. |
| `artifact-diagramming` | Diagram craft — crow's-foot conventions, layouts that stay legible. Reason with it, then reproduce in draw.io (which the spec mandates). |
| `engineering-skills:senior-data-scientist` | README §3, "what useful insights can you get from this data?" — denial rates by tract income, approval disparities, loan-amount-to-income ratios. |
| `engineering-skills:code-reviewer` | Pre-submission review of `load.sql` / `export.sql`. |
| `engineering-skills:adversarial-reviewer` | A deliberately hostile pass over the ER diagram against the zero-point rubric conditions before submitting. High value given how punishing that rubric is. |
| `dataviz` | Only if you include a chart in the insights write-up. Not required. |

### Situationally useful

- `engineering-skills:tech-stack-evaluator` — if you compare `numeric` vs float
  handling, or psql vs a Python loader.
- `skill-creator` — to package a reusable "HMDA load" skill for Project 2.
- `init` — to regenerate/extend this file as the project moves into normalization.

### Not applicable (listed so we don't waste time)

The cloud-architect skills (AWS/Azure/GCP), all security skills (pen-testing, red team,
threat detection, incident response, AI security), Stripe, email templates,
frontend/QA/Playwright, ML/CV/prompt engineering. Nothing here is deployed or networked
beyond ssh to iLab.

### Non-Claude tooling that matters

- **draw.io** desktop or app.diagrams.net — mandatory for the diagram.
- `psql` on iLab: `\copy`, `\i`, `\d`.
- `csvkit` (`csvstat`, `csvcut`) or plain `awk` for profiling column types before DDL.
- `diff`, `md5sum`, `wc -l`, `xxd`, `file` for the round-trip proof.

---

## 5. Suggested order of work

1. Download the NJ 2017 all-records CSV plus the field-definition PDFs. Record the
   exact filename and download options for the README.
2. `head -1 | tr ',' '\n' | nl` → the authoritative column list. Everything downstream
   keys off that file, not off memory.
3. Profile each column (`csvstat`, or `SELECT DISTINCT` after the all-text load) and
   decide `text` / `integer` / `numeric` per column. Write the decision table down; it
   feeds both the DDL and the ER diagram.
4. Build `load.sql`: CREATE TABLE preliminary (all text) → `\copy` → ALTER TYPEs → add
   the `sequence_number` PK in file order.
5. Build `export.sql`: `\copy (SELECT <cols minus sequence_number> FROM preliminary
   ORDER BY sequence_number) TO ... WITH (FORMAT CSV, HEADER, NULL '')`.
6. `diff` until byte-identical. Do not move on until it is clean.
7. Draw the ER diagram in draw.io from the column decision table, ticking off coverage.
8. Screenshot every attribute from `Preliminary`.
9. Write `README.txt` sections 0–5 honestly, including anything still broken.
