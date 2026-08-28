from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta, timezone
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

from cisco_collector import (  # noqa: E402
    DEFAULT_CISCO_API_BASE_URL,
    classify_hash_change,
    collect_cisco_advisories as collect_from_cisco,
    normalize_text,
    stable_json,
)
from pipeline_change_gate import downstream_change_decision  # noqa: E402
from vulnflow_assets import (  # noqa: E402
    NORMALIZED_VULNERABILITIES,
    SOURCE_VENDOR_ADVISORIES,
    task_outlets,
    trigger_chaining_enabled,
)


SCHEMA_PATH = "/opt/airflow/config/vulnflow_schema.sql"
CISCO_PSIRT_SCHEDULE = os.getenv("CISCO_PSIRT_SCHEDULE", "40 2 * * *").strip() or "40 2 * * *"
CISCO_TASK_TIMEOUT_MINUTES = int(os.getenv("CISCO_PSIRT_TASK_TIMEOUT_MINUTES", "15"))
ENABLE_DAG_CHAINING = trigger_chaining_enabled()


def _connect():
    return psycopg2.connect(
        host=os.getenv("VULNFLOW_DB_HOST", "vulnflow-postgres"),
        port=int(os.getenv("VULNFLOW_DB_PORT", "5432")),
        dbname=os.getenv("VULNFLOW_DB_NAME", "vulnflow"),
        user=os.getenv("VULNFLOW_DB_USER", "vulnflow"),
        password=os.getenv("VULNFLOW_DB_PASSWORD", "vulnflow"),
    )


def _monitored_cisco_products(cur) -> list[str]:
    cur.execute(
        """
        SELECT DISTINCT normalized_product
        FROM inventory_vendor_products
        WHERE normalized_vendor = 'cisco'
          AND normalized_product IS NOT NULL
          AND normalized_product <> ''
        ORDER BY normalized_product
        """
    )
    return [row["normalized_product"] for row in cur.fetchall()]


def _product_is_monitored(product_name: str, monitored_products: list[str]) -> bool:
    normalized = normalize_text(product_name)
    return any(
        monitored in normalized or normalized in monitored
        for monitored in monitored_products
    )


