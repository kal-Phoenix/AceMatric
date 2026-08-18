import json, os

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

# Import data
exec(open(os.path.join(os.path.dirname(__file__), "gen_sat_g12_data.py"), encoding="utf-8").read())
exec(open(os.path.join(os.path.dirname(__file__), "gen_sat_g12_data2.py"), encoding="utf-8").read())
exec(open(os.path.join(os.path.dirname(__file__), "gen_sat_g12_data3.py"), encoding="utf-8").read())

all_q = []
data_map = [ch1,ch2,ch3,ch4,ch5,ch6,ch7,ch8,ch9,ch10,ch11,ch12,ch13,ch14,ch15,ch16,ch17,ch18,ch19,ch20,ch21,ch22]

for ch_idx in range(22):
    ch = ch_idx + 1
    ch_data = data_map[ch_idx]
    for i, item in enumerate(ch_data):
        qt, opts, correct, expl, diff = item
        all_q.append(make_q(ch, i+1, qt, opts, correct, expl, diff))

# Validate
for ch in range(1, 23):
    ch_qs = [q for q in all_q if q["chapter"].startswith(f"Grade 12 - Chapter {ch}:")]
    easy = [q for q in ch_qs if q["difficulty"] == "Easy"]
    med = [q for q in ch_qs if q["difficulty"] == "Medium"]
    hard = [q for q in ch_qs if q["difficulty"] == "Hard"]
    assert len(ch_qs) == 30, f"Chapter {ch} has {len(ch_qs)} questions, expected 30"
    assert len(easy) == 10, f"Chapter {ch} has {len(easy)} Easy, expected 10"
    assert len(med) == 10, f"Chapter {ch} has {len(med)} Medium, expected 10"
    assert len(hard) == 10, f"Chapter {ch} has {len(hard)} Hard, expected 10"

# Check unique IDs
ids = [q["id"] for q in all_q]
assert len(ids) == len(set(ids)), "Duplicate IDs found"

print(f"Total questions: {len(all_q)}")
print(f"Total chapters: {len(set(q['chapter'] for q in all_q))}")

outpath = os.path.join(os.path.dirname(__file__), "temp_sat_g12.json")
with open(outpath, "w", encoding="utf-8") as f:
    json.dump(all_q, f, ensure_ascii=False, indent=2)

print(f"Written to {outpath}")
