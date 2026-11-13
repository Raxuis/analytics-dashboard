---
name: Raxuis Passport
description: A personal passport on a quiet charcoal stage.
colors:
  stage: "#141416"
  surface: "#242428"
  paper: "#f3f3f4"
  muted: "#b5b5bd"
  panel: "#252529"
  panel-hover: "#35353b"
  toolbar: "#232326"
  control-hover: "#343439"
  uv-active: "#3b334d"
  uv-text: "#e2d5ff"
  focus: "#d3c9ec"
  leather: "#3d0827"
  cover-body: "#3b0c25"
  foil: "#d8b36b"
  document-paper: "#e8dfd4"
  document-ink: "#393747"
  document-muted: "#8b808d"
  stamp: "#b55d43"
typography:
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 500
  destination:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  control: "8px"
  link-trigger: "10px"
  toolbar: "12px"
  panel: "14px"
spacing:
  compact: "8px"
  control: "12px"
  row: "14px"
  mobile-edge: "16px"
  content: "24px"
  desktop-edge: "32px"
components:
  links-button:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.link-trigger}"
    padding: "0 14px"
  links-button-hover:
    backgroundColor: "{colors.panel-hover}"
  document-control:
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "44px"
  document-control-hover:
    backgroundColor: "{colors.control-hover}"
  document-control-uv-active:
    backgroundColor: "{colors.uv-active}"
    textColor: "{colors.uv-text}"
  links-panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "8px"
    width: "304px"
  destination-row:
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  destination-row-hover:
    backgroundColor: "{colors.panel-hover}"
---
# Design System: Raxuis Passport

## Overview

**Creative North Star: "The Personal Passport"**

A single French-inspired personal passport sits in the middle of a neutral stage. Burgundy leather, metallic gold, printed paper and the original R identity carry the personality; the surrounding interface stays quiet and functional.

The object is the experience. Small destination links and controls remain legible and available independently of the scene. Texture and dimensional motion belong to the passport, while the HTML interface uses restrained tonal surfaces.

**Key Characteristics:**
- Centered physical object with generous empty space.
- Neutral DM Sans controls and compact destination panels.
- Burgundy leather, gold foil and personal identity preserved.
- Direct links remain available during loading and without WebGL.

## Colors

The neutral interface frames the warm, tactile identity of the passport. Frontmatter values are normative and come from the implemented homepage.

### Primary
- **Burgundy leather** (`leather`, `cover-body`): the canvas cover and physical mesh body, respectively.
- **Metallic gold** (`foil`): the mesh foil tint for the personal crest and cover lettering. Lighting changes its apparent color.

### Secondary
- **UV violet** (`uv-active`, `uv-text`): the active UV control; not a general navigation accent.
- **Stamp ink** (`stamp`): printed marks within the document.

### Neutral
- **Charcoal stage** (`stage`): the full viewport background.
- **Soft white** (`paper`) and **secondary gray** (`muted`): primary labels and supporting labels.
- **Control charcoal** (`surface`, `toolbar`, `panel`): root surface primitive, bottom toolbar and floating destination panel. Their small tonal differences are intentional records of the build.
- **Interactive charcoal** (`panel-hover`, `control-hover`): destination and toolbar hover states.
- **Lavender focus** (`focus`): visible keyboard focus.
- **Printed paper and ink** (`document-paper`, `document-ink`, `document-muted`): canvas document pages only.

**The Object Color Rule.** Burgundy and gold belong to the passport; surrounding navigation stays neutral except for functional UV and focus states.

## Typography

**Body Font:** DM Sans, locally served, with sans-serif fallback.

The surrounding interface has no display headline. Its compact hierarchy uses body actions, slightly stronger destination names, small metadata and an occasional destination title. The frontmatter records the observed HTML roles; the wordmark uses medium-weight DM Sans at 14px, reduced to 13px on mobile. Counters use tabular numerals.