@dag(
    dag_id="collect_cisco_advisories",
    schedule=CISCO_PSIRT_SCHEDULE,
    start_date=datetime(2026, 1, 1, tzinfo=timezone.utc),
    catchup=False,
    tags=["vulnflow", "cisco", "advisories"],
)
def collect_cisco_advisories():
    @task
    def ensure_schema() -> None:
        schema_sql = Path(SCHEMA_PATH).read_text(encoding="utf-8")
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(schema_sql)

    @task(execution_timeout=timedelta(minutes=CISCO_TASK_TIMEOUT_MINUTES))
    def collect_cisco_task() -> dict[str, Any]:
        timeout_seconds = int(os.getenv("CISCO_PSIRT_TIMEOUT_SECONDS", "60"))
        max_retries = int(os.getenv("CISCO_PSIRT_MAX_RETRIES", "3"))
        api_secret = os.getenv("CISCO_PSIRT_CLIENT_SECRET", "").strip()
        cisco_client_id = os.getenv("CISCO_PSIRT_CLIENT_ID", "").strip()
        cisco_token_url = os.getenv("CISCO_PSIRT_TOKEN_URL", "").strip()
        cisco_base_url = os.getenv("CISCO_PSIRT_BASE_URL", DEFAULT_CISCO_API_BASE_URL).strip()
        counters = {
            "documents_requested": 1,
            "documents_collected": 0,
            "advisories_seen": 0,
            "advisories_inserted": 0,
            "advisories_updated": 0,
            "advisories_unchanged": 0,
            "affected_products_seen": 0,
            "affected_products_upserted": 0,
            "vulnerabilities_linked": 0,
            "request_count": 1,
            "error_count": 0,
        }
        errors: list[dict[str, Any]] = []

        with _connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO advisory_collection_runs (
                        source,
                        collection_mode,
                        document_id,
                        documents_requested
                    ) VALUES ('CISCO_PSIRT', 'all', 'all', 1)
                    RETURNING collection_run_id
                    """
                )
                collection_run_id = int(cur.fetchone()["collection_run_id"])
                conn.commit()

                try:
                    monitored_products = _monitored_cisco_products(cur)
                    collection = collect_from_cisco(
                        base_url=cisco_base_url,
                        timeout_seconds=timeout_seconds,
                        max_retries=max_retries,
                        monitored_products=[normalize_text(value) for value in monitored_products],
                        api_secret=api_secret,
                        client_id=cisco_client_id,
                        token_url=cisco_token_url,
                    )
                    counters["documents_collected"] = 1
                    counters["request_count"] = collection.request_count

                    matching_products = (
                        [
                            product
                            for product in collection.affected_products
                            if _product_is_monitored(
                                product["product_name"],
                                [normalize_text(value) for value in monitored_products],
                            )
                        ]
                        if monitored_products
                        else collection.affected_products
                    )
                    matching_advisory_ids = {
                        product["source_advisory_id"] for product in matching_products
                    }
                    matching_advisories = [
                        advisory
                        for advisory in collection.advisories
                        if advisory["source_advisory_id"] in matching_advisory_ids
                    ]
                    counters["advisories_seen"] = len(matching_advisories)
                    counters["affected_products_seen"] = len(matching_products)

                    advisory_db_ids: dict[str, int] = {}
                    for advisory in matching_advisories:
                        cur.execute(
                            """
                            SELECT advisory_id, raw_sha256
                            FROM advisories
                            WHERE source = %s
                              AND source_advisory_id = %s
                            """,
                            (advisory["source"], advisory["source_advisory_id"]),
                        )
                        existing = cur.fetchone()
                        outcome = classify_hash_change(
                            existing["raw_sha256"] if existing else None,
                            advisory["raw_sha256"],
                        )
                        cur.execute(
                            """
                            INSERT INTO advisories (
                                source,
                                source_advisory_id,
                                vendor_name,
                                title,
                                advisory_url,
                                cvrf_url,
                                published_at,
                                updated_at_source,
                                severity,
                                cvss_score,
                                cve_ids,
                                summary,
                                required_action,
                                vendor_actively_exploited,
                                vendor_publicly_disclosed,
                                vendor_exploitability_assessment,
                                vendor_exploit_status_raw,
                                contract_version,
                                raw_json,
                                raw_sha256,
                                last_seen_at,
                                updated_at
                            ) VALUES (
                                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                                %s, %s, %s, %s, %s, %s, %s,
                                %s, %s::jsonb, %s, now(), now()
                            )
                            ON CONFLICT (source, source_advisory_id)
                            DO UPDATE SET
                                vendor_name = EXCLUDED.vendor_name,
                                title = EXCLUDED.title,
                                advisory_url = EXCLUDED.advisory_url,
                                cvrf_url = EXCLUDED.cvrf_url,
                                published_at = EXCLUDED.published_at,
                                updated_at_source = EXCLUDED.updated_at_source,
                                severity = EXCLUDED.severity,
                                cvss_score = EXCLUDED.cvss_score,
                                cve_ids = EXCLUDED.cve_ids,
                                summary = EXCLUDED.summary,
                                required_action = EXCLUDED.required_action,
                                vendor_actively_exploited = EXCLUDED.vendor_actively_exploited,
                                vendor_publicly_disclosed = EXCLUDED.vendor_publicly_disclosed,
                                vendor_exploitability_assessment = EXCLUDED.vendor_exploitability_assessment,
                                vendor_exploit_status_raw = EXCLUDED.vendor_exploit_status_raw,
                                contract_version = EXCLUDED.contract_version,
                                raw_json = EXCLUDED.raw_json,
                                raw_sha256 = EXCLUDED.raw_sha256,
                                last_seen_at = now(),
                                updated_at = CASE
                                    WHEN advisories.raw_sha256 IS DISTINCT FROM EXCLUDED.raw_sha256
                                    THEN now()
                                    ELSE advisories.updated_at
                                END
                            RETURNING advisory_id
                            """,
                            (
                                advisory["source"],
                                advisory["source_advisory_id"],
                                advisory["vendor_name"],
                                advisory["title"],
                                advisory["advisory_url"],
                                advisory["cvrf_url"],
                                advisory["published_at"],
                                advisory["updated_at_source"],
                                advisory["severity"],
                                advisory["cvss_score"],
                                advisory["cve_ids"],
                                advisory["summary"],
                                advisory["required_action"],
                                advisory.get("vendor_actively_exploited"),
                                advisory.get("vendor_publicly_disclosed"),
                                advisory.get("vendor_exploitability_assessment"),
                                advisory["vendor_exploit_status_raw"],
                                advisory["contract_version"],
                                stable_json(advisory["raw_json"]),
                                advisory["raw_sha256"],
                            ),
                        )
                        advisory_id = int(cur.fetchone()["advisory_id"])
                        advisory_db_ids[advisory["source_advisory_id"]] = advisory_id
                        if outcome == "INSERT":
                            counters["advisories_inserted"] += 1
                        elif outcome == "UPDATE":
                            counters["advisories_updated"] += 1
                        else:
                            counters["advisories_unchanged"] += 1

                    for product in matching_products:
                        advisory_id = advisory_db_ids.get(product["source_advisory_id"])
                        if advisory_id is None:
                            continue
                        product_values = (
                            product["source"],
                            product["source_advisory_id"],
                            product["cve_id"],
                            product["product_id"],
                            product["vendor_name"],
                            product["product_name"],
                            product["normalized_vendor"],
                            product["normalized_product"],
                            product["product_family"],
                            product["severity"],
                            product["cvss_score"],
                            product["cvss_vector"],
                            product["fixed_build"],
                            product["remediation_url"],
                            product["kb_article"],
                            product["contract_version"],
                            stable_json(product["raw_json"]),
                        )
                        cur.execute(
                            """
                            SELECT advisory_affected_product_id
                            FROM advisory_affected_products
                            WHERE advisory_id = %s
                              AND COALESCE(cve_id, '') = COALESCE(%s, '')
                              AND COALESCE(product_id, '') = COALESCE(%s, '')
                              AND product_name = %s
                            """,
                            (
                                advisory_id,
                                product["cve_id"],
                                product["product_id"],
                                product["product_name"],
                            ),
                        )
                        existing_product = cur.fetchone()
                        if existing_product:
                            cur.execute(
                                """
                                UPDATE advisory_affected_products
                                SET source = %s,
                                    source_advisory_id = %s,
                                    cve_id = %s,
                                    product_id = %s,
                                    vendor_name = %s,
                                    product_name = %s,
                                    normalized_vendor = %s,
                                    normalized_product = %s,
                                    product_family = %s,
                                    severity = %s,
                                    cvss_score = %s,
                                    cvss_vector = %s,
                                    fixed_build = %s,
                                    remediation_url = %s,
                                    kb_article = %s,
                                    contract_version = %s,
                                    raw_json = %s::jsonb,
                                    last_seen_at = now(),
                                    updated_at = now()
                                WHERE advisory_affected_product_id = %s
                                """,
                                (*product_values, existing_product["advisory_affected_product_id"]),
                            )
                        else:
                            cur.execute(
                                """
                                INSERT INTO advisory_affected_products (
                                    advisory_id,
                                    source,
                                    source_advisory_id,
                                    cve_id,
                                    product_id,
                                    vendor_name,
                                    product_name,
                                    normalized_vendor,
                                    normalized_product,
                                    product_family,
                                    severity,
                                    cvss_score,
                                    cvss_vector,
                                    fixed_build,
                                    remediation_url,
                                    kb_article,
                                    contract_version,
                                    raw_json,
                                    last_seen_at,
                                    updated_at
                                ) VALUES (
                                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                                    %s, %s, %s, %s, %s, %s, %s, %s::jsonb, now(), now()
                                )
                                """,
                                (advisory_id, *product_values),
                            )
                        counters["affected_products_upserted"] += 1

                    for advisory in matching_advisories:
                        for cve_id in advisory["cve_ids"]:
                            matching_vendor_product = next(
                                (
                                    product
                                    for product in matching_products
                                    if product["source_advisory_id"] == advisory["source_advisory_id"]
                                    and product["cve_id"] == cve_id
                                ),
                                None,
                            )
                            affected_product = (
                                matching_vendor_product["product_name"]
                                if matching_vendor_product
                                else "Cisco"
                            )
                            references = [{"source": advisory["source"], "url": advisory["advisory_url"]}]
                            cur.execute(
                                """
                                INSERT INTO vulnerabilities (
                                    cve_id,
                                    source,
                                    title,
                                    description,
                                    published_at,
                                    modified_at,
                                    cvss_score,
                                    cvss_severity,
                                    affected_vendor,
                                    affected_product,
                                    vendor_actively_exploited,
                                    vendor_exploit_assessment_json,
                                    references_json,
                                    raw_json,
                                    raw_sha256,
                                    updated_at
                                ) VALUES (
                                    %s, %s, %s, %s, %s, %s, %s, %s,
                                    %s, %s, %s, %s::jsonb,
                                    %s::jsonb, %s::jsonb, %s, now()
                                )
                                ON CONFLICT (cve_id)
                                DO UPDATE SET
                                    title = COALESCE(vulnerabilities.title, EXCLUDED.title),
                                    description = COALESCE(vulnerabilities.description, EXCLUDED.description),
                                    published_at = COALESCE(vulnerabilities.published_at, EXCLUDED.published_at),
                                    modified_at = GREATEST(
                                        COALESCE(vulnerabilities.modified_at, EXCLUDED.modified_at),
                                        COALESCE(EXCLUDED.modified_at, vulnerabilities.modified_at)
                                    ),
                                    cvss_score = COALESCE(vulnerabilities.cvss_score, EXCLUDED.cvss_score),
                                    cvss_severity = COALESCE(vulnerabilities.cvss_severity, EXCLUDED.cvss_severity),
                                    affected_vendor = COALESCE(vulnerabilities.affected_vendor, 'Cisco'),
                                    affected_product = COALESCE(vulnerabilities.affected_product, %s),
                                    vendor_actively_exploited = EXCLUDED.vendor_actively_exploited,
                                    vendor_exploit_assessment_json = EXCLUDED.vendor_exploit_assessment_json,
                                    references_json = CASE
                                        WHEN vulnerabilities.references_json = '[]'::jsonb
                                        THEN EXCLUDED.references_json
                                        ELSE vulnerabilities.references_json
                                    END,
                                    updated_at = now()
                                RETURNING cve_id
                                """,
                                (
                                    cve_id,
                                    advisory["source"],
                                    advisory["title"],
                                    advisory["summary"],
                                    advisory["published_at"],
                                    advisory["updated_at_source"],
                                    advisory["cvss_score"],
                                    advisory["severity"],
                                    "Cisco",
                                    affected_product,
                                    advisory.get("vendor_actively_exploited"),
                                    stable_json(
                                        {
                                            "source": advisory["source"],
                                            "vendor_assessment": {
                                                "severity": advisory["severity"],
                                                "cvss_score": str(advisory["cvss_score"])
                                                if advisory["cvss_score"] is not None
                                                else None,
                                                "updated_at_source": str(advisory["updated_at_source"]),
                                            },
                                        }
                                    ),
                                    stable_json(references),
                                    stable_json(advisory["raw_json"]),
                                    advisory["raw_sha256"],
                                    affected_product,
                                ),
                            )
                            if cur.fetchone():
                                counters["vulnerabilities_linked"] += 1

                    cur.execute(
                        """
                        UPDATE advisory_collection_runs
                        SET finished_at = now(),
                            status = 'completed',
                            document_id = %s,
                            documents_requested = %s,
                            documents_collected = %s,
                            advisories_seen = %s,
                            advisories_inserted = %s,
                            advisories_updated = %s,
                            advisories_unchanged = %s,
                            affected_products_seen = %s,
                            affected_products_upserted = %s,
                            vulnerabilities_linked = %s,
                            request_count = %s,
                            error_count = 0
                        WHERE collection_run_id = %s
                        """,
                        (
                            "all",
                            counters["documents_requested"],
                            counters["documents_collected"],
                            counters["advisories_seen"],
                            counters["advisories_inserted"],
                            counters["advisories_updated"],
                            counters["advisories_unchanged"],
                            counters["affected_products_seen"],
                            counters["affected_products_upserted"],
                            counters["vulnerabilities_linked"],
                            counters["request_count"],
                            collection_run_id,
                        ),
                    )
                    conn.commit()
                except Exception as exc:
                    errors.append({"error": str(exc)})
                    cur.execute(
                        """
                        UPDATE advisory_collection_runs
                        SET finished_at = now(),
                            status = 'failed',
                            documents_collected = %s,
                            advisories_seen = %s,
                            advisories_inserted = %s,
                            advisories_updated = %s,
                            advisories_unchanged = %s,
                            affected_products_seen = %s,
                            affected_products_upserted = %s,
                            vulnerabilities_linked = %s,
                            request_count = %s,
                            error_count = %s,
                            error_details = %s::jsonb
                        WHERE collection_run_id = %s
                        """,
                        (
                            counters["documents_collected"],
                            counters["advisories_seen"],
                            counters["advisories_inserted"],
                            counters["advisories_updated"],
                            counters["advisories_unchanged"],
                            counters["affected_products_seen"],
                            counters["affected_products_upserted"],
                            counters["vulnerabilities_linked"],
                            counters["request_count"],
                            len(errors),
                            json.dumps(errors, ensure_ascii=True),
                            collection_run_id,
                        ),
                    )
                    conn.commit()
                    raise

        return {**counters, "error_count": len(errors)}

    @task(outlets=task_outlets(SOURCE_VENDOR_ADVISORIES, NORMALIZED_VULNERABILITIES))
    def publish_cisco_change(collection_result: dict[str, Any]) -> dict[str, Any]:
        decision = downstream_change_decision(
            collection_result,
            change_fields=(
                "advisories_inserted",
                "advisories_updated",
                "advisories_seen",
                "vulnerabilities_linked",
            ),
            allow_inherited_pipeline=False,
        )
        if not decision.should_continue:
            raise AirflowSkipException(
                "Cisco PSIRT collection completed without relevant advisory data"
            )
        return {**collection_result, "change_gate_reason": decision.reason}

    schema_task = ensure_schema()
    collection_task = collect_cisco_task()
    cisco_change_task = publish_cisco_change(collection_task)
    schema_task >> collection_task

    if ENABLE_DAG_CHAINING:
        cisco_change_task >> TriggerDagRunOperator(
            task_id="trigger_matching_after_cisco_collection",
            trigger_dag_id="match_cves_to_inventory",
            conf={
                "source_dag_id": "collect_cisco_advisories",
                "source_run_id": "{{ run_id }}",
                "trigger_type": "cisco_psirt_completed",
                "trigger_timestamp": "{{ dag_run.run_after.isoformat() }}",
                "mode": "batch",
                "continue_pipeline": False,
            },
            wait_for_completion=False,
        )


collect_cisco_advisories()
