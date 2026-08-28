from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor
from airflow.sdk import dag, task

try:
    from airflow.sdk.exceptions import AirflowSkipException
except ImportError:  # pragma: no cover - Airflow compatibility fallback
    from airflow.exceptions import AirflowSkipException

try:
    from airflow.providers.standard.operators.trigger_dagrun import TriggerDagRunOperator
except ImportError:  # pragma: no cover - Airflow compatibility fallback
    from airflow.operators.trigger_dagrun import TriggerDagRunOperator


SRC_PATH = "/opt/airflow/src"
LOCAL_SRC_PATH = str(Path(__file__).resolve().parents[1] / "src")
for path in (SRC_PATH, LOCAL_SRC_PATH):
    if path not in sys.path:
        sys.path.insert(0, path)

from bulletin_data_builder import (  # noqa: E402
    build_bulletin_data,
    bulletin_content_hash,
    group_case_rows,
    stable_json,
)
from bulletin_html_renderer import export_html  # noqa: E402
from bulletin_pdf_exporter import export_pdf_from_html  # noqa: E402
from pipeline_orchestration import (  # noqa: E402
    airflow_pipeline_context,
    mark_pipeline_status,
    scoped_case_params,
    scoped_case_predicate,
)
from vulnflow_assets import BULLETINS_GENERATED, RISK_READY_CASES, asset_schedule, task_outlets, trigger_chaining_enabled  # noqa: E402


SCHEMA_PATH = "/opt/airflow/config/vulnflow_schema.sql"
LOGO_PATH = Path("/opt/airflow/assets/branding/company-logo.webp")
HTML_EXPORT_DIR = Path("/opt/airflow/exports/bulletins/html")
PDF_EXPORT_DIR = Path("/opt/airflow/exports/bulletins/pdf")
SUPERSEDED_EXPORT_DIR = Path("/opt/airflow/exports/bulletins/superseded")
BULLETIN_SCHEDULE = None
ENABLE_DAG_CHAINING = trigger_chaining_enabled()
DEPENDENCY_ECOSYSTEMS = {"npm", "maven", "pypi", "pip", "python", "nuget", "go", "composer", "rubygems", "cargo"}


def _connect():
    return psycopg2.connect(
        host=os.getenv("VULNFLOW_DB_HOST", "vulnflow-postgres"),
        port=int(os.getenv("VULNFLOW_DB_PORT", "5432")),
        dbname=os.getenv("VULNFLOW_DB_NAME", "vulnflow"),
        user=os.getenv("VULNFLOW_DB_USER", "vulnflow"),
        password=os.getenv("VULNFLOW_DB_PASSWORD", "vulnflow"),
    )


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "oui", "on"}


