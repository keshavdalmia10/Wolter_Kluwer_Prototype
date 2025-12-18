# Prototype Design: AnswerConnect (UI + Minimal Backend Notes)

This document describes the **prototype UI design and functionality** for AnswerConnect’s two surfaces:

- **Integrated Research & Drafting Workspace**
- **Cognitive Workflow Orchestrator**

Scope notes:
- The prototype is **frontend-only** (hardcoded data + in-memory state). It demonstrates UX and state transitions, not production integrations.
- Backend notes are included **only where necessary** to explain the UX and what the UI expects.

---

## 1) IA (Information Architecture)

Global pattern shared by both surfaces:
- **Top header**: “CCH” badge + “AnswerConnect”, with module name on the right side of the breadcrumb.
- **Primary navigation**: surface-specific tabs (Drafting: feature tabs; Workflows: Workflows/Analytics).
- **3-column layout**:
  - Left: navigation or lists (documents/workflows).
  - Center: primary work area (document editor / workflow details / builder canvas / analytics).
  - Right: assistant/insights/actions panel.

UI design intent:
- Keep the *user’s work artifact* centered (the memo or the workflow).
- Keep AI and automation controls on the right as a “companion” panel.

---

## 2) Integrated Research & Drafting Workspace (UI Spec)

### 2.1 Layout and main regions

Left sidebar (document navigation)
- Primary action: **New Memo** (opens a document-type chooser).
- Document type chooser options:
  - Tax Research Memorandum
  - Tax Opinion Letter
  - Audit File Memo
- Recent Documents list with a highlighted active document.

Center (document editor)
- Editable title input.
- Metadata row (last modified, matter context).
- Document content structured into sections:
  - Executive Summary
  - I. Business Expense Deductions Under IRC section 162
  - II. Charitable Contribution Substantiation
  - III. Hobby Loss Rules Under IRC section 183
  - Conclusion
- “Citation Legend” block defining visual tags:
  - Code (statutes/regulations)
  - Case (court cases)
  - Alert (unsupported claims)
  - New (recently inserted)

Right panel (AI Research Assistant)
- Header: **AI Research Assistant**.
- Content varies by selected feature tab.

Top feature tabs
- **Smart Suggestions**
- **Flags & Alerts**
- **Auto Citations**
- **Research Memory**


### 2.2 Smart Suggestions (detailed behavior)

Entry
- User clicks **Smart Suggestions** tab.

Typing simulation (prototype behavior)
- The editor “types” a prebuilt paragraph.
- At a specific point in the typing sequence, the UI sets “suggestions available”.

Suggestion list (right panel)
- When suggestions are available, display a vertical list of suggestion cards.
- Each suggestion card includes:
  - Authority title
  - Authority type (Statute / Tax Court / Regulation)
  - Relevance percent (e.g., “95% match”)
  - Quote excerpt (truncated)
  - “Why relevant” rationale
  - Primary CTA: **Insert Citation**

Insert Citation action (what happens)
- Clicking **Insert Citation** performs an atomic UI update:
  1) Marks citation as inserted and hides suggestion cards.
  2) Updates the center editor paragraph by visually highlighting the inserted authority as “New”.
  3) Adds the inserted authority to **Table of Authorities** (TOA).
  4) Adds an entry to **Research Memory** linking:
     - claim text → authority → quote + timestamp.
  5) Shows a success block in the editor: “Citation Successfully Inserted!”.

Post-insert success state (right panel)
- Replaces suggestion list with a “Citation Inserted Successfully” confirmation.
- Confirms the 4 effects:
  - Added to document
  - Included in TOA
  - Saved to Research Memory
  - Linked to the specific claim

Empty/idle state
- If suggestions are not yet shown, right panel displays: “Suggestions will appear as you type…”.


### 2.3 Flags & Alerts (detailed behavior)

Entry
- User clicks **Flags & Alerts** tab.
- The UI also triggers the “Update Alert” banner visibility in the editor.

