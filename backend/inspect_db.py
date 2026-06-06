import sqlite3
con = sqlite3.connect("office.db")
cur = con.cursor()
tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
for t in tables:
    name = t[0]
    count = cur.execute(f"SELECT COUNT(*) FROM {name}").fetchone()[0]
    cols = [c[1] for c in cur.execute(f"PRAGMA table_info({name})").fetchall()]
    print(f"\n[{name}] -- {count} rows")
    print("  cols:", ", ".join(cols))
    if count > 0 and count <= 5:
        rows = cur.execute(f"SELECT * FROM {name}").fetchall()
        for r in rows:
            print(" ", r)
con.close()
