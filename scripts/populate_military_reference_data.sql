-- ============================================
-- Populate Military Reference Data
-- ============================================
-- Run this after creating the military news tables
-- to populate reference data for bases and ranks
-- ============================================

-- ============================================
-- MILITARY RANKS - ALL SERVICES
-- ============================================

-- Army Ranks
INSERT INTO military_ranks (service_branch, rank_name, rank_abbreviation, pay_grade, rank_order, is_officer, is_enlisted, is_warrant, is_flag_officer) VALUES
-- Enlisted
('army', 'Private', 'PV1', 'E-1', 1, FALSE, TRUE, FALSE, FALSE),
('army', 'Private Second Class', 'PV2', 'E-2', 2, FALSE, TRUE, FALSE, FALSE),
('army', 'Private First Class', 'PFC', 'E-3', 3, FALSE, TRUE, FALSE, FALSE),
('army', 'Specialist', 'SPC', 'E-4', 4, FALSE, TRUE, FALSE, FALSE),
('army', 'Corporal', 'CPL', 'E-4', 4, FALSE, TRUE, FALSE, FALSE),
('army', 'Sergeant', 'SGT', 'E-5', 5, FALSE, TRUE, FALSE, FALSE),
('army', 'Staff Sergeant', 'SSG', 'E-6', 6, FALSE, TRUE, FALSE, FALSE),
('army', 'Sergeant First Class', 'SFC', 'E-7', 7, FALSE, TRUE, FALSE, FALSE),
('army', 'Master Sergeant', 'MSG', 'E-8', 8, FALSE, TRUE, FALSE, FALSE),
('army', 'First Sergeant', '1SG', 'E-8', 8, FALSE, TRUE, FALSE, FALSE),
('army', 'Sergeant Major', 'SGM', 'E-9', 9, FALSE, TRUE, FALSE, FALSE),
('army', 'Command Sergeant Major', 'CSM', 'E-9', 9, FALSE, TRUE, FALSE, FALSE),
('army', 'Sergeant Major of the Army', 'SMA', 'E-9', 10, FALSE, TRUE, FALSE, FALSE),
-- Warrant Officers
('army', 'Warrant Officer 1', 'WO1', 'W-1', 11, FALSE, FALSE, TRUE, FALSE),
('army', 'Chief Warrant Officer 2', 'CW2', 'W-2', 12, FALSE, FALSE, TRUE, FALSE),
('army', 'Chief Warrant Officer 3', 'CW3', 'W-3', 13, FALSE, FALSE, TRUE, FALSE),
('army', 'Chief Warrant Officer 4', 'CW4', 'W-4', 14, FALSE, FALSE, TRUE, FALSE),
('army', 'Chief Warrant Officer 5', 'CW5', 'W-5', 15, FALSE, FALSE, TRUE, FALSE),
-- Officers
('army', 'Second Lieutenant', '2LT', 'O-1', 16, TRUE, FALSE, FALSE, FALSE),
('army', 'First Lieutenant', '1LT', 'O-2', 17, TRUE, FALSE, FALSE, FALSE),
('army', 'Captain', 'CPT', 'O-3', 18, TRUE, FALSE, FALSE, FALSE),
('army', 'Major', 'MAJ', 'O-4', 19, TRUE, FALSE, FALSE, FALSE),
('army', 'Lieutenant Colonel', 'LTC', 'O-5', 20, TRUE, FALSE, FALSE, FALSE),
('army', 'Colonel', 'COL', 'O-6', 21, TRUE, FALSE, FALSE, FALSE),
-- General Officers (Flag Officers)
('army', 'Brigadier General', 'BG', 'O-7', 22, TRUE, FALSE, FALSE, TRUE),
('army', 'Major General', 'MG', 'O-8', 23, TRUE, FALSE, FALSE, TRUE),
('army', 'Lieutenant General', 'LTG', 'O-9', 24, TRUE, FALSE, FALSE, TRUE),
('army', 'General', 'GEN', 'O-10', 25, TRUE, FALSE, FALSE, TRUE)
ON CONFLICT (service_branch, rank_name) DO NOTHING;

