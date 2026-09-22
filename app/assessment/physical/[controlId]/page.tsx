"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStoredLanguage } from "@/components/language-preference";
import { LanguageToggle } from "@/components/language-toggle";
import { QuestionEvidence } from "@/components/assessment/question-evidence";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { workspaceDisplayName } from "@/lib/workspaces/display-name";
import { physicalControls as controls } from "@/content/assessment/physical/physical-controls";
import { getAssessmentCache } from "@/lib/assessment/client-cache";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type PhysicalContextDecision, type PhysicalQuickContextKey, type PhysicalQuickContextInputs, resolvePhysicalQuickContext } from "@/lib/assessment/physical-quick-context";
import { physicalSecurityPerimeterQuestions, resolvePhysicalSecurityPerimeterQuestions } from "@/content/assessment/physical/physical-security-perimeters";
import { physicalEntryQuestions, resolvePhysicalEntryQuestions } from "@/content/assessment/physical/physical-entry";
import { securingOfficesFacilitiesQuestions, resolveSecureOfficesFacilitiesQuestions } from "@/content/assessment/physical/securing-offices-rooms-facilities";
import { getAllPhysicalSecurityMonitoringQuestions, resolvePhysicalSecurityMonitoringQuestions } from "@/content/assessment/physical/physical-security-monitoring";
import { getAllPhysicalEnvironmentalThreatQuestions, resolvePhysicalEnvironmentalThreatQuestions } from "@/content/assessment/physical/physical-environmental-threats";
import { workingInSecureAreasQuestions, resolveWorkingInSecureAreasQuestions } from "@/content/assessment/physical/working-in-secure-areas";
import { clearDeskClearScreenQuestions, resolveClearDeskScreenQuestions } from "@/content/assessment/physical/clear-desk-clear-screen";
import { equipmentSitingProtectionQuestions, resolveEquipmentSitingProtectionQuestions } from "@/content/assessment/physical/equipment-siting-protection";
import { supportingUtilitiesQuestions } from "@/content/assessment/physical/supporting-utilities";
import { cablingSecurityQuestions } from "@/content/assessment/physical/cabling-security";
import { equipmentMaintenanceQuestions } from "@/content/assessment/physical/equipment-maintenance";
import { secureDisposalReuseQuestions } from "@/content/assessment/physical/secure-disposal-reuse";
import { resolveSupportingUtilitiesQuestions } from "@/lib/assessment/supporting-utilities";
import { resolveCablingSecurityQuestions } from "@/lib/assessment/cabling-security";
import { resolveEquipmentMaintenanceQuestions } from "@/lib/assessment/equipment-maintenance";
import { resolveSecureDisposalReuseQuestions } from "@/lib/assessment/secure-disposal-reuse";
import { getContextualPhysicalQuestions, resolveContextualPhysicalQuestions } from "@/lib/ui/physical-contextual-controls";
import type { AssessmentAnswerValue } from "@/content/assessment-infrastructure";
import styles from "../../people/[controlId]/people-assessment.module.css";

type Locale = "fr" | "en";
type AdditionalContextKey = "usesAssetsOffPremises" | "allowsBYODForBusiness" | "usesRemovableOrPortableStorageMedia";
type ControlContextKey = PhysicalQuickContextKey | AdditionalContextKey;
type Context = Partial<Record<ControlContextKey, PhysicalContextDecision>>;
type ControlContextInputs = {
  onboarding?: Partial<Record<ControlContextKey, "yes" | "no">>;
  sharedContext?: Partial<Record<ControlContextKey, "yes" | "no">>;
};
type QuestionType = "policy_process" | "application" | "proof_traceability" | "conditional";
type Question = { id: string; question: string; helpText: string; responseOptions: readonly AssessmentAnswerValue[]; type: QuestionType };
type CatalogQuestion = { id: string; question: string | { fr: string; en: string }; helpText?: string | { fr: string; en: string }; help?: string | { fr: string; en: string }; responseOptions?: readonly AssessmentAnswerValue[]; type?: string; category?: string };
type Response = { id: string; questionId: string; answer: AssessmentAnswerValue; justification?: string | null };
type ControlStatus = "notStarted" | "inProgress" | "review" | "gap" | "completed";

