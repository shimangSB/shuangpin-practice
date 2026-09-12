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

/* ---------- 小鹤音形 ---------- */
/* 音码 = 小鹤双拼（2 键）+ 形码（首形 + 末形，2 键）= 每字 4 键 */
/* 笔画键（拆分最小单元） */
const YX_STROKES = [
  ['a', '横', '一'], ['l', '竖', '丨'], ['p', '撇', '丿'],
  ['d', '点', '丶'], ['v', '折', '乛'], ['n', '捺', '乀']
];

/* 部件字根（偏旁部首，日常称谓定键） */
const YX_BUIJIAN = [
  ['a', '鱼', 'A 像鱼'],
  ['b', '冖 宀 丷 疒 勹 比左', '宝盖 / 倒八 / 病 / 勹bāo / 匕'],
  ['c', '艹 廾', '草'],
  ['d', '冫 氵 刂 ⺈', '点 / 刀'],
  ['e', '阝 卩 彐 山 见下', '耳旁 / 儿 / 彐山像E'],
  ['f', '扌 龶 寿上 带上 缶', '扶手 / 丰变形 / 缶fǒu'],
  ['g', '既左 艮 鬼 革 骨', '艮gèn'],
  ['h', '灬 虍 余下 黑', '火 / 虎头 / 禾'],
  ['i', '彳 亍 虫', '彳chì 亍chù'],
  ['j', '钅 金 龹', '金 / 卷字头'],
  ['k', '匚 冂 凵 囗 㠯', '框'],
  ['l', '耂 立 龙', '老字头'],
  ['m', '朩', '木'],
  ['n', '⺧ 牜', '无尾牛 / 牛'],
  ['o', '日 月 目', '圆的'],
  ['p', '礻 衤', '强记（都有一撇）'],
  ['q', '犭 求 具上 其上', '反犬 / 且 / 其'],
  ['r', '亻', '人'],
  ['s', '纟 厶 龴 罒', '丝 / 私 / 四'],
  ['t', '田', '-'],
  ['u', '饣 龵 𠂇 氺 石', '食 / 手十变形 / 水'],
  ['v', '⺮ 豸', '竹 / 豸zhì'],
  ['w', '亠 夂 攵 文', '文字头 / 反文'],
  ['x', '忄 乂 ⺍ ⺌ ⺗', '心 / 乂像X / 兴字头 / 小'],
  ['y', '讠 𧘇 ⺶ ⺷ 羊', '言 / 衣底 / 羊变形 / 无尾羊'],
  ['z', '⻊ 廴 辶', '足 / 走之底']
];

/* 小字字根（规则衍生，按声母定键，免记忆） */
const YX_XIAOZI = [
  ['a', '凹'],
  ['b', '百 白 八 卜 匕 卞 不 巴 本 必 丙 半 办'],
  ['c', '寸 才 匆 册'],
  ['d', '大 丁 刀 歹 刁 东 丹 电 氐'],
  ['e', '二 耳 儿 而'],
  ['f', '非 方 飞 夫 凡 甫 弗 乏 丰'],
  ['g', '广 弓 戈 工 瓜 干 个 甘 丐 果 更 夬'],
  ['h', '禾 户 互 乎 火'],
  ['i', '川 厂 车 长 叉 尺 丑 臣 成 垂 斥 串 产 出'],
  ['j', '巾 几 九 斤 久 巨 己 井 及 夹 甲 臼 韭 戋 柬 击'],
  ['k', '口 开 亏'],
  ['l', '了 力 乐 来 良 两 里 吏 耒 卵 丽'],
  ['m', '木 毛 米 门 马 皿 末 灭 母 民 么 面'],
  ['n', '廿 女 牛 鸟 乃 内 农 年'],
  ['o', ''],
  ['p', '片 平 爿'],
  ['q', '七 千 犬 丘 曲 且 气 乞'],
  ['r', '人 入 冉 壬 刃'],
  ['s', '三 巳 肃'],
  ['t', '土 天 太 屯'],
  ['u', '十 尸 士 手 身 水 上 少 术 失 生 世 申 史 升 事 书 束 勺 戍 豕 氏 矢'],
  ['v', '止 爪 主 舟 之 正 丈 中 专 朱 州 重 乍'],
  ['w', '王 瓦 五 无 万 午 亡 未 乌 韦 勿 为 戊 我 丸 兀'],
  ['x', '小 西 心 血 下 夕 乡 戌 习'],
  ['y', '又 酉 已 于 义 与 夭 玉 牙 丫 永 尤 也 业 由 央 亚 严 用 幺 禺 臾 尹 禹 夷 弋 聿 雨 曳'],
  ['z', '再 自 子']
];

