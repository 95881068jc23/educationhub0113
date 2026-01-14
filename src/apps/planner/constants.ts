

import { CEFRLevel, CourseType, LevelConfig, TopicCategory, Topic, LearningDirection, SupplementaryCourse, PackTopicData, TopicPackConfig } from './types';

export const CEFR_RANK: Record<CEFRLevel, number> = {
  [CEFRLevel.PreA1]: 0,
  [CEFRLevel.A1]: 1,
  [CEFRLevel.A2]: 2,
  [CEFRLevel.A2Plus]: 3,
  [CEFRLevel.B1]: 4,
  [CEFRLevel.B1Plus]: 5,
  [CEFRLevel.B2]: 6,
  [CEFRLevel.B2Plus]: 7,
  [CEFRLevel.C1]: 8,
  [CEFRLevel.C1Plus]: 9,
  [CEFRLevel.C2]: 10
};

const uid = () => Math.random().toString(36).substr(2, 9);

// Helper for Official Topics (Source: File)
const ot = (title: string, min = 2, max = 4, scenario?: string): Topic => ({
  id: uid(),
  title,
  minHours: min,
  maxHours: max,
  category: TopicCategory.Official,
  practicalScenario: scenario,
  source: 'File'
});

// Helper for Alternate Topics (Source: File)
const alt = (title: string, scenario: string): Topic => ({
  id: uid(),
  title,
  minHours: 2,
  maxHours: 4,
  category: TopicCategory.Official, // Treated as official for the alternative track
  practicalScenario: scenario,
  source: 'File'
});

// Common Selections for Dropdowns
export const COMMON_INDUSTRIES = [
  "Technology / 互联网与科技",
  "Finance & Banking / 金融与银行",
  "Manufacturing / 制造业",
  "Healthcare / 医疗健康",
  "Education / 教育",
  "Retail & E-commerce / 零售与电商",
  "Real Estate / 房地产",
  "Logistics / 物流运输",
  "Media & Arts / 传媒与艺术",
  "Legal Services / 法律服务",
  "Full-time Parent / 全职家长"
];

export const COMMON_ROLES = [
  "Founder/CEO / 创始人/总裁",
  "Manager / 经理",
  "Engineer/Developer / 工程师/研发",
  "Sales/BD / 销售/商务拓展",
  "Full-time Parent / 全职家长",
  "Product Manager / 产品经理",
  "Marketing / 市场营销",
  "HR / 人力资源",
  "Finance/Accountant / 财务/会计",
  "Operations / 运营",
  "Student / 学生"
];

export const COMMON_GOALS = [
  "Overseas Travel / 出国旅游",
  "Business Communication / 商务沟通",
  "Career Advancement / 职场晋升",
  "Immigration / 移民定居",
  "Children's Education / 子女教育陪读",
  "Self Improvement / 自我提升",
  "Exam Preparation / 备考 (IELTS/TOEFL)",
  "Social Networking / 社交拓展",
  "Study Abroad / 出国留学",
  "Company Requirement / 公司要求"
];

export const COMMON_INTERESTS = [
  "Travel / 旅游",
  "Photography / 摄影",
  "Cooking & Food / 烹饪与美食",
  "Movies / 电影",
  "Music / 音乐",
  "Reading / 阅读",
  "Sports / 运动",
  "Fitness / 健身",
  "Technology / 科技",
  "Art / 艺术",
  "Fashion / 时尚",
  "History / 历史",
  "Politics / 政治",
  "Investment / 投资",
  "Gaming / 游戏",
  "Nature / 自然",
  "Pets / 宠物",
  "Cars / 汽车",
  "Wine & Coffee / 品酒与咖啡",
  "Psychology / 心理学"
];

// Supplementary Course Presets
export const SUPPLEMENTARY_COURSES: SupplementaryCourse[] = [
  {
    id: 'pronunciation',
    title: '发音课 / Pronunciation Class',
    hours: 12,
    minLevel: CEFRLevel.PreA1,
    maxLevel: CEFRLevel.A2,
    category: TopicCategory.Supplementary
  },
  {
    id: 'grammar',
    title: '语法课 / Grammar Class',
    hours: 14,
    minLevel: CEFRLevel.PreA1,
    maxLevel: CEFRLevel.A2,
    category: TopicCategory.Supplementary
  },
  {
    id: 'correction',
    title: '纠音课 / Accent Correction',
    hours: 12,
    minLevel: CEFRLevel.PreA1,
    maxLevel: CEFRLevel.A2,
    category: TopicCategory.Supplementary
  },
  {
    id: 'vocab-elem',
    title: '初级词汇课 / Elementary Vocab',
    hours: 36,
    minLevel: CEFRLevel.A1,
    maxLevel: CEFRLevel.A2Plus,
    category: TopicCategory.Supplementary
  },
  {
    id: 'vocab-inter',
    title: '中级词汇课 / Intermediate Vocab',
    hours: 24,
    minLevel: CEFRLevel.B1,
    maxLevel: CEFRLevel.B2Plus,
    category: TopicCategory.Supplementary
  },
  {
    id: 'rs-hybrid',
    title: 'RS混合系统 / RS Hybrid System',
    hours: 0, // Calculated dynamically (4h/week)
    isWeekly: true,
    minLevel: CEFRLevel.PreA1,
    maxLevel: CEFRLevel.C1Plus,
    category: TopicCategory.Supplementary
  },
  {
    id: 'online-group',
    title: '在线班课 (中外教) / Online Group Class',
    hours: 0, // Calculated dynamically (2h/week)
    isWeekly: true,
    minLevel: CEFRLevel.PreA1,
    maxLevel: CEFRLevel.C2,
    category: TopicCategory.Supplementary
  }
];

