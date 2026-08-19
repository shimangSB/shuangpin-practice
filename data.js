/* ============================================================
 * 双拼练习 - 数据文件（方案、音节、单字、词语、文章）
 * 注意：本文件需在 app.js 之前加载，暴露全局对象 SP_DATA。
 * ============================================================ */

/* ---------- 双拼方案 ---------- */
/* 说明：
 *  - initials: 声母特殊映射（其余声母用原字母）
 *  - finals:   韵母 -> 键位（键位可能映射多个韵母）
 *  - zeroMode: 零声母规则
 *      'first' : 纯元音零声母用首字母（小鹤），如 a->aa, er->er
 *      'o'     : 纯元音零声母用 o 前缀（微软/自然码/搜狗），如 a->oa
 *    （以 y/w 开头的零声母，各方案都用 y/w 本身作首键）
 */
const SCHEMES = [
  {
    id: 'xiaohe',
    name: '小鹤双拼',
    short: '小鹤',
    initials: { zh: 'v', ch: 'i', sh: 'u' },
    finals: {
      a: 'a', ai: 'd', an: 'j', ang: 'h', ao: 'c',
      e: 'e', ei: 'w', en: 'f', eng: 'g',
      i: 'i', ia: 'x', ian: 'm', iang: 'l', iao: 'n', ie: 'p',
      in: 'b', ing: 'k', iong: 's', iu: 'q',
      o: 'o', ong: 's', ou: 'z',
      u: 'u', ua: 'x', uai: 'k', uan: 'r', uang: 'l', ui: 'v', un: 'y', uo: 'o',
      'ü': 'v', 'üe': 't', 'üan': 'r', 'ün': 'y', ueng: 's'
    },
    zeroMode: 'first',
    note: '零声母用首字母（a→aa，er→er）；zh/ch/sh 分别在 v/i/u 键。'
  },
  {
    id: 'microsoft',
    name: '微软双拼',
    short: '微软',
    initials: { zh: 'v', ch: 'i', sh: 'u' },
    finals: {
      a: 'a', ai: 'l', an: 'j', ang: 'h', ao: 'k',
      e: 'e', ei: 'z', en: 'f', eng: 'g', er: 'r',
      i: 'i', ia: 'w', ian: 'm', iang: 'd', iao: 'c', ie: 'x',
      in: 'n', ing: ';', iong: 's', iu: 'q',
      o: 'o', ong: 's', ou: 'b',
      u: 'u', ua: 'w', uai: 'y', uan: 'r', uang: 'd', ui: 'v', un: 'p', uo: 'o',
      'ü': 'v', 'üe': 't', 'üan': 'r', 'ün': 'p', ueng: 's'
    },
    zeroMode: 'o',
    note: '零声母用 o 前缀（a→oa）；ing 在分号键。'
  },
  {
    id: 'ziranma',
    name: '自然码',
    short: '自然码',
    initials: { zh: 'v', ch: 'i', sh: 'u' },
    finals: {
      a: 'a', ai: 'l', an: 'j', ang: 'h', ao: 'k',
      e: 'e', ei: 'z', en: 'f', eng: 'g', er: 'r',
      i: 'i', ia: 'w', ian: 'm', iang: 'd', iao: 'c', ie: 'x',
      in: 'n', ing: 'y', iong: 's', iu: 'q',
      o: 'o', ong: 's', ou: 'b',
      u: 'u', ua: 'w', uai: 'y', uan: 'r', uang: 'd', ui: 'v', un: 'p', uo: 'o',
      'ü': 'v', 'üe': 't', 'üan': 'r', 'ün': 'p', ueng: 's'
    },
    zeroMode: 'o',
    note: '零声母用 o 前缀；ing 与 uai 同在 y 键。'
  },
  {
    id: 'sogou',
    name: '搜狗双拼',
    short: '搜狗',
    initials: { zh: 'v', ch: 'i', sh: 'u' },
    finals: {
      a: 'a', ai: 'l', an: 'j', ang: 'h', ao: 'k',
      e: 'e', ei: 'z', en: 'f', eng: 'g', er: 'r',
      i: 'i', ia: 'w', ian: 'm', iang: 'd', iao: 'c', ie: 'x',
      in: 'n', ing: 'y', iong: 's', iu: 'q',
      o: 'o', ong: 's', ou: 'b',
      u: 'u', ua: 'w', uai: 'y', uan: 'r', uang: 'd', ui: 'v', un: 'p', uo: 'o',
      'ü': 'v', 'üe': 't', 'üan': 'r', 'ün': 'p', ueng: 's'
    },
    zeroMode: 'o',
    note: '键位与自然码基本一致；零声母用 o 前缀。'
  }
];

