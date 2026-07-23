# References du projet CapISO

## Identite du prototype

- Nom officiel de l'application : CapISO
- Nature : prototype academique non commercial
- Avertissement : CapISO n'est ni affilie a ISO, ni approuve par ISO
- Positionnement : assistant de preparation et de pre-audit
- Limite : CapISO ne certifie pas une organisation et ne garantit pas la reussite d'un audit

## Sources internes obligatoires

- Cahier des charges ISO27001
- Mockups officiels dans `docs/mockups/`
- Regles de cadrage du MVP dans ce dossier `docs/`

## Perimetre fonctionnel MVP

Le MVP doit couvrir :

- organisations ;
- utilisateurs, membres et roles ;
- onboarding ;
- perimetre SMSI ;
- bibliotheque des controles Annexe A ;
- questions conditionnelles ;
- evaluations ;
- SoA preliminaire ;
- preuves manuelles ;
- ecarts ;
- actions de remediation ;
- documents et brouillons avec validation humaine ;
- snapshots ;
- dashboard ;
- rapport exportable ;
- journalisation des actions sensibles.

## Hors perimetre MVP

Ne pas integrer dans la premiere version :

- integration complete des clauses 4 a 10 ;
- migration complete ISO 27001:2013 vers 2022 ;
- import avance de documents Word ou PDF ;
- recherche semantique ;
- base vectorielle ;
- vue Gantt ;
- acces multi-client pour consultants ;
- controle continu et integrations temps reel ;
- SSO Google ou Microsoft ;
- application mobile native.

## Regles de conception

- Isoler les donnees par organisation.
- Verifier le role a chaque action sensible.
- Verifier l'appartenance de l'utilisateur a l'organisation.
- Ajouter les preuves manuellement dans le MVP.
- Conserver l'historique des evaluations, preuves, documents et generations.
- Garder la validation humaine pour les decisions d'applicabilite et les documents.
- Ne jamais copier ni redistribuer le texte complet protege de la norme ISO.