-- Navy Ranks
INSERT INTO military_ranks (service_branch, rank_name, rank_abbreviation, pay_grade, rank_order, is_officer, is_enlisted, is_warrant, is_flag_officer) VALUES
-- Enlisted
('navy', 'Seaman Recruit', 'SR', 'E-1', 1, FALSE, TRUE, FALSE, FALSE),
('navy', 'Seaman Apprentice', 'SA', 'E-2', 2, FALSE, TRUE, FALSE, FALSE),
('navy', 'Seaman', 'SN', 'E-3', 3, FALSE, TRUE, FALSE, FALSE),
('navy', 'Petty Officer Third Class', 'PO3', 'E-4', 4, FALSE, TRUE, FALSE, FALSE),
('navy', 'Petty Officer Second Class', 'PO2', 'E-5', 5, FALSE, TRUE, FALSE, FALSE),
('navy', 'Petty Officer First Class', 'PO1', 'E-6', 6, FALSE, TRUE, FALSE, FALSE),
('navy', 'Chief Petty Officer', 'CPO', 'E-7', 7, FALSE, TRUE, FALSE, FALSE),
('navy', 'Senior Chief Petty Officer', 'SCPO', 'E-8', 8, FALSE, TRUE, FALSE, FALSE),
('navy', 'Master Chief Petty Officer', 'MCPO', 'E-9', 9, FALSE, TRUE, FALSE, FALSE),
('navy', 'Master Chief Petty Officer of the Navy', 'MCPON', 'E-9', 10, FALSE, TRUE, FALSE, FALSE),
-- Officers
('navy', 'Ensign', 'ENS', 'O-1', 16, TRUE, FALSE, FALSE, FALSE),
('navy', 'Lieutenant Junior Grade', 'LTJG', 'O-2', 17, TRUE, FALSE, FALSE, FALSE),
('navy', 'Lieutenant', 'LT', 'O-3', 18, TRUE, FALSE, FALSE, FALSE),
('navy', 'Lieutenant Commander', 'LCDR', 'O-4', 19, TRUE, FALSE, FALSE, FALSE),
('navy', 'Commander', 'CDR', 'O-5', 20, TRUE, FALSE, FALSE, FALSE),
('navy', 'Captain', 'CAPT', 'O-6', 21, TRUE, FALSE, FALSE, FALSE),
-- Flag Officers
('navy', 'Rear Admiral Lower Half', 'RDML', 'O-7', 22, TRUE, FALSE, FALSE, TRUE),
('navy', 'Rear Admiral', 'RADM', 'O-8', 23, TRUE, FALSE, FALSE, TRUE),
('navy', 'Vice Admiral', 'VADM', 'O-9', 24, TRUE, FALSE, FALSE, TRUE),
('navy', 'Admiral', 'ADM', 'O-10', 25, TRUE, FALSE, FALSE, TRUE)
ON CONFLICT (service_branch, rank_name) DO NOTHING;

