SELECT a.client_id, a.asset_id, a.vendor, a.product, a.normalized_product, a.version, a.product_family, b.bulletin_id
FROM assets a
JOIN client_vulnerability_cases c ON a.asset_id = c.asset_id
JOIN bulletin_cases bc ON c.case_id = bc.case_id
JOIN bulletins b ON bc.bulletin_id = b.bulletin_id
JOIN candidate_matches m ON c.candidate_match_id = m.candidate_match_id
WHERE m.match_provider = 'CISCO_PSIRT' AND m.applicability_status = 'CONFIRMED'
GROUP BY a.client_id, a.asset_id, a.vendor, a.product, a.normalized_product, a.version, a.product_family, b.bulletin_id;
