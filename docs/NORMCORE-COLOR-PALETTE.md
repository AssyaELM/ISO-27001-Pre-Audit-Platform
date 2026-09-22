# NormCore — Color Palette

This document records the official color palette supplied for NormCore and the
colors currently used in the landing page implementation.

## 1. Official brand palette

| Swatch | Hex | CSS variable | Primary usage |
| --- | --- | --- | --- |
| <span style="display:inline-block;width:48px;height:18px;background:#050E1B;border:1px solid #4A6A72;border-radius:4px"></span> | `#050E1B` | `--ink-950` | Main page background, deepest surfaces |
| <span style="display:inline-block;width:48px;height:18px;background:#071827;border:1px solid #4A6A72;border-radius:4px"></span> | `#071827` | `--ink-900` | Elevated dark backgrounds and dashboard surfaces |
| <span style="display:inline-block;width:48px;height:18px;background:#0C1B2D;border:1px solid #4A6A72;border-radius:4px"></span> | `#0C1B2D` | `--ink-850` | Cards, secondary panels and button surfaces |
| <span style="display:inline-block;width:48px;height:18px;background:#12323E;border:1px solid #4A6A72;border-radius:4px"></span> | `#12323E` | `--ink-800` | Hover states and lighter dark surfaces |
| <span style="display:inline-block;width:48px;height:18px;background:#09535B;border:1px solid #4A6A72;border-radius:4px"></span> | `#09535B` | `--teal-800` | Deep teal gradients, progress tracks and atmosphere |
| <span style="display:inline-block;width:48px;height:18px;background:#18D3B5;border:1px solid #4A6A72;border-radius:4px"></span> | `#18D3B5` | `--teal-500` | Primary CTA, active states and main brand accent |
| <span style="display:inline-block;width:48px;height:18px;background:#31DFC4;border:1px solid #4A6A72;border-radius:4px"></span> | `#31DFC4` | `--teal-400` | CTA hover, highlights and luminous accents |
| <span style="display:inline-block;width:48px;height:18px;background:#62E9D4;border:1px solid #4A6A72;border-radius:4px"></span> | `#62E9D4` | `--teal-300` | Eyebrows, icons, borders and supporting accents |
| <span style="display:inline-block;width:48px;height:18px;background:#EAF5F6;border:1px solid #4A6A72;border-radius:4px"></span> | `#EAF5F6` | `--ice` | Primary body text and light interface elements |
| <span style="display:inline-block;width:48px;height:18px;background:#FFFFFF;border:1px solid #4A6A72;border-radius:4px"></span> | `#FFFFFF` | `--white` | Headlines and highest-contrast text |
| <span style="display:inline-block;width:48px;height:18px;background:#4A6A72;border:1px solid #EAF5F6;border-radius:4px"></span> | `#4A6A72` | `--slate` | Muted UI elements, inactive states and tracks |
| <span style="display:inline-block;width:48px;height:18px;background:#C9627A;border:1px solid #EAF5F6;border-radius:4px"></span> | `#C9627A` | `--risk` | Risk, warning and implementation-gap accents |

## 2. CSS tokens used by the landing page

```css
:root {
  --ink-950: #050e1b;
  --ink-900: #071827;
  --ink-850: #0c1b2d;
  --ink-800: #12323e;
  --teal-800: #09535b;
  --teal-500: #18d3b5;
  --teal-400: #31dfc4;
  --teal-300: #62e9d4;
  --ice: #eaf5f6;
  --white: #ffffff;
  --slate: #4a6a72;
  --risk: #c9627a;
}
```

The lowercase values in the CSS are identical to the uppercase brand values.
Hexadecimal color notation is case-insensitive.

## 3. Additional implementation colors

These supporting colors are used sparingly in the landing page. They are
derived companions to the official palette, not replacements for brand tokens.

| Swatch | Hex | Usage in the landing page |
| --- | --- | --- |
| <span style="display:inline-block;width:48px;height:18px;background:#07141F;border:1px solid #4A6A72;border-radius:4px"></span> | `#07141F` | Deep endpoint in the diorama background gradient |
| <span style="display:inline-block;width:48px;height:18px;background:#5B8EA0;border:1px solid #EAF5F6;border-radius:4px"></span> | `#5B8EA0` | Physical Security indicator in the dashboard preview |
| <span style="display:inline-block;width:48px;height:18px;background:#3EB5A9;border:1px solid #EAF5F6;border-radius:4px"></span> | `#3EB5A9` | Technological Security indicator in the dashboard preview |
| <span style="display:inline-block;width:48px;height:18px;background:#4E9BAA;border:1px solid #EAF5F6;border-radius:4px"></span> | `#4E9BAA` | Physical Security domain-card accent |
| <span style="display:inline-block;width:48px;height:18px;background:#E79BAD;border:1px solid #4A6A72;border-radius:4px"></span> | `#E79BAD` | Lighter risk icon color on dark surfaces |

## 4. Transparency and gradients

The interface also uses transparent versions of the official colors for glass
panels, borders, shadows and atmospheric light. Examples include:

```css
rgba(5, 14, 27, 0.72)    /* translucent --ink-950 */
rgba(9, 83, 91, 0.22)    /* translucent --teal-800 */
rgba(24, 211, 181, 0.17) /* translucent --teal-500 */
rgba(98, 233, 212, 0.12) /* translucent --teal-300 */
rgba(234, 245, 246, 0.71)/* translucent --ice */
rgba(201, 98, 122, 0.25) /* translucent --risk */
```

These opacity variants create the premium matte-glass effect while keeping the
official palette as the visual foundation.

## 5. Recommended hierarchy

- **Background:** `#050E1B`, `#071827`, `#0C1B2D`
- **Primary action:** `#18D3B5`
- **Action hover and glow:** `#31DFC4`
- **Supporting accent:** `#62E9D4`
- **Headline:** `#FFFFFF`
- **Body text:** `#EAF5F6`
- **Muted interface:** `#4A6A72`
- **Risk and warning:** `#C9627A`

## 6. Source files

- Main design tokens and UI colors: `app/globals.css`
- Open Graph artwork colors: `app/opengraph-image.tsx`
- Scroll World scene accents: `content/scenes.ts`
