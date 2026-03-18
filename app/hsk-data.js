// ═══════════════════════════════════════════════════════════
// HSK DATA — All 6 Levels
// Test version: 25–30 words per level, expandable structure
// ═══════════════════════════════════════════════════════════

export const HSK = {

  // ─────────────────────────────────────────────────────────
  // HSK 1 — Beginner (~150 total words, 30 here)
  // ─────────────────────────────────────────────────────────
  1: {
    meta: {
      level: 1,
      label: "HSK 1",
      description: "Beginner",
      emoji: "🌱",
      totalLessons: 30,
      color: "#4ade80",
    },
    words: [
      // ── Greetings
      {
        hanzi: "你好",
        pinyin: "nǐ hǎo",
        meaning: "Hello",
        example: {
          chinese: "你好！很高兴见到你。",
          pinyin: "Nǐ hǎo! Hěn gāoxìng jiàn dào nǐ.",
          translation: "Hello! Nice to meet you.",
        },
      },
      {
        hanzi: "再见",
        pinyin: "zài jiàn",
        meaning: "Goodbye",
        example: {
          chinese: "再见，明天见！",
          pinyin: "Zài jiàn, míngtiān jiàn!",
          translation: "Goodbye, see you tomorrow!",
        },
      },
      {
        hanzi: "谢谢",
        pinyin: "xiè xie",
        meaning: "Thank you",
        example: {
          chinese: "谢谢你的帮助！",
          pinyin: "Xiè xie nǐ de bāngzhù!",
          translation: "Thank you for your help!",
        },
      },
      {
        hanzi: "对不起",
        pinyin: "duì bu qǐ",
        meaning: "Sorry",
        example: {
          chinese: "对不起，我来晚了。",
          pinyin: "Duì bu qǐ, wǒ lái wǎn le.",
          translation: "Sorry, I'm late.",
        },
      },
      {
        hanzi: "没关系",
        pinyin: "méi guān xi",
        meaning: "It's okay",
        example: {
          chinese: "没关系，不用担心。",
          pinyin: "Méi guān xi, bú yòng dānxīn.",
          translation: "It's okay, don't worry.",
        },
      },
      // ── Pronouns
      {
        hanzi: "我",
        pinyin: "wǒ",
        meaning: "I / Me",
        example: {
          chinese: "我是学生。",
          pinyin: "Wǒ shì xuésheng.",
          translation: "I am a student.",
        },
      },
      {
        hanzi: "你",
        pinyin: "nǐ",
        meaning: "You",
        example: {
          chinese: "你叫什么名字？",
          pinyin: "Nǐ jiào shénme míngzi?",
          translation: "What is your name?",
        },
      },
      {
        hanzi: "他",
        pinyin: "tā",
        meaning: "He / Him",
        example: {
          chinese: "他是我的朋友。",
          pinyin: "Tā shì wǒ de péngyǒu.",
          translation: "He is my friend.",
        },
      },
      {
        hanzi: "她",
        pinyin: "tā",
        meaning: "She / Her",
        example: {
          chinese: "她很漂亮。",
          pinyin: "Tā hěn piàoliang.",
          translation: "She is very beautiful.",
        },
      },
      {
        hanzi: "我们",
        pinyin: "wǒ men",
        meaning: "We / Us",
        example: {
          chinese: "我们一起去吧！",
          pinyin: "Wǒmen yìqǐ qù ba!",
          translation: "Let's go together!",
        },
      },
      // ── Core Verbs
      {
        hanzi: "是",
        pinyin: "shì",
        meaning: "To be / Is",
        example: {
          chinese: "我是老师。",
          pinyin: "Wǒ shì lǎoshī.",
          translation: "I am a teacher.",
        },
      },
      {
        hanzi: "不",
        pinyin: "bù",
        meaning: "No / Not",
        example: {
          chinese: "我不知道。",
          pinyin: "Wǒ bù zhīdào.",
          translation: "I don't know.",
        },
      },
      {
        hanzi: "有",
        pinyin: "yǒu",
        meaning: "To have",
        example: {
          chinese: "我有一只猫。",
          pinyin: "Wǒ yǒu yī zhī māo.",
          translation: "I have a cat.",
        },
      },
      {
        hanzi: "没有",
        pinyin: "méi yǒu",
        meaning: "Don't have / There is no",
        example: {
          chinese: "我没有时间。",
          pinyin: "Wǒ méi yǒu shíjiān.",
          translation: "I don't have time.",
        },
      },
      {
        hanzi: "好",
        pinyin: "hǎo",
        meaning: "Good",
        example: {
          chinese: "今天天气很好。",
          pinyin: "Jīntiān tiānqì hěn hǎo.",
          translation: "The weather is good today.",
        },
      },
      // ── Food & Drink
      {
        hanzi: "吃",
        pinyin: "chī",
        meaning: "To eat",
        example: {
          chinese: "我想吃饺子。",
          pinyin: "Wǒ xiǎng chī jiǎozi.",
          translation: "I want to eat dumplings.",
        },
      },
      {
        hanzi: "喝",
        pinyin: "hē",
        meaning: "To drink",
        example: {
          chinese: "我喜欢喝茶。",
          pinyin: "Wǒ xǐhuān hē chá.",
          translation: "I like to drink tea.",
        },
      },
      {
        hanzi: "水",
        pinyin: "shuǐ",
        meaning: "Water",
        example: {
          chinese: "请给我一杯水。",
          pinyin: "Qǐng gěi wǒ yī bēi shuǐ.",
          translation: "Please give me a glass of water.",
        },
      },
      {
        hanzi: "饭",
        pinyin: "fàn",
        meaning: "Rice / Meal",
        example: {
          chinese: "我们去吃饭吧。",
          pinyin: "Wǒmen qù chīfàn ba.",
          translation: "Let's go eat.",
        },
      },
      {
        hanzi: "好吃",
        pinyin: "hǎo chī",
        meaning: "Delicious",
        example: {
          chinese: "这个菜很好吃！",
          pinyin: "Zhège cài hěn hǎochī!",
          translation: "This dish is delicious!",
        },
      },
      // ── Movement & Location
      {
        hanzi: "去",
        pinyin: "qù",
        meaning: "To go",
        example: {
          chinese: "我想去北京。",
          pinyin: "Wǒ xiǎng qù Běijīng.",
          translation: "I want to go to Beijing.",
        },
      },
      {
        hanzi: "来",
        pinyin: "lái",
        meaning: "To come",
        example: {
          chinese: "请进来！",
          pinyin: "Qǐng jìn lái!",
          translation: "Please come in!",
        },
      },
      {
        hanzi: "在",
        pinyin: "zài",
        meaning: "At / In / Is at",
        example: {
          chinese: "我在家。",
          pinyin: "Wǒ zài jiā.",
          translation: "I am at home.",
        },
      },
      // ── Places
      {
        hanzi: "家",
        pinyin: "jiā",
        meaning: "Home / Family",
        example: {
          chinese: "我的家在上海。",
          pinyin: "Wǒ de jiā zài Shànghǎi.",
          translation: "My home is in Shanghai.",
        },
      },
      {
        hanzi: "学校",
        pinyin: "xuéxiào",
        meaning: "School",
        example: {
          chinese: "我每天去学校。",
          pinyin: "Wǒ měitiān qù xuéxiào.",
          translation: "I go to school every day.",
        },
      },
      // ── Numbers
      {
        hanzi: "一",
        pinyin: "yī",
        meaning: "One",
        example: {
          chinese: "我有一个苹果。",
          pinyin: "Wǒ yǒu yīgè píngguǒ.",
          translation: "I have one apple.",
        },
      },
      {
        hanzi: "两",
        pinyin: "liǎng",
        meaning: "Two",
        example: {
          chinese: "我买了两本书。",
          pinyin: "Wǒ mǎile liǎng běn shū.",
          translation: "I bought two books.",
        },
      },
      {
        hanzi: "三",
        pinyin: "sān",
        meaning: "Three",
        example: {
          chinese: "我有三个朋友。",
          pinyin: "Wǒ yǒu sān gè péngyǒu.",
          translation: "I have three friends.",
        },
      },
      // ── Time
      {
        hanzi: "今天",
        pinyin: "jīn tiān",
        meaning: "Today",
        example: {
          chinese: "今天是星期一。",
          pinyin: "Jīntiān shì xīngqīyī.",
          translation: "Today is Monday.",
        },
      },
      {
        hanzi: "明天",
        pinyin: "míng tiān",
        meaning: "Tomorrow",
        example: {
          chinese: "明天见！",
          pinyin: "Míngtiān jiàn!",
          translation: "See you tomorrow!",
        },
      },
    ],

    grammar: [
      {
        title: "Greeting with 你好",
        explanation:
          "你好 (nǐ hǎo) is the standard Mandarin greeting. Literally 'you good'. Reply the same way!",
        pattern: "你好！",
        translation: "Hello!",
        examples: [
          { chinese: "你好！很高兴见到你。", translation: "Hello! Nice to meet you." },
          { chinese: "老师，你好！", translation: "Hello, teacher!" },
        ],
      },
      {
        title: "The verb 是 (to be)",
        explanation:
          "是 (shì) connects a subject to its identity or role. It never changes form — no am/is/are variants.",
        pattern: "Subject + 是 + Noun",
        translation: "Subject is [noun]",
        examples: [
          { chinese: "我是老师。", translation: "I am a teacher." },
          { chinese: "她是学生。", translation: "She is a student." },
        ],
      },
      {
        title: "Negation with 不",
        explanation:
          "不 (bù) is placed directly before a verb or adjective to negate it. Consistent and simple!",
        pattern: "Subject + 不 + Verb/Adjective",
        translation: "Subject does not [verb]",
        examples: [
          { chinese: "我不知道。", translation: "I don't know." },
          { chinese: "他不去。", translation: "He's not going." },
        ],
      },
      {
        title: "Location with 在",
        explanation:
          "在 (zài) means 'to be at/in'. It shows where someone or something is located.",
        pattern: "Subject + 在 + Place",
        translation: "Subject is at [place]",
        examples: [
          { chinese: "我在学校。", translation: "I am at school." },
          { chinese: "他在家。", translation: "He is at home." },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // HSK 2 — Elementary (~300 total words, 25 here)
  // ─────────────────────────────────────────────────────────
  2: {
    meta: {
      level: 2,
      label: "HSK 2",
      description: "Elementary",
      emoji: "🌿",
      totalLessons: 40,
      color: "#60a5fa",
    },
    words: [
      {
        hanzi: "打电话",
        pinyin: "dǎ diànhuà",
        meaning: "To make a phone call",
        example: {
          chinese: "我要给妈妈打电话。",
          pinyin: "Wǒ yào gěi māma dǎ diànhuà.",
          translation: "I need to call my mom.",
        },
      },
      {
        hanzi: "看书",
        pinyin: "kàn shū",
        meaning: "To read a book",
        example: {
          chinese: "我喜欢在图书馆看书。",
          pinyin: "Wǒ xǐhuān zài túshūguǎn kàn shū.",
          translation: "I like reading books in the library.",
        },
      },
      {
        hanzi: "运动",
        pinyin: "yùn dòng",
        meaning: "Sports / Exercise",
        example: {
          chinese: "每天运动对身体很好。",
          pinyin: "Měitiān yùndòng duì shēntǐ hěn hǎo.",
          translation: "Exercising every day is great for your health.",
        },
      },
      {
        hanzi: "天气",
        pinyin: "tiān qì",
        meaning: "Weather",
        example: {
          chinese: "今天天气怎么样？",
          pinyin: "Jīntiān tiānqì zěnme yàng?",
          translation: "What's the weather like today?",
        },
      },
      {
        hanzi: "身体",
        pinyin: "shēn tǐ",
        meaning: "Body / Health",
        example: {
          chinese: "你身体好吗？",
          pinyin: "Nǐ shēntǐ hǎo ma?",
          translation: "Are you in good health?",
        },
      },
      {
        hanzi: "高兴",
        pinyin: "gāo xìng",
        meaning: "Happy / Glad",
        example: {
          chinese: "见到你我很高兴。",
          pinyin: "Jiàn dào nǐ wǒ hěn gāoxìng.",
          translation: "I'm very glad to see you.",
        },
      },
      {
        hanzi: "知道",
        pinyin: "zhī dào",
        meaning: "To know",
        example: {
          chinese: "你知道他在哪里吗？",
          pinyin: "Nǐ zhīdào tā zài nǎlǐ ma?",
          translation: "Do you know where he is?",
        },
      },
      {
        hanzi: "帮助",
        pinyin: "bāng zhù",
        meaning: "To help",
        example: {
          chinese: "谢谢你帮助我。",
          pinyin: "Xièxie nǐ bāngzhù wǒ.",
          translation: "Thank you for helping me.",
        },
      },
      {
        hanzi: "一起",
        pinyin: "yī qǐ",
        meaning: "Together",
        example: {
          chinese: "我们一起去吧！",
          pinyin: "Wǒmen yìqǐ qù ba!",
          translation: "Let's go together!",
        },
      },
      {
        hanzi: "觉得",
        pinyin: "jué de",
        meaning: "To feel / think",
        example: {
          chinese: "我觉得这个电影很好看。",
          pinyin: "Wǒ juéde zhège diànyǐng hěn hǎokàn.",
          translation: "I think this movie is great.",
        },
      },
      {
        hanzi: "颜色",
        pinyin: "yán sè",
        meaning: "Color",
        example: {
          chinese: "你喜欢什么颜色？",
          pinyin: "Nǐ xǐhuān shénme yánsè?",
          translation: "What color do you like?",
        },
      },
      {
        hanzi: "白",
        pinyin: "bái",
        meaning: "White",
        example: {
          chinese: "她穿着一件白色的衬衫。",
          pinyin: "Tā chuānzhe yī jiàn báisè de chènshān.",
          translation: "She is wearing a white shirt.",
        },
      },
      {
        hanzi: "红",
        pinyin: "hóng",
        meaning: "Red",
        example: {
          chinese: "苹果是红色的。",
          pinyin: "Píngguǒ shì hóngsè de.",
          translation: "Apples are red.",
        },
      },
      {
        hanzi: "每",
        pinyin: "měi",
        meaning: "Every / Each",
        example: {
          chinese: "我每天早上跑步。",
          pinyin: "Wǒ měitiān zǎoshang pǎobù.",
          translation: "I run every morning.",
        },
      },
      {
        hanzi: "从",
        pinyin: "cóng",
        meaning: "From",
        example: {
          chinese: "我从北京来。",
          pinyin: "Wǒ cóng Běijīng lái.",
          translation: "I'm from Beijing.",
        },
      },
      {
        hanzi: "旁边",
        pinyin: "páng biān",
        meaning: "Beside / Next to",
        example: {
          chinese: "银行在超市旁边。",
          pinyin: "Yínháng zài chāoshì pángbiān.",
          translation: "The bank is next to the supermarket.",
        },
      },
      {
        hanzi: "第一",
        pinyin: "dì yī",
        meaning: "First",
        example: {
          chinese: "他是第一名。",
          pinyin: "Tā shì dì yī míng.",
          translation: "He is first place.",
        },
      },
      {
        hanzi: "然后",
        pinyin: "rán hòu",
        meaning: "Then / After that",
        example: {
          chinese: "先吃饭，然后我们去看电影。",
          pinyin: "Xiān chīfàn, ránhòu wǒmen qù kàn diànyǐng.",
          translation: "First eat, then we'll go watch a movie.",
        },
      },
      {
        hanzi: "但是",
        pinyin: "dàn shì",
        meaning: "But / However",
        example: {
          chinese: "我喜欢跑步，但是今天太累了。",
          pinyin: "Wǒ xǐhuān pǎobù, dànshì jīntiān tài lèi le.",
          translation: "I like running, but I'm too tired today.",
        },
      },
      {
        hanzi: "因为",
        pinyin: "yīn wèi",
        meaning: "Because",
        example: {
          chinese: "我迟到了，因为堵车了。",
          pinyin: "Wǒ chídào le, yīnwèi dǔchē le.",
          translation: "I was late because of traffic.",
        },
      },
      {
        hanzi: "所以",
        pinyin: "suǒ yǐ",
        meaning: "So / Therefore",
        example: {
          chinese: "天气很冷，所以我穿了外套。",
          pinyin: "Tiānqì hěn lěng, suǒyǐ wǒ chuānle wàitào.",
          translation: "It's cold, so I wore a coat.",
        },
      },
      {
        hanzi: "如果",
        pinyin: "rú guǒ",
        meaning: "If",
        example: {
          chinese: "如果你来，请告诉我。",
          pinyin: "Rúguǒ nǐ lái, qǐng gàosu wǒ.",
          translation: "If you come, please let me know.",
        },
      },
      {
        hanzi: "已经",
        pinyin: "yǐ jīng",
        meaning: "Already",
        example: {
          chinese: "我已经吃饭了。",
          pinyin: "Wǒ yǐjīng chīfàn le.",
          translation: "I've already eaten.",
        },
      },
      {
        hanzi: "还",
        pinyin: "hái",
        meaning: "Still / Also / Yet",
        example: {
          chinese: "你还在吗？",
          pinyin: "Nǐ hái zài ma?",
          translation: "Are you still there?",
        },
      },
      {
        hanzi: "非常",
        pinyin: "fēi cháng",
        meaning: "Extremely / Very",
        example: {
          chinese: "这道菜非常好吃！",
          pinyin: "Zhè dào cài fēicháng hǎochī!",
          translation: "This dish is extremely delicious!",
        },
      },
    ],

    grammar: [
      {
        title: "Degree adverb 很 (very)",
        explanation:
          "很 (hěn) means 'very' and goes before adjectives. In Chinese, adjective predicates usually need 很 even without strong emphasis.",
        pattern: "Subject + 很 + Adjective",
        translation: "Subject is very [adjective]",
        examples: [
          { chinese: "她很漂亮。", translation: "She is very beautiful." },
          { chinese: "天气很好。", translation: "The weather is good." },
        ],
      },
      {
        title: "Question particle 吗",
        explanation:
          "Add 吗 (ma) to the end of any statement to turn it into a yes/no question. No word order changes needed!",
        pattern: "Statement + 吗？",
        translation: "Is it that [statement]?",
        examples: [
          { chinese: "你是老师吗？", translation: "Are you a teacher?" },
          { chinese: "他来吗？", translation: "Is he coming?" },
        ],
      },
      {
        title: "因为…所以 (because…so)",
        explanation:
          "This pair links cause and effect. 因为 introduces the reason, 所以 introduces the result.",
        pattern: "因为 + reason + 所以 + result",
        translation: "Because [reason], so [result]",
        examples: [
          { chinese: "因为下雨，所以我没去。", translation: "Because it rained, I didn't go." },
          { chinese: "因为她生病了，所以请假了。", translation: "Because she was sick, she took leave." },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // HSK 3 — Intermediate (~600 total words, 25 here)
  // ─────────────────────────────────────────────────────────
  3: {
    meta: {
      level: 3,
      label: "HSK 3",
      description: "Intermediate",
      emoji: "🍃",
      totalLessons: 60,
      color: "#fbbf24",
    },
    words: [
      {
        hanzi: "经济",
        pinyin: "jīng jì",
        meaning: "Economy",
        example: {
          chinese: "中国经济发展很快。",
          pinyin: "Zhōngguó jīngjì fāzhǎn hěn kuài.",
          translation: "China's economy is developing rapidly.",
        },
      },
      {
        hanzi: "文化",
        pinyin: "wén huà",
        meaning: "Culture",
        example: {
          chinese: "我对中国文化很感兴趣。",
          pinyin: "Wǒ duì Zhōngguó wénhuà hěn gǎn xìngqù.",
          translation: "I'm very interested in Chinese culture.",
        },
      },
      {
        hanzi: "环境",
        pinyin: "huán jìng",
        meaning: "Environment",
        example: {
          chinese: "保护环境是每个人的责任。",
          pinyin: "Bǎohù huánjìng shì měi gè rén de zérèn.",
          translation: "Protecting the environment is everyone's responsibility.",
        },
      },
      {
        hanzi: "科学",
        pinyin: "kē xué",
        meaning: "Science",
        example: {
          chinese: "科学技术改变了世界。",
          pinyin: "Kēxué jìshù gǎibiànle shìjiè.",
          translation: "Science and technology have changed the world.",
        },
      },
      {
        hanzi: "历史",
        pinyin: "lì shǐ",
        meaning: "History",
        example: {
          chinese: "我们要了解自己国家的历史。",
          pinyin: "Wǒmen yào liǎojiě zìjǐ guójiā de lìshǐ.",
          translation: "We should understand our country's history.",
        },
      },
      {
        hanzi: "发展",
        pinyin: "fā zhǎn",
        meaning: "Development / To develop",
        example: {
          chinese: "这个城市发展得很快。",
          pinyin: "Zhège chéngshì fāzhǎn de hěn kuài.",
          translation: "This city is developing very fast.",
        },
      },
      {
        hanzi: "影响",
        pinyin: "yǐng xiǎng",
        meaning: "Influence / Impact",
        example: {
          chinese: "父母对孩子的影响很大。",
          pinyin: "Fùmǔ duì háizi de yǐngxiǎng hěn dà.",
          translation: "Parents have a big influence on their children.",
        },
      },
      {
        hanzi: "解决",
        pinyin: "jiě jué",
        meaning: "To solve / Resolve",
        example: {
          chinese: "我们必须解决这个问题。",
          pinyin: "Wǒmen bìxū jiějué zhège wèntí.",
          translation: "We must solve this problem.",
        },
      },
      {
        hanzi: "讨论",
        pinyin: "tǎo lùn",
        meaning: "To discuss",
        example: {
          chinese: "我们来讨论一下这个计划。",
          pinyin: "Wǒmen lái tǎolùn yīxià zhège jìhuà.",
          translation: "Let's discuss this plan.",
        },
      },
      {
        hanzi: "建议",
        pinyin: "jiàn yì",
        meaning: "Suggestion / To suggest",
        example: {
          chinese: "我有一个建议。",
          pinyin: "Wǒ yǒu yīgè jiànyì.",
          translation: "I have a suggestion.",
        },
      },
      {
        hanzi: "选择",
        pinyin: "xuǎn zé",
        meaning: "To choose / Choice",
        example: {
          chinese: "这是你自己的选择。",
          pinyin: "Zhè shì nǐ zìjǐ de xuǎnzé.",
          translation: "This is your own choice.",
        },
      },
      {
        hanzi: "方法",
        pinyin: "fāng fǎ",
        meaning: "Method / Way",
        example: {
          chinese: "学汉语有很多方法。",
          pinyin: "Xué Hànyǔ yǒu hěn duō fāngfǎ.",
          translation: "There are many ways to learn Chinese.",
        },
      },
      {
        hanzi: "结果",
        pinyin: "jié guǒ",
        meaning: "Result / Outcome",
        example: {
          chinese: "考试结果出来了。",
          pinyin: "Kǎoshì jiéguǒ chūlái le.",
          translation: "The exam results are out.",
        },
      },
      {
        hanzi: "表示",
        pinyin: "biǎo shì",
        meaning: "To express / Indicate",
        example: {
          chinese: "他点头表示同意。",
          pinyin: "Tā diǎntóu biǎoshì tóngyì.",
          translation: "He nodded to indicate agreement.",
        },
      },
      {
        hanzi: "同意",
        pinyin: "tóng yì",
        meaning: "To agree",
        example: {
          chinese: "我同意你的看法。",
          pinyin: "Wǒ tóngyì nǐ de kànfǎ.",
          translation: "I agree with your view.",
        },
      },
      {
        hanzi: "支持",
        pinyin: "zhī chí",
        meaning: "To support",
        example: {
          chinese: "谢谢你的支持！",
          pinyin: "Xièxie nǐ de zhīchí!",
          translation: "Thank you for your support!",
        },
      },
      {
        hanzi: "反对",
        pinyin: "fǎn duì",
        meaning: "To oppose / Object",
        example: {
          chinese: "他反对这个决定。",
          pinyin: "Tā fǎnduì zhège juédìng.",
          translation: "He opposes this decision.",
        },
      },
      {
        hanzi: "目的",
        pinyin: "mù dì",
        meaning: "Purpose / Goal",
        example: {
          chinese: "你学汉语的目的是什么？",
          pinyin: "Nǐ xué Hànyǔ de mùdì shì shénme?",
          translation: "What is your purpose in learning Chinese?",
        },
      },
      {
        hanzi: "机会",
        pinyin: "jī huì",
        meaning: "Opportunity / Chance",
        example: {
          chinese: "这是一个很好的机会。",
          pinyin: "Zhè shì yīgè hěn hǎo de jīhuì.",
          translation: "This is a great opportunity.",
        },
      },
      {
        hanzi: "态度",
        pinyin: "tài dù",
        meaning: "Attitude",
        example: {
          chinese: "他的工作态度很认真。",
          pinyin: "Tā de gōngzuò tàidu hěn rènzhēn.",
          translation: "His work attitude is very serious.",
        },
      },
      {
        hanzi: "观点",
        pinyin: "guān diǎn",
        meaning: "Point of view / Viewpoint",
        example: {
          chinese: "每个人都有自己的观点。",
          pinyin: "Měi gè rén dōu yǒu zìjǐ de guāndiǎn.",
          translation: "Everyone has their own point of view.",
        },
      },
      {
        hanzi: "责任",
        pinyin: "zé rèn",
        meaning: "Responsibility",
        example: {
          chinese: "我们要承担自己的责任。",
          pinyin: "Wǒmen yào chéngdān zìjǐ de zérèn.",
          translation: "We need to take responsibility for ourselves.",
        },
      },
      {
        hanzi: "努力",
        pinyin: "nǔ lì",
        meaning: "To work hard / Effort",
        example: {
          chinese: "只要努力，一定能成功。",
          pinyin: "Zhǐyào nǔlì, yīdìng néng chénggōng.",
          translation: "As long as you work hard, you will succeed.",
        },
      },
      {
        hanzi: "成功",
        pinyin: "chéng gōng",
        meaning: "Success / To succeed",
        example: {
          chinese: "祝你成功！",
          pinyin: "Zhù nǐ chénggōng!",
          translation: "Wishing you success!",
        },
      },
      {
        hanzi: "失败",
        pinyin: "shī bài",
        meaning: "Failure / To fail",
        example: {
          chinese: "失败是成功之母。",
          pinyin: "Shībài shì chénggōng zhī mǔ.",
          translation: "Failure is the mother of success.",
        },
      },
    ],

    grammar: [
      {
        title: "Time words come early",
        explanation:
          "Time expressions (今天, 明天, 现在) go at the beginning of the sentence or right after the subject — always before the verb.",
        pattern: "Time + Subject + Verb",
        translation: "",
        examples: [
          { chinese: "今天我去学校。", translation: "Today I go to school." },
          { chinese: "明天她要来。", translation: "Tomorrow she is coming." },
        ],
      },
      {
        title: "Possession with 的",
        explanation:
          "的 (de) marks possession, like 's in English. Place it between the owner and the object.",
        pattern: "Owner + 的 + Object",
        translation: "Owner's object",
        examples: [
          { chinese: "我的老师很好。", translation: "My teacher is very good." },
          { chinese: "他的朋友是学生。", translation: "His friend is a student." },
        ],
      },
      {
        title: "Comparison with 比",
        explanation:
          "比 (bǐ) is used to compare two things. The thing being compared to comes after 比.",
        pattern: "A + 比 + B + Adjective",
        translation: "A is more [adjective] than B",
        examples: [
          { chinese: "他比我高。", translation: "He is taller than me." },
          { chinese: "今天比昨天冷。", translation: "Today is colder than yesterday." },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // HSK 4 — Upper-Intermediate (~1200 total words, 25 here)
  // ─────────────────────────────────────────────────────────
  4: {
    meta: {
      level: 4,
      label: "HSK 4",
      description: "Upper-Intermediate",
      emoji: "🌲",
      totalLessons: 80,
      color: "#f87171",
    },
    words: [
      {
        hanzi: "抽象",
        pinyin: "chōu xiàng",
        meaning: "Abstract",
        example: {
          chinese: "这幅画非常抽象。",
          pinyin: "Zhè fú huà fēicháng chōuxiàng.",
          translation: "This painting is very abstract.",
        },
      },
      {
        hanzi: "具体",
        pinyin: "jù tǐ",
        meaning: "Concrete / Specific",
        example: {
          chinese: "请给我一个具体的例子。",
          pinyin: "Qǐng gěi wǒ yīgè jùtǐ de lìzi.",
          translation: "Please give me a specific example.",
        },
      },
      {
        hanzi: "批评",
        pinyin: "pī píng",
        meaning: "To criticize / Criticism",
        example: {
          chinese: "老师批评了他的作业。",
          pinyin: "Lǎoshī pīpíngle tā de zuòyè.",
          translation: "The teacher criticized his homework.",
        },
      },
      {
        hanzi: "坚持",
        pinyin: "jiān chí",
        meaning: "To persist / Insist",
        example: {
          chinese: "坚持就是胜利。",
          pinyin: "Jiānchí jiù shì shènglì.",
          translation: "Persistence is victory.",
        },
      },
      {
        hanzi: "矛盾",
        pinyin: "máo dùn",
        meaning: "Contradiction / Conflict",
        example: {
          chinese: "他的话前后矛盾。",
          pinyin: "Tā de huà qiánhòu máodùn.",
          translation: "What he said is self-contradictory.",
        },
      },
      {
        hanzi: "逻辑",
        pinyin: "luó jí",
        meaning: "Logic",
        example: {
          chinese: "你的逻辑有问题。",
          pinyin: "Nǐ de luójí yǒu wèntí.",
          translation: "There is a problem with your logic.",
        },
      },
      {
        hanzi: "现象",
        pinyin: "xiàn xiàng",
        meaning: "Phenomenon",
        example: {
          chinese: "这是一个很有趣的社会现象。",
          pinyin: "Zhè shì yīgè hěn yǒuqù de shèhuì xiànxiàng.",
          translation: "This is a very interesting social phenomenon.",
        },
      },
      {
        hanzi: "本质",
        pinyin: "běn zhì",
        meaning: "Essence / Nature",
        example: {
          chinese: "我们要看问题的本质。",
          pinyin: "Wǒmen yào kàn wèntí de běnzhì.",
          translation: "We need to look at the essence of the problem.",
        },
      },
      {
        hanzi: "趋势",
        pinyin: "qū shì",
        meaning: "Trend",
        example: {
          chinese: "这是未来的发展趋势。",
          pinyin: "Zhè shì wèilái de fāzhǎn qūshì.",
          translation: "This is the future development trend.",
        },
      },
      {
        hanzi: "复杂",
        pinyin: "fù zá",
        meaning: "Complex / Complicated",
        example: {
          chinese: "这个问题非常复杂。",
          pinyin: "Zhège wèntí fēicháng fùzá.",
          translation: "This problem is very complex.",
        },
      },
      {
        hanzi: "严格",
        pinyin: "yán gé",
        meaning: "Strict / Rigorous",
        example: {
          chinese: "这位老师对学生要求很严格。",
          pinyin: "Zhè wèi lǎoshī duì xuésheng yāoqiú hěn yángé.",
          translation: "This teacher has strict requirements for students.",
        },
      },
      {
        hanzi: "灵活",
        pinyin: "líng huó",
        meaning: "Flexible",
        example: {
          chinese: "我们需要灵活地处理这个问题。",
          pinyin: "Wǒmen xūyào línghuó de chǔlǐ zhège wèntí.",
          translation: "We need to handle this problem flexibly.",
        },
      },
      {
        hanzi: "积极",
        pinyin: "jī jí",
        meaning: "Positive / Proactive",
        example: {
          chinese: "他对工作非常积极。",
          pinyin: "Tā duì gōngzuò fēicháng jījí.",
          translation: "He is very proactive about work.",
        },
      },
      {
        hanzi: "缺乏",
        pinyin: "quē fá",
        meaning: "To lack / Shortage",
        example: {
          chinese: "这个地区缺乏干净的水源。",
          pinyin: "Zhège dìqū quēfá gānjìng de shuǐyuán.",
          translation: "This region lacks clean water sources.",
        },
      },
      {
        hanzi: "丰富",
        pinyin: "fēng fù",
        meaning: "Rich / Abundant",
        example: {
          chinese: "她的工作经验非常丰富。",
          pinyin: "Tā de gōngzuò jīngyàn fēicháng fēngfù.",
          translation: "She has very rich work experience.",
        },
      },
      {
        hanzi: "判断",
        pinyin: "pàn duàn",
        meaning: "To judge / Judgment",
        example: {
          chinese: "你的判断是正确的。",
          pinyin: "Nǐ de pànduàn shì zhèngquè de.",
          translation: "Your judgment is correct.",
        },
      },
      {
        hanzi: "推测",
        pinyin: "tuī cè",
        meaning: "To speculate / Infer",
        example: {
          chinese: "我只是在推测。",
          pinyin: "Wǒ zhǐshì zài tuīcè.",
          translation: "I'm just speculating.",
        },
      },
      {
        hanzi: "证明",
        pinyin: "zhèng míng",
        meaning: "To prove / Proof",
        example: {
          chinese: "你能证明你说的是真的吗？",
          pinyin: "Nǐ néng zhèngmíng nǐ shuō de shì zhēn de ma?",
          translation: "Can you prove what you said is true?",
        },
      },
      {
        hanzi: "假设",
        pinyin: "jiǎ shè",
        meaning: "To assume / Hypothesis",
        example: {
          chinese: "假设你是我，你会怎么做？",
          pinyin: "Jiǎshè nǐ shì wǒ, nǐ huì zěnme zuò?",
          translation: "Assuming you were me, what would you do?",
        },
      },
      {
        hanzi: "总结",
        pinyin: "zǒng jié",
        meaning: "To summarize / Summary",
        example: {
          chinese: "请总结一下今天的内容。",
          pinyin: "Qǐng zǒngjié yīxià jīntiān de nèiróng.",
          translation: "Please summarize today's content.",
        },
      },
      {
        hanzi: "分析",
        pinyin: "fēn xī",
        meaning: "To analyze / Analysis",
        example: {
          chinese: "我们需要仔细分析这个问题。",
          pinyin: "Wǒmen xūyào zǐxì fēnxī zhège wèntí.",
          translation: "We need to carefully analyze this problem.",
        },
      },
      {
        hanzi: "评价",
        pinyin: "píng jià",
        meaning: "To evaluate / Evaluation",
        example: {
          chinese: "请对这部电影做个评价。",
          pinyin: "Qǐng duì zhè bù diànyǐng zuò gè píngjià.",
          translation: "Please give an evaluation of this film.",
        },
      },
      {
        hanzi: "比较",
        pinyin: "bǐ jiào",
        meaning: "To compare / Relatively",
        example: {
          chinese: "比较两种方案，哪个更好？",
          pinyin: "Bǐjiào liǎng zhǒng fāng'àn, nǎge gèng hǎo?",
          translation: "Comparing the two plans, which is better?",
        },
      },
      {
        hanzi: "强调",
        pinyin: "qiáng diào",
        meaning: "To emphasize",
        example: {
          chinese: "他强调了安全的重要性。",
          pinyin: "Tā qiángdiàole ānquán de zhòngyàoxìng.",
          translation: "He emphasized the importance of safety.",
        },
      },
      {
        hanzi: "概念",
        pinyin: "gài niàn",
        meaning: "Concept / Notion",
        example: {
          chinese: "你理解这个概念吗？",
          pinyin: "Nǐ lǐjiě zhège gàiniàn ma?",
          translation: "Do you understand this concept?",
        },
      },
    ],

    grammar: [
      {
        title: "Using 把 to move the object",
        explanation:
          "把 (bǎ) moves the object before the verb to emphasize what is done to it. Common with action verbs that have a result.",
        pattern: "Subject + 把 + Object + Verb + Result",
        translation: "Subject [verb]s the object [result]",
        examples: [
          { chinese: "我把作业做完了。", translation: "I finished the homework." },
          { chinese: "请把门关上。", translation: "Please close the door." },
        ],
      },
      {
        title: "Passive voice with 被",
        explanation:
          "被 (bèi) marks a passive sentence. The subject receives the action rather than performing it.",
        pattern: "Subject + 被 + Agent + Verb",
        translation: "Subject was [verb]ed by agent",
        examples: [
          { chinese: "他被老师批评了。", translation: "He was criticized by the teacher." },
          { chinese: "钱包被偷了。", translation: "The wallet was stolen." },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // HSK 5 — Advanced (~2500 total words, 25 here)
  // ─────────────────────────────────────────────────────────
  5: {
    meta: {
      level: 5,
      label: "HSK 5",
      description: "Advanced",
      emoji: "🎋",
      totalLessons: 120,
      color: "#a78bfa",
    },
    words: [
      {
        hanzi: "辩证",
        pinyin: "biàn zhèng",
        meaning: "Dialectical",
        example: {
          chinese: "我们要用辩证的眼光看问题。",
          pinyin: "Wǒmen yào yòng biànzhèng de yǎnguāng kàn wèntí.",
          translation: "We should look at problems dialectically.",
        },
      },
      {
        hanzi: "传承",
        pinyin: "chuán chéng",
        meaning: "To pass down / Inheritance",
        example: {
          chinese: "文化的传承需要每一代人的努力。",
          pinyin: "Wénhuà de chuánchéng xūyào měi yī dài rén de nǔlì.",
          translation: "Cultural inheritance requires the effort of every generation.",
        },
      },
      {
        hanzi: "融合",
        pinyin: "róng hé",
        meaning: "Integration / Fusion",
        example: {
          chinese: "东西方文化的融合产生了新的艺术形式。",
          pinyin: "Dōng xīfāng wénhuà de rónghé chǎnshēngle xīn de yìshù xíngshì.",
          translation: "The fusion of Eastern and Western cultures produced new art forms.",
        },
      },
      {
        hanzi: "突破",
        pinyin: "tū pò",
        meaning: "Breakthrough",
        example: {
          chinese: "科学家们取得了重大突破。",
          pinyin: "Kēxuéjiāmen qǔdéle zhòngdà tūpò.",
          translation: "Scientists have made a major breakthrough.",
        },
      },
      {
        hanzi: "局限",
        pinyin: "jú xiàn",
        meaning: "Limitation / Constraint",
        example: {
          chinese: "不要被传统观念所局限。",
          pinyin: "Bùyào bèi chuántǒng guānniàn suǒ júxiàn.",
          translation: "Don't be constrained by traditional concepts.",
        },
      },
      {
        hanzi: "启示",
        pinyin: "qǐ shì",
        meaning: "Enlightenment / Revelation",
        example: {
          chinese: "这件事给了我很大的启示。",
          pinyin: "Zhè jiàn shì gěile wǒ hěn dà de qǐshì.",
          translation: "This gave me great enlightenment.",
        },
      },
      {
        hanzi: "凝聚",
        pinyin: "níng jù",
        meaning: "To condense / Unite",
        example: {
          chinese: "这首歌凝聚了所有人的情感。",
          pinyin: "Zhè shǒu gē níngjùle suǒyǒu rén de qínggǎn.",
          translation: "This song unites everyone's emotions.",
        },
      },
      {
        hanzi: "颠覆",
        pinyin: "diān fù",
        meaning: "To subvert / Overturn",
        example: {
          chinese: "这个发现颠覆了人们的认知。",
          pinyin: "Zhège fāxiàn diānfùle rénmen de rènzhī.",
          translation: "This discovery overturned people's understanding.",
        },
      },
      {
        hanzi: "蔓延",
        pinyin: "màn yán",
        meaning: "To spread / Extend",
        example: {
          chinese: "火势迅速蔓延。",
          pinyin: "Huǒshì xùnsù mànyán.",
          translation: "The fire spread rapidly.",
        },
      },
      {
        hanzi: "孕育",
        pinyin: "yùn yù",
        meaning: "To nurture / Breed",
        example: {
          chinese: "这片土地孕育了灿烂的文明。",
          pinyin: "Zhè piàn tǔdì yùnyùle cànlàn de wénmíng.",
          translation: "This land nurtured a brilliant civilization.",
        },
      },
      {
        hanzi: "彰显",
        pinyin: "zhāng xiǎn",
        meaning: "To highlight / Manifest",
        example: {
          chinese: "这件作品彰显了艺术家的才华。",
          pinyin: "Zhè jiàn zuòpǐn zhāngxiǎnle yìshùjiā de cáihuá.",
          translation: "This work highlights the artist's talent.",
        },
      },
      {
        hanzi: "阐述",
        pinyin: "chǎn shù",
        meaning: "To elaborate / Expound",
        example: {
          chinese: "请详细阐述你的观点。",
          pinyin: "Qǐng xiángxì chǎnshù nǐ de guāndiǎn.",
          translation: "Please elaborate on your viewpoint in detail.",
        },
      },
      {
        hanzi: "诠释",
        pinyin: "quán shì",
        meaning: "To interpret / Explain",
        example: {
          chinese: "她用独特的方式诠释了这首歌。",
          pinyin: "Tā yòng dútè de fāngshì quánshìle zhè shǒu gē.",
          translation: "She interpreted this song in a unique way.",
        },
      },
      {
        hanzi: "渗透",
        pinyin: "shèn tòu",
        meaning: "Permeation / Penetration",
        example: {
          chinese: "西方文化已经渗透到了全球各地。",
          pinyin: "Xīfāng wénhuà yǐjīng shèntòu dàole quánqiú gèdì.",
          translation: "Western culture has permeated every corner of the globe.",
        },
      },
      {
        hanzi: "折射",
        pinyin: "zhé shè",
        meaning: "Refraction / To reflect (figurative)",
        example: {
          chinese: "这部小说折射出社会的现实问题。",
          pinyin: "Zhè bù xiǎoshuō zhéshè chū shèhuì de xiànshí wèntí.",
          translation: "This novel reflects the real problems of society.",
        },
      },
      {
        hanzi: "侵蚀",
        pinyin: "qīn shí",
        meaning: "To erode / Corrode",
        example: {
          chinese: "腐败侵蚀了社会的根基。",
          pinyin: "Fǔbài qīnshíle shèhuì de gēnjī.",
          translation: "Corruption is eroding the foundation of society.",
        },
      },
      {
        hanzi: "演变",
        pinyin: "yǎn biàn",
        meaning: "Evolution / To evolve",
        example: {
          chinese: "语言随着时代的变化而演变。",
          pinyin: "Yǔyán suízhe shídài de biànhuà ér yǎnbiàn.",
          translation: "Language evolves with the changes of the times.",
        },
      },
      {
        hanzi: "制约",
        pinyin: "zhì yuē",
        meaning: "To restrict / Constrain",
        example: {
          chinese: "法律制约着人们的行为。",
          pinyin: "Fǎlǜ zhìyuēzhe rénmen de xíngwéi.",
          translation: "Laws constrain people's behavior.",
        },
      },
      {
        hanzi: "萦绕",
        pinyin: "yíng rào",
        meaning: "To linger / Hover around",
        example: {
          chinese: "那首旋律一直萦绕在我的脑海中。",
          pinyin: "Nà shǒu xuánlǜ yīzhí yíngrào zài wǒ de nǎohǎi zhōng.",
          translation: "That melody keeps lingering in my mind.",
        },
      },
      {
        hanzi: "升华",
        pinyin: "shēng huá",
        meaning: "Sublimation / Elevation",
        example: {
          chinese: "痛苦的经历可以升华为艺术。",
          pinyin: "Tòngkǔ de jīnglì kěyǐ shēnghuá wéi yìshù.",
          translation: "Painful experiences can be sublimated into art.",
        },
      },
      {
        hanzi: "包容",
        pinyin: "bāo róng",
        meaning: "Tolerance / To embrace",
        example: {
          chinese: "一个成熟的人懂得包容他人的缺点。",
          pinyin: "Yīgè chéngshú de rén dǒngde bāoróng tārén de quēdiǎn.",
          translation: "A mature person knows how to embrace others' flaws.",
        },
      },
      {
        hanzi: "沉淀",
        pinyin: "chén diàn",
        meaning: "Sediment / To accumulate over time",
        example: {
          chinese: "这些经历都是人生的沉淀。",
          pinyin: "Zhèxiē jīnglì dōu shì rénshēng de chéndiàn.",
          translation: "These experiences are the accumulation of life.",
        },
      },
      {
        hanzi: "迸发",
        pinyin: "bèng fā",
        meaning: "To burst out / Erupt",
        example: {
          chinese: "创意在那一刻迸发出来。",
          pinyin: "Chuàngyì zài nà yīkè bèngfā chūlái.",
          translation: "Creativity burst out at that moment.",
        },
      },
      {
        hanzi: "契合",
        pinyin: "qì hé",
        meaning: "To align / Fit perfectly",
        example: {
          chinese: "他的想法和我的完全契合。",
          pinyin: "Tā de xiǎngfǎ hé wǒ de wánquán qìhé.",
          translation: "His ideas perfectly align with mine.",
        },
      },
      {
        hanzi: "淬炼",
        pinyin: "cuì liàn",
        meaning: "To temper / Refine",
        example: {
          chinese: "经过多年的淬炼，他成为了一名出色的厨师。",
          pinyin: "Jīngguò duō nián de cuìliàn, tā chéngwéile yī míng chūsè de chúshī.",
          translation: "After years of tempering, he became an excellent chef.",
        },
      },
    ],

    grammar: [
      {
        title: "The 把 structure (advanced usage)",
        explanation:
          "In advanced contexts, 把 can combine with directional complements and result complements to create nuanced action descriptions.",
        pattern: "把 + Object + Verb + 到/在/给/成 + Result",
        translation: "Verb the object to/into/at [result]",
        examples: [
          { chinese: "他把书翻译成了英文。", translation: "He translated the book into English." },
          { chinese: "请把文件发给我。", translation: "Please send the file to me." },
        ],
      },
      {
        title: "Concessive clauses with 虽然…但是",
        explanation:
          "虽然 (suīrán) introduces a concession, and 但是/却 introduces the contrasting main point.",
        pattern: "虽然 + concession + 但是 + main point",
        translation: "Although [concession], [main point]",
        examples: [
          { chinese: "虽然很难，但是我要坚持。", translation: "Although it's hard, I will persist." },
          { chinese: "虽然他很忙，但是还是来了。", translation: "Although he was busy, he still came." },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // HSK 6 — Mastery (~5000 total words, 25 here)
  // ─────────────────────────────────────────────────────────
  6: {
    meta: {
      level: 6,
      label: "HSK 6",
      description: "Mastery",
      emoji: "🏯",
      totalLessons: 150,
      color: "#fb923c",
    },
    words: [
      {
        hanzi: "斡旋",
        pinyin: "wò xuán",
        meaning: "Mediation / Intercession",
        example: {
          chinese: "外交官在两国之间进行斡旋。",
          pinyin: "Wàijiāoguān zài liǎng guó zhī jiān jìnxíng wòxuán.",
          translation: "The diplomat mediated between the two countries.",
        },
      },
      {
        hanzi: "跌宕",
        pinyin: "diē dàng",
        meaning: "Ups and downs / Turbulent",
        example: {
          chinese: "他的人生充满了跌宕起伏。",
          pinyin: "Tā de rénshēng chōngmǎnle diēdàng qǐfú.",
          translation: "His life was full of ups and downs.",
        },
      },
      {
        hanzi: "藩篱",
        pinyin: "fān lí",
        meaning: "Fence / Barrier (figurative)",
        example: {
          chinese: "打破传统的藩篱，才能创新。",
          pinyin: "Dǎpò chuántǒng de fānlí, cái néng chuàngxīn.",
          translation: "Only by breaking traditional barriers can one innovate.",
        },
      },
      {
        hanzi: "斑驳",
        pinyin: "bān bó",
        meaning: "Mottled / Dappled",
        example: {
          chinese: "阳光透过树叶，在地上留下斑驳的光影。",
          pinyin: "Yángguāng tòuguò shùyè, zài dì shàng liú xià bānbó de guāngyǐng.",
          translation: "Sunlight through the leaves left dappled shadows on the ground.",
        },
      },
      {
        hanzi: "氤氲",
        pinyin: "yīn yūn",
        meaning: "Misty / Hazy atmosphere",
        example: {
          chinese: "山间氤氲着薄薄的雾气。",
          pinyin: "Shān jiān yīnyūnzhe báobáo de wùqì.",
          translation: "The mountains were enveloped in a thin, misty haze.",
        },
      },
      {
        hanzi: "踟蹰",
        pinyin: "chí chú",
        meaning: "To hesitate / Linger indecisively",
        example: {
          chinese: "他在门口踟蹰了很久，终于敲了门。",
          pinyin: "Tā zài ménkǒu chíchúle hěn jiǔ, zhōngyú qiāole mén.",
          translation: "He hesitated at the door for a long time, then finally knocked.",
        },
      },
      {
        hanzi: "皈依",
        pinyin: "guī yī",
        meaning: "To convert / Take refuge (religious)",
        example: {
          chinese: "她在旅行后皈依了佛教。",
          pinyin: "Tā zài lǚxíng hòu guīyīle Fójiào.",
          translation: "She converted to Buddhism after her travels.",
        },
      },
      {
        hanzi: "隽永",
        pinyin: "juàn yǒng",
        meaning: "Meaningful and lasting / Profound",
        example: {
          chinese: "这首诗意境隽永，令人回味无穷。",
          pinyin: "Zhè shǒu shī yìjìng juànyǒng, lìng rén huíwèi wúqióng.",
          translation: "This poem has a profound artistic conception, leaving an endless aftertaste.",
        },
      },
      {
        hanzi: "韬略",
        pinyin: "tāo lüè",
        meaning: "Military strategy / Tactics",
        example: {
          chinese: "他深谙韬略，是一位出色的将领。",
          pinyin: "Tā shēn ān tāolüè, shì yīwèi chūsè de jiànglǐng.",
          translation: "He is well-versed in strategy, a brilliant general.",
        },
      },
      {
        hanzi: "磅礴",
        pinyin: "páng bó",
        meaning: "Grand / Magnificent",
        example: {
          chinese: "黄河气势磅礴，令人震撼。",
          pinyin: "Huánghé qìshì pángbó, lìng rén zhènhàn.",
          translation: "The Yellow River is grand and magnificent, awe-inspiring.",
        },
      },
      {
        hanzi: "旖旎",
        pinyin: "yǐ nǐ",
        meaning: "Gentle and beautiful / Enchanting",
        example: {
          chinese: "江南水乡风光旖旎。",
          pinyin: "Jiāngnán shuǐxiāng fēngguāng yǐnǐ.",
          translation: "The water towns of Jiangnan have enchanting scenery.",
        },
      },
      {
        hanzi: "嗟叹",
        pinyin: "jiē tàn",
        meaning: "To sigh / Lament",
        example: {
          chinese: "读完这本书，令人不禁嗟叹。",
          pinyin: "Dú wán zhè běn shū, lìng rén bùjīn jiētàn.",
          translation: "After reading this book, one can't help but sigh.",
        },
      },
      {
        hanzi: "蹉跎",
        pinyin: "cuō tuó",
        meaning: "To idle away time / Waste years",
        example: {
          chinese: "不要蹉跎岁月，要珍惜时间。",
          pinyin: "Bùyào cuōtuó suìyuè, yào zhēnxī shíjiān.",
          translation: "Don't waste your years — cherish your time.",
        },
      },
      {
        hanzi: "悱恻",
        pinyin: "fěi cè",
        meaning: "Deeply moved / Sorrowful",
        example: {
          chinese: "这段音乐令人感到悱恻动人。",
          pinyin: "Zhè duàn yīnyuè lìng rén gǎndào fěicè dòngrén.",
          translation: "This piece of music is deeply moving and sorrowful.",
        },
      },
      {
        hanzi: "怆然",
        pinyin: "chuàng rán",
        meaning: "Grieved / Sorrowful",
        example: {
          chinese: "看到故乡的废墟，他怆然泪下。",
          pinyin: "Kàn dào gùxiāng de fèixū, tā chuàngrán lèi xià.",
          translation: "Seeing the ruins of his hometown, he wept with grief.",
        },
      },
      {
        hanzi: "澄澈",
        pinyin: "chéng chè",
        meaning: "Clear and transparent",
        example: {
          chinese: "湖水澄澈，可以看见水底的石头。",
          pinyin: "Húshuǐ chéngchè, kěyǐ kànjiàn shuǐdǐ de shítou.",
          translation: "The lake water is so clear you can see the stones at the bottom.",
        },
      },
      {
        hanzi: "玲珑",
        pinyin: "líng lóng",
        meaning: "Delicate and exquisite",
        example: {
          chinese: "这件玉器玲珑剔透，工艺精湛。",
          pinyin: "Zhè jiàn yùqì línglóng tītòu, gōngyì jīngzhàn.",
          translation: "This jade piece is delicate and translucent, the craftsmanship exquisite.",
        },
      },
      {
        hanzi: "煊赫",
        pinyin: "xuān hè",
        meaning: "Illustrious / Prominent",
        example: {
          chinese: "这个家族曾经煊赫一时。",
          pinyin: "Zhège jiāzú céngjīng xuānhè yīshí.",
          translation: "This family was once illustrious and prominent.",
        },
      },
      {
        hanzi: "邈远",
        pinyin: "miǎo yuǎn",
        meaning: "Far and remote / Distant",
        example: {
          chinese: "那段历史对我们来说已经邈远了。",
          pinyin: "Nà duàn lìshǐ duì wǒmen lái shuō yǐjīng miǎoyuǎn le.",
          translation: "That period of history feels very remote to us now.",
        },
      },
      {
        hanzi: "肆意",
        pinyin: "sì yì",
        meaning: "Wantonly / Without restraint",
        example: {
          chinese: "他肆意挥霍父母的血汗钱。",
          pinyin: "Tā sìyì huīhuò fùmǔ de xuèhànqián.",
          translation: "He wantonly squandered his parents' hard-earned money.",
        },
      },
      {
        hanzi: "迷惘",
        pinyin: "mí wǎng",
        meaning: "Confused / Lost",
        example: {
          chinese: "毕业后，他感到迷惘，不知道未来的方向。",
          pinyin: "Bìyè hòu, tā gǎndào míwǎng, bù zhīdào wèilái de fāngxiàng.",
          translation: "After graduation, he felt lost, not knowing his future direction.",
        },
      },
      {
        hanzi: "缱绻",
        pinyin: "qiǎn quǎn",
        meaning: "Deeply attached / Lingering affection",
        example: {
          chinese: "他们之间有着深深的缱绻情意。",
          pinyin: "Tāmen zhī jiān yǒuzhe shēn shēn de qiǎnquǎn qíngyì.",
          translation: "Between them there is a deep and lingering affection.",
        },
      },
      {
        hanzi: "婆娑",
        pinyin: "pó suō",
        meaning: "Swaying / Dancing (of trees, shadows)",
        example: {
          chinese: "风中，树影婆娑，美不胜收。",
          pinyin: "Fēng zhōng, shù yǐng pó suō, měi bù shèng shōu.",
          translation: "In the wind, the swaying tree shadows were breathtakingly beautiful.",
        },
      },
      {
        hanzi: "栩栩如生",
        pinyin: "xǔ xǔ rú shēng",
        meaning: "Lifelike / Vivid",
        example: {
          chinese: "雕刻家的作品栩栩如生，令人叹为观止。",
          pinyin: "Diāokè jiā de zuòpǐn xǔxǔ rú shēng, lìng rén tàn wéi guān zhǐ.",
          translation: "The sculptor's works are so lifelike, they are breathtaking.",
        },
      },
      {
        hanzi: "浑然天成",
        pinyin: "hún rán tiān chéng",
        meaning: "Perfectly natural / As if made by heaven",
        example: {
          chinese: "这幅画浑然天成，没有一丝刻意的痕迹。",
          pinyin: "Zhè fú huà hún rán tiān chéng, méiyǒu yī sī kèyì de hénjì.",
          translation: "This painting is perfectly natural, without a trace of artificiality.",
        },
      },
    ],

    grammar: [
      {
        title: "Four-character idioms (成语)",
        explanation:
          "成语 (chéngyǔ) are four-character fixed expressions with historical or literary origins. Mastering them marks native-level fluency.",
        pattern: "Four characters = one fixed meaning",
        translation: "Idiomatic expression",
        examples: [
          { chinese: "半途而废 — to give up halfway", translation: "半途 = halfway, 而废 = abandon" },
          { chinese: "一石二鸟 — kill two birds with one stone", translation: "一石 = one stone, 二鸟 = two birds" },
        ],
      },
      {
        title: "Literary 之 as a classical possessive",
        explanation:
          "In formal and literary Chinese, 之 (zhī) functions like 的 but carries a classical, elevated tone. Common in idioms, proverbs and formal writing.",
        pattern: "Owner + 之 + Object",
        translation: "Owner's [object] (literary)",
        examples: [
          { chinese: "失败是成功之母。", translation: "Failure is the mother of success." },
          { chinese: "君子之交淡如水。", translation: "The friendship of gentlemen is as plain as water." },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════
// HELPERS — convenience accessors
// ═══════════════════════════════════════════════════════════

/** Get all words for a given HSK level */
export function getWords(level) {
  return HSK[level]?.words ?? [];
}

/** Get all grammar notes for a given HSK level */
export function getGrammar(level) {
  return HSK[level]?.grammar ?? [];
}

/** Get meta info (label, description, emoji, color) for a level */
export function getLevelMeta(level) {
  return HSK[level]?.meta ?? null;
}

/** Get words for a specific lesson block (5 words per lesson) */
export function getWordsForLesson(level, lessonNum) {
  const all = getWords(level);
  const start = ((lessonNum - 1) * 5) % all.length;
  return all.slice(start, start + 5);
}

/** Get all levels as a sorted array */
export function getAllLevels() {
  return Object.keys(HSK)
    .map(Number)
    .sort((a, b) => a - b)
    .map(lvl => ({ level: lvl, ...HSK[lvl].meta }));
}
