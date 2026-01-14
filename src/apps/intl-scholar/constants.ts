
import { ExamType, Language } from './types';

export const EXAMS = [
  // Teen
  { id: ExamType.TOEFL, label: 'TOEFL', labelZh: '托福', icon: '🗣️' },
  { id: ExamType.IELTS, label: 'IELTS', labelZh: '雅思', icon: '🌏' },
  { id: ExamType.PTE, label: 'PTE', labelZh: 'PTE学术英语', icon: '⚡' },
  { id: ExamType.IB, label: 'IB Diploma', labelZh: 'IB文凭', icon: '🎓' },
  { id: ExamType.AP, label: 'AP', labelZh: 'AP大学先修', icon: '🇺🇸' },
  { id: ExamType.ALEVEL, label: 'A-Level', labelZh: 'A-Level', icon: '🇬🇧' },
  // Kids
  { id: ExamType.KET, label: 'KET', labelZh: 'KET (A2)', icon: '🗝️' },
  { id: ExamType.PET, label: 'PET', labelZh: 'PET (B1)', icon: '🏅' },
  { id: ExamType.FCE, label: 'FCE', labelZh: 'FCE (B2)', icon: '🏆' },
  { id: ExamType.AMC8, label: 'AMC 8', labelZh: 'AMC 8数学竞赛', icon: '📐' },
  { id: ExamType.AMC10, label: 'AMC 10', labelZh: 'AMC 10数学竞赛', icon: '📐' },
  { id: ExamType.AMC12, label: 'AMC 12', labelZh: 'AMC 12数学竞赛', icon: '📐' },
  { id: ExamType.INTL_SCHOOL_ADMISSION, label: 'School Admission', labelZh: '国际学校择校/升学', icon: '🏫' },
  { id: ExamType.TOEFL_JUNIOR, label: 'TOEFL Junior', labelZh: '小托福', icon: '🧒' },
  { id: ExamType.TOEFL_PRIMARY, label: 'TOEFL Primary', labelZh: '小小托福', icon: '👶' },
  // New Kids Curricula
  { id: ExamType.OPW, label: 'OPW', labelZh: '牛津自然拼读', icon: '🔤' },
  { id: ExamType.POWER_UP, label: 'Power Up', labelZh: 'Power Up', icon: '🚀' },
  { id: ExamType.OXFORD_DISCOVER, label: 'Oxford Discover', labelZh: '牛津探索', icon: '🔍' },
  { id: ExamType.UNLOCK, label: 'Unlock', labelZh: 'Unlock', icon: '🔓' },
  { id: ExamType.READING_EXPLORER, label: 'Reading Explorer', labelZh: '国家地理阅读', icon: '🦁' },
  // Adult
  { id: ExamType.GRE, label: 'GRE', labelZh: 'GRE', icon: '🧠' },
  { id: ExamType.GMAT, label: 'GMAT', labelZh: 'GMAT', icon: '📊' },
  { id: ExamType.PETS3, label: 'PETS-3', labelZh: '公共英语三级', icon: '🇨🇳' },
  { id: ExamType.CATTI, label: 'CATTI', labelZh: 'CATTI翻译资格', icon: '✍️' },
  // Domestic
  { id: ExamType.PRIMARY_ENGLISH, label: 'Primary Eng', labelZh: '小学英语', icon: '🎒' },
  { id: ExamType.JUNIOR_ENGLISH, label: 'Junior Eng', labelZh: '初中英语', icon: '📚' },
  { id: ExamType.ZHONGKAO, label: 'Zhongkao', labelZh: '中考英语', icon: '🏫' },
  { id: ExamType.GAOKAO, label: 'Gaokao', labelZh: '高考英语', icon: '🏯' },
  { id: ExamType.CET4, label: 'CET-4', labelZh: '大学英语四级', icon: '📘' },
  { id: ExamType.CET6, label: 'CET-6', labelZh: '大学英语六级', icon: '📙' },
];

