from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

try:
    from bulletin_presentation import (
        canonical_url,
        clean_visible_text,
        reference_is_relevant,
        reference_label,
        short_description,
    )
except ModuleNotFoundError:  # pragma: no cover - package import path used by tests
    from .bulletin_presentation import (
        canonical_url,
        clean_visible_text,
        reference_is_relevant,
        reference_label,
        short_description,
    )


RISK_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
DEFAULT_MAIN_CVE_LIMIT = 25
NUMBER_WORDS = {
    0: "no",
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
}


@dataclass(frozen=True)
class BulletinGroup:
    client_id: str
    normalized_vendor: str
    normalized_product_family: str

    @property
    def key(self) -> str:
        return "|".join((self.client_id, self.normalized_vendor, self.normalized_product_family))


def normalize(value: Any) -> str:
    text = "" if value is None else str(value).strip().lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":"), default=str)


def bulletin_content_hash(payload: dict[str, Any]) -> str:
    visible_fields = {
        "title",
        "client_name",
        "vendor",
        "product",
        "bulletin_reference",
        "status",
        "maximum_risk",
        "treatment_deadline",
        "executive_summary",
        "vulnerability_overview",
        "affected_assets",
        "remediations",
        "iocs",
        "references",
    }
    visible_content = {
        key: value
        for key, value in payload.items()
        if key in visible_fields
    }
    return hashlib.sha256(stable_json(visible_content).encode("utf-8")).hexdigest()


def bulletin_reference(group_key: str, case_ids: list[int]) -> str:
    digest = hashlib.sha256(f"{group_key}:{','.join(map(str, sorted(case_ids)))}".encode()).hexdigest()
    return f"VF-{digest[:10].upper()}"


def risk_rank(value: Any) -> int:
    return RISK_ORDER.get(str(value or "").upper(), 9)


def maximum_risk(cases: list[dict[str, Any]]) -> str:
    if not cases:
        return "REVIEW REQUIRED"
    return min((str(case.get("risk_level") or "REVIEW REQUIRED").upper() for case in cases), key=risk_rank)


def earliest_deadline(cases: list[dict[str, Any]]) -> str | None:
    deadlines = [str(case["sla_due_at"]) for case in cases if case.get("sla_due_at")]
    return min(deadlines) if deadlines else None


def _long_date(value: Any) -> str:
    if value is None:
        return "not available"
    text = str(value).strip()
    if not text:
        return "not available"
    normalized = text.replace("Z", "+00:00")
    for candidate in (normalized, normalized.replace(" ", "T", 1)):
        try:
            return datetime.fromisoformat(candidate).strftime("%d %B %Y")
        except ValueError:
            pass
    match = re.match(r"^(\d{4}-\d{2}-\d{2})", text)
    if match:
        try:
            return datetime.fromisoformat(match.group(1)).strftime("%d %B %Y")
        except ValueError:
            pass
    return clean_visible_text(text, fallback="not available")


def _number_word(value: int) -> str:
    return NUMBER_WORDS.get(value, str(value))


def _plural(value: int, singular: str, plural: str | None = None) -> str:
    if value == 1:
        return singular
    return plural or f"{singular}s"


def group_case_rows(rows: list[dict[str, Any]]) -> dict[BulletinGroup, list[dict[str, Any]]]:
    grouped: dict[BulletinGroup, list[dict[str, Any]]] = {}
    for row in rows:
        product_for_group = row.get("main_product") or row.get("product") or row.get("product_family")
        group = BulletinGroup(
            client_id=str(row["client_id"]),
            normalized_vendor=normalize(row.get("normalized_vendor") or row.get("vendor")),
            normalized_product_family=normalize(product_for_group or row.get("normalized_product_family")),
        )
        if not group.normalized_vendor or not group.normalized_product_family:
            raise ValueError(f"Case {row.get('case_id')} has no stable vendor/product family")
        grouped.setdefault(group, []).append(row)
    return grouped


