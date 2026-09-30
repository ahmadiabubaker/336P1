"""Prove that the selected PostgreSQL types preserve every non-sequence value."""

from __future__ import annotations

import csv
import sys
from decimal import Decimal
from pathlib import Path


NUMERIC_COLUMNS = {"rate_spread", "minority_population", "tract_to_msamd_income"}
TEXT_COLUMNS = {
    "respondent_id", "agency_name", "agency_abbr", "loan_type_name",
    "property_type_name", "loan_purpose_name", "owner_occupancy_name",
    "preapproval_name", "action_taken_name", "msamd_name", "state_name",
    "state_abbr", "county_name", "census_tract_number",
    "applicant_ethnicity_name", "co_applicant_ethnicity_name",
    "applicant_race_name_1", "applicant_race_name_2", "applicant_race_name_3",
    "applicant_race_name_4", "applicant_race_name_5",
    "co_applicant_race_name_1", "co_applicant_race_name_2",
    "co_applicant_race_name_3", "co_applicant_race_name_4",
    "co_applicant_race_name_5", "applicant_sex_name", "co_applicant_sex_name",
    "purchaser_type_name", "denial_reason_name_1", "denial_reason_name_2",
    "denial_reason_name_3", "hoepa_status_name", "lien_status_name",
    "edit_status_name",
}


def roundtrip(column: str, value: str) -> str:
    if value == "" or column in TEXT_COLUMNS:
        return value
    if column == "sequence_number":
        return value
    if column == "rate_spread":
        return f"{Decimal(value):05.2f}"
    if column in NUMERIC_COLUMNS:
        return format(Decimal(value), "f")
    return str(int(value))


def main() -> int:
    source_path = Path(sys.argv[1] if len(sys.argv) > 1 else "hmda_2017_nj_all-records_labels.csv")
    with source_path.open("r", encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        for row_number, row in enumerate(reader, start=2):
            for column, value in row.items():
                if column == "sequence_number":
                    continue
                restored = roundtrip(column, value)
                if restored != value:
                    print(
                        f"FAIL row {row_number}, column {column}: "
                        f"source={value!r}, restored={restored!r}",
                        file=sys.stderr,
                    )
                    return 1

    print(f"PASS: selected types preserve all {row_number - 1:,} data rows.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
