const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const csvName = 'hmda_2017_nj_all-records_labels.csv';
const csvPath = path.join(root, csvName);

function readHeader(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(65536);
  const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);
  return buffer.subarray(0, bytes).toString('utf8').split(/\r?\n/, 1)[0]
    .replace(/^\uFEFF/, '')
    .split(',')
    .map((value) => value.replace(/^"|"$/g, ''));
}

const columns = readHeader(csvPath);
if (columns.length !== 78 || !columns.includes('sequence_number')) {
  throw new Error(`Expected the 78-column HMDA header; found ${columns.length} columns.`);
}

const numericColumns = new Set([
  'rate_spread',
  'minority_population',
  'tract_to_msamd_income',
]);

const textColumns = new Set([
  'respondent_id',
  'agency_name',
  'agency_abbr',
  'loan_type_name',
  'property_type_name',
  'loan_purpose_name',
  'owner_occupancy_name',
  'preapproval_name',
  'action_taken_name',
  'msamd_name',
  'state_name',
  'state_abbr',
  'county_name',
  'census_tract_number',
  'applicant_ethnicity_name',
  'co_applicant_ethnicity_name',
  'applicant_race_name_1',
  'applicant_race_name_2',
  'applicant_race_name_3',
  'applicant_race_name_4',
  'applicant_race_name_5',
  'co_applicant_race_name_1',
  'co_applicant_race_name_2',
  'co_applicant_race_name_3',
  'co_applicant_race_name_4',
  'co_applicant_race_name_5',
  'applicant_sex_name',
  'co_applicant_sex_name',
  'purchaser_type_name',
  'denial_reason_name_1',
  'denial_reason_name_2',
  'denial_reason_name_3',
  'hoepa_status_name',
  'lien_status_name',
  'edit_status_name',
]);

const columnType = Object.fromEntries(columns.map((column) => [
  column,
  textColumns.has(column) ? 'text' : numericColumns.has(column) ? 'numeric' : 'integer',
]));

const unexpectedText = columns.filter((column) => columnType[column] === 'text' && !textColumns.has(column));
if (unexpectedText.length) {
  throw new Error(`Unclassified text columns: ${unexpectedText.join(', ')}`);
}

const stageDefinitions = columns.map((column) => `    ${column} text`).join(',\n');
const finalDefinitions = columns.map((column) => {
  const primaryKey = column === 'sequence_number' ? ' PRIMARY KEY' : '';
  return `    ${column} ${columnType[column]}${primaryKey}`;
}).join(',\n');

const insertExpressions = columns.map((column) => {
  if (column === 'sequence_number') return '    load_order::integer AS sequence_number';
  if (columnType[column] === 'text') return `    ${column}`;
  return `    NULLIF(${column}, '')::${columnType[column]} AS ${column}`;
}).join(',\n');

const loadSql = `-- CS336 Project 1: load the 2017 New Jersey HMDA CSV into PostgreSQL.
-- Run from the directory containing this script and ${csvName}:
--     postgres
--     \\i load.sql
--
-- References consulted:
-- https://www.postgresql.org/docs/current/sql-copy.html
-- https://www.postgresql.org/docs/current/datatype-numeric.html

\\set ON_ERROR_STOP on
\\timing on

DROP TABLE IF EXISTS preliminary;
DROP TABLE IF EXISTS preliminary_stage;

-- The staging table accepts the CSV exactly as supplied. load_order is generated
-- during \\copy so the source row order can be reconstructed deterministically.
CREATE TEMP TABLE preliminary_stage (
${stageDefinitions},
    load_order bigint GENERATED ALWAYS AS IDENTITY
);

-- \\copy is intentionally used instead of server-side COPY because the CSV lives
-- in the student's iLab home directory, not in PostgreSQL's server filesystem.
\\copy preliminary_stage (${columns.join(', ')}) FROM '${csvName}' WITH (FORMAT CSV, HEADER true, ENCODING 'UTF8');

CREATE TABLE preliminary (
${finalDefinitions}
);

-- Quoted empty CSV fields arrive in staging as empty text. NULLIF converts empty
-- numeric fields to SQL NULL before casting. The source sequence_number column is
-- blank in every row, so it is replaced by load_order as required by the project.
INSERT INTO preliminary (
${columns.map((column) => `    ${column}`).join(',\n')}
)
SELECT
${insertExpressions}
FROM preliminary_stage
ORDER BY load_order;

ANALYZE preliminary;

-- These checks should report 349563 rows, a range of 1..349563, and 349563
-- distinct sequence numbers.
SELECT
    COUNT(*) AS row_count,
    MIN(sequence_number) AS first_sequence_number,
    MAX(sequence_number) AS last_sequence_number,
    COUNT(DISTINCT sequence_number) AS distinct_sequence_numbers
FROM preliminary;

\\d preliminary
`;

const exportColumns = columns.filter((column) => column !== 'sequence_number');
const exportExpressions = exportColumns.map((column) => {
  if (column === 'rate_spread') {
    // The source stores values such as 01.90; numeric output alone would emit 1.90.
    return `COALESCE(to_char(rate_spread, 'FM00.00'), '') AS rate_spread`;
  }
  if (columnType[column] === 'text') return `COALESCE(${column}, '') AS ${column}`;
  return `COALESCE(${column}::text, '') AS ${column}`;
}).join(', ');

const exportName = 'hmda_2017_nj_roundtrip_without_sequence.csv';
const exportSql = `-- CS336 Project 1: export Preliminary back to the source CSV shape.
-- Run after load.sql in psql:
--     \\i export.sql
--
-- The assignment explicitly requests removal of sequence_number. The source file
-- contains that column but every value is blank, so this output has 77 columns.
-- FORCE_QUOTE reproduces the source file's all-fields-quoted data rows. Each typed
-- NULL is converted to empty text first so it is emitted as "" rather than an
-- unquoted empty field. ORDER BY restores the original input order.
--
-- Reference: https://www.postgresql.org/docs/current/sql-copy.html

\\set ON_ERROR_STOP on
\\timing on

-- psql backslash commands end at a newline, so the complete \\copy command must
-- remain on the following single line.
\\copy (SELECT ${exportExpressions} FROM preliminary ORDER BY sequence_number) TO '${exportName}' WITH (FORMAT CSV, HEADER true, FORCE_QUOTE *);

\\echo Exported ${exportName}
`;

const screenshotQueries = columns.reduce((groups, column, index) => {
  const groupIndex = Math.floor(index / 3);
  if (!groups[groupIndex]) groups[groupIndex] = [];
  groups[groupIndex].push(column);
  return groups;
}, []).map((group, index) => [
  `-- Screenshot ${index + 1}: columns ${index * 3 + 1}-${index * 3 + group.length}`,
  `SELECT ${group.join(', ')} FROM preliminary ORDER BY sequence_number LIMIT 10;`,
  '',
].join('\n')).join('\n');

fs.writeFileSync(path.join(root, 'load.sql'), loadSql, 'utf8');
fs.writeFileSync(path.join(root, 'export.sql'), exportSql, 'utf8');
fs.writeFileSync(path.join(root, 'screenshot_queries.sql'), `-- Each CSV attribute appears in exactly one screenshot query.\n\\pset null '[NULL]'\n\n${screenshotQueries}`, 'utf8');

console.log('Generated load.sql, export.sql, and screenshot_queries.sql');
console.log(`Columns: ${columns.length}; export columns: ${exportColumns.length}; screenshot queries: ${Math.ceil(columns.length / 3)}`);
