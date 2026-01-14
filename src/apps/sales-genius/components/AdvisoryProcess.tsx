
import React, { useState, useRef, useEffect } from 'react';
import { ProductType, ChatMessage, MessageRole } from '../types';
import { sendMessageToGemini } from '../services/gemini';
import { 
  ClipboardList, 
  Target, 
  AlertTriangle, 
  Lightbulb, 
  ArrowRight, 
  CheckCircle2, 
  BrainCircuit, 
  Flag,
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Bot,
  Building2,
  ShieldCheck,
  Scale,
  Star,
  Search,
  Users,
  Timer,
  TrendingUp,
  Coins,
  RefreshCw,
  Snowflake,
  UserPlus,
  Briefcase,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type ProcessStage = 'first_half' | 'second_half' | 'contract_guarantee';

interface ProcessItem {
  id: string;
  category: string;
  question: string;
  purpose: string;
  pitfall: string;
  isOptional?: boolean; 
}

// ... (KEEP ALL CONSTANT ARRAYS SAME AS BEFORE, JUST RERENDERING COMPONENT)
// ==========================================
// 1. 成人英语 (Adult) - 专家深度诊断版
// ==========================================
const ADULT_FIRST_HALF: ProcessItem[] = [
  {
    id: 'a1',
    category: '破冰与来源',
    question: '您是朋友介绍还是通过网络搜索了解到我们的？(如果是转介绍，具体是哪位朋友？)',
    purpose: '【定性信任度】借信任背书快速推进。转介绍客户成交率通常高3倍，需借此话题拉近距离。',
    pitfall: '❌ 冷冰冰。✅ 引导：“他是在我们这里学得不错才推荐您来的吧？”',
    isOptional: false
  },
  {
    id: 'a_urgency',
    category: '决策紧迫性 (Why Now?)',
    question: '英语提升您肯定想了很久了，为什么选在这个时间点过来咨询？是有什么猎头机会、项目截止日期，还是今年必须完成的OKR？',
    purpose: '【挖掘时间锚点】没有紧迫感的客户只会“看看”。必须找到那个触发他今天进门的“爆发点”。',
    pitfall: '❌ 接受“就是想学学”这种敷衍回答。✅ 必须深挖：“如果今年不学，对您的职业规划会有什么具体的负面影响吗？”',
    isOptional: false
  },
  {
    id: 'a2',
    category: '痛点场景化 (Pain Points)',
    question: '在涉外沟通中，哪个具体的瞬间让您最有“无力感”？(是发不出邮件、听不懂外籍老板的冷幽默，还是开会不敢插话？)',
    purpose: '【唤醒痛苦记忆】让客户自己说出具体的尴尬场景，顾问记录这些“关键词”，方案展示时精准回击。',
    pitfall: '❌ 只聊级别。✅ 聊场景：“想象一下，如果您下周开会能流利反驳对方，感觉会如何？”',
    isOptional: false
  },
  {
    id: 'a_past_fail',
    category: '过往失败经验',
    question: '您之前尝试过哪些学习方式？为什么之前没能坚持下来？是方法不对，还是环境不够纯粹？',
    purpose: '【找准痛点】分析客户的“学习基因”。如果是没恒心，后面要推“高强度面授+顾问带学”。',
    pitfall: '❌ 简单跳过。✅ 深度剖析：“如果方法不改变，之前的失败还会重演，对吗？”',
    isOptional: false
  },
  {
    id: 'a_self_study',
    category: '自学/沉没成本 (Cost of Failure)',
    question: '您之前尝试过自学吗？如果自学每天1小时有效的话，您现在应该已经是专家了。您觉得过去这段时间“自学无效”的核心阻碍是什么？',
    purpose: '【否定替代方案】让客户意识到“时间才是最贵的成本”。自学省了钱，但丢了机会。',
    pitfall: '❌ 批评客户。✅ 共情：“自学确实很难，必须要有真人反馈。”',
    isOptional: false
  },
  {
    id: 'a_priority',
    category: '核心决策要素',
    question: '在上海这么多机构里，您最看重哪一点？是老师的背景、离家/公司的距离、还是合同保障的安全性？',
    purpose: '【识别决策权重】锁定客户最关心的前两名权重，精准打击。',
    pitfall: '❌ 眉毛胡子一把抓。✅ 针对权重进行重点方案设计。',
    isOptional: false
  },
  {
    id: 'a4',
    category: '隐性价格试探',
    question: '为了帮您匹配最优方案，想确认下您的倾向：您是希望通过“高频集训”在短时间内彻底解决战斗（预算略高），还是“长期陪跑”作为一种生活方式？',
    purpose: '【预算摸底】不谈价格谈“学习节奏”。选“彻底解决”的通常是高潜客。',
    pitfall: '❌ 直接问预算。✅ 包装成“学习模式”的选择。',
    isOptional: false
  }
];

// ... (Skipping repeated constants for brevity in this output, but assume they exist in full file content)
// In a real update, I would include all constant arrays here. 
// For this response, I will include the other arrays to ensure valid file.

const CORPORATE_FIRST_HALF: ProcessItem[] = [
  {
    id: 'c_driver',
    category: '商业目标 (Business Driver)',
    question: '这次培训的核心业务驱动力是什么？是因为有海外并购、外派项目受阻，还是单纯的年度福利预算消耗？',
    purpose: '【区分刚需】解决“业务痛点”的项目预算通常是“福利项目”的3倍。必须找到痛点背后的商业损失。',
    pitfall: '❌ 只聊英语。✅ 聊业务：“如果员工英语上不去，会对这个海外项目造成多大延误？”',
    isOptional: false
  },
  {
    id: 'c_stakeholders',
    category: '决策链谱系 (Stakeholder Map)',
    question: '除了您这边把关，咱们内部还有哪些部门会参与决策？业务部门负责人(Line Manager)会介入试听吗？最终是采购部还是HRD定标？',
    purpose: '【锁定关键人】HR通常只是“信息收集者”。必须找出有“一票否决权”和“预算审批权”的人。',
    pitfall: '❌ 只跟HR聊到底。✅ 申请：“为了方案精准，我能跟业务负责人简单通个电话吗？”',
    isOptional: false
  },
  {
    id: 'c_pain_provider',
    category: '供应商痛点 (Vendor Pain)',
    question: '贵司之前合作过的供应商，最大的槽点是什么？是派师不稳定、发票流程慢、还是服务报告太敷衍？',
    purpose: '【竞品防御】B2B采购最怕麻烦。找出前任的错，就是我们上位的机会。',
    pitfall: '❌ 泛泛而谈。✅ 承诺：“我们会在合同SLA里明确对这些问题的惩罚机制。”',
    isOptional: false
  },
  {
    id: 'c_audience_mix',
    category: '学员分层与动力',
    question: '参训员工的职级跨度大吗？是全员强制参加，还是选拔制？（如果是强制，如何保证出勤率？）',
    purpose: '【预警实施难度】强制培训通常出勤率极差。需提前推销“助教督学服务”和“线上混合学习”。',
    pitfall: '❌ 默认员工都爱学。✅ 建议：“我们需要设计一套积分激励机制。”',
    isOptional: true
  },
  {
    id: 'c_budget_cycle',
    category: '预算与周期 (Budget Cycle)',
    question: '这笔预算是归属于2024财年还是2025？咱们内部的采购审批流程（立项-比价-合同-打款）通常需要多久？',
    purpose: '【预测成交时间】B2B流程极长。如果不问清楚，可能会错过年底封账期。',
    pitfall: '❌ 不好意思问钱。✅ 必须问：“为了配合咱们财务流程，我需要什么时候把发票给到？”',
    isOptional: false
  }
];

const KIDS_FIRST_HALF: ProcessItem[] = [
  {
    id: 'k_path',
    category: '教育路径规划 (Education Path)',
    question: '关于宝贝未来的升学，咱们大方向是走体制内中高考（拼分数），还是有计划转轨双语/国际学校（拼能力）？',
    purpose: '【定性产品线】体制内推“应试技巧+剑桥考级”；国际部推“原版阅读+批判性思维”。方向错了全盘皆输。',
    pitfall: '❌ 只有一套话术。✅ 展现对上海升学政策的专业度（如三公、插班考）。',
    isOptional: false
  },
  {
    id: 'k_anxiety',
    category: '隐性焦虑挖掘 (Parental Anxiety)',
    question: '在学校里，老师有没有反馈过宝贝英语具体哪里薄弱？或者您在和其他家长交流时，有没有觉得宝贝在口语或阅读量上已经有点“掉队”了？',
    purpose: '【制造同侪压力】家长最怕的不是学不好，而是“比别人差”。',
    pitfall: '❌ 贩卖焦虑过头。✅ 适度提醒：“现在小学词汇量要求确实比我们当年高多了。”',
    isOptional: false
  },
  {
    id: 'k_habit',
    category: '家庭辅导现状',
    question: '平时在家是谁负责盯宝贝学习？您在辅导英语时，会不会觉得发音拿不准，或者孩子坐不住、甚至引发亲子冲突？',
    purpose: '【解放家长】卖点是“专业的事情交给专业的人”，我们卖的是家长的“自由时间”和“母慈子孝”。',
    pitfall: '❌ 质疑家长能力。✅ 共情：“下班那么累还要教英语，确实太辛苦了。”',
    isOptional: false
  },
  {
    id: 'k_interest',
    category: '兴趣与性格',
    question: '宝贝性格是偏外向爱表达，还是慢热型？之前有没有因为老师太严厉而排斥英语的情况？',
    purpose: '【师资匹配】慢热孩子需要“鼓励型”老师；调皮孩子需要“控场型”老师。',
    pitfall: '❌ 忽略孩子感受。✅ 承诺：“我们会安排最懂他性格的老师。”',
    isOptional: true
  },
  {
    id: 'k_result',
    category: '结果外化预期',
    question: '您希望短期内看到什么样的效果？是校内考试满分，还是能甚至能和外教流利聊上10分钟？',
    purpose: '【管理预期】避免后期客诉。家长往往既要分数又要口语。',
    pitfall: '❌ 全口答应。✅ 拆解目标：“前3个月先建立自信，后3个月抓成绩。”',
    isOptional: false
  }
];

const EXAM_FIRST_HALF: ProcessItem[] = [
  {
    id: 'e_timeline',
    category: '时间线倒推 (Timeline)',
    question: '您计划申请哪个国家的学校？Dream School对语言成绩的死线（Deadline）具体是几月几号？如果不配语言班，咱们最晚什么时候要拿到分？',
    purpose: '【建立紧迫感】考试培训卖的就是“时间”。Deadine是第一生产力。',
    pitfall: '❌ 不问截止日期。✅ 拿出日历帮客户倒推：“除去复习和出分时间，您现在只剩X周了。”',
    isOptional: false
  },
  {
    id: 'e_diagnosis',
    category: '技术性诊断 (Technical Diagnosis)',
    question: '目前的实考分或模考分是多少？听说读写四科里，哪一科是最大的“拦路虎”？是词汇量不够，还是逻辑展开有问题？',
    purpose: '【建立专家形象】不要只问总分。问单科、问题型、问错误模式。',
    pitfall: '❌ 像查户口。✅ 像医生问诊：“听力是跟不上语速，还是听懂了记不下来？”',
    isOptional: false
  },
  {
    id: 'e_cost',
    category: '沉没成本与风险',
    question: '如果这次考不出分，会导致您Gap一年吗？Gap一年的房租、学费涨幅、以及晚一年工作的薪资损失，您算过这笔账吗？',
    purpose: '【放大痛苦】几万块的学费 vs 几十万的Gap成本。让客户觉得报班是“止损”。',
    pitfall: '❌ 纠结课时费。✅ 升维思考，谈人生规划的成本。',
    isOptional: false
  },
  {
    id: 'e_method',
    category: '过往方法复盘',
    question: '之前是自学还是报过大班？为什么那个时候没有提分？是老师讲得太泛，还是课后没人盯着练？',
    purpose: '【差异化切入】如果之前是大班没效果，现在就推“VIP针对性强”；如果自学没自律，就推“督导盯人”。',
    pitfall: '❌ 攻击同行。✅ 分析模式弊端：“大班课照顾不到您的具体弱项。”',
    isOptional: false
  },
  {
    id: 'e_target',
    category: '目标拆解',
    question: '您现在的目标分是X分，目前差距是Y分。您觉得靠自己每天背单词，能在1个月内填补这个差距吗？',
    purpose: '【否定自学】用数据证明自学效率无法满足Deadline要求。',
    pitfall: '❌ 说自学没用。✅ 说自学“来不及”。',
    isOptional: true
  }
];

const B2C_SECOND_HALF: ProcessItem[] = [
  {
    id: 's1',
    category: '方案锚定 (The Choice)',
    question: '根据您的诊断结果，我为您匹配了两套路径：A方案是“极速突破”适合您这种有死线的需求；B方案是“稳扎稳打”。您更倾向哪一种？',
    purpose: '【二选一成交】把“买不买”变成“买哪个”。',
    pitfall: '❌ 只给一个方案。✅ 给两个，其中一个明显更契合需求。',
    isOptional: false
  },
  {
    id: 's_finance',
    category: '月付/分期博弈 (Financial)',
    question: '客户问：“能不能按月付款？一次性付清压力太大。” (请放弃“月付你会坚持不下来”这种缺乏同理心的说教)',
    purpose: '【焦点转移 & 资源锁定】1. 真诚共情：先认可资金压力是正常的。2. 转移焦点（核心）：从“钱”转移到“资源独占性”。解释预付是为了帮学生锁定好老师的档期（稀缺资源不接受不稳定预订），是为了保障效果而非仅仅为了收费。3. 解决方案：最后再提出信用卡/第三方免息分期，作为解决现金流的工具，而非降低承诺的手段。',
    pitfall: '❌ 直接怼“月付你会放弃”。✅ 引导：“教育和健身房不同，健身房赌你不来，而我们必须对结果负责。预付是双方的契约，我给您留好老师，您给自己立个Flag。”',
    isOptional: false
  },
  {
    id: 's_family',
    category: '家人决策排雷 (Family Support)',
    question: '您刚才提到的方案，您爱人/家里人会支持您吗？特别是每周要抽出这么长时间来上课，家里的分工和时间能协调好吗？',
    purpose: '【预处理异议】这是“回家商量”的最大雷区。必须确认客户是否有独立决策权，或提前帮他想好说服家人的理由。',
    pitfall: '❌ 简单认为客户能定。✅ 挖掘：“如果家里人反对，您会因为他们的意见而放弃这次提升机会吗？”',
    isOptional: false
  },
  {
    id: 's_elimination',
    category: '“再考虑”排除法',
    question: '您说要考虑一下，我非常尊重。但为了帮您客观决策，咱们做个排除法：是觉得方案不能解决您的痛点？还是上课时间不方便？如果都不是，那主要还是预算方面需要再调整？',
    purpose: '【逼出真实异议】通过排除法锁定真正的抗拒点（预算、效果、时间）。',
    pitfall: '❌ 轻易放走客户。✅ 把犹豫拆解成具体的、可解决的问题。',
    isOptional: false
  },
  {
    id: 's_competitor',
    category: '同行对比 (Why ME?)',
    question: '您之前肯定也对比过其他机构，坦白说，您觉得ME最吸引您的点是什么？还有哪个点是您觉得其他家做得更好、让您还在犹豫的？',
    purpose: '【寻找差异化抓手】让客户自己说出我们的优点，自我说服。',
    pitfall: '❌ 主动攻击同行。✅ 倾听并利用客户的反馈进行价值回扣。',
    isOptional: true
  },
  {
    id: 's_risk_reversal',
    category: '风险逆转 (Risk Reversal)',
    question: '如果您是担心效果，别忘了我们合同里白纸黑字的“教学质量对赌”条款。如果您没效果，我们要赔付课时。我们比您更害怕您学不好，对吗？',
    purpose: '【消除最后防御】用机构的合同背书转移风险。',
    pitfall: '❌ 口头承诺。✅ 翻开合同相关页并指给客户看。',
    isOptional: false
  },
  {
    id: 's4',
    category: '确认成交动作',
    question: '既然方案和保障都清楚了，咱们今天先把名额锁定。您看是用支付宝还是扫这个二维码更方便？',
    purpose: '【临门一脚】动作要自然。',
    pitfall: '❌ 询问“您要不要报”。✅ 询问“怎么付”。',
    isOptional: false
  }
];

const B2B_SECOND_HALF: ProcessItem[] = [
  {
    id: 'b2b_demo',
    category: '试听/演示 (Demo)',
    question: '针对贵司的情况，我们建议先安排一场针对核心员工的“测评+体验课”，让业务部门负责人直接感受我们的教学质量，您觉得下周二或周四哪个时间方便？',
    purpose: '【体验营销】B2B决策周期长，必须用低成本的“体验”来建立信任，推动下一轮决策。',
    pitfall: '❌ 直接扔方案。✅ 约演示，见关键人。',
    isOptional: false
  },
  {
    id: 'b2b_proposal',
    category: '定制化方案提交',
    question: '我会在方案中重点体现“行业术语定制”和“考勤月报制度”，这是否涵盖了您之前提到的所有顾虑？还有什么KPI是需要在合同里特别注明的？',
    purpose: '【专业度展示】展示我们在B端服务的规范性，解决HR的免责需求。',
    pitfall: '❌ 通用模板。✅ 强调“行业定制”和“服务SLA”。',
    isOptional: false
  },
  {
    id: 'b2b_close',
    category: '采购流程推进',
    question: '如果方案通过，咱们内部走合同审批和财务付款大概需要多久？需要我们配合提供哪些资质文件或入库资料？',
    purpose: '【协助流程】预估回款周期，主动协助客户处理繁琐的内部流程。',
    pitfall: '❌ 等客户通知。✅ 主动推着流程走。',
    isOptional: false
  }
];

const CONTRACT_GUARANTEES: ProcessItem[] = [
  {
    id: 'g1',
    category: '1V1 教学质量对赌',
    question: '合同承诺：如果有证据表明教学质量不达标（如无反馈、讲义缺失），该课时免费重补。',
    purpose: '【极致自信】敢赔付代表质量管控极严，建立顶级专业形象。',
    pitfall: '❌ 讲退费。✅ 讲质量保证及追责机制。',
    isOptional: false
  },
  {
    id: 'g_freeze',
    category: '免费冻结/停读权利',
    question: '合同明确：针对出差、加班等不可控因素，支持每年至少1-3个月的免费冻结期，课时永不过期（在有效期内可自由延期）。',
    purpose: '【消除时间顾虑】针对上海职场精英，解决“买了课没空上”的恐惧。',
    pitfall: '❌ 含糊其辞。✅ 明确冻结流程，给客户一颗定心丸。',
    isOptional: false
  },
  {
    id: 'g2',
    category: '全上海直营通读',
    question: '全上海8大直营校区（徐汇、静安、世纪大道、前滩、闵行、长宁、青浦、嘉定）标准统一，可凭合同免费转读，无缝衔接。',
    purpose: '【规模优势】消除客户因工作/居住变动导致的学费损失担忧。',
    pitfall: '❌ 忽略地点变动。✅ 强调品牌稳定性和全城覆盖力。',
    isOptional: false
  },
  {
    id: 'g3',
    category: '师资稳定性保障',
    question: '拒绝频繁换老师。非不可抗力因素（如离职）频繁缺勤，我们额外赔偿课时。',
    purpose: '【解决行业通病】彻底消除客户对“好老师留不住”的恐惧。',
    pitfall: '❌ 谈概率。✅ 谈硬性惩罚机制。',
    isOptional: false
  },
  {
    id: 'g4',
    category: '退费承诺与价格透明',
    question: '合同清晰规定退费比例及核算公式。所有价格公开透明，无任何隐形消费。',
    purpose: '【建立安全感】透明化是高端机构的标志。',
    pitfall: '❌ 避而不谈。✅ 大方展示，展现契约精神。',
    isOptional: false
  }
];

export const AdvisoryProcess: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(ProductType.ADULT);
  const [stage, setStage] = useState<ProcessStage>('first_half');
  const [activeQuestion, setActiveQuestion] = useState<ProcessItem | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getCurrentItems = () => {
    if (stage === 'contract_guarantee') return CONTRACT_GUARANTEES;
    
    // Different logic for Second Half based on B2B vs B2C
    if (stage === 'second_half') {
       if (selectedProduct === ProductType.CORPORATE) {
         return B2B_SECOND_HALF;
       }
       return B2C_SECOND_HALF;
    }

    switch (selectedProduct) {
      case ProductType.CORPORATE: return CORPORATE_FIRST_HALF;
      case ProductType.KIDS: return KIDS_FIRST_HALF;
      case ProductType.EXAM: return EXAM_FIRST_HALF;
      default: return ADULT_FIRST_HALF;
    }
  };

  const currentItems = getCurrentItems();

  const handleOpenChat = (item: ProcessItem) => {
    setActiveQuestion(item);
    setChatMessages([{
      id: 'init',
      role: MessageRole.MODEL,
      text: `🤖 我是您的**${item.category}**环节辅助助手。\n\n针对这个专家问题，您可以告诉我**客户的具体回答**，我会为您生成回击话术。`
    }]);
    setChatInput('');
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeQuestion || isChatLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: MessageRole.USER, text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Updated prompt to enforce "Sincere, Client-Centric, Non-Preachy" logic
      const prompt = `
[角色]: 全球顶尖销售心理学导师 (兼具真诚与策略)。
[任务]: 针对顾问遇到的异议，生成直击人心的高情商回复。
[原则]: 
1. **真诚至上**: 严禁使用说教、攻击性或PUA式语言（如"你会放弃的"）。
2. **站在客户角度**: 先认可客户的困难（如资金压力），再从客户利益出发（如保障效果）。
3. **焦点转移策略**: 遇到价格/月付问题，先将焦点从"钱"转移到"资源独占性/服务承诺"上，最后再给金融方案。
[当前环节]: ${activeQuestion.category}
[专家问题]: ${activeQuestion.question}
[客户回答]: "${userMsg.text}"

请生成一段建议话术：
1. **🔍 心理透视**: 一句话分析客户现在的真实顾虑。
2. **🗣️ 金牌话术**: 具体的对话脚本（口语化、真诚）。
`;
      const response = await sendMessageToGemini({ message: prompt });
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: MessageRole.MODEL, text: response.text || "建议加载中..." }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: MessageRole.MODEL, text: "网络抖动，请重试。", isError: true }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row max-w-7xl mx-auto p-0 md:p-0 gap-6 relative overflow-hidden">
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${activeQuestion ? 'md:mr-[400px]' : 'w-full'}`}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 mb-4 md:mb-6 flex-shrink-0">
          <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="text-blue-600" /> ME 金牌顾问 SOP
              </h2>
              <p className="text-sm text-slate-500 mt-1">深度挖掘需求，精准打击异议，逻辑锁定成交。</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg self-start md:self-auto overflow-x-auto max-w-full scrollbar-hide">
               {Object.values(ProductType).map((type) => (
                  <button key={type} onClick={() => { setSelectedProduct(type); setStage('first_half'); }}
                    className={`px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${selectedProduct === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {type}
                  </button>
               ))}
            </div>
          </header>

          <div className="flex w-full bg-slate-100 rounded-xl p-1 relative overflow-hidden">
             <div className="absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 z-0"
               style={{ left: stage === 'first_half' ? '4px' : stage === 'second_half' ? 'calc(33.33% + 4px)' : 'calc(66.66% + 4px)' }}></div>
             <button onClick={() => setStage('first_half')} className={`flex-1 relative z-10 py-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 ${stage === 'first_half' ? 'text-blue-700' : 'text-slate-500'}`}>
               <BrainCircuit size={16} /> <span>上半场<span className="hidden md:inline">:诊断挖需</span></span>
             </button>
             <button onClick={() => setStage('second_half')} className={`flex-1 relative z-10 py-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 ${stage === 'second_half' ? 'text-green-700' : 'text-slate-500'}`}>
               <Flag size={16} /> <span>下半场<span className="hidden md:inline">:逻辑成交</span></span>
             </button>
             <button onClick={() => setStage('contract_guarantee')} className={`flex-1 relative z-10 py-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 ${stage === 'contract_guarantee' ? 'text-purple-700' : 'text-slate-500'}`}>
               <ShieldCheck size={16} /> <span>保障<span className="hidden md:inline">内容</span></span>
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-20 pr-1 md:pr-2">
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1 flex justify-between items-center">
             <span>{stage === 'contract_guarantee' ? 'ME 独家契约保障' : (selectedProduct === ProductType.CORPORATE && stage === 'second_half' ? 'B2B 采购与提案流程' : '专家诊断与话术标准')}</span>
             {stage !== 'contract_guarantee' && (
                <div className="hidden md:flex gap-4">
                  <span className="flex items-center gap-1 text-red-600"><Star size={12} fill="currentColor"/> 核心必问</span>
                  <span className="flex items-center gap-1 text-blue-600"><Search size={12}/> 深度选问</span>
                </div>
             )}
           </div>

           {currentItems.map((item) => (
              <div key={item.id} className={`bg-white rounded-xl shadow-sm border transition-all duration-200 group relative overflow-hidden ${activeQuestion?.id === item.id ? (stage === 'contract_guarantee' ? 'border-purple-400 ring-2 ring-purple-100' : 'border-blue-400 ring-2 ring-blue-100') : 'border-slate-200 hover:shadow-md'}`}>
                 <div className={`absolute left-0 top-0 bottom-0 w-1 ${stage === 'contract_guarantee' ? 'bg-purple-500' : (item.isOptional ? 'bg-blue-400' : 'bg-red-500')}`}></div>
                 <div className="p-3 md:p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center pl-4 md:pl-5">
                    <div className="flex items-center gap-3">
                       <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wide whitespace-nowrap ${stage === 'contract_guarantee' ? 'bg-purple-100 text-purple-700' : (item.isOptional ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')}`}>
                         {stage === 'contract_guarantee' ? '权益条款' : (item.isOptional ? '选问' : '必问')}
                       </span>
                       <span className="font-bold text-slate-700 text-sm truncate max-w-[150px] md:max-w-none">{item.category}</span>
                    </div>
                    <button onClick={() => handleOpenChat(item)} className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${activeQuestion?.id === item.id ? (stage === 'contract_guarantee' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white') : (stage === 'contract_guarantee' ? 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50')}`}>
                      {activeQuestion?.id === item.id ? <Bot size={14}/> : <Sparkles size={14}/>} <span className="hidden md:inline">AI 话术锦囊</span>
                    </button>
                 </div>
                 <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 pl-4 md:pl-5">
                    <div className="md:col-span-5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                          {stage === 'contract_guarantee' ? <Scale size={12}/> : <Target size={12}/>} {stage === 'contract_guarantee' ? '保障内容' : '标准话术'}
                       </label>
                       <p className="text-sm md:text-base font-medium text-slate-800 leading-relaxed">{item.question}</p>
                    </div>
                    <div className={`md:col-span-4 p-3 rounded-lg border ${stage === 'contract_guarantee' ? 'bg-purple-50 border-purple-100' : 'bg-blue-50 border-blue-100'}`}>
                       <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block flex items-center gap-1 ${stage === 'contract_guarantee' ? 'text-purple-600' : 'text-blue-600'}`}>
                          <Lightbulb size={12}/> 核心目的
                       </label>
                       <p className="text-xs text-slate-600 leading-relaxed">{item.purpose}</p>
                    </div>
                    <div className="md:col-span-3 bg-red-50 p-3 rounded-lg border border-red-100">
                       <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1 block flex items-center gap-1">
                          <AlertTriangle size={12}/> 专家避坑
                       </label>
                       <p className="text-xs text-slate-600 leading-relaxed">{item.pitfall}</p>
                    </div>
                 </div>
              </div>
           ))}

           <div className="mt-8 flex justify-center gap-4 pb-10">
              {stage === 'first_half' ? (
                <button onClick={() => setStage('second_half')} className="bg-slate-900 text-white px-6 md:px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-slate-800 shadow-xl transition-all text-sm md:text-base">
                   进入逻辑成交 <ArrowRight size={18}/>
                </button>
              ) : stage === 'second_half' ? (
                <button onClick={() => setStage('contract_guarantee')} className="bg-purple-600 text-white px-6 md:px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-purple-700 shadow-xl transition-all text-sm md:text-base">
                   <ShieldCheck size={18}/> 合同对赌保障
                </button>
              ) : (
                <button onClick={() => setStage('first_half')} className="bg-white text-slate-600 border border-slate-200 px-6 md:px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-slate-50 transition-all text-sm md:text-base">
                   <RefreshCw size={18}/> 返回第一阶段
                </button>
              )}
           </div>
        </div>
      </div>

      {/* CHAT SIDEBAR (RIGHT SLIDER) */}
      {activeQuestion && (
        <>
            {/* Backdrop for mobile */}
            <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setActiveQuestion(null)}></div>
            <div className="fixed inset-y-0 right-0 w-[90%] md:w-[400px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 transition-all duration-300 transform translate-x-0">
            <div className={`p-4 flex justify-between items-center text-white ${stage === 'contract_guarantee' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                <div className="flex items-center gap-2">
                    <Bot size={20} className="text-yellow-300"/>
                    <div className="text-xs">
                    <p className="font-bold opacity-80 uppercase tracking-widest">AI Expert Advisor</p>
                    <p className="font-medium truncate max-w-[200px]">{activeQuestion.category}</p>
                    </div>
                </div>
                <button onClick={() => setActiveQuestion(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${msg.role === MessageRole.USER ? (stage === 'contract_guarantee' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-blue-600 text-white rounded-br-none') : 'bg-white border border-slate-200 rounded-bl-none text-slate-800'}`}>
                        <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-1 prose-strong:text-blue-700">{msg.text}</ReactMarkdown>
                    </div>
                    </div>
                ))}
                {isChatLoading && <div className="text-xs text-slate-400 flex items-center gap-2 ml-2"><Loader2 className="animate-spin w-3 h-3"/> 导师分析建议中...</div>}
                <div ref={chatEndRef}/>
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
                <div className="relative">
                    <textarea 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                    placeholder="输入客户真实的反馈..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pr-12 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-24 resize-none shadow-inner"
                    />
                    <button 
                    onClick={handleSendChat} 
                    disabled={!chatInput.trim() || isChatLoading} 
                    className={`absolute right-2 bottom-2 p-2 rounded-lg text-white transition-all active:scale-95 ${stage === 'contract_guarantee' ? 'bg-purple-600' : 'bg-blue-600'} disabled:opacity-50`}
                    >
                    <Send size={18}/>
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">输入越详细，AI 给出的针对性话术越精准</p>
            </div>
            </div>
        </>
      )}
    </div>
  );
};
