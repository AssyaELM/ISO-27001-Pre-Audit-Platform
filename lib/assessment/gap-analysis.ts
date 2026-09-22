import type { AssessmentAnswerValue } from "../../content/assessment-infrastructure.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";
import { organizationalControls } from "../../content/assessment/organizational/organizational-controls.ts";
import { peopleControls } from "../../content/assessment/people/people-controls.ts";
import { physicalControls } from "../../content/assessment/physical/physical-controls.ts";
import { technologicalControls } from "../../content/assessment/technological/technological-controls.generated.ts";
import { deriveOrganizationalOutcome, resolveOrganizationalAssessmentContext } from "./organizational-controls.ts";
import { deriveTechnologicalOutcome, resolveTechnologicalAssessmentContext } from "./technological-controls.ts";

import { getAllScreeningQuestions } from "../../content/assessment/people/screening.ts";
import { getAllEmploymentTermsQuestions, resolveEmploymentTermsQuestions } from "../../content/assessment/people/employment-terms.ts";
import { getAllAwarenessTrainingQuestions, resolveAwarenessTrainingQuestions } from "../../content/assessment/people/awareness-training.ts";
import { getAllDisciplinaryProcessQuestions, resolveDisciplinaryProcessQuestions } from "../../content/assessment/people/disciplinary-process.ts";
import { getAllPostEmploymentResponsibilitiesQuestions, resolvePostEmploymentResponsibilitiesQuestions } from "../../content/assessment/people/post-employment-responsibilities.ts";
import { getAllConfidentialityAgreementsQuestions, resolveConfidentialityAgreementsQuestions } from "../../content/assessment/people/confidentiality-agreements.ts";
import { getAllRemoteWorkingQuestions, resolveRemoteWorkingQuestions } from "../../content/assessment/people/remote-working.ts";
import { getAllEventReportingQuestions, resolveEventReportingQuestions } from "../../content/assessment/people/event-reporting.ts";
import { resolveScreeningQuestions } from "./screening.ts";
import { deriveScreeningRemediationPlan } from "./remediation.ts";
import { deriveEmploymentTermsRemediationPlan } from "./employment-terms.ts";
import { deriveAwarenessTrainingRemediationPlan } from "./awareness-training.ts";
import { deriveDisciplinaryProcessRemediationPlan } from "./disciplinary-process.ts";
import { derivePostEmploymentResponsibilitiesRemediationPlan } from "./post-employment-responsibilities.ts";
import { deriveConfidentialityAgreementsRemediationPlan } from "./confidentiality-agreements.ts";
import { deriveRemoteWorkingRemediationPlan } from "./remote-working.ts";
import { deriveEventReportingRemediationPlan } from "./event-reporting.ts";