const keysFor: Record<string, PhysicalQuickContextKey[]> = {
  "a7-1": ["hasPhysicalLocationsSupportingScope", "usesThirdPartyManagedPremises"],
  "a7-2": ["hasPhysicalLocationsSupportingScope", "receivesVisitorsOrDeliveries"],
  "a7-3": ["hasPhysicalLocationsSupportingScope", "hasRestrictedOrSecureAreas", "usesThirdPartyManagedPremises"],
  "a7-4": ["hasPhysicalLocationsSupportingScope", "usesIdentifiablePhysicalMonitoring", "usesThirdPartyManagedPremises"],
  "a7-5": ["hasPhysicalLocationsSupportingScope", "usesThirdPartyManagedPremises"],
  "a7-6": ["hasRestrictedOrSecureAreas", "allowsVisitorsOrContractorsInSecureAreas"],
  "a7-7": [],
  "a7-8": [],
  "a7-9": [],
  "a7-10": [],
  "a7-11": [],
  "a7-12": [],
  "a7-13": [],
  "a7-14": [],
};

const additionalQuickContext: Partial<Record<string, Array<{ key: AdditionalContextKey; fr: string; en: string; requires?: { key: AdditionalContextKey; value: PhysicalContextDecision } }>>> = {
  "a7-9": [
    {
      key: "usesAssetsOffPremises",
      fr: "Votre organisation utilise-t-elle des actifs relevant du périmètre du SMSI hors de ses locaux ?",
      en: "Does your organization use assets within the ISMS scope away from its premises?",
    },
    {
      key: "allowsBYODForBusiness",
      fr: "Votre organisation autorise-t-elle l'utilisation d'équipements personnels (BYOD) à des fins professionnelles ?",
      en: "Does your organization allow personal devices (BYOD) for business purposes?",
      requires: { key: "usesAssetsOffPremises", value: "yes" },
    },
  ],
  "a7-10": [
    {
      key: "usesRemovableOrPortableStorageMedia",
      fr: "Votre organisation utilise-t-elle des supports de stockage amovibles ou portables dans le périmètre du SMSI ?",
      en: "Does your organization use removable or portable storage media within the ISMS scope?",
    },
  ],
};

function decision(value: unknown): PhysicalContextDecision | undefined {
  return value === "yes" || value === "no" || value === "not_sure" ? value : undefined;
}

function label(value: AssessmentAnswerValue, locale: Locale) {
  return (locale === "fr"
    ? { implemented: "Implémenté", partially_implemented: "Partiellement implémenté", not_implemented: "Non implémenté", not_sure: "Je ne sais pas", not_applicable: "Non applicable" }
    : { implemented: "Implemented", partially_implemented: "Partially implemented", not_implemented: "Not implemented", not_sure: "Not sure", not_applicable: "Not applicable" })[value];
}

function presentationType(type: string | undefined, category: string | undefined, index: number): QuestionType {
  if (category?.startsWith("conditional") || type === "conditional") return "conditional";
  if (type === "policy_process" || type === "application" || type === "proof_traceability") return type;
  return index === 0 ? "policy_process" : index === 1 ? "application" : "proof_traceability";
}

function typeLabel(type: QuestionType, locale: Locale) {
  return locale === "fr"
    ? { policy_process: "Politique / processus", application: "Application", proof_traceability: "Preuve / traçabilité", conditional: "Conditionnelle" }[type]
    : { policy_process: "Policy / Process", application: "Application", proof_traceability: "Proof / Traceability", conditional: "Conditional" }[type];
}

function allQuestions(controlId: string, locale: Locale): Question[] {
  const list: CatalogQuestion[] = controlId === "a7-1" ? physicalSecurityPerimeterQuestions
    : controlId === "a7-2" ? physicalEntryQuestions
      : controlId === "a7-3" ? securingOfficesFacilitiesQuestions
        : controlId === "a7-4" ? getAllPhysicalSecurityMonitoringQuestions(locale)
          : controlId === "a7-5" ? getAllPhysicalEnvironmentalThreatQuestions(locale)
            : controlId === "a7-6" ? workingInSecureAreasQuestions
              : controlId === "a7-7" ? clearDeskClearScreenQuestions
                : controlId === "a7-8" ? equipmentSitingProtectionQuestions
                  : controlId === "a7-9" ? getContextualPhysicalQuestions("a7-9")
                    : controlId === "a7-10" ? getContextualPhysicalQuestions("a7-10")
                      : controlId === "a7-11" ? supportingUtilitiesQuestions
                        : controlId === "a7-12" ? cablingSecurityQuestions
                          : controlId === "a7-13" ? equipmentMaintenanceQuestions
                            : secureDisposalReuseQuestions;
  return list.map((question, index) => {
    const help = question.helpText ?? question.help ?? "";
    return {
      id: question.id,
      question: typeof question.question === "string" ? question.question : question.question[locale],
      helpText: typeof help === "string" ? help : help[locale],
      responseOptions: question.responseOptions ?? ["implemented", "partially_implemented", "not_implemented", "not_sure", "not_applicable"],
      type: presentationType(question.type, question.category, index),
    };
  });
}

