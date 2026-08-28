-- 1. Nombre de CONFIRMED CISCO_PSIRT
SELECT '1. Nombre de CONFIRMED CISCO_PSIRT' as metric, COUNT(*) as count 
FROM candidate_matches 
WHERE applicability_status = 'CONFIRMED' AND match_provider = 'CISCO_PSIRT';

-- 2. Nombre de CVE distinctes parmi ces CONFIRMED
SELECT '2. Nombre de CVE distinctes' as metric, COUNT(DISTINCT cve_id) as count 
FROM candidate_matches 
WHERE applicability_status = 'CONFIRMED' AND match_provider = 'CISCO_PSIRT';

-- 3. Nombre d'actifs distincts
SELECT '3. Nombre d actifs distincts' as metric, COUNT(DISTINCT asset_id) as count 
FROM candidate_matches 
WHERE applicability_status = 'CONFIRMED' AND match_provider = 'CISCO_PSIRT';

-- 4. Repartition asset_id -> nombre de CVE CONFIRMED
SELECT '4. Repartition asset_id -> nombre CVE' as metric, asset_id, COUNT(DISTINCT cve_id) as count 
FROM candidate_matches 
WHERE applicability_status = 'CONFIRMED' AND match_provider = 'CISCO_PSIRT'
GROUP BY asset_id
ORDER BY count DESC;

-- 5. Nombre de couples uniques (asset_id, cve_id)
SELECT '5. Nombre de couples (asset_id, cve_id) uniques' as metric, COUNT(*) as count FROM (
  SELECT DISTINCT asset_id, cve_id 
  FROM candidate_matches 
  WHERE applicability_status = 'CONFIRMED' AND match_provider = 'CISCO_PSIRT'
) as unique_couples;

-- 6. Nombre de client_vulnerability_cases reliés à ces CONFIRMED
SELECT '6. Nombre de cases' as metric, COUNT(DISTINCT c.case_id) as count 
FROM client_vulnerability_cases c
JOIN candidate_matches m ON c.candidate_match_id = m.candidate_match_id
WHERE m.applicability_status = 'CONFIRMED' AND m.match_provider = 'CISCO_PSIRT';

-- 7. Nombre de cas uniques par (asset_id, cve_id)
SELECT '7. Max cas uniques par (asset_id, cve_id)' as metric, MAX(cases_count) as max_cases_per_tuple FROM (
  SELECT asset_id, cve_id, COUNT(c.case_id) as cases_count
  FROM client_vulnerability_cases c
  JOIN candidate_matches m ON c.candidate_match_id = m.candidate_match_id
  WHERE m.applicability_status = 'CONFIRMED' AND m.match_provider = 'CISCO_PSIRT'
  GROUP BY asset_id, cve_id
) as counts;

-- 8. Nombre de bulletins uniques associes
SELECT '8. Nombre de bulletins uniques' as metric, COUNT(DISTINCT bc.bulletin_id) as count
FROM bulletin_cases bc
JOIN client_vulnerability_cases c ON bc.case_id = c.case_id
JOIN candidate_matches m ON c.candidate_match_id = m.candidate_match_id
WHERE m.applicability_status = 'CONFIRMED' AND m.match_provider = 'CISCO_PSIRT';

-- 9. 10 exemples: asset_id -> cve_id -> candidate_match_id -> case_id -> bulletin_id
SELECT m.asset_id, 
       m.cve_id, 
       m.candidate_match_id, 
       c.case_id, 
       bc.bulletin_id
FROM candidate_matches m
LEFT JOIN client_vulnerability_cases c ON m.candidate_match_id = c.candidate_match_id
LEFT JOIN bulletin_cases bc ON c.case_id = bc.case_id
WHERE m.applicability_status = 'CONFIRMED' AND m.match_provider = 'CISCO_PSIRT'
ORDER BY m.asset_id, m.cve_id
LIMIT 10;
