const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CSV_PATH = path.join(ROOT, 'hmda_2017_nj_all-records_labels.csv');
const DRAWIO_PATH = path.join(ROOT, 'HMDA_2017_NJ_ER_Diagram.drawio');
const SVG_PATH = path.join(ROOT, 'HMDA_2017_NJ_ER_Diagram_Preview.svg');

function readHeader(csvPath) {
  const fd = fs.openSync(csvPath, 'r');
  const buffer = Buffer.alloc(65536);
  const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);
  const firstLine = buffer.subarray(0, bytes).toString('utf8').split(/\r?\n/, 1)[0];
  return firstLine.replace(/^\uFEFF/, '').split(',').map((value) => value.replace(/^"|"$/g, ''));
}

const entities = [
  {
    id: 'agency', title: 'REGULATORY AGENCY', x: 50, y: 120, w: 360, h: 175,
    attributes: ['agency_name', 'agency_abbr', 'agency_code'],
    keys: new Set(['agency_code']),
  },
  {
    id: 'institution', title: 'FINANCIAL INSTITUTION', x: 500, y: 145, w: 360, h: 125,
    attributes: ['respondent_id'],
    keys: new Set(['respondent_id']),
  },
  {
    id: 'loan', title: 'LOAN DETAILS', x: 1050, y: 90, w: 520, h: 365,
    attributes: [
      'loan_type_name', 'loan_type', 'loan_purpose_name', 'loan_purpose',
      'loan_amount_000s', 'rate_spread', 'hoepa_status_name', 'hoepa_status',
      'lien_status_name', 'lien_status',
    ],
    keys: new Set(),
  },
  {
    id: 'property', title: 'PROPERTY', x: 1780, y: 120, w: 480, h: 205,
    attributes: ['property_type_name', 'property_type', 'owner_occupancy_name', 'owner_occupancy'],
    keys: new Set(),
  },
  {
    id: 'applicant', title: 'APPLICANT', x: 55, y: 520, w: 600, h: 510,
    attributes: [
      'applicant_ethnicity_name', 'applicant_ethnicity',
      'applicant_race_name_1', 'applicant_race_1',
      'applicant_race_name_2', 'applicant_race_2',
      'applicant_race_name_3', 'applicant_race_3',
      'applicant_race_name_4', 'applicant_race_4',
      'applicant_race_name_5', 'applicant_race_5',
      'applicant_sex_name', 'applicant_sex', 'applicant_income_000s',
    ],
    keys: new Set(),
  },
  {
    id: 'application', title: 'LOAN APPLICATION', x: 1100, y: 800, w: 500, h: 305,
    attributes: [
      'sequence_number', 'as_of_year', 'preapproval_name', 'preapproval',
      'application_date_indicator', 'edit_status_name', 'edit_status',
    ],
    keys: new Set(['sequence_number']),
  },
  {
    id: 'coapplicant', title: 'CO-APPLICANT', x: 55, y: 1180, w: 600, h: 485,
    attributes: [
      'co_applicant_ethnicity_name', 'co_applicant_ethnicity',
      'co_applicant_race_name_1', 'co_applicant_race_1',
      'co_applicant_race_name_2', 'co_applicant_race_2',
      'co_applicant_race_name_3', 'co_applicant_race_3',
      'co_applicant_race_name_4', 'co_applicant_race_4',
      'co_applicant_race_name_5', 'co_applicant_race_5',
      'co_applicant_sex_name', 'co_applicant_sex',
    ],
    keys: new Set(),
  },
  {
    id: 'location', title: 'PROPERTY LOCATION', x: 2050, y: 650, w: 550, h: 355,
    attributes: [
      'locationID', 'msamd_name', 'msamd', 'state_name', 'state_abbr', 'state_code',
      'county_name', 'county_code', 'census_tract_number',
    ],
    keys: new Set(['locationID']),
  },
  {
    id: 'census', title: 'CENSUS TRACT PROFILE', x: 2460, y: 1210, w: 540, h: 285,
    attributes: [
      'population', 'minority_population', 'hud_median_family_income',
      'tract_to_msamd_income', 'number_of_owner_occupied_units',
      'number_of_1_to_4_family_units',
    ],
    keys: new Set(),
  },
  {
    id: 'outcome', title: 'APPLICATION OUTCOME', x: 1150, y: 1400, w: 440, h: 155,
    attributes: ['action_taken_name', 'action_taken'],
    keys: new Set(),
  },
  {
    id: 'purchaser', title: 'PURCHASER CATEGORY', x: 690, y: 1820, w: 440, h: 155,
    attributes: ['purchaser_type_name', 'purchaser_type'],
    keys: new Set(['purchaser_type']),
  },
  {
    id: 'denial', title: 'DENIAL DETAILS', x: 1800, y: 1740, w: 520, h: 270,
    attributes: [
      'denial_reason_name_1', 'denial_reason_1', 'denial_reason_name_2',
      'denial_reason_2', 'denial_reason_name_3', 'denial_reason_3',
    ],
    keys: new Set(),
  },
];

