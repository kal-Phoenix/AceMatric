const fs = require('fs');

const data = {
  chapterNumber: 14,
  title: "Antonyms",
  overview: "Antonym questions test your vocabulary by asking you to identify the word that is most opposite in meaning to a given word. This chapter covers strategies for defining unfamiliar words, eliminating distractors, and recognizing when a word has multiple meanings.",
  corePoints: [
    "Antonym = word with opposite meaning",
    "Define the word before looking at choices",
    "Eliminate synonyms and unrelated words",
    "Consider multiple meanings of the key word",
    "Look for prefix clues (un-, in-, dis-)",
    "Use context sentences to clarify meaning",
    "Beware of near-antonyms and distractors"
  ],
  examTips: "Antonym questions typically appear as the first 3-5 questions in the verbal section. If you don't know a word, break it down into roots, prefixes, and suffixes.",
  youtubeVideoId: "placeholder",
  videoDuration: "12:00",
  materials: [
    { name: "PARTISAN", formula: "", description: "Adjective: strongly supporting a particular person or cause. Antonym: IMPARTIAL or NEUTRAL." },
    { name: "CONCEAL", formula: "", description: "Verb: to hide or keep from sight. Antonym: REVEAL or EXPOSE." },
    { name: "EXCEED", formula: "", description: "Verb: to be greater than or surpass. Antonym: FALL SHORT or DELIMIT." },
    { name: "NEUTRAL", formula: "", description: "Adjective: not supporting either side. Antonym: PARTISAN or BIASED." },
    { name: "ABATE", formula: "", description: "Verb: to reduce in intensity. Antonym: INTENSIFY or INCREASE." },
    { name: "OBDURATE", formula: "", description: "Adjective: stubbornly persistent in wrongdoing. Antonym: COMPLIANT or FLEXIBLE." },
    { name: "MITIGATE", formula: "", description: "Verb: to make less severe or painful. Antonym: AGGRAVATE or WORSEN." }
  ],
  subtopics: [
    {
      title: "14.1 What is an Antonym?",
      content: "<p>An antonym is a word that has the opposite meaning of another word. The key is to define the given word precisely before looking at the answer choices.</p><div class='formula-box'><strong>Antonym Definition</strong><br/>Word with opposite meaning<br/>Example: HOT is to COLD, HAPPY is to SAD</div>",
      examInsight: "Usually appears as the first question in the verbal section.",
      practiceProblems: [
        { question: "DEPRESS:", options: ["force", "allow", "clarify", "elate", "loosen"], answer: "D", solution: "<p>Depress means to make sad. Elate means to make happy.</p>" },
        { question: "PARTISAN:", options: ["neutral", "biased", "objective", "impartial", "unbiased"], answer: "A", solution: "<p>Partisan means strongly supporting a cause. Neutral means not supporting either side.</p>" },
        { question: "CONCEAL:", options: ["reveal", "hide", "ignore", "cover", "protect"], answer: "A", solution: "<p>Conceal means to hide. Reveal means to make known.</p>" }
      ]
    },
    {
      title: "14.2 Strategies for Defining the Key Word",
      content: "<p>Before looking at the choices, define the key word using these methods: synonym method, sentence method, or word parts analysis.</p><div class='formula-box'><strong>Word Analysis Tips</strong><br/>Prefixes: un- (not), in- (not), dis- (opposite)<br/>Roots: know common roots (bene = good, mal = bad)</div>",
      examInsight: "Students who can analyze word parts often outperform those who rely only on memorization.",
      practiceProblems: [
        { question: "OBDURATE:", options: ["stubborn", "compliant", "obstinate", "rigid", "unbending"], answer: "B", solution: "<p>Obdurate means stubbornly persistent. Compliant means willing to comply or yielding.</p>" },
        { question: "MITIGATE:", options: ["aggravate", "alleviate", "reduce", "soften", "diminish"], answer: "A", solution: "<p>Mitigate means to make less severe. Aggravate means to make worse.</p>" },
        { question: "EXCEED:", options: ["outstrip", "magnify", "delimit", "offset", "surpass"], answer: "C", solution: "<p>Exceed means to go beyond. Delimit means to set boundaries or limits.</p>" }
      ]
    },
    {
      title: "14.3 Common Prefixes and Their Meanings",
      content: "<p>Many antonym clues come from prefixes. Recognizing common prefixes can help you identify opposites without knowing the exact definition.</p><div class='formula-box'><strong>Common Prefixes</strong><br/>un- (not) unhappy = not happy<br/>in- (not) inactive = not active<br/>dis- (opposite) disagree = not agree<br/>anti- (against) antisocial = against society<br/>non- (not) nonstop = without stopping</div>",
      examInsight: "If you see a word with a negative prefix, the antonym is often the base word without the prefix.",
      practiceProblems: [
        { question: "UNSCRUPULOUS:", options: ["principled", "unethical", "corrupt", "deceitful", "dishonest"], answer: "A", solution: "<p>Unscrupulous means having no moral principles. Principled means having strong moral principles.</p>" },
        { question: "INDISPUTABLE:", options: ["questionable", "certain", "unquestionable", "evident", "obvious"], answer: "A", solution: "<p>Indisputable means not open to question. Questionable means doubtful.</p>" },
        { question: "INNOCUOUS:", options: ["harmful", "harmless", "safe", "benign", "gentle"], answer: "A", solution: "<p>Innocuous means harmless. Harmful means causing harm.</p>" }
      ]
    },
    {
      title: "14.4 Using Context and Sentences",
      content: "<p>If a word is unfamiliar, try to use it in a sentence. Context can provide clues to meaning.</p><div class='formula-box'><strong>Context Clues</strong><br/>Look for synonyms in the sentence<br/>Look for antonyms in the sentence<br/>Look for examples or definitions</div>",
      examInsight: "This strategy is especially useful for words with multiple meanings.",
      practiceProblems: [
        { question: "PERNICIOUS:", options: ["harmful", "beneficial", "destructive", "deadly", "malicious"], answer: "B", solution: "<p>Pernicious means harmful. Beneficial means having a good effect.</p>" },
        { question: "EPHEMERAL:", options: ["lasting", "fleeting", "temporary", "brief", "transient"], answer: "A", solution: "<p>Ephemeral means lasting a very short time. Lasting means enduring.</p>" },
        { question: "OBDURATE:", options: ["flexible", "stubborn", "unyielding", "hardened", "inflexible"], answer: "A", solution: "<p>Obdurate means stubborn. Flexible means able to change.</p>" }
      ]
    },
    {
      title: "14.5 Words with Multiple Meanings",
      content: "<p>Some words have more than one meaning. If none of the choices fit, consider other meanings of the key word.</p><div class='formula-box'><strong>Contronyms</strong><br/>Words with contradictory meanings<br/>cleave: to split / to adhere<br/>sanction: to approve / to punish<br/>bolt: to secure / to run away</div>",
      examInsight: "Always think of alternative meanings if the first one doesn't fit.",
      practiceProblems: [
        { question: "CLEAVE (meaning: to split):", options: ["adhere", "divide", "separate", "rend", "tear"], answer: "A", solution: "<p>Cleave can mean to split or to adhere. The opposite of split is adhere.</p>" },
        { question: "SANCTION (meaning: to approve):", options: ["punish", "allow", "authorize", "endorse", "ratify"], answer: "A", solution: "<p>Sanction can mean to approve or to punish. The opposite of approve is punish.</p>" },
        { question: "BOLT (meaning: to run away):", options: ["secure", "flee", "dash", "rush", "hurry"], answer: "A", solution: "<p>Bolt can mean to run away or to secure. The opposite of run away is secure.</p>" }
      ]
    },
    {
      title: "14.6 Eliminating Wrong Answers",
      content: "<p>If unsure, eliminate obviously wrong answers. Look for synonyms, unrelated words, and near-antonyms.</p><div class='formula-box'><strong>Elimination Strategy</strong><br/>1. Cross out synonyms of the key word<br/>2. Cross out unrelated words<br/>3. Compare remaining choices</div>",
      examInsight: "Eliminating even one or two choices improves your odds.",
      practiceProblems: [
        { question: "FORTUITOUS:", options: ["lucky", "unfortunate", "random", "chance", "accidental"], answer: "B", solution: "<p>Fortuitous means lucky. Unfortunate means not lucky.</p>" },
        { question: "MALLEABLE:", options: ["pliable", "rigid", "soft", "flexible", "ductile"], answer: "B", solution: "<p>Malleable means easily shaped. Rigid means not flexible.</p>" },
        { question: "TRANSIENT:", options: ["temporary", "permanent", "fleeting", "brief", "short-lived"], answer: "B", solution: "<p>Transient means temporary. Permanent means lasting.</p>" }
      ]
    },
    {
      title: "14.7 Advanced Vocabulary: Level 2 Antonyms",
      content: "<p>Some antonym questions test more advanced vocabulary. Building a strong vocabulary is the best defense.</p><div class='formula-box'><strong>Advanced Antonym Pairs</strong><br/>ABSTEMIOUS is to INDULGENT (moderate is to excessive)<br/>CACOPHONOUS is to EUPHONIOUS (harsh-sounding is to pleasant-sounding)<br/>DILATORY is to PUNCTUAL (slow is to prompt)</div>",
      examInsight: "These questions separate high-scoring students from average ones.",
      practiceProblems: [
        { question: "ABSTEMIOUS:", options: ["indulgent", "moderate", "temperate", "restrained", "frugal"], answer: "A", solution: "<p>Abstemious means moderate. Indulgent means excessive.</p>" },
        { question: "CACOPHONOUS:", options: ["melodious", "harsh", "grating", "raucous", "strident"], answer: "A", solution: "<p>Cacophonous means harsh-sounding. Melodious means pleasant-sounding.</p>" },
        { question: "DILATORY:", options: ["punctual", "slow", "tardy", "delaying", "procrastinating"], answer: "A", solution: "<p>Dilatory means slow. Punctual means on time.</p>" }
      ]
    },
    {
      title: "14.8 Quantitative Comparison with Antonyms",
      content: "<p>Some questions may ask you to compare the meanings or relationships of words.</p><div class='formula-box'><strong>Word Comparison</strong><br/>Compare pairs of words<br/>Identify the relationship<br/>Apply to the given pair</div>",
      examInsight: "More likely to appear in analogy questions than in pure antonym questions.",
      practiceProblems: [
        { question: "Which pair of words are antonyms?", options: ["hot: warm", "big: large", "happy: sad", "quick: fast"], answer: "C", solution: "<p>Hot:warm are synonyms. Happy:sad are antonyms.</p>" },
        { question: "Which pair are most nearly opposite?", options: ["laugh: cry", "run: walk", "eat: drink", "sleep: rest"], answer: "A", solution: "<p>Laugh and cry are opposite expressions of emotion.</p>" },
        { question: "Quantity A: Number of synonyms for happy. Quantity B: Number of antonyms for sad.", options: ["A is greater", "B is greater", "Equal", "Cannot determine"], answer: "C", solution: "<p>The sets overlap significantly, so the numbers are essentially equal.</p>" }
      ]
    }
  ]
};

fs.writeFileSync(
  require('path').resolve(__dirname, '..', '_chapter-data.json'),
  JSON.stringify(data, null, 2),
  'utf-8'
);
console.log('Written Ch14');
