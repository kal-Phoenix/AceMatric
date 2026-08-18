const fs = require('fs');

const data = {
  chapterNumber: 13,
  title: "Logical and Numerical Reasoning",
  overview: "This chapter covers non-standard reasoning and pattern-based problems common on the UEE/SAT: number series, letter series, coding-decoding, direction sense, blood relations, classification, and non-verbal patterns.",
  corePoints: [
    "Number series: arithmetic, geometric, alternating, and complex patterns",
    "Letter series: alphabet positions and relationships",
    "Coding-decoding: letter shifting, number mapping, symbol substitution",
    "Direction sense: cardinal directions, turns, and distances",
    "Blood relations: family tree logic and relations",
    "Classification: identifying odd ones out based on properties",
    "Non-verbal patterns: sequences of shapes, rotations, and symmetries"
  ],
  examTips: "Logical reasoning questions typically appear as a block of 3-5 items. They test your ability to recognize patterns quickly. The most common traps are assuming a pattern too early or missing alternating sequences.",
  youtubeVideoId: "placeholder",
  videoDuration: "18:00",
  materials: [
    { name: "Number Series Pattern Types", formula: "Arithmetic, Geometric, Alternating, Difference Pattern", description: "Common patterns: constant difference, constant ratio, alternating operations, or differences that form a sequence." },
    { name: "Alphabet Positions", formula: "A=1, B=2, ..., Z=26", description: "The foundation of letter-series and coding problems." },
    { name: "Coding-Decoding Logic", formula: "Shifts: +/- n positions, reverse order, mirror letters", description: "Codes may involve shifting letters forward or backward, reversing the alphabet, or combining multiple rules." },
    { name: "Direction Sense Framework", formula: "N -> E -> S -> W (clockwise)", description: "Use a coordinate grid or draw the path. Every 90 degree turn changes direction." },
    { name: "Blood Relations Logic", formula: "Parent, Child, Sibling, Spouse, Grandparent", description: "Draw a family tree to track relationships." },
    { name: "Classification Criteria", formula: "Common properties: even/odd, prime/composite, vowels/consonants", description: "Identify the property that one item lacks compared to others." },
    { name: "Non-Verbal Pattern Rules", formula: "Rotation, reflection, scaling, color change, position shift", description: "Track one element at a time through the sequence." }
  ],
  subtopics: [
    {
      title: "Number Series Patterns",
      content: "<p>Number series require identifying the rule that generates consecutive terms. Common patterns: Arithmetic (constant difference), Geometric (constant ratio), Difference pattern (differences form a sequence), and Alternating (two interleaved sequences).</p><div class='formula-box'><strong>Pattern Recognition Tips</strong><br/>Check differences first. Check ratios if differences vary. Look for alternating operations.</div>",
      examInsight: "Frequently appears as find the next term or find the missing term.",
      practiceProblems: [
        { question: "What is the next term: 3, 7, 12, 18, 25, ___?", options: ["30", "32", "33", "35"], answer: "C", solution: "<p>Differences: 4, 5, 6, 7. Next = 8. Next term = 25 + 8 = 33.</p>" },
        { question: "Find the missing number: 2, 6, 18, 54, ___, 486.", options: ["108", "162", "216", "270"], answer: "B", solution: "<p>Geometric with r=3. Missing = 54 x 3 = 162.</p>" },
        { question: "What is the next term: 1, 4, 9, 16, 25, ___?", options: ["30", "32", "36", "49"], answer: "C", solution: "<p>Perfect squares. Next = 36.</p>" },
        { question: "Find the next term: 1, 2, 3, 5, 8, 13, ___?", options: ["18", "19", "20", "21"], answer: "D", solution: "<p>Fibonacci: 8 + 13 = 21.</p>" }
      ]
    },
    {
      title: "Number Series with Alternating Patterns",
      content: "<p>Some series alternate between two independent patterns. Odd positions follow one rule and even positions another. Identify each subsequence separately.</p><div class='formula-box'><strong>Alternating Pattern</strong><br/>Look at odd-position terms and even-position terms separately.</div>",
      examInsight: "A common trap: students assume a single pattern when two are interleaved.",
      practiceProblems: [
        { question: "Find the next term: 3, 8, 5, 10, 7, 12, 9, ___?", options: ["14", "15", "16", "18"], answer: "A", solution: "<p>Odd: 3,5,7,9 (+2). Even: 8,10,12 (+2). Next = 14.</p>" },
        { question: "What is the missing number: 1, 10, 3, 8, 5, 6, 7, ___?", options: ["4", "5", "6", "8"], answer: "A", solution: "<p>Odd: 1,3,5,7 (+2). Even: 10,8,6 (-2). Next = 4.</p>" },
        { question: "Find the next term: 2, 3, 6, 9, 18, 27, 54, ___?", options: ["81", "108", "162", "216"], answer: "A", solution: "<p>Odd: 2,6,18,54 (x3). Even: 3,9,27 (x3). Next = 81.</p>" }
      ]
    },
    {
      title: "Coding-Decoding (Letter Shifts)",
      content: "<p>Coding-decoding problems involve a rule that transforms letters. Common rules: shifting letters forward/backward by a fixed number, reversing the alphabet, or using position sums.</p><div class='formula-box'><strong>Common Coding Rules</strong><br/>Shift by +/- n. Reverse alphabet (A<->Z). Sum of positions.</div>",
      examInsight: "Appears as 1-2 questions. Check if the shift is constant.",
      practiceProblems: [
        { question: "If CAT is coded as FDW, what is the code for DOG?", options: ["GRJ", "GRI", "GSJ", "FQI"], answer: "A", solution: "<p>C->F (+3), A->D (+3), T->W (+3). DOG -> GRJ.</p>" },
        { question: "If APPLE is coded as BQQMF, what is the code for ORANGE?", options: ["PSBOHF", "PSBOHG", "PSCOHF", "PTCOHG"], answer: "A", solution: "<p>Each letter shifts +1. ORANGE -> PSBOHF.</p>" },
        { question: "If A=1, B=2, etc., what is the sum of the code for CAT?", options: ["22", "24", "26", "28"], answer: "B", solution: "<p>C=3, A=1, T=20. Sum = 24.</p>" }
      ]
    },
    {
      title: "Direction Sense Problems",
      content: "<p>Direction sense problems involve tracking movement on a plane. Use a compass: North, South, East, West. Turns are 90 degrees left or right. Draw a diagram and track net displacement.</p><div class='formula-box'><strong>Direction Sense Rules</strong><br/>North -> right = East, left = West. For diagonal moves, use Pythagoras.</div>",
      examInsight: "Appears as 1-2 questions. Draw a simple diagram to avoid mistakes.",
      practiceProblems: [
        { question: "A person walks 10 m north, then 5 m east, then 10 m south. How far and in which direction from start?", options: ["5 m east", "10 m east", "15 m east", "5 m west"], answer: "A", solution: "<p>Net N-S: 0. Net E-W: 5 m east.</p>" },
        { question: "Walks 8 km east, 6 km north, 8 km west. How far from start?", options: ["6 km", "8 km", "10 km", "14 km"], answer: "A", solution: "<p>Net E-W: 0. Net N-S: 6 km. Distance = 6 km.</p>" },
        { question: "Faces north, turns 90 clockwise, then 180 counterclockwise. Which direction now?", options: ["North", "South", "East", "West"], answer: "D", solution: "<p>North -> 90 CW = East -> 180 CCW = West.</p>" }
      ]
    },
    {
      title: "Blood Relations",
      content: "<p>Blood relation problems require understanding family relationships. Key relations: father/mother, son/daughter, brother/sister, husband/wife. Draw a family tree to track relationships.</p><div class='formula-box'><strong>Common Relations</strong><br/>A is brother of B means A and B share parent(s). A is mother of B means A is female parent.</div>",
      examInsight: "Usually 1 question. Draw a simple family tree.",
      practiceProblems: [
        { question: "A is brother of B. C is mother of A. D is father of B. How is C related to D?", options: ["Wife", "Sister", "Daughter", "Mother"], answer: "A", solution: "<p>A and B are siblings. C is mother, D is father. C is wife of D.</p>" },
        { question: "A is father of B. B is sister of C. C is son of D. How is A related to D?", options: ["Husband", "Brother", "Father", "Son"], answer: "A", solution: "<p>A is father of B and C. D is mother of C. A is husband of D.</p>" },
        { question: "A is mother of B. B is daughter of C. How is C related to A?", options: ["Husband", "Wife", "Brother", "Son"], answer: "A", solution: "<p>A is mother, C is other parent. C is husband of A.</p>" }
      ]
    },
    {
      title: "Classification (Odd One Out)",
      content: "<p>Classification problems require identifying the item that does not belong. Criteria can be numerical (even/odd, prime/composite), alphabetical (vowels/consonants), or logical (shapes by sides).</p><div class='formula-box'><strong>Classification Criteria</strong><br/>Numbers: even/odd, prime/composite, perfect squares. Letters: vowels/consonants. Words: category, meaning.</div>",
      examInsight: "Appears as 1 question. Look for a property that four share and one does not.",
      practiceProblems: [
        { question: "Which number does not belong: 2, 5, 11, 17, 21?", options: ["2", "5", "11", "21"], answer: "D", solution: "<p>2, 5, 11, 17 are prime. 21 is composite (3x7).</p>" },
        { question: "Which word does not belong: Car, Bus, Train, Bicycle, Airplane?", options: ["Car", "Bus", "Train", "Airplane"], answer: "D", solution: "<p>Car, Bus, Train, Bicycle are land vehicles. Airplane is air.</p>" },
        { question: "Which letter does not belong: A, E, I, O, U, Y?", options: ["A", "E", "I", "Y"], answer: "D", solution: "<p>A, E, I, O, U are vowels. Y is typically a consonant.</p>" }
      ]
    },
    {
      title: "Non-Verbal Pattern Reasoning",
      content: "<p>Non-verbal patterns involve sequences of shapes. Common transformations: Rotation (shape turns by fixed angle), Reflection (mirror image), Scaling (size change), Position shift (elements move), Color/fill change.</p><div class='formula-box'><strong>Visual Pattern Tips</strong><br/>Track one element at a time. Check rotation direction and angle. Look for symmetry.</div>",
      examInsight: "Appears as a sequence of figures. Determine the transformation, then apply to find the missing figure.",
      practiceProblems: [
        { question: "A triangle rotates 45 degrees clockwise each step. Starting at 0 degrees, what is the 5th shape orientation?", options: ["0", "45", "90", "180"], answer: "D", solution: "<p>1st: 0, 2nd: 45, 3rd: 90, 4th: 135, 5th: 180.</p>" },
        { question: "Sequence: Square, Circle, Square, Circle. Next figure?", options: ["Square", "Circle", "Triangle", "Cannot determine"], answer: "A", solution: "<p>Pattern alternates. Next is Square.</p>" },
        { question: "Dot moves one position clockwise each step. Starting at top, after 4 steps where is it?", options: ["Top", "Right", "Bottom", "Left"], answer: "A", solution: "<p>4 CW moves: Top->Right->Bottom->Left->Top.</p>" }
      ]
    },
    {
      title: "Mixed and Advanced Logical Reasoning",
      content: "<p>Some questions combine multiple reasoning elements. For example, a coding problem may involve both letter shifts and number positions, or a series may combine arithmetic and geometric patterns.</p><div class='formula-box'><strong>Mixed Pattern Strategy</strong><br/>1. Identify the type of problem. 2. Apply the core rule. 3. Check for secondary rules. 4. Verify with given examples.</div>",
      examInsight: "Less common but more challenging. These questions reward careful, methodical thinking.",
      practiceProblems: [
        { question: "A number series: 2, 5, 10, 17, 26. What is the 7th term?", options: ["50", "52", "54", "56"], answer: "A", solution: "<p>Differences: 3, 5, 7, 9 (increase by 2). Next: 11, 13. 6th=37, 7th=50.</p>" },
        { question: "Walks 3 km north, 4 km east, 5 km south. Shortest distance from start?", options: ["2 km", "4 km", "sqrt(32) km", "sqrt(20) km"], answer: "D", solution: "<p>Net N-S: -2 km. Net E-W: 4 km. Distance = sqrt(4+16) = sqrt(20).</p>" },
        { question: "If x is a positive integer and x squared is odd, compare x and 2.", options: ["x > 2", "x < 2", "x = 2", "Cannot determine"], answer: "D", solution: "<p>x is odd positive: 1, 3, 5. If x=1, x<2. If x=3, x>2. Cannot determine.</p>" }
      ]
    }
  ]
};

fs.writeFileSync(
  require('path').resolve(__dirname, '..', '_chapter-data.json'),
  JSON.stringify(data, null, 2),
  'utf-8'
);
console.log('Written Ch13');