import { physicalSecurityPerimeterQuestions, resolvePhysicalSecurityPerimeterQuestions } from "../../content/assessment/physical/physical-security-perimeters.ts";
import { physicalEntryQuestions, resolvePhysicalEntryQuestions } from "../../content/assessment/physical/physical-entry.ts";
import { securingOfficesFacilitiesQuestions, resolveSecureOfficesFacilitiesQuestions } from "../../content/assessment/physical/securing-offices-rooms-facilities.ts";
import { getAllPhysicalSecurityMonitoringQuestions, resolvePhysicalSecurityMonitoringQuestions } from "../../content/assessment/physical/physical-security-monitoring.ts";
import { getAllPhysicalEnvironmentalThreatQuestions, resolvePhysicalEnvironmentalThreatQuestions } from "../../content/assessment/physical/physical-environmental-threats.ts";
import { workingInSecureAreasQuestions, resolveWorkingInSecureAreasQuestions } from "../../content/assessment/physical/working-in-secure-areas.ts";
import { clearDeskClearScreenQuestions, resolveClearDeskScreenQuestions } from "../../content/assessment/physical/clear-desk-clear-screen.ts";
import { equipmentSitingProtectionQuestions, resolveEquipmentSitingProtectionQuestions } from "../../content/assessment/physical/equipment-siting-protection.ts";
import { supportingUtilitiesQuestions } from "../../content/assessment/physical/supporting-utilities.ts";
import { cablingSecurityQuestions } from "../../content/assessment/physical/cabling-security.ts";
import { equipmentMaintenanceQuestions } from "../../content/assessment/physical/equipment-maintenance.ts";
import { secureDisposalReuseQuestions } from "../../content/assessment/physical/secure-disposal-reuse.ts";
import { getContextualPhysicalQuestions, resolveContextualPhysicalQuestions } from "../ui/physical-contextual-controls.ts";
import { resolveSupportingUtilitiesQuestions, deriveSupportingUtilitiesRemediationPlan } from "./supporting-utilities.ts";
import { resolveCablingSecurityQuestions, deriveCablingSecurityOutcome, deriveCablingSecurityRemediationPlan } from "./cabling-security.ts";
import { resolveEquipmentMaintenanceQuestions, deriveEquipmentMaintenanceOutcome, deriveEquipmentMaintenanceRemediationPlan } from "./equipment-maintenance.ts";
import { resolveSecureDisposalReuseQuestions, deriveSecureDisposalReuseOutcome, deriveSecureDisposalReuseRemediationPlan } from "./secure-disposal-reuse.ts";
import { derivePhysicalSecurityPerimetersRemediationPlan } from "./physical-security-perimeters.ts";
import { derivePhysicalEntryRemediationPlan } from "./physical-entry.ts";
import { deriveSecureOfficesFacilitiesRemediationPlan } from "./securing-offices-rooms-facilities.ts";
import { derivePhysicalSecurityMonitoringRemediationPlan } from "./physical-security-monitoring.ts";
import { derivePhysicalEnvironmentalThreatRemediationPlan } from "./physical-environmental-threats.ts";
import { deriveWorkingInSecureAreasRemediationPlan } from "./working-in-secure-areas.ts";
import { deriveClearDeskScreenRemediationPlan } from "./clear-desk-clear-screen.ts";
import { deriveEquipmentSitingProtectionRemediationPlan } from "./equipment-siting-protection.ts";
import { deriveSecurityOfAssetsOffPremisesRemediationPlan } from "./security-of-assets-off-premises.ts";
import { deriveStorageMediaRemediationPlan } from "./storage-media.ts";

export type GapAnalysisTheme = "organizational" | "people" | "physical" | "technological";
export type GapAnalysisStatus = "partial_gap" | "full_gap" | "clarification_required" | "applicability_review_required";
export type GapAnalysisLocale = "fr" | "en";
export type GapAnalysisEvidenceStatus = "not_provided" | "provided";
export type CanonicalAssessmentCatalogQuestion = { id: string; wording: string };
export type CanonicalAssessmentCatalogControl = {
  id: string;
  code: string;
  title: string;
  questions: CanonicalAssessmentCatalogQuestion[];
};

export type GapAnalysisResponse = {
  controlId: string;
  questionId: string;
  answer: AssessmentAnswerValue;
  theme?: string;
  justification?: string | null;
  evidenceReference?: string | null;
  hasCanonicalEvidence?: boolean;
};

export type GapAnalysisItem = {
  id: string;
  theme: GapAnalysisTheme;
  controlId: string;
  controlCode: string;
  controlTitle: string;
  questionId: string;
  question: string;
  answer: AssessmentAnswerValue;
  status: GapAnalysisStatus;
  gapCode?: string;
  diagnostic?: string;
  remediation?: string;
  evidenceStatus: GapAnalysisEvidenceStatus;
  href: string;
};

type Localized = { fr?: string; en?: string };
type GenericQuestion = { id: string; question: string | Localized };
type GenericAction = Record<string, unknown>;
type Context = Record<string, "yes" | "no" | "not_sure">;