/* ---------- 常用拼音音节（无调） ---------- */
const SYLLABLES = (
  'ba bai ban bang bao bei ben beng bi bian biao bie bin bing bo bu ' +
  'ca cai can cang cao ce cen ceng cha chai chan chang chao che chen cheng chi chong chou chu chuai chuan chuang chui chun chuo ci cong cou cu cuan cui cun cuo ' +
  'da dai dan dang dao de dei deng di dian diao die ding diu dong dou du duan dui dun duo ' +
  'e ei en eng er ' +
  'fa fan fang fei fen feng fo fou fu ' +
  'ga gai gan gang gao ge gei gen geng gong gou gu gua guai guan guang gui gun guo ' +
  'ha hai han hang hao he hei hen heng hong hou hu hua huai huan huang hui hun huo ' +
  'ji jia jian jiang jiao jie jin jing jiong jiu ju juan jue jun ' +
  'ka kai kan kang kao ke ken keng kong kou ku kua kuai kuan kuang kui kun kuo ' +
  'la lai lan lang lao le lei leng li lia lian liang liao lie lin ling liu long lou lu luan lun luo lü lüe ' +
  'ma mai man mang mao me mei men meng mi mian miao mie min ming miu mo mou mu ' +
  'na nai nan nang nao ne nei nen neng ni nian niang niao nie nin ning niu nong nu nuan nuo nü nüe ' +
  'o ou ' +
  'pa pai pan pang pao pei pen peng pi pian piao pie pin ping po pou pu ' +
  'qi qia qian qiang qiao qie qin qing qiong qiu qu quan que qun ' +
  'ran rang rao re ren reng ri rong rou ru ruan rui run ruo ' +
  'sa sai san sang sao se sen seng sha shai shan shang shao she shei shen sheng shi shou shu shua shuai shuan shuang shui shun shuo si song sou su suan sui sun suo ' +
  'ta tai tan tang tao te teng ti tian tiao tie ting tong tou tu tuan tui tun tuo ' +
  'wa wai wan wang wei wen weng wo wu ' +
  'xi xia xian xiang xiao xie xin xing xiong xiu xu xuan xue xun ' +
  'ya yan yang yao ye yi yin ying yong you yu yuan yue yun ' +
  'za zai zan zang zao ze zei zen zeng zha zhai zhan zhang zhao zhe zhei zhen zheng zhi zhong zhou zhu zhua zhuai zhuan zhuang zhui zhun zhuo zi zong zou zu zuan zui zun zuo'
).trim().split(/\s+/);

