#!/usr/bin/env python3
"""
Quick script to list all credential IDs from n8n.
Tries multiple API approaches for different n8n versions.
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

N8N_BASE_URL = os.getenv("VITE_N8N_WEBHOOK_URL", "").rstrip("/")
N8N_TOKEN    = os.getenv("VITE_N8N_TOKEN", "")

if "/webhook" in N8N_BASE_URL:
    N8N_BASE_URL = N8N_BASE_URL.split("/webhook")[0]

HEADERS = {
    "X-N8N-API-KEY": N8N_TOKEN,
    "Content-Type": "application/json",
}

print(f"\nInstance: {N8N_BASE_URL}\n")

# ── Approach 1: Standard credentials endpoint ─────────────────────────────────
print("Trying GET /api/v1/credentials ...")
try:
    r = requests.get(f"{N8N_BASE_URL}/api/v1/credentials", headers=HEADERS, timeout=10)
    print(f"  Status: {r.status_code}")
    if r.ok:
        data = r.json()
        creds = data.get("data", data) if isinstance(data, dict) else data
        print(f"\n  {'ID':<20} {'Type':<25} Name")
        print(f"  {'-'*20} {'-'*25} {'-'*30}")
        for c in creds:
            print(f"  {c.get('id',''):<20} {c.get('type',''):<25} {c.get('name','')}")
        exit()
    else:
        print(f"  Failed: {r.text[:100]}")
except Exception as e:
    print(f"  Error: {e}")

# ── Approach 2: Pull IDs from a known workflow's nodes ────────────────────────
print("\nFallback — extracting credential info from all workflows ...")
try:
    r = requests.get(f"{N8N_BASE_URL}/api/v1/workflows", headers=HEADERS, timeout=10)
    print(f"  Status: {r.status_code}")
    if r.ok:
        data = r.json()
        workflows = data.get("data", data) if isinstance(data, dict) else data

        seen = {}
        for wf in workflows:
            # Some versions return stubs — fetch full workflow for nodes
            wf_id = wf.get("id")
            full = requests.get(f"{N8N_BASE_URL}/api/v1/workflows/{wf_id}", headers=HEADERS, timeout=10).json()
            for node in full.get("nodes", []):
                for cred_type, cred_info in node.get("credentials", {}).items():
                    cid   = cred_info.get("id", "")
                    cname = cred_info.get("name", "")
                    if cid and cid not in seen:
                        seen[cid] = {"name": cname, "type": cred_type}

        if seen:
            print(f"\n  {'ID':<20} {'Type':<25} Name")
            print(f"  {'-'*20} {'-'*25} {'-'*30}")
            for cid, info in sorted(seen.items(), key=lambda x: x[1]["name"]):
                print(f"  {cid:<20} {info['type']:<25} {info['name']}")
        else:
            print("  No credentials found in any workflow nodes.")
    else:
        print(f"  Failed: {r.text[:100]}")
except Exception as e:
    print(f"  Error: {e}")

print()