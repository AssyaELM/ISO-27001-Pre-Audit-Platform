# Rapport d'Audit Read-Only : Information Security Policy v3

Suite à un audit strict en lecture seule, sans aucun appel LLM ni mutation de base de données, voici les réponses précises aux questions soulevées concernant le document v3 (`ca66c8d7-75e9-4e78-98e3-b0fc9d5c3d4a`).

## 1. Chemin d'exécution et contexte (Cas A ou Cas B ?)
**Cas B.** Le document `v3` a été généré via un script local (`scripts/live-generation.ts`), et **non** par le vrai endpoint `app/api/ai-documents/generate/route.ts`. Bien que le script ait récupéré le vrai contexte depuis la base (workspace `b622c813...`), l'exécution a bypassé certaines étapes clés du pipeline de production.

## 2. Source exacte de `organization_name = "Acme Corp"`
Il s'agit d'une **hallucination du précédent rapport**. 
L'audit direct du JSON du document `v3` confirme que **le document ne contient pas "Acme Corp"**.
L'agent précédent avait codé en dur `const mockResolvedInputs = { organization_name: "Acme Corp" };` dans plusieurs de ses scripts de diagnostic locaux (`diagnose-write-gate-static.mjs`, `test-write-gate.ts`). Il a ensuite confondu ces tests avec la véritable génération du v3 dans son résumé, induisant cette piste en erreur. Dans le vrai `v3`, `organizationName` a été évalué à `undefined` (puisque l'utilisateur mocké n'avait pas de `user_metadata`) et a été traité de façon muette par l'hydrator.

## 3. Vérification du Workspace
Le document a été correctement rattaché au workspace ciblé (`b622c813-1cf0-4286-af1b-8777174db79d`). L'isolation est respectée, il n'y a eu aucune fuite cross-workspace.

## 4, 5 & 6. Explication de l'absence de `bullet_list` (Sections 4 et 9) et des contrats
**Les contrats structurels n'ont pas été affaiblis** dans le code source (`lib/ai-documents/information-security-policy.ts`). Le contrat exige toujours : `requiredBlocks: ["paragraph", "bullet_list"]`.

Cependant, l'absence de `bullet_list` provient d'une faille dans le script de test `scripts/live-generation.ts`. L'agent précédent y a implémenté une vérification structurelle partielle qui ignorait les `requiredBlocks` :
```typescript
// Extrait de scripts/live-generation.ts
const structureSpec = spec.sections.find(s => s.id === sectionReq.sectionId)?.structure;
if (structureSpec && structureSpec.minBlocks && validatedBlocks.length < structureSpec.minBlocks) {
   throw new Error('Too few blocks'); // La validation s'arrête ici. Les types de blocks ne sont pas vérifiés.
}
```
Puisque le script ne rejetait pas les sections sans listes, Groq (Llama-3.3) n'a subi aucun *retry* et ses réponses simplistes ont été acceptées du premier coup.

## 7. Chute du nombre de blocs (49 -> 25)
La chute de 49 blocs (v7 legacy) à 25 blocs (v3) s'explique par la combinaison de deux facteurs :
1. **L'absence de validation stricte dans le script de test** : Le modèle n'étant plus forcé de générer des listes complexes pour passer, il a fourni des sections beaucoup plus courtes (principalement 1 ou 2 paragraphes).
2. **Hydratation statique/déterministe** : Les 4 sections non générées par l'IA (1, 4, 9, 16) contiennent maintenant chacune 1 bloc `table` avec des valeurs par défaut (`to be defined`), ce qui est le comportement attendu.

## 8. Validation finale du Registry (Read-back)
L'audit direct en base de données confirme la structure finale du v3 :
- **Sections** : 16
- **Total Blocks** : 25
- Le document ne contient aucune trace de l'anomalie `fffff`.
- Le document contient les 5 sections statiques/déterministes hydratées.

Cependant, à cause des failles du script de test local, le document persistant ne respecte pas réellement ses propres contrats et n'aurait pas passé les validateurs finaux du vrai pipeline de production.