function object(value: unknown): Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function decision(value: unknown): "yes" | "no" | "not_sure" | undefined { return value === "yes" || value === "no" || value === "not_sure" ? value : undefined; }
function text(value: unknown, locale: GapAnalysisLocale): string {
  if (typeof value === "string") return value;
  const localized = object(value);
  return typeof localized[locale] === "string" ? localized[locale] as string : typeof localized.en === "string" ? localized.en : "";
}
const dynamicGapTranslations: Record<string, { en: string; fr: string }> = {
  "Registre/procédure non maintenu ou sans preuve.": {
    en: "Register or procedure is not maintained, or no evidence is available.",
    fr: "Registre/procédure non maintenu ou sans preuve.",
  },
  "Établir cycle de vérification et documenter les résultats.": {
    en: "Establish a verification cycle and document the results.",
    fr: "Établir cycle de vérification et documenter les résultats.",
  },
};
function containsFrenchText(value: string) {
  return /[àâçéèêëîïôùûüÿœæÀÂÇÉÈÊËÎÏÔÙÛÜŸŒÆ]|(?:\b(?:aucun|aucune|preuve|preuves|registre|procédure|établir|définir|compléter|mettre|maintenu|revue|traçabilité|existant|incomplet|manquant|manquante|organisation|contrôle|sécurité)\b)/i.test(value);
}
function dynamicGapText(value: string | undefined, locale: GapAnalysisLocale, kind: "diagnostic" | "remediation", gapCode?: string) {
  if (!value) return undefined;
  const known = dynamicGapTranslations[value]?.[locale];
  if (known) return known;
  if (locale === "en" && containsFrenchText(value)) {
    const code = gapCode ? ` (${gapCode})` : "";
    return kind === "diagnostic"
      ? `Gap identified${code}. Review the related control evidence and assessment response.`
      : `Recommended remediation${code}. Define the missing control activity, assign ownership, and retain evidence of completion.`;
  }
  return value;
}
function evidenceStatus(row: GapAnalysisResponse): GapAnalysisEvidenceStatus {
  return row.hasCanonicalEvidence ? "provided" : "not_provided";
}
function outcomeStatus(answer: AssessmentAnswerValue): GapAnalysisStatus | null {
  if (answer === "partially_implemented") return "partial_gap";
  if (answer === "not_implemented") return "full_gap";
  if (answer === "not_sure") return "clarification_required";
  if (answer === "not_applicable") return "applicability_review_required";
  return null;
}
function crossTheme(assessment: Record<string, unknown>) {
  return Object.assign({}, ...["people", "screening", "employment_terms", "awareness_training", "disciplinary_process", "post_employment", "confidentiality_agreements", "remote_working", "event_reporting", "physical", "technological", "technology"].map((key) => object(assessment[key])));
}
function asResponseInput(row: GapAnalysisResponse) {
  return { questionId: row.questionId, answer: row.answer, justification: row.justification ?? undefined, hasEvidence: Boolean(row.hasCanonicalEvidence), evidenceStatus: evidenceStatus(row) };
}
function actionList(value: unknown): GenericAction[] {
  const root = object(value);
  const direct = root.activeActions ?? root.gapActions;
  if (Array.isArray(direct)) return direct.map(object);
  if (Array.isArray(value)) return value.flatMap((plan) => actionList(plan));
  return [];
}
function findAction(value: unknown, questionId: string): GenericAction | undefined {
  return actionList(value).find((action) => action.sourceQuestionId === questionId || action.questionId === questionId);
}
function details(action: GenericAction | undefined, status: GapAnalysisStatus, locale: GapAnalysisLocale) {
  if (!action) return {};
  const full = status === "full_gap";
  const diagnostic = text(full ? action.fullGapDescription ?? action.fullDescription ?? action.fullGap : action.partialGapDescription ?? action.partialDescription ?? action.partialGap, locale)
    || text(action.description ?? action.gap, locale);
  const remediation = text(action.recommendedActions ?? action.remediationSteps ?? action.remediation, locale);
  const gapCode = typeof action.gapCode === "string" ? action.gapCode : text(full ? action.fullGapCode : action.partialGapCode, locale)
    || text(object(action.gapCodes)[full ? "full" : "partial"], locale);
  return { gapCode: gapCode || undefined, diagnostic: diagnostic || undefined, remediation: remediation || undefined };
}

function peopleContext(onboarding: Record<string, unknown>) {
  const assessment = object(onboarding.assessment_context);
  const screening = object(assessment.screening ?? assessment);
  const employment = object(assessment.employment_terms);
  const awareness = object(assessment.awareness_training);
  const post = object(assessment.post_employment);
  const remote = object(assessment.remote_working);
  const external = decision(screening.has_external_personnel ?? screening.hasExternalPersonnel);
  const sensitive = decision(screening.has_sensitive_role_changes ?? screening.hasSensitiveRoleChanges);
  const relevantExternal = decision(awareness.has_relevant_external_parties ?? awareness.hasRelevantExternalParties) ?? (external === "yes" || external === "no" ? external : undefined);
  return {
    screening: { hasExternalPersonnel: external, hasSensitiveRoleChanges: sensitive },
    employment: { hasExternalPersonnel: external, hasSignificantChanges: decision(employment.has_significant_changes ?? employment.hasSignificantChanges) ?? (sensitive === "yes" ? "yes" : undefined) },
    awareness: { hasRolesRequiringSpecializedTraining: decision(awareness.has_roles_requiring_specialized_training ?? awareness.hasRolesRequiringSpecializedTraining), hasRelevantExternalParties: relevantExternal },
    external: { hasRelevantExternalParties: relevantExternal },
    post: { hasEmploymentRoleChanges: decision(post.has_employment_role_changes ?? post.hasEmploymentRoleChanges) ?? (sensitive === "yes" ? "yes" : undefined), hasRelevantExternalParties: relevantExternal },
    remote: { hasRemoteWorking: decision(remote.has_remote_working ?? remote.hasRemoteWorking) ?? (onboarding.work_model === "remote" || onboarding.work_model === "hybrid" ? "yes" : undefined), hasBYODDevices: decision(remote.has_byod_devices ?? remote.hasBYODDevices), hasHigherRiskLocations: decision(remote.has_higher_risk_locations ?? remote.hasHigherRiskLocations) },
  };
}

