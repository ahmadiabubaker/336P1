"""Stream-profile the HMDA CSV without loading it into memory."""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path


INTEGER = re.compile(r"^[+-]?\d+$")


def main() -> int:
    csv_path = Path(sys.argv[1] if len(sys.argv) > 1 else "hmda_2017_nj_all-records_labels.csv")

    with csv_path.open("r", encoding="utf-8-sig", newline="") as source:
        reader = csv.reader(source)
        header = next(reader)
        stats = [
            {
                "name": name,
                "blank": 0,
                "nonblank": 0,
                "min_length": None,
                "max_length": 0,
                "all_integer": True,
                "all_numeric": True,
                "leading_zero_integer": 0,
                "max_decimal_scale": 0,
                "values": Counter(),
                "samples": [],
            }
            for name in header
        ]

        rows = 0
        malformed_rows = 0
        for rows, row in enumerate(reader, start=1):
            if len(row) != len(header):
                malformed_rows += 1
                continue

            for column, value in zip(stats, row):
                if value == "":
                    column["blank"] += 1
                    continue

                column["nonblank"] += 1
                length = len(value)
                column["min_length"] = length if column["min_length"] is None else min(column["min_length"], length)
                column["max_length"] = max(column["max_length"], length)

                is_integer = INTEGER.fullmatch(value) is not None
                column["all_integer"] = column["all_integer"] and is_integer
                if is_integer and len(value.lstrip("+-")) > 1 and value.lstrip("+-").startswith("0"):
                    column["leading_zero_integer"] += 1

                try:
                    Decimal(value)
                    if "." in value:
                        column["max_decimal_scale"] = max(column["max_decimal_scale"], len(value.partition(".")[2]))
                except InvalidOperation:
                    column["all_numeric"] = False

                if len(column["values"]) <= 25:
                    column["values"][value] += 1
                if len(column["samples"]) < 5 and value not in column["samples"]:
                    column["samples"].append(value)

    with csv_path.open("rb") as source:
        crlf = lf = cr = 0
        previous = b""
        while chunk := source.read(1024 * 1024):
            data = previous + chunk
            crlf += data.count(b"\r\n")
            lf += data.count(b"\n")
            cr += data.count(b"\r")
            previous = data[-1:] if data.endswith(b"\r") else b""

    result = {
        "file": str(csv_path),
        "bytes": csv_path.stat().st_size,
        "rows": rows,
        "columns": len(header),
        "malformed_rows": malformed_rows,
        "line_endings": {"crlf": crlf, "bare_lf": lf - crlf, "bare_cr": cr - crlf},
        "columns_profile": [],
    }

    for column in stats:
        values = column.pop("values")
        column["distinct_values"] = dict(values) if len(values) <= 25 else None
        if column["nonblank"] == 0:
            column["all_integer"] = False
            column["all_numeric"] = False
        result["columns_profile"].append(column)

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
