"""
courts.go.jp 判例スクレイパー
professional-accountability DB対応版
"""
import asyncio, json, os, re
from dataclasses import dataclass, asdict, field
from datetime import datetime
from pathlib import Path
from typing import Optional
import asyncpg, httpx
from bs4 import BeautifulSoup

DB_URL = os.environ.get("DATABASE_URL",
    "postgresql://postgres:viwban-jushoK-3cezpe@"
    "professional-accountability-db.cfgiy2gi8ilj."
    "ap-northeast-1.rds.amazonaws.com:5432/postgres")

BASE_URL = "https://www.courts.go.jp"
SEARCH_URL = f"{BASE_URL}/app/hanrei_jp/search1"
HEADERS = {"User-Agent": "Mozilla/5.0 (research bot; accountabilities.org)"}

def detect_org_type(court: str) -> str:
    if "最高裁" in court: return "supreme_court"
    if "高等裁判所" in court: return "high_court"
    if "地方裁判所" in court: return "district_court"
    if "家庭裁判所" in court: return "family_court"
    return "court"

def extract_professionals(text: str) -> list[dict]:
    results = []
    patterns = [
        (r'裁判長裁判官\s*([^\s　\n,、。]{2,6})', 'judge', 'presiding_judge'),
        (r'裁判官\s*([^\s　\n,、。]{2,6})', 'judge', 'panel_judge'),
        (r'弁護人\s*([^\s　\n,、。]{2,6})', 'lawyer', 'counsel'),
    ]
    seen = set()
    for pattern, ptype, role in patterns:
        for m in re.finditer(pattern, text):
            name = m.group(1).strip()
            if 2 <= len(name) <= 6 and not any(c in name for c in ['裁','判','所','長']):
                key = (name, ptype)
                if key not in seen:
                    seen.add(key)
                    results.append({"name": name, "profession_type": ptype, "role": role})
    return results

if __name__ == "__main__":
    print("courts_scraper.py ready")
    print(f"DB: {DB_URL[:50]}...")
