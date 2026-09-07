#!/usr/bin/env python3
"""
Check that every SQL migration parses cleanly with the real PostgreSQL grammar.

Uses pglast (libpg_query bindings). Catches syntax errors across the whole
supabase/migrations chain — including the Studio Booking Engine migration —
without needing a running database.

Usage:
    python3 scripts/check-migrations.py            # all supabase/migrations
    python3 scripts/check-migrations.py <paths...> # specific files

Runs in CI (job: migration-syntax) and locally. Exit code 1 on any failure.
"""
from __future__ import annotations

import sys
from pathlib import Path

try:
    import pglast
    from pglast import error as pglast_error
except ImportError:
    print(
        "pglast is required:  pip install pglast  (or --break-system-packages)",
        file=sys.stderr,
    )
    sys.exit(2)

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DIR = ROOT / "supabase" / "migrations"


def check_file(path: Path) -> list[str]:
    """Returns a list of error strings; empty means OK."""
    sql = path.read_text(encoding="utf-8")
    errors: list[str] = []
    try:
        pglast.parser.parse_sql(sql)
    except pglast_error.Error as exc:
        errors.append(str(exc).strip())
    except Exception as exc:  # noqa: BLE001 - report and continue
        errors.append(f"unexpected parser failure: {exc}")
    return errors


def main(argv: list[str]) -> int:
    if argv:
        files = [Path(a) for a in argv]
    else:
        files = sorted(DEFAULT_DIR.glob("*.sql"))

    if not files:
        print(f"no SQL files found under {DEFAULT_DIR}")
        return 1

    bad = 0
    for path in files:
        errors = check_file(path)
        if errors:
            bad += 1
            print(f"FAIL {path.relative_to(ROOT) if path.is_relative_to(ROOT) else path}")
            for e in errors:
                print(f"     {e}")
        else:
            print(f"ok   {path.relative_to(ROOT) if path.is_relative_to(ROOT) else path}")

    if bad:
        print(f"\n{len(files) - bad}/{len(files)} migration files parsed OK; {bad} FAILED")
        return 1
    print(f"\nall {len(files)} migration files parse OK")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
