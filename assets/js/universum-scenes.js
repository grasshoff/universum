/* Famulus Universum: the drawn scenes of the film and of the chapter miniatures.

   A scene is registered for the guide player's step kind `scene` (guide-player.js scene_()):
       window.GuideScenes[name] = (el, step, ctx) => ({ frame(p, ms), stop() })
   It builds an SVG of 1280 × 800 units inside el once and then only answers frame(p): the picture at progress p of
   the step, 0…1, callable in any order. No clock, timer or transition lives here, so the player's pause, jump, still
   picture and reduced motion hold for every scene, and a photograph at a given instant is the same picture again.

   What a scene shows is read from window.UNIVERSUM (data/universum.<lang>.js, written by build_universum.py from the
   registers): the address and its wording, the experts and their measured comparisons, the numbers of the register.
   Marks that stand for no datum (a page, a bar of text, a pointer) carry no number and no invented wording.
   step.data.phase picks one phase of a scene; without it (the miniatures) the phases follow one another.
   Everything a scene shows lies above y = 660: the strip below belongs to the caption the player lays over the picture.
   Text never renders below 12.5 px: sizes in units grow on a narrow stage (fs), and labels that would then collide
   are left out there (small). */
(function () {
  'use strict';
  const d3 = window.d3;
  if (!d3) return;
  const NS = window.GuideScenes = window.GuideScenes || {};
  const data = () => window.UNIVERSUM || { facts: {}, example: {}, experts: [], chapters: [], states: {} };
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => 1 - Math.pow(1 - clamp(x), 3);
  const seg = (p, a, b) => ease((p - a) / (b - a));
  const GOLD = '#c4a15a', PAPER = '#fffdf8', PALE = '#d9d2c2', DEEP = '#00152e', SOFT = '#2c4a6e';
  const SANS = '"Source Sans 3", "Avenir Next", "Segoe UI", sans-serif', SERIF = '"Source Serif 4", Palatino, serif',
    DISPLAY = '"Fraunces", "Source Serif 4", Palatino, serif', MONO = '"SF Mono", ui-monospace, Menlo, Consolas, monospace';
  const TXT = {
    de: { prolog: 'Prolog', web: 'World Wide Web', webSub: 'Dokumente, verbunden durch Verweise', ai: 'KI-Antwort', whence: 'Woher?',
          segs: ['Schema', 'Sammlung', 'Dokument', 'Seite', 'Stelle'], sentence: 'Satz', gapAddr: 'Lücke: Die Adresse wird nicht aufgelöst.',
          colls: 'Sammlungen im gemeinsamen Speicher', claim: 'Aussage', ground: 'Beleg', measured: 'Vergleiche gemessen', passed: 'bestanden',
          limit: 'Schwelle', noLimit: 'gemessen, ohne Schwelle', rows: ['Frage', 'Partitur', 'Antwort', 'Prüfung', 'Herkunft'], issue: 'Heft',
          refers: 'jede Zahl verweist auf ihren Block', gates: ['Lektor: Zustimmung des Autors', 'Referenzen als Belege', 'Qualitätsgates erfüllt'],
          seal: 'Gütesiegel', online: 'Hefte online', sealed: 'mit Gütesiegel', register: 'eigenes, signiertes Register', spaces: 'Namensräume',
          others: 'Reference-Punkte anderer Einrichtungen', oneLine: 'Ein Verweis: eine Zeile',
          kinds: { sentence: 'Satz', cell: 'Tafelzelle', figure: 'Abbildung', object: 'Objekt mit 3D-Modell', person: 'Registereintrag' },
          open: 'noch nicht auflösbar', senses: 'Bedeutungen', context: 'im Sprachgebrauch von', brings: 'bringt das Feld mit', uses: 'nutzt', rests: 'ruht auf' },
    en: { prolog: 'Prologue', web: 'World Wide Web', webSub: 'documents, connected by references', ai: 'AI answer', whence: 'Where from?',
          segs: ['scheme', 'collection', 'document', 'page', 'passage'], sentence: 'sentence', gapAddr: 'Gap: the address does not resolve.',
          colls: 'collections in the shared store', claim: 'Statement', ground: 'Evidence', measured: 'comparisons measured', passed: 'passed',
          limit: 'threshold', noLimit: 'measured, no threshold', rows: ['Question', 'Score', 'Answer', 'Check', 'Provenance'], issue: 'Issue',
          refers: 'every number refers to its block', gates: ['Lektor: the author’s assent', 'References as evidence', 'Quality gates fulfilled'],
          seal: 'Quality seal', online: 'issues online', sealed: 'with the quality seal', register: 'its own signed register', spaces: 'namespaces',
          others: 'Reference points of other institutions', oneLine: 'One reference: one line',
          kinds: { sentence: 'sentence', cell: 'table cell', figure: 'figure', object: 'object with 3D model', person: 'register entry' },
          open: 'does not resolve yet', senses: 'senses', context: 'in the usage of', brings: 'the field brings', uses: 'uses', rests: 'rests on' },
  };

  // the stage of a scene: an SVG of 1280 × 800 units; fs(n) keeps text at 12.5 px or more on the screen
  function stage(el, ctx, scene) {
    el.innerHTML = '';
    const U = data(), lang = (ctx && ctx.lang) || U.lang || 'de', T = TXT[lang] || TXT.en;
    const W = (ctx && ctx.w) || el.clientWidth || 1280;
    const min = Math.ceil(12.5 * 1280 / Math.max(W, 240));
    const fs = n => Math.max(n, min);
    const svg = d3.select(el).append('svg').attr('class', 'uvs').attr('viewBox', '0 0 1280 800').attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('aria-hidden', 'true').style('width', '100%').style('height', '100%').style('display', 'block');
    const kicker = (U.kick || {})[scene] || T.prolog;
    svg.append('text').attr('x', 70).attr('y', 70 + fs(26) * 0.4).attr('font-family', SANS).attr('font-weight', 650).attr('font-size', fs(26))
      .attr('letter-spacing', '0.12em').attr('fill', GOLD).text(kicker.toUpperCase());
    const text = (g, x, y, s, size, o) => {
      o = o || {};
      return g.append('text').attr('x', x).attr('y', y).attr('font-family', o.font || SANS).attr('font-size', fs(size)).attr('fill', o.fill || PAPER)
        .attr('font-weight', o.weight || 500).attr('font-style', o.italic ? 'italic' : null).attr('text-anchor', o.anchor || 'start').text(s);
    };
    return { svg, fs, T, U, lang, text, small: W < 700, mini: !!(ctx && ctx.mini) };
  }
  // the progress of each of n phases: one phase when the step names it, else one after the other
  function phases(n, step, p) {
    const ph = step && step.data && step.data.phase;
    return d3.range(n).map(i => (ph ? (i + 1 < ph ? 1 : i + 1 === ph ? p : 0) : clamp(p * n - i)));
  }
  const cut = (s, n) => (s && s.length > n ? s.slice(0, n - 1).replace(/[\s,;:]+\S*$/, '') + ' …' : s || '');
  const wrap = (s, n) => { const out = ['']; (s || '').split(/\s+/).forEach(w => { if (out[out.length - 1] && (out[out.length - 1] + ' ' + w).trim().length > n) out.push(w); else out[out.length - 1] = (out[out.length - 1] + ' ' + w).trim(); }); return out; };
  const num = (v, lang) => {
    if (v == null) return '–';
    if (Math.abs(v) < 1e-4 && v !== 0) { const e = Math.floor(Math.log10(Math.abs(v))), m = (v / Math.pow(10, e)).toFixed(1); return (lang === 'de' ? m.replace('.', ',') : m) + ' · 10' + String(e).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]); }
    const s = Math.abs(v) >= 10 ? v.toFixed(1) : String(+v.toPrecision(2));
    return lang === 'de' ? s.replace('.', ',') : s;
  };
  const pageIcon = (g, x, y, w, h) => {
    const p = g.append('g').attr('transform', `translate(${x},${y})`);
    p.append('rect').attr('x', -w / 2).attr('y', -h / 2).attr('width', w).attr('height', h).attr('rx', 5).attr('fill', '#0b2a52').attr('stroke', PALE).attr('stroke-width', 2);
    d3.range(3).forEach(k => p.append('line').attr('x1', -w / 2 + 9).attr('x2', w / 2 - 9 - (k === 2 ? w * 0.25 : 0)).attr('y1', -h / 2 + 14 + k * (h - 24) / 3).attr('y2', -h / 2 + 14 + k * (h - 24) / 3).attr('stroke', PALE).attr('stroke-width', 2.5).attr('opacity', 0.55));
    return p;
  };

  /* ---------------------------------------------------------------- prologue: the Web, and an answer without grounds */
  NS.web = function (el, step, ctx) {
    const S = stage(el, ctx, 'web'), svg = S.svg, T = S.T;
    const P = [[250, 215], [470, 160], [700, 210], [930, 150], [1090, 245], [330, 360], [560, 325], [800, 355], [1010, 400], [440, 480], [720, 480]];
    const E = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 2], [6, 7], [7, 4], [7, 8], [5, 9], [9, 10], [10, 8], [6, 10], [1, 6]];
    const gl = svg.append('g'), gp = svg.append('g');
    const lines = E.map(e => gl.append('line').attr('stroke', GOLD).attr('stroke-width', 2.2).attr('opacity', 0.8));
    const pages = P.map(q => pageIcon(gp, q[0], q[1], 66, 82));
    const title = S.text(svg, 640, 606, T.web, 54, { font: DISPLAY, anchor: 'middle', weight: 560 });
    const sub = S.small ? null : S.text(svg, 640, 652, T.webSub, 26, { anchor: 'middle', fill: PALE });
    // phase 2: the answer of a language model, shown as bars (no wording is invented), and the question it leaves
    const ans = svg.append('g');
    ans.append('rect').attr('x', 250).attr('y', 200).attr('width', 520).attr('height', 280).attr('rx', 18).attr('fill', DEEP).attr('stroke', PALE).attr('stroke-width', 2.5);
    S.text(ans, 285, 200 + 34 + S.fs(26) * 0.6, T.ai, 26, { fill: PALE, weight: 650 });
    const bars = d3.range(3).map(k => ans.append('rect').attr('x', 285).attr('y', 320 + k * 48).attr('height', 16).attr('rx', 8).attr('fill', PALE).attr('opacity', 0.8));
    const q = S.text(svg, 1020, 380, T.whence, 84, { font: DISPLAY, anchor: 'middle', fill: GOLD, italic: true, weight: 460 });
    return {
      frame(p) {
        const [a, b] = phases(2, step, p);
        pages.forEach((g, k) => g.attr('opacity', seg(a, k * 0.04, k * 0.04 + 0.25) * (1 - 0.82 * ease(b * 3))));
        lines.forEach((l, k) => {
          const u = seg(a, 0.2 + k * 0.045, 0.45 + k * 0.045), s = P[E[k][0]], t = P[E[k][1]];
          l.attr('x1', s[0]).attr('y1', s[1]).attr('x2', s[0] + (t[0] - s[0]) * u).attr('y2', s[1] + (t[1] - s[1]) * u).attr('opacity', 0.8 * (1 - 0.85 * ease(b * 3)));
        });
        title.attr('opacity', seg(a, 0.55, 0.85) * (1 - ease(b * 3)));
        if (sub) sub.attr('opacity', seg(a, 0.7, 1) * (1 - ease(b * 3)));
        ans.attr('opacity', seg(b, 0.1, 0.35));
        bars.forEach((r, k) => r.attr('width', [450, 410, 280][k] * seg(b, 0.25 + k * 0.1, 0.5 + k * 0.1)));
        q.attr('opacity', seg(b, 0.6, 0.85)).attr('transform', `translate(0,${18 * (1 - seg(b, 0.6, 0.9))})`);
      },
      stop() {},
    };
  };

  /* ---------------------------------------------------------------- I Referenz: one real address, taken apart and resolved */
  NS.adresse = function (el, step, ctx) {
    const S = stage(el, ctx, 'adresse'), svg = S.svg, T = S.T, ex = S.U.example || {};
    const ref = ex.ref || 'fr:';
    const parts = ['fr:'].concat(ref.replace(/^fr:/, '').split('/'));
    const labels = parts.map((x, k) => (k === parts.length - 1 && ex.kind === 'sentence' ? T.sentence : T.segs[Math.min(k, 4)]));
    const chars = ref.length, size = Math.max(S.fs(28), Math.min(56, 1120 / (0.602 * chars))), cw = 0.602 * size;
    const x0 = 640 - (chars * cw) / 2, y0 = S.small ? 300 : 250;
    let off = 0;
    const segs = parts.map((s, k) => {
      const str = (k > 1 ? '/' : '') + s, x = x0 + off * cw, w = str.length * cw, inner = (k > 1 ? cw : 0);
      off += str.length;
      const g = svg.append('g');
      g.append('text').attr('x', x).attr('y', y0).attr('font-family', MONO).attr('font-size', size).attr('fill', PAPER).attr('font-weight', 560).text(str);
      g.append('line').attr('x1', x + inner).attr('x2', x + w).attr('y1', y0 + size * 0.32).attr('y2', y0 + size * 0.32).attr('stroke', GOLD).attr('stroke-width', 4);
      if (!S.small) S.text(g, x + inner + (w - inner) / 2, y0 + size * 0.32 + 38 + (k % 2) * 34, labels[k], 24, { anchor: 'middle', fill: GOLD, weight: 650 });
      return g;
    });
    // the wording at the address and its citation, as the reference point returns them
    const res = svg.append('g');
    const ty = y0 + (S.small ? 110 : 190);
    if (ex.found && ex.text) {
      const per = S.small ? 30 : 52, lines = wrap('“' + cut(ex.text, S.small ? 60 : 104) + '”', per).slice(0, 3);
      lines.forEach((l, k) => S.text(res, 640, ty + k * S.fs(36) * 1.3, l, 36, { font: SERIF, italic: true, anchor: 'middle' }));
      if (!S.small && ex.citation) S.text(res, 640, ty + lines.length * 47 + 26, cut(ex.citation.replace(/\s*\[fr:[^\]]+\]\s*$/, ''), 84), 24, { anchor: 'middle', fill: PALE });
    } else S.text(res, 640, ty, T.gapAddr, 34, { anchor: 'middle', fill: PALE });
    const n = S.U.facts.collections;
    const foot = S.small || n == null ? null : S.text(svg, 640, 650, n + ' ' + T.colls, 28, { anchor: 'middle', fill: GOLD, weight: 650 });
    return {
      frame(p) {
        const [a, b] = phases(2, step, p);
        segs.forEach((g, k) => g.attr('opacity', seg(a, k * 0.16, k * 0.16 + 0.2)).attr('transform', `translate(0,${14 * (1 - seg(a, k * 0.16, k * 0.16 + 0.24))})`));
        res.attr('opacity', seg(b, 0.1, 0.55)).attr('transform', `translate(0,${20 * (1 - seg(b, 0.1, 0.6))})`);
        if (foot) foot.attr('opacity', seg(b, 0.65, 0.95));
      },
      stop() {},
    };
  };


  /* ---------------------------------------------------------------- 1 Belegen: one statement, many kinds of grounding evidence */
  NS.belege = function (el, step, ctx) {
    const S = stage(el, ctx, 'belege'), svg = S.svg, T = S.T, ks = (S.U.kinds || []).slice(0, 5), n = ks.length || 1;
    const cx = 250, cy = 370, top = 170, gap = Math.min(110, 480 / n), size = S.small ? 30 : 30;
    const gl = svg.append('g');
    svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 74).attr('fill', GOLD).attr('stroke', PAPER).attr('stroke-width', 3);
    wrap(S.U.core || T.claim, 12).slice(0, 2).forEach((l, k, a) => svg.append('text').attr('x', cx).attr('y', cy + (k - (a.length - 1) / 2) * S.fs(22) * 1.15 + S.fs(22) * 0.35)
      .attr('text-anchor', 'middle').attr('font-family', SANS).attr('font-weight', 650).attr('font-size', S.fs(22)).attr('fill', DEEP).text(l));
    const rows = ks.map((k, i) => {
      const y = top + i * gap, g = svg.append('g'), ok = !!k.found, x = 560;
      const line = gl.append('path').attr('fill', 'none').attr('stroke', GOLD).attr('stroke-width', 2.6).attr('stroke-dasharray', ok ? null : '7 7');
      g.append('circle').attr('cx', x).attr('cy', y - 10).attr('r', 13).attr('fill', ok ? GOLD : 'none').attr('stroke', GOLD).attr('stroke-width', 3).attr('stroke-dasharray', ok ? null : '5 4');
      S.text(g, x + 34, y, T.kinds[k.kind] || k.kind, size, { weight: 650 });
      if (!S.small) S.text(g, x + 34, y + 34, cut(ok ? k.ref : k.ref + '  ·  ' + T.open, 58), 22, { font: MONO, fill: ok ? PALE : GOLD });
      return { g, line, y: y - 10, x };
    });
    return {
      frame(p) {
        rows.forEach((o, i) => {
          const a = 0.08 + i * 0.15, u = seg(p, a, a + 0.22), x2 = cx + 74 + (o.x - 16 - cx - 74) * u, y2 = cy + (o.y - cy) * u;
          o.line.attr('d', u > 0 ? `M${cx + 74},${cy} C${cx + 190},${cy} ${x2 - 110},${y2} ${x2},${y2}` : null);
          o.g.attr('opacity', seg(p, a + 0.14, a + 0.3));
        });
      },
      stop() {},
    };
  };

  /* ---------------------------------------------------------------- 2 Verstehen: one word, its senses in the usage of an author */
  NS.sprache = function (el, step, ctx) {
    const S = stage(el, ctx, 'sprache'), svg = S.svg, T = S.T, lw = S.U.lw || {}, senses = (lw.senses || []).slice(0, 3);
    const lemma = S.text(svg, 90, 300, lw.lemma || '–', S.small ? 84 : 104, { font: DISPLAY, italic: true, fill: GOLD, weight: 460 });
    const sub = S.small ? null : S.text(svg, 94, 356, T.context + ' ' + (lw.scope || ''), 24, { fill: PALE });
    const x = S.small ? 90 : 660, y0 = S.small ? 400 : 190, gap = S.small ? 90 : 150;
    const rows = senses.map((s, i) => {
      const g = svg.append('g'), y = y0 + i * gap;
      S.text(g, x, y, s.label || String(i + 1), 30, { font: DISPLAY, fill: GOLD, weight: 560 });
      wrap(cut(s.definition, S.small ? 44 : 84), S.small ? 34 : 30).slice(0, S.small ? 1 : 3).forEach((l, k) => S.text(g, x + 86, y + k * 34, l, 24, { font: SERIF }));
      const line = S.small ? null : svg.append('path').attr('fill', 'none').attr('stroke', GOLD).attr('stroke-width', 2.2).attr('opacity', 0.8);
      return { g, line, y: y - 10 };
    });
    const foot = S.small || !lw.ref ? null : S.text(svg, 640, 650, senses.length + ' ' + T.senses + '  ·  ' + lw.ref, 24, { anchor: 'middle', fill: GOLD, weight: 650 });
    return {
      frame(p) {
        lemma.attr('opacity', seg(p, 0, 0.18));
        if (sub) sub.attr('opacity', seg(p, 0.12, 0.3));
        rows.forEach((o, i) => {
          const a = 0.26 + i * 0.2, u = seg(p, a, a + 0.18);
          if (o.line) o.line.attr('d', u > 0 ? `M500,270 C570,270 560,${o.y} ${500 + (x - 22 - 500) * u},${270 + (o.y - 270) * u}` : null);
          o.g.attr('opacity', seg(p, a + 0.1, a + 0.26));
        });
        if (foot) foot.attr('opacity', seg(p, 0.86, 1));
      },
      stop() {},
    };
  };

  /* ---------------------------------------------------------------- 3 Rechnen und Modellieren: the experts, each an instrument of reasoning */
  NS.instrumente = function (el, step, ctx) {
    const S = stage(el, ctx, 'instrumente'), svg = S.svg;
    const ch = (S.U.chapters || []).find(c => (c.scenes || []).includes('instrumente')) || {}, items = (ch.instruments || []).slice(0, 9);
    const cols = S.small ? 2 : 3, shown = S.small ? items.slice(0, 6) : items, w = (1100 - (cols - 1) * 26) / cols, h = S.small ? 150 : 150, x0 = 90, y0 = 150;
    const tiles = shown.map((it, i) => {
      const x = x0 + (i % cols) * (w + 26), y = y0 + Math.floor(i / cols) * (h + 22), g = svg.append('g'), on = it.s === 'laeuft' || it.s === 'gebaut';
      g.append('rect').attr('x', x).attr('y', y).attr('width', w).attr('height', h).attr('rx', 12).attr('fill', DEEP).attr('stroke', GOLD).attr('stroke-width', 2.6).attr('stroke-dasharray', on ? null : '8 6');
      if (!S.small) S.text(g, x + 22, y + 38, it.g, 20, { fill: GOLD, weight: 650 });
      const nm = it.n.replace(/\s*\(.*$/, ''), fit = Math.max(20, Math.min(28, (w - 44) / (0.54 * Math.max(...nm.split(' ').map(q => q.length), 8))));
      wrap(cut(nm, 44), Math.floor((w - 44) / (0.54 * S.fs(fit)))).slice(0, 2).forEach((l, k) => S.text(g, x + 22, y + (S.small ? 62 : 80) + k * S.fs(fit) * 1.12, l, fit, { font: DISPLAY, weight: 560 }));
      if (!S.small) S.text(g, x + w - 20, y + 38, (S.U.states || {})[it.s] || '', 20, { anchor: 'end', fill: PALE });
      return g;
    });
    return {
      frame(p) {
        tiles.forEach((g, i) => g.attr('opacity', seg(p, 0.05 + i * 0.09, 0.2 + i * 0.09)).attr('transform', `translate(0,${16 * (1 - seg(p, 0.05 + i * 0.09, 0.24 + i * 0.09))})`));
      },
      stop() {},
    };
  };

  /* ---------------------------------------------------------------- Famulus Science: the modules, each resting on functions */
  NS.science = function (el, step, ctx) {
    const S = stage(el, ctx, 'science'), svg = S.svg, T = S.T, fn = S.U.chapters || [], mods = S.U.science || [];
    const fx = d3.scalePoint().domain(fn.map(c => String(c.num))).range([150, 1130]), fy = 600;
    const cols = S.small ? 2 : 4, shown = S.small ? mods.slice(0, 6) : mods, w = 1100 / cols, y0 = 150, rh = S.small ? 110 : 96;
    const gl = svg.append('g');
    fn.forEach(c => {
      svg.append('circle').attr('cx', fx(String(c.num))).attr('cy', fy).attr('r', 30).attr('fill', DEEP).attr('stroke', GOLD).attr('stroke-width', 3);
      S.text(svg, fx(String(c.num)), fy + S.fs(28) * 0.36, String(c.num), 28, { font: DISPLAY, anchor: 'middle', fill: GOLD, weight: 560 });
      if (!S.small) S.text(svg, fx(String(c.num)), fy + 62, cut(c.name, 14), 20, { anchor: 'middle', fill: PALE });
    });
    const tiles = shown.map((m, i) => {
      const x = 90 + (i % cols) * w, y = y0 + Math.floor(i / cols) * rh, g = svg.append('g'), on = m.s !== 'ausbau';
      const r = g.append('rect').attr('x', x).attr('y', y).attr('width', w - 18).attr('height', rh - 16).attr('rx', 10).attr('fill', DEEP).attr('stroke', GOLD).attr('stroke-width', 2).attr('stroke-dasharray', on ? null : '7 6');
      wrap(cut(m.n, 44), S.small ? 20 : 20).slice(0, 2).forEach((l, k) => S.text(g, x + 16, y + 34 + k * S.fs(22) * 1.12, l, 22, { weight: 650 }));
      const lines = (m.u || []).map(u => gl.append('path').attr('fill', 'none').attr('stroke', GOLD).attr('stroke-width', 2.4)
        .attr('d', `M${x + (w - 18) / 2},${y + rh - 16} C${x + (w - 18) / 2},${fy - 120} ${fx(String(u))},${fy - 150} ${fx(String(u))},${fy - 32}`));
      return { g, r, lines };
    });
    return {
      frame(p) {
        const n = tiles.length || 1, a = seg(p, 0, 0.25), k = p >= 1 ? -1 : Math.min(n - 1, Math.floor(clamp((p - 0.22) / 0.76) * n));
        tiles.forEach((o, i) => {
          o.g.attr('opacity', seg(a, i / n * 0.8, i / n * 0.8 + 0.2));
          o.r.attr('stroke-width', i === k ? 4.5 : 2).attr('fill', i === k ? '#0b2a52' : DEEP);
          o.lines.forEach(l => l.attr('opacity', i === k ? 0.95 : p >= 1 ? 0.22 : 0));
        });
      },
      stop() {},
    };
  };

  /* ---------------------------------------------------------------- the fields of application: a matrix that takes a new row */
  NS.felder = function (el, step, ctx) {
    const S = stage(el, ctx, 'felder'), svg = S.svg, T = S.T, fn = S.U.chapters || [];
    const fs0 = (S.U.fields || []), rowsD = (S.small ? fs0.slice(0, 4) : fs0.slice(0, 8)).concat([{ n: S.U.newField || '', b: [1, 2, 3], u: [4, 5, 6, 7], neu: true }]);
    const x0 = S.small ? 620 : 560, x1 = 1170, y0 = 150, rh = Math.min(S.small ? 92 : 56, 500 / rowsD.length);
    const cx = d3.scalePoint().domain(fn.map(c => String(c.num))).range([x0, x1]);
    fn.forEach(c => S.text(svg, cx(String(c.num)), y0 - 26, String(c.num), 28, { font: DISPLAY, anchor: 'middle', fill: GOLD, weight: 560 }));
    const rows = rowsD.map((f, i) => {
      const y = y0 + i * rh + rh / 2, g = svg.append('g');
      if (f.neu) g.append('rect').attr('x', 70).attr('y', y - rh / 2 + 3).attr('width', 1140).attr('height', rh - 6).attr('rx', 8).attr('fill', 'none').attr('stroke', GOLD).attr('stroke-width', 2.4).attr('stroke-dasharray', '9 7');
      S.text(g, 90, y + S.fs(24) * 0.34, cut(f.n, S.small ? 22 : 34), 24, { weight: 650, fill: f.neu ? GOLD : PAPER, italic: !!f.neu });
      const marks = fn.map(c => {
        const k = Number(c.num), b = (f.b || []).includes(k), u = (f.u || []).includes(k);
        if (!b && !u) return null;
        return b ? g.append('rect').attr('x', -10).attr('y', -10).attr('width', 20).attr('height', 20).attr('fill', GOLD).attr('transform', `translate(${cx(String(c.num))},${y}) rotate(45)`)
                 : g.append('circle').attr('cx', cx(String(c.num))).attr('cy', y).attr('r', 8).attr('fill', PAPER);
      });
      return { g, marks, neu: !!f.neu };
    });
    return {
      frame(p) {
        const n = rows.length;
        rows.forEach((o, i) => {
          const a = o.neu ? 0.72 : 0.04 + (i / n) * 0.6;
          o.g.attr('opacity', seg(p, a, a + 0.14));
          o.marks.forEach((m, k) => { if (m) m.attr('opacity', seg(p, a + 0.05 + k * 0.02, a + 0.16 + k * 0.02)); });
        });
      },
      stop() {},
    };
  };

  /* ---------------------------------------------------------------- 4 Begründen und Prüfen (was II Validierung): every part of a statement bound to the wording */
  NS.beleg = function (el, step, ctx) {
    const S = stage(el, ctx, 'beleg'), svg = S.svg, T = S.T, card = S.U.evidence || {}, ev = card.evidence || {};
    const teile = (ev.teile || []).slice(0, 4), n = teile.length || 1;
    const top = S.small ? 200 : 230, gap = Math.min(S.small ? 120 : 100, (640 - top) / n), size = S.small ? 30 : 34;
    S.text(svg, 90, top - 62, T.claim, 26, { fill: GOLD, weight: 650 });
    S.text(svg, 1190, top - 62, T.ground, 26, { fill: GOLD, weight: 650, anchor: 'end' });
    const rows = teile.map((t, k) => {
      const y = top + k * gap, g = svg.append('g');
      const l = S.text(g, 90, y, t.aussage, size, { weight: 650 });
      const r = S.text(g, 1190, y, t.spanne, size, { font: SERIF, italic: true, anchor: 'end' });
      if (!S.small) S.text(g, 90, y - S.fs(size) - 4, t.rolle, 20, { fill: PALE });
      let lw = 0, rw = 0;
      try { lw = l.node().getComputedTextLength(); rw = r.node().getComputedTextLength(); } catch (e) {}
      if (!lw) lw = (t.aussage || '').length * S.fs(size) * 0.54;
      if (!rw) rw = (t.spanne || '').length * S.fs(size) * 0.5;
      const x1 = 90 + lw + 22, x2 = Math.max(x1 + 30, 1190 - rw - 22), yy = y - S.fs(size) * 0.3;
      const line = g.append('line').attr('x1', x1).attr('y1', yy).attr('y2', yy).attr('stroke', GOLD).attr('stroke-width', 3.2).attr('stroke-linecap', 'round');
      const dot = g.append('circle').attr('cy', yy).attr('r', 7).attr('fill', GOLD);
      return { g, l, r, line, dot, x1, x2 };
    });
    const sum = ev.klauseln == null || S.small ? null
      : S.text(svg, 640, 650, ev.begruendet + (card.von || ' / ') + ev.klauseln + ' ' + (card.begruendet_label || '') + (ev.ref ? ' · ' + ev.ref : ''), 26, { anchor: 'middle', fill: GOLD, weight: 650 });
    return {
      frame(p) {
        rows.forEach((o, k) => {
          const a = k * 0.2;
          o.l.attr('opacity', seg(p, a, a + 0.14));
          const u = seg(p, a + 0.1, a + 0.3);
          o.line.attr('x2', o.x1 + (o.x2 - o.x1) * u).attr('opacity', u > 0 ? 1 : 0);
          o.dot.attr('cx', o.x1 + (o.x2 - o.x1) * u).attr('opacity', u > 0 && u < 1 ? 1 : 0);
          o.r.attr('opacity', seg(p, a + 0.24, a + 0.38));
        });
        if (sum) sum.attr('opacity', seg(p, 0.86, 1));
      },
      stop() {},
    };
  };

  /* ---------------------------------------------------------------- III Experten: certified means measured */
  NS.experte = function (el, step, ctx) {
    const S = stage(el, ctx, 'experte'), svg = S.svg, T = S.T, xs = S.U.experts || [];
    const one = !!(step && step.data && step.data.phase), ph2 = one && step.data.phase === 2;
    const g1 = svg.append('g'), g2 = svg.append('g');
    // phase 1: the experts with their state and what was measured
    const gap1 = Math.min(170, 500 / Math.max(1, xs.length));
    const rows1 = xs.map((x, k) => {
      const y = 220 + k * gap1, g = g1.append('g'), f = x.facts || {};
      g.append('circle').attr('cx', 118).attr('cy', y - 12).attr('r', 26).attr('fill', x.state === 'laeuft' ? GOLD : 'none').attr('stroke', GOLD).attr('stroke-width', 3)
        .attr('stroke-dasharray', x.state === 'laeuft' || x.state === 'gebaut' ? null : '6 5');
      S.text(g, 170, y, x.label[S.lang] || x.label.de, 40, { font: DISPLAY, weight: 560 });
      S.text(g, 170, y + S.fs(26) * 1.5, (S.U.states[x.state] || '') + ' · ' + f.gates_measured + ' ' + T.measured + ', ' + f.gates_passed + ' ' + T.passed, 26, { fill: PALE });
      return g;
    });
    // phase 2: the measured comparisons, each bar the value as a share of its threshold
    const gates = [];
    xs.forEach(x => ((x.facts || {}).gates || []).forEach(gt => gates.push(gt)));
    const shown = gates.slice(0, S.small ? 3 : 5), gap2 = Math.min(100, 470 / Math.max(1, shown.length));
    const rows2 = shown.map((gt, k) => {
      const y = 190 + k * gap2, g = g2.append('g');
      const label = gt.reference && gt.title && gt.title.length > 14 ? gt.title : (gt.reference || gt.title);
      S.text(g, 90, y, cut(label, S.small ? 30 : 74), 26, { weight: 650 });
      const has = gt.threshold != null && gt.threshold > 0, share = has ? clamp(gt.value / gt.threshold) : 0, BW = 560;
      if (has) g.append('rect').attr('x', 90).attr('y', y + 18).attr('width', BW).attr('height', 12).attr('rx', 6).attr('fill', SOFT);
      const bar = g.append('rect').attr('x', 90).attr('y', y + 18).attr('height', 12).attr('rx', 6).attr('fill', GOLD);
      if (has) g.append('line').attr('x1', 90 + BW).attr('x2', 90 + BW).attr('y1', y + 8).attr('y2', y + 40).attr('stroke', PAPER).attr('stroke-width', 3);
      const unit = /arcmin/.test(gt.metric || '') ? '′' : /deg/.test(gt.metric || '') ? '°' : '';
      const v = num(gt.value, S.lang) + unit + (has ? '  (' + T.limit + ' ' + num(gt.threshold, S.lang) + unit + ')' : '  (' + T.noLimit + ')');
      S.text(g, 1190, y + (S.small ? 62 : 30), v + (gt.passed ? '  ✓' : ''), 26, { anchor: 'end', fill: gt.passed ? GOLD : PALE, weight: 650 });
      return { g, bar, w: has ? Math.max(6, BW * share) : 0 };
    });
    return {
      frame(p) {
        const [a, b] = one ? (ph2 ? [1, p] : [p, 0]) : S.mini ? [p, 0] : [clamp(p * 2), clamp(p * 2 - 1)];
        g1.attr('opacity', 1 - ease(b * 4));
        rows1.forEach((g, k) => g.attr('opacity', seg(a, k * 0.22, k * 0.22 + 0.3)).attr('transform', `translate(${-24 * (1 - seg(a, k * 0.22, k * 0.22 + 0.34))},0)`));
        g2.attr('opacity', ease(b * 4));
        rows2.forEach((o, k) => { o.g.attr('opacity', seg(b, 0.08 + k * 0.1, 0.28 + k * 0.1)); o.bar.attr('width', o.w * seg(b, 0.18 + k * 0.1, 0.5 + k * 0.1)); });
      },
      stop() {},
    };
  };

  /* ---------------------------------------------------------------- IV Arbeitsmedium: one block holds question, answer, check and provenance */
  NS.notebook = function (el, step, ctx) {
    const S = stage(el, ctx, 'notebook'), svg = S.svg, T = S.T;
    const bx = 100, by = 130, bw = S.small ? 1080 : 640, bh = 510, rh = bh / 5;
    svg.append('rect').attr('x', bx).attr('y', by).attr('width', bw).attr('height', bh).attr('rx', 16).attr('fill', DEEP).attr('stroke', GOLD).attr('stroke-width', 3);
    const rows = T.rows.map((name, k) => {
      const y = by + k * rh, g = svg.append('g');
      if (k) g.append('line').attr('x1', bx).attr('x2', bx + bw).attr('y1', y).attr('y2', y).attr('stroke', GOLD).attr('stroke-width', 1.2).attr('opacity', 0.5);
      S.text(g, bx + 30, y + rh / 2 + S.fs(30) * 0.34, name, 30, { fill: k === 3 ? GOLD : PAPER, weight: 650 });
      const x = bx + (S.small ? 520 : 250), w = bw - (S.small ? 560 : 290);
      const bar = g.append('rect').attr('x', x).attr('y', y + rh / 2 - 8).attr('height', 16).attr('rx', 8).attr('fill', k === 3 ? GOLD : PALE).attr('opacity', 0.75);
      return { g, bar, w: w * [0.9, 0.5, 1, 0.34, 0.72][k] };
    });
    // the paper beside it: a number in the text points back to the block that produced it
    const pg = svg.append('g'), px = 900, py = 150, pw = 290, ph = 400;
    let mark = null, link = null, note = null;
    if (!S.small) {
      pg.append('rect').attr('x', px).attr('y', py).attr('width', pw).attr('height', ph).attr('rx', 6).attr('fill', '#0b2a52').attr('stroke', PALE).attr('stroke-width', 2.5);
      d3.range(7).forEach(k => pg.append('rect').attr('x', px + 30).attr('y', py + 40 + k * 48).attr('width', k === 3 ? 96 : [230, 200, 230, 0, 180, 230, 140][k]).attr('height', 14).attr('rx', 7).attr('fill', PALE).attr('opacity', 0.55));
      mark = pg.append('rect').attr('x', px + 140).attr('y', py + 40 + 144 - 8).attr('width', 64).attr('height', 30).attr('rx', 6).attr('fill', GOLD);
      link = svg.append('path').attr('fill', 'none').attr('stroke', GOLD).attr('stroke-width', 3).attr('stroke-dasharray', '9 7');
      note = S.text(svg, px + pw / 2, py + ph + 54, T.refers, 24, { anchor: 'middle', fill: GOLD, weight: 650 });
    }
    const X1 = px + 140, Y1 = py + 40 + 144 + 7, X2 = bx + bw, Y2 = by + 2.5 * rh;
    return {
      frame(p) {
        rows.forEach((o, k) => { o.g.attr('opacity', seg(p, k * 0.12, k * 0.12 + 0.16)); o.bar.attr('width', o.w * seg(p, k * 0.12 + 0.06, k * 0.12 + 0.3)); });
        if (S.small) return;
        pg.attr('opacity', seg(p, 0.6, 0.78));
        const u = seg(p, 0.76, 0.96), xm = X1 + (X2 - X1) * u;
        link.attr('d', u > 0 ? `M${X1},${Y1} C${X1 - 60},${Y1} ${xm + 60},${Y2} ${xm},${Y2 + (Y1 - Y2) * (1 - u)}` : null);
        note.attr('opacity', seg(p, 0.9, 1));
      },
      stop() {},
    };
  };

  /* ---------------------------------------------------------------- V Publikation: three necessary conditions, then the seal */
  NS.siegel = function (el, step, ctx) {
    const S = stage(el, ctx, 'siegel'), svg = S.svg, T = S.T, F = S.U.facts || {};
    const Y = 330, X = [330, 620, 910], XS = 1130;
    svg.append('line').attr('x1', 110).attr('x2', XS - 70).attr('y1', Y).attr('y2', Y).attr('stroke', GOLD).attr('stroke-width', 2).attr('stroke-dasharray', '3 9').attr('opacity', 0.7);
    const gates = X.map((x, k) => {
      const g = svg.append('g');
      const arch = g.append('path').attr('d', `M${x - 62},${Y + 96} V${Y - 40} A62,62 0 0 1 ${x + 62},${Y - 40} V${Y + 96}`).attr('fill', 'none').attr('stroke', GOLD).attr('stroke-width', 5).attr('stroke-linecap', 'round');
      const no = S.text(g, x, Y - 118, String(k + 1), 34, { font: DISPLAY, anchor: 'middle', fill: GOLD, weight: 560 });
      if (!S.small) wrap(T.gates[k], 19).slice(0, 2).forEach((l, j) => S.text(g, x, Y + 146 + j * 32, l, 24, { anchor: 'middle', fill: PAPER }));
      return { g, arch, no };
    });
    const heft = pageIcon(svg, 0, 0, 62, 80);
    // the seal is granted only when an issue has it: solid then, an outline while no issue carries it
    const has = (F.issues_released || 0) > 0;
    const seal = svg.append('g').attr('transform', `translate(${XS},${Y})`);
    seal.append('path').attr('d', d3.range(24).map(i => { const a = i / 24 * Math.PI * 2, r = i % 2 ? 60 : 72; return (i ? 'L' : 'M') + (r * Math.cos(a)).toFixed(1) + ',' + (r * Math.sin(a)).toFixed(1); }).join('') + 'Z')
      .attr('fill', has ? GOLD : 'none').attr('stroke', GOLD).attr('stroke-width', 3.5).attr('stroke-dasharray', has ? null : '8 6');
    if (!S.small) S.text(svg, XS, Y + 146, T.seal, 24, { anchor: 'middle', fill: GOLD, weight: 650 });
    const state = F.issues == null ? null : S.text(svg, 640, 650, F.issues + ' ' + T.online + ' · ' + T.sealed + ': ' + (F.issues_released || 0), S.small ? 26 : 30, { anchor: 'middle', fill: GOLD, weight: 650 });
    return {
      frame(p) {
        const u = seg(p, 0.08, 0.8), x = 130 + ((has ? XS - 110 : X[0] - 120) - 130) * u;
        heft.attr('transform', `translate(${x},${Y})`).attr('opacity', seg(p, 0, 0.1));
        gates.forEach((o, k) => {
          const on = x > X[k] - 6 ? 1 : 0;
          o.g.attr('opacity', seg(p, k * 0.05, k * 0.05 + 0.15));
          o.arch.attr('stroke-width', on ? 8 : 5).attr('opacity', on ? 1 : 0.6);
          o.no.attr('fill', on ? PAPER : GOLD);
        });
        seal.attr('opacity', seg(p, 0.2, 0.4) * (has ? 1 : 0.9));
        if (state) state.attr('opacity', seg(p, 0.82, 1));
      },
      stop() {},
    };
  };

  /* ---------------------------------------------------------------- VI WWK: a register without a centre; one reference, one line */
  NS.netz = function (el, step, ctx) {
    const S = stage(el, ctx, 'netz'), svg = S.svg, T = S.T, F = S.U.facts || {}, ex = S.U.example || {};
    const cx = 470, cy = 300, n = F.register_namespaces || 0;
    const O = [[850, 150], [1050, 250], [1040, 430], [860, 520], [140, 440], [150, 170]];
    const E = O.map(o => { const d = Math.hypot(o[0] - cx, o[1] - cy), ux = (o[0] - cx) / d, uy = (o[1] - cy) / d; return [cx + ux * 128, cy + uy * 128, o[0] - ux * 36, o[1] - uy * 36]; });
    const gl = svg.append('g'), go = svg.append('g'), gn = svg.append('g');
    // reference points of other institutions: outlines only, because none is registered (future work)
    const built = F.peers || 0;
    const links = E.map(e => gl.append('line').attr('x1', e[0]).attr('y1', e[1]).attr('stroke', GOLD).attr('stroke-width', 2.2).attr('stroke-dasharray', '7 8'));
    const others = O.map((o, k) => go.append('circle').attr('cx', o[0]).attr('cy', o[1]).attr('r', 34).attr('fill', k < built ? GOLD : 'none').attr('stroke', GOLD).attr('stroke-width', 3).attr('stroke-dasharray', k < built ? null : '7 6'));
    const dots = d3.range(n).map(k => { const a = k / Math.max(1, n) * Math.PI * 2 - Math.PI / 2; return gn.append('circle').attr('cx', cx + 112 * Math.cos(a)).attr('cy', cy + 112 * Math.sin(a)).attr('r', 6).attr('fill', GOLD); });
    gn.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 62).attr('fill', GOLD).attr('stroke', PAPER).attr('stroke-width', 3);
    const name = S.small ? null : S.text(gn, cx, cy + 166, (F.node_name || '') + (n ? ' · ' + n + ' ' + T.spaces : ''), 26, { anchor: 'middle', weight: 650 });
    const reg = S.small ? null : S.text(gn, cx, cy + 166 + 34, T.register, 24, { anchor: 'middle', fill: PALE });
    const oth = S.small || F.peers == null ? null : S.text(svg, 1190, 110, T.others + ': ' + F.peers, 24, { anchor: 'end', fill: PALE });
    // the one line: the reference itself
    const ref = ex.ref || '', size = Math.max(S.fs(26), Math.min(44, 1100 / (0.602 * Math.max(1, ref.length))));
    const line = svg.append('text').attr('x', 640).attr('y', 648).attr('text-anchor', 'middle').attr('font-family', MONO).attr('font-size', size).attr('fill', PAPER).attr('font-weight', 560);
    const cap = S.small ? null : S.text(svg, 640, 648 - size - 12, T.oneLine, 24, { anchor: 'middle', fill: GOLD, weight: 650 });
    return {
      frame(p) {
        const [a, b, c] = phases(3, step, p);
        gn.attr('opacity', seg(a, 0, 0.25));
        dots.forEach((d, k) => d.attr('opacity', seg(a, 0.2 + k / Math.max(1, n) * 0.55, 0.3 + k / Math.max(1, n) * 0.55)));
        if (name) name.attr('opacity', seg(a, 0.7, 0.9));
        if (reg) reg.attr('opacity', seg(a, 0.8, 1));
        O.forEach((o, k) => {
          const u = seg(b, k * 0.1, k * 0.1 + 0.4);
          links[k].attr('x2', E[k][0] + (E[k][2] - E[k][0]) * u).attr('y2', E[k][1] + (E[k][3] - E[k][1]) * u).attr('opacity', u > 0 ? 0.75 : 0);
          others[k].attr('opacity', seg(b, k * 0.1 + 0.3, k * 0.1 + 0.5));
        });
        if (oth) oth.attr('opacity', seg(b, 0.75, 1));
        line.text(ref.slice(0, Math.round(ref.length * seg(c, 0.15, 0.8)))).attr('opacity', c > 0 ? 1 : 0);
        if (cap) cap.attr('opacity', seg(c, 0, 0.2));
      },
      stop() {},
    };
  };
})();
