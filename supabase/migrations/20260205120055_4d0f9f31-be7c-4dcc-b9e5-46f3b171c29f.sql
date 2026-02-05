-- Insert Edexcel Economics marking criteria for structured responses (accessible to both Free and Deluxe)
INSERT INTO public.document_chunks (product_id, content, metadata) VALUES

-- 8-marker structure
('6dc19d53-8a88-4741-9528-f25af97afb21',
'8-MARKER STRUCTURE (Points Marked)

Structure: KAAE - 2 marks for each component
Write 2 KAA paragraphs, each with its own evaluation.

Total: 8 marks
- Knowledge: 2 marks
- Application: 2 marks  
- Analysis: 2 marks
- Evaluation: 2 marks

Format: Two complete KAA+E paragraphs, each worth 4 marks.',
'{"content_type": "exam_technique", "topic": "8-Marker Marking Criteria", "tier": null}'::jsonb),

-- 10-marker marking criteria
('6dc19d53-8a88-4741-9528-f25af97afb21',
'10-MARKER MARKING CRITERIA (Level Marked)

KNOWLEDGE, APPLICATION & ANALYSIS (6 marks)

Level 0: Completely inaccurate.

Level 1 (1–2 marks):
• Isolated/imprecise knowledge of terms, concepts, theories, models.
• Generic/irrelevant info or examples.
• Descriptive, no links between causes and consequences.

Level 2 (3–4 marks):
• Some knowledge of principles, concepts, theories.
• Applies ideas in context but not to broad elements of question.
• Narrow response, chains of reasoning partly developed but may lack balance.

Level 3 (5–6 marks):
• Accurate knowledge of concepts, principles, models.
• Links knowledge to context with relevant, integrated examples.
• Economic ideas carefully selected and applied to broad elements of question.

EVALUATION (4 marks)

Level 0: No evaluation.

Level 1 (1–2 marks):
• Generic evaluative comments, no supporting evidence/context.
• No logical chain of reasoning.

Level 2 (3–4 marks):
• Evaluation supported by reasoning + context.
• Recognises different viewpoints and/or critiques evidence.

TOTAL: KAA (6) + Evaluation (4) = 10 marks',
'{"content_type": "exam_technique", "topic": "10-Marker Marking Criteria", "tier": null}'::jsonb),

-- 12-marker marking criteria
('6dc19d53-8a88-4741-9528-f25af97afb21',
'12-MARKER MARKING CRITERIA (Level Marked)

KNOWLEDGE, APPLICATION & ANALYSIS (8 marks)

Level 0: Completely inaccurate.

Level 1 (1–2 marks):
• Isolated/imprecise knowledge of terms, concepts, theories, models.
• Generic/irrelevant info or examples.
• Descriptive approach, no chain of reasoning or links between causes/consequences.

Level 2 (3–5 marks):
• Some knowledge of principles, concepts, theories.
• Applies ideas in context, but not to broad elements of the question.
• Narrow response, chains of reasoning partly developed but unbalanced.

Level 3 (6–8 marks):
• Accurate knowledge of concepts, principles, models.
• Links knowledge to context using relevant, integrated examples.
• Ideas carefully selected and applied to issues/problems.
• Logical and coherent chains of reasoning.

EVALUATION (4 marks)

Level 0: No evaluation.

Level 1 (1–2 marks):
• Generic evaluative comments, no supporting evidence/context.
• No logical chain of reasoning.

Level 2 (3–4 marks):
• Evaluative comments supported by reasoning + context.
• Recognises different viewpoints and/or critiques evidence.

TOTAL: KAA (8) + Evaluation (4) = 12 marks',
'{"content_type": "exam_technique", "topic": "12-Marker Marking Criteria", "tier": null}'::jsonb),

