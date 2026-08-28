export const physicalControls = [
  ["a7-1", "A.7.1", "Physical security perimeters", "Périmètres de sécurité physique"],
  ["a7-2", "A.7.2", "Physical entry", "Entrée physique"],
  ["a7-3", "A.7.3", "Securing offices, rooms and facilities", "Sécurisation des bureaux, salles et installations"],
  ["a7-4", "A.7.4", "Physical security monitoring", "Surveillance de sécurité physique"],
  ["a7-5", "A.7.5", "Physical and environmental threats", "Menaces physiques et environnementales"],
  ["a7-6", "A.7.6", "Working in secure areas", "Travail dans des zones sécurisées"],
  ["a7-7", "A.7.7", "Clear desk and clear screen", "Bureau et écran dégagé"],
  ["a7-8", "A.7.8", "Equipment siting and protection", "Emplacement et protection des équipements"],
  ["a7-9", "A.7.9", "Security of assets off-premises", "Sécurité des actifs hors des locaux"],
  ["a7-10", "A.7.10", "Storage media", "Supports de stockage"],
  ["a7-11", "A.7.11", "Supporting utilities", "Services supports"],
  ["a7-12", "A.7.12", "Cabling security", "Sécurité du câblage"],
  ["a7-13", "A.7.13", "Equipment maintenance", "Maintenance des équipements"],
  ["a7-14", "A.7.14", "Secure disposal or re-use of equipment", "Mise au rebut ou réutilisation sécurisée des équipements"],
] as const;

export type PhysicalControlId = (typeof physicalControls)[number][0];
