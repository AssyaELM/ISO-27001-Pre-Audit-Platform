"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStoredLanguage } from "@/components/language-preference";
import { LanguageToggle } from "@/components/language-toggle";
import { QuestionEvidence } from "@/components/assessment/question-evidence";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { workspaceDisplayName } from "@/lib/workspaces/display-name";
import { peopleControls as controls } from "@/content/assessment/people/people-controls";
import { getAllScreeningQuestions, type A61AssessmentContext } from "@/content/assessment/people/screening";
import { getAllEmploymentTermsQuestions } from "@/content/assessment/people/employment-terms";
import { resolveEmploymentTermsQuestions, type A62AssessmentContext } from "@/content/assessment/people/employment-terms";
import { getAllAwarenessTrainingQuestions, resolveAwarenessTrainingQuestions, type A63AssessmentContext } from "@/content/assessment/people/awareness-training";
import { getAllDisciplinaryProcessQuestions, resolveDisciplinaryProcessQuestions, type A64AssessmentContext } from "@/content/assessment/people/disciplinary-process";
import { getAllPostEmploymentResponsibilitiesQuestions, resolvePostEmploymentResponsibilitiesQuestions, type A65AssessmentContext } from "@/content/assessment/people/post-employment-responsibilities";
import { getAllConfidentialityAgreementsQuestions, resolveConfidentialityAgreementsQuestions, type A66AssessmentContext } from "@/content/assessment/people/confidentiality-agreements";
import { getAllRemoteWorkingQuestions, resolveRemoteWorkingQuestions, type A67AssessmentContext } from "@/content/assessment/people/remote-working";
import { getAllEventReportingQuestions, resolveEventReportingQuestions, type A68AssessmentContext } from "@/content/assessment/people/event-reporting";
import { type AssessmentAnswerValue } from "@/content/assessment-infrastructure";
import { getAssessmentCache } from "@/lib/assessment/client-cache";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveScreeningQuestions } from "@/lib/assessment/screening";
import styles from "./people-assessment.module.css";

type Locale = "en" | "fr";
type QuestionType = "policy_process" | "application" | "proof_traceability" | "conditional";
type Question = { id: string; index: number; question: string; helpText: string; responseOptions: readonly AssessmentAnswerValue[]; type: QuestionType };
type Response = { id: string; controlId: string; questionId: string; answer: AssessmentAnswerValue; evidenceReference?: string | null; justification?: string | null };
type ContextDecision = "yes" | "no" | "not_sure";

