
import React, { useState, useRef, useEffect } from 'react';
import { ProductType, ChatMessage, MessageRole } from '../types';
import { sendMessageToGemini } from '../services/gemini';
import { 
  BookOpen, 
  Target, 
  Lightbulb, 
  Bot,
  Sparkles,
  Send,
  Loader2,
  X,
  Baby,
  BrainCircuit,
  Users,
  GraduationCap,
  Plane,
  HelpCircle,
  Stethoscope,
  ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ToolboxTab = 'ADULT' | 'KIDS' | 'TOEFL' | 'IELTS';
type ToolboxStage = 'methodology' | 'problems';

interface ToolboxItem {
  id: string;
  category: string;
  title: string;
  content: string; // Theoretical definition or Problem description
  purpose: string; // "Why this matters" or "Root Cause"
  example: string; // "Classroom Example" or "Solution Strategy"
}

// Custom Markdown Components for the Assistant
const ToolboxMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ node, ...props }) => (
    <h1 className="text-xl font-black text-navy-900 mt-4 mb-3 border-b border-navy-200 pb-2" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-lg font-bold text-navy-800 mt-4 mb-2 flex items-center gap-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-sm font-bold text-navy-900 mt-4 mb-2 uppercase tracking-wider flex items-center gap-2" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-navy-700 bg-navy-50 px-1 rounded mx-0.5" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc ml-4 space-y-2 text-navy-700 mb-3 text-sm" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal ml-4 space-y-2 text-navy-700 mb-3 text-sm" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="pl-1 leading-relaxed marker:text-navy-400" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="mb-2 leading-relaxed text-navy-700 text-sm" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <div className="border-l-4 border-navy-500 pl-3 py-2 my-3 italic text-navy-600 bg-navy-50 rounded-r text-sm">
      {props.children}
    </div>
  ),
  code: ({ node, ...props }) => (
    <code className="bg-navy-100 text-gold-600 px-1 py-0.5 rounded text-xs font-mono" {...props} />
  )
};

// ==========================================
// 1. ADULT ENGLISH DATA
// ==========================================
const ADULT_METHODOLOGY: ToolboxItem[] = [
  {
    id: 'a0',
    category: '级别标准 (Standards)',
    title: 'CEFR 欧洲语言共同参考框架',
    content: '全球通用的语言能力分级标准。\nA1-A2 (Basic): 生存口语，简单日常交流。\nB1-B2 (Independent): 独立表达观点，职场沟通。\nC1-C2 (Proficient): 精通专业领域，地道流利。',
    purpose: '【定级与预期管理】\n准确判定级别是教学的前提。切勿对 A2 学生讲 C1 词汇。\nWhy: Match Teacher Talking Time (TTT) vocab to student level.',
    example: 'Check: Asking a Beginner "What are the implications?" (Fail) vs "Is it good?" (Pass).'
  },
  { 
    id: 'a1', 
    category: '学习理论 (Theory)', 
    title: '成人教育学 (Andragogy)', 
    content: '成人学习者基于过往经验构建新知识，强调"即学即用"。\nAdults are problem-centered and need to know "Why do I need to learn this now?".', 
    purpose: '【建立关联性】\n成人只关心"这对我有什么用"。\nWhy: Adults learn best when content solves an immediate life problem.', 
    example: 'Scenario: Teaching "Present Perfect".\nUse: "I have finished the report" (Work context) instead of "I have been to Paris".' 
  },
  {
    id: 'a_pyramid',
    category: '核心理论 (Theory)',
    title: '学习金字塔 (Learning Pyramid)',
    content: '揭示不同学习方式的留存率差异。\nPassive (被动): Lecture (5%), Reading (10%), Audio-Visual (20%).\nActive (主动): Discussion (50%), Practice doing (75%), Teaching others (90%).',
    purpose: '【拒绝填鸭式 / Rejecting Lectures】\n老师讲得越爽，学生学得越差。必须倒逼学生输出。\nWhy: Passive listening leads to <20% retention. Active participation is non-negotiable.',
    example: 'Activity: "Jigsaw Reading".\nDivide text into 3 parts. Students read their part and *teach* it to group members. (Retention spikes to 90%).'
  },
  {
    id: 'a_iuofa',
    category: 'ME 核心闭环 (ME Methodology)',
    title: 'IUOFA 教学模型',
    content: 'ME 独家定义的五步闭环教学法：\n1. I (Input): 高质量、可理解的输入 (i+1)。\n2. U (Understanding): 概念检查 (CCQs) 确认理解。\n3. O (Output): 强制性口语输出/操练。\n4. F (Feedback): 针对性的纠错与反馈。\n5. A (Apply): 真实场景迁移运用。',
    purpose: '【闭环思维 / Closed Loop】\n很多老师停留在 I/U 阶段，忽略了最重要的 O/A。\nWhy: "Knowing" (Knowledge) ≠ "Doing" (Skill). We must bridge the gap to Application.',
    example: 'Teaching "Negotiation":\n1. I: Show video/phrase. 2. U: "Is this polite or rude?" 3. O: Role-play script. 4. F: Correct tone. 5. A: Simulate their real client meeting next week.'
  },
  { 
    id: 'a2', 
    category: '教学技法 (Technique)', 
    title: '任务型教学 (TBLT)', 
    content: '以完成交际任务为核心：前任务 -> 任务环 -> 语言聚焦。\nTask-Based Learning: Focus on meaning first, form second.', 
    purpose: '【先用后教】\n先让学生尝试（暴露缺口），再针对性教学。\nWhy: Creates a "Gap" in knowledge that motivates learning.', 
    example: 'Task: "Negotiate a Salary".\n1. Role-play (Student struggles). 2. Teach polite refusal. 3. Role-play again.' 
  },
  { 
    id: 'a3', 
    category: '教学技法 (Technique)', 
    title: '语块教学 (Lexical Approach)', 
    content: '侧重固定搭配 (Chunks) 而非孤立单词。\nFocus on Collocations and Chunks ("make a decision"), not isolated words.', 
    purpose: '【提升流利度】\n大脑提取语块比单词更快，也是地道英语的核心。\nWhy: Reduces processing time and "Chinglish".', 
    example: 'Instead of "Decision" + "Make", teach "Make a decision" as one unit.' 
  },
  {
    id: 'a4',
    category: '核心流程 (Structure)',
    title: 'PPP 教学法 (Presentation, Practice, Production)',
    content: '经典的教学三部曲：展示(输入) -> 操练(控制) -> 产出(自由)。\nA structured approach: Input -> Controlled Drill -> Free Use.',
    purpose: '【从懂到会】\n确保学生有足够的"脚手架"支撑，最后能独立使用语言。\nWhy: Provides structure and confidence.',
    example: '1. Present "Used to". 2. Drill: "I used to ___". 3. Discuss: "How has your life changed?"'
  },
  {
    id: 'a5',
    category: '反馈艺术 (Feedback)',
    title: '纠错策略 (Error Correction)',
    content: '即时纠错 (Accuracy) vs 延时纠错 (Fluency)。\nImmediate Correction for drills; Delayed Correction for free speaking.',
    purpose: '【保护自信】\n在学生表达观点时打断是最大的禁忌。\nWhy: Constant interruption kills motivation.',
    example: 'Hot Sheet: Write down errors silently while student speaks. Review anonymously at the end.'
  },
  {
    id: 'a6',
    category: '概念检查 (Checking)',
    title: 'CCQs & ICQs',
    content: '概念检查问题 (CCQs) 和 指令检查问题 (ICQs)。\nConcept Checking Questions & Instruction Checking Questions.',
    purpose: '【拒绝"Do you understand?"】\n学生点头不代表懂了。必须验证。\nWhy: Students lie about understanding to save face.',
    example: 'Instead of "Do you understand \'Past Tense\'?", ask "Did it happen now or yesterday?" (CCQ).'
  },
  {
    id: 'a7',
    category: '话语权 (Interaction)',
    title: 'TTT vs STT',
    content: 'Teacher Talking Time (TTT) vs Student Talking Time (STT)。\n目标是 TTT < 30%, STT > 70%。',
    purpose: '【把舞台给学生】\n学生是来练的，不是来听讲座的。\nWhy: Language is a skill, not just knowledge.',
    example: 'Reduce TTT: Use gestures instead of explanations. Ask, don\'t tell.'
  },
  {
    id: 'a8',
    category: '脚手架 (Support)',
    title: 'Scaffolding (脚手架)',
    content: '提供临时的支持结构（如句型模版、词汇表），帮助学生完成任务。\ni+1 Input support.',
    purpose: '【降低难度】\n防止学生因任务太难而放弃。\nWhy: Keeps students in the Zone of Proximal Development (ZPD).',
    example: 'Before debate, give sentence starters: "I agree because..." / "That is true, but..."'
  },
  {
    id: 'a9',
    category: '语法教学 (Grammar)',
    title: '归纳法 (Inductive Approach)',
    content: '先给例句，让学生自己发现规则（Guided Discovery）。\nExamples first, rules second.',
    purpose: '【主动思考】\n自己发现的规则记忆更深刻。\nWhy: Promotes cognitive engagement.',
    example: 'Show: "I *played* tennis", "She *worked* hard". Ask: "What is added to the verb?" -> "ed".'
  }
];

