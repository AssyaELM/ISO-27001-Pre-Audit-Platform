// Generated from the A.8.1â€“A.8.34 Technological README source packs. Do not edit manually.
export const technologicalControls = [
  {
    "id": "a8-1",
    "code": "A.8.1",
    "name": "User endpoint devices",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_1_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined, approved and communicated requirements for protecting information accessed, processed or stored through user endpoint devices?",
          "fr": "Votre organisation a-t-elle défini, approuvé et communiqué des exigences pour protéger les informations consultées, traitées ou stockées via les terminaux utilisateurs ?"
        },
        "partial": {
          "gapCode": "A8_1_ENDPOINT_POLICY_PARTIAL",
          "gap": "Endpoint-security requirements exist but are incomplete or inconsistently defined.",
          "remediation": "Complete the endpoint-security policy and procedures to cover scope, responsibilities, acceptable use, protection requirements, loss/incident handling, review requirements and BYOD rules where applicable."
        },
        "absent": {
          "gapCode": "A8_1_ENDPOINT_POLICY_ABSENT",
          "gap": "User endpoint-security requirements are not formally defined, approved or communicated.",
          "remediation": "Create, approve, version-control and communicate a topic-specific endpoint-security policy and supporting procedures."
        }
      },
      {
        "id": "p8_1_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are user endpoint devices protected through risk-appropriate technical and operational controls that implement the organisation's endpoint-security requirements?",
          "fr": "Les terminaux utilisateurs sont-ils protégés par des mesures techniques et opérationnelles proportionnées aux risques et conformes aux exigences de sécurité des terminaux définies par l’organisation ?"
        },
        "partial": {
          "gapCode": "A8_1_ENDPOINT_TECHNICAL_PARTIAL",
          "gap": "Endpoint protections are implemented only partially, inconsistently or do not cover all relevant in-scope devices.",
          "remediation": "Identify uncovered or non-compliant endpoints and implement the missing risk-appropriate technical and operational safeguards; track justified exceptions."
        },
        "absent": {
          "gapCode": "A8_1_ENDPOINT_TECHNICAL_ABSENT",
          "gap": "Endpoint protection is materially absent or insufficient to protect in-scope information.",
          "remediation": "Define and deploy an endpoint-security baseline covering appropriate access protection, secure configuration, data protection, updates and threat protection."
        }
      },
      {
        "id": "p8_1_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does your organisation retain sufficient evidence to demonstrate that endpoint-security requirements are implemented and continue to operate across the in-scope device population?",
          "fr": "Votre organisation conserve-t-elle des preuves suffisantes démontrant que les exigences de sécurité des terminaux sont appliquées et restent effectives sur l’ensemble des terminaux du périmètre ?"
        },
        "partial": {
          "gapCode": "A8_1_ENDPOINT_TRACEABILITY_PARTIAL",
          "gap": "Endpoint evidence exists, but coverage, review, exception handling or remediation traceability is incomplete.",
          "remediation": "Complete missing evidence sources and establish recurring endpoint-compliance reviews with tracked exceptions and remediation records."
        },
        "absent": {
          "gapCode": "A8_1_ENDPOINT_TRACEABILITY_ABSENT",
          "gap": "There is insufficient traceable evidence to demonstrate that endpoint-security controls operate across the in-scope device population.",
          "remediation": "Establish an authoritative endpoint inventory, compliance reporting, evidence retention and a documented deviation-remediation process."
        }
      },
      {
        "id": "p8_1_004_byod",
        "type": "conditional",
        "conditionKey": "allowsBYOD",
        "question": {
          "en": "Where personally owned devices are permitted, are organisational information and access protected through defined BYOD requirements, appropriate technical controls and clear user obligations?",
          "fr": "Lorsque les appareils personnels sont autorisés, les informations et accès de l’organisation sont-ils protégés par des règles BYOD définies, des mesures techniques appropriées et des obligations claires pour les utilisateurs ?"
        },
        "partial": {
          "gapCode": "A8_1_BYOD_PARTIAL",
          "gap": "BYOD is permitted but one or more governance, security, separation, consent or lifecycle requirements are incomplete.",
          "remediation": "Complete BYOD governance covering eligibility, minimum posture, data separation, access restrictions, organisational-data removal, loss/leaver handling and privacy/legal requirements."
        },
        "absent": {
          "gapCode": "A8_1_BYOD_ABSENT",
          "gap": "Personally owned devices access organisational information without defined and controlled BYOD requirements.",
          "remediation": "Establish a formal BYOD framework and enforce appropriate technical and organisational controls before personal devices can access in-scope information."
        }
      },
      {
        "id": "p8_1_005_off_premises",
        "type": "conditional",
        "conditionKey": "usesEndpointsOffPremises",
        "question": {
          "en": "Are endpoints used outside organisation-controlled premises protected appropriately when accessing organisational information or using external or potentially untrusted networks?",
          "fr": "Les terminaux utilisés hors des locaux contrôlés par l’organisation sont-ils protégés de manière appropriée lorsqu’ils accèdent aux informations de l’organisation ou utilisent des réseaux externes ou potentiellement non fiables ?"
        },
        "partial": {
          "gapCode": "A8_1_OFFPREMISES_PARTIAL",
          "gap": "Off-premises endpoint protections exist but do not consistently address all relevant remote-use or external-network risks.",
          "remediation": "Complete secure off-premises usage and connectivity requirements, including endpoint posture and appropriate secure-access controls."
        },
        "absent": {
          "gapCode": "A8_1_OFFPREMISES_ABSENT",
          "gap": "Off-premises endpoints can access in-scope information without adequate protection.",
          "remediation": "Define and implement proportionate secure remote-use and connectivity controls before allowing in-scope access from external environments."
        }
      }
    ],
    "quickContext": [
      {
        "key": "allowsBYOD",
        "question": {
          "en": "Are personally owned devices permitted to access, process or store in-scope organisational information?",
          "fr": "Les appareils personnels sont-ils autorisés à accéder, traiter ou stocker des informations de l’organisation relevant du périmètre ?"
        }
      },
      {
        "key": "usesEndpointsOffPremises",
        "question": {
          "en": "Are user endpoint devices used outside organisation-controlled premises?",
          "fr": "Des terminaux utilisateurs sont-ils utilisés en dehors des locaux contrôlés par l’organisation ?"
        }
      }
    ]
  },
  {
    "id": "a8-2",
    "code": "A.8.2",
    "name": "Privileged access rights",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_2_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has the organisation defined and documented how privileged access rights are identified, authorised, allocated, used, reviewed and revoked?",
          "fr": "L’organisation a-t-elle défini et documenté comment les droits d’accès privilégié sont identifiés, autorisés, attribués, utilisés, réexaminés et révoqués ?"
        },
        "partial": {
          "gapCode": "A8_2_PRIVILEGE_POLICY_PARTIAL",
          "gap": "Privileged-access governance exists but definition, approval, least privilege, review, revocation, logging or exception handling is incomplete.",
          "remediation": "Complete the privileged-access governance framework across the full lifecycle."
        },
        "absent": {
          "gapCode": "A8_2_PRIVILEGE_POLICY_ABSENT",
          "gap": "Privileged access is not formally governed through documented rules and responsibilities.",
          "remediation": "Create and approve a formal privileged-access management policy/process."
        }
      },
      {
        "id": "p8_2_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are privileged access rights actually restricted and managed according to approved business need, least privilege, appropriate authentication and controlled duration?",
          "fr": "Les droits d’accès privilégié sont-ils effectivement restreints et gérés selon un besoin métier approuvé, le principe du moindre privilège, une authentification appropriée et une durée maîtrisée ?"
        },
        "partial": {
          "gapCode": "A8_2_PRIVILEGE_CONTROL_PARTIAL",
          "gap": "Excessive rights, weak authentication, unjustified standing privileges, incomplete approval or inconsistent review remain.",
          "remediation": "Correct excessive or unjustified privileges and strengthen approval, authentication, restriction, expiry and revocation."
        },
        "absent": {
          "gapCode": "A8_2_PRIVILEGE_CONTROL_ABSENT",
          "gap": "Privileged rights can be granted or used without adequate authorisation, least privilege, authentication or controlled revocation.",
          "remediation": "Implement formal approval, least privilege, appropriate strong authentication, controlled elevation and prompt revocation."
        }
      },
      {
        "id": "p8_2_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does the organisation retain sufficient evidence to demonstrate who has privileged access, why it was authorised, how it is used, and whether privileges are reviewed and revoked appropriately?",
          "fr": "L’organisation conserve-t-elle des preuves suffisantes permettant de démontrer qui dispose d’un accès privilégié, pourquoi il a été autorisé, comment il est utilisé et si les privilèges sont correctement réexaminés et révoqués ?"
        },
        "partial": {
          "gapCode": "A8_2_PRIVILEGE_TRACEABILITY_PARTIAL",
          "gap": "Approvals, logs, reviews, revocation records or exception traceability are incomplete.",
          "remediation": "Complete the missing privileged-access evidence sources and establish recurring documented review and retention."
        },
        "absent": {
          "gapCode": "A8_2_PRIVILEGE_TRACEABILITY_ABSENT",
          "gap": "There is insufficient traceable evidence to identify privileged users, authorisations, activity, reviews and revocations.",
          "remediation": "Create an authoritative privileged-access inventory, formal approval records and an auditable logging/review trail."
        }
      },
      {
        "id": "p8_2_004_shared",
        "type": "conditional",
        "conditionKey": "usesSharedPrivilegedAccounts",
        "question": {
          "en": "Where shared, generic or otherwise non-personal privileged identities are technically necessary, is their use tightly controlled and individually attributable?",
          "fr": "Lorsque des identités privilégiées partagées, génériques ou non personnelles sont techniquement nécessaires, leur utilisation est-elle strictement contrôlée et attribuable individuellement ?"
        },
        "partial": {
          "gapCode": "A8_2_SHARED_PRIVILEGE_PARTIAL",
          "gap": "Shared privileged identities exist with incomplete attribution, credential protection, authorisation or monitoring.",
          "remediation": "Reduce shared identities and strengthen controlled credential access, named authorisation, individual attribution and monitoring."
        },
        "absent": {
          "gapCode": "A8_2_SHARED_PRIVILEGE_ABSENT",
          "gap": "Shared privileged access cannot be reliably attributed or lacks adequate compensating controls.",
          "remediation": "Replace shared identities where feasible; otherwise formally justify them and implement strong compensating controls."
        }
      },
      {
        "id": "p8_2_005_break_glass",
        "type": "conditional",
        "conditionKey": "usesBreakGlassPrivilegedAccess",
        "question": {
          "en": "Are emergency or break-glass privileged access mechanisms restricted, protected, logged and reviewed after use?",
          "fr": "Les mécanismes d’accès privilégié d’urgence ou « break-glass » sont-ils restreints, protégés, journalisés et réexaminés après utilisation ?"
        },
        "partial": {
          "gapCode": "A8_2_BREAKGLASS_PARTIAL",
          "gap": "Emergency-access controls for restriction, credential protection, logging or post-use review are incomplete.",
          "remediation": "Complete the emergency-access process and ensure every invocation is attributable, logged and reviewed."
        },
        "absent": {
          "gapCode": "A8_2_BREAKGLASS_ABSENT",
          "gap": "Break-glass access can be used without sufficient authorisation, restriction, traceability or review.",
          "remediation": "Establish controlled break-glass criteria, secure credentials, logging, post-use review and reset/rotation where appropriate."
        }
      },
      {
        "id": "p8_2_006_third_party",
        "type": "conditional",
        "conditionKey": "thirdPartyPrivilegedAccess",
        "question": {
          "en": "Are privileged rights granted to suppliers, contractors, MSPs or other third parties subject to equivalent authorisation, restriction, authentication, logging, review and revocation controls?",
          "fr": "Les droits privilégiés accordés aux fournisseurs, prestataires, MSP ou autres tiers sont-ils soumis à des contrôles équivalents d’autorisation, restriction, authentification, journalisation, revue et révocation ?"
        },
        "partial": {
          "gapCode": "A8_2_THIRDPARTY_PRIVILEGE_PARTIAL",
          "gap": "Third-party privileged access is controlled inconsistently or less rigorously than equivalent internal access.",
          "remediation": "Extend privileged-access governance to third parties and enforce named ownership, approval, least privilege, authentication, expiration, monitoring and revocation."
        },
        "absent": {
          "gapCode": "A8_2_THIRDPARTY_PRIVILEGE_ABSENT",
          "gap": "External privileged users can administer in-scope systems without adequate privileged-access governance.",
          "remediation": "Bring all third-party privileged access under the organisation’s privileged-access governance and supplier lifecycle."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesSharedPrivilegedAccounts",
        "question": {
          "en": "Are any shared, generic or non-personal privileged credentials used to perform administrative activities?",
          "fr": "Des identifiants privilégiés partagés, génériques ou non personnels sont-ils utilisés pour effectuer des activités administratives ?"
        }
      },
      {
        "key": "usesBreakGlassPrivilegedAccess",
        "question": {
          "en": "Does the organisation maintain emergency or break-glass privileged access?",
          "fr": "L’organisation maintient-elle un mécanisme d’accès privilégié d’urgence ou « break-glass » ?"
        }
      },
      {
        "key": "thirdPartyPrivilegedAccess",
        "question": {
          "en": "Are suppliers, MSPs, contractors or other third parties permitted to perform privileged administrative activities on in-scope systems?",
          "fr": "Des fournisseurs, MSP, prestataires ou autres tiers sont-ils autorisés à effectuer des activités administratives privilégiées sur les systèmes du périmètre ?"
        }
      }
    ]
  },
  {
    "id": "a8-3",
    "code": "A.8.3",
    "name": "Information access restriction",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_3_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has the organisation defined access-restriction rules for information and associated assets based on business need, authorisation, information sensitivity and least privilege?",
          "fr": "L’organisation a-t-elle défini des règles de restriction d’accès aux informations et actifs associés fondées sur le besoin métier, l’autorisation, la sensibilité de l’information et le moindre privilège ?"
        },
        "partial": {
          "gapCode": "A8_3_ACCESS_POLICY_PARTIAL",
          "gap": "Access-restriction rules are incomplete.",
          "remediation": "Complete access rules for scope, roles, permitted actions, approvals, exceptions and reviews."
        },
        "absent": {
          "gapCode": "A8_3_ACCESS_POLICY_ABSENT",
          "gap": "Information-access restrictions are not formally defined.",
          "remediation": "Establish documented, risk-based information-access restriction rules."
        }
      },
      {
        "id": "p8_3_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are access restrictions actually enforced so users, systems and processes can access only the information and functions they are authorised to use?",
          "fr": "Les restrictions d’accès sont-elles effectivement appliquées afin que les utilisateurs, systèmes et processus n’accèdent qu’aux informations et fonctions pour lesquelles ils sont autorisés ?"
        },
        "partial": {
          "gapCode": "A8_3_ACCESS_CONTROL_PARTIAL",
          "gap": "Broad, stale or excessive access remains.",
          "remediation": "Correct excessive permissions, strengthen granular enforcement and remove stale access."
        },
        "absent": {
          "gapCode": "A8_3_ACCESS_CONTROL_ABSENT",
          "gap": "Information access is not adequately restricted to authorised entities.",
          "remediation": "Implement risk-appropriate technical access restrictions aligned to approved rules."
        }
      },
      {
        "id": "p8_3_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does the organisation retain evidence that access restrictions are authorised, periodically reviewed, and adjusted or revoked when no longer required?",
          "fr": "L’organisation conserve-t-elle des preuves démontrant que les restrictions d’accès sont autorisées, réexaminées périodiquement et ajustées ou révoquées lorsqu’elles ne sont plus nécessaires ?"
        },
        "partial": {
          "gapCode": "A8_3_ACCESS_TRACEABILITY_PARTIAL",
          "gap": "Access-review or approval evidence is incomplete.",
          "remediation": "Complete access matrices, approvals, review evidence and revocation tracking."
        },
        "absent": {
          "gapCode": "A8_3_ACCESS_TRACEABILITY_ABSENT",
          "gap": "Access decisions and reviews cannot be reliably demonstrated.",
          "remediation": "Establish auditable access assignments, approvals, reviews and revocations."
        }
      },
      {
        "id": "p8_3_004_non_human",
        "type": "conditional",
        "conditionKey": "hasNonHumanAccessToInformation",
        "question": {
          "en": "Where service accounts, applications, APIs or other non-human identities access in-scope information, are their permissions explicitly authorised, restricted and reviewed?",
          "fr": "Lorsque des comptes de service, applications, API ou autres identités non humaines accèdent aux informations du périmètre, leurs autorisations sont-elles explicitement approuvées, restreintes et réexaminées ?"
        },
        "partial": {
          "gapCode": "A8_3_NONHUMAN_PARTIAL",
          "gap": "Non-human permissions are only partly governed or reviewed.",
          "remediation": "Inventory non-human access, assign ownership, restrict permissions and review periodically."
        },
        "absent": {
          "gapCode": "A8_3_NONHUMAN_ABSENT",
          "gap": "Non-human identities access information without adequate authorisation or restriction.",
          "remediation": "Bring service/application/API identities under formal access-control governance."
        }
      }
    ],
    "quickContext": [
      {
        "key": "hasNonHumanAccessToInformation",
        "question": {
          "en": "Do service accounts, applications, APIs or other non-human identities access in-scope information?",
          "fr": "Des comptes de service, applications, API ou autres identités non humaines accèdent-ils aux informations du périmètre ?"
        }
      }
    ]
  },
  {
    "id": "a8-4",
    "code": "A.8.4",
    "name": "Access to source code",
    "applicabilityKey": "hasInScopeSourceCode",
    "questions": [
      {
        "id": "p8_4_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has the organisation defined how access to source code, repositories, development libraries and associated development tools is authorised, restricted and reviewed?",
          "fr": "L’organisation a-t-elle défini comment l’accès au code source, aux dépôts, bibliothèques de développement et outils associés est autorisé, restreint et réexaminé ?"
        },
        "partial": {
          "gapCode": "A8_4_SOURCE_POLICY_PARTIAL",
          "gap": "Source-code access governance is incomplete.",
          "remediation": "Complete repository/tool scope, roles, approvals, least privilege and reviews."
        },
        "absent": {
          "gapCode": "A8_4_SOURCE_POLICY_ABSENT",
          "gap": "Source-code access is not formally governed.",
          "remediation": "Establish documented source-code and development-tool access controls."
        }
      },
      {
        "id": "p8_4_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Is access to source code and associated development tools technically restricted according to authorised roles, with controls protecting against unauthorised access or modification?",
          "fr": "L’accès au code source et aux outils de développement associés est-il techniquement restreint selon les rôles autorisés, avec des mesures empêchant les accès ou modifications non autorisés ?"
        },
        "partial": {
          "gapCode": "A8_4_SOURCE_CONTROL_PARTIAL",
          "gap": "Repository/tool restrictions are inconsistently enforced.",
          "remediation": "Restrict read/write/admin access, remove stale permissions and apply appropriate integrity/change protections."
        },
        "absent": {
          "gapCode": "A8_4_SOURCE_CONTROL_ABSENT",
          "gap": "Source code can be accessed or modified without adequate technical restriction.",
          "remediation": "Implement controlled repository access and appropriate integrity/change protections."
        }
      },
      {
        "id": "p8_4_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does the organisation retain evidence of source-code access, permission changes, relevant repository activity and periodic access reviews?",
          "fr": "L’organisation conserve-t-elle des preuves des accès au code source, changements d’autorisations, activités pertinentes des dépôts et revues périodiques des accès ?"
        },
        "partial": {
          "gapCode": "A8_4_SOURCE_TRACEABILITY_PARTIAL",
          "gap": "Repository audit evidence or access reviews are incomplete.",
          "remediation": "Enable/retain appropriate repository audit logs and document recurring permission reviews."
        },
        "absent": {
          "gapCode": "A8_4_SOURCE_TRACEABILITY_ABSENT",
          "gap": "Source-code access and changes cannot be adequately traced.",
          "remediation": "Establish repository audit logging, protected evidence retention and recurring access reviews."
        }
      },
      {
        "id": "p8_4_004_third_party",
        "type": "conditional",
        "conditionKey": "thirdPartySourceCodeAccess",
        "question": {
          "en": "Where external developers or suppliers can access source code or development tools, is their access subject to equivalent approval, restriction, monitoring and revocation controls?",
          "fr": "Lorsque des développeurs externes ou fournisseurs peuvent accéder au code source ou aux outils de développement, leur accès est-il soumis à des contrôles équivalents d’approbation, restriction, surveillance et révocation ?"
        },
        "partial": {
          "gapCode": "A8_4_THIRDPARTY_PARTIAL",
          "gap": "External source-code access controls are incomplete.",
          "remediation": "Extend source-code governance to external developers/suppliers."
        },
        "absent": {
          "gapCode": "A8_4_THIRDPARTY_ABSENT",
          "gap": "External developers have unmanaged source-code/tool access.",
          "remediation": "Bring third-party access under formal approval, least privilege, monitoring and revocation."
        }
      },
      {
        "id": "p8_4_005_public_code",
        "type": "conditional",
        "conditionKey": "publishesSourceCodePublicly",
        "question": {
          "en": "Where source code is intentionally released publicly, is publication controlled to prevent disclosure of secrets, sensitive information or unintended proprietary code?",
          "fr": "Lorsque du code source est volontairement publié, la publication est-elle contrôlée afin d’éviter la divulgation de secrets, d’informations sensibles ou de code propriétaire non destiné à être public ?"
        },
        "partial": {
          "gapCode": "A8_4_PUBLIC_RELEASE_PARTIAL",
          "gap": "Public-release checks are incomplete.",
          "remediation": "Strengthen release review, secret scanning and separation of public/private repositories."
        },
        "absent": {
          "gapCode": "A8_4_PUBLIC_RELEASE_ABSENT",
          "gap": "Code can be published without adequate security review.",
          "remediation": "Establish a controlled public-release process with review and secret/sensitive-data checks."
        }
      }
    ],
    "quickContext": [
      {
        "key": "hasInScopeSourceCode",
        "question": {
          "en": "Does the assessment scope include source code, repositories, development libraries or development tools that require protection?",
          "fr": "Le périmètre de l’évaluation comprend-il du code source, des dépôts, bibliothèques ou outils de développement nécessitant une protection ?"
        }
      },
      {
        "key": "thirdPartySourceCodeAccess",
        "question": {
          "en": "Can external developers or suppliers access in-scope source code or development tools?",
          "fr": "Des développeurs externes ou fournisseurs peuvent-ils accéder au code source ou aux outils de développement du périmètre ?"
        }
      },
      {
        "key": "publishesSourceCodePublicly",
        "question": {
          "en": "Does the organisation intentionally publish any in-scope source code or software components publicly?",
          "fr": "L’organisation publie-t-elle volontairement du code source ou des composants logiciels du périmètre ?"
        }
      }
    ]
  },
  {
    "id": "a8-5",
    "code": "A.8.5",
    "name": "Secure authentication",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_5_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has the organisation defined secure authentication requirements appropriate to the sensitivity and risk of the systems, information and identities being accessed?",
          "fr": "L’organisation a-t-elle défini des exigences d’authentification sécurisée adaptées à la sensibilité et au risque des systèmes, informations et identités concernés ?"
        },
        "partial": {
          "gapCode": "A8_5_AUTH_POLICY_PARTIAL",
          "gap": "Authentication requirements are incomplete or inconsistent.",
          "remediation": "Complete risk-based authentication requirements and responsibilities."
        },
        "absent": {
          "gapCode": "A8_5_AUTH_POLICY_ABSENT",
          "gap": "Secure authentication requirements are not formally defined.",
          "remediation": "Establish documented authentication requirements appropriate to risk."
        }
      },
      {
        "id": "p8_5_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are secure authentication mechanisms implemented and configured to resist unauthorised access, credential compromise and automated or repeated login attacks?",
          "fr": "Des mécanismes d’authentification sécurisée sont-ils mis en œuvre et configurés pour résister aux accès non autorisés, à la compromission des identifiants et aux tentatives de connexion automatisées ou répétées ?"
        },
        "partial": {
          "gapCode": "A8_5_AUTH_CONTROL_PARTIAL",
          "gap": "Authentication protections are incomplete or inconsistently configured.",
          "remediation": "Strengthen authentication, credential protection and anti-abuse controls where gaps remain."
        },
        "absent": {
          "gapCode": "A8_5_AUTH_CONTROL_ABSENT",
          "gap": "Authentication mechanisms do not adequately resist unauthorised access or credential attacks.",
          "remediation": "Implement secure authentication controls proportionate to the risk."
        }
      },
      {
        "id": "p8_5_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does the organisation retain evidence that authentication controls operate as intended, including relevant configuration, failed-attempt logging, alerts, exceptions and reviews?",
          "fr": "L’organisation conserve-t-elle des preuves démontrant que les contrôles d’authentification fonctionnent comme prévu, notamment les configurations pertinentes, tentatives échouées, alertes, exceptions et revues ?"
        },
        "partial": {
          "gapCode": "A8_5_AUTH_TRACEABILITY_PARTIAL",
          "gap": "Authentication evidence or review records are incomplete.",
          "remediation": "Complete configuration evidence, failed-attempt logging, alert and review records."
        },
        "absent": {
          "gapCode": "A8_5_AUTH_TRACEABILITY_ABSENT",
          "gap": "Authentication operation cannot be adequately demonstrated.",
          "remediation": "Establish auditable authentication configuration and operational evidence."
        }
      },
      {
        "id": "p8_5_004_high_risk",
        "type": "conditional",
        "conditionKey": "hasHighRiskAuthenticationUseCases",
        "question": {
          "en": "For high-risk or sensitive access, are stronger authentication measures applied in proportion to the risk?",
          "fr": "Pour les accès à haut risque ou sensibles, des mesures d’authentification renforcées sont-elles appliquées de manière proportionnée au risque ?"
        },
        "partial": {
          "gapCode": "A8_5_HIGH_RISK_PARTIAL",
          "gap": "High-risk access is not consistently protected with stronger authentication.",
          "remediation": "Extend stronger authentication to all relevant high-risk use cases."
        },
        "absent": {
          "gapCode": "A8_5_HIGH_RISK_ABSENT",
          "gap": "High-risk access lacks proportionate stronger authentication.",
          "remediation": "Implement stronger authentication for relevant high-risk access."
        }
      }
    ],
    "quickContext": [
      {
        "key": "hasHighRiskAuthenticationUseCases",
        "question": {
          "en": "Does the organisation have high-risk or sensitive access scenarios requiring stronger authentication?",
          "fr": "L’organisation possède-t-elle des scénarios d’accès à haut risque ou sensibles nécessitant une authentification renforcée ?"
        }
      }
    ]
  },
  {
    "id": "a8-6",
    "code": "A.8.6",
    "name": "Capacity management",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_6_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has the organisation defined how capacity requirements for critical information-processing resources are monitored, forecast and adjusted?",
          "fr": "L’organisation a-t-elle défini comment les besoins de capacité des ressources critiques de traitement de l’information sont surveillés, anticipés et ajustés ?"
        },
        "partial": {
          "gapCode": "A8_6_CAPACITY_POLICY_PARTIAL",
          "gap": "Capacity responsibilities or forecasting requirements are incomplete.",
          "remediation": "Complete capacity-management ownership, thresholds, forecasting and response rules."
        },
        "absent": {
          "gapCode": "A8_6_CAPACITY_POLICY_ABSENT",
          "gap": "Capacity management is not formally defined.",
          "remediation": "Establish a documented capacity-management process for relevant critical services."
        }
      },
      {
        "id": "p8_6_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are resource utilisation and performance monitored and adjusted in line with current and expected capacity requirements?",
          "fr": "L’utilisation et les performances des ressources sont-elles surveillées et ajustées en fonction des besoins de capacité actuels et prévus ?"
        },
        "partial": {
          "gapCode": "A8_6_CAPACITY_CONTROL_PARTIAL",
          "gap": "Monitoring or adjustment does not consistently cover relevant resources.",
          "remediation": "Complete monitoring, thresholds and proactive capacity adjustment."
        },
        "absent": {
          "gapCode": "A8_6_CAPACITY_CONTROL_ABSENT",
          "gap": "Relevant capacity is not adequately monitored or adjusted.",
          "remediation": "Implement resource monitoring and capacity adjustment for relevant services."
        }
      },
      {
        "id": "p8_6_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does the organisation retain capacity-monitoring, trend, forecast, threshold, incident and scaling evidence for relevant critical services?",
          "fr": "L’organisation conserve-t-elle des preuves de surveillance de capacité, tendances, prévisions, seuils, incidents et ajustements pour les services critiques concernés ?"
        },
        "partial": {
          "gapCode": "A8_6_CAPACITY_TRACEABILITY_PARTIAL",
          "gap": "Capacity evidence is incomplete.",
          "remediation": "Complete trend, forecast, threshold, incident and action records."
        },
        "absent": {
          "gapCode": "A8_6_CAPACITY_TRACEABILITY_ABSENT",
          "gap": "Capacity-management operation cannot be demonstrated.",
          "remediation": "Establish auditable monitoring, forecasting and response evidence."
        }
      },
      {
        "id": "p8_6_004_elastic",
        "type": "conditional",
        "conditionKey": "usesElasticOrAutoScalingResources",
        "question": {
          "en": "Where elastic or automatically scalable resources are used, are scaling limits, thresholds and failure conditions configured and reviewed to maintain required availability?",
          "fr": "Lorsque des ressources élastiques ou automatiquement extensibles sont utilisées, les limites, seuils et conditions d’échec sont-ils configurés et réexaminés afin de maintenir la disponibilité requise ?"
        },
        "partial": {
          "gapCode": "A8_6_ELASTIC_PARTIAL",
          "gap": "Elastic-scaling controls are incomplete.",
          "remediation": "Complete thresholds, scaling limits, alarms and failure-condition reviews."
        },
        "absent": {
          "gapCode": "A8_6_ELASTIC_ABSENT",
          "gap": "Elastic resources lack controlled scaling parameters.",
          "remediation": "Define and review safe scaling thresholds, limits and failure handling."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesElasticOrAutoScalingResources",
        "question": {
          "en": "Does the organisation use elastic or automatically scalable computing, storage or network resources?",
          "fr": "L’organisation utilise-t-elle des ressources informatiques, de stockage ou réseau élastiques ou automatiquement extensibles ?"
        }
      }
    ]
  },
  {
    "id": "a8-7",
    "code": "A.8.7",
    "name": "Protection against malware",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_7_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has the organisation defined a risk-based approach for preventing, detecting and responding to malware across relevant systems, devices and user activities?",
          "fr": "L’organisation a-t-elle défini une approche fondée sur les risques pour prévenir, détecter et traiter les logiciels malveillants sur les systèmes, appareils et activités utilisateurs concernés ?"
        },
        "partial": {
          "gapCode": "A8_7_MALWARE_POLICY_PARTIAL",
          "gap": "Malware-prevention/detection/response rules are incomplete.",
          "remediation": "Complete layered malware-protection requirements and responsibilities."
        },
        "absent": {
          "gapCode": "A8_7_MALWARE_POLICY_ABSENT",
          "gap": "No adequate malware-protection approach is defined.",
          "remediation": "Establish risk-based malware-prevention, detection and response requirements."
        }
      },
      {
        "id": "p8_7_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are appropriate technical and user-focused malware protection measures implemented, maintained and updated across relevant systems?",
          "fr": "Des mesures techniques et humaines appropriées de protection contre les logiciels malveillants sont-elles mises en œuvre, maintenues et actualisées sur les systèmes concernés ?"
        },
        "partial": {
          "gapCode": "A8_7_MALWARE_CONTROL_PARTIAL",
          "gap": "Malware protection is incomplete or inconsistent.",
          "remediation": "Extend and maintain appropriate layered malware controls and user protections."
        },
        "absent": {
          "gapCode": "A8_7_MALWARE_CONTROL_ABSENT",
          "gap": "Relevant systems lack adequate malware prevention/detection controls.",
          "remediation": "Implement appropriate layered technical and user-focused malware protections."
        }
      },
      {
        "id": "p8_7_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does the organisation retain evidence of malware-protection coverage, detections, updates, exceptions, investigations and corrective actions?",
          "fr": "L’organisation conserve-t-elle des preuves de couverture anti-malware, détections, mises à jour, exceptions, investigations et actions correctives ?"
        },
        "partial": {
          "gapCode": "A8_7_MALWARE_TRACEABILITY_PARTIAL",
          "gap": "Malware coverage/detection/response evidence is incomplete.",
          "remediation": "Complete coverage, detection, exception, investigation and remediation evidence."
        },
        "absent": {
          "gapCode": "A8_7_MALWARE_TRACEABILITY_ABSENT",
          "gap": "Malware-control operation cannot be adequately demonstrated.",
          "remediation": "Establish auditable malware-protection coverage and response evidence."
        }
      },
      {
        "id": "p8_7_004_alternative",
        "type": "conditional",
        "conditionKey": "hasSystemsUnsuitableForStandardAntiMalware",
        "question": {
          "en": "Where standard anti-malware or EDR cannot be deployed, are documented alternative protections implemented and monitored?",
          "fr": "Lorsque l’antimalware ou l’EDR standard ne peut pas être déployé, des protections alternatives documentées sont-elles mises en œuvre et surveillées ?"
        },
        "partial": {
          "gapCode": "A8_7_ALTERNATIVE_PARTIAL",
          "gap": "Alternative protection is incomplete.",
          "remediation": "Complete compensating controls such as segmentation, allowlisting and integrity monitoring as appropriate."
        },
        "absent": {
          "gapCode": "A8_7_ALTERNATIVE_ABSENT",
          "gap": "Systems unsuitable for standard anti-malware lack alternative protection.",
          "remediation": "Implement documented, risk-appropriate compensating protections and monitoring."
        }
      }
    ],
    "quickContext": [
      {
        "key": "hasSystemsUnsuitableForStandardAntiMalware",
        "question": {
          "en": "Are there in-scope systems where standard anti-malware or EDR cannot reasonably be deployed?",
          "fr": "Existe-t-il des systèmes du périmètre sur lesquels un antimalware ou EDR standard ne peut raisonnablement pas être déployé ?"
        }
      }
    ]
  },
  {
    "id": "a8-8",
    "code": "A.8.8",
    "name": "Management of technical vulnerabilities",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_8_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has the organisation defined a process to identify, assess, prioritise and treat technical vulnerabilities affecting in-scope technology?",
          "fr": "L’organisation a-t-elle défini un processus permettant d’identifier, évaluer, prioriser et traiter les vulnérabilités techniques affectant les technologies du périmètre ?"
        },
        "partial": {
          "gapCode": "A8_8_VULN_POLICY_PARTIAL",
          "gap": "The vulnerability-management lifecycle is incomplete.",
          "remediation": "Complete ownership, sources, assessment, prioritisation, treatment, exceptions and verification rules."
        },
        "absent": {
          "gapCode": "A8_8_VULN_POLICY_ABSENT",
          "gap": "No adequate vulnerability-management process is defined.",
          "remediation": "Establish a risk-based technical-vulnerability management process."
        }
      },
      {
        "id": "p8_8_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are vulnerability information and findings assessed in a timely, risk-based manner and remediated, mitigated or formally accepted according to their exposure and impact?",
          "fr": "Les informations et constats de vulnérabilité sont-ils évalués en temps utile selon le risque, puis corrigés, atténués ou formellement acceptés selon leur exposition et leur impact ?"
        },
        "partial": {
          "gapCode": "A8_8_VULN_CONTROL_PARTIAL",
          "gap": "Vulnerabilities are not consistently prioritised or treated in line with risk.",
          "remediation": "Improve risk-based prioritisation, treatment timelines and compensating-control use."
        },
        "absent": {
          "gapCode": "A8_8_VULN_CONTROL_ABSENT",
          "gap": "Known technical vulnerabilities are not adequately assessed or treated.",
          "remediation": "Implement timely risk-based assessment and remediation/mitigation."
        }
      },
      {
        "id": "p8_8_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does the organisation retain evidence of vulnerability discovery, risk assessment, prioritisation, remediation or compensating controls, verification and accepted exceptions?",
          "fr": "L’organisation conserve-t-elle des preuves de découverte des vulnérabilités, évaluation du risque, priorisation, correction ou mesures compensatoires, vérification et exceptions acceptées ?"
        },
        "partial": {
          "gapCode": "A8_8_VULN_TRACEABILITY_PARTIAL",
          "gap": "Vulnerability evidence or exception tracking is incomplete.",
          "remediation": "Complete findings, treatment, verification and risk-acceptance evidence."
        },
        "absent": {
          "gapCode": "A8_8_VULN_TRACEABILITY_ABSENT",
          "gap": "Vulnerability-management operation cannot be adequately demonstrated.",
          "remediation": "Establish auditable discovery, assessment, treatment, verification and exception records."
        }
      },
      {
        "id": "p8_8_004_third_party",
        "type": "conditional",
        "conditionKey": "reliesOnThirdPartiesForVulnerabilityTreatment",
        "question": {
          "en": "Where relevant technology is managed by third parties or SaaS providers, does the organisation obtain sufficient assurance that vulnerabilities are identified and treated appropriately?",
          "fr": "Lorsque des technologies pertinentes sont gérées par des tiers ou fournisseurs SaaS, l’organisation obtient-elle une assurance suffisante que les vulnérabilités sont identifiées et traitées de manière appropriée ?"
        },
        "partial": {
          "gapCode": "A8_8_THIRDPARTY_PARTIAL",
          "gap": "Provider-managed vulnerability assurance is incomplete.",
          "remediation": "Strengthen contractual/security assurance and evidence for provider vulnerability treatment."
        },
        "absent": {
          "gapCode": "A8_8_THIRDPARTY_ABSENT",
          "gap": "The organisation lacks assurance over provider-managed vulnerability treatment.",
          "remediation": "Establish supplier assurance and contractual expectations for vulnerability management."
        }
      },
      {
        "id": "p8_8_005_unpatchable",
        "type": "conditional",
        "conditionKey": "hasUnpatchableOrUnsupportedTechnology",
        "question": {
          "en": "Where vulnerabilities cannot be promptly patched, are compensating controls, risk acceptance and review arrangements documented and maintained?",
          "fr": "Lorsque des vulnérabilités ne peuvent pas être corrigées rapidement, des mesures compensatoires, une acceptation du risque et des modalités de revue sont-elles documentées et maintenues ?"
        },
        "partial": {
          "gapCode": "A8_8_UNPATCHABLE_PARTIAL",
          "gap": "Compensating controls or risk acceptance are incomplete.",
          "remediation": "Complete mitigations, approvals, review dates and monitoring for unpatched risk."
        },
        "absent": {
          "gapCode": "A8_8_UNPATCHABLE_ABSENT",
          "gap": "Unpatchable vulnerabilities remain without adequate treatment or formal risk acceptance.",
          "remediation": "Implement compensating controls, formal risk acceptance and recurring review."
        }
      }
    ],
    "quickContext": [
      {
        "key": "reliesOnThirdPartiesForVulnerabilityTreatment",
        "question": {
          "en": "Are any relevant in-scope technologies managed by third parties or SaaS providers that control vulnerability remediation?",
          "fr": "Des technologies pertinentes du périmètre sont-elles gérées par des tiers ou fournisseurs SaaS qui contrôlent leur correction des vulnérabilités ?"
        }
      },
      {
        "key": "hasUnpatchableOrUnsupportedTechnology",
        "question": {
          "en": "Does the organisation have in-scope technology that cannot always be patched promptly or is unsupported?",
          "fr": "L’organisation possède-t-elle des technologies du périmètre qui ne peuvent pas toujours être corrigées rapidement ou qui ne sont plus supportées ?"
        }
      }
    ]
  },
  {
    "id": "a8-9",
    "code": "A.8.9",
    "name": "Configuration management",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_9_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has the organisation established and documented secure configuration requirements and baseline configurations for relevant hardware, software, services and networks?",
          "fr": "L’organisation a-t-elle établi et documenté des exigences de configuration sécurisée et des configurations de référence pour les matériels, logiciels, services et réseaux concernés ?"
        },
        "partial": {
          "gapCode": "A8_9_CONFIG_POLICY_PARTIAL",
          "gap": "Secure configuration requirements/baselines are incomplete.",
          "remediation": "Complete scope, ownership, baselines, approval and review requirements."
        },
        "absent": {
          "gapCode": "A8_9_CONFIG_POLICY_ABSENT",
          "gap": "Secure configuration requirements and baselines are not formally established.",
          "remediation": "Establish documented secure configuration requirements and baselines."
        }
      },
      {
        "id": "p8_9_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are approved configurations implemented, controlled and monitored so unauthorised changes and security-configuration drift are detected and addressed?",
          "fr": "Les configurations approuvées sont-elles mises en œuvre, contrôlées et surveillées afin que les changements non autorisés et les dérives de configuration de sécurité soient détectés et traités ?"
        },
        "partial": {
          "gapCode": "A8_9_CONFIG_CONTROL_PARTIAL",
          "gap": "Configuration enforcement or drift detection is incomplete.",
          "remediation": "Improve baseline application, change control and drift detection/remediation."
        },
        "absent": {
          "gapCode": "A8_9_CONFIG_CONTROL_ABSENT",
          "gap": "Configurations are not adequately controlled or monitored.",
          "remediation": "Implement approved baselines, controlled changes and drift monitoring."
        }
      },
      {
        "id": "p8_9_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does the organisation retain baseline, configuration-change, deviation, review and corrective-action evidence demonstrating continued configuration control?",
          "fr": "L’organisation conserve-t-elle des preuves des configurations de référence, changements, écarts, revues et actions correctives démontrant la maîtrise continue des configurations ?"
        },
        "partial": {
          "gapCode": "A8_9_CONFIG_TRACEABILITY_PARTIAL",
          "gap": "Configuration evidence is incomplete.",
          "remediation": "Complete baseline, change, deviation, review and corrective-action records."
        },
        "absent": {
          "gapCode": "A8_9_CONFIG_TRACEABILITY_ABSENT",
          "gap": "Configuration control cannot be adequately demonstrated.",
          "remediation": "Establish auditable baseline, change, deviation and review evidence."
        }
      },
      {
        "id": "p8_9_004_cloud",
        "type": "conditional",
        "conditionKey": "usesCustomerManagedCloudConfigurations",
        "question": {
          "en": "Where the organisation manages cloud or SaaS security configurations, are those configurations included in the same baseline, monitoring and review process?",
          "fr": "Lorsque l’organisation gère des configurations de sécurité cloud ou SaaS, celles-ci sont-elles intégrées au même processus de référence, surveillance et revue ?"
        },
        "partial": {
          "gapCode": "A8_9_CLOUD_PARTIAL",
          "gap": "Cloud/SaaS security configurations are only partly governed.",
          "remediation": "Include all customer-managed cloud/SaaS configurations in baseline and review processes."
        },
        "absent": {
          "gapCode": "A8_9_CLOUD_ABSENT",
          "gap": "Customer-managed cloud/SaaS security configurations are unmanaged.",
          "remediation": "Bring them under formal configuration baselines, monitoring and review."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesCustomerManagedCloudConfigurations",
        "question": {
          "en": "Does the organisation manage security-relevant configurations in cloud or SaaS services?",
          "fr": "L’organisation gère-t-elle des configurations de sécurité pertinentes dans des services cloud ou SaaS ?"
        }
      }
    ]
  },
  {
    "id": "a8-10",
    "code": "A.8.10",
    "name": "Information deletion",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_10_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has the organisation defined when information must be deleted and the deletion methods required according to retention, legal, contractual, classification and business requirements?",
          "fr": "L’organisation a-t-elle défini quand les informations doivent être supprimées et les méthodes de suppression requises selon les exigences de conservation, légales, contractuelles, de classification et métier ?"
        },
        "partial": {
          "gapCode": "A8_10_DELETE_POLICY_PARTIAL",
          "gap": "Deletion rules or methods are incomplete.",
          "remediation": "Complete retention/deletion triggers, roles, methods, exceptions and evidence requirements."
        },
        "absent": {
          "gapCode": "A8_10_DELETE_POLICY_ABSENT",
          "gap": "Information-deletion requirements are not formally defined.",
          "remediation": "Establish documented retention and secure-deletion requirements."
        }
      },
      {
        "id": "p8_10_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Is information securely deleted from relevant systems, services and storage media when it is no longer required, using methods appropriate to the technology and sensitivity of the information?",
          "fr": "Les informations sont-elles supprimées de manière sécurisée des systèmes, services et supports de stockage concernés lorsqu’elles ne sont plus nécessaires, selon des méthodes adaptées à la technologie et à leur sensibilité ?"
        },
        "partial": {
          "gapCode": "A8_10_DELETE_CONTROL_PARTIAL",
          "gap": "Deletion is inconsistently or incompletely applied.",
          "remediation": "Implement the missing secure-deletion processes and methods across relevant systems/media."
        },
        "absent": {
          "gapCode": "A8_10_DELETE_CONTROL_ABSENT",
          "gap": "Information is retained or deleted without adequate secure-deletion controls.",
          "remediation": "Implement secure deletion aligned to retention requirements, technology and information sensitivity."
        }
      },
      {
        "id": "p8_10_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does the organisation retain sufficient evidence that required deletion occurred, including relevant logs, deletion records, exceptions and verification?",
          "fr": "L’organisation conserve-t-elle des preuves suffisantes démontrant que les suppressions requises ont été réalisées, notamment les journaux, enregistrements de suppression, exceptions et vérifications pertinentes ?"
        },
        "partial": {
          "gapCode": "A8_10_DELETE_TRACEABILITY_PARTIAL",
          "gap": "Deletion evidence is incomplete.",
          "remediation": "Complete deletion logs, records, exception handling and verification."
        },
        "absent": {
          "gapCode": "A8_10_DELETE_TRACEABILITY_ABSENT",
          "gap": "Required deletion cannot be adequately demonstrated.",
          "remediation": "Establish auditable deletion evidence and verification."
        }
      },
      {
        "id": "p8_10_004_third_party",
        "type": "conditional",
        "conditionKey": "thirdPartiesStoreInScopeInformation",
        "question": {
          "en": "Where third parties or cloud providers store in-scope information, are deletion requirements contractually addressed and is sufficient deletion assurance obtained?",
          "fr": "Lorsque des tiers ou fournisseurs cloud stockent des informations du périmètre, les exigences de suppression sont-elles prévues contractuellement et une assurance suffisante de leur suppression est-elle obtenue ?"
        },
        "partial": {
          "gapCode": "A8_10_THIRDPARTY_PARTIAL",
          "gap": "Third-party deletion requirements/evidence are incomplete.",
          "remediation": "Strengthen contracts and obtain sufficient deletion evidence or assurance."
        },
        "absent": {
          "gapCode": "A8_10_THIRDPARTY_ABSENT",
          "gap": "No adequate third-party deletion requirements or assurance exists.",
          "remediation": "Establish contractual deletion requirements and obtain evidence of provider deletion."
        }
      },
      {
        "id": "p8_10_005_physical_media",
        "type": "conditional",
        "conditionKey": "usesPhysicalStorageMediaRequiringSecureErasure",
        "question": {
          "en": "Where physical storage media containing in-scope information is reused or disposed of, is secure erasure or destruction performed and evidenced appropriately?",
          "fr": "Lorsque des supports de stockage physiques contenant des informations du périmètre sont réutilisés ou éliminés, leur effacement sécurisé ou leur destruction est-il réalisé et démontré de manière appropriée ?"
        },
        "partial": {
          "gapCode": "A8_10_MEDIA_PARTIAL",
          "gap": "Secure media erasure/destruction evidence or coverage is incomplete.",
          "remediation": "Complete secure erasure/destruction procedures and evidence."
        },
        "absent": {
          "gapCode": "A8_10_MEDIA_ABSENT",
          "gap": "Media can be reused/disposed without secure erasure or destruction.",
          "remediation": "Implement appropriate secure erasure/destruction and retain evidence."
        }
      }
    ],
    "quickContext": [
      {
        "key": "thirdPartiesStoreInScopeInformation",
        "question": {
          "en": "Do third parties or cloud providers store in-scope information on behalf of the organisation?",
          "fr": "Des tiers ou fournisseurs cloud stockent-ils des informations du périmètre pour le compte de l’organisation ?"
        }
      },
      {
        "key": "usesPhysicalStorageMediaRequiringSecureErasure",
        "question": {
          "en": "Does the organisation reuse or dispose of physical storage media containing in-scope information?",
          "fr": "L’organisation réutilise-t-elle ou élimine-t-elle des supports de stockage physiques contenant des informations du périmètre ?"
        }
      }
    ]
  },
  {
    "id": "a8-11",
    "code": "A.8.11",
    "name": "Data masking",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_11_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organization defined which information requires masking, in which uses or environments, and which techniques are permitted based on classification, risk, and applicable obligations?",
          "fr": "Votre organisation a-t-elle défini quelles informations nécessitent un masquage, dans quels usages ou environnements, et quelles techniques sont autorisées selon la classification, le risque et les obligations applicables ?"
        },
        "partial": {
          "gapCode": "A8_11_MASKING_GOVERNANCE_PARTIAL",
          "gap": "A8_11_MASKING_GOVERNANCE_PARTIAL",
          "remediation": "Définir catégories, cas d’usage, techniques, responsabilités et critères d’exception."
        },
        "absent": {
          "gapCode": "A8_11_MASKING_GOVERNANCE_ABSENT",
          "gap": "A8_11_MASKING_GOVERNANCE_ABSENT",
          "remediation": "Définir catégories, cas d’usage, techniques, responsabilités et critères d’exception."
        }
      },
      {
        "id": "p8_11_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are masking rules effectively applied to relevant information so that users and authorized processing are exposed only to the data they need?",
          "fr": "Les règles de masquage sont-elles effectivement appliquées aux informations concernées, de manière à limiter l’exposition aux seules données nécessaires aux utilisateurs et traitements autorisés ?"
        },
        "partial": {
          "gapCode": "A8_11_MASKING_IMPLEMENTATION_PARTIAL",
          "gap": "A8_11_MASKING_IMPLEMENTATION_PARTIAL",
          "remediation": "Déployer le masquage sur les flux, vues, exports et systèmes concernés."
        },
        "absent": {
          "gapCode": "A8_11_MASKING_IMPLEMENTATION_ABSENT",
          "gap": "A8_11_MASKING_IMPLEMENTATION_ABSENT",
          "remediation": "Déployer le masquage sur les flux, vues, exports et systèmes concernés."
        }
      },
      {
        "id": "p8_11_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does your organization retain evidence showing where masking is applied, how exceptions or unmasking are authorized and logged, and when the rules were reviewed?",
          "fr": "Votre organisation conserve-t-elle des preuves permettant de démontrer où le masquage est appliqué, comment les exceptions ou levées de masquage sont autorisées et tracées, et quand les règles ont été revues ?"
        },
        "partial": {
          "gapCode": "A8_11_MASKING_TRACEABILITY_PARTIAL",
          "gap": "A8_11_MASKING_TRACEABILITY_PARTIAL",
          "remediation": "Mettre en place preuves, journaux d’unmasking, revues et suivi des exceptions."
        },
        "absent": {
          "gapCode": "A8_11_MASKING_TRACEABILITY_ABSENT",
          "gap": "A8_11_MASKING_TRACEABILITY_ABSENT",
          "remediation": "Mettre en place preuves, journaux d’unmasking, revues et suivi des exceptions."
        }
      },
      {
        "id": "p8_11_004_nonprod",
        "type": "conditional",
        "conditionKey": "usesRealSensitiveDataInNonProduction",
        "question": {
          "en": "When real sensitive data is used in development, testing, analytics, or another non-production environment, is it systematically masked or substituted before use?",
          "fr": "Lorsque des données réelles sensibles sont utilisées en développement, test, analytique ou autre environnement non productif, sont-elles systématiquement masquées ou remplacées avant utilisation ?"
        },
        "partial": {
          "gapCode": "A8_11_NONPROD_MASKING_PARTIAL",
          "gap": "A8_11_NONPROD_MASKING_PARTIAL",
          "remediation": "Interdire les données sensibles brutes hors production ou automatiser anonymisation/tokenisation."
        },
        "absent": {
          "gapCode": "A8_11_NONPROD_MASKING_ABSENT",
          "gap": "A8_11_NONPROD_MASKING_ABSENT",
          "remediation": "Interdire les données sensibles brutes hors production ou automatiser anonymisation/tokenisation."
        }
      },
      {
        "id": "p8_11_005_ai_analytics",
        "type": "conditional",
        "conditionKey": "usesExternalAIOrAnalyticsWithSensitiveData",
        "question": {
          "en": "When sensitive information is sent to external AI, analytics, or processing services, is it masked or minimized before transfer where required?",
          "fr": "Lorsque des informations sensibles sont envoyées à des services d’IA, d’analytique ou de traitement externes, sont-elles masquées ou minimisées avant transfert lorsque cela est requis ?"
        },
        "partial": {
          "gapCode": "A8_11_EXTERNAL_PROCESSING_MASKING_PARTIAL",
          "gap": "A8_11_EXTERNAL_PROCESSING_MASKING_PARTIAL",
          "remediation": "Mettre une étape de minimisation/masquage avant IA/analytics externes et contrôler les exceptions."
        },
        "absent": {
          "gapCode": "A8_11_EXTERNAL_PROCESSING_MASKING_ABSENT",
          "gap": "A8_11_EXTERNAL_PROCESSING_MASKING_ABSENT",
          "remediation": "Mettre une étape de minimisation/masquage avant IA/analytics externes et contrôler les exceptions."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesRealSensitiveDataInNonProduction",
        "question": {
          "fr": " Des données réelles sensibles sont-elles utilisées dans des environnements non productifs du périmètre ? ",
          "en": "Is real sensitive data used in non-production environments within the assessment scope?"
        }
      },
      {
        "key": "usesExternalAIOrAnalyticsWithSensitiveData",
        "question": {
          "fr": " Des services externes d’IA, d’analytique ou de traitement reçoivent-ils des informations sensibles du périmètre ? ",
          "en": "Do external AI, analytics, or processing services receive sensitive information within the assessment scope?"
        }
      }
    ]
  },
  {
    "id": "a8-12",
    "code": "A.8.12",
    "name": "Data leakage prevention",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_12_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organization defined which information and channels must be covered by data leakage prevention measures, including detection, blocking, alerting, and handling rules?",
          "fr": "Votre organisation a-t-elle défini quelles informations et quels canaux doivent être couverts par des mesures de prévention des fuites de données, ainsi que les règles de détection, blocage, alerte et traitement ?"
        },
        "partial": {
          "gapCode": "A8_12_DLP_GOVERNANCE_PARTIAL",
          "gap": "A8_12_DLP_GOVERNANCE_PARTIAL",
          "remediation": "Cartographier données/canaux et formaliser règles DLP et ownership."
        },
        "absent": {
          "gapCode": "A8_12_DLP_GOVERNANCE_ABSENT",
          "gap": "A8_12_DLP_GOVERNANCE_ABSENT",
          "remediation": "Cartographier données/canaux et formaliser règles DLP et ownership."
        }
      },
      {
        "id": "p8_12_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are appropriate measures effectively applied to detect or prevent unauthorized transfers of sensitive information through endpoints, email, web, cloud, removable media, or other relevant channels?",
          "fr": "Des mesures adaptées sont-elles effectivement appliquées pour détecter ou empêcher les transferts non autorisés d’informations sensibles via les endpoints, la messagerie, le web, le cloud, les supports amovibles ou d’autres canaux pertinents ?"
        },
        "partial": {
          "gapCode": "A8_12_DLP_COVERAGE_PARTIAL",
          "gap": "A8_12_DLP_COVERAGE_PARTIAL",
          "remediation": "Déployer/étendre les contrôles DLP selon les risques et canaux prioritaires."
        },
        "absent": {
          "gapCode": "A8_12_DLP_COVERAGE_ABSENT",
          "gap": "A8_12_DLP_COVERAGE_ABSENT",
          "remediation": "Déployer/étendre les contrôles DLP selon les risques et canaux prioritaires."
        }
      },
      {
        "id": "p8_12_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are data leakage alerts, blocks, exceptions, and incidents recorded, reviewed, and used to periodically tune DLP rules and coverage?",
          "fr": "Les alertes, blocages, exceptions et incidents de fuite de données sont-ils enregistrés, examinés et utilisés pour ajuster périodiquement les règles et la couverture DLP ?"
        },
        "partial": {
          "gapCode": "A8_12_DLP_MONITORING_PARTIAL",
          "gap": "A8_12_DLP_MONITORING_PARTIAL",
          "remediation": "Créer triage, SLA, journal des exceptions et cycle de tuning."
        },
        "absent": {
          "gapCode": "A8_12_DLP_MONITORING_ABSENT",
          "gap": "A8_12_DLP_MONITORING_ABSENT",
          "remediation": "Créer triage, SLA, journal des exceptions et cycle de tuning."
        }
      },
      {
        "id": "p8_12_004_byod",
        "type": "conditional",
        "conditionKey": "hasBYODDevices",
        "question": {
          "en": "When personally owned devices access in-scope information, do DLP measures or compensating controls limit unauthorized copying, storage, or exfiltration?",
          "fr": "Lorsque des appareils personnels accèdent aux informations du périmètre, des mesures DLP ou des contrôles compensatoires limitent-ils la copie, le stockage ou l’exfiltration non autorisée ?"
        },
        "partial": {
          "gapCode": "A8_12_BYOD_DLP_PARTIAL",
          "gap": "A8_12_BYOD_DLP_PARTIAL",
          "remediation": "Containerisation, accès sans téléchargement, DLP endpoint ou contrôle équivalent."
        },
        "absent": {
          "gapCode": "A8_12_BYOD_DLP_ABSENT",
          "gap": "A8_12_BYOD_DLP_ABSENT",
          "remediation": "Containerisation, accès sans téléchargement, DLP endpoint ou contrôle équivalent."
        }
      },
      {
        "id": "p8_12_005_external",
        "type": "conditional",
        "conditionKey": "hasExternalPartiesAccessingSensitiveInformation",
        "question": {
          "en": "When external parties access sensitive information, are leakage-prevention measures or requirements defined and demonstrable for those accesses?",
          "fr": "Lorsque des parties externes accèdent à des informations sensibles, les mesures ou exigences de prévention des fuites sont-elles définies et démontrables pour ces accès ?"
        },
        "partial": {
          "gapCode": "A8_12_EXTERNAL_DLP_PARTIAL",
          "gap": "A8_12_EXTERNAL_DLP_PARTIAL",
          "remediation": "Ajouter exigences contractuelles/techniques et preuves pour accès tiers."
        },
        "absent": {
          "gapCode": "A8_12_EXTERNAL_DLP_ABSENT",
          "gap": "A8_12_EXTERNAL_DLP_ABSENT",
          "remediation": "Ajouter exigences contractuelles/techniques et preuves pour accès tiers."
        }
      }
    ],
    "quickContext": [
      {
        "key": "hasExternalPartiesAccessingSensitiveInformation",
        "question": {
          "fr": " Des fournisseurs, consultants ou partenaires externes accèdent-ils à des informations sensibles du périmètre ? ",
          "en": "Do external suppliers, consultants, or partners access sensitive information within the assessment scope?"
        }
      }
    ]
  },
  {
    "id": "a8-13",
    "code": "A.8.13",
    "name": "Information backup",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_13_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organization defined a backup policy covering scope, frequency, retention, responsibilities, protections, and recovery objectives aligned with business needs?",
          "fr": "Votre organisation a-t-elle défini une politique de sauvegarde couvrant le périmètre, les fréquences, rétentions, responsabilités, protections et objectifs de récupération adaptés aux besoins métier ?"
        },
        "partial": {
          "gapCode": "A8_13_BACKUP_POLICY_PARTIAL",
          "gap": "A8_13_BACKUP_POLICY_PARTIAL",
          "remediation": "Définir politique, RPO/RTO, couverture, fréquence, rétention et ownership."
        },
        "absent": {
          "gapCode": "A8_13_BACKUP_POLICY_ABSENT",
          "gap": "A8_13_BACKUP_POLICY_ABSENT",
          "remediation": "Définir politique, RPO/RTO, couverture, fréquence, rétention et ownership."
        }
      },
      {
        "id": "p8_13_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are required backups of information, software, and systems performed, protected against alteration or deletion, monitored, and retained in locations appropriate to the risk?",
          "fr": "Les sauvegardes des informations, logiciels et systèmes nécessaires sont-elles exécutées, protégées contre l’altération ou la suppression, surveillées et conservées dans des emplacements adaptés au risque ?"
        },
        "partial": {
          "gapCode": "A8_13_BACKUP_OPERATION_PARTIAL",
          "gap": "A8_13_BACKUP_OPERATION_PARTIAL",
          "remediation": "Corriger couverture, isolation/immutabilité, chiffrement, alerting et accès."
        },
        "absent": {
          "gapCode": "A8_13_BACKUP_OPERATION_ABSENT",
          "gap": "A8_13_BACKUP_OPERATION_ABSENT",
          "remediation": "Corriger couverture, isolation/immutabilité, chiffrement, alerting et accès."
        }
      },
      {
        "id": "p8_13_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are restores tested regularly, with results demonstrating that data and services can be recovered completely and within agreed recovery objectives?",
          "fr": "Des restaurations sont-elles testées régulièrement et les résultats démontrent-ils que les données et services peuvent être récupérés de façon complète et dans les objectifs de récupération convenus ?"
        },
        "partial": {
          "gapCode": "A8_13_RESTORE_TEST_PARTIAL",
          "gap": "A8_13_RESTORE_TEST_PARTIAL",
          "remediation": "Planifier des tests de restauration documentés et mesurer RTO/RPO."
        },
        "absent": {
          "gapCode": "A8_13_RESTORE_TEST_ABSENT",
          "gap": "A8_13_RESTORE_TEST_ABSENT",
          "remediation": "Planifier des tests de restauration documentés et mesurer RTO/RPO."
        }
      },
      {
        "id": "p8_13_004_cloud",
        "type": "conditional",
        "conditionKey": "usesCloudHostedCriticalDataOrSystems",
        "question": {
          "en": "For critical data or systems hosted in cloud or SaaS services, is backup and restore responsibility explicitly defined and covered by a verifiable solution?",
          "fr": "Pour les données ou systèmes critiques hébergés dans le cloud ou en SaaS, la responsabilité de sauvegarde et de restauration est-elle explicitement définie et couverte par une solution vérifiable ?"
        },
        "partial": {
          "gapCode": "A8_13_CLOUD_BACKUP_PARTIAL",
          "gap": "A8_13_CLOUD_BACKUP_PARTIAL",
          "remediation": "Clarifier responsabilité partagée et mettre en place sauvegarde SaaS/cloud vérifiable."
        },
        "absent": {
          "gapCode": "A8_13_CLOUD_BACKUP_ABSENT",
          "gap": "A8_13_CLOUD_BACKUP_ABSENT",
          "remediation": "Clarifier responsabilité partagée et mettre en place sauvegarde SaaS/cloud vérifiable."
        }
      },
      {
        "id": "p8_13_005_personal_data",
        "type": "conditional",
        "conditionKey": "backupsContainPersonalOrRegulatedData",
        "question": {
          "en": "When backups contain personal or regulated data, do protection, retention, and deletion rules remain consistent with applicable obligations?",
          "fr": "Lorsque les sauvegardes contiennent des données personnelles ou réglementées, les règles de protection, rétention et suppression restent-elles cohérentes avec les obligations applicables ?"
        },
        "partial": {
          "gapCode": "A8_13_BACKUP_RETENTION_PARTIAL",
          "gap": "A8_13_BACKUP_RETENTION_PARTIAL",
          "remediation": "Aligner rétention/suppression/protection des backups avec exigences applicables."
        },
        "absent": {
          "gapCode": "A8_13_BACKUP_RETENTION_ABSENT",
          "gap": "A8_13_BACKUP_RETENTION_ABSENT",
          "remediation": "Aligner rétention/suppression/protection des backups avec exigences applicables."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesCloudHostedCriticalDataOrSystems",
        "question": {
          "fr": " Des données ou systèmes critiques du périmètre sont-ils hébergés dans des services cloud ou SaaS ? ",
          "en": "Are critical in-scope data or systems hosted in cloud or SaaS services?"
        }
      },
      {
        "key": "backupsContainPersonalOrRegulatedData",
        "question": {
          "fr": " Les sauvegardes du périmètre contiennent-elles des données personnelles ou soumises à des obligations de conservation/suppression spécifiques ? ",
          "en": "Do in-scope backups contain personal data or information subject to specific retention or deletion obligations?"
        }
      }
    ]
  },
  {
    "id": "a8-14",
    "code": "A.8.14",
    "name": "Redundancy of information processing facilities",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_14_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Are availability requirements for important services and systems defined, with the required level of redundancy determined according to criticality and risk?",
          "fr": "Les exigences de disponibilité des services et systèmes importants sont-elles définies, et le niveau de redondance attendu est-il déterminé en fonction de leur criticité et des risques ?"
        },
        "partial": {
          "gapCode": "A8_14_REDUNDANCY_REQUIREMENTS_PARTIAL",
          "gap": "A8_14_REDUNDANCY_REQUIREMENTS_PARTIAL",
          "remediation": "Formaliser exigences de disponibilité et stratégie de redondance par criticité."
        },
        "absent": {
          "gapCode": "A8_14_REDUNDANCY_REQUIREMENTS_ABSENT",
          "gap": "A8_14_REDUNDANCY_REQUIREMENTS_ABSENT",
          "remediation": "Formaliser exigences de disponibilité et stratégie de redondance par criticité."
        }
      },
      {
        "id": "p8_14_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are components required for availability effectively redundant or protected against single points of failure in line with defined requirements?",
          "fr": "Les composants nécessaires à la disponibilité sont-ils effectivement redondés ou protégés contre les points uniques de défaillance conformément aux exigences définies ?"
        },
        "partial": {
          "gapCode": "A8_14_REDUNDANCY_IMPLEMENTATION_PARTIAL",
          "gap": "A8_14_REDUNDANCY_IMPLEMENTATION_PARTIAL",
          "remediation": "Supprimer/prioriser les SPOF et implémenter redondance adaptée."
        },
        "absent": {
          "gapCode": "A8_14_REDUNDANCY_IMPLEMENTATION_ABSENT",
          "gap": "A8_14_REDUNDANCY_IMPLEMENTATION_ABSENT",
          "remediation": "Supprimer/prioriser les SPOF et implémenter redondance adaptée."
        }
      },
      {
        "id": "p8_14_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are redundancy-related failover and recovery mechanisms periodically tested, with traceable results, deviations, and corrective actions?",
          "fr": "Les mécanismes de bascule et de reprise liés à la redondance sont-ils testés périodiquement, avec des résultats, écarts et actions correctives traçables ?"
        },
        "partial": {
          "gapCode": "A8_14_FAILOVER_TEST_PARTIAL",
          "gap": "A8_14_FAILOVER_TEST_PARTIAL",
          "remediation": "Organiser des tests de bascule réalistes et suivre les écarts."
        },
        "absent": {
          "gapCode": "A8_14_FAILOVER_TEST_ABSENT",
          "gap": "A8_14_FAILOVER_TEST_ABSENT",
          "remediation": "Organiser des tests de bascule réalistes et suivre les écarts."
        }
      },
      {
        "id": "p8_14_004_cloud",
        "type": "conditional",
        "conditionKey": "usesCloudForHighAvailabilityServices",
        "question": {
          "en": "For high-availability services hosted in the cloud, does the architecture use appropriate redundancy across zones, regions, or independent components according to defined needs?",
          "fr": "Pour les services nécessitant une haute disponibilité et hébergés dans le cloud, l’architecture utilise-t-elle une redondance adaptée entre zones, régions ou composants indépendants selon les besoins définis ?"
        },
        "partial": {
          "gapCode": "A8_14_CLOUD_REDUNDANCY_PARTIAL",
          "gap": "A8_14_CLOUD_REDUNDANCY_PARTIAL",
          "remediation": "Revoir architecture cloud, zones/régions, dépendances et test failover."
        },
        "absent": {
          "gapCode": "A8_14_CLOUD_REDUNDANCY_ABSENT",
          "gap": "A8_14_CLOUD_REDUNDANCY_ABSENT",
          "remediation": "Revoir architecture cloud, zones/régions, dépendances et test failover."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesCloudForHighAvailabilityServices",
        "question": {
          "fr": " Des services du périmètre ayant des exigences élevées de disponibilité sont-ils hébergés dans le cloud ? ",
          "en": "Are in-scope services with high availability requirements hosted in the cloud?"
        }
      }
    ]
  },
  {
    "id": "a8-15",
    "code": "A.8.15",
    "name": "Logging",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_15_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organization defined which events, systems, and activities must be logged, including appropriate responsibilities, detail, protections, and retention periods?",
          "fr": "Votre organisation a-t-elle défini quels événements, systèmes et activités doivent être journalisés, avec les responsabilités, niveaux de détail, protections et durées de conservation appropriés ?"
        },
        "partial": {
          "gapCode": "A8_15_LOGGING_POLICY_PARTIAL",
          "gap": "A8_15_LOGGING_POLICY_PARTIAL",
          "remediation": "Définir périmètre, événements, rétention, ownership et règles de protection."
        },
        "absent": {
          "gapCode": "A8_15_LOGGING_POLICY_ABSENT",
          "gap": "A8_15_LOGGING_POLICY_ABSENT",
          "remediation": "Définir périmètre, événements, rétention, ownership et règles de protection."
        }
      },
      {
        "id": "p8_15_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are required logs effectively generated, collected, and protected against unauthorized access, modification, or deletion, including relevant privileged activities?",
          "fr": "Les journaux nécessaires sont-ils effectivement générés, collectés et protégés contre l’accès, la modification ou la suppression non autorisés, y compris pour les activités privilégiées pertinentes ?"
        },
        "partial": {
          "gapCode": "A8_15_LOGGING_IMPLEMENTATION_PARTIAL",
          "gap": "A8_15_LOGGING_IMPLEMENTATION_PARTIAL",
          "remediation": "Activer/centraliser les logs critiques et sécuriser stockage et accès."
        },
        "absent": {
          "gapCode": "A8_15_LOGGING_IMPLEMENTATION_ABSENT",
          "gap": "A8_15_LOGGING_IMPLEMENTATION_ABSENT",
          "remediation": "Activer/centraliser les logs critiques et sécuriser stockage et accès."
        }
      },
      {
        "id": "p8_15_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are log coverage, integrity, retention, and usefulness periodically verified to demonstrate that they support the required investigation and traceability?",
          "fr": "La couverture, l’intégrité, la rétention et l’utilité des journaux sont-elles périodiquement vérifiées afin de démontrer qu’ils permettent l’investigation et la traçabilité attendues ?"
        },
        "partial": {
          "gapCode": "A8_15_LOGGING_ASSURANCE_PARTIAL",
          "gap": "A8_15_LOGGING_ASSURANCE_PARTIAL",
          "remediation": "Tester intégrité, recherche, rétention et capacité d’investigation."
        },
        "absent": {
          "gapCode": "A8_15_LOGGING_ASSURANCE_ABSENT",
          "gap": "A8_15_LOGGING_ASSURANCE_ABSENT",
          "remediation": "Tester intégrité, recherche, rétention et capacité d’investigation."
        }
      },
      {
        "id": "p8_15_004_external_platforms",
        "type": "conditional",
        "conditionKey": "usesExternallyHostedCriticalSystems",
        "question": {
          "en": "For critical systems hosted or managed by third parties, does the organization have sufficient access to required logs and assurance over their retention and availability?",
          "fr": "Pour les systèmes critiques hébergés ou gérés par des tiers, l’organisation dispose-t-elle d’un accès suffisant aux journaux nécessaires et de garanties sur leur conservation et leur disponibilité ?"
        },
        "partial": {
          "gapCode": "A8_15_THIRD_PARTY_LOGS_PARTIAL",
          "gap": "A8_15_THIRD_PARTY_LOGS_PARTIAL",
          "remediation": "Obtenir accès/export/API, exigences contractuelles et rétention suffisante."
        },
        "absent": {
          "gapCode": "A8_15_THIRD_PARTY_LOGS_ABSENT",
          "gap": "A8_15_THIRD_PARTY_LOGS_ABSENT",
          "remediation": "Obtenir accès/export/API, exigences contractuelles et rétention suffisante."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesExternallyHostedCriticalSystems",
        "question": {
          "fr": " Des systèmes critiques du périmètre sont-ils hébergés ou gérés par des fournisseurs externes ? ",
          "en": "Are critical in-scope systems hosted or managed by external providers?"
        }
      }
    ]
  },
  {
    "id": "a8-16",
    "code": "A.8.16",
    "name": "Monitoring activities",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_16_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organization defined the systems, behaviours, events, and thresholds to be monitored, together with associated responsibilities and escalation rules?",
          "fr": "Votre organisation a-t-elle défini les systèmes, comportements, événements et seuils qui doivent être surveillés, ainsi que les responsabilités et règles d’escalade associées ?"
        },
        "partial": {
          "gapCode": "A8_16_MONITORING_GOVERNANCE_PARTIAL",
          "gap": "A8_16_MONITORING_GOVERNANCE_PARTIAL",
          "remediation": "Définir cas d’usage, seuils, ownership, escalades et criticité."
        },
        "absent": {
          "gapCode": "A8_16_MONITORING_GOVERNANCE_ABSENT",
          "gap": "A8_16_MONITORING_GOVERNANCE_ABSENT",
          "remediation": "Définir cas d’usage, seuils, ownership, escalades et criticité."
        }
      },
      {
        "id": "p8_16_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Is active monitoring effectively in place across relevant components to detect anomalous behaviour and generate actionable alerts in a timely manner?",
          "fr": "Une surveillance active est-elle effectivement en place sur les composants pertinents pour détecter des comportements anormaux et générer des alertes exploitables en temps utile ?"
        },
        "partial": {
          "gapCode": "A8_16_MONITORING_COVERAGE_PARTIAL",
          "gap": "A8_16_MONITORING_COVERAGE_PARTIAL",
          "remediation": "Étendre télémétrie/alerting aux réseaux, endpoints, systèmes et applications prioritaires."
        },
        "absent": {
          "gapCode": "A8_16_MONITORING_COVERAGE_ABSENT",
          "gap": "A8_16_MONITORING_COVERAGE_ABSENT",
          "remediation": "Étendre télémétrie/alerting aux réseaux, endpoints, systèmes et applications prioritaires."
        }
      },
      {
        "id": "p8_16_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are alerts recorded, triaged, investigated, and closed in a traceable manner, and is detection-rule effectiveness regularly tested and improved?",
          "fr": "Les alertes sont-elles enregistrées, triées, investiguées et clôturées de manière traçable, et l’efficacité des règles de détection est-elle régulièrement testée et améliorée ?"
        },
        "partial": {
          "gapCode": "A8_16_MONITORING_EFFECTIVENESS_PARTIAL",
          "gap": "A8_16_MONITORING_EFFECTIVENESS_PARTIAL",
          "remediation": "Mettre triage, SLA, tests de détection et tuning périodique."
        },
        "absent": {
          "gapCode": "A8_16_MONITORING_EFFECTIVENESS_ABSENT",
          "gap": "A8_16_MONITORING_EFFECTIVENESS_ABSENT",
          "remediation": "Mettre triage, SLA, tests de détection et tuning périodique."
        }
      },
      {
        "id": "p8_16_004_managed_monitoring",
        "type": "conditional",
        "conditionKey": "usesManagedSecurityMonitoring",
        "question": {
          "en": "When monitoring is partly or fully outsourced to a SOC, MDR, or other provider, are responsibilities, service levels, escalations, and handling evidence clearly defined and monitored?",
          "fr": "Lorsque la surveillance est confiée en tout ou partie à un SOC, MDR ou autre prestataire, les responsabilités, niveaux de service, escalades et preuves de traitement sont-ils clairement définis et suivis ?"
        },
        "partial": {
          "gapCode": "A8_16_MANAGED_MONITORING_PARTIAL",
          "gap": "A8_16_MANAGED_MONITORING_PARTIAL",
          "remediation": "Formaliser SLA/RACI/escalade et exiger preuves SOC/MDR."
        },
        "absent": {
          "gapCode": "A8_16_MANAGED_MONITORING_ABSENT",
          "gap": "A8_16_MANAGED_MONITORING_ABSENT",
          "remediation": "Formaliser SLA/RACI/escalade et exiger preuves SOC/MDR."
        }
      },
      {
        "id": "p8_16_005_legacy",
        "type": "conditional",
        "conditionKey": "hasLegacySystemsWithMonitoringLimitations",
        "question": {
          "en": "When some systems do not support standard monitoring mechanisms, do appropriate compensating controls still enable anomalous activity to be detected?",
          "fr": "Lorsque certains systèmes ne supportent pas les mécanismes de surveillance habituels, des contrôles compensatoires adaptés permettent-ils néanmoins de détecter les activités anormales ?"
        },
        "partial": {
          "gapCode": "A8_16_LEGACY_MONITORING_PARTIAL",
          "gap": "A8_16_LEGACY_MONITORING_PARTIAL",
          "remediation": "Mettre monitoring réseau, logs externes ou autre contrôle compensatoire."
        },
        "absent": {
          "gapCode": "A8_16_LEGACY_MONITORING_ABSENT",
          "gap": "A8_16_LEGACY_MONITORING_ABSENT",
          "remediation": "Mettre monitoring réseau, logs externes ou autre contrôle compensatoire."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesManagedSecurityMonitoring",
        "question": {
          "fr": " La surveillance de sécurité du périmètre est-elle confiée en tout ou partie à un SOC, MDR ou autre prestataire externe ? ",
          "en": "Is in-scope security monitoring partly or fully provided by an external SOC, MDR, or other provider?"
        }
      },
      {
        "key": "hasLegacySystemsWithMonitoringLimitations",
        "question": {
          "fr": " Certains systèmes du périmètre présentent-ils des limitations empêchant la surveillance standard ou le déploiement d’agents modernes ? ",
          "en": "Do any in-scope systems have limitations that prevent standard monitoring or deployment of modern monitoring agents?"
        }
      }
    ]
  },
  {
    "id": "a8-17",
    "code": "A.8.17",
    "name": "Clock synchronisation",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_17_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organization defined approved time sources, the systems that must be synchronized, and required accuracy, timezone, or format requirements?",
          "fr": "Votre organisation a-t-elle défini les sources de temps approuvées, les systèmes devant être synchronisés et les exigences de précision, de fuseau ou de format nécessaires ?"
        },
        "partial": {
          "gapCode": "A8_17_TIME_POLICY_PARTIAL",
          "gap": "A8_17_TIME_POLICY_PARTIAL",
          "remediation": "Définir sources approuvées, portée, précision et convention de temps."
        },
        "absent": {
          "gapCode": "A8_17_TIME_POLICY_ABSENT",
          "gap": "A8_17_TIME_POLICY_ABSENT",
          "remediation": "Définir sources approuvées, portée, précision et convention de temps."
        }
      },
      {
        "id": "p8_17_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are relevant systems effectively synchronized with approved time sources, with synchronization drift or failures detected and corrected?",
          "fr": "Les systèmes pertinents sont-ils effectivement synchronisés avec des sources de temps approuvées et les écarts ou défaillances de synchronisation sont-ils détectés et corrigés ?"
        },
        "partial": {
          "gapCode": "A8_17_TIME_SYNC_PARTIAL",
          "gap": "A8_17_TIME_SYNC_PARTIAL",
          "remediation": "Configurer NTP/PTP ou équivalent et alertes de dérive/échec."
        },
        "absent": {
          "gapCode": "A8_17_TIME_SYNC_ABSENT",
          "gap": "A8_17_TIME_SYNC_ABSENT",
          "remediation": "Configurer NTP/PTP ou équivalent et alertes de dérive/échec."
        }
      },
      {
        "id": "p8_17_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does your organization retain evidence demonstrating configuration, monitoring, and timestamp consistency needed for event correlation and investigations?",
          "fr": "Votre organisation conserve-t-elle des preuves permettant de démontrer la configuration, la surveillance et la cohérence des horodatages nécessaires à la corrélation d’événements et aux investigations ?"
        },
        "partial": {
          "gapCode": "A8_17_TIME_EVIDENCE_PARTIAL",
          "gap": "A8_17_TIME_EVIDENCE_PARTIAL",
          "remediation": "Conserver configurations, métriques de dérive et tests de corrélation."
        },
        "absent": {
          "gapCode": "A8_17_TIME_EVIDENCE_ABSENT",
          "gap": "A8_17_TIME_EVIDENCE_ABSENT",
          "remediation": "Conserver configurations, métriques de dérive et tests de corrélation."
        }
      },
      {
        "id": "p8_17_004_legacy",
        "type": "conditional",
        "conditionKey": "hasSystemsWithoutStandardTimeSync",
        "question": {
          "en": "When some systems cannot use the standard synchronization mechanism, does an alternative method or compensating control provide sufficiently reliable timestamps?",
          "fr": "Lorsque certains systèmes ne peuvent pas utiliser le mécanisme standard de synchronisation, une méthode alternative ou un contrôle compensatoire garantit-il des horodatages suffisamment fiables ?"
        },
        "partial": {
          "gapCode": "A8_17_LEGACY_TIME_PARTIAL",
          "gap": "A8_17_LEGACY_TIME_PARTIAL",
          "remediation": "Documenter méthode alternative, compensation et tolérance acceptée."
        },
        "absent": {
          "gapCode": "A8_17_LEGACY_TIME_ABSENT",
          "gap": "A8_17_LEGACY_TIME_ABSENT",
          "remediation": "Documenter méthode alternative, compensation et tolérance acceptée."
        }
      }
    ],
    "quickContext": [
      {
        "key": "hasSystemsWithoutStandardTimeSync",
        "question": {
          "fr": " Certains systèmes pertinents du périmètre ne peuvent-ils pas utiliser la méthode standard de synchronisation horaire ? ",
          "en": "Are any relevant in-scope systems unable to use the standard time-synchronization method?"
        }
      }
    ]
  },
  {
    "id": "a8-18",
    "code": "A.8.18",
    "name": "Use of privileged utility programs",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_18_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organization identified utility programs capable of overriding security controls and defined who may use them, under what circumstances, and with what authorization?",
          "fr": "Votre organisation a-t-elle identifié les programmes utilitaires capables de contourner des contrôles de sécurité et défini qui peut les utiliser, dans quelles circonstances et selon quelles autorisations ?"
        },
        "partial": {
          "gapCode": "A8_18_UTILITY_GOVERNANCE_PARTIAL",
          "gap": "A8_18_UTILITY_GOVERNANCE_PARTIAL",
          "remediation": "Inventorier utilitaires privilégiés et formaliser autorisation/usage."
        },
        "absent": {
          "gapCode": "A8_18_UTILITY_GOVERNANCE_ABSENT",
          "gap": "A8_18_UTILITY_GOVERNANCE_ABSENT",
          "remediation": "Inventorier utilitaires privilégiés et formaliser autorisation/usage."
        }
      },
      {
        "id": "p8_18_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Is access to these utilities limited to authorized people and systems, separated from normal use, and controlled to prevent unnecessary or unauthorized use?",
          "fr": "L’accès à ces utilitaires est-il limité aux personnes et systèmes autorisés, séparé de l’usage courant et contrôlé afin d’empêcher une utilisation non nécessaire ou non autorisée ?"
        },
        "partial": {
          "gapCode": "A8_18_UTILITY_ACCESS_PARTIAL",
          "gap": "A8_18_UTILITY_ACCESS_PARTIAL",
          "remediation": "Restreindre installation/exécution, séparer comptes et appliquer allowlisting/JIT."
        },
        "absent": {
          "gapCode": "A8_18_UTILITY_ACCESS_ABSENT",
          "gap": "A8_18_UTILITY_ACCESS_ABSENT",
          "remediation": "Restreindre installation/exécution, séparer comptes et appliquer allowlisting/JIT."
        }
      },
      {
        "id": "p8_18_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are the installation and use of these utilities logged, reviewed, and traceable, with unauthorized tools or use appropriately handled?",
          "fr": "L’installation et l’utilisation de ces utilitaires sont-elles journalisées, revues et traçables, avec traitement des usages ou outils non autorisés ?"
        },
        "partial": {
          "gapCode": "A8_18_UTILITY_TRACEABILITY_PARTIAL",
          "gap": "A8_18_UTILITY_TRACEABILITY_PARTIAL",
          "remediation": "Journaliser usage, revoir logs et détecter utilitaires non approuvés."
        },
        "absent": {
          "gapCode": "A8_18_UTILITY_TRACEABILITY_ABSENT",
          "gap": "A8_18_UTILITY_TRACEABILITY_ABSENT",
          "remediation": "Journaliser usage, revoir logs et détecter utilitaires non approuvés."
        }
      },
      {
        "id": "p8_18_004_external_admin_tools",
        "type": "conditional",
        "conditionKey": "externalPartiesUsePrivilegedUtilities",
        "question": {
          "en": "When external providers use privileged administration or utility tools, is their access limited, approved, monitored, and revoked when no longer required?",
          "fr": "Lorsque des prestataires utilisent des outils d’administration ou utilitaires privilégiés, leur accès est-il limité, approuvé, surveillé et révoqué dès qu’il n’est plus nécessaire ?"
        },
        "partial": {
          "gapCode": "A8_18_EXTERNAL_UTILITY_PARTIAL",
          "gap": "A8_18_EXTERNAL_UTILITY_PARTIAL",
          "remediation": "Accès tiers temporaire, approuvé, MFA, monitoring et révocation."
        },
        "absent": {
          "gapCode": "A8_18_EXTERNAL_UTILITY_ABSENT",
          "gap": "A8_18_EXTERNAL_UTILITY_ABSENT",
          "remediation": "Accès tiers temporaire, approuvé, MFA, monitoring et révocation."
        }
      }
    ],
    "quickContext": [
      {
        "key": "externalPartiesUsePrivilegedUtilities",
        "question": {
          "fr": " Des prestataires externes utilisent-ils des outils d’administration ou utilitaires privilégiés dans le périmètre ? ",
          "en": "Do external providers use privileged administration or utility tools within the assessment scope?"
        }
      }
    ]
  },
  {
    "id": "a8-19",
    "code": "A.8.19",
    "name": "Installation of software on operational systems",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_19_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organization defined a process for authorizing, validating, testing, and deploying software on operational systems, with clear responsibilities and security criteria?",
          "fr": "Votre organisation a-t-elle défini un processus d’autorisation, de validation, de test et de déploiement des logiciels sur les systèmes opérationnels, avec des responsabilités et critères de sécurité clairs ?"
        },
        "partial": {
          "gapCode": "A8_19_SOFTWARE_PROCESS_PARTIAL",
          "gap": "A8_19_SOFTWARE_PROCESS_PARTIAL",
          "remediation": "Formaliser workflow d’approbation, test, déploiement et rollback."
        },
        "absent": {
          "gapCode": "A8_19_SOFTWARE_PROCESS_ABSENT",
          "gap": "A8_19_SOFTWARE_PROCESS_ABSENT",
          "remediation": "Formaliser workflow d’approbation, test, déploiement et rollback."
        }
      },
      {
        "id": "p8_19_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Is only approved software from trusted sources installed by authorized people or mechanisms, with restricted installation rights and appropriate rollback capability?",
          "fr": "Seuls des logiciels approuvés provenant de sources fiables sont-ils installés par des personnes ou mécanismes autorisés, avec des droits d’installation restreints et une capacité de retour arrière appropriée ?"
        },
        "partial": {
          "gapCode": "A8_19_SOFTWARE_CONTROL_PARTIAL",
          "gap": "A8_19_SOFTWARE_CONTROL_PARTIAL",
          "remediation": "Restreindre droits, sources, signature/intégrité et mécanismes de déploiement."
        },
        "absent": {
          "gapCode": "A8_19_SOFTWARE_CONTROL_ABSENT",
          "gap": "A8_19_SOFTWARE_CONTROL_ABSENT",
          "remediation": "Restreindre droits, sources, signature/intégrité et mécanismes de déploiement."
        }
      },
      {
        "id": "p8_19_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are installations, versions, approvals, tests, changes, and any rollbacks recorded so the actual software state of operational systems can be demonstrated?",
          "fr": "Les installations, versions, approbations, tests, changements et éventuels rollbacks sont-ils enregistrés et permettent-ils de démontrer l’état logiciel réel des systèmes opérationnels ?"
        },
        "partial": {
          "gapCode": "A8_19_SOFTWARE_TRACEABILITY_PARTIAL",
          "gap": "A8_19_SOFTWARE_TRACEABILITY_PARTIAL",
          "remediation": "Maintenir inventaire/versioning, logs, tickets d’approbation et preuves de test."
        },
        "absent": {
          "gapCode": "A8_19_SOFTWARE_TRACEABILITY_ABSENT",
          "gap": "A8_19_SOFTWARE_TRACEABILITY_ABSENT",
          "remediation": "Maintenir inventaire/versioning, logs, tickets d’approbation et preuves de test."
        }
      },
      {
        "id": "p8_19_004_local_admin",
        "type": "conditional",
        "conditionKey": "usersHaveLocalAdminInstallationRights",
        "question": {
          "en": "When some users have rights that allow software installation, are these exceptions justified, approved, limited, and supported by appropriate compensating controls?",
          "fr": "Lorsque certains utilisateurs disposent de droits permettant d’installer des logiciels, ces exceptions sont-elles justifiées, approuvées, limitées et compensées par des contrôles adaptés ?"
        },
        "partial": {
          "gapCode": "A8_19_LOCAL_ADMIN_PARTIAL",
          "gap": "A8_19_LOCAL_ADMIN_PARTIAL",
          "remediation": "Supprimer admin local par défaut ou formaliser exception et contrôle compensatoire."
        },
        "absent": {
          "gapCode": "A8_19_LOCAL_ADMIN_ABSENT",
          "gap": "A8_19_LOCAL_ADMIN_ABSENT",
          "remediation": "Supprimer admin local par défaut ou formaliser exception et contrôle compensatoire."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usersHaveLocalAdminInstallationRights",
        "question": {
          "fr": " Certains utilisateurs du périmètre disposent-ils de droits locaux ou équivalents permettant d’installer eux-mêmes des logiciels ? ",
          "en": "Do any in-scope users have local or equivalent rights that allow them to install software themselves?"
        }
      }
    ]
  },
  {
    "id": "a8-20",
    "code": "A.8.20",
    "name": "Networks security",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_20_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organization defined the architecture, responsibilities, and security requirements for in-scope networks and network devices, including configuration, administration, segmentation, and maintenance?",
          "fr": "Votre organisation a-t-elle défini l’architecture, les responsabilités et les exigences de sécurité applicables aux réseaux et équipements réseau du périmètre, notamment pour leur configuration, administration, segmentation et maintenance ?"
        },
        "partial": {
          "gapCode": "A8_20_NETWORK_GOVERNANCE_PARTIAL",
          "gap": "A8_20_NETWORK_GOVERNANCE_PARTIAL",
          "remediation": "Documenter architecture, baselines, ownership et règles d’administration."
        },
        "absent": {
          "gapCode": "A8_20_NETWORK_GOVERNANCE_ABSENT",
          "gap": "A8_20_NETWORK_GOVERNANCE_ABSENT",
          "remediation": "Documenter architecture, baselines, ownership et règles d’administration."
        }
      },
      {
        "id": "p8_20_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are networks and network devices effectively hardened, maintained, securely administered, and monitored to limit unauthorized access, interception, and lateral movement?",
          "fr": "Les réseaux et équipements réseau sont-ils effectivement durcis, maintenus, administrés de façon sécurisée et surveillés afin de limiter les accès non autorisés, l’interception et les mouvements latéraux ?"
        },
        "partial": {
          "gapCode": "A8_20_NETWORK_SECURITY_PARTIAL",
          "gap": "A8_20_NETWORK_SECURITY_PARTIAL",
          "remediation": "Durcir, patcher, MFA/admin sécurisé, segmentation et monitoring."
        },
        "absent": {
          "gapCode": "A8_20_NETWORK_SECURITY_ABSENT",
          "gap": "A8_20_NETWORK_SECURITY_ABSENT",
          "remediation": "Durcir, patcher, MFA/admin sécurisé, segmentation et monitoring."
        }
      },
      {
        "id": "p8_20_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does your organization retain diagrams, configurations, changes, logs, reviews, and control results demonstrating that network security remains controlled over time?",
          "fr": "Votre organisation conserve-t-elle des schémas, configurations, changements, journaux, revues et résultats de contrôle permettant de démontrer que la sécurité réseau reste maîtrisée dans le temps ?"
        },
        "partial": {
          "gapCode": "A8_20_NETWORK_TRACEABILITY_PARTIAL",
          "gap": "A8_20_NETWORK_TRACEABILITY_PARTIAL",
          "remediation": "Maintenir diagrams/config backups/logs/change records et revues périodiques."
        },
        "absent": {
          "gapCode": "A8_20_NETWORK_TRACEABILITY_ABSENT",
          "gap": "A8_20_NETWORK_TRACEABILITY_ABSENT",
          "remediation": "Maintenir diagrams/config backups/logs/change records et revues périodiques."
        }
      },
      {
        "id": "p8_20_004_hybrid",
        "type": "conditional",
        "conditionKey": "hasHybridCloudOnPremNetwork",
        "question": {
          "en": "When the network connects cloud and on-premises environments, are security controls consistent across interconnections and trust zones to avoid blind spots?",
          "fr": "Lorsque le réseau relie des environnements cloud et on-premise, les contrôles de sécurité sont-ils cohérents sur les interconnexions et les zones de confiance afin d’éviter les angles morts ?"
        },
        "partial": {
          "gapCode": "A8_20_HYBRID_NETWORK_PARTIAL",
          "gap": "A8_20_HYBRID_NETWORK_PARTIAL",
          "remediation": "Revoir interconnexions, trust boundaries, cloud firewall/security groups et visibilité."
        },
        "absent": {
          "gapCode": "A8_20_HYBRID_NETWORK_ABSENT",
          "gap": "A8_20_HYBRID_NETWORK_ABSENT",
          "remediation": "Revoir interconnexions, trust boundaries, cloud firewall/security groups et visibilité."
        }
      },
      {
        "id": "p8_20_005_legacy_network",
        "type": "conditional",
        "conditionKey": "hasUnsupportedNetworkDevices",
        "question": {
          "en": "When network devices are unsupported or can no longer receive required security updates, does a replacement plan or documented compensating controls reduce the risk?",
          "fr": "Lorsque des équipements réseau ne sont plus supportés ou ne peuvent plus recevoir les correctifs nécessaires, un plan de remplacement ou des mesures compensatoires documentées réduisent-ils le risque ?"
        },
        "partial": {
          "gapCode": "A8_20_LEGACY_NETWORK_PARTIAL",
          "gap": "A8_20_LEGACY_NETWORK_PARTIAL",
          "remediation": "Remplacer ou isoler les équipements EOL, réduire services et renforcer surveillance."
        },
        "absent": {
          "gapCode": "A8_20_LEGACY_NETWORK_ABSENT",
          "gap": "A8_20_LEGACY_NETWORK_ABSENT",
          "remediation": "Remplacer ou isoler les équipements EOL, réduire services et renforcer surveillance."
        }
      }
    ],
    "quickContext": [
      {
        "key": "hasHybridCloudOnPremNetwork",
        "question": {
          "fr": " Le périmètre comprend-il un réseau hybride reliant des environnements cloud et on-premise ? ",
          "en": "Does the assessment scope include a hybrid network connecting cloud and on-premises environments?"
        }
      },
      {
        "key": "hasUnsupportedNetworkDevices",
        "question": {
          "fr": " Certains équipements réseau du périmètre sont-ils en fin de support ou incapables de recevoir les correctifs de sécurité nécessaires ? ",
          "en": "Are any in-scope network devices end-of-support or unable to receive required security updates?"
        }
      }
    ]
  },
  {
    "id": "a8-21",
    "code": "A.8.21",
    "name": "Security of network services",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_21_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organization identified relevant network services and defined the required security requirements, protection mechanisms, responsibilities, and service levels for each?",
          "fr": "Votre organisation a-t-elle identifié les services réseau pertinents et défini pour chacun les exigences de sécurité, mécanismes de protection, responsabilités et niveaux de service nécessaires ?"
        },
        "partial": {
          "gapCode": "A8_21_SERVICE_REQUIREMENTS_PARTIAL",
          "gap": "A8_21_SERVICE_REQUIREMENTS_PARTIAL",
          "remediation": "Inventorier services et définir exigences, mécanismes, SLA et ownership."
        },
        "absent": {
          "gapCode": "A8_21_SERVICE_REQUIREMENTS_ABSENT",
          "gap": "A8_21_SERVICE_REQUIREMENTS_ABSENT",
          "remediation": "Inventorier services et définir exigences, mécanismes, SLA et ownership."
        }
      },
      {
        "id": "p8_21_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are required network-service security mechanisms—including access control, authentication, encryption, connection restrictions, and availability—effectively implemented?",
          "fr": "Les mécanismes de sécurité requis pour les services réseau — notamment contrôle d’accès, authentification, chiffrement, restrictions de connexion et disponibilité — sont-ils effectivement mis en œuvre ?"
        },
        "partial": {
          "gapCode": "A8_21_SERVICE_SECURITY_PARTIAL",
          "gap": "A8_21_SERVICE_SECURITY_PARTIAL",
          "remediation": "Implémenter accès, auth, chiffrement, restrictions et contrôles de disponibilité."
        },
        "absent": {
          "gapCode": "A8_21_SERVICE_SECURITY_ABSENT",
          "gap": "A8_21_SERVICE_SECURITY_ABSENT",
          "remediation": "Implémenter accès, auth, chiffrement, restrictions et contrôles de disponibilité."
        }
      },
      {
        "id": "p8_21_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are network-service security requirements and service levels monitored and reviewed, with evidence of performance, incidents, deviations, and corrective actions?",
          "fr": "Les niveaux de service et exigences de sécurité des services réseau sont-ils surveillés et revus, avec des preuves des performances, incidents, écarts et actions correctives ?"
        },
        "partial": {
          "gapCode": "A8_21_SERVICE_MONITORING_PARTIAL",
          "gap": "A8_21_SERVICE_MONITORING_PARTIAL",
          "remediation": "Mettre KPI/SLA, revues, incident tracking et actions correctives."
        },
        "absent": {
          "gapCode": "A8_21_SERVICE_MONITORING_ABSENT",
          "gap": "A8_21_SERVICE_MONITORING_ABSENT",
          "remediation": "Mettre KPI/SLA, revues, incident tracking et actions correctives."
        }
      },
      {
        "id": "p8_21_004_external_services",
        "type": "conditional",
        "conditionKey": "usesExternalNetworkServiceProviders",
        "question": {
          "en": "When network services are provided by third parties, are security requirements, service levels, responsibilities, incident notification, and assurance rights formally defined and monitored?",
          "fr": "Lorsque des services réseau sont fournis par des tiers, les exigences de sécurité, niveaux de service, responsabilités, notification d’incident et droits de contrôle sont-ils formalisés et suivis ?"
        },
        "partial": {
          "gapCode": "A8_21_EXTERNAL_SERVICE_PARTIAL",
          "gap": "A8_21_EXTERNAL_SERVICE_PARTIAL",
          "remediation": "Contractualiser sécurité/SLA/responsabilités, obtenir preuves et revue fournisseur."
        },
        "absent": {
          "gapCode": "A8_21_EXTERNAL_SERVICE_ABSENT",
          "gap": "A8_21_EXTERNAL_SERVICE_ABSENT",
          "remediation": "Contractualiser sécurité/SLA/responsabilités, obtenir preuves et revue fournisseur."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesExternalNetworkServiceProviders",
        "question": {
          "fr": " Des services réseau du périmètre sont-ils fournis ou gérés par des fournisseurs externes ? ",
          "en": "Are any in-scope network services provided or managed by external providers?"
        }
      }
    ]
  },
  {
    "id": "a8-22",
    "code": "A.8.22",
    "name": "Segregation of networks",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_22_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined risk-based network segregation requirements, including the zones, trust boundaries, permitted inter-zone flows, responsibilities and review rules?",
          "fr": "Votre organisation a-t-elle défini des exigences de séparation réseau fondées sur les risques, incluant les zones, frontières de confiance, flux inter-zones autorisés, responsabilités et règles de revue ?"
        },
        "partial": {
          "gapCode": "A8_22_SEGREGATION_GOVERNANCE_PARTIAL",
          "gap": "Network-segregation requirements are incomplete, outdated or not consistently risk-based.",
          "remediation": "Complete and approve a current network-segregation standard covering zones, trust levels, permitted flows, owners, exceptions and review triggers."
        },
        "absent": {
          "gapCode": "A8_22_SEGREGATION_GOVERNANCE_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Network-segregation requirements are incomplete, outdated or not consistently risk-based.",
          "remediation": "Complete and approve a current network-segregation standard covering zones, trust levels, permitted flows, owners, exceptions and review triggers."
        }
      },
      {
        "id": "p8_22_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are network segments and the controls between them implemented so that only necessary and authorised communications are permitted between users, systems and services?",
          "fr": "Les segments réseau et les contrôles entre eux sont-ils mis en œuvre de façon à n’autoriser que les communications nécessaires et autorisées entre utilisateurs, systèmes et services ?"
        },
        "partial": {
          "gapCode": "A8_22_SEGREGATION_IMPLEMENTATION_PARTIAL",
          "gap": "Segmentation exists but some zones, critical systems or inter-segment flows are insufficiently isolated or overly permissive.",
          "remediation": "Close identified flat-network or overly permissive paths, implement filtering at trust boundaries and apply least-privilege inter-zone communication."
        },
        "absent": {
          "gapCode": "A8_22_SEGREGATION_IMPLEMENTATION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Segmentation exists but some zones, critical systems or inter-segment flows are insufficiently isolated or overly permissive.",
          "remediation": "Close identified flat-network or overly permissive paths, implement filtering at trust boundaries and apply least-privilege inter-zone communication."
        }
      },
      {
        "id": "p8_22_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does your organisation retain evidence that network segregation reflects the current architecture and is periodically reviewed and tested for effectiveness?",
          "fr": "Votre organisation conserve-t-elle des preuves démontrant que la séparation réseau reflète l’architecture réelle et qu’elle est périodiquement revue et testée quant à son efficacité ?"
        },
        "partial": {
          "gapCode": "A8_22_SEGREGATION_ASSURANCE_PARTIAL",
          "gap": "Evidence of review or testing exists but is incomplete, infrequent or does not cover all important segments.",
          "remediation": "Establish recurring architecture reconciliation, rule review and segmentation testing with tracked findings and corrective actions."
        },
        "absent": {
          "gapCode": "A8_22_SEGREGATION_ASSURANCE_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Evidence of review or testing exists but is incomplete, infrequent or does not cover all important segments.",
          "remediation": "Establish recurring architecture reconciliation, rule review and segmentation testing with tracked findings and corrective actions."
        }
      },
      {
        "id": "p8_22_004_ot_iot",
        "type": "conditional",
        "conditionKey": "usesOTIoT",
        "question": {
          "en": "Where OT or IoT environments are used, are they appropriately segregated from general IT networks and are necessary communications tightly controlled?",
          "fr": "Lorsque des environnements OT ou IoT sont utilisés, sont-ils correctement séparés des réseaux IT généraux et les communications nécessaires sont-elles strictement contrôlées ?"
        },
        "partial": {
          "gapCode": "A8_22_OT_IOT_SEGREGATION_PARTIAL",
          "gap": "OT/IoT isolation exists but has uncontrolled pathways, broad rules or undocumented exceptions.",
          "remediation": "Define OT/IoT trust boundaries, restrict conduits, document required flows and add monitoring or compensating controls for hard-to-patch devices."
        },
        "absent": {
          "gapCode": "A8_22_OT_IOT_SEGREGATION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. OT/IoT isolation exists but has uncontrolled pathways, broad rules or undocumented exceptions.",
          "remediation": "Define OT/IoT trust boundaries, restrict conduits, document required flows and add monitoring or compensating controls for hard-to-patch devices."
        }
      },
      {
        "id": "p8_22_005_cloud",
        "type": "conditional",
        "conditionKey": "usesCloudInfrastructure",
        "question": {
          "en": "Where cloud environments are used, is logical segregation implemented through separate network boundaries and appropriately restricted security rules?",
          "fr": "Lorsque des environnements cloud sont utilisés, la séparation logique est-elle mise en œuvre au moyen de frontières réseau distinctes et de règles de sécurité correctement restrictives ?"
        },
        "partial": {
          "gapCode": "A8_22_CLOUD_SEGREGATION_PARTIAL",
          "gap": "Cloud segmentation is present but inconsistent across accounts, VPCs/VNets, projects, subnets or security groups.",
          "remediation": "Align cloud network boundaries and security groups with the approved segregation model and continuously review overly broad rules."
        },
        "absent": {
          "gapCode": "A8_22_CLOUD_SEGREGATION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Cloud segmentation is present but inconsistent across accounts, VPCs/VNets, projects, subnets or security groups.",
          "remediation": "Align cloud network boundaries and security groups with the approved segregation model and continuously review overly broad rules."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesOTIoT",
        "question": {
          "en": "Does the assessment scope include operational technology (OT) or IoT devices connected to organisational networks?",
          "fr": "Le périmètre de l’évaluation comprend-il des technologies opérationnelles (OT) ou des équipements IoT connectés aux réseaux de l’organisation ?"
        }
      },
      {
        "key": "usesCloudInfrastructure",
        "question": {
          "en": "Does the assessment scope use cloud network infrastructure such as VPCs, VNets, cloud subnets or security groups?",
          "fr": "Le périmètre utilise-t-il une infrastructure réseau cloud telle que VPC, VNet, sous-réseaux cloud ou groupes de sécurité ?"
        }
      }
    ]
  },
  {
    "id": "a8-23",
    "code": "A.8.23",
    "name": "Web filtering",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_23_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined risk-based web-access and filtering rules, including blocked categories, approved exceptions, responsibilities and review requirements?",
          "fr": "Votre organisation a-t-elle défini des règles d’accès et de filtrage web fondées sur les risques, incluant les catégories bloquées, exceptions autorisées, responsabilités et exigences de revue ?"
        },
        "partial": {
          "gapCode": "A8_23_WEB_FILTER_POLICY_PARTIAL",
          "gap": "Web-filtering rules exist but are incomplete, rely only on vendor defaults or lack a controlled exception/review process.",
          "remediation": "Define and approve risk-based web-filtering categories, exception criteria, owners, review frequency and user reporting paths."
        },
        "absent": {
          "gapCode": "A8_23_WEB_FILTER_POLICY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Web-filtering rules exist but are incomplete, rely only on vendor defaults or lack a controlled exception/review process.",
          "remediation": "Define and approve risk-based web-filtering categories, exception criteria, owners, review frequency and user reporting paths."
        }
      },
      {
        "id": "p8_23_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Is web filtering technically enforced on relevant users and devices to block access to known or suspected malicious web resources?",
          "fr": "Le filtrage web est-il techniquement appliqué aux utilisateurs et appareils concernés afin de bloquer l’accès aux ressources web connues ou suspectées d’être malveillantes ?"
        },
        "partial": {
          "gapCode": "A8_23_WEB_FILTER_IMPLEMENTATION_PARTIAL",
          "gap": "Filtering is deployed but coverage, categories, threat intelligence or enforcement is inconsistent.",
          "remediation": "Extend filtering to all relevant endpoints and browsing paths, enable current malicious-domain/category protections and address bypass routes."
        },
        "absent": {
          "gapCode": "A8_23_WEB_FILTER_IMPLEMENTATION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Filtering is deployed but coverage, categories, threat intelligence or enforcement is inconsistent.",
          "remediation": "Extend filtering to all relevant endpoints and browsing paths, enable current malicious-domain/category protections and address bypass routes."
        }
      },
      {
        "id": "p8_23_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are web-filtering blocks, rule changes and exceptions logged and periodically reviewed so that the organisation can demonstrate effective operation and justified bypasses?",
          "fr": "Les blocages, modifications de règles et exceptions de filtrage web sont-ils journalisés et périodiquement revus afin de démontrer l’efficacité du contrôle et la justification des contournements ?"
        },
        "partial": {
          "gapCode": "A8_23_WEB_FILTER_TRACEABILITY_PARTIAL",
          "gap": "Logs or exception records exist but are incomplete, not reviewed or not retained sufficiently for audit and investigation.",
          "remediation": "Retain filtering and change logs, require documented exception approval and expiry, and perform periodic effectiveness reviews."
        },
        "absent": {
          "gapCode": "A8_23_WEB_FILTER_TRACEABILITY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Logs or exception records exist but are incomplete, not reviewed or not retained sufficiently for audit and investigation.",
          "remediation": "Retain filtering and change logs, require documented exception approval and expiry, and perform periodic effectiveness reviews."
        }
      },
      {
        "id": "p8_23_004_remote",
        "type": "conditional",
        "conditionKey": "usesRemoteWork",
        "question": {
          "en": "Where users browse the web from outside organisation-controlled networks, does equivalent web filtering remain effective on those devices or sessions?",
          "fr": "Lorsque les utilisateurs naviguent depuis des réseaux hors du contrôle de l’organisation, un filtrage web équivalent reste-t-il effectif sur ces appareils ou sessions ?"
        },
        "partial": {
          "gapCode": "A8_23_REMOTE_FILTERING_PARTIAL",
          "gap": "Remote filtering exists only for some devices or depends on users always connecting through a corporate network path.",
          "remediation": "Deploy endpoint, secure web gateway, DNS or always-on secure-access controls so off-premises browsing receives equivalent protection."
        },
        "absent": {
          "gapCode": "A8_23_REMOTE_FILTERING_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Remote filtering exists only for some devices or depends on users always connecting through a corporate network path.",
          "remediation": "Deploy endpoint, secure web gateway, DNS or always-on secure-access controls so off-premises browsing receives equivalent protection."
        }
      },
      {
        "id": "p8_23_005_exceptions",
        "type": "conditional",
        "conditionKey": "hasWebFilteringExceptions",
        "question": {
          "en": "Where business roles require access to normally restricted websites, are exceptions explicitly approved, scoped, monitored and periodically revalidated?",
          "fr": "Lorsque certaines fonctions métier nécessitent l’accès à des sites normalement restreints, les exceptions sont-elles explicitement approuvées, limitées, surveillées et périodiquement revalidées ?"
        },
        "partial": {
          "gapCode": "A8_23_WEB_EXCEPTIONS_PARTIAL",
          "gap": "Exceptions are granted but are broad, permanent, weakly justified or not periodically reviewed.",
          "remediation": "Implement time-bound, least-privilege exceptions with owner approval, logging, user accountability and scheduled revalidation."
        },
        "absent": {
          "gapCode": "A8_23_WEB_EXCEPTIONS_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Exceptions are granted but are broad, permanent, weakly justified or not periodically reviewed.",
          "remediation": "Implement time-bound, least-privilege exceptions with owner approval, logging, user accountability and scheduled revalidation."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesRemoteWork",
        "question": {
          "en": "Do in-scope users browse the web from outside organisation-controlled networks, including remote or mobile working?",
          "fr": "Des utilisateurs du périmètre naviguent-ils sur le web depuis des réseaux hors du contrôle de l’organisation, notamment en télétravail ou mobilité ?"
        }
      },
      {
        "key": "hasWebFilteringExceptions",
        "question": {
          "en": "Do any business roles require approved access to websites or categories that are normally restricted?",
          "fr": "Certaines fonctions métier nécessitent-elles un accès approuvé à des sites ou catégories normalement restreints ?"
        }
      }
    ]
  },
  {
    "id": "a8-24",
    "code": "A.8.24",
    "name": "Use of cryptography",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_24_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined and approved rules for when cryptography must be used, the approved algorithms and strengths, and the responsibilities for cryptographic and key management?",
          "fr": "Votre organisation a-t-elle défini et approuvé quand la cryptographie doit être utilisée, les algorithmes et niveaux de robustesse autorisés, ainsi que les responsabilités de gestion cryptographique et des clés ?"
        },
        "partial": {
          "gapCode": "A8_24_CRYPTO_POLICY_PARTIAL",
          "gap": "Cryptographic requirements exist but are incomplete, outdated or do not cover all relevant data states and use cases.",
          "remediation": "Create or update a topic-specific cryptography standard covering use cases, approved algorithms, key sizes, protocols, roles, legal constraints and review triggers."
        },
        "absent": {
          "gapCode": "A8_24_CRYPTO_POLICY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Cryptographic requirements exist but are incomplete, outdated or do not cover all relevant data states and use cases.",
          "remediation": "Create or update a topic-specific cryptography standard covering use cases, approved algorithms, key sizes, protocols, roles, legal constraints and review triggers."
        }
      },
      {
        "id": "p8_24_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are approved cryptographic controls actually implemented where required for information at rest, in transit and other relevant processing contexts?",
          "fr": "Les contrôles cryptographiques approuvés sont-ils effectivement mis en œuvre lorsque requis pour les informations au repos, en transit et dans les autres contextes de traitement pertinents ?"
        },
        "partial": {
          "gapCode": "A8_24_CRYPTO_IMPLEMENTATION_PARTIAL",
          "gap": "Cryptography is used but coverage or technical strength is inconsistent, or deprecated algorithms/protocols remain in relevant use.",
          "remediation": "Identify unprotected or weak use cases, migrate to approved cryptographic configurations and document risk-accepted exceptions."
        },
        "absent": {
          "gapCode": "A8_24_CRYPTO_IMPLEMENTATION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Cryptography is used but coverage or technical strength is inconsistent, or deprecated algorithms/protocols remain in relevant use.",
          "remediation": "Identify unprotected or weak use cases, migrate to approved cryptographic configurations and document risk-accepted exceptions."
        }
      },
      {
        "id": "p8_24_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Is the cryptographic-key and certificate lifecycle controlled and evidenced from generation and distribution through storage, rotation, compromise handling, revocation, recovery and destruction?",
          "fr": "Le cycle de vie des clés cryptographiques et certificats est-il maîtrisé et démontrable depuis la génération et distribution jusqu’au stockage, à la rotation, au traitement d’une compromission, à la révocation, récupération et destruction ?"
        },
        "partial": {
          "gapCode": "A8_24_KEY_LIFECYCLE_PARTIAL",
          "gap": "Key-management controls exist but one or more lifecycle stages, access logs, inventories or review records are incomplete.",
          "remediation": "Centralise key/certificate inventory and management, restrict access, log key operations, define rotation/revocation and test compromise/recovery procedures."
        },
        "absent": {
          "gapCode": "A8_24_KEY_LIFECYCLE_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Key-management controls exist but one or more lifecycle stages, access logs, inventories or review records are incomplete.",
          "remediation": "Centralise key/certificate inventory and management, restrict access, log key operations, define rotation/revocation and test compromise/recovery procedures."
        }
      },
      {
        "id": "p8_24_004_regulated",
        "type": "conditional",
        "conditionKey": "hasRegulatedCryptoRequirements",
        "question": {
          "en": "Where information is subject to sector, legal, regulatory or contractual cryptographic requirements, are those specific requirements identified and implemented?",
          "fr": "Lorsque des informations sont soumises à des exigences cryptographiques sectorielles, légales, réglementaires ou contractuelles, ces exigences spécifiques sont-elles identifiées et appliquées ?"
        },
        "partial": {
          "gapCode": "A8_24_REGULATED_CRYPTO_PARTIAL",
          "gap": "Some applicable cryptographic obligations are known but are not fully mapped to controls or evidence.",
          "remediation": "Maintain an obligation-to-control mapping and remediate cryptographic configurations that do not meet applicable mandatory requirements."
        },
        "absent": {
          "gapCode": "A8_24_REGULATED_CRYPTO_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Some applicable cryptographic obligations are known but are not fully mapped to controls or evidence.",
          "remediation": "Maintain an obligation-to-control mapping and remediate cryptographic configurations that do not meet applicable mandatory requirements."
        }
      },
      {
        "id": "p8_24_005_managed_kms",
        "type": "conditional",
        "conditionKey": "usesManagedKMS",
        "question": {
          "en": "Where cryptographic keys are managed by a cloud or external key-management provider, are shared responsibilities, access controls, key ownership and evidence requirements clearly defined?",
          "fr": "Lorsque des clés cryptographiques sont gérées par un fournisseur cloud ou un service externe de gestion de clés, les responsabilités partagées, contrôles d’accès, propriété des clés et exigences de preuve sont-ils clairement définis ?"
        },
        "partial": {
          "gapCode": "A8_24_EXTERNAL_KMS_PARTIAL",
          "gap": "External KMS is used but ownership, provider/customer duties, access model or recovery/exit arrangements are unclear.",
          "remediation": "Document the shared-responsibility model, configure least privilege and separation of duties, retain provider evidence and define key recovery/exit arrangements."
        },
        "absent": {
          "gapCode": "A8_24_EXTERNAL_KMS_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. External KMS is used but ownership, provider/customer duties, access model or recovery/exit arrangements are unclear.",
          "remediation": "Document the shared-responsibility model, configure least privilege and separation of duties, retain provider evidence and define key recovery/exit arrangements."
        }
      }
    ],
    "quickContext": [
      {
        "key": "hasRegulatedCryptoRequirements",
        "question": {
          "en": "Is in-scope information subject to sector, legal, regulatory or contractual requirements that specify cryptographic protections?",
          "fr": "Les informations du périmètre sont-elles soumises à des exigences sectorielles, légales, réglementaires ou contractuelles imposant des protections cryptographiques ?"
        }
      },
      {
        "key": "usesManagedKMS",
        "question": {
          "en": "Are any in-scope cryptographic keys managed through a cloud or external managed key service?",
          "fr": "Des clés cryptographiques du périmètre sont-elles gérées via un service cloud ou externe de gestion de clés ?"
        }
      }
    ]
  },
  {
    "id": "a8-25",
    "code": "A.8.25",
    "name": "Secure development life cycle",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_25_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined and approved a secure development life cycle that integrates security activities, responsibilities and decision points throughout system and software development?",
          "fr": "Votre organisation a-t-elle défini et approuvé un cycle de développement sécurisé intégrant les activités de sécurité, responsabilités et points de décision tout au long du développement des systèmes et logiciels ?"
        },
        "partial": {
          "gapCode": "A8_25_SDLC_GOVERNANCE_PARTIAL",
          "gap": "A development process exists but security activities or ownership are incomplete or applied inconsistently across lifecycle stages.",
          "remediation": "Formalise a secure-development methodology with security activities, roles, required artefacts and gates from planning through maintenance."
        },
        "absent": {
          "gapCode": "A8_25_SDLC_GOVERNANCE_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. A development process exists but security activities or ownership are incomplete or applied inconsistently across lifecycle stages.",
          "remediation": "Formalise a secure-development methodology with security activities, roles, required artefacts and gates from planning through maintenance."
        }
      },
      {
        "id": "p8_25_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are security requirements, secure design and coding practices, testing, controlled environments and change controls integrated into actual development workflows before production release?",
          "fr": "Les exigences de sécurité, pratiques de conception et codage sécurisés, tests, environnements contrôlés et gestion des changements sont-ils intégrés aux workflows de développement réels avant mise en production ?"
        },
        "partial": {
          "gapCode": "A8_25_SDLC_APPLICATION_PARTIAL",
          "gap": "Some secure-development activities are used, but important projects or lifecycle stages can bypass them.",
          "remediation": "Embed mandatory security gates and automated/manual checks in the development and deployment workflow and define governed exception handling."
        },
        "absent": {
          "gapCode": "A8_25_SDLC_APPLICATION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Some secure-development activities are used, but important projects or lifecycle stages can bypass them.",
          "remediation": "Embed mandatory security gates and automated/manual checks in the development and deployment workflow and define governed exception handling."
        }
      },
      {
        "id": "p8_25_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Can the organisation demonstrate, for sampled developments or significant changes, that required security activities were completed and findings were resolved or formally accepted before release?",
          "fr": "L’organisation peut-elle démontrer, pour un échantillon de développements ou changements significatifs, que les activités de sécurité requises ont été réalisées et que les constats ont été corrigés ou formellement acceptés avant livraison ?"
        },
        "partial": {
          "gapCode": "A8_25_SDLC_EVIDENCE_PARTIAL",
          "gap": "Secure-development evidence exists but is fragmented, missing for some releases or not linked to risk acceptance and remediation.",
          "remediation": "Retain release-linked evidence for requirements, design reviews, scans/tests, approvals, exceptions and remediation closure."
        },
        "absent": {
          "gapCode": "A8_25_SDLC_EVIDENCE_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Secure-development evidence exists but is fragmented, missing for some releases or not linked to risk acceptance and remediation.",
          "remediation": "Retain release-linked evidence for requirements, design reviews, scans/tests, approvals, exceptions and remediation closure."
        }
      },
      {
        "id": "p8_25_004_external_products",
        "type": "conditional",
        "conditionKey": "developsForExternalCustomers",
        "question": {
          "en": "Where the organisation develops software or systems for external customers, are customer, contractual and product-security requirements integrated into the secure development life cycle?",
          "fr": "Lorsque l’organisation développe des logiciels ou systèmes pour des clients externes, les exigences client, contractuelles et de sécurité produit sont-elles intégrées au cycle de développement sécurisé ?"
        },
        "partial": {
          "gapCode": "A8_25_CUSTOMER_SDLC_PARTIAL",
          "gap": "Customer security requirements are considered inconsistently or too late in the lifecycle.",
          "remediation": "Create traceable intake and validation of customer security obligations and connect them to design, test and release criteria."
        },
        "absent": {
          "gapCode": "A8_25_CUSTOMER_SDLC_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Customer security requirements are considered inconsistently or too late in the lifecycle.",
          "remediation": "Create traceable intake and validation of customer security obligations and connect them to design, test and release criteria."
        }
      },
      {
        "id": "p8_25_005_devops",
        "type": "conditional",
        "conditionKey": "usesAgileDevOps",
        "question": {
          "en": "Where Agile, DevOps or continuous delivery is used, are security controls integrated continuously into the pipeline rather than relying mainly on end-stage review?",
          "fr": "Lorsque Agile, DevOps ou la livraison continue est utilisé, les contrôles de sécurité sont-ils intégrés en continu dans le pipeline plutôt que de reposer principalement sur une revue en fin de cycle ?"
        },
        "partial": {
          "gapCode": "A8_25_DEVSECOPS_PARTIAL",
          "gap": "Security checks exist but are manual, late, bypassable or not consistently enforced in CI/CD.",
          "remediation": "Integrate policy-as-code or pipeline security gates, automated testing and controlled approvals with auditable override handling."
        },
        "absent": {
          "gapCode": "A8_25_DEVSECOPS_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Security checks exist but are manual, late, bypassable or not consistently enforced in CI/CD.",
          "remediation": "Integrate policy-as-code or pipeline security gates, automated testing and controlled approvals with auditable override handling."
        }
      }
    ],
    "quickContext": [
      {
        "key": "developsForExternalCustomers",
        "question": {
          "en": "Does the organisation develop software or systems intended for external customers?",
          "fr": "L’organisation développe-t-elle des logiciels ou systèmes destinés à des clients externes ?"
        }
      },
      {
        "key": "usesAgileDevOps",
        "question": {
          "en": "Does the organisation use Agile, DevOps or continuous delivery for in-scope development?",
          "fr": "L’organisation utilise-t-elle Agile, DevOps ou la livraison continue pour les développements du périmètre ?"
        }
      }
    ]
  },
  {
    "id": "a8-26",
    "code": "A.8.26",
    "name": "Application security requirements",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_26_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined how application security requirements are identified, documented, approved and maintained for new applications and significant changes?",
          "fr": "Votre organisation a-t-elle défini comment les exigences de sécurité applicative sont identifiées, documentées, approuvées et maintenues pour les nouvelles applications et changements significatifs ?"
        },
        "partial": {
          "gapCode": "A8_26_APP_REQ_PROCESS_PARTIAL",
          "gap": "A requirements process exists but security requirements are optional, incomplete or introduced too late.",
          "remediation": "Adopt a reusable security-requirements baseline and require risk-based tailoring and approval before design/build or purchase."
        },
        "absent": {
          "gapCode": "A8_26_APP_REQ_PROCESS_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. A requirements process exists but security requirements are optional, incomplete or introduced too late.",
          "remediation": "Adopt a reusable security-requirements baseline and require risk-based tailoring and approval before design/build or purchase."
        }
      },
      {
        "id": "p8_26_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Do application security requirements address the relevant risks, including authentication, authorisation, session management, input/output handling, cryptography, logging, error handling, availability and secure integration where applicable?",
          "fr": "Les exigences de sécurité applicative couvrent-elles les risques pertinents, notamment authentification, autorisation, gestion de session, traitement des entrées/sorties, cryptographie, journalisation, erreurs, disponibilité et intégrations sécurisées lorsque applicable ?"
        },
        "partial": {
          "gapCode": "A8_26_APP_REQ_COVERAGE_PARTIAL",
          "gap": "Security requirements are defined but omit important risk areas for some application types.",
          "remediation": "Perform risk-based requirements review and close missing security domains for each application architecture and data classification."
        },
        "absent": {
          "gapCode": "A8_26_APP_REQ_COVERAGE_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Security requirements are defined but omit important risk areas for some application types.",
          "remediation": "Perform risk-based requirements review and close missing security domains for each application architecture and data classification."
        }
      },
      {
        "id": "p8_26_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are approved security requirements traceable through implementation and acceptance testing so that the organisation can demonstrate they were satisfied before release or acquisition acceptance?",
          "fr": "Les exigences de sécurité approuvées sont-elles traçables jusqu’à leur implémentation et aux tests de recette afin de démontrer qu’elles ont été satisfaites avant mise en service ou acceptation d’un achat ?"
        },
        "partial": {
          "gapCode": "A8_26_APP_REQ_TRACEABILITY_PARTIAL",
          "gap": "Traceability exists only for some requirements or applications, or evidence does not prove acceptance criteria were met.",
          "remediation": "Implement a requirements-to-test traceability matrix and retain evidence of security acceptance and approved deviations."
        },
        "absent": {
          "gapCode": "A8_26_APP_REQ_TRACEABILITY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Traceability exists only for some requirements or applications, or evidence does not prove acceptance criteria were met.",
          "remediation": "Implement a requirements-to-test traceability matrix and retain evidence of security acceptance and approved deviations."
        }
      },
      {
        "id": "p8_26_004_personal_data",
        "type": "conditional",
        "conditionKey": "applicationsProcessPersonalData",
        "question": {
          "en": "Where an application processes personal or other privacy-sensitive information, are privacy and data-protection requirements incorporated into the application requirements from design onward?",
          "fr": "Lorsqu’une application traite des données personnelles ou sensibles au regard de la vie privée, les exigences de confidentialité et protection des données sont-elles intégrées aux exigences applicatives dès la conception ?"
        },
        "partial": {
          "gapCode": "A8_26_PRIVACY_REQUIREMENTS_PARTIAL",
          "gap": "Privacy requirements are present but incomplete or added after key design decisions.",
          "remediation": "Integrate applicable privacy requirements such as minimisation, purpose limitation, retention, access/deletion and privacy controls into design and acceptance."
        },
        "absent": {
          "gapCode": "A8_26_PRIVACY_REQUIREMENTS_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Privacy requirements are present but incomplete or added after key design decisions.",
          "remediation": "Integrate applicable privacy requirements such as minimisation, purpose limitation, retention, access/deletion and privacy controls into design and acceptance."
        }
      },
      {
        "id": "p8_26_005_internet",
        "type": "conditional",
        "conditionKey": "hasInternetFacingApplications",
        "question": {
          "en": "Where an application is exposed to the public Internet, are enhanced security requirements defined for its external attack surface and availability risks?",
          "fr": "Lorsqu’une application est exposée publiquement sur Internet, des exigences de sécurité renforcées sont-elles définies pour sa surface d’attaque externe et ses risques de disponibilité ?"
        },
        "partial": {
          "gapCode": "A8_26_INTERNET_APP_REQUIREMENTS_PARTIAL",
          "gap": "Internet-facing applications have generic requirements but lack controls proportionate to public exposure.",
          "remediation": "Define enhanced requirements for strong authentication where appropriate, secure edge controls, rate limiting, DDoS resilience, logging and external security testing."
        },
        "absent": {
          "gapCode": "A8_26_INTERNET_APP_REQUIREMENTS_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Internet-facing applications have generic requirements but lack controls proportionate to public exposure.",
          "remediation": "Define enhanced requirements for strong authentication where appropriate, secure edge controls, rate limiting, DDoS resilience, logging and external security testing."
        }
      }
    ],
    "quickContext": [
      {
        "key": "applicationsProcessPersonalData",
        "question": {
          "en": "Do in-scope applications process personal data or other privacy-sensitive information?",
          "fr": "Des applications du périmètre traitent-elles des données personnelles ou d’autres informations sensibles au regard de la vie privée ?"
        }
      },
      {
        "key": "hasInternetFacingApplications",
        "question": {
          "en": "Are any in-scope applications publicly accessible from the Internet?",
          "fr": "Des applications du périmètre sont-elles accessibles publiquement depuis Internet ?"
        }
      }
    ]
  },
  {
    "id": "a8-27",
    "code": "A.8.27",
    "name": "Secure system architecture and engineering principles",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_27_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation established, documented and maintained secure system architecture and engineering principles appropriate to its technologies and risks?",
          "fr": "Votre organisation a-t-elle établi, documenté et maintenu des principes d’architecture et d’ingénierie sécurisées adaptés à ses technologies et risques ?"
        },
        "partial": {
          "gapCode": "A8_27_ARCH_PRINCIPLES_PARTIAL",
          "gap": "Security principles exist but are incomplete, outdated or not tailored to relevant technology domains.",
          "remediation": "Create and maintain an approved engineering-principles baseline covering defence in depth, least privilege, secure defaults, trust boundaries, resilience and other relevant principles."
        },
        "absent": {
          "gapCode": "A8_27_ARCH_PRINCIPLES_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Security principles exist but are incomplete, outdated or not tailored to relevant technology domains.",
          "remediation": "Create and maintain an approved engineering-principles baseline covering defence in depth, least privilege, secure defaults, trust boundaries, resilience and other relevant principles."
        }
      },
      {
        "id": "p8_27_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are secure architecture and engineering principles applied during new system design and significant changes, including documented security review before implementation?",
          "fr": "Les principes d’architecture et d’ingénierie sécurisées sont-ils appliqués lors de la conception de nouveaux systèmes et changements significatifs, avec une revue de sécurité documentée avant implémentation ?"
        },
        "partial": {
          "gapCode": "A8_27_ARCH_APPLICATION_PARTIAL",
          "gap": "Architecture reviews occur inconsistently or after major design decisions have already been fixed.",
          "remediation": "Make security architecture review a required design gate for defined risk/criticality thresholds and capture decisions before build."
        },
        "absent": {
          "gapCode": "A8_27_ARCH_APPLICATION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Architecture reviews occur inconsistently or after major design decisions have already been fixed.",
          "remediation": "Make security architecture review a required design gate for defined risk/criticality thresholds and capture decisions before build."
        }
      },
      {
        "id": "p8_27_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Can the organisation demonstrate architecture decisions, security reviews, approved exceptions and follow-up actions for relevant systems and changes?",
          "fr": "L’organisation peut-elle démontrer les décisions d’architecture, revues de sécurité, exceptions approuvées et actions de suivi pour les systèmes et changements pertinents ?"
        },
        "partial": {
          "gapCode": "A8_27_ARCH_EVIDENCE_PARTIAL",
          "gap": "Architecture evidence exists but decisions, exceptions or remediation actions are not consistently recorded and closed.",
          "remediation": "Retain architecture diagrams, review records, ADRs, threat models, exception approvals and tracked remediation outcomes."
        },
        "absent": {
          "gapCode": "A8_27_ARCH_EVIDENCE_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Architecture evidence exists but decisions, exceptions or remediation actions are not consistently recorded and closed.",
          "remediation": "Retain architecture diagrams, review records, ADRs, threat models, exception approvals and tracked remediation outcomes."
        }
      },
      {
        "id": "p8_27_004_cloud",
        "type": "conditional",
        "conditionKey": "usesCloudArchitecture",
        "question": {
          "en": "Where cloud architectures are used or being adopted, are secure engineering principles adapted to cloud shared responsibility, identity, network, data and service-specific risks?",
          "fr": "Lorsque des architectures cloud sont utilisées ou adoptées, les principes d’ingénierie sécurisée sont-ils adaptés à la responsabilité partagée, aux identités, réseaux, données et risques propres aux services cloud ?"
        },
        "partial": {
          "gapCode": "A8_27_CLOUD_ARCH_PARTIAL",
          "gap": "Cloud security principles exist but are incomplete or inconsistent between platforms or teams.",
          "remediation": "Define cloud reference architectures and guardrails covering identity, network, encryption, logging, secrets, tenancy and shared-responsibility assumptions."
        },
        "absent": {
          "gapCode": "A8_27_CLOUD_ARCH_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Cloud security principles exist but are incomplete or inconsistent between platforms or teams.",
          "remediation": "Define cloud reference architectures and guardrails covering identity, network, encryption, logging, secrets, tenancy and shared-responsibility assumptions."
        }
      },
      {
        "id": "p8_27_005_legacy",
        "type": "conditional",
        "conditionKey": "hasLegacyArchitectureExceptions",
        "question": {
          "en": "Where legacy systems cannot meet current secure architecture principles, are the deviations risk-assessed and covered by documented compensating controls or a remediation roadmap?",
          "fr": "Lorsque des systèmes legacy ne peuvent pas respecter les principes d’architecture sécurisée actuels, les écarts sont-ils évalués en risque et couverts par des contrôles compensatoires documentés ou une feuille de route de mise à niveau ?"
        },
        "partial": {
          "gapCode": "A8_27_LEGACY_ARCH_PARTIAL",
          "gap": "Legacy deviations are known but compensating controls, ownership or remediation deadlines are incomplete.",
          "remediation": "Record deviations in risk treatment, implement compensating controls, assign owners and establish a funded upgrade/replacement roadmap."
        },
        "absent": {
          "gapCode": "A8_27_LEGACY_ARCH_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Legacy deviations are known but compensating controls, ownership or remediation deadlines are incomplete.",
          "remediation": "Record deviations in risk treatment, implement compensating controls, assign owners and establish a funded upgrade/replacement roadmap."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesCloudArchitecture",
        "question": {
          "en": "Are cloud services or cloud architectures used for in-scope systems?",
          "fr": "Des services ou architectures cloud sont-ils utilisés pour les systèmes du périmètre ?"
        }
      },
      {
        "key": "hasLegacyArchitectureExceptions",
        "question": {
          "en": "Are there legacy systems that cannot currently meet the organisation's secure architecture and engineering principles?",
          "fr": "Existe-t-il des systèmes legacy qui ne peuvent actuellement pas respecter les principes d’architecture et d’ingénierie sécurisées de l’organisation ?"
        }
      }
    ]
  },
  {
    "id": "a8-28",
    "code": "A.8.28",
    "name": "Secure coding",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_28_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined and maintained secure coding standards appropriate to the programming languages, frameworks, threats and development practices it uses?",
          "fr": "Votre organisation a-t-elle défini et maintenu des standards de codage sécurisé adaptés aux langages, frameworks, menaces et pratiques de développement qu’elle utilise ?"
        },
        "partial": {
          "gapCode": "A8_28_CODING_STANDARD_PARTIAL",
          "gap": "Secure-coding guidance exists but is generic, incomplete, outdated or not adopted across all relevant development teams.",
          "remediation": "Establish language/framework-specific secure coding standards, ownership and review cycles, aligned with relevant vulnerability classes."
        },
        "absent": {
          "gapCode": "A8_28_CODING_STANDARD_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Secure-coding guidance exists but is generic, incomplete, outdated or not adopted across all relevant development teams.",
          "remediation": "Establish language/framework-specific secure coding standards, ownership and review cycles, aligned with relevant vulnerability classes."
        }
      },
      {
        "id": "p8_28_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are secure coding practices enforced through developer practices, peer review and appropriate automated checks before code is merged or released?",
          "fr": "Les pratiques de codage sécurisé sont-elles appliquées au moyen des pratiques développeur, de revues par les pairs et de contrôles automatisés appropriés avant fusion ou livraison du code ?"
        },
        "partial": {
          "gapCode": "A8_28_CODING_APPLICATION_PARTIAL",
          "gap": "Secure coding is practiced inconsistently or checks can be bypassed without controlled approval.",
          "remediation": "Integrate mandatory peer review and risk-appropriate SAST, linting, secret/dependency scanning or equivalent controls into the workflow."
        },
        "absent": {
          "gapCode": "A8_28_CODING_APPLICATION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Secure coding is practiced inconsistently or checks can be bypassed without controlled approval.",
          "remediation": "Integrate mandatory peer review and risk-appropriate SAST, linting, secret/dependency scanning or equivalent controls into the workflow."
        }
      },
      {
        "id": "p8_28_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Does the organisation retain evidence of secure coding training, code-review/security findings, tool results and remediation of material coding defects?",
          "fr": "L’organisation conserve-t-elle des preuves de formation au codage sécurisé, de revues/constats de sécurité, de résultats d’outils et de correction des défauts de code importants ?"
        },
        "partial": {
          "gapCode": "A8_28_CODING_EVIDENCE_PARTIAL",
          "gap": "Evidence exists but training coverage, findings, remediation or exception traceability is incomplete.",
          "remediation": "Track developer training, security findings, remediation SLAs and controlled exceptions, retaining release-linked evidence."
        },
        "absent": {
          "gapCode": "A8_28_CODING_EVIDENCE_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Evidence exists but training coverage, findings, remediation or exception traceability is incomplete.",
          "remediation": "Track developer training, security findings, remediation SLAs and controlled exceptions, retaining release-linked evidence."
        }
      },
      {
        "id": "p8_28_004_open_source",
        "type": "conditional",
        "conditionKey": "usesOpenSourceDependencies",
        "question": {
          "en": "Where open-source libraries, packages or frameworks are used, are dependencies inventoried and checked for known vulnerabilities and unsupported components before and during use?",
          "fr": "Lorsque des bibliothèques, packages ou frameworks open source sont utilisés, les dépendances sont-elles inventoriées et vérifiées vis-à-vis des vulnérabilités connues et composants non supportés avant et pendant leur utilisation ?"
        },
        "partial": {
          "gapCode": "A8_28_DEPENDENCY_SECURITY_PARTIAL",
          "gap": "Dependency scanning exists but inventories, transitive dependencies, remediation or unsupported-package handling are incomplete.",
          "remediation": "Implement dependency/SCA scanning, maintain inventories or SBOM where appropriate, define remediation SLAs and prohibit unsupported high-risk components."
        },
        "absent": {
          "gapCode": "A8_28_DEPENDENCY_SECURITY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Dependency scanning exists but inventories, transitive dependencies, remediation or unsupported-package handling are incomplete.",
          "remediation": "Implement dependency/SCA scanning, maintain inventories or SBOM where appropriate, define remediation SLAs and prohibit unsupported high-risk components."
        }
      },
      {
        "id": "p8_28_005_repo_secrets",
        "type": "conditional",
        "conditionKey": "usesSharedSourceRepositories",
        "question": {
          "en": "Where source code is maintained in shared repositories, are secrets prevented from being stored in version control and managed through approved secret-management mechanisms?",
          "fr": "Lorsque le code source est maintenu dans des dépôts partagés, les secrets sont-ils empêchés d’être stockés dans le contrôle de version et gérés via des mécanismes approuvés de gestion des secrets ?"
        },
        "partial": {
          "gapCode": "A8_28_REPO_SECRETS_PARTIAL",
          "gap": "Secret-management controls exist but repositories still contain exposed or historical credentials, or scanning is incomplete.",
          "remediation": "Deploy pre-commit/CI secret detection, migrate secrets to an approved vault, rotate exposed credentials and remove them safely from repository history."
        },
        "absent": {
          "gapCode": "A8_28_REPO_SECRETS_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Secret-management controls exist but repositories still contain exposed or historical credentials, or scanning is incomplete.",
          "remediation": "Deploy pre-commit/CI secret detection, migrate secrets to an approved vault, rotate exposed credentials and remove them safely from repository history."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesOpenSourceDependencies",
        "question": {
          "en": "Do in-scope developments use open-source libraries, packages or frameworks?",
          "fr": "Les développements du périmètre utilisent-ils des bibliothèques, packages ou frameworks open source ?"
        }
      },
      {
        "key": "usesSharedSourceRepositories",
        "question": {
          "en": "Is source code maintained in shared version-control repositories?",
          "fr": "Le code source est-il maintenu dans des dépôts partagés de contrôle de version ?"
        }
      }
    ]
  },
  {
    "id": "a8-29",
    "code": "A.8.29",
    "name": "Security testing in development and acceptance",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_29_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined risk-based security testing requirements, methods, responsibilities, acceptance criteria and retest expectations for development and acceptance?",
          "fr": "Votre organisation a-t-elle défini des exigences de tests de sécurité fondées sur les risques, les méthodes, responsabilités, critères d’acceptation et attentes de retest pour le développement et la recette ?"
        },
        "partial": {
          "gapCode": "A8_29_TEST_STRATEGY_PARTIAL",
          "gap": "Security testing requirements exist but methods, scope, severity thresholds or retest rules are incomplete.",
          "remediation": "Define a security-testing standard covering applicable test types, timing, independence, severity thresholds, retesting and evidence retention."
        },
        "absent": {
          "gapCode": "A8_29_TEST_STRATEGY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Security testing requirements exist but methods, scope, severity thresholds or retest rules are incomplete.",
          "remediation": "Define a security-testing standard covering applicable test types, timing, independence, severity thresholds, retesting and evidence retention."
        }
      },
      {
        "id": "p8_29_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are appropriate security tests executed during development and before acceptance or production release, with material findings preventing release unless formally risk-accepted?",
          "fr": "Des tests de sécurité appropriés sont-ils exécutés pendant le développement et avant recette ou mise en production, les constats importants bloquant la livraison sauf acceptation formelle du risque ?"
        },
        "partial": {
          "gapCode": "A8_29_TEST_EXECUTION_PARTIAL",
          "gap": "Testing occurs but not consistently for significant releases, or material findings can proceed without controlled decision.",
          "remediation": "Integrate required automated/manual tests into release gates and enforce documented security acceptance or authorised risk exception."
        },
        "absent": {
          "gapCode": "A8_29_TEST_EXECUTION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Testing occurs but not consistently for significant releases, or material findings can proceed without controlled decision.",
          "remediation": "Integrate required automated/manual tests into release gates and enforce documented security acceptance or authorised risk exception."
        }
      },
      {
        "id": "p8_29_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are security-test findings tracked through remediation and retesting, with evidence showing closure, accepted residual risk and final release decisions?",
          "fr": "Les constats de tests sécurité sont-ils suivis jusqu’à correction et retest, avec des preuves démontrant la clôture, le risque résiduel accepté et la décision finale de livraison ?"
        },
        "partial": {
          "gapCode": "A8_29_TEST_TRACEABILITY_PARTIAL",
          "gap": "Findings are recorded but closure, retesting or risk-acceptance evidence is incomplete.",
          "remediation": "Use a vulnerability/defect workflow with ownership, severity, SLA, retest evidence and authorised risk acceptance linked to the release."
        },
        "absent": {
          "gapCode": "A8_29_TEST_TRACEABILITY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Findings are recorded but closure, retesting or risk-acceptance evidence is incomplete.",
          "remediation": "Use a vulnerability/defect workflow with ownership, severity, SLA, retest evidence and authorised risk acceptance linked to the release."
        }
      },
      {
        "id": "p8_29_004_critical_finding",
        "type": "conditional",
        "conditionKey": "hasCriticalPreReleaseFindings",
        "question": {
          "en": "Where a critical security vulnerability is identified before a planned release, is there a defined and authorised process for blocking the release or exceptionally accepting the risk?",
          "fr": "Lorsqu’une vulnérabilité de sécurité critique est identifiée avant une livraison planifiée, existe-t-il un processus défini et autorisé pour bloquer la livraison ou accepter exceptionnellement le risque ?"
        },
        "partial": {
          "gapCode": "A8_29_CRITICAL_RELEASE_DECISION_PARTIAL",
          "gap": "Critical-finding decisions are handled ad hoc or without explicit accountable risk acceptance.",
          "remediation": "Establish non-bypassable critical thresholds and a formal exception path requiring risk owner approval, compensating controls and expiry."
        },
        "absent": {
          "gapCode": "A8_29_CRITICAL_RELEASE_DECISION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Critical-finding decisions are handled ad hoc or without explicit accountable risk acceptance.",
          "remediation": "Establish non-bypassable critical thresholds and a formal exception path requiring risk owner approval, compensating controls and expiry."
        }
      },
      {
        "id": "p8_29_005_independent_pentest",
        "type": "conditional",
        "conditionKey": "hasCriticalOrInternetFacingSystems",
        "question": {
          "en": "Where applications or systems are critical or publicly exposed, are independent penetration tests or equivalent high-assurance security assessments performed at risk-appropriate intervals?",
          "fr": "Lorsque des applications ou systèmes sont critiques ou exposés publiquement, des tests d’intrusion indépendants ou évaluations de sécurité de niveau équivalent sont-ils réalisés à une fréquence adaptée au risque ?"
        },
        "partial": {
          "gapCode": "A8_29_INDEPENDENT_TESTING_PARTIAL",
          "gap": "Independent testing is performed but scope, frequency, retesting or independence is insufficient for the risk.",
          "remediation": "Define risk-based independent testing frequency and scope, use competent testers and retain remediation/retest evidence."
        },
        "absent": {
          "gapCode": "A8_29_INDEPENDENT_TESTING_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Independent testing is performed but scope, frequency, retesting or independence is insufficient for the risk.",
          "remediation": "Define risk-based independent testing frequency and scope, use competent testers and retain remediation/retest evidence."
        }
      }
    ],
    "quickContext": [
      {
        "key": "hasCriticalPreReleaseFindings",
        "question": {
          "en": "Has the organisation encountered, or does it permit release decisions involving, critical security findings identified before release?",
          "fr": "L’organisation a-t-elle déjà rencontré, ou autorise-t-elle, des décisions de livraison impliquant des constats de sécurité critiques identifiés avant livraison ?"
        }
      },
      {
        "key": "hasCriticalOrInternetFacingSystems",
        "question": {
          "en": "Are any in-scope applications or systems critical to the organisation or publicly exposed?",
          "fr": "Des applications ou systèmes du périmètre sont-ils critiques pour l’organisation ou exposés publiquement ?"
        }
      }
    ]
  },
  {
    "id": "a8-30",
    "code": "A.8.30",
    "name": "Outsourced development",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_30_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined security requirements and governance for outsourced system or software development, including contractual obligations, responsibilities, assurance and acceptance criteria?",
          "fr": "Votre organisation a-t-elle défini les exigences et la gouvernance de sécurité du développement externalisé, incluant obligations contractuelles, responsabilités, assurance et critères d’acceptation ?"
        },
        "partial": {
          "gapCode": "A8_30_OUTSOURCED_GOVERNANCE_PARTIAL",
          "gap": "Outsourced-development governance exists but contracts or standards do not fully address security, assurance or ownership.",
          "remediation": "Establish standard outsourced-development security clauses covering secure SDLC, code/security standards, testing, evidence, IP, incident handling, subcontractors and acceptance."
        },
        "absent": {
          "gapCode": "A8_30_OUTSOURCED_GOVERNANCE_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Outsourced-development governance exists but contracts or standards do not fully address security, assurance or ownership.",
          "remediation": "Establish standard outsourced-development security clauses covering secure SDLC, code/security standards, testing, evidence, IP, incident handling, subcontractors and acceptance."
        }
      },
      {
        "id": "p8_30_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Does the organisation actively supervise outsourced development and verify that delivered code, systems or components meet its security requirements before production use?",
          "fr": "L’organisation supervise-t-elle activement le développement externalisé et vérifie-t-elle que le code, les systèmes ou composants livrés respectent ses exigences de sécurité avant utilisation en production ?"
        },
        "partial": {
          "gapCode": "A8_30_OUTSOURCED_ASSURANCE_PARTIAL",
          "gap": "Supplier deliverables receive some review but security verification is inconsistent or overly reliant on supplier statements.",
          "remediation": "Implement risk-based code/deliverable review, test evidence requirements and independent validation before acceptance for relevant outsourced work."
        },
        "absent": {
          "gapCode": "A8_30_OUTSOURCED_ASSURANCE_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Supplier deliverables receive some review but security verification is inconsistent or overly reliant on supplier statements.",
          "remediation": "Implement risk-based code/deliverable review, test evidence requirements and independent validation before acceptance for relevant outsourced work."
        }
      },
      {
        "id": "p8_30_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are supplier security obligations, reviews, test results, exceptions, acceptance decisions and corrective actions retained as auditable evidence?",
          "fr": "Les obligations de sécurité du fournisseur, revues, résultats de tests, exceptions, décisions d’acceptation et actions correctives sont-ils conservés comme preuves auditables ?"
        },
        "partial": {
          "gapCode": "A8_30_OUTSOURCED_TRACEABILITY_PARTIAL",
          "gap": "Evidence exists but does not provide a complete chain from contractual requirement to delivery assurance and acceptance.",
          "remediation": "Create a supplier-development assurance record linking contract requirements, deliverables, reviews, tests, findings, remediation and final acceptance."
        },
        "absent": {
          "gapCode": "A8_30_OUTSOURCED_TRACEABILITY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Evidence exists but does not provide a complete chain from contractual requirement to delivery assurance and acceptance.",
          "remediation": "Create a supplier-development assurance record linking contract requirements, deliverables, reviews, tests, findings, remediation and final acceptance."
        }
      },
      {
        "id": "p8_30_004_prod_data",
        "type": "conditional",
        "conditionKey": "outsourcedDevelopersAccessSensitiveData",
        "question": {
          "en": "Where outsourced developers or testers can access production or sensitive data, is access minimised and are test copies masked, anonymised or otherwise appropriately protected?",
          "fr": "Lorsque des développeurs ou testeurs externalisés peuvent accéder à des données de production ou sensibles, l’accès est-il minimisé et les copies de test sont-elles masquées, anonymisées ou protégées de façon appropriée ?"
        },
        "partial": {
          "gapCode": "A8_30_SUPPLIER_SENSITIVE_DATA_PARTIAL",
          "gap": "External development access to sensitive data exists but masking, access restriction, monitoring or deletion is incomplete.",
          "remediation": "Prefer synthetic/masked data, restrict supplier access, monitor use, define retention/deletion and document approved exceptional production-data access."
        },
        "absent": {
          "gapCode": "A8_30_SUPPLIER_SENSITIVE_DATA_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. External development access to sensitive data exists but masking, access restriction, monitoring or deletion is incomplete.",
          "remediation": "Prefer synthetic/masked data, restrict supplier access, monitor use, define retention/deletion and document approved exceptional production-data access."
        }
      },
      {
        "id": "p8_30_005_exit",
        "type": "conditional",
        "conditionKey": "hasOutsourcedDevelopmentExit",
        "question": {
          "en": "Where an outsourced development arrangement ends or changes provider, is there a controlled process to recover or transfer source code, documentation, credentials, environments and organisational information?",
          "fr": "Lorsqu’un contrat de développement externalisé se termine ou change de prestataire, existe-t-il un processus maîtrisé pour récupérer ou transférer code source, documentation, identifiants, environnements et informations de l’organisation ?"
        },
        "partial": {
          "gapCode": "A8_30_SUPPLIER_EXIT_PARTIAL",
          "gap": "Exit arrangements exist but do not fully cover code, documentation, access revocation, data return/deletion or continuity.",
          "remediation": "Define and test an exit/transition checklist covering asset transfer, credential rotation, access revocation, data return/deletion and continuity obligations."
        },
        "absent": {
          "gapCode": "A8_30_SUPPLIER_EXIT_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Exit arrangements exist but do not fully cover code, documentation, access revocation, data return/deletion or continuity.",
          "remediation": "Define and test an exit/transition checklist covering asset transfer, credential rotation, access revocation, data return/deletion and continuity obligations."
        }
      }
    ],
    "quickContext": [
      {
        "key": "outsourcedDevelopersAccessSensitiveData",
        "question": {
          "en": "Can outsourced developers or testers access production data or other sensitive organisational information?",
          "fr": "Des développeurs ou testeurs externalisés peuvent-ils accéder à des données de production ou à d’autres informations sensibles de l’organisation ?"
        }
      },
      {
        "key": "hasOutsourcedDevelopmentExit",
        "question": {
          "en": "Does the organisation currently have, or reasonably expect, outsourced development arrangements that can terminate or change provider?",
          "fr": "L’organisation dispose-t-elle actuellement, ou prévoit-elle raisonnablement, des contrats de développement externalisé pouvant se terminer ou changer de prestataire ?"
        }
      }
    ]
  },
  {
    "id": "a8-31",
    "code": "A.8.31",
    "name": "Separation of development, test and production environments",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_31_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined how development, test and production environments must be separated, including access, data, tooling, deployment and administrative requirements?",
          "fr": "Votre organisation a-t-elle défini comment les environnements de développement, test et production doivent être séparés, incluant les exigences d’accès, données, outils, déploiement et administration ?"
        },
        "partial": {
          "gapCode": "A8_31_ENV_POLICY_PARTIAL",
          "gap": "Environment-separation rules exist but are incomplete or not consistently applied to all systems and platforms.",
          "remediation": "Define a standard for environment isolation, access boundaries, data restrictions, tool separation and controlled code/configuration promotion."
        },
        "absent": {
          "gapCode": "A8_31_ENV_POLICY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Environment-separation rules exist but are incomplete or not consistently applied to all systems and platforms.",
          "remediation": "Define a standard for environment isolation, access boundaries, data restrictions, tool separation and controlled code/configuration promotion."
        }
      },
      {
        "id": "p8_31_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are development, test and production environments technically and logically separated, with production access restricted and changes promoted through controlled mechanisms?",
          "fr": "Les environnements de développement, test et production sont-ils techniquement et logiquement séparés, avec accès production restreint et changements promus via des mécanismes contrôlés ?"
        },
        "partial": {
          "gapCode": "A8_31_ENV_SEPARATION_PARTIAL",
          "gap": "Separation exists but shared accounts, networks, tooling, credentials or direct developer paths weaken production isolation.",
          "remediation": "Remove unnecessary shared trust and direct paths, separate identities/networks/accounts and enforce controlled deployment mechanisms."
        },
        "absent": {
          "gapCode": "A8_31_ENV_SEPARATION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Separation exists but shared accounts, networks, tooling, credentials or direct developer paths weaken production isolation.",
          "remediation": "Remove unnecessary shared trust and direct paths, separate identities/networks/accounts and enforce controlled deployment mechanisms."
        }
      },
      {
        "id": "p8_31_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Can the organisation demonstrate that production access and promotions are authorised, logged, reviewed and revoked when no longer required?",
          "fr": "L’organisation peut-elle démontrer que les accès production et promotions sont autorisés, journalisés, revus et révoqués lorsqu’ils ne sont plus nécessaires ?"
        },
        "partial": {
          "gapCode": "A8_31_ENV_TRACEABILITY_PARTIAL",
          "gap": "Logs and approvals exist but production access reviews, temporary access expiry or deployment traceability is incomplete.",
          "remediation": "Centralise production access/deployment logs, review access periodically and ensure temporary privileges expire automatically or are promptly revoked."
        },
        "absent": {
          "gapCode": "A8_31_ENV_TRACEABILITY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Logs and approvals exist but production access reviews, temporary access expiry or deployment traceability is incomplete.",
          "remediation": "Centralise production access/deployment logs, review access periodically and ensure temporary privileges expire automatically or are promptly revoked."
        }
      },
      {
        "id": "p8_31_004_emergency_prod",
        "type": "conditional",
        "conditionKey": "developersNeedEmergencyProdAccess",
        "question": {
          "en": "Where developers exceptionally require direct production access for critical support or incident response, is that access time-bound, authorised, monitored and revoked after use?",
          "fr": "Lorsque des développeurs nécessitent exceptionnellement un accès direct à la production pour support critique ou réponse à incident, cet accès est-il limité dans le temps, autorisé, surveillé et révoqué après usage ?"
        },
        "partial": {
          "gapCode": "A8_31_EMERGENCY_PROD_ACCESS_PARTIAL",
          "gap": "Emergency production access is controlled only partially or remains active longer than necessary.",
          "remediation": "Use JIT/PAM or equivalent time-bound elevation, require approval and reason, record sessions/actions and verify automatic revocation."
        },
        "absent": {
          "gapCode": "A8_31_EMERGENCY_PROD_ACCESS_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Emergency production access is controlled only partially or remains active longer than necessary.",
          "remediation": "Use JIT/PAM or equivalent time-bound elevation, require approval and reason, record sessions/actions and verify automatic revocation."
        }
      },
      {
        "id": "p8_31_005_cloud",
        "type": "conditional",
        "conditionKey": "usesCloudDevelopmentEnvironments",
        "question": {
          "en": "Where cloud platforms are used, are development, test and production isolated using appropriately separate accounts, subscriptions, projects, networks or equivalent security boundaries?",
          "fr": "Lorsque des plateformes cloud sont utilisées, développement, test et production sont-ils isolés au moyen de comptes, subscriptions, projets, réseaux ou frontières de sécurité équivalentes suffisamment distincts ?"
        },
        "partial": {
          "gapCode": "A8_31_CLOUD_ENV_SEPARATION_PARTIAL",
          "gap": "Cloud environments are logically labelled but remain within overly shared administrative or network boundaries.",
          "remediation": "Adopt stronger cloud environment boundaries, separate privileged roles and policies, and control cross-environment connectivity and deployment paths."
        },
        "absent": {
          "gapCode": "A8_31_CLOUD_ENV_SEPARATION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Cloud environments are logically labelled but remain within overly shared administrative or network boundaries.",
          "remediation": "Adopt stronger cloud environment boundaries, separate privileged roles and policies, and control cross-environment connectivity and deployment paths."
        }
      }
    ],
    "quickContext": [
      {
        "key": "developersNeedEmergencyProdAccess",
        "question": {
          "en": "Can developers be granted exceptional direct production access for critical support or incident response?",
          "fr": "Des développeurs peuvent-ils recevoir exceptionnellement un accès direct à la production pour support critique ou réponse à incident ?"
        }
      },
      {
        "key": "usesCloudDevelopmentEnvironments",
        "question": {
          "en": "Are development, test or production environments hosted on cloud platforms?",
          "fr": "Des environnements de développement, test ou production sont-ils hébergés sur des plateformes cloud ?"
        }
      }
    ]
  },
  {
    "id": "a8-32",
    "code": "A.8.32",
    "name": "Change management",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_32_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined a change-management process covering request, security and impact assessment, approval, testing, implementation, rollback, documentation and post-change review as appropriate?",
          "fr": "Votre organisation a-t-elle défini un processus de gestion des changements couvrant demande, évaluation sécurité/impact, approbation, test, mise en œuvre, rollback, documentation et revue après changement selon le besoin ?"
        },
        "partial": {
          "gapCode": "A8_32_CHANGE_PROCESS_PARTIAL",
          "gap": "A change process exists but one or more security-critical stages or responsibilities are missing or optional.",
          "remediation": "Complete and approve the change-management process with risk-based categorisation, security review, testing, approval, rollback and evidence requirements."
        },
        "absent": {
          "gapCode": "A8_32_CHANGE_PROCESS_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. A change process exists but one or more security-critical stages or responsibilities are missing or optional.",
          "remediation": "Complete and approve the change-management process with risk-based categorisation, security review, testing, approval, rollback and evidence requirements."
        }
      },
      {
        "id": "p8_32_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are significant changes assessed, tested and authorised before implementation, with segregation of duties and rollback arrangements applied according to risk?",
          "fr": "Les changements significatifs sont-ils évalués, testés et autorisés avant mise en œuvre, avec séparation des tâches et dispositions de rollback appliquées selon le risque ?"
        },
        "partial": {
          "gapCode": "A8_32_CHANGE_APPLICATION_PARTIAL",
          "gap": "The process is used but some changes bypass assessment, testing, approval, segregation or rollback planning.",
          "remediation": "Close bypass paths, require risk-appropriate approvals and testing, and ensure rollback or recovery plans exist for significant changes."
        },
        "absent": {
          "gapCode": "A8_32_CHANGE_APPLICATION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. The process is used but some changes bypass assessment, testing, approval, segregation or rollback planning.",
          "remediation": "Close bypass paths, require risk-appropriate approvals and testing, and ensure rollback or recovery plans exist for significant changes."
        }
      },
      {
        "id": "p8_32_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Do change records provide an auditable trail from request and risk assessment through approval, implementation, outcome, rollback if used, and closure?",
          "fr": "Les dossiers de changement fournissent-ils une piste d’audit depuis la demande et l’évaluation du risque jusqu’à l’approbation, mise en œuvre, résultat, rollback éventuel et clôture ?"
        },
        "partial": {
          "gapCode": "A8_32_CHANGE_TRACEABILITY_PARTIAL",
          "gap": "Change records exist but fields, approvals, implementation evidence or closure information are incomplete.",
          "remediation": "Enforce mandatory change-record fields and retain linked test, approval, deployment, rollback and post-implementation evidence."
        },
        "absent": {
          "gapCode": "A8_32_CHANGE_TRACEABILITY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Change records exist but fields, approvals, implementation evidence or closure information are incomplete.",
          "remediation": "Enforce mandatory change-record fields and retain linked test, approval, deployment, rollback and post-implementation evidence."
        }
      },
      {
        "id": "p8_32_004_emergency",
        "type": "conditional",
        "conditionKey": "allowsEmergencyChanges",
        "question": {
          "en": "Where emergency changes are permitted, is there an expedited but controlled process with defined authority, traceability and retrospective review?",
          "fr": "Lorsque des changements urgents sont autorisés, existe-t-il un processus accéléré mais contrôlé avec autorité définie, traçabilité et revue rétrospective ?"
        },
        "partial": {
          "gapCode": "A8_32_EMERGENCY_CHANGES_PARTIAL",
          "gap": "Emergency changes are logged but approval, testing, retrospective review or recurrence prevention is inconsistent.",
          "remediation": "Define emergency-change authority, minimum testing, mandatory logging and post-implementation review within a specified timeframe."
        },
        "absent": {
          "gapCode": "A8_32_EMERGENCY_CHANGES_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Emergency changes are logged but approval, testing, retrospective review or recurrence prevention is inconsistent.",
          "remediation": "Define emergency-change authority, minimum testing, mandatory logging and post-implementation review within a specified timeframe."
        }
      },
      {
        "id": "p8_32_005_iac",
        "type": "conditional",
        "conditionKey": "usesInfrastructureAsCode",
        "question": {
          "en": "Where infrastructure-as-code or automated deployment is used, are change approvals, peer review, security checks and production promotion controls enforced within the code and pipeline workflow?",
          "fr": "Lorsque l’infrastructure as code ou les déploiements automatisés sont utilisés, approbations de changement, revue par les pairs, contrôles sécurité et promotion en production sont-ils imposés dans le workflow de code et de pipeline ?"
        },
        "partial": {
          "gapCode": "A8_32_IAC_CHANGE_CONTROL_PARTIAL",
          "gap": "IaC/automation is used but direct commits, privileged bypasses or insufficient pipeline gates weaken change control.",
          "remediation": "Protect branches, require pull-request approval and automated checks, restrict pipeline privileges and log production deployments and overrides."
        },
        "absent": {
          "gapCode": "A8_32_IAC_CHANGE_CONTROL_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. IaC/automation is used but direct commits, privileged bypasses or insufficient pipeline gates weaken change control.",
          "remediation": "Protect branches, require pull-request approval and automated checks, restrict pipeline privileges and log production deployments and overrides."
        }
      }
    ],
    "quickContext": [
      {
        "key": "allowsEmergencyChanges",
        "question": {
          "en": "Does the organisation permit emergency or expedited changes to in-scope production systems?",
          "fr": "L’organisation autorise-t-elle des changements urgents ou accélérés sur les systèmes de production du périmètre ?"
        }
      },
      {
        "key": "usesInfrastructureAsCode",
        "question": {
          "en": "Does the organisation use infrastructure-as-code or automated pipelines to make infrastructure or production changes?",
          "fr": "L’organisation utilise-t-elle l’infrastructure as code ou des pipelines automatisés pour modifier l’infrastructure ou la production ?"
        }
      }
    ]
  },
  {
    "id": "a8-33",
    "code": "A.8.33",
    "name": "Test information",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_33_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined rules for selecting, generating, copying, protecting, retaining and deleting information used in development and test environments?",
          "fr": "Votre organisation a-t-elle défini des règles pour sélectionner, générer, copier, protéger, conserver et supprimer les informations utilisées dans les environnements de développement et de test ?"
        },
        "partial": {
          "gapCode": "A8_33_TEST_DATA_POLICY_PARTIAL",
          "gap": "Test-information rules exist but do not fully address sensitive production data, access, retention or deletion.",
          "remediation": "Define a test-information standard prioritising synthetic data and specifying approval, masking, access, logging, retention and secure deletion requirements."
        },
        "absent": {
          "gapCode": "A8_33_TEST_DATA_POLICY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Test-information rules exist but do not fully address sensitive production data, access, retention or deletion.",
          "remediation": "Define a test-information standard prioritising synthetic data and specifying approval, masking, access, logging, retention and secure deletion requirements."
        }
      },
      {
        "id": "p8_33_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Are test data and environments protected according to information sensitivity, with production data avoided or appropriately masked or transformed before test use?",
          "fr": "Les données et environnements de test sont-ils protégés selon la sensibilité des informations, les données de production étant évitées ou correctement masquées/transformées avant usage en test ?"
        },
        "partial": {
          "gapCode": "A8_33_TEST_DATA_PROTECTION_PARTIAL",
          "gap": "Test data is protected inconsistently or real sensitive production data is copied more broadly than necessary.",
          "remediation": "Replace real data with synthetic data where possible; otherwise mask/tokenise and restrict access, copies and onward use to the minimum necessary."
        },
        "absent": {
          "gapCode": "A8_33_TEST_DATA_PROTECTION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Test data is protected inconsistently or real sensitive production data is copied more broadly than necessary.",
          "remediation": "Replace real data with synthetic data where possible; otherwise mask/tokenise and restrict access, copies and onward use to the minimum necessary."
        }
      },
      {
        "id": "p8_33_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Can the organisation demonstrate authorised creation or copying of test information, access control, retention and secure deletion for sensitive test datasets?",
          "fr": "L’organisation peut-elle démontrer la création ou copie autorisée des informations de test, leur contrôle d’accès, rétention et suppression sécurisée pour les jeux de données sensibles ?"
        },
        "partial": {
          "gapCode": "A8_33_TEST_DATA_TRACEABILITY_PARTIAL",
          "gap": "Some evidence exists but dataset ownership, copy approval, access or deletion records are incomplete.",
          "remediation": "Maintain a test-data register or equivalent evidence linking source, approval, protection method, users, retention and deletion."
        },
        "absent": {
          "gapCode": "A8_33_TEST_DATA_TRACEABILITY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Some evidence exists but dataset ownership, copy approval, access or deletion records are incomplete.",
          "remediation": "Maintain a test-data register or equivalent evidence linking source, approval, protection method, users, retention and deletion."
        }
      },
      {
        "id": "p8_33_004_real_prod_exception",
        "type": "conditional",
        "conditionKey": "usesRealProductionDataForTesting",
        "question": {
          "en": "Where real production information is exceptionally necessary for testing, is its use formally approved, minimised, time-bound, protected and removed when no longer required?",
          "fr": "Lorsque des informations réelles de production sont exceptionnellement nécessaires pour les tests, leur usage est-il formellement approuvé, minimisé, limité dans le temps, protégé et supprimé lorsqu’il n’est plus requis ?"
        },
        "partial": {
          "gapCode": "A8_33_PROD_DATA_EXCEPTION_PARTIAL",
          "gap": "Exceptional production-data use is justified but duration, access, masking or deletion controls are incomplete.",
          "remediation": "Require documented exception approval, minimum dataset, enhanced access controls, masking where feasible, expiry and verified deletion."
        },
        "absent": {
          "gapCode": "A8_33_PROD_DATA_EXCEPTION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Exceptional production-data use is justified but duration, access, masking or deletion controls are incomplete.",
          "remediation": "Require documented exception approval, minimum dataset, enhanced access controls, masking where feasible, expiry and verified deletion."
        }
      },
      {
        "id": "p8_33_005_external_test",
        "type": "conditional",
        "conditionKey": "usesExternalTestingProvider",
        "question": {
          "en": "Where testing is performed by an external provider, are equivalent requirements for protecting, using, returning and deleting test information contractually and technically enforced?",
          "fr": "Lorsque les tests sont réalisés par un prestataire externe, des exigences équivalentes de protection, utilisation, restitution et suppression des informations de test sont-elles imposées contractuellement et techniquement ?"
        },
        "partial": {
          "gapCode": "A8_33_EXTERNAL_TEST_DATA_PARTIAL",
          "gap": "External testers receive test information but contractual, access, return/deletion or assurance requirements are incomplete.",
          "remediation": "Add test-data security clauses, minimise shared datasets, restrict provider access and obtain verified return/deletion evidence at completion."
        },
        "absent": {
          "gapCode": "A8_33_EXTERNAL_TEST_DATA_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. External testers receive test information but contractual, access, return/deletion or assurance requirements are incomplete.",
          "remediation": "Add test-data security clauses, minimise shared datasets, restrict provider access and obtain verified return/deletion evidence at completion."
        }
      }
    ],
    "quickContext": [
      {
        "key": "usesRealProductionDataForTesting",
        "question": {
          "en": "Is real production information ever used in development or testing because synthetic or masked data is insufficient?",
          "fr": "Des informations réelles de production sont-elles parfois utilisées en développement ou test parce que les données synthétiques ou masquées sont insuffisantes ?"
        }
      },
      {
        "key": "usesExternalTestingProvider",
        "question": {
          "en": "Are development, acceptance or security testing activities performed by an external provider that receives test information?",
          "fr": "Des activités de développement, recette ou tests sécurité sont-elles réalisées par un prestataire externe recevant des informations de test ?"
        }
      }
    ]
  },
  {
    "id": "a8-34",
    "code": "A.8.34",
    "name": "Protection of information systems during audit testing",
    "applicabilityKey": null,
    "questions": [
      {
        "id": "p8_34_001",
        "type": "policy_process",
        "conditionKey": null,
        "question": {
          "en": "Has your organisation defined a controlled approval and planning process for audit tests, scans, penetration tests or other assurance activities that can interact with operational information systems?",
          "fr": "Votre organisation a-t-elle défini un processus contrôlé d’approbation et de planification des tests d’audit, scans, tests d’intrusion ou autres activités d’assurance pouvant interagir avec des systèmes d’information opérationnels ?"
        },
        "partial": {
          "gapCode": "A8_34_AUDIT_TEST_PROCESS_PARTIAL",
          "gap": "Audit-testing governance exists but scope, approvals, rules of engagement or operational safeguards are incomplete.",
          "remediation": "Define an audit-testing procedure requiring authorised scope, timing, methods, restrictions, contacts, escalation, data handling and recovery precautions."
        },
        "absent": {
          "gapCode": "A8_34_AUDIT_TEST_PROCESS_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Audit-testing governance exists but scope, approvals, rules of engagement or operational safeguards are incomplete.",
          "remediation": "Define an audit-testing procedure requiring authorised scope, timing, methods, restrictions, contacts, escalation, data handling and recovery precautions."
        }
      },
      {
        "id": "p8_34_002",
        "type": "application",
        "conditionKey": null,
        "question": {
          "en": "Before audit testing begins, are scope, timing, technical limits, access, monitoring, recovery precautions and emergency contacts agreed with relevant system and business owners?",
          "fr": "Avant le début des tests d’audit, le périmètre, calendrier, limites techniques, accès, surveillance, précautions de reprise et contacts d’urgence sont-ils convenus avec les responsables systèmes et métiers concernés ?"
        },
        "partial": {
          "gapCode": "A8_34_AUDIT_TEST_APPLICATION_PARTIAL",
          "gap": "Audit tests are coordinated but one or more operational safeguards or owner approvals are missing.",
          "remediation": "Use a mandatory pre-test rules-of-engagement checklist and obtain system/business owner approval before activity starts."
        },
        "absent": {
          "gapCode": "A8_34_AUDIT_TEST_APPLICATION_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Audit tests are coordinated but one or more operational safeguards or owner approvals are missing.",
          "remediation": "Use a mandatory pre-test rules-of-engagement checklist and obtain system/business owner approval before activity starts."
        }
      },
      {
        "id": "p8_34_003",
        "type": "proof_traceability",
        "conditionKey": null,
        "question": {
          "en": "Are auditor/tester access, test activities, collected information and final access revocation controlled and evidenced throughout the audit engagement?",
          "fr": "Les accès des auditeurs/testeurs, activités de test, informations collectées et révocation finale des accès sont-ils contrôlés et démontrables tout au long de la mission d’audit ?"
        },
        "partial": {
          "gapCode": "A8_34_AUDIT_TEST_TRACEABILITY_PARTIAL",
          "gap": "Evidence exists but temporary access, test logs, data protection or post-audit revocation/cleanup is incomplete.",
          "remediation": "Use named temporary accounts, least privilege/read-only where possible, log activity, protect audit data and verify all access/data cleanup at closure."
        },
        "absent": {
          "gapCode": "A8_34_AUDIT_TEST_TRACEABILITY_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Evidence exists but temporary access, test logs, data protection or post-audit revocation/cleanup is incomplete.",
          "remediation": "Use named temporary accounts, least privilege/read-only where possible, log activity, protect audit data and verify all access/data cleanup at closure."
        }
      },
      {
        "id": "p8_34_004_critical_pentest",
        "type": "conditional",
        "conditionKey": "hasExternalCriticalPentest",
        "question": {
          "en": "Where external penetration testing targets critical production systems, are additional safeguards such as maintenance windows, rate limits, backups, rollback options or fallback arrangements agreed according to risk?",
          "fr": "Lorsqu’un test d’intrusion externe cible des systèmes critiques de production, des protections supplémentaires telles que fenêtre de maintenance, limites de débit, sauvegardes, rollback ou solutions de repli sont-elles convenues selon le risque ?"
        },
        "partial": {
          "gapCode": "A8_34_CRITICAL_PENTEST_PARTIAL",
          "gap": "Critical-system testing is approved but safeguards are not fully proportionate to potential production impact.",
          "remediation": "Perform a test-specific operational risk assessment and agree safe windows, exclusions, stop conditions, rollback/fallback and live contacts."
        },
        "absent": {
          "gapCode": "A8_34_CRITICAL_PENTEST_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Critical-system testing is approved but safeguards are not fully proportionate to potential production impact.",
          "remediation": "Perform a test-specific operational risk assessment and agree safe windows, exclusions, stop conditions, rollback/fallback and live contacts."
        }
      },
      {
        "id": "p8_34_005_prior_disruption",
        "type": "conditional",
        "conditionKey": "hadAuditTestingDisruption",
        "question": {
          "en": "Where previous audit or security testing caused an operational disruption, were lessons learned formally incorporated into subsequent testing plans and safeguards?",
          "fr": "Lorsqu’un audit ou test sécurité antérieur a provoqué une perturbation opérationnelle, les leçons apprises ont-elles été formellement intégrées aux plans et protections des tests suivants ?"
        },
        "partial": {
          "gapCode": "A8_34_AUDIT_LESSONS_PARTIAL",
          "gap": "Lessons were identified but corrective safeguards are not fully embedded or verified in later test plans.",
          "remediation": "Record root cause and corrective actions, update rules of engagement and verify the new safeguards before the next comparable test."
        },
        "absent": {
          "gapCode": "A8_34_AUDIT_LESSONS_ABSENT",
          "gap": "Materially absent or ineffective implementation of this requirement. Lessons were identified but corrective safeguards are not fully embedded or verified in later test plans.",
          "remediation": "Record root cause and corrective actions, update rules of engagement and verify the new safeguards before the next comparable test."
        }
      }
    ],
    "quickContext": [
      {
        "key": "hasExternalCriticalPentest",
        "question": {
          "en": "Are external penetration tests performed against critical production systems?",
          "fr": "Des tests d’intrusion externes sont-ils réalisés sur des systèmes critiques de production ?"
        }
      },
      {
        "key": "hadAuditTestingDisruption",
        "question": {
          "en": "Has a previous audit, scan or security test caused an unplanned disruption to an operational system?",
          "fr": "Un audit, scan ou test sécurité antérieur a-t-il provoqué une perturbation non planifiée d’un système opérationnel ?"
        }
      }
    ]
  }
] as const;