// Split Curriculum for Plus Levels based on 2025 PDF
export const OFFICIAL_CURRICULUM: LevelConfig[] = [
  {
    level: CEFRLevel.PreA1,
    type: CourseType.General,
    coreVocabCount: 280,
    grammarPoints: 10,
    baseHoursRequired: 28,
    description: "入门级: 基础问候, 简单生存口语 / Beginner: Greetings, Basic Survival.",
    officialTopics: [
      ot("L1 Everyone / 打招呼：见面第一句话怎么说", 2, 4, "克服开口恐惧 / Overcome fear of speaking."),
      ot("L2 Where are you? / 找人聊天：你在哪儿？", 2, 4, "描述位置 / Describe location."),
      ot("L3 I’m good / 自我状态：我挺好的", 2, 4, "表达状态 / Express state."),
      ot("L4 Are you ok? / 关心别人：你还好吗？", 2, 4, "表达关心 / Show care."),
      ot("L5 What do you want? / 日常点单：你要点什么？", 2, 4, "餐厅点单 / Order food."),
      ot("L6 I often work out / 生活习惯：你常锻炼吗？", 2, 4, "谈论习惯 / Talk about habits."),
      ot("L7 Do you like cats? / 兴趣话题：你喜欢猫/宠物吗？", 2, 4, "谈论喜好 / Talk about likes."),
      ot("L8 Ask more questions / 学会追问：别让对话冷场", 2, 4, "保持对话 / Keep conversation going."),
      ot("L9 Can I take my pet? / 生活场景：能带宠物一起吗？", 2, 4, "请求许可 / Ask permission."),
      ot("L10 Clothing / 穿搭聊天：分享你的OOTD", 2, 4, "谈论服装 / Talk about clothing."),
      ot("L11 Food / 美食日常：中午吃点啥？", 2, 4, "讨论食物 / Discuss food."),
      ot("L12 Transportation / 出行问路：地铁怎么走？", 2, 4, "交通问路 / Ask for directions.")
    ]
  },
  {
    level: CEFRLevel.A1,
    type: CourseType.General,
    coreVocabCount: 240,
    grammarPoints: 20, 
    baseHoursRequired: 48,
    description: "初级: 丰富对话, 描述需求 / Elementary: Richer Dialogue, Needs.",
    officialTopics: [
      ot("L1 Meeting people at the First Time / 商务见面与寒暄", 2, 4, "Business Intro"),
      ot("L2 Saying Where You're From / 介绍你的背景", 2, 4, "Background Info"),
      ot("L3 Offering and Asking for Drinks / 点饮料与招待(星巴克)", 2, 4, "Hospitality"),
      ot("L4 Talking about Personal Information and Numbers / 谈论个人信息和数字", 2, 4, "Data & Info"),
      ot("L5 Talking about Schedule and Time / 询问日程与时间安排", 2, 4, "Scheduling"),
      ot("L6 Ordering Food (at McDonald's) / (在麦当劳)买餐食与结账", 2, 4, "Fast Food"),
      ot("L7 Talking about Your Job / 谈论你的工作", 2, 4, "Job Description"),
      ot("L8 Describing Your Company and Department / 介绍公司和部门情况", 2, 4, "Company Intro"),
      ot("L9 Talking about Daily Routines / 描述日常例程(商务社交)", 2, 4, "Routine"),
      ot("L10 Communicating Key Information / 传达关键信息", 2, 4, "Key Info"),
      ot("L11 Writing Emails / 撰写简短商务邮件", 2, 4, "Email Basics"),
      ot("L12 Using Technology At Work / 工作中科技的使用", 2, 4, "Tech Use"),
      ot("L13 Talking about Office Supplies / 讨论办公用品与商业设施", 2, 4, "Supplies"),
      ot("L14 Asking for and Giving Direction / 问路与指路", 2, 4, "Directions"),
      ot("L15 Talking About Your Living Place / 聊聊你的住处", 2, 4, "Living Place"),
      ot("L16 Describing Your Typical Workday / 讲述你的日常工作", 2, 4, "Workday"),
      ot("L17 Describing Your Workload / 描述你的工作量", 2, 4, "Workload"),
      ot("L18 Talking about Your Spare Time / 分享你的业余爱好", 2, 4, "Hobbies"),
      ot("L19 Arranging to Meet / 约见与预约", 2, 4, "Appointments"),
      ot("L20 Turning Down Arrangements / 婉拒会面安排", 2, 4, "Declining"),
      ot("L21 Buying Train Tickets / 买火车票(商务社交)", 2, 4, "Tickets"),
      ot("L22 Reporting Your Work Progress / 汇报工作进展与成果", 2, 4, "Reporting"),
      ot("L23 Giving an Update / 汇报最新进展", 2, 4, "Updates"),
      ot("L24 Talking about Holiday Trips / 谈论假期安排", 2, 4, "Holidays")
    ],
    alternateTopics: [
      alt("L1 Meet and Greet / 见面打招呼", "Social greetings."),
      alt("L2 Personal Information / 自我介绍", "Detailed intro."),
      alt("L3 What's in Your Bag? / 包里装了啥？", "Describe items."),
      alt("L4 What's in the Room? / 房间里有什么？", "Describe environment."),
      alt("L5 People We Know / 聊聊身边的人", "Describe others."),
      alt("L6 Weekday Routine / 我的日常作息", "Daily schedule."),
      alt("L7 Weekend Routine / 周末怎么过？", "Weekend activities."),
      alt("L8 Your Free Time - Going Out / 休闲娱乐：出去玩", "Going out."),
      alt("L9 Your Neighborhood / 我家附近有什么", "Neighborhood intro."),
      alt("L10 Talking About Time / 聊下时间安排", "Discussing time."),
      alt("L11 Ordering Food / 点餐点饮料", "Food service."),
      alt("L12 Shopping / 购物买东西", "Shopping interaction."),
      alt("L13 Getting to Know People Better / 更深入地认识别人", "Getting to know."),
      alt("L14 Small Talk / 闲聊寒暄", "Small talk."),
      alt("L15 Describing Health / 描述健康状况", "Health topics."),
      alt("L16 Finding Places / 找地方", "Locating places."),
      alt("L17 Describing People's Appearance / 聊外貌与长相", "Describe appearance."),
      alt("L18 At the Hotel / 在酒店入住", "Hotel scenarios."),
      alt("L19 At the Airport / 在机场出行", "Airport procedures."),
      alt("L20 Leisure Time / 休闲娱乐", "Discuss hobbies."),
      alt("L21 Exploring the City / 探索城市", "City exploration."),
      alt("L22 Seeing a Doctor / 去看医生", "Medical visit."),
      alt("L23 Making Invitations / 发出邀请", "Making invitations."),
      alt("L24 Your First-time Stories / 第一次的经历", "Sharing experiences.")
    ]
  },
  {
    level: CEFRLevel.A2,
    type: CourseType.Business,
    coreVocabCount: 280,
    grammarPoints: 240,
    baseHoursRequired: 48,
    description: "中级预备I: 职场基础任务 / Pre-Intermediate I: Foundation Business Tasks.",
    officialTopics: [
      ot("L1 Describing Your Job / 描述你的工作", 2, 4, "Role description"),
      ot("L2 Describing Your Company / 介绍公司与部门", 2, 4, "Company intro"),
      ot("L3 Eating Out / 外出就餐(商务社交)", 2, 4, "Business lunch"),
      ot("L4 Discussing Work in Progress / 讨论工作进展", 2, 4, "Progress check"),
      ot("L5 Discussing Strengths and Weaknesses / 讨论优点与不足", 2, 4, "SWOT simple"),
      ot("L6 Talking about Your Interests / 谈论兴趣与爱好", 2, 4, "Hobbies"),
      ot("L7 Making Comparisons / 做比较", 2, 4, "Comparisons"),
      ot("L8 Describing Your Real Office / 描述真实与理想办公室", 2, 4, "Office environment"),
      ot("L9 Exploring and Recommending Places / 推荐与介绍地点", 2, 4, "Recommendations"),
      ot("L10 Discussing Personal Work Achievements / 讨论个人工作成果", 2, 4, "Achievements"),
      ot("L11 Talking about Teamwork / 谈论团队合作与项目", 2, 4, "Teamwork"),
      ot("L12 Talking about the Weekend / 谈论周末计划", 2, 4, "Weekend plans"),
      ot("L13 Arranging Meetings / 安排会议", 2, 4, "Scheduling meetings"),
      ot("L14 Confirming Arrangements / 确认会议/差旅安排", 2, 4, "Confirming"),
      ot("L15 Exploring Travel Preferences / 探讨旅行经历与景点", 2, 4, "Travel talk"),
      ot("L16 Predicting and Forecasting / 预测与预估工作", 2, 4, "Forecasting"),
      ot("L17 Talking about Goals / 讨论目标", 2, 4, "Setting goals"),
      ot("L18 At the Airport / 在机场(商务社交)", 2, 4, "Business travel")
    ],
    alternateTopics: [
      alt("L1 Preparing for a Journey / 出行前的准备", "Travel Prep"),
      alt("L2 Packing for a Trip / 为出行打包行李", "Packing"),
      alt("L3 Responding to Suggestions / 回应别人的建议", "Suggestions"),
      alt("L4 Unique Hotels / 特别的酒店体验", "Hotels"),
      alt("L5 Finding Things at Home / 在家找东西", "Locating items"),
      alt("L6 Household Stuff / 家居用品", "Household items"),
      alt("L7 Making Polite Requests / 礼貌地提出请求", "Polite requests"),
      alt("L8 Routine and Unusual Habits / 日常与特殊习惯", "Habits"),
      alt("L9 When Things Go Wrong... / 遇到麻烦怎么办", "Problems"),
      alt("L10 Talking about Accidents / 聊事故和意外", "Accidents"),
      alt("L11 Reacting to a Story / 听故事后的反应", "Reactions"),
      alt("L12 Happy Endings / 美好结局", "Storytelling"),
      alt("L13 Keeping in Touch / 保持联系", "Contact"),
      alt("L14 Managing Phone Conversations / 接打电话怎么说", "Phone skills"),
      alt("L15 Dealing with Interruptions / 处理中断对话", "Interruptions"),
      alt("L16 Different Ways of Communication / 不同的沟通方式", "Communication"),
      alt("L17 Family Traits / 家族特点", "Family"),
      alt("L18 Features of Appearance / 聊外貌特征", "Appearance"),
      alt("L19 Trying to Remember Words / 忘词时怎么说", "Memory"),
      alt("L20 Fashion Trends / 时尚潮流", "Fashion"),
      alt("L21 Discussing Future Plans / 聊未来计划", "Future"),
      alt("L22 Jobs / 谈谈工作", "Jobs"),
      alt("L23 Making Offers and Promises / 提出承诺和保证", "Promises"),
      alt("L24 Life in the Future / 未来的生活", "Future life")
    ]
  },
  {
    level: CEFRLevel.A2Plus,
    type: CourseType.Business,
    coreVocabCount: 300,
    grammarPoints: 12,
    baseHoursRequired: 48,
    description: "中级预备II: 进阶商务话题 / Pre-Intermediate II: Advanced Business Topics.",
    officialTopics: [
      ot("L19 Talking about Your Education / 谈论教育与职业发展", 2, 4, "Career path"),
      ot("L20 Giving an Update / 提供最新进展", 2, 4, "Updates"),
      ot("L21 Storytelling and Sharing / 讲故事与分享经历", 2, 4, "Sharing"),
      ot("L22 Understanding Business News / 理解商业新闻与趋势", 2, 4, "Trends"),
      ot("L23 Talking about Economy / 讨论经济", 2, 4, "Economy"),
      ot("L24 Talking About TV Shows / 谈论电视节目", 2, 4, "TV Shows"),
      ot("L25 Exploring Marketing / 探讨商务中的市场与广告", 2, 4, "Marketing"),
      ot("L26 Discussing Business Expansion / 讨论业务扩张策略", 2, 4, "Expansion"),
      ot("L27 Tools in the Digital Age / 数字化工具的应用", 2, 4, "Digital tools"),
      ot("L28 Discussing Ideas / 提出与讨论建议", 2, 4, "Suggestions"),
      ot("L29 Making Decisions / 做决策", 2, 4, "Decisions"),
      ot("L30 Dealing with Travel Problems / 出差中遇到的问题", 2, 4, "Travel issues"),
      ot("L31 Talking About Dimensions / 谈论尺寸与规格", 2, 4, "Dimensions"),
      ot("L32 Discussing Safety Procedures / 讨论安全规范", 2, 4, "Safety"),
      ot("L33 Using Tourist Facilities / 邮轮度假(商务社交)", 2, 4, "Facilities"),
      ot("L34 Attending Meetings / 参加会议", 2, 4, "Meetings"),
      ot("L35 Passing on Information / 传递信息", 2, 4, "Info pass"),
      ot("L36 Welcoming Visitors / 接待访客与寒暄", 2, 4, "Hosting")
    ],
    alternateTopics: [
      alt("L1 Understanding Ourselves and Others / 认识自己与他人", "Self-awareness"),
      alt("L2 Evaluating and Describing Impressions / 表达和评价第一印象", "Impressions"),
      alt("L3 Dreams and Unusual Experiences / 梦想与奇特经历", "Dreams"),
      alt("L4 Catching Up with Friends / 和朋友叙旧", "Catching up"),
      alt("L5 Exploring the Wonders of Nature / 探索大自然的奇妙", "Nature"),
      alt("L6 Discovering Travel Experiences / 分享旅行经历", "Travel"),
      alt("L7 Understanding Family Conflicts / 理解家庭矛盾", "Conflict"),
      alt("L8 Your Family Memories / 家庭回忆与生活", "Memories"),
      alt("L9 Food Discovery / 探索冰箱里的食物", "Food"),
      alt("L10 Hosting and Planning Parties / 筹备聚会与饮食安排", "Parties"),
      alt("L11 Making Plans and Scheduling / 制定计划与安排时间", "Planning"),
      alt("L12 Managing Your Busy Life / 管理忙碌的生活", "Management"),
      alt("L13 Enhancing Social Skills / 提升社交技巧", "Social skills"),
      alt("L14 Personality Tests / 性格测试与解读", "Personality"),
      alt("L15 Shared Experiences / 分享共同经历", "Shared exp"),
      alt("L16 Learning Something New / 第一次学习新事物", "Learning"),
      alt("L17 Hidden Gems in Your Hometown / 发现家乡的宝藏之地", "Hometown"),
      alt("L18 Adventure Sports / 冒险运动与户外乐趣", "Sports"),
      alt("L19 Generational Differences / 代际差异", "Generations"),
      alt("L20 Work-and-life Balance / 工作与生活的平衡", "Balance"),
      alt("L21 Comfort Foods / 世界各地的治愈食物", "Comfort food"),
      alt("L22 Memorable Meals / 难忘的一餐", "Meals"),
      alt("L23 Prioritizing Tasks / 任务优先级管理", "Tasks"),
      alt("L24 Digital Tools for Staying Organized / 让生活更有条理的数字工具", "Organization")
    ]
  },
  {
    level: CEFRLevel.B1,
    type: CourseType.General,
    coreVocabCount: 360,
    grammarPoints: 45,
    baseHoursRequired: 48,
    description: "中级I: 商务进阶与社交 / Intermediate I: Business Progression & Social.",
    officialTopics: [
      ot("L1 Talking About Brands / 谈论品牌", 2, 4, "Brands"),
      ot("L2 Sharing Opinions in Meetings / 在会议中分享观点", 2, 4, "Opinions"),
      ot("L3 Brand Strategy / 品牌战略", 2, 4, "Strategy"),
      ot("L4 Taking Flights / 谈论航班与差旅", 2, 4, "Flights"),
      ot("L5 Making Arrangements on Phone / 电话中做安排", 2, 4, "Arrangements"),
      ot("L6 Retaining Key Clients / 维护核心客户", 2, 4, "Clients"),
      ot("L7 Adapting to Changes / 适应变化", 2, 4, "Change"),
      ot("L8 Managing Meetings / 管理会议", 2, 4, "Meeting mgmt"),
      ot("L9 Solving Problems after Merger / 并购后的问题解决", 2, 4, "Mergers"),
      ot("L10 Company Structure / 公司结构", 2, 4, "Structure"),
      ot("L11 Socializing and Networking / 社交与商务人脉", 2, 4, "Networking"),
      ot("L12 Relocation / 公司搬迁", 2, 4, "Relocation"),
      ot("L13 Advertising / 广告", 2, 4, "Ads"),
      ot("L14 Starting Presentations / 演讲的开场与结构", 2, 4, "Presentations"),
      ot("L15 Advertising Campaign / 广告活动", 2, 4, "Campaigns"),
      ot("L16 Talking About Finance / 谈论财务与经济", 2, 4, "Finance"),
      ot("L17 Dealing with Figures / 处理数字和趋势问题", 2, 4, "Figures"),
      ot("L18 Presenting to Investors / 向投资人路演", 2, 4, "Pitching")
    ],
    alternateTopics: [
      alt("L1 Circle of Friends / 朋友圈", "Friends"),
      alt("L2 Dating / 约会与恋爱", "Dating"),
      alt("L3 Life Wishes and Regrets / 人生愿望与遗憾", "Wishes"),
      alt("L4 Handling Tricky Social Situations / 应对尴尬的社交场面", "Social tricky"),
      alt("L5 Technical Issues and Problems / 处理技术问题", "Tech issues"),
      alt("L6 Safeguarding Your Personal Info / 保护个人网络隐私", "Privacy"),
      alt("L7 The Art of Asking for Favors / 如何开口求助", "Favors"),
      alt("L8 Movies / 聊下电影", "Movies"),
      alt("L9 Making Speculations / 大胆推测与猜想", "Speculations"),
      alt("L10 Ups and Downs / 人生的起起落落", "Life cycle"),
      alt("L11 Talking about News / 讨论新闻事件", "News"),
      alt("L12 Extreme Weather / 极端天气与自然灾害", "Weather"),
      alt("L13 First Dates / 第一次约会：甜蜜与糟糕经历", "First dates"),
      alt("L14 Handling Peer Pressure / 面对同辈压力与社会期待", "Peer pressure"),
      alt("L15 Setting Goals / 设定与调整人生目标", "Goals"),
      alt("L16 Making Difficult Decisions / 如何做艰难的决定", "Decisions"),
      alt("L17 Pros and Cons of Social Media / 社交媒体的利与弊", "Social media"),
      alt("L18 Technology Changing Life / 改变生活的科技", "Tech change"),
      alt("L19 Recent Events / 聊聊最近的生活", "Updates"),
      alt("L20 Discussing Popular Trends / 讨论流行趋势", "Trends"),
      alt("L21 Coping Strategies / 应对压力与焦虑的方式", "Stress"),
      alt("L22 First Impressions Matter / 第一印象的重要性", "Impressions"),
      alt("L23 Fake News / 假新闻及识别方法", "Fake news"),
      alt("L24 Preparing for Emergencies / 如何应对突发状况", "Emergencies")
    ]
  },
  {
    level: CEFRLevel.B1Plus,
    type: CourseType.General,
    coreVocabCount: 360,
    grammarPoints: 45, 
    baseHoursRequired: 48,
    description: "中级II: 深入生活与工作讨论 / Intermediate II: Deep Life & Work.",
    officialTopics: [
      ot("L19 Culture / 跨文化交流", 2, 4, "Culture"),
      ot("L20 Social English in Workplace / 职场社交英语", 2, 4, "Workplace social"),
      ot("L21 Business Culture Briefing / 商业文化简报", 2, 4, "Biz culture"),
      ot("L22 Recruiting Process / 招聘流程与雇佣", 2, 4, "Recruiting"),
      ot("L23 Asking for Information / 索取与提供信息", 2, 4, "Info request"),
      ot("L24 Appointing the Right Person / 人员任命", 2, 4, "Appointments"),
      ot("L25 Int'l Trade and Globalization / 国际贸易与全球化", 2, 4, "Globalization"),
      ot("L26 Negotiation Basics / 谈判基础", 2, 4, "Negotiation"),
      ot("L27 Negotiating a Deal / 谈判交易", 2, 4, "Deals"),
      ot("L28 Ethics in Business / 商业道德", 2, 4, "Ethics"),
      ot("L29 Considering Options / 评估与选择方案", 2, 4, "Options"),
      ot("L30 Ethical Dilemmas / 道德困境", 2, 4, "Dilemmas"),
      ot("L31 Leadership / 领导力", 2, 4, "Leadership"),
      ot("L32 Structuring an Presentation / 结构化完整演讲", 2, 4, "Presentation structure"),
      ot("L33 New Leadership / 新领导力", 2, 4, "New leaders"),
      ot("L34 Competition / 竞争", 2, 4, "Competition"),
      ot("L35 Negotiating Styles / 谈判风格", 2, 4, "Styles"),
      ot("L36 Negotiating New Contracts / 合同谈判", 2, 4, "Contracts")
    ],
    alternateTopics: [
      alt("L1 Major Life Changes / 人生大转折", "Life changes"),
      alt("L2 Storytelling / 讲故事的魅力", "Storytelling"),
      alt("L3 Fashion and Personal Style / 聊穿搭与个人风格", "Fashion"),
      alt("L4 Gift-giving and Shopping / 送礼与购物文化", "Gifts"),
      alt("L5 Customs and Manners / 世界各地的礼仪差异", "Manners"),
      alt("L6 Away from Home / 离家在外的经历", "Away from home"),
      alt("L7 Social Styles / 社交风格与人际技巧", "Social styles"),
      alt("L8 Understanding Crime / 聊下犯罪与惩罚", "Crime"),
      alt("L9 Digital Ethics / 数字时代的隐私与安全", "Digital ethics"),
      alt("L10 Small World / 巧合故事与小世界惊喜", "Coincidences"),
      alt("L11 Superstitions / 迷信与文化信仰", "Superstitions"),
      alt("L12 Tackling Household Problems / 居家事物怎么解决", "Household"),
      alt("L13 Creative Fixes / 奇招妙法：居家问题的创新解决", "Creative fixes"),
      alt("L14 Reactions to Annoying Situations / 遇到烦人事的反应", "Annoyances"),
      alt("L15 Emotional Intelligence / 英语情商的实际应用", "EQ"),
      alt("L16 Too Much Stuff? / 断舍离：如何面对太多东西", "Decluttering"),
      alt("L17 Letting Go / 学会用逻辑衔接", "Letting go"),
      alt("L18 Money Management / 谈钱与理财", "Money"),
      alt("L19 Ups and Downs of Celebrity / 明星生活的光鲜与烦恼", "Celebrity"),
      alt("L20 Digital Fame / 数字时代的成名之路", "Digital fame"),
      alt("L21 Changes and Trends in Society / 社会变迁与流行趋势", "Society trends"),
      alt("L22 Workplace Trends / 职场趋势与未来工作方式", "Workplace trends"),
      alt("L23 Career Journeys / 职业生涯与建议", "Careers"),
      alt("L24 Ace Your Interview / 如何拿下面试", "Interviews")
    ]
  },
  {
    level: CEFRLevel.B2,
    type: CourseType.Business,
    coreVocabCount: 540,
    grammarPoints: 43, 
    baseHoursRequired: 48,
    description: "中高级I: 高效沟通与危机管理 / Upper-Intermediate I: Effective Comm & Crisis.",
    officialTopics: [
      ot("L1 Effective Communication / 高效沟通实战", 2, 4, "Effective comm"),
      ot("L2 Communication Breakdown / 处理沟通障碍", 2, 4, "Breakdowns"),
      ot("L3 Corporate Communication / 企业文化", 2, 4, "Corp comm"),
      ot("L4 Global Marketing Strategies / 全球营销战略", 2, 4, "Global marketing"),
      ot("L5 Brainstorming / 头脑风暴", 2, 4, "Brainstorming"),
      ot("L6 Global Brand Expansion / 全球品牌拓展", 2, 4, "Brand expansion"),
      ot("L7 Building Business Relationships / 构建商务关系", 2, 4, "Relationships"),
      ot("L8 Networking / 商务社交网络", 2, 4, "Networking"),
      ot("L9 Reviving Customer Loyalty / 重建客户忠诚度", 2, 4, "Loyalty"),
      ot("L10 Navigating Success / 导向成功与谈判", 2, 4, "Success"),
      ot("L11 Negotiating / 商务谈判技巧", 2, 4, "Negotiating"),
      ot("L12 Sponsorship Negotiation / 商务赞助谈判", 2, 4, "Sponsorship"),
      ot("L13 Job Satisfaction Insights / 工作满意度洞察", 2, 4, "Satisfaction"),
      ot("L14 Cold-calling / 陌拜电话", 2, 4, "Cold calling"),
      ot("L15 Employee Relationships / 员工关系", 2, 4, "Employee relations"),
      ot("L16 Taking Risks / 风险承担与风险管理", 2, 4, "Risks"),
      ot("L17 Reaching Agreement / 达成协议", 2, 4, "Agreement"),
      ot("L18 Risk Management / 风险管理", 2, 4, "Risk mgmt")
    ],
    alternateTopics: [
      alt("L1 Friends / 朋友的特质", "Friendship"),
      alt("L2 Keeping in touch / 保持联系", "Keeping touch"),
      alt("L3 Celebrity / 名人明星", "Celebrity"),
      alt("L4 Short-form videos / 短视频", "Short videos"),
      alt("L5 Life experiences / 人生经历", "Experiences"),
      alt("L6 A moment captured / 定格的瞬间", "Moments"),
      alt("L7 Perks at work / 工作福利", "Perks"),
      alt("L8 Seeking personal fulfillment / 追求个人成就感", "Fulfillment"),
      alt("L9 Giving things / 给予物品", "Giving"),
      alt("L10 If I could / 如果我可以", "Hypotheticals"),
      alt("L11 Technology / 科技", "Tech"),
      alt("L12 Climate change / 气候变化", "Climate"),
      alt("L13 Roomies / 和室友相处", "Roommates"),
      alt("L14 Boomerang kids / 啃老族", "Boomerang kids"),
      alt("L15 Food label / 怎么读食品标签", "Labels"),
      alt("L16 Farming / 农业：从种植到餐桌", "Farming"),
      alt("L17 Financial Success / 财务成功", "Success"),
      alt("L18 Where's happier / 何处更幸福", "Happiness"),
      alt("L19 What a trip / 一次旅行", "Trip"),
      alt("L20 Tourism / 旅游业的好处与坏处", "Tourism"),
      alt("L21 Weddings / 不同文化中的婚礼", "Weddings"),
      alt("L22 Bizzare traditions / 奇特的传统", "Traditions"),
      alt("L23 Intelligence / 才智", "Intelligence"),
      alt("L24 Improving skills / 提升技能", "Skills")
    ]
  },
  {
    level: CEFRLevel.B2Plus,
    type: CourseType.Business,
    coreVocabCount: 540,
    grammarPoints: 43, 
    baseHoursRequired: 48,
    description: "中高级II: 管理、团队与战略 / Upper-Intermediate II: Management & Strategy.",
    officialTopics: [
      ot("L19 Mastering Management / 管理与演讲精通", 2, 4, "Management"),
      ot("L20 Presentation Basics / 管理基础", 2, 4, "Presentation basics"),
      ot("L21 Strategic Management / 战略管理", 2, 4, "Strategy"),
      ot("L22 Teamwork / 团队协作与冲突管理", 2, 4, "Teamwork"),
      ot("L23 Resolving Conflict / 冲突解决", 2, 4, "Conflict"),
      ot("L24 Team Dynamics / 团队相处之道", 2, 4, "Dynamics"),
      ot("L25 Raising Finance / 融资的艺术", 2, 4, "Finance"),
      ot("L26 Negotiating Styles / 谈判风格", 2, 4, "Styles"),
      ot("L27 Film Financing / 影视融资", 2, 4, "Film finance"),
      ot("L28 Mastering Customer Service / 客户服务精通", 2, 4, "Customer service"),
      ot("L29 Active Listening / 积极聆听", 2, 4, "Listening"),
      ot("L30 Complaint Resolution / 处理投诉", 2, 4, "Complaints"),
      ot("L31 Crisis Management / 危机管理策略", 2, 4, "Crisis"),
      ot("L32 Asking Difficult Questions / 应对棘手问题", 2, 4, "Questions"),
      ot("L33 Crisis Management / 危机处理", 2, 4, "Handling crisis"),
      ot("L34 Mergers & Acquisitions / 并购与收购", 2, 4, "M&A"),
      ot("L35 Making a Presentation / 制作与呈现演讲", 2, 4, "Presentation making"),
      ot("L36 Strategic Acquisitions / 战略并购", 2, 4, "Acquisitions")
    ],
    alternateTopics: [
      alt("L1 Favourite books / 心仪的书单", "Books"),
      alt("L2 Poetry / 诗歌到底有什么魅力", "Poetry"),
      alt("L3 A smarter home / 智能家居与生活", "Smart home"),
      alt("L4 Privacy / 科技与隐私", "Privacy"),
      alt("L5 Social pressures / 社会压力", "Pressure"),
      alt("L6 Peer pressures / 同辈压力", "Peers"),
      alt("L7 Animal behaviour / 动物奇观", "Animals"),
      alt("L8 Desert landscapes / 沙漠景观", "Landscapes"),
      alt("L9 Out with the old / 旧去新来：技术与传统", "Old vs New"),
      alt("L10 Around the world / 骑行绕世界", "Cycling"),
      alt("L11 Bringing in customers / 吸引顾客", "Customers"),
      alt("L12 Boycott / 支持性消费", "Boycott"),
      alt("L13 Getting married / 结婚那些事", "Marriage"),
      alt("L14 Parenting / 照顾孩子", "Parenting"),
      alt("L15 People in history / 历史人物", "History"),
      alt("L16 Don't get me started / 别让我开始", "Complaints"),
      alt("L17 Incredible feats / 不可思议的工程", "Feats"),
      alt("L18 Engineering challenges / 工程挑战", "Engineering"),
      alt("L19 Breaking news / 突发新闻", "News"),
      alt("L20 News reports / 新闻报告有多准确", "Reporting"),
      alt("L21 Imagined threats / 想象中的威胁", "Threats"),
      alt("L22 Telling a white lie / 善意的谎言", "Lies"),
      alt("L23 Being independent / 变得独立", "Independence"),
      alt("L24 Love is blind / 爱情真的是盲目的吗", "Love")
    ]
  },
  {
    level: CEFRLevel.C1,
    type: CourseType.Business,
    coreVocabCount: 480,
    grammarPoints: 240,
    baseHoursRequired: 48,
    description: "高级I: 跨国管理与战略决策 / Advanced I: Cross-border & Strategy.",
    officialTopics: [
      ot("L1 Teamwork / 团队协作与领导", 2, 4, "Teamwork"),
      ot("L2 Heavy Workload / 应对繁重工作荷", 2, 4, "Workload"),
      ot("L3 Positive Self-talk / 积极的自我暗示", 2, 4, "Self-talk"),
      ot("L4 Public Speaking / 掌握演讲实用技巧", 2, 4, "Public speaking"),
      ot("L5 Food Psychology / 食物如何影响心理", 2, 4, "Food psych"),
      ot("L6 Doom Scrolling / 不停刷负面信息", 2, 4, "Doom scrolling"),
      ot("L7 Short Drama / 中国短剧席卷全球", 2, 4, "Short drama"),
      ot("L8 Hybrid Work / 混合办公能力", 2, 4, "Hybrid work"),
      ot("L9 AI Anchors / AI主播取代新闻播报", 2, 4, "AI news"),
      ot("L10 Business Ethics / 商业道德与操守", 2, 4, "Ethics"),
      ot("L11 Recruiting / 招聘与人才甄选", 2, 4, "Recruiting"),
      ot("L12 Performance / 绩效评估与提升", 2, 4, "Performance"),
      ot("L13 Labor Relations / 劳资关系管理", 2, 4, "Labor relations"),
      ot("L14 Product Promotion / 产品推广策略", 2, 4, "Promotion"),
      ot("L15 Branding / 品牌建设与管理", 2, 4, "Branding"),
      ot("L16 Keeping Customers / 客户维护与留存", 2, 4, "Retention"),
      ot("L17 Internal Comm / 企业内部沟通", 2, 4, "Internal comm"),
      ot("L18 Cross-border / 跨境合作管理", 2, 4, "Cross-border")
    ],
    alternateTopics: [
      alt("L1 Avoidant Attachment / 关于回避型依恋的真相", "Attachment"),
      alt("L2 Nostalgia / 怀旧心理：为什么困在过去", "Nostalgia"),
      alt("L3 Journaling / 写日记的心理学", "Journaling"),
      alt("L4 Love in Company / 爱上独处", "Solitude"),
      alt("L5 Food Affects Psychology / 食物如何影响心理", "Food psych"),
      alt("L6 True Crime / 为什么我们迷恋真实犯罪", "True crime"),
      alt("L7 Only Child Syndrome / 独生子女的心理特征", "Only child"),
      alt("L8 Introversion vs Extroversion / 内向与外向的心理差异", "Personality"),
      alt("L9 Doom Scrolling / 为什么不停刷负面信息", "Scrolling"),
      alt("L10 Short Drama / 中国短剧为何席卷全球", "Drama"),
      alt("L11 Hybrid Work / 如何提升混合办公能力", "Hybrid"),
      alt("L12 AI Anchors / AI主播会取代新闻播报吗", "AI"),
      alt("L13 Oversharing / 我是不是分享过度了", "Oversharing"),
      alt("L14 Appearance Obsession / 外貌焦虑", "Appearance"),
      alt("L15 Paid Advertising / 真实生活分享还是隐形广告", "Ads"),
      alt("L16 Taxes / 税收如何改变行为和经济", "Taxes"),
      alt("L17 Confidence / 如何更自信地沟通", "Confidence"),
      alt("L18 Self-sabotage / 如何摆脱自我内耗", "Sabotage"),
      alt("L19 Hobbies / 为什么兴趣爱好如此重要", "Hobbies"),
      alt("L20 Being Average / 做一个普通人可以吗", "Average"),
      alt("L21 Brain Training / 如何训练大脑去做困难的事", "Brain training"),
      alt("L22 Empathetic Nibble / 谈判中的共情式蚕食策略", "Negotiation"),
      alt("L23 Fake it till you make it / 装到成功：积极暗示的力量", "Fake it"),
      alt("L24 Master Public Speaking / 掌握演讲的实用技巧", "Speaking")
    ]
  },
  {
    level: CEFRLevel.C1Plus,
    type: CourseType.Business,
    coreVocabCount: 480,
    grammarPoints: 240,
    baseHoursRequired: 48,
    description: "高级II: 复杂商业环境与创新 / Advanced II: Complex Env & Innovation.",
    officialTopics: [
      ot("L19 Office Automation / 办公自动化与数字化", 2, 4, "Automation"),
      ot("L20 Internet Marketing / 互联网营销", 2, 4, "Internet marketing"),
      ot("L21 Flexible Work / 弹性工作方式", 2, 4, "Flexible work"),
      ot("L22 Trade Fair / 展会与商务博览", 2, 4, "Trade fairs"),
      ot("L23 Paying for Development / 自我发展与培训投资", 2, 4, "Training"),
      ot("L24 Advertising Psych / 广告和消费心理学", 2, 4, "Ad psych"),
      ot("L25 Culture Clashes / 避免文化冲突", 2, 4, "Culture clash"),
      ot("L26 Business Updates / 商业进展汇报", 2, 4, "Updates"),
      ot("L27 Common Ground / 寻找共同利益", 2, 4, "Common ground"),
      ot("L28 Gastrodiplomacy / 美食外交", 2, 4, "Diplomacy"),
      ot("L29 Tolerance / 预算容差与误差谈判", 2, 4, "Tolerance"),
      ot("L30 Brand Collab / 品牌合作", 2, 4, "Collab"),
      ot("L31 Strategic Decision / 战略决策制定", 2, 4, "Strategy"),
      ot("L32 Crisis Management / 危机管理", 2, 4, "Crisis"),
      ot("L33 Stakeholder Mgmt / 利益相关者管理", 2, 4, "Stakeholders"),
      ot("L34 Instant Pushbacks / 即时应对与反驳", 2, 4, "Pushbacks"),
      ot("L35 Innovation / 创新与创意提案", 2, 4, "Innovation"),
      ot("L36 Investment Asking / 投资洽谈与融资请求", 2, 4, "Investment")
    ],
    alternateTopics: [
      alt("L1 Paradox of Choice / 选择越多越焦虑？", "Choice"),
      alt("L2 Digital Detox / 数字排毒", "Detox"),
      alt("L3 Procrastination / 拖延陷阱", "Procrastination"),
      alt("L4 Algorithm Effect / 算法效应：应用比我们更懂自己吗", "Algorithms"),
      alt("L5 Lonely in Crowd / 城市悖论：人群中孤独", "Loneliness"),
      alt("L6 Multitasking / 一心多用：超能力还是幻觉", "Multitasking"),
      alt("L7 Redefining Success / 重新定义成功：有钱就够了吗", "Success"),
      alt("L8 Birth Rates / 生育率下降：经济战还是社会选择", "Birth rates"),
      alt("L9 Digital Love / 屏幕里的爱情靠谱吗", "Digital love"),
      alt("L10 Resilience / 复原力：为什么有人越挫越勇", "Resilience"),
      alt("L11 Cancel Culture / 取消文化：群体正义还是网络暴力", "Cancel culture"),
      alt("L12 Sleep Crisis / 睡眠危机：为什么总是困", "Sleep"),
      alt("L13 Rituals / 小仪式，大魔力", "Rituals"),
      alt("L14 Parallel Realities / 平行现实：在另一条时间线上", "Reality"),
      alt("L15 Money Psychology / 金钱心理学：消费习惯透漏了什么", "Money psych"),
      alt("L16 Perfectionism / 完美主义：天赋还是诅咒", "Perfectionism"),
      alt("L17 AI Ethics / AI伦理：机器能做道德决定吗", "AI ethics"),
      alt("L18 Housing Market / 房地产市场：梦想与困境", "Housing"),
      alt("L19 Aging / 年轻至上的社会中的衰老", "Aging"),
      alt("L20 Influence / 影响力：为什么容易被带节奏", "Influence"),
      alt("L21 Mental Fitness / 心理健身：把大脑当肌肉练", "Fitness"),
      alt("L22 Deepfakes / 深度伪造与AI影像", "Deepfakes"),
      alt("L23 Digital Money / 数字货币：加密货币正在改写规则吗", "Crypto"),
      alt("L24 Digital Identity / 数字身份：线上人格真实吗", "Identity")
    ]
  },
  {
    level: CEFRLevel.C2,
    type: CourseType.Business,
    coreVocabCount: 600, // Estimated
    grammarPoints: 200,
    baseHoursRequired: 28,
    description: "精通级: 全定制 (Near Native) / Mastery: Fully Customized.",
    officialTopics: [
      ot("L1 Macroeconomic Seminar / 宏观经济研讨", 2, 4, "Economics"),
      ot("L2 Global Leadership / 全球领导力", 2, 4, "Leadership"),
      ot("L3 Deep Cross-Cultural / 跨文化深度融合", 2, 4, "Culture"),
      ot("L4 Advanced Rhetoric / 高级修辞与演讲", 2, 4, "Rhetoric"),
      ot("L5 Crisis Negotiation / 危机谈判", 2, 4, "Negotiation"),
      ot("L6 Mergers & Acquisitions / 并购深度分析", 2, 4, "M&A"),
      ot("L7 Corporate Governance / 公司治理", 2, 4, "Governance"),
      ot("L8 Sustainability Strategy / 可持续发展战略", 2, 4, "ESG"),
      ot("L9 Digital Transformation / 数字化转型", 2, 4, "Transformation"),
      ot("L10 IPO Process / 上市流程", 2, 4, "IPO"),
      ot("L11 Venture Capital / 风险投资", 2, 4, "VC"),
      ot("L12 Geopolitics / 地缘政治与商业", 2, 4, "Geopolitics"),
      ot("L13 Intellectual Property / 知识产权战略", 2, 4, "IP"),
      ot("L14 Executive Coaching / 高管教练", 2, 4, "Coaching")
    ]
  }
];