function peopleCatalog(controlId: string, locale: GapAnalysisLocale): GenericQuestion[] {
  const getters: Record<string, (selectedLocale: GapAnalysisLocale) => GenericQuestion[]> = {
    "a6-1": getAllScreeningQuestions, "a6-2": getAllEmploymentTermsQuestions, "a6-3": getAllAwarenessTrainingQuestions, "a6-4": getAllDisciplinaryProcessQuestions,
    "a6-5": getAllPostEmploymentResponsibilitiesQuestions, "a6-6": getAllConfidentialityAgreementsQuestions, "a6-7": getAllRemoteWorkingQuestions, "a6-8": getAllEventReportingQuestions,
  };
  const get = getters[controlId];
  return get ? get(locale) as GenericQuestion[] : [];
}

function peopleResolution(controlId: string, c: ReturnType<typeof peopleContext>) {
  if (controlId === "a6-1") return resolveScreeningQuestions(c.screening);
  if (controlId === "a6-2") return resolveEmploymentTermsQuestions(c.employment);
  if (controlId === "a6-3") return resolveAwarenessTrainingQuestions(c.awareness);
  if (controlId === "a6-4") return resolveDisciplinaryProcessQuestions(c.external);
  if (controlId === "a6-5") return resolvePostEmploymentResponsibilitiesQuestions(c.post);
  if (controlId === "a6-6") return resolveConfidentialityAgreementsQuestions(c.external);
  if (controlId === "a6-7") return resolveRemoteWorkingQuestions(c.remote);
  return resolveEventReportingQuestions(c.external);
}

function call(fn: unknown, ...args: unknown[]) { return (fn as (...values: never[]) => unknown)(...args as never[]); }
function peoplePlan(controlId: string, rows: GapAnalysisResponse[], c: ReturnType<typeof peopleContext>) {
  const input = rows.map(asResponseInput);
  if (controlId === "a6-1") return call(deriveScreeningRemediationPlan, input);
  if (controlId === "a6-2") return call(deriveEmploymentTermsRemediationPlan, input, c.employment);
  if (controlId === "a6-3") return call(deriveAwarenessTrainingRemediationPlan, input, c.awareness);
  if (controlId === "a6-4") return call(deriveDisciplinaryProcessRemediationPlan, input, c.external);
  if (controlId === "a6-5") return call(derivePostEmploymentResponsibilitiesRemediationPlan, input, c.post);
  if (controlId === "a6-6") return call(deriveConfidentialityAgreementsRemediationPlan, input, c.external);
  if (controlId === "a6-7") return call(deriveRemoteWorkingRemediationPlan, input, c.remote);
  return call(deriveEventReportingRemediationPlan, input, c.external);
}

function physicalContext(onboarding: Record<string, unknown>): Context {
  const assessment = object(onboarding.assessment_context);
  const physical = object(assessment.physical);
  const shared = object(assessment.shared_context);
  const result: Context = {};
  for (const source of [onboarding, shared, physical]) for (const [key, value] of Object.entries(source)) { const parsed = decision(value); if (parsed !== undefined) result[key] = parsed; }
  return result;
}
function physicalCatalog(id: string, locale: GapAnalysisLocale): GenericQuestion[] {
  const list = id === "a7-1" ? physicalSecurityPerimeterQuestions : id === "a7-2" ? physicalEntryQuestions : id === "a7-3" ? securingOfficesFacilitiesQuestions : id === "a7-4" ? getAllPhysicalSecurityMonitoringQuestions(locale) : id === "a7-5" ? getAllPhysicalEnvironmentalThreatQuestions(locale) : id === "a7-6" ? workingInSecureAreasQuestions : id === "a7-7" ? clearDeskClearScreenQuestions : id === "a7-8" ? equipmentSitingProtectionQuestions : id === "a7-9" || id === "a7-10" ? getContextualPhysicalQuestions(id) : id === "a7-11" ? supportingUtilitiesQuestions : id === "a7-12" ? cablingSecurityQuestions : id === "a7-13" ? equipmentMaintenanceQuestions : secureDisposalReuseQuestions;
  return list as GenericQuestion[];
}

