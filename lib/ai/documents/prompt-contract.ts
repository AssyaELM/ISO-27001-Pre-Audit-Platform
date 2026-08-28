import type { AiDocumentLanguage } from "../providers/types.ts";

const commonRules = [
  "Do not summarize the document. Generate the complete professional document structure.",
  "Follow the supplied document template section by section. Use the appropriate block type for each piece of content.",
  "Structure your response using blocks: paragraph, heading (level 3 or 4), bullet_list, numbered_list, and table.",
  "Do not produce one paragraph merely to satisfy the schema. Generate the complete professional document represented by the template.",
  "For every section, select the appropriate block structure based on the section's purpose. Some sections require a specific structure as defined in the request.",
  "Use multiple blocks whenever the section contains multiple concepts, requirements, responsibilities, procedures, criteria, classifications, schedules, or controls.",
  "Use tables for structured information.",
  "Use bullet lists for multiple requirements, principles, rules, attributes, responsibilities, or criteria.",
  "Use numbered lists for procedures and ordered workflows.",
  "Use headings for meaningful subsections.",
  "Do not collapse a table, list, or procedure into one paragraph.",
  "A section that requires structured information must contain the corresponding structured block. Never replace a required table with prose. Never replace a required list with a paragraph.",
  "Never replace a procedure with a single summary paragraph.",
  "Use only the supplied facts and resolved inputs.",
  "Never invent organization names, people, roles, dates, frequencies, technologies, vendors, laws, regulators, authorities, numeric values, sanctions, or certification claims.",
  "Never invent specific classification labels, confidentiality levels, criticality, or sensitivity unless explicitly provided.",
  "Never invent physical/logical hosting places, regions, cloud providers, datacenters, buckets, retention durations, backup schedules (RPO/RTO), architectures, or encryption methods unless explicitly provided.",
  "Keep current facts distinct from future policy or procedure intent.",
  "If an indispensable input is missing, use the requested needs_input status or state it as 'to be defined' rather than inventing a value.",
  "Do not provide generic examples, illustrative lists, or guesses for information that is to be defined (e.g., do not list typical classification levels or typical hosting locations).",
  "Respect the supplied sections, order, titles, statuses, and prohibitedInferences exactly; do not add sections.",
  "Do not mention NormCore, AI, questionnaires, prompts, or copied ISO text.",
  "Return only the requested JSON object, without markdown fences or surrounding prose.",
] as const;

const frenchRules = [
  "Ne résumez pas le document. Générez la structure complète du document professionnel.",
  "Suivez le modèle de document fourni section par section. Utilisez le type de bloc approprié pour chaque contenu.",
  "Structurez votre réponse en utilisant des blocs : paragraph, heading (niveau 3 ou 4), bullet_list, numbered_list et table.",
  "Ne produisez pas un seul paragraphe juste pour satisfaire le schéma. Générez le document professionnel complet représenté par le modèle.",
  "Pour chaque section, choisissez la structure de blocs appropriée en fonction de l'objectif de la section. Certaines sections nécessitent une structure spécifique définie dans la requête.",
  "Utilisez plusieurs blocs chaque fois que la section contient plusieurs concepts, exigences, responsabilités, procédures, critères, classifications, calendriers ou contrôles.",
  "Utilisez des tables pour les informations structurées.",
  "Utilisez des listes à puces pour de multiples exigences, principes, règles, attributs, responsabilités ou critères.",
  "Utilisez des listes numérotées pour les procédures et les flux de travail ordonnés.",
  "Utilisez des titres (headings) pour les sous-sections significatives.",
  "Ne réduisez jamais une table, une liste ou une procédure en un seul paragraphe.",
  "Une section qui requiert des informations structurées doit contenir le bloc structuré correspondant. Ne remplacez jamais une table requise par du texte continu. Ne remplacez jamais une liste requise par un paragraphe.",
  "Ne remplacez jamais une procédure par un seul paragraphe de résumé.",
  "Utilisez uniquement les faits et données résolues fournis.",
  "N’inventez jamais de nom d’organisation, personne, rôle, date, fréquence, technologie, fournisseur, loi, régulateur, autorité, valeur chiffrée, sanction ou affirmation de certification.",
  "N'inventez jamais d'étiquettes de classification spécifiques, niveaux de confidentialité, criticité ou sensibilité sauf s'ils sont explicitement fournis.",
  "N'inventez jamais de lieux d'hébergement physiques/logiques, régions, fournisseurs cloud, centres de données, durées de rétention, planifications de sauvegarde (RPO/RTO), architectures ou méthodes de chiffrement sauf s'ils sont explicitement fournis.",
  "Distinguez les faits actuels de l’intention future de la policy ou procédure.",
  "Si une donnée indispensable est absente, utilisez le statut needs_input demandé ou indiquez 'à définir' au lieu d’inventer une valeur.",
  "Ne fournissez pas d'exemples génériques, de listes illustratives ou de suppositions pour des informations à définir (ex: ne listez pas de niveaux de classification ou de lieux d'hébergement typiques).",
  "Respectez exactement les sections, l’ordre, les titres, les statuts et les prohibitedInferences fournis ; n’ajoutez aucune section.",
  "Ne mentionnez pas NormCore, l’IA, les questionnaires, les prompts ni du texte ISO copié.",
  "Retournez uniquement l’objet JSON demandé, sans balises Markdown ni texte autour.",
] as const;

export function buildCommonDocumentSystemInstructions(language: AiDocumentLanguage): string {
  const rules = language === "fr" ? frenchRules : commonRules;
  return [`You prepare a professional ISO/IEC 27001 document. Output language: ${language}.`, ...rules].join("\n");
}

export const COMMON_DOCUMENT_PROMPT_CONTRACT_VERSION = "1.0.0";
