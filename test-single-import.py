#!/usr/bin/env python3
"""Test importing a single contractor to see exact error"""

import os
import json
from supabase import create_client

# Setup
os.environ['NEXT_PUBLIC_SUPABASE_URL'] = "https://reprsoqodhmpdoiajhst.supabase.co"
os.environ['SUPABASE_SERVICE_ROLE_KEY'] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlcHJzb3FvZGhtcGRvaWFqaHN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUxNjU0OCwiZXhwIjoyMDcxMDkyNTQ4fQ.J7bBpqSN4uL4D_Wp4e4pRPdOzGrbgBb0Uyia1fGdq1o"

supabase = create_client(
    os.environ['NEXT_PUBLIC_SUPABASE_URL'],
    os.environ['SUPABASE_SERVICE_ROLE_KEY']
)

# Load a sample contractor
with open('data/gsa_schedules/parsed/GSA_MAS_336992_parsed.json') as f:
    data = json.load(f)
    contractor = data['contractors'][0]

print("Attempting to insert:")
print(json.dumps(contractor, indent=2, default=str))
print()

# Try to insert
try:
    result = supabase.table('gsa_schedule_holders').insert(contractor).execute()
    print("✓ Success!")
    print(result)
except Exception as e:
    print("✗ Error:")
    print(type(e))
    print(e)

