CS336 Project 1 - HMDA 2017 New Jersey Data

0. Team Members

Team member 1: Abubaker Ahmadi, aa4095
Team member 2: [FULL NAME], [NETID]


1. Known Issues

There are no known issues in the submitted database loading or exporting code.
The source file contains 349,563 data records. load.sql successfully loaded all
349,563 records into Preliminary and assigned sequence_number values from 1 through
349,563 in the original file order. The sequence numbers are unique and the column
is the table's primary key.

The source sequence_number field is blank in every input record. As required by the
assignment, export.sql omits sequence_number from the exported schema. The streaming
verification script compared every exported record with the corresponding source
record after removing that source field. All 349,563 records and the remaining 77
fields passed a byte-for-byte comparison.


2. Collaboration, Resources, and References

Team collaboration:

- [DESCRIBE EACH TEAM MEMBER'S CONTRIBUTION.]
- [LIST ANY OTHER PEOPLE CONSULTED, OR WRITE "None" IF THERE WERE NONE.]

Resources consulted:

- The CS336 Project 1 handout was used for the required deliverables, Preliminary
  table requirements, sequence-number requirement, export requirement, and README
  format.
- The CS336 Recitation 2 slides were used for the Rutgers iLab, PostgreSQL, psql,
  \i, and \copy workflow.
- The Consumer Financial Protection Bureau HMDA 2017 Loan/Application Register
  record-format and code documentation was used to understand the meanings of the
  fields and coded values:
  https://files.consumerfinance.gov/hmda-historic-data-dictionaries/lar_record_format.pdf
  https://files.consumerfinance.gov/hmda-historic-data-dictionaries/lar_record_codes.pdf
- The official PostgreSQL COPY documentation was consulted for CSV loading,
  exporting, headers, NULL handling, and FORCE_QUOTE:
  https://www.postgresql.org/docs/current/sql-copy.html
- The official PostgreSQL numeric-type documentation was consulted when selecting
  exact numeric types for decimal data:
  https://www.postgresql.org/docs/current/datatype-numeric.html
- OpenAI Codex was used to review the assignment, profile the CSV, help draft the
  SQL and validation scripts, review test output, and draft this README. The
  generated work was inspected and tested on Rutgers iLab before submission.


3. Data Insights and Rules Used to Divide Attributes into Entities

Useful insights:

The dataset can be used to study residential mortgage activity in New Jersey during
2017. For example, it supports comparisons of loan purposes and amounts, originated
versus denied or withdrawn applications, denial reasons, purchaser types, property
and lien types, and lending activity by county, census tract, and metropolitan area.
The applicant and co-applicant race, ethnicity, sex, and income fields also make it
possible to examine whether application outcomes differ across demographic groups.
Those comparisons should be interpreted carefully because missing values, "not
applicable" codes, application characteristics, and geographic or income differences
can affect the results; the data alone does not establish causation or discrimination.

Entity-division rules:

- Attributes were grouped by the real-world object or event they describe, rather
  than being placed into one large entity.
- LOAN_APPLICATION represents the central mortgage application and contains facts
  about the loan and application event.
- RESPONDENT and AGENCY represent the reporting financial institution and its
  supervising agency.
- APPLICANT and CO_APPLICANT separate the two participant roles and their demographic
  attributes.
- LENDER_DECISION groups the action taken, denial reasons, and related decision
  information.
- PROPERTY represents property-related attributes, while LOCATION, COUNTY, STATE,
  and MSA_MD group geographic and census-tract information at their appropriate
  levels.
- PURCHASER represents the category of institution that purchased the loan.
- Code fields and their matching name fields were kept together because the code
  identifies a category and the name explains that category.
- Optional source values were modeled as optional attributes or relationships.
  Cardinalities were based on whether a record requires one related value or may
  have no related value.
- Repeating attributes, such as multiple race values and denial reasons, were kept
  with the real-world role or decision they describe. No new data attribute was
  invented except locationID, as permitted by the assignment.


4. Development Problems and Time Spent

The main challenge was loading a 266 MB CSV without losing information. Several
columns look numeric but are identifiers or formatted values. For example,
respondent_id and census_tract_number must remain text so that leading zeros and
formatting are preserved. Blank numeric fields also cannot be cast directly to
integer or numeric values. To handle this safely, load.sql first imports every CSV
field as text into a temporary staging table, converts empty strings to NULL for
typed numeric fields, and then inserts the converted data into Preliminary.

Another challenge was preserving the source row order while replacing the entirely
blank source sequence_number field. The staging table therefore generates load_order
during import, and that value becomes the sequential primary key. Exporting also
required explicit formatting so that NULLs, quoted fields, decimals such as
rate_spread, the header, and the original record order were reproduced consistently.
A streaming verifier was used because loading two copies of a file this large into
memory would be unnecessary and unreliable.

Approximate total team time spent: [ENTER TOTAL HOURS] hours.


5. Database Used for Grading

The populated Preliminary table is stored in team member aa4095's PostgreSQL
database on Rutgers iLab. The database contains 349,563 records and should be left
populated for grading.
