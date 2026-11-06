
# StudyFlow

**Cornell University — SYSEN 5151: Foundations of Systems Engineering**  
**Project Team 30**

StudyFlow is a student study-planning system that converts academic tasks, deadlines, workload estimates, and available study time into a prioritized and feasible study plan.

---

## 1. Project Overview

College students often manage assignments, exams, projects, and other commitments across multiple courses. A simple deadline list may show **what is due**, but it does not necessarily tell a student:

- What should I work on next?
- Can I realistically finish everything before the deadlines?
- How should I divide large tasks into manageable study sessions?
- What happens when my schedule or workload changes?
- Am I running out of available study time?

StudyFlow addresses these problems by combining task information and student availability to generate an explainable study plan.

---

## 2. System of Interest

The **System of Interest (SoI)** is the StudyFlow study-planning system.

### Inputs

StudyFlow currently uses student-provided information including:

- Academic tasks
- Task deadlines
- Estimated workload
- Completed workload
- Task completion status
- Available study time

### Outputs

StudyFlow produces:

- A prioritized next-task recommendation
- A rationale for the recommendation
- Study sessions scheduled within available time
- Updated plans when inputs change
- Workload-shortfall warnings when available time is insufficient

The current MVP uses **manual student input**. External LMS, calendar, and LLM integrations are outside the current core MVP scope.

---

## 3. Primary Operational Flow

The primary StudyFlow workflow is:

```text
Student enters tasks and deadlines
            ↓
Student enters available study time
            ↓
StudyFlow evaluates workload and urgency
            ↓
StudyFlow prioritizes academic tasks
            ↓
StudyFlow generates feasible study sessions
            ↓
Student reviews the next task and study plan
            ↓
Changes to inputs trigger replanning
```

This workflow is the basis for the current walking-skeleton demonstration.

---

## 4. Key MVP Capabilities

The current StudyFlow model defines the following stakeholder requirements:

| ID | Capability |
|---|---|
| SR-01 | Prioritize the next task |
| SR-02 | Generate a feasible study plan |
| SR-03 | Update the study plan after changes |
| SR-04 | Report workload shortfalls |
| SR-05 | Support easy initial plan creation |
| SR-06 | Preserve saved student data |
| SR-07 | Protect student data |
| SR-08 | Provide testable and explainable planning rules |
| SR-09 | Maintain model-to-product traceability |
| SR-10 | Support modular and independently testable components |

The complete needs, requirements, MOEs, acceptance criteria, and proposed verification methods are documented in [`Study Flow/SPEC.md`](Study%20Flow/SPEC.md).

---

## 5. Stakeholders

The stakeholder analysis identified two primary stakeholders for detailed needs and requirements development:

### Students

Students are the primary end users of StudyFlow. Their needs focus on:

- Understanding what to work on next
- Creating feasible study plans
- Adapting plans when circumstances change
- Identifying workload shortfalls
- Minimizing planning effort
- Preserving and protecting their information

### Development Team

The development team is responsible for implementing and maintaining StudyFlow. Its needs focus on:

- Testable and explainable planning behavior
- Requirements traceability
- Modular system components
- Reproducible behavior

Additional stakeholders considered in the project include university IT/data security, university administration, academic advisors, teaching assistants, employers/recruiters, and external LMS/calendar providers.

---

## 6. Model-to-Product Linkage

StudyFlow is developed using a traceable systems-engineering workflow:

```text
Stakeholder Analysis
        ↓
Stakeholder Need
        ↓
Stakeholder Requirement
        ↓
Acceptance Criterion
        ↓
Product Specification
        ↓
Walking Skeleton
        ↓
Implementation / Verification
```

For example:

```text
N-01 — Students need to identify what task to work on next
        ↓
SR-01 — StudyFlow shall present a prioritized next task
        ↓
AC-01 — Fixed scenarios verify the expected task and rationale
        ↓
SPEC.md
        ↓
Next-task behavior in the StudyFlow demo
```

The current Innoslate model contains the stakeholder needs, stakeholder requirements, hierarchy, and need-to-requirement traceability.

---

## 7. Repository Structure