def _case_rows(cur, *, include_sbom: bool, pipeline_context=None) -> list[dict[str, Any]]:
    sbom_filter = ""
    if not include_sbom:
        sbom_filter = """
          AND c.asset_id IS NOT NULL
          AND c.component_id IS NULL
          AND COALESCE(lower(s.ecosystem), '') NOT IN %s
        """
        params: tuple[Any, ...] = (tuple(sorted(DEPENDENCY_ECOSYSTEMS)),)
    else:
        params = ()

    scope_filter = ""
    if pipeline_context and pipeline_context.is_scoped:
        scope_filter = scoped_case_predicate("c")
        params = (*params, *scoped_case_params(pipeline_context))

    cur.execute(
        f"""
        SELECT c.case_id,
               c.client_id,
               cl.name AS client_name,
               c.cve_id,
               c.asset_id,
               c.component_id,
               COALESCE(a.hostname, s.application, c.asset_id, c.component_id) AS asset_name,
               a.ip_address,
               COALESCE(a.vendor, aap.vendor_name, s.ecosystem) AS vendor,
               COALESCE(a.normalized_vendor, aap.normalized_vendor, lower(regexp_replace(s.ecosystem, '[^a-z0-9]+', ' ', 'g'))) AS normalized_vendor,
               COALESCE(a.product, aap.product_name, s.component) AS product,
               COALESCE(a.product_family, a.normalized_product, s.normalized_component, aap.normalized_product) AS normalized_product_family,
               COALESCE(a.product, aap.product_family, aap.product_name, s.component) AS product_family,
               COALESCE(a.product, s.component, aap.product_name) AS main_product,
               aap.product_name AS affected_component,
               aap.product_family AS affected_component_family,
               CASE
                   WHEN a.asset_id IS NOT NULL
                    AND NULLIF(a.build_release, '') IS NOT NULL
                    AND NULLIF(a.installed_fix_id, '') IS NOT NULL
                   THEN CONCAT_WS(
                       ' / ',
                       a.version,
                       CASE
                           WHEN lower(a.build_release) LIKE 'build %%' THEN a.build_release
                           ELSE 'build ' || a.build_release
                       END,
                       a.installed_fix_id
                   )
                   WHEN a.asset_id IS NOT NULL
                    AND NULLIF(a.build_release, '') IS NOT NULL
                   THEN CONCAT_WS(
                       ' / ',
                       a.version,
                       CASE
                           WHEN lower(a.build_release) LIKE 'build %%' THEN a.build_release
                           ELSE 'build ' || a.build_release
                       END
                   )
                   WHEN a.asset_id IS NOT NULL
                    AND NULLIF(a.installed_fix_id, '') IS NOT NULL
                   THEN CONCAT_WS(' / ', a.version, a.installed_fix_id)
                   ELSE COALESCE(a.version, s.version)
               END AS installed_version,
               COALESCE(a.environment, s.environment) AS environment,
               COALESCE(a.criticality, s.component_criticality) AS criticality,
               a.exposed_internet,
               c.applicability_status,
               c.match_confidence,
               c.match_reason,
               c.requires_human_validation,
               c.risk_score,
               c.risk_level,
               c.risk_reasons,
               c.priority,
               c.sla_due_at,
               c.advisory_source,
               c.advisory_url,
               c.remediation_url,
               c.kb_article,
               COALESCE(c.fixed_build, aap.fixed_build) AS fixed_build,
               NULLIF(cm.affected_version_rule, 'unspecified') AS affected_version_range,
               c.vendor_severity,
               c.vendor_cvss_score,
               c.recommended_action,
               c.status AS case_status,
               c.assigned_team AS responsible_team,
               v.title,
               v.description,
               COALESCE(c.vendor_cvss_score, v.cvss_score) AS cvss_score,
               v.exploit_available,
               v.poc_available,
               v.actively_exploited,
               v.exploit_status,
               v.exploit_evidence_json,
               v.epss_score,
               v.epss_score_date,
               CASE
                   WHEN v.epss_score IS NOT NULL
                    AND v.epss_score_date IS NOT NULL
                    AND v.epss_score_date < (CURRENT_DATE - %s::integer)
                   THEN 'STALE'
                   WHEN v.epss_score IS NOT NULL
                    AND v.epss_score_date IS NOT NULL
                   THEN 'AVAILABLE'
                   WHEN EXISTS (
                       SELECT 1
                       FROM epss_collection_runs r
                       WHERE r.status = 'completed'
                         AND r.missing_cves_json->'missing_cve_ids' ? v.cve_id
                   )
                   THEN 'NOT_FOUND'
                   WHEN EXISTS (
                       SELECT 1
                       FROM epss_collection_runs r
                       WHERE r.status = 'failed'
                   )
                   THEN 'FETCH_FAILED'
                   ELSE 'NOT_CHECKED'
               END AS epss_status,
               v.is_kev,
               v.mitigation,
               v.references_json AS references
        FROM client_vulnerability_cases c
        JOIN clients cl
          ON cl.client_id = c.client_id
        JOIN vulnerabilities v
          ON v.cve_id = c.cve_id
        LEFT JOIN assets a
          ON a.asset_id = c.asset_id
        LEFT JOIN sbom_components s
          ON s.component_id = c.component_id
        LEFT JOIN advisory_affected_products aap
          ON aap.advisory_affected_product_id = c.advisory_affected_product_id
        LEFT JOIN candidate_matches cm
          ON cm.candidate_match_id = c.candidate_match_id
        WHERE c.status <> 'Ferme'
          AND c.applicability_status = 'CONFIRMED'
          AND c.risk_level IS NOT NULL
          AND c.risk_calculated_at IS NOT NULL
          AND c.sla_due_at IS NOT NULL
          AND (
              c.asset_id IS NULL
              OR lower(trim(COALESCE(a.asset_status, ''))) IN ('actif', 'active')
          )
          {sbom_filter}
          {scope_filter}
        ORDER BY c.client_id, normalized_vendor, normalized_product_family, c.risk_level, c.cve_id
        """,
        (int(os.getenv("VULNFLOW_EPSS_STALE_DAYS", "2")), *params),
    )
    rows = [dict(row) for row in cur.fetchall()]
    if pipeline_context and pipeline_context.cve_ids and not pipeline_context.is_scoped:
        requested = set(pipeline_context.cve_ids)
        grouped = group_case_rows(rows)
        selected_groups = {
            group
            for group, group_rows in grouped.items()
            if any(str(row.get("cve_id") or "").upper() in requested for row in group_rows)
        }
        return [
            row
            for group, group_rows in grouped.items()
            if group in selected_groups
            for row in group_rows
        ]
    return rows