-- 15-marker marking criteria
('6dc19d53-8a88-4741-9528-f25af97afb21',
'15-MARKER MARKING CRITERIA (Level Marked)

KNOWLEDGE, APPLICATION & ANALYSIS (9 marks)

Level 0: Completely inaccurate.

Level 1 (1–3 marks):
• Isolated/imprecise knowledge of terms, concepts, theories, models.
• Uses generic/irrelevant info or examples.
• Descriptive approach, no chain of reasoning or links between causes/consequences.

Level 2 (4–6 marks):
• Some knowledge of principles, concepts, theories.
• Applies ideas to problems in context but not to broad elements of question.
• Narrow response, some chains of reasoning but may lack balance.

Level 3 (7–9 marks):
• Accurate knowledge of concepts, principles, models.
• Links knowledge to context with relevant, integrated examples.
• Economic ideas carefully selected/applied.
• Logical and coherent chains of reasoning.

EVALUATION (6 marks)

Level 0: No evaluation.

Level 1 (1–2 marks):
• Generic evaluative comments without evidence/context.
• No logical chain of reasoning.

Level 2 (3–4 marks):
• Evaluates alternatives but unbalanced.
• Some supporting evidence/context.
• Partially developed chain of reasoning.

Level 3 (5–6 marks):
• Evaluative comments supported by reasoning + context.
• Recognises different viewpoints and/or critiques evidence.

TOTAL: KAA (9) + Evaluation (6) = 15 marks',
'{"content_type": "exam_technique", "topic": "15-Marker Marking Criteria", "tier": null}'::jsonb),

-- 25-marker marking criteria
('6dc19d53-8a88-4741-9528-f25af97afb21',
'25-MARKER MARKING CRITERIA (Level Marked)

KNOWLEDGE, APPLICATION & ANALYSIS (16 marks)

Level 0: Completely inaccurate response.

Level 1 (1–4 marks):
• Applies knowledge in context but only on small range of elements.
• Demonstrates understanding by identifying relevant information.
• Shows knowledge/understanding of terms, concepts, theories, models.

Level 2 (5–8 marks):
• Applies economic ideas and relates them to problems in context.
• Demonstrates knowledge/understanding of principles, concepts, theories.
• Makes limited analysis or narrow application.

Level 3 (9–12 marks):
• Analysis clear/coherent, evidence well integrated (though may focus unevenly on elements).
• Applies ideas to broad elements of question.

Level 4 (13–16 marks):
• Analysis relevant, clear, coherent, fully integrated with evidence.
• Economic ideas carefully selected and applied to issues/problems.
• Covers both micro and macro effects.
• Shows clear understanding of principles, concepts, theories, arguments.

EVALUATION (9 marks)

Level 0: No evaluative comments.

Level 1 (1–3 marks):
• Identifies evaluative comments, but no explanation.

Level 2 (4–6 marks):
• Limited explanations.
• Evaluates alternative approaches but generic/unbalanced.
• Leads to limited judgements.

Level 3 (7–9 marks):
• Evaluative comments supported by relevant reasoning + context.
• Recognises different viewpoints.
• Critical of evidence/assumptions.
• Enables informed judgements.

TOTAL: KAA (16) + Evaluation (9) = 25 marks',
'{"content_type": "exam_technique", "topic": "25-Marker Marking Criteria", "tier": null}'::jsonb),

-- Overview of structured response types
('6dc19d53-8a88-4741-9528-f25af97afb21',
'STRUCTURED RESPONSE OVERVIEW

Structured response questions are either:
1. POINTS MARKED (5 and 8 markers) - each component earns specific marks
2. LEVEL MARKED (10, 12, 15, 25 markers) - assessed against level descriptors

For all structured responses, a KAA (Knowledge, Application, Analysis) structure is expected. After each KAA paragraph, there are marks for Evaluation.

POINTS MARKED:
- 5-marker: Usually K(1) + A(1) + A(2) + E(1)
- 8-marker: KAAE structure, 2 marks each = 2 KAA paragraphs with evaluation

LEVEL MARKED:
- 10-marker: KAA (6 marks) + Evaluation (4 marks)
- 12-marker: KAA (8 marks) + Evaluation (4 marks)  
- 15-marker: KAA (9 marks) + Evaluation (6 marks)
- 25-marker: KAA (16 marks) + Evaluation (9 marks)

Key principle: Depth over breadth. Focus on TWO strong KAA points rather than listing many weak ones.',
'{"content_type": "exam_technique", "topic": "Structured Response Overview", "tier": null}'::jsonb);