export const EXAM_GROUPS = [
  {
    id: 'kids',
    titleKey: 'catKids',
    exams: [
      ExamType.OPW, 
      ExamType.POWER_UP, 
      ExamType.OXFORD_DISCOVER, 
      ExamType.UNLOCK, 
      ExamType.READING_EXPLORER,
      ExamType.KET, 
      ExamType.PET, 
      ExamType.FCE, 
      ExamType.TOEFL_PRIMARY,
      ExamType.TOEFL_JUNIOR,
      ExamType.AMC8, 
      ExamType.AMC10, 
      ExamType.AMC12,
      ExamType.INTL_SCHOOL_ADMISSION
    ]
  },
  {
    id: 'teen',
    titleKey: 'catTeen',
    exams: [ExamType.TOEFL, ExamType.IELTS, ExamType.PTE, ExamType.IB, ExamType.AP, ExamType.ALEVEL]
  },
  {
    id: 'domestic',
    titleKey: 'catDomestic',
    exams: [ExamType.PRIMARY_ENGLISH, ExamType.JUNIOR_ENGLISH, ExamType.ZHONGKAO, ExamType.GAOKAO, ExamType.CET4, ExamType.CET6]
  },
  {
    id: 'adult',
    titleKey: 'catAdult',
    exams: [ExamType.GRE, ExamType.GMAT, ExamType.PETS3, ExamType.CATTI]
  }
];

export const CITIES = [
  "National (Universal)",
  "Beijing",
  "Shanghai",
  "Guangzhou",
  "Shenzhen",
  "Chengdu",
  "Hangzhou",
  "Nanjing",
  "Wuhan",
  "Tianjin",
  "Chongqing",
  "Xi'an",
  "Suzhou",
  "Changsha",
  "Other"
];

// Data for School Selection Feature
export const ADMISSION_CITIES = [
  "Shanghai (上海)",
  "Beijing (北京)",
  "Shenzhen (深圳)",
  "Guangzhou (广州)",
  "Hangzhou (杭州)",
  "Suzhou (苏州)",
  "Nanjing (南京)",
  "Chengdu (成都)"
];

export const FAMOUS_SCHOOLS_DATA: Record<string, string[]> = {
  "Shanghai (上海)": [
    "YK Pao School (包玉刚实验学校)",
    "Shanghai High School International Division (SHSID/上海中学国际部)",
    "Wellington College Shanghai (上海惠灵顿外籍人员子女学校)",
    "Huili School Shanghai (上海惠立学校)",
    "Concordia International School (上海协和国际学校)",
    "Shanghai American School (SAS/上海美国学校)",
    "World Foreign Language Academy (WFL/世外)",
    "Pinghe School (平和双语)",
    "Dulwich College Shanghai (德威)",
    "Hwa Chong (华二国际/华二紫竹)",
    "UWC Changshu (常熟UWC - Nearby)",
    "Nord Anglia (诺德安达)"
  ],
  "Beijing (北京)": [
    "International School of Beijing (ISB/北京顺义国际学校)",
    "Keystone Academy (鼎石学校)",
    "Western Academy of Beijing (WAB/京西国际学校)",
    "Dulwich College Beijing (北京德威)",
    "Tsinghua International School (THIS/清华附中国际部)",
    "Daystar Academy (启明星)",
    "Beijing City International School (BCIS/乐成)",
    "BSB (英国学校)",
    "Harrow Beijing (哈罗北京)"
  ],
  "Shenzhen (深圳)": [
    "SCIE (Shenzhen College of International Education/深国交)",
    "Shekou International School (SIS/蛇口国际)",
    "Shenzhen Wai (SWIS/深外国际)",
    "BASIS Shenzhen (贝赛思)",
    "Whittle School (荟同)",
    "King's School Shenzhen (国王学校)"
  ],
  "Guangzhou (广州)": [
    "American International School of Guangzhou (AISG/广州美国人学校)",
    "British School of Guangzhou (BSG/广州英国学校)",
    "Huamei International School (华美)",
    "ULink College (ULink/优联)",
    "NCPA",
    "ISA International School (爱莎)"
  ],
  "Hangzhou (杭州)": [
    "Hangzhou International School (HIS/杭州国际学校)",
    "Wellington College Hangzhou (杭州惠灵顿)",
    "Huili School Hangzhou (杭州惠立)",
    "Wahaha International School (WIS/娃哈哈国际)",
    "RDFZ Hangzhou (人大附中杭州学校)",
    "Olive Tree School (橄榄树学校)"
  ]
};

