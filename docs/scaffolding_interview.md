Verbo Project Scaffolding & Interview Workflow Specification
1. Workflow Overview

graph TD
    A[User: verbo new] --> B{App Type Selection}
    B -->|CLI| C1[Generate CLI Boilerplate]
    B -->|REST API| C2[Generate API Boilerplate]
    B -->|AI Agent| C3[Generate AI Agent Boilerplate]
    C1 --> D[Start Interview]
    C2 --> D
    C3 --> D
    D --> E[Update Project Specs]
    E --> F[Generate Working Prototype]
    F --> G[Continuous Refinement]

2. Core Components
2.1. Project Initialization
Command:

bash
verbo new [project-name]
Process:

Presents interactive menu:

text
Select project type:
❯ REST API
  CLI Tool
  AI Agent
  Admin Dashboard
  Custom...
Generates directory structure:

text
my-project/
├── main.md
├── models/
├── routes.md (if API)
├── workflows.md (if AI Agent)
└── verbo.config
2.2. Smart Boilerplates
Each project type provides:

Domain-specific starter specs

Pre-configured compilation targets

Interview question templates

Example: REST API Boilerplate

markdown
<!-- main.md -->
# My REST API

## Core Models
- [Define User model](./models/user.md)
- [Define Product model](./models/product.md)

<!-- routes.md -->
## API Endpoints
- GET /users
- POST /users
- GET /products
2.3. Interview-Driven Refinement
Initiation:

bash
cd my-project
verbo interview
Sample Session:

text
╭── REST API INTERVIEW MODE ──╮
│                              │
│  Let's define your User model│
│                              │
╰──────────────────────────────╯

[STEP 1/5] In models/user.md:
❓ What fields should a User have?
• name (string)
• email (string)
• password (hashed string)
• Add another...
> role (admin/user)

[STEP 2/5] 
❓ How should user roles work?
1) Static list: admin, user
2) Dynamic roles from database
> 1

[STEP 3/5]
❓ Add authentication requirements:
• JWT token expiration: 24h
• Password complexity rules
> Add 8+ chars with numbers

...
3. Technical Implementation
3.1. Scaffold Templates
verbo
# verbo/templates/rest-api/main.md
This is the main specification for {{project_name}}.

## Core Data Models
{{#each models}}
- [Define {{this}} model](./models/{{this}}.md)
{{/each}}

## Business Logic
...

# verbo/templates/cli/README.md
The CLI tool "{{project_name}}" performs:
- [Main operation]
- [Input handling]
3.2. Interview Engine
Question Sequencing:

javascript
interviewFlow: {
  'rest-api': [
    { phase: "models", questionBank: require('./questions/models') },
    { phase: "endpoints", questionBank: require('./questions/routes') },
    { phase: "auth", questionBank: require('./questions/auth') }
  ],
  'cli': [
    { phase: "operations", questionBank: require('./questions/cli-ops') },
    { phase: "i/o", questionBank: require('./questions/cli-io') }
  ]
}
3.3. Real-time Spec Updates
Transformation Rules:

verbo
When user answers "JWT expiration: 24h":
1. Locate auth.md file
2. Insert:
   ```verbo
   Security configuration:
   - Authentication: JWT
   - Token expiration: 24 hours
Update verbo.config:

json
"dependencies": ["oak", "djwt"]
text

### 4. User Experience Features

#### 4.1. Progressive Preview
```bash
verbo interview --preview
Generates partial code after each answered question

Shows live file diffs of updated specs

4.2. Contextual Help
verbo
During interviews:
- verbo explain "JWT"
- verbo example "role-based access"
4.3. Session Management
bash
# Pause/resume interviews
verbo interview --pause
verbo interview --resume

# Review past decisions
verbo interview --log
5. Sample Workflow: AI Agent Creation
User Input:

bash
verbo new customer-support-agent --type=ai-agent
Auto-generated Spec:

markdown
<!-- workflows.md -->
# Customer Support Agent

## Key Capabilities
- Understand customer questions
- Search knowledge base
... [needs refinement] ...

## Data Sources
- [Add knowledge base]
Interview Process:

text
[AI AGENT SPECIFICATION]
❓ What should "understand customer questions" include?
1) Basic intent recognition
2) Sentiment analysis
3) Language translation
> 2,3

❓ Knowledge base sources:
• Website FAQ (URL)
• PDF manuals
• Database connection
> https://example.com/faq

❓ Add escalation rules:
- When to transfer to human
- Emergency contact protocol
> When sentiment score < -0.7
Final Output:

Fully configured LangChain agent

Pre-connected knowledge base

Sentiment analysis pipeline

Escalation handler functions

6. Advantages Over Traditional Scaffolding
Contextual Boilerplates
Not just file templates - domain-aware skeletons

Avoids Blank Canvas Problem
Starts with working prototype (0 → 60% complete)

Knowledge Capture
Interview decisions become project documentation

Adaptive Complexity
Asks more questions for complex projects

7. Implementation Roadmap
Phase 1 (MVP):

REST API interview flow

Core scaffolding engine

Spec patching system

Phase 2:

CLI interview flow

Interactive preview mode

Session save/resume

Phase 3:

AI Agent specialization

Visual UI for non-devs

Marketplace templates

This workflow transforms project initialization from a passive setup task into an active specification refinement process - perfectly aligning with Verbo's "documentation as code" philosophy while dramatically lowering the entry barrier for new projects.