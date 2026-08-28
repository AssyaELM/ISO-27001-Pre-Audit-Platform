import {
  securityOfAssetsOffPremisesQuestions,
  resolveSecurityOfAssetsOffPremisesQuestions,
} from "../../content/assessment/physical/security-of-assets-off-premises.ts";
import {
  storageMediaQuestions,
  resolveStorageMediaQuestions,
} from "../../content/assessment/physical/storage-media.ts";

type Decision = "yes" | "no" | "not_sure";
type Context = Partial<Record<
  "usesAssetsOffPremises" | "allowsBYODForBusiness" | "usesRemovableOrPortableStorageMedia",
  Decision
>>;

export function getContextualPhysicalQuestions(controlId: "a7-9" | "a7-10") {
  return controlId === "a7-9" ? securityOfAssetsOffPremisesQuestions : storageMediaQuestions;
}

export function resolveContextualPhysicalQuestions(controlId: "a7-9" | "a7-10", context: Context) {
  return controlId === "a7-9"
    ? resolveSecurityOfAssetsOffPremisesQuestions(context)
    : resolveStorageMediaQuestions(context);
}