def _unique_by(rows: list[dict[str, Any]], key_fields: tuple[str, ...]) -> list[dict[str, Any]]:
    seen: set[tuple[Any, ...]] = set()
    unique_rows: list[dict[str, Any]] = []
    for row in rows:
        key = tuple(row.get(field) for field in key_fields)
        if key in seen:
            continue
        seen.add(key)
        unique_rows.append(row)
    return unique_rows


def _clean(value: Any) -> str:
    return "" if value is None else str(value).strip()


def _canonical_url(value: Any) -> str:
    return canonical_url(value)


def _prepare_case_text(case: dict[str, Any]) -> dict[str, Any]:
    prepared = dict(case)
    description = clean_visible_text(case.get("description") or case.get("title"))
    source_short_description = (
        case.get("short_description")
        or case.get("official_short_description")
        or case.get("summary")
        or case.get("normalized_summary")
        or case.get("source_summary")
    )
    prepared["description"] = description
    prepared["short_description"] = short_description(source_short_description or description)
    prepared["title"] = clean_visible_text(case.get("title"), fallback="")
    prepared["match_reason"] = clean_visible_text(case.get("match_reason"), fallback="")
    return prepared


def _overview_rows(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    unique = [_prepare_case_text(case) for case in _unique_by(cases, ("cve_id",))]
    return sorted(unique, key=lambda row: (risk_rank(row.get("risk_level")), str(row.get("cve_id"))))


def _asset_rows(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for case in cases:
        row = dict(case)
        main_product = row.get("main_product") or row.get("product") or row.get("product_family")
        affected_component = row.get("affected_component")
        if normalize(affected_component) == normalize(main_product):
            affected_component = None
        row["main_product"] = main_product
        row["affected_component"] = affected_component
        rows.append(row)
    unique = _unique_by(
        rows,
        (
            "asset_id",
            "component_id",
            "vendor",
            "main_product",
            "affected_component",
            "installed_version",
            "fixed_build",
        ),
    )
    return sorted(unique, key=lambda row: (str(row.get("asset_name") or ""), str(row.get("main_product") or "")))


def _default_recommended_action(case: dict[str, Any]) -> str:
    action = clean_visible_text(case.get("recommended_action"), fallback="")
    if action and "review applicability" not in action.lower():
        return action
    if case.get("fixed_build"):
        return "Upgrade to the fixed version or build listed in this bulletin."
    return "Apply the official vendor security update."


def _official_vendor_reference(case: dict[str, Any]) -> str:
    vendor = case.get("vendor") or case.get("normalized_vendor")
    candidates = [
        case.get("advisory_url"),
        case.get("remediation_url"),
    ]
    for reference in case.get("references") or []:
        if isinstance(reference, dict):
            candidates.append(reference.get("url"))
        else:
            candidates.append(reference)
    for candidate in candidates:
        target = _canonical_url(candidate)
        if target and reference_is_relevant(target_url=target, vendor=vendor):
            label = reference_label(target)
            if label not in {"NVD entry", "CVE record", "CISA reference", "FIRST reference"}:
                return target
    return ""


def _enriched_remediation_case(case: dict[str, Any]) -> dict[str, Any]:
    row = dict(case)
    official_url = _official_vendor_reference(row)
    advisory_url = _canonical_url(row.get("advisory_url")) or official_url
    remediation_url = _canonical_url(row.get("remediation_url")) or advisory_url
    fixed_build = _clean(row.get("fixed_build"))
    affected_version_range = _clean(row.get("affected_version_range")) or _clean(row.get("affected_version_rule"))
    row["advisory_url"] = advisory_url or None
    row["remediation_url"] = remediation_url or None
    row["fixed_build"] = fixed_build or None
    row["affected_version_range"] = affected_version_range or None
    row["recommended_action"] = _default_recommended_action(row)
    if row.get("applicability_status") == "CONFIRMED":
        row["requires_human_validation"] = False
    return row


def _confirmed_case_rows(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for case in cases:
        rows.append(_enriched_remediation_case(_prepare_case_text(case)))
    return rows


def _remediation_rows(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str, str], dict[str, Any]] = {}
    for case in cases:
        case = _enriched_remediation_case(case)
        kb = _clean(case.get("kb_article")).upper()
        remediation_url = _canonical_url(case.get("remediation_url"))
        advisory_url = _canonical_url(case.get("advisory_url"))
        fixed_build = _clean(case.get("fixed_build"))
        affected_version_range = _clean(case.get("affected_version_range"))
        action = clean_visible_text(case.get("recommended_action"), fallback="")
        if not any((kb, remediation_url, advisory_url, fixed_build, action)):
            continue
        key = (kb, fixed_build, action)
        row = grouped.setdefault(key, dict(case))
        row["kb_article"] = kb or None
        row["remediation_url"] = _canonical_url(row.get("remediation_url")) or remediation_url or None
        row["advisory_url"] = _canonical_url(row.get("advisory_url")) or advisory_url or None
        row["affected_version_range"] = affected_version_range or None
        row["fixed_build"] = fixed_build or None
        row["recommended_action"] = action or _default_recommended_action(row)
        row.setdefault("cve_ids", [])
        row.setdefault("asset_names", [])
        row.setdefault("affected_version_ranges", [])
        row.setdefault("fixed_targets", [])
        if case.get("cve_id"):
            row["cve_ids"].append(_clean(case.get("cve_id")))
        asset_name = _clean(case.get("asset_name") or case.get("asset_id") or case.get("component_id"))
        if asset_name:
            row["asset_names"].append(asset_name)
        if affected_version_range:
            row["affected_version_ranges"].append(affected_version_range)
        if fixed_build:
            row["fixed_targets"].append(fixed_build)
    return sorted(grouped.values(), key=lambda row: (str(row.get("kb_article") or ""), str(row.get("fixed_build") or "")))


def _action_rows(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    unique = _unique_by(cases, ("risk_level", "responsible_team", "sla_due_at", "recommended_action"))
    return sorted(unique, key=lambda row: (risk_rank(row.get("risk_level")), str(row.get("sla_due_at") or "")))


def _reference_rows(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    references: dict[str, dict[str, Any]] = {}

    def add_reference(target: str, label: str, cve_id: Any) -> None:
        entry = references.setdefault(target, {"label": label, "url": target, "cve_ids": []})
        if not entry.get("label") or entry["label"] == "Reference":
            entry["label"] = label
        cleaned_cve = _clean(cve_id)
        if cleaned_cve and cleaned_cve not in entry["cve_ids"]:
            entry["cve_ids"].append(cleaned_cve)

    for case in cases:
        vendor = case.get("vendor") or case.get("normalized_vendor")
        cve_id = case.get("cve_id")
        advisory_url = _canonical_url(case.get("advisory_url"))
        remediation_url = _canonical_url(case.get("remediation_url"))
        if advisory_url and reference_is_relevant(target_url=advisory_url, vendor=vendor):
            add_reference(advisory_url, reference_label(advisory_url, default="Vendor advisory"), cve_id)
        if remediation_url and reference_is_relevant(target_url=remediation_url, vendor=vendor):
            add_reference(remediation_url, reference_label(remediation_url, default="Official fix"), cve_id)
        for reference in case.get("references") or []:
            if isinstance(reference, dict) and reference.get("url"):
                target = _canonical_url(reference["url"])
                if target and reference_is_relevant(target_url=target, vendor=vendor):
                    add_reference(target, reference_label(target, default="Reference"), cve_id)
            elif isinstance(reference, str):
                target = _canonical_url(reference)
                if target and reference_is_relevant(target_url=target, vendor=vendor):
                    add_reference(target, reference_label(target, default="Reference"), cve_id)
    return sorted(references.values(), key=lambda item: (str(item.get("label") or ""), str(item.get("url") or "")))


def _risk_reason_items(value: Any) -> list[dict[str, Any]]:
    if value is None:
        return []
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return [{"code": "RISK_CONTEXT", "points": None, "detail": value}]
    else:
        parsed = value
    if not isinstance(parsed, list):
        return []
    items: list[dict[str, Any]] = []
    for item in parsed:
        if isinstance(item, dict):
            items.append(item)
    return items


def _risk_factor_rows(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for case in _overview_rows(cases):
        reasons = _risk_reason_items(case.get("risk_reasons"))
        rows.append(
            {
                "cve_id": case.get("cve_id"),
                "risk_score": case.get("risk_score"),
                "risk_level": case.get("risk_level"),
                "risk_factors": [
                    {**reason, "detail": clean_visible_text(reason.get("detail"), fallback="")}
                    for reason in reasons
                ],
                "requires_human_validation": case.get("requires_human_validation"),
            }
        )
    return rows


def _asset_label_for_summary(asset_rows: list[dict[str, Any]]) -> str:
    count = len(asset_rows)
    if count == 0:
        return "no affected assets"
    labels = [
        clean_visible_text(row.get("asset_type") or row.get("asset_label"), fallback="").lower()
        for row in asset_rows
    ]
    labels = [label for label in labels if label and label != "not available"]
    if labels and len(set(labels)) == 1:
        label = labels[0]
        if count == 1:
            return f"one {label}"
        return f"{_number_word(count)} {_plural(count, label)}"
    if count == 1:
        return "one affected asset"
    return f"{_number_word(count)} affected assets"


def _truthy(value: Any) -> bool:
    if value is True:
        return True
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y", "oui", "known", "confirmed"}
    return False


def _has_known_exploitation_data(cases: list[dict[str, Any]]) -> bool:
    fields = ("actively_exploited", "exploit_available", "poc_available", "is_kev")
    return any(any(case.get(field) is not None for field in fields) for case in cases)


def _exploitation_sentence(cases: list[dict[str, Any]]) -> str:
    if any(_truthy(case.get("is_kev")) or _truthy(case.get("actively_exploited")) for case in cases):
        return "Active exploitation has been reported and immediate remediation is required."
    if any(_truthy(case.get("zero_day")) or _truthy(case.get("is_zero_day")) for case in cases):
        return "A zero-day condition is indicated, increasing the urgency of remediation."
    if any(_truthy(case.get("exploit_available")) for case in cases):
        return "A public exploit is available, increasing the urgency of remediation."
    if any(_truthy(case.get("poc_available")) for case in cases):
        return "A proof of concept is publicly available."
    if _has_known_exploitation_data(cases):
        return "No active exploitation has been reported at the time of publication."
    return "Exploitation status is currently unavailable."


def _recommended_action_sentence(cases: list[dict[str, Any]], *, vendor: str) -> str:
    remediations = _remediation_rows(cases)
    if not remediations:
        return "The affected system should be reviewed and remediated according to the official vendor advisory."

    primary = remediations[0]
    kb = _clean(primary.get("kb_article")).upper()
    fixed_build = _clean(primary.get("fixed_build"))
    action = clean_visible_text(primary.get("recommended_action"), fallback="")
    vendor_label = clean_visible_text(vendor, fallback="The vendor")

    if kb:
        return f"{vendor_label} recommends applying security update {kb}."
    if fixed_build:
        return "The vendor recommends upgrading to the fixed version."
    if action:
        normalized = action.rstrip(".")
        lower = normalized.lower()
        if lower == "apply the official vendor security update":
            return f"{vendor_label} recommends applying the official vendor security update."
        if lower.startswith("apply "):
            return f"{vendor_label} recommends applying {normalized[6:]}."
        if lower.startswith("upgrade "):
            return f"{vendor_label} recommends upgrading {normalized[8:]}."
        if lower.startswith("review "):
            return "The affected system should be reviewed and remediated according to the official vendor advisory."
        return f"{vendor_label} recommends: {normalized}."
    return "The affected system should be reviewed and remediated according to the official vendor advisory."


def _summary(cases: list[dict[str, Any]], *, client_name: str, vendor: str, product_family: str) -> str:
    cve_count = len(_overview_rows(cases))
    asset_rows = _asset_rows(cases)
    asset_label = _asset_label_for_summary(asset_rows)
    risk = maximum_risk(cases)
    deadline = _long_date(earliest_deadline(cases))
    product_label = f"{clean_visible_text(vendor)} {clean_visible_text(product_family)}"
    vulnerability_word = _plural(cve_count, "vulnerability", "vulnerabilities")
    remediation = _recommended_action_sentence(cases, vendor=vendor)
    exploitation = _exploitation_sentence(cases)

    return (
        f"This bulletin describes {_number_word(cve_count)} confirmed {vulnerability_word} affecting "
        f"{product_label} deployed on {asset_label} within the client environment.\n\n"
        f"The overall risk is assessed as {risk}. {exploitation}\n\n"
        f"{remediation} The remediation should be completed no later than {deadline}."
    )


def _display_product_family(group: BulletinGroup, cases: list[dict[str, Any]]) -> str:
    for case in cases:
        for field in ("product_family", "product", "main_product"):
            candidate = str(case.get(field) or "").strip()
            if candidate and normalize(candidate) == group.normalized_product_family:
                return candidate
    known_labels = {
        "fortios": "FortiOS",
        "exchange server": "Exchange Server",
        "windows server": "Windows Server",
        "windows 11": "Windows 11",
        "windows 10": "Windows 10",
    }
    return known_labels.get(group.normalized_product_family, group.normalized_product_family.title())


def build_bulletin_data(
    group: BulletinGroup,
    cases: list[dict[str, Any]],
    *,
    main_cve_limit: int = DEFAULT_MAIN_CVE_LIMIT,
) -> dict[str, Any]:
    confirmed_cases = [case for case in cases if case.get("applicability_status") == "CONFIRMED"]
    if not confirmed_cases:
        raise ValueError(f"Bulletin group {group.key} has no confirmed CVE")
    confirmed_cases = _confirmed_case_rows(confirmed_cases)

    case_ids = [int(case["case_id"]) for case in confirmed_cases]
    overview = _overview_rows(confirmed_cases)
    main_overview = overview[:main_cve_limit]
    appendix = overview
    client_name = str(confirmed_cases[0].get("client_name") or group.client_id)
    vendor = str(confirmed_cases[0].get("vendor") or group.normalized_vendor)
    product_family = _display_product_family(group, confirmed_cases)
    reference = bulletin_reference(group.key, case_ids)
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    return {
        "schema_version": "BulletinData/v1",
        "title": f"Security Bulletin - {client_name} - {vendor} {product_family}",
        "client_id": group.client_id,
        "client_name": client_name,
        "normalized_vendor": group.normalized_vendor,
        "normalized_product_family": group.normalized_product_family,
        "vendor": vendor,
        "product": product_family,
        "product_family": product_family,
        "group_key": group.key,
        "bulletin_reference": reference,
        "publication_date": now,
        "status": "DRAFT",
        "requires_human_validation": True,
        "case_human_validation_required": any(case.get("requires_human_validation") for case in confirmed_cases),
        "validation_status": "PENDING HUMAN VALIDATION",
        "maximum_risk": maximum_risk(confirmed_cases),
        "treatment_deadline": earliest_deadline(confirmed_cases),
        "executive_summary": _summary(confirmed_cases, client_name=client_name, vendor=vendor, product_family=product_family),
        "vulnerability_overview": main_overview,
        "appendix_vulnerabilities": appendix,
        "affected_assets": _asset_rows(confirmed_cases),
        "remediations": _remediation_rows(confirmed_cases),
        "action_plan": _action_rows(confirmed_cases),
        "risk_factors": _risk_factor_rows(confirmed_cases),
        "iocs": [],
        "references": _reference_rows(confirmed_cases),
        "case_ids": case_ids,
        "cve_count": len(overview),
        "case_count": len(confirmed_cases),
        "generated_at": now,
    }