/* ---------- 常用单字（汉字 + 拼音） ---------- */
/* 每个条目：[汉字, 拼音]（多音字取最常用读音） */
const CHARACTERS = [
  ['我','wo'],['你','ni'],['他','ta'],['她','ta'],['它','ta'],['是','shi'],['的','de'],['了','le'],
  ['在','zai'],['有','you'],['和','he'],['人','ren'],['这','zhe'],['中','zhong'],['大','da'],['为','wei'],
  ['上','shang'],['个','ge'],['国','guo'],['以','yi'],['到','dao'],['说','shuo'],['时','shi'],['要','yao'],
  ['就','jiu'],['出','chu'],['会','hui'],['可','ke'],['也','ye'],['对','dui'],['生','sheng'],['能','neng'],
  ['而','er'],['子','zi'],['那','na'],['得','de'],['于','yu'],['着','zhe'],['下','xia'],['自','zi'],
  ['之','zhi'],['年','nian'],['过','guo'],['发','fa'],['后','hou'],['作','zuo'],['里','li'],['用','yong'],
  ['道','dao'],['行','xing'],['所','suo'],['然','ran'],['家','jia'],['种','zhong'],['事','shi'],['成','cheng'],
  ['方','fang'],['多','duo'],['经','jing'],['么','me'],['去','qu'],['法','fa'],['学','xue'],['如','ru'],
  ['都','dou'],['同','tong'],['现','xian'],['当','dang'],['没','mei'],['动','dong'],['面','mian'],['起','qi'],
  ['看','kan'],['定','ding'],['天','tian'],['分','fen'],['还','hai'],['进','jin'],['好','hao'],['小','xiao'],
  ['部','bu'],['其','qi'],['些','xie'],['主','zhu'],['样','yang'],['理','li'],['心','xin'],['本','ben'],
  ['前','qian'],['开','kai'],['但','dan'],['因','yin'],['只','zhi'],['从','cong'],['想','xiang'],['实','shi'],
  ['日','ri'],['军','jun'],['者','zhe'],['意','yi'],['无','wu'],['力','li'],['与','yu'],['长','chang'],
  ['把','ba'],['机','ji'],['十','shi'],['民','min'],['第','di'],['公','gong'],['此','ci'],['已','yi'],
  ['工','gong'],['使','shi'],['情','qing'],['明','ming'],['性','xing'],['知','zhi'],['全','quan'],['三','san'],
  ['又','you'],['关','guan'],['点','dian'],['正','zheng'],['业','ye'],['外','wai'],['将','jiang'],['两','liang'],
  ['高','gao'],['间','jian'],['由','you'],['问','wen'],['很','hen'],['最','zui'],['重','zhong'],['并','bing'],
  ['物','wu'],['手','shou'],['应','ying'],['战','zhan'],['向','xiang'],['头','tou'],['文','wen'],['体','ti'],
  ['政','zheng'],['美','mei'],['相','xiang'],['见','jian'],['被','bei'],['利','li'],['什','shen'],['二','er'],
  ['等','deng'],['产','chan'],['或','huo'],['新','xin'],['制','zhi'],['身','shen'],['果','guo'],['加','jia'],
  ['西','xi'],['月','yue'],['话','hua'],['合','he'],['回','hui'],['特','te'],['代','dai'],['内','nei'],
  ['信','xin'],['表','biao'],['化','hua'],['老','lao'],['给','gei'],['世','shi'],['位','wei'],['次','ci'],
  ['度','du'],['门','men'],['任','ren'],['常','chang'],['先','xian'],['海','hai'],['通','tong'],['教','jiao'],
  ['儿','er'],['原','yuan'],['东','dong'],['声','sheng'],['提','ti'],['立','li'],['及','ji'],['比','bi'],
  ['员','yuan'],['解','jie'],['水','shui'],['名','ming'],['真','zhen'],['论','lun'],['处','chu'],['走','zou'],
  ['义','yi'],['各','ge'],['入','ru'],['几','ji'],['口','kou'],['认','ren'],['条','tiao'],['平','ping'],
  ['系','xi'],['气','qi'],['题','ti'],['活','huo'],['尔','er'],['更','geng'],['别','bie'],['打','da'],
  ['女','nü'],['变','bian'],['四','si'],['神','shen'],['总','zong'],['何','he'],['电','dian'],['数','shu'],
  ['安','an'],['少','shao'],['报','bao'],['才','cai'],['结','jie'],['反','fan'],['受','shou'],['目','mu'],
  ['太','tai'],['量','liang'],['再','zai'],['感','gan'],['建','jian'],['务','wu'],['做','zuo'],['接','jie'],
  ['必','bi'],['场','chang'],['件','jian'],['计','ji'],['管','guan'],['期','qi'],['市','shi'],['直','zhi'],
  ['德','de'],['资','zi'],['命','ming'],['山','shan'],['金','jin'],['指','zhi'],['克','ke'],['许','xu'],
  ['统','tong'],['区','qu'],['保','bao'],['至','zhi'],['队','dui'],['形','xing'],['社','she'],['便','bian'],
  ['空','kong'],['决','jue'],['治','zhi'],['展','zhan'],['马','ma'],['科','ke'],['司','si'],['五','wu'],
  ['基','ji'],['眼','yan'],['书','shu'],['非','fei'],['则','ze'],['听','ting'],['白','bai'],['却','que'],
  ['界','jie'],['达','da'],['光','guang'],['放','fang'],['强','qiang'],['即','ji'],['像','xiang'],['难','nan'],
  ['且','qie'],['权','quan'],['思','si'],['王','wang'],['象','xiang'],['完','wan'],['设','she'],['式','shi'],
  ['色','se'],['路','lu'],['记','ji'],['南','nan'],['品','pin'],['住','zhu'],['告','gao'],['类','lei'],
  ['求','qiu'],['据','ju'],['程','cheng'],['北','bei'],['边','bian'],['死','si'],['张','zhang'],['该','gai'],
  ['交','jiao'],['规','gui'],['万','wan'],['取','qu'],['拉','la'],['格','ge'],['望','wang'],['觉','jue'],
  ['术','shu'],['领','ling'],['共','gong'],['确','que'],['传','chuan'],['师','shi'],['观','guan'],['清','qing'],
  ['今','jin'],['切','qie'],['院','yuan'],['让','rang'],['识','shi'],['候','hou'],['带','dai'],['导','dao'],
  ['争','zheng'],['运','yun'],['笑','xiao'],['飞','fei'],['风','feng'],['步','bu'],['改','gai'],['收','shou'],
  ['根','gen'],['干','gan'],['造','zao'],['言','yan'],['联','lian'],['持','chi'],['组','zu'],['每','mei'],
  ['济','ji'],['车','che'],['亲','qin'],['极','ji'],['林','lin'],['服','fu'],['快','kuai'],['办','ban'],
  ['议','yi'],['往','wang'],['元','yuan'],['英','ying'],['士','shi'],['证','zheng'],['近','jin'],['失','shi'],
  ['转','zhuan'],['夫','fu'],['令','ling'],['准','zhun'],['布','bu'],['始','shi'],['怎','zen'],['呢','ne'],
  ['存','cun'],['未','wei'],['远','yuan'],['叫','jiao'],['台','tai'],['单','dan'],['影','ying'],['具','ju'],
  ['罗','luo'],['字','zi'],['爱','ai'],['击','ji'],['流','liu'],['备','bei'],['兵','bing'],['连','lian'],
  ['调','diao'],['深','shen'],['商','shang'],['算','suan'],['质','zhi'],['团','tuan'],['集','ji'],['百','bai'],
  ['需','xu'],['价','jia'],['花','hua'],['党','dang'],['华','hua'],['城','cheng'],['石','shi'],['级','ji'],
  ['整','zheng'],['府','fu'],['离','li'],['况','kuang'],['亚','ya'],['请','qing'],['技','ji'],['际','ji'],
  ['约','yue'],['示','shi'],['复','fu'],['病','bing'],['息','xi'],['究','jiu'],['线','xian'],['似','si'],
  ['官','guan'],['火','huo'],['断','duan'],['精','jing'],['满','man'],['支','zhi'],['视','shi'],['消','xiao'],
  ['越','yue'],['器','qi'],['容','rong'],['照','zhao'],['须','xu'],['九','jiu'],['增','zeng'],['研','yan'],
  ['写','xie'],['称','cheng'],['企','qi'],['八','ba'],['功','gong'],['吗','ma'],['包','bao'],['片','pian'],
  ['史','shi'],['委','wei'],['乎','hu'],['查','cha'],['轻','qing'],['易','yi'],['早','zao'],['曾','ceng'],
  ['除','chu'],['农','nong'],['找','zhao'],['装','zhuang'],['广','guang'],['显','xian'],['吧','ba'],['阿','a'],
  ['李','li'],['标','biao'],['谈','tan'],['吃','chi'],['图','tu'],['念','nian'],['六','liu'],['引','yin'],
  ['历','li'],['首','shou'],['医','yi'],['局','ju'],['突','tu'],['专','zhuan'],['费','fei'],['号','hao'],
  ['尽','jin'],['另','ling'],['周','zhou'],['较','jiao'],['注','zhu'],['语','yu'],['仅','jin'],['考','kao'],
  ['落','luo'],['青','qing'],['随','sui'],['选','xuan'],['列','lie'],['武','wu'],['红','hong'],['响','xiang'],
  ['虽','sui'],['推','tui'],['势','shi'],['参','can'],['希','xi'],['古','gu'],['众','zhong'],['构','gou'],
  ['房','fang'],['半','ban'],['节','jie'],['土','tu'],['投','tou'],['某','mou'],['案','an'],['黑','hei'],
  ['维','wei'],['革','ge'],['划','hua'],['敌','di'],['致','zhi'],['陈','chen'],['律','lü'],['足','zu'],
  ['态','tai'],['护','hu'],['七','qi'],['兴','xing'],['派','pai'],['孩','hai'],['验','yan'],['责','ze'],
  ['营','ying'],['星','xing'],['够','gou'],['章','zhang'],['音','yin'],['跟','gen'],['志','zhi'],['底','di'],
  ['站','zhan'],['严','yan'],['巴','ba'],['例','li'],['防','fang'],['族','zu'],['供','gong'],['效','xiao'],
  ['续','xu'],['施','shi'],['留','liu'],['讲','jiang'],['型','xing'],['料','liao'],['终','zhong'],['答','da'],
  ['紧','jin'],['黄','huang'],['绝','jue'],['奇','qi'],['察','cha'],['母','mu'],['京','jing'],['段','duan'],
  ['依','yi'],['批','pi'],['群','qun'],['项','xiang'],['故','gu'],['按','an'],['河','he'],['米','mi'],
  ['围','wei'],['江','jiang'],['织','zhi'],['害','hai'],['斗','dou'],['双','shuang'],['境','jing'],['客','ke'],
  ['纪','ji'],['密','mi'],['举','ju'],['苦','ku'],['助','zhu'],['绿','lü'],['略','lüe'],['您','nin']
];

