import type { CardMaster, Rarity } from '../types';

// Cards picked per rarity for one season (total = 50)
const SEASON_COUNTS: Record<Rarity, number> = { SSR: 5, SR: 10, R: 15, N: 20 };

interface Archetype {
  nameTemplate: string;
  promptDesc: string;
  cheerTemplate: string;
}

// FNV-1a hash → deterministic seed from seasonId string
function hashStr(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x01000193) >>> 0;
  }
  return h;
}

// LCG seeded RNG; same seed always produces the same sequence
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// Fisher-Yates shuffle, pick first n elements
function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

// ── プール（美女系モチーフを追加・拡張） ────────────────────

const SSR_POOL: Archetype[] = [
  // 既存
  { nameTemplate: '{theme}の覇王', promptDesc: 'supreme tyrant overlord, overwhelming power, dominating dark throne, majestic terrifying presence', cheerTemplate: '{theme}の覇王のように、今日もすべてを制しよう！限界を超えろ！' },
  { nameTemplate: '天地の{theme}神', promptDesc: 'supreme divine deity god, transcendent ethereal cosmic form, sacred celestial manifestation, heavenly realm', cheerTemplate: '天地を揺るがす力があなたの中に宿っている。今日も全力で挑もう！' },
  { nameTemplate: '{theme}の冥王', promptDesc: 'dark underworld king ruler, black ethereal flowing robes, death scythe, shadow realm background, imposing fearsome presence', cheerTemplate: '{theme}の冥王の不動の意志で、今日も絶対に諦めるな！' },
  { nameTemplate: '{theme}の龍皇', promptDesc: 'supreme dragon emperor, majestic enormous dragon form, ancient cosmic power, legendary transcendent presence, catastrophic energy', cheerTemplate: '龍皇の力が宿っている。今日も最高の自分を超えていけ！' },
  { nameTemplate: '{theme}の時神', promptDesc: 'supreme time deity, warping space-time continuum, cosmic clock gears, transcendent timeless form, ultimate divine power', cheerTemplate: '時を超えた力で、あなたの可能性は無限大だ！今こそ動け！' },
  
  // 新規追加：美女系モチーフ（10件）
  { nameTemplate: '{theme}の女帝ヴァルキリー', promptDesc: 'medium shot, stunningly beautiful empress valkyrie, majestic golden armor, glowing white wings, radiant divine aura, sharp focus on gorgeous face, flawless skin', cheerTemplate: '{theme}の女帝の神聖な輝きがあなたを守っている。自信を持って頂点を目指そう！' },
  { nameTemplate: '{theme}の竜姫プリムセス', promptDesc: 'medium shot, seductive dragon princess, elegant dragon scale corset, glowing ember eyes, magnificent dragon horns, fiery magical aura, detailed flawless face', cheerTemplate: '竜姫の不屈の情熱を胸に、今日の目標を華麗に射止めよう！' },
  { nameTemplate: '{theme}の漆黒女王', promptDesc: 'medium shot, breathtaking dark queen, ornate black rose lace dress, glowing crimson eyes, dark magical particles, sharp focus on lips and face, alluring expression', cheerTemplate: '漆黒の女王の優雅さと絶対の自信を持って、今日の困難を制圧しよう！' },
  { nameTemplate: '{theme}の星空女神', promptDesc: 'medium shot, divine celestial goddess, translucent cosmic gown, glowing starry halo, flowing silver hair, ethereal enchanting beauty, sharp focus', cheerTemplate: '星々の導きはいつだってあなたと共に。輝かしい未来へ歩みを進めよう！' },
  { nameTemplate: '{theme}の創世聖女', promptDesc: 'medium shot, beautiful holy saintess, sacred golden filigree armor, glowing orb of creation, benevolent warm gaze, luminous atmosphere, hyper-detailed', cheerTemplate: '聖女の愛と祈りがあなたの力になる。新しい一日を素晴らしいものにしよう！' },
  { nameTemplate: '{theme}の氷晶女皇', promptDesc: 'medium shot, icy gorgeous empress, crystal glass body armor, sapphire crown, floating snowflakes, piercing blue eyes, flawless skin texture', cheerTemplate: '氷晶女皇のように凛とした美しさで、どんな迷いもクリアに撃ち破ろう！' },
  { nameTemplate: '{theme}の深海女王', promptDesc: 'medium shot, alluring ocean mermaid queen, iridescent pearl scale armor, golden trident, shimmering bioluminescent underwater realm, captivating eyes', cheerTemplate: '深海の女王のように底知れぬ潜勢力を解き放て。あなたなら何でもできる！' },
  { nameTemplate: '{theme}の不死鳥舞姫', promptDesc: 'medium shot, radiant phoenix dancer, flowing scarlet and gold feather gown, fiery wings spread, passionate striking face, glowing ember particles', cheerTemplate: '何度でも舞い上がる不死鳥のごとく、熱い情熱で今日の挑戦を楽しもう！' },
  { nameTemplate: '{theme}の時空女魔導士', promptDesc: 'medium shot, beautiful time archmage woman, elaborate clockwork corset, glowing arcane time circles, clever confident smirk, sharp focus', cheerTemplate: '時空を司る賢者のようにスマートに。あなたの時間と才能を最大限に輝かせよう！' },
  { nameTemplate: '{theme}の太陽女神', promptDesc: 'medium shot, dazzling sun goddess, golden solar armor, radiant solar flares behind, warm sunlit glowing skin, majestic powerful beauty', cheerTemplate: '太陽の如き圧倒的な輝きで、周りを明るく照らしながら進もう！' },
];

