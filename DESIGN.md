---
name: "Domheap"
description: "A restrained reading room for ship-owned publications."
colors:
  paper: "#f3f5f0"
  ink: "#233b32"
  muted: "#53645a"
  line: "#cbd4cb"
  accent: "#285b42"
  field: "#fff"
  soft: "#e5ebe2"
  error: "#9b3329"
  night-paper: "#1d1e20"
  night-ink: "#eeece7"
  night-muted: "#bab8b2"
  night-line: "#48494c"
  night-accent: "#dccbad"
  night-field: "#252629"
  night-soft: "#2d2e31"
  night-error: "#ffafa2"
typography:
  display:
    fontFamily: "Source Serif 4, serif"
    fontSize: "clamp(44px, 6.5vw, 78px)"
    fontWeight: 400
    lineHeight: 1.13
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Source Serif 4, serif"
    fontSize: "clamp(38px, 5vw, 62px)"
    fontWeight: 400
    lineHeight: 1.13
    letterSpacing: "-0.025em"
  article-headline:
    fontFamily: "Source Serif 4, serif"
    fontSize: "clamp(39px, 5.5vw, 64px)"
    fontWeight: 400
    lineHeight: 1.13
    letterSpacing: "-0.025em"
  post-title:
    fontFamily: "Source Serif 4, serif"
    fontSize: "33px"
    fontWeight: 400
    lineHeight: 1.13
    letterSpacing: "-0.025em"
  prose:
    fontFamily: "Source Serif 4, serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.72
  excerpt:
    fontFamily: "Source Serif 4, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.6
  metadata:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: "3px"
  avatar: "4px"
spacing:
  field-gap: "8px"
  action-gap: "12px"
  inline-gap: "18px"
  paragraph: "20px"
  mobile-gutter: "22px"
  form-gap: "23px"
  editor-inset: "24px"
  list-gap: "30px"
  desktop-gutter: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "9px 17px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "9px 17px"
  button-secondary-hover:
    backgroundColor: "{colors.soft}"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    width: "100%"
  notice:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    padding: "20px"
  post-row:
    padding: "34px 0"
  subscription-term:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "17px"
  subscription-term-selected:
    backgroundColor: "{colors.soft}"
---

# Design System: Domheap

## Overview

**Creative North Star: "The Working Syllabus"**

Domheap takes the form of a reader's working syllabus: considered writing, quiet source information, and open lists on a continuous paper ground. The publication's identity leads. Controls stay compact and plainly labeled so publishing and subscription tasks share the same restrained setting.

Pale cool paper and forest ink establish day; neutral charcoal and warm paper establish night. Source Serif 4 gives writing a literate voice, while Public Sans keeps operational information clear. Fine rules and spacing organize the surface.

**Key Characteristics:**
- Continuous viewport-filling ground in Day, Night, and Auto themes.
- Serif writing paired with quiet sans-serif controls and metadata.
- Open lists, fine dividers, and nearly square controls.
- Publication imagery appears when supplied by the publication.

## Colors

Frontmatter records day colors under their CSS property names and night colors under `night-` names. Both themes map to the same semantic CSS properties.

### Primary

- **Forest accent / warm sand accent** (`accent`, `night-accent`): link and primary-action hover, focus outlines, selection controls, and carets.
- **Forest ink / warm paper ink** (`ink`, `night-ink`): primary text and solid primary actions. Primary actions reverse ink and paper.

### Neutral

- **Cool paper / charcoal ground** (`paper`, `night-paper`): continuous page background.
- **Quiet forest / warm gray** (`muted`, `night-muted`): dates, descriptions, hints, and secondary information.
- **Pale rule / charcoal rule** (`line`, `night-line`): dividers and control outlines.
- **White field / charcoal field** (`field`, `night-field`): entry surfaces.
- **Soft sage / soft charcoal** (`soft`, `night-soft`): notices, selected terms, code blocks, and secondary-action hover.

Error text uses `error` or `night-error` alongside a textual message.

**The Continuous Ground Rule.** The root, body, and application frame share the active paper ground through the full viewport.

## Typography

**Reading and display:** Source Serif 4, with serif fallback. **Interface:** Public Sans, with sans-serif fallback. Both are bundled locally. Source Serif 4 provides regular, italic, and semibold faces; Public Sans provides regular and semibold faces. Source editing and payment addresses use monospace.