/* ---------- 常用词语（词语 + 拼音，空格分隔） ---------- */
const WORDS = [
  ['中国','zhong guo'],['学习','xue xi'],['电脑','dian nao'],['手机','shou ji'],['朋友','peng you'],
  ['今天','jin tian'],['明天','ming tian'],['快乐','kuai le'],['老师','lao shi'],['学生','xue sheng'],
  ['学校','xue xiao'],['工作','gong zuo'],['生活','sheng huo'],['时间','shi jian'],['世界','shi jie'],
  ['喜欢','xi huan'],['谢谢','xie xie'],['你好','ni hao'],['再见','zai jian'],['吃饭','chi fan'],
  ['睡觉','shui jiao'],['喝水','he shui'],['跑步','pao bu'],['游泳','you yong'],['运动','yun dong'],
  ['健康','jian kang'],['幸福','xing fu'],['家庭','jia ting'],['父母','fu mu'],['孩子','hai zi'],
  ['爱情','ai qing'],['友谊','you yi'],['帮助','bang zhu'],['希望','xi wang'],['梦想','meng xiang'],
  ['努力','nu li'],['坚持','jian chi'],['成功','cheng gong'],['失败','shi bai'],['勇敢','yong gan'],
  ['善良','shan liang'],['美丽','mei li'],['漂亮','piao liang'],['聪明','cong ming'],['简单','jian dan'],
  ['复杂','fu za'],['开始','kai shi'],['结束','jie shu'],['继续','ji xu'],['停止','ting zhi'],
  ['心情','xin qing'],['天气','tian qi'],['春天','chun tian'],['夏天','xia tian'],['秋天','qiu tian'],
  ['冬天','dong tian'],['太阳','tai yang'],['月亮','yue liang'],['星星','xing xing'],['天空','tian kong'],
  ['大地','da di'],['海洋','hai yang'],['河流','he liu'],['森林','sen lin'],['城市','cheng shi'],
  ['乡村','xiang cun'],['道路','dao lu'],['汽车','qi che'],['火车','huo che'],['飞机','fei ji'],
  ['旅行','lü xing'],['旅游','lü you'],['音乐','yin yue'],['电影','dian ying'],['阅读','yue du'],
  ['写作','xie zuo'],['思考','si kao'],['问题','wen ti'],['答案','da an'],['知识','zhi shi'],
  ['智慧','zhi hui'],['语言','yu yan'],['文化','wen hua'],['历史','li shi'],['科学','ke xue'],
  ['技术','ji shu'],['经济','jing ji'],['社会','she hui'],['国家','guo jia'],['人民','ren min'],
  ['和平','he ping'],['自由','zi you'],['平等','ping deng'],['团结','tuan jie'],['力量','li liang'],
  ['未来','wei lai'],['现在','xian zai'],['过去','guo qu'],['拼音','pin yin'],['输入','shu ru']
];