-- Air Force Ranks
INSERT INTO military_ranks (service_branch, rank_name, rank_abbreviation, pay_grade, rank_order, is_officer, is_enlisted, is_warrant, is_flag_officer) VALUES
-- Enlisted
('air_force', 'Airman Basic', 'AB', 'E-1', 1, FALSE, TRUE, FALSE, FALSE),
('air_force', 'Airman', 'Amn', 'E-2', 2, FALSE, TRUE, FALSE, FALSE),
('air_force', 'Airman First Class', 'A1C', 'E-3', 3, FALSE, TRUE, FALSE, FALSE),
('air_force', 'Senior Airman', 'SrA', 'E-4', 4, FALSE, TRUE, FALSE, FALSE),
('air_force', 'Staff Sergeant', 'SSgt', 'E-5', 5, FALSE, TRUE, FALSE, FALSE),
('air_force', 'Technical Sergeant', 'TSgt', 'E-6', 6, FALSE, TRUE, FALSE, FALSE),
('air_force', 'Master Sergeant', 'MSgt', 'E-7', 7, FALSE, TRUE, FALSE, FALSE),
('air_force', 'Senior Master Sergeant', 'SMSgt', 'E-8', 8, FALSE, TRUE, FALSE, FALSE),
('air_force', 'Chief Master Sergeant', 'CMSgt', 'E-9', 9, FALSE, TRUE, FALSE, FALSE),
('air_force', 'Chief Master Sergeant of the Air Force', 'CMSAF', 'E-9', 10, FALSE, TRUE, FALSE, FALSE),
-- Officers
('air_force', 'Second Lieutenant', '2d Lt', 'O-1', 16, TRUE, FALSE, FALSE, FALSE),
('air_force', 'First Lieutenant', '1st Lt', 'O-2', 17, TRUE, FALSE, FALSE, FALSE),
('air_force', 'Captain', 'Capt', 'O-3', 18, TRUE, FALSE, FALSE, FALSE),
('air_force', 'Major', 'Maj', 'O-4', 19, TRUE, FALSE, FALSE, FALSE),
('air_force', 'Lieutenant Colonel', 'Lt Col', 'O-5', 20, TRUE, FALSE, FALSE, FALSE),
('air_force', 'Colonel', 'Col', 'O-6', 21, TRUE, FALSE, FALSE, FALSE),
-- General Officers
('air_force', 'Brigadier General', 'Brig Gen', 'O-7', 22, TRUE, FALSE, FALSE, TRUE),
('air_force', 'Major General', 'Maj Gen', 'O-8', 23, TRUE, FALSE, FALSE, TRUE),
('air_force', 'Lieutenant General', 'Lt Gen', 'O-9', 24, TRUE, FALSE, FALSE, TRUE),
('air_force', 'General', 'Gen', 'O-10', 25, TRUE, FALSE, FALSE, TRUE)
ON CONFLICT (service_branch, rank_name) DO NOTHING;

-- Marine Corps Ranks
INSERT INTO military_ranks (service_branch, rank_name, rank_abbreviation, pay_grade, rank_order, is_officer, is_enlisted, is_warrant, is_flag_officer) VALUES
-- Enlisted
('marine_corps', 'Private', 'Pvt', 'E-1', 1, FALSE, TRUE, FALSE, FALSE),
('marine_corps', 'Private First Class', 'PFC', 'E-2', 2, FALSE, TRUE, FALSE, FALSE),
('marine_corps', 'Lance Corporal', 'LCpl', 'E-3', 3, FALSE, TRUE, FALSE, FALSE),
('marine_corps', 'Corporal', 'Cpl', 'E-4', 4, FALSE, TRUE, FALSE, FALSE),
('marine_corps', 'Sergeant', 'Sgt', 'E-5', 5, FALSE, TRUE, FALSE, FALSE),
('marine_corps', 'Staff Sergeant', 'SSgt', 'E-6', 6, FALSE, TRUE, FALSE, FALSE),
('marine_corps', 'Gunnery Sergeant', 'GySgt', 'E-7', 7, FALSE, TRUE, FALSE, FALSE),
('marine_corps', 'Master Sergeant', 'MSgt', 'E-8', 8, FALSE, TRUE, FALSE, FALSE),
('marine_corps', 'First Sergeant', '1stSgt', 'E-8', 8, FALSE, TRUE, FALSE, FALSE),
('marine_corps', 'Master Gunnery Sergeant', 'MGySgt', 'E-9', 9, FALSE, TRUE, FALSE, FALSE),
('marine_corps', 'Sergeant Major', 'SgtMaj', 'E-9', 9, FALSE, TRUE, FALSE, FALSE),
('marine_corps', 'Sergeant Major of the Marine Corps', 'SgtMajMC', 'E-9', 10, FALSE, TRUE, FALSE, FALSE),
-- Warrant Officers
('marine_corps', 'Warrant Officer 1', 'WO1', 'W-1', 11, FALSE, FALSE, TRUE, FALSE),
('marine_corps', 'Chief Warrant Officer 2', 'CWO2', 'W-2', 12, FALSE, FALSE, TRUE, FALSE),
('marine_corps', 'Chief Warrant Officer 3', 'CWO3', 'W-3', 13, FALSE, FALSE, TRUE, FALSE),
('marine_corps', 'Chief Warrant Officer 4', 'CWO4', 'W-4', 14, FALSE, FALSE, TRUE, FALSE),
('marine_corps', 'Chief Warrant Officer 5', 'CWO5', 'W-5', 15, FALSE, FALSE, TRUE, FALSE),
-- Officers
('marine_corps', 'Second Lieutenant', '2ndLt', 'O-1', 16, TRUE, FALSE, FALSE, FALSE),
('marine_corps', 'First Lieutenant', '1stLt', 'O-2', 17, TRUE, FALSE, FALSE, FALSE),
('marine_corps', 'Captain', 'Capt', 'O-3', 18, TRUE, FALSE, FALSE, FALSE),
('marine_corps', 'Major', 'Maj', 'O-4', 19, TRUE, FALSE, FALSE, FALSE),
('marine_corps', 'Lieutenant Colonel', 'LtCol', 'O-5', 20, TRUE, FALSE, FALSE, FALSE),
('marine_corps', 'Colonel', 'Col', 'O-6', 21, TRUE, FALSE, FALSE, FALSE),
-- General Officers
('marine_corps', 'Brigadier General', 'BGen', 'O-7', 22, TRUE, FALSE, FALSE, TRUE),
('marine_corps', 'Major General', 'MajGen', 'O-8', 23, TRUE, FALSE, FALSE, TRUE),
('marine_corps', 'Lieutenant General', 'LtGen', 'O-9', 24, TRUE, FALSE, FALSE, TRUE),
('marine_corps', 'General', 'Gen', 'O-10', 25, TRUE, FALSE, FALSE, TRUE)
ON CONFLICT (service_branch, rank_name) DO NOTHING;