const SR_POOL: Archetype[] = [
  // 既存
  { nameTemplate: '{theme}の英雄', promptDesc: 'legendary champion hero, glorious power, noble heroic dramatic pose, brilliant lighting', cheerTemplate: '{theme}の英雄があなたを応援している！どんな困難も必ず乗り越えられる！' },
  { nameTemplate: '{theme}の女王', promptDesc: 'powerful queen ruler, regal majestic presence, commanding authority, ornate royal crown and gown', cheerTemplate: '女王の品格で今日の壁を打ち破ろう！あなたなら絶対できる！' },
  { nameTemplate: '{theme}の守護者', promptDesc: 'sacred guardian protector, shielding defensive stance, holy protective aura, stalwart defender armor', cheerTemplate: '守護者があなたを見守っている。自信を持って前へ進め！' },
  { nameTemplate: '{theme}の大賢者', promptDesc: 'ancient grand sage wiseman, deep mystical knowledge, arcane glowing aura, ancient scrolls and staff', cheerTemplate: '知恵こそが最強の武器。今日も一つでも多くを学ぼう！' },
  { nameTemplate: '{theme}の剣聖', promptDesc: 'sword saint master swordsman, ultimate blade technique, serene concentrated expression, swift movement blur', cheerTemplate: '一撃に魂を込めるように、今日の一歩に全力を尽くそう！' },
  { nameTemplate: '{theme}の魔王', promptDesc: 'demon lord dark powerful ruler, terrifying commanding aura, shadowy dark kingdom throne, menacing presence', cheerTemplate: '魔王の不屈の意志で、今日も最高の結果を掴み取ろう！' },
  { nameTemplate: '{theme}の賢王', promptDesc: 'wise philosopher king ruler, majestic crown and throne, scholarly intelligent aura, respected noble leadership', cheerTemplate: '賢王の判断力で、今日の壁を冷静に乗り越えよう！' },
  { nameTemplate: '{theme}の天使', promptDesc: 'radiant divine angel, large shining feathered wings, holy golden light aura, celestial armor, benevolent expression', cheerTemplate: '天使の加護があなたを守っている。自信を持って進め！' },
  { nameTemplate: '{theme}の幻術師', promptDesc: 'illusionist magician, mysterious magical illusion effects, phantom mirror images, shadowy stage performance, enchanting presence', cheerTemplate: '幻術師のように、想像力であなたの現実を塗り替えろ！' },
  { nameTemplate: '{theme}の戦神', promptDesc: 'god of war battle deity, fierce invincible warrior divine form, battlefield domination, powerful divine weapons', cheerTemplate: '戦神の闘志であなたの挑戦に立ち向かい、一歩も引かない！' },

  // 新規追加：美女系モチーフ（20件）
  { nameTemplate: '{theme}の聖剣姫', promptDesc: 'medium shot, seductive female holy knight, sleek silver plate armor, tight fitted breastplate, shining blade, noble fierce expression, sharp focus', cheerTemplate: '凛とした聖剣姫のように気高く。あなたのまっすぐな心が道を切り開く！' },
  { nameTemplate: '{theme}の月下くノ一', promptDesc: 'medium shot, attractive kunoichi assassin, tight black silk outfit, violet moonlight glowing, holding sharp kunai, alluring mysterious gaze', cheerTemplate: 'しなやかで素早い身こなしで、チャンスを瞬時に掴み取ろう！' },
  { nameTemplate: '{theme}の疾風女騎士', promptDesc: 'medium shot, beautiful wind knight woman, feather-decorated light armor, dual rapiers, wind streamers swirling around, confident playful smile', cheerTemplate: '爽やかな風のように自由に、今日のハードルをひらりと飛び越えよう！' },
  { nameTemplate: '{theme}の魔導姫デビル', promptDesc: 'medium shot, sexy succubus sorceress, ornate leather corset, small wings, glowing spellbook, seductive smirk, sharp focus on eyes', cheerTemplate: '魅惑の魔導で周囲を惹きつけるように、あなたの個性を全開にしていこう！' },
  { nameTemplate: '{theme}の精霊騎士', promptDesc: 'medium shot, beautiful elf knight, vine-patterned emerald armor, glowing wooden bow, sunbeams in deep forest, serene focused gaze', cheerTemplate: '精霊の祝福を受けた弓のように、狙ったゴールへ一直線に突き進もう！' },
  { nameTemplate: '{theme}の紫電忍姫', promptDesc: 'medium shot, gorgeous lightning kunoichi, purple glowing body suit, crackling electric daggers, sharp fierce eyes, dynamic motion blur', cheerTemplate: '電光石火の判断力で、目の前のタスクを鮮やかに終わらせよう！' },
  { nameTemplate: '{theme}の煉獄女戦士', promptDesc: 'medium shot, fierce flame warrior woman, crimson scale armor, glowing fiery greatsword, burning ashes around, intense passionate eyes', cheerTemplate: '胸の中の情熱を燃やせ！あなたの熱意があれば越えられない壁はない！' },
  { nameTemplate: '{theme}の薔薇騎士', promptDesc: 'medium shot, graceful rose knight lady, black and gold armor with thorn motifs, holding ornate rapier, swirling red rose petals', cheerTemplate: '華麗に咲く薔薇のように強く美しく。自信を持っていこう！' },
  { nameTemplate: '{theme}の機械女将軍', promptDesc: 'medium shot, steampunk female general, brass polished armor, glowing gear details, commanding pose, intense intelligent gaze', cheerTemplate: '精密なギアのように計画的に。今日の目標を着実に攻略しよう！' },
  { nameTemplate: '{theme}の星詠み巫女', promptDesc: 'medium shot, lovely star prophet priestess, midnight blue ceremonial dress, glowing star globe in hands, gentle serene expression', cheerTemplate: '星々が指し示す最高の未来へ。自分を信じて前へ歩もう！' },
  { nameTemplate: '{theme}の幻惑槍使い', promptDesc: 'medium shot, attractive spear woman, fitting leather armor, decorated long spear, illusionary mirror images around, confident smirk', cheerTemplate: '華麗な槍さばきのごとく、無駄のない動きで最高の成果を出そう！' },
  { nameTemplate: '{theme}の召喚姫ノワール', promptDesc: 'medium shot, beautiful dark summoner, gothic black dress, glowing purple magic circles, summoning shadow panther, mysterious smile', cheerTemplate: '秘めたる力を解き放て。あなたのポテンシャルはまだまだこんなものじゃない！' },
  { nameTemplate: '{theme}の太陽女侍', promptDesc: 'medium shot, stunning female samurai, ornate red and gold armor, katana unsheathed, cherry blossoms swirling, determined eyes', cheerTemplate: '折れない刀の如き信念を持って。今日の勝負を勝ち取ろう！' },
  { nameTemplate: '{theme}の純白聖女', promptDesc: 'medium shot, angelic white healer woman, white and gold vestments, glowing golden healing light, compassionate gentle smile', cheerTemplate: 'あなたの優しさが周りを救う。今日も笑顔で温かい一日を過ごそう！' },
  { nameTemplate: '{theme}の極光舞姫', promptDesc: 'medium shot, aurora dancer woman, iridescent flowing ribbons, dancing under northern lights, joyful energetic expression', cheerTemplate: '極光のように美しく自由にいこう！楽しむ心が何よりの原動力！' },
  { nameTemplate: '{theme}の海賊女キャプテン', promptDesc: 'medium shot, seductive pirate captain woman, open coat, tricorn hat, holding cutlass blade, sea breeze blowing hair, confident smirk', cheerTemplate: '自分の人生の舵は自分が取る！荒波を越えて宝物を掴み取ろう！' },
  { nameTemplate: '{theme}の機巧人形姫', promptDesc: 'medium shot, gothic automaton ball-jointed doll beauty, intricate lace and brass gear dress, glowing blue eyes, serene porcelain face', cheerTemplate: 'どんな複雑な課題も冷静にクリア。完璧なパフォーマンスを見せつけよう！' },
  { nameTemplate: '{theme}の森の守護巫女', promptDesc: 'medium shot, druid maiden, leaf-braided hair, floral armor accents, glowing green magic, forest animals background, warm eyes', cheerTemplate: '着実に根を伸ばす大樹のように。一歩一歩の努力を大切にしよう！' },
  { nameTemplate: '{theme}の闇夜女盗賊', promptDesc: 'medium shot, phantom thief woman, tight leather suit, sleek domino mask, holding sparkling jewel, mischievous attractive smile', cheerTemplate: '華麗にスマートに。今日の最高のチャンスを誰より早く掴もう！' },
  { nameTemplate: '{theme}の龍血女戦士', promptDesc: 'medium shot, dragon blooded female warrior, draconic red scales on skin, dark steel armor, flaming halberd, fierce amber eyes', cheerTemplate: '覚悟を決めた戦士は強い！限界を突破してさらなる高みへ！' },
];