/* ---------- 文章 / 句子（跟打练习用） ---------- */
/* 每个条目：[文字, [拼音数组]]；拼音数组与文字逐字对齐，标点用空字符串占位 */
const PASSAGES = [
  ['你好，很高兴认识你。', ['ni','hao','','hen','gao','xing','ren','shi','ni','']],
  ['今天天气很好。', ['jin','tian','tian','qi','hen','hao','']],
  ['我在学习双拼输入法。', ['wo','zai','xue','xi','shuang','pin','shu','ru','fa','']],
  ['坚持就是胜利。', ['jian','chi','jiu','shi','sheng','li','']],
  ['知识就是力量。', ['zhi','shi','jiu','shi','li','liang','']],
  ['书山有路勤为径。', ['shu','shan','you','lu','qin','wei','jing','']],
  ['学海无涯苦作舟。', ['xue','hai','wu','ya','ku','zuo','zhou','']],
  ['世上无难事，只怕有心人。', ['shi','shang','wu','nan','shi','','zhi','pa','you','xin','ren','']],
  ['一寸光阴一寸金。', ['yi','cun','guang','yin','yi','cun','jin','']],
  ['三人行，必有我师焉。', ['san','ren','xing','','bi','you','wo','shi','yan','']],
  ['千里之行，始于足下。', ['qian','li','zhi','xing','','shi','yu','zu','xia','']],
  ['读万卷书，行万里路。', ['du','wan','juan','shu','','xing','wan','li','lu','']],
  ['好好学习，天天向上。', ['hao','hao','xue','xi','','tian','tian','xiang','shang','']],
  ['愿你每天都有好心情。', ['yuan','ni','mei','tian','dou','you','hao','xin','qing','']],
  ['生活不止眼前的苟且。', ['sheng','huo','bu','zhi','yan','qian','de','gou','qie','']],
  ['勇敢的人先享受世界。', ['yong','gan','de','ren','xian','xiang','shou','shi','jie','']],
  ['慢慢来，比较快。', ['man','man','lai','','bi','jiao','kuai','']],
  ['一切都会好起来的。', ['yi','qie','dou','hui','hao','qi','lai','de','']],
  ['只要功夫深，铁杵磨成针。', ['zhi','yao','gong','fu','shen','','tie','chu','mo','cheng','zhen','']],
  ['不积跬步，无以至千里。', ['bu','ji','kui','bu','','wu','yi','zhi','qian','li','']]
];

/* 暴露到全局 */
window.SP_DATA = {
  SCHEMES: SCHEMES,
  SYLLABLES: SYLLABLES,
  CHARACTERS: CHARACTERS,
  WORDS: WORDS,
  PASSAGES: PASSAGES
};
