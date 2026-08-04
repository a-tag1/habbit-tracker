import type { CardMaster, Rarity } from '../types';

const ARCHETYPES: { rarity: Rarity; nameTemplate: string; promptDesc: string; cheerTemplate: string }[] = [
  // SSR (2)
  { rarity: 'SSR', nameTemplate: '{theme}の覇王', promptDesc: 'supreme tyrant overlord, overwhelming power, dominating dark throne, majestic terrifying presence', cheerTemplate: '{theme}の覇王のように、今日もすべてを制しよう！限界を超えろ！' },
  { rarity: 'SSR', nameTemplate: '天地の{theme}神', promptDesc: 'supreme divine deity god, transcendent ethereal cosmic form, sacred celestial manifestation, heavenly realm', cheerTemplate: '天地を揺るがす力があなたの中に宿っている。今日も全力で挑もう！' },
  // SR (6)
  { rarity: 'SR', nameTemplate: '{theme}の英雄', promptDesc: 'legendary champion hero, glorious power, noble heroic dramatic pose, brilliant lighting', cheerTemplate: '{theme}の英雄があなたを応援している！どんな困難も必ず乗り越えられる！' },
  { rarity: 'SR', nameTemplate: '{theme}の女王', promptDesc: 'powerful queen ruler, regal majestic presence, commanding authority, ornate royal crown and gown', cheerTemplate: '女王の品格で今日の壁を打ち破ろう！あなたなら絶対できる！' },
  { rarity: 'SR', nameTemplate: '{theme}の守護者', promptDesc: 'sacred guardian protector, shielding defensive stance, holy protective aura, stalwart defender armor', cheerTemplate: '守護者があなたを見守っている。自信を持って前へ進め！' },
  { rarity: 'SR', nameTemplate: '{theme}の大賢者', promptDesc: 'ancient grand sage wiseman, deep mystical knowledge, arcane glowing aura, ancient scrolls and staff', cheerTemplate: '知恵こそが最強の武器。今日も一つでも多くを学ぼう！' },
  { rarity: 'SR', nameTemplate: '{theme}の剣聖', promptDesc: 'sword saint master swordsman, ultimate blade technique, serene concentrated expression, swift movement blur', cheerTemplate: '一撃に魂を込めるように、今日の一歩に全力を尽くそう！' },
  { rarity: 'SR', nameTemplate: '{theme}の魔王', promptDesc: 'demon lord dark powerful ruler, terrifying commanding aura, shadowy dark kingdom throne, menacing presence', cheerTemplate: '魔王の不屈の意志で、今日も最高の結果を掴み取ろう！' },
  // R (15)
  { rarity: 'R', nameTemplate: '{theme}の戦士', promptDesc: 'skilled battle warrior fighter, combat-ready powerful stance, determined fierce expression, decorated armor and weapon', cheerTemplate: '戦士の勇気を持って、今日の挑戦に立ち向かおう！' },
  { rarity: 'R', nameTemplate: '{theme}の魔法使い', promptDesc: 'talented mage sorcerer, casting powerful spell, swirling colorful magical energy, focused determined expression', cheerTemplate: '魔法のように、あなたの努力は必ず世界を変える！' },
  { rarity: 'R', nameTemplate: '{theme}の探偵', promptDesc: 'clever detective investigator, sharp analyzing eyes, magnifying glass clue, intellectual observant pose', cheerTemplate: '探偵のように物事をよく見つめれば、答えは必ず見つかる！' },
  { rarity: 'R', nameTemplate: '{theme}の射手', promptDesc: 'precise archer marksman, drawing longbow focused aim, swift athletic movement, arrows ready', cheerTemplate: '目標を定めたら一直線！あなたの矢は必ず届く！' },
  { rarity: 'R', nameTemplate: '{theme}の冒険家', promptDesc: 'bold explorer adventurer, expedition gear backpack, map in hand, confident discovering smile', cheerTemplate: '冒険家の心で、今日も新しい世界を切り開こう！' },
  { rarity: 'R', nameTemplate: '{theme}の忍者', promptDesc: 'stealthy ninja shinobi, shadow acrobatic movement, hidden blade ready, swift silent pose', cheerTemplate: '忍者のように、コツコツと実力を積み上げていこう！' },
  { rarity: 'R', nameTemplate: '{theme}の騎士', promptDesc: 'honorable knight paladin, shining plate armor, noble stance, shield and sword raised', cheerTemplate: '騎士の誇りを胸に、今日も正々堂々と頑張ろう！' },
  { rarity: 'R', nameTemplate: '{theme}の治癒師', promptDesc: 'skilled healer physician, caring warm expression, healing light magic hands, gentle compassionate', cheerTemplate: '治癒師の温かい心で、今日も自分と周りを元気づけよう！' },
  { rarity: 'R', nameTemplate: '{theme}の盗賊', promptDesc: 'nimble thief rogue, light-footed sneaky movement, treasure bag, clever mischievous grin', cheerTemplate: '盗賊のように素早く、チャンスを逃さず掴み取ろう！' },
  { rarity: 'R', nameTemplate: '{theme}の吟遊詩人', promptDesc: 'charming bard performer, playing musical instrument, inspiring captivating stage presence, audience enchanted', cheerTemplate: '詩人のように、あなたの言葉と行動が誰かを元気にする！' },
  { rarity: 'R', nameTemplate: '{theme}の錬金術士', promptDesc: 'brilliant alchemist inventor, glowing colorful potions laboratory, experimental spirit, steam goggles', cheerTemplate: '錬金術師のように、努力を重ねれば必ず金になる！' },
  { rarity: 'R', nameTemplate: '{theme}の船長', promptDesc: 'bold captain leader, commanding confident pose on ship deck, adventure spirit, compass and map', cheerTemplate: '船長として仲間を導くように、あなたも輝ける！' },
  { rarity: 'R', nameTemplate: '{theme}の巫女', promptDesc: 'shrine maiden priestess, spiritual sacred power, ritual ceremony, glowing sacred artifacts and orbs', cheerTemplate: '巫女の祈りのように、あなたの願いは必ず天に届く！' },
  { rarity: 'R', nameTemplate: '{theme}の竜使い', promptDesc: 'dragon tamer beast master, powerful dragon companion beside, wild adventurous spirit, commanding presence', cheerTemplate: '竜を操るように、あなたも大きな力を持っている！' },
  { rarity: 'R', nameTemplate: '{theme}の狩人', promptDesc: 'skilled hunter tracker, keen wilderness expertise, camouflage gear, focused intense expression', cheerTemplate: '狩人の鋭い目で目標を定め、今日も着実に進もう！' },
  // N (27)
  { rarity: 'N', nameTemplate: '{theme}の見習い', promptDesc: 'eager apprentice trainee, beginner enthusiasm, learning experience, simple humble outfit', cheerTemplate: '見習いから始まっても、続けることで必ず一人前になれる！' },
  { rarity: 'N', nameTemplate: '{theme}の村人', promptDesc: 'common villager townsperson, everyday ordinary life, simple practical clothes, gentle expression', cheerTemplate: '普通の毎日の積み重ねが、いつか大きな力になる！' },
  { rarity: 'N', nameTemplate: '{theme}の農夫', promptDesc: 'hardworking farmer, cultivating fertile land, simple farming tools, outdoor honest work', cheerTemplate: '農夫のように、一つ一つ丁寧に育てれば必ず実を結ぶ！' },
  { rarity: 'N', nameTemplate: '{theme}の漁師', promptDesc: 'patient fisherman, peaceful waterside scene, fishing rod and net, relaxed warm smile', cheerTemplate: '漁師のように焦らず待てば、必ず大きな成果が得られる！' },
  { rarity: 'N', nameTemplate: '{theme}の行商人', promptDesc: 'small merchant shopkeeper, colorful market stall goods, friendly welcoming smile, lively trading', cheerTemplate: '行商人のように出会いを大切に、今日も前へ進もう！' },
  { rarity: 'N', nameTemplate: '{theme}の番兵', promptDesc: 'dutiful guard sentinel, standing watch post diligently, simple honest armor, alert expression', cheerTemplate: '番兵のように自分の持ち場を守れば、周りが安心できる！' },
  { rarity: 'N', nameTemplate: '{theme}の使者', promptDesc: 'swift messenger courier, carrying important delivery, determined purposeful expression, on the move', cheerTemplate: '使者のように、大切なことをしっかり届けよう！' },
  { rarity: 'N', nameTemplate: '{theme}の職人', promptDesc: 'skilled craftsman artisan, workshop setting, careful precise handcraft work, quality goods', cheerTemplate: '職人の技は一日にしてならず。今日もコツコツ磨いていこう！' },
  { rarity: 'N', nameTemplate: '{theme}の旅人', promptDesc: 'wandering free traveler, backpack and travel gear, open road ahead, free adventurous expression', cheerTemplate: '旅人のように、人生の道をのびのびと歩いていこう！' },
  { rarity: 'N', nameTemplate: '{theme}の料理人', promptDesc: 'cooking chef cook, kitchen scene, preparing delicious food with care, apron and tools', cheerTemplate: '料理人のように、毎日の積み重ねが最高の一品を生み出す！' },
  { rarity: 'N', nameTemplate: '{theme}の鍛冶師', promptDesc: 'blacksmith forge worker, hammer and anvil, metal crafting sparks, strong hardworking arms', cheerTemplate: '鍛冶師のように、叩き続ければ必ず最高の刃が生まれる！' },
  { rarity: 'N', nameTemplate: '{theme}の書記', promptDesc: 'scribe secretary writer, carefully writing important documents, ink and paper, focused scholarly expression', cheerTemplate: '書記のように丁寧に記録を残すことで、未来が変わる！' },
  { rarity: 'N', nameTemplate: '{theme}の荷運び人', promptDesc: 'porter carrier worker, carrying heavy reliable load, strong helpful arms, determined expression', cheerTemplate: '荷運びのように、重くても一歩一歩進めば必ずゴールできる！' },
  { rarity: 'N', nameTemplate: '{theme}の掃除人', promptDesc: 'cleaner sweeper worker, maintaining order and cleanliness, tidy environment, simple work uniform', cheerTemplate: 'きれいにすることで心もスッキリ！今日もリフレッシュしていこう！' },
  { rarity: 'N', nameTemplate: '{theme}の花売り', promptDesc: 'flower seller vendor, colorful blooms and bouquets, cheerful bright smile, market street', cheerTemplate: '花売りの笑顔のように、あなたの明るさが周りを元気にする！' },
  { rarity: 'N', nameTemplate: '{theme}の占い師', promptDesc: 'street fortune teller, crystal ball tarot cards, mysterious candlelit atmosphere, colorful scarves', cheerTemplate: '占い師のように、未来はあなたが作るもの！今日の一歩が明日を変える！' },
  { rarity: 'N', nameTemplate: '{theme}の画家', promptDesc: 'novice painter artist, canvas and brush, colorful expressive palette, inspired creative expression', cheerTemplate: '画家のように、あなたの人生に自分だけの色を描こう！' },
  { rarity: 'N', nameTemplate: '{theme}の歌い手', promptDesc: 'singer performer vocalist, stage presence spotlight, emotional singing expression, microphone or instrument', cheerTemplate: '歌い手のように、あなたの声と行動が誰かの心に届く！' },
  { rarity: 'N', nameTemplate: '{theme}の子供', promptDesc: 'adventurous curious child, innocent wonder and joy, exploring and discovering world, playful bright expression', cheerTemplate: '子供の頃の純粋な好奇心で、今日も新しいことに挑戦しよう！' },
  { rarity: 'N', nameTemplate: '{theme}の老人', promptDesc: 'wise experienced elder senior, life wisdom and calm, peaceful content expression, long journey behind', cheerTemplate: '長年の経験を積んだ老人のように、焦らず確実に積み重ねよう！' },
  { rarity: 'N', nameTemplate: '{theme}の踊り子', promptDesc: 'graceful dancer performer, dynamic flowing movement, colorful expressive costume, emotional dance expression', cheerTemplate: '踊り子のように、あなたの努力が美しい動きとなって現れる！' },
  { rarity: 'N', nameTemplate: '{theme}の灯台守', promptDesc: 'lighthouse keeper guardian, ocean view from tower, guiding light darkness, solitary peaceful dedication', cheerTemplate: '灯台守のように、あなたの存在が誰かの道標になっている！' },
  { rarity: 'N', nameTemplate: '{theme}の庭師', promptDesc: 'garden caretaker gardener, nurturing plants and flowers, peaceful outdoor work, watering can', cheerTemplate: '庭師のように、丁寧にお手入れすれば必ず美しい花が咲く！' },
  { rarity: 'N', nameTemplate: '{theme}の果物売り', promptDesc: 'fruit vendor seller, colorful fresh produce arrangement, cheerful market outdoor scene, vibrant energy', cheerTemplate: '果物売りのように、今日も元気よく声を上げて前進しよう！' },
];

export function generateSeasonCards(theme: string, seasonId: string): CardMaster[] {
  return ARCHETYPES.map((archetype, idx) => ({
    id: `${seasonId}_${String(idx + 1).padStart(3, '0')}`,
    name: archetype.nameTemplate.replace(/\{theme\}/g, theme),
    rarity: archetype.rarity,
    prompt: `${archetype.promptDesc}, ${theme} world and setting, ${theme} themed environment`,
    cheerMessage: archetype.cheerTemplate.replace(/\{theme\}/g, theme),
  }));
}
