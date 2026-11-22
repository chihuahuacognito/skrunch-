"""Browser self-test for review.html.

Rebuilds review.html, appends a test script to a copy, runs it in headless Edge with a
throwaway profile (so real review progress is never touched), and checks every result key.
Usage: python saved/tests/selftest.py
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
import build_review  # noqa: E402

EDGE = next((p for p in [
    Path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'),
    Path(r'C:\Program Files\Microsoft\Edge\Application\msedge.exe'),
] if p.exists()), None)

TEST_JS = r"""
<script>
(async () => {
  const R = {};
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const iframe = () => document.querySelector('#view iframe');
  const dd = dim => document.querySelector(`.dd[data-dim="${dim}"]`);
  const key = (k, target = document) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  try {
    await sleep(200);
    R.dropdownsPresent = document.querySelectorAll('.dd').length === 3;
    const viewText = document.getElementById('view').innerText;
    R.noRoleRow = viewText.includes('@') && !/\brole\b|your tags/i.test(viewText);
    R.uncollectedInMain = document.getElementById('groupSeg').innerText.includes('Workout collections (139)');
    R.newSinceImportFilter = document.getElementById('statusSeg').innerText.includes('New since last import');

    const f1 = iframe();
    dd('muscles').querySelector('.dd-toggle').click();
    dd('muscles').querySelector('input[type=checkbox][value="abdominals"]').click();
    const box = dd('muscles').querySelector('input[type=checkbox][value="abdominals"]');
    R.toggleKeepsVideo = !!f1 && iframe() === f1 && !!box && box.checked;

    key('k');
    R.shortcutBlocked = !store.decisions[store.cur];

    key('Escape');
    R.escapeCloses = document.querySelector('.dd.open') === null && iframe() === f1;

    dd('purposes').querySelector('.dd-toggle').click();
    const inp = dd('purposes').querySelector('.dd-panel .dd-new');
    inp.value = 'Lower back COMFORT';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    key('Enter', inp);
    const hits = [...dd('purposes').querySelectorAll('input[type=checkbox]')].filter(c => c.value === 'lower back comfort');
    R.purposeNoDuplicate = hits.length === 1 && hits[0].checked;
    key('Escape');

    const before = JSON.stringify(store.decisions);
    const input = document.getElementById('importInput');
    const dt = new DataTransfer();
    dt.items.add(new File(['nope'], 'bad.json', { type: 'application/json' }));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
    R.badImportToast = document.getElementById('toast').innerText.includes('Not a review export') && JSON.stringify(store.decisions) === before;

    const target = ITEMS[5].id;
    const good = new DataTransfer();
    good.items.add(new File([JSON.stringify({ version: 2, vocab: { purposes: [] }, records: [{ id: target, decision: 'keep', moves: 'bird dog' }] })], 'good.json', { type: 'application/json' }));
    input.files = good.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
    const saved = JSON.parse(localStorage.getItem('ig-review-v2'));
    R.goodImportApplies = store.decisions[target] === 'keep' && store.moves[target] === 'bird dog'
      && saved.decisions[target] === 'keep' && store.importedIds.includes(target)
      && document.getElementById('toast').innerText.includes('Imported 1 posts');
  } catch (e) {
    R.error = String(e && e.stack || e);
  }
  document.body.dataset.result = JSON.stringify(R);
})();
</script>
"""

KEYS = ['dropdownsPresent', 'noRoleRow', 'uncollectedInMain', 'newSinceImportFilter', 'toggleKeepsVideo',
        'shortcutBlocked', 'escapeCloses', 'purposeNoDuplicate', 'badImportToast', 'goodImportApplies']


def main():
    if EDGE is None:
        sys.exit('Edge not found')
    build_review.main()
    tmp = Path(tempfile.mkdtemp(prefix='review-selftest-'))
    try:
        page = tmp / 'test.html'
        html = (HERE / 'review.html').read_text(encoding='utf-8')
        page.write_text(html.replace('</body>', TEST_JS + '</body>'), encoding='utf-8')
        out = subprocess.run([str(EDGE), '--headless=new', '--disable-gpu', f'--user-data-dir={tmp / "profile"}',
                              '--virtual-time-budget=4000', '--dump-dom', page.as_uri()],
                             capture_output=True, text=True, encoding='utf-8', timeout=120).stdout
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    m = re.search(r'data-result="([^"]*)"', out)
    if not m:
        sys.exit('FAIL: no result (page script crashed before the test ran)')
    result = json.loads(m.group(1).replace('&quot;', '"').replace('&amp;', '&'))
    for k in KEYS:
        print(f'{k}: {result.get(k)}')
    if 'error' in result:
        print('error:', result['error'])
    failed = [k for k in KEYS if result.get(k) is not True]
    if failed:
        sys.exit(f'FAIL: {", ".join(failed)}')
    print('ALL PASS')


if __name__ == '__main__':
    main()