const ADULT_PROBLEMS: ToolboxItem[] = [
  {
    id: 'ap1',
    category: '思维障碍',
    title: '脑中翻译 (Mental Translation)',
    content: '听到英语 -> 切中文思考 -> 翻译成英文 -> 输出。\nTranslating L1 <-> L2 in head.',
    purpose: '【反应卡顿】\n导致流利度低，中式英语。\nRoot Cause: Analyzing grammar instead of acquiring patterns.',
    example: 'Solution: "Rapid Fire". Ask 5 questions fast. Force answer in <2s. No time to translate.'
  },
  {
    id: 'ap2',
    category: '学习瓶颈',
    title: '中级瓶颈期 (The B1 Plateau)',
    content: '永远用简单词 (good, bad, happy)，无法深入。\nStuck using "Baby English".',
    purpose: '【舒适区陷阱】\n现有词汇够生存，大脑懒得升级。\nRoot Cause: Lack of push for accuracy/nuance.',
    example: 'Solution: "Banned Words". Write "Good/Bad" on board. Cross them out. Must use "Excellent/Terrible".'
  },
  {
    id: 'ap3',
    category: '心理障碍',
    title: '完美主义 (Fear of Error)',
    content: '怕犯错所以干脆不说，眼神闪躲。\nSilent due to fear of imperfection.',
    purpose: '【情感过滤网高】\n越焦虑，习得效率越低。\nRoot Cause: Past trauma or loss of face.',
    example: 'Solution: "Fluency First". Promise NO correction for 5 mins. Just get meaning across.'
  },
  {
    id: 'ap4',
    category: '发音焦虑',
    title: '口音自卑 (Accent Shame)',
    content: '觉得发音不标准不敢大声说。\nAshamed of accent.',
    purpose: '【误解好英语】\n好英语=清晰，不等于Native。\nRoot Cause: Confusing Accent with Error.',
    example: 'Solution: Focus on "Sentence Stress" (Rhythm) rather than individual vowel sounds.'
  },
  {
    id: 'ap5',
    category: '习惯固化',
    title: '僵化现象 (Fossilization)',
    content: '反复犯同一个错误（如 He/She 不分），纠正后立马又错。\nPersistent errors despite correction.',
    purpose: '【错误内化】\n大脑已经把错误形式当成正确的了。\nRoot Cause: Habit formation.',
    example: 'Solution: "Conscious Drilling". Record them. Play back. Ask THEM to find the error.'
  },
  {
    id: 'ap6',
    category: '母语干扰',
    title: '中式逻辑 (L1 Interference)',
    content: '虽无语法错误，但表达很怪（如 "Open the light"）。\nCorrect grammar, wrong collocation.',
    purpose: '【直译思维】\n直接套用中文搭配。\nRoot Cause: L1 mapping.',
    example: 'Solution: Teach Collocations. "Turn on" the light. Show visuals of "Turn" vs "Open".'
  },
  {
    id: 'ap7',
    category: '听力障碍',
    title: '听力恐慌 (Listening Panic)',
    content: '一听到生词就卡住，错过后面整段话。\nFreezing at unknown words.',
    purpose: '【容错率低】\n试图听懂每一个字。\nRoot Cause: Poor tolerance for ambiguity.',
    example: 'Solution: "Keyword Focus". Listen only for: Who, Where, When. Ignore the rest.'
  },
  {
    id: 'ap8',
    category: '词汇输出',
    title: '被动词汇断层 (Passive Vocab Gap)',
    content: '阅读能看懂，口语用不出。\nCan read C1 text, but speaks at A2.',
    purpose: '【输出训练少】\n输入未转化为输出。\nRoot Cause: Lack of activation.',
    example: 'Solution: "Retelling". Read a short text, cover it, and summarize it immediately.'
  },
  {
    id: 'ap9',
    category: '时间管理',
    title: '没时间复习 (Low Commitment)',
    content: '"工作太忙，没做作业"。\nNo time for homework.',
    purpose: '【优先级低】\n非刚需。\nRoot Cause: Lifestyle not adapted.',
    example: 'Solution: "Micro-learning". Assign 5-min tasks (e.g., Listen to 1 song) instead of 1-hour papers.'
  },
  {
    id: 'ap10',
    category: '内容枯竭',
    title: '没想法 (Lack of Ideas)',
    content: '问观点题，回答 "I don\'t know"。\nNo opinion on topics.',
    purpose: '【缺乏批判思维】\n不仅是语言问题，是思维问题。\nRoot Cause: Critical thinking gap.',
    example: 'Solution: PREP Model (Point, Reason, Example, Point). Give them the structure.'
  }
];