def _bulletin_freshness_gate(cur, pipeline_context) -> tuple[bool, list[str]]:
    if not pipeline_context.is_scoped:
        return True, []
    reasons: list[str] = []
    cur.execute(
        """
        SELECT status
        FROM pipeline_runs
        WHERE pipeline_run_id = %s
          AND group_key = %s
        """,
        (pipeline_context.pipeline_run_id, pipeline_context.group_key),
    )
    pipeline = cur.fetchone()
    if not pipeline:
        reasons.append("pipeline_run_not_found")
    elif pipeline["status"] != "RUNNING":
        reasons.append(f"pipeline_not_running:{pipeline['status']}")

    cur.execute(
        """
        SELECT COUNT(*) AS missing_risk
        FROM client_vulnerability_cases c
        LEFT JOIN assets a
          ON a.asset_id = c.asset_id
        LEFT JOIN sbom_components s
          ON s.component_id = c.component_id
        LEFT JOIN advisory_affected_products aap
          ON aap.advisory_affected_product_id = c.advisory_affected_product_id
        WHERE c.status <> 'Ferme'
          AND c.applicability_status = 'CONFIRMED'
          AND (
              c.risk_calculated_at IS NULL
              OR c.sla_due_at IS NULL
              OR c.risk_level IS NULL
          )
        """
        + scoped_case_predicate("c"),
        scoped_case_params(pipeline_context),
    )
    if int(cur.fetchone()["missing_risk"]) > 0:
        reasons.append("risk_or_treatment_deadline_missing_for_scope")

    cur.execute(
        """
        SELECT COUNT(*) AS run_count
        FROM risk_runs
        WHERE status = 'completed'
          AND pipeline_run_id = %s
        """,
        (pipeline_context.pipeline_run_id,),
    )
    if int(cur.fetchone()["run_count"]) == 0:
        reasons.append("risk_run_not_completed_for_pipeline")
    return not reasons, reasons


def _sbom_exclusion_counts(cur, *, group_key: str | None = None) -> dict[str, int]:
    group_filter = "AND b.group_key = %s" if group_key else ""
    params: tuple[Any, ...] = (group_key,) if group_key else ()
    cur.execute(
        f"""
        SELECT COUNT(*) AS cases_skipped,
               COUNT(DISTINCT c.client_id || '|' || COALESCE(lower(s.ecosystem), '') || '|' || COALESCE(s.normalized_component, s.component, '')) AS groups_skipped
        FROM client_vulnerability_cases c
        JOIN sbom_components s
          ON s.component_id = c.component_id
        LEFT JOIN bulletin_cases bc
          ON bc.case_id = c.case_id
        LEFT JOIN bulletins b
          ON b.bulletin_id = bc.bulletin_id
        WHERE c.status <> 'Ferme'
          AND c.applicability_status IN ('CONFIRMED', 'REVIEW_REQUIRED')
          AND c.risk_level IS NOT NULL
          {group_filter}
        """,
        params,
    )
    row = cur.fetchone()
    return {
        "cases_skipped_sbom": int(row["cases_skipped"] or 0),
        "groups_skipped_sbom": int(row["groups_skipped"] or 0),
    }


def _inactive_asset_exclusion_counts(cur, *, group_key: str | None = None) -> dict[str, int]:
    group_filter = "AND b.group_key = %s" if group_key else ""
    params: tuple[Any, ...] = (group_key,) if group_key else ()
    cur.execute(
        f"""
        SELECT COUNT(*) AS cases_skipped,
               COUNT(DISTINCT c.client_id || '|' || COALESCE(a.normalized_vendor, '') || '|' || COALESCE(a.product_family, a.normalized_product, '')) AS groups_skipped
        FROM client_vulnerability_cases c
        JOIN assets a
          ON a.asset_id = c.asset_id
        LEFT JOIN bulletin_cases bc
          ON bc.case_id = c.case_id
        LEFT JOIN bulletins b
          ON b.bulletin_id = bc.bulletin_id
        WHERE c.status <> 'Ferme'
          AND c.applicability_status IN ('CONFIRMED', 'REVIEW_REQUIRED')
          AND c.risk_level IS NOT NULL
          AND lower(trim(COALESCE(a.asset_status, ''))) NOT IN ('actif', 'active')
          {group_filter}
        """,
        params,
    )
    row = cur.fetchone()
    return {
        "cases_skipped_inactive_assets": int(row["cases_skipped"] or 0),
        "groups_skipped_inactive_assets": int(row["groups_skipped"] or 0),
    }


