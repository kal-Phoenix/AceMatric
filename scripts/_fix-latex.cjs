const fs = require('fs');

const supMap = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺', 'n': 'ⁿ', 'T': 'ᵀ', 'x': 'ˣ', 'i': 'ⁱ', 'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'y': 'ʸ', 'z': 'ᶻ' };
const subMap = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', 'n': 'ₙ', 'x': 'ₓ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'm': 'ₘ', 'p': 'ₚ', '+': '₊', '-': '₋', 'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'r': 'ᵣ', 'u': 'ᵤ', 'v': 'ᵥ' };

function toSup(text) { return [...text].map(c => supMap[c] || c).join(''); }
function toSub(text) { return [...text].map(c => subMap[c] || c).join(''); }

function fixLatex(text) {
  if (!text) return text;
  let s = text;

  // Normalize double backslashes to single
  s = s.replace(/\\\\/g, '\\');

  // Remove \( \) delimiters  
  s = s.replace(/\\\(/g, '');
  s = s.replace(/\\\)/g, '');

  // Convert \{ and \} to { and }
  s = s.replace(/\\\{/g, '{');
  s = s.replace(/\\\}/g, '}');

  // Named commands - do these BEFORE brace handling
  s = s.replace(/\\times/g, '×');
  s = s.replace(/\\cdot/g, '·');
  s = s.replace(/\\pi/g, 'π');
  s = s.replace(/\\infty/g, '∞');
  s = s.replace(/\\leq/g, '≤');
  s = s.replace(/\\geq/g, '≥');
  s = s.replace(/\\neq/g, '≠');
  s = s.replace(/\\pm/g, '±');
  s = s.replace(/\\mp/g, '∓');
  s = s.replace(/\\to/g, '→');
  s = s.replace(/\\Rightarrow/g, '⇒');
  s = s.replace(/\\Leftrightarrow/g, '⇔');
  s = s.replace(/\\therefore/g, '∴');
  s = s.replace(/\\forall/g, '∀');
  s = s.replace(/\\exists/g, '∃');
  s = s.replace(/\\in(?=\s)/g, '∈');
  s = s.replace(/\\subset/g, '⊂');
  s = s.replace(/\\cup/g, '∪');
  s = s.replace(/\\cap/g, '∩');
  s = s.replace(/\\sum/g, 'Σ');
  s = s.replace(/\\prod/g, 'Π');
  s = s.replace(/\\int/g, '∫');
  s = s.replace(/\\ell n/g, 'ln');
  s = s.replace(/\\ell/g, 'ℓ');
  s = s.replace(/\\cos/g, 'cos');
  s = s.replace(/\\sin/g, 'sin');
  s = s.replace(/\\tan/g, 'tan');
  s = s.replace(/\\sec/g, 'sec');
  s = s.replace(/\\csc/g, 'csc');
  s = s.replace(/\\cot/g, 'cot');
  s = s.replace(/\\log/g, 'log');
  s = s.replace(/\\ln/g, 'ln');
  s = s.replace(/\\lim/g, 'lim');
  s = s.replace(/\\prime/g, '′');
  s = s.replace(/\\mathrm\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathbb\{R\}/g, 'ℝ');
  s = s.replace(/\\mathbb\{N\}/g, 'ℕ');
  s = s.replace(/\\mathbb\{Z\}/g, 'ℤ');
  s = s.replace(/\\boxed\s*\{([^}]*)\}/g, '$1');
  s = s.replace(/\\sqrt\{([^}]*)\}/g, '√($1)');
  s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
  s = s.replace(/\\left/g, '');
  s = s.replace(/\\right/g, '');
  s = s.replace(/\\begin\{[^}]*\}/g, '');
  s = s.replace(/\\end\{[^}]*\}/g, '');
  s = s.replace(/\\alpha/g, 'α');
  s = s.replace(/\\beta/g, 'β');
  s = s.replace(/\\gamma/g, 'γ');
  s = s.replace(/\\delta/g, 'δ');
  s = s.replace(/\\theta/g, 'θ');
  s = s.replace(/\\lambda/g, 'λ');
  s = s.replace(/\\sigma/g, 'σ');
  s = s.replace(/\\omega/g, 'ω');
  s = s.replace(/\\phi/g, 'φ');
  s = s.replace(/\\rho/g, 'ρ');
  s = s.replace(/\\mu/g, 'μ');
  s = s.replace(/\\epsilon/g, 'ε');

  // Handle ^{...} and _{...} with braces FIRST (greedy)
  s = s.replace(/\^\{([^{}]*)\}/g, (_, exp) => toSup(exp));
  s = s.replace(/_\{([^{}]*)\}/g, (_, sub) => toSub(sub));

  // Handle single char ^ and _ (only after brace versions are done)
  s = s.replace(/\^([a-zA-Z0-9])/g, (_, c) => supMap[c] || '^' + c);
  s = s.replace(/_([a-zA-Z0-9])/g, (_, c) => subMap[c] || '_' + c);

  // Remove remaining \commands
  s = s.replace(/\\([a-zA-Z]+)/g, (match) => {
    const keep = { 'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ', 'theta': 'θ', 'lambda': 'λ', 'sigma': 'σ', 'omega': 'ω', 'phi': 'φ', 'rho': 'ρ', 'mu': 'μ', 'epsilon': 'ε' };
    const cmd = match.slice(1).toLowerCase();
    return keep[cmd] || match;
  });

  // Final cleanup
  s = s.replace(/\\(?![\\])/g, '');

  return s;
}

const targetFile = process.argv[2] || 'storage/past-exams/physics-g12-2005ec.json';
let raw = fs.readFileSync(targetFile, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);

function fixObj(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') obj[k] = fixLatex(v);
    else if (Array.isArray(v)) v.forEach((item, i) => {
      if (typeof item === 'string') v[i] = fixLatex(item);
      else if (typeof item === 'object' && item) fixObj(item);
    });
    else if (typeof v === 'object' && v) fixObj(v);
  }
}
fixObj(data);

fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf8');

// Verify
console.log('[done] LaTeX converted —', data.questions.length, 'questions');
console.log('Q1:', data.questions[0].question);
console.log('Q2:', data.questions[1].question);
console.log('Q8:', data.questions[7].question);