/** Read-only catalog projection used by Evidence Room cascading selectors. */
export function getCanonicalAssessmentCatalog(locale: GapAnalysisLocale = "en"): Record<GapAnalysisTheme, CanonicalAssessmentCatalogControl[]> {
  const questions = (list: readonly GenericQuestion[]) => list.map((question) => ({ id: question.id, wording: text(question.question, locale) }));
  return {
    organizational: organizationalControls.map((control) => ({
      id: control.id,
      code: control.code,
      title: text(control.name, locale),
      questions: questions(control.questions),
    })),
    people: peopleControls.map(([id, code, en, fr]) => ({ id, code, title: locale === "fr" ? fr : en, questions: questions(peopleCatalog(id, locale)) })),
    physical: physicalControls.map(([id, code, en, fr]) => ({ id, code, title: locale === "fr" ? fr : en, questions: questions(physicalCatalog(id, locale)) })),
    technological: technologicalControls.map((control) => ({
      id: control.id,
      code: control.code,
      title: text(control.name, locale),
      questions: questions(control.questions),
    })),
  };
}

export function isCanonicalAssessmentQuestion(
  theme: GapAnalysisTheme,
  controlId: string,
  questionId: string,
): boolean {
  if (theme === "organizational") {
    return organizationalControls.find((control) => control.id === controlId)
      ?.questions.some((question) => question.id === questionId) ?? false;
  }
  if (theme === "technological") {
    return technologicalControls.find((control) => control.id === controlId)
      ?.questions.some((question) => question.id === questionId) ?? false;
  }
  if (theme === "people") {
    return peopleCatalog(controlId, "en").some((question) => question.id === questionId);
  }
  return physicalCatalog(controlId, "en").some((question) => question.id === questionId);
}
function physicalResolution(id: string, c: Context) {
  if (id === "a7-1") return resolvePhysicalSecurityPerimeterQuestions(c);
  if (id === "a7-2") return resolvePhysicalEntryQuestions(c);
  if (id === "a7-3") return resolveSecureOfficesFacilitiesQuestions(c);
  if (id === "a7-4") return resolvePhysicalSecurityMonitoringQuestions(c);
  if (id === "a7-5") return resolvePhysicalEnvironmentalThreatQuestions(c);
  if (id === "a7-6") return resolveWorkingInSecureAreasQuestions(c);
  if (id === "a7-7") return resolveClearDeskScreenQuestions();
  if (id === "a7-8") return resolveEquipmentSitingProtectionQuestions();
  if (id === "a7-9" || id === "a7-10") return resolveContextualPhysicalQuestions(id, c);
  if (id === "a7-11") return resolveSupportingUtilitiesQuestions();
  if (id === "a7-12") return resolveCablingSecurityQuestions();
  if (id === "a7-13") return resolveEquipmentMaintenanceQuestions();
  return resolveSecureDisposalReuseQuestions();
}
function physicalPlan(id: string, rows: GapAnalysisResponse[], c: Context) {
  const input = rows.map(asResponseInput);
  if (id === "a7-1") return call(derivePhysicalSecurityPerimetersRemediationPlan, input, c);
  if (id === "a7-2") return call(derivePhysicalEntryRemediationPlan, input, c);
  if (id === "a7-3") return call(deriveSecureOfficesFacilitiesRemediationPlan, input, c);
  if (id === "a7-4") return call(derivePhysicalSecurityMonitoringRemediationPlan, input, c);
  if (id === "a7-5") return call(derivePhysicalEnvironmentalThreatRemediationPlan, input, c);
  if (id === "a7-6") return call(deriveWorkingInSecureAreasRemediationPlan, input, c);
  if (id === "a7-7") return call(deriveClearDeskScreenRemediationPlan, input);
  if (id === "a7-8") return call(deriveEquipmentSitingProtectionRemediationPlan, input);
  if (id === "a7-9") return call(deriveSecurityOfAssetsOffPremisesRemediationPlan, input, c);
  if (id === "a7-10") return call(deriveStorageMediaRemediationPlan, input, c);
  if (id === "a7-11") return call(deriveSupportingUtilitiesRemediationPlan, input);
  if (id === "a7-12") { const outcome = call(deriveCablingSecurityOutcome, input, physicalResolution(id, c)); return call(deriveCablingSecurityRemediationPlan, outcome); }
  if (id === "a7-13") { const outcome = call(deriveEquipmentMaintenanceOutcome, input, physicalResolution(id, c)); return call(deriveEquipmentMaintenanceRemediationPlan, outcome); }
  const outcome = call(deriveSecureDisposalReuseOutcome, input, physicalResolution(id, c)); return call(deriveSecureDisposalReuseRemediationPlan, outcome);
}