def _archive_export_path(path_value: str | None, kind: str) -> str | None:
    if not path_value:
        return path_value
    source = Path(path_value)
    if "superseded" in source.parts or not source.exists():
        return path_value
    target_dir = SUPERSEDED_EXPORT_DIR / kind
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / source.name
    source.replace(target)
    return str(target)


def _supersede_draft_sbom_bulletins(cur, *, group_key: str | None = None) -> int:
    group_filter = "AND b.group_key = %s" if group_key else ""
    params: tuple[Any, ...] = (group_key,) if group_key else ()
    cur.execute(
        f"""
        SELECT b.bulletin_id,
               b.html_export_path,
               b.pdf_export_path
        FROM bulletins b
        WHERE b.status IN ('DRAFT', 'Brouillon', 'SUPERSEDED')
          {group_filter}
          AND (
              COALESCE(b.html_export_path, '') NOT LIKE '%%/superseded/%%'
              OR COALESCE(b.pdf_export_path, '') NOT LIKE '%%/superseded/%%'
          )
          AND EXISTS (
              SELECT 1
              FROM bulletin_cases bc
              JOIN client_vulnerability_cases c
                ON c.case_id = bc.case_id
              WHERE bc.bulletin_id = b.bulletin_id
                AND c.component_id IS NOT NULL
          )
        """,
        params,
    )
    rows = list(cur.fetchall())
    for row in rows:
        html_path = _archive_export_path(row.get("html_export_path"), "html")
        pdf_path = _archive_export_path(row.get("pdf_export_path"), "pdf")
        cur.execute(
            """
            UPDATE bulletins
            SET status = 'SUPERSEDED',
                html_export_path = %s,
                pdf_export_path = %s,
                updated_at = now(),
                generation_metadata_json = COALESCE(generation_metadata_json, '{}'::jsonb)
                    || '{"superseded_reason":"SBOM bulletins disabled by VULNFLOW_ENABLE_SBOM_BULLETINS=false"}'::jsonb
            WHERE bulletin_id = %s
            """,
            (html_path, pdf_path, row["bulletin_id"]),
        )
    return len(rows)


def _supersede_inactive_asset_bulletins(cur, *, group_key: str | None = None) -> int:
    group_filter = "AND b.group_key = %s" if group_key else ""
    params: tuple[Any, ...] = (group_key,) if group_key else ()
    cur.execute(
        f"""
        SELECT b.bulletin_id,
               b.html_export_path,
               b.pdf_export_path
        FROM bulletins b
        WHERE b.status IN ('DRAFT', 'Brouillon', 'SUPERSEDED')
          {group_filter}
          AND (
              COALESCE(b.html_export_path, '') NOT LIKE '%%/superseded/%%'
              OR COALESCE(b.pdf_export_path, '') NOT LIKE '%%/superseded/%%'
          )
          AND EXISTS (
              SELECT 1
              FROM bulletin_cases bc
              JOIN client_vulnerability_cases c
                ON c.case_id = bc.case_id
              JOIN assets a
                ON a.asset_id = c.asset_id
              WHERE bc.bulletin_id = b.bulletin_id
                AND lower(trim(COALESCE(a.asset_status, ''))) NOT IN ('actif', 'active')
          )
          AND NOT EXISTS (
              SELECT 1
              FROM bulletin_cases bc
              JOIN client_vulnerability_cases c
                ON c.case_id = bc.case_id
              JOIN assets a
                ON a.asset_id = c.asset_id
              WHERE bc.bulletin_id = b.bulletin_id
                AND lower(trim(COALESCE(a.asset_status, ''))) IN ('actif', 'active')
          )
        """,
        params,
    )
    rows = list(cur.fetchall())
    for row in rows:
        html_path = _archive_export_path(row.get("html_export_path"), "html")
        pdf_path = _archive_export_path(row.get("pdf_export_path"), "pdf")
        cur.execute(
            """
            UPDATE bulletins
            SET status = 'SUPERSEDED',
                html_export_path = %s,
                pdf_export_path = %s,
                updated_at = now(),
                generation_metadata_json = COALESCE(generation_metadata_json, '{}'::jsonb)
                    || '{"superseded_reason":"All linked assets are inactive or decommissioned"}'::jsonb
            WHERE bulletin_id = %s
            """,
            (html_path, pdf_path, row["bulletin_id"]),
        )
    return len(rows)


def _archive_stale_export_files(cur) -> int:
    cur.execute(
        """
        SELECT html_export_path, pdf_export_path
        FROM bulletins
        WHERE status IN ('DRAFT', 'Brouillon')
        """
    )
    active_paths = {
        str(path)
        for row in cur.fetchall()
        for path in (row.get("html_export_path"), row.get("pdf_export_path"))
        if path
    }
    archived = 0
    for kind, export_dir, pattern in (
        ("html", HTML_EXPORT_DIR, "*.html"),
        ("pdf", PDF_EXPORT_DIR, "*.pdf"),
    ):
        if not export_dir.exists():
            continue
        for path in export_dir.glob(pattern):
            if str(path) in active_paths:
                continue
            _archive_export_path(str(path), kind)
            archived += 1
    return archived


