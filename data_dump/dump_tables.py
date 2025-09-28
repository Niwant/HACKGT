import csv, sys
import mysql.connector

# ---- EDIT THESE ----
DB_HOST = "pharmacy-db.c1026kwog93h.us-east-2.rds.amazonaws.com"
DB_USER = "admin"
DB_PASS = "hackgt12"
DB_NAME = "pharmacy"
OUT_DIR = "/Users/pallavi/HackGT/table_dump"
TABLES = [
    "allergies",
    "cms_basic_formulary",
    "cms_beneficiary_cost",
    "cms_indication_coverage",
    "cms_plan_info",
    "cms_plan_map",
    "feature_scope_patients",
    "medications",
    "observations",
    "patients",
    "patients_backup",
    "payer_plan_catalog",
    "payer_transitions",
    "payers",
    "plan_tier_cost_lookup",
]

conn = mysql.connector.connect(
    host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME
)
cur = conn.cursor()

for tbl in TABLES:
    cur.execute(f"SELECT * FROM `{tbl}`")
    cols = [d[0] for d in cur.description]
    out_path = f"{OUT_DIR}/{tbl}.csv"
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(cols)            # header
        while True:
            rows = cur.fetchmany(10000)  # stream in chunks
            if not rows:
                break
            w.writerows(rows)
    print(f"Wrote {out_path}")

cur.close()
conn.close()