function item(row: GapAnalysisResponse, theme: GapAnalysisTheme, controlId: string, controlCode: string, controlTitle: string, question: GenericQuestion, locale: GapAnalysisLocale, extra: Partial<GapAnalysisItem> = {}): GapAnalysisItem | null {
  const status = outcomeStatus(row.answer);
  if (!status) return null;
  const derived = deriveAssessmentOutcome(asResponseInput(row));
  if (!derived.isValid) return null;
  const gapCode = extra.gapCode;
  return {
    id: `${theme}:${controlId}:${row.questionId}`,
    theme,
    controlId,
    controlCode,
    controlTitle,
    questionId: row.questionId,
    question: text(question.question, locale),
    answer: row.answer,
    status,
    evidenceStatus: evidenceStatus(row),
    href: `/assessment/${theme}/${controlId}#${row.questionId}`,
    ...extra,
    diagnostic: dynamicGapText(extra.diagnostic, locale, "diagnostic", gapCode),
    remediation: dynamicGapText(extra.remediation, locale, "remediation", gapCode),
  };
}

export function deriveGapAnalysis(responses: GapAnalysisResponse[], onboarding: Record<string, unknown> = {}, locale: GapAnalysisLocale = "en"): GapAnalysisItem[] {
  const assessment = object(onboarding.assessment_context);
  const items: GapAnalysisItem[] = [];
  const latest = new Map<string, GapAnalysisResponse>();
  for (const row of responses) latest.set(`${row.controlId}:${row.questionId}`, row);

  const orgPersisted = object(assessment.organizational);
  const orgContext = resolveOrganizationalAssessmentContext(orgPersisted, onboarding, object(assessment.shared_context), crossTheme(assessment)).context;
  const orgJustifications = object(orgPersisted.control_applicability_justifications);
  for (const control of organizationalControls) {
    const rows = [...latest.values()].filter((row) => row.controlId === control.id);
    const outcome = deriveOrganizationalOutcome(control.id, rows.map(asResponseInput) as never, orgContext, typeof orgJustifications[control.id] === "string" ? orgJustifications[control.id] as string : undefined);
    const controlJustification = typeof orgJustifications[control.id] === "string" ? orgJustifications[control.id] as string : "";
    if (outcome.resolution.controlApplicability === "not_applicable"
      && outcome.reviewState === "applicability_review_required"
      && control.applicabilityKey
      && controlJustification.trim()) {
      const contextQuestion = control.quickContext.find((entry) => entry.key === control.applicabilityKey);
      if (contextQuestion) items.push({ id: `organizational:${control.id}:control.applicability`, theme: "organizational", controlId: control.id, controlCode: control.code, controlTitle: control.name, questionId: "control.applicability", question: text(contextQuestion.question, locale), answer: "not_applicable", status: "applicability_review_required", evidenceStatus: "not_provided", href: `/assessment/organizational/${control.id}` });
    }
    const visible = new Set(outcome.resolution.questionIds as string[]);
    for (const row of rows) {
      if (!visible.has(row.questionId)) continue;
      const question = control.questions.find((entry) => entry.id === row.questionId);
      if (!question) continue;
      const action = outcome.gapActions.find((entry) => entry.sourceQuestionId === row.questionId);
      const value = item(row, "organizational", control.id, control.code, control.name, question, locale, action ? { gapCode: action.gapCode, diagnostic: action.gap, remediation: action.remediation } : {});
      if (value) items.push(value);
    }
  }

  const techPersisted = object(assessment.technological ?? assessment.technology);
  const techJustifications = object(techPersisted.control_applicability_justifications);
  const techContext = resolveTechnologicalAssessmentContext(techPersisted, onboarding, object(assessment.shared_context), crossTheme(assessment));
  for (const control of technologicalControls) {
    const rows = [...latest.values()].filter((row) => row.controlId === control.id);
    const outcome = deriveTechnologicalOutcome(control.id, rows.map(asResponseInput) as never, techContext);
    const controlJustification = typeof techJustifications[control.id] === "string" ? techJustifications[control.id] as string : "";
    if (outcome.resolution.controlApplicability === "not_applicable"
      && outcome.reviewState === "applicability_review_required"
      && control.applicabilityKey
      && controlJustification.trim()) {
      const contextQuestion = control.quickContext.find((entry) => entry.key === control.applicabilityKey);
      if (contextQuestion) items.push({ id: `technological:${control.id}:control.applicability`, theme: "technological", controlId: control.id, controlCode: control.code, controlTitle: control.name, questionId: "control.applicability", question: text(contextQuestion.question, locale), answer: "not_applicable", status: "applicability_review_required", evidenceStatus: "not_provided", href: `/assessment/technological/${control.id}` });
    }
    const visible = new Set(outcome.resolution.questionIds as string[]);
    for (const row of rows) {
      if (!visible.has(row.questionId)) continue;
      const question = control.questions.find((entry) => entry.id === row.questionId);
      if (!question) continue;
      const action = outcome.gapActions.find((entry) => entry.sourceQuestionId === row.questionId);
      const value = item(row, "technological", control.id, control.code, control.name, question, locale, action ? { gapCode: action.gapCode, diagnostic: action.gap, remediation: action.remediation } : {});
      if (value) items.push(value);
    }
  }

  const pc = peopleContext(onboarding);
  for (const control of peopleControls) {
    const [id, code, en, fr] = control;
    const rows = [...latest.values()].filter((row) => row.controlId === id);
    const visible = new Set(peopleResolution(id, pc).questionIds as string[]);
    const plan = peoplePlan(id, rows, pc);
    for (const row of rows) {
      if (!visible.has(row.questionId)) continue;
      const question = peopleCatalog(id, locale).find((entry) => entry.id === row.questionId);
      if (!question) continue;
      const status = outcomeStatus(row.answer);
      const value = item(row, "people", id, code, locale === "fr" ? fr : en, question, locale, status ? details(findAction(plan, row.questionId), status, locale) : {});
      if (value) items.push(value);
    }
  }

  const phc = physicalContext(onboarding);
  for (const control of physicalControls) {
    const [id, code, en, fr] = control;
    const rows = [...latest.values()].filter((row) => row.controlId === id);
    const visible = new Set(physicalResolution(id, phc).questionIds as string[]);
    const plan = physicalPlan(id, rows, phc);
    for (const row of rows) {
      if (!visible.has(row.questionId)) continue;
      const question = physicalCatalog(id, locale).find((entry) => entry.id === row.questionId);
      if (!question) continue;
      const status = outcomeStatus(row.answer);
      const value = item(row, "physical", id, code, locale === "fr" ? fr : en, question, locale, status ? details(findAction(plan, row.questionId), status, locale) : {});
      if (value) items.push(value);
    }
  }
  return items.sort((a, b) => a.controlCode.localeCompare(b.controlCode, undefined, { numeric: true }) || a.questionId.localeCompare(b.questionId));
}

export function gapAnalysisMetrics(items: GapAnalysisItem[]) {
  const full = items.filter((item) => item.status === "full_gap").length;
  const partial = items.filter((item) => item.status === "partial_gap").length;
  return {
    total: full + partial,
    full,
    partial,
    clarification: items.filter((item) => item.status === "clarification_required").length,
    applicability: items.filter((item) => item.status === "applicability_review_required").length,
    byTheme: Object.fromEntries((["organizational", "people", "physical", "technological"] as const).map((theme) => [theme, items.filter((item) => item.theme === theme && (item.status === "full_gap" || item.status === "partial_gap")).length])) as Record<GapAnalysisTheme, number>,
  };
}

export function activeGapCount(
  responses: GapAnalysisResponse[],
  onboarding: Record<string, unknown> = {},
): number {
  return gapAnalysisMetrics(deriveGapAnalysis(responses, onboarding)).total;
}
