# Mock Papers Seed Data

Each JSON file in this directory represents one mock exam paper. The seed migration reads these and inserts them into the `mock_papers` table.

## Adding a new paper

1. Create a JSON file named `{board}-{subject}-paper{n}-{session}{year}.json`
   - Example: `edexcel-economics-paper1-june2023.json`
   - Example: `aqa-economics-paper1-june2024.json`

2. Follow this structure:

```json
{
  "exam_board": "Edexcel",
  "subject": "Economics",
  "paper_number": 1,
  "paper_name": "Edexcel Economics A Paper 1: Markets and Business Behaviour (June 2023)",
  "year": 2023,
  "total_marks": 100,
  "time_limit_minutes": 120,
  "content_source": "representative",
  "sections": [
    { "id": "A", "name": "Section A: Data Response — Topic", "questions": ["1a","1b","1c","1d","1e"] }
  ],
  "questions": [
    {
      "question_number": "1a",
      "question_text": "The actual question text",
      "marks_available": 5,
      "question_type": "5-marker",
      "section": "A",
      "extract_text": "Optional extract/stimulus text",
      "diagram_required": false
    }
  ]
}
```

3. Run the seed migration or use the seed script:
   ```bash
   node seeds/seed-mock-papers.mjs
   ```

## Field reference

| Field | Required | Description |
|-------|----------|-------------|
| `exam_board` | Yes | Must match `mock_papers.exam_board` exactly (e.g. "Edexcel", "AQA", "CIE", "OCR") |
| `subject` | Yes | Must match `mock_papers.subject` exactly (e.g. "Economics", "Chemistry") |
| `paper_number` | Yes | 1, 2, or 3 |
| `paper_name` | Yes | Full display name including session |
| `year` | Yes | Exam year |
| `total_marks` | Yes | Total marks for the paper |
| `time_limit_minutes` | Yes | Exam duration in minutes |
| `content_source` | Yes | "verbatim" or "representative" — tracks whether questions are exact copies or representative versions |
| `sections` | Yes | Array of section objects with `id`, `name`, `questions` (array of question numbers) |
| `questions` | Yes | Array of question objects |
| `questions[].question_number` | Yes | e.g. "1a", "2", "3" |
| `questions[].question_text` | Yes | The question wording |
| `questions[].marks_available` | Yes | Marks for this question |
| `questions[].question_type` | Yes | e.g. "5-marker", "25-marker" |
| `questions[].section` | Yes | Section ID (matches sections[].id) |
| `questions[].extract_text` | No | Stimulus/data extract text |
| `questions[].diagram_required` | No | Boolean, defaults to false |

## Content source tracking

- `"verbatim"` — Exact question wording from the real paper (check copyright before using)
- `"representative"` — Questions that match the format, marks, and topic style but are reworded to avoid copyright issues
