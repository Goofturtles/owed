/* Write owed-animate.jsx — an After Effects script that builds the whole thing
   already animated, out of the .ai parts next to it.

   AE cannot be handed an animation as a file: footage is pixels, and vector art
   arrives still. So the motion is built where it belongs, as real keyframes on
   real layers, by a script you run once. Every position here is the position the
   part holds on the page (each part's SVG records it in its viewBox), so a comp
   assembles into exactly the page it came from, and then moves.

   Run from the owed folder:  node vectors/aescript.js                       */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'owed-animate.jsx');

// the board stacks these, in this order — the master scroll follows it
// Keep this list in step with STACK in nobg.py — it is the same board, and a
// drift between the two would scroll past a section that is not there.
const STACK = ['01-nav', '02-film-chapter1', '05-sources-marquee', '06-script-showcase',
  '07-numbers', '08-five-places', '09-environment', '10-questions', '11-closing', '12-footer'];

/* Every placement in After Effects rides on these four numbers, so a miss has
   to stop the build rather than quietly become NaN inside a 100 KB script. */
function box(file) {
  const svg = fs.readFileSync(file, 'utf8');
  const found = /<svg[^>]*>/.exec(svg);
  if (!found) throw new Error(file + ': no <svg> tag');
  const tag = found[0];
  const vb = new RegExp('viewBox="([-0-9.]+)[ ,]+([-0-9.]+)[ ,]+([-0-9.]+)[ ,]+([-0-9.]+)"').exec(tag);
  const w = new RegExp(' width="([0-9.]+)(?:px)?"').exec(tag);
  const h = new RegExp(' height="([0-9.]+)(?:px)?"').exec(tag);
  const out = {
    x: vb ? +vb[1] : 0, y: vb ? +vb[2] : 0,
    w: w ? +w[1] : (vb ? +vb[3] : NaN),
    h: h ? +h[1] : (vb ? +vb[4] : NaN)
  };
  if (!isFinite(out.x) || !isFinite(out.y) || !isFinite(out.w) || !isFinite(out.h)) {
    throw new Error(file + ': cannot read a box from ' + tag.slice(0, 120));
  }
  return out;
}

function sectionsOf(folder) {
  const dir = path.join(ROOT, folder);
  return fs.readdirSync(dir).filter(f => f.endsWith('.svg') && !f.startsWith('00-')).map(f => {
    const name = f.replace(/\.svg$/, '');
    const b = box(path.join(dir, f));
    const pdir = path.join(ROOT, 'pieces', folder, name);
    const parts = fs.existsSync(pdir) ? fs.readdirSync(pdir).filter(p => p.endsWith('.svg')).map(p => {
      const pb = box(path.join(pdir, p));
      return { name: p.replace(/\.svg$/, ''), ai: 'pieces/' + folder + '/' + name + '/' + p.replace(/\.svg$/, '.ai'),
               x: +pb.x.toFixed(2), y: +pb.y.toFixed(2), w: pb.w, h: pb.h };
    }) : [];
    return { name, folder, ai: folder + '/' + name + '.ai', w: b.w, h: b.h, parts };
  });
}

const landing = sectionsOf('landing');
const app = sectionsOf('app');

// the FAQ's answers, which open rather than appear
const faqDir = path.join(ROOT, 'landing', 'animated');
const faq = fs.existsSync(faqDir) ? fs.readdirSync(faqDir)
  .filter(f => /^faq-answer-.*\.svg$/.test(f))
  .map(f => ({ name: f.replace(/\.svg$/, ''), ai: 'landing/animated/' + f.replace(/\.svg$/, '.ai') })) : [];

const board = box(path.join(ROOT, 'landing', '00-landing-full-page.svg'));
const stackOrder = STACK.filter(n => landing.some(s => s.name === n));

const strip = box(path.join(ROOT, 'app', '00-four-questions-strip.svg'));
const data = {
  landing, app, faq,
  board: { ai: 'landing/00-landing-full-page.ai', w: board.w, h: board.h, order: stackOrder },
  strip: { ai: 'app/00-four-questions-strip.ai', w: strip.w, h: strip.h }
};

// a manifest pointing at art that is not there builds a project of missing footage
const refs = [];
for (const grp of [landing, app]) {
  for (const sec of grp) {
    refs.push(sec.ai);
    for (const part of sec.parts) refs.push(part.ai);
  }
}
for (const f of faq) refs.push(f.ai);
refs.push(data.board.ai, data.strip.ai);
/* Existing is not enough: an .ai left over from the run before points at art
   that has since changed, and After Effects would happily import the old one. */
const stale = refs.filter(r => {
  const ai = path.join(ROOT, 'ai', r);
  const svg = path.join(ROOT, r.replace(/\.ai$/, '.svg'));
  return fs.existsSync(ai) && fs.existsSync(svg) &&
    fs.statSync(ai).mtimeMs < fs.statSync(svg).mtimeMs - 1000;
});
if (stale.length) {
  throw new Error(stale.length + ' .ai files are older than the art they came from — run ' +
    'outline.js then svg2ai.js again. First: ' + stale.slice(0, 3).join(', '));
}
const absent = refs.filter(r => !fs.existsSync(path.join(ROOT, 'ai', r)));
if (absent.length) {
  throw new Error(absent.length + ' of ' + refs.length + ' .ai files are missing — run outline.js ' +
    'then svg2ai.js first. First missing: ' + absent.slice(0, 3).join(', '));
}

const tpl = fs.readFileSync(path.join(ROOT, 'aetemplate.jsx'), 'utf8');
const MARK = '/*__DATA__*/';
if (tpl.indexOf(MARK) < 0) throw new Error('aetemplate.jsx has lost its ' + MARK + ' marker — the ' +
  'script would be written with no data and fail inside After Effects');
// a function replacement, so a $ in the data cannot be read as a backreference
const jsx = tpl.replace(MARK, () => 'var DATA = ' + JSON.stringify(data) + ';');
fs.writeFileSync(OUT, jsx);
console.log('checked ' + refs.length + ' .ai paths, all present');
const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log('owed-animate.jsx  ' + kb + ' KB');
console.log('  landing: ' + landing.length + ' sections, ' + landing.reduce((n, s) => n + s.parts.length, 0) + ' parts');
console.log('  app:     ' + app.length + ' sections, ' + app.reduce((n, s) => n + s.parts.length, 0) + ' parts');
console.log('  faq:     ' + faq.length + ' answers');