Space Grotesk and monospace are confined to printed canvas document content on this surface. Canvas texture sizes are texture coordinates, not a reusable HTML type ramp. Both named fonts are loaded from local assets.

**The Quiet Type Rule.** Keep surrounding text functional and subordinate to the physical document.

## Layout

The homepage fills the small viewport height (`100svh`) with a minimum height of 360px. The stage sits between the unobtrusive top identity/actions and the centered bottom toolbar. The desktop header is 80px high with 32px horizontal insets; the stage reserves 70px above and 104px below. The toolbar sits 28px from the bottom or respects the safe-area inset.

At widths of 600px and below, the header becomes 72px high with 18px horizontal padding. The links panel moves to a 16px right inset and caps its width at the viewport minus 32px. The destination peek moves above the toolbar. The scene camera fits both the closed cover and open spread to the available aspect ratio, preserving the center rather than adding a text column.

For landscape heights of 500px and below at widths of at least 601px, the header and stage reservations compress; the toolbar bottom inset becomes 14px. Panels scroll within the available viewport.

This describes the approved passport homepage. The separate analytics route retains its existing layout and is not a source for new passport styling.

## Elevation & Depth

Depth is physical in the passport: rounded geometry, leather bump texture, paper layers, metallic foil and soft cast shadows. The surrounding controls are flat tonal surfaces. Only floating destination panels use diffuse CSS shadows: the link list uses `0 18px 46px #0006`, the destination peek uses `0 15px 45px #0005`. The native document uses `8px 17px 36px #0005` under its burgundy binding.

The scene fades in over 0.65s. Opening and camera fitting use 1.35s with GSAP `power3.inOut`; page rotation uses 1.1s with `power2.inOut`. Interface color/background states transition over 0.16s with CSS `ease`. Reduced motion removes CSS transitions and uses immediate scene changes with no pointer tilt.

## Shapes

Controls use gently rounded corners, with progressively rounder enclosing surfaces: control, trigger, toolbar and panel radii are recorded in the frontmatter. The links panel is borderless. Destination rows and toolbar controls retain generous hit areas despite small text; toolbar controls are 44px high, while destination rows have a 72px minimum height.

The passport retains its tall document proportions, narrow spine, rounded outer corners and layered paper silhouette. The HTML fallback uses an 88:125 aspect ratio with asymmetric spine/outer-corner rounding and a slight rotation.

## Components

### Identity and link trigger

The original R image sits beside a small Raxuis wordmark. A compact Liens button at the opposite edge opens a nonmodal panel. Its expanded state uses the same tonal treatment as hover; it does not introduce a page heading or dividing rule.

### Document controls

A compact bottom group provides UV and opening controls, then previous/next page, counter and close actions when open. Disabled buttons use 0.35 opacity. UV uses the violet active treatment and an explicit pressed state. Icons are simple outlined SVGs beside action text or accessible labels.

### Destination panel and rows

A compact floating list groups destination links, then utility actions. Rows pair a monochrome icon with a medium-weight destination name and muted metadata. Each entire row is a link; hover changes its background. Opening the panel focuses its first link, Escape closes it and returns focus to the trigger, and outside pointer interaction closes it.

### Destination peek

Selecting a destination within the passport opens a small contextual panel with close control, destination name, supporting label and a direct link. It uses the same tonal surface and rounded language as the links list; its title is the largest HTML text in this surface.

### Loading and simple view

A muted status label and thin real resource progress meter occupy the object's region during loading. Scene failure or the explicit simple-view action displays an open native HTML passport with identity fields and all four direct destinations. Pages sit side by side on desktop and stack on mobile. A return control remounts the interactive scene. The object never becomes a prerequisite for navigation.

### Focus

Links and buttons share a visible lavender outline (2px, offset 4px). The skip link appears on focus and opens direct links. Preserve visible focus through all panel states.

## Do's and Don'ts