A) Inline Unsupported Claim highlight
- In Section I, the phrase “Courts generally require contemporaneous documentation” is highlighted as an unsupported claim.
- An alert icon appears beside the highlight.
- Hovering shows a tooltip:
  - Label: “Unsupported Claim”
  - Guidance: “This statement needs supporting authority. Consider citing: …”
  - Suggested authority: “Cohan v. Commissioner, 39 F.2d 540 (2d Cir. 1930) …”
  - CTA: **Add Citation**

Add Citation action (unsupported claim)
- Clicking **Add Citation**:
  - Marks the claim as “fixed”.
  - Adds the Cohan authority into the editor (now visually styled as supported + “New”).
  - Adds the authority to the TOA as “Just added!”.
  - Adds an entry to Research Memory linking:
    - claim text → Cohan → quote + timestamp.
  - Shows a success block: “Unsupported Claim Fixed!”

B) Update Alert banner (authority update)
- In Section II, a banner appears:
  - “Update Alert” and a summary indicating an existing authority has been distinguished by a new decision.
  - Two CTAs:
    - **Review Update**
    - **Dismiss**

Dismiss behavior
- Clicking **Dismiss** hides the banner.

Review Update behavior
- Clicking **Review Update** opens an in-document panel: **Authority Update Review**.


### 2.4 Authority Update Review (detailed behavior)

Panel structure
- Header with title “Authority Update Review” and a close (X) button.
- Three content blocks:
  1) Original citation in memo (shows the cited authority + the specific sentence).
  2) New development (new authority summary).
  3) Recommendation block (bulb icon + guidance text).

Actions
- **Add Garcia Citation** (primary)
  - Disabled after use.
  - After click:
    - Adds “Garcia v. Commissioner (2024)” to TOA as “Just added!”.
    - Adds a Research Memory entry for Garcia.
    - Adds a note into the memo text (Section II) referencing Garcia.
    - Auto-closes the review panel after a short delay.
- **View Full Case** (secondary)
  - Present in UI; in prototype, this is non-functional.
- **Close**
  - Closes the panel without changing content.


### 2.5 Auto Citations (Table of Authorities) (detailed behavior)

Entry
- User clicks **Auto Citations** tab.

TOA structure
- Header: “Table of Authorities”.
- Groups shown:
  - Cases
  - Statutes
  - (Additional groups may appear below depending on content)

Automatic updates
- When the user inserts a citation or fixes an unsupported claim, the TOA shows:
  - “Table Updated” banner.
  - Newly added items in a highlighted “Just added!” style.


### 2.6 Research Memory (detailed behavior)

Intent
- Preserve a trace of “why this statement is supported”, separate from the memo body.

Data captured per memory entry
- claim text
- authority title
- supporting quote
- timestamp

Expected UX
- A list of memory entries (most recent first).
- Coverage/health summary messaging (prototype displays some coverage cues through the Flags panel).

---

## 3) Cognitive Workflow Orchestrator (UI Spec)

### 3.1 Layout and main regions

Left sidebar
- Primary CTA: **Create New Workflow**.
- “Active Workflows” list:
  - Each card shows name, description, steps count, accuracy, avg-time badge, and last run.
- “Templates” quick list (simple list items; separate from the main Templates Library on the right).

Center
- One of:
  - Workflow details (when a workflow is selected)
  - Empty state (“Select a Workflow”)
  - Workflow Builder (when creating a new workflow)
  - Analytics dashboard (when Analytics tab active)

Right panel
- Default: “Quick Actions” (Create from Template, View All Templates, Export Metrics Report) + Pro Tip.
- Alternative view: Templates Library (search + categories + use template).


### 3.2 Workflows list and selection

Workflow card behavior
- Clicking a workflow card sets it as active and shows its details in the center.
- The selected card gets a highlighted border/background.

Workflow metadata shown in details
- Name + description
- Run button + Configure button
- Summary metric cards:
  - Total Steps
  - Avg. Time
  - Accuracy
  - Trigger


### 3.3 Run Workflow (detailed behavior)

Entry
- User selects a workflow and clicks **Run Workflow**.

Guard/disabled state
- If no workflow is selected, run is not possible.
- While running:
  - “Run Workflow” becomes disabled and changes label to “Running…”.

