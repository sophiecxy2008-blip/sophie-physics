// Syllabus seed data - IGCSE Physics 0625 + A-Level Physics 9702
// Structured as: Subject -> Topic -> Subtopic (via parentId)

interface SeedTopic {
  name: string;
  description: string;
  children?: SeedTopic[];
}

const igcseSyllabus: SeedTopic[] = [
  {
    name: "Motion, Forces and Energy",
    description: "运动、力和能量",
    children: [
      { name: "Physical Quantities and Measurement", description: "物理量和测量" },
      { name: "Kinematics", description: "运动学" },
      { name: "Dynamics", description: "动力学" },
      { name: "Mass, Weight and Density", description: "质量、重量和密度" },
      { name: "Forces and Motion", description: "力和运动" },
      { name: "Momentum", description: "动量" },
      { name: "Energy, Work and Power", description: "能量、功和功率" },
      { name: "Pressure", description: "压强" },
    ],
  },
  {
    name: "Thermal Physics",
    description: "热物理学",
    children: [
      { name: "Kinetic Particle Model of Matter", description: "物质粒子运动模型" },
      { name: "Thermal Properties and Temperature", description: "热性质和温度" },
      { name: "Transfer of Thermal Energy", description: "热传递" },
    ],
  },
  {
    name: "Waves",
    description: "波",
    children: [
      { name: "General Properties of Waves", description: "波的基本性质" },
      { name: "Light", description: "光学" },
      { name: "Electromagnetic Spectrum", description: "电磁波谱" },
      { name: "Sound", description: "声学" },
    ],
  },
  {
    name: "Electricity and Magnetism",
    description: "电学和磁学",
    children: [
      { name: "Simple Phenomena of Magnetism", description: "磁的简单现象" },
      { name: "Electric Charge", description: "电荷" },
      { name: "Current, Voltage and Resistance", description: "电流、电压和电阻" },
      { name: "Electrical Circuits", description: "电路" },
      { name: "Electrical Safety", description: "用电安全" },
      { name: "Electromagnetic Effects", description: "电磁效应" },
    ],
  },
  {
    name: "Nuclear Physics",
    description: "核物理学",
    children: [
      { name: "The Nuclear Model of the Atom", description: "原子核模型" },
      { name: "Radioactivity", description: "放射性" },
    ],
  },
  {
    name: "Space Physics",
    description: "空间物理学",
    children: [
      { name: "Earth and the Solar System", description: "地球和太阳系" },
      { name: "Stars and the Universe", description: "恒星和宇宙" },
    ],
  },
];