// ==========================================
// 2. KIDS ENGLISH DATA
// ==========================================
const KIDS_METHODOLOGY: ToolboxItem[] = [
  {
    id: 'k1',
    category: '入门技法',
    title: '全身反应法 (TPR)',
    content: '听指令做动作。Listener -> Performer。\nTotal Physical Response.',
    purpose: '【跳过翻译】\n利用好动特性，建立直接联系。\nWhy: Bypasses L1 translation.',
    example: 'Game: "Simon Says". "Touch your nose!" (Teacher models first).'
  },
  {
    id: 'k2',
    category: '阅读基石',
    title: '自然拼读 (Phonics)',
    content: '建立字母与发音的规则。\nConnecting Letters to Sounds.',
    purpose: '【自主阅读】\n见词能读，听音能写。\nWhy: Decoding tool for independence.',
    example: 'Arm Blending: Tap shoulder /c/, elbow /a/, hand /t/ -> /cat/.'
  },
  {
    id: 'k3',
    category: '课堂管理',
    title: '正面管教 (Positive Discipline)',
    content: '温和而坚定。\nKind and Firm. Connection before Correction.',
    purpose: '【建立自律】\n关注解决方案而非惩罚。\nWhy: Punishment stops behavior temporarily; discipline teaches.',
    example: 'Say "We walk inside" instead of "Don\'t run!". Give choices.'
  },
  {
    id: 'k4',
    category: '教学技法',
    title: '脚手架 (Scaffolding)',
    content: '提供台阶，帮助孩子完成任务。\nSupport to reach next level (ZPD).',
    purpose: '【降低挫败感】\n拆解大任务。\nWhy: Keeps kids confident.',
    example: 'Retelling: 1. Teacher tells. 2. Pictures. 3. Fill blanks. 4. Kid tells.'
  },
  {
    id: 'k5',
    category: '互动',
    title: '游戏化 (Gamification)',
    content: 'Learning through play。\n把练习包装成游戏。',
    purpose: '【维持专注】\n孩子注意力短。\nWhy: High engagement = High retention.',
    example: 'Drill: "Bomb Game". Flashcards have hidden bombs. Answer wrong -> Boom!'
  },
  {
    id: 'k6',
    category: '核心理念',
    title: '整体语言 (Whole Language)',
    content: '在完整语境（绘本/故事）中习得语言。\nContext first, analysis second.',
    purpose: '【意义优先】\n像学母语一样自然习得。\nWhy: Language is for meaning.',
    example: 'Read "Hungry Caterpillar". Focus on the story arc, not just vocab lists.'
  },
  {
    id: 'k7',
    category: '课程设计',
    title: '螺旋上升 (Spiral Curriculum)',
    content: '定期回顾旧知识，并在更高难度上重现。\nRevisiting topics at deeper levels.',
    purpose: '【对抗遗忘】\n知识需要反复复现。\nWhy: Reinforcement.',
    example: 'L1: "Red/Blue". L5: "Red apple". L10: "My favorite color is red because..."'
  },
  {
    id: 'k8',
    category: '环境',
    title: '沉浸式 (Immersion)',
    content: '全英文环境（No Chinese）。\nEnglish Only Environment.',
    purpose: '【磨耳朵】\n建立英语思维。\nWhy: Maximizes exposure.',
    example: 'Teacher pretends not to understand Chinese. "I don\'t know what \'Shu\' is. Oh, a Book!"'
  },
  {
    id: 'k9',
    category: '差异化',
    title: '多元智能 (Multiple Intelligences)',
    content: '针对不同类型的孩子（视觉/听觉/动觉）设计活动。\nVisual, Auditory, Kinesthetic.',
    purpose: '【人人都能学】\n照顾不同学习风格。\nWhy: Inclusivity.',
    example: 'Vocab: Show picture (Visual), Say word (Auditory), Act it out (Kinesthetic).'
  },
  {
    id: 'k10',
    category: '思维',
    title: 'C-P-A 教学法',
    content: '具象(Concrete) -> 形象(Pictorial) -> 抽象(Abstract)。\nStart with real objects.',
    purpose: '【符合认知发展】\n孩子思维是具象的。\nWhy: Bridges gap to abstract concepts.',
    example: 'Prepositions: 1. Put ball IN box (Real). 2. Draw ball in box. 3. Write "in".'
  }
];

