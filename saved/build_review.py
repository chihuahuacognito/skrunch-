"""Build saved/review.html from an Instagram saved-posts export.

Usage: python build_review.py   (reads files next to this script)

Inputs (same folder): saved_parsed.json, vocab.json, review_template.html, review_logic.js
Output: review.html, a single self-contained page.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

FIT_COLLECTIONS = {'Workouts', 'mobility', 'Arms'}
# Uncollected posts that are not fitness content; every other uncollected post is reviewed with the rest.
NONFIT_UNCOLLECTED = {'DXok51Qj-L6', 'DSFXZ8nEuNe', 'DST3xZGj9LJ', 'DNPbB53vPZO', 'DScG801gvZZ'}
DUPES = {
    'DUvgNddjdlY': 'Same caption as DVs-M9Kjagz (likely repost)',
    'DVs-M9Kjagz': 'Same caption as DUvgNddjdlY (likely repost)',
    'DRhpVSqDooC': 'Same caption as DT5bruXjq7w (likely repost)',
    'DT5bruXjq7w': 'Same caption as DRhpVSqDooC (likely repost)',
    'DdVNUdEvOfF': 'Shares 3 of 4 exercises with DZ6GmmMPS_u',
    'DZ6GmmMPS_u': 'Shares 3 of 4 exercises with DdVNUdEvOfF',
}

# Caption keyword guesses. Keys must be values from vocab.json.
MUSCLE_RULES = {
    'abdominals': r'\bcore\b|\babs?\b|abdom|crunch|plank|dead ?bug|v-?up|leg raise|oblique|hollow|around the world|bird ?dog|코어|복근',
    'lower back': r'lower back|low back|back pain|\bql\b|lumbar|허리|腰',
    'hip flexors': r'hip flexor|psoas|pelvic|pelvis|\bhips?\b|90/90|고관절|股関節',
    'adductors': r'adductor|copenhagen|cossack|내전근',
    'glutes': r'glute|kick ?back|hip thrust|bridge|엉덩',
    'quadriceps': r'squat|lunge|quad|leg press|step ?up|하체',
    'hamstrings': r'\brdl\b|deadlift|hamstring|leg curl',
    'calves': r'\bcalf|calves',
    'chest': r'chest|push ?-?up|bench press|dumbbell press|\bfly\b|flye|가슴|푸시업|푸쉬업',
    'lats': r'\blats?\b|pull ?-?down|pull ?-?up|pullover|풀다운',
    'middle back': r'\brows?\b|face pull|mid back|rhomboid|swimmer|로우',
    'shoulders': r'shoulder|delt|lateral raise|front raise|rotator|upright row|어깨',
    'biceps': r'bicep|\bcurls?\b|이두|암컬',
    'triceps': r'tricep|push ?down|삼두',
    'forearms': r'wrist|forearm|plate catch|pronation|supination',
    'neck': r'\bneck\b',
    'thoracic spine': r'thoracic|t-?spine|open ?book|upper back mobility',
}
TYPE_RULES = {
    'strength': r'\d\s*x\s*\d|dumbbell|barbell|cable|machine|kettlebell|weight|\bpress\b|\bcurls?\b|\brows?\b|squat|deadlift|덤벨|바벨|케이블',
    'conditioning': r'amrap|as many rounds|circuit|hiit|minute (abs|workout)|follow along|rounds|cardio',
    'mobility': r'mobility|range of motion|\bflow\b|warm ?-?up|loosen|unlock|\bcars\b|가동성',
    'stretch': r'stretch|\bhold\b|release|pose\b|yoga|스트레칭|ストレッチ',
    'stability': r'stability|stabiliz|control|dead ?bug|bird ?dog|pallof|balance|anti-?rotation',
}
PURPOSE_RULES = {
    'hip flexors / sitting stiffness': r'hip flexor|pelvic tilt|psoas|tight hips',
    'lower back comfort': r'back pain|lower back|low back|\bql\b|lumbar|허리|腰痛',
    'desk breaks': r'desk|sit(ting)? (a lot|all day|for too long)|posture|computer',
    'wrists': r'wrist',
    'knees': r'\bknees?\b|膝',
    'shoulder health': r'rotator|shoulder (pain|health|mobility)|healthy shoulders',
}

LIST_LINE = re.compile(r'\s*(\d+[\.\)]|\d️?⃣|[•\-–▪✅🔸🦋👉➡])')


def group_of(post_id, collections):
    if set(collections) & FIT_COLLECTIONS:
        return 'fitness'
    if collections:
        return 'other'
    return 'uncollected' if post_id in NONFIT_UNCOLLECTED else 'fitness'


def guess(caption, rules):
    return [k for k, r in rules.items() if re.search(r, caption, re.I)]


def lists_moves(caption):
    return sum(1 for line in caption.split('\n') if LIST_LINE.match(line)) >= 2


def build_items(parsed):
    colls = {}
    for p in parsed['collections']:
        colls.setdefault(p['id'], []).append(p['collection'])
    items = []
    for p in parsed['posts']:
        c = colls.get(p['id'], [])
        cap = '\n\n'.join(p['captions'])
        group = group_of(p['id'], c)
        items.append({
            'id': p['id'], 'url': p['url'], 'owner': p['owner'], 'time': p['time'],
            'collections': c, 'group': group,
            'suggest': None if group == 'fitness' else 'discard',
            'caption': cap, 'listed': lists_moves(cap), 'note': DUPES.get(p['id']),
            'guess': {'muscles': guess(cap, MUSCLE_RULES), 'types': guess(cap, TYPE_RULES),
                      'purposes': guess(cap, PURPOSE_RULES)},
        })
    order = {'fitness': 0, 'uncollected': 1, 'other': 2}
    items.sort(key=lambda i: order[i['group']])
    return items


def _js(value):
    # Safe to inline inside <script>: never emit "</".
    return json.dumps(value, ensure_ascii=False).replace('</', '<\\/')


def render(items, vocab, template_html, logic_js):
    return (template_html
            .replace('/*DATA*/[]', _js(items))
            .replace('/*VOCAB*/{}', _js(vocab))
            .replace('/*LOGIC*/', logic_js.replace('</', '<\\/')))


def main():
    parsed = json.loads((HERE / 'saved_parsed.json').read_text(encoding='utf-8'))
    vocab = json.loads((HERE / 'vocab.json').read_text(encoding='utf-8'))
    html = render(build_items(parsed), vocab,
                  (HERE / 'review_template.html').read_text(encoding='utf-8'),
                  (HERE / 'review_logic.js').read_text(encoding='utf-8'))
    (HERE / 'review.html').write_text(html, encoding='utf-8')
    print(f'{len(parsed["posts"])} posts -> {HERE / "review.html"}')


if __name__ == '__main__':
    main()
