import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: "postgresql://localhost:5432/cie-physics",
});
const prisma = new PrismaClient({ adapter });

const sampleQuestions = [
  // ─── IGCSE - Kinematics ─────────────────────────────────
  {
    subjectCode: "0625",
    topicName: "Kinematics",
    questionType: "MCQ" as const,
    difficulty: "EASY" as const,
    stems: ["A car accelerates uniformly from rest to 20 m/s in 10 seconds. What is its acceleration?"],
    options: [
      { label: "A", text: "0.5 m/s²", isCorrect: false },
      { label: "B", text: "2 m/s²", isCorrect: true },
      { label: "C", text: "10 m/s²", isCorrect: false },
      { label: "D", text: "200 m/s²", isCorrect: false },
    ],
    correctAnswer: "B",
    marks: 1,
    explanation: "使用公式 a = (v - u) / t。v = 20 m/s, u = 0 m/s, t = 10 s。a = (20 - 0) / 10 = 2 m/s²。",
  },
  {
    subjectCode: "0625",
    topicName: "Kinematics",
    questionType: "NUMERIC" as const,
    difficulty: "MEDIUM" as const,
    stems: ["A ball is dropped from a height of 20 m. Calculate the time taken to reach the ground. (g = 10 m/s²)"],
    correctAnswer: "2",
    answerUnit: "s",
    marks: 2,
    explanation: "使用公式 s = ½gt²。20 = ½ × 10 × t² → t² = 4 → t = 2 s。",
  },
  // ─── IGCSE - Forces ─────────────────────────────────────
  {
    subjectCode: "0625",
    topicName: "Forces and Motion",
    questionType: "MCQ" as const,
    difficulty: "EASY" as const,
    stems: ["Which of the following is a vector quantity?"],
    options: [
      { label: "A", text: "Mass", isCorrect: false },
      { label: "B", text: "Speed", isCorrect: false },
      { label: "C", text: "Velocity", isCorrect: true },
      { label: "D", text: "Energy", isCorrect: false },
    ],
    correctAnswer: "C",
    marks: 1,
    explanation: "Velocity has both magnitude and direction, making it a vector. Mass, speed, and energy are scalars.",
  },
  {
    subjectCode: "0625",
    topicName: "Forces and Motion",
    questionType: "NUMERIC" as const,
    difficulty: "MEDIUM" as const,
    stems: ["A force of 10 N acts on a mass of 2 kg. Calculate the acceleration."],
    correctAnswer: "5",
    answerUnit: "m/s²",
    marks: 2,
    explanation: "使用 F = ma。10 = 2 × a → a = 5 m/s²。",
  },
  // ─── IGCSE - Energy ─────────────────────────────────────
  {
    subjectCode: "0625",
    topicName: "Energy, Work and Power",
    questionType: "MCQ" as const,
    difficulty: "EASY" as const,
    stems: ["Which form of energy is stored in a stretched spring?"],
    options: [
      { label: "A", text: "Kinetic energy", isCorrect: false },
      { label: "B", text: "Elastic potential energy", isCorrect: true },
      { label: "C", text: "Gravitational potential energy", isCorrect: false },
      { label: "D", text: "Thermal energy", isCorrect: false },
    ],
    correctAnswer: "B",
    marks: 1,
    explanation: "A stretched spring stores elastic potential energy, which is the energy stored in deformed elastic objects.",
  },
  {
    subjectCode: "0625",
    topicName: "Energy, Work and Power",
    questionType: "NUMERIC" as const,
    difficulty: "MEDIUM" as const,
    stems: ["Calculate the work done when a force of 50 N moves an object 3 m in the direction of the force."],
    correctAnswer: "150",
    answerUnit: "J",
    marks: 2,
    explanation: "W = F × d = 50 × 3 = 150 J。",
  },
  // ─── IGCSE - Electricity ────────────────────────────────
  {
    subjectCode: "0625",
    topicName: "Current, Voltage and Resistance",
    questionType: "MCQ" as const,
    difficulty: "EASY" as const,
    stems: ["What is the unit of electric current?"],
    options: [
      { label: "A", text: "Volt", isCorrect: false },
      { label: "B", text: "Ampere", isCorrect: true },
      { label: "C", text: "Ohm", isCorrect: false },
      { label: "D", text: "Watt", isCorrect: false },
    ],
    correctAnswer: "B",
    marks: 1,
    explanation: "The SI unit of electric current is the ampere (A).",
  },
  {
    subjectCode: "0625",
    topicName: "Current, Voltage and Resistance",
    questionType: "NUMERIC" as const,
    difficulty: "MEDIUM" as const,
    stems: ["A resistor of 4 Ω has a current of 3 A flowing through it. Calculate the voltage across the resistor."],
    correctAnswer: "12",
    answerUnit: "V",
    marks: 2,
    explanation: "使用欧姆定律 V = IR = 3 × 4 = 12 V。",
  },
  // ─── IGCSE - Waves ──────────────────────────────────────
  {
    subjectCode: "0625",
    topicName: "General Properties of Waves",
    questionType: "MCQ" as const,
    difficulty: "EASY" as const,
    stems: ["What is the relationship between wave speed (v), frequency (f) and wavelength (λ)?"],
    options: [
      { label: "A", text: "v = f / λ", isCorrect: false },
      { label: "B", text: "v = f × λ", isCorrect: true },
      { label: "C", text: "v = λ / f", isCorrect: false },
      { label: "D", text: "v = f + λ", isCorrect: false },
    ],
    correctAnswer: "B",
    marks: 1,
    explanation: "波速 = 频率 × 波长 v = fλ。",
  },
  {
    subjectCode: "0625",
    topicName: "General Properties of Waves",
    questionType: "NUMERIC" as const,
    difficulty: "HARD" as const,
    stems: ["A wave has a frequency of 50 Hz and a wavelength of 0.3 m. Calculate its speed."],
    correctAnswer: "15",
    answerUnit: "m/s",
    marks: 2,
    explanation: "v = fλ = 50 × 0.3 = 15 m/s。",
  },
  // ─── IGCSE - Momentum ───────────────────────────────────
  {
    subjectCode: "0625",
    topicName: "Momentum",
    questionType: "NUMERIC" as const,
    difficulty: "MEDIUM" as const,
    stems: ["A car of mass 1000 kg is moving at 15 m/s. Calculate its momentum."],
    correctAnswer: "15000",
    answerUnit: "kg·m/s",
    marks: 2,
    explanation: "p = mv = 1000 × 15 = 15000 kg·m/s。",
  },
  // ─── A-Level 9702 - Kinematics ──────────────────────────
  {
    subjectCode: "9702",
    topicName: "Kinematics",
    questionType: "MCQ" as const,
    difficulty: "MEDIUM" as const,
    stems: ["A projectile is launched at 30° to the horizontal with an initial speed of 20 m/s. What is the horizontal component of its velocity? (cos 30° = 0.866)"],
    options: [
      { label: "A", text: "10.0 m/s", isCorrect: false },
      { label: "B", text: "17.3 m/s", isCorrect: true },
      { label: "C", text: "20.0 m/s", isCorrect: false },
      { label: "D", text: "11.5 m/s", isCorrect: false },
    ],
    correctAnswer: "B",
    marks: 1,
    explanation: "水平分量 vx = v cos θ = 20 × cos 30° = 20 × 0.866 = 17.3 m/s。",
  },
  {
    subjectCode: "9702",
    topicName: "Kinematics",
    questionType: "NUMERIC" as const,
    difficulty: "HARD" as const,
    stems: ["A stone is thrown vertically upwards with a velocity of 30 m/s. Calculate the maximum height reached. (g = 9.81 m/s²)"],
    correctAnswer: "45.9",
    answerUnit: "m",
    marks: 3,
    explanation: "v² = u² + 2as，末速度为 0。0 = 30² + 2(-9.81)s → s = 900/19.62 = 45.9 m。",
  },
  // ─── A-Level - Dynamics ─────────────────────────────────
  {
    subjectCode: "9702",
    topicName: "Dynamics",
    questionType: "MCQ" as const,
    difficulty: "MEDIUM" as const,
    stems: ["A body of mass 5 kg experiences a resultant force of 20 N. What is its acceleration?"],
    options: [
      { label: "A", text: "0.25 m/s²", isCorrect: false },
      { label: "B", text: "4 m/s²", isCorrect: true },
      { label: "C", text: "100 m/s²", isCorrect: false },
      { label: "D", text: "15 m/s²", isCorrect: false },
    ],
    correctAnswer: "B",
    marks: 1,
    explanation: "F = ma → a = F/m = 20/5 = 4 m/s²。",
  },
  {
    subjectCode: "9702",
    topicName: "Dynamics",
    questionType: "NUMERIC" as const,
    difficulty: "HARD" as const,
    stems: ["Two masses of 3 kg and 5 kg are connected by a light inextensible string over a smooth pulley. Calculate the acceleration of the system. (g = 9.81 m/s²)"],
    correctAnswer: "2.45",
    answerUnit: "m/s²",
    marks: 3,
    explanation: "a = (m₂ - m₁)g/(m₁ + m₂) = (5-3)×9.81/(5+3) = 19.62/8 = 2.45 m/s²。",
  },
  // ─── A-Level - Electric Fields ──────────────────────────
  {
    subjectCode: "9702",
    topicName: "Electric Fields",
    questionType: "NUMERIC" as const,
    difficulty: "MEDIUM" as const,
    stems: ["Two point charges of +2.0 μC and +4.0 μC are separated by 0.3 m. Calculate the electric force between them. (k = 8.99×10⁹ N·m²/C²)"],
    correctAnswer: "0.799",
    answerUnit: "N",
    marks: 3,
    explanation: "F = kQ₁Q₂/r² = 8.99×10⁹ × (2.0×10⁻⁶)(4.0×10⁻⁶) / (0.3)² = 0.799 N。",
  },
  // ─── A-Level - Circular Motion ──────────────────────────
  {
    subjectCode: "9702",
    topicName: "Circular Motion",
    questionType: "MCQ" as const,
    difficulty: "MEDIUM" as const,
    stems: ["An object moves in a circle at constant speed. Which statement is correct?"],
    options: [
      { label: "A", text: "Its velocity is constant", isCorrect: false },
      { label: "B", text: "It experiences no acceleration", isCorrect: false },
      { label: "C", text: "It experiences a centripetal acceleration towards the center", isCorrect: true },
      { label: "D", text: "The net force on it is zero", isCorrect: false },
    ],
    correctAnswer: "C",
    marks: 1,
    explanation: "匀速圆周运动中，速度大小不变但方向不断变化，因此存在指向圆心的向心加速度。",
  },
  {
    subjectCode: "9702",
    topicName: "Circular Motion",
    questionType: "NUMERIC" as const,
    difficulty: "HARD" as const,
    stems: ["A car of mass 1200 kg travels around a circular bend of radius 50 m at 20 m/s. Calculate the centripetal force required."],
    correctAnswer: "9600",
    answerUnit: "N",
    marks: 2,
    explanation: "F = mv²/r = 1200 × 20² / 50 = 1200 × 400 / 50 = 9600 N。",
  },
  // ─── A-Level - Quantum Physics ──────────────────────────
  {
    subjectCode: "9702",
    topicName: "Quantum Physics",
    questionType: "MCQ" as const,
    difficulty: "EASY" as const,
    stems: ["The photoelectric effect provides evidence for which nature of light?"],
    options: [
      { label: "A", text: "Wave nature", isCorrect: false },
      { label: "B", text: "Particle nature", isCorrect: true },
      { label: "C", text: "Both wave and particle nature", isCorrect: false },
      { label: "D", text: "Neither", isCorrect: false },
    ],
    correctAnswer: "B",
    marks: 1,
    explanation: "光电效应不能用波动理论解释，爱因斯坦用光子理论成功解释，证明了光的粒子性。",
  },
  {
    subjectCode: "9702",
    topicName: "Quantum Physics",
    questionType: "NUMERIC" as const,
    difficulty: "MEDIUM" as const,
    stems: ["Light of wavelength 450 nm is incident on a metal surface with a work function of 2.0 eV. Calculate the maximum kinetic energy of emitted electrons. (h = 6.63×10⁻³⁴ J·s, c = 3.0×10⁸ m/s, 1 eV = 1.6×10⁻¹⁹ J)"],
    correctAnswer: "1.22e-19",
    answerUnit: "J",
    marks: 4,
    explanation: "E = hc/λ = (6.63×10⁻³⁴ × 3.0×10⁸)/(450×10⁻⁹) = 4.42×10⁻¹⁹ J。Φ = 2.0 × 1.6×10⁻¹⁹ = 3.2×10⁻¹⁹ J。KEmax = E - Φ = 1.22×10⁻¹⁹ J ≈ 0.76 eV。",
  },
];

async function main() {
  console.log("📝 Seeding sample questions...");

  for (const q of sampleQuestions) {
    const subject = await prisma.subject.findUnique({
      where: { code: q.subjectCode },
    });
    if (!subject) {
      console.log(`Subject ${q.subjectCode} not found, skipping`);
      continue;
    }

    const topic = await prisma.topic.findFirst({
      where: { subjectId: subject.id, name: q.topicName },
    });
    if (!topic) {
      console.log(`Topic "${q.topicName}" not found for ${q.subjectCode}, skipping`);
      continue;
    }

    await prisma.question.create({
      data: {
        subjectId: subject.id,
        topicId: topic.id,
        questionType: q.questionType,
        difficulty: q.difficulty,
        stems: q.stems,
        options: q.options ?? undefined,
        correctAnswer: q.correctAnswer,
        answerUnit: q.answerUnit || null,
        marks: q.marks,
        explanation: q.explanation || "",
        source: "MANUAL",
        isVerified: true,
      },
    });
  }

  const count = await prisma.question.count();
  console.log(`✅ Done! ${count} questions in database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
