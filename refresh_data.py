"""Manually run the same ingestion jobs used by the daily API scheduler."""

import json

from Dashboard.data_pipeline import refresh_all


if __name__ == "__main__":
    result = refresh_all()
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if any(item.get("error") for item in result.values()):
        raise SystemExit(1)
