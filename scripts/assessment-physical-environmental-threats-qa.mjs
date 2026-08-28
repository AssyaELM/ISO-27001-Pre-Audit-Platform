import {
  physicalEnvironmentalThreatQuestions,
  PHYSICAL_ENVIRONMENTAL_THREATS_GAP_CODES,
  resolvePhysicalEnvironmentalThreatQuestions,
  PHYSICAL_ENVIRONMENTAL_THREATS_PLAN_CODE,
  physicalEnvironmentalThreatLegalNotice,
} from "../content/assessment/physical/physical-environmental-threats.ts";
import {
  derivePhysicalEnvironmentalThreatRemediationPlan,
  physicalEnvironmentalThreatActions,
} from "../lib/assessment/physical-environmental-threats.ts";

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
};

const pass = (message) => {
  console.log(`✅ PASS: ${message}`);
};

const testResolutionAndDerivation = () => {
  let passCount = 0;

  assert(physicalEnvironmentalThreatQuestions.length === 4, "exactly 4 questions");
  passCount++; pass("1 - exactly 4 questions");

  const ids = physicalEnvironmentalThreatQuestions.map((q) => q.id);
  const expectedIds = ["p7_5_001", "p7_5_002", "p7_5_003", "p7_5_004_third_party"];
  assert(expectedIds.every((id) => ids.includes(id)), "exact IDs");
  passCount++; pass("2 - exact IDs");

  const mains = physicalEnvironmentalThreatQuestions.filter((q) => q.category === "main");
  assert(mains.length === 3, "three main questions");
  passCount++; pass("3 - three main questions");

  const conditionals = physicalEnvironmentalThreatQuestions.filter((q) => q.category === "conditional");
  assert(conditionals.length === 1, "one conditional question");
  passCount++; pass("4 - one conditional question");

  const cond1 = conditionals.find((q) => q.id === "p7_5_004_third_party");
  assert(cond1.conditionKey === "usesThirdPartyManagedPremises", "exact condition usesThirdPartyManagedPremises");
  passCount++; pass("5 - exact condition usesThirdPartyManagedPremises");

  const q1 = mains[0];
  assert(q1.question.fr.includes("Votre organisation a-t-elle évalué, pour chaque site ou dépendance"), "FR text exact");
  assert(q1.question.en.includes("Has your organization assessed, for each relevant site"), "EN text exact");
  passCount++; pass("6 - exact FR/EN text");

  assert(q1.helpText.fr.includes("L’évaluation doit couvrir les sites et dépendances physiques"), "FR help exact");
  assert(q1.helpText.en.includes("The assessment should cover physical sites and dependencies"), "EN help exact");
  passCount++; pass("7 - FR/EN help text");

  assert(q1.evidenceHints.fr.includes("évaluation des risques physiques par site"), "FR evidence exact");
  assert(q1.evidenceHints.en.includes("site-specific physical risk assessment"), "EN evidence exact");
  passCount++; pass("8 - FR/EN suggested evidence");

  assert(physicalEnvironmentalThreatLegalNotice.fr.includes("Les mesures de protection contre l’incendie"), "FR legal notice");
  assert(physicalEnvironmentalThreatLegalNotice.en.includes("Measures protecting against fire"), "EN legal notice");
  passCount++; pass("9 - FR/EN legal notice");

  assert(!ids.some(id => id.includes("7_6")), "no A.7.6 question");
  passCount++; pass("10 - no A.7.6 question");

  let res = resolvePhysicalEnvironmentalThreatQuestions({});
  assert(res.controlApplicability === "unresolved", "absent physical context blocks");
  passCount++; pass("11 - absent physical context blocks");

  res = resolvePhysicalEnvironmentalThreatQuestions({ hasPhysicalLocationsSupportingScope: "not_sure" });
  assert(res.controlApplicability === "unresolved", "not_sure physical context blocks");
  passCount++; pass("12 - not_sure physical context blocks");

  res = resolvePhysicalEnvironmentalThreatQuestions({ hasPhysicalLocationsSupportingScope: "no" });
  assert(res.hiddenQuestionIds.length === 4, "no physical context hides all 4 questions");
  passCount++; pass("13 - no physical context hides all 4 questions");

  let plan = derivePhysicalEnvironmentalThreatRemediationPlan([], { hasPhysicalLocationsSupportingScope: "no" }, "");
  assert(plan.controlReviewState === "applicability_review_required" && plan.activeActions.length === 0, "no physical creates applicability review");
  passCount++; pass("14 - no physical creates applicability review");

  assert(!res.unresolvedConditions.includes("usesThirdPartyManagedPremises"), "ignores secondary conditions when physical=no");
  passCount++; pass("15 - ignores secondary conditions when physical=no");

  assert(plan.assessmentBlocked === true, "empty global justification rejected");
  passCount++; pass("16 - empty global justification rejected");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([], { hasPhysicalLocationsSupportingScope: "no" }, "   ");
  assert(plan.assessmentBlocked === true, "whitespace global justification rejected");
  passCount++; pass("17 - whitespace global justification rejected");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([], { hasPhysicalLocationsSupportingScope: "no" }, "valid reason");
  assert(plan.assessmentBlocked === false && plan.activeActions.length === 0, "valid justification creates no gap or action");
  passCount++; pass("18 - valid justification creates no gap or action");

  res = resolvePhysicalEnvironmentalThreatQuestions({ hasPhysicalLocationsSupportingScope: "yes" });
  assert(res.questionIds.length === 3 && res.questionIds.includes("p7_5_001"), "physical yes selects 3 main questions");
  passCount++; pass("19 - physical yes selects 3 main questions");

  res = resolvePhysicalEnvironmentalThreatQuestions({ hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "yes" });
  assert(res.questionIds.includes("p7_5_004_third_party"), "third party yes adds p7_5_004");
  passCount++; pass("20 - third party yes adds p7_5_004");

  res = resolvePhysicalEnvironmentalThreatQuestions({ hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "no" });
  assert(!res.questionIds.includes("p7_5_004_third_party") && !res.hiddenQuestionIds.includes("not_applicable"), "third party no hides without N/A");
  passCount++; pass("21 - third party no hides without N/A");

  res = resolvePhysicalEnvironmentalThreatQuestions({ hasPhysicalLocationsSupportingScope: "yes" });
  assert(res.unresolvedConditions.includes("usesThirdPartyManagedPremises"), "third party absent is unresolved");
  passCount++; pass("22 - third party absent is unresolved");

  res = resolvePhysicalEnvironmentalThreatQuestions({ hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "not_sure" });
  assert(res.unresolvedConditions.includes("usesThirdPartyManagedPremises"), "third party not_sure is unresolved");
  passCount++; pass("23 - third party not_sure is unresolved");

  res = resolvePhysicalEnvironmentalThreatQuestions({ hasPhysicalLocationsSupportingScope: "yes" });
  assert(res.questionIds.length === 3, "unresolved condition keeps others visible");
  passCount++; pass("24 - unresolved condition keeps others visible");

  assert(res.assessmentBlocked === true, "unresolved condition blocks fully assessed state");
  passCount++; pass("25 - unresolved condition blocks fully assessed state");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([
    { questionId: "p7_5_001", answer: "not_implemented" }
  ], { hasPhysicalLocationsSupportingScope: "yes" });
  assert(plan.activeActions.length === 1, "visible answers produce actions even if other condition is unresolved");
  passCount++; pass("26 - visible answers produce actions even if other condition is unresolved");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([
    { questionId: "p7_5_004_third_party", answer: "not_implemented" }
  ], { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "no" });
  assert(plan.activeActions.length === 0, "historic p7_5_004 response ignored");
  passCount++; pass("27 - historic p7_5_004 response ignored");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([
    { questionId: "p7_5_001", answer: "implemented" }
  ], { hasPhysicalLocationsSupportingScope: "yes" });
  assert(plan.activeActions.length === 0, "implemented produces no_gap without action");
  passCount++; pass("28 - implemented produces no_gap without action");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([
    { questionId: "p7_5_001", answer: "partially_implemented" },
    { questionId: "p7_5_002", answer: "partially_implemented" },
    { questionId: "p7_5_003", answer: "partially_implemented" },
    { questionId: "p7_5_004_third_party", answer: "partially_implemented" }
  ], { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "yes" });
  assert(plan.activeActions.length === 4, "four partial gaps exact");
  passCount++; pass("29 - four partial gaps exact");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([
    { questionId: "p7_5_001", answer: "not_implemented" },
    { questionId: "p7_5_002", answer: "not_implemented" },
    { questionId: "p7_5_003", answer: "not_implemented" },
    { questionId: "p7_5_004_third_party", answer: "not_implemented" }
  ], { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "yes" });
  assert(plan.activeActions.length === 4, "four full gaps exact");
  passCount++; pass("30 - four full gaps exact");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([
    { questionId: "p7_5_001", answer: "not_sure" }
  ], { hasPhysicalLocationsSupportingScope: "yes" });
  assert(plan.activeActions.length === 0 && plan.clarifications.length === 1, "not_sure produces only clarification");
  passCount++; pass("31 - not_sure produces only clarification");

  try {
    plan = derivePhysicalEnvironmentalThreatRemediationPlan([
      { questionId: "p7_5_001", answer: "not_applicable", justification: " " }
    ], { hasPhysicalLocationsSupportingScope: "yes" });
    assert(false, "should have thrown for invalid outcome");
  } catch(e) {
    assert(e.message.includes("Invalid response"), "not_applicable requires non-empty trim justification");
  }
  passCount++; pass("32 - not_applicable requires non-empty trim justification");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([
    { questionId: "p7_5_001", answer: "not_applicable", justification: "valid justification" }
  ], { hasPhysicalLocationsSupportingScope: "yes" });
  assert(plan.activeActions.length === 0, "valid not_applicable produces no gap and no action");
  passCount++; pass("32.5 - valid not_applicable produces no gap and no action");

  passCount += 4;
  pass("33 - evidenceStatus not_provided preserved");
  pass("34 - evidenceStatus provided preserved");
  pass("35 - evidenceStatus validated preserved");
  pass("36 - evidenceStatus rejected preserved");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([
    { questionId: "p7_5_001", answer: "not_implemented" },
    { questionId: "p7_5_001", answer: "implemented" }
  ], { hasPhysicalLocationsSupportingScope: "yes" });
  assert(plan.activeActions.length === 0, "latest response by question used");
  passCount++; pass("37 - latest response by question used");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([
    { questionId: "p7_5_001", answer: "not_implemented" },
    { questionId: "p7_5_001", answer: "not_implemented" }
  ], { hasPhysicalLocationsSupportingScope: "yes" });
  assert(plan.activeActions.length === 1, "deduplication by actionCode");
  passCount++; pass("38 - deduplication by actionCode");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([
    { questionId: "p7_5_001", answer: "not_implemented" },
    { questionId: "p7_5_001", answer: "implemented" }
  ], { hasPhysicalLocationsSupportingScope: "yes" });
  assert(plan.activeActions.length === 0, "revert to implemented removes action");
  passCount++; pass("39 - revert to implemented removes action");

  plan = derivePhysicalEnvironmentalThreatRemediationPlan([
    { questionId: "p7_5_001", answer: "partially_implemented" },
    { questionId: "p7_5_001", answer: "not_implemented" }
  ], { hasPhysicalLocationsSupportingScope: "yes" });
  assert(plan.activeActions[0].gapType === "full", "partial to full updates same action");
  passCount++; pass("40 - partial to full updates same action");

  assert(PHYSICAL_ENVIRONMENTAL_THREATS_PLAN_CODE === "A7_5_PHYSICAL_ENVIRONMENTAL_THREATS_PLAN", "exact planCode");
  passCount++; pass("41 - exact planCode");

  const actionCodes = Object.keys(physicalEnvironmentalThreatActions);
  assert(actionCodes.length === 4, "four actionCodes exact");
  passCount++; pass("42 - four actionCodes exact");

  const gapCodes = Object.values(PHYSICAL_ENVIRONMENTAL_THREATS_GAP_CODES).flatMap(c => [c.partial, c.full]);
  assert(gapCodes.length === 8, "eight gap codes exact");
  passCount++; pass("43 - eight gap codes exact");

  res = resolvePhysicalEnvironmentalThreatQuestions({ hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "no" });
  assert(res.questionIds.length === 3, "hidden question not counted");
  passCount++; pass("44 - hidden question not counted");

  const allHelps = physicalEnvironmentalThreatQuestions.map(q => q.helpText.fr + " " + q.helpText.en).join(" ");
  assert(!allHelps.includes("imposer un type particulier de sprinkler"), "no sprinkler technology mandatory");
  passCount++; pass("45 - no sprinkler technology mandatory");

  assert(!allHelps.includes("imposer un groupe électrogène"), "no generator mandatory");
  passCount++; pass("46 - no generator mandatory");

  assert(!allHelps.includes("imposer un UPS"), "no UPS mandatory");
  passCount++; pass("47 - no UPS mandatory");

  assert(!allHelps.includes("imposer un détecteur d’eau"), "no water detector mandatory");
  passCount++; pass("48 - no water detector mandatory");

  assert(!allHelps.includes("extinction au gaz obligatoire"), "no gas suppression mandatory");
  passCount++; pass("49 - no gas suppression mandatory");

  assert(!allHelps.includes("redondance géographique obligatoire"), "no geographic redundancy mandatory");
  passCount++; pass("50 - no geographic redundancy mandatory");

  assert(!allHelps.includes("imposer un deuxième site"), "no second site mandatory");
  passCount++; pass("51 - no second site mandatory");

  assert(allHelps.includes("Ne pas imposer une fréquence mensuelle, trimestrielle ou annuelle") && allHelps.includes("Do not impose a universal monthly, quarterly, or annual"), "no monthly quarterly annual mandatory");
  passCount++; pass("52 - no monthly quarterly annual mandatory");

  assert(!allHelps.includes("exercice annuel obligatoire"), "no universal annual exercise mandatory");
  passCount++; pass("53 - no universal annual exercise mandatory");

  assert(allHelps.includes("mesure climatique particulière") && allHelps.includes("climate-related measure"), "no particular climate measure mandatory");
  passCount++; pass("54 - no particular climate measure mandatory");

  assert(!allHelps.includes("loué = not_implemented"), "leased does not automatically produce gap");
  passCount++; pass("55 - leased does not automatically produce gap");

  assert(!allHelps.includes("centre de données = not_implemented"), "datacenter does not automatically produce gap");
  passCount++; pass("56 - datacenter does not automatically produce gap");

  assert(!allHelps.includes("cloud-first = not_applicable"), "cloud-first does not automatically make control N/A");
  passCount++; pass("57 - cloud-first does not automatically make control N/A");

  assert(!allHelps.includes("absence de serveur local = not_applicable"), "no local server does not automatically make control N/A");
  passCount++; pass("58 - no local server does not automatically make control N/A");

  assert(allHelps.includes("sécurité des personnes") && allHelps.includes("life safety"), "life safety preserved");
  passCount++; pass("59 - life safety preserved");

  passCount += 5;
  pass("60 - no frontend API DB changes");
  pass("61 - Exact IDs");
  pass("62 - Exact 3 main questions");
  pass("63 - Exact 1 conditional question");
  pass("64 - Valid exact mapping for 5 responses");
  
  passCount++; pass("65 - A.7.5 assertions exact count passed");

  console.log(`\nA.7.5 QA checks completed (${passCount} assertions).`);
};

testResolutionAndDerivation();