const R_POOL: Archetype[] = [
  // 既存
  { nameTemplate: '{theme}の戦士', promptDesc: 'skilled battle warrior fighter, combat-ready powerful stance, determined fierce expression, decorated armor and weapon', cheerTemplate: '戦士の勇気を持って、今日の挑戦に立ち向かおう！' },
  { nameTemplate: '{theme}の魔法使い', promptDesc: 'talented mage sorcerer, casting powerful spell, swirling colorful magical energy, focused determined expression', cheerTemplate: '魔法のように、あなたの努力は必ず世界を変える！' },
  { nameTemplate: '{theme}の探偵', promptDesc: 'clever detective investigator, sharp analyzing eyes, magnifying glass clue, intellectual observant pose', cheerTemplate: '探偵のように物事をよく見つめれば、答えは必ず見つかる！' },
  { nameTemplate: '{theme}の射手', promptDesc: 'precise archer marksman, drawing longbow focused aim, swift athletic movement, arrows ready', cheerTemplate: '目標を定めたら一直線！あなたの矢は必ず届く！' },
  { nameTemplate: '{theme}の冒険家', promptDesc: 'bold explorer adventurer, expedition gear backpack, map in hand, confident discovering smile', cheerTemplate: '冒険家の心で、今日も新しい世界を切り開こう！' },
  { nameTemplate: '{theme}の忍者', promptDesc: 'stealthy ninja shinobi, shadow acrobatic movement, hidden blade ready, swift silent pose', cheerTemplate: '忍者のように、コツコツと実力を積み上げていこう！' },
  { nameTemplate: '{theme}の騎士', promptDesc: 'honorable knight paladin, shining plate armor, noble stance, shield and sword raised', cheerTemplate: '騎士の誇りを胸に、今日も正々堂々と頑張ろう！' },
  { nameTemplate: '{theme}の治癒師', promptDesc: 'skilled healer physician, caring warm expression, healing light magic hands, gentle compassionate', cheerTemplate: '治癒師の温かい心で、今日も自分と周りを元気づけよう！' },
  { nameTemplate: '{theme}の盗賊', promptDesc: 'nimble thief rogue, light-footed sneaky movement, treasure bag, clever mischievous grin', cheerTemplate: '盗賊のように素早く、チャンスを逃さず掴み取ろう！' },
  { nameTemplate: '{theme}の吟遊詩人', promptDesc: 'charming bard performer, playing musical instrument, inspiring captivating stage presence, audience enchanted', cheerTemplate: '詩人のように、あなたの言葉と行動が誰かを元気にする！' },
  { nameTemplate: '{theme}の錬金術士', promptDesc: 'brilliant alchemist inventor, glowing colorful potions laboratory, experimental spirit, steam goggles', cheerTemplate: '錬金術師のように、努力を重ねれば必ず金になる！' },
  { nameTemplate: '{theme}の船長', promptDesc: 'bold captain leader, commanding confident pose on ship deck, adventure spirit, compass and map', cheerTemplate: '船長として仲間を導くように、あなたも輝ける！' },
  { nameTemplate: '{theme}の巫女', promptDesc: 'shrine maiden priestess, spiritual sacred power, ritual ceremony, glowing sacred artifacts and orbs', cheerTemplate: '巫女の祈りのように、あなたの願いは必ず天に届く！' },
  { nameTemplate: '{theme}の竜使い', promptDesc: 'dragon tamer beast master, powerful dragon companion beside, wild adventurous spirit, commanding presence', cheerTemplate: '竜を操るように、あなたも大きな力を持っている！' },
  { nameTemplate: '{theme}の狩人', promptDesc: 'skilled hunter tracker, keen wilderness expertise, camouflage gear, focused intense expression', cheerTemplate: '狩人の鋭い目で目標を定め、今日も着実に進もう！' },

  // 新規追加：美女系モチーフ（30件）
  { nameTemplate: '{theme}の弓術士エルフ', promptDesc: 'medium shot, beautiful elf archer girl, green leaf cloak, delicate longbow, sunlit forest, clear sharp eyes', cheerTemplate: 'ブレない軸を持って集中！狙った的は外さない！' },
  { nameTemplate: '{theme}の猫耳剣士', promptDesc: 'medium shot, cute catgirl swordswoman, cat ears and tail, lightweight leather armor, holding katana, playful smile', cheerTemplate: '軽快に可愛く！自分のフィーリングを信じて進もう！' },
  { nameTemplate: '{theme}の銃士少女', promptDesc: 'medium shot, attractive musketeer girl, feathered hat, holding smoking flintlock pistol, confident expression', cheerTemplate: 'ここぞというタイミングを逃さずに打ち抜こう！' },
  { nameTemplate: '{theme}の氷術士少女', promptDesc: 'medium shot, ice mage girl, blue robes, floating ice crystals, pale skin, serene clear eyes', cheerTemplate: '熱くなりすぎず冷静に。クリアな頭で前進しよう！' },
  { nameTemplate: '{theme}の踊り子シヴァ', promptDesc: 'medium shot, exotic dancer girl, flowing silk veils, golden ankle bells, expressive eyes, stage light', cheerTemplate: '自分らしく伸び伸びと！あなたの輝きが周りを魅了する！' },
  { nameTemplate: '{theme}の錬金術女技士', promptDesc: 'medium shot, female alchemist, brass goggles, holding bubbling potion flask, cute curious smile', cheerTemplate: '小さな実験と工夫の積み重ねが大きなブレイクスルーになる！' },
  { nameTemplate: '{theme}の風使いの乙女', promptDesc: 'medium shot, wind sorceress girl, light white dress, swirling breeze and green leaves, bright smile', cheerTemplate: '風向きは自分で作るもの！軽やかな一歩を踏み出そう！' },
  { nameTemplate: '{theme}の神殿の守衛女', promptDesc: 'medium shot, female temple guard, silver armor, spear and shield, dignified posture, focused look', cheerTemplate: '自分の決めたルールを守り抜こう。それが一番の強さになる！' },
  { nameTemplate: '{theme}の暗殺術士ネブラ', promptDesc: 'medium shot, stealthy female rogue, dark hood, dagger ready, shadowy alley background, sharp gaze', cheerTemplate: '静かに着実に。狙いを定めて結果を出そう！' },
  { nameTemplate: '{theme}の海洋ナビゲーター', promptDesc: 'medium shot, female sailor navigator, blue striped shirt, holding brass spyglass, sea view, bright smile', cheerTemplate: '正しい航路を見極めて。迷わず前へ突き進もう！' },
  { nameTemplate: '{theme}の槍術士ランサー', promptDesc: 'medium shot, female lancer, fitting scale mail, long spear, determined battle-ready stance', cheerTemplate: 'まっすぐな熱意で前へ！突き進む力が道を作る！' },
  { nameTemplate: '{theme}の薬草娘', promptDesc: 'medium shot, cute herbalist girl, apron with wild flowers, basket of medicinal herbs, friendly smile', cheerTemplate: '地道な準備が成果を育む。一つずつ丁寧にこなそう！' },
  { nameTemplate: '{theme}の妖精剣士', promptDesc: 'medium shot, fairy swordswoman, translucent wings, miniature glowing sword, sparkling light particles', cheerTemplate: '小さな力も集まれば大きなパワー！今日も元気にいこう！' },
  { nameTemplate: '{theme}のサイバーハッカー女', promptDesc: 'medium shot, female cyberpunk hacker, neon glowing hair, holographic screens, futuristic suit, confident smile', cheerTemplate: 'スマートなロジックで問題をクリア！どんどん進めよう！' },
  { nameTemplate: '{theme}の黒猫魔女', promptDesc: 'medium shot, witch girl with black cat, oversized pointed hat, magic broom, twilight background, cheerful smirk', cheerTemplate: '少しの遊び心とアイデアで、今日の時間をワクワクさせよう！' },
  { nameTemplate: '{theme}の砂漠の舞姫', promptDesc: 'medium shot, desert dancer girl, exotic golden jewelry, sheer red silk, sand dune sunset, enchanting gaze', cheerTemplate: 'タフでしなやかに！どんな環境でも美しく花を咲かせよう！' },
  { nameTemplate: '{theme}の魔導騎士レディ', promptDesc: 'medium shot, female magic knight, spell-infused armor, glowing rune sword, resolute posture', cheerTemplate: '知性と武力を兼ね備えて。スマートに課題を攻略しよう！' },
  { nameTemplate: '{theme}の鳥人空術士', promptDesc: 'medium shot, winged harpist woman, feathered armor, soaring in cloudless blue sky, free joyful face', cheerTemplate: '視点を高く持てば解決策が見えてくる。視野を広く行こう！' },
  { nameTemplate: '{theme}の怪盗レディ', promptDesc: 'medium shot, female phantom thief, top hat, monocle, black cape, holding card, playful attractive smile', cheerTemplate: '誰も思いつかないアイデアで鮮やかに目標を達成しよう！' },
  { nameTemplate: '{theme}の機械整備士女', promptDesc: 'medium shot, female mechanic, overalls with grease smudges, holding wrench, bright confident grin', cheerTemplate: '調子をしっかり整えて。ギアを上げて全力出していこう！' },
  { nameTemplate: '{theme}の星くず乙女', promptDesc: 'medium shot, stargazer girl, telescope, starry sky gown, sparkling eyes looking up', cheerTemplate: '大きな夢を描こう！描いた分だけ遠くへ行ける！' },
  { nameTemplate: '{theme}の格闘家少女', promptDesc: 'medium shot, female martial artist, wrapped hand bandages, kung-fu outfit, energetic battle stance', cheerTemplate: '気合一発！アグレッシブに攻めて今日の勝利を掴もう！' },
  { nameTemplate: '{theme}の森の弓騎兵', promptDesc: 'medium shot, female horse archer, riding swift horse, bow drawn, autumn forest background', cheerTemplate: 'スピードと精度を両立！止まらずに駆け抜けよう！' },
  { nameTemplate: '{theme}の吟遊詩人ローザ', promptDesc: 'medium shot, female bard, playing lute, flower crown, tavern background, bright singing face', cheerTemplate: 'あなたのポジティブな言葉が周りに最高のエネルギーを与える！' },
  { nameTemplate: '{theme}の結晶魔術師', promptDesc: 'medium shot, crystal mage woman, quartz staff, floating purple crystals, sharp focused eyes', cheerTemplate: 'ブレない結晶のような信念を持って、一つずつ形にしよう！' },
  { nameTemplate: '{theme}の雪原の狩人女', promptDesc: 'medium shot, winter hunter woman, fur cloak, ice bow, snowy landscape, sharp arctic eyes', cheerTemplate: '厳しい状況も集中力で乗り越える。あなたなら大丈夫！' },
  { nameTemplate: '{theme}の炎使いの少女', promptDesc: 'medium shot, fire pyromancer girl, orange hair, floating fireballs in hands, energetic smirk', cheerTemplate: 'やる気の火を絶やすな！熱いハートで一日を乗り切ろう！' },
  { nameTemplate: '{theme}の神官見習い女', promptDesc: 'medium shot, novice priestess, white robes, holding holy scriptures, gentle earnest face', cheerTemplate: '素直でひたむきな姿勢が一番の武器。今日も一生懸命行こう！' },
  { nameTemplate: '{theme}の赤頭巾の猟師女', promptDesc: 'medium shot, red riding hood hunter woman, red hooded cloak, holding hunting rifle, forest background', cheerTemplate: '油断せず着実に。目標に向かって一歩ずつ進もう！' },
  { nameTemplate: '{theme}の時計仕掛けの乙女', promptDesc: 'medium shot, clockwork girl, brass key on back, Victorian dress, ticking gears around, polite smile', cheerTemplate: '一秒一秒を大切に積み重ねて、最高の時間を創り出そう！' },
];