-- Space Force Ranks (same as Air Force)
INSERT INTO military_ranks (service_branch, rank_name, rank_abbreviation, pay_grade, rank_order, is_officer, is_enlisted, is_warrant, is_flag_officer) VALUES
-- Enlisted (Guardians)
('space_force', 'Specialist 1', 'Spc1', 'E-1', 1, FALSE, TRUE, FALSE, FALSE),
('space_force', 'Specialist 2', 'Spc2', 'E-2', 2, FALSE, TRUE, FALSE, FALSE),
('space_force', 'Specialist 3', 'Spc3', 'E-3', 3, FALSE, TRUE, FALSE, FALSE),
('space_force', 'Specialist 4', 'Spc4', 'E-4', 4, FALSE, TRUE, FALSE, FALSE),
('space_force', 'Sergeant', 'Sgt', 'E-5', 5, FALSE, TRUE, FALSE, FALSE),
('space_force', 'Technical Sergeant', 'TSgt', 'E-6', 6, FALSE, TRUE, FALSE, FALSE),
('space_force', 'Master Sergeant', 'MSgt', 'E-7', 7, FALSE, TRUE, FALSE, FALSE),
('space_force', 'Senior Master Sergeant', 'SMSgt', 'E-8', 8, FALSE, TRUE, FALSE, FALSE),
('space_force', 'Chief Master Sergeant', 'CMSgt', 'E-9', 9, FALSE, TRUE, FALSE, FALSE),
-- Officers
('space_force', 'Second Lieutenant', '2d Lt', 'O-1', 16, TRUE, FALSE, FALSE, FALSE),
('space_force', 'First Lieutenant', '1st Lt', 'O-2', 17, TRUE, FALSE, FALSE, FALSE),
('space_force', 'Captain', 'Capt', 'O-3', 18, TRUE, FALSE, FALSE, FALSE),
('space_force', 'Major', 'Maj', 'O-4', 19, TRUE, FALSE, FALSE, FALSE),
('space_force', 'Lieutenant Colonel', 'Lt Col', 'O-5', 20, TRUE, FALSE, FALSE, FALSE),
('space_force', 'Colonel', 'Col', 'O-6', 21, TRUE, FALSE, FALSE, FALSE),
-- General Officers
('space_force', 'Brigadier General', 'Brig Gen', 'O-7', 22, TRUE, FALSE, FALSE, TRUE),
('space_force', 'Major General', 'Maj Gen', 'O-8', 23, TRUE, FALSE, FALSE, TRUE),
('space_force', 'Lieutenant General', 'Lt Gen', 'O-9', 24, TRUE, FALSE, FALSE, TRUE),
('space_force', 'General', 'Gen', 'O-10', 25, TRUE, FALSE, FALSE, TRUE)
ON CONFLICT (service_branch, rank_name) DO NOTHING;

