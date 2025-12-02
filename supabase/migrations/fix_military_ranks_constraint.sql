-- ============================================
-- Fix Military Ranks Unique Constraint
-- ============================================
-- Removes the overly restrictive unique constraint on (service_branch, pay_grade)
-- Some services have multiple ranks at the same pay grade:
-- - Army E-4: Specialist AND Corporal
-- - Army E-8: Master Sergeant AND First Sergeant
-- - Marine Corps E-8: Master Sergeant AND First Sergeant
-- - Marine Corps E-9: Master Gunnery Sergeant AND Sergeant Major
-- ============================================

-- Drop the problematic constraint if it exists
ALTER TABLE military_ranks 
DROP CONSTRAINT IF EXISTS military_ranks_service_branch_pay_grade_key;

-- Keep only the rank_name uniqueness (which is correct)
-- The constraint military_ranks_service_branch_rank_name_key should remain

-- Add helpful comment
COMMENT ON TABLE military_ranks IS 'Military ranks for all services. Note: Multiple ranks can share the same pay grade (e.g., Army E-4 = Specialist OR Corporal).';

-- Verify the change
DO $$ 
BEGIN 
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Military Ranks Constraint Fixed!';
    RAISE NOTICE '============================================';
    RAISE NOTICE ' ';
    RAISE NOTICE 'Removed: UNIQUE(service_branch, pay_grade)';
    RAISE NOTICE 'Kept: UNIQUE(service_branch, rank_name)';
    RAISE NOTICE ' ';
    RAISE NOTICE 'Now you can insert ranks with duplicate pay grades.';
    RAISE NOTICE 'Re-run: scripts/populate_military_reference_data.sql';
    RAISE NOTICE '============================================';
END $$;

