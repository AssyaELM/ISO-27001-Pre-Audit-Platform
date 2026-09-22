"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { QuestionEvidence } from "@/components/assessment/question-evidence";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { workspaceDisplayName } from "@/lib/workspaces/display-name";
import { useStoredLanguage } from "@/components/language-preference";
import { LanguageToggle } from "@/components/language-toggle";
import type { AssessmentAnswerValue } from "@/content/assessment-infrastructure";
import { technologicalControls } from "@/content/assessment/technological/technological-controls.generated";
import { resolveTechnologicalAssessmentContext, resolveTechnologicalControl } from "@/lib/assessment/technological-controls";
import { getAssessmentCache } from "@/lib/assessment/client-cache";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import styles from "../../people/[controlId]/people-assessment.module.css";

type Decision = "yes" | "no" | "not_sure";
type Locale = "fr" | "en";
type Response = { id: string; questionId: string; controlId: string; answer: AssessmentAnswerValue; justification?: string | null };

const values: AssessmentAnswerValue[] = ["implemented", "partially_implemented", "not_implemented", "not_sure", "not_applicable"];
const decision = (value: unknown): Decision | undefined => value === "yes" || value === "no" || value === "not_sure" ? value : undefined;
const text = (value: AssessmentAnswerValue, locale: Locale) => (locale === "fr" ? {
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
const typeLabel = (type: string, locale: Locale) => ({
  policy_process: locale === "fr" ? "Politique / processus" : "Policy / Process",
  application: locale === "fr" ? "Application" : "Application",
  proof_traceability: locale === "fr" ? "Preuve / traçabilité" : "Proof / Traceability",
  conditional: locale === "fr" ? "Conditionnelle" : "Conditional",
}[type] ?? type);
const statusLabel = (status: string, locale: Locale) => ({
  notStarted: locale === "fr" ? "Non commencé" : "Not started",
  inProgress: locale === "fr" ? "En cours" : "In progress",
  review: locale === "fr" ? "À revoir" : "Review",
  gap: "Gap",
  completed: locale === "fr" ? "Terminé" : "Completed",
}[status] ?? status);

export default function TechnologicalControlPage() {
  const { language } = useStoredLanguage();
  const locale: Locale = language === "fr" ? "fr" : "en";
  const { controlId: rawControlIdUrl } = useParams<{ controlId: string }>();
  const [activeControlId, setActiveControlId] = useState(rawControlIdUrl);
  useEffect(() => { setActiveControlId(rawControlIdUrl); }, [rawControlIdUrl]);
  const raw = activeControlId;
  const handleNav = (newId: string) => {
    setActiveControlId(newId);
    
  };
  const controlId = technologicalControls.some((candidate) => candidate.id === raw) ? raw as (typeof technologicalControls)[number]["id"] : "a8-1";
  const router = useRouter();
  const [persisted, setPersisted] = useState<Record<string, Decision>>({});
  const [onboarding, setOnboarding] = useState<Record<string, unknown>>({});
  const [shared, setShared] = useState<Record<string, unknown>>({});
  const [cross, setCross] = useState<Record<string, unknown>>({});
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [responses, setResponses] = useState<Response[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!getAssessmentCache());
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, AssessmentAnswerValue>>({});
  const answerQueues = useRef(new Map<string, Promise<void>>());

  const context = useMemo(() => resolveTechnologicalAssessmentContext(persisted, onboarding, shared, cross), [persisted, onboarding, shared, cross]);
  const control = technologicalControls.find((candidate) => candidate.id === controlId)!;
  const resolution = resolveTechnologicalControl(controlId, context);
  const visible = new Set(resolution.questionIds);
  const questions = [...control.questions.filter((question) => !question.conditionKey), ...control.questions.filter((question) => question.conditionKey && visible.has(question.id))];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured()) { setLoading(false); return; }
      try {
        const { fetchAssessmentData } = await import("@/lib/assessment/client-cache");
        const { workspaceId: workspace, metadata: rawMetadata, responses: rawResponses } = await fetchAssessmentData();
        
        const next = (rawMetadata?.normcore_onboarding ?? {}) as Record<string, unknown>;
        const assessment = (next.assessment_context ?? {}) as Record<string, unknown>;
        const tech = (assessment.technological ?? {}) as Record<string, unknown>;
        
        if (!cancelled) {
          setMetadata(next);
          setOnboarding(next);
          setPersisted(Object.fromEntries(Object.entries(tech).flatMap(([key, value]) => decision(value) ? [[key, decision(value)!]] : [])));
          setShared((assessment.shared_context ?? {}) as Record<string, unknown>);
          setCross({ ...(assessment.people as Record<string, unknown> ?? {}), ...(assessment.remote_working as Record<string, unknown> ?? {}), ...(assessment.physical as Record<string, unknown> ?? {}), ...(assessment.organizational as Record<string, unknown> ?? {}) });
          setWorkspaceId(workspace);
          setResponses(rawResponses as unknown as Response[]);
        }
      } catch {
        if (!cancelled) setError(locale === "fr" ? "Impossible de charger le contexte." : "Unable to load context.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [locale]);

  async function saveContext(key: string, value: Decision) {
    setSaving(key);
    try {
      const assessment = metadata.assessment_context && typeof metadata.assessment_context === "object" ? metadata.assessment_context as Record<string, unknown> : {};
      const prior = assessment.technological && typeof assessment.technological === "object" ? assessment.technological as Record<string, unknown> : {};
      const next = { ...metadata, assessment_context: { ...assessment, technological: { ...prior, [key]: value } } };
      const { error: updateError } = await createClient().auth.updateUser({ data: { normcore_onboarding: next } });
      if (updateError) throw updateError;
      setMetadata(next);
      setPersisted((current) => ({ ...current, [key]: value }));
    } catch {
      setError(locale === "fr" ? "Impossible d’enregistrer le contexte." : "Unable to save context.");
    } finally { setSaving(""); }
  }

  async function answer(questionId: string, value: AssessmentAnswerValue) {
    const justification = justifications[questionId]?.trim();
    if (!workspaceId || (value === "not_applicable" && !justification)) return;
    const previous = answerQueues.current.get(questionId) ?? Promise.resolve();
    const pending = previous.catch(() => undefined).then(async () => {
      setSaving(questionId);
      setError("");
      try {
        const session = await createClient().auth.getSession();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session.data.session?.access_token) headers.Authorization = `Bearer ${session.data.session.access_token}`;
        const response = await fetch("/api/assessment/responses", { method: "POST", headers, body: JSON.stringify({ workspaceId, theme: "technology", controlId, questionId, answer: value, justification }) });
        const body = await response.json() as Response & { error?: string };
        if (!response.ok) throw new Error(body.error);
        setResponses((current) => [...current.filter((item) => item.questionId !== questionId), body]);
        const { updateAssessmentResponses } = await import("@/lib/assessment/client-cache");
        updateAssessmentResponses((current) => [...current.filter((item) => item.questionId !== questionId), body as unknown as import("@/content/assessment-infrastructure").AssessmentAnswerRecord]);
      } catch {
        setError(locale === "fr" ? "Impossible d’enregistrer la réponse." : "Unable to save answer.");
      }
    });
    answerQueues.current.set(questionId, pending);
    await pending;
    if (answerQueues.current.get(questionId) === pending) {
      answerQueues.current.delete(questionId);
      setSaving("");
    }
  }

  const status = (id: (typeof technologicalControls)[number]["id"]) => {
    const resolved = resolveTechnologicalControl(id, context);
    const answeredRows = responses.filter((item) => item.controlId === id && resolved.questionIds.includes(item.questionId));
    return !answeredRows.length ? "notStarted" : resolved.unresolvedConditions.length || answeredRows.length < resolved.questionIds.length ? "inProgress" : answeredRows.some((item) => item.answer === "not_sure" || item.answer === "not_applicable") ? "review" : answeredRows.some((item) => item.answer === "partially_implemented" || item.answer === "not_implemented") ? "gap" : "completed";
  };
  const position = technologicalControls.findIndex((candidate) => candidate.id === controlId);
  const completed = technologicalControls.filter((candidate) => ["completed", "gap"].includes(status(candidate.id))).length;
  const current = status(controlId);
  const answered = questions.filter((question) => responses.some((item) => item.controlId === controlId && item.questionId === question.id)).length;
  const organization = workspaceDisplayName(metadata);

  return <main className={styles.shell}>
    <AppSidebar organization={organization} workspaceId={workspaceId} />
    <section className={styles.content}>
      <header className={styles.topbar}><p>{organization} / <strong>{locale === "fr" ? "Contrôles technologiques" : "Technological Controls"}</strong></p><LanguageToggle className={styles.language} /></header>
      <section className={styles.titleCard}><div><h1>{locale === "fr" ? "Contrôles technologiques" : "Technological Controls"}</h1><p>ISO/IEC 27001:2022 — {locale === "fr" ? "Annexe" : "Annex"} A.8</p></div><div className={styles.titleProgress}><span>{control.code} {locale === "fr" ? "sur" : "of"} 34</span><i><b style={{ width: `${completed / 34 * 100}%` }} /></i></div></section>
      <div className={styles.assessmentGrid}>
        <aside className={styles.controls}><div className={styles.controlsHeader}><strong>{locale === "fr" ? "Contrôles technologiques" : "Technological Controls"}</strong><small>{locale === "fr" ? "34 contrôles" : "34 controls"}</small></div>{technologicalControls.map((candidate) => <a key={candidate.id} href={`/assessment/technological/${candidate.id}`} onClick={(e) => { e.preventDefault(); handleNav(candidate.id); }} className={candidate.id === controlId ? styles.controlActive : ""}><i className={`${styles.status} ${styles[status(candidate.id)] ?? ""}`} /><span><strong>{candidate.code} {candidate.name}</strong><small>{statusLabel(status(candidate.id), locale)}</small></span></a>)}</aside>
        <section className={styles.mainPanel}>
          <header className={styles.controlHeading}><div><span>{locale === "fr" ? "Contrôle technologique" : "Technological control"}</span><h2>{control.code} <b>{control.name}</b></h2></div><em className={current === "completed" ? styles.completeBadge : styles.openBadge}>{statusLabel(current, locale)}</em><small>{answered} / {questions.length} {locale === "fr" ? "répondues" : "answered"}</small></header>
          {loading && <p className={styles.state}>{locale === "fr" ? "Chargement des données de l’espace de travail…" : "Loading live workspace data…"}</p>}
          {!loading && resolution.requiredQuickContextQuestions.map((question) => <section key={question.key} className={styles.quickContext}><div><h3>{locale === "fr" ? "Contexte rapide" : "Quick context"}</h3><p>{locale === "fr" ? "Ces réponses adaptent uniquement les questions conditionnelles. Elles ne sont ni évaluées ni comptabilisées." : "These answers adapt conditional questions only. They are not assessed or counted."}</p></div><fieldset><legend>{question.question[locale]}</legend><div>{(["yes", "no", "not_sure"] as Decision[]).map((value) => <button key={value} disabled={Boolean(saving)} onClick={() => void saveContext(question.key, value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset></section>)}
          {questions.map((question, index) => {
            const saved = responses.find((item) => item.controlId === controlId && item.questionId === question.id);
            return <article id={question.id} className={styles.question} key={question.id}>
              <span className={styles.category}>{typeLabel(question.type, locale)}</span><h3>{index + 1}. <b>{question.question[locale]}</b></h3>
              <div className={styles.answers}>{values.map((value) => { const selected = selectedAnswers[question.id] ?? saved?.answer; return <button key={value} disabled={!workspaceId} onClick={() => { setSelectedAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: value })); if (value !== "not_applicable") void answer(question.id, value); }} className={`${styles[`answer_${value}`]} ${selected === value ? styles.answerSelected : ""}`}><i />{text(value, locale)}</button>; })}</div>
              {(selectedAnswers[question.id] ?? saved?.answer) === "not_applicable" && <div className={styles.justification}><label htmlFor={`justification-${question.id}`}>{locale === "fr" ? "Justification requise pour « Non applicable »" : "Required justification for Not applicable"}</label><textarea id={`justification-${question.id}`} value={justifications[question.id] ?? saved?.justification ?? ""} onChange={(event) => setJustifications((currentValues) => ({ ...currentValues, [question.id]: event.target.value }))} rows={3} disabled={saving === question.id} /><button type="button" disabled={!(justifications[question.id] ?? saved?.justification ?? "").trim() || saving === question.id} onClick={() => void answer(question.id, "not_applicable")}>{locale === "fr" ? "Enregistrer la justification" : "Save justification"}</button></div>}
              <QuestionEvidence workspaceId={workspaceId} themeId="technological" controlId={controlId} questionId={question.id} locale={locale} />
            </article>;
          })}
          {error && <p className={styles.error}>{error}</p>}
        </section>
      </div>
    </section>
    <footer className={styles.footer}><button disabled={!position} onClick={() => handleNav(technologicalControls[position - 1].id)}>{locale === "fr" ? "Contrôle précédent" : "Previous control"}</button><Link prefetch={true} href="/dashboard">{locale === "fr" ? "Enregistrer et quitter" : "Save & exit"}</Link><button disabled={position === 33} onClick={() => handleNav(technologicalControls[position + 1].id)}>{locale === "fr" ? "Contrôle suivant" : "Next control"}</button></footer>
  </main>;
}

