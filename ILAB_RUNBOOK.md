# CS336 Project 1 — iLab Runbook

Keep the following files in the same iLab directory:

- `hmda_2017_nj_all-records_labels.csv`
- `load.sql`
- `export.sql`
- `screenshot_queries.sql`
- `scripts/verify_roundtrip.py`

## 1. Upload from Windows PowerShell

Replace `YOUR_NETID` with your Rutgers netid.

```powershell
ssh YOUR_NETID@ilab.cs.rutgers.edu "mkdir -p ~/cs336-project1/scripts"
scp "hmda_2017_nj_all-records_labels.csv" load.sql export.sql screenshot_queries.sql YOUR_NETID@ilab.cs.rutgers.edu:~/cs336-project1/
scp "scripts/verify_roundtrip.py" YOUR_NETID@ilab.cs.rutgers.edu:~/cs336-project1/scripts/
```

## 2. Load the database

```bash
ssh YOUR_NETID@ilab.cs.rutgers.edu
cd ~/cs336-project1
postgres
```

At the `psql` prompt:

```text
\i load.sql
```

The final check should report:

- `row_count = 349563`
- `first_sequence_number = 1`
- `last_sequence_number = 349563`
- `distinct_sequence_numbers = 349563`

Leave `preliminary` populated in the database named in README section 5.

## 3. Export and verify the round trip

Still at the `psql` prompt:

```text
\i export.sql
\q
```

Back at the Linux shell:

```bash
python3 scripts/verify_roundtrip.py \
  hmda_2017_nj_all-records_labels.csv \
  hmda_2017_nj_roundtrip_without_sequence.csv
```

Expected result:

```text
PASS: 349,563 rows are byte-identical after removing sequence_number from the source schema.
```

The source CSV has a blank `sequence_number` field in every record. The assignment asks
for that field to become the table's sequential primary key and then be removed from the
export, so the verifier compares the 77 remaining columns.

## 4. Capture the required screenshots

Start PostgreSQL again from `~/cs336-project1`, then run:

```text
\i screenshot_queries.sql
```

The script contains 26 queries with three attributes per query. Together they cover all
78 attributes exactly once. Capture the terminal output for every query.

## 5. Useful diagnostics

Inside `psql`:

```text
\d preliminary
SELECT COUNT(*) FROM preliminary;
SELECT * FROM preliminary ORDER BY sequence_number LIMIT 3;
```

From the Linux shell:

```bash
ls -lh hmda_2017_nj_all-records_labels.csv hmda_2017_nj_roundtrip_without_sequence.csv
wc -l hmda_2017_nj_all-records_labels.csv hmda_2017_nj_roundtrip_without_sequence.csv
```

Both files should contain 349,564 lines: one header plus 349,563 data records.