// Grade Options
export const GRADES = [
  "K1 (3-4y)",
  "K2 (4-5y)",
  "K3 (5-6y)",
  "G1 (1年级)", "G2 (2年级)", "G3 (3年级)", "G4 (4年级)", "G5 (5年级)",
  "G6 (6年级)", "G7 (7年级)", "G8 (8年级)", "G9 (9年级)", "G10 (10年级)", "G11 (11年级)", "G12 (12年级)",
  "University Year 1", "University Year 2", "University Year 3", "University Year 4", "Graduate Student", "Adult"
];

// Helper to get score options based on exam
export const getScoreOptions = (exam: ExamType, variant: string = ""): string[] => {
  switch (exam) {
    case ExamType.IELTS:
      return Array.from({ length: 19 }, (_, i) => (i * 0.5).toFixed(1)).reverse(); // 9.0, 8.5 ... 0.0
    case ExamType.TOEFL:
      return ["120", "115+", "110+", "105+", "100+", "95+", "90+", "85+", "80+", "70+", "60+", "<60"];
    case ExamType.PTE:
      return ["90 (Max)", "84+ (IELTS 8.5)", "79+ (IELTS 8.0)", "65+ (IELTS 7.0)", "58+ (IELTS 6.5)", "50+ (IELTS 6.0)", "42+ (IELTS 5.5)", "30+"];
    
    case ExamType.TOEFL_JUNIOR:
      return [
        "850-900 (Superior - CEFR B2)", 
        "800-845 (Excellent - CEFR B1)", 
        "750-795 (Good - CEFR A2)", 
        "700-745 (Average - CEFR A2)", 
        "600-695 (Foundation - CEFR A1)"
      ];
    
    case ExamType.TOEFL_PRIMARY:
      return [
        "Step 2 - 5 Badges (Score 113-115)", 
        "Step 2 - 4 Badges (Score 110-112)", 
        "Step 2 - 3 Badges (Score 107-109)", 
        "Step 2 - 2 Badges (Score 104-106)", 
        "Step 2 - 1 Badge (Score 101-103)",
        "Step 1 - 4 Stars (Score 109)", 
        "Step 1 - 3 Stars (Score 107-108)", 
        "Step 1 - 2 Stars (Score 104-106)",
        "Step 1 - 1 Star (Score 101-103)"
      ];
    
    case ExamType.AP:
      return ["5 (Extremely Well Qualified)", "4 (Well Qualified)", "3 (Qualified)", "2 (Possibly Qualified)", "1 (No Recommendation)"];
    case ExamType.IB:
      return ["7 (Excellent)", "6 (Very Good)", "5 (Good)", "4 (Satisfactory)", "3 (Mediocre)", "2 (Poor)", "1 (Very Poor)"];
    case ExamType.ALEVEL:
      return ["A*", "A", "B", "C", "D", "E", "U"];
    
    case ExamType.CET4:
    case ExamType.CET6:
      return ["600+ (Top 5%)", "550-599 (Excellent)", "500-549 (Good)", "425-499 (Pass)", "< 425 (Fail)"];
    
    case ExamType.GRE:
      return ["330+ (Top Tier)", "325-329 (Excellent)", "320-324 (Good)", "310-319 (Average)", "< 310"];
    case ExamType.GMAT:
      return ["705+ (Focus 99th%)", "655-705 (Excellent)", "605-655 (Good)", "555-605 (Average)", "< 555"];

    case ExamType.KET:
      return [
        "Grade A (Score 140-150)",
        "Grade B (Score 133-139)",
        "Grade C (Score 120-132)",
        "Council of Europe Level A1 (Score 100-119)",
        "Fail (Score < 100)"
      ];
    
    case ExamType.PET:
      return [
        "Grade A (Score 160-170)",
        "Grade B (Score 153-159)",
        "Grade C (Score 140-152)",
        "Council of Europe Level A2 (Score 120-139)",
        "Fail (Score < 120)"
      ];

    case ExamType.FCE:
      return [
        "Grade A (Score 180-190)",
        "Grade B (Score 173-179)",
        "Grade C (Score 160-172)",
        "Council of Europe Level B1 (Score 140-159)",
        "Fail (Score < 140)"
      ];
    
    case ExamType.ZHONGKAO:
      if (variant.includes("Shanghai")) {
         return ["145+ (Top Tier)", "140-144 (Excellent)", "130-139 (Good)", "115-129 (Average)", "< 115"];
      }
      return ["145+ (Top Tier)", "135-144 (Excellent)", "120-134 (Good)", "105-119 (Average)", "90-104 (Pass)", "<90 (Fail)"];
    
    case ExamType.GAOKAO:
      if (variant.includes("Shanghai")) {
        return ["140+ (Target 140+)", "130-139 (Target 130+)", "120-129 (Target 120+)", "100-119", "< 100"];
      }
      return ["140+ (Top Tier)", "130-139 (Excellent)", "115-129 (Good)", "100-114 (Average)", "< 100"];

    case ExamType.AMC8:
    case ExamType.AMC10:
    case ExamType.AMC12:
      return ["Honor Roll of Distinction (Top 1%)", "Honor Roll (Top 5%)", "Achievement Roll", "Top 25%", "Average", "Below Average"];
    
    case ExamType.OPW:
    case ExamType.POWER_UP:
    case ExamType.UNLOCK:
    case ExamType.OXFORD_DISCOVER:
      return ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6"];
    
    default:
      return ["100% (Full Marks)", "90%+", "80%+", "70%+", "60% (Pass)", "<60% (Fail)"];
  }
};