def _supersede_obsolete_draft_bulletins(cur, active_group_keys: set[str]) -> int:
    cur.execute(
        """
        SELECT b.bulletin_id,
               b.html_export_path,
               b.pdf_export_path
        FROM bulletins b
        WHERE b.status IN ('DRAFT', 'Brouillon')
          AND NOT (b.group_key = ANY(%s))
          AND (
              COALESCE(b.html_export_path, '') NOT LIKE '%%/superseded/%%'
              OR COALESCE(b.pdf_export_path, '') NOT LIKE '%%/superseded/%%'
          )
        """,
        (list(active_group_keys),),
    )
    rows = list(cur.fetchall())
    for row in rows:
        html_path = _archive_export_path(row.get("html_export_path"), "html")
        pdf_path = _archive_export_path(row.get("pdf_export_path"), "pdf")
        cur.execute(
            """
            UPDATE bulletins
            SET status = 'SUPERSEDED',
                html_export_path = %s,
                pdf_export_path = %s,
                updated_at = now(),
                generation_metadata_json = COALESCE(generation_metadata_json, '{}'::jsonb)
                    || '{"superseded_reason":"Bulletin group is no longer eligible for operational generation"}'::jsonb
            WHERE bulletin_id = %s
            """,
            (html_path, pdf_path, row["bulletin_id"]),
        )
    return len(rows)


def _supersede_duplicate_active_bulletins(
    cur,
    *,
    group_key: str | None = None,
) -> int:
    scope_filter = "AND group_key = %s" if group_key else ""
    params: tuple[Any, ...] = (group_key,) if group_key else ()
    cur.execute(
        f"""
        WITH ranked AS (
            SELECT bulletin_id,
                   group_key,
                   row_number() OVER (
                       PARTITION BY group_key
                       ORDER BY updated_at DESC, bulletin_id DESC
                   ) AS row_number
            FROM bulletins
            WHERE status IN ('DRAFT', 'Brouillon', 'READY_FOR_VALIDATION')
              {scope_filter}
        )
        UPDATE bulletins b
        SET status = 'SUPERSEDED',
            updated_at = now(),
            generation_metadata_json = COALESCE(b.generation_metadata_json, '{{}}'::jsonb)
                || '{{"superseded_reason":"A newer operational bulletin version exists"}}'::jsonb
        FROM ranked r
        WHERE b.bulletin_id = r.bulletin_id
          AND (
              r.row_number > 1
              OR r.group_key IS NULL
          )
        RETURNING b.bulletin_id
        """,
        params,
    )
    return len(cur.fetchall())


def _unchanged_draft_exists(
    cur,
    *,
    group_key: str,
    content_sha256: str,
    require_pdf: bool,
) -> bool:
    cur.execute(
        """
        SELECT html_export_path, pdf_export_path
        FROM bulletins
        WHERE group_key = %s
          AND status IN ('DRAFT', 'Brouillon', 'READY_FOR_VALIDATION')
          AND content_sha256 = %s
          AND NOT EXISTS (
              SELECT 1 FROM bulletin_versions bv
              WHERE bv.bulletin_id = bulletins.bulletin_id
                AND bv.version_number = bulletins.current_version_number
                AND bv.source_type = 'UPLOADED'
          )
        ORDER BY updated_at DESC
        LIMIT 1
        """,
        (group_key, content_sha256),
    )
    existing = cur.fetchone()
    if not existing:
        return False
    html_path = existing.get("html_export_path")
    pdf_path = existing.get("pdf_export_path")
    if not html_path or not Path(html_path).exists():
        return False
    return not require_pdf or bool(pdf_path and Path(pdf_path).exists())