```text
Study Flow/
  studyflow_demo.html       Browser entry, based on supplied demo 3.0
  js/planning.js           F.1.3/F.1.4 and five F.1.5 component functions
  js/storage.js            Injected browser-storage adapter
  js/app.js                UI and input/replanning handlers
  SPEC.md                  Historical source-aligned requirements draft
  Innoslate log/           Historical model exports, retained unchanged
docs/
  traceability.md          Function → requirements → code → tests
  traceability.json        Machine-readable function mapping
  icom-signatures.md       Model arrows and actual function parameters
  route-table.md           Browser interactions; no implemented HTTP API
  recording-guide-E.md     Three-minute Codebase-to-Model recording sequence
  verification.md          Reproduction steps and evidence boundaries
  source-baseline.json     Source filename/digest and reviewed model baseline
contracts/api-v1.yaml      Local interfaces and schemas; HTTP paths empty
tests/                    Requirement-named Python runner and real JS assertions
scripts/                  Link/contract checker and portable HTML builder
.github/workflows/        GitHub Actions verification
```

## 8. Running and Checking the Current Demo

Open `Study Flow/studyflow_demo.html` in a desktop browser, keeping its adjacent `js/` directory. There is no application build step and no backend service. Alex and Maya are local demonstration profiles, not authenticated accounts. Core planning works without LMS, external Calendar or LLM services; optional web fonts use the browser's system-font fallback when offline.

For a stable local origin while recording:

```sh
python3 -m http.server 8000 --directory 'Study Flow'
```

Open `http://localhost:8000/studyflow_demo.html`. The server provides static files only.

Developer checks require Node.js 22+ and Python 3.12+; they use no npm/pip dependencies:

```sh
python3 scripts/check_traceability.py
python3 -m unittest discover -s tests -v
python3 scripts/build_standalone.py
```

The last command creates `build/StudyFlow-3.0-fixed-standalone.html`, with the same tested JavaScript embedded for sharing as one file. Generated files are ignored by Git. The CI workflow runs syntax, traceability/contracts, requirement tests and this build on pushes and pull requests.

Read [docs/traceability.md](docs/traceability.md) and [E's recording guide](docs/recording-guide-E.md) for the Codebase-to-Model demonstration. The selected trace is F.1.5 → F.1.5.1–F.1.5.5 → C.2.5.1–C.2.5.5 → actual functions and named tests.

---

## 9. Specification

The product specification is located at:

[`Study Flow/SPEC.md`](Study%20Flow/SPEC.md)

The specification documents:

- N-01 through N-10 stakeholder needs
- SR-01 through SR-10 stakeholder requirements
- Measures of Effectiveness (MOEs)
- Proposed Measures of Success (MOSs)
- Acceptance criteria
- Data contract
- Planning and output contract
- Verification approach
- Model-to-product traceability

The specification is intended to connect the MBSE model to implementation and verification.

---

## 10. MBSE Model

StudyFlow is modeled in **Innoslate**.

The model includes:

- System context and boundary
- Operational concept
- Use cases
- Action / activity behavior
- Sequence behavior
- Stakeholder needs
- Stakeholder requirements
- Need-to-requirement traceability
- Requirement hierarchy and spider views

Model exports are stored in:

```text
Study Flow/Innoslate log/
```

The dated XML files preserve milestone snapshots of the model.

---

## 11. Current Project Status

The supplied demo 3.0 has been organized into planning, storage and interaction modules. Planning fixes normalize overlapping availability, allocate multiple bounded sessions per window, retain overdue unfinished tasks as shortfalls and keep what-if preview windows aligned with Apply. Explicit planning time supports deterministic tests. Invalid confirmed input/save failures roll back the displayed input state. Requirements badges describe implementation traces rather than blanket verification claims.

The repository includes 21 requirement-named checks and a source/link consistency checker. They cover the listed fixtures, not every system acceptance condition. Inspect [verification evidence](docs/verification.md) and the actual current-commit GitHub Actions run before describing CI as passed.

Remaining product boundaries include authenticated access control, optional external Calendar/LMS/LLM transports, timed student usability pilots and complete system-level acceptance. The 3-second planning target is checked only on a representative fixture; it does not establish the separate save-to-display system response time.

---

## 12. Milestone 1 Trace Example

The primary trace used for Milestone 1 demonstration is:

```text
N-01
Students need to see which task to work on next
        ↓
SR-01
StudyFlow shall present a prioritized next task
        ↓
StudyFlow planning / prioritization behavior
        ↓
AC-01
Priority scenarios verify the expected task and rationale
        ↓
studyflow_demo.html
```

This trace demonstrates the connection between the stakeholder model, product specification, and walking skeleton.

---

## 13. Team Members

**SYSEN 5151 Project Team 30**

- Ming Gong
- Sean Hang
- Xinrui Hu
- Yifei Hua
- Julian Jiang
- Yilin Zhao

---

## 14. Course

**Cornell University**  
**SYSEN 5151 — Foundations of Systems Engineering**  
Fall 2026