/* 音形例字：[汉字, 拼音, 全码(音2+形2), 首形, 末形] */
const YX_EXAMPLES = [
  ['湿','shi','uidy','氵','业'],['例','li','lird','亻','刂'],['解','jie','jpdn','⺈','牛'],
  ['猜','cai','cdqo','犭','月'],['鞋','xie','xpgt','革','土'],['球','qiu','qqwq','王','求'],
  ['具','ju','juqb','具上','八'],['冬','dong','dswd','夂','点'],['现','xian','xmwe','王','见下'],
  ['累','lei','lwtx','田','小'],['差','cha','iayg','⺶','工'],['看','kan','kjuo','龵','目'],
  ['码','ma','maum','石','马'],['行','xing','xkii','彳','亍'],['蛇','she','ueib','虫','匕'],
  ['服','fu','fuoy','月','又'],['公','gong','gsbs','八','厶'],['冲','chong','isdv','冫','中'],
  ['色','se','sedb','⺈','巴'],['带','dai','ddfj','带上','巾'],['责','ze','zefr','龶','人'],
  ['钢','gang','ghjx','钅','乂'],['券','quan','qrjd','龹','刀'],['匹','pi','pike','匚','儿'],
  ['管','guan','grvk','⺮','㠯'],['教','jiao','jnlw','耂','攵'],['夏','xia','xxaw','横','夂'],
  ['辣','la','lalu','立','束'],['建','jian','jmzy','廴','聿'],['常','chang','ihxj','⺌','巾'],
  ['兴','xing','xkxb','⺍','八'],['添','tian','tmdx','氵','⺗'],['恒','heng','hgxa','忄','横'],
  ['笔','bi','bivm','⺮','毛'],['冠','guan','grbc','冖','寸'],['病','bing','bkbb','疒','丙'],
  ['爸','ba','babb','八','巴'],['体','ti','tirb','亻','本'],['财','cai','cdkc','冂','才'],
  ['死','si','sidb','歹','匕'],['冻','dong','dsdd','冫','东'],['抵','di','difd','扌','氐'],
  ['示','shi','uiex','二','小'],['耶','ye','yeee','耳','阝'],['兆','zhao','vced','儿','点'],
  ['耍','shua','uxen','而','女'],['防','fang','fhef','阝','方'],['替','ti','tifo','夫','日'],
  ['巩','gong','gsgf','工','凡'],['辅','fu','fuif','车','甫'],['泛','fan','fjdf','氵','乏'],
  ['慧','hui','hvfx','丰','心'],['引','yin','ybgl','弓','竖'],['或','huo','hoga','戈','横'],
  ['便','bian','bmrg','亻','更'],['某','mou','mzgm','甘','木'],['钙','gai','gdjg','钅','丐'],
  ['棵','ke','kemg','木','果'],['利','li','lihd','禾','刂'],['沪','hu','hudh','氵','户'],
  ['呼','hu','hukh','口','乎'],['炒','chao','ichu','火','少'],['训','xun','xyyi','讠','川'],
  ['张','zhang','vhgi','弓','长'],['迟','chi','iizi','辶','尺'],['城','cheng','igti','土','成'],
  ['睡','shui','uvoi','目','垂'],['患','huan','hrix','串','心'],['市','shi','uiwj','亠','巾'],
  ['讥','ji','jiyj','讠','几'],['进','jin','jbzj','辶','井'],['吸','xi','xikj','口','及'],
  ['押','ya','yafj','扌','甲'],['鼠','shu','uujv','臼','折'],['浅','qian','qmdj','氵','戋'],
  ['陆','lu','luej','阝','击'],['并','bing','bkbk','丷','开'],['粮','liang','llml','米','良'],
  ['辆','liang','llil','车','两'],['理','li','liwl','王','里'],['使','shi','uirl','亻','吏'],
  ['闯','chuang','ilmm','门','马'],['沫','mo','modm','氵','末'],['缅','mian','mmsm','纟','面'],
  ['革','ge','genl','廿','竖'],['鹤','he','hedn','点','鸟'],['浓','nong','nsdn','氵','农'],
  ['版','ban','bjpy','片','又'],['苹','ping','pkcp','艹','平'],['切','qie','qpqd','七','刀'],
  ['助','zhu','vuql','且','力'],['汽','qi','qidq','氵','气'],['吃','chi','iikq','口','乞'],
  ['肉','rou','rznr','内','人'],['再','zai','zdar','横','冉'],['任','ren','rfrr','亻','壬'],
  ['忍','ren','rfrx','刃','心'],['导','dao','dcsc','巳','寸'],['起','qi','qitj','土','己'],
  ['关','guan','grbt','丷','天'],['冰','bing','bkdu','冫','水'],['叔','shu','uuuy','上','又'],
  ['述','shu','uuzu','辶','术'],['豹','bao','bcvu','豸','勺'],['逐','zhu','vuzu','辶','豕'],
  ['智','zhi','viuo','矢','日'],['步','bu','buvp','止','撇'],['船','chuan','irvk','舟','口'],
  ['政','zheng','vgvw','正','攵'],['忠','zhong','vsvx','中','心'],['传','chuan','irrv','亻','专'],
  ['洲','zhou','vzdv','氵','州'],['作','zuo','zorv','亻','乍'],['玉','yu','yuwd','王','点'],
  ['伍','wu','wurw','亻','五'],['忘','wang','whwx','亡','心'],['妹','mei','mwnw','女','未'],
  ['伟','wei','wwrw','亻','韦'],['忽','hu','huwx','勿','心'],['成','cheng','igwv','戊','折'],
  ['执','zhi','vifw','扌','丸'],['晒','shai','udox','日','西'],['恤','xu','xuxx','忄','血'],
  ['名','ming','mkxk','夕','口'],['羽','yu','yuxx','习','习'],['醒','xing','xkyu','酉','生'],
  ['仪','yi','yiry','亻','义'],['他','ta','tary','亻','也'],['油','you','yzdy','氵','由'],
  ['秧','yang','yhhy','禾','央'],['优','you','yzry','亻','尤'],['幻','huan','hryv','幺','折'],
  ['式','shi','uiyg','弋','工'],['律','lü','lviy','彳','聿'],['雪','xue','xtye','雨','彐'],
  ['咱','zan','zjkz','口','自'],['孟','meng','mgzm','子','皿'],['载','zai','zdui','十','车'],
  ['甜','tian','tmqg','千','甘'],['哥','ge','gedk','丁','口']
];

/* 暴露到全局 */
window.SP_DATA = {
  SCHEMES: SCHEMES,
  SYLLABLES: SYLLABLES,
  CHARACTERS: CHARACTERS,
  WORDS: WORDS,
  PASSAGES: PASSAGES,
  YX_STROKES: YX_STROKES,
  YX_BUIJIAN: YX_BUIJIAN,
  YX_XIAOZI: YX_XIAOZI,
  YX_EXAMPLES: YX_EXAMPLES
};
