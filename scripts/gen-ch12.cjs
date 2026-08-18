const fs = require('fs');

const data = {
  chapterNumber: 12,
  title: "Statistics Basics",
  overview: "This chapter covers the fundamental concepts of statistics: measures of central tendency (mean, median, mode) and measures of spread (range, standard deviation). You'll learn to compute these statistics from data sets, interpret them, and apply them in word problems and data interpretation questions.",
  corePoints: [
    "Mean = sum of values / number of values",
    "Median = middle value when data is ordered",
    "Mode = most frequent value",
    "Range = maximum − minimum",
    "Standard deviation measures spread from the mean",
    "Outliers affect mean more than median",
    "Interpreting data sets and charts"
  ],
  examTips: "Statistics questions appear in 2-3 questions per exam, often as data interpretation from tables or graphs. Mean and median are the most tested.",
  youtubeVideoId: "placeholder",
  videoDuration: "14:50",
  materials: [
    { name: "Mean (Arithmetic Average)", formula: "Mean = (Σx)/n", description: "The sum of all values divided by the number of values. Sensitive to outliers." },
    { name: "Median", formula: "Middle value when data is ordered", description: "If n is odd, median = middle term. If n is even, median = average of two middle terms." },
    { name: "Mode", formula: "Most frequently occurring value", description: "A data set can have no mode, one mode, or multiple modes." },
    { name: "Range", formula: "Range = Maximum − Minimum", description: "A simple measure of spread. Highly sensitive to outliers." },
    { name: "Standard Deviation", formula: "σ = √[(Σ(x−μ)²)/n]", description: "Measures how spread out values are from the mean." }
  ],
  subtopics: [
    {
      title: "12.1 Mean (Arithmetic Average)",
      content: "<p>The mean is the sum of all data values divided by the number of values. It is sensitive to outliers.</p><div class='formula-box'><strong>Mean Formula</strong><br/>Mean = (Σx)/n</div><p><strong>Extreme Fact:</strong> If you add a value greater than the mean, the mean increases.</p>",
      examInsight: "Frequently tested as a direct computation or in word problems with missing values.",
      practiceProblems: [
        { question: "What is the mean of: 4, 8, 12, 16, 20?", options: ["10", "11", "12", "13"], answer: "C", solution: "<p>Sum = 60. Mean = 60/5 = 12.</p>" },
        { question: "If the mean of 5 numbers is 18, and four are 15, 17, 19, 21, what is the fifth?", options: ["16", "18", "20", "22"], answer: "B", solution: "<p>Sum = 90. Fifth = 90 − 72 = 18.</p>" },
        { question: "Average of 6 scores is 75. A 7th score makes average 77. What is the 7th?", options: ["83", "85", "87", "89"], answer: "D", solution: "<p>Sum6 = 450. Sum7 = 539. Seventh = 89.</p>" }
      ]
    },
    {
      title: "12.2 Median",
      content: "<p>The median is the middle value when data is ordered. If n is odd, it's the middle. If n is even, it's the average of two middle values. Resistant to outliers.</p><div class='formula-box'><strong>Median</strong><br/>Odd: middle value<br/>Even: average of two middle</div>",
      examInsight: "Often tested alongside mean. Compare mean and median to determine skew.",
      practiceProblems: [
        { question: "Median of 2, 5, 8, 11, 14?", options: ["6", "7", "8", "9"], answer: "C", solution: "<p>Middle value is 8.</p>" },
        { question: "Median of 3, 7, 9, 12, 18, 25?", options: ["9", "10.5", "12", "13.5"], answer: "B", solution: "<p>Two middle: 9 and 12. Median = 10.5.</p>" },
        { question: "Which is most affected by an outlier?", options: ["Median", "Mean", "Mode", "Range"], answer: "B", solution: "<p>Mean is pulled by outliers.</p>" }
      ]
    },
    {
      title: "12.3 Mode",
      content: "<p>The mode is the most frequently occurring value. A set can have one mode, multiple modes, or no mode.</p><div class='formula-box'><strong>Mode</strong><br/>Most frequent value</div>",
      examInsight: "Less common but appears in data interpretation with frequency tables.",
      practiceProblems: [
        { question: "Mode of 3, 5, 7, 7, 9, 11, 11, 11?", options: ["7", "9", "11", "No mode"], answer: "C", solution: "<p>11 appears most (3 times).</p>" },
        { question: "Mode of 2, 2, 4, 4, 6, 8?", options: ["2", "4", "2 and 4", "No mode"], answer: "C", solution: "<p>Both 2 and 4 appear twice (bimodal).</p>" },
        { question: "Mean=10, Median=12, Mode=15. Skew?", options: ["Symmetric", "Skewed left", "Skewed right", "Cannot determine"], answer: "C", solution: "<p>Mean < Median < Mode = right-skewed.</p>" }
      ]
    },
    {
      title: "12.4 Range",
      content: "<p>Range = Maximum − Minimum. Simple but sensitive to outliers.</p><div class='formula-box'><strong>Range</strong><br/>Range = Max − Min</div>",
      examInsight: "Appears in data interpretation and comparing spreads.",
      practiceProblems: [
        { question: "Range of 12, 15, 18, 21, 24, 27?", options: ["15", "12", "9", "6"], answer: "A", solution: "<p>27 − 12 = 15.</p>" },
        { question: "Range is 20, min is 15. Max?", options: ["25", "30", "35", "40"], answer: "C", solution: "<p>Max = 20 + 15 = 35.</p>" },
        { question: "Which is most affected by outliers?", options: ["Range", "Standard deviation", "Both", "Neither"], answer: "A", solution: "<p>Range uses only max and min.</p>" }
      ]
    },
    {
      title: "12.5 Standard Deviation (Intuitive)",
      content: "<p>Standard deviation measures spread from the mean. You don't need to compute it; compare relative spreads.</p><div class='formula-box'><strong>Standard Deviation</strong><br/>σ = √[(Σ(x−μ)²)/n]</div><p><strong>Extreme Fact:</strong> Adding a constant doesn't change σ. Multiplying by constant c multiplies σ by |c|.</p>",
      examInsight: "Usually tested conceptually: compare standard deviations or understand transformations.",
      practiceProblems: [
        { question: "A: 5,5,5,5,5. B: 1,3,5,7,9. Which has larger σ?", options: ["A", "B", "Equal", "Cannot determine"], answer: "B", solution: "<p>A has σ=0. B has σ>0.</p>" },
        { question: "All values increased by 10. σ?", options: ["Increases", "Decreases", "Stays same", "Cannot determine"], answer: "C", solution: "<p>Adding constant doesn't change spread.</p>" },
        { question: "All values multiplied by 2. σ?", options: ["Doubles", "Halves", "Quadruples", "Stays same"], answer: "A", solution: "<p>σ multiplies by |2|.</p>" }
      ]
    },
    {
      title: "12.6 Data Interpretation from Tables and Charts",
      content: "<p>Statistics questions often involve interpreting data from tables, bar graphs, histograms, or line plots.</p><div class='formula-box'><strong>Tips</strong><br/>• Read axes carefully<br/>• For grouped data, use midpoints<br/>• Identify mode from frequencies<br/>• Compare spreads visually</div>",
      examInsight: "2-3 questions based on a single table or graph.",
      practiceProblems: [
        { question: "Freq table: Score 10 (freq 2), 20 (3), 30 (5). Mean?", options: ["20", "22", "23", "24"], answer: "C", solution: "<p>Sum = 230. Total = 10. Mean = 23.</p>" },
        { question: "5 scored 70, 8 scored 80, 7 scored 90. How many scored 80+?", options: ["8", "12", "15", "20"], answer: "C", solution: "<p>8 + 7 = 15.</p>" },
        { question: "Histogram: 0-10 (2), 10-20 (5), 20-30 (3). Median bin?", options: ["0-10", "10-20", "20-30", "Cannot determine"], answer: "B", solution: "<p>Total=10. Median position=5.5. Falls in 10-20.</p>" }
      ]
    },
    {
      title: "12.7 Quantitative Comparison with Statistics",
      content: "<p>Comparing means, medians, or ranges of data sets.</p><div class='formula-box'><strong>Strategies</strong><br/>• Value above mean increases mean<br/>• Value below mean decreases mean<br/>• Median changes only when values cross the middle</div>",
      examInsight: "Compare mean and median of same data set, or means of two sets.",
      practiceProblems: [
        { question: "A: 2,4,6,8,10. B: 4,5,6,7,8. Quantity A: Mean A. Quantity B: Mean B.", options: ["A > B", "B > A", "Equal", "Cannot determine"], answer: "C", solution: "<p>Both means = 6.</p>" },
        { question: "Data: 2,4,6,8,10. A: Mean. B: Median.", options: ["A > B", "B > A", "Equal", "Cannot determine"], answer: "C", solution: "<p>Mean = 6, Median = 6.</p>" },
        { question: "Data: 1,2,3,4,100. A: Mean. B: Median.", options: ["A > B", "B > A", "Equal", "Cannot determine"], answer: "A", solution: "<p>Mean = 22, Median = 3. A > B.</p>" }
      ]
    }
  ]
};

fs.writeFileSync(
  require('path').resolve(__dirname, '..', '_chapter-data.json'),
  JSON.stringify(data, null, 2),
  'utf-8'
);
console.log('Written Ch12');
