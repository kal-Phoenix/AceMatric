import json

with open('temp_sat_g12.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total questions: {len(data)}")
chapters = {}
for q in data:
    ch = q['chapter']
    chapters[ch] = chapters.get(ch, 0) + 1

for ch, count in sorted(chapters.items(), key=lambda x: x[1]):
    print(f"  {ch}: {count}")
