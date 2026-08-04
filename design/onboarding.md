Voici votre contenu uniquement réorganisé en étapes et en écrans, sans ajouter de questions ni modifier les choix.

## Étape 1 — Organization

### Écran 1 — Organization name

**Organization name**

Champ libre.

Navigation :

```text
[ Back ]                         [ Continue ]
```

### Écran 2 — Company size

**English**

How many people work in your organization?

**Français**

Combien de personnes travaillent dans votre organisation ?

```text
[ 1–10 ]       [ 11–50 ]
[ 51–200 ]     [ 201–500 ]
[ 501–1,000 ]  [ 1,001+ ]
```

Navigation :

```text
[ Back ]                         [ Continue ]
```

### Écran 3 — Primary country

Cette information sera utile pour les exigences légales, la protection des données et les futurs documents.

**English**

What is your organization’s primary country of operation?

**Français**

Quel est le principal pays d’activité de votre organisation ?

Liste déroulante avec recherche :

```text
Primary country *

[ Search for a country                         ▼ ]
```

Navigation :

```text
[ Back ]                         [ Continue ]
```

### Écran 4 — Industry

**English**

What is your organization’s primary industry?

**Français**

Quel est le secteur d’activité principal de votre organisation ?

Liste déroulante avec recherche :

- Software / SaaS
- Financial Services
- Healthcare / Life Sciences
- Professional Services / Consulting
- E-commerce / Retail
- Manufacturing / Industrial
- Education
- Telecommunications
- Media / Technology
- Government / Public Sector
- Non-profit Organization
- EN: Public sector — FR: Secteur public
- EN: Other — FR: Autre

Si `Other / Autre` est sélectionné, afficher un champ de texte libre.

Navigation :

```text
[ Back ]                         [ Continue ]
```

## Étape 2 — Operating environment

### Écran 1 — Software development

**English**

Does your organization develop software or applications?

Choix :

- Yes — Internal development team
- Yes — Development is outsourced
- Yes — Both internal and outsourced
- No
- Not sure

**Français**

Votre organisation développe-t-elle des logiciels ou des applications ?

Choix :

- Oui — Équipe de développement interne
- Oui — Développement externalisé
- Oui — Interne et externalisé
- Non
- Je ne sais pas

Navigation :

```text
[ Back ]                         [ Continue ]
```

### Écran 2 — Work model

**English**

What is your organization’s primary work model?

Choix :

```text
[ 💻 Fully remote ]
Everyone primarily works remotely.

[ 🔄 Hybrid ]
Teams work both remotely and on-site.

[ 🏢 Primarily on-site ]
Most work is performed from company locations.
```

**Français**

Quel est le principal mode de travail de votre organisation ?

Navigation :

```text
[ Back ]                         [ Continue ]
```

## Étape 3 — Assessment scope

### Écran 1 — Assessment coverage

**English**

What should this assessment cover?

**Français**

Que doit couvrir cette évaluation ?

Choix :

```text
[ 🏢 Entire organization ]
All departments, people, locations and systems.

[ 📦 A specific product or service ]
One product, platform or customer-facing service.

[ 👥 A business unit or department ]
One team, department or operational unit.

[ 📍 A specific location ]
One office, facility or geographic location.

[ ❓ Not decided yet ]
The assessment scope will be defined later.
```

Navigation :

```text
[ Back ]                         [ Continue ]
```

### Si « Entire organization » est sélectionné

NormCore utilise automatiquement le nom de l’entreprise comme nom du périmètre :

```text
Assessment scope: Acme Ltd — Entire organization
```

Aucun champ supplémentaire obligatoire.

### Si « A specific product or service » est sélectionné

Afficher deux champs libres :

```text
Product or service name *

[ NormCore SaaS Platform                       ]

Scope description *

[ Development, hosting and operation of...     ]
```

### Si « A business unit or department » est sélectionné

Afficher deux champs libres :

```text
Business unit or department name *

[ Information Technology                      ]

Scope description *

[ IT operations, infrastructure and support... ]
```

### Si « A specific location » est sélectionné

Afficher deux champs libres :

```text
Location name *

[ Casablanca Office                            ]

Scope description *

[ Employees, equipment and operations located... ]
```

### Si « Not decided yet » est sélectionné

Aucun champ supplémentaire.

NormCore affiche un avertissement.

Navigation :

```text
[ Back ]                         [ Continue ]
```

## Étape 4 — Assessment owner

### Écran 1 — Owner information

Informations affichées :

- Nom prérempli
- E-mail prérempli

### Fonction professionnelle

**English**

What is your role in the organization?

**Français**

Quelle est votre fonction dans l’organisation ?

Liste déroulante :

- EN: Founder / Executive  
  FR: Fondateur / Direction générale

- EN: IT Manager / SysAdmin  
  FR: Responsable Informatique (DSI) / SysAdmin

- EN: Security Manager / CISO  
  FR: Responsable Sécurité (RSSI)

- EN: Compliance / Risk Manager  
  FR: Responsable Conformité / Risques

- EN: Data Protection / Privacy Manager  
  FR: Délégué à la Protection des Données (DPO)

- EN: Engineering / Development Manager  
  FR: Directeur Technique (CTO) / Lead Developer

- EN: HR / Operations Manager  
  FR: Responsable RH / Opérations

- EN: Project Manager  
  FR: Chef de Projet

- EN: Consultant / External Advisor  
  FR: Consultant / Conseiller externe

- EN: Other  
  FR: Autre

Si `Other / Autre` est sélectionné, afficher un champ libre obligatoire :

```text
Please specify your role *

[ ____________________________________________ ]
```

Navigation :

```text
[ Back ]                         [ Continue ]
```

## Étape 5 — Review

### Écran 1 — Vérification finale

Afficher un résumé complet des informations renseignées dans les étapes précédentes.

Navigation finale :

```text
[ Back ]                  [ Create workspace ]
```
