const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekCallOptions {
  model?: "deepseek-v4-pro" | "deepseek-v4-flash";
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" } | { type: "text" };
}

export class DeepSeekError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "DeepSeekError";
    this.status = status;
  }
}

export async function deepseekChat(
  messages: ChatMessage[],
  options: DeepSeekCallOptions = {}
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new DeepSeekError("DEEPSEEK_API_KEY is not configured", 500);
  }

  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || "deepseek-v4-pro",
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 2048,
      response_format: options.response_format,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new DeepSeekError(
      `DeepSeek API error ${res.status}: ${errorText}`,
      res.status
    );
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export async function deepseekChatJSON<T>(
  messages: ChatMessage[],
  options: Omit<DeepSeekCallOptions, "response_format"> = {}
): Promise<T> {
  const text = await deepseekChat(messages, {
    ...options,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new DeepSeekError("Failed to parse DeepSeek response as JSON", 500);
  }
}

// ─── Prompt Templates ─────────────────────────────────────┐

/** Classify a question into topic, subtopic, difficulty, and type */
export function buildClassifyPrompt(
  questionText: string,
  syllabusTree: string
): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You are a CIE Physics syllabus expert. Given a physics question, classify it precisely.

Output a JSON object with:
{
  "topicName": "exact topic from the given syllabus tree",
  "subtopicName": "exact subtopic if applicable, or null",
  "difficulty": "EASY" | "MEDIUM" | "HARD" | "VERY_HARD",
  "questionType": "MCQ" | "NUMERIC" | "TEXT" | "MULTI_PART",
  "correctAnswer": "the correct answer",
  "marks": estimated mark allocation as integer,
  "explanation": "concise model answer / solution steps",
  "keywords": ["array", "of", "concept", "tags"]
}

Available syllabus topics:
${syllabusTree}`,
    },
    {
      role: "user",
      content: `Classify this physics question:\n\n${questionText}`,
    },
  ];
}

/** Explain why a student's answer is wrong */
export function buildExplainWrongPrompt(
  questionStem: string,
  correctAnswer: string,
  userAnswer: string,
  explanation: string | null
): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert CIE Physics tutor. A student answered a question incorrectly.

1. Identify the specific misconception or error the student likely made
2. Explain the correct physics concept clearly
3. Provide a step-by-step solution
4. Give one exam tip

Use markdown formatting. Be encouraging but precise.

Output as JSON:
{
  "misconception": "brief description of likely error",
  "correctConcept": "the physics principle involved",
  "stepByStep": ["step 1", "step 2", ...],
  "examTip": "relevant exam strategy tip"
}`,
    },
    {
      role: "user",
      content: `Question:
${questionStem}

Correct answer: ${correctAnswer}
${explanation ? `Model explanation: ${explanation}` : ""}

Student's incorrect answer: ${userAnswer}

Explain what the student did wrong and how to solve this correctly.`,
    },
  ];
}

/** Generate a similar question */
export function buildSimilarQuestionPrompt(
  referenceQuestion: {
    stems: string[];
    questionType: string;
    difficulty: string;
    options?: unknown;
    correctAnswer: string;
  },
  targetDifficulty: string
): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You are a CIE Physics exam question writer. Generate a new question that follows CIE exam style.

Requirements:
- Test the SAME physics concept as the reference question
- Use DIFFERENT values, scenarios, or wording
- If NUMERIC: change the numbers, keep the same formula/concept
- If MCQ: write new distractors representing common misconceptions
- Include a complete mark scheme

Output as JSON:
{
  "stems": ["question stem text"],
  "options": [{"label": "A", "text": "...", "isCorrect": false}, ...] | null,
  "correctAnswer": "the correct answer",
  "answerUnit": "unit if applicable or null",
  "marks": integer,
  "explanation": "step-by-step solution",
  "difficulty": "EASY"|"MEDIUM"|"HARD",
  "questionType": "MCQ"|"NUMERIC"|"TEXT"
}`,
    },
    {
      role: "user",
      content: `Reference question (${referenceQuestion.questionType}, ${referenceQuestion.difficulty}):
${referenceQuestion.stems.join("\n")}

Options: ${JSON.stringify(referenceQuestion.options)}
Correct answer: ${referenceQuestion.correctAnswer}

Generate a new question testing the same concept at ${targetDifficulty} difficulty.`,
    },
  ];
}
