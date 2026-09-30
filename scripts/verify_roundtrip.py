"""Byte-verify the PostgreSQL export against the source with sequence_number removed."""

from __future__ import annotations

import csv
import io
import sys
from pathlib import Path


DEFAULT_SOURCE = "hmda_2017_nj_all-records_labels.csv"
DEFAULT_EXPORT = "hmda_2017_nj_roundtrip_without_sequence.csv"


def serialize_row(row: list[str]) -> str:
    buffer = io.StringIO(newline="")
    csv.writer(buffer, lineterminator="\n", quoting=csv.QUOTE_ALL).writerow(row)
    return buffer.getvalue()


def main() -> int:
    source_path = Path(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SOURCE)
    export_path = Path(sys.argv[2] if len(sys.argv) > 2 else DEFAULT_EXPORT)

    with (
        source_path.open("r", encoding="utf-8-sig", newline="") as source,
        export_path.open("r", encoding="utf-8", newline="") as exported,
    ):
        reader = csv.reader(source)
        source_header = next(reader)
        try:
            sequence_index = source_header.index("sequence_number")
        except ValueError:
            print("ERROR: source header has no sequence_number column", file=sys.stderr)
            return 2

        expected_header = source_header[:sequence_index] + source_header[sequence_index + 1 :]
        actual_header_line = exported.readline()
        expected_header_line = ",".join(expected_header) + "\n"
        if actual_header_line != expected_header_line:
            print("ERROR: exported header or header quoting does not match", file=sys.stderr)
            print(f"Expected: {expected_header_line.rstrip()}", file=sys.stderr)
            print(f"Actual:   {actual_header_line.rstrip()}", file=sys.stderr)
            return 1

        row_count = 0
        for row_count, source_row in enumerate(reader, start=1):
            expected_row = source_row[:sequence_index] + source_row[sequence_index + 1 :]
            expected_line = serialize_row(expected_row)
            actual_line = exported.readline()
            if actual_line != expected_line:
                print(f"ERROR: first byte-level mismatch is data row {row_count}", file=sys.stderr)
                try:
                    actual_row = next(csv.reader([actual_line]))
                    for index, (expected, actual) in enumerate(zip(expected_row, actual_row)):
                        if expected != actual:
                            print(
                                f"Column {index + 1} ({expected_header[index]}): "
                                f"expected {expected!r}, got {actual!r}",
                                file=sys.stderr,
                            )
                            break
                except (csv.Error, StopIteration):
                    pass
                return 1

        extra_line = exported.readline()
        if extra_line != "":
            print(f"ERROR: export contains rows after expected row {row_count}", file=sys.stderr)
            return 1

    print(
        f"PASS: {row_count:,} rows are byte-identical after removing "
        "sequence_number from the source schema."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