function resolutionFor(controlId: string, context: Context) {
  if (controlId === "a7-1") return resolvePhysicalSecurityPerimeterQuestions(context);
  if (controlId === "a7-2") return resolvePhysicalEntryQuestions(context);
  if (controlId === "a7-3") return resolveSecureOfficesFacilitiesQuestions(context);
  if (controlId === "a7-4") return resolvePhysicalSecurityMonitoringQuestions(context);
  if (controlId === "a7-5") return resolvePhysicalEnvironmentalThreatQuestions(context);
  if (controlId === "a7-6") return resolveWorkingInSecureAreasQuestions(context);
  if (controlId === "a7-7") return resolveClearDeskScreenQuestions();
  if (controlId === "a7-8") return resolveEquipmentSitingProtectionQuestions();
  if (controlId === "a7-9") return resolveContextualPhysicalQuestions("a7-9", context);
  if (controlId === "a7-10") return resolveContextualPhysicalQuestions("a7-10", context);
  if (controlId === "a7-11") return resolveSupportingUtilitiesQuestions();
  if (controlId === "a7-12") return resolveCablingSecurityQuestions();
  if (controlId === "a7-13") return resolveEquipmentMaintenanceQuestions();
  return resolveSecureDisposalReuseQuestions();
}

function statusLabel(status: ControlStatus, locale: Locale) {
  if (status === "completed") return locale === "fr" ? "Terminé" : "Completed";
  if (status === "gap") return "Gap";
  if (status === "review") return locale === "fr" ? "Revue requise" : "Review required";
  if (status === "inProgress") return locale === "fr" ? "En cours" : "In progress";
  return locale === "fr" ? "Non commencé" : "Not started";
}

