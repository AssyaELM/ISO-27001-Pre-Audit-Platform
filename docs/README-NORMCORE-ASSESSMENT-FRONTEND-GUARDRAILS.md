# NormCore — Assessment Frontend Guardrails

This document serves as a mandatory guardrail before implementing any new assessment theme. It is based on the discrepancies actually encountered during the **People**, **Physical**, and **Technological** pathways.

It does not replace the business README of the theme: the latter remains the source of truth for controls, questions, IDs, conditions, gaps, and remediations.

## Priority Rules

1. Never recreate in React a logic already provided by the backend/runtime.
2. Reuse the active People/Physical shell and styles before creating a variant.
3. Real data and runtime resolution always take precedence over a UI assumption.
4. Only declare a visual validation successful after actual verification in the browser.

## Actually Observed Discrepancies and Correct Behavior to Keep

| Observed Error | Found Cause | Correct Behavior to Keep | General Rule for Organizational |
|---|---|---|---|
| Technological sidebar incomplete compared to People/Physical and the Dashboard. | A minimal Technological shell was written instead of entirely reusing the existing shell. | Same fixed navigation: Dashboard, Assessment, Remediation Plan, Evidence Room, AI Documents, Settings; same classes, colors, and spacing. | Start from the active People/Physical shell; do not create a parallel Organizational shell. |
| Technological card initially unavailable or unclickable from `/assessment` and `/dashboard`. | `firstHref` / theme route and control prefix not provided. | An unstarted card opens the first control; a started card resumes the last control of the theme. | Add the Organizational entry in **both** surfaces: Dashboard and Assessment, with the `a5-` prefix. |
| Start / Continue navigation incomplete for a new theme. | The logic only recognized the People and Physical prefixes. | Start opens the first control; Continue uses the last valid `control_id` of the theme; Previous / Next respect the actual list of controls. | Define a single ordered list of controls and use it for sidebar, counter, and navigation. |
| Quick Contexts for Technological grouped in a large white container. | A parent card wrapped multiple contexts. | Each Quick Context is a standalone `.quickContext` card, with title, explanation, question, and buttons. | One required context = one distinct card, stacked before evaluated questions. |
| Main questions at risk of being dependent on the context resolution. | Incorrect interpretation of `assessmentBlocked` as blocking the entire control. | Policy / Process, Application, and Proof / Traceability remain visible; only conditionals wait for their context. | Build the display from runtime `questionIds`: main ones visible immediately, conditionals only if visible. |
| Conditionals potentially displayed by default. | UI filtering based on the catalog rather than the resolver result. | `yes` displays the conditional; `no`, `not_sure`, and `undefined` hide it. | Never infer visibility in React: use the backend/runtime resolution. |
| Known context at risk of being asked again. | The frontend could display its own Quick Context without consulting the consolidated resolution. | Only display `requiredQuickContextQuestions`; the runtime applies persisted → onboarding → shared/semantic context. | Never produce a local Quick Context list solely from conditional questions. |
| Counter and statuses could include an answer that became hidden. | Answers were filtered without cross-referencing visible IDs from the resolver. | Counter, status, score, gaps, and remediations only consider currently visible questions. | Systematically filter answers with `resolution.questionIds` before any UI calculation. |
| N/A Physical sent an answer without justification, whereas the API rejects it. | The button was treated as an ordinary answer. | First N/A click opens the existing block; only the Save justification button finalizes the answer with justification. | For `not_applicable`, apply the exact same People flow in every theme. |
| Technological N/A block was permanently displayed, or did not reappear after refresh. | Local state was used alone, without considering the persisted answer. | Hidden by default; visible if N/A has just been selected **or** if the saved answer is N/A; disappears after another answer. | Use a local selection state **and** `saved?.answer === "not_applicable"`; never rely solely on local state. |
| N/A design different from People. | A raw textarea or a specific Technological block had been introduced. | Directly reuse the `.justification` class and JSX from People: light background, border, label, textarea, Save justification button. | Do not recreate an "equivalent" style; copy the active People block and its disabled states. |
| N/A answers impossible to trigger because the button was disabled before opening the field. | Justification was required in the `disabled` attribute of the N/A button. | N/A must be clickable; the click reveals the justification; final save is disabled as long as the text is empty. | Separate "select N/A" from "save N/A". |
| Browser validation declared too early, without an authenticated workspace. | Available tests were only visual or the session had no workspace. | Indicate `NOT VERIFIED — authenticated workspace unavailable` for persistence or real untested interactions. | Never transform a lack of session into a PASS; nor present it as a functional defect. |
| Build considered failed after a tool timeout when the build had not finished. | Execution window too short. | Rerun `npm run build` with a sufficiently long window before concluding. | An execution timeout is not a functional failure as long as the complete build hasn't been rerun. |
| UI encoding/text degraded in certain files displayed or modified by tools. | Punctual rewrites with non-homogeneous encoding. | Preserve UTF-8 and verify visible FR/EN labels after modification. | After any frontend write, check at least one FR page and one EN page in the browser. |

## UI Contract to Apply Before Any Implementation

### Data Source

- The generated catalog and runtime functions are the only sources for questions, types, `conditionKey`, required context, and visible questions.
- Do not hardcode questions, IDs, conditions, gaps, or remediations in the React page.
- Load real answers from the API; do not use mock data for counters or statuses.

### Quick Context

- Display each element of `requiredQuickContextQuestions` in its own `.quickContext` card.
- Quick Contexts are placed before the QuestionCards.
- They never count in `X/Y answered`, progression, gaps, remediations, or evidence.
- Save them in the persistent context planned by the theme, then let the runtime recalculate visibility.

### QuestionCards and Answers

- One evaluated question = one independent `.question` card.
- Display the type badge, the number among visible questions, the wording, and the five NormCore answers.
- Keep the details/guidance/evidence already available in the existing catalog, without inventing them.
- Hidden answers must not be rendered or taken into account in statuses or counters.

### N/A and Justification

- `implemented`, `partially_implemented`, `not_implemented`, `not_sure`: no mandatory justification.
- `not_applicable`: mandatory justification, saved via the People `.justification` block, review/applicability state managed by the backend.
- After a refresh or Previous / Next navigation, a persisted N/A answer must redisplay its block and justification.

### Navigation and Entry Surfaces

- The Dashboard and `/assessment` must both offer a clickable entry to the theme.
- Start opens the first real control; Continue resumes the last control of the theme that has an answer.
- Previous / Next rely on the same ordered list as the sidebar and display disabled states at the extremities.

## Mandatory Validation Before PASS

- Visually compare a page of the new theme with People and Physical, on desktop and a narrow viewport.
- Verify: unknown Quick Contexts, `yes`, `no`, `not_sure`, already known context, multiple independent conditionals, and possible special applicability.
- Verify: N/A answer, justification, change to another answer, refresh, and Previous / Next navigation.
- Execute a complete `typecheck`, `lint`, and `build`.
- If an authenticated session with a workspace is not available, precisely note the unverified controls; do not declare persistence validated.

## Out of Scope of this Document

General refactoring recommendations, new shared components, and the implementation of business rules are not part of this guardrail. They must be handled in a separate task.
"Never create a parallel Organizational route with its own shell if an existing assessment route/theme can be extended."
This avoids reproducing exactly the Technological problem.
Add to validation:
"Verify that the Dashboard and /assessment use the same source for progression/status and do not diverge."
Otherwise, one could have In progress on one side and Not started on the other.
Add an important rule for the 37 controls:
"The sidebar, the A.5.x of 37 counter, Previous/Next, and Continue must all use exactly the same canonical ordered list A.5.1→A.5.37."