Pipeline visualization
- The center shows “Workflow Pipeline” as a vertical list of steps.
- Each step card includes:
  - Status indicator (Pending / In Progress / Completed)
  - Name + description
  - Duration
  - Agent name and detail text (visible when current or completed)
  - For the current step, a pulsing progress bar appears.

Status progression (prototype timing)
- Steps advance automatically every ~2 seconds:
  - Pending → In Progress → Completed

Completion state
- After all steps complete, show a “Workflow Completed Successfully!” summary panel with:
  - Total Time
  - Sources Processed
  - Citations Verified
  - CTAs: **View Output** and **Download Report** (present; prototype-only).


### 3.4 Workflow Builder (detailed behavior)

Entry
- User clicks **Create New Workflow** (left sidebar).

Builder header actions
- **Clear Canvas**: removes all modules from the canvas.
- **Cancel**: exits builder back to Workflows view.
- **Save Workflow**: present; prototype-only (no persistence).

Module palette
- Horizontal draggable modules:
  - Trigger
  - Extract Data
  - AI Analysis
  - Validate
  - Route/Assign
  - Output

Drag/drop rules
- Dragging a module from the palette and dropping onto canvas creates a new instance at the drop point.
- Each placed module:
  - can be repositioned by mouse-dragging.
  - shows a remove (×) button on hover.

Canvas empty state
- When no modules are placed, show guidance:
  - “Drag modules here to build your workflow”
  - “Start with a Trigger module”

Connections
- The UI supports rendering connections if they exist.
- The builder footer text says “Modules will auto-connect in sequence.” (note: in the current prototype code, connections are not auto-created; this is design intent).


### 3.5 Templates (modal + library)

A) Quick Actions → “Create from Template” modal
- Clicking **Create from Template** opens a modal: “Choose a Workflow Template”.
- The modal lists a subset of templates and a **Use Template** button.
- Using a template populates the canvas with a vertical chain layout and closes the modal.

B) Quick Actions → Templates Library view
- Clicking **View All Templates** switches the right panel into a Templates Library.
- Includes:
  - Search input
  - Category filter pills
  - Template cards with name, description, category, steps
  - CTA: **Use Template**

Back behavior
- “Back to Quick Actions” returns to default right panel and clears search/filter state.


### 3.6 Analytics + Export Metrics Report

Analytics screen (center)
- Metrics cards (Active Workflows, Total Triggers, Completion Rate, Avg. Cycle Time).
- A performance trends chart.
- A “Recent Workflow Executions” list.

Export Metrics Report (right panel)
- Clicking **Export Metrics Report**:
  - Shows “Generating Report…” and disables the button.
  - Shows a toast: “Generating report…”.
  - After a short delay, downloads an HTML file.

---

## 4) Backend capabilities

The UI implies these backend capabilities, without prescribing full architecture:

Realtime + long-running work
- **Job/workflow execution is async** and reports progress back to the UI.
- UI expects either **SSE/WebSocket** status updates for workflows and background tasks.

Core APIs the UI needs (high-level)
- Documents: create/list/fetch/update + export.
- Citations: suggest/insert/verify + generate Table of Authorities.
- Alerts: compute unsupported-claim flags and authority-update notifications.
- Research memory: store and fetch claim→authority links.
- Workflows: store definitions/templates and create workflow runs + step status.
- Analytics: basic metrics query + report export.

Data persistence (minimum)
- Store documents + versions.
- Store authorities/citations and a per-document TOA representation.
- Store workflow definitions + workflow run history.

Search
- Smart Suggestions requires a fast retrieval layer (keyword and/or vector) to find relevant authorities and quotes.

---

## 5) UI behavior checklist (quick QA)

Drafting
- Smart Suggestions appear while typing; Insert Citation updates editor + TOA + memory.
- Unsupported claim tooltip suggests a cite; Add Citation fixes the claim and updates TOA/memory.
- Update Alert supports Review + Dismiss; Review enables adding a new authority and updating the memo.

Workflows
- Select workflow → details show; Run Workflow disables while running.
- Step statuses progress and show agent/detail; completion summary appears at the end.
- Builder supports drag/drop, reposition, remove, clear; templates populate a chain layout.
- Export Metrics Report shows a generating state and downloads an HTML report.
