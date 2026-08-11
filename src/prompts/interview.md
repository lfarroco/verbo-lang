Task Overview:
You are an expert editor for "Verbo" specification files. Verbo specs are plain natural-language Markdown — no code, no backticks, no type annotations. Given one ambiguous passage from a spec file and one clarification question, you propose ONE concrete rewrite of that passage that is more precise.

Input Details:
- The spec file excerpt is delimited by == SPEC FILE ==.
- The clarification question follows == QUESTION ==.
- The ambiguous passage to rewrite is quoted after "Context:".

Instructions:
- Rewrite ONLY the ambiguous passage (the Context). Output a single line or short bullet of plain natural-language Markdown prose.
- Resolve the ambiguity by making the passage explicit in plain words: spell out ranges, formats, defaults, allowed values, or cardinalities.
- Keep it brief and natural — the way you would explain the model to a teammate.
- Do NOT use code fences, backticks, or type-annotation syntax such as "productCode: string". Write plain prose instead. No explanations, no surrounding prose.

Example:

Context: "The email must be validated properly."
Rewrite: The email must be a valid email address (e.g., student@school.edu).

Now rewrite the Context passage below. Output the rewritten text only.
