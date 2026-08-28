import {
  organizationalControls,
  type OrganizationalContextKey,
  type OrganizationalControl,
  type OrganizationalQuestion,
} from "../../content/assessment/organizational/organizational-controls.ts";
import { deriveAssessmentOutcome, type ScreeningAnswerValue } from "./outcomes.ts";

export type OrganizationalContextDecision = "yes" | "no" | "not_sure";
export type OrganizationalContext = Partial<Record<OrganizationalContextKey, OrganizationalContextDecision>>;
export type OrganizationalContextSource =
  | "organizational_persisted"
  | "onboarding"
  | "cross_theme_context"
  | "shared_context"
  | "quick_context";

export type OrganizationalControlId = (typeof organizationalControls)[number]["id"];
export type OrganizationalQuestionId = (typeof organizationalControls)[number]["questions"][number]["id"];
export type OrganizationalResponse = {
  questionId: OrganizationalQuestionId;
  answer: ScreeningAnswerValue;
  justification?: string | null;
  hasEvidence?: boolean;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

const organizationalContextKeys = new Set<OrganizationalContextKey>(
  organizationalControls.flatMap((control) => [
    ...control.quickContext.map((item) => item.key),
    ...control.questions.flatMap((item) => item.conditionKey ? [item.conditionKey] : []),
  ]),
);

const semanticAliases: Record<OrganizationalContextKey, readonly string[]> = {
  allowsBYODForBusiness: ["hasBYODDevices", "allowsBYOD", "has_byod_devices", "allows_byod"],
  usesCloudOrExternallyManagedAssets: [
    "usesCloudInfrastructure",
    "usesCloudArchitecture",
    "usesCloudServices",
    "hasCloudServices",
    "usesExternallyManagedAssets",
    "usesThirdPartyManagedAssets",
    "hasExternallyHostedAssets",
  ],
  hasMandatoryAuthorityNotificationObligations: [
    "hasMandatoryAuthorityNotificationObligations",
    "hasMandatorySecurityNotificationObligations",
    "hasRegulatoryNotificationDeadlines",
  ],
  usesExternalThreatIntelligenceProvider: [
    "usesExternalThreatIntelligenceProvider",
    "usesExternalThreatIntelligence",
    "usesMSSPForThreatIntelligence",
    "usesExternalSOCForThreatIntelligence",
  ],
  managesProjectsInIsmsScope: [
    "managesProjectsInIsmsScope",
    "managesBusinessProjectsInIsmsScope",
    "managesNonSoftwareProjectsInIsmsScope",
    "hasProjectsInIsmsScope",
  ],
  cannotFullySegregateDuties: ["cannotFullySegregateDuties"],
  sharesSecurityInformationWithExternalGroups: ["sharesSecurityInformationWithExternalGroups"],
  hasRemoteOrOffsiteAssetReturns: ["hasRemoteOrOffsiteAssetReturns"],
  allowsBYOD: ["allowsBYODForBusiness", "hasBYODDevices", "has_byod_devices", "allows_byod"],
  assignsAssetsToExternalParties: ["assignsAssetsToExternalParties"],
  receivesExternallyClassifiedInformation: ["receivesExternallyClassifiedInformation"],
  usesDigitalDocumentOrCollaborationPlatforms: ["usesDigitalDocumentOrCollaborationPlatforms"],
  handlesClassifiedPhysicalInformation: ["handlesClassifiedPhysicalInformation"],
  transfersInformationToExternalParties: ["transfersInformationToExternalParties"],
  usesPhysicalTransferForSensitiveInformation: ["usesPhysicalTransferForSensitiveInformation"],
  usesVerbalTransferOfSensitiveInformation: ["usesVerbalTransferOfSensitiveInformation"],
  grantsThirdPartyAccess: [
    "suppliersAccessOrgInformationOrSystems",
    "hasRelevantExternalParties",
    "has_relevant_external_parties",
    "hasExternalPersonnel",
    "has_external_personnel",
  ],
  usesNonHumanIdentities: ["usesNonHumanIdentities"],
  usesSharedOrGenericAccounts: ["usesSharedOrGenericAccounts"],
  usesVendorSuppliedInitialCredentials: ["usesVendorSuppliedInitialCredentials"],
  usesMachineSecretsOrApiKeys: ["usesMachineSecretsOrApiKeys"],
  hasPrivilegedAccessRights: ["hasPrivilegedAccessRights", "usesPrivilegedAccessRights"],
  usesInScopeSuppliersOrExternalServices: ["usesInScopeSuppliersOrExternalServices"],
  suppliersAccessOrgInformationOrSystems: ["grantsThirdPartyAccess"],
  dependsOnCriticalSuppliers: ["dependsOnCriticalSuppliers"],
  suppliersProcessSensitiveOrPersonalData: ["suppliersProcessSensitiveOrPersonalData"],
  usesIctSuppliersInScope: [
    "usesInScopeSuppliersOrExternalServices",
    "usesExternalNetworkServiceProviders",
    "usesThirdPartyManagedPremises",
    "usesExternalCriticalPentest",
    "usesExternalTestingProvider",
    "usesExternallyHostedCriticalSystems",
    "usesThirdPartyManagedAssets",
    "usesExternallyManagedAssets",
    "usesExternalDevelopmentProvider",
  ],
  hasCriticalIctSuppliers: [
    "dependsOnCriticalSuppliers",
    "usesExternallyHostedCriticalSystems",
    "usesCloudHostedCriticalDataOrSystems",
    "usesExternalCriticalPentest",
  ],
  hasSupplierSubprocessorsOrFourthParties: [
    "hasSupplierSubprocessorsOrFourthParties",
    "hasSubprocessors",
    "hasFourthParties",
    "supplierSubprocessorsAllowed",
    "subcontractorClausesApply",
  ],
  hasExperiencedSupplierSecurityIncident: [
    "hasExperiencedSupplierSecurityIncident",
    "hasSupplierSecurityIncidents",
    "hasSupplierIncident",
    "supplierIncidentOccurred",
  ],
  usesCloudServicesInScope: [
    "usesCloudOrExternallyManagedAssets",
    "usesCloudInfrastructure",
    "usesCloudArchitecture",
    "usesCloudServices",
    "hasCloudServices",
    "usesSaaS",
    "usesPaaS",
    "usesIaaS",
    "usesCloudHostedCriticalDataOrSystems",
  ],
  hasCriticalCloudServices: [
    "hasCriticalCloudServices",
    "usesCloudHostedCriticalDataOrSystems",
    "hasCriticalSaaS",
    "hasCriticalCloudWorkloads",
  ],
  cloudProcessesSensitiveOrRegulatedData: [
    "cloudProcessesSensitiveOrRegulatedData",
    "cloudProcessesSensitiveData",
    "cloudProcessesPersonalData",
    "usesCloudForSensitiveData",
    "suppliersProcessSensitiveOrPersonalData",
  ],
  allowsDecentralizedSaaSAcquisition: [
    "allowsDecentralizedSaaSAcquisition",
    "allowsShadowIt",
    "decentralizedSaaSProcurement",
  ],
  usesExternalIncidentResponseProvider: [
    "usesExternalIncidentResponseProvider",
    "usesExternalForensicsProvider",
    "usesExternalCrisisSupportProvider",
    "usesExternalSecurityIncidentProvider",
  ],
  hasExperiencedSecurityIncidents: [
    "hasExperiencedSecurityIncidents",
    "hasRecentSecurityIncidents",
    "hasSecurityIncidentHistory",
    "reportedSecurityIncidents",
    "hasReportedSecurityEvents",
  ],
  usesAutomatedSecurityMonitoring: [
    "usesAutomatedSecurityMonitoring",
    "usesSIEM",
    "usesSecurityMonitoring",
    "usesAutomatedEventMonitoring",
  ],
  usesEmergencyOrBreakGlassAccess: [
    "usesEmergencyOrBreakGlassAccess",
    "usesBreakGlassPrivilegedAccess",
    "hasBreakGlassAccess",
  ],
  usesAlternateSitesOrManualFallback: [
    "usesAlternateSitesOrManualFallback",
    "usesAlternateSites",
    "usesManualFallback",
    "hasManualWorkarounds",
  ],
  dependsOnIctForCriticalActivities: [
    "dependsOnIctForCriticalActivities",
    "dependsOnCriticalIct",
    "hasCriticalIctDependencies",
    "usesExternallyHostedCriticalSystems",
    "usesCloudHostedCriticalDataOrSystems",
  ],
  hasDefinedRtoRpo: [
    "hasDefinedRtoRpo",
    "hasRtoRpo",
    "hasRecoveryObjectives",
    "hasDefinedRecoveryObjectives",
  ],
  hasBackupsForCriticalSystems: [
    "hasBackupsForCriticalSystems",
    "hasCriticalSystemBackups",
    "hasBackupForCriticalSystems",
    "hasBackups",
  ],
  hasMaterialSecurityContractualObligations: [
    "hasMaterialSecurityContractualObligations",
    "hasSecurityContractualObligations",
    "hasMaterialContractualSecurityObligations",
    "hasInformationSecurityContractualObligations",
    "hasCustomerSecurityContractualObligations",
    "hasSupplierSecurityContractualObligations",
  ],
  hasCrossBorderOrCryptographyLegalExposure: [
    "hasCrossBorderOrCryptographyLegalExposure",
    "hasCrossBorderLegalExposure",
    "hasCrossBorderTransfers",
    "hasRegulatedCryptographyUse",
    "usesRegulatedCryptography",
    "hasCryptographyLegalRestrictions",
  ],
  createsOrCommissionsProtectedIP: [
    "createsOrCommissionsProtectedIP",
    "createsProtectedIP",
    "commissionsProtectedIP",
    "createsProprietaryCode",
    "createsSourceCode",
    "developsSoftware",
    "hasSoftwareDevelopment",
  ],
  usesOpenSourceOrThirdPartyComponents: [
    "usesOpenSourceOrThirdPartyComponents",
    "usesOpenSourceComponents",
    "usesThirdPartyComponents",
    "usesThirdPartySoftwareComponents",
    "usesSoftwareComponents",
    "usesSCA",
  ],
  hasLongTermOrRegulatedRecords: [
    "hasLongTermOrRegulatedRecords",
    "hasLongTermRecords",
    "hasRegulatedRecords",
    "hasRetentionRequirements",
    "hasLegalHoldRequirements",
  ],
  processesPIIInScope: [
    "processesPIIInScope",
    "processesPII",
    "processesPersonalData",
    "handlesPersonalData",
    "processesEmployeePersonalData",
    "processesCustomerPersonalData",
  ],
  requiresFormalPrivacyOfficerOrDPO: [
    "requiresFormalPrivacyOfficerOrDPO",
    "requiresDPO",
    "requiresPrivacyOfficer",
    "requiresDataProtectionOfficer",
  ],
  conductsHighRiskPIIProcessing: [
    "conductsHighRiskPIIProcessing",
    "conductsHighRiskPersonalDataProcessing",
    "requiresDPIA",
    "requiresPIA",
    "hasHighPrivacyRiskProcessing",
  ],
  usesPIIProcessorsOrCrossBorderTransfers: [
    "usesPIIProcessorsOrCrossBorderTransfers",
    "usesPIIProcessors",
    "usesPersonalDataProcessors",
    "usesCrossBorderPIITransfers",
    "usesCrossBorderDataTransfers",
    "hasCrossBorderTransfers",
  ],
  hasSignificantISMSChangeSinceLastIndependentReview: [
    "hasSignificantISMSChangeSinceLastIndependentReview",
    "hasSignificantISMSChange",
    "hasSignificantSecurityChange",
    "significantChangeSinceLastReview",
  ],
  hasTechnicalSystemsRequiringComplianceReview: [
    "hasTechnicalSystemsRequiringComplianceReview",
    "hasTechnicalBaselines",
    "hasSecureConfigurationBaselines",
    "hasConfigurationBaselines",
    "usesTechnicalStandards",
  ],
  hasCriticalInfrequentOrHighRiskOperations: [
    "hasCriticalInfrequentOrHighRiskOperations",
    "hasCriticalOperations",
    "hasHighRiskOperations",
    "hasInfrequentCriticalOperations",
    "hasCriticalRunbooks",
  ],
  hasRedundancyForCriticalServices: [
    "hasRedundancyForCriticalServices",
    "hasCriticalServiceRedundancy",
    "hasRedundancy",
    "hasFailoverForCriticalServices",
  ],
};

const positiveSemanticAliases: Partial<Record<OrganizationalContextKey, readonly string[]>> = {
  hasRemoteOrOffsiteAssetReturns: ["usesEndpointsOffPremises"],
  grantsThirdPartyAccess: [
    "thirdPartyPrivilegedAccess",
    "thirdPartySourceCodeAccess",
    "hasExternalPartiesAccessingSensitiveInformation",
    "externalPartiesUsePrivilegedUtilities",
  ],
  usesSharedOrGenericAccounts: ["usesSharedPrivilegedAccounts"],
  hasPrivilegedAccessRights: [
    "usesSharedPrivilegedAccounts",
    "usesBreakGlassPrivilegedAccess",
    "thirdPartyPrivilegedAccess",
  ],
  usesInScopeSuppliersOrExternalServices: [
    "usesThirdPartyManagedPremises",
    "usesExternalNetworkServiceProviders",
    "usesExternallyHostedCriticalSystems",
    "thirdPartiesStoreInScopeInformation",
    "usesExternalTestingProvider",
  ],
  suppliersAccessOrgInformationOrSystems: [
    "thirdPartyPrivilegedAccess",
    "thirdPartySourceCodeAccess",
    "hasExternalPartiesAccessingSensitiveInformation",
    "externalPartiesUsePrivilegedUtilities",
  ],
  dependsOnCriticalSuppliers: [
    "usesExternallyHostedCriticalSystems",
    "usesCloudHostedCriticalDataOrSystems",
    "usesExternalCriticalPentest",
  ],
  usesIctSuppliersInScope: [
    "usesExternallyHostedCriticalSystems",
    "usesCloudHostedCriticalDataOrSystems",
    "usesExternalNetworkServiceProviders",
    "usesExternalTestingProvider",
  ],
  hasCriticalIctSuppliers: [
    "dependsOnCriticalSuppliers",
    "usesExternallyHostedCriticalSystems",
    "usesCloudHostedCriticalDataOrSystems",
  ],
  usesCloudServicesInScope: [
    "usesCloudInfrastructure",
    "usesCloudArchitecture",
    "usesCloudHostedCriticalDataOrSystems",
  ],
  hasCriticalCloudServices: ["usesCloudHostedCriticalDataOrSystems"],
  dependsOnIctForCriticalActivities: [
    "usesExternallyHostedCriticalSystems",
    "usesCloudHostedCriticalDataOrSystems",
  ],
  createsOrCommissionsProtectedIP: ["createsSourceCode", "developsSoftware", "hasSoftwareDevelopment"],
  usesOpenSourceOrThirdPartyComponents: ["usesOpenSourceComponents", "usesThirdPartyComponents", "usesSCA"],
  processesPIIInScope: ["suppliersProcessSensitiveOrPersonalData", "cloudProcessesPersonalData", "processesPersonalData"],
  usesPIIProcessorsOrCrossBorderTransfers: ["suppliersProcessSensitiveOrPersonalData", "cloudProcessesPersonalData", "hasCrossBorderTransfers"],
  hasCriticalInfrequentOrHighRiskOperations: [
    "dependsOnIctForCriticalActivities",
    "hasBackupsForCriticalSystems",
    "hasRedundancyForCriticalServices",
    "usesEmergencyOrBreakGlassAccess",
    "usesAlternateSitesOrManualFallback",
    "usesExternalIncidentResponseProvider",
  ],
  hasBackupsForCriticalSystems: ["backupControlsImplemented", "criticalBackupsConfigured"],
  hasRedundancyForCriticalServices: ["redundancyControlsImplemented", "criticalServicesHaveRedundancy"],
};

const a51ToA510ContextKeys = new Set<OrganizationalContextKey>([
  "cannotFullySegregateDuties",
  "hasMandatoryAuthorityNotificationObligations",
  "sharesSecurityInformationWithExternalGroups",
  "usesExternalThreatIntelligenceProvider",
  "managesProjectsInIsmsScope",
  "usesCloudOrExternallyManagedAssets",
  "allowsBYODForBusiness",
]);

function decision(value: unknown): OrganizationalContextDecision | undefined {
  return value === "yes" || value === "no" || value === "not_sure" ? value : undefined;
}

function firstDecision(
  source: Record<string, unknown>,
  key: OrganizationalContextKey,
  includeAliases: boolean,
): OrganizationalContextDecision | undefined {
  const keys = includeAliases ? [key, ...semanticAliases[key]] : [key];
  for (const candidate of keys) {
    const value = decision(source[candidate]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function semanticDecision(
  source: Record<string, unknown>,
  key: OrganizationalContextKey,
  includeAliases: boolean,
) {
  const exact = firstDecision(source, key, includeAliases);
  if (exact !== undefined) return exact;
  for (const alias of positiveSemanticAliases[key] ?? []) {
    if (decision(source[alias]) === "yes") return "yes" as const;
  }
  return undefined;
}

/**
 * Applies the canonical Organizational priority:
 * persisted Organizational -> onboarding -> semantically equivalent shared/cross-theme context.
 * Missing values are intentionally left unresolved so the caller can expose Quick Context.
 */
export function resolveOrganizationalAssessmentContext(
  persistedOrganizational: Record<string, unknown> = {},
  onboarding: Record<string, unknown> = {},
  sharedContext: Record<string, unknown> = {},
  crossThemeContext: Record<string, unknown> = {},
) {
  const context: OrganizationalContext = {};
  const sources: Partial<Record<OrganizationalContextKey, OrganizationalContextSource>> = {};

  for (const key of organizationalContextKeys) {
    const persisted = semanticDecision(persistedOrganizational, key, true);
    if (persisted !== undefined) {
      context[key] = persisted;
      sources[key] = "organizational_persisted";
      continue;
    }

    const onboarded = semanticDecision(onboarding, key, true);
    if (onboarded !== undefined) {
      context[key] = onboarded;
      sources[key] = "onboarding";
      continue;
    }

    const crossThemeFirst = !a51ToA510ContextKeys.has(key);
    const crossTheme = semanticDecision(crossThemeContext, key, true);
    const shared = semanticDecision(sharedContext, key, true);
    const reused = crossThemeFirst ? crossTheme ?? shared : shared ?? crossTheme;
    if (reused !== undefined) {
      context[key] = reused;
      sources[key] = crossThemeFirst && crossTheme !== undefined
        ? "cross_theme_context"
        : "shared_context";
    }
  }

  return { context, sources };
}

export function getOrganizationalControl(controlId: OrganizationalControlId): OrganizationalControl {
  const control = organizationalControls.find((item) => item.id === controlId);
  if (!control) throw new Error(`Unknown organizational control: ${controlId}`);
  return control;
}

export function resolveOrganizationalControl(
  controlId: OrganizationalControlId,
  context: OrganizationalContext = {},
  controlApplicabilityJustification?: string | null,
) {
  const control = getOrganizationalControl(controlId);
  const applicability = control.applicabilityKey ? context[control.applicabilityKey] : undefined;
  const controlNotApplicable = control.applicabilityKey !== null && applicability === "no";
  const unresolvedConditions = new Set<OrganizationalContextKey>();
  const questionIds: OrganizationalQuestionId[] = [];
  const hiddenQuestionIds: OrganizationalQuestionId[] = [];

  for (const item of control.quickContext) {
    if (item.conditionKey && context[item.conditionKey] !== "yes") continue;
    const value = context[item.key];
    if (value === undefined || value === "not_sure") unresolvedConditions.add(item.key);
  }

  for (const item of control.questions) {
    const questionId = item.id as OrganizationalQuestionId;
    if (controlNotApplicable) {
      hiddenQuestionIds.push(questionId);
      continue;
    }
    if (!item.conditionKey) {
      questionIds.push(questionId);
      continue;
    }
    if (context[item.conditionKey] === "yes") questionIds.push(questionId);
    else hiddenQuestionIds.push(questionId);
  }

  const requiredQuickContextQuestions = control.quickContext.filter((item) =>
    unresolvedConditions.has(item.key)
    && (!item.conditionKey || context[item.conditionKey] === "yes"),
  );
  const hasControlJustification = Boolean(controlApplicabilityJustification?.trim());

  return {
    controlApplicability: controlNotApplicable ? "not_applicable" as const : "applicable" as const,
    controlReviewState: controlNotApplicable ? "applicability_review_required" as const : "none" as const,
    requiresControlJustification: controlNotApplicable,
    questionIds,
    hiddenQuestionIds,
    resolvedContext: context,
    unresolvedConditions: [...unresolvedConditions],
    requiredQuickContextQuestions,
    // Unresolved Quick Context never blocks the three principal questions. A.5.8 exclusion
    // remains blocked until its control-level SoA justification is supplied.
    assessmentBlocked: controlNotApplicable && !hasControlJustification,
  };
}

export type OrganizationalGapAction = {
  actionCode: string;
  sourceQuestionId: OrganizationalQuestionId;
  gapCode: string;
  gapType: "partial" | "full";
  gap: string;
  remediation: string;
};

function strongerReviewState(current: string, next: string) {
  if (current === "applicability_review_required" || next === "applicability_review_required") {
    return "applicability_review_required" as const;
  }
  if (current === "clarification_required" || next === "clarification_required") {
    return "clarification_required" as const;
  }
  return "none" as const;
}

export function deriveOrganizationalOutcome(
  controlId: OrganizationalControlId,
  responses: readonly OrganizationalResponse[],
  context: OrganizationalContext = {},
  controlApplicabilityJustification?: string | null,
) {
  const control = getOrganizationalControl(controlId);
  const resolution = resolveOrganizationalControl(controlId, context, controlApplicabilityJustification);
  const visible = new Set<string>(resolution.questionIds);
  const byId = new Map<string, OrganizationalQuestion>(control.questions.map((item) => [item.id, item]));
  const latest = new Map<string, OrganizationalResponse>();
  const ignoredHiddenResponseIds = new Set<OrganizationalQuestionId>();

  for (const response of responses) {
    if (!byId.has(response.questionId)) continue;
    if (!visible.has(response.questionId)) {
      ignoredHiddenResponseIds.add(response.questionId);
      continue;
    }
    latest.set(response.questionId, response);
  }

  const gapActions: OrganizationalGapAction[] = [];
  const clarifications: OrganizationalQuestionId[] = [];
  const applicabilityReviews: OrganizationalQuestionId[] = [];
  const invalidResponses: Array<{ questionId: OrganizationalQuestionId; errorCode: string }> = [];
  let reviewState: "none" | "clarification_required" | "applicability_review_required" =
    resolution.controlReviewState;

  for (const response of latest.values()) {
    const result = deriveAssessmentOutcome(response);
    if (!result.isValid) {
      invalidResponses.push({ questionId: response.questionId, errorCode: result.errorCode });
      reviewState = strongerReviewState(reviewState, "applicability_review_required");
      continue;
    }
    reviewState = strongerReviewState(reviewState, result.reviewState);
    if (result.reviewState === "clarification_required") clarifications.push(response.questionId);
    if (result.reviewState === "applicability_review_required") applicabilityReviews.push(response.questionId);
    if (result.createsGapAction === "none") continue;

    const item = byId.get(response.questionId)!;
    const mapping = result.createsGapAction === "partial" ? item.partial : item.absent;
    gapActions.push({
      actionCode: `${control.code.replaceAll(".", "_")}_${response.questionId}`,
      sourceQuestionId: response.questionId,
      gapCode: mapping.gapCode,
      gapType: result.createsGapAction,
      gap: mapping.gap,
      remediation: mapping.remediation,
    });
  }

  return {
    resolution,
    reviewState,
    gapActions,
    clarifications,
    applicabilityReviews,
    invalidResponses,
    ignoredHiddenResponseIds: [...ignoredHiddenResponseIds],
    evaluatedResponseCount: latest.size,
  };
}

export function deriveOrganizationalRemediationPlan(
  controlId: OrganizationalControlId,
  outcome: ReturnType<typeof deriveOrganizationalOutcome>,
) {
  if (!outcome.gapActions.length) return [];
  return [{
    planCode: `${getOrganizationalControl(controlId).code.replaceAll(".", "_")}_PLAN`,
    actions: outcome.gapActions,
  }];
}
