"""Deprecated entry point.

Unit assignment must follow the progression-gate standard:
the primary unit is the latest unit a student must complete to answer the item.
Do not use keyword-count classification to rewrite question banks.
"""

import sys

print(
    "scripts/classify_units.py is deprecated and intentionally does not edit data.\n"
    "Use `npm run validate:units` for progression-gate checks, then make reviewed data edits explicitly.",
    file=sys.stderr,
)
sys.exit(1)
