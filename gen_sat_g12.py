import json

chapters = [
    "Numbers and Operations", "Algebra and Functions", "Geometry and Measurement",
    "Data Analysis and Probability", "Advanced Mathematics", "Problem Solving Strategies",
    "Critical Reading", "Writing and Language", "Essay Writing", "Vocabulary in Context",
    "Informational Graphics", "Evidence-Based Reasoning", "Pairs of Quantities",
    "Ratios and Proportional Relationships", "Percentage and Percent Change",
    "Data Interpretation", "Science Passage Analysis", "Social Science Passage Analysis",
    "Historical Passage Analysis", "Literary Passage Analysis", "Writing Revision",
    "Idioms and Common Expressions"
]

def make_q(ch, num, qt, opts, correct, expl, diff):
    return {
        "id": f"SAT-12-{ch:02d}-{num:02d}",
        "subject": "SAT", "stream": "Common",
        "chapter": f"Grade 12 - Chapter {ch}: {chapters[ch-1]}",
        "yearEC": "2024 E.C.", "questionText": qt,
        "hasImage": False, "imagePlaceholder": "",
        "options": [{"id":"a","text":opts[0]},{"id":"b","text":opts[1]},{"id":"c","text":opts[2]},{"id":"d","text":opts[3]}],
        "correctOptionId": correct, "explanation": expl, "difficulty": diff
    }