const relationships = [
  { id: 'r1', source: 'agency', target: 'institution', label: 'regulates', sourceCard: '1', targetCard: '0..*' },
  { id: 'r2', source: 'institution', target: 'application', label: 'reports', sourceCard: '1', targetCard: '0..*' },
  { id: 'r3', source: 'application', target: 'loan', label: 'describes', sourceCard: '1', targetCard: '1' },
  { id: 'r4', source: 'property', target: 'application', label: 'is subject of', sourceCard: '1', targetCard: '0..*' },
  { id: 'r5', source: 'applicant', target: 'application', label: 'submits', sourceCard: '1', targetCard: '0..*' },
  { id: 'r6', source: 'coapplicant', target: 'application', label: 'may join', sourceCard: '0..1', targetCard: '0..*' },
  { id: 'r7', source: 'location', target: 'property', label: 'contains', sourceCard: '1', targetCard: '0..*' },
  { id: 'r8', source: 'location', target: 'census', label: 'has profile', sourceCard: '1', targetCard: '0..1' },
  { id: 'r9', source: 'application', target: 'outcome', label: 'receives', sourceCard: '1', targetCard: '1' },
  { id: 'r10', source: 'purchaser', target: 'outcome', label: 'classifies', sourceCard: '1', targetCard: '0..*' },
  { id: 'r11', source: 'outcome', target: 'denial', label: 'may include', sourceCard: '1', targetCard: '0..1' },
];

const csvHeader = readHeader(CSV_PATH);
const mapped = entities.flatMap((entity) => entity.attributes).filter((name) => name !== 'locationID');
const duplicates = mapped.filter((name, index) => mapped.indexOf(name) !== index);
const missing = csvHeader.filter((name) => !mapped.includes(name));
const unexpected = mapped.filter((name) => !csvHeader.includes(name));

