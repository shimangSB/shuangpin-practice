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
    ime: 'shuangpin', // 'shuangpin' | 'yinxing'
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
  // 规则：u 与 v 可以互相代替（如「局」= ju 或 jv）
  function codeMatches(typed, expected) {
    if (typed.length !== expected.length) return false;
    for (var i = 0; i < typed.length; i++) {
      var t = typed.charAt(i), e = expected.charAt(i);
      if (t === e) continue;
      if (state.vuInterchange && ((e === 'v' && t === 'u') || (e === 'u' && t === 'v'))) continue;
      return false;
    }
    return true;
  }
  function vuVariant(code) {
    var out = '';
    for (var i = 0; i < code.length; i++) {
      var c = code.charAt(i);
      out += (c === 'v') ? 'u' : (c === 'u' ? 'v' : c);
    }
    return out;
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

    var isXiaohe = scheme.zeroMode === 'first';

    // y/w 开头的零声母
    if (syl.charAt(0) === 'y' || syl.charAt(0) === 'w') {
      var pref = syl.charAt(0);
      if (isXiaohe) {
        // 小鹤：y/w 作首键 + 剩余部分（按字面）的韵母键，如 yang→yh、you→yz、yu→yu
        var rest = syl.slice(1);
        var kr = scheme.finals[rest];
        if (!kr && rest === 'ue') kr = scheme.finals['üe'];
        if (!kr) return null;
        return pref + kr;
      }
      var f = (pref === 'y') ? Y_MAP[syl] : W_MAP[syl];
      if (!f) return null;
      var k = scheme.finals[f];
      if (!k) return null;
      return pref + k;
    }

    // 纯元音零声母（a/o/e 开头）
    var firstTwo = syl.slice(0, 2);
    var isInitial = INITIALS.indexOf(syl.charAt(0)) >= 0 || INITIALS.indexOf(firstTwo) >= 0;
    if (!isInitial) {
      if (isXiaohe) {
        // 小鹤：单字母双写（a→aa），双字母原样（ai→ai、en→en、er→er），三字母首字母+韵母键（ang→ah）
        if (syl.length === 1) return syl + syl;
        if (syl.length === 2) return syl;
        var k3 = scheme.finals[syl];
        if (!k3) return null;
        return syl.charAt(0) + k3;
      }
      var k0 = scheme.finals[syl];
      if (!k0) return null;
      return 'o' + k0;
    }

    // 常规：声母 + 韵母
    var initial, final;
    if (INITIALS.indexOf(firstTwo) >= 0) {
      initial = firstTwo; final = syl.slice(2);
    } else {
      initial = syl.charAt(0); final = syl.slice(1);
    }
    // j/q/x 后面的 u：小鹤按字面（ju→ju），其余方案视为 ü（ju→jv）
    if ((initial === 'j' || initial === 'q' || initial === 'x') && final.charAt(0) === 'u') {
      if (isXiaohe) {
        if (final === 'ue') final = 'üe'; // jue / que / xue
      } else {
        final = JQX_U[final] || final;
      }
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
          if (treasure.confetti) spawnConfetti();
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
        if (ok) { this.correctCount++; flashKeys(code, 'kb-correct', 300); if (treasure.confetti) spawnConfetti(); }
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

  /* ---------- 小鹤音形 ---------- */
  var YX_TEACH = [
    ['鹤', 'he', 'hedn', '点', '鸟'], ['码', 'ma', 'maum', '石', '马'],
    ['走', 'zou', 'zztr', '土', '人'], ['武', 'wu', 'wuav', '一', '止'],
    ['一', 'yi', 'yiaa', '横', '横'], ['乙', 'yi', 'yivv', '折', '折'],
    ['旦', 'dan', 'djoa', '日', '一'], ['建', 'jian', 'jmzy', '廴', '聿'],
    ['国', 'guo', 'goky', '囗', '玉'], ['语', 'yu', 'yvyk', '讠', '口'],
    ['框', 'kuang', 'klmw', '木', '王'], ['挂', 'gua', 'gxft', '扌', '土'],
    ['看', 'kan', 'kjuo', '龵', '目'], ['雪', 'xue', 'xtye', '雨', '彐']
  ];

  function yxMatches(typed, expected) {
    if (typed.length !== expected.length) return false;
    for (var i = 0; i < typed.length; i++) {
      var t = typed.charAt(i), e = expected.charAt(i);
      if (t === e) continue;
      if (state.vuInterchange && i < 2 && ((e === 'v' && t === 'u') || (e === 'u' && t === 'v'))) continue; // v/u 互通只作用于音码
      return false;
    }
    return true;
  }

  var YXDrill = {
    active: false,
    item: null,
    buffer: '',
    start() { this.active = true; this.next(); },
    stop() { this.active = false; this.buffer = ''; },
    next() {
      var e = pickRandom(DATA.YX_EXAMPLES);
      this.item = e; // [汉字, 拼音, 全码, 首形, 末形]
      $('yxPrompt').innerHTML = '<span class="big-char">' + e[0] + '</span>';
      $('yxHint').innerHTML = state.showHint ? ('拼音：' + e[1] + '　·　音码 ' + e[2].slice(0, 2)) : '';
      this.buffer = '';
      renderSlots($('yxSlots'), 4, '');
      setFeedback($('yxFeedback'), '4 键（音 2 + 形 2）', '');
    },
    key(k) {
      if (!this.active) return;
      if (k === 'BACKSPACE') {
        if (this.buffer.length > 0) { this.buffer = this.buffer.slice(0, -1); renderSlots($('yxSlots'), 4, this.buffer); }
        return;
      }
      if (!/^[a-z;]$/.test(k)) return;
      this.buffer += k;
      renderSlots($('yxSlots'), 4, this.buffer);
      if (this.buffer.length >= 4) {
        var ok = yxMatches(this.buffer, this.item[2]);
        recordResult(ok);
        var code = this.item[2];
        if (ok) {
          setFeedback($('yxFeedback'), '✓ 正确 ' + code + '（' + this.item[3] + ' + ' + this.item[4] + '）', 'ok');
          if (treasure.confetti) spawnConfetti();
        } else {
          setFeedback($('yxFeedback'), '✗ 应为 ' + code + '（音 ' + code.slice(0, 2) + '，形 ' + this.item[3] + '+' + this.item[4] + '）', 'err');
        }
        var self = this;
        setTimeout(function () { if (self.active) self.next(); }, ok ? 350 : 1400);
      }
    }
  };

  function renderYinxingTeach() {
    // ① 笔画表
    var st = $('yxStrokeTable');
    st.innerHTML = '';
    for (var i = 0; i < DATA.YX_STROKES.length; i++) {
      var s = DATA.YX_STROKES[i];
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="t-key">' + s[0].toUpperCase() + '</td><td class="t-final">' + s[1] + '</td><td class="t-final">' + s[2] + '</td>';
      st.appendChild(tr);
    }
    // ② 部件字根表
    var bj = $('yxBujianTable');
    bj.innerHTML = '';
    for (var j = 0; j < DATA.YX_BUIJIAN.length; j++) {
      var b = DATA.YX_BUIJIAN[j];
      var tr2 = document.createElement('tr');
      tr2.innerHTML = '<td class="t-key">' + b[0].toUpperCase() + '</td><td class="t-final">' + b[1] + '</td><td class="t-memo">' + b[2] + '</td>';
      bj.appendChild(tr2);
    }
    // ③ 小字字根
    var xz = $('yxXiaozi');
    xz.innerHTML = '';
    for (var k = 0; k < DATA.YX_XIAOZI.length; k++) {
      var x = DATA.YX_XIAOZI[k];
      if (!x[1]) continue;
      var chip = document.createElement('div');
      chip.className = 'yx-root';
      chip.innerHTML = '<span class="yx-key">' + x[0].toUpperCase() + '</span><span class="yx-chars">' + x[1] + '</span>';
      xz.appendChild(chip);
    }
    // ⑤ 示例
    var ex = $('yxExamples');
    ex.innerHTML = '';
    for (var m = 0; m < YX_TEACH.length; m++) {
      var t = YX_TEACH[m];
      var chip2 = document.createElement('span');
      chip2.className = 'cv-chip';
      chip2.innerHTML = '<span class="cv-py">' + t[0] + '</span><span class="cv-arrow">→</span><span class="cv-code">' + t[2] + '</span><span class="cv-memo">' + t[3] + '+' + t[4] + '</span>';
      ex.appendChild(chip2);
    }
  }

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
    if (YXDrill.active) YXDrill.stop();
    state.mode = mode;
    // 导航高亮
    var navs = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < navs.length; i++) navs[i].classList.toggle('active', navs[i].getAttribute('data-mode') === mode);
    // 面板显隐
    var panels = document.querySelectorAll('.panel');
    for (var j = 0; j < panels.length; j++) panels[j].classList.toggle('active', panels[j].id === 'panel-' + mode);
    // 键盘显隐（转换器 / 音形模式不显示双拼键盘）
    $('keyboardWrap').classList.toggle('hidden', mode === 'converter' || state.ime === 'yinxing');

    if (mode === 'layout') renderLayout();
    if (mode === 'syllable') Drill.start({ newItem: syllableItem, promptEl: $('syPrompt'), slotsEl: $('sySlots'), fbEl: $('syFeedback') });
    if (mode === 'character') Drill.start({ newItem: characterItem, promptEl: $('chPrompt'), hintEl: $('chHint'), slotsEl: $('chSlots'), fbEl: $('chFeedback') });
    if (mode === 'word') Drill.start({ newItem: wordItem, promptEl: $('wdPrompt'), hintEl: $('wdHint'), slotsEl: $('wdSlots'), fbEl: $('wdFeedback') });
    if (mode === 'reverse') reverseStart();
    if (mode === 'passage') Passage.start();
    if (mode === 'converter') renderConverter();
    if (mode === 'yxteach') renderYinxingTeach();
    if (mode === 'yxpractice') YXDrill.start();
  }

  function switchIme(ime) {
    state.ime = ime;
    var imeBtns = document.querySelectorAll('.ime-btn');
    for (var i = 0; i < imeBtns.length; i++) imeBtns[i].classList.toggle('active', imeBtns[i].getAttribute('data-ime') === ime);
    $('schemeBox').style.display = ime === 'shuangpin' ? '' : 'none';
    var navs = document.querySelectorAll('.nav-btn');
    for (var j = 0; j < navs.length; j++) navs[j].style.display = navs[j].getAttribute('data-ime') === ime ? '' : 'none';
    switchMode(ime === 'shuangpin' ? 'layout' : 'yxteach');
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
    if ($('treasureOverlay').classList.contains('open')) return;
    var k = e.key;
    if (k === 'Backspace') { e.preventDefault(); routeKey('BACKSPACE'); return; }
    var lower = k.toLowerCase();
    if (/^[a-z]$/.test(k)) {
      e.preventDefault();
      // 闪烁按下的键
      flashKeys(lower, 'kb-hit', 160);
      if (treasure.sound) playKeySound();
      routeKey(lower);
      return;
    }
    if (k === ';' || k === ':') {
      e.preventDefault();
      flashKeys(';', 'kb-hit', 160);
      if (treasure.sound) playKeySound();
      routeKey(';');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeTreasure();
  });

  function routeKey(k) {
    if (state.mode === 'syllable' || state.mode === 'character' || state.mode === 'word' || state.mode === 'reverse') {
      if (rvDirection === 'k2f' && state.mode === 'reverse') return; // 用鼠标选择
      Drill.key(k);
    } else if (state.mode === 'passage') {
      Passage.key(k);
    } else if (state.mode === 'yxpractice') {
      YXDrill.key(k);
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

  /* ---------- 百宝箱 ---------- */
  var treasure = { sound: false, confetti: false, catpaw: false };

  var TREASURE_DATA = {
    trivia: [
      '双拼每个字固定按两下键，比全拼大约少敲 1/3 的键。',
      'zh / ch / sh 在几乎所有双拼方案里都分别用 v / i / u 代替。',
      '小鹤双拼里「ü」在 v 键上，所以「绿 lǜ」要打 lv。',
      '全拼打「庄重 zhuangzhong」要 11 键，小鹤双拼只要 4 键：vlvs。',
      '「双拼」也叫「双打」「双拼音码」，是拼音输入法的进阶玩法。',
      '零声母音节（a、an、ang）在小鹤里要加首字母：aa、aj、ah。',
      '「微软双拼」把 ing 放在分号键上，是最特别的一个键位。',
      '「自然码」和「搜狗双拼」键位基本一致，都源自自然码方案。',
      '拼音里没有的「ü」，键盘上习惯用 v 键顶替，这是国际惯例。',
      '小鹤的「鹤」读 hè，方案名取自创始人网名。',
      '熟练之后，双拼速度通常能稳定超过全拼约 30%。',
      '「er」在小鹤里是特例，直接打 er，不拆成两键韵母。'
    ],
    dujitang: [
      '世上无难事，只要肯放弃。',
      '努力不一定成功，但不努力一定很轻松。',
      '条条大路通罗马，可有的人就生在罗马。',
      '万事开头难，然后中间难，最后结尾难。',
      '你以为有钱人就快乐吗？有钱人的快乐你根本想象不到。',
      '上帝给你关上一扇门，还会顺手夹一下你的脑子。',
      '今天解决不了的事，明天也解决不了。',
      '不逼自己一把，你都不知道自己能把事情搞砸。',
      '生活不止眼前的苟且，还有明天的苟且和后天的苟且。',
      '别灰心，人生就是这样：起起落落落落落落。',
      '只要坚持，就一定会有……坚持不下去的那天。',
      '咸鱼翻身，还是咸鱼。'
    ],
    fortune: [
      { level: '大吉', text: '今天适合练习双拼，手速翻倍，连击不断。' },
      { level: '中吉', text: '复习一遍韵母键位表，会有意外收获。' },
      { level: '小吉', text: '宜：练 10 分钟；忌：连续熬夜。' },
      { level: '末吉', text: '慢慢来，比较快。' },
      { level: '平', text: '今天手感平平，多喝热水。' },
      { level: '大吉', text: '盲打将有一次「顿悟」时刻。' },
      { level: '中吉', text: '适合挑战「文章跟打」，速度创新高。' },
      { level: '凶', text: '今日不宜背键位，建议先摸鱼 5 分钟。' }
    ]
  };

  var MARS_MAP = {
    '你':'伱','我':'莪','好':'恏','是':'湜','的':'啲','爱':'嗳','不':'卟','在':'洅','有':'囿',
    '和':'咊','人':'亾','这':'适','中':'狆','大':'汏','小':'尛','上':'仩','下':'芐',
    '天':'兲','地':'哋','心':'杺','开':'閞','快':'赽','今':'妗','明':'朙','早':'皁',
    '晚':'晩','说':'説','话':'話','学':'學','习':'習','打':'咑','字':'牸','输':'輸',
    '练':'練','双':'雙','拼':'拚','法':'琺','键':'鍵','盘':'盤','吃':'喫','睡':'睏',
    '喝':'呵','笑':'笶','想':'缃','喜':'囍','欢':'歡','谢':'謝','朋':'倗','友':'叐',
    '老':'咾','师':'師','生':'笙','世':'丗','界':'堺','女':'钕','男':'侽','风':'颩'
  };

  var audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    return audioCtx;
  }
  function playKeySound() {
    var ctx = ensureAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 1700 + Math.random() * 500;
    gain.gain.setValueAtTime(0.10, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.05);
    var osc2 = ctx.createOscillator();
    var gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.value = 110 + Math.random() * 70;
    gain2.gain.setValueAtTime(0.16, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc2.start(t); osc2.stop(t + 0.08);
  }

  function spawnConfetti() {
    var colors = ['#4f6ef7','#7c5cf0','#f59e0b','#10b981','#ef4444','#ec4899','#06b6d4'];
    var n = 22;
    for (var i = 0; i < n; i++) {
      var c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = (Math.random() * 100) + 'vw';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.animationDuration = (1.2 + Math.random() * 1.2) + 's';
      c.style.width = (6 + Math.random() * 8) + 'px';
      c.style.height = (8 + Math.random() * 10) + 'px';
      document.body.appendChild(c);
      (function (el) { setTimeout(function () { el.remove(); }, 2600); })(c);
    }
  }

  var catpawStyle = null;
  function applyCatpaw() {
    if (treasure.catpaw) {
      if (!catpawStyle) {
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text y='26' font-size='26'>🐾</text></svg>";
        var uri = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        catpawStyle = document.createElement('style');
        catpawStyle.id = 'catpaw-cursor';
        catpawStyle.textContent = 'body, body *{cursor:url("' + uri + '") 16 16, auto !important;}';
        document.head.appendChild(catpawStyle);
      }
    } else if (catpawStyle) {
      catpawStyle.remove();
      catpawStyle = null;
    }
  }

  function openTreasure() { $('treasureOverlay').classList.add('open'); }
  function closeTreasure() { $('treasureOverlay').classList.remove('open'); }
  function refreshTreasureToggles() {
    var map = { sound: treasure.sound, confetti: treasure.confetti, catpaw: treasure.catpaw };
    var items = document.querySelectorAll('.treasure-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', !!map[items[i].getAttribute('data-t')]);
    }
  }
  function showTreasure(html) { $('treasureOutput').innerHTML = html; }

  function showMarsTranslator() {
    showTreasure(
      '<div class="mars-box">' +
      '<input id="marsInput" type="text" placeholder="输入一段中文，比如：你好世界" />' +
      '<button id="marsGo" class="start-btn">翻译成火星文</button>' +
      '<div id="marsResult" class="mars-result"></div>' +
      '</div>'
    );
    $('marsGo').addEventListener('click', function () {
      var s = $('marsInput').value;
      var out = '';
      for (var i = 0; i < s.length; i++) { var ch = s.charAt(i); out += MARS_MAP[ch] || ch; }
      $('marsResult').textContent = '👽 ' + (out || '（先输入点字吧）');
    });
  }

  function handleTreasure(type) {
    if (type === 'random') {
      type = pickRandom(['trivia', 'dujitang', 'fortune']);
    }
    if (type === 'trivia') {
      showTreasure('<div class="t-card t-trivia"><div class="t-tag">💡 双拼冷知识</div>' + pickRandom(TREASURE_DATA.trivia) + '</div>');
    } else if (type === 'dujitang') {
      showTreasure('<div class="t-card t-dujitang"><div class="t-tag">🐔 毒鸡汤</div>' + pickRandom(TREASURE_DATA.dujitang) + '</div>');
    } else if (type === 'fortune') {
      var f = pickRandom(TREASURE_DATA.fortune);
      showTreasure('<div class="t-card t-fortune"><div class="t-tag">🔮 今日运势</div><div class="f-level">' + f.level + '</div><div class="f-text">' + f.text + '</div></div>');
    } else if (type === 'sound') {
      treasure.sound = !treasure.sound;
      refreshTreasureToggles();
      showTreasure('<div class="t-card">⌨️ 打字音效已' + (treasure.sound ? '开启 🟢' : '关闭 ⚪') + '，现在敲几下键盘试试。</div>');
    } else if (type === 'confetti') {
      treasure.confetti = !treasure.confetti;
      refreshTreasureToggles();
      if (treasure.confetti) spawnConfetti();
      showTreasure('<div class="t-card">🎊 答对彩蛋已' + (treasure.confetti ? '开启 🟢' : '关闭 ⚪') + '，答对题目会撒彩带。</div>');
    } else if (type === 'catpaw') {
      treasure.catpaw = !treasure.catpaw;
      applyCatpaw();
      refreshTreasureToggles();
      showTreasure('<div class="t-card">🐾 猫爪光标已' + (treasure.catpaw ? '开启 🟢' : '关闭 ⚪') + '，移动鼠标看看。</div>');
    } else if (type === 'mars') {
      showMarsTranslator();
    }
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
      else if (state.mode === 'yxpractice' && YXDrill.active) YXDrill.next();
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

    // 输入法切换（双拼 / 小鹤音形）
    var imeBtns = document.querySelectorAll('.ime-btn');
    for (var ib = 0; ib < imeBtns.length; ib++) {
      imeBtns[ib].addEventListener('click', function () {
        switchIme(this.getAttribute('data-ime'));
      });
    }

    // 百宝箱
    $('treasureBtn').addEventListener('click', openTreasure);
    $('treasureClose').addEventListener('click', closeTreasure);
    $('treasureOverlay').addEventListener('click', function (e) {
      if (e.target === this) closeTreasure();
    });
    var tItems = document.querySelectorAll('.treasure-item');
    for (var ti = 0; ti < tItems.length; ti++) {
      tItems[ti].addEventListener('click', function () {
        handleTreasure(this.getAttribute('data-t'));
      });
    }
    refreshTreasureToggles();

    switchIme('shuangpin');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
