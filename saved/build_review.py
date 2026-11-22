import json, re, sys

src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src, encoding='utf-8'))

FIT = ('Workouts', 'mobility', 'Arms')
NONFIT_UNCOLLECTED = {'DXok51Qj-L6', 'DSFXZ8nEuNe', 'DST3xZGj9LJ', 'DNPbB53vPZO', 'DScG801gvZZ'}
DUPES = {  # id -> note
    'DUvgNddjdlY': 'Same caption as DVs-M9Kjagz (likely repost)',
    'DVs-M9Kjagz': 'Same caption as DUvgNddjdlY (likely repost)',
    'DRhpVSqDooC': 'Same caption as DT5bruXjq7w (likely repost)',
    'DT5bruXjq7w': 'Same caption as DRhpVSqDooC (likely repost)',
    'DdVNUdEvOfF': 'Shares 3 of 4 exercises with DZ6GmmMPS_u',
    'DZ6GmmMPS_u': 'Shares 3 of 4 exercises with DdVNUdEvOfF',
}
MUSCLE = {
    'core': r'\bcore\b|\babs?\b|abdom|crunch|plank|dead ?bug|v-?up|leg raise|oblique|hollow|around the world|bird ?dog|코어|복근',
    'lower back': r'lower back|low back|back pain|\bql\b|lumbar|spine|spinal|허리|腰',
    'hips': r'\bhips?\b|hip flexor|psoas|pelvic|pelvis|90/90|adductor|고관절|股関節',
    'glutes': r'glute|kick ?back|hip thrust|bridge|엉덩',
    'legs': r'squat|lunge|\brdl\b|deadlift|leg press|quad|hamstring|leg day|하체|step ?up|calf|knee',
    'chest': r'chest|push ?-?up|bench press|dumbbell press|\bfly\b|flye|가슴|푸시업|푸쉬업',
    'upper back': r'\blats?\b|pull ?-?down|pull ?-?up|\brows?\b|face pull|upper back|mid back|swimmer|pullover|등 운동',
    'shoulders': r'shoulder|delt|lateral raise|front raise|rotator|upright row|어깨',
    'biceps': r'bicep|\bcurls?\b|이두|암컬',
    'triceps': r'tricep|push ?down|삼두',
    'forearms': r'wrist|forearm|plate catch|pronation|supination',
    'posture': r'\bneck\b|thoracic|t-?spine|posture|rounded shoulders',
}

colls = {}
for p in d['collections']:
    colls.setdefault(p['id'], []).append(p['collection'])

LIST_LINE = re.compile(r'\s*(\d+[\.\)]|\d️?⃣|[•\-–▪✅🔸🦋👉➡])')
def lists_moves(cap):
    return sum(1 for l in cap.split('\n') if LIST_LINE.match(l)) >= 2

items = []
for p in d['posts']:
    c = colls.get(p['id'], [])
    cap = '\n\n'.join(p['captions'])
    if set(c) & set(FIT):
        group, suggest = 'fitness', None
    elif not c:
        group = 'uncollected'
        suggest = 'discard' if p['id'] in NONFIT_UNCOLLECTED else None
    else:
        group, suggest = 'other', 'discard'
    items.append({
        'id': p['id'], 'url': p['url'], 'owner': p['owner'], 'time': p['time'],
        'collections': c, 'group': group, 'suggest': suggest, 'caption': cap,
        'tags': [k for k, r in MUSCLE.items() if re.search(r, cap, re.I)],
        'note': DUPES.get(p['id']),
        'listed': lists_moves(cap),
    })
order = {'fitness': 0, 'uncollected': 1, 'other': 2}
items.sort(key=lambda i: order[i['group']])

data = json.dumps(items, ensure_ascii=False).replace('</', '<\\/')
html = open(sys.argv[3], encoding='utf-8').read()
html = html.replace('/*DATA*/[]', data).replace('/*MUSCLES*/[]', json.dumps(list(MUSCLE)))
open(out, 'w', encoding='utf-8').write(html)
print(len(items), 'posts ->', out)
