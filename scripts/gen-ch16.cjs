const fs = require('fs');

const data = {
  chapterNumber: 16,
  title: "Analogies",
  overview: "Analogies test your ability to recognize relationships between pairs of words. You are given a pair of words with a specific relationship, and you must choose the answer pair that has the same relationship.",
  corePoints: [
    "Analogies compare two pairs of words",
    "The relationship must be the same for both pairs",
    "Common types: synonym, antonym, worker:tool, part:whole",
    "Other types: cause:effect, item:category, object:function",
    "Define the relationship in a sentence before looking at choices",
    "Beware of distractors that share a surface-level similarity",
    "Consider multiple meanings of words",
    "Look for the same part of speech pattern"
  ],
  examTips: "Analogies typically appear as 4-6 questions in the verbal section. State the relationship between the first two words in a clear, specific sentence, then test that sentence on each answer pair.",
  youtubeVideoId: "placeholder",
  videoDuration: "14:20",
  materials: [
    { name: "Synonym Analogy", formula: "Word is to Synonym as AnotherWord is to ItsSynonym", description: "Both pairs are synonyms. Example: MAGNIFICENT is to GRANDIOSE as NARRATE is to TELL." },
    { name: "Antonym Analogy", formula: "Word is to Antonym as AnotherWord is to ItsAntonym", description: "Both pairs are antonyms. Example: HELP is to HINDER as LOVE is to HATE." },
    { name: "Worker:Tool Analogy", formula: "Worker is to Tool as AnotherWorker is to ItsTool", description: "The first word is a person, the second is the tool they use." },
    { name: "Part:Whole Analogy", formula: "Part is to Whole as AnotherPart is to AnotherWhole", description: "The first word is a part of the second. Example: FINGER is to HAND as PAGE is to BOOK." },
    { name: "Worker:Creation Analogy", formula: "Worker is to Creation as AnotherWorker is to ItsCreation", description: "The first word is a person who creates the second." },
    { name: "Degree of Intensity", formula: "Less is to More as AnotherLess is to AnotherMore", description: "One word is a milder version of the other." },
    { name: "Definition Analogy", formula: "Word is to ItsDefinition as AnotherWord is to ItsDefinition", description: "The second word defines the first." }
  ],
  subtopics: [
    {
      title: "16.1 What is an Analogy?",
      content: "<p>A verbal analogy expresses a relationship between two sets of words. To solve an analogy, identify the relationship and find the answer pair that matches it.</p><div class='formula-box'><strong>Analogy Structure</strong><br/>A : B as C : D<br/>A is to B as C is to D<br/>The relationship between A and B must be the same as between C and D.</div>",
      examInsight: "Analogies are always the first or second question type in the verbal section.",
      practiceProblems: [
        { question: "MAPLE : TREE as", options: ["acorn : oak", "hen : rooster", "rose : flower", "shrub : lilac"], answer: "C", solution: "<p>Maple is a type of tree. Rose is a type of flower.</p>" },
        { question: "JOYFUL : GLOOMY as", options: ["cheerful : happy", "strong : weak", "quick : fast", "hungry : starving"], answer: "B", solution: "<p>Joyful and gloomy are antonyms. Strong and weak are antonyms.</p>" },
        { question: "BOTANIST : MICROSCOPE as", options: ["carpenter : hammer", "teacher : classroom", "surgeon : patient", "driver : car"], answer: "A", solution: "<p>A botanist uses a microscope. A carpenter uses a hammer. Both are worker:tool.</p>" }
      ]
    },
    {
      title: "16.2 Synonyms and Antonyms Analogies",
      content: "<p>In synonym analogies, both pairs are synonyms. In antonym analogies, both pairs are antonyms.</p><div class='formula-box'><strong>Synonym and Antonym Analogies</strong><br/>Synonym: BIG is to LARGE as SMALL is to LITTLE<br/>Antonym: HOT is to COLD as DAY is to NIGHT</div>",
      examInsight: "These are the most common analogy types.",
      practiceProblems: [
        { question: "MAGNIFICENT : GRANDIOSE as", options: ["narrate : tell", "happy : sad", "big : small", "hot : cold"], answer: "A", solution: "<p>Magnificent and grandiose are synonyms. Narrate and tell are synonyms.</p>" },
        { question: "CONCERNED : INDIFFERENT as", options: ["worried : anxious", "happy : joyful", "interested : bored", "angry : furious"], answer: "C", solution: "<p>Concerned and indifferent are antonyms. Interested and bored are antonyms.</p>" },
        { question: "WAX : WANE as", options: ["grow : shrink", "increase : grow", "decrease : decline", "rise : fall"], answer: "A", solution: "<p>Wax and wane are antonyms. Grow and shrink are antonyms.</p>" }
      ]
    },
    {
      title: "16.3 Worker and Tool Relationships",
      content: "<p>In worker:tool analogies, the first word is a person and the second is the tool they use.</p><div class='formula-box'><strong>Worker:Tool Analogies</strong><br/>PAINTER is to BRUSH as CARPENTER is to HAMMER<br/>SURGEON is to SCALPEL as GOLFER is to CLUB</div>",
      examInsight: "Look for the tool specifically associated with the worker.",
      practiceProblems: [
        { question: "PAINTER : BRUSH as", options: ["carpenter : hammer", "surgeon : scalpel", "sculptor : chisel", "all of the above"], answer: "D", solution: "<p>All are worker:tool pairs.</p>" },
        { question: "SURGEON : SCALPEL as", options: ["teacher : chalk", "lumberjack : saw", "writer : pen", "all of the above"], answer: "D", solution: "<p>All are worker:tool pairs.</p>" },
        { question: "GOLFER : CLUB as", options: ["tennis player : racket", "baseball player : bat", "cricketer : bat", "all of the above"], answer: "D", solution: "<p>All are sports player:equipment pairs.</p>" }
      ]
    },
    {
      title: "16.4 Part to Whole Relationships",
      content: "<p>In part:whole analogies, the first word is a component of the second word.</p><div class='formula-box'><strong>Part:Whole Analogies</strong><br/>FINGER is to HAND as PAGE is to BOOK<br/>LETTER is to WORD as ISLAND is to ARCHIPELAGO</div>",
      examInsight: "This is a very common analogy type. The key is to identify the correct whole.",
      practiceProblems: [
        { question: "FINGER : HAND as", options: ["toe : foot", "petal : flower", "wheel : car", "all of the above"], answer: "D", solution: "<p>All are part:whole pairs.</p>" },
        { question: "PAGE : BOOK as", options: ["chapter : novel", "leaf : tree", "room : house", "all of the above"], answer: "D", solution: "<p>All are part:whole pairs.</p>" },
        { question: "LION : PRIDE as", options: ["fish : school", "bird : flock", "wolf : pack", "all of the above"], answer: "D", solution: "<p>All are member:group pairs.</p>" }
      ]
    },
    {
      title: "16.5 Worker and Creation Relationships",
      content: "<p>In worker:creation analogies, the first word is a person and the second is the thing they create.</p><div class='formula-box'><strong>Worker:Creation Analogies</strong><br/>POET is to SONNET as SCULPTOR is to STATUE<br/>ARCHITECT is to BLUEPRINT as MASON is to WALL</div>",
      examInsight: "Look for the product the worker is famous for creating.",
      practiceProblems: [
        { question: "POET : SONNET as", options: ["artist : painting", "musician : symphony", "writer : novel", "all of the above"], answer: "D", solution: "<p>All are worker:creation pairs.</p>" },
        { question: "ARCHITECT : BLUEPRINT as", options: ["teacher : lesson", "doctor : prescription", "programmer : code", "all of the above"], answer: "D", solution: "<p>All are worker:creation pairs.</p>" },
        { question: "MASON : WALL as", options: ["carpenter : table", "sculptor : statue", "writer : book", "all of the above"], answer: "D", solution: "<p>All are worker:creation pairs.</p>" }
      ]
    },
    {
      title: "16.6 Degree of Intensity",
      content: "<p>In degree of intensity analogies, the first word is a milder version of the second.</p><div class='formula-box'><strong>Degree of Intensity</strong><br/>LUKEWARM is to BOILING as ANNOYED is to FURIOUS<br/>FLURRY is to BLIZZARD as RAIN is to TORRENT</div>",
      examInsight: "Look for pairs where one word is a stronger version of the other.",
      practiceProblems: [
        { question: "LUKEWARM : BOILING as", options: ["cold : freezing", "warm : hot", "cool : chilly", "all of the above"], answer: "D", solution: "<p>All show degree of intensity.</p>" },
        { question: "ANNOYED : FURIOUS as", options: ["happy : ecstatic", "sad : devastated", "tired : exhausted", "all of the above"], answer: "D", solution: "<p>All show degree of intensity.</p>" },
        { question: "FLURRY : BLIZZARD as", options: ["drizzle : downpour", "breeze : gale", "stream : river", "all of the above"], answer: "D", solution: "<p>All show degree of intensity or size.</p>" }
      ]
    },
    {
      title: "16.7 Definition and Characteristics",
      content: "<p>Some analogies rely on definition or defining characteristics.</p><div class='formula-box'><strong>Definition Analogies</strong><br/>REFUGE is to SHELTER as NOMAD is to WANDER<br/>TIGER is to CARNIVOROUS as COW is to HERBIVOROUS</div>",
      examInsight: "The key is to identify the essential characteristic that defines the first word.",
      practiceProblems: [
        { question: "REFUGE : SHELTER as", options: ["nomad : wander", "artist : paint", "teacher : teach", "all of the above"], answer: "D", solution: "<p>All are definition analogies.</p>" },
        { question: "TIGER : CARNIVOROUS as", options: ["cow : herbivorous", "eagle : carnivorous", "shark : carnivorous", "all of the above"], answer: "D", solution: "<p>All are defining characteristic analogies.</p>" },
        { question: "HIVE : BEE as", options: ["nest : bird", "den : bear", "stable : horse", "all of the above"], answer: "D", solution: "<p>All are dwelling:inhabitant pairs.</p>" }
      ]
    },
    {
      title: "16.8 Object and Function",
      content: "<p>In object:function analogies, the first word is an object and the second is what it does.</p><div class='formula-box'><strong>Object:Function Analogies</strong><br/>KNIFE is to BREAD as PEN is to PAPER<br/>RAKE is to LEAVES as SAW is to WOOD</div>",
      examInsight: "Look for the action the object is most associated with.",
      practiceProblems: [
        { question: "KNIFE : BREAD as", options: ["axe : wood", "scissors : paper", "saw : wood", "all of the above"], answer: "D", solution: "<p>All are object:function pairs.</p>" },
        { question: "PEN : PAPER as", options: ["chalk : board", "paint : canvas", "pencil : paper", "all of the above"], answer: "D", solution: "<p>All are object:surface pairs.</p>" },
        { question: "RAKE : LEAVES as", options: ["broom : floor", "shovel : snow", "net : fish", "all of the above"], answer: "D", solution: "<p>All are object:function pairs.</p>" }
      ]
    },
    {
      title: "16.9 More Complex Analogies",
      content: "<p>Some analogies combine multiple relationship types or involve less common patterns.</p><div class='formula-box'><strong>Complex Analogies</strong><br/>RODENT is to SQUIRREL (class:member)<br/>MUMBLE is to SPEAK (manner)<br/>DOE is to STAG (female:male)<br/>DOVE is to PEACE (symbolism)</div>",
      examInsight: "Less common but appear occasionally. These require careful reasoning.",
      practiceProblems: [
        { question: "RODENT : SQUIRREL as", options: ["reptile : snake", "bird : eagle", "fish : salmon", "all of the above"], answer: "D", solution: "<p>All are class:member pairs.</p>" },
        { question: "MUMBLE : SPEAK as", options: ["strut : walk", "whisper : talk", "stutter : speak", "all of the above"], answer: "D", solution: "<p>All are manner analogies.</p>" },
        { question: "DOE : STAG as", options: ["cow : bull", "hen : rooster", "ewe : ram", "all of the above"], answer: "D", solution: "<p>All are female:male pairs.</p>" }
      ]
    },
    {
      title: "16.10 Quantitative Comparison with Analogies",
      content: "<p>Some questions may ask you to compare the strength or type of relationship between two analogies.</p><div class='formula-box'><strong>Analogy Comparison</strong><br/>Compare the relationship in each pair<br/>Identify the strongest or most parallel match<br/>Consider synonyms, antonyms, and other types</div>",
      examInsight: "Less common but appears occasionally.",
      practiceProblems: [
        { question: "Which is most similar to HOT : COLD?", options: ["big : small", "happy : joyful", "run : walk", "eat : consume"], answer: "A", solution: "<p>HOT:COLD are antonyms. BIG:SMALL are antonyms.</p>" },
        { question: "Which is most similar to PAINTER : BRUSH?", options: ["surgeon : scalpel", "teacher : classroom", "writer : book", "driver : car"], answer: "A", solution: "<p>PAINTER:BRUSH is worker:tool. SURGEON:SCALPEL is worker:tool.</p>" },
        { question: "Quantity A: Number of synonym analogies in a set. Quantity B: Number of antonym analogies in the same set.", options: ["A is greater", "B is greater", "Equal", "Cannot determine"], answer: "D", solution: "<p>Without the specific set, we cannot know.</p>" }
      ]
    }
  ]
};

fs.writeFileSync(
  require('path').resolve(__dirname, '..', '_chapter-data.json'),
  JSON.stringify(data, null, 2),
  'utf-8'
);
console.log('Written Ch16');
