# NormCore — Assessment Frontend Guardrails

Ce document est un garde-fou obligatoire avant l’implémentation d’un nouveau thème d’évaluation. Il est fondé sur les écarts réellement rencontrés lors des parcours **People**, **Physical** et **Technological**.

Il ne remplace pas le README métier du thème : celui-ci reste la source de vérité pour les contrôles, questions, IDs, conditions, gaps et remédiations.

## Règle de priorité

1. Ne jamais recréer dans React une logique déjà fournie par le backend/runtime.
2. Réutiliser le shell et les styles actifs People/Physical avant de créer une variante.
3. Les données réelles et la résolution runtime priment toujours sur une supposition UI.
4. Ne déclarer une validation visuelle réussie qu’après vérification réelle dans le navigateur.

## Écarts réellement observés et comportement à conserver

| Erreur observée | Cause constatée | Comportement correct à conserver | Règle générale pour Organizational |
|---|---|---|---|
| Sidebar Technological incomplète par rapport à People/Physical et au Dashboard. | Un shell Technological minimal a été écrit au lieu de reprendre entièrement le shell existant. | Même navigation fixe : Dashboard, Assessment, Remediation Plan, Evidence Room, AI Documents, Settings ; mêmes classes, couleurs et espacements. | Partir du shell actif People/Physical ; ne pas créer un shell Organizational parallèle. |
| Carte Technological initialement indisponible ou non cliquable depuis `/assessment` et `/dashboard`. | `firstHref` / route de thème et préfixe de contrôle non renseignés. | Une carte non commencée ouvre le premier contrôle ; une carte commencée reprend le dernier contrôle du thème. | Ajouter l’entrée Organizational dans **les deux** surfaces : Dashboard et Assessment, avec le préfixe `a5-`. |
| Navigation Start / Continue incomplète pour un nouveau thème. | La logique ne reconnaissait que les préfixes People et Physical. | Start ouvre le premier contrôle ; Continue utilise le dernier `control_id` valide du thème ; Previous / Next respectent la liste réelle des contrôles. | Définir une seule liste ordonnée de contrôles et l’utiliser pour sidebar, compteur et navigation. |
| Quick Context Technological regroupés dans un grand conteneur blanc. | Une carte parent a enveloppé plusieurs contextes. | Chaque Quick Context est une carte `.quickContext` autonome, avec titre, explication, question et boutons. | Un contexte requis = une carte distincte, empilée avant les questions évaluées. |
| Questions principales risquant d’être dépendantes de la résolution du contexte. | Interprétation incorrecte de `assessmentBlocked` comme blocage de tout le contrôle. | Policy / Process, Application et Proof / Traceability restent visibles ; seules les conditionnelles attendent leur contexte. | Construire l’affichage depuis les `questionIds` runtime : principales visibles immédiatement, conditionnelles seulement si visibles. |
| Conditionnelles potentiellement affichées par défaut. | Filtrage UI basé sur le catalogue plutôt que sur le résultat du resolver. | `yes` affiche la conditionnelle ; `no`, `not_sure` et `undefined` la masquent. | Ne jamais déduire la visibilité dans React : utiliser la résolution backend/runtime. |
| Contexte connu risquant d’être redemandé. | Le frontend pouvait afficher son propre Quick Context sans consulter la résolution consolidée. | Afficher uniquement `requiredQuickContextQuestions` ; le runtime applique persisted → onboarding → shared/semantic context. | Ne jamais produire une liste de Quick Context locale à partir des seules questions conditionnelles. |
| Compteur et statuts pouvaient intégrer une réponse devenue cachée. | Les réponses étaient filtrées sans croiser les IDs visibles du resolver. | Compteur, statut, score, gaps et remédiations ne considèrent que les questions actuellement visibles. | Filtrer systématiquement les réponses avec `resolution.questionIds` avant tout calcul UI. |
| N/A Physical envoyait une réponse sans justification, alors que l’API la refuse. | Le bouton était traité comme une réponse ordinaire. | Premier clic N/A ouvre le bloc existant ; seul le bouton Save justification finalise la réponse avec justification. | Pour `not_applicable`, appliquer le même flux People dans chaque thème. |
| Bloc N/A Technological était affiché en permanence, ou ne réapparaissait pas après refresh. | L’état local était utilisé seul, sans tenir compte de la réponse persistée. | Caché par défaut ; visible si N/A vient d’être sélectionné **ou** si la réponse sauvegardée est N/A ; disparaît après une autre réponse. | Utiliser un état local de sélection **et** `saved?.answer === "not_applicable"`; ne jamais s’appuyer sur le seul état local. |
| Design N/A différent de People. | Un textarea brut ou un bloc spécifique Technological avait été introduit. | Réutiliser directement la classe et le JSX `.justification` de People : fond léger, bordure, label, textarea, bouton Save justification. | Ne pas recréer un style « équivalent » ; copier le bloc People actif et ses états disabled. |
| Réponses N/A impossibles à déclencher car le bouton était désactivé avant l’ouverture du champ. | La justification était exigée dans l’attribut `disabled` du bouton N/A. | N/A doit être cliquable ; le clic révèle la justification ; la sauvegarde finale est désactivée tant que le texte est vide. | Séparer « sélectionner N/A » de « enregistrer N/A ». |
| Validation navigateur déclarée trop tôt, sans workspace authentifié. | Les tests disponibles étaient seulement visuels ou la session n’avait pas de workspace. | Indiquer `NOT VERIFIED — authenticated workspace unavailable` pour la persistance ou les interactions réelles non testables. | Ne jamais transformer une absence de session en PASS ; ne pas non plus la présenter comme un défaut fonctionnel. |
| Build considéré en échec après un timeout d’outil alors que le build n’avait pas terminé. | Fenêtre d’exécution trop courte. | Relancer `npm run build` avec une fenêtre suffisamment longue avant de conclure. | Un timeout d’exécution n’est pas un échec fonctionnel tant que le build complet n’a pas été relancé. |
| Encodage/texte UI dégradé dans certains fichiers affichés ou modifiés par des outils. | Réécritures ponctuelles avec encodage non homogène. | Préserver l’UTF-8 et vérifier les libellés FR visibles après modification. | Après toute écriture front, contrôler au moins une page FR et une page EN dans le navigateur. |

