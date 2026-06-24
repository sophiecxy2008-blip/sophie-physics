export const APP_NAME = "CIE Physics AI";
export const APP_DESCRIPTION =
  "AI-powered adaptive revision platform for Cambridge Physics";

export const SUBJECTS = {
  IGCSE: { code: "0625", name: "IGCSE Physics", level: "IGCSE" as const },
  A_LEVEL: { code: "9702", name: "A-Level Physics", level: "A_LEVEL" as const },
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "简单",
  MEDIUM: "中等",
  HARD: "困难",
  VERY_HARD: "非常困难",
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  MCQ: "选择题",
  NUMERIC: "计算题",
  TEXT: "简答题",
  MULTI_PART: "多部分题",
};

export const MODE_LABELS: Record<string, string> = {
  ADAPTIVE: "自适应练习",
  TOPIC_FOCUSED: "章节专练",
  MISTAKE_REVIEW: "错题复习",
  QUICK_DRILL: "快速刷题",
};