if (csvHeader.length !== 78 || mapped.length !== 78 || duplicates.length || missing.length || unexpected.length) {
  throw new Error(JSON.stringify({ csvColumns: csvHeader.length, mapped: mapped.length, duplicates, missing, unexpected }, null, 2));
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function entityHtml(entity) {
  const rows = entity.attributes.map((attribute) => {
    const prefix = entity.keys.has(attribute) ? '<b><u>PK</u></b>&nbsp;&nbsp;' : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    return `<div style="padding:3px 10px;border-top:1px solid #dbe7f3;font-family:Courier New;font-size:12px;">${prefix}${htmlEscape(attribute)}</div>`;
  }).join('');
  return `<div style="background-color:#1f4e78;color:#ffffff;font-weight:bold;font-size:16px;padding:9px;text-align:center;">${htmlEscape(entity.title)}</div>${rows}`;
}

function marker(cardinality) {
  if (cardinality === '0..*') return 'ERzeroToMany';
  if (cardinality === '0..1') return 'ERzeroToOne';
  if (cardinality === '1..*') return 'ERoneToMany';
  return 'ERone';
}

const cells = [];
cells.push('<mxCell id="0"/>');
cells.push('<mxCell id="1" parent="0"/>');
cells.push(`<mxCell id="title" value="${xmlEscape('<b>2017 NEW JERSEY HMDA — ENTITY-RELATIONSHIP DIAGRAM</b><br><font style="font-size:14px">Crow\'s Foot / Oracle notation · 78 of 78 CSV attributes represented</font>')}" style="text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=26;fontColor=#17365D;" vertex="1" parent="1"><mxGeometry x="500" y="10" width="2100" height="70" as="geometry"/></mxCell>`);

for (const entity of entities) {
  cells.push(`<mxCell id="${entity.id}" value="${xmlEscape(entityHtml(entity))}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#1f4e78;strokeWidth=2;shadow=1;align=left;verticalAlign=top;spacing=0;overflow=hidden;" vertex="1" parent="1"><mxGeometry x="${entity.x}" y="${entity.y}" width="${entity.w}" height="${entity.h}" as="geometry"/></mxCell>`);
}

for (const relation of relationships) {
  const style = [
    'edgeStyle=orthogonalEdgeStyle', 'rounded=0', 'orthogonalLoop=1', 'jettySize=auto',
    'html=1', 'strokeWidth=2', 'strokeColor=#475569',
    `startArrow=${marker(relation.sourceCard)}`, 'startFill=0',
    `endArrow=${marker(relation.targetCard)}`, 'endFill=0',
    'fontSize=12', 'fontStyle=1', 'fontColor=#334155', 'labelBackgroundColor=#ffffff',
  ].join(';') + ';';
  const label = `${relation.sourceCard}  ${relation.label}  ${relation.targetCard}`;
  cells.push(`<mxCell id="${relation.id}" value="${xmlEscape(label)}" style="${style}" edge="1" parent="1" source="${relation.source}" target="${relation.target}"><mxGeometry relative="1" as="geometry"/></mxCell>`);
}

const noteHtml = [
  '<b>MODEL NOTES</b>',
  '• Only locationID is newly introduced (explicitly allowed).',
  '• sequence_number is the required primary key for Preliminary.',
  '• Repeating race and denial columns remain visible for Project 1.',
  '• 0..1 means optional; 0..* means zero or many.',
  '• Applicant roles are anonymized; no applicant IDs were invented.',
].join('<br>');
cells.push(`<mxCell id="notes" value="${xmlEscape(noteHtml)}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#d6b656;strokeWidth=2;align=left;verticalAlign=top;spacing=14;fontSize=13;fontColor=#5d4a00;" vertex="1" parent="1"><mxGeometry x="2450" y="1710" width="520" height="250" as="geometry"/></mxCell>`);

const drawio = `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" modified="2026-09-27T00:00:00.000Z" agent="OpenAI Codex" version="26.0.16" type="device" compressed="false">\n  <diagram id="hmda-er-2017-nj" name="HMDA ER Diagram">\n    <mxGraphModel dx="1600" dy="1100" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="3100" pageHeight="2100" math="0" shadow="0" background="#f8fafc">\n      <root>\n        ${cells.join('\n        ')}\n      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n`;

fs.writeFileSync(DRAWIO_PATH, drawio, 'utf8');

function svgEscape(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const byId = Object.fromEntries(entities.map((entity) => [entity.id, entity]));

function boundaryPoint(from, to) {
  const cx = from.x + from.w / 2;
  const cy = from.y + from.h / 2;
  const tx = to.x + to.w / 2;
  const ty = to.y + to.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  const scale = 1 / Math.max(Math.abs(dx) / (from.w / 2), Math.abs(dy) / (from.h / 2));
  return { x: cx + dx * scale, y: cy + dy * scale };
}

const svg = [];
svg.push('<?xml version="1.0" encoding="UTF-8"?>');
svg.push('<svg xmlns="http://www.w3.org/2000/svg" width="3100" height="2100" viewBox="0 0 3100 2100">');
svg.push('<rect width="3100" height="2100" fill="#f8fafc"/>');
svg.push('<style>.title{font:700 30px Arial;fill:#17365d}.subtitle{font:16px Arial;fill:#475569}.entity-title{font:700 18px Arial;fill:white}.attr{font:15px Consolas,monospace;fill:#172033}.pk{font-weight:700;text-decoration:underline}.rel{font:700 14px Arial;fill:#334155;paint-order:stroke;stroke:white;stroke-width:6px;stroke-linejoin:round}</style>');
svg.push('<text x="1550" y="42" text-anchor="middle" class="title">2017 NEW JERSEY HMDA — ENTITY-RELATIONSHIP DIAGRAM</text>');
svg.push('<text x="1550" y="70" text-anchor="middle" class="subtitle">Crow\'s Foot / Oracle notation · 78 of 78 CSV attributes represented</text>');

for (const relation of relationships) {
  const source = byId[relation.source];
  const target = byId[relation.target];
  const p1 = boundaryPoint(source, target);
  const p2 = boundaryPoint(target, source);
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const sx = p1.x + dx / length * 28;
  const sy = p1.y + dy / length * 28;
  const ex = p2.x - dx / length * 28;
  const ey = p2.y - dy / length * 28;
  svg.push(`<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="#64748b" stroke-width="3"/>`);
  svg.push(`<text x="${sx.toFixed(1)}" y="${(sy - 8).toFixed(1)}" text-anchor="middle" class="rel">${svgEscape(relation.sourceCard)}</text>`);
  svg.push(`<text x="${ex.toFixed(1)}" y="${(ey - 8).toFixed(1)}" text-anchor="middle" class="rel">${svgEscape(relation.targetCard)}</text>`);
  svg.push(`<text x="${mx.toFixed(1)}" y="${(my - 10).toFixed(1)}" text-anchor="middle" class="rel">${svgEscape(relation.label)}</text>`);
}

for (const entity of entities) {
  svg.push(`<rect x="${entity.x}" y="${entity.y}" width="${entity.w}" height="${entity.h}" rx="10" fill="white" stroke="#1f4e78" stroke-width="3"/>`);
  svg.push(`<path d="M ${entity.x + 10} ${entity.y} H ${entity.x + entity.w - 10} Q ${entity.x + entity.w} ${entity.y} ${entity.x + entity.w} ${entity.y + 10} V ${entity.y + 44} H ${entity.x} V ${entity.y + 10} Q ${entity.x} ${entity.y} ${entity.x + 10} ${entity.y}" fill="#1f4e78"/>`);
  svg.push(`<text x="${entity.x + entity.w / 2}" y="${entity.y + 29}" text-anchor="middle" class="entity-title">${svgEscape(entity.title)}</text>`);
  entity.attributes.forEach((attribute, index) => {
    const y = entity.y + 70 + index * 27;
    const prefix = entity.keys.has(attribute) ? 'PK  ' : '    ';
    const klass = entity.keys.has(attribute) ? 'attr pk' : 'attr';
    svg.push(`<text x="${entity.x + 16}" y="${y}" class="${klass}">${svgEscape(prefix + attribute)}</text>`);
  });
}

svg.push('<rect x="2450" y="1710" width="520" height="250" rx="10" fill="#fff8e1" stroke="#d6b656" stroke-width="3"/>');
svg.push('<text x="2475" y="1745" class="attr pk">MODEL NOTES</text>');
[
  'Only locationID is newly introduced (allowed).',
  'sequence_number is the required primary key.',
  'Repeating race/denial fields remain visible.',
  '0..1 = optional; 0..* = zero or many.',
  'No applicant identifiers were invented.',
].forEach((line, index) => svg.push(`<text x="2475" y="${1780 + index * 34}" class="attr">• ${svgEscape(line)}</text>`));
svg.push('</svg>\n');
fs.writeFileSync(SVG_PATH, svg.join('\n'), 'utf8');

console.log(`Generated: ${path.basename(DRAWIO_PATH)}`);
console.log(`Generated: ${path.basename(SVG_PATH)}`);
console.log(`Coverage: ${mapped.length}/${csvHeader.length} CSV attributes; only added attribute: locationID`);
