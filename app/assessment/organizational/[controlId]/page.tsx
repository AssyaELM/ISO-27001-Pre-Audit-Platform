"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useStoredLanguage } from "@/components/language-preference";
import { QuestionEvidence } from "@/components/assessment/question-evidence";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { workspaceDisplayName } from "@/lib/workspaces/display-name";
import { assessmentAnswerValues, type AssessmentAnswerValue } from "@/content/assessment-infrastructure";
import {
  organizationalControls,
  type OrganizationalContextKey,
  type OrganizationalQuestion,
} from "@/content/assessment/organizational/organizational-controls";
import {
  resolveOrganizationalAssessmentContext,
  resolveOrganizationalControl,
  type OrganizationalContextDecision,
  type OrganizationalControlId,
} from "@/lib/assessment/organizational-controls";
import {
  deriveOrganizationalPresentation,
  markOrganizationalControlActivity,
  ORGANIZATIONAL_CONTROL_JUSTIFICATIONS_KEY,
  type OrganizationalControlStatus,
} from "@/lib/assessment/organizational-presentation";
import { getAssessmentCache } from "@/lib/assessment/client-cache";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import styles from "../../people/[controlId]/people-assessment.module.css";

type Locale = "fr" | "en";
type Response = {
  id: string;
  theme?: string;
  controlId: string;
  questionId: string;
  answer: AssessmentAnswerValue;
  justification?: string | null;
  answerSetAt?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function answerLabel(value: AssessmentAnswerValue, locale: Locale) {
  return (locale === "fr" ? {
    implemented: "Implémenté",
    partially_implemented: "Partiellement implémenté",
    not_implemented: "Non implémenté",
    not_sure: "Je ne sais pas",
    not_applicable: "Non applicable",
  } : {
    implemented: "Implemented",
    partially_implemented: "Partially implemented",
    not_implemented: "Not implemented",
    not_sure: "Not sure",
    not_applicable: "Not applicable",
  })[value];
}

function questionTypeLabel(type: OrganizationalQuestion["type"]) {
  return {
    policy_process: "Policy / Process",
    application: "Application",
    proof_traceability: "Proof / Traceability",
    conditional: "Conditional",
  }[type];
}

function statusLabel(status: OrganizationalControlStatus, locale: Locale) {
  const labels = locale === "fr" ? {
    notStarted: "Non commencé",
    inProgress: "En cours",
    review: "Revue requise",
    gap: "Écart",
    completed: "Terminé",
  } : {
    notStarted: "Not started",
    inProgress: "In progress",
    review: "Review required",
    gap: "Gap",
    completed: "Completed",
  };
  return labels[status];
}



async function authenticatedHeaders(): Promise<Record<string, string>> {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export default function OrganizationalControlPage() {
  const { language } = useStoredLanguage();
  const locale: Locale = language === "fr" ? "fr" : "en";
  const { controlId: rawControlIdUrl } = useParams<{ controlId: string }>();
    const [activeControlId, setActiveControlId] = useState(rawControlIdUrl);
    useEffect(() => { setActiveControlId(rawControlIdUrl); }, [rawControlIdUrl]);
    const rawControlId = activeControlId;
    const handleNav = (newId: string) => {
      setActiveControlId(newId);
      
    };
  const controlId: OrganizationalControlId = organizationalControls.some((control) => control.id === rawControlId)
    ? rawControlId as OrganizationalControlId
    : organizationalControls[0].id;
  const router = useRouter();
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [persistedOrganizational, setPersistedOrganizational] = useState<Record<string, unknown>>({});
  const [onboarding, setOnboarding] = useState<Record<string, unknown>>({});
  const [sharedContext, setSharedContext] = useState<Record<string, unknown>>({});
  const [crossThemeContext, setCrossThemeContext] = useState<Record<string, unknown>>({});
  const [responses, setResponses] = useState<Response[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(!getAssessmentCache());
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notApplicableQuestionId, setNotApplicableQuestionId] = useState("");
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [controlJustifications, setControlJustifications] = useState<Record<string, string>>({});

  const resolvedAssessment = useMemo(
    () => resolveOrganizationalAssessmentContext(persistedOrganizational, onboarding, sharedContext, crossThemeContext),
    [persistedOrganizational, onboarding, sharedContext, crossThemeContext],
  );
  const control = organizationalControls.find((item) => item.id === controlId) ?? organizationalControls[0];
  const persistedControlJustifications = asRecord(
    persistedOrganizational[ORGANIZATIONAL_CONTROL_JUSTIFICATIONS_KEY],
  );
  const savedControlJustification = typeof persistedControlJustifications[controlId] === "string"
    ? persistedControlJustifications[controlId] as string
    : "";
  const controlJustification = controlJustifications[controlId] ?? savedControlJustification;
  const resolution = resolveOrganizationalControl(
    controlId,
    resolvedAssessment.context,
    savedControlJustification,
  );
  const visibleQuestionIds = new Set<string>(resolution.questionIds);
  const questions = control.questions.filter((question) => visibleQuestionIds.has(question.id));
  const presentation = useMemo(() => deriveOrganizationalPresentation({
    persistedOrganizational,
    onboarding,
    sharedContext,
    crossThemeContext,
    responses: responses.map((item) => ({
      controlId: item.controlId,
      questionId: item.questionId,
      answer: item.answer,
      justification: item.justification,
      answeredAt: item.answerSetAt,
    })),
  }), [crossThemeContext, onboarding, persistedOrganizational, responses, sharedContext]);

  useEffect(() => {
    document.querySelector<HTMLElement>(`.${styles.controlActive}`)?.scrollIntoView({ block: "nearest" });
  }, [controlId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        setError(locale === "fr" ? "La connexion aux données de l’espace n’est pas configurée." : "Workspace data connection is not configured.");
        return;
      }
      try {
        const { fetchAssessmentData } = await import("@/lib/assessment/client-cache");
        const { workspaceId: wId, metadata, responses: rawResponses } = await fetchAssessmentData();
        
        if (!cancelled) {
          const nextOnboarding = asRecord(metadata.normcore_onboarding);
          const assessment = asRecord(nextOnboarding.assessment_context);
          const nextOrganizational = asRecord(assessment.organizational);
          
          setWorkspaceId(wId);
          setOnboarding(nextOnboarding);
          setMetadata(nextOnboarding);
          setPersistedOrganizational(nextOrganizational);
          setSharedContext(asRecord(assessment.shared_context));
          setCrossThemeContext({
            ...asRecord(assessment.people),
            ...asRecord(assessment.remote_working),
            ...asRecord(assessment.physical),
            ...asRecord(assessment.organizational),
          });
          setResponses(rawResponses as unknown as Response[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [locale]);

  async function saveContext(key: OrganizationalContextKey, value: OrganizationalContextDecision) {
    if (saving) return;
    setSaving(key);
    setError("");
    try {
      const assessment = asRecord(metadata.assessment_context);
      const prior = asRecord(assessment.organizational);
      const nextOrganizational = markOrganizationalControlActivity(
        { ...prior, [key]: value },
        controlId,
      );
      const nextMetadata = {
        ...metadata,
        assessment_context: { ...assessment, organizational: nextOrganizational },
      };
      const { error: updateError } = await createClient().auth.updateUser({
        data: { normcore_onboarding: nextMetadata },
      });
      if (updateError) throw updateError;
      setMetadata(nextMetadata);
      setOnboarding(nextMetadata);
      setPersistedOrganizational(nextOrganizational);
    } catch {
      setError(locale === "fr" ? "Impossible d’enregistrer le contexte." : "Unable to save context.");
    } finally {
      setSaving("");
    }
  }

  async function answer(questionId: string, answerValue: AssessmentAnswerValue) {
    if (!workspaceId || saving) return;
    if (answerValue === "not_applicable" && !justifications[questionId]?.trim()) {
      setNotApplicableQuestionId(questionId);
      return;
    }
    const justification = answerValue === "not_applicable" ? justifications[questionId].trim() : undefined;
    setSaving(questionId);
    setError("");
    try {
      const headers = await authenticatedHeaders();
      const response = await fetch("/api/assessment/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          workspaceId,
          theme: "organizational",
          controlId,
          questionId,
          answer: answerValue,
          justification,
        }),
      });
      const body = await response.json() as Response & { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to save answer.");
      setResponses((current) => [
        ...current.filter((item) => !(item.controlId === controlId && item.questionId === questionId)),
        body,
      ]);
      const { updateAssessmentResponses } = await import("@/lib/assessment/client-cache");
      updateAssessmentResponses((current) => [
        ...current.filter((item) => !(item.controlId === controlId && item.questionId === questionId)),
        body as unknown as import("@/content/assessment-infrastructure").AssessmentAnswerRecord,
      ]);
      setNotApplicableQuestionId("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (locale === "fr" ? "Impossible d’enregistrer la réponse." : "Unable to save answer."));
    } finally {
      setSaving("");
    }
  }

  async function saveControlApplicability() {
    const justification = controlJustification.trim();
    if (!workspaceId || saving || !justification) return;
    setSaving(`control-${controlId}`);
    setError("");
    try {
      const headers = await authenticatedHeaders();
      const response = await fetch("/api/assessment/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          workspaceId,
          theme: "organizational",
          controlId,
          controlApplicability: "not_applicable",
          controlApplicabilityJustification: justification,
        }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to save control applicability.");
      const nextJustifications = { ...persistedControlJustifications, [controlId]: justification };
      const nextOrganizational = markOrganizationalControlActivity({
        ...persistedOrganizational,
        [ORGANIZATIONAL_CONTROL_JUSTIFICATIONS_KEY]: nextJustifications,
      }, controlId);
      const assessment = asRecord(metadata.assessment_context);
      const nextMetadata = {
        ...metadata,
        assessment_context: { ...assessment, organizational: nextOrganizational },
      };
      const { error: updateError } = await createClient().auth.updateUser({
        data: { normcore_onboarding: nextMetadata },
      });
      if (updateError) throw updateError;
      setMetadata(nextMetadata);
      setOnboarding(nextMetadata);
      setPersistedOrganizational(nextOrganizational);
      setControlJustifications((current) => ({ ...current, [controlId]: justification }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (locale === "fr" ? "Impossible d’enregistrer l’applicabilité." : "Unable to save applicability."));
    } finally {
      setSaving("");
    }
  }

  function statusFor(id: OrganizationalControlId): OrganizationalControlStatus {
    return presentation.controls.find((item) => item.id === id)?.status ?? "notStarted";
  }

  const position = organizationalControls.findIndex((item) => item.id === controlId);
  const currentStatus = statusFor(controlId);
  const answerCount = questions.filter((question) => responses.some((item) => item.controlId === controlId && item.questionId === question.id)).length;
  const completedControls = presentation.completedControlCount;
  const progress = presentation.progress;
  const organization = workspaceDisplayName(metadata);

  return <main className={styles.shell}>
    <AppSidebar organization={organization} workspaceId={workspaceId} />
    <section className={styles.content}>
      <header className={styles.topbar}><p>{organization && <><span>{organization}</span><b>/</b></>}<span>{locale === "fr" ? "Évaluation" : "Assessment"}</span><b>/</b><strong>{locale === "fr" ? "Contrôles organisationnels" : "Organizational Controls"}</strong></p><span className={styles.language}>EN / FR</span></header>
      <section className={styles.titleCard}><div><h1>{locale === "fr" ? "Contrôles organisationnels" : "Organizational Controls"}</h1><p>ISO/IEC 27001:2022 — Annex A.5</p></div><div className={styles.titleProgress}><span>{control.code} {locale === "fr" ? `sur ${organizationalControls.length}` : `of ${organizationalControls.length}`}</span><i><b style={{ width: `${(completedControls / organizationalControls.length) * 100}%` }} /></i></div></section>
      <div className={styles.assessmentGrid}>
        <aside className={styles.controls}>
          <div className={styles.controlsHeader}><div className={styles.progressRing} style={{ "--progress": `${progress}%` } as React.CSSProperties}><span>{progress}%</span></div><div><strong>{locale === "fr" ? "Contrôles organisationnels" : "Organizational Controls"}</strong><small>{locale === "fr" ? `${organizationalControls.length} contrôles` : `${organizationalControls.length} controls`}</small></div></div>
          {organizationalControls.map((item) => { const status = statusFor(item.id); return <a key={item.id} href={`/assessment/${window.location.pathname.split('/')[2]}/${item.id}`} onClick={(e) => { e.preventDefault(); handleNav(item.id); }} className={item.id === controlId ? styles.controlActive : ""}><i className={`${styles.status} ${styles[status] ?? ""}`} /><span><strong>{item.code} {item.name}</strong><small>{statusLabel(status, locale)}</small></span></a>; })}
        </aside>
        <section className={styles.mainPanel}>
          <header className={styles.controlHeading}><div><span>{locale === "fr" ? "Contrôle Organizational" : "Organizational control"}</span><h2>{control.code} <b>{control.name}</b></h2></div><em className={currentStatus === "completed" ? styles.completeBadge : styles.openBadge}>{currentStatus === "notStarted" ? (locale === "fr" ? "Non répondu" : "Not answered") : statusLabel(currentStatus, locale)}</em><small>{answerCount} / {questions.length} {locale === "fr" ? "répondues" : "answered"}</small></header>
          {loading && <p className={styles.state}>{locale === "fr" ? "Chargement des données réelles…" : "Loading live workspace data…"}</p>}
          {!loading && !workspaceId && <p className={styles.state}>{error || (locale === "fr" ? "Aucun espace d’évaluation n’est disponible." : "No assessment workspace is available.")}</p>}
          {!loading && resolution.requiredQuickContextQuestions.map((item) => <section style={{ order: 1 }} key={item.key} className={styles.quickContext}><div><h3>{locale === "fr" ? "Contexte rapide" : "Quick context"}</h3><p>{locale === "fr" ? "Cette réponse adapte uniquement les questions conditionnelles. Elle n’est pas évaluée et ne génère aucun gap." : "This answer only adapts conditional questions. It is not assessed and does not generate gaps."}</p></div><fieldset><legend>{item.question[locale]}</legend><div>{(["yes", "no", "not_sure"] as OrganizationalContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(saving)} onClick={() => void saveContext(item.key, value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset></section>)}
          {!loading && resolution.controlApplicability === "not_applicable" && <section style={{ order: 1 }} className={styles.quickContext}><div><h3>{locale === "fr" ? "Applicabilité du contrôle" : "Control applicability"}</h3><p>{locale === "fr" ? "L’exclusion nécessite une justification et une revue d’applicabilité/SoA." : "Exclusion requires a justification and an applicability/SoA review."}</p></div><div className={styles.justification}><label htmlFor={`control-justification-${controlId}`}>{locale === "fr" ? "Justification requise pour « Non applicable »" : "Required justification for Not applicable"}</label><textarea id={`control-justification-${controlId}`} value={controlJustification} onChange={(event) => setControlJustifications((current) => ({ ...current, [controlId]: event.target.value }))} rows={3} disabled={Boolean(saving)} /><button type="button" disabled={!controlJustification.trim() || Boolean(saving)} onClick={() => void saveControlApplicability()}>{locale === "fr" ? "Enregistrer la justification" : "Save justification"}</button>{control.applicabilityKey && <button type="button" disabled={Boolean(saving)} onClick={() => void saveContext(control.applicabilityKey, "yes")}>{locale === "fr" ? "Réactiver le contrôle" : "Mark control as applicable"}</button>}</div></section>}
          {questions.map((question, index) => { const saved = responses.find((item) => item.controlId === controlId && item.questionId === question.id); const showJustification = notApplicableQuestionId === question.id || saved?.answer === "not_applicable"; const justification = justifications[question.id] ?? saved?.justification ?? ""; return <article id={question.id} className={styles.question} key={question.id}><span className={styles.category}>{questionTypeLabel(question.type)}</span><h3>{index + 1}. <b>{question.question[locale]}</b></h3><div className={styles.answers}>{assessmentAnswerValues.map((value) => <button key={value} disabled={Boolean(saving) || !workspaceId} onClick={() => void answer(question.id, value)} className={`${styles[`answer_${value}`]} ${saved?.answer === value ? styles.answerSelected : ""}`}><i />{answerLabel(value, locale)}</button>)}</div>{showJustification && <div className={styles.justification}><label htmlFor={`justification-${question.id}`}>{locale === "fr" ? "Justification requise pour « Non applicable »" : "Required justification for Not applicable"}</label><textarea id={`justification-${question.id}`} value={justification} onChange={(event) => setJustifications((current) => ({ ...current, [question.id]: event.target.value }))} rows={3} disabled={Boolean(saving)} /><button type="button" disabled={!justification.trim() || Boolean(saving)} onClick={() => void answer(question.id, "not_applicable")}>{locale === "fr" ? "Enregistrer la justification" : "Save justification"}</button></div>}<QuestionEvidence workspaceId={workspaceId} themeId="organizational" controlId={controlId} questionId={question.id} locale={locale} guidance={question.evidence} /></article>; })}
          {error && workspaceId && <p className={styles.error}>{error}</p>}
        </section>
      </div>
    </section>
    <footer className={styles.footer}><button disabled={position === 0} onClick={() => handleNav(organizationalControls[position - 1].id)}>{locale === "fr" ? "Contrôle précédent" : "Previous control"}</button><Link prefetch={true} href="/dashboard">{locale === "fr" ? "Enregistrer et quitter" : "Save & exit"}</Link><button disabled={position === organizationalControls.length - 1} onClick={() => handleNav(organizationalControls[position + 1].id)}>{locale === "fr" ? "Contrôle suivant" : "Next control"}</button></footer>
  </main>;
}