## Contrat UI à appliquer avant toute implémentation

### Source des données

- Le catalogue généré et les fonctions runtime sont les seules sources des questions, types, `conditionKey`, contexte requis et questions visibles.
- Ne pas hardcoder les questions, IDs, conditions, gaps ou remédiations dans la page React.
- Charger les réponses réelles depuis l’API ; ne pas utiliser de données fictives pour les compteurs ou statuts.

### Quick Context

- Afficher chaque élément de `requiredQuickContextQuestions` dans sa propre carte `.quickContext`.
- Les Quick Context sont avant les QuestionCards.
- Ils ne comptent jamais dans `X/Y answered`, la progression, les gaps, les remédiations ou l’évidence.
- Les sauvegarder dans le contexte persistant prévu par le thème, puis laisser le runtime recalculer la visibilité.

### QuestionCards et réponses

- Une question évaluée = une carte `.question` indépendante.
- Afficher le badge de type, le numéro parmi les questions visibles, le wording et les cinq réponses NormCore.
- Conserver les détails/guidance/evidence déjà disponibles dans le catalogue existant, sans les inventer.
- Les réponses cachées ne doivent pas être rendues ni prises en compte dans les statuts ou compteurs.

### N/A et justification

- `implemented`, `partially_implemented`, `not_implemented`, `not_sure` : aucune justification obligatoire.
- `not_applicable` : justification obligatoire, sauvegarde via le bloc `.justification` People, état review/applicability géré par le backend.
- Après refresh ou retour Previous / Next, une réponse N/A persistée doit réafficher son bloc et sa justification.

### Navigation et surfaces d’entrée

- Le Dashboard et `/assessment` doivent tous deux proposer une entrée cliquable vers le thème.
- Start ouvre le premier contrôle réel ; Continue reprend le dernier contrôle du thème ayant une réponse.
- Previous / Next s’appuient sur la même liste ordonnée que la sidebar et affichent des états disabled aux extrémités.

## Validation obligatoire avant PASS

- Comparer visuellement une page du nouveau thème avec People et Physical, à desktop et à un viewport étroit.
- Vérifier : Quick Context inconnus, `yes`, `no`, `not_sure`, contexte déjà connu, plusieurs conditionnelles indépendantes et applicabilité spéciale éventuelle.
- Vérifier : réponse N/A, justification, changement vers une autre réponse, refresh et navigation Previous / Next.
- Exécuter `typecheck`, `lint` et `build` complet.
- Si une session authentifiée avec workspace n’est pas disponible, noter précisément les contrôles non vérifiés ; ne pas déclarer la persistance validée.

## Hors périmètre de ce document

Les recommandations de refactorisation générale, les nouveaux composants partagés et l’implémentation des règles métier ne font pas partie de ce garde-fou. Ils doivent être traités dans une tâche distincte.
“Ne jamais créer une route Organizational parallèle avec son propre shell si une route/theme assessment existante peut être étendue.”
Cela évite de reproduire exactement le problème Technological.
Ajouter dans la validation :
“Vérifier que le Dashboard et /assessment utilisent la même source de progression/statut et ne divergent pas.”
Sinon on peut avoir In progress d’un côté et Not started de l’autre.
Ajouter une règle importante pour les 37 contrôles :
“La sidebar, le compteur A.5.x of 37, Previous/Next et Continue doivent tous utiliser exactement la même liste canonique ordonnée A.5.1→A.5.37.”