export const TRANSLATIONS = {
  en: {
    title: 'Marvel Intl. Scholar',
    subtitle: 'AI Consultant for International Exams',
    selectExam: 'Select Curriculum / Exam',
    
    // Categories
    catTeen: 'Teen & Youth Curriculum (Study Abroad)',
    catKids: 'Kids & Junior Curriculum (Foundation)',
    catAdult: 'Adult & Graduate School',
    catDomestic: 'Domestic English Exams (China)',

    // Professional Navigation Labels
    info: 'Exam Encyclopedia & Brief',
    mock: 'Mock Exam & Simulation', 
    needs: 'Diagnostic Needs Analysis',
    plan: 'Strategic Study Planning',
    learn: 'AI Courseware Generator',
    school: 'School Admission Strategy', // New
    
    // UI Elements
    examInfo: 'Exam Intelligence',
    needsAnalysis: 'Diagnostic Analysis',
    studyPlan: 'Study Planning',
    courseware: 'Courseware Gen',
    
    start: 'Generate',
    submit: 'Submit',
    generating: 'Marvel AI is thinking...',
    welcome: 'Welcome! Please select a subject to begin.',
    back: 'Switch Curriculum',
    needsPrompt: 'Please fill in the student details to generate a professional analysis report.',
    planPrompt: 'Import the analysis report or upload documents to generate a detailed course schedule.',
    learnPrompt: 'Select a lesson from the plan or upload materials to generate courseware.',
    exportWord: 'Export Word',
    exportPDF: 'Export PDF',
    exportImg: 'Export Image',
    generatedBilingual: 'Generated Content (Bilingual)',
    studentName: 'Student Name',
    grade: 'Grade',
    currentScore: 'Current Level / Total Score',
    subScores: 'Sub-scores (R/L/S/W)',
    subjects: 'Selected Subjects',
    targetScore: 'Target Level / Total Score',
    targetSubScores: 'Target Sub-scores',
    requirements: 'Other Requirements',
    analyze: 'Generate Analysis Report',
    importNeeds: 'Import Analysis Result',
    uploadFile: 'Upload File (PDF/Image)',
    manualInput: 'Manual Input / Instructions',
    phase: 'Phase/Week',
    topic: 'Topic',
    content: 'Specific Content',
    hours: 'Hours',
    importPlan: 'Import Lesson from Plan',
    placementTest: 'Placement Test',
    retry: 'Retry Test',
    correct: 'Correct',
    incorrect: 'Incorrect',
    explanation: 'Explanation',
    score: 'Your Score',
    quickBrief: 'Consultant Quick Brief',
    detailedGuide: 'Detailed Official Guide & Course Design',
    generateGuide: 'Generate Guide & Design',
    askAI: 'AI Exam Expert Q&A',
    chatPlaceholder: 'Ask anything about this exam (e.g., "What is a good score?", "Next test date?")',
    chatIntro: 'I am your specialized AI consultant for **{exam}**. Ask me anything!',
    send: 'Send',
    selectCity: 'Select Target City/Region',
    selectCityPrompt: 'For domestic exams, selecting a city helps AI generate region-specific policies.',
    resourcesTitle: 'Global Prep Treasures',
    resourcesDesc: 'Discover free websites, past papers, and supplementary teaching materials.',
    findResources: 'Find Free Resources & Materials',
    
    // School Selection
    schoolSelectCity: 'Target City',
    schoolStudentAge: 'Student Age / Grade',
    schoolCurrent: 'Current School',
    schoolLevels: 'Levels (CN/Math/Eng)',
    schoolBudget: 'Budget & Remarks',
    schoolTarget: 'Target Schools',
    schoolGenerate: 'Generate Admission Strategy',
    schoolPrompt: 'Select city and input profile to get a comprehensive admission and gap analysis.',
  },
  zh: {
    title: 'Marvel Intl. Scholar (麦迩威智学)',
    subtitle: '麦迩威国际课程顾问智能辅助系统', 
    selectExam: '选择课程体系 / 考试',

    // Categories
    catTeen: '青少年板块 (留学标化/学科)',
    catKids: '少儿板块 (素质养成/竞赛)',
    catAdult: '成人板块 (研究生入学/成人考试)',
    catDomestic: '国内考试板块 (中高考/四六级)',

    // Professional Navigation Labels
    info: '考试百科与顾问速览',
    mock: '全真模考与演练', 
    needs: '智能学情诊断分析',
    plan: '个性化教学规划',
    learn: '双语智能课件生成',
    school: '名校择校与升学指导', // New
    
    // UI Elements
    examInfo: '考试情报中心',
    needsAnalysis: '学情诊断',
    studyPlan: '教学规划',
    courseware: '课件生成',

    start: '生成内容',
    submit: '提交',
    generating: 'Marvel AI 正在生成中...',
    welcome: '欢迎！请选择一个科目开始。',
    back: '切换课程体系',
    needsPrompt: '请填写学员详细信息，以便生成专业的学情分析报告。',
    planPrompt: '一键导入需求分析结果，或上传文件/手动输入，生成详细的课时规划。',
    learnPrompt: '从规划中选择课时，或上传题目/资料，生成双语辅导课件。',
    exportWord: '导出 Word',
    exportPDF: '导出 PDF',
    exportImg: '导出图片',
    generatedBilingual: '生成内容 (中英双语)',
    studentName: '学员姓名',
    grade: '年级',
    currentScore: '目前程度 / 总分',
    subScores: '目前小分 (听说读写)',
    subjects: '选修科目 (如: Math AA, Physics)',
    targetScore: '目标程度 / 总分',
    targetSubScores: '目标小分',
    requirements: '其他特殊要求',
    analyze: '生成学情分析报告',
    importNeeds: '一键导入需求分析',
    uploadFile: '上传文件 (PDF/图片)',
    manualInput: '手动输入 / 补充说明',
    phase: '阶段/周次',
    topic: '教学话题',
    content: '具体教学内容',
    hours: '课时(h)',
    importPlan: '从规划导入课时',
    placementTest: '入学测试',
    retry: '重新生成',
    correct: '回答正确',
    incorrect: '回答错误',
    explanation: '解析',
    score: '本次得分',
    quickBrief: '顾问一分钟速览卡',
    detailedGuide: '权威考试指南白皮书',
    generateGuide: '生成白皮书 & 课程设计',
    askAI: 'AI 考试专家问答',
    chatPlaceholder: '关于该考试的任何问题 (例如：报名费多少？满分多少？)...',
    chatIntro: '您好！我是 **{exam}** 专属 AI 顾问。关于这个考试，您可以问我任何问题。',
    send: '发送',
    selectCity: '选择目标城市/地区',
    selectCityPrompt: '针对国内考试，选择城市可以生成更精准的考情和政策分析。',
    resourcesTitle: '全球备考宝典 (Prep Treasures)',
    resourcesDesc: '发现该考试的全球免费网站、真题题库、以及补充教学资料。',
    findResources: '一键搜寻免费资料/网站',

    // School Selection
    schoolSelectCity: '目标城市',
    schoolStudentAge: '学员年龄 / 年级',
    schoolCurrent: '目前在读学校',
    schoolLevels: '语数英程度 (具体描述)',
    schoolBudget: '学费预算 & 备注',
    schoolTarget: '意向目标名校',
    schoolGenerate: '生成一站式择校方案',
    schoolPrompt: '输入孩子信息，AI将结合全网权威数据，提供针对性的择校分析、能力差距诊断及面试建议。',
  }
};