### Do:
- **Do** preserve the original R mark and the burgundy passport with its gold personal crest.
- **Do** keep actions concise, keyboard reachable and visually secondary to the object.
- **Do** preserve direct HTML destinations through loading, simple view and scene failure.
- **Do** keep document texture, print typography and material gradients inside the passport.

### Don't:
- **Don't** add a large editorial headline, slogan, header rule or marketing cards around this homepage's passport.
- **Don't** apply the passport's foil, printed page typography or leather texture to surrounding navigation.
- **Don't** use em dashes or slash separators in displayed copy.
- **Don't** replace real resource progress with a simulated loading percentage.

### Interior paper and visa interaction

The printed interior uses an ivory document substrate, small aligned identity fields, a straight portrait, subtle guilloché and watermark, and ink visa outlines containing real destination names. No invented birth date or document number. Shared normalized visa regions drive both printing and hit testing. Hover outlines and fills the exact stamp; pointer-down strengthens the fill; selection adds a check. Blank paper has no destination. The turned leaf is inset within the cover and rests at z=0.355. The previous brown click ring is removed.

### Personal travel pages and city markers

The travel list in `travel-content.ts` generates one paper page per country, grouped into spreads after identity and links. The current six pages include South Korea (3 visits), Japan (2 visits), the United States (California, Florida, New York), and Iceland. Natural Earth silhouettes are blue stippled security grounds; personal adhesive-style vignettes contain supplied travel facts without dates or official permissions. A catalog of 177 silhouettes is prepared ahead of time. Only configured country images are requested.

Cities are projected from geographic coordinates using the exact projection of their country silhouette. Three static thin rings identify each city, with a small point at the center. A quiet charcoal tooltip names the city and country and gives one short fact. Native HTML exposes every city as a keyboard-focusable point with the same information. Touch opens the tooltip; a new selection dismisses it.

The moving leaf snapshots four faces from the outgoing and incoming spreads. It is opaque, bends by at most 0.1 units, follows a horizontal drag and settles forward or back on release. Native controls are disabled during a turn. A click does not turn a page, and a drag does not activate a destination. Cover click opens the book. Page 2 destination visas use contour hover/selection feedback without arrow decoration.

Page 1 uses one aligned portrait and field group, a separate site row and two-line document zone, without a ghost photo or spare signature label. Native HTML exposes identity, links and every generated travel page, stacking on mobile.

The rear cover closes by rotating the right-hand cover and page block around the spine over the left block, while the whole book keeps its orientation. This is a single 1.1s action, reversed on reopening. The United States map gives the contiguous states the main frame and uses separate Alaska and Hawaii insets; each inset retains a projection so future city markers remain accurate. Completed drags wait for the parent page acknowledgement before accepting another requested turn, preventing an animation echo.

Native travel pages include a quiet single row of city-name buttons below the map, each with at least a 44px touch height. Long lists scroll horizontally rather than wrapping, with a thin scrollbar and room for keyboard focus rings. These provide independent touch selection for tightly clustered cities such as Kyoto, Osaka and Nara. Selecting a name opens a short inline detail; Escape dismisses it. Geographic markers remain in their true positions.

Page 2 visa destinations have distinct paper tints: portfolio blue #d7e3ef, GitHub lilac #e4d9ed, LinkedIn sage #d3e8df, X peach #efddce. These colors are shared with native links through `visaPapers` in `passport-layout.ts`. The repeated RAXUIS label inside each visa is removed; destination and handle remain centered. Native hover/press darkens the existing tint instead of replacing all backgrounds with one color.

The identity-page reading strip uses the self-hosted OCR B face (Tsukurimashou 0.3.1), two full-width rows of 44 evenly spaced optical cells, a warm clear-paper substrate and a fine top rule. Its personal-profile strings are shared between canvas and HTML in identity-data.ts; there is no invented birth date, document number or check digit. The lavender boxed footer is removed.
