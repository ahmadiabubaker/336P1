-- Each CSV attribute appears in exactly one screenshot query.
\pset null '[NULL]'

-- Screenshot 1: columns 1-3
SELECT as_of_year, respondent_id, agency_name FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 2: columns 4-6
SELECT agency_abbr, agency_code, loan_type_name FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 3: columns 7-9
SELECT loan_type, property_type_name, property_type FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 4: columns 10-12
SELECT loan_purpose_name, loan_purpose, owner_occupancy_name FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 5: columns 13-15
SELECT owner_occupancy, loan_amount_000s, preapproval_name FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 6: columns 16-18
SELECT preapproval, action_taken_name, action_taken FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 7: columns 19-21
SELECT msamd_name, msamd, state_name FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 8: columns 22-24
SELECT state_abbr, state_code, county_name FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 9: columns 25-27
SELECT county_code, census_tract_number, applicant_ethnicity_name FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 10: columns 28-30
SELECT applicant_ethnicity, co_applicant_ethnicity_name, co_applicant_ethnicity FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 11: columns 31-33
SELECT applicant_race_name_1, applicant_race_1, applicant_race_name_2 FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 12: columns 34-36
SELECT applicant_race_2, applicant_race_name_3, applicant_race_3 FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 13: columns 37-39
SELECT applicant_race_name_4, applicant_race_4, applicant_race_name_5 FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 14: columns 40-42
SELECT applicant_race_5, co_applicant_race_name_1, co_applicant_race_1 FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 15: columns 43-45
SELECT co_applicant_race_name_2, co_applicant_race_2, co_applicant_race_name_3 FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 16: columns 46-48
SELECT co_applicant_race_3, co_applicant_race_name_4, co_applicant_race_4 FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 17: columns 49-51
SELECT co_applicant_race_name_5, co_applicant_race_5, applicant_sex_name FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 18: columns 52-54
SELECT applicant_sex, co_applicant_sex_name, co_applicant_sex FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 19: columns 55-57
SELECT applicant_income_000s, purchaser_type_name, purchaser_type FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 20: columns 58-60
SELECT denial_reason_name_1, denial_reason_1, denial_reason_name_2 FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 21: columns 61-63
SELECT denial_reason_2, denial_reason_name_3, denial_reason_3 FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 22: columns 64-66
SELECT rate_spread, hoepa_status_name, hoepa_status FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 23: columns 67-69
SELECT lien_status_name, lien_status, edit_status_name FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 24: columns 70-72
SELECT edit_status, sequence_number, population FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 25: columns 73-75
SELECT minority_population, hud_median_family_income, tract_to_msamd_income FROM preliminary ORDER BY sequence_number LIMIT 10;

-- Screenshot 26: columns 76-78
SELECT number_of_owner_occupied_units, number_of_1_to_4_family_units, application_date_indicator FROM preliminary ORDER BY sequence_number LIMIT 10;
