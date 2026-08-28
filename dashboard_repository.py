from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any

try:
    from psycopg2.extras import RealDictCursor
except ImportError:  # Pure policy tests do not require the database driver.
    RealDictCursor = None  # type: ignore[assignment]


@dataclass(frozen=True)
class DashboardFilters:
    client_id: str | None = None
    normalized_vendor: str | None = None
    product_family: str | None = None
    environment: str | None = None
    risk_level: str | None = None
    exploit_status: str | None = None
    internet_facing: bool | None = None
    period_days: int | None = None
    date_from: date | None = None
    date_to: date | None = None


def filter_sql(
    filters: DashboardFilters,
    *,
    alias: str = "d",
    temporal_column: str = "case_created_at",
) -> tuple[str, list[Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    for column, value in (
        ("client_id", filters.client_id),
        ("normalized_vendor", filters.normalized_vendor),
        ("product_family", filters.product_family),
        ("environment", filters.environment),
        ("risk_level", filters.risk_level),
        ("exploit_status", filters.exploit_status),
    ):
        normalized = (value or "").strip()
        if not normalized:
            continue
        comparator = "lower({alias}.{column}) = lower(%s)".format(
            alias=alias,
            column=column,
        )
        clauses.append(comparator)
        params.append(normalized)
    if filters.internet_facing is not None:
        clauses.append(f"{alias}.exposed_internet = %s")
        params.append(filters.internet_facing)
    if filters.date_from is not None and filters.date_to is not None:
        clauses.extend(
            (
                f"{alias}.{temporal_column} >= %s::date",
                f"{alias}.{temporal_column} < (%s::date + interval '1 day')",
            )
        )
        params.extend((filters.date_from, filters.date_to))
    elif filters.period_days is not None:
        clauses.append(
            f"{alias}.{temporal_column} >= now() - (%s * interval '1 day')"
        )
        params.append(filters.period_days)
    return "".join(f" AND {clause}" for clause in clauses), params


def freshness_status(
    *,
    last_success_at: datetime | None,
    expected_hours: int,
    now: datetime | None = None,
) -> str:
    if last_success_at is None:
        return "NEVER_COLLECTED"
    current = now or datetime.now(timezone.utc)
    success = last_success_at
    if success.tzinfo is None:
        success = success.replace(tzinfo=timezone.utc)
    age_hours = max(0.0, (current - success).total_seconds() / 3600)
    if age_hours <= expected_hours:
        return "CURRENT"
    if age_hours <= expected_hours * 2:
        return "DELAYED"
    return "STALE"


def operational_status(latest_status: str | None, freshness: str) -> str:
    normalized = (latest_status or "").strip().lower()
    if normalized in {"running", "queued"}:
        return "RUNNING"
    if normalized in {"failed", "error"}:
        return "FAILED"
    if freshness == "CURRENT":
        return "HEALTHY"
    if freshness == "NEVER_COLLECTED":
        return "NEVER_EXECUTED"
    return "WARNING"


class DashboardRepository:
    def __init__(self, conn: Any):
        self.conn = conn

    def _one(self, sql: str, params: list[Any] | tuple[Any, ...] = ()) -> dict[str, Any]:
        if RealDictCursor is None:
            raise RuntimeError("psycopg2 is required for dashboard database queries")
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            return dict(cur.fetchone() or {})

    def _many(
        self,
        sql: str,
        params: list[Any] | tuple[Any, ...] = (),
    ) -> list[dict[str, Any]]:
        if RealDictCursor is None:
            raise RuntimeError("psycopg2 is required for dashboard database queries")
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(row) for row in cur.fetchall()]

    def summary(self, filters: DashboardFilters) -> dict[str, Any]:
        where, params = filter_sql(filters)
        confirmed = self._one(
            f"""
            SELECT
                COUNT(DISTINCT d.cve_id) AS active_cves,
                COUNT(*) AS active_cases,
                COUNT(*) FILTER (WHERE d.risk_level = 'CRITICAL') AS critical_cases,
                COUNT(DISTINCT d.cve_id) FILTER (WHERE d.is_kev) AS kev_cves,
                COUNT(*) FILTER (
                    WHERE d.exploit_status = 'KNOWN_EXPLOITED'
                ) AS known_exploited_cases,
                COUNT(*) FILTER (WHERE d.sla_due_at < now()) AS overdue_cases,
                COUNT(*) FILTER (
                    WHERE d.sla_due_at >= now()
                      AND d.sla_due_at < now() + interval '48 hours'
                ) AS due_within_48_hours,
                COUNT(*) FILTER (WHERE d.risk_level IS NULL) AS risk_pending_cases
            FROM dashboard_inventory_cases d
            WHERE d.applicability_status = 'CONFIRMED'
            {where}
            """,
            params,
        )
        review = self._one(
            f"""
            SELECT COUNT(*) AS review_required
            FROM dashboard_inventory_cases d
            WHERE d.applicability_status = 'REVIEW_REQUIRED'
            {where}
            """,
            params,
        )
        bulletin_where, bulletin_params = self._bulletin_filter_sql(filters)
        bulletins = self._one(
            f"""
            SELECT COUNT(*) AS bulletins_awaiting_approval
            FROM bulletins b
            WHERE b.status = 'READY_FOR_VALIDATION'
            {bulletin_where}
            """,
            bulletin_params,
        )
        closed_where, closed_params = self._closed_filter_sql(filters)
        closed = self._one(
            f"""
            SELECT COUNT(*) AS closed_this_month
            FROM client_vulnerability_cases c
            JOIN assets a ON a.asset_id = c.asset_id
            JOIN vulnerabilities v ON v.cve_id = c.cve_id
            WHERE c.component_id IS NULL
              AND c.closed_at >= date_trunc('month', now())
              AND c.closed_at < date_trunc('month', now()) + interval '1 month'
            {closed_where}
            """,
            closed_params,
        )
        return {**confirmed, **review, **bulletins, **closed}

    def filter_options(self) -> dict[str, list[dict[str, str]]]:
        clients = self._many(
            """
            SELECT DISTINCT client_id AS value, client_name AS label
            FROM dashboard_inventory_cases
            ORDER BY label
            """
        )
        vendors = self._many(
            """
            SELECT DISTINCT
                normalized_vendor AS value,
                vendor AS label
            FROM dashboard_inventory_cases
            WHERE normalized_vendor IS NOT NULL
              AND trim(normalized_vendor) <> ''
            ORDER BY label
            """
        )
        product_families = self._many(
            """
            SELECT DISTINCT
                product_family AS value,
                product AS label
            FROM dashboard_inventory_cases
            WHERE product_family IS NOT NULL
              AND trim(product_family) <> ''
            ORDER BY label, value
            """
        )
        environments = self._many(
            """
            SELECT DISTINCT environment AS value, environment AS label
            FROM dashboard_inventory_cases
            WHERE environment IS NOT NULL
              AND trim(environment) <> ''
            ORDER BY label
            """
        )
        return {
            "clients": clients,
            "vendors": vendors,
            "product_families": product_families,
            "environments": environments,
        }

    def risk_distribution(self, filters: DashboardFilters) -> list[dict[str, Any]]:
        where, params = filter_sql(filters)
        return self._many(
            f"""
            SELECT
                COALESCE(d.risk_level, 'NONE') AS risk_level,
                COUNT(*) AS cases,
                COUNT(DISTINCT d.cve_id) AS cves
            FROM dashboard_inventory_cases d
            WHERE d.applicability_status = 'CONFIRMED'
            {where}
            GROUP BY d.risk_level
            ORDER BY CASE COALESCE(d.risk_level, 'NONE')
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH' THEN 2
                WHEN 'MEDIUM' THEN 3
                WHEN 'LOW' THEN 4
                ELSE 5
            END
            """,
            params,
        )

    def exploit_distribution(self, filters: DashboardFilters) -> list[dict[str, Any]]:
        where, params = filter_sql(filters)
        return self._many(
            f"""
            SELECT
                COALESCE(d.exploit_status, 'ENRICHMENT_PENDING') AS exploit_status,
                COUNT(*) AS cases,
                COUNT(DISTINCT d.cve_id) AS cves
            FROM dashboard_inventory_cases d
            WHERE d.applicability_status = 'CONFIRMED'
            {where}
            GROUP BY d.exploit_status
            ORDER BY cases DESC, exploit_status
            """,
            params,
        )

    def cases_by_client(self, filters: DashboardFilters) -> list[dict[str, Any]]:
        where, params = filter_sql(filters)
        return self._many(
            f"""
            SELECT
                d.client_id,
                d.client_name,
                COUNT(*) AS cases,
                COUNT(DISTINCT d.cve_id) AS cves,
                COUNT(*) FILTER (WHERE d.risk_level = 'CRITICAL') AS critical,
                COUNT(*) FILTER (WHERE d.risk_level = 'HIGH') AS high,
                COUNT(*) FILTER (WHERE d.risk_level = 'MEDIUM') AS medium,
                COUNT(*) FILTER (WHERE d.risk_level = 'LOW') AS low,
                COUNT(*) FILTER (WHERE d.risk_level IS NULL) AS none
            FROM dashboard_inventory_cases d
            WHERE d.applicability_status = 'CONFIRMED'
            {where}
            GROUP BY d.client_id, d.client_name
            ORDER BY cases DESC, d.client_id
            """,
            params,
        )

    def deadlines(self, filters: DashboardFilters) -> list[dict[str, Any]]:
        where, params = filter_sql(filters)
        return self._many(
            f"""
            SELECT bucket, COUNT(*) AS cases
            FROM (
                SELECT CASE
                    WHEN d.sla_due_at IS NULL THEN 'NO_DEADLINE'
                    WHEN d.sla_due_at < now() THEN 'OVERDUE'
                    WHEN d.sla_due_at < now() + interval '24 hours'
                        THEN 'NEXT_24_HOURS'
                    WHEN d.sla_due_at < now() + interval '48 hours'
                        THEN 'HOURS_24_48'
                    WHEN d.sla_due_at < now() + interval '7 days'
                        THEN 'DAYS_3_7'
                    ELSE 'MORE_THAN_7_DAYS'
                END AS bucket
                FROM dashboard_inventory_cases d
                WHERE d.applicability_status = 'CONFIRMED'
                {where}
            ) deadline_cases
            GROUP BY bucket
            ORDER BY CASE bucket
                WHEN 'OVERDUE' THEN 1
                WHEN 'NEXT_24_HOURS' THEN 2
                WHEN 'HOURS_24_48' THEN 3
                WHEN 'DAYS_3_7' THEN 4
                WHEN 'MORE_THAN_7_DAYS' THEN 5
                ELSE 6
            END
            """,
            params,
        )

    def urgent_cases(
        self,
        filters: DashboardFilters,
        *,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        where, params = filter_sql(filters)
        return self._many(
            f"""
            SELECT
                d.case_id,
                d.client_id,
                d.client_name,
                d.asset_id,
                d.hostname,
                d.product,
                d.installed_version,
                d.cve_id,
                d.risk_level,
                d.risk_score,
                d.is_kev,
                COALESCE(d.exploit_status, 'ENRICHMENT_PENDING') AS exploit_status,
                d.epss_score,
                d.sla_due_at,
                d.assigned_team
            FROM dashboard_inventory_cases d
            WHERE d.applicability_status = 'CONFIRMED'
            {where}
            ORDER BY
                (d.sla_due_at < now()) DESC,
                (d.risk_level = 'CRITICAL') DESC,
                (d.exploit_status = 'KNOWN_EXPLOITED' OR d.is_kev) DESC,
                d.sla_due_at ASC NULLS LAST,
                d.epss_score DESC NULLS LAST
            LIMIT %s
            """,
            [*params, max(1, min(limit, 1000))],
        )

    def review_queue(
        self,
        filters: DashboardFilters,
        *,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        where, params = filter_sql(filters)
        return self._many(
            f"""
            SELECT
                d.case_id,
                d.client_id,
                d.client_name,
                d.asset_id,
                d.hostname,
                d.product,
                d.installed_version,
                d.cve_id,
                d.match_reason,
                d.match_confidence,
                d.case_created_at AS waiting_since,
                d.assigned_team
            FROM dashboard_inventory_cases d
            WHERE d.applicability_status = 'REVIEW_REQUIRED'
            {where}
            ORDER BY
                CASE d.match_confidence
                    WHEN 'HIGH' THEN 1
                    WHEN 'MEDIUM' THEN 2
                    ELSE 3
                END,
                d.case_created_at ASC
            LIMIT %s
            """,
            [*params, max(1, min(limit, 1000))],
        )

    def bulletins(
        self,
        filters: DashboardFilters,
        *,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        where, params = self._bulletin_filter_sql(filters)
        return self._many(
            f"""
            SELECT
                b.bulletin_id,
                b.bulletin_reference,
                b.client_id,
                cl.name AS client_name,
                b.vendor,
                b.product_family,
                b.cve_count,
                b.case_count,
                b.status,
                b.generated_at,
                b.html_export_path,
                b.pdf_export_path
            FROM bulletins b
            JOIN clients cl ON cl.client_id = b.client_id
            WHERE b.status = 'READY_FOR_VALIDATION'
            {where}
            ORDER BY b.generated_at ASC NULLS LAST
            LIMIT %s
            """,
            [*params, max(1, min(limit, 1000))],
        )

    def new_cves(
        self,
        filters: DashboardFilters,
    ) -> list[dict[str, Any]]:
        where, params = filter_sql(filters)
        return self._many(
            f"""
            WITH first_detection AS (
                SELECT
                    d.cve_id,
                    MIN(d.case_created_at) AS detected_at,
                    BOOL_OR(d.applicability_status = 'CONFIRMED') AS confirmed,
                    BOOL_OR(
                        d.applicability_status = 'REVIEW_REQUIRED'
                    ) AS review_required
                FROM dashboard_inventory_cases d
                WHERE 1 = 1
                {where}
                GROUP BY d.cve_id
            )
            SELECT
                detected_at::date AS detected_date,
                COUNT(*) FILTER (WHERE confirmed) AS confirmed_cves,
                COUNT(*) FILTER (
                    WHERE NOT confirmed AND review_required
                ) AS review_cves
            FROM first_detection
            GROUP BY detected_at::date
            ORDER BY detected_at::date
            """,
            params,
        )

    def recent_changes(
        self,
        filters: DashboardFilters,
        *,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        where, params = filter_sql(filters)
        return self._many(
            f"""
            WITH relevant_cves AS (
                SELECT DISTINCT d.cve_id
                FROM dashboard_inventory_cases d
                WHERE d.applicability_status IN (
                    'CONFIRMED',
                    'REVIEW_REQUIRED'
                )
                {where}
            )
            SELECT
                e.cve_change_id,
                e.cve_id,
                e.event_name,
                e.categories,
                e.created_at_source AS occurred_at
            FROM nvd_change_events e
            JOIN relevant_cves r ON r.cve_id = e.cve_id
            WHERE EXISTS (
                  SELECT 1
                  FROM unnest(e.categories) category
                  WHERE category IN (
                      'APPLICABILITY',
                      'RISK',
                      'EXPLOIT',
                      'REMEDIATION'
                  )
              )
            ORDER BY e.created_at_source DESC
            LIMIT %s
            """,
            [*params, max(1, min(limit, 100))],
        )

    def pipeline_health(self) -> list[dict[str, Any]]:
        sources = (
            (
                "Inventory",
                "data_import_runs",
                "status IN ('completed', 'skipped_unchanged')",
                36,
                "",
            ),
            ("NVD", "cve_collection_runs", "status = 'completed'", 8, ""),
            (
                "Microsoft MSRC",
                "advisory_collection_runs",
                "status = 'completed'",
                36,
                "WHERE source = 'MSRC'",
            ),
            (
                "Cisco PSIRT",
                "advisory_collection_runs",
                "status = 'completed'",
                36,
                "WHERE source = 'CISCO_PSIRT'",
            ),
            ("EPSS", "epss_collection_runs", "status = 'completed'", 36, ""),
            ("CISA KEV", "kev_collection_runs", "status = 'completed'", 36, ""),
            (
                "Exploit Intelligence",
                "exploit_intelligence_runs",
                "status = 'completed'",
                8,
                "",
            ),
        )
        result = [
            self._source_health(name, table, success, hours, scope)
            for name, table, success, hours, scope in sources
        ]
        for source_name in ("METASPLOIT", "EXPLOIT_DB"):
            result.append(self._exploit_source_health(source_name))
        return result

    def _source_health(
        self,
        name: str,
        table: str,
        success_condition: str,
        expected_hours: int,
        scope: str,
    ) -> dict[str, Any]:
        latest = self._one(
            f"""
            SELECT status, started_at, finished_at, error_count
            FROM {table}
            {scope}
            ORDER BY started_at DESC
            LIMIT 1
            """
        )
        success_scope = f"{scope} AND" if scope else "WHERE"
        last_success = self._one(
            f"""
            SELECT MAX(finished_at) AS last_success_at
            FROM {table}
            {success_scope} {success_condition}
            """
        )
        return self._health_payload(
            name=name,
            latest=latest,
            last_success_at=last_success.get("last_success_at"),
            expected_hours=expected_hours,
        )

    def _exploit_source_health(self, source_name: str) -> dict[str, Any]:
        latest = self._one(
            """
            SELECT
                status,
                started_at,
                finished_at,
                error_count,
                last_success_at
            FROM exploit_source_sync_runs
            WHERE source = %s
            ORDER BY started_at DESC
            LIMIT 1
            """,
            (source_name,),
        )
        return self._health_payload(
            name=source_name.replace("_", "-").title(),
            latest=latest,
            last_success_at=latest.get("last_success_at"),
            expected_hours=48,
        )

    @staticmethod
    def _health_payload(
        *,
        name: str,
        latest: dict[str, Any],
        last_success_at: datetime | None,
        expected_hours: int,
    ) -> dict[str, Any]:
        freshness = freshness_status(
            last_success_at=last_success_at,
            expected_hours=expected_hours,
        )
        return {
            "source": name,
            "last_attempt_at": latest.get("started_at"),
            "last_success_at": last_success_at,
            "latest_run_status": latest.get("status"),
            "freshness": freshness,
            "status": operational_status(latest.get("status"), freshness),
            "error_count": latest.get("error_count", 0),
            "expected_within_hours": expected_hours,
        }

    @staticmethod
    def _bulletin_filter_sql(
        filters: DashboardFilters,
    ) -> tuple[str, list[Any]]:
        where, params = filter_sql(filters, alias="d")
        if not where:
            return "", []
        return (
            f"""
            AND EXISTS (
                SELECT 1
                FROM bulletin_cases bc
                JOIN dashboard_inventory_cases d ON d.case_id = bc.case_id
                WHERE bc.bulletin_id = b.bulletin_id
                {where}
            )
            """,
            params,
        )

    @staticmethod
    def _closed_filter_sql(
        filters: DashboardFilters,
    ) -> tuple[str, list[Any]]:
        clauses: list[str] = []
        params: list[Any] = []
        for expression, value in (
            ("c.client_id", filters.client_id),
            ("a.normalized_vendor", filters.normalized_vendor),
            (
                """COALESCE(
                    NULLIF(a.normalized_product, ''),
                    NULLIF(a.product_family, ''),
                    a.product
                )""",
                filters.product_family,
            ),
            ("a.environment", filters.environment),
            ("c.risk_level", filters.risk_level),
            ("v.exploit_status", filters.exploit_status),
        ):
            normalized = (value or "").strip()
            if normalized:
                clauses.append(f"lower({expression}) = lower(%s)")
                params.append(normalized)
        if filters.internet_facing is not None:
            clauses.append("a.exposed_internet = %s")
            params.append(filters.internet_facing)
        if filters.date_from is not None and filters.date_to is not None:
            clauses.extend(
                (
                    "c.closed_at >= %s::date",
                    "c.closed_at < (%s::date + interval '1 day')",
                )
            )
            params.extend((filters.date_from, filters.date_to))
        elif filters.period_days is not None:
            clauses.append(
                "c.closed_at >= now() - (%s * interval '1 day')"
            )
            params.append(filters.period_days)
        return "".join(f" AND {clause}" for clause in clauses), params
