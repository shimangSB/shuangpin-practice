/* ============================================================
 * 双拼练习 - 主逻辑
 * 依赖：data.js（window.SP_DATA）
 * ============================================================ */
(function () {
  'use strict';

  var DATA = window.SP_DATA;
  var SCHEMES = DATA.SCHEMES;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- 状态 ---------------- */
  var state = {
    schemeId: 'xiaohe',
    mode: 'layout',
    showHint: true,
    vuInterchange: true, // v 键可用 u 代替（如「局」= jv 或 ju）
    allTime: { total: 0, correct: 0, bestStreak: 0 } // 累计（localStorage）
  };

  try {
    var saved = JSON.parse(localStorage.getItem('sp_stats_v1') || 'null');
    if (saved && typeof saved.total === 'number') state.allTime = saved;
  } catch (e) { /* ignore */ }

  function saveAllTime() {
    try { localStorage.setItem('sp_stats_v1', JSON.stringify(state.allTime)); } catch (e) { /* ignore */ }
  }
  function currentScheme() {
    for (var i = 0; i < SCHEMES.length; i++) if (SCHEMES[i].id === state.schemeId) return SCHEMES[i];
    return SCHEMES[0];
  }

  /* ---------------- v/u 互通 ---------------- */
  // 规则：标准码中的 v（zh / ui / ü）可以用 u 代替输入。
  function codeMatches(typed, expected) {
    if (typed.length !== expected.length) return false;
    for (var i = 0; i < typed.length; i++) {
      var t = typed.charAt(i), e = expected.charAt(i);
      if (t === e) continue;
      if (state.vuInterchange && e === 'v' && t === 'u') continue;
      return false;
    }
    return true;
  }
  function vuVariant(code) {
    return code.replace(/v/g, 'u');
  }
  function displayCode(code) {
    if (!state.vuInterchange) return code;
    var v = vuVariant(code);
    return v === code ? code : code + '（或 ' + v + '）';
  }

  /* ---------------- 转换核心 ---------------- */
  var INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
    'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's'];

  var Y_MAP = { ya: 'ia', yan: 'ian', yang: 'iang', yao: 'iao', ye: 'ie', yi: 'i',
    yin: 'in', ying: 'ing', yo: 'io', yong: 'iong', you: 'iu', yu: 'ü',
    yuan: 'üan', yue: 'üe', yun: 'ün' };
  var W_MAP = { wa: 'ua', wai: 'uai', wan: 'uan', wang: 'uang', wei: 'ui',
    wen: 'un', weng: 'ueng', wo: 'uo', wu: 'u' };
  var JQX_U = { u: 'ü', ue: 'üe', uan: 'üan', un: 'ün' };

  function toShuangpin(syl, scheme) {
    if (!syl) return null;
    syl = String(syl).trim().toLowerCase();
    if (!syl) return null;

    // y/w 开头的零声母
    if (syl.charAt(0) === 'y') {
      var fy = Y_MAP[syl];
      if (!fy) return null;
      var ky = scheme.finals[fy];
      if (!ky) return null;
      return 'y' + ky;
    }
    if (syl.charAt(0) === 'w') {
      var fw = W_MAP[syl];
      if (!fw) return null;
      var kw = scheme.finals[fw];
      if (!kw) return null;
      return 'w' + kw;
    }

    // 纯元音零声母（a/o/e 开头）
    var firstTwo = syl.slice(0, 2);
    var isInitial = INITIALS.indexOf(syl.charAt(0)) >= 0 || INITIALS.indexOf(firstTwo) >= 0;
    if (!isInitial) {
      if (syl === 'er' && scheme.zeroMode === 'first') return 'er';
      var prefix = scheme.zeroMode === 'first' ? syl.charAt(0) : 'o';
      var k0 = scheme.finals[syl];
      if (!k0) return null;
      return prefix + k0;
    }

    // 常规：声母 + 韵母
    var initial, final;
    if (INITIALS.indexOf(firstTwo) >= 0) {
      initial = firstTwo; final = syl.slice(2);
    } else {
      initial = syl.charAt(0); final = syl.slice(1);
    }
    // j/q/x 后面的 u 实际是 ü
    if ((initial === 'j' || initial === 'q' || initial === 'x') && final.charAt(0) === 'u') {
      final = JQX_U[final] || final;
    }
    var ik = scheme.initials[initial] || initial;
    var fk = scheme.finals[final];
    if (!fk) return null;
    return ik + fk;
  }

  /* 生成 key -> [韵母] 反向映射（用于键盘和反查） */
  function buildReverseMap(scheme) {
    var rev = {};
    var finals = Object.keys(scheme.finals);
    for (var i = 0; i < finals.length; i++) {
      var f = finals[i];
      var k = scheme.finals[f];
      if (!rev[k]) rev[k] = [];
      if (rev[k].indexOf(f) < 0) rev[k].push(f);
    }
    return rev;
  }

  /* ---------------- 键盘渲染 ---------------- */
  var KB_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];
  var INITIAL_LABELS = { v: 'zh', i: 'ch', u: 'sh' };

  function renderKeyboard() {
    var scheme = currentScheme();
    var rev = buildReverseMap(scheme);
    var kb = $('keyboard');
    kb.innerHTML = '';
    for (var r = 0; r < KB_ROWS.length; r++) {
      var row = document.createElement('div');
      row.className = 'kb-row';
      for (var c = 0; c < KB_ROWS[r].length; c++) {
        var key = KB_ROWS[r][c];
        var keyEl = document.createElement('div');
        keyEl.className = 'kb-key';
        keyEl.setAttribute('data-key', key);

        var letter = document.createElement('span');
        letter.className = 'kb-letter';
        letter.textContent = key === ';' ? ';' : key.toUpperCase();
        keyEl.appendChild(letter);

        var finals = rev[key] || [];
        var finEl = document.createElement('span');
        finEl.className = 'kb-finals';
        finEl.textContent = finals.length ? finals.join(' ') : '';
        keyEl.appendChild(finEl);

        if (INITIAL_LABELS[key]) {
          var ini = document.createElement('span');
          ini.className = 'kb-initial';
          ini.textContent = INITIAL_LABELS[key];
          keyEl.appendChild(ini);
        }
        row.appendChild(keyEl);
      }
      kb.appendChild(row);
    }
  }

  var flashTimer = null;
  function flashKeys(keys, cls, duration) {
    clearTimeout(flashTimer);
    var els = document.querySelectorAll('.kb-key');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.remove('kb-correct', 'kb-wrong', 'kb-hit');
    }
    if (!keys) return;
    var arr = keys.split('');
    for (var j = 0; j < els.length; j++) {
      if (arr.indexOf(els[j].getAttribute('data-key')) >= 0) els[j].classList.add(cls);
    }
    flashTimer = setTimeout(function () {
      var all = document.querySelectorAll('.kb-key');
      for (var k = 0; k < all.length; k++) all[k].classList.remove('kb-correct', 'kb-wrong', 'kb-hit');
    }, duration || 900);
  }

  function keyEl(letter) {
    return document.querySelector('.kb-key[data-key="' + letter + '"]');
  }

  /* ---------------- 通用提示渲染 ---------------- */
  function setFeedback(el, text, cls) {
    el.textContent = text;
    el.className = 'feedback' + (cls ? ' ' + cls : '');
  }

  function renderSlots(container, answerLen, typed) {
    container.innerHTML = '';
    for (var i = 0; i < answerLen; i++) {
      var slot = document.createElement('span');
      slot.className = 'slot';
      if (i < typed.length) {
        slot.textContent = typed.charAt(i);
        slot.classList.add('filled');
      }
      container.appendChild(slot);
    }
  }

  /* ---------------- 统计条 ---------------- */
  var session = { total: 0, correct: 0, streak: 0, bestStreak: 0 };
  function updateStatsBar() {
    var acc = session.total ? Math.round(session.correct / session.total * 100) : 0;
    var allAcc = state.allTime.total ? Math.round(state.allTime.correct / state.allTime.total * 100) : 0;
    $('statSession').textContent = session.total + ' 题 / ' + session.correct + ' 对（' + acc + '%）';
    $('statStreak').textContent = '连击 ' + session.streak + ' · 最佳 ' + session.bestStreak;
    $('statAll').textContent = '累计 ' + state.allTime.total + ' 题 · 正确率 ' + allAcc + '% · 最佳连击 ' + state.allTime.bestStreak;
  }
  function recordResult(ok) {
    session.total++;
    if (ok) {
      session.correct++;
      session.streak++;
      if (session.streak > session.bestStreak) session.bestStreak = session.streak;
    } else {
      session.streak = 0;
    }
    state.allTime.total++;
    if (ok) state.allTime.correct++;
    if (session.bestStreak > state.allTime.bestStreak) state.allTime.bestStreak = session.bestStreak;
    saveAllTime();
    updateStatsBar();
  }

  /* ---------------- 练习引擎（音节/单字/词语/反查 共用） ---------------- */
  var Drill = {
    active: false,
    answer: '',        // 完整正确码
    codes: [],         // 每个部分的码（用于拆解显示）
    buffer: '',
    newItemFn: null,   // 返回 {promptHTML, hintHTML, answer}
    promptEl: null,
    hintEl: null,
    slotsEl: null,
    fbEl: null,
    startEl: null,

    start(cfg) {
      this.newItemFn = cfg.newItem;
      this.promptEl = cfg.promptEl;
      this.hintEl = cfg.hintEl || null;
      this.slotsEl = cfg.slotsEl;
      this.fbEl = cfg.fbEl;
      this.startEl = cfg.startEl;
      this.active = true;
      this.next();
    },
    stop() {
      this.active = false;
      this.buffer = '';
    },
    next() {
      var item = this.newItemFn();
      this.promptEl.innerHTML = item.promptHTML;
      if (this.hintEl) this.hintEl.innerHTML = item.hintHTML || '';
      this.answer = item.answer;
      this.buffer = '';
      if (this.slotsEl) renderSlots(this.slotsEl, item.answer.length, '');
      if (this.fbEl) setFeedback(this.fbEl, item.answer.length + ' 键', '');
    },
    key(k) {
      if (!this.active) return;
      if (k === 'BACKSPACE') {
        if (this.buffer.length > 0) {
          this.buffer = this.buffer.slice(0, -1);
          renderSlots(this.slotsEl, this.answer.length, this.buffer);
        }
        return;
      }
      if (!/^[a-z;]$/.test(k)) return;
      this.buffer += k;
      renderSlots(this.slotsEl, this.answer.length, this.buffer);
      if (this.buffer.length >= this.answer.length) {
        var ok = codeMatches(this.buffer, this.answer);
        recordResult(ok);
        if (ok) {
          flashKeys(this.answer, 'kb-correct', 500);
          setFeedback(this.fbEl, '✓ 正确 ' + displayCode(this.answer), 'ok');
        } else {
          flashKeys(this.answer, 'kb-wrong', 1200);
          setFeedback(this.fbEl, '✗ 应为 ' + displayCode(this.answer), 'err');
        }
        var self = this;
        setTimeout(function () {
          if (self.active) self.next();
        }, ok ? 350 : 1100);
      }
    }
  };

  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ---------- 音节练习 ---------- */
  function syllableItem() {
    var s = pickRandom(DATA.SYLLABLES);
    var code = toShuangpin(s, currentScheme()) || '??';
    return {
      promptHTML: '<span class="big-syllable">' + s + '</span>',
      hintHTML: '',
      answer: code
    };
  }

  /* ---------- 单字练习 ---------- */
  function characterItem() {
    var e = pickRandom(DATA.CHARACTERS);
    var code = toShuangpin(e[1], currentScheme()) || '??';
    return {
      promptHTML: '<span class="big-char">' + e[0] + '</span>',
      hintHTML: state.showHint ? '拼音：' + e[1] : '',
      answer: code
    };
  }

  /* ---------- 词语练习 ---------- */
  function wordItem() {
    var w = pickRandom(DATA.WORDS);
    var py = w[1].split(' ');
    var codes = [];
    for (var i = 0; i < py.length; i++) codes.push(toShuangpin(py[i], currentScheme()) || '??');
    return {
      promptHTML: '<span class="big-word">' + w[0] + '</span>',
      hintHTML: state.showHint ? '拼音：' + w[1] : '',
      answer: codes.join('')
    };
  }

  /* ---------- 键位反查 ---------- */
  var rvDirection = 'f2k'; // f2k: 韵母->键位, k2f: 键位->韵母
  var rvChoices = [];
  function reverseItem() {
    var scheme = currentScheme();
    var finals = Object.keys(scheme.finals);
    var rev = buildReverseMap(scheme);
    if (rvDirection === 'f2k') {
      var f = pickRandom(finals);
      var key = scheme.finals[f];
      return {
        promptHTML: '<span class="big-syllable">' + f + '</span>',
        hintHTML: '韵母「' + f + '」在哪个键？',
        answer: key
      };
    } else {
      var keys = Object.keys(rev).filter(function (k) { return /^[a-z;]$/.test(k); });
      var k2 = pickRandom(keys);
      var correctFinal = pickRandom(rev[k2]);
      var pool = finals.filter(function (x) { return x !== correctFinal; });
      // 随机抽 3 个干扰项
      var distract = [];
      while (distract.length < 3 && pool.length) {
        var idx = Math.floor(Math.random() * pool.length);
        distract.push(pool.splice(idx, 1)[0]);
      }
      rvChoices = [correctFinal].concat(distract).sort(function () { return Math.random() - 0.5; });
      return {
        promptHTML: '<span class="big-key">' + k2.toUpperCase() + '</span>',
        hintHTML: '键「' + k2 + '」对应哪个韵母？',
        answer: correctFinal,
        choices: true
      };
    }
  }

  function renderReverseChoices() {
    var box = $('rvChoices');
    box.innerHTML = '';
    for (var i = 0; i < rvChoices.length; i++) {
      (function (choice) {
        var b = document.createElement('button');
        b.className = 'choice-btn';
        b.textContent = choice;
        b.onclick = function () {
          if (!Drill.active) return;
          var ok = choice === Drill.answer;
          recordResult(ok);
          if (ok) {
            setFeedback($('rvFeedback'), '✓ 正确', 'ok');
            b.classList.add('correct');
          } else {
            setFeedback($('rvFeedback'), '✗ 应为「' + Drill.answer + '」', 'err');
            b.classList.add('wrong');
            var btns = box.querySelectorAll('.choice-btn');
            for (var j = 0; j < btns.length; j++) if (btns[j].textContent === Drill.answer) btns[j].classList.add('correct');
          }
          setTimeout(function () { if (Drill.active) Drill.next(); }, ok ? 350 : 1100);
        };
        box.appendChild(b);
      })(rvChoices[i]);
    }
  }

  /* ---------- 文章跟打 ---------- */
  var Passage = {
    active: false,
    text: '',
    pinyin: [],
    pos: 0,
    buffer: '',
    startTime: 0,
    correctCount: 0,
    wrongCount: 0,
    typedChars: 0,

    start() {
      var p = pickRandom(DATA.PASSAGES);
      this.text = p[0];
      this.pinyin = p[1];
      this.pos = 0;
      this.buffer = '';
      this.correctCount = 0;
      this.wrongCount = 0;
      this.typedChars = 0;
      this.startTime = 0;
      this.active = true;
      $('psResult').textContent = '';
      this.advanceToNext();
      this.render();
      setFeedback($('psFeedback'), '输入当前字（高亮）的双拼码开始', '');
    },
    stop() { this.active = false; },
    advanceToNext() {
      while (this.pos < this.pinyin.length && this.pinyin[this.pos] === '') this.pos++;
    },
    render() {
      var box = $('psText');
      box.innerHTML = '';
      for (var i = 0; i < this.text.length; i++) {
        var span = document.createElement('span');
        span.className = 'ps-char';
        span.textContent = this.text.charAt(i);
        if (i < this.pos) span.classList.add('done');
        if (i === this.pos) span.classList.add('current');
        box.appendChild(span);
      }
      // 拼音提示
      var py = this.pinyin[this.pos] || '';
      var code = toShuangpin(py, currentScheme()) || '';
      $('psHint').textContent = state.showHint ? ('当前：' + this.text.charAt(this.pos) + '  [' + py + ']') : ('当前：' + this.text.charAt(this.pos));
      renderSlots($('psSlots'), code.length, this.buffer);
    },
    key(k) {
      if (!this.active) return;
      if (k === 'BACKSPACE') {
        if (this.buffer.length > 0) { this.buffer = this.buffer.slice(0, -1); this.render(); }
        return;
      }
      if (!/^[a-z;]$/.test(k)) return;
      if (!this.startTime) this.startTime = Date.now();
      var py = this.pinyin[this.pos];
      var code = toShuangpin(py, currentScheme()) || '';
      this.buffer += k;
      if (this.buffer.length >= code.length) {
        var ok = codeMatches(this.buffer, code);
        this.typedChars++;
        if (ok) { this.correctCount++; flashKeys(code, 'kb-correct', 300); }
        else { this.wrongCount++; flashKeys(code, 'kb-wrong', 500); }
        var doneSpan = $('psText').querySelector('.ps-char.current');
        if (doneSpan) { doneSpan.classList.remove('current'); doneSpan.classList.add(ok ? 'ok' : 'bad'); }
        this.pos++;
        this.buffer = '';
        this.advanceToNext();
        if (this.pos >= this.pinyin.length) {
          this.finish();
          return;
        }
        this.render();
      } else {
        this.render();
      }
    },
    finish() {
      this.active = false;
      var mins = (Date.now() - this.startTime) / 60000;
      var cpm = mins > 0 ? Math.round(this.typedChars / mins) : 0;
      var acc = this.typedChars ? Math.round(this.correctCount / this.typedChars * 100) : 0;
      $('psResult').innerHTML =
        '<div class="ps-summary">' +
        '<div><b>' + this.typedChars + '</b><span>字</span></div>' +
        '<div><b>' + cpm + '</b><span>字/分</span></div>' +
        '<div><b>' + acc + '%</b><span>正确率</span></div>' +
        '</div>';
      setFeedback($('psFeedback'), '完成！点击「开始」再来一段。', 'ok');
    }
  };

  /* ---------- 转换器 ---------- */
  function renderConverter() {
    var input = $('cvInput').value.trim();
    var out = $('cvOutput');
    out.innerHTML = '';
    if (!input) { out.textContent = '在上方输入拼音音节（空格分隔），实时显示双拼编码。'; return; }
    var parts = input.split(/\s+/);
    for (var i = 0; i < parts.length; i++) {
      var syl = parts[i].toLowerCase();
      var code = toShuangpin(syl, currentScheme());
      var chip = document.createElement('span');
      chip.className = 'cv-chip';
      if (code) {
        chip.innerHTML = '<span class="cv-py">' + syl + '</span><span class="cv-arrow">→</span><span class="cv-code">' + displayCode(code) + '</span>';
      } else {
        chip.innerHTML = '<span class="cv-py">' + syl + '</span><span class="cv-arrow">→</span><span class="cv-code invalid">无</span>';
      }
      out.appendChild(chip);
    }
  }

  /* ---------- 键位学习页 ---------- */
  function renderLayout() {
    var scheme = currentScheme();
    $('layoutName').textContent = scheme.name;
    $('layoutNote').textContent = scheme.note;

    // 韵母表
    var finals = Object.keys(scheme.finals);
    var tbody = $('finalTable');
    tbody.innerHTML = '';
    var byKey = buildReverseMap(scheme);
    var keyOrder = 'qwertyuiopasdfghjkl;zxcvbnm'.split('');
    var seen = {};
    for (var ki = 0; ki < keyOrder.length; ki++) {
      var k = keyOrder[ki];
      var fs = byKey[k] || [];
      for (var fi = 0; fi < fs.length; fi++) {
        var f = fs[fi];
        if (seen[f]) continue;
        seen[f] = true;
        var tr = document.createElement('tr');
        var td1 = document.createElement('td'); td1.textContent = f; td1.className = 't-final';
        var td2 = document.createElement('td'); td2.textContent = '→';
        var td3 = document.createElement('td'); td3.textContent = k.toUpperCase(); td3.className = 't-key';
        tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
        tbody.appendChild(tr);
      }
    }

    // 零声母示例
    var zeroExamples = ['a', 'ai', 'an', 'ang', 'ao', 'e', 'ei', 'en', 'eng', 'er', 'o', 'ou'];
    var zbox = $('zeroExamples');
    zbox.innerHTML = '';
    for (var zi = 0; zi < zeroExamples.length; zi++) {
      var s = zeroExamples[zi];
      var c = toShuangpin(s, scheme);
      var chip = document.createElement('span');
      chip.className = 'cv-chip';
      chip.innerHTML = '<span class="cv-py">' + s + '</span><span class="cv-arrow">→</span><span class="cv-code">' + c + '</span>';
      zbox.appendChild(chip);
    }

    // 声母说明
    $('initialExamples').innerHTML =
      '<span class="cv-chip"><span class="cv-py">zh</span><span class="cv-arrow">→</span><span class="cv-code">v</span></span>' +
      '<span class="cv-chip"><span class="cv-py">ch</span><span class="cv-arrow">→</span><span class="cv-code">i</span></span>' +
      '<span class="cv-chip"><span class="cv-py">sh</span><span class="cv-arrow">→</span><span class="cv-code">u</span></span>';
  }

  /* ---------- 面板切换 ---------- */
  var MODE_NAMES = {
    layout: '键位学习', syllable: '音节练习', character: '单字练习',
    word: '词语练习', passage: '文章跟打', reverse: '键位反查', converter: '转换器'
  };

  function switchMode(mode) {
    if (Drill.active) Drill.stop();
    if (Passage.active) Passage.stop();
    state.mode = mode;
    // 导航高亮
    var navs = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < navs.length; i++) navs[i].classList.toggle('active', navs[i].getAttribute('data-mode') === mode);
    // 面板显隐
    var panels = document.querySelectorAll('.panel');
    for (var j = 0; j < panels.length; j++) panels[j].classList.toggle('active', panels[j].id === 'panel-' + mode);
    // 键盘显隐（转换器不显示键盘）
    $('keyboardWrap').classList.toggle('hidden', mode === 'converter');

    if (mode === 'layout') renderLayout();
    if (mode === 'syllable') Drill.start({ newItem: syllableItem, promptEl: $('syPrompt'), slotsEl: $('sySlots'), fbEl: $('syFeedback') });
    if (mode === 'character') Drill.start({ newItem: characterItem, promptEl: $('chPrompt'), hintEl: $('chHint'), slotsEl: $('chSlots'), fbEl: $('chFeedback') });
    if (mode === 'word') Drill.start({ newItem: wordItem, promptEl: $('wdPrompt'), hintEl: $('wdHint'), slotsEl: $('wdSlots'), fbEl: $('wdFeedback') });
    if (mode === 'reverse') reverseStart();
    if (mode === 'passage') Passage.start();
    if (mode === 'converter') renderConverter();
  }

  function reverseStart() {
    setReverseButtons();
    Drill.start({ newItem: reverseItem, promptEl: $('rvPrompt'), hintEl: $('rvHint'), slotsEl: $('rvSlots'), fbEl: $('rvFeedback') });
    renderReverseChoices();
  }
  function setReverseButtons() {
    var b1 = $('rvF2k'), b2 = $('rvK2f');
    b1.classList.toggle('active', rvDirection === 'f2k');
    b2.classList.toggle('active', rvDirection === 'k2f');
    // 键位->韵母 用选择按钮，隐藏输入槽；反之显示
    $('rvSlots').style.display = rvDirection === 'f2k' ? '' : 'none';
    $('rvChoices').style.display = rvDirection === 'k2f' ? '' : 'none';
  }

  /* ---------- 全局按键 ---------- */
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    var k = e.key;
    if (k === 'Backspace') { e.preventDefault(); routeKey('BACKSPACE'); return; }
    var lower = k.toLowerCase();
    if (/^[a-z]$/.test(k)) {
      e.preventDefault();
      // 闪烁按下的键
      flashKeys(lower, 'kb-hit', 160);
      routeKey(lower);
      return;
    }
    if (k === ';' || k === ':') {
      e.preventDefault();
      flashKeys(';', 'kb-hit', 160);
      routeKey(';');
    }
  });

  function routeKey(k) {
    if (state.mode === 'syllable' || state.mode === 'character' || state.mode === 'word' || state.mode === 'reverse') {
      if (rvDirection === 'k2f' && state.mode === 'reverse') return; // 用鼠标选择
      Drill.key(k);
    } else if (state.mode === 'passage') {
      Passage.key(k);
    }
  }

  /* ---------- 方案切换 ---------- */
  function renderSchemeButtons() {
    var box = $('schemeSelect');
    box.innerHTML = '';
    for (var i = 0; i < SCHEMES.length; i++) {
      (function (s) {
        var b = document.createElement('button');
        b.className = 'scheme-btn';
        b.textContent = s.name;
        b.setAttribute('data-scheme', s.id);
        b.onclick = function () {
          state.schemeId = s.id;
          renderSchemeButtons();
          renderKeyboard();
          switchMode(state.mode); // 重新加载当前模式
        };
        box.appendChild(b);
      })(SCHEMES[i]);
    }
    var btns = box.querySelectorAll('.scheme-btn');
    for (var j = 0; j < btns.length; j++) btns[j].classList.toggle('active', btns[j].getAttribute('data-scheme') === state.schemeId);
  }

  /* ---------- 初始化 ---------- */
  function init() {
    renderSchemeButtons();
    renderKeyboard();
    updateStatsBar();

    // 导航
    var navs = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < navs.length; i++) {
      navs[i].addEventListener('click', function () {
        switchMode(this.getAttribute('data-mode'));
      });
    }

    // 提示开关
    $('hintToggle').checked = state.showHint;
    $('hintToggle').addEventListener('change', function () {
      state.showHint = this.checked;
      if (state.mode === 'character' || state.mode === 'word') switchMode(state.mode);
      else if (state.mode === 'passage' && Passage.active) Passage.render();
    });

    // v/u 互通开关
    $('vuToggle').checked = state.vuInterchange;
    $('vuToggle').addEventListener('change', function () {
      state.vuInterchange = this.checked;
      if (state.mode === 'converter') renderConverter();
    });

    // 点击按钮/复选框后失焦，避免空格/回车误触
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && (t.tagName === 'BUTTON' || (t.tagName === 'INPUT' && t.type === 'checkbox'))) t.blur();
    });

    // 重置统计
    $('resetStats').addEventListener('click', function () {
      session = { total: 0, correct: 0, streak: 0, bestStreak: 0 };
      state.allTime = { total: 0, correct: 0, bestStreak: 0 };
      saveAllTime();
      updateStatsBar();
    });

    // 反查方向
    $('rvF2k').addEventListener('click', function () { rvDirection = 'f2k'; reverseStart(); });
    $('rvK2f').addEventListener('click', function () { rvDirection = 'k2f'; reverseStart(); });

    // 文章开始
    $('psStart').addEventListener('click', function () { Passage.start(); });

    // 转换器输入
    $('cvInput').addEventListener('input', renderConverter);

    switchMode('layout');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