const aLevelSyllabus: SeedTopic[] = [
  {
    name: "Physical Quantities and Units",
    description: "物理量和单位",
    children: [
      { name: "SI Units", description: "国际单位制" },
      { name: "Errors and Uncertainties", description: "误差和不确定度" },
      { name: "Scalars and Vectors", description: "标量和向量" },
    ],
  },
  {
    name: "Kinematics",
    description: "运动学",
    children: [
      { name: "Equations of Motion", description: "运动方程" },
    ],
  },
  {
    name: "Dynamics",
    description: "动力学",
    children: [
      { name: "Newton's Laws of Motion", description: "牛顿运动定律" },
      { name: "Momentum and Collisions", description: "动量和碰撞" },
    ],
  },
  {
    name: "Forces, Density and Pressure",
    description: "力、密度和压强",
    children: [
      { name: "Turning Effects of Forces", description: "力的转动效应" },
      { name: "Pressure and Density", description: "压强和密度" },
    ],
  },
  {
    name: "Work, Energy and Power",
    description: "功、能量和功率",
    children: [
      { name: "Energy Conservation", description: "能量守恒" },
      { name: "Work and Power", description: "功和功率" },
    ],
  },
  {
    name: "Deformation of Solids",
    description: "固体形变",
    children: [
      { name: "Hooke's Law", description: "胡克定律" },
      { name: "Young Modulus", description: "杨氏模量" },
    ],
  },
  {
    name: "Waves",
    description: "波",
    children: [
      { name: "Progressive Waves", description: "行波" },
      { name: "Superposition", description: "叠加" },
      { name: "Stationary Waves", description: "驻波" },
      { name: "Doppler Effect", description: "多普勒效应" },
    ],
  },
  {
    name: "Superposition",
    description: "叠加",
    children: [
      { name: "Interference", description: "干涉" },
      { name: "Diffraction Gratings", description: "衍射光栅" },
    ],
  },
  {
    name: "Electric Fields",
    description: "电场",
    children: [
      { name: "Coulomb's Law", description: "库仑定律" },
      { name: "Uniform Electric Fields", description: "匀强电场" },
      { name: "Electric Potential", description: "电势" },
    ],
  },
  {
    name: "Current of Electricity",
    description: "电流",
    children: [
      { name: "Ohm's Law and Resistance", description: "欧姆定律和电阻" },
      { name: "Kirchhoff's Laws", description: "基尔霍夫定律" },
      { name: "Potential Dividers", description: "分压器" },
    ],
  },
  {
    name: "D.C. Circuits",
    description: "直流电路",
    children: [
      { name: "Internal Resistance", description: "内阻" },
      { name: "Circuit Analysis", description: "电路分析" },
    ],
  },
  {
    name: "Particle and Nuclear Physics",
    description: "粒子与核物理",
    children: [
      { name: "Atomic Structure", description: "原子结构" },
      { name: "Radioactive Decay", description: "放射性衰变" },
      { name: "Nuclear Reactions", description: "核反应" },
      { name: "Fundamental Particles", description: "基本粒子" },
    ],
  },
  {
    name: "Circular Motion",
    description: "圆周运动",
    children: [
      { name: "Angular Velocity and Acceleration", description: "角速度和角加速度" },
      { name: "Centripetal Force", description: "向心力" },
    ],
  },
  {
    name: "Gravitational Fields",
    description: "引力场",
    children: [
      { name: "Newton's Law of Gravitation", description: "万有引力定律" },
      { name: "Gravitational Potential", description: "引力势" },
      { name: "Satellite Orbits", description: "卫星轨道" },
    ],
  },
  {
    name: "Oscillations",
    description: "振动",
    children: [
      { name: "Simple Harmonic Motion", description: "简谐运动" },
      { name: "Damping and Resonance", description: "阻尼和共振" },
    ],
  },
  {
    name: "Thermal Physics",
    description: "热物理学",
    children: [
      { name: "Ideal Gases", description: "理想气体" },
      { name: "Kinetic Theory", description: "分子运动论" },
      { name: "Laws of Thermodynamics", description: "热力学定律" },
    ],
  },
  {
    name: "Magnetic Fields",
    description: "磁场",
    children: [
      { name: "Magnetic Force on a Current", description: "电流在磁场中的力" },
      { name: "Magnetic Flux and Flux Density", description: "磁通量和磁通密度" },
      { name: "Electromagnetic Induction", description: "电磁感应" },
    ],
  },
  {
    name: "Alternating Currents",
    description: "交流电",
    children: [
      { name: "AC Circuits", description: "交流电路" },
      { name: "Transformers", description: "变压器" },
    ],
  },
  {
    name: "Quantum Physics",
    description: "量子物理学",
    children: [
      { name: "Photoelectric Effect", description: "光电效应" },
      { name: "Wave-Particle Duality", description: "波粒二象性" },
      { name: "Emission and Absorption Spectra", description: "发射和吸收光谱" },
    ],
  },
];

export const SEED_DATA = {
  subjects: [
    { name: "Physics", code: "0625", level: "IGCSE" as const },
    { name: "Physics", code: "9702", level: "A_LEVEL" as const },
  ],
  igcseSyllabus,
  aLevelSyllabus,
};
