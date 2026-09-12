// 双拼转换逻辑自测（Node 环境，仅验证转换函数与方案数据）
global.window = global;
require('./data.js');
var DATA = window.SP_DATA;
var SCHEMES = DATA.SCHEMES;

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
  if (syl.charAt(0) === 'y' || syl.charAt(0) === 'w') {
    var pref = syl.charAt(0);
    if (isXiaohe) {
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
  var firstTwo = syl.slice(0, 2);
  var isInitial = INITIALS.indexOf(syl.charAt(0)) >= 0 || INITIALS.indexOf(firstTwo) >= 0;
  if (!isInitial) {
    if (isXiaohe) {
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
  var initial, final;
  if (INITIALS.indexOf(firstTwo) >= 0) {
    initial = firstTwo; final = syl.slice(2);
  } else {
    initial = syl.charAt(0); final = syl.slice(1);
  }
  if ((initial === 'j' || initial === 'q' || initial === 'x') && final.charAt(0) === 'u') {
    if (isXiaohe) {
      if (final === 'ue') final = 'üe';
    } else {
      final = JQX_U[final] || final;
    }
  }
  var ik = scheme.initials[initial] || initial;
  var fk = scheme.finals[final];
  if (!fk) return null;
  return ik + fk;
}

function byId(id) { for (var i = 0; i < SCHEMES.length; i++) if (SCHEMES[i].id === id) return SCHEMES[i]; }

var cases = [
  // [scheme, syllable, expected]
  ['xiaohe', 'zhong', 'vs'], ['xiaohe', 'guo', 'go'], ['xiaohe', 'shuang', 'ul'],
  ['xiaohe', 'pin', 'pb'], ['xiaohe', 'xiao', 'xn'], ['xiaohe', 'wo', 'wo'],
  ['xiaohe', 'er', 'er'], ['xiaohe', 'a', 'aa'], ['xiaohe', 'ai', 'ai'],
  ['xiaohe', 'an', 'an'], ['xiaohe', 'ao', 'ao'], ['xiaohe', 'ei', 'ei'],
  ['xiaohe', 'en', 'en'], ['xiaohe', 'ou', 'ou'], ['xiaohe', 'e', 'ee'], ['xiaohe', 'o', 'oo'],
  ['xiaohe', 'ang', 'ah'], ['xiaohe', 'eng', 'eg'],
  ['xiaohe', 'yang', 'yh'], ['xiaohe', 'wang', 'wh'], ['xiaohe', 'wei', 'ww'],
  ['xiaohe', 'yu', 'yu'], ['xiaohe', 'ye', 'ye'], ['xiaohe', 'ya', 'ya'], ['xiaohe', 'weng', 'wg'],
  ['xiaohe', 'ju', 'ju'], ['xiaohe', 'xu', 'xu'], ['xiaohe', 'qu', 'qu'],
  ['xiaohe', 'ying', 'yk'], ['xiaohe', 'you', 'yz'],
  ['xiaohe', 'yuan', 'yr'], ['xiaohe', 'yue', 'yt'], ['xiaohe', 'yun', 'yy'],
  ['xiaohe', 'nü', 'nv'], ['xiaohe', 'lüe', 'lt'], ['xiaohe', 'jue', 'jt'],
  ['xiaohe', 'juan', 'jr'], ['xiaohe', 'jun', 'jy'], ['xiaohe', 'zhi', 'vi'],
  ['xiaohe', 'chi', 'ii'], ['xiaohe', 'shi', 'ui'], ['xiaohe', 'hao', 'hc'],
  ['xiaohe', 'chun', 'iy'], ['xiaohe', 'tian', 'tm'], ['xiaohe', 'guang', 'gl'],

  ['microsoft', 'zhong', 'vs'], ['microsoft', 'guo', 'go'], ['microsoft', 'shuang', 'ud'],
  ['microsoft', 'pin', 'pn'], ['microsoft', 'xiao', 'xc'], ['microsoft', 'ying', 'y;'],
  ['microsoft', 'er', 'or'], ['microsoft', 'a', 'oa'], ['microsoft', 'ai', 'ol'],
  ['microsoft', 'ang', 'oh'], ['microsoft', 'you', 'yq'], ['microsoft', 'yuan', 'yr'],
  ['microsoft', 'jun', 'jp'], ['microsoft', 'zhi', 'vi'], ['microsoft', 'chi', 'ii'],
  ['microsoft', 'shi', 'ui'], ['microsoft', 'ying', 'y;'],

  ['ziranma', 'ying', 'yy'], ['ziranma', 'shuang', 'ud'], ['ziranma', 'pin', 'pn'],
  ['ziranma', 'er', 'or'], ['ziranma', 'a', 'oa'],
  ['sogou', 'ying', 'yy'], ['sogou', 'shuang', 'ud'], ['sogou', 'pin', 'pn']
];

var fail = 0;
for (var i = 0; i < cases.length; i++) {
  var c = cases[i];
  var got = toShuangpin(c[1], byId(c[0]));
  if (got !== c[2]) {
    fail++;
    console.log('FAIL', c[0], c[1], 'expected', c[2], 'got', got);
  }
}

// 覆盖性检查：所有音节、单字、词语、文章都能转换出 2 键码
function checkAll() {
  var bad = [];
  DATA.SYLLABLES.forEach(function (s) { if (!toShuangpin(s, byId('xiaohe'))) bad.push('syl:' + s); });
  DATA.CHARACTERS.forEach(function (c) { if (!toShuangpin(c[1], byId('xiaohe'))) bad.push('char:' + c[0] + '/' + c[1]); });
  DATA.WORDS.forEach(function (w) {
    w[1].split(' ').forEach(function (p) { if (!toShuangpin(p, byId('xiaohe'))) bad.push('word:' + w[0] + '/' + p); });
  });
  DATA.PASSAGES.forEach(function (p) {
    p[1].forEach(function (py) { if (py && !toShuangpin(py, byId('xiaohe'))) bad.push('passage:' + p[0] + '/' + py); });
  });
  return bad;
}
var bad = checkAll();

console.log('测试用例：', cases.length - fail + '/' + cases.length, '通过');
if (bad.length) {
  console.log('无法转换的条目（小鹤）:', bad.length);
  console.log(bad.slice(0, 50).join('\n'));
} else {
  console.log('全部音节/单字/词语/文章均可转换（小鹤）✓');
}

/* ---------- 小鹤音形例字校验 ---------- */
/* 校核：全码长度必须是 4，且前两位（音码）等于该字拼音的小鹤双拼编码 */
function checkYinxing() {
  var bads = [];
  DATA.YX_EXAMPLES.forEach(function (e) {
    var ch = e[0], py = e[1], code = e[2], shou = e[3], mo = e[4];
    if (code.length !== 4) { bads.push(ch + ' 码长!=4: ' + code); return; }
    if (!shou || !mo) bads.push(ch + ' 缺首/末形');
    var yin = toShuangpin(py, byId('xiaohe'));
    if (yin !== code.slice(0, 2)) bads.push(ch + '(' + py + ') 音码应为 ' + yin + '，实际 ' + code.slice(0, 2) + ' [' + code + ']');
  });
  return bads;
}
var yxBad = checkYinxing();
console.log('音形例字：', DATA.YX_EXAMPLES.length - yxBad.length + '/' + DATA.YX_EXAMPLES.length, '音码校验通过');
if (yxBad.length) console.log(yxBad.join('\n'));
