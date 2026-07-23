# CapISO

CapISO est un prototype academique non commercial d'assistance a la preparation et au pre-audit ISO/IEC 27001:2022.

CapISO n'est ni affilie a ISO, ni approuve par ISO. La plateforme ne certifie pas une organisation et ne garantit pas la reussite d'un audit. Elle fournit une estimation de preparation basee sur les reponses, les preuves et les validations humaines.

## Perimetre MVP

Le MVP se concentre sur :

- les 93 controles de l'Annexe A ISO/IEC 27001:2022 ;
- la gestion des organisations, utilisateurs et roles ;
- l'onboarding et la definition du perimetre SMSI ;
- le questionnaire progressif ;
- la SoA preliminaire ;
- les preuves ajoutees manuellement ;
- les ecarts et actions de remediation ;
- les snapshots d'evaluation ;
- le dashboard et le rapport exportable ;
- quelques brouillons documentaires assistes par IA avec validation humaine.

Les clauses 4 a 10, l'import avance Word/PDF, la recherche semantique, la base vectorielle, le Gantt, le SSO, l'application mobile native et l'acces multi-client consultant sont hors perimetre MVP.

## Structure

```text
CapISO/
  frontend/
  backend/
  docs/
    mockups/
  storage/
    evidences/
    imported_documents/
    generated_documents/
  README.md
  .env.example
  .gitignore
```

## References projet

- Identite et regles : `docs/REFERENCES_PROJET_CAPISO.md`
- Charte visuelle : `docs/CHARTE_VISUELLE_CAPISO.md`
- Architecture initiale : `docs/ARCHITECTURE_INITIALE.md`
- Modele de donnees MVP : `docs/DATA_MODEL_MVP.md`
- Mockups officiels : `docs/mockups/`

