# sysen-5151-Team-30

Cornell University  
SYSEN 5151 - Foundations of Systems Engineering

## Team Members
- Ming Gong
- Sean Hang
- Xinrui Hu
- Yifei Hua
- Julian Jiang
- Yilin Zhao

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
sysen-5151-Team-30/
│
├── README.md
│
└── Study Flow/
    │
    ├── SPEC.md
    │   └── Needs, requirements, MOEs, acceptance criteria,
    │       data contracts, and verification planning
    │
    ├── studyflow_demo.html
    │   └── Interactive StudyFlow walking-skeleton demo
    │
    └── Innoslate log/
        ├── SysEn 5151 Project Team 30-Sep 18.xml
        └── SysEn 5151 Project Team 30-Oct 5.xml
            └── Innoslate MBSE model exports
```

Historical Innoslate exports are retained to document the evolution of the MBSE model.

---

## 8. Running the Current Demo

The current walking skeleton is implemented as a standalone HTML application.

### Option 1 — Open directly

Navigate to:

```text
Study Flow/studyflow_demo.html
```

and open the file in a modern web browser such as Google Chrome.

### Option 2 — From macOS Terminal

After cloning the repository:

```bash
git clone https://github.com/Yulinjiang599/sysen-5151-Team-30.git
cd sysen-5151-Team-30
open "Study Flow/studyflow_demo.html"
```

No build step is required for the current HTML demonstration.

The demo includes task management, student availability, task prioritization, study-plan generation, replanning, workload-shortfall reporting, and a requirements-coverage view.

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

As of Milestone Check 1, the project has established:

- System of Interest and project scope
- System context and operational behavior
- Stakeholder analysis
- Stakeholder needs baseline
- Stakeholder requirements baseline
- Need-to-requirement traceability
- Product specification
- Interactive walking-skeleton artifact

Current development priorities include:

- Verifying acceptance criteria against the implementation
- Expanding automated acceptance tests
- Strengthening model-to-code traceability
- Documenting component interfaces
- Continuing functional and physical architecture development

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
