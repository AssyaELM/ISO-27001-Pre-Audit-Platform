# Architecture initiale CapISO

## Vue d'ensemble

CapISO repose sur une architecture web en plusieurs couches :

- frontend React, TypeScript et Vite ;
- backend FastAPI ;
- validation Pydantic ;
- acces donnees SQLAlchemy ;
- migrations Alembic ;
- base PostgreSQL ;
- stockage local pour le MVP ;
- module IA abstrait avec mode deterministe de secours.

## Frontend

Le frontend contient :

- layout desktop avec sidebar ;
- topbar ;
- cartes ;
- tableaux ;
- formulaires ;
- statuts ;
- messages d'erreur ;
- etats vides ;
- indicateurs de chargement ;
- appels vers l'API FastAPI.

Premiers ecrans :

- connexion ;
- organisation et onboarding ;
- perimetre ;
- controles et questionnaire ;
- preuves ;
- ecarts et remediation ;
- documents ;
- dashboard.

## Backend

Le backend contient :

- configuration ;
- connexion a PostgreSQL ;
- routes API ;
- schemas Pydantic ;
- modeles SQLAlchemy ;
- migrations Alembic ;
- authentification ;
- controle des roles ;
- controle de l'organisation ;
- stockage local des fichiers ;
- generation documentaire ;
- orchestration IA ;
- journalisation.

Domaines :

- organisations ;
- membres et roles ;
- onboarding ;
- perimetre ;
- controles ;
- questions ;
- evaluations ;
- SoA ;
- preuves ;
- ecarts ;
- actions de remediation ;
- documents ;
- snapshots ;
- dashboard ;
- administration technique.

## Stockage MVP

Les fichiers sont conserves localement :

- `storage/evidences/` pour les preuves ;
- `storage/imported_documents/` pour les documents importes ;
- `storage/generated_documents/` pour les documents generes.

Chaque fichier devra etre relie a une organisation et controle par permissions.