-- Coast Guard Ranks (similar to Navy)
INSERT INTO military_ranks (service_branch, rank_name, rank_abbreviation, pay_grade, rank_order, is_officer, is_enlisted, is_warrant, is_flag_officer) VALUES
-- Enlisted
('coast_guard', 'Seaman Recruit', 'SR', 'E-1', 1, FALSE, TRUE, FALSE, FALSE),
('coast_guard', 'Seaman Apprentice', 'SA', 'E-2', 2, FALSE, TRUE, FALSE, FALSE),
('coast_guard', 'Seaman', 'SN', 'E-3', 3, FALSE, TRUE, FALSE, FALSE),
('coast_guard', 'Petty Officer Third Class', 'PO3', 'E-4', 4, FALSE, TRUE, FALSE, FALSE),
('coast_guard', 'Petty Officer Second Class', 'PO2', 'E-5', 5, FALSE, TRUE, FALSE, FALSE),
('coast_guard', 'Petty Officer First Class', 'PO1', 'E-6', 6, FALSE, TRUE, FALSE, FALSE),
('coast_guard', 'Chief Petty Officer', 'CPO', 'E-7', 7, FALSE, TRUE, FALSE, FALSE),
('coast_guard', 'Senior Chief Petty Officer', 'SCPO', 'E-8', 8, FALSE, TRUE, FALSE, FALSE),
('coast_guard', 'Master Chief Petty Officer', 'MCPO', 'E-9', 9, FALSE, TRUE, FALSE, FALSE),
-- Officers
('coast_guard', 'Ensign', 'ENS', 'O-1', 16, TRUE, FALSE, FALSE, FALSE),
('coast_guard', 'Lieutenant Junior Grade', 'LTJG', 'O-2', 17, TRUE, FALSE, FALSE, FALSE),
('coast_guard', 'Lieutenant', 'LT', 'O-3', 18, TRUE, FALSE, FALSE, FALSE),
('coast_guard', 'Lieutenant Commander', 'LCDR', 'O-4', 19, TRUE, FALSE, FALSE, FALSE),
('coast_guard', 'Commander', 'CDR', 'O-5', 20, TRUE, FALSE, FALSE, FALSE),
('coast_guard', 'Captain', 'CAPT', 'O-6', 21, TRUE, FALSE, FALSE, FALSE),
-- Flag Officers
('coast_guard', 'Rear Admiral Lower Half', 'RDML', 'O-7', 22, TRUE, FALSE, FALSE, TRUE),
('coast_guard', 'Rear Admiral', 'RADM', 'O-8', 23, TRUE, FALSE, FALSE, TRUE),
('coast_guard', 'Vice Admiral', 'VADM', 'O-9', 24, TRUE, FALSE, FALSE, TRUE),
('coast_guard', 'Admiral', 'ADM', 'O-10', 25, TRUE, FALSE, FALSE, TRUE)
ON CONFLICT (service_branch, rank_name) DO NOTHING;

-- ============================================
-- MAJOR MILITARY BASES (Sample - Top 50)
-- ============================================

