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
  var firstTwo = syl.slice(0, 2);
  var isInitial = INITIALS.indexOf(syl.charAt(0)) >= 0 || INITIALS.indexOf(firstTwo) >= 0;
  if (!isInitial) {
    if (syl === 'er' && scheme.zeroMode === 'first') return 'er';
    var prefix = scheme.zeroMode === 'first' ? syl.charAt(0) : 'o';
    var k0 = scheme.finals[syl];
    if (!k0) return null;
    return prefix + k0;
  }
  var initial, final;
  if (INITIALS.indexOf(firstTwo) >= 0) {
    initial = firstTwo; final = syl.slice(2);
  } else {
    initial = syl.charAt(0); final = syl.slice(1);
  }
  if ((initial === 'j' || initial === 'q' || initial === 'x') && final.charAt(0) === 'u') {
    final = JQX_U[final] || final;
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
  ['xiaohe', 'er', 'er'], ['xiaohe', 'a', 'aa'], ['xiaohe', 'ai', 'ad'],
  ['xiaohe', 'ang', 'ah'], ['xiaohe', 'ying', 'yk'], ['xiaohe', 'you', 'yq'],
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
