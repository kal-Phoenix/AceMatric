const fs = require('fs');

const data = {
  chapterNumber: 15,
  title: "Synonyms",
  overview: "Synonyms are words with the same or nearly the same meaning. This chapter covers strategies for identifying synonyms, building vocabulary through word families, and using context clues to determine meaning.",
  corePoints: [
    "Synonym = word with same or similar meaning",
    "Synonyms may have subtle differences in tone or usage",
    "Use context to identify meaning of unfamiliar words",
    "Word families: groups of words with common roots",
    "Recognizing prefixes and suffixes aids synonym identification",
    "Synonyms appear in analogy questions and sentence completions",
    "Building vocabulary is the best preparation"
  ],
  examTips: "Synonym knowledge is tested indirectly through analogies, sentence completions, and reading comprehension. Knowing synonyms helps you define unfamiliar words.",
  youtubeVideoId: "placeholder",
  videoDuration: "10:30",
  materials: [
    { name: "PARTISAN", formula: "", description: "Noun/Adjective: a strong supporter of a cause. Synonyms: SUPPORTER, ADVOCATE, CHAMPION, BACKER." },
    { name: "CONCEAL", formula: "", description: "Verb: to hide or keep from sight. Synonyms: HIDE, SECRETE, COVER, MASK." },
    { name: "EXCEED", formula: "", description: "Verb: to be greater than or surpass. Synonyms: SURPASS, OUTSTRIP, OUTDO, TRANSCEND." },
    { name: "NEUTRAL", formula: "", description: "Adjective: not supporting either side. Synonyms: IMPARTIAL, UNBIASED, NONPARTISAN, INDIFFERENT." },
    { name: "MAGNIFICENT", formula: "", description: "Adjective: extremely beautiful or impressive. Synonyms: GRANDIOSE, SPLENDID, MAJESTIC, GLORIOUS." },
    { name: "NARRATE", formula: "", description: "Verb: to tell a story. Synonyms: RELATE, RECOUNT, DESCRIBE, REPORT." }
  ],
  subtopics: [
    {
      title: "15.1 What is a Synonym?",
      content: "<p>A synonym is a word that has the same or nearly the same meaning as another word. While synonyms mean about the same thing, they often convey slightly different shades of meaning.</p><div class='formula-box'><strong>Synonym Definition</strong><br/>Words with similar meanings<br/>Example: BIG is to LARGE, HAPPY is to JOYFUL</div>",
      examInsight: "Synonyms rarely appear as standalone questions. They appear in analogy questions and sentence completions.",
      practiceProblems: [
        { question: "Which is a synonym for 'drowsy'?", options: ["ill", "content", "sleepy", "lively"], answer: "C", solution: "<p>Drowsy means feeling sleepy or half-asleep.</p>" },
        { question: "Which is a synonym for 'partisan'?", options: ["neutral", "biased", "objective", "impartial"], answer: "B", solution: "<p>Partisan means strongly supporting a cause. Biased means showing unfair favoritism.</p>" },
        { question: "Which is a synonym for 'conceal'?", options: ["reveal", "hide", "show", "expose"], answer: "B", solution: "<p>Conceal means to hide. Hide is a direct synonym.</p>" }
      ]
    },
    {
      title: "15.2 Strategies for Identifying Synonyms",
      content: "<p>Define the word precisely, think of examples, look for word parts, and eliminate antonyms.</p><div class='formula-box'><strong>Synonym Strategies</strong><br/>1. Define the word precisely<br/>2. Use context or sentences<br/>3. Break down word parts<br/>4. Eliminate wrong answers</div>",
      examInsight: "Strategies are especially useful for analogy questions.",
      practiceProblems: [
        { question: "Which is a synonym for 'magnificent'?", options: ["grandiose", "insignificant", "ordinary", "unimpressive"], answer: "A", solution: "<p>Magnificent means extremely beautiful. Grandiose means impressive.</p>" },
        { question: "Which is a synonym for 'narrate'?", options: ["recite", "listen", "forget", "ignore"], answer: "A", solution: "<p>Narrate means to tell a story. Recite means to repeat aloud.</p>" },
        { question: "Which is a synonym for 'edifice'?", options: ["building", "ruin", "garden", "mountain"], answer: "A", solution: "<p>Edifice means a large, impressive building.</p>" }
      ]
    },
    {
      title: "15.3 Using Context Clues for Synonyms",
      content: "<p>If you encounter an unfamiliar word, use context clues from the sentence. Look for restatement, examples, or contrast.</p><div class='formula-box'><strong>Context Clue Types</strong><br/>Definition: 'X, which means...'<br/>Example: 'X, such as...'<br/>Contrast: 'X, unlike Y...'<br/>Restatement: 'X, that is...'</div>",
      examInsight: "Context clues are essential for reading comprehension and sentence completion.",
      practiceProblems: [
        { question: "'The apathetic crowd showed no enthusiasm.' Synonym for 'apathetic'?", options: ["enthusiastic", "indifferent", "excited", "passionate"], answer: "B", solution: "<p>Apathetic means showing no interest. Indifferent means having no particular concern.</p>" },
        { question: "'The ephemeral beauty lasted only moments.' Synonym for 'ephemeral'?", options: ["permanent", "lasting", "fleeting", "eternal"], answer: "C", solution: "<p>Ephemeral means lasting a very short time. Fleeting means the same.</p>" },
        { question: "'The meticulous artist paid attention to every detail.' Synonym for 'meticulous'?", options: ["careless", "thorough", "hasty", "sloppy"], answer: "B", solution: "<p>Meticulous means showing great attention to detail. Thorough means careful and complete.</p>" }
      ]
    },
    {
      title: "15.4 Word Families and Roots",
      content: "<p>Many synonyms belong to the same word family, sharing a common root.</p><div class='formula-box'><strong>Common Roots</strong><br/>bene (good): beneficial, benevolent, benefit<br/>mal (bad): malevolent, malicious, malady<br/>dict (say): dictate, predict, verdict<br/>scrib/script (write): describe, script, scribble</div>",
      examInsight: "Root knowledge is crucial for advanced vocabulary questions.",
      practiceProblems: [
        { question: "Which is a synonym for 'benevolent'?", options: ["malicious", "kind", "hostile", "malevolent"], answer: "B", solution: "<p>Benevolent means well-meaning and kind.</p>" },
        { question: "Which is a synonym for 'predict'?", options: ["foretell", "ignore", "remember", "forget"], answer: "A", solution: "<p>Predict means to say beforehand. Foretell means the same.</p>" },
        { question: "Which is a synonym for 'script'?", options: ["writing", "speech", "recording", "image"], answer: "A", solution: "<p>Script means written text. Writing is a direct synonym.</p>" }
      ]
    },
    {
      title: "15.5 Advanced Synonyms",
      content: "<p>Advanced synonym questions test vocabulary beyond everyday usage.</p><div class='formula-box'><strong>Advanced Synonym Pairs</strong><br/>ABSTEMIOUS is to MODERATE, TEMPERATE<br/>CACOPHONOUS is to HARSH, GRATING<br/>DILATORY is to SLOW, TARDY<br/>INEFFABLE is to INDESCRIBABLE, UNUTTERABLE<br/>OBDURATE is to STUBBORN, UNYIELDING</div>",
      examInsight: "Consistent vocabulary building through reading and word lists is the best preparation.",
      practiceProblems: [
        { question: "Which is a synonym for 'obdurate'?", options: ["flexible", "compliant", "stubborn", "yielding"], answer: "C", solution: "<p>Obdurate means stubbornly persistent.</p>" },
        { question: "Which is a synonym for 'ineffable'?", options: ["expressible", "indescribable", "clear", "obvious"], answer: "B", solution: "<p>Ineffable means too great to be expressed. Indescribable means unable to be described.</p>" },
        { question: "Which is a synonym for 'cacophonous'?", options: ["melodious", "harmonious", "harsh", "pleasant"], answer: "C", solution: "<p>Cacophonous means harsh-sounding.</p>" }
      ]
    },
    {
      title: "15.6 Eliminating Wrong Answers",
      content: "<p>If unsure, cross out antonyms, unrelated words, and near-synonyms.</p><div class='formula-box'><strong>Elimination Strategy</strong><br/>1. Identify and remove antonyms<br/>2. Remove words that don't fit the context<br/>3. Compare remaining choices</div>",
      examInsight: "Elimination is essential for difficult questions.",
      practiceProblems: [
        { question: "Which is a synonym for 'verbose'?", options: ["wordy", "brief", "concise", "terse"], answer: "A", solution: "<p>Verbose means using more words than needed. Wordy means the same.</p>" },
        { question: "Which is a synonym for 'placate'?", options: ["soothe", "enrage", "anger", "irritate"], answer: "A", solution: "<p>Placate means to make less angry. Soothe means to calm.</p>" },
        { question: "Which is a synonym for 'elucidate'?", options: ["clarify", "confuse", "obscure", "complicate"], answer: "A", solution: "<p>Elucidate means to make clear. Clarify means the same.</p>" }
      ]
    },
    {
      title: "15.7 Synonyms in Analogy Questions",
      content: "<p>Synonyms often appear in analogy questions. If the first pair are synonyms, the second pair must also be synonyms.</p><div class='formula-box'><strong>Synonym Analogies</strong><br/>HAPPY is to JOYFUL as SAD is to MELANCHOLY<br/>MAGNIFICENT is to GRANDIOSE as NARRATE is to TELL</div>",
      examInsight: "Recognizing synonym relationships is one of the most common analogy types.",
      practiceProblems: [
        { question: "MAGNIFICENT : GRANDIOSE ::", options: ["narrate : tell", "happy : sad", "big : small", "hot : cold"], answer: "A", solution: "<p>Magnificent and grandiose are synonyms. Narrate and tell are synonyms.</p>" },
        { question: "VERBOSE : WORDINESS ::", options: ["friendly : amicability", "happy : sadness", "big : small", "fast : slow"], answer: "A", solution: "<p>Verbose means exhibiting wordiness. Friendly means exhibiting amicability.</p>" },
        { question: "PARTISAN : SUPPORTER ::", options: ["opponent : adversary", "enemy : friend", "ally : foe", "neutral : partisan"], answer: "A", solution: "<p>Partisan and supporter are synonyms. Opponent and adversary are synonyms.</p>" }
      ]
    },
    {
      title: "15.8 Quantitative Comparison with Synonyms",
      content: "<p>Quantitative comparisons may involve synonym relationships.</p><div class='formula-box'><strong>Word Comparison</strong><br/>Compare pairs of words<br/>Identify the relationship<br/>Apply to the given pair</div>",
      examInsight: "More likely to appear in analogy questions than in standalone quantitative comparisons.",
      practiceProblems: [
        { question: "Which pair are most similar in meaning?", options: ["hot: warm", "big: small", "happy: sad", "quick: slow"], answer: "A", solution: "<p>Hot and warm are synonyms. The others are antonym pairs.</p>" },
        { question: "Which pair are most nearly synonymous?", options: ["laugh: cry", "run: walk", "eat: consume", "sleep: rest"], answer: "C", solution: "<p>Eat and consume are synonyms. Laugh:cry are antonyms.</p>" },
        { question: "Quantity A: Number of synonyms for big. Quantity B: Number of synonyms for large.", options: ["A is greater", "B is greater", "Equal", "Cannot determine"], answer: "C", solution: "<p>The synonyms for big and large overlap significantly. The numbers are equal.</p>" }
      ]
    }
  ]
};

fs.writeFileSync(
  require('path').resolve(__dirname, '..', '_chapter-data.json'),
  JSON.stringify(data, null, 2),
  'utf-8'
);
console.log('Written Ch15');