const KIDS_PROBLEMS: ToolboxItem[] = [
  {
    id: 'kp1',
    category: '专注力',
    title: '坐不住/多动 (Hyperactive)',
    content: '满教室跑，无法集中。\nRunning around, short attention span.',
    purpose: '【生理特性】\n精力过剩或课程枯燥。\nRoot Cause: High energy or boredom.',
    example: 'Solution: "Stir and Settle". Mix active games (Running) with passive ones (Coloring).'
  },
  {
    id: 'kp2',
    category: '情感',
    title: '分离焦虑 (Separation Anxiety)',
    content: '进教室就哭，抓着家长。\nCrying, refusing to enter.',
    purpose: '【缺乏安全感】\n对陌生环境恐惧。\nRoot Cause: Fear of unknown.',
    example: 'Solution: "The Helper". Give the child a job (Door Monitor). Distract them.'
  },
  {
    id: 'kp3',
    category: '输出',
    title: '沉默期 (Silent Period)',
    content: '听得懂但不说。\nUnderstands but refuses to speak.',
    purpose: '【正常阶段】\n正在吸收，强迫会逆反。\nRoot Cause: Input accumulation stage.',
    example: 'Solution: Binary Choice. "Is it Red or Blue?" (Easier than "What color?").'
  },
  {
    id: 'kp4',
    category: '依赖',
    title: '母语依赖 (L1 Dependency)',
    content: '一直说中文求助。\nUses Chinese for everything.',
    purpose: '【习惯/方便】\n不知道怎么用英文表达。\nRoot Cause: Lack of functional language.',
    example: 'Solution: "English Passport". Must use English card to go to toilet.'
  },
  {
    id: 'kp5',
    category: '行为',
    title: '行为问题 (Disruptive)',
    content: '打人、抢玩具、尖叫。\nHitting, screaming.',
    purpose: '【寻求关注】\n负面关注也是关注。\nRoot Cause: Attention seeking.',
    example: 'Solution: Catch them being good. Praise immediately when they sit nicely.'
  },
  {
    id: 'kp6',
    category: '干扰',
    title: '家长干预 (Parent Interference)',
    content: '家长在旁听时打断纠错。\nParent interrupts class.',
    purpose: '【家长焦虑】\n不懂教学法，打击孩子自信。\nRoot Cause: Parental anxiety.',
    example: 'Solution: Pre-class rules. "Please be an Observer only. Let me handle corrections."'
  },
  {
    id: 'kp7',
    category: '拼读',
    title: '字母混淆 (Letter Confusion)',
    content: 'b/d, p/q 分不清。\nConfusing mirror letters.',
    purpose: '【空间知觉】\n大脑未完全发育。\nRoot Cause: Spatial awareness.',
    example: 'Solution: "Bed" trick. Make fists like a bed (left b, right d).'
  },
  {
    id: 'kp8',
    category: '记忆',
    title: '遗忘曲线 (Forgetting)',
    content: '上节课学的全忘了。\nRetains nothing.',
    purpose: '【复习不够】\n缺乏间隔重复。\nRoot Cause: Lack of spaced repetition.',
    example: 'Solution: Recycle vocab. Use Lesson 1 words in Lesson 3 warm-up.'
  },
  {
    id: 'kp9',
    category: '参与度',
    title: '无聊/走神 (Boredom)',
    content: '打哈欠，玩手指。\nYawning, zoning out.',
    purpose: '【挑战度不匹配】\n太难或太简单。\nRoot Cause: Not in ZPD.',
    example: 'Solution: "Mystery Box". Bring a box with hidden objects. Spark curiosity.'
  },
  {
    id: 'kp10',
    category: '心理',
    title: '同伴压力 (Peer Comparison)',
    content: '觉得自己比别人差，不想学。\n"He is better than me".',
    purpose: '【自信受挫】\n比较心态。\nRoot Cause: Confidence blow.',
    example: 'Solution: Differentiated roles. Give the struggling kid a special easy task (Card dealer).'
  }
];