// Re-ordered lists to be alphabetical for easier reading
export const SPECIALTY_PACKS: Record<string, TopicPackConfig[]> = {
  [TopicCategory.Popular]: [
    {
      name: "🔥 职场生存急救包 (A1-A2) / Office Survival",
      minLevel: CEFRLevel.A1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "自我介绍 / Self Intro", scenario: "Introduce yourself confidently in 1 min / 1分钟自信自我介绍。" },
         { title: "简单邮件 / Simple Emails", scenario: "Write 'OOO' or meeting invites / 写请假或会议邀请邮件。" },
         { title: "接听电话 / Taking Calls", scenario: "Take messages accurately / 准确记录电话留言。" },
         { title: "接待访客 / Hosting Visitors", scenario: "Small talk while waiting / 等待时的闲聊。" },
         { title: "请假与考勤 / Leave & Attendance", scenario: "Ask boss for time off / 向老板请假。" },
         { title: "参与会议 / Joining Meetings", scenario: "Simple agreement/disagreement / 简单的同意或反对。" },
         { title: "请求反馈 / Asking for Feedback", scenario: "Ask how to improve work / 询问如何改进工作。" },
         { title: "确认指令 / Clarifying Instructions", scenario: "Double check what boss said / 再次确认老板的指令。" },
         { title: "病假报告 / Reporting Sick", scenario: "Call in sick professionally / 专业地请病假。" },
         { title: "预定会议室 / Booking Rooms", scenario: "Reserve space for team / 为团队预定会议室。" },
         { title: "IT报修 / IT Help Request", scenario: "Explain computer issues / 解释电脑故障。" },
         { title: "茶水间闲聊 / Coffee Break Chat", scenario: "Socialize with colleagues / 与同事在茶水间闲聊。" }
      ]
    },
    {
      name: "🔥 出国自由行必备 (A1-A2) / Travel Essentials",
      minLevel: CEFRLevel.A1,
      directions: [LearningDirection.Life],
      topics: [
         { title: "机场通关 / Airport & Customs", scenario: "Handle immigration questions / 回答海关问题。" },
         { title: "酒店突发 / Hotel Issues", scenario: "Complain about noise or broken AC / 投诉噪音或空调坏了。" },
         { title: "点餐避雷 / Ordering Food", scenario: "Ask for recommendations & allergies / 询问推荐和过敏源。" },
         { title: "问路与交通 / Directions", scenario: "Buy subway tickets / 购买地铁票。" },
         { title: "购物退税 / Shopping & Tax", scenario: "Ask for tax refund forms / 索要退税单。" },
         { title: "紧急求医 / Medical Help", scenario: "Buy medicine at pharmacy / 在药店买药。" },
         { title: "行李遗失 / Lost Luggage", scenario: "File a claim at airport / 在机场申报行李遗失。" },
         { title: "购买SIM卡 / Buying SIM Card", scenario: "Get data plan abroad / 在国外购买流量套餐。" },
         { title: "请求拍照 / Asking for Photo", scenario: "Ask stranger to take photo / 请路人帮忙拍照。" },
         { title: "货币兑换 / Currency Exchange", scenario: "Change money at best rate / 以最优汇率换钱。" },
         { title: "看懂地图 / Reading Maps", scenario: "Navigate train systems / 搞懂火车线路图。" },
         { title: "退房结账 / Checking Out", scenario: "Settle hotel bill / 结清酒店账单。" }
      ]
    },
     {
      name: "🔥 社交达人 (A2-B1) / Social Butterfly",
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Life, LearningDirection.Business],
      topics: [
         { title: "破冰话题 / Ice Breakers", scenario: "Start chat with strangers / 和陌生人开启话题。" },
         { title: "聊电影美剧 / Movies & TV", scenario: "Discuss plot and characters / 讨论剧情和角色。" },
         { title: "邀请与拒绝 / Invites & Declines", scenario: "Politely say no to dinner / 礼貌拒绝晚餐邀请。" },
         { title: "餐桌礼仪 / Table Manners", scenario: "Small talk during meals / 席间闲聊。" },
         { title: "赞美与回应 / Compliments", scenario: "React to praise naturally / 自然回应赞美。" },
         { title: "保持联系 / Keeping in Touch", scenario: "End convo and swap contacts / 结束对话并交换联系方式。" },
         { title: "聊爱好 / Discussing Hobbies", scenario: "Share what you do for fun / 分享你的业余爱好。" },
         { title: "谈论天气 / Weather Talk", scenario: "Classic British small talk / 经典的英式天气闲聊。" },
         { title: "周末计划 / Weekend Plans", scenario: "Ask what others are doing / 询问别人的周末计划。" },
         { title: "称赞穿搭 / Complimenting Outfit", scenario: "Notice someone's style / 注意到别人的穿搭。" },
         { title: "询问家庭 / Asking about Family", scenario: "Polite family questions / 礼貌地询问家庭情况。" },
         { title: "道别 / Saying Goodbye", scenario: "Leave a party politely / 礼貌地离开聚会。" }
      ]
    },
    {
      name: "🔥 商务谈判与会议 (B1-B2) / Negotiaion & Meetings",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "会议主持 / Chairing Meetings", scenario: "Keep meeting on track / 控制会议进度。" },
         { title: "讨价还价 / Price Bargaining", scenario: "Push for discounts / 争取折扣。" },
         { title: "处理异议 / Handling Objections", scenario: "Turn 'No' into 'Maybe' / 将拒绝转为可能。" },
         { title: "数据汇报 / Presenting Data", scenario: "Explain charts and trends / 解释图表和趋势。" },
         { title: "跨部门撕逼 / Cross-Dept Conflict", scenario: "Resolve resource conflicts / 解决资源冲突。" },
         { title: "商务晚宴 / Business Dinner", scenario: "Formal toasting and chat / 正式祝酒与交谈。" },
         { title: "提出反还价 / Counter-offer", scenario: "Propose a new price / 提出新的价格方案。" },
         { title: "讨论期限 / Deadlines", scenario: "Negotiate timeframes / 谈判时间期限。" },
         { title: "表达反对 / Disagreeing", scenario: "Politely disagree with ideas / 礼貌地反对观点。" },
         { title: "寻求澄清 / Asking Clarification", scenario: "Ensure you understood correctly / 确保理解正确。" },
         { title: "总结要点 / Summarizing", scenario: "Wrap up key points / 总结关键点。" },
         { title: "达成交易 / Closing Deal", scenario: "Shake hands on agreement / 握手成交。" }
      ]
    }
  ],
  [TopicCategory.Life]: [
    { 
      name: "出国旅游 (A1-A2) / Travel Basics", 
      minLevel: CEFRLevel.A1,
      directions: [LearningDirection.Life],
      topics: [
        { title: "机场导航 / Airport Navigation", scenario: "Handle check-in and security / 办理登机和安检。" },
        { title: "问路 / Asking Directions", scenario: "Find your way in a new city / 在陌生城市问路。" },
        { title: "点餐 / Ordering Food", scenario: "Order meals and ask for bills / 点餐和结账。" },
        { title: "酒店入住 / Hotel Check-in", scenario: "Check in and ask for wifi / 办理入住和询问WiFi。" },
        { title: "购物基础 / Shopping Basics", scenario: "Ask for price and size / 询问价格和尺码。" },
        { title: "紧急求助 / Emergency Help", scenario: "Ask for police or doctor / 寻求警察或医生帮助。" },
        { title: "乘坐交通工具 / Taking Transport", scenario: "Buy tickets for bus/train / 购买公交或火车票。" },
        { title: "简单的闲聊 / Simple Small Talk", scenario: "Chat about weather with locals / 和当地人聊天气。" },
        { title: "货币兑换 / Currency Exchange", scenario: "Exchange money at a counter / 在柜台兑换货币。" },
        { title: "看懂标志 / Reading Signs", scenario: "Understand common street signs / 理解常见路标。" },
        { title: "时间与日期 / Time & Dates", scenario: "Make appointments / 预约时间。" },
        { title: "自我介绍 / Self Introduction", scenario: "Introduce yourself to strangers / 向陌生人介绍自己。" }
      ] 
    },
    { 
      name: "全职家长 (A1-A2) / Full-Time Parent", 
      minLevel: CEFRLevel.A1,
      directions: [LearningDirection.Life],
      topics: [
        { title: "学校系统 / School Systems", scenario: "Understand school types / 理解学校类型。" },
        { title: "家长会 / Parent Meetings", scenario: "Talk to teachers about progress / 与老师沟通进度。" },
        { title: "安排玩伴 / Playdates", scenario: "Arrange meetups for kids / 安排孩子聚会。" },
        { title: "看医生 / Visiting Doctors", scenario: "Describe child's sickness / 描述孩子病情。" },
        { title: "超市购物 / Grocery Shopping", scenario: "Read food labels / 阅读食品标签。" },
        { title: "课外活动 / Extra-curriculars", scenario: "Sign up for classes / 报名课外班。" },
        { title: "家庭烹饪 / Home Cooking", scenario: "Follow English recipes / 学习英语食谱。" },
        { title: "儿童安全 / Child Safety", scenario: "Discuss safety rules / 讨论安全规则。" },
        { title: "讲故事 / Storytelling", scenario: "Read books to children / 给孩子读绘本。" },
        { title: "家庭旅行 / Family Travel", scenario: "Plan trips with kids / 计划亲子旅行。" },
        { title: "帮助作业 / Helping Homework", scenario: "Assist with simple homework / 辅导简单作业。" },
        { title: "与其他家长聊天 / Chatting Parents", scenario: "Socialize at school gates / 在校门口与其他家长闲聊。" }
      ] 
    },
    { 
      name: "涉外保姆沟通 (A1-A2) / Domestic Helper Comm", 
      minLevel: CEFRLevel.A1,
      directions: [LearningDirection.Life],
      topics: [
        { title: "招聘面试 / Interviewing Helper", scenario: "Ask about experience and visa / 询问经验和签证。" },
        { title: "日常日程 / Daily Schedule", scenario: "Explain daily tasks and timing / 解释日常任务和时间安排。" },
        { title: "清洁要求 / Cleaning Standards", scenario: "Explain hygiene expectations / 解释卫生标准和期望。" },
        { title: "烹饪指示 / Cooking Instructions", scenario: "Teach recipes and dietary needs / 教授食谱和饮食要求。" },
        { title: "儿童照料 / Childcare Rules", scenario: "Explain rules for kids / 解释照顾孩子的规则。" },
        { title: "紧急情况 / Emergency Handling", scenario: "Explain what to do in emergency / 解释紧急情况处理流程。" },
        { title: "薪资休假 / Salary & Holidays", scenario: "Discuss pay and off days / 讨论薪资和休假。" },
        { title: "家电使用 / Appliance Usage", scenario: "Teach how to use machines / 教授家电使用方法。" },
        { title: "购物清单 / Shopping List", scenario: "Coordinate grocery buying / 协调买菜清单。" },
        { title: "行为规范 / House Rules", scenario: "Explain do's and don'ts / 解释家规。" },
        { title: "反馈与纠正 / Giving Feedback", scenario: "Correct mistakes politely / 礼貌纠正错误。" },
        { title: "解聘沟通 / Termination", scenario: "End contract professionally / 专业地结束合同。" }
      ] 
    },
    { 
      name: "留学生活 (A2-B1) / Study Abroad Life", 
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Life, LearningDirection.Other],
      topics: [
        { title: "迎新周 / Orientation Week", scenario: "Register for classes and ID / 注册课程和ID卡。" },
        { title: "宿舍生活 / Dorm Life", scenario: "Resolve roommate conflicts / 解决室友冲突。" },
        { title: "图书馆研究 / Library & Research", scenario: "Ask librarian for help / 向图书管理员求助。" },
        { title: "小组作业 / Group Projects", scenario: "Coordinate with classmates / 与同学协调作业。" },
        { title: "导师答疑 / Office Hours", scenario: "Ask professor questions / 向教授提问。" },
        { title: "社团活动 / Student Clubs", scenario: "Join a society / 加入社团。" },
        { title: "兼职工作 / Part-time Job", scenario: "Interview for campus job / 面试校内工作。" },
        { title: "银行开户 / Banking", scenario: "Open student account / 开立学生账户。" },
        { title: "校医服务 / Campus Health", scenario: "See a nurse / 看校医。" },
        { title: "食堂点餐 / Cafeteria", scenario: "Navigate meal plans / 搞懂餐饮计划。" },
        { title: "备考复习 / Exam Prep", scenario: "Discuss study guides / 讨论复习指南。" },
        { title: "毕业典礼 / Graduation", scenario: "Understand ceremony instructions / 理解典礼流程。" }
      ] 
    },
    { 
      name: "国际学校生活 (A2-B1) / Int'l School Life", 
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Life],
      topics: [
        { title: "入学面试 / Admissions Interview", scenario: "Handle parent interviews / 应对家长面试。" },
        { title: "理解课程 (IB/AP) / Curriculum", scenario: "Understand academic terms / 理解学术术语。" },
        { title: "志愿者工作 / Volunteering", scenario: "Help at school events / 在学校活动帮忙。" },
        { title: "阅读通知 / Reading Notices", scenario: "Understand school emails / 理解学校通知邮件。" },
        { title: "组织活动 / Organizing Events", scenario: "Coordinate charity fairs / 组织慈善义卖。" },
        { title: "与外教深入沟通 / Teacher Talks", scenario: "Discuss behavioral issues / 讨论行为问题。" },
        { title: "校园霸凌 / Addressing Bullying", scenario: "Report sensitive issues / 报告敏感问题。" },
        { title: "多元文化 / Multiculturalism", scenario: "Present your culture / 展示你的文化。" },
        { title: "阅读辅导 / Reading Tutoring", scenario: "Support advanced reading / 支持高阶阅读。" },
        { title: "大学申请 / College Apps", scenario: "Understand application roadmaps / 理解申请路线图。" },
        { title: "体育赛事 / Sports Events", scenario: "Socialize at sports days / 在运动会社交。" },
        { title: "家长委员会 / PTA Meetings", scenario: "Participate in formal meetings / 参加正式会议。" }
      ] 
    },
    { 
      name: "移民生活 (A2-B1) / Immigration Life", 
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Life],
      topics: [
        { title: "签证面试 / Visa Interviews", scenario: "Answer officer questions / 回答签证官问题。" },
        { title: "开通服务 / Utilities Setup", scenario: "Call for water/electricity / 开通水电服务。" },
        { title: "银行业务 / Banking", scenario: "Open accounts and loans / 开户和贷款。" },
        { title: "驾照考试 / Driving Test", scenario: "Understand road rules / 理解交通规则。" },
        { title: "医疗注册 / GP Registration", scenario: "Register with a doctor / 注册家庭医生。" },
        { title: "房屋租赁 / Renting House", scenario: "Read lease agreements / 阅读租赁合同。" },
        { title: "房屋买卖 / Buying Property", scenario: "Negotiate with agents / 与中介谈判。" },
        { title: "保险选择 / Insurance", scenario: "Compare insurance policies / 比较保险条款。" },
        { title: "税务基础 / Tax Basics", scenario: "Understand tax forms / 理解税务表格。" },
        { title: "邻里纠纷 / Neighbor Issues", scenario: "Resolve conflicts politely / 礼貌解决纠纷。" },
        { title: "法律常识 / Local Laws", scenario: "Know your rights / 了解你的权利。" },
        { title: "社区融入 / Community Joining", scenario: "Join local clubs / 加入当地俱乐部。" }
      ] 
    },
    { 
      name: "艺术与文化 (B1-B2) / Art & Culture", 
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Life, LearningDirection.Other],
      topics: [
        { title: "博物馆导览 / Museum Tour", scenario: "Explain exhibits to others / 向他人讲解展品。" },
        { title: "抽象艺术 / Abstract Art", scenario: "Interpret modern art / 解读现代艺术。" },
        { title: "音乐流派 / Music Genres", scenario: "Discuss musical history / 讨论音乐历史。" },
        { title: "电影评论 / Film Critique", scenario: "Analyze cinematography / 分析电影摄影。" },
        { title: "文学讨论 / Literature", scenario: "Discuss book themes / 讨论书籍主题。" },
        { title: "建筑风格 / Architecture", scenario: "Describe urban design / 描述城市设计。" },
        { title: "当代艺术 / Contemporary Art", scenario: "Discuss NFTs and installations / 讨论NFT和装置艺术。" },
        { title: "摄影技巧 / Photography", scenario: "Discuss composition / 讨论构图。" },
        { title: "戏剧表演 / Theatre", scenario: "Review a play / 评论戏剧。" },
        { title: "时尚历史 / Fashion History", scenario: "Discuss iconic designers / 讨论标志性设计师。" },
        { title: "创意写作 / Creative Writing", scenario: "Write short stories / 创作短篇故事。" },
        { title: "跨文化比较 / Cultural Comparison", scenario: "Compare artistic traditions / 比较艺术传统。" }
      ] 
    },
    {
      name: "移民与定居进阶 (B1-B2) / Immigration & Settlement",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Life],
      topics: [
         { title: "申请公民身份 / Citizenship App", scenario: "Prepare for citizenship test / 准备入籍考试。" },
         { title: "政治制度 / Political System", scenario: "Discuss local politics / 讨论当地政治。" },
         { title: "双重国籍 / Dual Nationality", scenario: "Understand legal implications / 理解法律影响。" },
         { title: "创业移民 / Entrepreneur Visa", scenario: "Pitch business plan to officials / 向官员推介商业计划。" },
         { title: "房产投资 / Property Investment", scenario: "Analyze rental yields / 分析租金回报。" },
         { title: "退休规划 / Retirement Planning", scenario: "Navigate pension systems / 搞懂养老金系统。" },
         { title: "遗产法律 / Inheritance Law", scenario: "Discuss wills and probate / 讨论遗嘱和遗嘱认证。" },
         { title: "医疗保险进阶 / Advanced Healthcare", scenario: "Navigate specialist referrals / 搞懂专科转诊。" },
         { title: "深度文化融合 / Deep Integration", scenario: "Understand slang and humor / 理解俚语和幽默。" },
         { title: "志愿服务与理事会 / Volunteering & Boards", scenario: "Serve on local boards / 在当地理事会任职。" },
         { title: "税务筹划 / Tax Planning", scenario: "Manage global taxation / 管理全球税务。" },
         { title: "跨国生活方式 / Transnational Living", scenario: "Balance life between two countries / 平衡两国生活。" }
      ]
    }
  ],
  [TopicCategory.BusinessSkills]: [
    { 
      name: "商务基础 (A1-A2) / Business Basics", 
      minLevel: CEFRLevel.A1,
      directions: [LearningDirection.Business],
      topics: [
        { title: "自我介绍 / Self Intro", scenario: "Introduce your role / 介绍你的职位。" },
        { title: "接打电话 / Taking Calls", scenario: "Handle basic phone messages / 处理基本电话留言。" },
        { title: "简单邮件 / Simple Emails", scenario: "Write leave requests / 写请假条。" },
        { title: "安排会议 / Scheduling", scenario: "Set up calendar invites / 发送日历邀请。" },
        { title: "接待客户 / Hosting Visitors", scenario: "Welcome guests to office / 欢迎客人到访。" },
        { title: "描述公司 / Describing Company", scenario: "Explain what you do / 解释你的业务。" },
        { title: "办公室闲聊 / Office Chat", scenario: "Talk about weekend / 聊聊周末。" },
        { title: "订购用品 / Ordering Supplies", scenario: "Request office items / 申请办公用品。" },
        { title: "指路 / Giving Directions", scenario: "Guide visitors in building / 在大楼内指路。" },
        { title: "求助 / Asking Help", scenario: "Ask colleagues for assistance / 向同事寻求帮助。" },
        { title: "解释问题 / Explaining Issues", scenario: "Report simple errors / 报告简单错误。" },
        { title: "告别 / Saying Goodbye", scenario: "End meetings politely / 礼貌结束会议。" }
      ] 
    },
    { 
      name: "核心技能 (A2-B1) / Core Biz Skills", 
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
        { title: "做演讲 / Presentations", scenario: "Deliver a team update / 进行团队汇报。" },
        { title: "参与会议 / Meeting Participation", scenario: "Express opinions clearly / 清晰表达观点。" },
        { title: "商务写作 / Business Writing", scenario: "Write reports and memos / 撰写报告和备忘录。" },
        { title: "谈判基础 / Negotiation Basics", scenario: "Discuss timelines/budgets / 讨论时间表和预算。" },
        { title: "解决问题 / Problem Solving", scenario: "Discuss solutions in groups / 在小组中讨论解决方案。" },
        { title: "跨文化 / Cross-Cultural", scenario: "Work with global teams / 与全球团队合作。" },
        { title: "反馈技巧 / Feedback Skills", scenario: "Give constructive feedback / 给予建设性反馈。" },
        { title: "网络社交 / Networking", scenario: "Mingle at events / 在活动中社交。" },
        { title: "时间管理 / Time Management", scenario: "Discuss priorities / 讨论优先级。" },
        { title: "客户服务 / Customer Service", scenario: "Handle inquiries / 处理咨询。" },
        { title: "项目更新 / Project Updates", scenario: "Report on status / 汇报状态。" },
        { title: "组织活动 / Organizing Events", scenario: "Plan team lunches / 策划团队午餐。" }
      ] 
    },
    { 
      name: "企业出海 (B1-B2) / Going Global", 
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
        { title: "市场进入策略 / Entry Strategy", scenario: "Discuss how to enter new market / 讨论如何进入新市场。" },
        { title: "法律合规 / Compliance", scenario: "Discuss local regulations / 讨论当地法规。" },
        { title: "文化适应 / Cultural Adaptation", scenario: "Localize products / 本地化产品。" },
        { title: "招聘本地员工 / Hiring Locals", scenario: "Interview overseas candidates / 面试海外候选人。" },
        { title: "跨境支付 / Cross-border Pay", scenario: "Discuss payment gateways / 讨论支付网关。" },
        { title: "参展展会 / Trade Shows", scenario: "Represent company at expo / 在展会代表公司。" },
        { title: "危机公关 / Crisis PR", scenario: "Handle international PR issues / 处理国际公关危机。" },
        { title: "远程管理 / Remote Mgmt", scenario: "Manage teams across time zones / 跨时区管理团队。" },
        { title: "知识产权 / IP Protection", scenario: "Protect trademarks globally / 全球保护商标。" },
        { title: "政府关系 / Gov Relations", scenario: "Lobby or meet officials / 游说或会见官员。" },
        { title: "物流链 / Supply Chain", scenario: "Manage global shipping / 管理全球航运。" },
        { title: "竞争分析 / Competitor Analysis", scenario: "Analyze global rivals / 分析全球竞争对手。" }
      ] 
    },
    { 
      name: "高级管理 (B2-C1) / Executive Skills", 
      minLevel: CEFRLevel.B2,
      directions: [LearningDirection.Business],
      topics: [
        { title: "战略规划 / Strategic Planning", scenario: "Set long-term vision / 制定长期愿景。" },
        { title: "危机管理 / Crisis Management", scenario: "Handle PR disasters / 处理公关危机。" },
        { title: "高管谈判 / Executive Negotiation", scenario: "Close million-dollar deals / 达成百万美元交易。" },
        { title: "变革管理 / Change Management", scenario: "Lead restructuring / 领导重组。" },
        { title: "公开演讲 / Public Speaking", scenario: "Keynote at conferences / 在会议上发表主旨演讲。" },
        { title: "人才发展 / Talent Development", scenario: "Mentor future leaders / 指导未来领导者。" },
        { title: "财务决策 / Financial Decisions", scenario: "Approve budgets / 批准预算。" },
        { title: "董事会沟通 / Board Relations", scenario: "Present to stakeholders / 向利益相关者汇报。" },
        { title: "企业文化 / Corporate Culture", scenario: "Shape company values / 塑造公司价值观。" },
        { title: "合并收购 / M&A Discussions", scenario: "Discuss synergies / 讨论协同效应。" },
        { title: "创新领导 / Innovation Leadership", scenario: "Drive R&D initiatives / 推动研发倡议。" },
        { title: "全球运营 / Global Operations", scenario: "Manage international offices / 管理国际办公室。" }
      ] 
    }
  ],
  [TopicCategory.Industry]: [
    { 
      name: "人工智能行业 (B2-C1) / AI Industry", 
      minLevel: CEFRLevel.B2,
      directions: [LearningDirection.Business],
      topics: [
        { title: "模型训练 / Model Training", scenario: "Discuss datasets / 讨论数据集。" },
        { title: "应用场景 / Use Cases", scenario: "Identify business value / 识别商业价值。" },
        { title: "伦理合规 / AI Ethics", scenario: "Discuss bias and safety / 讨论偏见和安全。" },
        { title: "算力资源 / Compute Resources", scenario: "Optimize GPU usage / 优化GPU使用。" },
        { title: "产品落地 / Productization", scenario: "Integrate AI into apps / 将AI集成到应用。" },
        { title: "技术演讲 / Tech Talks", scenario: "Explain algorithms / 解释算法。" },
        { title: "客户演示 / Client Demos", scenario: "Showcase capabilities / 展示能力。" },
        { title: "竞争格局 / Competitive Landscape", scenario: "Analyze AI startups / 分析AI初创公司。" },
        { title: "人才招聘 / Hiring Talent", scenario: "Interview ML engineers / 面试ML工程师。" },
        { title: "投资者关系 / Investor Pitch", scenario: "Explain AI roadmap / 解释AI路线图。" },
        { title: "数据隐私 / Data Privacy", scenario: "Ensure GDPR compliance / 确保GDPR合规。" },
        { title: "未来趋势 / Future Trends", scenario: "Discuss AGI potential / 讨论AGI潜力。" }
      ] 
    },
    { 
      name: "美妆行业 (A2-B1) / Beauty & Cosmetics", 
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
        { title: "肤质分析 / Skin Analysis", scenario: "Identify skin types / 识别皮肤类型。" },
        { title: "产品推荐 / Product Recs", scenario: "Suggest items for concerns / 针对问题推荐产品。" },
        { title: "成分讲解 / Ingredients", scenario: "Explain retinol/vitamin C / 解释视黄醇/维C。" },
        { title: "试妆服务 / Makeup Trials", scenario: "Apply makeup on client / 为客户试妆。" },
        { title: "促销活动 / Promotions", scenario: "Upsell gift sets / 推销礼盒套装。" },
        { title: "处理过敏 / Handling Allergies", scenario: "Ask about sensitivities / 询问敏感源。" },
        { title: "库存管理 / Stock Check", scenario: "Check shade availability / 检查色号库存。" },
        { title: "会员招募 / Membership", scenario: "Sign up loyal customers / 注册忠实客户。" },
        { title: "新品发布 / New Launches", scenario: "Introduce new collections / 介绍新系列。" },
        { title: "退换货 / Returns", scenario: "Handle opened products / 处理已开封退货。" },
        { title: "美妆趋势 / Beauty Trends", scenario: "Discuss viral looks / 讨论爆款妆容。" },
        { title: "社交媒体 / Social Media", scenario: "Create tutorial content / 制作教程内容。" }
      ] 
    },
    { 
      name: "化工行业 (B1-B2) / Chemical Industry", 
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
        { title: "安全数据表 / MSDS", scenario: "Explain hazard info / 解释危害信息。" },
        { title: "实验室规范 / Lab Safety", scenario: "Enforce PPE usage / 强制使用PPE。" },
        { title: "原料采购 / Raw Materials", scenario: "Source chemical compounds / 采购化合物。" },
        { title: "生产流程 / Batch Processing", scenario: "Monitor reaction times / 监控反应时间。" },
        { title: "质量检测 / QC Testing", scenario: "Check purity levels / 检查纯度水平。" },
        { title: "废料处理 / Waste Disposal", scenario: "Manage hazardous waste / 管理危险废物。" },
        { title: "合规审计 / Regulatory Audit", scenario: "Prepare for inspections / 准备检查。" },
        { title: "研发创新 / R&D Innovation", scenario: "Develop new formulas / 开发新配方。" },
        { title: "供应链 / Supply Chain", scenario: "Transport volatile goods / 运输易挥发货物。" },
        { title: "客户技术支持 / Tech Support", scenario: "Resolve application issues / 解决应用问题。" },
        { title: "设备维护 / Equipment Maint", scenario: "Service reactors / 维修反应釜。" },
        { title: "市场趋势 / Market Trends", scenario: "Discuss green chemistry / 讨论绿色化学。" }
      ] 
    },
    { 
      name: "建筑行业 (B1-B2) / Construction", 
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
        { title: "图纸审查 / Blueprint Review", scenario: "Discuss floor plans / 讨论平面图。" },
        { title: "工地安全 / Site Safety", scenario: "Conduct safety briefings / 进行安全简报。" },
        { title: "项目进度 / Project Timeline", scenario: "Track milestones / 追踪里程碑。" },
        { title: "材料采购 / Material Sourcing", scenario: "Order concrete/steel / 订购混凝土/钢材。" },
        { title: "分包商管理 / Subcontractors", scenario: "Coordinate with electricians / 协调电工。" },
        { title: "预算控制 / Cost Estimation", scenario: "Monitor project spend / 监控项目支出。" },
        { title: "许可证申请 / Permits", scenario: "Apply for building permits / 申请建筑许可。" },
        { title: "质量检查 / Inspections", scenario: "Pass structural checks / 通过结构检查。" },
        { title: "客户沟通 / Client Updates", scenario: "Report on delays / 汇报延误。" },
        { title: "环境合规 / Environmental", scenario: "Manage dust and noise / 管理粉尘和噪音。" },
        { title: "合同管理 / Contracts", scenario: "Review scope of work / 审查工作范围。" },
        { title: "设备调度 / Heavy Machinery", scenario: "Schedule crane usage / 安排吊车使用。" }
      ] 
    },
    { 
      name: "跨境电商 (A2-B1) / Cross-border E-com", 
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
        { title: "平台规则 / Platform Rules", scenario: "Discuss Amazon/TikTok policies / 讨论亚马逊/TikTok政策。" },
        { title: "产品上架 / Product Listing", scenario: "Write SEO descriptions / 撰写SEO描述。" },
        { title: "客户服务 / Customer Service", scenario: "Handle returns and refunds / 处理退换货。" },
        { title: "红人营销 / Influencer Marketing", scenario: "Negotiate with creators / 与创作者谈判。" },
        { title: "物流追踪 / Logistics Tracking", scenario: "Track shipments / 追踪货物。" },
        { title: "库存管理 / Inventory Mgmt", scenario: "Avoid stockouts / 避免断货。" },
        { title: "节日促销 / Seasonal Promos", scenario: "Plan Black Friday deals / 策划黑五促销。" },
        { title: "竞品分析 / Competitor Analysis", scenario: "Analyze pricing strategies / 分析定价策略。" },
        { title: "数据分析 / Data Analytics", scenario: "Read dashboard metrics / 解读后台数据。" },
        { title: "供应商沟通 / Supplier Comm", scenario: "Negotiate with factories / 与工厂谈判。" },
        { title: "广告投放 / Ad Spending", scenario: "Optimize PPC campaigns / 优化PPC广告。" },
        { title: "知识产权 / IP Complaints", scenario: "Resolve copyright strikes / 解决版权投诉。" }
      ] 
    },
    { 
      name: "能源与公共事业 (B1-B2) / Energy & Utilities", 
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
        { title: "电网管理 / Grid Management", scenario: "Monitor load balancing / 监控负载平衡。" },
        { title: "可再生能源 / Renewables", scenario: "Discuss solar/wind mix / 讨论光伏/风能配比。" },
        { title: "设施维护 / Plant Maintenance", scenario: "Schedule outages / 安排停机检修。" },
        { title: "安全合规 / HSE Compliance", scenario: "Enforce safety protocols / 执行安全协议。" },
        { title: "客户账单 / Billing Inquiries", scenario: "Explain tariff rates / 解释费率。" },
        { title: "应急响应 / Emergency Response", scenario: "Restore power outages / 恢复停电。" },
        { title: "项目开发 / Project Dev", scenario: "Plan new infrastructure / 规划新基础设施。" },
        { title: "环境影响 / Environmental Impact", scenario: "Assess carbon footprint / 评估碳足迹。" },
        { title: "监管报告 / Regulatory Reporting", scenario: "Submit compliance data / 提交合规数据。" },
        { title: "智能计量 / Smart Metering", scenario: "Roll out smart meters / 推广智能电表。" },
        { title: "供应链 / Fuel Supply", scenario: "Procure gas/coal / 采购天然气/煤炭。" },
        { title: "社区关系 / Community Relations", scenario: "Address local concerns / 回应当地担忧。" }
      ] 
    },
    { 
      name: "影视行业 (B1-B2) / Film & TV", 
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
        { title: "剧本研读 / Script Reading", scenario: "Discuss plot points / 讨论剧情点。" },
        { title: "制片统筹 / Production Mgmt", scenario: "Create shooting schedules / 制定拍摄时间表。" },
        { title: "选角导演 / Casting", scenario: "Run auditions / 进行试镜。" },
        { title: "现场拍摄 / On Set", scenario: "Coordinate crew / 协调剧组。" },
        { title: "后期制作 / Post-Production", scenario: "Supervise editing / 监督剪辑。" },
        { title: "发行营销 / Distribution", scenario: "Plan premiere events / 策划首映活动。" },
        { title: "预算管理 / Budgeting", scenario: "Track production costs / 追踪制作成本。" },
        { title: "场地联络 / Location Mgmt", scenario: "Secure permits / 获得许可。" },
        { title: "赞助植入 / Sponsorship", scenario: "Negotiate product placement / 谈判植入广告。" },
        { title: "法律合同 / Legal Contracts", scenario: "Sign talent agreements / 签署艺人协议。" },
        { title: "电影节 / Film Festivals", scenario: "Network with distributors / 与发行商社交。" },
        { title: "国际合拍 / Co-production", scenario: "Work with foreign crews / 与外国团队合作。" }
      ] 
    },
    { 
      name: "游戏行业 (B1-B2) / Gaming Industry", 
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
        { title: "游戏设计 / Game Design", scenario: "Discuss mechanics / 讨论机制。" },
        { title: "社区运营 / Community Mgmt", scenario: "Moderate Discord / 管理Discord。" },
        { title: "本地化 / Localization", scenario: "Translate in-game text / 翻译游戏文本。" },
        { title: "QA测试 / QA Testing", scenario: "Reproduce bugs / 复现Bug。" },
        { title: "版本发布 / Patch Notes", scenario: "Write update logs / 撰写更新日志。" },
        { title: "玩家支持 / Player Support", scenario: "Answer tickets / 回复工单。" },
        { title: "电子竞技 / Esports", scenario: "Organize tournaments / 组织锦标赛。" },
        { title: "变现策略 / Monetization", scenario: "Design microtransactions / 设计微交易。" },
        { title: "美术风格 / Art Style", scenario: "Critique character design / 评论角色设计。" },
        { title: "发行营销 / Publishing", scenario: "Plan launch trailer / 策划发布预告。" },
        { title: "技术美术 / Tech Art", scenario: "Optimize shaders / 优化着色器。" },
        { title: "项目管理 / Production", scenario: "Manage sprint backlog / 管理冲刺待办。" }
      ] 
    },
    { 
      name: "医疗健康 (A2-B1) / Healthcare", 
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
        { title: "预约挂号 / Scheduling Appointments", scenario: "Manage patient bookings / 管理病人预约。" },
        { title: "问诊流程 / Consultation Flow", scenario: "Guide patients through clinic / 引导病人就诊。" },
        { title: "病史询问 / Taking History", scenario: "Ask basic health questions / 询问基本健康问题。" },
        { title: "解释处方 / Explaining Scripts", scenario: "Explain dosage instructions / 解释服药剂量。" },
        { title: "紧急分诊 / Triage", scenario: "Assess urgency of cases / 评估病例紧急程度。" },
        { title: "医疗保险 / Medical Insurance", scenario: "Process insurance claims / 处理保险理赔。" },
        { title: "安抚病人 / Comforting Patients", scenario: "Calm anxious patients / 安抚焦虑病人。" },
        { title: "医疗器械 / Medical Equipment", scenario: "Explain machine usage / 解释机器用途。" },
        { title: "隐私保护 / Patient Privacy", scenario: "Explain confidentiality / 解释保密规定。" },
        { title: "转诊流程 / Referrals", scenario: "Refer to specialists / 转诊至专科医生。" },
        { title: "医院导航 / Hospital Navigation", scenario: "Give directions in hospital / 在医院内指路。" },
        { title: "出院指导 / Discharge Info", scenario: "Explain home care / 解释居家护理。" }
      ] 
    },
    { 
      name: "国际教育 (B1-B2) / Int'l Education", 
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
        { title: "招生咨询 / Admissions", scenario: "Give school tours / 带领参观学校。" },
        { title: "课程讲解 / Curriculum", scenario: "Explain IB/A-Level / 解释IB/A-Level。" },
        { title: "家校沟通 / Parent Comm", scenario: "Write newsletters / 撰写新闻通讯。" },
        { title: "招聘外教 / Teacher Recruitment", scenario: "Interview expat teachers / 面试外籍教师。" },
        { title: "学生活动 / Student Activities", scenario: "Organize field trips / 组织实地考察。" },
        { title: "行政管理 / Admin Support", scenario: "Manage student records / 管理学生档案。" },
        { title: "危机处理 / Crisis Mgmt", scenario: "Handle student incidents / 处理学生事故。" },
        { title: "市场推广 / Marketing", scenario: "Host open days / 举办开放日。" },
        { title: "签证支持 / Visa Support", scenario: "Assist staff visas / 协助员工签证。" },
        { title: "设施管理 / Facility Mgmt", scenario: "Maintain campus grounds / 维护校园场地。" },
        { title: "升学指导 / College Counseling", scenario: "Advise on universities / 建议大学申请。" },
        { title: "财务收费 / Tuition & Fees", scenario: "Collect school fees / 收取学费。" }
      ] 
    },
    { 
      name: "新媒体广告 (B1-B2) / New Media Ads", 
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
        { title: "流量变现 / Monetization", scenario: "Discuss ad revenue models / 讨论广告收入模式。" },
        { title: "用户画像 / User Personas", scenario: "Target specific demographics / 针对特定人群。" },
        { title: "转化率优化 / CRO", scenario: "Improve landing pages / 优化落地页。" },
        { title: "内容种草 / Seeding", scenario: "Plan influencer seeding / 策划网红种草。" },
        { title: "数据复盘 / Data Review", scenario: "Analyze campaign metrics / 分析活动指标。" },
        { title: "热点营销 / Trend Jacking", scenario: "Leverage viral topics / 利用病毒话题。" },
        { title: "私域流量 / Private Traffic", scenario: "Manage community groups / 管理社群。" },
        { title: "短视频脚本 / Short Video Scripts", scenario: "Write hooks for TikTok / 写抖音钩子文案。" },
        { title: "直播运营 / Livestream Ops", scenario: "Coordinate live events / 协调直播活动。" },
        { title: "品牌调性 / Brand Voice", scenario: "Maintain consistent tone / 保持一致语调。" },
        { title: "危机应对 / Crisis Mgmt", scenario: "Handle negative comments / 处理负面评论。" },
        { title: "跨界联名 / Cross-over", scenario: "Plan brand collabs / 策划品牌联名。" }
      ] 
    },
    { 
      name: "摄影行业 (B1-B2) / Photography", 
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
        { title: "拍摄简报 / Client Briefing", scenario: "Understand client vision / 理解客户愿景。" },
        { title: "布光技巧 / Lighting Setup", scenario: "Direct assistants on lights / 指导助手布光。" },
        { title: "模特指导 / Posing Models", scenario: "Give posing instructions / 给予摆姿势指导。" },
        { title: "器材租赁 / Gear Rental", scenario: "Book cameras and lenses / 预定相机和镜头。" },
        { title: "后期修图 / Editing Workflow", scenario: "Discuss retouching needs / 讨论修图需求。" },
        { title: "报价谈判 / Quoting", scenario: "Negotiate day rates / 谈判日薪。" },
        { title: "版权许可 / Licensing", scenario: "Explain usage rights / 解释使用权。" },
        { title: "场地勘景 / Location Scouting", scenario: "Evaluate shooting spots / 评估拍摄地点。" },
        { title: "日程安排 / Call Sheets", scenario: "Coordinate shoot schedule / 协调拍摄日程。" },
        { title: "交付流程 / Delivery", scenario: "Send high-res files / 发送高清文件。" },
        { title: "作品集展示 / Portfolio Review", scenario: "Present past work / 展示过往作品。" },
        { title: "风格讨论 / Style Discussion", scenario: "Agree on mood board / 商定情绪板。" }
      ] 
    },
    { 
      name: "服务行业 (A1-A2) / Service Industry", 
      minLevel: CEFRLevel.A1,
      directions: [LearningDirection.Business],
      topics: [
        { title: "热情问候 / Warm Welcome", scenario: "Greet customers politely / 礼貌问候顾客。" },
        { title: "需求询问 / Identifying Needs", scenario: "Ask open questions / 询问开放式问题。" },
        { title: "处理投诉 / Handling Complaints", scenario: "Apologize and rectify / 道歉并改正。" },
        { title: "电话礼仪 / Phone Etiquette", scenario: "Answer professionally / 专业接听。" },
        { title: "预约管理 / Appointments", scenario: "Book time slots / 预定时间段。" },
        { title: "收银结账 / Cashiering", scenario: "Process payments / 处理付款。" },
        { title: "产品推销 / Upselling", scenario: "Suggest add-ons / 建议附加项。" },
        { title: "团队协作 / Teamwork", scenario: "Cover shifts / 顶班。" },
        { title: "清洁卫生 / Cleaning", scenario: "Maintain tidy area / 保持区域整洁。" },
        { title: "紧急情况 / Emergencies", scenario: "Evacuate customers / 疏散顾客。" },
        { title: "VIP服务 / VIP Service", scenario: "Provide extra care / 提供额外关怀。" },
        { title: "反馈收集 / Feedback", scenario: "Ask for reviews / 请求评价。" }
      ] 
    },
    { 
      name: "运动健身行业 (A2-B1) / Sports & Fitness", 
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
        { title: "会员咨询 / Membership Inquiry", scenario: "Explain gym tiers / 解释健身房等级。" },
        { title: "私教销售 / Selling PT", scenario: "Pitch training packages / 推销训练课程。" },
        { title: "体测评估 / Fitness Assessment", scenario: "Measure BMI and fat / 测量BMI和体脂。" },
        { title: "器材指导 / Equipment Demo", scenario: "Show how to use weights / 演示器械使用。" },
        { title: "团课安排 / Group Classes", scenario: "Schedule yoga/spin / 安排瑜伽/动感单车。" },
        { title: "饮食建议 / Dietary Advice", scenario: "Suggest macro split / 建议营养素配比。" },
        { title: "受伤处理 / Injury Mgmt", scenario: "Handle minor sprains / 处理轻微扭伤。" },
        { title: "设施维护 / Facility Check", scenario: "Report broken machines / 报告损坏机器。" },
        { title: "客户激励 / Client Motivation", scenario: "Encourage during workouts / 训练中鼓励。" },
        { title: "预约管理 / Booking System", scenario: "Manage class slots / 管理课程名额。" },
        { title: "卫生规范 / Hygiene Rules", scenario: "Enforce towel usage / 强制使用毛巾。" },
        { title: "举办赛事 / Hosting Events", scenario: "Organize fitness challenges / 组织健身挑战。" }
      ] 
    },
    { 
      name: "交通运输 (A2-B1) / Transportation", 
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
        { title: "调度管理 / Dispatching", scenario: "Assign drivers to routes / 分配司机路线。" },
        { title: "车辆维护 / Fleet Maintenance", scenario: "Schedule inspections / 安排检查。" },
        { title: "路线规划 / Route Planning", scenario: "Avoid traffic congestion / 避开拥堵。" },
        { title: "乘客服务 / Passenger Service", scenario: "Announce delays / 宣布延误。" },
        { title: "安全检查 / Safety Checks", scenario: "Inspect vehicle pre-trip / 行前车辆检查。" },
        { title: "货运单据 / Cargo Docs", scenario: "Check waybills / 检查运单。" },
        { title: "燃油管理 / Fuel Management", scenario: "Optimize fuel consumption / 优化燃油消耗。" },
        { title: "合规记录 / Logbooks", scenario: "Record driving hours / 记录驾驶时长。" },
        { title: "事故处理 / Accident Procedure", scenario: "Report incidents / 报告事故。" },
        { title: "客户沟通 / Customer Updates", scenario: "Inform of ETA / 通知预计到达时间。" },
        { title: "跨境运输 / Cross-border", scenario: "Handle border checks / 处理边境检查。" },
        { title: "票务系统 / Ticketing", scenario: "Issue and check tickets / 出票检票。" }
      ] 
    },
    { 
      name: "仓储与邮政 (A2-B1) / Warehousing & Postal", 
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
        { title: "收货流程 / Receiving", scenario: "Check incoming goods / 检查入库货物。" },
        { title: "拣货打包 / Picking & Packing", scenario: "Fulfill orders accurately / 准确履行订单。" },
        { title: "库存盘点 / Stocktaking", scenario: "Count cycle inventory / 循环盘点。" },
        { title: "发货安排 / Dispatch", scenario: "Load trucks efficiently / 高效装车。" },
        { title: "退货处理 / Returns", scenario: "Assess returned items / 评估退回物品。" },
        { title: "设备操作 / Forklift Ops", scenario: "Operate machinery safely / 安全操作机器。" },
        { title: "安全规范 / Health & Safety", scenario: "Wear safety vests / 穿戴安全背心。" },
        { title: "损坏报告 / Damage Reports", scenario: "Document broken goods / 记录损坏货物。" },
        { title: "标签系统 / Labeling", scenario: "Scan barcodes / 扫描条形码。" },
        { title: "快递分拣 / Sorting", scenario: "Sort by destination / 按目的地分拣。" },
        { title: "客户查询 / Customer Queries", scenario: "Track missing parcels / 追踪丢失包裹。" },
        { title: "轮班交接 / Shift Handover", scenario: "Update next shift / 更新下一班次。" }
      ] 
    },
    { 
      name: "批发与零售 (A2-B1) / Wholesale & Retail", 
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
        { title: "大宗采购 / Bulk Buying", scenario: "Negotiate volume discounts / 谈判批量折扣。" },
        { title: "库存周转 / Stock Turnover", scenario: "Manage shelf life / 管理保质期。" },
        { title: "门店运营 / Store Ops", scenario: "Open and close store / 开店和关店。" },
        { title: "视觉陈列 / Merchandising", scenario: "Set up displays / 设置陈列。" },
        { title: "分销渠道 / Distribution", scenario: "Manage resellers / 管理经销商。" },
        { title: "订单履行 / Order Fulfillment", scenario: "Pack and ship orders / 打包发货。" },
        { title: "客户关系 / CRM", scenario: "Manage loyalty programs / 管理忠诚度计划。" },
        { title: "退货政策 / Return Policy", scenario: "Process B2B returns / 处理B2B退货。" },
        { title: "销售预测 / Sales Forecasting", scenario: "Predict seasonal demand / 预测季节性需求。" },
        { title: "供应商谈判 / Supplier Neg", scenario: "Discuss payment terms / 讨论付款条款。" },
        { title: "展会销售 / Trade Fairs", scenario: "Take orders at booth / 展位接单。" },
        { title: "电商集成 / E-com Integration", scenario: "Sync online/offline stock / 同步线上线下库存。" }
      ] 
    }
  ],
  [TopicCategory.JobRole]: [
    {
      name: "外贸跟单员 (B1-B2) / Merchandiser",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "样品确认 / Sample Approval", scenario: "Check specs / 检查规格。" },
         { title: "生产跟进 / Production Track", scenario: "Chase factory / 催促工厂。" },
         { title: "包装细节 / Packaging", scenario: "Confirm labels / 确认标签。" },
         { title: "验货安排 / Inspection", scenario: "Book QC / 预约质检。" },
         { title: "船期订舱 / Shipping Booking", scenario: "Contact forwarder / 联系货代。" },
         { title: "单证制作 / Documentation", scenario: "Prepare packing list / 准备装箱单。" },
         { title: "报价核算 / Costing", scenario: "Calculate FOB price / 计算FOB价格。" },
         { title: "付款催收 / Payment Chase", scenario: "Remind deposit / 催收定金。" },
         { title: "客户接待 / Client Visit", scenario: "Show factory / 参观工厂。" },
         { title: "质量问题 / Quality Issues", scenario: "Negotiate claims / 谈判索赔。" },
         { title: "展会筹备 / Fair Prep", scenario: "Select samples / 挑选样品。" },
         { title: "市场调研 / Market Research", scenario: "Check trends / 检查趋势。" }
      ]
    },
    {
      name: "跨境电商客服 (B1-B2) / Cross-border CS",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "售前咨询 / Pre-sales", scenario: "Answer product questions / 回答产品问题。" },
         { title: "订单追踪 / Order Tracking", scenario: "Check logistics / 检查物流。" },
         { title: "退换货处理 / Returns", scenario: "Explain policy / 解释政策。" },
         { title: "纠纷解决 / Disputes", scenario: "Resolve cases / 解决纠纷。" },
         { title: "评价管理 / Reviews", scenario: "Reply to feedback / 回复评价。" },
         { title: "促销通知 / Promos", scenario: "Send coupons / 发送优惠券。" },
         { title: "修改地址 / Address Change", scenario: "Update shipping info / 更新收货信息。" },
         { title: "缺货通知 / Out of Stock", scenario: "Offer alternatives / 提供替代品。" },
         { title: "发票请求 / Invoices", scenario: "Send VAT invoice / 发送增值税发票。" },
         { title: "尺码建议 / Sizing Help", scenario: "Guide measurement / 指导测量。" },
         { title: "海关问题 / Customs", scenario: "Explain taxes / 解释税费。" },
         { title: "VIP服务 / VIP Care", scenario: "Maintain loyal users / 维护忠实用户。" }
      ]
    },
    {
      name: "航空地勤 (A2-B1) / Airline Ground Staff",
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "值机办理 / Check-in", scenario: "Check passports / 检查护照。" },
         { title: "行李托运 / Baggage Drop", scenario: "Weigh bags / 称重行李。" },
         { title: "登机广播 / Boarding Calls", scenario: "Announce zones / 广播区域。" },
         { title: "延误解释 / Delay Info", scenario: "Explain reasons / 解释原因。" },
         { title: "改签服务 / Rebooking", scenario: "Find new flights / 寻找新航班。" },
         { title: "特殊协助 / Special Assist", scenario: "Help wheelchairs / 协助轮椅。" },
         { title: "超重行李 / Excess Baggage", scenario: "Charge fees / 收取费用。" },
         { title: "证件查验 / Visa Check", scenario: "Verify entry docs / 核实入境文件。" },
         { title: "登机口变更 / Gate Change", scenario: "Direct pax / 指引乘客。" },
         { title: "遗失物品 / Lost & Found", scenario: "Report item / 报告物品。" },
         { title: "休息室指引 / Lounge Access", scenario: "Check eligibility / 检查资格。" },
         { title: "无人陪伴儿童 / UM Service", scenario: "Handle paperwork / 处理文件。" }
      ]
    },
    {
      name: "品牌公关 (B2-C1) / PR Specialist",
      minLevel: CEFRLevel.B2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "媒体联络 / Media Pitching", scenario: "Call journalists / 致电记者。" },
         { title: "新闻稿 / Press Releases", scenario: "Draft announcements / 起草公告。" },
         { title: "活动管理 / Event Mgmt", scenario: "Check in guests / 签到嘉宾。" },
         { title: "危机应对 / Crisis Comms", scenario: "Draft holding statements / 起草立场声明。" },
         { title: "报告撰写 / Reporting", scenario: "Compile coverage / 汇总报道。" },
         { title: "KOL关系 / Influencer Relations", scenario: "Coordinate gifts / 协调礼品。" },
         { title: "品牌叙事 / Brand Storytelling", scenario: "Craft key messages / 打磨关键信息。" },
         { title: "采访准备 / Interview Prep", scenario: "Brief spokesperson / 向发言人做简报。" },
         { title: "社交媒体 / Social Monitoring", scenario: "Track sentiment / 追踪舆情。" },
         { title: "赞助洽谈 / Sponsorships", scenario: "Negotiate partnerships / 谈判合作伙伴。" },
         { title: "内部沟通 / Internal Comms", scenario: "Update employees / 更新员工信息。" },
         { title: "发布会 / Press Conference", scenario: "Host media Q&A / 主持媒体问答。" }
      ]
    },
    {
      name: "生物医药研发 (B2-C1) / Biomedical R&D",
      minLevel: CEFRLevel.B2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "实验设计 / Experiment Design", scenario: "Plan protocols / 计划方案。" },
         { title: "数据分析 / Data Analysis", scenario: "Interpret results / 解读结果。" },
         { title: "文献综述 / Literature Review", scenario: "Discuss papers / 讨论论文。" },
         { title: "实验室会议 / Lab Meeting", scenario: "Present progress / 展示进度。" },
         { title: "合规记录 / Documentation", scenario: "Maintain lab notebooks / 维护实验记录。" },
         { title: "设备故障 / Troubleshooting", scenario: "Fix instruments / 维修仪器。" },
         { title: "临床试验 / Clinical Trials", scenario: "Discuss phases / 讨论试验阶段。" },
         { title: "专利申请 / Patents", scenario: "Draft claims / 起草专利要求。" },
         { title: "学术会议 / Conferences", scenario: "Present poster / 展示海报。" },
         { title: "跨部门协作 / Collaboration", scenario: "Work with regulatory / 与法规部合作。" },
         { title: "安全培训 / Safety Training", scenario: "Review biosafety / 复习生物安全。" },
         { title: "拨款申请 / Grant Writing", scenario: "Propose funding / 申请资金。" }
      ]
    },
    {
      name: "摄像师 (B1-B2) / Videographer",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "分镜脚本 / Storyboarding", scenario: "Plan shot list / 计划镜头表。" },
         { title: "运镜技巧 / Camera Movement", scenario: "Discuss tracking shots / 讨论跟拍镜头。" },
         { title: "现场收音 / Audio Recording", scenario: "Check sound levels / 检查音量。" },
         { title: "剪辑节奏 / Editing Pace", scenario: "Sync cuts to music / 剪辑卡点。" },
         { title: "客户反馈 / Client Review", scenario: "Implement changes / 执行修改。" },
         { title: "设备维护 / Gear Maint", scenario: "Clean lenses/sensors / 清洁镜头/传感器。" },
         { title: "布光设计 / Lighting Design", scenario: "Set up 3-point lighting / 设置三点布光。" },
         { title: "采访技巧 / Interviewing", scenario: "Ask questions on camera / 镜头前提问。" },
         { title: "色彩校正 / Color Grading", scenario: "Discuss mood and tone / 讨论色调和氛围。" },
         { title: "导出格式 / Export Settings", scenario: "Choose codecs / 选择编码格式。" },
         { title: "多机位 / Multi-cam", scenario: "Sync multiple angles / 同步多机位。" },
         { title: "直播推流 / Livestreaming", scenario: "Setup OBS / 设置推流软件。" }
      ]
    },
    {
      name: "社区管理员 (B1-B2) / Community Mgr",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "欢迎新人 / Welcoming", scenario: "Post intro threads / 发布介绍帖。" },
         { title: "规则执行 / Moderation", scenario: "Warn users / 警告用户。" },
         { title: "活动发布 / Announcements", scenario: "Post updates / 发布更新。" },
         { title: "收集反馈 / Feedback", scenario: "Run polls / 进行投票。" },
         { title: "回答问题 / Q&A", scenario: "Help users / 帮助用户。" },
         { title: "处理冲突 / Conflict", scenario: "De-escalate fights / 平息争吵。" },
         { title: "内容策划 / Content Plan", scenario: "Schedule posts / 安排帖子。" },
         { title: "用户访谈 / Interviews", scenario: "Chat with MVPs / 与核心用户聊天。" },
         { title: "数据报告 / Analytics", scenario: "Track engagement / 追踪参与度。" },
         { title: "危机公关 / Crisis", scenario: "Address backlash / 回应抵制。" },
         { title: "跨组协作 / Collab", scenario: "Work with marketing / 与市场部合作。" },
         { title: "激励机制 / Gamification", scenario: "Award badges / 颁发徽章。" }
      ]
    },
    {
      name: "厨师 (A2-B1) / Chef",
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "厨房术语 / Kitchen Lingo", scenario: "Understand 'Behind!' / 理解'小心背后'。" },
         { title: "食谱准备 / Mise en Place", scenario: "Prep ingredients / 准备食材。" },
         { title: "订单呼叫 / Calling Orders", scenario: "Confirm tickets / 确认订单。" },
         { title: "食材订购 / Ordering Stock", scenario: "List needed items / 列出所需物品。" },
         { title: "卫生检查 / Hygiene Check", scenario: "Clean stations / 清洁工位。" },
         { title: "菜品介绍 / Menu Explanation", scenario: "Describe specials / 介绍特价菜。" },
         { title: "刀工技巧 / Knife Skills", scenario: "Demonstrate cuts / 演示刀法。" },
         { title: "过敏源 / Allergens", scenario: "Identify nuts/gluten / 识别坚果/麸质。" },
         { title: "库存管理 / Inventory", scenario: "Rotate stock (FIFO) / 库存轮换。" },
         { title: "团队协作 / Teamwork", scenario: "Coordinate with line cooks / 协调流水线厨师。" },
         { title: "设备报修 / Equipment Fix", scenario: "Report broken oven / 报告烤箱故障。" },
         { title: "排班沟通 / Roster", scenario: "Request shift change / 申请换班。" }
      ]
    },
    {
      name: "客服 (A2-B1) / Customer Service",
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "接听电话 / Answering", scenario: "Greeting script / 问候话术。" },
         { title: "查询订单 / Order Check", scenario: "Locate details / 查找详情。" },
         { title: "解释政策 / Policies", scenario: "Explain refunds / 解释退款。" },
         { title: "安抚情绪 / Empathy", scenario: "Apologize sincerely / 真诚道歉。" },
         { title: "记录工单 / Ticketing", scenario: "Log calls / 记录通话。" },
         { title: "升级投诉 / Escalation", scenario: "Transfer to manager / 转接经理。" },
         { title: "邮件回复 / Email Reply", scenario: "Write formal response / 写正式回复。" },
         { title: "在线聊天 / Live Chat", scenario: "Handle multiple chats / 处理多窗口。" },
         { title: "故障排查 / Basic Tech", scenario: "Guide reset / 指导重置。" },
         { title: "账单问题 / Billing", scenario: "Explain charges / 解释费用。" },
         { title: "账户安全 / Security", scenario: "Verify identity / 核实身份。" },
         { title: "结束通话 / Closing", scenario: "Ask anything else / 询问其他需求。" }
      ]
    },
    {
      name: "牙医 (B2-C1) / Dentist",
      minLevel: CEFRLevel.B2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "疼痛评估 / Pain Assessment", scenario: "Ask where it hurts / 询问疼痛位置。" },
         { title: "治疗解释 / Procedure Explain", scenario: "Describe root canal / 描述根管治疗。" },
         { title: "口腔卫生 / Oral Hygiene", scenario: "Teach flossing / 教授使用牙线。" },
         { title: "术后指导 / Post-op Care", scenario: "Explain recovery / 解释恢复期。" },
         { title: "安抚焦虑 / Calming Anxiety", scenario: "Reassure nervous patients / 安抚紧张病人。" },
         { title: "转诊专科 / Referrals", scenario: "Refer to orthodontist / 转诊正畸医生。" },
         { title: "病历记录 / Charting", scenario: "Document findings / 记录发现。" },
         { title: "知情同意 / Informed Consent", scenario: "Explain risks / 解释风险。" },
         { title: "美容牙科 / Cosmetic", scenario: "Discuss whitening / 讨论美白。" },
         { title: "急诊处理 / Emergency", scenario: "Treat broken tooth / 治疗断牙。" },
         { title: "费用解释 / Billing", scenario: "Explain insurance coverage / 解释保险覆盖。" },
         { title: "药物处方 / Prescribing", scenario: "Prescribe antibiotics / 开抗生素。" }
      ]
    },
    {
      name: "导演编剧 (B2-C1) / Director & Screenwriter",
      minLevel: CEFRLevel.B2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "剧本推介 / Pitching Scripts", scenario: "Sell the story concept / 推销故事概念。" },
         { title: "角色分析 / Character Analysis", scenario: "Discuss motivation / 讨论动机。" },
         { title: "给戏 / Directing Actors", scenario: "Adjust performance / 调整表演。" },
         { title: "视觉风格 / Visual Style", scenario: "Brief the DOP / 向摄影指导下达简报。" },
         { title: "制片会议 / Production Meeting", scenario: "Solve logistical issues / 解决后勤问题。" },
         { title: "后期指导 / Post Supervision", scenario: "Finalize the cut / 定剪。" },
         { title: "场景调度 / Blocking", scenario: "Plan actor movements / 规划演员走位。" },
         { title: "台词修改 / Dialogue Edits", scenario: "Refine script lines / 修改剧本台词。" },
         { title: "预算沟通 / Budget Talks", scenario: "Negotiate with producer / 与制片人谈判。" },
         { title: "音乐配乐 / Scoring", scenario: "Brief composer / 向作曲家下达简报。" },
         { title: "电影节公关 / Festival PR", scenario: "Q&A with audience / 观众问答。" },
         { title: "合同权益 / Contract Rights", scenario: "Discuss royalties / 讨论版税。" }
      ]
    },
    {
      name: "活动执行 (B1-B2) / Event Exec",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "场地搭建 / Setup", scenario: "Direct vendors / 指导供应商。" },
         { title: "签到流程 / Registration", scenario: "Manage guest list / 管理嘉宾名单。" },
         { title: "现场协调 / Coordination", scenario: "Fix mic issues / 解决麦克风问题。" },
         { title: "物资管理 / Inventory", scenario: "Distribute badges / 分发证件。" },
         { title: "餐饮安排 / Catering", scenario: "Check food timing / 检查上菜时间。" },
         { title: "撤场工作 / Teardown", scenario: "Pack up equipment / 打包设备。" },
         { title: "供应商沟通 / Vendor Comm", scenario: "Confirm arrival / 确认到达。" },
         { title: "紧急情况 / Emergency", scenario: "Handle medical issue / 处理医疗问题。" },
         { title: "VIP接待 / VIP Hosting", scenario: "Escort speakers / 陪同演讲者。" },
         { title: "时间控制 / Timekeeping", scenario: "Cue stage / 提示舞台。" },
         { title: "交通指引 / Transport", scenario: "Direct shuttles / 指挥班车。" },
         { title: "反馈收集 / Feedback", scenario: "Send surveys / 发送问卷。" }
      ]
    },
    {
      name: "空乘 (A2-B1) / Flight Attendant",
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "迎客入座 / Boarding", scenario: "Check boarding passes / 检查登机牌。" },
         { title: "安全检查 / Safety Check", scenario: "Secure cabins / 检查客舱。" },
         { title: "餐饮服务 / Meal Service", scenario: "Offer choices / 提供选择。" },
         { title: "免税销售 / Duty Free", scenario: "Process sales / 处理销售。" },
         { title: "急救处理 / First Aid", scenario: "Assist sick pax / 协助病患。" },
         { title: "告别送客 / Deplaning", scenario: "Say goodbye / 道别。" },
         { title: "颠簸提醒 / Turbulence", scenario: "Fasten seatbelts / 系好安全带。" },
         { title: "娱乐系统 / IFE Help", scenario: "Reset screen / 重置屏幕。" },
         { title: "处理投诉 / Complaints", scenario: "Handle seating issues / 处理座位问题。" },
         { title: "特殊餐食 / Special Meals", scenario: "Serve veg/halal / 供应素食/清真餐。" },
         { title: "机组沟通 / Crew Comm", scenario: "Talk to pilot / 与机长沟通。" },
         { title: "紧急撤离 / Evacuation", scenario: "Shout commands / 大声指挥。" }
      ]
    },
    {
      name: "游戏测试员 (B1-B2) / Game Tester",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "Bug报告 / Bug Reporting", scenario: "Write reproduction steps / 写复现步骤。" },
         { title: "关卡测试 / Level Testing", scenario: "Check collisions / 检查碰撞。" },
         { title: "功能验证 / Feature Check", scenario: "Verify fixes / 验证修复。" },
         { title: "崩溃日志 / Crash Logs", scenario: "Attach logs / 附上日志。" },
         { title: "沟通开发 / Dev Comm", scenario: "Clarify issues / 澄清问题。" },
         { title: "测试计划 / Test Cases", scenario: "Follow checklist / 遵循清单。" },
         { title: "性能测试 / Performance", scenario: "Monitor FPS / 监控帧率。" },
         { title: "本地化测试 / LQA", scenario: "Check text overlap / 检查文本重叠。" },
         { title: "兼容性 / Compatibility", scenario: "Test on devices / 设备测试。" },
         { title: "回归测试 / Regression", scenario: "Re-test old bugs / 重测旧Bug。" },
         { title: "游戏平衡 / Balance", scenario: "Report difficulty / 报告难度。" },
         { title: "提交反馈 / Feedback", scenario: "Suggest improvements / 建议改进。" }
      ]
    },
    {
      name: "理发师 (A2-B1) / Hairdresser",
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "发型咨询 / Consultation", scenario: "Ask about desired length / 询问期望长度。" },
         { title: "洗头服务 / Washing Hair", scenario: "Check water temp / 检查水温。" },
         { title: "闲聊话题 / Small Talk", scenario: "Chat about weekend / 聊周末。" },
         { title: "产品推销 / Product Sales", scenario: "Recommend shampoo / 推荐洗发水。" },
         { title: "预约确认 / Rebooking", scenario: "Book next visit / 预约下次。" },
         { title: "染发讨论 / Coloring", scenario: "Discuss shades / 讨论色调。" },
         { title: "吹风造型 / Blow Dry", scenario: "Ask for style preference / 询问造型偏好。" },
         { title: "护发建议 / Hair Care", scenario: "Suggest treatments / 建议护理。" },
         { title: "头皮问题 / Scalp Issues", scenario: "Address dandruff / 解决头皮屑。" },
         { title: "结账流程 / Payment", scenario: "Process card payment / 处理刷卡。" },
         { title: "处理投诉 / Complaints", scenario: "Fix bad haircut / 修正剪坏的发型。" },
         { title: "流行趋势 / Trends", scenario: "Suggest trendy cuts / 建议流行发型。" }
      ]
    },
    {
      name: "酒店前台 (A2-B1) / Hotel Front Desk",
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "办理入住 / Check-in", scenario: "Verify ID and payment / 核实ID和付款。" },
         { title: "客房分配 / Room Assignment", scenario: "Assign upgrades / 分配升级。" },
         { title: "处理投诉 / Complaints", scenario: "Handle noise issues / 处理噪音问题。" },
         { title: "问询服务 / Concierge Info", scenario: "Recommend restaurants / 推荐餐厅。" },
         { title: "接听电话 / Phone Calls", scenario: "Transfer to rooms / 转接房间。" },
         { title: "结账离店 / Check-out", scenario: "Process invoices / 处理发票。" },
         { title: "行李寄存 / Luggage Storage", scenario: "Tag bags / 标记行李。" },
         { title: "叫醒服务 / Wake-up Call", scenario: "Schedule call / 安排叫醒。" },
         { title: "货币兑换 / Exchange", scenario: "Change currency / 兑换货币。" },
         { title: "交通安排 / Transport", scenario: "Book taxi / 预定出租车。" },
         { title: "设施介绍 / Facilities", scenario: "Explain gym hours / 解释健身房时间。" },
         { title: "特殊要求 / Special Requests", scenario: "Arrange extra bed / 安排加床。" }
      ]
    },
    {
      name: "内科医生 (B2-C1) / Internal Medicine Doctor",
      minLevel: CEFRLevel.B2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "病史采集 / Taking History", scenario: "Ask detailed symptoms / 询问详细症状。" },
         { title: "体格检查 / Physical Exam", scenario: "Give instructions during exam / 检查时给出指令。" },
         { title: "解释诊断 / Diagnosis", scenario: "Explain condition to patient / 向病人解释病情。" },
         { title: "慢性病管理 / Chronic Disease", scenario: "Discuss diabetes/hypertension management / 讨论糖尿病/高血压管理。" },
         { title: "药物处方 / Prescribing", scenario: "Explain dosage and side effects / 解释剂量和副作用。" },
         { title: "化验结果 / Lab Results", scenario: "Interpret blood tests / 解读血液检查结果。" },
         { title: "生活建议 / Lifestyle Advice", scenario: "Advise on diet and exercise / 建议饮食和运动。" },
         { title: "疑难病例 / Complex Cases", scenario: "Consult with specialists / 与专家会诊。" },
         { title: "坏消息传达 / Breaking Bad News", scenario: "Inform serious diagnosis / 告知严重病情。" },
         { title: "病历记录 / Medical Records", scenario: "Document findings accurately / 准确记录发现。" },
         { title: "家属沟通 / Family Comm", scenario: "Update patient's family / 更新病人家属情况。" },
         { title: "急诊转诊 / ER Referral", scenario: "Coordinate emergency transfer / 协调急诊转运。" }
      ]
    },
    {
      name: "国际学校助教 (B1-B2) / Int'l School TA",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "课堂协助 / Class Support", scenario: "Help with materials / 协助准备材料。" },
         { title: "学生纪律 / Discipline", scenario: "Manage behavior / 管理行为。" },
         { title: "家校沟通 / Parent Comm", scenario: "Translate messages / 翻译信息。" },
         { title: "作业批改 / Grading", scenario: "Check simple work / 批改简单作业。" },
         { title: "活动组织 / Event Org", scenario: "Supervise play / 监督玩耍。" },
         { title: "外教沟通 / Teacher Sync", scenario: "Discuss lesson plan / 讨论教案。" },
         { title: "校园安全 / Safety Duty", scenario: "Monitor recess / 监控课间。" },
         { title: "个别辅导 / 1-on-1 Help", scenario: "Support struggling students / 支持落后学生。" },
         { title: "报告撰写 / Reports", scenario: "Input observations / 输入观察记录。" },
         { title: "物资管理 / Resources", scenario: "Inventory books / 盘点书籍。" },
         { title: "会议翻译 / Interpretation", scenario: "Translate meetings / 翻译会议。" },
         { title: "技术支持 / Tech Setup", scenario: "Set up projector / 设置投影仪。" }
      ]
    },
    {
      name: "国际物流操作员 (B1-B2) / Logistics Operator",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "订舱操作 / Booking Space", scenario: "Book container / 预定集装箱。" },
         { title: "报关资料 / Customs Docs", scenario: "Check HS codes / 检查HS编码。" },
         { title: "货物跟踪 / Tracking", scenario: "Update status / 更新状态。" },
         { title: "异常处理 / Exception Mgmt", scenario: "Handle delays / 处理延误。" },
         { title: "费用结算 / Billing", scenario: "Send invoices / 发送账单。" },
         { title: "客户沟通 / Client Updates", scenario: "Email updates / 邮件更新。" },
         { title: "提单确认 / Bill of Lading", scenario: "Draft BL / 起草提单。" },
         { title: "拖车安排 / Trucking", scenario: "Schedule pickup / 安排提货。" },
         { title: "保险理赔 / Insurance", scenario: "File damage claim / 提交损坏索赔。" },
         { title: "海外代理 / Agents", scenario: "Coordinate with destination / 协调目的港。" },
         { title: "危险品 / Dangerous Goods", scenario: "Check MSDS / 检查MSDS。" },
         { title: "仓储指令 / Warehouse", scenario: "Instruct labeling / 指示贴标。" }
      ]
    },
    {
      name: "奢侈品顾问 (B1-B2) / Luxury Consultant",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "品牌故事 / Brand Story", scenario: "Explain heritage / 解释传承。" },
         { title: "材质介绍 / Materials", scenario: "Discuss leather types / 讨论皮质。" },
         { title: "客户维护 / Clienteling", scenario: "Send greetings / 发送问候。" },
         { title: "搭配建议 / Styling", scenario: "Suggest full looks / 建议全套造型。" },
         { title: "售后保养 / Aftercare", scenario: "Explain cleaning / 解释清洁。" },
         { title: "处理异议 / Objections", scenario: "Justify price / 证明价格合理。" },
         { title: "限量版 / Limited Editions", scenario: "Create urgency / 制造紧迫感。" },
         { title: "结账服务 / Checkout", scenario: "Wrap gifts / 包装礼品。" },
         { title: "退税办理 / Tax Refund", scenario: "Process forms / 处理表格。" },
         { title: "预定货品 / Reserves", scenario: "Contact client / 联系客户。" },
         { title: "库存查询 / Stock Check", scenario: "Call other stores / 致电其他店。" },
         { title: "活动邀约 / Event Invite", scenario: "Invite to runway / 邀请看秀。" }
      ]
    },
    {
      name: "化妆师 (A2-B1) / Makeup Artist",
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "肤质询问 / Skin Prep", scenario: "Ask about dryness / 询问干燥情况。" },
         { title: "妆容偏好 / Look Preference", scenario: "Natural vs Glam / 自然 vs 浓妆。" },
         { title: "过程解释 / Process", scenario: "Explain steps / 解释步骤。" },
         { title: "修改调整 / Adjustments", scenario: "Fix eyeliner / 修改眼线。" },
         { title: "时间管理 / Timing", scenario: "Finish by deadline / 截止前完成。" },
         { title: "工具清洁 / Hygiene", scenario: "Sanitize brushes / 清洁刷具。" },
         { title: "产品推荐 / Product Recs", scenario: "Suggest lipstick color / 推荐口红颜色。" },
         { title: "定妆技巧 / Setting", scenario: "Ensure longevity / 确保持久。" },
         { title: "遮瑕处理 / Concealing", scenario: "Cover blemishes / 遮盖瑕疵。" },
         { title: "眉形设计 / Brow Shaping", scenario: "Shape brows / 设计眉形。" },
         { title: "假睫毛 / False Lashes", scenario: "Apply lashes / 贴假睫毛。" },
         { title: "卸妆建议 / Removal", scenario: "Advise on removal / 建议卸妆。" }
      ]
    },
    {
      name: "外企前台 (A2-B1) / MNC Receptionist",
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "电话转接 / Phone Transfer", scenario: "Screen calls / 筛选电话。" },
         { title: "快递收发 / Couriers", scenario: "Sign packages / 签收包裹。" },
         { title: "访客登记 / Visitor Log", scenario: "Issue badges / 发放证件。" },
         { title: "门禁管理 / Access Control", scenario: "Check IDs / 检查证件。" },
         { title: "指路引导 / Directions", scenario: "Guide to restroom / 指引洗手间。" },
         { title: "预定出租 / Taxi Booking", scenario: "Call cabs / 叫车。" },
         { title: "会议室指引 / Meeting Room", scenario: "Show guests way / 带领客人。" },
         { title: "饮水服务 / Water Service", scenario: "Offer drinks / 提供饮料。" },
         { title: "清洁联络 / Cleaning", scenario: "Call cleaner / 呼叫保洁。" },
         { title: "紧急疏散 / Evacuation", scenario: "Direct to exit / 指引出口。" },
         { title: "闲聊接待 / Small Talk", scenario: "Chat while waiting / 等待时闲聊。" },
         { title: "办公设施 / Facilities", scenario: "Explain wifi / 解释wifi。" }
      ]
    },
    {
      name: "外企行政助理 (B1-B2) / MNC Admin Asst",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "差旅安排 / Travel Booking", scenario: "Book flights/hotels / 预定机票酒店。" },
         { title: "报销流程 / Expenses", scenario: "Submit receipts / 提交收据。" },
         { title: "会议室管理 / Meeting Rooms", scenario: "Resolve conflicts / 解决冲突。" },
         { title: "办公用品 / Supplies", scenario: "Order stationery / 订购文具。" },
         { title: "访客接待 / Visitor Hosting", scenario: "Serve coffee / 提供咖啡。" },
         { title: "团建协助 / Event Helper", scenario: "Organize lunch / 组织午餐。" },
         { title: "日程管理 / Calendar", scenario: "Schedule appointments / 安排预约。" },
         { title: "文件归档 / Filing", scenario: "Organize contracts / 整理合同。" },
         { title: "会议纪要 / Minutes", scenario: "Take simple notes / 记录简单笔记。" },
         { title: "IT联络 / IT Contact", scenario: "Report printer error / 报告打印机错误。" },
         { title: "快递收发 / Couriers", scenario: "Arrange DHL / 安排DHL。" },
         { title: "节日礼物 / Gifts", scenario: "Order client gifts / 订购客户礼品。" }
      ]
    },
    {
      name: "医美前台 (A2-B1) / Aesthetic Clinic Desk",
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "项目咨询 / Treatment Info", scenario: "Explain basic procedures / 解释基本疗程。" },
         { title: "术前提醒 / Pre-op Reminders", scenario: "Remind no makeup / 提醒勿化妆。" },
         { title: "隐私签署 / Consent Forms", scenario: "Guide signature / 引导签字。" },
         { title: "术后关怀 / Follow-up Calls", scenario: "Check recovery / 检查恢复。" },
         { title: "推销套餐 / Upselling", scenario: "Offer packages / 推荐套餐。" },
         { title: "日程协调 / Scheduling", scenario: "Book doctor time / 预约医生时间。" },
         { title: "照片存档 / Photos", scenario: "Take before/after / 拍对比照。" },
         { title: "会员管理 / Membership", scenario: "Explain benefits / 解释权益。" },
         { title: "处理投诉 / Complaints", scenario: "Address dissatisfaction / 解决不满。" },
         { title: "产品销售 / Skincare Sales", scenario: "Sell post-op cream / 销售术后霜。" },
         { title: "外宾接待 / Int'l Clients", scenario: "Assist translation / 协助翻译。" },
         { title: "活动邀约 / Event Invites", scenario: "Invite to VIP day / 邀请参加VIP日。" }
      ]
    },
    {
      name: "医疗前台 (A2-B1) / Medical Reception",
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "预约登记 / Booking", scenario: "Schedule slots / 安排时间段。" },
         { title: "初诊建档 / Registration", scenario: "Take personal info / 记录个人信息。" },
         { title: "保险核实 / Insurance Check", scenario: "Verify coverage / 核实保险。" },
         { title: "候诊管理 / Waiting Area", scenario: "Manage queues / 管理排队。" },
         { title: "接听咨询 / Phone Inquiries", scenario: "Answer hours info / 回答营业时间。" },
         { title: "收费结账 / Payment", scenario: "Collect copay / 收取自付额。" },
         { title: "病历复印 / Records", scenario: "Release files / 发放病历。" },
         { title: "紧急呼叫 / Emergency", scenario: "Call nurse / 呼叫护士。" },
         { title: "隐私签署 / Privacy Forms", scenario: "Explain HIPAA / 解释隐私法。" },
         { title: "用药取药 / Pharmacy Dir", scenario: "Direct to pharmacy / 指引药房。" },
         { title: "转诊信 / Referrals", scenario: "Process letters / 处理转诊信。" },
         { title: "随访预约 / Follow-up", scenario: "Book return visit / 预约复诊。" }
      ]
    },
    {
      name: "外科医生 (B2-C1) / Surgeon",
      minLevel: CEFRLevel.B2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "术前评估 / Pre-op Assessment", scenario: "Explain procedure risks / 解释手术风险。" },
         { title: "刷手消毒 / Scrubbing In", scenario: "Follow sterility protocols / 遵守无菌规程。" },
         { title: "手术器械 / Instruments", scenario: "Ask for scalpel/retractor / 索要手术刀/拉钩。" },
         { title: "术中指令 / Intro-op Commands", scenario: "Direct nurses and assistants / 指挥护士和助手。" },
         { title: "并发症处理 / Complications", scenario: "Manage unexpected bleeding / 处理意外出血。" },
         { title: "缝合技术 / Suturing", scenario: "Discuss closing techniques / 讨论缝合技术。" },
         { title: "术后查房 / Post-op Rounds", scenario: "Check wound healing / 检查伤口愈合。" },
         { title: "疼痛管理 / Pain Management", scenario: "Prescribe analgesics / 开止痛药。" },
         { title: "知情同意 / Informed Consent", scenario: "Ensure patient understanding / 确保病人理解。" },
         { title: "手术记录 / Op Notes", scenario: "Dictate surgical report / 口述手术报告。" },
         { title: "团队沟通 / Team Comm", scenario: "Brief team before timeout / 术前暂停时简报。" },
         { title: "家属谈话 / Family Update", scenario: "Explain surgery outcome / 解释手术结果。" }
      ]
    },
    {
      name: "甜点师 (A2-B1) / Pastry Chef",
      minLevel: CEFRLevel.A2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "烘焙科学 / Baking Science", scenario: "Explain yeast/gluten / 解释酵母/面筋。" },
         { title: "装饰技巧 / Decoration", scenario: "Discuss piping techniques / 讨论裱花技巧。" },
         { title: "定制蛋糕 / Custom Cakes", scenario: "Take customer design / 接受客户设计。" },
         { title: "温度控制 / Temp Control", scenario: "Temper chocolate / 调温巧克力。" },
         { title: "早班流程 / Morning Shift", scenario: "Bake fresh goods / 烘焙新鲜产品。" },
         { title: "过敏源 / Allergens", scenario: "Flag nuts/dairy / 标记坚果/乳制品。" },
         { title: "新品研发 / R&D", scenario: "Create new flavors / 开发新口味。" },
         { title: "摆盘设计 / Plating", scenario: "Design dessert plate / 设计甜点摆盘。" },
         { title: "原料采购 / Sourcing", scenario: "Order vanilla/cocoa / 订购香草/可可。" },
         { title: "保质期 / Shelf Life", scenario: "Label expiration dates / 标记保质期。" },
         { title: "婚礼订单 / Wedding Orders", scenario: "Consult with couple / 与新人咨询。" },
         { title: "清洁消毒 / Sanitation", scenario: "Clean mixers / 清洁搅拌机。" }
      ]
    },
    {
      name: "涉外家庭教师 (B2-C1) / Private Tutor",
      minLevel: CEFRLevel.B2,
      directions: [LearningDirection.Business],
      topics: [
         { title: "课程规划 / Lesson Planning", scenario: "Outline goals / 概述目标。" },
         { title: "家长反馈 / Parent Feedback", scenario: "Report progress / 汇报进度。" },
         { title: "作业辅导 / Homework Help", scenario: "Explain concepts / 解释概念。" },
         { title: "考试准备 / Exam Prep", scenario: "Review past papers / 复习试卷。" },
         { title: "日程安排 / Scheduling", scenario: "Confirm sessions / 确认课程。" },
         { title: "激励学生 / Motivation", scenario: "Encourage study / 鼓励学习。" },
         { title: "阅读讨论 / Reading", scenario: "Discuss books / 讨论书籍。" },
         { title: "写作指导 / Writing", scenario: "Correct essays / 修改文章。" },
         { title: "大学咨询 / College Advice", scenario: "Discuss applications / 讨论申请。" },
         { title: "文化交流 / Culture", scenario: "Teach etiquette / 教授礼仪。" },
         { title: "合同谈判 / Contract", scenario: "Negotiate rate / 谈判费率。" },
         { title: "资源推荐 / Resources", scenario: "Suggest websites / 推荐网站。" }
      ]
    },
    {
      name: "瑜伽/普拉提老师 (B1-B2) / Yoga Instructor",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "体式指导 / Pose Cues", scenario: "Instruct breathing / 指导呼吸。" },
         { title: "纠正动作 / Correction", scenario: "Adjust alignment / 调整体态。" },
         { title: "课程介绍 / Class Intro", scenario: "Welcome students / 欢迎学生。" },
         { title: "伤痛询问 / Injuries", scenario: "Ask about pain / 询问疼痛。" },
         { title: "冥想引导 / Meditation", scenario: "Guide relaxation / 引导放松。" },
         { title: "课后交流 / After Class", scenario: "Answer questions / 回答问题。" },
         { title: "解剖术语 / Anatomy", scenario: "Explain muscles / 解释肌肉。" },
         { title: "辅助工具 / Props", scenario: "Use blocks/straps / 使用砖块/带子。" },
         { title: "私教销售 / Private Sales", scenario: "Pitch 1-on-1 / 推销私教。" },
         { title: "课程编排 / Sequencing", scenario: "Plan flow / 设计流程。" },
         { title: "在线教学 / Online Class", scenario: "Check audio/video / 检查音视频。" },
         { title: "健康建议 / Wellness", scenario: "Advise on lifestyle / 建议生活方式。" }
      ]
    },
    {
      name: "苹果门店专家 (B1-B2) / Apple Specialist",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "需求探寻 / Probing", scenario: "Ask usage habits / 询问使用习惯。" },
         { title: "功能演示 / Demo", scenario: "Show new features / 展示新功能。" },
         { title: "对比机型 / Comparison", scenario: "Compare models / 对比机型。" },
         { title: "技术支持 / Genius Bar", scenario: "Troubleshoot issues / 排查问题。" },
         { title: "配件推荐 / Accessories", scenario: "Suggest cases / 推荐保护壳。" },
         { title: "结账流程 / Checkout", scenario: "Process EasyPay / 处理支付。" },
         { title: "以旧换新 / Trade-in", scenario: "Assess value / 评估价值。" },
         { title: "数据迁移 / Data Transfer", scenario: "Help setup / 协助设置。" },
         { title: "保修服务 / AppleCare", scenario: "Explain coverage / 解释覆盖范围。" },
         { title: "课程预约 / Today at Apple", scenario: "Sign up session / 报名课程。" },
         { title: "库存检查 / Stock", scenario: "Check availability / 检查库存。" },
         { title: "商务采购 / Business Team", scenario: "Refer to business / 转接商务组。" }
      ]
    },
    {
      name: "质检员 (B1-B2) / QA Inspector",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "标准核对 / Spec Check", scenario: "Measure dimensions / 测量尺寸。" },
         { title: "缺陷报告 / Defect Report", scenario: "Describe issues / 描述问题。" },
         { title: "流程检查 / Process Audit", scenario: "Check steps / 检查步骤。" },
         { title: "样品测试 / Sample Testing", scenario: "Run tests / 进行测试。" },
         { title: "放行确认 / Release", scenario: "Sign off goods / 签署放行。" },
         { title: "沟通工厂 / Factory Comm", scenario: "Explain rework / 解释返工。" },
         { title: "数据记录 / Data Entry", scenario: "Log findings / 记录发现。" },
         { title: "仪器校准 / Calibration", scenario: "Check tools / 检查工具。" },
         { title: "安全检查 / Safety Check", scenario: "Verify PPE / 核实PPE。" },
         { title: "客户验货 / Customer QC", scenario: "Assist inspector / 协助验货员。" },
         { title: "根本原因 / Root Cause", scenario: "Analyze failure / 分析失效。" },
         { title: "改进建议 / Improvements", scenario: "Suggest fixes / 建议改进。" }
      ]
    },
    {
      name: "兽医 (B1-B2) / Veterinarian",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "病史询问 / History Taking", scenario: "Ask owner about diet / 询问主人饮食。" },
         { title: "身体检查 / Physical Exam", scenario: "Check vitals / 检查生命体征。" },
         { title: "诊断解释 / Diagnosis", scenario: "Explain lab results / 解释化验结果。" },
         { title: "用药指导 / Medication", scenario: "Explain dosage / 解释剂量。" },
         { title: "手术同意 / Surgery Consent", scenario: "Discuss risks / 讨论风险。" },
         { title: "安乐死沟通 / Euthanasia", scenario: "Show empathy / 表达同理心。" },
         { title: "疫苗接种 / Vaccination", scenario: "Explain schedule / 解释接种计划。" },
         { title: "寄生虫防治 / Parasite Control", scenario: "Recommend flea prevention / 推荐跳蚤防治。" },
         { title: "行为咨询 / Behavior", scenario: "Address aggression / 解决攻击性问题。" },
         { title: "营养建议 / Nutrition", scenario: "Recommend pet food / 推荐宠物食品。" },
         { title: "急救处理 / Emergency", scenario: "Treat poisoning / 治疗中毒。" },
         { title: "出院医嘱 / Discharge", scenario: "Explain home monitoring / 解释居家观察。" }
      ]
    },
    {
      name: "摄影师 (B1-B2) / Photographer",
      minLevel: CEFRLevel.B1,
      directions: [LearningDirection.Business],
      topics: [
         { title: "客户沟通 / Client Comm", scenario: "Discuss mood board / 讨论情绪板。" },
         { title: "模特指导 / Directing Models", scenario: "Give clear instructions / 给予清晰指令。" },
         { title: "器材设置 / Gear Setup", scenario: "Explain lighting choices / 解释布光选择。" },
         { title: "后期修图 / Retouching", scenario: "Take feedback on edits / 接受修图反馈。" },
         { title: "场地协调 / Location", scenario: "Manage shooting spot / 管理拍摄地。" },
         { title: "合同报价 / Contracts", scenario: "Negotiate usage rights / 谈判使用权。" },
         { title: "作品集展示 / Portfolio", scenario: "Present past work / 展示过往作品。" },
         { title: "风格讨论 / Style", scenario: "Define visual style / 定义视觉风格。" },
         { title: "日程安排 / Scheduling", scenario: "Coordinate shoot dates / 协调拍摄日期。" },
         { title: "交付流程 / Delivery", scenario: "Send high-res files / 发送高清文件。" },
         { title: "现场故障 / Troubleshooting", scenario: "Fix camera issues / 解决相机问题。" },
         { title: "助手管理 / Assistant Mgmt", scenario: "Direct assistants / 指挥助手。" }
      ]
    }
  ]
};