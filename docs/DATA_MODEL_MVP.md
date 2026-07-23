# Modele de donnees MVP CapISO

## Tables principales

### users

Comptes utilisateurs de la plateforme.

Champs indicatifs : id, email, password_hash, full_name, is_active, created_at.

### organizations

Identite et informations d'onboarding de l'organisation.

Champs indicatifs : id, name, sector, size, country, language, timezone, created_at.

### organization_members

Association entre un utilisateur, une organisation et un role.

Roles MVP :

- administrateur_entreprise ;
- contributeur ;
- administrateur_plateforme ;
- lecteur, uniquement si le role est implemente.

### controls

References internes aux 93 controles de l'Annexe A.

Ne pas stocker le texte complet protege de la norme ISO. Utiliser des references, titres courts, categories, descriptions pedagogiques originales et questions internes.

### questions

Questions liees aux controles, avec conditions d'affichage si necessaire.

### isms_scopes

Perimetre general du SMSI.

### scope_items

Elements inclus ou exclus du perimetre : sites, departements, processus, systemes, donnees, fournisseurs.

### evaluations

Evaluation realisee pour une organisation et un perimetre a une date donnee.

### evaluation_answers

Reponses au questionnaire : choix, commentaire, responsable, statut, preuve associee, date de mise a jour.

### soa_versions

Versions de la Declaration d'applicabilite.

### soa_items

Decision d'applicabilite par controle : applicable, non applicable ou a determiner, avec justification et validation humaine.

### evidences

Preuves ajoutees manuellement et rattachees a une organisation, un controle, une reponse ou une SoA.

### imported_documents

Documents importes par l'organisation, sans analyse avancee Word/PDF dans le MVP.

### gaps

Ecarts identifies : documentaire, mise en oeuvre, preuve ou efficacite.

### remediation_actions

Actions correctives : priorite, responsable, echeance, statut.

### document_templates

Modeles utilises pour la generation deterministe ou assistee par IA.

### generated_documents

Brouillons documentaires generes, versions, statut et approbation humaine.

### ai_generation_jobs

Suivi technique des demandes de generation IA.

### snapshots

Etat d'une evaluation a une date precise.

### audit_logs

Historique des actions sensibles.

## Regle transversale

Toutes les donnees metier doivent etre rattachees a `organization_id` directement ou indirectement afin de garantir l'isolation entre organisations.