// ==========================================
// 3. TOEFL DATA (Logically Grouped)
// ==========================================
const TOEFL_METHODOLOGY: ToolboxItem[] = [
  // --- Core ---
  {
    id: 'tm1',
    category: '核心逻辑 (Core)',
    title: '综合任务逻辑 (Integrated Tasks)',
    content: '读+听+说/写。模拟北美学术场景。\nTesting ability to synthesize Reading & Listening.',
    purpose: '【学术搬砖能力】\n不仅考语言，考信息处理。\nWhy: Simulates university lectures.',
    example: 'Template: "The reading states X... However, the lecturer opposes this by saying Y..."'
  },
  // --- Listening ---
  {
    id: 'tm2',
    category: '听力 (Listening)',
    title: '笔记法 (Note-taking)',
    content: '结构化笔记。康奈尔笔记法变体。\nStructured notes, not dictation.',
    purpose: '【听逻辑】\n记实词、逻辑词（But, So）、结构。\nWhy: Working memory is limited.',
    example: 'Split paper. Left: Main Ideas. Right: Details. Use arrows/symbols.'
  },
  {
    id: 'tm6',
    category: '听力 (Listening)',
    title: '信号词 (Signal Words)',
    content: '听转折、因果、举例、强调。\nListen for "However", "Therefore", "For example".',
    purpose: '【考点定位】\n信号词后面往往是考点。\nWhy: Predicts questions.',
    example: 'When hearing "But...", write down what comes next immediately.'
  },
  // --- Reading ---
  {
    id: 'tm3',
    category: '阅读 (Reading)',
    title: 'Active Reading',
    content: '带着问题找答案。Skim & Scan。\nReading for info, not pleasure.',
    purpose: '【时间管理】\n托福阅读是检索游戏。\nWhy: Passages are too long to read word-for-word.',
    example: 'Read Question -> Scan Para for keyword -> Read that sentence.'
  },
  // --- Speaking ---
  {
    id: 'tm4',
    category: '口语 (Speaking)',
    title: 'SpeechRater 逻辑',
    content: '机器评分标准：流利度、发音、词汇多样性。\nFluency, Pronunciation, Vocab, Grammar.',
    purpose: '【讨好机器】\n减少停顿，语速适中。\nWhy: E-rater punishes silence.',
    example: 'Use Fillers: "As a matter of fact..." to buy thinking time without silence.'
  },
  {
    id: 'tm7',
    category: '口语 (Speaking)',
    title: '复述策略 (Retelling)',
    content: '综合口语中，准确复述听力内容。\nAccurately summarizing the lecture.',
    purpose: '【内容分】\n要点全覆盖。\nWhy: Content accuracy matters most.',
    example: 'Don\'t give your opinion. Say "The professor argues that..."'
  },
  // --- Writing ---
  {
    id: 'tm5',
    category: '写作 (Writing)',
    title: '独立写作模版 (Templates)',
    content: '开头+3主体段+结尾。五段式。\nStandard 5-paragraph essay.',
    purpose: '【结构分】\n保证逻辑清晰，字数达标。\nWhy: Structure is graded heavily.',
    example: 'Body Para: Topic Sentence -> Explanation -> Example -> Wrap up.'
  },
  {
    id: 'tm8',
    category: '写作/词汇 (Vocab)',
    title: '同义替换 (Paraphrasing)',
    content: '用不同词汇表达同一意思。\nRestating without repeating.',
    purpose: '【词汇分】\n展示词汇量。\nWhy: Copying text lowers score.',
    example: 'Text: "Important". You say: "Crucial / Significant / Vital".'
  }
];

const TOEFL_PROBLEMS: ToolboxItem[] = [
  // Listening
  { id: 'tp1', category: '听力 (Listening)', title: '跟不上语速 (Speed)', content: '听不懂连读，只听到碎片。', purpose: '【辨音弱】', example: 'Solution: 1.2x speed practice.' },
  { id: 'tp5', category: '听力 (Listening)', title: '记不下笔记 (Notes)', content: '光记笔记听漏了。', purpose: '【脑手不协调】', example: 'Solution: Write less. Only keywords.' },
  // Reading
  { id: 'tp3', category: '阅读 (Reading)', title: '做不完 (Time)', content: '逐字翻译，超时。', purpose: '【阅读习惯差】', example: 'Solution: Stop translating. Scan for keywords.' },
  { id: 'tp6', category: '阅读/词汇 (Vocab)', title: '词汇题错 (Vocab)', content: '背了单词还选错。', purpose: '【忽视语境】', example: 'Solution: Plug option back into sentence.' },
  { id: 'tp8', category: '阅读 (Syntax)', title: '看不懂结构 (Syntax)', content: '单词都认识，连起来不懂。', purpose: '【语法弱】', example: 'Solution: Bracket Method (Remove modifiers).' },
  // Speaking
  { id: 'tp2', category: '口语 (Speaking)', title: '大脑空白 (Blank Mind)', content: 'Task 1 没思路。', purpose: '【缺语料】', example: 'Solution: Universal Reasons (Money, Health, Friends).' },
  { id: 'tp7', category: '口语 (Speaking)', title: '机器人发音 (Robotic)', content: '平调，无感情。', purpose: '【无语调】', example: 'Solution: Shadowing with exaggeration.' },
  // Writing
  { id: 'tp4', category: '写作 (Writing)', title: '字数不够 (Word Count)', content: '车轱辘话。', purpose: '【不会展开】', example: 'Solution: Invent details/personal stories.' },
  { id: 'tp10', category: '写作 (Writing)', title: '听读反了 (Structure)', content: '写太多阅读内容。', purpose: '【误解任务】', example: 'Solution: Focus 70% on Listening points.' },
  // General
  { id: 'tp9', category: '心态 (Mindset)', title: '考试焦虑 (Anxiety)', content: '平时好，考试崩。', purpose: '【抗压弱】', example: 'Solution: Noise practice (simulate test center).' }
];

