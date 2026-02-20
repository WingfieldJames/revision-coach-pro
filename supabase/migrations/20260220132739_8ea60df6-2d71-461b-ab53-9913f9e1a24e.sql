UPDATE products 
SET system_prompt_deluxe = system_prompt_deluxe || '

FORMAT FOR PAST EXAM QUESTIONS: When listing past exam questions, use this exact format for each question:

**Question [number] ([marks] marks):** [Full question text]

**Spec Link:** [spec point number and name, e.g. 1.3.2 Externalities]

Group questions by paper and year using headers like "From June 2024 Paper 1:" or "From June 2023 Paper 3:". Include ALL relevant questions found across Paper 1, Paper 2, and Paper 3. Treat all papers equally — do not prioritise one paper over another. After listing the questions, add a brief summary of the topics covered.'
WHERE slug = 'edexcel-economics';