INSERT INTO military_bases (base_name, base_full_name, base_type, service_branch, city, state, country, status) VALUES
-- Army
('Fort Bragg', 'Fort Bragg', 'army_post', 'army', 'Fayetteville', 'NC', 'US', 'active'),
('Fort Hood', 'Fort Hood', 'army_post', 'army', 'Killeen', 'TX', 'US', 'active'),
('Fort Campbell', 'Fort Campbell', 'army_post', 'army', 'Clarksville', 'TN', 'US', 'active'),
('Fort Riley', 'Fort Riley', 'army_post', 'army', 'Manhattan', 'KS', 'US', 'active'),
('Fort Benning', 'Fort Benning', 'army_post', 'army', 'Columbus', 'GA', 'US', 'active'),
('Fort Stewart', 'Fort Stewart', 'army_post', 'army', 'Hinesville', 'GA', 'US', 'active'),
('Fort Lewis', 'Joint Base Lewis-McChord', 'joint_base', 'army', 'Tacoma', 'WA', 'US', 'active'),
('Fort Bliss', 'Fort Bliss', 'army_post', 'army', 'El Paso', 'TX', 'US', 'active'),
('Fort Sill', 'Fort Sill', 'army_post', 'army', 'Lawton', 'OK', 'US', 'active'),
-- Navy
('Naval Station Norfolk', 'Naval Station Norfolk', 'naval_station', 'navy', 'Norfolk', 'VA', 'US', 'active'),
('Naval Base San Diego', 'Naval Base San Diego', 'naval_base', 'navy', 'San Diego', 'CA', 'US', 'active'),
('Naval Base Pearl Harbor', 'Joint Base Pearl Harbor-Hickam', 'joint_base', 'navy', 'Honolulu', 'HI', 'US', 'active'),
('Naval Station Everett', 'Naval Station Everett', 'naval_station', 'navy', 'Everett', 'WA', 'US', 'active'),
('Naval Base Kitsap', 'Naval Base Kitsap', 'naval_base', 'navy', 'Silverdale', 'WA', 'US', 'active'),
('Naval Air Station Pensacola', 'Naval Air Station Pensacola', 'naval_air_station', 'navy', 'Pensacola', 'FL', 'US', 'active'),
-- Air Force
('Nellis AFB', 'Nellis Air Force Base', 'air_force_base', 'air_force', 'Las Vegas', 'NV', 'US', 'active'),
('Travis AFB', 'Travis Air Force Base', 'air_force_base', 'air_force', 'Fairfield', 'CA', 'US', 'active'),
('Dover AFB', 'Dover Air Force Base', 'air_force_base', 'air_force', 'Dover', 'DE', 'US', 'active'),
('Eglin AFB', 'Eglin Air Force Base', 'air_force_base', 'air_force', 'Valparaiso', 'FL', 'US', 'active'),
('Langley AFB', 'Joint Base Langley-Eustis', 'joint_base', 'air_force', 'Hampton', 'VA', 'US', 'active'),
('Ramstein AB', 'Ramstein Air Base', 'air_force_base', 'air_force', 'Ramstein', NULL, 'DE', 'active'),
-- Marine Corps
('Camp Pendleton', 'Marine Corps Base Camp Pendleton', 'marine_corps_base', 'marine_corps', 'Oceanside', 'CA', 'US', 'active'),
('Camp Lejeune', 'Marine Corps Base Camp Lejeune', 'marine_corps_base', 'marine_corps', 'Jacksonville', 'NC', 'US', 'active'),
('Quantico', 'Marine Corps Base Quantico', 'marine_corps_base', 'marine_corps', 'Quantico', 'VA', 'US', 'active'),
('Twenty-nine Palms', 'Marine Corps Air Ground Combat Center Twentynine Palms', 'marine_corps_base', 'marine_corps', 'Twentynine Palms', 'CA', 'US', 'active')
ON CONFLICT (base_name, state, country) DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$ 
BEGIN 
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Military Reference Data Populated!';
    RAISE NOTICE '============================================';
    RAISE NOTICE ' ';
    RAISE NOTICE 'Added:';
    RAISE NOTICE '  - Military ranks for all 6 services';
    RAISE NOTICE '  - Major military bases (sample)';
    RAISE NOTICE ' ';
    RAISE NOTICE 'You can add more bases as needed.';
    RAISE NOTICE '============================================';
END $$;