async function authenticatedHeaders(): Promise<Record<string, string>> {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

function presentationType(question: { index: number; category?: string; type?: QuestionType }): QuestionType {
  if (question.type) return question.type;
  if (question.category?.startsWith("conditional")) return "conditional";
  return question.index === 1 ? "policy_process" : "application";
}

function questionsFor(controlId: string, locale: Locale, screeningContext: A61AssessmentContext, employmentContext: A62AssessmentContext, awarenessContext: A63AssessmentContext, disciplinaryContext: A64AssessmentContext, postEmploymentContext: A65AssessmentContext, confidentialityContext: A66AssessmentContext, remoteWorkingContext: A67AssessmentContext, eventReportingContext: A68AssessmentContext): Question[] {
  const get = {
    "a6-1": getAllScreeningQuestions, "a6-2": getAllEmploymentTermsQuestions, "a6-3": getAllAwarenessTrainingQuestions,
    "a6-4": getAllDisciplinaryProcessQuestions, "a6-5": getAllPostEmploymentResponsibilitiesQuestions,
    "a6-6": getAllConfidentialityAgreementsQuestions, "a6-7": getAllRemoteWorkingQuestions, "a6-8": getAllEventReportingQuestions,
  }[controlId];
  const all = get ? get(locale).map((question) => ({ id: question.id, index: question.index, question: question.question, helpText: question.helpText, responseOptions: question.responseOptions, type: presentationType(question) })) : [];
  const resolution = controlId === "a6-1"
    ? resolveScreeningQuestions(screeningContext)
    : controlId === "a6-2"
      ? resolveEmploymentTermsQuestions(employmentContext)
      : controlId === "a6-3"
        ? resolveAwarenessTrainingQuestions(awarenessContext)
        : controlId === "a6-4"
          ? resolveDisciplinaryProcessQuestions(disciplinaryContext)
          : controlId === "a6-5"
            ? resolvePostEmploymentResponsibilitiesQuestions(postEmploymentContext)
            : controlId === "a6-6"
              ? resolveConfidentialityAgreementsQuestions(confidentialityContext)
              : controlId === "a6-7"
                ? resolveRemoteWorkingQuestions(remoteWorkingContext)
                : controlId === "a6-8"
                  ? resolveEventReportingQuestions(eventReportingContext)
        : null;
  if (!resolution) return all;
  const visibleIds = new Set(resolution.questionIds);
  return all.filter((question) => visibleIds.has(question.id));
}

function label(answer: AssessmentAnswerValue, locale: Locale) {
  const labels = locale === "fr" ? { implemented: "Implémenté", partially_implemented: "Partiellement implémenté", not_implemented: "Non implémenté", not_sure: "Je ne sais pas", not_applicable: "Non applicable" } : { implemented: "Implemented", partially_implemented: "Partially implemented", not_implemented: "Not implemented", not_sure: "Not sure", not_applicable: "Not applicable" };
  return labels[answer];
}

function getQuestionTypeLabel(type: QuestionType, locale: Locale) {
  const labels: Record<QuestionType, string> = locale === "fr" ? {
    policy_process: "Politique / processus", application: "Application", proof_traceability: "Preuve / traçabilité", conditional: "Conditionnelle",
  } : {
    policy_process: "Policy / Process", application: "Application", proof_traceability: "Proof / Traceability", conditional: "Conditional",
  };
  return labels[type];
}

type ControlStatus = "notStarted" | "inProgress" | "review" | "gap" | "completed";

function controlStatus(rows: Response[], controlId: string, visibleQuestionIds: ReadonlySet<string>, unresolvedConditions: number): ControlStatus {
  const latest = new Map(rows.filter((row) => row.controlId === controlId && visibleQuestionIds.has(row.questionId)).map((row) => [row.questionId, row]));
  if (!latest.size) return "notStarted";
  if (unresolvedConditions || latest.size < visibleQuestionIds.size) return "inProgress";
  if ([...latest.values()].some((row) => row.answer === "not_sure" || row.answer === "not_applicable")) return "review";
  if ([...latest.values()].some((row) => row.answer === "not_implemented" || row.answer === "partially_implemented")) return "gap";
  return "completed";
}

function contextDecision(value: unknown): ContextDecision | undefined {
  return value === "yes" || value === "no" || value === "not_sure" ? value : undefined;
}

export default function PeopleControl() {
  const { language } = useStoredLanguage();
  const locale: Locale = language === "fr" ? "fr" : "en";
  const { controlId: rawControlIdUrl } = useParams<{ controlId: string }>();
    const [activeControlId, setActiveControlId] = useState(rawControlIdUrl);
    useEffect(() => { setActiveControlId(rawControlIdUrl); }, [rawControlIdUrl]);
    const rawControlId = activeControlId;
    const handleNav = (newId: string) => {
      setActiveControlId(newId);
      
    };
  const controlId = controls.some(([id]) => id === rawControlId) ? rawControlId : "a6-1";
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState("");
  const [organization, setOrganization] = useState("");
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(!getAssessmentCache());
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [responsesAvailable, setResponsesAvailable] = useState(false);
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, AssessmentAnswerValue>>({});
  const answerQueues = useRef(new Map<string, Promise<void>>());
  const [screeningContext, setScreeningContext] = useState<A61AssessmentContext>({});
  const [employmentContext, setEmploymentContext] = useState<A62AssessmentContext>({});
  const [awarenessContext, setAwarenessContext] = useState<A63AssessmentContext>({});
  const [disciplinaryContext, setDisciplinaryContext] = useState<A64AssessmentContext>({});
  const [postEmploymentContext, setPostEmploymentContext] = useState<A65AssessmentContext>({});
  const [confidentialityContext, setConfidentialityContext] = useState<A66AssessmentContext>({});
  const [remoteWorkingContext, setRemoteWorkingContext] = useState<A67AssessmentContext>({});
  const [eventReportingContext, setEventReportingContext] = useState<A68AssessmentContext>({});
  const [remoteNotApplicableJustification, setRemoteNotApplicableJustification] = useState("");
  const [onboardingMetadata, setOnboardingMetadata] = useState<Record<string, unknown>>({});
  const [savingContext, setSavingContext] = useState<string>("");
  const questions = useMemo(() => {
    return questionsFor(controlId, locale, screeningContext, employmentContext, awarenessContext, disciplinaryContext, postEmploymentContext, confidentialityContext, remoteWorkingContext, eventReportingContext);
  }, [controlId, locale, screeningContext, employmentContext, awarenessContext, disciplinaryContext, postEmploymentContext, confidentialityContext, remoteWorkingContext, eventReportingContext]);
  useEffect(() => {
    document.querySelector<HTMLElement>(`.${styles.controlActive}`)?.scrollIntoView({ block: "nearest" });
  }, [controlId]);
  const selectedControl = controls.find(([id]) => id === controlId) ?? controls[0];
  const currentIndex = controls.findIndex(([id]) => id === controlId);
  const answerCount = questions.filter((question) => responses.some((row) => row.questionId === question.id)).length;
  const stateFor = useCallback((id: string) => {
    const visible = questionsFor(id, locale, screeningContext, employmentContext, awarenessContext, disciplinaryContext, postEmploymentContext, confidentialityContext, remoteWorkingContext, eventReportingContext);
    const unresolved = id === "a6-1" ? resolveScreeningQuestions(screeningContext).unresolvedConditions.length : id === "a6-2" ? resolveEmploymentTermsQuestions(employmentContext).unresolvedConditions.length : id === "a6-3" ? resolveAwarenessTrainingQuestions(awarenessContext).unresolvedConditions.length : id === "a6-4" ? resolveDisciplinaryProcessQuestions(disciplinaryContext).unresolvedConditions.length : id === "a6-5" ? resolvePostEmploymentResponsibilitiesQuestions(postEmploymentContext).unresolvedConditions.length : id === "a6-6" ? resolveConfidentialityAgreementsQuestions(confidentialityContext).unresolvedConditions.length : id === "a6-7" ? resolveRemoteWorkingQuestions(remoteWorkingContext).unresolvedConditions.length : id === "a6-8" ? resolveEventReportingQuestions(eventReportingContext).unresolvedConditions.length : 0;
    return controlStatus(responses, id, new Set(visible.map((question) => question.id)), unresolved);
  }, [locale, screeningContext, employmentContext, awarenessContext, disciplinaryContext, postEmploymentContext, confidentialityContext, remoteWorkingContext, eventReportingContext, responses]);
  const fullyAssessedControls = controls.filter(([id]) => ["completed", "gap"].includes(stateFor(id))).length;
  const statusFor = stateFor;
  const currentStatus = stateFor(controlId);
  useEffect(() => {
    const badge = document.querySelector<HTMLElement>(`.${styles.completeBadge}, .${styles.openBadge}`);
    if (!badge) return;
    const text = currentStatus === "completed" ? (locale === "fr" ? "Terminé" : "Completed") : currentStatus === "gap" ? "Gap" : currentStatus === "review" ? (locale === "fr" ? "Revue requise" : "Review required") : currentStatus === "inProgress" ? (locale === "fr" ? "En cours" : "In progress") : (locale === "fr" ? "Non répondu" : "Not answered");
    badge.textContent = text;
    badge.className = currentStatus === "completed" ? styles.completeBadge : styles.openBadge;
    document.querySelectorAll<HTMLAnchorElement>(`.${styles.controls} a`).forEach((element, index) => {
      const status = stateFor(controls[index][0]);
      const label = status === "completed" ? (locale === "fr" ? "Terminé" : "Completed") : status === "gap" ? "Gap" : status === "review" ? (locale === "fr" ? "Revue requise" : "Review required") : status === "inProgress" ? (locale === "fr" ? "En cours" : "In progress") : (locale === "fr" ? "Non commencé" : "Not started");
      const statusText = element.querySelector("small");
      if (statusText) statusText.textContent = label;
    });
  }, [currentStatus, fullyAssessedControls, locale, responses, screeningContext, employmentContext, awarenessContext, stateFor]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured()) { if (!cancelled) { setLoading(false); setError(locale === "fr" ? "La connexion aux données de l'espace n'est pas configurée." : "Workspace data connection is not configured."); } return; }
      try {
        const { fetchAssessmentData } = await import("@/lib/assessment/client-cache");
        const { workspaceId: id, metadata: rawMetadata, responses: rawResponses } = await fetchAssessmentData();
        const metadata = rawMetadata;
        const onboarding = (metadata?.normcore_onboarding ?? metadata?.normcore_onboarding_organization ?? {}) as Record<string, unknown>;
        const assessmentContext = (onboarding.assessment_context ?? {}) as Record<string, unknown>;
        const screening = (assessmentContext.screening ?? assessmentContext) as Record<string, unknown>;
        const employment = (assessmentContext.employment_terms ?? {}) as Record<string, unknown>;
        const awareness = (assessmentContext.awareness_training ?? {}) as Record<string, unknown>;
        const postEmployment = (assessmentContext.post_employment ?? {}) as Record<string, unknown>;
        const remoteWorking = (assessmentContext.remote_working ?? {}) as Record<string, unknown>;
        setOnboardingMetadata(onboarding);
        setScreeningContext({ hasExternalPersonnel: contextDecision(screening.has_external_personnel ?? screening.hasExternalPersonnel), hasSensitiveRoleChanges: contextDecision(screening.has_sensitive_role_changes ?? screening.hasSensitiveRoleChanges) });
        const external = contextDecision(screening.has_external_personnel ?? screening.hasExternalPersonnel);
        const sensitiveRoles = contextDecision(screening.has_sensitive_role_changes ?? screening.hasSensitiveRoleChanges);
        setEmploymentContext({ hasExternalPersonnel: external, hasSignificantChanges: contextDecision(employment.has_significant_changes ?? employment.hasSignificantChanges) ?? (sensitiveRoles === "yes" ? "yes" : undefined) });
        setAwarenessContext({
          hasRolesRequiringSpecializedTraining: contextDecision(awareness.has_roles_requiring_specialized_training ?? awareness.hasRolesRequiringSpecializedTraining),
          hasRelevantExternalParties: contextDecision(awareness.has_relevant_external_parties ?? awareness.hasRelevantExternalParties) ?? (external === "yes" || external === "no" ? external : undefined),
        });
        setDisciplinaryContext({ hasRelevantExternalParties: contextDecision(awareness.has_relevant_external_parties ?? awareness.hasRelevantExternalParties) ?? (external === "yes" || external === "no" ? external : undefined) });
        setPostEmploymentContext({
          hasEmploymentRoleChanges: contextDecision(postEmployment.has_employment_role_changes ?? postEmployment.hasEmploymentRoleChanges) ?? (sensitiveRoles === "yes" ? "yes" : undefined),
          hasRelevantExternalParties: contextDecision(awareness.has_relevant_external_parties ?? awareness.hasRelevantExternalParties) ?? (external === "yes" || external === "no" ? external : undefined),
        });
        setConfidentialityContext({ hasRelevantExternalParties: contextDecision(awareness.has_relevant_external_parties ?? awareness.hasRelevantExternalParties) ?? (external === "yes" || external === "no" ? external : undefined) });
        setEventReportingContext({ hasRelevantExternalParties: contextDecision(awareness.has_relevant_external_parties ?? awareness.hasRelevantExternalParties) ?? (external === "yes" || external === "no" ? external : undefined) });
        const persistedRemoteWorking = contextDecision(remoteWorking.has_remote_working ?? remoteWorking.hasRemoteWorking);
        const workModel = onboarding.work_model;
        setRemoteWorkingContext({
          hasRemoteWorking: persistedRemoteWorking ?? (workModel === "remote" || workModel === "hybrid" ? "yes" : undefined),
          hasBYODDevices: contextDecision(remoteWorking.has_byod_devices ?? remoteWorking.hasBYODDevices),
          hasHigherRiskLocations: contextDecision(remoteWorking.has_higher_risk_locations ?? remoteWorking.hasHigherRiskLocations),
        });
        setRemoteNotApplicableJustification(typeof remoteWorking.not_applicable_justification === "string" ? remoteWorking.not_applicable_justification : "");
        const name = workspaceDisplayName(metadata);
        if (!cancelled) { setWorkspaceId(id); setOrganization(name); setResponses(rawResponses as unknown as Response[]); setResponsesAvailable(true); }
      } catch (cause) { if (!cancelled) { setError(cause instanceof Error ? cause.message : "Unable to load assessment."); setResponsesAvailable(false); } }
      finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, [locale]);

  async function answer(questionId: string, value: AssessmentAnswerValue) {
    if (!workspaceId || !responsesAvailable) return;
    if (value === "not_applicable" && !justifications[questionId]?.trim()) {
      return;
    }
    const justification = value === "not_applicable" ? justifications[questionId].trim() : undefined;
    const previous = answerQueues.current.get(questionId) ?? Promise.resolve();
    const pending = previous.catch(() => undefined).then(async () => {
      setSavingId(questionId); setError("");
      try {
        const headers = await authenticatedHeaders();
        const result = await fetch("/api/assessment/responses", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ workspaceId, theme: "people", controlId, questionId, answer: value, justification }) });
        const body = await result.json() as Response & { error?: string };
        if (!result.ok) throw new Error(body.error || "Unable to save response.");
        setResponses((current) => [...current.filter((row) => row.questionId !== questionId), body]);
        const { updateAssessmentResponses } = await import("@/lib/assessment/client-cache");
        updateAssessmentResponses((current) => [...current.filter((row) => row.questionId !== questionId), body as unknown as import("@/content/assessment-infrastructure").AssessmentAnswerRecord]);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save response."); }
    });
    answerQueues.current.set(questionId, pending);
    await pending;
    if (answerQueues.current.get(questionId) === pending) {
      answerQueues.current.delete(questionId);
      setSavingId("");
    }
  }

  async function saveContext(key: keyof A61AssessmentContext, value: ContextDecision) {
    if (savingContext) return;
    setSavingContext(key); setError("");
    try {
      const nextContext = { ...screeningContext, [key]: value };
      const nextScreening = {
        ...(onboardingMetadata.assessment_context && typeof onboardingMetadata.assessment_context === "object" ? (onboardingMetadata.assessment_context as Record<string, unknown>).screening as Record<string, unknown> : {}),
        has_external_personnel: nextContext.hasExternalPersonnel,
        has_sensitive_role_changes: nextContext.hasSensitiveRoleChanges,
      };
      const client = createClient();
      const { error: updateError } = await client.auth.updateUser({
        data: { normcore_onboarding: { ...onboardingMetadata, assessment_context: { ...(onboardingMetadata.assessment_context && typeof onboardingMetadata.assessment_context === "object" ? onboardingMetadata.assessment_context as Record<string, unknown> : {}), screening: nextScreening } } },
      });
      if (updateError) throw updateError;
      setScreeningContext(nextContext);
      setOnboardingMetadata((current) => ({ ...current, assessment_context: { ...(current.assessment_context && typeof current.assessment_context === "object" ? current.assessment_context as Record<string, unknown> : {}), screening: nextScreening } }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save context."); }
    finally { setSavingContext(""); }
  }

  async function saveEmploymentContext(key: keyof A62AssessmentContext, value: ContextDecision) {
    if (savingContext) return;
    setSavingContext(key); setError("");
    try {
      const currentAssessmentContext = onboardingMetadata.assessment_context && typeof onboardingMetadata.assessment_context === "object" ? onboardingMetadata.assessment_context as Record<string, unknown> : {};
      const currentScreening = currentAssessmentContext.screening && typeof currentAssessmentContext.screening === "object" ? currentAssessmentContext.screening as Record<string, unknown> : {};
      const currentEmployment = currentAssessmentContext.employment_terms && typeof currentAssessmentContext.employment_terms === "object" ? currentAssessmentContext.employment_terms as Record<string, unknown> : {};
      const nextEmployment = { ...employmentContext, [key]: value };
      const nextScreening = key === "hasExternalPersonnel" ? { ...currentScreening, has_external_personnel: value } : currentScreening;
      const nextAssessmentContext = { ...currentAssessmentContext, screening: nextScreening, employment_terms: { ...currentEmployment, has_significant_changes: nextEmployment.hasSignificantChanges } };
      const { error: updateError } = await createClient().auth.updateUser({ data: { normcore_onboarding: { ...onboardingMetadata, assessment_context: nextAssessmentContext } } });
      if (updateError) throw updateError;
      setEmploymentContext(nextEmployment);
      if (key === "hasExternalPersonnel") setScreeningContext((current) => ({ ...current, hasExternalPersonnel: value }));
      setOnboardingMetadata((current) => ({ ...current, assessment_context: nextAssessmentContext }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save context."); }
    finally { setSavingContext(""); }
  }

  async function saveAwarenessContext(key: keyof A63AssessmentContext, value: ContextDecision) {
    if (savingContext) return;
    setSavingContext(key); setError("");
    try {
      const currentAssessmentContext = onboardingMetadata.assessment_context && typeof onboardingMetadata.assessment_context === "object" ? onboardingMetadata.assessment_context as Record<string, unknown> : {};
      const currentAwareness = currentAssessmentContext.awareness_training && typeof currentAssessmentContext.awareness_training === "object" ? currentAssessmentContext.awareness_training as Record<string, unknown> : {};
      const nextAwareness = { ...currentAwareness, [key === "hasRolesRequiringSpecializedTraining" ? "has_roles_requiring_specialized_training" : "has_relevant_external_parties"]: value };
      const nextAssessmentContext = { ...currentAssessmentContext, awareness_training: nextAwareness };
      const { error: updateError } = await createClient().auth.updateUser({ data: { normcore_onboarding: { ...onboardingMetadata, assessment_context: nextAssessmentContext } } });
      if (updateError) throw updateError;
      setAwarenessContext((current) => ({ ...current, [key]: value }));
      if (key === "hasRelevantExternalParties") {
        setDisciplinaryContext({ hasRelevantExternalParties: value });
        setPostEmploymentContext((current) => ({ ...current, hasRelevantExternalParties: value }));
        setConfidentialityContext({ hasRelevantExternalParties: value });
        setEventReportingContext({ hasRelevantExternalParties: value });
      }
      setOnboardingMetadata((current) => ({ ...current, assessment_context: nextAssessmentContext }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save context."); }
    finally { setSavingContext(""); }
  }

  async function savePostEmploymentContext(key: keyof A65AssessmentContext, value: ContextDecision) {
    if (savingContext) return;
    setSavingContext(key); setError("");
    try {
      const currentAssessmentContext = onboardingMetadata.assessment_context && typeof onboardingMetadata.assessment_context === "object" ? onboardingMetadata.assessment_context as Record<string, unknown> : {};
      const currentPostEmployment = currentAssessmentContext.post_employment && typeof currentAssessmentContext.post_employment === "object" ? currentAssessmentContext.post_employment as Record<string, unknown> : {};
      const nextPostEmployment = { ...currentPostEmployment, has_employment_role_changes: value };
      const nextAssessmentContext = { ...currentAssessmentContext, post_employment: nextPostEmployment };
      const { error: updateError } = await createClient().auth.updateUser({ data: { normcore_onboarding: { ...onboardingMetadata, assessment_context: nextAssessmentContext } } });
      if (updateError) throw updateError;
      setPostEmploymentContext((current) => ({ ...current, [key]: value }));
      setOnboardingMetadata((current) => ({ ...current, assessment_context: nextAssessmentContext }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save context."); }
    finally { setSavingContext(""); }
  }

  async function saveRemoteWorkingContext(key: keyof A67AssessmentContext, value: ContextDecision, justification?: string) {
    if (savingContext) return;
    setSavingContext(key); setError("");
    try {
      const currentAssessmentContext = onboardingMetadata.assessment_context && typeof onboardingMetadata.assessment_context === "object" ? onboardingMetadata.assessment_context as Record<string, unknown> : {};
      const currentRemoteWorking = currentAssessmentContext.remote_working && typeof currentAssessmentContext.remote_working === "object" ? currentAssessmentContext.remote_working as Record<string, unknown> : {};
      const keys: Record<keyof A67AssessmentContext, string> = { hasRemoteWorking: "has_remote_working", hasBYODDevices: "has_byod_devices", hasHigherRiskLocations: "has_higher_risk_locations" };
      const nextRemoteWorking = { ...currentRemoteWorking, [keys[key]]: value, ...(justification !== undefined ? { not_applicable_justification: justification } : {}) };
      const nextAssessmentContext = { ...currentAssessmentContext, remote_working: nextRemoteWorking };
      const { error: updateError } = await createClient().auth.updateUser({ data: { normcore_onboarding: { ...onboardingMetadata, assessment_context: nextAssessmentContext } } });
      if (updateError) throw updateError;
      setRemoteWorkingContext((current) => ({ ...current, [key]: value }));
      if (justification !== undefined) setRemoteNotApplicableJustification(justification);
      setOnboardingMetadata((current) => ({ ...current, assessment_context: nextAssessmentContext }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save context."); }
    finally { setSavingContext(""); }
  }

  return <main className={styles.shell}>
    <AppSidebar organization={organization} workspaceId={workspaceId} />
    <section className={styles.content}>
      <header className={styles.topbar}><p>{organization && <><span>{organization}</span><b>/</b></>}<span>{locale === "fr" ? "Évaluation" : "Assessment"}</span><b>/</b><strong>{locale === "fr" ? "Contrôles humains" : "People Controls"}</strong></p><LanguageToggle className={styles.language} /></header>
      <section className={styles.titleCard}><div><h1>{locale === "fr" ? "Contrôles liés aux personnes" : "People Controls"}</h1><p>ISO/IEC 27001:2022 — {locale === "fr" ? "Annexe" : "Annex"} A.6</p></div><div className={styles.titleProgress}><span>{selectedControl[1]} {locale === "fr" ? `sur ${controls.length}` : `of ${controls.length}`}</span><i><b style={{ width: `${(fullyAssessedControls / controls.length) * 100}%` }} /></i></div></section>
      <div className={styles.assessmentGrid}>
        <aside className={styles.controls}><div className={styles.controlsHeader}><div className={styles.progressRing} style={{ "--progress": `${Math.round((controls.filter(([id]) => statusFor(id) === "completed").length / controls.length) * 100)}%` } as React.CSSProperties}><span>{Math.round((controls.filter(([id]) => statusFor(id) === "completed").length / controls.length) * 100)}%</span></div><div><strong>{locale === "fr" ? "Contrôles liés aux personnes" : "People Controls"}</strong><small>{locale === "fr" ? `${controls.length} contrôles` : `${controls.length} controls`}</small></div></div>{controls.map(([id, code, en, fr]) => { const status = statusFor(id); return <a key={id} href={`/assessment/people/${id}`} onClick={(e) => { e.preventDefault(); handleNav(id); }} className={id === controlId ? styles.controlActive : ""}><i className={`${styles.status} ${styles[status]}`} /><span><strong>{code} {locale === "fr" ? fr : en}</strong><small>{status === "completed" ? (locale === "fr" ? "Terminé" : "Completed") : status === "review" ? (locale === "fr" ? "À revoir" : "Review / gap") : (locale === "fr" ? "Non commencé" : "Not started")}</small></span></a>})}</aside>
        <section className={styles.mainPanel}><header className={styles.controlHeading}><div><span>{locale === "fr" ? "Contrôle lié aux personnes" : "People control"}</span><h2>{selectedControl[1]} <b>{locale === "fr" ? selectedControl[3] : selectedControl[2]}</b></h2></div><em className={answerCount === questions.length && questions.length ? styles.completeBadge : styles.openBadge}>{answerCount === questions.length && questions.length ? (locale === "fr" ? "Terminé" : "Completed") : (locale === "fr" ? "Non répondu" : "Not answered")}</em><small>{answerCount} / {questions.length} {locale === "fr" ? "répondues" : "answered"}</small></header>
          {/* Type narrowing across the compact conditional JSX is intentionally explicit. */}
          {/* @ts-expect-error context branch is mutually exclusive by the outer condition */}
          {!loading && controlId === "a6-2" && (employmentContext.hasExternalPersonnel !== "yes" && employmentContext.hasExternalPersonnel !== "no" || employmentContext.hasExternalPersonnel === "no" && employmentContext.hasSignificantChanges === undefined) && <section className={styles.quickContext}><div><h3>{locale === "fr" ? "Contexte rapide" : "Quick context"}</h3><p>{locale === "fr" ? "Ces réponses servent uniquement à adapter les questions de ce contrôle. Elles ne sont pas évaluées et ne génèrent aucun gap." : "These answers are used only to adapt this control's questions. They are not assessed and do not generate gaps."}</p></div>{employmentContext.hasExternalPersonnel !== "yes" && employmentContext.hasExternalPersonnel !== "no" && <fieldset><legend>{locale === "fr" ? "Votre organisation fait-elle appel à des prestataires, intérimaires ou autres personnes externes ayant un accès pertinent aux informations, systèmes ou actifs du périmètre ?" : "Does your organization use contractors, temporary workers, or other external personnel with relevant access to in-scope information, systems, or assets?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveEmploymentContext("hasExternalPersonnel", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset>}{employmentContext.hasExternalPersonnel === "no" && employmentContext.hasSignificantChanges === undefined && <fieldset><legend>{locale === "fr" ? "En dehors des changements vers des fonctions sensiblement plus sensibles déjà couverts dans le contrôle précédent, votre organisation connaît-elle des changements importants de politique, de droit, de contrat ou d’accès pouvant nécessiter une révision des conditions de sécurité ?" : "Apart from moves into significantly more sensitive roles already covered in the previous control, does your organization experience significant changes in policy, law, contractual relationships, or access that may require security terms to be reviewed?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveEmploymentContext("hasSignificantChanges", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset>}</section>}
          {!loading && controlId === "a6-3" && (awarenessContext.hasRolesRequiringSpecializedTraining === undefined || awarenessContext.hasRelevantExternalParties === undefined) && <section className={styles.quickContext}><div><h3>{locale === "fr" ? "Contexte rapide" : "Quick context"}</h3><p>{locale === "fr" ? "Ces réponses servent uniquement à adapter les questions de ce contrôle. Elles ne sont pas évaluées et ne génèrent aucun gap." : "These answers are used only to adapt this control's questions. They are not assessed and do not generate gaps."}</p></div>{awarenessContext.hasRolesRequiringSpecializedTraining === undefined && <fieldset><legend>{locale === "fr" ? "Votre organisation compte-t-elle des rôles présentant des responsabilités ou des risques particuliers en matière de sécurité de l’information, nécessitant une formation complémentaire adaptée ?" : "Does your organization have roles with specific information security responsibilities or risks that require additional tailored training?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveAwarenessContext("hasRolesRequiringSpecializedTraining", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset>}{awarenessContext.hasRelevantExternalParties === undefined && <fieldset><legend>{locale === "fr" ? "Votre organisation fait-elle appel à des prestataires, intérimaires, consultants ou autres parties externes disposant d’un accès pertinent aux informations, systèmes, actifs ou locaux du périmètre ?" : "Does your organization use contractors, temporary workers, consultants, or other external parties with relevant access to in-scope information, systems, assets, or premises?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveAwarenessContext("hasRelevantExternalParties", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset>}</section>}
          {!loading && controlId === "a6-4" && disciplinaryContext.hasRelevantExternalParties === undefined && <section className={styles.quickContext}><div><h3>{locale === "fr" ? "Contexte rapide" : "Quick context"}</h3><p>{locale === "fr" ? "Cette réponse sert uniquement à adapter les questions de ce contrôle. Elle n'est pas évaluée et ne génère aucun gap." : "This answer is used only to adapt this control's questions. It is not assessed and does not generate gaps."}</p></div><fieldset><legend>{locale === "fr" ? "Votre organisation fait-elle appel à des prestataires, intérimaires, consultants ou autres parties externes disposant d’un accès pertinent aux informations, systèmes, actifs ou locaux du périmètre ?" : "Does your organization use contractors, temporary workers, consultants, or other external parties with relevant access to in-scope information, systems, assets, or premises?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveAwarenessContext("hasRelevantExternalParties", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset></section>}
          {loading ? <p className={styles.state}>{locale === "fr" ? "Chargement des données réelles…" : "Loading live workspace data…"}</p> : !workspaceId ? <p className={styles.state}>{error || (locale === "fr" ? "Aucun espace d'évaluation n'est disponible." : "No assessment workspace is available.")}</p> : <>{!responsesAvailable && <p className={styles.error}>{locale === "fr" ? "Les réponses existantes ne peuvent pas encore être chargées." : "Assessment responses could not be loaded."}</p>}{questions.map((question, visibleIndex) => { const saved = responses.find((row) => row.questionId === question.id); const selected = selectedAnswers[question.id] ?? saved?.answer; const showJustification = selected === "not_applicable"; const justification = justifications[question.id] ?? saved?.justification ?? ""; return <article id={question.id} className={styles.question} key={question.id}><span className={styles.category}>{getQuestionTypeLabel(question.type, locale)}</span><h3>{visibleIndex + 1}. <b>{question.question}</b></h3><div className={styles.answers}>{question.responseOptions.map((value) => <button key={value} disabled={!responsesAvailable} onClick={() => { setSelectedAnswers((current) => ({ ...current, [question.id]: value })); if (value !== "not_applicable") void answer(question.id, value); }} className={`${styles[`answer_${value}`]} ${selected === value ? styles.answerSelected : ""}`}><i />{label(value, locale)}</button>)}</div>{showJustification && <div className={styles.justification}><label htmlFor={`justification-${question.id}`}>{locale === "fr" ? "Justification requise pour « Non applicable »" : "Required justification for Not applicable"}</label><textarea id={`justification-${question.id}`} value={justification} onChange={(event) => setJustifications((current) => ({ ...current, [question.id]: event.target.value }))} rows={3} disabled={!responsesAvailable || savingId === question.id} /><button type="button" disabled={!justification.trim() || !responsesAvailable || savingId === question.id} onClick={() => void answer(question.id, "not_applicable")}>{locale === "fr" ? "Enregistrer la justification" : "Save justification"}</button></div>}<QuestionEvidence workspaceId={workspaceId} themeId="people" controlId={controlId} questionId={question.id} locale={locale} guidance={question.helpText} /></article>; })}</>}
          {!loading && controlId === "a6-5" && (postEmploymentContext.hasEmploymentRoleChanges === undefined || postEmploymentContext.hasRelevantExternalParties === undefined) && <section className={styles.quickContext}><div><h3>{locale === "fr" ? "Contexte rapide" : "Quick context"}</h3><p>{locale === "fr" ? "Ces réponses servent uniquement à adapter les questions conditionnelles de ce contrôle. Elles ne sont pas évaluées et ne génèrent aucun gap." : "These answers only adapt this control's conditional questions. They are not assessed and do not generate gaps."}</p></div>{postEmploymentContext.hasEmploymentRoleChanges === undefined && <fieldset><legend>{locale === "fr" ? "Des changements de fonction ou de responsabilités interviennent-ils dans votre organisation, avec une modification des accès, privilèges ou obligations de sécurité ?" : "Do changes of role or responsibilities occur in your organization, including changes to access, privileges, or information security obligations?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void savePostEmploymentContext("hasEmploymentRoleChanges", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset>}{postEmploymentContext.hasRelevantExternalParties === undefined && <fieldset><legend>{locale === "fr" ? "Votre organisation travaille-t-elle avec des consultants, prestataires, intérimaires ou autres parties externes disposant d’un accès pertinent aux informations, systèmes, actifs ou locaux du périmètre ?" : "Does your organization work with consultants, contractors, temporary workers, or other external parties with relevant access to in-scope information, systems, assets, or premises?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveAwarenessContext("hasRelevantExternalParties", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset>}</section>}
          {!loading && controlId === "a6-1" && (screeningContext.hasExternalPersonnel === undefined || screeningContext.hasSensitiveRoleChanges === undefined) && <section className={styles.quickContext}><div><h3>{locale === "fr" ? "Contexte rapide" : "Quick context"}</h3><p>{locale === "fr" ? "Ces réponses servent uniquement à adapter les questions conditionnelles. Elles ne sont pas évaluées." : "These answers only adapt conditional questions. They are not assessed."}</p></div>{screeningContext.hasExternalPersonnel === undefined && <fieldset><legend>{locale === "fr" ? "Votre organisation emploie-t-elle des prestataires, intérimaires ou autres personnes externes ayant un accès pertinent ?" : "Does your organization use contractors, temporary workers, or other external personnel with relevant access?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveContext("hasExternalPersonnel", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset>}{screeningContext.hasSensitiveRoleChanges === undefined && <fieldset><legend>{locale === "fr" ? "Des personnes peuvent-elles accéder à des fonctions avec des privilèges sensiblement plus élevés ou des informations sensibles ?" : "Can personnel move into roles involving significantly higher privileges or access to sensitive information?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveContext("hasSensitiveRoleChanges", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset>}</section>}
          {!loading && controlId === "a6-6" && confidentialityContext.hasRelevantExternalParties === undefined && <section className={styles.quickContext}><div><h3>{locale === "fr" ? "Contexte rapide" : "Quick context"}</h3><p>{locale === "fr" ? "Cette réponse sert uniquement à adapter la question conditionnelle de ce contrôle. Elle n'est pas évaluée et ne génère aucun gap." : "This answer only adapts this control's conditional question. It is not assessed and does not generate gaps."}</p></div><fieldset><legend>{locale === "fr" ? "Votre organisation travaille-t-elle avec des consultants, prestataires, intérimaires ou autres parties externes disposant d’un accès pertinent aux informations, systèmes, actifs ou locaux du périmètre ?" : "Does your organization work with consultants, contractors, temporary workers, or other external parties with relevant access to in-scope information, systems, assets, or premises?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveAwarenessContext("hasRelevantExternalParties", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset></section>}
          {!loading && controlId === "a6-7" && remoteWorkingContext.hasRemoteWorking === undefined && <section className={styles.quickContext}><div><h3>{locale === "fr" ? "Contexte rapide" : "Quick context"}</h3><p>{locale === "fr" ? "Cette réponse détermine si ce contrôle s'applique. Elle n'est pas évaluée et ne génère aucun gap." : "This answer determines whether this control applies. It is not assessed and does not generate gaps."}</p></div><fieldset><legend>{locale === "fr" ? "Des personnes dans le périmètre de l’évaluation travaillent-elles à distance, même occasionnellement ?" : "Does anyone within the assessment scope work remotely, even occasionally?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveRemoteWorkingContext("hasRemoteWorking", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset></section>}
          {!loading && controlId === "a6-7" && remoteWorkingContext.hasRemoteWorking === "no" && <section className={styles.quickContext}><div><h3>{locale === "fr" ? "Contrôle non applicable" : "Control not applicable"}</h3><p>{locale === "fr" ? "Expliquez pourquoi le travail à distance ne s'applique pas au périmètre évalué." : "Explain why remote working does not apply to the assessment scope."}</p></div><textarea value={remoteNotApplicableJustification} onChange={(event) => setRemoteNotApplicableJustification(event.target.value)} rows={3} disabled={Boolean(savingContext)} /><button type="button" disabled={!remoteNotApplicableJustification.trim() || Boolean(savingContext)} onClick={() => void saveRemoteWorkingContext("hasRemoteWorking", "no", remoteNotApplicableJustification.trim())}>{locale === "fr" ? "Enregistrer la justification" : "Save justification"}</button></section>}
          {!loading && controlId === "a6-7" && remoteWorkingContext.hasRemoteWorking === "yes" && (remoteWorkingContext.hasBYODDevices === undefined || remoteWorkingContext.hasBYODDevices === "not_sure" || remoteWorkingContext.hasHigherRiskLocations === undefined || remoteWorkingContext.hasHigherRiskLocations === "not_sure") && <section className={styles.quickContext}><div><h3>{locale === "fr" ? "Contexte rapide" : "Quick context"}</h3><p>{locale === "fr" ? "Ces réponses servent uniquement à adapter les questions conditionnelles. Elles ne sont pas évaluées et ne génèrent aucun gap." : "These answers only adapt conditional questions. They are not assessed and do not generate gaps."}</p></div>{(remoteWorkingContext.hasBYODDevices === undefined || remoteWorkingContext.hasBYODDevices === "not_sure") && <fieldset><legend>{locale === "fr" ? "Des appareils personnels sont-ils utilisés pour le travail à distance dans le périmètre de l’évaluation ?" : "Are personally-owned devices used for remote work within the assessment scope?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveRemoteWorkingContext("hasBYODDevices", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset>}{(remoteWorkingContext.hasHigherRiskLocations === undefined || remoteWorkingContext.hasHigherRiskLocations === "not_sure") && <fieldset><legend>{locale === "fr" ? "Le travail à distance peut-il être réalisé depuis des lieux, espaces partagés, déplacements ou juridictions présentant un risque plus élevé pour les informations ou les accès du périmètre ?" : "Can remote work take place from locations, shared spaces, travel situations, or jurisdictions that present higher risk to in-scope information or access?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveRemoteWorkingContext("hasHigherRiskLocations", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset>}</section>}
          {!loading && controlId === "a6-8" && (eventReportingContext.hasRelevantExternalParties === undefined || eventReportingContext.hasRelevantExternalParties === "not_sure") && <section className={styles.quickContext}><div><h3>{locale === "fr" ? "Contexte rapide" : "Quick context"}</h3><p>{locale === "fr" ? "Cette réponse sert uniquement à adapter la question conditionnelle. Elle n'est pas évaluée et ne génère aucun gap." : "This answer only adapts the conditional question. It is not assessed and does not generate gaps."}</p></div><fieldset><legend>{locale === "fr" ? "Votre organisation travaille-t-elle avec des fournisseurs, consultants, partenaires ou autres parties externes disposant d’un accès pertinent aux informations, systèmes, actifs ou locaux du périmètre ?" : "Does your organization work with suppliers, consultants, partners, or other external parties with relevant access to in-scope information, systems, assets, or premises?"}</legend><div>{(["yes", "no", "not_sure"] as ContextDecision[]).map((value) => <button key={value} type="button" disabled={Boolean(savingContext)} onClick={() => void saveAwarenessContext("hasRelevantExternalParties", value)}>{value === "yes" ? (locale === "fr" ? "Oui" : "Yes") : value === "no" ? (locale === "fr" ? "Non" : "No") : (locale === "fr" ? "Je ne sais pas" : "Not sure")}</button>)}</div></fieldset></section>}
          {error && responsesAvailable && <p className={styles.error}>{error}</p>}
        </section>
      </div>
    </section>
    <footer className={styles.footer}><button disabled={currentIndex === 0} onClick={() => handleNav(controls[currentIndex - 1][0])}>{locale === "fr" ? "Contrôle précédent" : "Previous control"}</button><Link prefetch={true} href="/dashboard">{locale === "fr" ? "Enregistrer et quitter" : "Save & exit"}</Link><button disabled={currentIndex === controls.length - 1} onClick={() => handleNav(controls[currentIndex + 1][0])}>{locale === "fr" ? "Contrôle suivant" : "Next control"}</button></footer>
  </main>;
}