The exact hierarchy appears in frontmatter. Publication display leads; fluid page and article headlines follow. Standard section headings use (30px), smaller headings (25px), and descriptions (24px). Operational section labels use the label role. The wordmark uses Source Serif 4 at (29px), weight (600), and tracking (-0.035em). Headings use balanced wrapping. Dates use tabular numerals.

Excerpts stop at (55ch); descriptions stop at (32em). At the mobile breakpoint, prose and excerpts use (18px), post titles use (29px), descriptions use (20px), and the wordmark uses (26px). Body copy retains its base size.

**The Two Voices Rule.** Source Serif 4 carries writing and titles; Public Sans carries navigation, metadata, and controls.

## Layout

The header centers inside (1180px). Main content and footer use (1100px); article content narrows to (850px), author tools to (960px), and subscriptions to (800px). Main padding is (58px 40px 100px). A full-viewport flex column lets main content expand and places the footer below short pages.

Post rows pair a (155px) metadata column with writing across a (30px) gap. Forms use one column capped at (650px), with a (23px) vertical gap. Pricing rows pair amounts with separate-override checkboxes. Subscription terms use two equal columns.

At (650px) and below, main padding becomes (35px 22px 65px), header navigation takes its own scrollable row, bylines stack, and post metadata moves above the title. Inline forms stack and editors use (16px) padding. At (420px) and below, subscription terms become a single column.

## Elevation & Depth

The interface uses no box shadows. Fine borders, soft tonal fields, whitespace, and typography distinguish regions. Reading content remains on the page ground. Keyboard focus uses a (2px) accent outline offset by (4px).

**The Open Surface Rule.** Reading lists and author rows use whitespace and fine dividers. Shadows do not establish their hierarchy.

## Shapes

Controls, editors, covers, and subscription options use the control radius; avatars use the avatar radius. Dividers and outlines are (1px); selected author tabs use a (2px) underline. Rectangular geometry and open edges establish the form language. Supplied avatars and covers use object-fit cropping.

## Components

### Buttons

Primary actions use ink with paper text; secondary actions use transparent backgrounds and line borders. Both use the label role, control radius, and frontmatter padding, with a minimum height of (44px). Primary hover uses accent; secondary hover uses soft. Disabled buttons use opacity (0.55) and a waiting cursor. Keyboard focus uses the shared outline.

### Inputs / Fields

Visible semibold labels sit above full-width native controls. Inputs, selects, and textareas use field backgrounds and line borders. Minimum height is (46px); textareas start at (180px) and resize vertically. Hints use muted metadata text; errors use the error color. Checkboxes remain native, with the accent color.

### Navigation

Plain header links sit beside the serif wordmark and Auto / Day / Night selector. Hover uses accent and an underline. Owner navigation includes Reading room and Settings; public navigation includes Subscribe. Author tabs scroll horizontally as needed and mark the selected tab with semibold text and an ink underline.

### Open lists and notices

Post rows pair a date and optional subscriber condition with a serif title, muted excerpt, and small reading link. Member and writing rows share the open, divided structure. Notices use a flat soft rectangle with paragraph-scale padding. Empty states use a heading and helpful text on the page ground.

### Reading surface

Pretext lays out visible prose lines after the bundled fonts load and recalculates when available width changes. Inline emphasis and links retain their semantics. Images stay within the reading column; code and tables scroll as needed. Blockquotes use a thin left rule and muted italic text.

The subscription boundary uses a fine top rule, serif invitation, supporting text, and primary action. When reduced motion is not requested, it reveals through a clipped edge over (0.5s) with `cubic-bezier(0.16, 1, 0.3, 1)`. Unchanged background updates preserve the visible reading surface.

### Subscription terms and prices

Terms are bordered rectangular radio labels. A selected option uses the soft surface and ink border. Day, week, month, and year choices present prices and access duration in the body and metadata hierarchy. Settings start at ($5/month), calculate equivalents from a selected period, and provide a separate override beside each amount. Prices remain form content rather than display typography.

## Do's and Don'ts

### Do:

- Do preserve the full-height paper ground in both themes.
- Do keep writing in Source Serif 4 and operational labels in Public Sans.
- Do keep dates and access conditions quieter than post titles.
- Do use visible labels and the shared keyboard focus outline.
- Do preserve the visible reading surface during unchanged background updates.

### Don't:

- Don't add decorative artwork to stand in for a publication's identity.
- Don't give open reading lists raised card treatments.
- Don't tint the night ground green; its charcoal surfaces remain neutral.
- Don't turn metadata into decorative badges or prominent promotional headings.
