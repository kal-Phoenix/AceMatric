const fs = require('fs');
const path = require('path');

const ch1 = {
  chapterNumber: 1,
  title: "Sequences and Series",
  overview: "This unit introduces the fundamental concepts of sequences and series, including their definitions, types, and properties. You will learn about arithmetic and geometric progressions, how to use sigma notation for summation, and the behavior of infinite series.",
  corePoints: ["Definition of a sequence","Arithmetic sequence and common difference","Geometric sequence and common ratio","nth term formulas","Partial sums","Sum of arithmetic sequences","Sum of geometric sequences","Infinite series","Convergence and divergence","Recurring decimals"],
  examTips: "Exam questions often involve finding specific terms, sums, or determining if a series converges. Pay close attention to arithmetic and geometric sequences.",
  youtubeVideoId: "placeholder",
  videoDuration: "0:00",
  materials: [
    {name:"Sequence",formula:"a_n",description:"A sequence is an ordered list of numbers where each term follows a specific rule or pattern."},
    {name:"Arithmetic Sequence",formula:"A_n = A_1 + (n-1)d",description:"An arithmetic sequence where the difference between consecutive terms is constant (d)."},
    {name:"Geometric Sequence",formula:"G_n = G_1 * r^(n-1)",description:"A geometric sequence where the ratio between consecutive terms is constant (r)."},
    {name:"Sigma Notation",formula:"Σ (Sigma)",description:"A concise way to represent the sum of a sequence of terms."}
  ],
  subtopics: [
    {title:"1.1 Sequences",content:"<p>A <strong>sequence</strong> is a function whose domain is the set of positive integers. The values a₁, a₂, a₃, ..., aₙ are called the <strong>terms</strong>, with aₙ being the <strong>general term</strong>. Sequences are classified into <strong>finite sequences</strong> (have a last term) and <strong>infinite sequences</strong> (continue indefinitely).</p><p>For example, aₙ = 2n - 1 gives the sequence 1, 3, 5, 7, 9. A sequence can also be defined recursively, like the Fibonacci sequence.</p>",examInsight:"Be prepared to list the first few terms given a general term, and find the general term from a sequence."},
    {title:"1.2.1 Arithmetic Sequences",content:"<p>An <strong>arithmetic sequence</strong> has a constant difference between consecutive terms, called the <strong>common difference</strong> (d). The nᵗʰ term formula: <strong>Aₙ = A₁ + (n - 1)d</strong>.</p><p>For example, 2, 5, 8, 11, 14 has A₁ = 2 and d = 3. The 31ˢᵗ term: A₃₁ = 1 + (31-1) × 3 = 91.</p>",examInsight:"Common problems: find the nᵗʰ term given first term and d, or use two terms to determine the formula."},
    {title:"1.2.2 Geometric Sequences",content:"<p>A <strong>geometric sequence</strong> has a constant ratio between consecutive terms, called the <strong>common ratio</strong> (r). The nᵗʰ term: <strong>Gₙ = G₁ × r^(n-1)</strong>.</p><p>For example, 3, 6, 12, 24, 48 has G₁ = 3 and r = 2. The geometric mean between 2 and 8 is ±4.</p>",examInsight:"Look for questions on nᵗʰ term or sum. Pay attention to fractions or negative common ratios."},
    {title:"1.3 The Sigma Notation and Partial Sums",content:"<p><strong>Sigma notation</strong> (Σ) represents the sum of a sequence: ∑_{k=1}^{n} aₖ = a₁ + a₂ + ... + aₙ. A <strong>partial sum</strong> Sₙ is the sum of the first n terms.</p><p>Properties: ∑ c·aₖ = c·∑ aₖ and ∑ (aₖ + bₖ) = ∑ aₖ + ∑ bₖ.</p>",examInsight:"Practice converting between sigma notation and expanded sums."},
    {title:"1.3.2 Sum of Arithmetic Sequences",content:"<p>The sum of the first n terms: <strong>Sₙ = n/2 [2A₁ + (n-1)d]</strong> or <strong>Sₙ = n/2 (A₁ + Aₙ)</strong>.</p><p>Example: Sum of first 35 terms of Aₙ = 5n: S₃₅ = 35/2 × (5 + 175) = 3150.</p>",examInsight:"Know when to use each version of the sum formula."},
    {title:"1.3.2 Sum of Geometric Sequences",content:"<p>The sum of the first n terms (r ≠ 1): <strong>Sₙ = G₁(1 - rⁿ)/(1 - r)</strong> or <strong>Sₙ = G₁(rⁿ - 1)/(r - 1)</strong>. If r = 1: Sₙ = nG₁.</p><p>Example: Sum of 1, 2, 4, 8, 16: S₅ = 1 × (2⁵ - 1)/(2 - 1) = 31.</p>",examInsight:"Frequently used formula. Practice solving for different variables."},
    {title:"1.4 Infinite Series",content:"<p>An <strong>infinite series</strong> is the sum of terms of an infinite sequence. If partial sums approach a finite value, the series <strong>converges</strong>. For geometric series with |r| < 1: <strong>S∞ = G₁/(1 - r)</strong>. If |r| ≥ 1, the series diverges.</p><p>Example: 3 + 1 + 1/3 + 1/9 + ... has G₁ = 3, r = 1/3, so S∞ = 3/(1 - 1/3) = 9/2.</p>",examInsight:"Determine convergence and find sums of geometric series."},
    {title:"1.4.2 Recurring Decimals",content:"<p>Recurring decimals are rational numbers with repeating patterns. <strong>Purely recurring</strong>: repetition starts immediately (0.4̄7̄). <strong>Mixed recurring</strong>: non-repeating digits before the pattern.</p><p>Convert to fraction: 0.4̄7̄ = 47/99. General rule: repeating digits over that many 9's.</p>",examInsight:"Master converting recurring decimals to fractions using geometric series."},
    {title:"1.5 Applications of Sequence and Series in Daily Life",content:"<p><strong>Arithmetic sequences</strong> model constant linear change (salary increases, savings plans). <strong>Geometric sequences</strong> model exponential growth/decay (compound interest, population growth, depreciation).</p><p>Example: Starting salary 32,500 Birr with 1,400 annual raise is arithmetic. Bank deposit at 6% interest grows geometrically.</p>",examInsight:"Be ready to solve word problems involving arithmetic or geometric growth."}
  ]
};

fs.writeFileSync(path.resolve(__dirname, '..', '_chapter-data.json'), JSON.stringify(ch1, null, 2), 'utf-8');
console.log('Written Maths Ch1');