def _upsert_bulletin(cur, payload: dict[str, Any], html_path: Path, pdf_path: Path | None) -> tuple[int, str]:
    cur.execute(
        """
        SELECT bulletin_id
        FROM bulletins
        WHERE group_key = %s
          AND status IN ('DRAFT', 'Brouillon', 'READY_FOR_VALIDATION')
          AND NOT EXISTS (
              SELECT 1 FROM bulletin_versions bv
              WHERE bv.bulletin_id = bulletins.bulletin_id
                AND bv.version_number = bulletins.current_version_number
                AND bv.source_type = 'UPLOADED'
          )
        ORDER BY updated_at DESC
        LIMIT 1
        """,
        (payload["group_key"],),
    )
    existing = cur.fetchone()
    values = (
        payload["client_id"],
        payload["product_family"],
        payload["title"],
        "DRAFT",
        payload["requires_human_validation"],
        payload["vendor"],
        payload["normalized_vendor"],
        payload["product_family"],
        payload["normalized_product_family"],
        payload["group_key"],
        payload["bulletin_reference"],
        str(html_path),
        str(pdf_path) if pdf_path else None,
        payload["case_count"],
        payload["cve_count"],
        payload["content_sha256"],
        stable_json(
            {
                "schema_version": payload["schema_version"],
                "main_cve_limit": int(os.getenv("VULNFLOW_BULLETIN_MAIN_CVE_LIMIT", "25")),
                "html_generated": True,
                "pdf_generated": pdf_path is not None,
            }
        ),
    )
    if existing:
        bulletin_id = int(existing["bulletin_id"])
        cur.execute(
            """
            UPDATE bulletins
            SET client_id = %s,
                product = %s,
                title = %s,
                status = %s,
                requires_human_validation = %s,
                vendor = %s,
                normalized_vendor = %s,
                product_family = %s,
                normalized_product_family = %s,
                group_key = %s,
                bulletin_reference = %s,
                html_export_path = %s,
                pdf_export_path = %s,
                case_count = %s,
                cve_count = %s,
                content_sha256 = %s,
                generation_metadata_json = %s::jsonb,
                generated_at = now(),
                updated_at = now()
            WHERE bulletin_id = %s
            """,
            (*values, bulletin_id),
        )
        outcome = "updated"
    else:
        cur.execute(
            """
            INSERT INTO bulletins (
                client_id,
                product,
                title,
                status,
                requires_human_validation,
                vendor,
                normalized_vendor,
                product_family,
                normalized_product_family,
                group_key,
                bulletin_reference,
                html_export_path,
                pdf_export_path,
                case_count,
                cve_count,
                content_sha256,
                generation_metadata_json,
                generated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, now()
            )
            RETURNING bulletin_id
            """,
            values,
        )
        bulletin_id = int(cur.fetchone()["bulletin_id"])
        outcome = "inserted"

    cur.execute("DELETE FROM bulletin_cases WHERE bulletin_id = %s", (bulletin_id,))
    cur.executemany(
        """
        INSERT INTO bulletin_cases (bulletin_id, case_id)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING
        """,
        [(bulletin_id, case_id) for case_id in payload["case_ids"]],
    )
    cur.execute(
        """
        INSERT INTO bulletin_versions (
            bulletin_id, version_number, source_type, status,
            html_export_path, pdf_export_path, content_sha256, created_by
        )
        SELECT bulletin_id, current_version_number, 'GENERATED', 'DRAFT',
               html_export_path, pdf_export_path, content_sha256, 'VulnFlow System'
        FROM bulletins
        WHERE bulletin_id = %s
        ON CONFLICT (bulletin_id, version_number) DO UPDATE
        SET status = 'DRAFT',
            html_export_path = EXCLUDED.html_export_path,
            pdf_export_path = EXCLUDED.pdf_export_path,
            content_sha256 = EXCLUDED.content_sha256
        WHERE bulletin_versions.source_type = 'GENERATED'
        """,
        (bulletin_id,),
    )
    return bulletin_id, outcome


