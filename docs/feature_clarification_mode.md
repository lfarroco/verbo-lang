Verbo Interactive Clarification Specification
1. Feature Overview
The Interactive Clarification System enables Verbo's AI compiler to proactively identify ambiguities in specifications and conduct structured interviews with developers to resolve them. This creates a collaborative refinement loop where both human and AI improve the project's specifications.

2. Workflow
graph TD
    A[Compilation Request] --> B{Static Analysis}
    B --> C[Ambiguity Detection]
    C --> D{Ambiguities Found?}
    D -->|No| E[Proceed to Code Generation]
    D -->|Yes| F[Interactive Interview Mode]
    F --> G[Developer Answers Questions]
    G --> H[Update Specifications]
    H --> B

3. Detection Mechanism
3.1. Ambiguity Triggers
The AI compiler will flag:

Vague terms: "proper validation", "efficiently", "soon"

Undefined concepts: References to undeclared properties/models

Incomplete logic: Missing edge cases, undefined error handling

Contradictions: Conflicting requirements across files

Implicit dependencies: Unstated relationships between components

3.2. Severity Levels
verbo
The clarification system uses three severity levels:
- CRITICAL: Prevents code generation (e.g., undefined core model)
- HIGH: Likely causes runtime errors (e.g., missing error handling)
- MEDIUM: Best practice improvements (e.g., performance optimizations)
4. Interview Protocol
4.1. Question Format
verbo
The AI asks questions using this template:
[SEVERITY] In [FILE]:
❓ [Ambiguous phrase/context]
[Numbered options when applicable]
> [Input area]
4.2. Question Types
Clarification Questions
Define what "soon" means in this context: 1) <1s 2) <5s 3) Other

Decision Questions
Should failed payments be retried? 1) Yes 2) No 3) Only for network errors

Expansion Questions
Add validation rules for email format (comma-separated):

Conflict Resolution
User.md says "required field" but Form.md says "optional" - which is correct?

5. Developer Interaction
5.1. Command Line Interface
bash
# Start clarification session
verbo clarify --priority=high

# Sample session output
[CRITICAL] In payment.md:
❓ "Process refunds" lacks timeframe definition:
1) Same business day
2) Within 24 hours
3) Custom timeframe
> 2

[HIGH] In user.md:
❓ "Validate addresses" requires specificity:
• Basic format check
• API validation
• Postal service verification
• Custom solution
> API validation
5.2. Response Handling
verbo
The system accepts:
- Single/multi-select numbers
- Natural language responses
- Verbo declarations
- "skip" (defer decision)
- "unknown" (flag for later review)
6. Artifact Generation
6.1. Annotated Specifications
markdown
<!-- CLARIFICATION-RESULT @ 2025-06-25 -->
> **Q:** What constitutes "large file"?  
> **A:** Files >10MB based on user feedback
Maximum file size: 10_000_000 bytes
6.2. Decision Manifest
json
{
  "timestamp": "2025-06-25T14:30:00Z",
  "file": "storage.md",
  "original_phrase": "large files",
  "resolution": ">10MB",
  "impacted_components": ["uploader", "validator"]
}
6.3. Audit Trail
verbo
A directory called .verbo/clarifications contains:
- Full interview transcripts (YYYYMMDD-HHMMSS.md)
- Decision history log (decisions.jsonl)
- Pre/post clarification spec versions
7. Configuration Directives
7.1. Global Settings
verbo
In verbo.config:
- interview_mode: "interactive" | "batch" | "off"
- default_priority: "critical" | "high" | "medium" | "low"
- max_questions_per_session: 15
7.2. In-Spec Overrides
markdown
<!-- CLARIFICATION-DIRECTIVE -->
priority: medium
interview_mode: batch
requires_approval: true
<!-- /DIRECTIVE -->
8. Best Practices
Progressive Disclosure
"Start with critical ambiguities first, then iterate"

Decision Consistency
"Maintain a team glossary for recurring terms"

Review Cycles
"Conduct clarification sessions during sprint planning"

Traceability
"Reference decisions in commit messages: VERBO-CLARIFY-123"

9. Example Workflow
verbo
Developer runs: verbo compile --target=sql

AI detects:
• Undefined relationship between User and Organization
• Missing error handling in payment processing

System enters interview mode:

[CRITICAL] In organization.md:
❓ "Each user belongs to an org" but no relationship defined:
1) One-to-many (org has many users)
2) Many-to-many (users in multiple orgs)
> 1

[HIGH] In payments.md:
❓ Add error handling for:
• Failed transactions
• Expired cards
• Insufficient funds
> 
[User enters]:
- Retry failed transactions 2 times
- Notify user about expired cards
- Queue insufficient funds for manual review

Specifications updated. Recompiling...
This specification creates a closed-loop system where ambiguity resolution becomes a core part of the development process, transforming potential weaknesses into opportunities for specification improvement.