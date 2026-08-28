export const peopleControls = [
  ["a6-1", "A.6.1", "Screening", "Contrôle des antécédents"],
  ["a6-2", "A.6.2", "Terms and conditions of employment", "Conditions d'emploi"],
  ["a6-3", "A.6.3", "Information security awareness, education and training", "Sensibilisation, éducation et formation"],
  ["a6-4", "A.6.4", "Disciplinary process", "Processus disciplinaire"],
  ["a6-5", "A.6.5", "Responsibilities after termination or change of employment", "Responsabilités après départ ou changement"],
  ["a6-6", "A.6.6", "Confidentiality or non-disclosure agreements", "Accords de confidentialité"],
  ["a6-7", "A.6.7", "Remote working", "Télétravail"],
  ["a6-8", "A.6.8", "Information security event reporting", "Signalement d'événements"],
] as const;

export type PeopleControlId = (typeof peopleControls)[number][0];