// ==========================================
// 4. IELTS DATA (Logically Grouped)
// ==========================================
const IELTS_METHODOLOGY: ToolboxItem[] = [
  // --- Core ---
  {
    id: 'im1',
    category: '核心评分 (Core)',
    title: '词汇丰富度 (Lexical Resource)',
    content: 'Collocations (搭配) & Idiomatic language。\nNot just big words, but natural usage.',
    purpose: '【地道性】\n7分关键。\nWhy: Shows native-like control.',
    example: 'Not "do a mistake" -> "make a mistake".'
  },
  // --- Listening ---
  {
    id: 'im6',
    category: '听力 (Listening)',
    title: '预判 (Prediction)',
    content: '听前读题，预判词性和内容。\nPredict noun/verb/number.',
    purpose: '【捕捉答案】\n有目的的听。\nWhy: Increases accuracy.',
    example: 'Gap is after "at". Predict: Time or Place.'
  },
  // --- Reading ---
  {
    id: 'im5',
    category: '阅读 (Reading)',
    title: '同义替换定位 (Synonyms)',
    content: '题目词汇和文章词汇是同义词。\nQuestion keyword ≠ Text keyword.',
    purpose: '【定位核心】\n雅思阅读考的就是词汇替换。\nWhy: Locating answers.',
    example: 'Q: "Environment". Text: "Nature / Surroundings".'
  },
  // --- Speaking ---
  {
    id: 'im3',
    category: '口语 (Speaking)',
    title: '扩展答案 (Extension)',
    content: 'Answer + Explain + Example。\nNever give one-word answers.',
    purpose: '【展示语言量】\n考官需要语料打分。\nWhy: Short answers = Low fluency.',
    example: 'Q: Do you like art? A: Yes (Direct), because it relaxes me (Reason). For instance...'
  },
  {
    id: 'im7',
    category: '口语 (Speaking)',
    title: 'P2 讲故事 (Storytelling)',
    content: '描述经历。Who, When, What, Why。\nStructure your 2-minute speech.',
    purpose: '【撑满2分钟】\n有结构的叙述。\nWhy: Coherence.',
    example: 'Start with background, then main event, then feeling.'
  },
  // --- Writing ---
  {
    id: 'im2',
    category: '写作 (Writing)',
    title: '连贯与衔接 (CC)',
    content: 'Coherence & Cohesion。逻辑流 + 连接词。\nFlow of ideas.',
    purpose: '【逻辑通顺】\n不仅是 First/Second，是观点递进。\nWhy: 25% of score.',
    example: 'Use referencing: "This problem..." (Referring back).'
  },
  {
    id: 'im4',
    category: '写作 (Writing)',
    title: '任务回应 (Task Response)',
    content: '切题。回答所有部分，立场清晰。\nAddress all prompt parts.',
    purpose: '【避免跑题】\n跑题最高6分。\nWhy: Relevance.',
    example: 'Discuss BOTH views and give YOUR opinion. Don\'t miss one.'
  },
  {
    id: 'im8',
    category: '写作 (Writing)',
    title: '小作文 (Task 1)',
    content: 'Overview + Key Features。\nSummarize, don\'t list everything.',
    purpose: '【总结能力】\n必须有Overview。\nWhy: No Overview = Max 5.0.',
    example: 'Write: "Overall, A increased while B decreased."'
  }
];

const IELTS_PROBLEMS: ToolboxItem[] = [
  // Listening
  { id: 'ip3', category: '听力 (Listening)', title: '拼写错误 (Spelling)', content: '单复数漏S。', purpose: '【细节弱】', example: 'Solution: Check grammar context.' },
  // Reading
  { id: 'ip4', category: '阅读 (Reading)', title: 'F vs NG', content: '分不清错误和未提及。', purpose: '【过度推断】', example: 'Solution: NG = Not mentioned at all.' },
  // Speaking
  { id: 'ip2', category: '口语 (Speaking)', title: '说不满时间 (Time)', content: '1分钟没词了。', purpose: '【思维直线】', example: 'Solution: 5 Senses description.' },
  { id: 'ip6', category: '口语 (Speaking)', title: '没观点 (Abstract)', content: '宏观问题不会答。', purpose: '【缺乏思辨】', example: 'Solution: "It depends" strategy.' },
  { id: 'ip9', category: '口语 (Speaking)', title: '被打断 (Interrupt)', content: '考官打断就慌。', purpose: '【误解】', example: 'Solution: Smile and stop.' },
  { id: 'ip10', category: '口语 (Speaking)', title: '语调平淡 (Flat)', content: '像背书。', purpose: '【背诵痕迹】', example: 'Solution: Vary pitch.' },
  // Writing
  { id: 'ip1', category: '写作 (Writing)', title: '逻辑跳跃 (Logic Gap)', content: '堆砌大词，逻辑不通。', purpose: '【缺乏论证】', example: 'Solution: PEEL Structure.' },
  { id: 'ip5', category: '写作 (Writing)', title: '流水账 (Listing)', content: '罗列所有数据。', purpose: '【无总结】', example: 'Solution: Pick Highs/Lows only.' },
  { id: 'ip7', category: '写作/词汇 (Vocab)', title: '词汇重复 (Repetition)', content: '一直说 Good/Bad。', purpose: '【词汇贫乏】', example: 'Solution: Synonyms list.' },
  { id: 'ip8', category: '写作 (Grammar)', title: '长难句错 (Grammar)', content: '试图写长句但出错。', purpose: '【贪多】', example: 'Solution: Safe complexity (Relative clauses).' },
];

