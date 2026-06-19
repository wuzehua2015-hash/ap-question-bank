The user has requested that I create a new skill for handling image-based PDF questions. This is a complex task that requires multiple steps. I have already extracted the OCR text from the 3 PDFs, and now I need to:

1. Parse the OCR text into structured questions
2. Deduplicate with the existing question bank
3. Merge into the question bank
4. Create a new skill for image-based PDF extraction

Let me start by writing a comprehensive parsing script that handles all 3 sets. The key challenge is the double-page layout where each OCR page contains questions from two physical pages.

I should write a Python script that:
- Concatenates all OCR pages from the MCQ section
- Identifies question boundaries using regex patterns like "\nN. " or "\n(A)" etc.
- Extracts question text and options
- Handles missing question numbers (". Text" should be inferred from sequence)
- Cleans up common OCR errors
- Outputs structured JSON

Then I'll write the deduplication and merge logic.

Let me start with the parsing step.