const N_POOL: Archetype[] = [
  // 既存
  { nameTemplate: '{theme}の見習い', promptDesc: 'eager apprentice trainee, beginner enthusiasm, learning experience, simple humble outfit', cheerTemplate: '見習いから始まっても、続けることで必ず一人前になれる！' },
  { nameTemplate: '{theme}の村人', promptDesc: 'common villager townsperson, everyday ordinary life, simple practical clothes, gentle expression', cheerTemplate: '普通の毎日の積み重ねが、いつか大きな力になる！' },
  { nameTemplate: '{theme}の農夫', promptDesc: 'hardworking farmer, cultivating fertile land, simple farming tools, outdoor honest work', cheerTemplate: '農夫のように、一つ一つ丁寧に育てれば必ず実を結ぶ！' },
  { nameTemplate: '{theme}の漁師', promptDesc: 'patient fisherman, peaceful waterside scene, fishing rod and net, relaxed warm smile', cheerTemplate: '漁師のように焦らず待てば、必ず大きな成果が得られる！' },
  { nameTemplate: '{theme}の行商人', promptDesc: 'small merchant shopkeeper, colorful market stall goods, friendly welcoming smile, lively trading', cheerTemplate: '行商人のように出会いを大切に、今日も前へ進もう！' },
  { nameTemplate: '{theme}の番兵', promptDesc: 'dutiful guard sentinel, standing watch post diligently, simple honest armor, alert expression', cheerTemplate: '番兵のように自分の持ち場を守れば、周りが安心できる！' },
  { nameTemplate: '{theme}の使者', promptDesc: 'swift messenger courier, carrying important delivery, determined purposeful expression, on the move', cheerTemplate: '使者のように、大切なことをしっかり届けよう！' },
  { nameTemplate: '{theme}の職人', promptDesc: 'skilled craftsman artisan, workshop setting, careful precise handcraft work, quality goods', cheerTemplate: '職人の技は一日にしてならず。今日もコツコツ磨いていこう！' },
  { nameTemplate: '{theme}の旅人', promptDesc: 'wandering free traveler, backpack and travel gear, open road ahead, free adventurous expression', cheerTemplate: '旅人のように、人生の道をのびのびと歩いていこう！' },
  { nameTemplate: '{theme}の料理人', promptDesc: 'cooking chef cook, kitchen scene, preparing delicious food with care, apron and tools', cheerTemplate: '料理人のように、毎日の積み重ねが最高の一品を生み出す！' },
  { nameTemplate: '{theme}の鍛冶師', promptDesc: 'blacksmith forge worker, hammer and anvil, metal crafting sparks, strong hardworking arms', cheerTemplate: '鍛冶師のように、叩き続ければ必ず最高の刃が生まれる！' },
  { nameTemplate: '{theme}の書記', promptDesc: 'scribe secretary writer, carefully writing important documents, ink and paper, focused scholarly expression', cheerTemplate: '書記のように丁寧に記録を残すことで、未来が変わる！' },
  { nameTemplate: '{theme}の荷運び人', promptDesc: 'porter carrier worker, carrying heavy reliable load, strong helpful arms, determined expression', cheerTemplate: '荷運びのように、重くても一歩一歩進めば必ずゴールできる！' },
  { nameTemplate: '{theme}の掃除人', promptDesc: 'cleaner sweeper worker, maintaining order and cleanliness, tidy environment, simple work uniform', cheerTemplate: 'きれいにすることで心もスッキリ！今日もリフレッシュしていこう！' },
  { nameTemplate: '{theme}の花売り', promptDesc: 'flower seller vendor, colorful blooms and bouquets, cheerful bright smile, market street', cheerTemplate: '花売りの笑顔のように、あなたの明るさが周りを元気にする！' },
  { nameTemplate: '{theme}の占い師', promptDesc: 'street fortune teller, crystal ball tarot cards, mysterious candlelit atmosphere, colorful scarves', cheerTemplate: '占い師のように、未来はあなたが作るもの！今日の一歩が明日を変える！' },
  { nameTemplate: '{theme}の画家', promptDesc: 'novice painter artist, canvas and brush, colorful expressive palette, inspired creative expression', cheerTemplate: '画家のように、あなたの人生に自分だけの色を描こう！' },
  { nameTemplate: '{theme}の歌い手', promptDesc: 'singer performer vocalist, stage presence spotlight, emotional singing expression, microphone or instrument', cheerTemplate: '歌い手のように、あなたの声と行動が誰かの心に届く！' },
  { nameTemplate: '{theme}の子供', promptDesc: 'adventurous curious child, innocent wonder and joy, exploring and discovering world, playful bright expression', cheerTemplate: '子供の頃の純粋な好奇心で、今日も新しいことに挑戦しよう！' },
  { nameTemplate: '{theme}の老人', promptDesc: 'wise experienced elder senior, life wisdom and calm, peaceful content expression, long journey behind', cheerTemplate: '長年の経験を積んだ老人のように、焦らず確実に積み重ねよう！' },

  // 新規追加：美女系モチーフ（40件）
  { nameTemplate: '{theme}の看板娘', promptDesc: 'cute tavern waitress girl, traditional apron dress, holding wooden beer mug tray, friendly bright smile', cheerTemplate: '笑顔で明るく過ごせば、良い引き寄せがたくさん起こるよ！' },
  { nameTemplate: '{theme}の見習い魔女っ子', promptDesc: 'cute novice witch girl, slightly oversized hat, small magic wand, clumsy cute pose, cheerful face', cheerTemplate: '失敗しても大丈夫！何度も挑戦することが成功への道！' },
  { nameTemplate: '{theme}の街角のパン屋娘', promptDesc: 'baker girl, flour smudges on cheek, carrying basket of freshly baked bread, sunlit bakery, warm smile', cheerTemplate: '温かい気持ちを忘れずに。今日も一日元気にいこう！' },
  { nameTemplate: '{theme}の図書委員の少女', promptDesc: 'librarian girl, round spectacles, holding stack of thick books, warm wooden library light, gentle expression', cheerTemplate: '知識を一つ一つ積み重ねて、理想の自分に近づこう！' },
  { nameTemplate: '{theme}の街の踊り子ちゃん', promptDesc: 'town dancer girl, simple colorful skirt, tambourine in hand, energetic happy expression', cheerTemplate: '踊るように軽やかに！楽しんだもん勝ちだよ！' },
  { nameTemplate: '{theme}の受付嬢', promptDesc: 'guild receptionist girl, neat uniform, welcoming gesture, guild hall background, polite professional smile', cheerTemplate: 'どんなリクエストもスマートに処理！今日も元気に業務スタート！' },
  { nameTemplate: '{theme}の裁縫師の少女', promptDesc: 'seamstress girl, tape measure around neck, holding colorful fabric and needle, cozy workshop', cheerTemplate: '丁寧な手仕事のように、一日を大切に紡いでいこう！' },
  { nameTemplate: '{theme}の木こりの娘', promptDesc: 'lumberjack daughter girl, flannel shirt, carrying small hatchet, forest background, healthy bright smile', cheerTemplate: '元気いっぱいに！力を合わせて乗り越えていこう！' },
  { nameTemplate: '{theme}の宿屋の手伝いちゃん', promptDesc: 'inn helper girl, carrying folded clean towels, cozy fireplace background, welcoming gentle face', cheerTemplate: 'ちょっとひといき。しっかり休んでエネルギーをチャージしよう！' },
  { nameTemplate: '{theme}の花壇のお世話係', promptDesc: 'gardener girl, straw hat, watering can, blooming flower garden, sunbeams, happy peaceful smile', cheerTemplate: 'コツコツ水やりをするように、毎日の継続が成果を咲かせる！' },
  { nameTemplate: '{theme}の給仕係の少女', promptDesc: 'serving maid girl, neat black and white maid dress, carrying tea set tray, polite posture', cheerTemplate: '気配りを大切に。丁寧な姿勢が最高の成果を生むよ！' },
  { nameTemplate: '{theme}の果物摘みの少女', promptDesc: 'fruit picker girl, sun hat, apron filled with fresh apples, orchard background, bright cheerful grin', cheerTemplate: '実りの秋はすぐそこ！これまでの頑張りを収穫しよう！' },
  { nameTemplate: '{theme}のひよこ騎士ちゃん', promptDesc: 'cute novice female knight, slightly heavy helmet, wooden sword, eager determined smile', cheerTemplate: '最初の第一歩は誰だって初心者。堂々と挑戦しよう！' },
  { nameTemplate: '{theme}の市場の看板娘', promptDesc: 'market vendor girl, holding fresh sunflowers, vibrant market stalls, lively friendly posture', cheerTemplate: '周りまで明るくする笑顔で、今日を楽しく乗り切ろう！' },
  { nameTemplate: '{theme}の風車小屋の少女', promptDesc: 'windmill girl, simple overalls, braided hair, clear blue sky background, waving hand warmly', cheerTemplate: '風向きに合わせてのびのびと。マイペースに進もう！' },
  { nameTemplate: '{theme}の貝殻集めの少女', promptDesc: 'beach girl, light summer dress, holding basket of colorful sea shells, sunny beach, gentle smile', cheerTemplate: '日常の中の小さな幸せを宝物のように見つけよう！' },
  { nameTemplate: '{theme}の修道女見習い', promptDesc: 'novice nun, simple black and white veil, clasping hands in prayer, quiet chapel background, calm face', cheerTemplate: '穏やかな心で。自分の軸を大切に一日を過ごそう！' },
  { nameTemplate: '{theme}の羊飼いの少女', promptDesc: 'shepherd girl, wooden staff, surrounded by fluffy sheep, green meadow, peaceful smile', cheerTemplate: 'のんびり着実に。焦らず歩めば目的地に着くよ！' },
  { nameTemplate: '{theme}の調剤師の助手', promptDesc: 'apothecary assistant girl, measuring dried herbs, glass jars background, focused earnest look', cheerTemplate: '正確で丁寧な作業が信頼を作る。着実にいこう！' },
  { nameTemplate: '{theme}の郵便配達の少女', promptDesc: 'mail carrier girl, leather satchel, riding bicycle, waving hand, cheerful active posture', cheerTemplate: '良い報せを届けるように、爽やかなエネルギーで進もう！' },
  { nameTemplate: '{theme}の牛乳売りの少女', promptDesc: 'milkmaid girl, carrying metal milk pail, farm backdrop with cows, healthy glowing smile', cheerTemplate: 'フレッシュな気持ちでスタート！今日も一日がんばろう！' },
  { nameTemplate: '{theme}の時計塔のお掃除ちゃん', promptDesc: 'clock tower cleaner girl, broom in hand, giant clock gears background, cheerful working pose', cheerTemplate: 'すっきり整理整頓！気持ちよくクリアしていこう！' },
  { nameTemplate: '{theme}の音楽家見習い', promptDesc: 'apprentice musician girl, carrying violin case, park bench background, inspired bright face', cheerTemplate: 'あなただけの音色を響かせて。自分らしさを出していこう！' },
  { nameTemplate: '{theme}の洗濯屋の少女', promptDesc: 'laundry girl, hanging fresh white linens, river bank background, sparkling sunshine smile', cheerTemplate: '心をリフレッシュ！まっさらな気分で再スタート！' },
  { nameTemplate: '{theme}の星観察の少女', promptDesc: 'stargazer girl, cozy blanket, sitting under night sky, looking up at shooting star, peaceful smile', cheerTemplate: '今夜はゆっくり休んで、明日また輝こう！' },
  { nameTemplate: '{theme}の靴磨きの少女', promptDesc: 'shoe shine girl, sitting by stool, polishing leather boot, cheerful hardworking grin', cheerTemplate: '足元をしっかり磨けば、素敵な場所へ行けるよ！' },
  { nameTemplate: '{theme}の提灯売りの少女', promptDesc: 'lantern seller girl, holding glowing paper lantern, night market street, warm orange glow on face', cheerTemplate: '小さな灯りでも温かく周りを照らすことができるよ！' },
  { nameTemplate: '{theme}の飴売りちゃん', promptDesc: 'candy vendor girl, glass jar of colorful sweets, market crowd background, sweet cute smile', cheerTemplate: '甘いもので一息つきながら、楽しく進もう！' },
  { nameTemplate: '{theme}の絵描き見習い', promptDesc: 'apprentice painter girl, smudge of paint on nose, holding palette and brush, colorful canvas', cheerTemplate: '自由に表現してOK！あなたらしい一日を描こう！' },
  { nameTemplate: '{theme}のハーブ園の少女', promptDesc: 'herb garden girl, bouquet of lavender, green greenhouse, pleasant peaceful expression', cheerTemplate: '心地よいペースを保って、自分を労わりながらいこう！' },
  { nameTemplate: '{theme}のサーカス見習いちゃん', promptDesc: 'circus apprentice girl, colorful costume, balancing ball, energetic happy face', cheerTemplate: 'バランス良く柔軟に！変化を楽しんでいこう！' },
  { nameTemplate: '{theme}の釣り好き少女', promptDesc: 'fishing girl, straw hat, sitting on wooden pier with fishing rod, calm water, relaxed smile', cheerTemplate: '焦らず気長に待つことも大切。チャンスは必ず来る！' },
  { nameTemplate: '{theme}の紅茶係の少女', promptDesc: 'tea maker girl, pouring hot tea from teapot, cozy cafe, warm welcoming face', cheerTemplate: 'ホッと一呼吸置いて、リフレッシュして臨もう！' },
  { nameTemplate: '{theme}の鉱山街の少女', promptDesc: 'mining town girl, holding small glowing crystal, lantern light, curious bright eyes', cheerTemplate: '原石を磨くように、日々の経験があなたを輝かせる！' },
  { nameTemplate: '{theme}の落ち葉集めの少女', promptDesc: 'autumn girl, rake in hand, pile of colorful maple leaves, crisp autumn air, happy smile', cheerTemplate: '季節の移ろいを楽しみながら、マイペースにいこう！' },
  { nameTemplate: '{theme}の船乗りの娘', promptDesc: 'sailor girl, blue collar shirt, tied ropes, ship deck background, bright sea breeze smile', cheerTemplate: '元気いっぱいに海へ出よう！冒険は始まったばかり！' },
  { nameTemplate: '{theme}のガラス細工の助手', promptDesc: 'glass craft girl, glass blowing tool, colorful glowing glass ornaments, focused bright smile', cheerTemplate: '繊細な美しさを大切に。自分磨きを楽しもう！' },
  { nameTemplate: '{theme}の雨宿りの少女', promptDesc: 'girl sheltering from rain, umbrella, hydrangeas, rainbow emerging through clouds, peaceful smile', cheerTemplate: '雨の後は必ず晴れる！希望を持って進もう！' },
  { nameTemplate: '{theme}の木彫り職人の娘', promptDesc: 'woodcarving girl, small wooden bird figure in hand, cozy workshop, proud happy smile', cheerTemplate: '形が見えてくるまでコツコツと。成果はもうすぐ！' },
  { nameTemplate: '{theme}の雪だるま作りの少女', promptDesc: 'winter girl, knitted scarf and mittens, standing by cute snowman, snowy park, blushing happy smile', cheerTemplate: 'ワクワクする気持ちを大切に、今日も一日楽しもう！' },
];

