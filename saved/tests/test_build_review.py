import json
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))

from build_review import (  # noqa: E402
    MUSCLE_RULES, PURPOSE_RULES, TYPE_RULES, build_items, group_of, guess, render,
)

VOCAB = HERE / "vocab.json"
PARSED = HERE / "saved_parsed.json"


def test_uncollected_fitness_joins_main_group():
    assert group_of("DSSS2V7DzGs", []) == "fitness"  # coachkeg single-leg RDL


def test_uncollected_nonfitness_stays_out():
    for pid in ["DXok51Qj-L6", "DSFXZ8nEuNe", "DST3xZGj9LJ", "DNPbB53vPZO", "DScG801gvZZ"]:
        assert group_of(pid, []) == "uncollected"


def test_other_collections():
    assert group_of("x", ["food"]) == "other"
    assert group_of("x", ["food", "mobility"]) == "fitness"


def test_rule_keys_are_vocab_values():
    vocab = json.load(open(VOCAB, encoding="utf-8"))
    assert set(MUSCLE_RULES) <= set(vocab["muscles"])
    assert set(TYPE_RULES) <= set(vocab["types"])
    assert set(PURPOSE_RULES) <= set(vocab["purposes"])


def test_guesses():
    assert "hip flexors" in guess("Sitting all day? Your hip flexors get tight", MUSCLE_RULES)
    assert "stretch" in guess("Hold this stretch for 30s", TYPE_RULES)
    assert "lower back comfort" in guess("LOW BACK PAIN? 3 exercises", PURPOSE_RULES)
    assert "hip flexors / sitting stiffness" in guess("anterior pelvic tilt drill", PURPOSE_RULES)
    assert guess("", MUSCLE_RULES) == []


def test_counts_on_real_export():
    items = build_items(json.load(open(PARSED, encoding="utf-8")))
    groups = Counter(i["group"] for i in items)
    assert groups == {"fitness": 139, "uncollected": 5, "other": 51}


def test_render_inlines_everything():
    html = render([{"id": "a</script>"}], {"muscles": []},
                  "D=/*DATA*/[];V=/*VOCAB*/{};/*LOGIC*/", "LOGIC_OK")
    assert "LOGIC_OK" in html and "</script>" not in html and "/*DATA*/" not in html