export default function PhysicalControlPage() {
  const { language } = useStoredLanguage();
  const locale: Locale = language === "fr" ? "fr" : "en";
  const { controlId: rawControlIdUrl } = useParams<{ controlId: string }>();
  const [activeControlId, setActiveControlId] = useState(rawControlIdUrl);
  useEffect(() => { setActiveControlId(rawControlIdUrl); }, [rawControlIdUrl]);
  const raw = activeControlId;
  const handleNav = (newId: string) => {
    setActiveControlId(newId);
    
  };
  const controlId = controls.some(([id]) => id === raw) ? raw : "a7-1";
  const router = useRouter();
  const [context, setContext] = useState<Context>({});
  const [inputs, setInputs] = useState<ControlContextInputs>({});
  const [responses, setResponses] = useState<Response[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(!getAssessmentCache());
  const [saving, setSaving] = useState("");
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [, setNotApplicableQuestionId] = useState("");
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, AssessmentAnswerValue>>({});
  const answerQueues = useRef(new Map<string, Promise<void>>());

  const quickFor = (id: string) => {
    const standard = keysFor[id].map((key) => resolvePhysicalQuickContext(key, { ...inputs as PhysicalQuickContextInputs, persistedContext: context }));
    const additional = (additionalQuickContext[id] ?? [])
      .filter((item) => !item.requires || context[item.requires.key] === item.requires.value)
      .map((item) => {
        const persisted = context[item.key];
        const onboarding = inputs.onboarding?.[item.key];
        const shared = inputs.sharedContext?.[item.key];
        const value = persisted ?? onboarding ?? shared;
        return {
          value,
          source: persisted !== undefined ? "persisted_context" : onboarding !== undefined ? "onboarding" : shared !== undefined ? "shared_context" : "unknown",
          quickContextRequired: value === undefined || value === "not_sure",
          quickContextQuestion: { fr: item.fr, en: item.en, contextKey: item.key },
        };
      });
    return [...standard, ...additional];
  };
  const resolvedFor = (id: string) => Object.fromEntries(quickFor(id).filter((item) => item.value !== undefined).map((item) => [item.quickContextQuestion.contextKey, item.value])) as Context;
  const quick = quickFor(controlId);
  const resolvedContext = Object.fromEntries(quick.filter((item) => item.value !== undefined).map((item) => [item.quickContextQuestion.contextKey, item.value])) as Context;
  const resolution = resolutionFor(controlId, resolvedContext);
  const visibleQuestionIds = new Set(resolution.questionIds as string[]);
  const catalogQuestions = allQuestions(controlId, locale);
  const mainQuestions = catalogQuestions.filter((question) => question.type !== "conditional");
  const conditionalQuestions = catalogQuestions.filter((question) => question.type === "conditional" && visibleQuestionIds.has(question.id));
  const questions = [...mainQuestions, ...conditionalQuestions];

  useEffect(() => {
    document.querySelector<HTMLElement>(`.${styles.controlActive}`)?.scrollIntoView({ block: "nearest" });
  }, [controlId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured()) { setLoading(false); return; }
      try {
        const { fetchAssessmentData } = await import("@/lib/assessment/client-cache");
        const { workspaceId: id, metadata: rawMetadata, responses: rawResponses } = await fetchAssessmentData();
        
        const onboarding = (rawMetadata?.normcore_onboarding ?? {}) as Record<string, unknown>;
        const assessment = (onboarding.assessment_context ?? {}) as Record<string, unknown>;
        const physical = (assessment.physical ?? {}) as Record<string, unknown>;
        const shared = (assessment.shared_context ?? {}) as Record<string, unknown>;
        
        const toContext = (record: Record<string, unknown>) => Object.fromEntries(Object.keys(record).map((key) => [key, decision(record[key])]).filter(([, value]) => value !== undefined)) as Context;
        const toReliable = (record: Record<string, unknown>) => Object.fromEntries(Object.keys(record).map((key) => [key, decision(record[key])]).filter(([, value]) => value === "yes" || value === "no")) as Partial<Record<ControlContextKey, "yes" | "no">>;
        
        if (!cancelled) {
          setMetadata(onboarding);
          setContext(toContext(physical));
          setInputs({ onboarding: toReliable(onboarding), sharedContext: toReliable(shared) });
          setWorkspaceId(id);
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

  async function saveContext(key: ControlContextKey, value: PhysicalContextDecision) {
    setSaving(key);
    try {
      const currentAssessment = metadata.assessment_context && typeof metadata.assessment_context === "object" ? metadata.assessment_context as Record<string, unknown> : {};
      const currentPhysical = currentAssessment.physical && typeof currentAssessment.physical === "object" ? currentAssessment.physical as Record<string, unknown> : {};
      const nextAssessment = { ...currentAssessment, physical: { ...currentPhysical, [key]: value } };
      const next = { ...metadata, assessment_context: nextAssessment };
      const { error: updateError } = await createClient().auth.updateUser({ data: { normcore_onboarding: next } });
      if (updateError) throw updateError;
      setMetadata(next);
      setContext((current) => ({ ...current, [key]: value }));
    } catch {
      setError(locale === "fr" ? "Impossible d'enregistrer le contexte." : "Unable to save context.");
    } finally {
      setSaving("");
    }
  }

  async function answer(questionId: string, answerValue: AssessmentAnswerValue) {
    if (!workspaceId) return;
    if (answerValue === "not_applicable" && !justifications[questionId]?.trim()) {
      return;
    }
    const justification = answerValue === "not_applicable" ? justifications[questionId].trim() : undefined;
    const previous = answerQueues.current.get(questionId) ?? Promise.resolve();
    const pending = previous.catch(() => undefined).then(async () => {
      setSaving(questionId);
      setError("");
      try {
        const session = await createClient().auth.getSession();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session.data.session?.access_token) headers.Authorization = `Bearer ${session.data.session.access_token}`;
        const response = await fetch("/api/assessment/responses", { method: "POST", headers, body: JSON.stringify({ workspaceId, theme: "physical", controlId, questionId, answer: answerValue, justification }) });
        const body = await response.json() as Response & { error?: string };
        if (!response.ok) throw new Error(body.error || "Unable to save answer.");
        setResponses((current) => [...current.filter((r) => r.questionId !== questionId), body]);
        const { updateAssessmentResponses } = await import("@/lib/assessment/client-cache");
        updateAssessmentResponses((current) => [...current.filter((r) => r.questionId !== questionId), body as unknown as import("@/content/assessment-infrastructure").AssessmentAnswerRecord]);
      } catch {
        setError(locale === "fr" ? "Impossible d'enregistrer la réponse." : "Unable to save answer.");
      }
    });
    answerQueues.current.set(questionId, pending);
    await pending;
    if (answerQueues.current.get(questionId) === pending) {
      answerQueues.current.delete(questionId);
      setSaving("");
    }
  }

  const statusFor = (id: string): ControlStatus => {
    const controlResolution = resolutionFor(id, resolvedFor(id));
    const visibleIds = new Set(controlResolution.questionIds as string[]);
    const answered = responses.filter((row) => visibleIds.has(row.questionId));
    if (!answered.length) return "notStarted";
    if (controlResolution.unresolvedConditions.length || answered.length < visibleIds.size) return "inProgress";
    if (answered.some((row) => row.answer === "not_sure" || row.answer === "not_applicable")) return "review";
    if (answered.some((row) => row.answer === "not_implemented" || row.answer === "partially_implemented")) return "gap";
    return "completed";
  };

  const position = controls.findIndex(([id]) => id === controlId);
  const selected = controls[position];
  const answerCount = questions.filter((question) => responses.some((row) => row.questionId === question.id)).length;
  const completedControls = controls.filter(([id]) => ["completed", "gap"].includes(statusFor(id))).length;
  const progress = Math.round((completedControls / controls.length) * 100);
  const currentStatus = statusFor(controlId);
  const organization = workspaceDisplayName(metadata);

  return <main className={styles.shell}>
    <AppSidebar organization={organization} workspaceId={workspaceId} />
    <section className={styles.content}>
      <header className={styles.topbar}><p>{organization && <><span>{organization}</span><b>/</b></>}<span>{locale === "fr" ? "Évaluation" : "Assessment"}</span><b>/</b><strong>{locale === "fr" ? "Contrôles physiques" : "Physical Controls"}</strong></p><LanguageToggle className={styles.language} /></header>
      <section className={styles.titleCard}><div><h1>{locale === "fr" ? "Contrôles physiques" : "Physical Controls"}</h1><p>ISO/IEC 27001:2022 — {locale === "fr" ? "Annexe" : "Annex"} A.7</p></div><div className={styles.titleProgress}><span>{selected[1]} {locale === "fr" ? `sur ${controls.length}` : `of ${controls.length}`}</span><i><b style={{ width: `${(completedControls / controls.length) * 100}%` }} /></i></div></section>
      <div className={styles.assessmentGrid}>
        <aside className={styles.controls}>
          <div className={styles.controlsHeader}><div className={styles.progressRing} style={{ "--progress": `${progress}%` } as React.CSSProperties}><span>{progress}%</span></div><div><strong>{locale === "fr" ? "Contrôles physiques" : "Physical Controls"}</strong><small>{locale === "fr" ? `${controls.length} contrôles` : `${controls.length} controls`}</small></div></div>
          {controls.map(([id, code, en, fr]) => { const status = statusFor(id); return <a key={id} href={`/assessment/${window.location.pathname.split("/")[2]}/${id}`} onClick={(e) => { e.preventDefault(); handleNav(id); }} className={id === controlId ? styles.controlActive : ""}><i className={`${styles.status} ${styles[status] ?? ""}`} /><span><strong>{code} {locale === "fr" ? fr : en}</strong><small>{statusLabel(status, locale)}</small></span></a>; })}
        </aside>
        <section className={styles.mainPanel}>
          <header className={styles.controlHeading}><div><span>{locale === "fr" ? "Contrôle physique" : "Physical control"}</span><h2>{selected[1]} <b>{locale === "fr" ? selected[3] : selected[2]}</b></h2></div><em className={currentStatus === "completed" ? styles.completeBadge : styles.openBadge}>{currentStatus === "notStarted" ? (locale === "fr" ? "Non répondu" : "Not answered") : statusLabel(currentStatus, locale)}</em><small>{answerCount} / {questions.length} {locale === "fr" ? "répondues" : "answered"}</small></header>
          {loading && <p className={styles.state}>{locale === "fr" ? "Chargement des données de l’espace de travail…" : "Loading live workspace data…"}</p>}
          {!loading && !workspaceId && <p className={styles.state}>{error || (locale === "fr" ? "Aucun espace d’évaluation n’est disponible." : "No assessment workspace is available.")}</p>}
          {mainQuestions.map((question, visibleIndex) => { const saved = responses.find((row) => row.questionId === question.id); const selected = selectedAnswers[question.id] ?? saved?.answer; const showJustification = selected === "not_applicable"; const justification = justifications[question.id] ?? saved?.justification ?? ""; return <article id={question.id} style={{ order: 2 }} className={styles.question} key={question.id}><span className={styles.category}>{typeLabel(question.type, locale)}</span><h3>{visibleIndex + 1}. <b>{question.question}</b></h3><div className={styles.answers}>{question.responseOptions.map((value) => <button key={value} disabled={!workspaceId} onClick={() => { setSelectedAnswers((current) => ({ ...current, [question.id]: value })); setNotApplicableQuestionId(value === "not_applicable" ? question.id : ""); if (value !== "not_applicable") void answer(question.id, value); }} className={`${styles[`answer_${value}`]} ${selected === value ? styles.answerSelected : ""}`}><i />{label(value, locale)}</button>)}</div>{showJustification && <div className={styles.justification}><label htmlFor={`justification-${question.id}`}>{locale === "fr" ? "Justification requise pour « Non applicable »" : "Required justification for Not applicable"}</label><textarea id={`justification-${question.id}`} value={justification} onChange={(event) => setJustifications((current) => ({ ...current, [question.id]: event.target.value }))} rows={3} disabled={saving === question.id} /><button type="button" disabled={!justification.trim() || saving === question.id} onClick={() => void answer(question.id, "not_applicable")}>{locale === "fr" ? "Enregistrer la justification" : "Save justification"}</button></div>}<QuestionEvidence workspaceId={workspaceId} themeId="physical" controlId={controlId} questionId={question.id} locale={locale} guidance={question.helpText} /></article>; })}
          {!loading && quick.filter((item) => item.quickContextRequired).map((item) => <section style={{ order: 1 }} key={item.quickContextQuestion.contextKey} className={styles.quickContext}><div><h3>{locale === "fr" ? "Contexte rapide" : "Quick context"}</h3><p>{locale === "fr" ? "Cette réponse adapte uniquement les questions conditionnelles. Elle n'est pas évaluée et ne génère aucun gap." : "This answer only adapts conditional questions. It is not assessed and does not generate gaps."}</p></div><fieldset><legend>{item.quickContextQuestion[locale]}</legend><div>{(["yes", "no", "not_sure"] as PhysicalContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(saving)} onClick={() => void saveContext(item.quickContextQuestion.contextKey, value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset></section>)}
          {conditionalQuestions.map((question, conditionalIndex) => { const saved = responses.find((row) => row.questionId === question.id); const selected = selectedAnswers[question.id] ?? saved?.answer; const showJustification = selected === "not_applicable"; const justification = justifications[question.id] ?? saved?.justification ?? ""; return <article id={question.id} style={{ order: 3 }} className={styles.question} key={question.id}><span className={styles.category}>{typeLabel(question.type, locale)}</span><h3>{mainQuestions.length + conditionalIndex + 1}. <b>{question.question}</b></h3><div className={styles.answers}>{question.responseOptions.map((value) => <button key={value} disabled={!workspaceId} onClick={() => { setSelectedAnswers((current) => ({ ...current, [question.id]: value })); setNotApplicableQuestionId(value === "not_applicable" ? question.id : ""); if (value !== "not_applicable") void answer(question.id, value); }} className={`${styles[`answer_${value}`]} ${selected === value ? styles.answerSelected : ""}`}><i />{label(value, locale)}</button>)}</div>{showJustification && <div className={styles.justification}><label htmlFor={`justification-${question.id}`}>{locale === "fr" ? "Justification requise pour « Non applicable »" : "Required justification for Not applicable"}</label><textarea id={`justification-${question.id}`} value={justification} onChange={(event) => setJustifications((current) => ({ ...current, [question.id]: event.target.value }))} rows={3} disabled={saving === question.id} /><button type="button" disabled={!justification.trim() || saving === question.id} onClick={() => void answer(question.id, "not_applicable")}>{locale === "fr" ? "Enregistrer la justification" : "Save justification"}</button></div>}<QuestionEvidence workspaceId={workspaceId} themeId="physical" controlId={controlId} questionId={question.id} locale={locale} guidance={question.helpText} /></article>; })}
          {error && workspaceId && <p className={styles.error}>{error}</p>}
        </section>
      </div>
    </section>
    <footer className={styles.footer}><button disabled={position === 0} onClick={() => handleNav(controls[position - 1][0])}>{locale === "fr" ? "Contrôle précédent" : "Previous control"}</button><Link prefetch={true} href="/dashboard">{locale === "fr" ? "Enregistrer et quitter" : "Save & exit"}</Link><button disabled={position === controls.length - 1} onClick={() => handleNav(controls[position + 1][0])}>{locale === "fr" ? "Contrôle suivant" : "Next control"}</button></footer>
  </main>;
}