@dag(
    dag_id="vulnflow_bulletin_generation",
    schedule=asset_schedule(RISK_READY_CASES, default=BULLETIN_SCHEDULE),
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["vulnflow", "bulletins", "html", "pdf"],
)
def vulnflow_bulletin_generation():
    @task
    def ensure_schema() -> None:
        schema_sql = Path(SCHEMA_PATH).read_text(encoding="utf-8")
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(schema_sql)

    @task(pool="pdf_generation_pool")
    def generate_bulletins() -> dict[str, int]:
        if not LOGO_PATH.exists():
            raise FileNotFoundError(f"Bulletin logo is missing: {LOGO_PATH}")

        main_cve_limit = int(os.getenv("VULNFLOW_BULLETIN_MAIN_CVE_LIMIT", "25"))
        generate_pdf = _env_bool("VULNFLOW_GENERATE_PDF", True)
        include_sbom = _env_bool("VULNFLOW_ENABLE_SBOM_BULLETINS", False)
        counters = {
            "groups_seen": 0,
            "groups_skipped_no_confirmed": 0,
            "groups_skipped_sbom": 0,
            "cases_skipped_sbom": 0,
            "groups_skipped_inactive_assets": 0,
            "cases_skipped_inactive_assets": 0,
            "sbom_bulletins_superseded": 0,
            "inactive_asset_bulletins_superseded": 0,
            "obsolete_bulletins_superseded": 0,
            "duplicate_active_bulletins_superseded": 0,
            "stale_export_files_archived": 0,
            "bulletins_inserted": 0,
            "bulletins_updated": 0,
            "html_generated": 0,
            "pdf_generated": 0,
            "groups_skipped_unchanged": 0,
            "groups_skipped_freshness_gate": 0,
        }
        errors: list[dict[str, Any]] = []

        with _connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                pipeline_context = airflow_pipeline_context()
                cur.execute(
                    """
                    INSERT INTO bulletin_generation_runs (pipeline_run_id, group_key)
                    VALUES (%s, %s)
                    RETURNING bulletin_generation_run_id
                    """,
                    (pipeline_context.pipeline_run_id, pipeline_context.group_key),
                )
                run_id = int(cur.fetchone()["bulletin_generation_run_id"])
                conn.commit()

                try:
                    if pipeline_context.is_scoped:
                        gate_ok, gate_reasons = _bulletin_freshness_gate(cur, pipeline_context)
                        if not gate_ok:
                            counters["groups_skipped_freshness_gate"] = 1
                            message = "Bulletin freshness gate failed: " + ", ".join(gate_reasons)
                            mark_pipeline_status(
                                cur,
                                pipeline_context,
                                "FAILED",
                                stage="BULLETIN_GENERATION",
                                error_message=message,
                                error_type="FreshnessGateFailed",
                            )
                            raise RuntimeError(message)

                    targeted_run = pipeline_context.is_scoped or bool(
                        pipeline_context.cve_ids
                    )
                    scoped_group_key = pipeline_context.group_key if pipeline_context.is_scoped else None
                    counters["duplicate_active_bulletins_superseded"] = (
                        _supersede_duplicate_active_bulletins(
                            cur,
                            group_key=scoped_group_key,
                        )
                    )
                    if not pipeline_context.cve_ids or pipeline_context.is_scoped:
                        counters.update(_inactive_asset_exclusion_counts(cur, group_key=scoped_group_key))
                        counters["inactive_asset_bulletins_superseded"] = _supersede_inactive_asset_bulletins(
                            cur,
                            group_key=scoped_group_key,
                        )
                        if not include_sbom:
                            counters.update(_sbom_exclusion_counts(cur, group_key=scoped_group_key))
                            counters["sbom_bulletins_superseded"] = _supersede_draft_sbom_bulletins(
                                cur,
                                group_key=scoped_group_key,
                            )
                    grouped = group_case_rows(_case_rows(cur, include_sbom=include_sbom, pipeline_context=pipeline_context))
                    counters["groups_seen"] = len(grouped)
                    active_group_keys = {group.key for group, rows in grouped.items() if any(row.get("applicability_status") == "CONFIRMED" for row in rows)}
                    for group, rows in grouped.items():
                        confirmed_count = sum(1 for row in rows if row.get("applicability_status") == "CONFIRMED")
                        if confirmed_count == 0:
                            counters["groups_skipped_no_confirmed"] += 1
                            continue

                        payload = build_bulletin_data(group, rows, main_cve_limit=main_cve_limit)
                        payload["content_sha256"] = bulletin_content_hash(payload)
                        if _unchanged_draft_exists(
                            cur,
                            group_key=payload["group_key"],
                            content_sha256=payload["content_sha256"],
                            require_pdf=generate_pdf,
                        ):
                            counters["groups_skipped_unchanged"] += 1
                            continue
                        html_path = export_html(payload, HTML_EXPORT_DIR)
                        counters["html_generated"] += 1
                        pdf_path = None
                        if generate_pdf:
                            pdf_path = PDF_EXPORT_DIR / f"{html_path.stem}.pdf"
                            export_pdf_from_html(html_path, pdf_path)
                            counters["pdf_generated"] += 1

                        bulletin_id, outcome = _upsert_bulletin(cur, payload, html_path, pdf_path)
                        if pipeline_context.pipeline_run_id:
                            cur.execute(
                                "UPDATE bulletins SET pipeline_run_id = %s WHERE bulletin_id = %s",
                                (pipeline_context.pipeline_run_id, bulletin_id),
                            )
                        counters[f"bulletins_{outcome}"] += 1

                    if targeted_run:
                        counters["obsolete_bulletins_superseded"] = 0
                        counters["stale_export_files_archived"] = 0
                    else:
                        counters["obsolete_bulletins_superseded"] = _supersede_obsolete_draft_bulletins(cur, active_group_keys)
                        counters["stale_export_files_archived"] = _archive_stale_export_files(cur)
                    if pipeline_context.is_scoped:
                        mark_pipeline_status(cur, pipeline_context, "RUNNING", stage="BULLETIN_GENERATION")

                    cur.execute(
                        """
                        UPDATE bulletin_generation_runs
                        SET finished_at = now(),
                            status = 'completed',
                            groups_seen = %s,
                            groups_skipped_no_confirmed = %s,
                            groups_skipped_sbom = %s,
                            cases_skipped_sbom = %s,
                            duplicate_active_bulletins_superseded = %s,
                            bulletins_inserted = %s,
                            bulletins_updated = %s,
                            html_generated = %s,
                            pdf_generated = %s,
                            groups_skipped_unchanged = %s,
                            groups_skipped_freshness_gate = %s,
                            error_count = 0
                        WHERE bulletin_generation_run_id = %s
                        """,
                        (
                            counters["groups_seen"],
                            counters["groups_skipped_no_confirmed"],
                            counters["groups_skipped_sbom"],
                            counters["cases_skipped_sbom"],
                            counters["duplicate_active_bulletins_superseded"],
                            counters["bulletins_inserted"],
                            counters["bulletins_updated"],
                            counters["html_generated"],
                            counters["pdf_generated"],
                            counters["groups_skipped_unchanged"],
                            counters["groups_skipped_freshness_gate"],
                            run_id,
                        ),
                    )
                    conn.commit()
                except Exception as exc:
                    conn.rollback()
                    errors.append({"error": str(exc)})
                    mark_pipeline_status(
                        cur,
                        pipeline_context,
                        "FAILED",
                        stage="BULLETIN_GENERATION",
                        error_message=str(exc),
                        error_type=type(exc).__name__,
                    )
                    cur.execute(
                        """
                        UPDATE bulletin_generation_runs
                        SET finished_at = now(),
                            status = 'failed',
                            groups_seen = %s,
                            groups_skipped_no_confirmed = %s,
                            groups_skipped_sbom = %s,
                            cases_skipped_sbom = %s,
                            duplicate_active_bulletins_superseded = %s,
                            bulletins_inserted = %s,
                            bulletins_updated = %s,
                            html_generated = %s,
                            pdf_generated = %s,
                            groups_skipped_unchanged = %s,
                            groups_skipped_freshness_gate = %s,
                            error_count = %s,
                            error_details = %s::jsonb
                        WHERE bulletin_generation_run_id = %s
                        """,
                        (
                            counters["groups_seen"],
                            counters["groups_skipped_no_confirmed"],
                            counters["groups_skipped_sbom"],
                            counters["cases_skipped_sbom"],
                            counters["duplicate_active_bulletins_superseded"],
                            counters["bulletins_inserted"],
                            counters["bulletins_updated"],
                            counters["html_generated"],
                            counters["pdf_generated"],
                            counters["groups_skipped_unchanged"],
                            counters["groups_skipped_freshness_gate"],
                            len(errors),
                            json.dumps(errors, ensure_ascii=True),
                            run_id,
                        ),
                    )
                    conn.commit()
                    raise
        return {**counters, "error_count": len(errors)}

    @task(outlets=task_outlets(BULLETINS_GENERATED))
    def publish_generated_changes(generation_result: dict[str, int]) -> dict[str, int]:
        generated = int(generation_result.get("bulletins_inserted", 0)) + int(
            generation_result.get("bulletins_updated", 0)
        )
        if generated == 0:
            raise AirflowSkipException(
                "Bulletin content hashes are unchanged; no validation is required"
            )
        return generation_result

    generation_task = generate_bulletins()
    generated_change_task = publish_generated_changes(generation_task)
    ensure_schema() >> generation_task

    if ENABLE_DAG_CHAINING:
        generated_change_task >> TriggerDagRunOperator(
            task_id="trigger_bulletin_validation",
            trigger_dag_id="validate_generated_bulletins",
            conf={
                "pipeline_run_id": "{{ dag_run.conf.get('pipeline_run_id') }}",
                "group_key": "{{ dag_run.conf.get('group_key') }}",
                "client_id": "{{ dag_run.conf.get('client_id') }}",
                "normalized_vendor": "{{ dag_run.conf.get('normalized_vendor') }}",
                "normalized_product_family": "{{ dag_run.conf.get('normalized_product_family') }}",
                "source_dag_id": "vulnflow_bulletin_generation",
                "source_run_id": "{{ run_id }}",
                "trigger_type": "bulletins_generated",
                "trigger_timestamp": "{{ dag_run.run_after.isoformat() }}",
                "mode": "{{ dag_run.conf.get('mode', 'batch') }}",
                "cve_ids": "{{ dag_run.conf.get('cve_ids', []) }}",
                "continue_pipeline": True,
            },
            wait_for_completion=False,
        )


vulnflow_bulletin_generation()