export const TeachingToolbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolboxTab>('ADULT');
  const [activeStage, setActiveStage] = useState<ToolboxStage>('methodology');
  const [activeItem, setActiveItem] = useState<ToolboxItem | null>(null);
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getCurrentData = () => {
    if (activeStage === 'methodology') {
      switch (activeTab) {
        case 'ADULT': return ADULT_METHODOLOGY;
        case 'KIDS': return KIDS_METHODOLOGY;
        case 'TOEFL': return TOEFL_METHODOLOGY;
        case 'IELTS': return IELTS_METHODOLOGY;
        default: return ADULT_METHODOLOGY;
      }
    } else {
      switch (activeTab) {
        case 'ADULT': return ADULT_PROBLEMS;
        case 'KIDS': return KIDS_PROBLEMS;
        case 'TOEFL': return TOEFL_PROBLEMS;
        case 'IELTS': return IELTS_PROBLEMS;
        default: return ADULT_PROBLEMS;
      }
    }
  };

  const handleOpenChat = (item: ToolboxItem) => {
    setActiveItem(item);
    const roleDesc = activeStage === 'methodology' ? '教学法导师 (Methodology Mentor)' : '疑难杂症专家 (Problem Solver)';
    
    // Initial message from AI
    const initText = `👋 Hello! I am your ${roleDesc} (我是您的专属导师)。

I am ready to give you a **Deep-Dive Masterclass** on:
**${item.title}**

You can ask me for:
1. 📚 **Theory Breakdown** (深度解析这个概念)
2. 🎭 **Classroom Scenario** (具体的课堂案例)
3. 📝 **Step-by-step Guide** (手把手操作指南)

What specific aspect do you want to explore? (Or just type "Explain" for a full guide!)`;

    setChatMessages([{
      id: 'init',
      role: MessageRole.MODEL,
      text: initText
    }]);
    setChatInput('');
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeItem || isChatLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: MessageRole.USER, text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Enhanced Prompt for Deep Dive
      const prompt = `
[Role]: ME Academic Director & Senior Teacher Trainer (ME 教学总监).
[Context]: The teacher is asking about "${activeItem.category} - ${activeItem.title}".
[Card Content]: ${activeItem.content}
[Purpose/Root Cause]: ${activeItem.purpose}
[Example provided]: ${activeItem.example}

[User Question/Context]: "${userMsg.text}"

[Task]:
Provide a **Deep-Dive Masterclass** on this specific topic.
The output **MUST BE BILINGUAL (English & Chinese)** for all sections.

**Structure:**
1. **Concept Deep Dive (深度解析)**: Explain the theory/concept clearly. Why is it critical?
2. **Real-World Scenario (实战案例)**: Describe a specific classroom situation where this applies.
3. **Step-by-Step Application (如何落地)**: Give concrete steps or a script the teacher can use tomorrow.
4. **Common Pitfalls (避坑指南)**: What do rookie teachers often get wrong here?

[Tone]: Professional, encouraging, authoritative yet mentorship-focused. Use formatting (Bold, Lists) to make it readable.
`;
      const response = await sendMessageToGemini({ message: prompt });
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: MessageRole.MODEL, text: response.text || "Loading..." }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: MessageRole.MODEL, text: "Error connecting.", isError: true }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row max-w-7xl mx-auto p-4 md:p-0 gap-6 relative overflow-hidden">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${activeItem ? 'md:mr-[400px]' : 'w-full'}`}>
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-navy-100 p-6 mb-6">
          <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                <BookOpen className="text-gold-500" /> 教师百宝箱 (Methodology Hub)
              </h2>
              <p className="text-sm text-navy-500 mt-1">ME 权威教学标准库：中英文双语对照，含实战案例详解。</p>
            </div>
            
            {/* Stage Switcher (Methodology vs Problems) */}
            <div className="flex bg-navy-50 p-1 rounded-lg">
               <button onClick={() => setActiveStage('methodology')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all duration-300 flex items-center gap-2 ${activeStage === 'methodology' ? 'bg-white text-navy-700 shadow-sm' : 'text-navy-500 hover:text-navy-700'}`}>
                  <BrainCircuit size={14}/> 核心教学法 (Core Logic)
               </button>
               <button onClick={() => setActiveStage('problems')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all duration-300 flex items-center gap-2 ${activeStage === 'problems' ? 'bg-white text-gold-700 shadow-sm' : 'text-navy-500 hover:text-navy-700'}`}>
                  <Stethoscope size={14}/> 学员疑难杂症 (Troubleshooting)
               </button>
            </div>
          </header>

          {/* Product Tabs */}
          <div className="flex w-full bg-navy-50 rounded-xl p-1 relative overflow-hidden">
             {/* Animated Background Pill */}
             <div className="absolute top-1 bottom-1 w-[calc(25%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 z-0"
               style={{ 
                 left: activeTab === 'ADULT' ? '4px' : 
                       activeTab === 'KIDS' ? 'calc(25% + 4px)' : 
                       activeTab === 'TOEFL' ? 'calc(50% + 4px)' : 'calc(75% + 4px)' 
               }}></div>
             
             <button onClick={() => setActiveTab('ADULT')} className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-300 ${activeTab === 'ADULT' ? 'text-navy-700' : 'text-navy-500'}`}>
               <Users size={18} /> 成人英语
             </button>
             <button onClick={() => setActiveTab('KIDS')} className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-300 ${activeTab === 'KIDS' ? 'text-navy-700' : 'text-navy-500'}`}>
               <Baby size={18} /> 少儿英语
             </button>
             <button onClick={() => setActiveTab('TOEFL')} className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-300 ${activeTab === 'TOEFL' ? 'text-navy-700' : 'text-navy-500'}`}>
               <GraduationCap size={18} /> TOEFL 托福
             </button>
             <button onClick={() => setActiveTab('IELTS')} className={`flex-1 relative z-10 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-300 ${activeTab === 'IELTS' ? 'text-navy-700' : 'text-navy-500'}`}>
               <Plane size={18} /> IELTS 雅思
             </button>
          </div>
        </div>

        {/* Knowledge Cards */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-20 pr-2">
           <div className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-2 pl-1 flex items-center gap-2">
              {activeStage === 'methodology' ? <Target size={14}/> : <HelpCircle size={14}/>}
              {activeStage === 'methodology' ? 'ME Standard Teaching Principles (双语标准)' : 'Common Student Issues & Solutions (双语诊断)'}
           </div>

           {getCurrentData().map((item) => (
              <div key={item.id} className={`bg-white rounded-xl shadow-sm border transition-all duration-300 group relative overflow-hidden ${activeStage === 'methodology' ? 'border-navy-200 hover:border-navy-300 hover:shadow-md' : 'border-navy-200 hover:border-gold-300 hover:shadow-md'}`}>
                 <div className={`absolute left-0 top-0 bottom-0 w-1 ${activeStage === 'methodology' ? 'bg-gradient-to-b from-navy-400 to-navy-600' : 'bg-gradient-to-b from-gold-400 to-gold-600'}`}></div>
                 
                 <div className="p-4 border-b border-navy-100 bg-navy-50/50 flex justify-between items-center pl-5">
                    <div className="flex items-center gap-3">
                       <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wide ${activeStage === 'methodology' ? 'bg-navy-100 text-navy-700' : 'bg-gold-100 text-gold-700'}`}>
                         {activeStage === 'methodology' ? 'Core Logic' : 'Diagnosis'}
                       </span>
                       <span className="font-bold text-navy-700 text-sm">{item.category}</span>
                    </div>
                    <button onClick={() => handleOpenChat(item)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-300 ${activeStage === 'methodology' ? 'bg-white text-navy-600 border-navy-200 hover:bg-navy-600 hover:text-white' : 'bg-white text-gold-600 border-gold-200 hover:bg-gold-600 hover:text-white'}`}>
                      {activeStage === 'methodology' ? <Sparkles size={14}/> : <Stethoscope size={14}/>} 
                      {activeStage === 'methodology' ? '应用助手 (Assistant)' : '解决方案 (Solver)'}
                    </button>
                 </div>
                 
                 <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6 pl-5">
                    {/* Content Section */}
                    <div className="md:col-span-4 flex flex-col">
                       <label className="text-[10px] font-bold text-navy-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <BrainCircuit size={12}/> {activeStage === 'methodology' ? 'Concept (理念)' : 'Symptoms (症状)'}
                       </label>
                       <h3 className="text-lg font-bold text-navy-800 mb-2">{item.title}</h3>
                       <div className="text-sm text-navy-600 leading-relaxed whitespace-pre-wrap flex-1">{item.content}</div>
                    </div>
                    
                    {/* Purpose Section */}
                    <div className={`md:col-span-4 p-4 rounded-lg border flex flex-col ${activeStage === 'methodology' ? 'bg-navy-50 border-navy-100' : 'bg-gold-50 border-gold-100'}`}>
                       <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${activeStage === 'methodology' ? 'text-navy-600' : 'text-gold-600'}`}>
                          <Target size={12}/> {activeStage === 'methodology' ? 'Why this matters? (设计意图)' : 'Root Cause (核心病灶)'}
                       </label>
                       <div className="text-sm text-navy-700 leading-relaxed whitespace-pre-wrap font-medium flex-1">{item.purpose}</div>
                    </div>
                    
                    {/* Example Section */}
                    <div className={`md:col-span-4 p-4 rounded-lg border flex flex-col ${activeStage === 'methodology' ? 'bg-navy-50 border-navy-100' : 'bg-navy-50 border-navy-100'}`}>
                       <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${activeStage === 'methodology' ? 'text-navy-600' : 'text-navy-600'}`}>
                          <Lightbulb size={12}/> {activeStage === 'methodology' ? 'Classroom Example (案例)' : 'Solution Strategy (方案)'}
                       </label>
                       <div className="text-sm text-navy-700 leading-relaxed whitespace-pre-wrap flex-1">{item.example}</div>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      </div>

      {/* Side Chat Panel (Assistant) */}
      {activeItem && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 flex flex-col border-l border-navy-200 transition-all duration-300 transform translate-x-0">
          <div className={`p-4 flex justify-between items-center text-white ${activeStage === 'methodology' ? 'bg-navy-900' : 'bg-gold-500'}`}>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                   <Bot size={20} className="text-white"/>
                </div>
                <div>
                   <p className="font-bold text-xs opacity-80 uppercase tracking-widest">{activeStage === 'methodology' ? 'Teaching Assistant' : 'Problem Solver'}</p>
                   <p className="font-bold text-sm truncate max-w-[250px]">{activeItem.title}</p>
                </div>
             </div>
             <button onClick={() => setActiveItem(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-navy-50">
             {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[90%] rounded-2xl p-4 text-sm shadow-sm leading-relaxed ${msg.role === MessageRole.USER ? (activeStage === 'methodology' ? 'bg-navy-700 text-white rounded-br-none' : 'bg-gold-500 text-white rounded-br-none') : 'bg-white border border-navy-200 rounded-bl-none text-navy-800'}`}>
                      {msg.role === MessageRole.USER ? (
                         <div className="whitespace-pre-wrap">{msg.text}</div>
                      ) : (
                         <div className="prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={ToolboxMarkdownComponents}>
                              {msg.text}
                            </ReactMarkdown>
                         </div>
                      )}
                   </div>
                </div>
             ))}
             {isChatLoading && (
                <div className="flex items-center gap-2 text-navy-500 text-xs ml-4 animate-pulse">
                   <Loader2 className="animate-spin w-4 h-4"/> 
                   <span>Teaching Director is analyzing... (教学总监分析中...)</span>
                </div>
             )}
             <div ref={chatEndRef}/>
          </div>

          <div className="p-4 bg-white border-t border-navy-200">
             <div className="relative">
                <textarea 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                  placeholder={activeStage === 'methodology' ? "Example: Explain how to use TBLT for beginners..." : "Example: My student is shy, give me a script..."}
                  className={`w-full bg-navy-50 border border-navy-200 rounded-xl p-3 pr-12 text-sm text-navy-900 focus:ring-2 focus:outline-none h-24 resize-none shadow-inner transition-all ${activeStage === 'methodology' ? 'focus:ring-navy-500' : 'focus:ring-gold-500'}`}
                />
                <button 
                  onClick={handleSendChat} 
                  disabled={!chatInput.trim() || isChatLoading} 
                  className={`absolute right-2 bottom-2 p-2 rounded-lg text-white transition-all active:scale-95 disabled:opacity-50 ${activeStage === 'methodology' ? 'bg-navy-600 hover:bg-navy-700' : 'bg-gold-500 hover:bg-gold-600'}`}
                >
                   <Send size={18}/>
                </button>
             </div>
             <p className="text-[10px] text-center text-navy-400 mt-2">
                Type "Explain" for a full deep-dive. | 输入 "Explain" 获取全案详解。
             </p>
          </div>
        </div>
      )}
    </div>
  );
};