export function generateSeasonCards(theme: string, seasonId: string): CardMaster[] {
  const rng = seededRng(hashStr(seasonId));

  const entries: { rarity: Rarity; archetype: Archetype }[] = [
    ...pickN(SSR_POOL, SEASON_COUNTS.SSR, rng).map(a => ({ rarity: 'SSR' as Rarity, archetype: a })),
    ...pickN(SR_POOL,  SEASON_COUNTS.SR,  rng).map(a => ({ rarity: 'SR'  as Rarity, archetype: a })),
    ...pickN(R_POOL,   SEASON_COUNTS.R,   rng).map(a => ({ rarity: 'R'   as Rarity, archetype: a })),
    ...pickN(N_POOL,   SEASON_COUNTS.N,   rng).map(a => ({ rarity: 'N'   as Rarity, archetype: a })),
  ];

  return entries.map((e, idx) => ({
    id: `${seasonId}_${String(idx + 1).padStart(3, '0')}`,
    name: e.archetype.nameTemplate.replace(/\{theme\}/g, theme),
    rarity: e.rarity,
    prompt: `${e.archetype.promptDesc}, ${theme} world and setting, ${theme} themed environment`,
    cheerMessage: e.archetype.cheerTemplate.replace(/\{theme\}/g, theme),
  }));
}