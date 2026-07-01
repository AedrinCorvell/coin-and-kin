import React, { useState, useEffect, useRef, useCallback } from "react";
/* ============================================================================
   GUILDMASTER — "Of Coin and Kin"  ·  tek dosyalık kaynak
   ----------------------------------------------------------------------------
   İÇİNDEKİLER  (bir bölümü aramak için başlıktaki §etiketini ara: örn. "§DATA")
   ----------------------------------------------------------------------------
   §I18N       Dil sistemi, STR sözlüğü, t()                       (~satır 25)
   §AUDIO      Tone.js müzik/ses motoru                            (~satır 230)
   §DATA       Sınıflar, özellikler, isimler, bölgeler, eşyalar,
               tarifler, binalar, pazar — oyunun "veritabanı"       (~satır 340)
   §I18N-DATA  İçerik çevirileri (TR_ITEM, TR_REGION, ... )          (~satır 555)
   §HELPERS    Genel yardımcılar, fiyat, tehlike renkleri           (~satır 880)
   §LOGIC      İlişkiler, takım, maceracı üretimi, sonuç tahmini    (~satır 905)
   §EVENTS     Küçük/büyük/efsanevi/zincir olaylar                  (~satır 1075)
   §BOSSES     (İSKELET HAZIR) Bölge boss'ları — mini & epik        (~satır 1465)
   §ACHIEVE    (İSKELET HAZIR) Başarımlar                           (~satır 1475)
   §THEME      T renk teması, font, SAVE_KEY                        (~satır 1455)
   §ROOT       Ana Guildmaster() bileşeni + oyun döngüsü            (~satır 1465)
   §UI         Ekranlar: Intro, Hall, Adventurers, Quests, Craft,
               Market, Storage, Upgrades + ortak bileşenler         (~satır 2025)
   ----------------------------------------------------------------------------
   NOT: Satır numaraları yaklaşıktır; düzenlemelerle kayabilir. Bölümü bulmak
   için numara yerine §etiketini aratmak daha güvenlidir.
   ============================================================================ */
const INTRO_BG = ""; // (eski gömülü görsel kaldırıldı; sahne artık CSS ile çiziliyor)
const INTRO_BG_STYLE = {
  background:
    "radial-gradient(120% 80% at 50% 108%, rgba(255,150,55,.30), rgba(255,120,40,.10) 38%, transparent 60%),"+
    "radial-gradient(90% 60% at 50% -10%, rgba(90,110,150,.22), transparent 55%),"+
    "repeating-linear-gradient(0deg, rgba(0,0,0,.32) 0 2px, transparent 2px 64px),"+
    "repeating-linear-gradient(90deg, rgba(0,0,0,.28) 0 2px, transparent 2px 132px),"+
    "linear-gradient(180deg, #241a13 0%, #2c2017 45%, #1c140d 100%)",
  backgroundColor: "#1c140d",
};

// ==================== §I18N · LANGUAGE / DİL SİSTEMİ ====================
// Simple two-language system. LANG holds the current language; t(key) looks up
// the string. Falls back to the key itself if a translation is missing, so the
// game never breaks even before every string is translated.
let LANG = "tr"; // default Turkish; toggled in Settings
try { const sv = (typeof localStorage!=="undefined") && localStorage.getItem("guildmaster_lang"); if(sv==="tr"||sv==="en") LANG = sv; } catch(e){}
function setLang(l){ LANG = l; try{ localStorage.setItem("guildmaster_lang", l); }catch(e){} }

const STR = {
  // ---- bottom navigation tabs ----
  "tab.hall":      { en:"Hall",       tr:"Salon" },
  "tab.advs":      { en:"Advs",       tr:"Maceracılar" },
  "tab.quests":    { en:"Quests",     tr:"Görevler" },
  "tab.craft":     { en:"Craft",      tr:"Üretim" },
  "tab.market":    { en:"Market",     tr:"Pazar" },
  "tab.store":     { en:"Store",      tr:"Depo" },
  "tab.build":     { en:"Build",      tr:"İnşa" },
  // ---- hall / dashboard ----
  "hall.adventurers": { en:"Adventurers", tr:"Maceracılar" },
  "hall.expeditions": { en:"Expeditions", tr:"Seferler" },
  "hall.crafting":    { en:"Crafting",    tr:"Üretim" },
  "hall.storage":     { en:"Storage",     tr:"Depo" },
  "hall.itemsHeld":   { en:"items held",  tr:"eşya var" },
  "hall.idle":        { en:"idle",        tr:"boşta" },
  "hall.away":        { en:"away",        tr:"görevde" },
  "hall.tapDispatch": { en:"tap to dispatch", tr:"sefere yolla" },
  "hall.inProgress":  { en:"in progress",  tr:"devam ediyor" },
  "hall.ledger":      { en:"Guild Ledger", tr:"Lonca Defteri" },
  "hall.recentFirst": { en:"Most recent first", tr:"En yeni en üstte" },
  "hall.ledgerEmpty": { en:"The guild's story will be recorded here.", tr:"Loncanın hikâyesi burada kayda geçecek." },
  "hall.dayExplain":  { en:"Each day (the clock up top) ends a pay cycle: adventurers pay you rent & board, and you pay their wages. Keep income above wages.", tr:"Her gün (yukarıdaki saat) bir ödeme döngüsünü kapatır: maceracılar sana kira ve yemek öder, sen de onlara maaş ödersin. Gelirini maaşların üstünde tut." },
  "hall.fallenHero":  { en:"fallen hero remembered", tr:"düşmüş kahraman anılıyor" },
  "hall.fallenHeroes":{ en:"fallen heroes remembered", tr:"düşmüş kahraman anılıyor" },
  "hall.gettingStarted": { en:"Getting Started", tr:"Başlangıç" },
  "hall.quote": { en:"\"A guild is only as strong as the souls who drink in its tavern and bleed in its name. Mind them well, Guildmaster.\"",
                  tr:"\"Bir lonca, meyhanesinde içen ve adı uğruna kan döken ruhları kadar güçlüdür. Onlara iyi bak, Lonca Efendisi.\"" },
  // step-by-step onboarding
  "step.hire.txt":  { en:"Hire your first adventurer from the Recruitment Board.", tr:"İlan Tahtası'ndan ilk maceracını işe al." },
  "step.hire.cta":  { en:"Recruit", tr:"İşe Al" },
  "step.disp.txt":  { en:"Send an adventurer on an expedition to gather loot.", tr:"Ganimet toplamak için bir maceracıyı sefere yolla." },
  "step.disp.cta":  { en:"Dispatch", tr:"Yolla" },
  "step.craft.txt": { en:"Craft your loot into goods worth more at market.", tr:"Ganimetini pazarda daha değerli mallara dönüştür." },
  "step.craft.cta": { en:"Craft", tr:"Üret" },
  "step.sell.txt":  { en:"Sell your finished goods at the Market for gold.", tr:"Ürettiğin malları Pazar'da altına sat." },
  "step.sell.cta":  { en:"Sell", tr:"Sat" },
  // ---- common buttons / labels ----
  "ui.settings":   { en:"Settings",      tr:"Ayarlar" },
  "ui.language":   { en:"Language",      tr:"Dil" },
  "ui.close":      { en:"Close",         tr:"Kapat" },
  "ui.cancel":     { en:"Cancel",        tr:"Vazgeç" },
  "ui.confirm":    { en:"Confirm",       tr:"Onayla" },
  "ui.save":       { en:"Save / Load Guild", tr:"Loncayı Kaydet / Yükle" },
  "ui.legends":    { en:"Hall of Legends", tr:"Efsaneler Salonu" },
  "ui.newGuild":   { en:"Start New Guild", tr:"Yeni Lonca Kur" },
  "ui.sfx":        { en:"Sound effects",  tr:"Ses efektleri" },
  "ui.music":      { en:"Music",          tr:"Müzik" },
  "ui.musicHint":  { en:"A warm lute plays by the hearth. Toggle anytime.", tr:"Ocağın başında sıcak bir lavta çalar. İstediğin an aç/kapat." },
  "ui.guild":      { en:"Guild",          tr:"Lonca" },
  "ui.newGuildConfirm": { en:"Abandon this guild and start fresh? This cannot be undone.", tr:"Bu loncayı bırakıp sıfırdan başlamak istiyor musun? Bu geri alınamaz." },
  "ui.newGuildDone": { en:"A new guild begins.", tr:"Yeni bir lonca kuruldu." },
  "ui.startNew":   { en:"Start New",      tr:"Başlat" },
  "ui.tagline":    { en:"an adventurers' guild", tr:"bir maceracılar loncası" },
  // ---- top bar ----
  "top.defaultName": { en:"The Ashford Guild", tr:"Ashford Loncası" },
  "top.day":        { en:"DAY",     tr:"GÜN" },
  "top.renown":     { en:"renown",  tr:"şöhret" },
  "top.goldUnit":   { en:"G",       tr:"A" },
  "top.nextPayday": { en:"Next payday in", tr:"Sonraki ödeme" },
  "guildrank.0":    { en:"Novice Guild",     tr:"Acemi Loncası" },
  "guildrank.1":    { en:"Apprentice Guild", tr:"Çırak Loncası" },
  "guildrank.2":    { en:"Journeyman Guild", tr:"Kalfa Loncası" },
  "guildrank.3":    { en:"Veteran Guild",    tr:"Kıdemli Lonca" },
  "guildrank.4":    { en:"Master Guild",     tr:"Usta Loncası" },
  "guildrank.5":    { en:"Legendary Guild",  tr:"Efsanevi Lonca" },
  // ---- adventurers view ----
  "adv.combatStats":  { en:"Combat Stats", tr:"Savaş Nitelikleri" },
  "adv.classPerk":    { en:"Class Perk",   tr:"Sınıf Yeteneği" },
  "adv.relationships":{ en:"Relationships", tr:"İlişkiler" },
  "adv.relSub":       { en:"Bonds form on shared expeditions and over time at the hall", tr:"Bağlar ortak seferlerde ve loncada zamanla kurulur" },
  "adv.yours":        { en:"Your Adventurers", tr:"Maceracıların" },
  "adv.housed":       { en:"housed · tap a card for full stats", tr:"barınıyor · tüm bilgiler için karta dokun" },
  "adv.recruitBoard": { en:"Recruitment Board", tr:"İşe Alım Tahtası" },
  "adv.keepThem":     { en:"Keep them", tr:"Vazgeç" },
  "adv.noBonds":      { en:"No strong bonds yet.", tr:"Henüz güçlü bir bağ yok." },
  "adv.noBondsHint":  { en:"Send {name} on expeditions with others to build them.", tr:"Bağ kurmak için {name} adlı üyeyi başkalarıyla sefere yolla." },
  // ---- quests view ----
  "quest.inProgress": { en:"In Progress", tr:"Süren Seferler" },
  "quest.active":     { en:"expeditions active", tr:"sefer sürüyor" },
  "quest.regions":    { en:"Available Regions", tr:"Erişilebilir Bölgeler" },
  "quest.tier":       { en:"Guild tier", tr:"Lonca kademesi" },
  "quest.idle":       { en:"idle", tr:"boşta" },
  "quest.intro1":     { en:"Pick a region, choose a party, and dispatch. Tougher regions risk injury & death but yield richer loot.", tr:"Bir bölge seç, ekip belirle ve sefere yolla. Zorlu bölgeler yaralanma ve ölüm riski taşır ama daha zengin ganimet verir." },
  "quest.introBold":  { en:"Class roles matter", tr:"Sınıf rolleri önemli" },
  "quest.intro2":     { en:"— Warriors shield, Clerics protect, Mages boost success, Rogues find more loot.", tr:"— Savaşçılar korur, Rahipler kollar, Büyücüler başarıyı artırır, Hırsızlar daha çok ganimet bulur." },
  "quest.advUnit":    { en:"adventurers", tr:"maceracı" },
  "quest.more":       { en:"more", tr:"tekrar kaldı" },
  "quest.loot":       { en:"Loot:", tr:"Ganimet:" },
  "quest.reachTier":  { en:"Reach guild tier {n} (upgrade Treasury)", tr:"Lonca kademesi {n}'e ulaş (Hazine'yi yükselt)" },
  // ---- party picker ----
  "pp.intro":         { en:"Pick who goes. More adventurers = more loot, but each rolls their own success. On a failed roll one can be hurt.", tr:"Kimin gideceğini seç. Daha çok maceracı = daha çok ganimet, ama her biri kendi başarısını atar. Başarısız atışta biri yaralanabilir." },
  "pp.estSuccess":    { en:"Estimated success", tr:"Tahmini başarı" },
  "pp.injuryRisk":    { en:"Injury risk (someone hurt)", tr:"Yaralanma riski (biri yaralanır)" },
  "pp.deathRisk":     { en:"Risk of death", tr:"Ölüm riski" },
  "pp.deadly":        { en:"This region is deadly. A failed expedition here can cost a life — permanently. Bring a Warrior or Cleric to lower the risk.", tr:"Bu bölge ölümcül. Başarısız bir sefer burada kalıcı olarak bir cana mal olabilir. Riski azaltmak için Savaşçı ya da Rahip götür." },
  "pp.comfortable":   { en:"This party can handle it comfortably.", tr:"Bu ekip bunu rahatça halleder." },
  "pp.doable":        { en:"Doable, but expect some failed runs.", tr:"Yapılabilir, ama bazı başarısız seferler bekle." },
  "pp.risky":         { en:"Risky — consider stronger or more adventurers, or a safer region.", tr:"Riskli — daha güçlü ya da daha çok maceracı, ya da daha güvenli bir bölge düşün." },
  "pp.teamBonus":     { en:"this seasoned band gets +{p}% success from fighting together so often.", tr:"bu pişkin takım sık birlikte savaşmaktan +%{p} başarı kazanır." },
  "pp.friction":      { en:"friction lowers the odds.", tr:"sürtüşme şansı düşürür." },
  "pp.morale":        { en:"high morale helps.", tr:"yüksek moral yardımcı olur." },
  "pp.selectToSee":   { en:"select adventurers to see your odds. A Warrior or Cleric lowers injury risk.", tr:"oranları görmek için maceracı seç. Savaşçı ya da Rahip yaralanma riskini düşürür." },
  "pp.preselected":   { en:"Your last party is pre-selected — tap Send to repeat fast.", tr:"Son ekibin önceden seçili — hızlı tekrar için Yolla'ya dokun." },
  "pp.repeat":        { en:"Repeat expedition", tr:"Seferi tekrarla" },
  "pp.repeatDesc":    { en:"Auto-runs again while the party stays healthy", tr:"Ekip sağlıklı kaldıkça otomatik tekrar eder" },
  "pp.send":          { en:"Send", tr:"Yolla" },
  "pp.repeatX":       { en:"repeat", tr:"tekrar" },
  "death.fallen":     { en:"A Hero Has Fallen", tr:"Bir Kahraman Düştü" },
  "death.lostIn":     { en:"Lost in {region}{others}. Their deeds are now carved into the Hall of Legends.", tr:"{region} bölgesinde kayboldu{others}. Yaptıkları artık Efsaneler Salonu'na kazındı." },
  "death.honor":      { en:"Honor their memory", tr:"Anısını onurlandır" },
  // ---- craft view ----
  "craft.ready":      { en:"Ready to Craft", tr:"Üretime Hazır" },
  "craft.readySub":   { en:"You have the materials for these right now", tr:"Bunlar için malzemen şu anda hazır" },
  "craft.bench":      { en:"At the Workbench", tr:"Tezgâhta" },
  "craft.recipe":     { en:"Recipe", tr:"Tarif" },
  "craft.details":    { en:"Details", tr:"Ayrıntılar" },
  "craft.jobs":       { en:"jobs", tr:"iş" },
  "craft.fasterHi":   { en:"faster at higher levels", tr:"üst seviyelerde daha hızlı" },
  "craft.locked":     { en:"🔒 Build this station in the Build tab", tr:"🔒 Bu istasyonu İnşa sekmesinden kur" },
  // ---- market view ----
  "market.sellAll":   { en:"Sell All", tr:"Hepsini Sat" },
  "market.pricesToday":{ en:"Market Prices Today", tr:"Bugünkü Pazar Fiyatları" },
  "market.pricesSub": { en:"Prices shift daily — sell high, and don't flood one market", tr:"Fiyatlar her gün değişir — yüksekken sat, tek pazarı boğma" },
  "market.sellGoods": { en:"Sell Goods", tr:"Mal Sat" },
  "market.empty":     { en:"Storeroom is empty. Send heroes on expeditions to gather goods.", tr:"Depo boş. Mal toplamak için kahramanları sefere yolla." },
  "tier.fin":         { en:"Finished Goods", tr:"Bitmiş Ürünler" },
  "tier.mid":         { en:"Refined", tr:"İşlenmiş" },
  "tier.raw":         { en:"Raw Materials", tr:"Ham Madde" },
  // ---- storage view ----
  "store.room":       { en:"Guild Storeroom", tr:"Lonca Deposu" },
  "store.roomSub":    { en:"Everything your guild currently holds", tr:"Loncanın elindeki her şey" },
  // ---- build view ----
  "build.buildings":  { en:"Guild Buildings", tr:"Lonca Yapıları" },
  "build.buildingsSub":{ en:"Invest gold to grow the guild and keep heroes happy", tr:"Loncayı büyütmek ve kahramanları mutlu tutmak için altın yatır" },
  // ---- Aşama 2: content view bits ----
  "adv.rare":         { en:"RARE", tr:"NADİR" },
  "adv.legendary":    { en:"LEGENDARY", tr:"EFSANEVİ" },
  "adv.rename":       { en:"Rename", tr:"Yeniden Adlandır" },
  "adv.save":         { en:"Save", tr:"Kaydet" },
  "adv.noneHired":    { en:"No one hired yet. Pick your founding party from the Recruitment Board below. 👇", tr:"Henüz kimse alınmadı. Kurucu ekibini aşağıdaki İşe Alım Tahtası'ndan seç. 👇" },
  "adv.promoteTo":    { en:"Promote to", tr:"Terfi:" },
  "adv.hire":         { en:"Hire", tr:"İşe Al" },
  "adv.full":         { en:"(full)", tr:"(dolu)" },
  "adv.perkParty":    { en:"(applies to the whole party on expeditions)", tr:"(seferde tüm ekibe etki eder)" },
  "adv.traits":       { en:"Traits", tr:"Özellikler" },
  "adv.twoVirtues":   { en:"gifted with two virtues", tr:"iki erdemle kutsanmış" },
  "adv.recovering":   { en:"Currently recovering from injury. Will return to duty soon.", tr:"Şu an yarasından iyileşiyor. Yakında göreve döner." },
  "adv.grievingLong": { en:"Grieving a fallen comrade — success is lowered until they heal in spirit.", tr:"Düşmüş bir yoldaşının yasını tutuyor — ruhu iyileşene dek başarısı düşük." },
  "adv.dismiss":      { en:"Dismiss {name} from the guild", tr:"{name} adlı üyeyi loncadan çıkar" },
  "adv.sort":         { en:"Sort:", tr:"Sırala:" },
  "adv.whileAtHall":  { en:"While at the hall:", tr:"Loncadayken:" },
  "sort.class":       { en:"Class", tr:"Sınıf" },
  "sort.level":       { en:"Level", tr:"Seviye" },
  "sort.status":      { en:"Status", tr:"Durum" },
  "sort.name":        { en:"Name", tr:"İsim" },
  "stat.maxHp":       { en:"Max HP", tr:"Azami Can" },
  "stat.attack":      { en:"Attack", tr:"Saldırı" },
  "stat.defense":     { en:"Defense", tr:"Savunma" },
  "stat.speed":       { en:"Speed", tr:"Hız" },
  "stat.questPace":   { en:"quest pace", tr:"sefer hızı" },
  "stat.fromTrait":   { en:"from trait", tr:"özellikten" },
  "task.rest":        { en:"Rest", tr:"Dinlen" },
  "task.train":       { en:"Train", tr:"Çalış" },
  "task.assist":      { en:"Assist", tr:"Yardım" },
  "task.patrol":      { en:"Patrol", tr:"Devriye" },
  "task.restDesc":    { en:"Recovers fatigue & slowly heals.", tr:"Yorgunluğu giderir ve yavaşça iyileşir." },
  "task.trainDesc":   { en:"Slowly gains XP — safe, free leveling.", tr:"Yavaşça TP kazanır — güvenli, bedava seviye." },
  "task.assistDesc":  { en:"Speeds up active crafting jobs.", tr:"Süren üretim işlerini hızlandırır." },
  "task.patrolDesc":  { en:"Earns a trickle of gold & renown.", tr:"Azar azar altın ve şöhret kazandırır." },
  "quest.dispatch":   { en:"Dispatch", tr:"Sefere Yolla" },
  "legend.expeditions":{ en:"expeditions", tr:"sefer" },
  "legend.fellIn":    { en:"Fell in", tr:"Düştüğü yer:" },
  "craft.sellsEach":  { en:"sells for {v}G each", tr:"tanesi {v}A değerinde" },
  "craft.craftedAt":  { en:"Crafted at the", tr:"Üretim yeri:" },
  "craft.takes":      { en:"Takes", tr:"Süre:" },
  "craft.atLevel":    { en:"at current level", tr:"(mevcut seviyede)" },
  "craft.matCost":    { en:"Material cost", tr:"Malzeme maliyeti" },
  "craft.sells":      { en:"sells", tr:"satış" },
  "craft.profit":     { en:"profit", tr:"kâr" },
  "build.max":        { en:"MAX", tr:"AZAMİ" },
  "build.upgrade":    { en:"Upgrade", tr:"Yükselt" },
  "status.onExpedition":{ en:"On expedition", tr:"Seferde" },
  "status.injured":   { en:"Injured", tr:"Yaralı" },
  "status.grieving":  { en:"Grieving", tr:"Yas tutuyor" },
  "status.resting":   { en:"Resting", tr:"Dinleniyor" },
  "status.training":  { en:"Training", tr:"Antrenmanda" },
  "status.assisting": { en:"Assisting", tr:"Yardım ediyor" },
  "status.patrolling":{ en:"Patrolling", tr:"Devriyede" },
  "status.idle":      { en:"Idle", tr:"Boşta" },
};

function t(key){
  const e = STR[key];
  if(!e) return key;               // missing key → show the key (dev hint), never crash
  return e[LANG] || e.en || key;   // current lang → english → key
}

// ==================== §AUDIO · MÜZİK & SES (Tone.js) ====================
// Loads Tone.js from CDN once; generates a warm cozy ambient loop + small SFX.
// No external audio files needed.
const Audio = {
  ready:false, loading:false, Tone:null,
  musicOn:true, sfxOn:true,
  synths:{}, loop:null, started:false,
  async ensure(){
    if(this.ready||this.loading) return;
    this.loading=true;
    await new Promise((res)=>{
      if(window.Tone){ res(); return; }
      const sc=document.createElement("script");
      sc.src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js";
      sc.onload=res; sc.onerror=res; document.head.appendChild(sc);
    });
    if(!window.Tone){ this.loading=false; return; }
    this.Tone=window.Tone;
    try{
      // warm reverb + gentle master for a fireside feel
      this.reverb=new this.Tone.Reverb({decay:4,wet:0.3}).toDestination();
      this.master=new this.Tone.Volume(-8).connect(this.reverb);
      // soft plucky synth for melody (like a lute by the hearth)
      this.lute=new this.Tone.PluckSynth({attackNoise:0.6,dampening:3000,resonance:0.85}).connect(this.master);
      // warm pad for background warmth
      this.pad=new this.Tone.PolySynth(this.Tone.Synth,{oscillator:{type:"sine"},
        envelope:{attack:1.5,decay:1,sustain:0.6,release:3},volume:-20}).connect(this.master);
      // sfx synth
      this.sfx=new this.Tone.Synth({oscillator:{type:"triangle"},envelope:{attack:0.005,decay:0.1,sustain:0,release:0.1},volume:-14}).connect(this.master);
      this.ready=true;
    }catch(e){}
    this.loading=false;
  },
  async startMusic(){
    await this.ensure();
    if(!this.ready||this.started||!this.musicOn) return;
    const T=this.Tone;
    try{
      if(T.context.state!=="running") await T.start();
      // ---- Several warm, cozy themes the music drifts between, so it never feels like one short loop ----
      // All in gentle minor/pentatonic moods — calm fireside, never tense.
      const THEMES=[
        { // I — hearthside lute
          mel:["A3","C4","E4","D4","C4","E4","G3","A3","E4","D4","C4","A3"],
          chords:[["A2","E3"],["F2","C3"],["C3","G3"],["G2","D3"]], bpm:64 },
        { // II — quiet evening
          mel:["E4","D4","C4","D4","E4","G4","E4","D4","C4","A3","C4","D4"],
          chords:[["A2","E3"],["C3","G3"],["D3","A3"],["E3","B3"]], bpm:58 },
        { // III — wandering memory
          mel:["D4","E4","G4","A4","G4","E4","D4","C4","D4","E4","C4","A3"],
          chords:[["D3","A3"],["F2","C3"],["G2","D3"],["A2","E3"]], bpm:62 },
        { // IV — embers low
          mel:["A3","G3","E3","G3","A3","C4","A3","G3","E3","D3","E3","G3"],
          chords:[["F2","C3"],["C3","G3"],["A2","E3"],["G2","D3"]], bpm:54 },
      ];
      let ti=Math.floor(Math.random()*THEMES.length); // start on a random theme
      let theme=THEMES[ti];
      let i=0,ci=0,bars=0;
      const pickNote=(base)=>{
        // occasional gentle octave lift for subtle variation
        if(Math.random()<0.12){ const m=base.match(/([A-G]#?)(\d)/); if(m){ return m[1]+(parseInt(m[2])+1); } }
        return base;
      };
      this.loop=new T.Loop((time)=>{
        if(!this.musicOn) return;
        this.lute.triggerAttackRelease(pickNote(theme.mel[i%theme.mel.length]), "8n", time);
        if(i%4===0){ this.pad.triggerAttackRelease(theme.chords[ci%theme.chords.length], "1m", time); ci++; }
        i++;
        // at the end of each theme's phrase, sometimes drift to another theme
        if(i%theme.mel.length===0){
          bars++;
          if(bars>=2 && Math.random()<0.6){
            bars=0; let nt=ti; while(nt===ti) nt=Math.floor(Math.random()*THEMES.length);
            ti=nt; theme=THEMES[ti]; i=0; ci=0;
            try{ T.Transport.bpm.rampTo(theme.bpm, 4); }catch(e){}
          }
        }
      }, "2n").start(0);
      // ---- faint fireside crackle: soft filtered noise blips, very sparse ----
      try{
        this.crackleNoise=new T.NoiseSynth({noise:{type:"pink"},envelope:{attack:0.001,decay:0.05,sustain:0,release:0.05},volume:-32}).connect(this.master);
        this.crackle=new T.Loop((time)=>{
          if(!this.musicOn) return;
          if(Math.random()<0.5) this.crackleNoise.triggerAttackRelease("16n", time);
          if(Math.random()<0.25) this.crackleNoise.triggerAttackRelease("32n", time+0.12);
        }, "1n").start("0:2");
      }catch(e){}
      T.Transport.bpm.value=theme.bpm;
      T.Transport.start();
      this.started=true;
    }catch(e){}
  },
  setMusic(on){ this.musicOn=on;
    if(this.Tone){ try{ if(on && !this.started) this.startMusic(); this.Tone.Transport.mute=!on; }catch(e){} } },
  setSfx(on){ this.sfxOn=on; },
  play(type){
    if(!this.ready||!this.sfxOn) return;
    const T=this.Tone; const n=T.now();
    try{
      if(type==="click"){ this.sfx.triggerAttackRelease("C5","32n",n); }
      else if(type==="sell"){ this.sfx.triggerAttackRelease("E5","16n",n); this.sfx.triggerAttackRelease("A5","16n",n+0.08); }
      else if(type==="craft"){ this.sfx.triggerAttackRelease("G4","16n",n); this.sfx.triggerAttackRelease("C5","8n",n+0.1); }
      else if(type==="promote"){ ["C5","E5","G5","C6"].forEach((nt,k)=>this.sfx.triggerAttackRelease(nt,"16n",n+k*0.09)); }
      else if(type==="quest"){ this.sfx.triggerAttackRelease("D5","16n",n); }
      else if(type==="death"){ const s=new T.Synth({oscillator:{type:"sine"},envelope:{attack:0.02,decay:0.6,sustain:0,release:0.4},volume:-8}).connect(this.master); s.triggerAttackRelease("A2","2n",n); s.triggerAttackRelease("F2","2n",n+0.25); }
      else if(type==="event"){ this.sfx.triggerAttackRelease("E5","16n",n); this.sfx.triggerAttackRelease("G5","16n",n+0.1); }
    }catch(e){}
  }
};

// ==================== §DATA · OYUN VERİSİ (sınıf/eşya/bölge/tarif/bina) ====================
const RANKS = [
  { name: "Novice", minLevel: 1, color: "#9a8c7A" },
  { name: "Apprentice", minLevel: 10, color: "#6fae6f" },
  { name: "Journeyman", minLevel: 20, color: "#5b9bd5" },
  { name: "Veteran", minLevel: 30, color: "#a972d9" },
  { name: "Master", minLevel: 40, color: "#e0a23c" },
  { name: "Legend", minLevel: 50, color: "#e05c4c" },
];
const CLASSES = {
  Warrior: { hp: 120, atk: 14, def: 12, spd: 6, icon: "⚔️", role:"Frontline Tank",
    desc: "High HP and defense. Soaks danger so the party returns safe — lowers everyone's injury risk on a run.",
    perk:"−6% party injury risk", mod:{ partyInjury:-0.06 } },
  Rogue:   { hp: 80,  atk: 16, def: 6,  spd: 14, icon: "🗡️", role:"Scout",
    desc: "Fast and light-fingered. Finds extra loot and gets the party home quicker.",
    perk:"+8% loot found", mod:{ partyLoot:0.08 } },
  Mage:    { hp: 70,  atk: 20, def: 5,  spd: 9,  icon: "🔮", role:"Damage Dealer",
    desc: "Highest attack in the guild but very fragile. Crushes dangerous foes, raising success odds — yet is the first to fall if things go wrong.",
    perk:"+8% quest success", mod:{ partySuccess:0.08 } },
  Ranger:  { hp: 90,  atk: 13, def: 8,  spd: 12, icon: "🏹", role:"Hunter",
    desc: "Well-rounded survivalist. No weakness, no specialty — reliable on any expedition.",
    perk:"+5% loot, −2% injury", mod:{ partyLoot:0.05, partyInjury:-0.02 } },
  Cleric:  { hp: 100, atk: 9,  def: 10, spd: 8,  icon: "✨", role:"Healer",
    desc: "Low damage but keeps everyone alive. Strongly reduces injuries and heals the party faster after a failed run.",
    perk:"−10% party injury risk", mod:{ partyInjury:-0.10 } },
  // ===== Rare classes — only appear on the board once the guild earns renown =====
  Paladin: { hp: 140, atk: 16, def: 16, spd: 7, icon: "🛡️", role:"Holy Guardian", rare:true, minRenown:25,
    desc: "An elite, blessed warrior. Both shields the party and lifts its fighting spirit — the finest protector a guild can field.",
    perk:"−9% injury & +5% success", mod:{ partyInjury:-0.09, partySuccess:0.05 } },
  Necromancer: { hp: 85, atk: 24, def: 7, spd: 10, icon: "💀", role:"Dark Caster", rare:true, minRenown:55,
    desc: "Wields forbidden magic of devastating power. Greatly raises success, but the dead they raise sometimes carry off extra spoils.",
    perk:"+12% success & +8% loot", mod:{ partySuccess:0.12, partyLoot:0.08 } },
  Assassin: { hp: 88, atk: 22, def: 8, spd: 18, icon: "🥷", role:"Shadow Blade", rare:true, minRenown:40,
    desc: "Strikes from the dark and vanishes. Blistering speed brings the party home fast, and rich, hand-picked loot.",
    perk:"+15% loot & 10% faster", mod:{ partyLoot:0.15, speedMult:0.90 } },
  Beastmaster: { hp: 110, atk: 17, def: 11, spd: 13, icon: "🐺", role:"Wild Warden", rare:true, minRenown:75,
    desc: "Commands loyal beasts on the hunt. A rare all-rounder that boosts every facet of an expedition.",
    perk:"+6% success, loot & −4% injury", mod:{ partySuccess:0.06, partyLoot:0.06, partyInjury:-0.04 } },
  Monk: { hp: 90, atk: 15, def: 9, spd: 16, icon: "☯️", role:"Battle Healer", rare:true, minRenown:60,
    desc: "A wandering martial ascetic. Low armor but lightning reflexes let the whole party dodge harm, and their disciplined calm keeps morale high on the road.",
    perk:"−11% injury & +4% success", mod:{ partyInjury:-0.11, partySuccess:0.04 } },
  // ===== UNIQUE heroes — appear on the board only very rarely, cost a fortune =====
  LoneWolf: { hp: 170, atk: 30, def: 18, spd: 16, icon: "🐺", role:"Lone Slayer", rare:true, unique:true, minRenown:0,
    desc: "A scarred knight clad all in black who fights alone and fears nothing. Immense power — but will only take an expedition solo, never in a party.",
    perk:"Overwhelming might when alone", mod:{} },
  Hawk: { hp: 120, atk: 24, def: 12, spd: 20, icon: "🦅", role:"Dark Falcon", rare:true, unique:true, minRenown:0,
    desc: "A charismatic, ambitious blade. Bonds with comrades in record time — yet their shadow poisons the bonds between everyone else.",
    perk:"Bonds fast, but sows discord", mod:{ partySuccess:0.10, partyLoot:0.08 } },
  Dragonborn: { hp: 150, atk: 28, def: 16, spd: 14, icon: "🐲", role:"Dragon-Blooded", rare:true, unique:true, minRenown:0,
    desc: "Born with the soul of a dragon and a voice that shakes mountains. Slays the mightiest foes — but danger itself is drawn to their fate.",
    perk:"Dragon-slayer; lifts the whole party", mod:{ partySuccess:0.18, partyLoot:0.10 } },
  GoblinSlayer: { hp: 140, atk: 26, def: 20, spd: 15, icon: "🪓", role:"Goblin Bane", rare:true, unique:true, minRenown:0, soloRegion:"goblin_hills",
    desc: "A grim hunter who cares for nothing but slaying goblins. Works alone — but in the Goblin Hills, none are deadlier.",
    perk:"Solo; devastating in the Goblin Hills", mod:{} },
};
const NORMAL_CLASSES = ["Warrior","Rogue","Mage","Ranger","Cleric"];
const POSITIVE_TRAITS = [
  { name: "Brave", desc: "+10% danger success", mod: { dangerSuccess: 0.10 } },
  { name: "Loyal", desc: "Wages -15%", mod: { wageMult: 0.85 } },
  { name: "Genius", desc: "+15% XP", mod: { xpMult: 1.15 } },
  { name: "Tough", desc: "+20% HP", mod: { hpMult: 1.20 } },
  { name: "Lucky", desc: "+12% loot", mod: { lootMult: 1.12 } },
  { name: "Swift", desc: "Quests 12% faster", mod: { speedMult: 0.88 } },
  { name: "Charming", desc: "+10% rent", mod: { rentMult: 1.10 } },
  { name: "Hardy", desc: "+10% HP", mod: { hpMult: 1.10 } },
  { name: "Studious", desc: "+8% XP", mod: { xpMult: 1.08 } },
  { name: "Nimble", desc: "Quests 6% faster", mod: { speedMult: 0.94 } },
  { name: "Scavenger", desc: "+7% loot", mod: { lootMult: 1.07 } },
  { name: "Frugal", desc: "Wages -8%", mod: { wageMult: 0.92 } },
  { name: "Bold", desc: "+5% danger success", mod: { dangerSuccess: 0.05 } },
  { name: "Cheerful", desc: "+6% rent paid", mod: { rentMult: 1.06 } },
];
const NEGATIVE_TRAITS = [
  { name: "Reckless", desc: "+15% injury risk", mod: { injuryChance: 0.15 } },
  { name: "Greedy", desc: "Wages +20%", mod: { wageMult: 1.20 } },
  { name: "Arrogant", desc: "-10% XP", mod: { xpMult: 0.90 } },
  { name: "Drunkard", desc: "Double food cost", mod: { foodMult: 2.0 } },
  { name: "Frail", desc: "-15% HP", mod: { hpMult: 0.85 } },
  { name: "Slow", desc: "Quests 12% slower", mod: { speedMult: 1.12 } },
  { name: "Cowardly", desc: "-10% danger success", mod: { dangerSuccess: -0.10 } },
  { name: "Clumsy", desc: "+7% injury risk", mod: { injuryChance: 0.07 } },
  { name: "Lazy", desc: "-7% XP", mod: { xpMult: 0.93 } },
  { name: "Sickly", desc: "-8% HP", mod: { hpMult: 0.92 } },
  { name: "Sluggish", desc: "Quests 6% slower", mod: { speedMult: 1.06 } },
  { name: "Glutton", desc: "+50% food cost", mod: { foodMult: 1.5 } },
  { name: "Demanding", desc: "Wages +10%", mod: { wageMult: 1.10 } },
  { name: "Timid", desc: "-5% danger success", mod: { dangerSuccess: -0.05 } },
];
const MALE_NAMES = ["Aldric","Cael","Finn","Hale","Joran","Lyle","Orin","Rurik","Thorne","Ulric","Zane","Brann","Korr","Garen","Aldous","Dren","Gareth","Rorick","Bram","Edric"];
const FEMALE_NAMES = ["Bryn","Dara","Elara","Gwen","Iona","Kira","Mira","Petra","Sela","Vera","Wren","Yara","Senna","Lila","Ada","Nessa","Rowan","Esa","Maela","Tess"];
const NEUTRAL_NAMES = ["Nyx","Quinn"];
const FIRST_NAMES = [...MALE_NAMES, ...FEMALE_NAMES, ...NEUTRAL_NAMES];
const LAST_NAMES = ["Ironfist","Swiftblade","Stormcrow","Blackthorn","Dawnwhisper","Grimwald","Hollowfen","Ravenshield","Stonebrook","Thornwood","Ashdown","Brightwater","Coldforge","Duskbane","Emberfall"];
const REGIONS = [
  { id:"green_woods", name:"Green Woods", tier:0, duration:45, danger:1, icon:"🌲", loot:[{item:"herb",min:2,max:5},{item:"wood",min:1,max:4},{item:"wolf_pelt",min:0,max:2},{item:"golden_fleece",min:1,max:1,rare:true,chance:0.15},{item:"carved_totem",min:1,max:1,rare:true,chance:0.06}] },
  { id:"rat_sewers", name:"Rat Sewers", tier:0, duration:60, danger:1, icon:"🐀", loot:[{item:"rat_tail",min:2,max:6},{item:"scrap_iron",min:1,max:3},{item:"slime",min:0,max:3},{item:"ancient_coin",min:1,max:1,rare:true,chance:0.15},{item:"rat_king_crown",min:1,max:1,rare:true,chance:0.06}] },
  { id:"goblin_hills", name:"Goblin Hills", tier:1, duration:90, danger:2, icon:"⛰️", loot:[{item:"iron_ore",min:2,max:5},{item:"goblin_ear",min:1,max:4},{item:"crude_gem",min:0,max:2},{item:"ancient_coin",min:1,max:1,rare:true,chance:0.15},{item:"chieftain_banner",min:1,max:1,rare:true,chance:0.07}] },
  { id:"misty_marsh", name:"Misty Marsh", tier:1, duration:110, danger:2, icon:"🌫️", loot:[{item:"herb",min:3,max:7},{item:"toxin_gland",min:1,max:3},{item:"bog_iron",min:1,max:4},{item:"giant_pearl",min:1,max:1,rare:true,chance:0.15},{item:"drowned_locket",min:1,max:1,rare:true,chance:0.07}] },
  { id:"ancient_crypt", name:"Ancient Crypt", tier:2, duration:160, danger:3, icon:"⚰️", loot:[{item:"bone",min:3,max:8},{item:"silver_ore",min:1,max:4},{item:"cursed_relic",min:0,max:2},{item:"spirit_silk",min:1,max:1,rare:true,chance:0.13},{item:"saints_finger",min:1,max:1,rare:true,chance:0.07}] },
  { id:"orc_frontier", name:"Orc Frontier", tier:2, duration:180, danger:3, icon:"🪓", loot:[{item:"iron_ore",min:4,max:9},{item:"orc_tusk",min:1,max:4},{item:"steel_scrap",min:1,max:3},{item:"ember_honey",min:1,max:1,rare:true,chance:0.13},{item:"warlord_skull",min:1,max:1,rare:true,chance:0.07}] },
  { id:"frozen_peaks", name:"Frozen Peaks", tier:3, duration:240, danger:4, icon:"🏔️", loot:[{item:"frost_crystal",min:3,max:7},{item:"silver_ore",min:3,max:8},{item:"yeti_fur",min:1,max:4},{item:"spirit_silk",min:1,max:1,rare:true,chance:0.16},{item:"frozen_heart",min:1,max:1,rare:true,chance:0.07}] },
  { id:"dragon_valley", name:"Dragon Valley", tier:4, duration:340, danger:5, icon:"🐉", loot:[{item:"dragon_scale",min:1,max:4},{item:"gold_ore",min:2,max:6},{item:"fire_essence",min:1,max:3},{item:"dragon_truffle",min:1,max:1,rare:true,chance:0.12},{item:"broken_seal",min:1,max:1,rare:true,chance:0.06}] },
  { id:"void_citadel", name:"Void Citadel", tier:5, duration:480, danger:6, icon:"🌌", loot:[{item:"void_shard",min:1,max:3},{item:"gold_ore",min:3,max:8},{item:"cursed_relic",min:1,max:4},{item:"starfruit",min:1,max:1,rare:true,chance:0.10},{item:"grimoire_page",min:1,max:1,rare:true,chance:0.06}] },
];
const ITEMS = {
  herb:{name:"Herb",value:3,tier:"raw",icon:"🌿"}, wood:{name:"Wood",value:2,tier:"raw",icon:"🪵"},
  wolf_pelt:{name:"Wolf Pelt",value:8,tier:"raw",icon:"🐺"}, rat_tail:{name:"Rat Tail",value:2,tier:"raw",icon:"🐀"},
  scrap_iron:{name:"Scrap Iron",value:4,tier:"raw",icon:"⛓️"}, slime:{name:"Slime",value:3,tier:"raw",icon:"🫧"},
  iron_ore:{name:"Iron Ore",value:6,tier:"raw",icon:"🪨"}, goblin_ear:{name:"Goblin Ear",value:5,tier:"raw",icon:"👂"},
  crude_gem:{name:"Crude Gem",value:15,tier:"raw",icon:"💎"}, toxin_gland:{name:"Toxin Gland",value:9,tier:"raw",icon:"🫙"},
  bog_iron:{name:"Bog Iron",value:7,tier:"raw",icon:"🪨"}, bone:{name:"Bone",value:4,tier:"raw",icon:"🦴"},
  silver_ore:{name:"Silver Ore",value:12,tier:"raw",icon:"🪙"}, cursed_relic:{name:"Cursed Relic",value:30,tier:"raw",icon:"🔯"},
  orc_tusk:{name:"Orc Tusk",value:10,tier:"raw",icon:"🦷"}, steel_scrap:{name:"Steel Scrap",value:11,tier:"raw",icon:"🗡️"},
  frost_crystal:{name:"Frost Crystal",value:20,tier:"raw",icon:"❄️"}, yeti_fur:{name:"Yeti Fur",value:18,tier:"raw",icon:"🧊"},
  dragon_scale:{name:"Dragon Scale",value:50,tier:"raw",icon:"🐲"}, gold_ore:{name:"Gold Ore",value:35,tier:"raw",icon:"✨"},
  fire_essence:{name:"Fire Essence",value:40,tier:"raw",icon:"🔥"}, void_shard:{name:"Void Shard",value:80,tier:"raw",icon:"🔮"},
  // rare drops — low chance, high value, fuel premium recipes
  golden_fleece:{name:"Golden Fleece",value:90,tier:"raw",icon:"🐏"},
  giant_pearl:{name:"Giant Pearl",value:75,tier:"raw",icon:"🫧"},
  ancient_coin:{name:"Ancient Coin",value:120,tier:"raw",icon:"🪙"},
  spirit_silk:{name:"Spirit Silk",value:110,tier:"raw",icon:"🕸️"},
  ember_honey:{name:"Ember Honey",value:130,tier:"raw",icon:"🍯"},
  dragon_truffle:{name:"Dragon Truffle",value:200,tier:"raw",icon:"🍄"},
  starfruit:{name:"Starfruit",value:160,tier:"raw",icon:"⭐"},
  // 🏆 storied trophies — rare, characterful drops that make each region memorable (sold, not crafted)
  carved_totem:{name:"Carved Forest Totem",value:55,tier:"raw",icon:"🪵"},
  rat_king_crown:{name:"Rat King's Crown",value:60,tier:"raw",icon:"👑"},
  chieftain_banner:{name:"Goblin Chieftain's Banner",value:85,tier:"raw",icon:"🚩"},
  drowned_locket:{name:"Drowned Maiden's Locket",value:95,tier:"raw",icon:"📿"},
  saints_finger:{name:"Saint's Finger Bone",value:130,tier:"raw",icon:"🦴"},
  warlord_skull:{name:"Orc Warlord's Skull",value:150,tier:"raw",icon:"💀"},
  frozen_heart:{name:"Heart of the Mountain",value:210,tier:"raw",icon:"❄️"},
  broken_seal:{name:"Broken Royal Seal",value:320,tier:"raw",icon:"🔱"},
  grimoire_page:{name:"Witch's Grimoire Page",value:400,tier:"raw",icon:"📜"},
  // ⚜️ class relics — craftable only when that rare class is in your guild; equipping grants a permanent boon
  holy_armor:{name:"Holy Plate Armor",value:300,tier:"fin",icon:"⚜️"},
  bone_relic:{name:"Bone Relic",value:300,tier:"fin",icon:"☠️"},
  shadow_cloak:{name:"Shadow Cloak",value:300,tier:"fin",icon:"🌑"},
  beast_horn:{name:"Wild Horn",value:300,tier:"fin",icon:"📯"},
  prayer_beads:{name:"Prayer Beads",value:300,tier:"fin",icon:"📿"},
  // refined (mid)
  leather:{name:"Leather",value:18,tier:"mid",icon:"🟤"}, thick_hide:{name:"Thick Hide",value:34,tier:"mid",icon:"🟤"},
  cloth:{name:"Cloth",value:14,tier:"mid",icon:"🧶"}, fine_cloth:{name:"Fine Cloth",value:48,tier:"mid",icon:"🧶"},
  flour:{name:"Flour",value:8,tier:"mid",icon:"🌾"}, cured_meat:{name:"Cured Meat",value:16,tier:"mid",icon:"🥓"},
  // finished goods (fin) — folk crafts people actually buy
  leather_boots:{name:"Leather Boots",value:72,tier:"fin",icon:"🥾"},
  travel_pack:{name:"Travel Pack",value:117,tier:"fin",icon:"🎒"},
  fur_cloak:{name:"Fur Cloak",value:182,tier:"fin",icon:"🧥"},
  woolen_tunic:{name:"Woolen Tunic",value:62,tier:"fin",icon:"👕"},
  embroidered_gown:{name:"Embroidered Gown",value:273,tier:"fin",icon:"👗"},
  tapestry:{name:"Tapestry",value:416,tier:"fin",icon:"🏞️"},
  hearty_stew:{name:"Hearty Stew",value:49,tier:"fin",icon:"🍲"},
  spiced_bread:{name:"Spiced Bread",value:39,tier:"fin",icon:"🍞"},
  honey_mead:{name:"Honey Mead",value:98,tier:"fin",icon:"🍯"},
  feast_platter:{name:"Feast Platter",value:338,tier:"fin",icon:"🍱"},
  // premium goods from rare materials
  gilded_saddle:{name:"Gilded Saddle",value:442,tier:"fin",icon:"🐎"},
  pearl_corset:{name:"Pearl Corset",value:546,tier:"fin",icon:"🦪"},
  spirit_veil:{name:"Spirit Veil",value:624,tier:"fin",icon:"👰"},
  royal_banquet:{name:"Royal Banquet",value:845,tier:"fin",icon:"🍽️"},
  ember_brew:{name:"Ember Brew",value:390,tier:"fin",icon:"🔥"},
  celestial_robe:{name:"Celestial Robe",value:1170,tier:"fin",icon:"🌟"},
  // ---- expanded intermediates (mid) ----
  tallow:{name:"Tallow",value:12,tier:"mid",icon:"🧈"}, wax:{name:"Beeswax",value:10,tier:"mid",icon:"🍯"},
  dye:{name:"Dye",value:9,tier:"mid",icon:"🎨"}, polished_gem:{name:"Polished Gem",value:40,tier:"mid",icon:"💠"},
  glass:{name:"Glass",value:24,tier:"mid",icon:"🔷"}, parchment:{name:"Parchment",value:7,tier:"mid",icon:"📜"},
  charcoal:{name:"Charcoal",value:5,tier:"mid",icon:"🪨"}, bone_meal:{name:"Bone Meal",value:8,tier:"mid",icon:"🦴"},
  silver_bar:{name:"Silver Bar",value:30,tier:"mid",icon:"🥈"}, gold_leaf:{name:"Gold Leaf",value:82,tier:"mid",icon:"🟨"},
  // ---- expanded finished goods (fin) ----
  // tannery line
  leather_belt:{name:"Leather Belt",value:55,tier:"fin",icon:"🪢"},
  waterskin:{name:"Waterskin",value:65,tier:"fin",icon:"🍶"},
  saddlebag:{name:"Saddlebag",value:156,tier:"fin",icon:"👜"},
  bound_journal:{name:"Bound Journal",value:124,tier:"fin",icon:"📔"},
  drum:{name:"War Drum",value:208,tier:"fin",icon:"🥁"},
  // weavery line
  wool_socks:{name:"Wool Socks",value:29,tier:"fin",icon:"🧦"},
  scarf:{name:"Knit Scarf",value:46,tier:"fin",icon:"🧣"},
  feathered_hat:{name:"Feathered Hat",value:104,tier:"fin",icon:"🎩"},
  silk_gloves:{name:"Silk Gloves",value:169,tier:"fin",icon:"🧤"},
  ceremonial_flag:{name:"Ceremonial Flag",value:364,tier:"fin",icon:"🚩"},
  prayer_rug:{name:"Prayer Rug",value:312,tier:"fin",icon:"🧎"},
  // kitchen line
  jam:{name:"Berry Jam",value:31,tier:"fin",icon:"🍓"},
  cheese_wheel:{name:"Cheese Wheel",value:60,tier:"fin",icon:"🧀"},
  roast_fowl:{name:"Roast Fowl",value:75,tier:"fin",icon:"🍗"},
  spiced_wine:{name:"Spiced Wine",value:145,tier:"fin",icon:"🍷"},
  apple_pie:{name:"Apple Pie",value:68,tier:"fin",icon:"🥧"},
  pickled_jar:{name:"Pickled Goods",value:52,tier:"fin",icon:"🫙"},
  // chandler/decor line (candles, soap, trinkets — household goods)
  candle:{name:"Tallow Candle",value:23,tier:"fin",icon:"🕯️"},
  soap:{name:"Scented Soap",value:34,tier:"fin",icon:"🧼"},
  lantern:{name:"Glass Lantern",value:124,tier:"fin",icon:"🏮"},
  hand_mirror:{name:"Hand Mirror",value:150,tier:"fin",icon:"🪞"},
  music_box:{name:"Music Box",value:390,tier:"fin",icon:"🎶"},
  // jewelry line (sold via weavery/decor using gems & metals)
  beaded_necklace:{name:"Beaded Necklace",value:91,tier:"fin",icon:"📿"},
  silver_ring:{name:"Silver Ring",value:143,tier:"fin",icon:"💍"},
  gemmed_brooch:{name:"Gemmed Brooch",value:299,tier:"fin",icon:"🧷"},
  golden_crown:{name:"Golden Crown",value:1014,tier:"fin",icon:"👑"},
  jeweled_chalice:{name:"Jeweled Chalice",value:728,tier:"fin",icon:"🏆"},
  // toy/keepsake line (children's goods & souvenirs)
  wooden_toy:{name:"Wooden Toy",value:14,tier:"fin",icon:"🪀"},
  rag_doll:{name:"Rag Doll",value:44,tier:"fin",icon:"🧸"},
  carved_figurine:{name:"Carved Figurine",value:110,tier:"fin",icon:"🗿"},
  spinning_top:{name:"Spinning Top",value:44,tier:"fin",icon:"🎯"},
  kite:{name:"Painted Kite",value:78,tier:"fin",icon:"🪁"},
  // goods that consume charcoal & bone meal
  incense:{name:"Incense Sticks",value:46,tier:"fin",icon:"🕯️"},
  water_filter:{name:"Water Filter",value:64,tier:"fin",icon:"⏳"},
  fine_china:{name:"Fine China",value:165,tier:"fin",icon:"🍵"},
  fertilizer:{name:"Bag of Fertilizer",value:38,tier:"fin",icon:"🌱"},
  // ===== Forge chain outputs (use the previously-dead ores & scraps) =====
  iron_bar:{name:"Iron Bar",value:22,tier:"mid",icon:"🔩"},
  steel_bar:{name:"Steel Bar",value:44,tier:"mid",icon:"⚙️"},
  horseshoe:{name:"Horseshoe",value:40,tier:"fin",icon:"🧲"},
  iron_nails:{name:"Iron Nails",value:30,tier:"fin",icon:"📌"},
  hand_tools:{name:"Hand Tools",value:70,tier:"fin",icon:"🔧"},
  iron_helm:{name:"Iron Helm",value:96,tier:"fin",icon:"⛑️"},
  steel_sword:{name:"Steel Sword",value:150,tier:"fin",icon:"⚔️"},
  steel_shield:{name:"Steel Shield",value:170,tier:"fin",icon:"🛡️"},
  war_axe:{name:"War Axe",value:205,tier:"fin",icon:"🪓"},
  goblin_charm:{name:"Goblin-Tooth Charm",value:34,tier:"fin",icon:"🦷"},
  tusk_horn:{name:"Carved War Horn",value:120,tier:"fin",icon:"📯"},
};
// ==================== §I18N-DATA · İÇERİK ÇEVİRİLERİ ====================
// Logic everywhere keeps using English ids/names; only DISPLAY is translated.
// Helpers fall back to the original English when LANG==="en" or key missing.
const TR_ITEM = {
  herb:"Şifalı Ot", wood:"Odun", wolf_pelt:"Kurt Postu", rat_tail:"Fare Kuyruğu",
  scrap_iron:"Hurda Demir", slime:"Balçık", iron_ore:"Demir Cevheri", goblin_ear:"Goblin Kulağı",
  crude_gem:"Ham Mücevher", toxin_gland:"Zehir Bezi", bog_iron:"Bataklık Demiri", bone:"Kemik",
  silver_ore:"Gümüş Cevheri", cursed_relic:"Lanetli Emanet", orc_tusk:"Ork Dişi", steel_scrap:"Çelik Parça",
  frost_crystal:"Buz Kristali", yeti_fur:"Yeti Kürkü", dragon_scale:"Ejderha Pulu", gold_ore:"Altın Cevheri",
  fire_essence:"Ateş Özü", void_shard:"Boşluk Parçası",
  golden_fleece:"Altın Post", giant_pearl:"Dev İnci", ancient_coin:"Antik Sikke", spirit_silk:"Ruh İpeği",
  ember_honey:"Köz Balı", dragon_truffle:"Ejderha Mantarı", starfruit:"Yıldız Meyvesi",
  carved_totem:"Oymalı Orman Totemi", rat_king_crown:"Fare Kralı'nın Tacı", chieftain_banner:"Goblin Reisinin Sancağı",
  drowned_locket:"Boğulmuş Kızın Madalyonu", saints_finger:"Azizin Parmak Kemiği", warlord_skull:"Ork Savaş Beyinin Kafatası",
  frozen_heart:"Dağın Kalbi", broken_seal:"Kırık Kraliyet Mührü", grimoire_page:"Cadının Büyü Sayfası",
  holy_armor:"Kutsal Zırh", bone_relic:"Kemik Emaneti", shadow_cloak:"Gölge Pelerini", beast_horn:"Vahşi Boynuz", prayer_beads:"Dua Boncukları",
  leather:"Deri", thick_hide:"Kalın Post", cloth:"Kumaş", fine_cloth:"İnce Kumaş",
  flour:"Un", cured_meat:"Kurutulmuş Et",
  leather_boots:"Deri Çizme", travel_pack:"Seyahat Çantası", fur_cloak:"Kürk Pelerin", woolen_tunic:"Yün Tunik",
  embroidered_gown:"İşlemeli Elbise", tapestry:"Goblen", hearty_stew:"Doyurucu Güveç", spiced_bread:"Baharatlı Ekmek",
  honey_mead:"Bal Şarabı", feast_platter:"Ziyafet Tabağı",
  gilded_saddle:"Yaldızlı Eyer", pearl_corset:"İnci Korse", spirit_veil:"Ruh Tülü", royal_banquet:"Kraliyet Ziyafeti",
  ember_brew:"Köz İçkisi", celestial_robe:"Göksel Cübbe",
  tallow:"Donyağı", wax:"Balmumu", dye:"Boya", polished_gem:"Cilalı Mücevher", glass:"Cam", parchment:"Parşömen",
  charcoal:"Kömür", bone_meal:"Kemik Unu", silver_bar:"Gümüş Külçe", gold_leaf:"Altın Varak",
  leather_belt:"Deri Kemer", waterskin:"Su Tulumu", saddlebag:"Heybe", bound_journal:"Ciltli Günlük", drum:"Savaş Davulu",
  wool_socks:"Yün Çorap", scarf:"Örme Atkı", feathered_hat:"Tüylü Şapka", silk_gloves:"İpek Eldiven",
  ceremonial_flag:"Tören Bayrağı", prayer_rug:"Dua Halısı",
  jam:"Çilek Reçeli", cheese_wheel:"Peynir Tekeri", roast_fowl:"Kızarmış Tavuk", spiced_wine:"Baharatlı Şarap",
  apple_pie:"Elmalı Turta", pickled_jar:"Turşu",
  candle:"Donyağı Mumu", soap:"Kokulu Sabun", lantern:"Cam Fener", hand_mirror:"El Aynası", music_box:"Müzik Kutusu",
  beaded_necklace:"Boncuk Kolye", silver_ring:"Gümüş Yüzük", gemmed_brooch:"Mücevherli Broş", golden_crown:"Altın Taç",
  jeweled_chalice:"Mücevherli Kadeh",
  wooden_toy:"Tahta Oyuncak", rag_doll:"Bez Bebek", carved_figurine:"Oyma Figür", spinning_top:"Topaç", kite:"Boyalı Uçurtma",
  incense:"Tütsü Çubuğu", water_filter:"Su Süzgeci", fine_china:"İnce Porselen", fertilizer:"Gübre Torbası",
  iron_bar:"Demir Külçe", steel_bar:"Çelik Külçe", horseshoe:"Nal", iron_nails:"Demir Çivi", hand_tools:"El Aletleri",
  iron_helm:"Demir Miğfer", steel_sword:"Çelik Kılıç", steel_shield:"Çelik Kalkan", war_axe:"Savaş Baltası",
  goblin_charm:"Goblin Dişi Tılsımı", tusk_horn:"Oyma Savaş Borusu",
};
const TR_REGION = {
  green_woods:"Yeşil Orman", rat_sewers:"Fare Lağımları", goblin_hills:"Goblin Tepeleri", misty_marsh:"Sisli Bataklık",
  ancient_crypt:"Antik Lahit", orc_frontier:"Ork Hududu", frozen_peaks:"Donmuş Zirveler", dragon_valley:"Ejderha Vadisi",
  void_citadel:"Boşluk Kalesi",
};
const TR_CLASS = {
  Warrior:"Savaşçı", Rogue:"Hırsız", Mage:"Büyücü", Ranger:"Korucu", Cleric:"Rahip",
  Paladin:"Şövalye", Necromancer:"Nekromansör", Assassin:"Suikastçı", Beastmaster:"Canavar Efendisi", Monk:"Keşiş", LoneWolf:"Yalnız Kurt", Hawk:"Karanlığın Şahini", Dragonborn:"Ejderha Doğumlu", GoblinSlayer:"Goblin Katili",
};
const TR_ROLE = {
  "Frontline Tank":"Ön Saf Tankı", "Scout":"İzci", "Damage Dealer":"Vuruş Gücü", "Hunter":"Avcı", "Healer":"Şifacı",
  "Holy Guardian":"Kutsal Koruyucu", "Dark Caster":"Kara Büyücü", "Shadow Blade":"Gölge Bıçağı", "Beast Lord":"Canavar Lordu",
  "Wild Warden":"Vahşi Muhafız", "Battle Healer":"Savaşçı Şifacı", "Lone Slayer":"Yalnız Katil", "Dark Falcon":"Kara Şahin", "Dragon-Blooded":"Ejderha Kanlı", "Goblin Bane":"Goblin Belası",
};
const TR_TRAIT = {
  Brave:"Cesur", Loyal:"Sadık", Genius:"Dâhi", Tough:"Dayanıklı", Lucky:"Şanslı", Swift:"Çevik",
  Charming:"Cazibeli", Hardy:"Sağlam", Studious:"Çalışkan", Nimble:"Atik", Scavenger:"Çöpçü",
  Frugal:"Tutumlu", Bold:"Atılgan", Cheerful:"Neşeli",
  Reckless:"Pervasız", Greedy:"Açgözlü", Arrogant:"Kibirli", Drunkard:"Ayyaş", Frail:"Cılız", Slow:"Yavaş",
  Cowardly:"Korkak", Clumsy:"Sakar", Lazy:"Tembel", Sickly:"Hastalıklı", Sluggish:"Ağır", Glutton:"Obur",
  Demanding:"Talepkâr", Timid:"Ürkek",
  LoneWolfCurse:"Yalnız Kurt", Discordant:"Fesatçı", Cursed:"Lanetli", Obsessed:"Takıntılı", Vigilant:"Tetikte",
};
function itemName(id){ if(LANG==="tr" && TR_ITEM[id]) return TR_ITEM[id]; return (ITEMS[id]&&ITEMS[id].name)||id; }
function regionName(r){ const id=typeof r==="string"?r:(r&&r.id); if(LANG==="tr" && TR_REGION[id]) return TR_REGION[id]; if(typeof r==="string"){ const byName=REGIONS.find(x=>x.name===r); if(byName){ if(LANG==="tr" && TR_REGION[byName.id]) return TR_REGION[byName.id]; return byName.name; } } const reg=typeof r==="object"?r:REGIONS.find(x=>x.id===id); return (reg&&reg.name)||r||id; }
function clsName(c){ if(LANG==="tr" && TR_CLASS[c]) return TR_CLASS[c]; return c; }
function roleName(rl){ if(LANG==="tr" && TR_ROLE[rl]) return TR_ROLE[rl]; return rl; }
const TRAIT_EN = { LoneWolfCurse:"Lone Wolf", Discordant:"Discordant", Cursed:"Cursed", Obsessed:"Obsessed", Vigilant:"Vigilant" };
const TRAIT_DESC_EN = { LoneWolfCurse:"Only takes expeditions solo", Discordant:"Sows discord among others", Cursed:"+10% injury risk — draws danger", Obsessed:"Cares only for goblins", Vigilant:"−8% injury risk" };
function traitName(n){ if(LANG==="tr" && TR_TRAIT[n]) return TR_TRAIT[n]; return TRAIT_EN[n]||n; }
const TR_BUILDING = {
  dormitory:"Yatakhane", tavern:"Meyhane", tannery:"Tabakhane", weavery:"Dokuma Atölyesi",
  kitchen:"Mutfak", workshop:"Atölye", warehouse:"Ambar", notice_board:"İlan Tahtası", treasury:"Hazine",
};
function buildingName(id){ if(LANG==="tr" && TR_BUILDING[id]) return TR_BUILDING[id]; return (BUILDINGS[id]&&BUILDINGS[id].name)||id; }
const TR_BUILDING_DESC = {
  dormitory:"Maceracılar burada kalmak için sana ödeme yapar. Daha iyi yataklar = daha çok kira geliri, mutluluk, kapasite ve daha hızlı yorgunluk giderme.",
  tavern:"Maceracılar senden yemek ve içki alır. Daha iyi sofra = daha çok yemek geliri ve daha yüksek sefer başarısı.",
  tannery:"Post ve derileri deri eşyaya çevir — çizme, çanta, pelerin. Üst seviyeler daha hızlı üretir ve aynı anda daha çok iş alır.",
  weavery:"Lifleri kumaşa ve ince giysilere dönüştür — tunik, elbise, goblen. Üst seviyeler daha hızlı üretir ve aynı anda daha çok iş alır.",
  kitchen:"Satmak için yemek pişir ve içki demle — güveç, ekmek, bal şarabı, ziyafet tabağı. Üst seviyeler daha hızlı üretir ve aynı anda daha çok iş alır.",
  workshop:"Ev eşyası, oyuncak, mum ve ince mücevher üret — en geniş ürün yelpazesi. Üst seviyeler daha hızlı üretir ve aynı anda daha çok iş alır.",
  warehouse:"Ganimet ve mallar için depolama alanı. Dolduğunda seferler artık mal depolayamaz.",
  notice_board:"Daha çok tahta = aynı anda daha çok görev.",
  treasury:"Lonca kademesini yükseltir, yeni bölgeleri ve üyeleri açar. En görkemli salonlar birer anıta dönüşüp loncanın şöhretini yayar.",
};
function buildingDesc(id){ if(LANG==="tr" && TR_BUILDING_DESC[id]) return TR_BUILDING_DESC[id]; return (BUILDINGS[id]&&BUILDINGS[id].desc)||""; }
function stationName(id){ return buildingName(id); }
const TR_CLASS_DESC = {
  Warrior:"Yüksek can ve savunma. Tehlikeyi üstlenir, böylece ekip sağ döner — bir seferde herkesin yaralanma riskini düşürür.",
  Rogue:"Hızlı ve eli çabuk. Fazladan ganimet bulur ve ekibi daha çabuk eve getirir.",
  Mage:"Loncadaki en yüksek saldırı, ama çok kırılgan. Tehlikeli düşmanları ezerek başarı oranını yükseltir — ama işler kötü giderse ilk düşen o olur.",
  Ranger:"Her işe gelen bir hayatta kalma ustası. Zayıflığı da yok, uzmanlığı da — her seferde güvenilir.",
  Cleric:"Düşük hasar ama herkesi hayatta tutar. Yaralanmaları güçlü biçimde azaltır ve başarısız seferden sonra ekibi daha hızlı iyileştirir.",
  Paladin:"Seçkin, kutsanmış bir savaşçı. Hem ekibi korur hem de savaş ruhunu yükseltir — bir loncanın sahaya sürebileceği en iyi koruyucu.",
  Necromancer:"Yıkıcı güçte yasak büyüler kullanır. Başarıyı büyük ölçüde artırır, ama dirilttiği ölüler bazen fazladan ganimet alıp götürür.",
  Assassin:"Karanlıktan vurur ve kaybolur. Yıldırım hızı ekibi çabucak eve getirir, üstüne seçkin, özenle toplanmış ganimet.",
  Beastmaster:"Avda sadık canavarlara komuta eder. Bir seferin her yönünü güçlendiren nadir bir çok yönlü.",
  Monk:"Gezgin bir dövüş keşişi. Zırhı zayıf ama şimşek gibi refleksleri tüm ekibin zarardan kaçınmasını sağlar; disiplinli sükûneti yolda morali yüksek tutar.",
  LoneWolf:"Yaralı, hiçbir şeyden korkmayan bir gezgin. Muazzam bir güç — ama sefere yalnızca tek başına çıkar, asla bir partiyle değil. Geç oyun için gerçek bir boss katili.",
  Hawk:"Karizmatik, hırslı bir kılıç. Yoldaşlarıyla rekor sürede bağ kurar — ama gölgesi, geri kalan herkesin arasındaki bağları zehirler.",
  Dragonborn:"Bir ejderhanın ruhuyla ve dağları sarsan bir sesle doğdu. En güçlü düşmanları biçer — ama tehlike de onun kaderine çekilir.",
  GoblinSlayer:"Goblin öldürmekten başka hiçbir şeyi umursamayan sert bir avcı. Yalnız çalışır — ama Goblin Tepeleri'nde ondan ölümcülü yoktur.",
};
const TR_CLASS_PERK = {
  Warrior:"−%6 ekip yaralanma riski", Rogue:"+%8 ganimet", Mage:"+%8 sefer başarısı",
  Ranger:"+%5 ganimet, −%2 yaralanma", Cleric:"−%10 ekip yaralanma riski",
  Paladin:"−%9 yaralanma & +%5 başarı", Necromancer:"+%12 başarı & +%8 ganimet",
  Assassin:"+%15 ganimet & %10 daha hızlı", Beastmaster:"+%6 başarı, ganimet & −%4 yaralanma",
  Monk:"−%11 yaralanma & +%4 başarı",
  LoneWolf:"Yalnızken ezici güç", Hawk:"Hızlı bağ kurar ama fesat eker", Dragonborn:"Ejderha avcısı; tüm ekibi güçlendirir", GoblinSlayer:"Yalnız; Goblin Tepeleri'nde yıkıcı",
};
const TR_TRAIT_DESC = {
  Brave:"+%10 tehlike başarısı", Loyal:"Maaş −%15", Genius:"+%15 TP", Tough:"+%20 can",
  Lucky:"+%12 ganimet", Swift:"Görevler %12 daha hızlı", Charming:"+%10 kira", Hardy:"+%10 can",
  Studious:"+%8 TP", Nimble:"Görevler %6 daha hızlı", Scavenger:"+%7 ganimet", Frugal:"Maaş −%8",
  Bold:"+%5 tehlike başarısı", Cheerful:"+%6 kira ödemesi",
  Reckless:"+%15 yaralanma riski", Greedy:"Maaş +%20", Arrogant:"−%10 TP", Drunkard:"Çift yemek masrafı",
  Frail:"−%15 can", Slow:"Görevler %12 daha yavaş", Cowardly:"−%10 tehlike başarısı", Clumsy:"+%7 yaralanma riski",
  Lazy:"−%7 TP", Sickly:"−%8 can", Sluggish:"Görevler %6 daha yavaş", Glutton:"+%50 yemek masrafı",
  Demanding:"Maaş +%10", Timid:"−%5 tehlike başarısı",
  LoneWolfCurse:"Sadece yalnız sefere çıkar", Discordant:"Diğerlerinin arasını bozar", Cursed:"+%10 yaralanma riski — tehlikeyi çeker", Obsessed:"Sadece goblinleri umursar", Vigilant:"−%8 yaralanma riski",
};
function clsDesc(c){ if(LANG==="tr" && TR_CLASS_DESC[c]) return TR_CLASS_DESC[c]; return (CLASSES[c]&&CLASSES[c].desc)||""; }
function clsPerk(c){ if(LANG==="tr" && TR_CLASS_PERK[c]) return TR_CLASS_PERK[c]; return (CLASSES[c]&&CLASSES[c].perk)||""; }
function traitDesc(n){ if(LANG==="tr" && TR_TRAIT_DESC[n]) return TR_TRAIT_DESC[n]; return TRAIT_DESC_EN[n]||n; }
const TR_REL = {
  "Romance":"Aşk", "Close Friend":"Yakın Dost", "Friend":"Dost", "Rival":"Rakip",
  "Bitter Rival":"Ezeli Rakip", "Mentor":"Akıl Hocası",
  "Warming up":"Isınıyor", "Cooling off":"Soğuyor",
};
function relTypeName(tp){ if(LANG==="tr" && TR_REL[tp]) return TR_REL[tp]; return tp; }
const TR_RANK = ["Acemi","Çırak","Kalfa","Kıdemli","Usta","Efsane"];
const TR_RANK_BY_NAME = { Novice:"Acemi", Apprentice:"Çırak", Journeyman:"Kalfa", Veteran:"Kıdemli", Master:"Usta", Legend:"Efsane" };
function rankName(i){ if(typeof i==="string"){ if(LANG==="tr" && TR_RANK_BY_NAME[i]) return TR_RANK_BY_NAME[i]; return i; } if(LANG==="tr" && TR_RANK[i]) return TR_RANK[i]; return (RANKS[i]&&RANKS[i].name)||""; }
const TR_CAT = {
  nobles:{ name:"Soylular", desc:"Lüks için cömertçe öder — mücevher, ince giysi, ziyafet." },
  church:{ name:"Kilise", desc:"Ayin ve huzur eşyaları alır — tütsü, mum, dua halısı." },
  commoners:{ name:"Halk", desc:"Gündelik eşyaya istikrarlı talep — yemek, çizme, alet, oyuncak." },
  raw:{ name:"Ham Madde", desc:"Geçen tüccarlara mütevazı fiyata satılır." },
};
function catName(c){ if(LANG==="tr" && TR_CAT[c]) return TR_CAT[c].name; return (MARKET_CATS[c]&&MARKET_CATS[c].name)||c; }
function catDesc(c){ if(LANG==="tr" && TR_CAT[c]) return TR_CAT[c].desc; return (MARKET_CATS[c]&&MARKET_CATS[c].desc)||""; }

const RECIPES = [
  // ===== Tannery: pelts & hides → leather goods =====
  { id:"r_leather", out:"leather", qty:1, time:25, station:"tannery", in:[{item:"wolf_pelt",qty:2}] },
  { id:"r_thick_hide", out:"thick_hide", qty:1, time:45, station:"tannery", in:[{item:"yeti_fur",qty:1},{item:"wolf_pelt",qty:1}] },
  { id:"r_leather_boots", out:"leather_boots", qty:1, time:50, station:"tannery", in:[{item:"leather",qty:2}] },
  { id:"r_travel_pack", out:"travel_pack", qty:1, time:80, station:"tannery", in:[{item:"leather",qty:3},{item:"cloth",qty:1}] },
  { id:"r_fur_cloak", out:"fur_cloak", qty:1, time:130, station:"tannery", in:[{item:"thick_hide",qty:2},{item:"fine_cloth",qty:1}] },
  // ===== Weavery: fibers → cloth → garments =====
  { id:"r_cloth", out:"cloth", qty:1, time:20, station:"weavery", in:[{item:"herb",qty:3}] },
  { id:"r_fine_cloth", out:"fine_cloth", qty:1, time:45, station:"weavery", in:[{item:"cloth",qty:2},{item:"crude_gem",qty:1}] },
  { id:"r_woolen_tunic", out:"woolen_tunic", qty:1, time:55, station:"weavery", in:[{item:"cloth",qty:3}] },
  { id:"r_embroidered_gown", out:"embroidered_gown", qty:1, time:120, station:"weavery", in:[{item:"fine_cloth",qty:3},{item:"silver_ore",qty:1}] },
  { id:"r_tapestry", out:"tapestry", qty:1, time:200, station:"weavery", in:[{item:"fine_cloth",qty:4},{item:"frost_crystal",qty:1}] },
  // ===== Kitchen: raw food → meals & drink =====
  { id:"r_flour", out:"flour", qty:2, time:18, station:"kitchen", in:[{item:"herb",qty:2}] },
  { id:"r_cured_meat", out:"cured_meat", qty:1, time:30, station:"kitchen", in:[{item:"rat_tail",qty:2},{item:"slime",qty:1}] },
  { id:"r_spiced_bread", out:"spiced_bread", qty:2, time:35, station:"kitchen", in:[{item:"flour",qty:2}] },
  { id:"r_hearty_stew", out:"hearty_stew", qty:2, time:45, station:"kitchen", in:[{item:"cured_meat",qty:1},{item:"herb",qty:2}] },
  { id:"r_honey_mead", out:"honey_mead", qty:1, time:70, station:"kitchen", in:[{item:"herb",qty:3},{item:"crude_gem",qty:1}] },
  { id:"r_feast_platter", out:"feast_platter", qty:1, time:160, station:"kitchen", in:[{item:"hearty_stew",qty:2},{item:"spiced_bread",qty:2},{item:"honey_mead",qty:1}] },
  // ===== Premium recipes — rare materials, big payouts =====
  { id:"r_gilded_saddle", out:"gilded_saddle", qty:1, time:150, station:"tannery", in:[{item:"thick_hide",qty:2},{item:"golden_fleece",qty:1}] },
  { id:"r_pearl_corset", out:"pearl_corset", qty:1, time:170, station:"weavery", in:[{item:"fine_cloth",qty:2},{item:"giant_pearl",qty:1}] },
  { id:"r_spirit_veil", out:"spirit_veil", qty:1, time:200, station:"weavery", in:[{item:"fine_cloth",qty:2},{item:"spirit_silk",qty:1}] },
  { id:"r_ember_brew", out:"ember_brew", qty:1, time:130, station:"kitchen", in:[{item:"honey_mead",qty:1},{item:"ember_honey",qty:1}] },
  { id:"r_royal_banquet", out:"royal_banquet", qty:1, time:240, station:"kitchen", in:[{item:"feast_platter",qty:1},{item:"dragon_truffle",qty:1}] },
  { id:"r_celestial_robe", out:"celestial_robe", qty:1, time:300, station:"weavery", in:[{item:"spirit_veil",qty:1},{item:"starfruit",qty:1},{item:"ancient_coin",qty:1}] },
  // ===== Intermediates (refined materials) =====
  { id:"r_tallow", out:"tallow", qty:2, time:16, station:"kitchen", in:[{item:"cured_meat",qty:1}] },
  { id:"r_wax", out:"wax", qty:2, time:20, station:"kitchen", in:[{item:"herb",qty:2},{item:"slime",qty:1}] },
  { id:"r_dye", out:"dye", qty:2, time:18, station:"weavery", in:[{item:"herb",qty:2},{item:"toxin_gland",qty:1}] },
  { id:"r_charcoal", out:"charcoal", qty:2, time:15, station:"workshop", in:[{item:"wood",qty:2}] },
  { id:"r_glass", out:"glass", qty:1, time:30, station:"workshop", in:[{item:"frost_crystal",qty:1}] },
  { id:"r_parchment", out:"parchment", qty:2, time:18, station:"workshop", in:[{item:"wood",qty:1},{item:"bone",qty:1}] },
  { id:"r_bone_meal", out:"bone_meal", qty:2, time:14, station:"workshop", in:[{item:"bone",qty:2}] },
  { id:"r_polished_gem", out:"polished_gem", qty:1, time:40, station:"workshop", in:[{item:"crude_gem",qty:2}] },
  { id:"r_silver_bar", out:"silver_bar", qty:1, time:35, station:"workshop", in:[{item:"silver_ore",qty:2}] },
  { id:"r_gold_leaf", out:"gold_leaf", qty:1, time:55, station:"workshop", in:[{item:"gold_ore",qty:2}] },
  // ===== Tannery additions =====
  { id:"r_leather_belt", out:"leather_belt", qty:1, time:38, station:"tannery", in:[{item:"leather",qty:1},{item:"crude_gem",qty:1}] },
  { id:"r_waterskin", out:"waterskin", qty:1, time:45, station:"tannery", in:[{item:"leather",qty:2},{item:"bone",qty:1}] },
  { id:"r_saddlebag", out:"saddlebag", qty:1, time:95, station:"tannery", in:[{item:"thick_hide",qty:1},{item:"leather",qty:2}] },
  { id:"r_bound_journal", out:"bound_journal", qty:1, time:75, station:"tannery", in:[{item:"leather",qty:1},{item:"parchment",qty:3}] },
  { id:"r_drum", out:"drum", qty:1, time:120, station:"tannery", in:[{item:"thick_hide",qty:2},{item:"wood",qty:2}] },
  // ===== Weavery additions =====
  { id:"r_wool_socks", out:"wool_socks", qty:2, time:30, station:"weavery", in:[{item:"cloth",qty:2}] },
  { id:"r_scarf", out:"scarf", qty:1, time:38, station:"weavery", in:[{item:"cloth",qty:2},{item:"dye",qty:1}] },
  { id:"r_feathered_hat", out:"feathered_hat", qty:1, time:65, station:"weavery", in:[{item:"fine_cloth",qty:1},{item:"dye",qty:1}] },
  { id:"r_silk_gloves", out:"silk_gloves", qty:1, time:90, station:"weavery", in:[{item:"fine_cloth",qty:1},{item:"spirit_silk",qty:1}] },
  { id:"r_prayer_rug", out:"prayer_rug", qty:1, time:150, station:"weavery", in:[{item:"fine_cloth",qty:3},{item:"dye",qty:2}] },
  { id:"r_ceremonial_flag", out:"ceremonial_flag", qty:1, time:170, station:"weavery", in:[{item:"fine_cloth",qty:2},{item:"gold_leaf",qty:1},{item:"dye",qty:2}] },
  // ===== Kitchen additions =====
  { id:"r_jam", out:"jam", qty:1, time:24, station:"kitchen", in:[{item:"herb",qty:3}] },
  { id:"r_cheese_wheel", out:"cheese_wheel", qty:1, time:50, station:"kitchen", in:[{item:"cured_meat",qty:1},{item:"slime",qty:2}] },
  { id:"r_roast_fowl", out:"roast_fowl", qty:1, time:55, station:"kitchen", in:[{item:"cured_meat",qty:2},{item:"herb",qty:1}] },
  { id:"r_apple_pie", out:"apple_pie", qty:1, time:48, station:"kitchen", in:[{item:"flour",qty:2},{item:"jam",qty:1}] },
  { id:"r_pickled_jar", out:"pickled_jar", qty:2, time:40, station:"kitchen", in:[{item:"herb",qty:2},{item:"glass",qty:1}] },
  { id:"r_spiced_wine", out:"spiced_wine", qty:1, time:85, station:"kitchen", in:[{item:"honey_mead",qty:1},{item:"jam",qty:1}] },
  // ===== Workshop: candles, soap, household, toys, jewelry =====
  { id:"r_candle", out:"candle", qty:2, time:24, station:"workshop", in:[{item:"tallow",qty:1},{item:"wax",qty:1}] },
  { id:"r_soap", out:"soap", qty:2, time:30, station:"workshop", in:[{item:"tallow",qty:1},{item:"herb",qty:2}] },
  { id:"r_wooden_toy", out:"wooden_toy", qty:1, time:28, station:"workshop", in:[{item:"wood",qty:3}] },
  { id:"r_spinning_top", out:"spinning_top", qty:2, time:32, station:"workshop", in:[{item:"wood",qty:1},{item:"dye",qty:1}] },
  { id:"r_rag_doll", out:"rag_doll", qty:1, time:36, station:"workshop", in:[{item:"cloth",qty:2},{item:"dye",qty:1}] },
  { id:"r_kite", out:"kite", qty:1, time:44, station:"workshop", in:[{item:"cloth",qty:1},{item:"wood",qty:1},{item:"dye",qty:1}] },
  { id:"r_beaded_necklace", out:"beaded_necklace", qty:1, time:50, station:"workshop", in:[{item:"polished_gem",qty:1},{item:"cloth",qty:1}] },
  { id:"r_lantern", out:"lantern", qty:1, time:70, station:"workshop", in:[{item:"glass",qty:2},{item:"silver_bar",qty:1}] },
  { id:"r_carved_figurine", out:"carved_figurine", qty:1, time:80, station:"workshop", in:[{item:"wood",qty:2},{item:"polished_gem",qty:1}] },
  { id:"r_hand_mirror", out:"hand_mirror", qty:1, time:90, station:"workshop", in:[{item:"glass",qty:1},{item:"silver_bar",qty:1}] },
  { id:"r_silver_ring", out:"silver_ring", qty:1, time:85, station:"workshop", in:[{item:"silver_bar",qty:1},{item:"polished_gem",qty:1}] },
  { id:"r_gemmed_brooch", out:"gemmed_brooch", qty:1, time:130, station:"workshop", in:[{item:"silver_bar",qty:1},{item:"polished_gem",qty:2}] },
  { id:"r_music_box", out:"music_box", qty:1, time:180, station:"workshop", in:[{item:"carved_figurine",qty:1},{item:"silver_bar",qty:1},{item:"polished_gem",qty:1}] },
  { id:"r_jeweled_chalice", out:"jeweled_chalice", qty:1, time:220, station:"workshop", in:[{item:"gold_leaf",qty:2},{item:"polished_gem",qty:2}] },
  { id:"r_golden_crown", out:"golden_crown", qty:1, time:280, station:"workshop", in:[{item:"gold_leaf",qty:3},{item:"polished_gem",qty:2},{item:"ancient_coin",qty:1}] },
  // charcoal & bone-meal goods
  { id:"r_incense", out:"incense", qty:2, time:34, station:"workshop", in:[{item:"charcoal",qty:1},{item:"herb",qty:2}] },
  { id:"r_water_filter", out:"water_filter", qty:1, time:46, station:"workshop", in:[{item:"charcoal",qty:2},{item:"cloth",qty:1}] },
  { id:"r_fertilizer", out:"fertilizer", qty:2, time:28, station:"kitchen", in:[{item:"bone_meal",qty:2},{item:"herb",qty:1}] },
  { id:"r_fine_china", out:"fine_china", qty:1, time:120, station:"workshop", in:[{item:"bone_meal",qty:2},{item:"glass",qty:1},{item:"dye",qty:1}] },
  // ===== Forge: ores & scrap → bars → tools, arms & trophies (workshop) =====
  { id:"r_iron_bar", out:"iron_bar", qty:1, time:30, station:"workshop", in:[{item:"iron_ore",qty:2},{item:"scrap_iron",qty:1}] },
  { id:"r_iron_bar_bog", out:"iron_bar", qty:1, time:34, station:"workshop", in:[{item:"bog_iron",qty:2},{item:"charcoal",qty:1}] },
  { id:"r_steel_bar", out:"steel_bar", qty:1, time:55, station:"workshop", in:[{item:"iron_bar",qty:1},{item:"steel_scrap",qty:1},{item:"charcoal",qty:1}] },
  { id:"r_horseshoe", out:"horseshoe", qty:2, time:40, station:"workshop", in:[{item:"iron_bar",qty:1}] },
  { id:"r_iron_nails", out:"iron_nails", qty:3, time:34, station:"workshop", in:[{item:"iron_bar",qty:1}] },
  { id:"r_hand_tools", out:"hand_tools", qty:1, time:60, station:"workshop", in:[{item:"iron_bar",qty:2},{item:"wood",qty:1}] },
  { id:"r_iron_helm", out:"iron_helm", qty:1, time:85, station:"workshop", in:[{item:"iron_bar",qty:2},{item:"leather",qty:1}] },
  { id:"r_steel_sword", out:"steel_sword", qty:1, time:120, station:"workshop", in:[{item:"steel_bar",qty:2},{item:"wood",qty:1}] },
  { id:"r_steel_shield", out:"steel_shield", qty:1, time:135, station:"workshop", in:[{item:"steel_bar",qty:2},{item:"thick_hide",qty:1}] },
  { id:"r_war_axe", out:"war_axe", qty:1, time:160, station:"workshop", in:[{item:"steel_bar",qty:2},{item:"orc_tusk",qty:1},{item:"wood",qty:1}] },
  { id:"r_goblin_charm", out:"goblin_charm", qty:1, time:36, station:"workshop", in:[{item:"goblin_ear",qty:2},{item:"bone",qty:1}] },
  { id:"r_tusk_horn", out:"tusk_horn", qty:1, time:95, station:"workshop", in:[{item:"orc_tusk",qty:2},{item:"silver_bar",qty:1}] },
  // ⚜️ CLASS RELICS — only appear when that rare class is in your guild. Crafting one equips a hero permanently.
  { id:"r_holy_armor", out:"holy_armor", qty:1, time:180, station:"tannery", classReq:"Paladin", boon:"holyArmor",
    in:[{item:"thick_hide",qty:2},{item:"silver_bar",qty:2},{item:"saints_finger",qty:1}] },
  { id:"r_bone_relic", out:"bone_relic", qty:1, time:180, station:"workshop", classReq:"Necromancer", boon:"boneRelic",
    in:[{item:"bone_meal",qty:3},{item:"cursed_relic",qty:2},{item:"grimoire_page",qty:1}] },
  { id:"r_shadow_cloak", out:"shadow_cloak", qty:1, time:180, station:"weavery", classReq:"Assassin", boon:"shadowCloak",
    in:[{item:"spirit_silk",qty:2},{item:"fine_cloth",qty:2},{item:"void_shard",qty:1}] },
  { id:"r_beast_horn", out:"beast_horn", qty:1, time:180, station:"workshop", classReq:"Beastmaster", boon:"beastHorn",
    in:[{item:"yeti_fur",qty:2},{item:"dragon_scale",qty:1},{item:"warlord_skull",qty:1}] },
  { id:"r_prayer_beads", out:"prayer_beads", qty:1, time:180, station:"weavery", classReq:"Monk", boon:"prayerBeads",
    in:[{item:"spirit_silk",qty:1},{item:"polished_gem",qty:2},{item:"saints_finger",qty:1}] },
];

// permanent boons granted when a class relic is crafted (applied to one hero of that class)
const CLASS_BOONS = {
  holyArmor:  { label:"Holy Plate", desc:"Greatly reduced injury risk", apply:a=>({...a, boon:"holyArmor"}) },
  boneRelic:  { label:"Bone Relic", desc:"Cheats death once — survives a fatal blow", apply:a=>({...a, boon:"boneRelic"}) },
  shadowCloak:{ label:"Shadow Cloak", desc:"Faster expeditions & better loot", apply:a=>({...a, boon:"shadowCloak"}) },
  beastHorn:  { label:"Wild Horn", desc:"Summons a beast — boosts whole party success", apply:a=>({...a, boon:"beastHorn"}) },
  prayerBeads:{ label:"Prayer Beads", desc:"Serene focus — party heals faster and dodges more harm", apply:a=>({...a, boon:"prayerBeads"}) },
};

// ==================== §DATA-MARKET · PAZAR KATEGORİLERİ & FİYATLAMA ====================
// Every sellable item belongs to a market category. Prices fluctuate per category,
// so there's no single "always best" good — the smart play shifts week to week.
// ==================== CUSTOMER CLASSES (market segments) ====================
// Goods are sold to three kinds of buyer. Each has its own fluctuating demand,
// so "what should I make?" depends on who's paying well this week.
const MARKET_CATS = {
  nobles:    { name:"Nobles", icon:"👑", desc:"Pay handsomely for luxury — jewelry, fine garments, feasts." },
  church:    { name:"Church", icon:"⛪", desc:"Buy ritual & comfort goods — incense, candles, prayer rugs." },
  commoners: { name:"Commoners", icon:"🏘️", desc:"Steady demand for everyday wares — food, boots, tools, toys." },
  raw:       { name:"Raw Materials", icon:"⛏️", desc:"Sold to passing traders at modest rates." },
};
// explicit customer class for finished/refined goods; everything else → raw
const CUSTOMER_OF = {
  // 👑 Nobles — luxury, status, finery
  embroidered_gown:"nobles", tapestry:"nobles", pearl_corset:"nobles", spirit_veil:"nobles", celestial_robe:"nobles",
  fur_cloak:"nobles", gilded_saddle:"nobles", feast_platter:"nobles", royal_banquet:"nobles", ember_brew:"nobles",
  silver_ring:"nobles", gemmed_brooch:"nobles", jeweled_chalice:"nobles", golden_crown:"nobles", hand_mirror:"nobles",
  music_box:"nobles", fine_china:"nobles", beaded_necklace:"nobles", honey_mead:"nobles", spiced_wine:"nobles",
  steel_sword:"nobles", steel_shield:"nobles", war_axe:"nobles", iron_helm:"nobles", tusk_horn:"nobles",
  // ⛪ Church — ritual, ceremony, comfort
  incense:"church", candle:"church", prayer_rug:"church", ceremonial_flag:"church", bound_journal:"church",
  lantern:"church", carved_figurine:"church", drum:"church", parchment:"church",
  // 🏘️ Commoners — everyday goods (default for finished/refined that aren't above)
  // 🏆 storied trophies (raw tier, but sold to fitting buyers)
  saints_finger:"church", grimoire_page:"church", broken_seal:"nobles", rat_king_crown:"nobles",
  chieftain_banner:"nobles", frozen_heart:"nobles", drowned_locket:"commoners", warlord_skull:"commoners", carved_totem:"commoners",
};
const ITEM_CAT = (()=>{
  const m={};
  Object.keys(ITEMS).forEach(k=>{
    const t=ITEMS[k].tier;
    if(CUSTOMER_OF[k]){ m[k]=CUSTOMER_OF[k]; return; } // explicit customer (incl. storied trophies) wins
    if(t==="raw"){ m[k]="raw"; return; }
    m[k] = "commoners"; // fin/mid default to commoners
  });
  return m;
})();
const catOf = (item)=> ITEM_CAT[item] || "raw";
// fresh market state: every segment starts at fair price (1.0)
function freshMarket(){ const m={}; Object.keys(MARKET_CATS).forEach(c=>m[c]={price:1.0}); return m; }
// current sell price for one unit, rounded
function unitPrice(item, market){
  const cat=catOf(item);
  if(cat==="raw") return ITEMS[item].value; // raw materials sell at a stable fair price
  const mult=(market&&market[cat]&&market[cat].price)||1.0;
  return Math.max(1, Math.round(ITEMS[item].value * mult));
}


const BUILDINGS = {
  dormitory:{ name:"Dormitory", icon:"🛏️", desc:"Adventurers pay you to lodge here. Better beds = more rent income, happiness, capacity & faster fatigue recovery.", levels:[
    {cost:0,rentPerHead:7,happiness:0,capacity:3,restBonus:0},{cost:300,rentPerHead:11,happiness:5,capacity:5,restBonus:2},
    {cost:900,rentPerHead:15,happiness:12,capacity:7,restBonus:4},{cost:2400,rentPerHead:24,happiness:20,capacity:10,restBonus:6},
    {cost:6000,rentPerHead:40,happiness:30,capacity:14,restBonus:9},{cost:13000,rentPerHead:55,happiness:38,capacity:20,restBonus:12},
    {cost:26000,rentPerHead:72,happiness:46,capacity:24,restBonus:16} ]},
  tavern:{ name:"Tavern", icon:"🍺", desc:"Adventurers buy food & ale from you. Better fare = more food income & higher expedition success.", levels:[
    {cost:0,foodPerHead:6,morale:0,successBonus:0},{cost:250,foodPerHead:10,morale:6,successBonus:0.03},
    {cost:750,foodPerHead:14,morale:14,successBonus:0.06},{cost:2000,foodPerHead:22,morale:22,successBonus:0.10},{cost:5200,foodPerHead:35,morale:34,successBonus:0.15} ]},
  tannery:{ name:"Tannery", icon:"👜", desc:"Turn pelts & hides into leather goods — boots, packs, cloaks. Higher levels craft faster and allow more jobs at once.", levels:[
    {cost:0,speedMult:1.0,slots:1},{cost:400,speedMult:0.92,slots:1},{cost:1200,speedMult:0.84,slots:2},{cost:3000,speedMult:0.76,slots:2},
    {cost:6500,speedMult:0.68,slots:3},{cost:12000,speedMult:0.62,slots:3},{cost:20000,speedMult:0.57,slots:4},{cost:32000,speedMult:0.55,slots:4} ]},
  weavery:{ name:"Weavery", icon:"🧵", desc:"Spin fibers into cloth and fine garments — tunics, gowns, tapestries. Higher levels craft faster and allow more jobs at once.", levels:[
    {cost:0,speedMult:1.0,slots:1,locked:true},{cost:500,speedMult:0.92,slots:1},{cost:1400,speedMult:0.84,slots:2},{cost:3400,speedMult:0.74,slots:2},
    {cost:7000,speedMult:0.66,slots:3},{cost:13000,speedMult:0.60,slots:3},{cost:21000,speedMult:0.55,slots:4},{cost:34000,speedMult:0.52,slots:4} ]},
  kitchen:{ name:"Kitchen", icon:"🍲", desc:"Cook meals and brew drink to sell — stew, bread, mead, feast platters. Higher levels craft faster and allow more jobs at once.", levels:[
    {cost:0,speedMult:1.0,slots:1,locked:true},{cost:1200,speedMult:0.92,slots:1},{cost:3500,speedMult:0.83,slots:2},{cost:8000,speedMult:0.74,slots:2},
    {cost:15000,speedMult:0.66,slots:3},{cost:24000,speedMult:0.59,slots:3},{cost:36000,speedMult:0.53,slots:4},{cost:52000,speedMult:0.50,slots:4} ]},
  workshop:{ name:"Workshop", icon:"🔨", desc:"Craft household goods, toys, candles and fine jewelry — the widest range of wares. Higher levels craft faster and allow more jobs at once.", levels:[
    {cost:0,speedMult:1.0,slots:1,locked:true},{cost:900,speedMult:0.92,slots:1},{cost:2800,speedMult:0.83,slots:2},{cost:6500,speedMult:0.74,slots:2},
    {cost:12000,speedMult:0.66,slots:3},{cost:20000,speedMult:0.59,slots:3},{cost:30000,speedMult:0.53,slots:4},{cost:44000,speedMult:0.50,slots:4} ]},
  warehouse:{ name:"Warehouse", icon:"🛢️", desc:"Storage space for loot and goods. Expeditions can't store more once it's full.", levels:[
    {cost:0,capacity:40},{cost:350,capacity:80},{cost:1000,capacity:150},{cost:2800,capacity:280},{cost:7000,capacity:500} ]},
  notice_board:{ name:"Notice Board", icon:"📜", desc:"More boards = more quests at once.", levels:[
    {cost:0,questSlots:2},{cost:600,questSlots:3},{cost:1800,questSlots:4},{cost:4500,questSlots:6} ]},
  treasury:{ name:"Treasury", icon:"🏰", desc:"Raises guild tier, unlocking regions & recruits. The grandest halls become monuments that spread your guild's fame.", levels:[
    {cost:0,tier:0},{cost:800,tier:1},{cost:2500,tier:2},{cost:6000,tier:3},{cost:14000,tier:4},{cost:30000,tier:5},
    {cost:60000,tier:5,renownBonus:20},{cost:120000,tier:5,renownBonus:50},{cost:250000,tier:5,renownBonus:100} ]},
};
const STARTING_GOLD = 650;

// ==================== §HELPERS · GENEL YARDIMCILAR ====================
const rint = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];
const uid = ()=>Math.random().toString(36).slice(2,9);
const rankForLevel = (lvl)=>{ let r=RANKS[0]; for(const rk of RANKS){ if(lvl>=rk.minLevel) r=rk; } return r; };
const xpForLevel = (lvl)=>Math.floor(28*Math.pow(lvl,1.25));
const fmtTime = (s)=>{ s=Math.max(0,Math.ceil(s)); const m=Math.floor(s/60); const ss=s%60; return m>0?`${m}m ${ss}s`:`${ss}s`; };
const DANGER_LABELS = ["", "Very Safe", "Safe", "Risky", "Dangerous", "Deadly", "Lethal"];
const DANGER_LABELS_TR = ["", "Çok Güvenli", "Güvenli", "Riskli", "Tehlikeli", "Ölümcül", "Mezar"];
const dangerLabel = (d)=>`${(LANG==="tr"?DANGER_LABELS_TR[d]:DANGER_LABELS[d])||(LANG==="tr"?"Mezar":"Lethal")} (${d}/6)`;
const dangerName = (d)=>`${(LANG==="tr"?DANGER_LABELS_TR[d]:DANGER_LABELS[d])||(LANG==="tr"?"Mezar":"Lethal")}`;
const TR_TEAM = [null,"Pişkin Takım","Çelikleşmiş Bölük","Efsanevi Yoldaşlık"];
function teamTierName(i){ if(LANG==="tr" && TR_TEAM[i]) return TR_TEAM[i]; return (TEAM_TIERS[i]&&TEAM_TIERS[i].name)||""; }
const TR_BOON = {
  holyArmor:{ label:"Kutsal Zırh", desc:"Büyük ölçüde azalmış yaralanma riski" },
  boneRelic:{ label:"Kemik Emaneti", desc:"Ölümü bir kez aldatır — ölümcül bir darbeden sağ çıkar" },
  shadowCloak:{ label:"Gölge Pelerini", desc:"Daha hızlı seferler & daha iyi ganimet" },
  beastHorn:{ label:"Vahşi Boynuz", desc:"Bir canavar çağırır — tüm ekibin başarısını artırır" },
  prayerBeads:{ label:"Dua Boncukları", desc:"Dingin odak — ekip daha hızlı iyileşir ve zarardan daha çok kaçınır" },
};
function boonLabel(b){ if(LANG==="tr" && TR_BOON[b]) return TR_BOON[b].label; return (CLASS_BOONS[b]&&CLASS_BOONS[b].label)||""; }
function boonDesc(b){ if(LANG==="tr" && TR_BOON[b]) return TR_BOON[b].desc; return (CLASS_BOONS[b]&&CLASS_BOONS[b].desc)||""; }
const dangerColor = (d)=> d<=1?"#6fae6f" : d<=2?"#b8c45b" : d<=3?"#e0a23c" : d<=4?"#d98a3c" : "#c0563f";

// Estimate party success & injury for a region — must mirror the tick resolution formula.
function estimateOutcome(party, region, tavernSucc, rels){
  if(!party.length) return null;
  let partySuccess=0, partyInjury=0;
  party.forEach(a=>{ const m=CLASSES[a.cls].mod||{}; partySuccess+=m.partySuccess||0; partyInjury+=m.partyInjury||0; });
  // relationship morale bonus (mirror of tick)
  let relBonus=0;
  if(party.length>1 && rels){
    let sum=0,pairs=0;
    for(let i=0;i<party.length;i++) for(let j=i+1;j<party.length;j++){ sum+=getRel(rels,party[i].id,party[j].id); pairs++; }
    relBonus = pairs? (sum/pairs)/100*0.08 : 0;
  }
  let succSum=0, injSum=0;
  const ceil = region.danger>=5 ? 0.90 : region.danger>=3 ? 0.94 : 0.97;
  party.forEach(a=>{
    const cs=CLASSES[a.cls];
    let succ = 0.65 + (a.level/100) + (tavernSucc||0) + partySuccess + relBonus
      + posMod(a,"dangerSuccess") + (a.neg.mod.dangerSuccess||0) + (cs.atk-12)*0.005 - region.danger*0.04;
    if(a.cls==="LoneWolf" && party.length===1) succ += 0.22;
    if(a.cls==="GoblinSlayer" && party.length===1){ succ += 0.15; if(region.id==="goblin_hills") succ += 0.30; }
    if(a.fatigue>=70) succ -= 0.12; else if(a.fatigue>=40) succ -= 0.05;
    succ = Math.max(0.2, Math.min(ceil, succ));
    succSum += succ;
    const injIfFail = Math.max(0.02, 0.12 + region.danger*0.05 + (a.neg.mod.injuryChance||0) + partyInjury - (cs.def-10)*0.004);
    injSum += (1-succ)*injIfFail; // chance this member gets hurt
  });
  const avgSucc = succSum/party.length;
  const anyInjury = 1 - party.reduce((p,_,i)=>{ // prob nobody hurt
    const a=party[i]; const cs=CLASSES[a.cls]; let succ=0.65+(a.level/100)+(tavernSucc||0)+partySuccess+relBonus+posMod(a,"dangerSuccess")+(a.neg.mod.dangerSuccess||0)+(cs.atk-12)*0.005-region.danger*0.04;
    succ=Math.max(0.2,Math.min(ceil,succ));
    const injIfFail=Math.max(0.02,0.12+region.danger*0.05+(a.neg.mod.injuryChance||0)+partyInjury-(cs.def-10)*0.004);
    return p*(1-(1-succ)*injIfFail);
  },1);
  // death risk: only in danger 3+, when a fail+injury roll converts to death
  let anyDeath=0;
  if(region.danger>=3){
    anyDeath = 1 - party.reduce((p,a)=>{
      const cs=CLASSES[a.cls]; let succ=0.65+(a.level/100)+(tavernSucc||0)+partySuccess+relBonus+posMod(a,"dangerSuccess")+(a.neg.mod.dangerSuccess||0)+(cs.atk-12)*0.005-region.danger*0.04;
      succ=Math.max(0.2,Math.min(ceil,succ));
      const injIfFail=Math.max(0.02,0.12+region.danger*0.05+(a.neg.mod.injuryChance||0)+partyInjury-(cs.def-10)*0.004);
      let dc=(region.danger-2)*0.035+(a.neg.mod.injuryChance||0)*0.5+partyInjury*0.3;
      dc=Math.max(0,Math.min(0.30,dc));
      const pDeath=(1-succ)*injIfFail*dc;
      return p*(1-pDeath);
    },1);
  }
  return { success:Math.round(avgSucc*100), injury:Math.round(anyInjury*100), death:Math.round(anyDeath*100), relBonus };
}
const outcomeColor=(pct)=> pct>=75?"#6fae6f" : pct>=55?"#e0a23c" : "#c0563f";

// ==================== §LOGIC · İLİŞKİLER & OYUN MANTIĞI ====================
// Stored in state.rels keyed by sorted pair "idA|idB" → { score:-100..100, met:elapsed }
const relKey=(a,b)=>[a,b].sort().join("|");
function getRel(rels,a,b){ return rels[relKey(a,b)]?.score||0; }
function bumpRel(rels,a,b,delta,elapsed){
  const k=relKey(a,b); const cur=rels[k]||{score:0,met:elapsed};
  cur.score=Math.max(-100,Math.min(100,cur.score+delta)); rels[k]=cur; return cur.score;
}
// count of expeditions a pair has survived together (forged camaraderie)
function getTogether(rels,a,b){ return rels[relKey(a,b)]?.together||0; }
function bumpTogether(rels,a,b,elapsed){
  const k=relKey(a,b); const cur=rels[k]||{score:0,met:elapsed}; cur.together=(cur.together||0)+1; rels[k]=cur; return cur.together;
}
// a party's "veteran team" tier from how many runs its members have shared (min across pairs)
// 0 = green, 1 = Seasoned (5+), 2 = Hardened (15+), 3 = Legendary Band (30+)
function teamTier(rels, party){
  if(party.length<2) return 0;
  let minRuns=Infinity;
  for(let i=0;i<party.length;i++) for(let j=i+1;j<party.length;j++){
    minRuns=Math.min(minRuns, getTogether(rels, party[i].id, party[j].id));
  }
  if(minRuns>=30) return 3; if(minRuns>=15) return 2; if(minRuns>=5) return 1; return 0;
}
const TEAM_TIERS=[
  null,
  {name:"Seasoned Band", icon:"🛡️", bonus:0.03, desc:"5+ runs together — a little extra trust"},
  {name:"Hardened Company", icon:"⚔️", bonus:0.06, desc:"15+ runs together — they fight as one"},
  {name:"Legendary Fellowship", icon:"🌟", bonus:0.10, desc:"30+ runs together — a band for the ages"},
];
// Determine relationship type from score + the two adventurers
function relType(score, a, b, rels, roster){
  if(score>=70){
    // romance if similar level & enough closeness — but only ONE romance per adventurer
    if(Math.abs(a.level-b.level)<=8){
      if(rels && roster){
        const hasOtherRomance=(who,partner)=>roster.some(o=>{
          if(o.id===who.id||o.id===partner.id) return false;
          const sc=getRel(rels,who.id,o.id);
          return sc>=70 && Math.abs(who.level-o.level)<=8;
        });
        // if either already has a romance with someone else, this stays a deep friendship
        if(hasOtherRomance(a,b)||hasOtherRomance(b,a)) return {type:"Close Friend", icon:"🤝", color:"#6fae6f"};
      }
      return {type:"Romance", icon:"💞", color:"#e07a9c"};
    }
    return {type:"Close Friend", icon:"🤝", color:"#6fae6f"};
  }
  if(score>=30) return {type:"Friend", icon:"😊", color:"#6fae6f"};
  if(score<=-60) return {type:"Bitter Rival", icon:"💢", color:"#c0563f"};
  if(score<=-25) return {type:"Rival", icon:"😠", color:"#d98a3c"};
  // mentorship: big level gap + positive-ish
  if(score>=10 && Math.abs(a.level-b.level)>=12){
    const mentor=a.level>b.level?a:b, prot=a.level>b.level?b:a;
    return {type:"Mentor", icon:"🎓", color:"#5b9bd5", mentor:mentor.id, protege:prot.id};
  }
  return null; // neutral / acquaintance
}
// Trait compatibility: clashing traits drift apart, complementary drift together
function passiveDrift(a,b){
  let d=0.12; // baseline: living together warms VERY slowly; most stay acquaintances
  const goods=[a.pos.name,b.pos.name], bads=[a.neg.name,b.neg.name];
  if(bads.includes("Greedy") && bads.includes("Greedy")) d-=0.6;
  if(a.neg.name===b.neg.name) d-=0.3; // shared flaw → friction
  if(a.pos.name===b.pos.name) d+=0.25; // shared virtue → bond
  if(goods.includes("Charming")) d+=0.2;
  if(bads.includes("Arrogant")) d-=0.4;
  if(bads.includes("Cold")) d-=0.3;
  return d;
}

function classesAvailableAt(renown){
  // normal classes always; rare classes unlock as renown grows
  const list=[...NORMAL_CLASSES];
  Object.keys(CLASSES).forEach(k=>{ if(CLASSES[k].rare && renown>=CLASSES[k].minRenown) list.push(k); });
  return list;
}
function rollClass(renown, exclude){
  exclude = exclude || [];
  // ultra-rare unique heroes: tiny flat chance on any roll
  const uniques=Object.keys(CLASSES).filter(k=>CLASSES[k].unique && !exclude.includes(k));
  if(uniques.length && Math.random() < 0.02) return pick(uniques); // ~2% per board slot roll
  const rares=Object.keys(CLASSES).filter(k=>CLASSES[k].rare && !CLASSES[k].unique && renown>=CLASSES[k].minRenown);
  // chance of a rare recruit scales with renown, capped at 35%
  if(rares.length && Math.random() < Math.min(0.35, renown/200)) return pick(rares);
  return pick(NORMAL_CLASSES);
}
// which unique classes are already owned or sitting on the board (can't appear twice)
function uniquesInPlay(s){
  const set=new Set();
  (s.adventurers||[]).forEach(a=>{ if(CLASSES[a.cls]&&CLASSES[a.cls].unique) set.add(a.cls); });
  (s.recruits||[]).forEach(a=>{ if(CLASSES[a.cls]&&CLASSES[a.cls].unique) set.add(a.cls); });
  return [...set];
}
// combined positive-trait modifier for a key (sums pos + pos2 if present)
function posMod(a, key){ return (a.pos.mod[key]||0) + ((a.pos2&&a.pos2.mod[key])||0); }
function posMul(a, key){ return ((a.pos.mod[key]||1)) * ((a.pos2&&a.pos2.mod[key])||1); }
function makeAdventurer(tier, forceClass, renown=0, exclude){
  const cls = forceClass || rollClass(renown, exclude);
  const base = CLASSES[cls];
  // ----- UNIQUE named heroes: fixed traits, fixed name, high level & cost -----
  if(base.unique){
    const UNIQUE={
      LoneWolf:{ name:{en:"The Black Swordsman",tr:"Kara Giyinmiş Şövalye"}, gender:"♂",
        pos:[{name:"Brave",desc:"+10% danger success",mod:{dangerSuccess:0.10}},{name:"Tough",desc:"+20% HP",mod:{hpMult:1.20}},{name:"Lucky",desc:"+12% loot",mod:{lootMult:1.12}}],
        neg:{name:"LoneWolfCurse",desc:"Only fights alone",mod:{}} },
      Hawk:{ name:{en:"The Hawk of Darkness",tr:"Karanlığın Şahini"}, gender:"♂",
        pos:[{name:"Charming",desc:"+10% rent",mod:{rentMult:1.10}},{name:"Swift",desc:"Quests 12% faster",mod:{speedMult:0.88}},{name:"Genius",desc:"+15% XP",mod:{xpMult:1.15}}],
        neg:{name:"Discordant",desc:"Sows discord among others",mod:{}} },
      Dragonborn:{ name:{en:"The Dragonborn",tr:"Ejderha Doğumlu"}, gender:"♂",
        pos:[{name:"Brave",desc:"+10% danger success",mod:{dangerSuccess:0.10}},{name:"Genius",desc:"+15% XP",mod:{xpMult:1.15}},{name:"Swift",desc:"Quests 12% faster",mod:{speedMult:0.88}}],
        neg:{name:"Cursed",desc:"Draws danger to itself",mod:{injuryChance:0.10}} },
      GoblinSlayer:{ name:{en:"The Goblin Slayer",tr:"Goblin Katili"}, gender:"♂",
        pos:[{name:"Brave",desc:"+10% danger success",mod:{dangerSuccess:0.10}},{name:"Tough",desc:"+20% HP",mod:{hpMult:1.20}},{name:"Vigilant",desc:"−8% injury risk",mod:{injuryChance:-0.08}}],
        neg:{name:"Obsessed",desc:"Cares only for goblins",mod:{}} },
    };
    const u=UNIQUE[cls];
    const level=Math.max(1, 20 + rint(0,8) + tier*2);
    const p0=u.pos[0], p1=u.pos[1], p2=u.pos[2];
    const hpMult=(p0.mod.hpMult||1)*(p1.mod.hpMult||1)*(p2.mod.hpMult||1);
    const maxHp=Math.floor(base.hp*hpMult*(1+(level-1)*0.06));
    let rankIndex=0; RANKS.forEach((rk,i)=>{ if(level>=rk.minLevel) rankIndex=i; });
    return { id:uid(), name:(LANG==="tr"?u.name.tr:u.name.en), _uname:u.name, cls, level, xp:0, rankIndex,
      gender:u.gender, fatigue:0, task:"rest", maxHp, hp:maxHp,
      pos:p0, pos2:p1, pos3:p2, neg:u.neg, unique:true, status:"idle", questId:null, injuryUntil:0,
      hireCost: Math.round(1800 + level*40 + tier*120), wage: 20 + level*3 };
  }
  const pos = pick(POSITIVE_TRAITS);
  const neg = pick(NEGATIVE_TRAITS);
  // rare classes are gifted: they get a SECOND positive trait (different from the first)
  let pos2=null;
  if(base.rare){ do{ pos2=pick(POSITIVE_TRAITS); } while(pos2.name===pos.name); }
  // rare classes tend to arrive more experienced
  const bonus = base.rare ? rint(8,18) : 0;
  const level = 1 + rint(0, tier*4) + bonus;
  const hpMult = (pos.mod.hpMult||1)*(neg.mod.hpMult||1)*((pos2&&pos2.mod.hpMult)||1);
  const maxHp = Math.floor(base.hp * hpMult * (1+(level-1)*0.06));
  // rankIndex = confirmed rank; recruits arrive already at the rank their level earns
  let rankIndex=0; RANKS.forEach((rk,i)=>{ if(level>=rk.minLevel) rankIndex=i; });
  const first = pick(FIRST_NAMES);
  const gender = MALE_NAMES.includes(first) ? "♂"
               : FEMALE_NAMES.includes(first) ? "♀"
               : (Math.random()<0.5?"♂":"♀"); // neutral names get random gender
  return { id:uid(), name:`${first} ${pick(LAST_NAMES)}`, cls, level, xp:0, rankIndex,
    gender,
    fatigue: 0, task: "rest",
    maxHp, hp:maxHp, pos, pos2, neg, status:"idle", questId:null, injuryUntil:0,
    hireCost: Math.round((25 + level*12 + tier*30) * (base.rare?2.2:1)), wage: 3 + level*2 + (base.rare?4:0) };
}
// rank an adventurer is eligible for given their level
function eligibleRankIndex(level){ let r=0; RANKS.forEach((rk,i)=>{ if(level>=rk.minLevel) r=i; }); return r; }
// cost to promote into rank index i
function promotionCost(i){ return [0,150,500,1400,3500,8000][i]||0; }

// ==================== §EVENTS · OLAYLAR ====================
// Small events: applied automatically, return a log message.
// Big events: open a decision modal with choices.
// Each has a `when(s)` guard so it only fires if relevant.
const rsum = (inv)=>Object.values(inv).reduce((a,b)=>a+b,0);

const SMALL_EVENTS = [
  { id:"good_harvest", weight:10, when:s=>true, apply:(s)=>{ const g=rint(20,60);
    return { gold:g, msg: LANG==="tr"?`🌾 Ashford'da bereketli bir hasat — tüccarlar iyi ödüyor. Geçen ticaretten +${g}A.`:`🌾 A good harvest in Ashford — merchants pay well. +${g}G in passing trade.` }; } },
  { id:"wandering_bard", weight:8, when:s=>s.adventurers.length>0, apply:(s)=>{
    return { moraleNote:true, msg: LANG==="tr"?`🎵 Gezgin bir ozan bu gece loncada keyifleri yükseltti.`:`🎵 A wandering bard lifted spirits at the hall tonight.` }; } },
  { id:"lost_purse", weight:7, when:s=>true, apply:(s)=>{ const g=rint(10,35);
    return { gold:-g, msg: LANG==="tr"?`💸 Dikkatsiz bir kâtip ${g}A'yı kaybetti. Gitti.`:`💸 A careless clerk misplaced ${g}G. It is gone.` }; } },
  { id:"market_demand", weight:9, when:s=>true, apply:(s)=>{
    const cats=["nobles","church","commoners"]; const cat=pick(cats); const m={...(s.market||freshMarket())};
    m[cat]={price:Math.min(1.5, ((m[cat]&&m[cat].price)||1.0)+0.4)};
    const flavor= LANG==="tr"?{nobles:`👑 Soylu bir düğün yaklaşıyor — zümre lüks istiyor! Onların malları fırlıyor.`,
      church:`⛪ Kutsal bir festival yaklaşıyor — Kilise ayin eşyalarını hevesle alıyor. Fiyatlar yükseliyor.`,
      commoners:`🏘️ Sokakları bir panayır dolduruyor — halk alışverişte. Gündelik eşya daha çok ediyor.`}:{nobles:`👑 A noble wedding approaches — the gentry crave luxury! Prices for their goods surge.`,
      church:`⛪ A holy festival nears — the Church buys ritual goods eagerly. Prices rise.`,
      commoners:`🏘️ A market fair fills the streets — common folk are buying. Everyday wares fetch more.`};
    return { marketSet:m, msg:flavor[cat] }; } },
  { id:"market_glut", weight:7, when:s=>true, apply:(s)=>{
    const cats=["nobles","church","commoners"]; const cat=pick(cats); const m={...(s.market||freshMarket())};
    m[cat]={price:Math.max(0.6, ((m[cat]&&m[cat].price)||1.0)-0.35)};
    const flavor= LANG==="tr"?{nobles:`👑 Soylular bu mevsim kese ağzını sıkıyor — lüks fiyatları düşüyor.`,
      church:`⛪ Kilise'nin kasası dibe vurdu — ayin eşyaları şimdilik kötü satıyor.`,
      commoners:`🏘️ Halk için çetin bir mevsim — sadece zorunlu olanı alıyorlar. Fiyatlar düşüyor.`}:{nobles:`👑 The nobles tighten their purses this season — luxury prices slump.`,
      church:`⛪ The Church's coffers run low — ritual goods sell poorly for now.`,
      commoners:`🏘️ A hard season for the common folk — they buy only what they must. Prices fall.`};
    return { marketSet:m, msg:flavor[cat] }; } },
  { id:"stray_recruit", weight:5, when:s=>true, apply:(s)=>{
    return { msg: LANG==="tr"?`🚪 Bir yolcu loncayı sordu ve yoluna gitti. Salonunun namı yayılıyor.`:`🚪 A traveler asked about the guild and moved on. Word of your hall spreads.`, renown:1 }; } },
  { id:"rats", weight:6, when:s=>rsum(s.inventory)>5, apply:(s)=>{
    const owned=Object.keys(s.inventory).filter(k=>s.inventory[k]>0); const it=pick(owned);
    const lost=Math.min(s.inventory[it], rint(1,3));
    return { take:{item:it,qty:lost}, msg: LANG==="tr"?`🐀 Fareler depoya girdi — ${lost}× ${itemName(it)} kayboldu.`:`🐀 Rats got into the storeroom — lost ${lost}× ${itemName(it)}.` }; } },
  { id:"fair_weather", weight:7, when:s=>s.quests.length>0, apply:(s)=>{
    return { msg: LANG==="tr"?`☀️ Yollarda hava güzel — bugün seferler biraz daha güvenli.`:`☀️ Fair weather on the roads — expeditions feel a little safer today.` }; } },
  { id:"generous_patron", weight:4, when:s=>s.renown>=5, apply:(s)=>{ const g=rint(60,140);
    return { gold:g, msg: LANG==="tr"?`🎩 Soylu bir hami loncanın ününe hayran. ${g}A'lık bir armağan geliyor.`:`🎩 A noble patron admires your guild's reputation. A gift of ${g}G arrives.` }; } },
  // ---- character-driven small events (use real names) ----
  { id:"late_night_training", weight:7, when:s=>s.adventurers.some(a=>a.status==="idle"), apply:(s)=>{
    const a=randomAdv(s,true); if(!a) return {msg:""};
    return { grantXp:{ids:[a.id],amount:40}, msg: LANG==="tr"?`🗡️ ${a.name} geceyi avluda tek başına çalışarak geçirdi. Maharreti keskinleşiyor.`:`🗡️ ${a.name} spent the night drilling alone in the yard. Their skill sharpens.` }; } },
  { id:"tavern_brawl", weight:6, when:s=>s.adventurers.length>=2, apply:(s)=>{
    const pair=findBondedPair(s,(sc,rt)=>rt&&(rt.type==="Rival"||rt.type==="Bitter Rival"));
    if(!pair) return {msg: LANG==="tr"?`🍺 Meyhanede bir arbede çıktı ama soğukkanlılık kazandı.`:`🍺 A scuffle broke out in the tavern, but cooler heads prevailed.`};
    const[A,B]=pair;
    return { bond:{a:A.id,b:B.id,delta:-6}, msg: LANG==="tr"?`🍺 ${A.name} ile ${B.name} meyhanede yumruklaştı. Husumetleri derinleşiyor.`:`🍺 ${A.name} and ${B.name} came to blows in the tavern. Their feud deepens.` }; } },
  { id:"shared_drink", weight:6, when:s=>s.adventurers.length>=2, apply:(s)=>{
    const pair=findBondedPair(s,(sc,rt)=>rt&&(rt.type==="Friend"||rt.type==="Close Friend"));
    if(!pair) return {msg: LANG==="tr"?`🍻 Bu gece loncadan kahkahalar yükseldi.`:`🍻 Laughter echoed from the hall tonight.`};
    const[A,B]=pair;
    return { bond:{a:A.id,b:B.id,delta:4}, msg: LANG==="tr"?`🍻 ${A.name} ile ${B.name} bir içki ve eski hikâyeler paylaştı. Bağları güçleniyor.`:`🍻 ${A.name} and ${B.name} shared a drink and old stories. Their bond grows.` }; } },
  { id:"mentor_lesson", weight:6, when:s=>s.adventurers.length>=2, apply:(s)=>{
    const pair=findBondedPair(s,(sc,rt)=>rt&&rt.type==="Mentor");
    if(!pair) return {msg:""};
    const[A,B,rt]=pair; const protege=s.adventurers.find(x=>x.id===rt.protege);
    if(!protege) return {msg:""};
    return { grantXp:{ids:[protege.id],amount:60}, msg: LANG==="tr"?`🎓 Usta ile öğrenci arasında sessiz bir ders geçti. ${protege.name} çok şey öğrendi.`:`🎓 A quiet lesson passed between mentor and student. ${protege.name} learned much.` }; } },
  { id:"restless_dream", weight:5, when:s=>s.fallen&&s.fallen.length>0&&s.adventurers.length>0, apply:(s)=>{
    const a=randomAdv(s,false); const lost=s.fallen[0];
    return { msg: LANG==="tr"?`🕯️ ${a.name}, ${regionName(lost.region)} bölgesinde düşen ${lost.name}'i rüyasında gördü. Lonca ölülerini anar.`:`🕯️ ${a.name} dreamt of ${lost.name}, who fell in ${regionName(lost.region)}. The guild remembers its dead.` }; } },
];

// Big events return {title, text, icon, choices:[{label, detail, resolve:(s)=>({...patch, msg})}]}
const BIG_EVENTS = [
  {
    id:"traveling_merchant", weight:10, when:s=>s.gold>=100,
    build:(s)=>{
      const item=pick(Object.keys(ITEMS).filter(k=>ITEMS[k].tier==="raw"));
      const qty=rint(4,8); const price=Math.round(ITEMS[item].value*qty*0.7);
      return { title:LANG==="tr"?"Gezgin Tüccar":"Traveling Merchant", icon:"🐪",
        text:LANG==="tr"?`Bir tüccar kervanı kapına uğradı. "${qty}× ${itemName(item)} malını ${price}A'ya bırakırım — adil fiyat dostum."`:`A merchant caravan stops at your gates. "I'll let ${qty}× ${itemName(item)} go for ${price}G — a fair price, friend."`,
        choices:[
          { label:LANG==="tr"?`Satın al (${price}A)`:`Buy (${price}G)`, detail:LANG==="tr"?`${qty}× ${itemName(item)} kazan`:`Gain ${qty}× ${itemName(item)}`,
            resolve:(s)=> s.gold<price ? {msg:LANG==="tr"?"Malları alacak altının yoktu.":"You couldn't afford the goods."} :
              { gold:-price, give:{item,qty}, msg:LANG==="tr"?`🐪 Kervandan ${qty}× ${itemName(item)} aldın.`:`🐪 Bought ${qty}× ${itemName(item)} from the caravan.` } },
          { label:LANG==="tr"?"Reddet":"Decline", detail:LANG==="tr"?"Yollarına gönder":"Send them on their way",
            resolve:(s)=>({ msg:LANG==="tr"?`🐪 Tüccarı yoluna gönderdin.`:`🐪 You waved the merchant along.` }) },
        ] };
    }
  },
  {
    id:"plague", weight:7, when:s=>s.adventurers.length>=2,
    build:(s)=>({ title:LANG==="tr"?"Loncada Hastalık":"Sickness in the Hall", icon:"🤒",
      text:LANG==="tr"?`Ashford'da bir ateş yayılıyor. Bazı maceracıların hastalandı. Nasıl karşılık verirsin?`:`A fever spreads through Ashford. Some of your adventurers have fallen ill. How do you respond?`,
      choices:[
        { label:LANG==="tr"?"Şifacılara öde (120A)":"Pay for healers (120G)", detail:LANG==="tr"?"Herkesi hızla iyileştir":"Cure everyone quickly",
          resolve:(s)=> s.gold<120 ? {msg:LANG==="tr"?"Şifacılara yetecek altın yok — ateş seyrini sürdürür.":"Not enough gold for healers — the fever runs its course."} :
            { gold:-120, healAll:true, msg:LANG==="tr"?`🤒 Şifacılar hastalara baktı. Ateş geçti.`:`🤒 Healers tended the sick. The fever passes.` } },
        { label:LANG==="tr"?"Kendi haline bırak":"Let it pass", detail:LANG==="tr"?"Bazıları bir süre yatakta kalabilir":"Some may be bedridden a while",
          resolve:(s)=>{ const victims=s.adventurers.filter(a=>a.status==="idle").slice(0,rint(1,2));
            return { sicken:victims.map(v=>v.id), msg:LANG==="tr"?`🤒 ${victims.map(v=>v.name).join(", ")||"Kimse"} hastalandı ve dinlenmeli.`:`🤒 ${victims.map(v=>v.name).join(", ")||"No one"} fell ill and must rest.` }; } },
      ] })
  },
  {
    id:"tax_collector", weight:8, when:s=>s.gold>=80,
    build:(s)=>{ const tax=Math.max(50, Math.round(s.gold*0.12));
      return { title:LANG==="tr"?"Vergi Tahsildarı":"The Tax Collector", icon:"📜",
        text:LANG==="tr"?`Kraliyet görevlisi geldi. "Taç payını istiyor — ${tax}A. Reddetmek... akıllıca olmaz."`:`A royal official arrives. "The crown requires its due — ${tax}G. Refusal is... unwise."`,
        choices:[
          { label:LANG==="tr"?`Öde (${tax}A)`:`Pay (${tax}G)`, detail:LANG==="tr"?"Tacı memnun tut":"Keep the crown content",
            resolve:(s)=>({ gold:-tax, renown:1, msg:LANG==="tr"?`📜 Tacın ${tax}A'lık vergisini ödedin.`:`📜 You paid the crown's tax of ${tax}G.` }) },
          { label:LANG==="tr"?"Reddet":"Refuse", detail:LANG==="tr"?"Tacın öfkesini göze al":"Risk the crown's anger",
            resolve:(s)=>{ if(Math.random()<0.5) return { renown:-2, msg:LANG==="tr"?`📜 Reddettin. Görevli üstü kapalı tehditlerle ayrıldı. (−2 şöhret)`:`📜 You refused. The official leaves with veiled threats. (−2 renown)` };
              const fine=Math.round(tax*1.5); return { gold:-Math.min(s.gold,fine), renown:-1, msg:LANG==="tr"?`📜 Askerler geri dönüp zorla ${Math.min(s.gold,fine)}A el koydu.`:`📜 Soldiers returned and seized ${Math.min(s.gold,fine)}G by force.` }; } },
        ] };
    }
  },
  {
    id:"treasure_rumor", weight:9, when:s=>s.adventurers.some(a=>a.status==="idle"),
    build:(s)=>{ const reward=rint(150,400);
      return { title:LANG==="tr"?"Hazine Söylentisi":"Treasure Rumor", icon:"🗺️",
        text:LANG==="tr"?`Yıpranmış bir haritacı, vahşi doğadaki gizli bir zula için haber satıyor. "Cesur birini yolla — ya zengin döner, ya hiç dönmez."`:`A grizzled cartographer sells word of a hidden cache in the wilds. "Send a brave soul — they'll either return rich, or not at all."`,
        choices:[
          { label:LANG==="tr"?"Bir maceracı yolla":"Send an adventurer", detail:LANG==="tr"?`Riskli — ~${reward}A kazanabilir`:`Risky — could win ~${reward}G`,
            resolve:(s)=>{ const idle=s.adventurers.filter(a=>a.status==="idle"); if(!idle.length) return {msg:LANG==="tr"?"Gidecek kimse boşta değildi.":"No one was free to go."};
              const hero=pick(idle); if(Math.random()<0.7) return { gold:reward, renown:2, msg:LANG==="tr"?`🗺️ ${hero.name} zulayı buldu! +${reward}A ve şan.`:`🗺️ ${hero.name} found the cache! +${reward}G and glory.` };
              return { injure:[hero.id], msg:LANG==="tr"?`🗺️ ${hero.name} hırpalanmış ve eli boş döndü — söylenti bir tuzakmış.`:`🗺️ ${hero.name} returned battered and empty-handed — the rumor was a trap.` }; } },
          { label:LANG==="tr"?"Boş ver":"Ignore it", detail:LANG==="tr"?"Fazla riskli":"Too risky",
            resolve:(s)=>({ msg:LANG==="tr"?`🗺️ Söylentiyi dolandırıcılık diye geçiştirdin.`:`🗺️ You dismissed the rumor as a swindle.` }) },
        ] };
    }
  },
  // ---- CHAINED: moneylender (choice now, consequence later) ----
  {
    id:"desperate_borrower", weight:7, when:s=>s.gold>=200,
    build:(s)=>{ const loan=rint(150,300);
      return { title:LANG==="tr"?"Çaresiz Bir Yalvarış":"A Desperate Plea", icon:"🤝",
        text:LANG==="tr"?`Vendranlı bir tüccar ${loan}A borç diliyor. "Kervanım soyuldu — bunu ver, bir hafta içinde iki katını öderim. Şerefim üzerine."`:`A merchant from Vendran begs a loan of ${loan}G. "My caravan was robbed — lend me this, and I'll repay double within the week. On my honor."`,
        choices:[
          { label:LANG==="tr"?`${loan}A ödünç ver`:`Lend ${loan}G`, detail:LANG==="tr"?"İki katını ödeyeceğine yemin ediyor — ama ödeyecek mi?":"He swears to repay double — but will he?",
            resolve:(s)=> s.gold<loan ? {msg:LANG==="tr"?"Ayıracak altının yoktu.":"You hadn't the gold to spare."} :
              { gold:-loan, chain:{id:"borrower_returns", days:rint(3,6), data:{loan}}, msg:LANG==="tr"?`🤝 Tüccara ${loan}A ödünç verdin. Sözünün eri mi, zaman gösterecek.`:`🤝 You lent the merchant ${loan}G. Time will tell if his word is good.` } },
          { label:LANG==="tr"?"Reddet":"Refuse", detail:LANG==="tr"?"Altınını koru":"Keep your coin",
            resolve:(s)=>({ msg:LANG==="tr"?`🤝 Tüccarı geri çevirdin. Mırıldanarak ayrıldı.`:`🤝 You turned the merchant away. He left muttering.` }) },
        ] };
    }
  },
  // ---- CHAINED: a wounded stranger you can shelter ----
  {
    id:"wounded_stranger", weight:6, when:s=>true,
    build:(s)=>({ title:LANG==="tr"?"Kapıdaki Yabancı":"A Stranger at the Gate", icon:"🚪",
      text:LANG==="tr"?`Kukuletalı bir yolcu kapında yığılıyor, yaralı ve ateşler içinde. Onu barındırmak yiyecek götürür ve hastalık riski taşır — ama iyiliğe karşılık bir ödülden fısıldıyor.`:`A hooded traveler collapses at your gate, wounded and feverish. Sheltering them costs food and risks illness — but they whisper of a reward for kindness.`,
      choices:[
        { label:LANG==="tr"?"İçeri al":"Take them in", detail:LANG==="tr"?"Bakım için 60A — sonuç belirsiz":"Costs 60G in care — uncertain outcome",
          resolve:(s)=> s.gold<60 ? {msg:LANG==="tr"?"İhtiyaçları olan bakımı sağlayamadın.":"You couldn't spare the care they needed."} :
            { gold:-60, chain:{id:"stranger_recovers", days:rint(2,4)}, msg:LANG==="tr"?`🚪 Yabancıyı içeri aldın. Ateşin başında, sığ nefeslerle dinleniyor.`:`🚪 You took the stranger in. They rest by the fire, breathing shallow.` } },
        { label:LANG==="tr"?"Geri çevir":"Turn them away", detail:LANG==="tr"?"Fazla riskli":"Too risky",
          resolve:(s)=>({ renown:-1, msg:LANG==="tr"?`🚪 Yaralı yabancıyı geri çevirdin. Bunun haberi adını biraz kararttı. (−1 şöhret)`:`🚪 You turned the wounded stranger away. Word of it sours your name a little. (−1 renown)` }) },
      ] })
  },
  // ---- CHARACTER: a rivalry boils over, you must judge ----
  {
    id:"rivalry_duel", weight:7, when:s=>!!findBondedPair(s,(sc,rt)=>rt&&rt.type==="Bitter Rival"),
    build:(s)=>{ const pair=findBondedPair(s,(sc,rt)=>rt&&rt.type==="Bitter Rival"); const[A,B]=pair;
      return { title:LANG==="tr"?"Kan Davası":"Bad Blood", icon:"⚔️", _a:A.id, _b:B.id,
        text:LANG==="tr"?`${A.name} ile ${B.name} artık birbirine katlanamıyor. Meseleyi bir düelloyla halletmek istiyorlar. İzin verir misin?`:`${A.name} and ${B.name} can no longer stand each other. They demand to settle it with a duel. Do you allow it?`,
        choices:[
          { label:LANG==="tr"?"Düelloya izin ver":"Allow the duel", detail:LANG==="tr"?"Biri kazanır, biri yaralanır — ama hava temizlenir":"One wins, one is hurt — but the air clears",
            resolve:(s)=>{ const winner=Math.random()<0.5?A:B; const loser=winner.id===A.id?B:A;
              return { injure:[loser.id], bond:{a:A.id,b:B.id,delta:25}, grantXp:{ids:[winner.id],amount:50},
                msg:LANG==="tr"?`⚔️ ${winner.name}, avluda ${loser.name}'i yendi. Onur yerine geldi — tuhaf biçimde artık birbirlerine saygı duyuyorlar.`:`⚔️ ${winner.name} bested ${loser.name} in the yard. Honor satisfied — oddly, they respect each other now.` }; } },
          { label:LANG==="tr"?"Yasakla":"Forbid it", detail:LANG==="tr"?"Barışı zorla koru":"Keep the peace by force",
            resolve:(s)=>({ bond:{a:A.id,b:B.id,delta:-5}, msg:LANG==="tr"?`⚔️ Düelloyu yasakladın. Kan davası çözülmeden kaynamaya devam ediyor.`:`⚔️ You forbade the duel. The bad blood simmers on, unresolved.` }) },
        ] };
    }
  },
  // ---- CHARACTER: lovers wish to wed ----
  {
    id:"lovers_wedding", weight:6, when:s=>!!findBondedPair(s,(sc,rt)=>rt&&rt.type==="Romance"),
    build:(s)=>{ const pair=findBondedPair(s,(sc,rt)=>rt&&rt.type==="Romance"); const[A,B]=pair;
      return { title:LANG==="tr"?"Bir Düğün Dileği":"A Wedding Wish", icon:"💞", _a:A.id, _b:B.id,
        text:LANG==="tr"?`${A.name} ile ${B.name} birbirine derinden âşık oldu ve loncada evlenmek istiyor. Bir ziyafet altına mal olur — ama çatın altındaki her yüreği yükseltir.`:`${A.name} and ${B.name} have fallen deeply in love and wish to marry at the hall. A feast would cost coin — but lift every heart under your roof.`,
        choices:[
          { label:LANG==="tr"?"Düğünü ağırla (150A)":"Host the wedding (150G)", detail:LANG==="tr"?"Şenlikli bir ziyafet — moral fırlar":"A joyous feast — morale soars",
            resolve:(s)=> s.gold<150 ? {msg:LANG==="tr"?"Onlara yaraşır bir ziyafetin altını yoktu.":"You couldn't afford a feast worthy of them."} :
              { gold:-150, renown:3, bond:{a:A.id,b:B.id,delta:20}, ach:"a_wedding",
                msg:LANG==="tr"?`💞 ${A.name} ile ${B.name} kirişlerin altında evlendi. Bütün lonca gece boyunca kutladı.`:`${A.name} and ${B.name} were wed beneath the rafters. The whole guild celebrated long into the night.` } },
          { label:LANG==="tr"?"Ziyafeti reddet":"Decline the feast", detail:LANG==="tr"?"Sessizce evlenirler, biraz kırgın":"They'll wed quietly, a little hurt",
            resolve:(s)=>({ bond:{a:A.id,b:B.id,delta:-4}, msg:LANG==="tr"?`💞 Çift sessizce evlendi, keşke sevinçlerini paylaşsaydın diye.`:`💞 The pair wed quietly, wishing you'd shared their joy.` }) },
        ] };
    }
  },
  // ---- DRAMA: a jealous love triangle ----
  {
    id:"jealous_triangle", weight:5, when:s=>{
      // someone with a romance, where a third party also has high regard for one of them
      const rom=findBondedPair(s,(sc,rt)=>rt&&rt.type==="Romance"); if(!rom) return false;
      const[A,B]=rom; return s.adventurers.some(c=>c.id!==A.id&&c.id!==B.id&&(getRel(s.rels,c.id,A.id)>=50||getRel(s.rels,c.id,B.id)>=50));
    },
    build:(s)=>{ const rom=findBondedPair(s,(sc,rt)=>rt&&rt.type==="Romance"); const[A,B]=rom;
      const third=s.adventurers.find(c=>c.id!==A.id&&c.id!==B.id&&(getRel(s.rels,c.id,A.id)>=50||getRel(s.rels,c.id,B.id)>=50));
      const pinedFor = getRel(s.rels,third.id,A.id)>=getRel(s.rels,third.id,B.id)?A:B; const spurned=pinedFor.id===A.id?B:A;
      return { title:LANG==="tr"?"Kıskanç Bir Yürek":"A Jealous Heart", icon:"💔", _a:third.id, _b:spurned.id,
        text:LANG==="tr"?`${third.name} uzun zamandır ${pinedFor.name}'e gönül veriyor — ama o ${spurned.name}'i seviyor. Gerginlik loncayı zehirliyor. Bunu nasıl ele alırsın?`:`${third.name} has long harbored feelings for ${pinedFor.name} — who loves ${spurned.name} instead. The tension is poisoning the hall. How do you handle it?`,
        choices:[
          { label:LANG==="tr"?"Nazikçe öğüt ver":"Counsel them gently", detail:LANG==="tr"?"Barışı korumaya çalış":"Try to keep the peace",
            resolve:(s)=>{ if(Math.random()<0.6) return { bond:{a:third.id,b:spurned.id,delta:8}, msg:LANG==="tr"?`💔 ${third.name} ile konuştun. Gururunu yuttu; zamanla kıskançlığın yerini saygı aldı.`:`💔 You spoke with ${third.name}. They swallowed their pride; in time, respect replaced envy.` };
              return { bond:{a:third.id,b:spurned.id,delta:-10}, msg:LANG==="tr"?`💔 Sözlerin işe yaramadı. ${third.name}'in ${spurned.name}'e olan kıskançlığı yalnızca büyüyor.`:`💔 Your words didn't land. ${third.name}'s jealousy of ${spurned.name} only festers.` }; } },
          { label:LANG==="tr"?"Karışma":"Stay out of it", detail:LANG==="tr"?"Gönül işleri senin emrinde değil":"Matters of the heart aren't yours to command",
            resolve:(s)=>({ bond:{a:third.id,b:spurned.id,delta:-6}, msg:LANG==="tr"?`💔 Olduğu gibi bıraktın. ${third.name} ile ${spurned.name} arasındaki soğuk sessizlik sürüyor.`:`💔 You let it lie. The cold silence between ${third.name} and ${spurned.name} lingers.` }) },
        ] };
    }
  },
  // ---- DRAMA: a bitter rival threatens to desert and take guild secrets ----
  {
    id:"rival_desertion", weight:5, when:s=>!!findBondedPair(s,(sc,rt)=>rt&&rt.type==="Bitter Rival"),
    build:(s)=>{ const pair=findBondedPair(s,(sc,rt)=>rt&&rt.type==="Bitter Rival"); const[A,B]=pair;
      // the lower-level one threatens to leave
      const leaver = A.level<=B.level?A:B;
      return { title:LANG==="tr"?"Firar Tehdidi":"Threat of Desertion", icon:"🚪", _a:leaver.id,
        text:LANG==="tr"?`${leaver.name}, ${leaver.id===A.id?B.name:A.name} ile husumetten bıkmış, loncayı terk etmekle — ve bildiklerini bir rakibe satmakla tehdit ediyor. Gitmesine izin mi verirsin, yoksa arayı mı düzeltirsin?`:`${leaver.name}, sick of feuding with ${leaver.id===A.id?B.name:A.name}, threatens to abandon the guild — and sell what they know to a rival. Do you let them go, or make amends?`,
        choices:[
          { label:LANG==="tr"?"Barış kesesi sun (200A)":"Offer a peace-purse (200G)", detail:LANG==="tr"?"Sadakatini geri satın al":"Buy their loyalty back",
            resolve:(s)=> s.gold<200 ? {msg:LANG==="tr"?`Öfkesini yatıştıracak 200A yoktu — ama ${leaver.name}'i şimdilik kalmaya ikna ettin.`:`You hadn't the 200G to cool their temper — but you talked ${leaver.name} into staying, for now.`} :
              { gold:-200, bond:{a:A.id,b:B.id,delta:30}, msg:LANG==="tr"?`🚪 Kesen ${leaver.name}'in öfkesini yatıştırdı. ${leaver.id===A.id?B.name:A.name} ile husumet nihayet çözülüyor.`:`🚪 Your purse cooled ${leaver.name}'s temper. The feud with ${leaver.id===A.id?B.name:A.name} finally thaws.` } },
          { label:LANG==="tr"?"Gitmesine izin ver":"Let them leave", detail:LANG==="tr"?"Maceracıyı temelli kaybet":"Lose the adventurer for good",
            resolve:(s)=>({ kill:[leaver.id], renown:-2, msg:LANG==="tr"?`🚪 ${leaver.name} loncayı temelli terk etti, kinleri de sırları da yanında götürdü. (−2 şöhret)`:`🚪 ${leaver.name} left the guild for good, taking grudges and secrets alike. (−2 renown)` }) },
        ] };
    }
  },
];

// Rare legendary events — big reward or big risk
const LEGENDARY_EVENTS = [
  {
    id:"fallen_star", weight:1, when:s=>true,
    build:(s)=>({ title:LANG==="tr"?"Düşen Bir Yıldız":"A Fallen Star", icon:"🌠",
      text:LANG==="tr"?`Tepelerin ardına bir ışık çizgisi düştü. Yöre halkı bir servet değerinde yıldız-metalinden — ve onu koruyan canavardan — fısıldıyor.`:`A streak of light crashes beyond the hills. Locals whisper of a star-metal worth a fortune — and of the beast now guarding it.`,
      choices:[
        { label:LANG==="tr"?"Sefer düzenle":"Mount an expedition", detail:LANG==="tr"?"Yüksek risk, efsanevi ödül":"High risk, legendary reward",
          resolve:(s)=>{ const idle=s.adventurers.filter(a=>a.status==="idle");
            if(idle.length<2) return {msg:LANG==="tr"?"Böyle bir teşebbüse yetecek elin yoktu.":"You lacked the hands for such a venture."};
            if(Math.random()<0.55){ return { gold:1200, renown:8, give:{item:"starfruit",qty:2}, msg:LANG==="tr"?`🌠 Loncan düşen yıldızı ele geçirdi! +1200A, nadir malzeme ve efsane.`:`🌠 Your guild claimed the fallen star! +1200G, rare materials, and legend.` }; }
            const victim=pick(idle); return { kill:[victim.id], msg:LANG==="tr"?`🌠 Bekçi fazla güçlüydü. ${victim.name} geri dönmedi. Yıldız kayboldu.`:`🌠 The guardian was too much. ${victim.name} did not return. The star is lost.` }; } },
        { label:LANG==="tr"?"Evde kal":"Stay home", detail:LANG==="tr"?"Bazı efsaneler kurcalanmamalı":"Some legends are best left alone",
          resolve:(s)=>({ msg:LANG==="tr"?`🌠 Yıldızın parıltısı sabaha solmuştu. Ne olurdu diye düşünüyorsun.`:`🌠 The star's glow faded by morning. You wonder what might have been.` }) },
      ] })
  },
  {
    id:"hero_arrives", weight:1, when:s=>s.renown>=15 && s.adventurers.length>0,
    build:(s)=>({ title:LANG==="tr"?"Bir Efsane Seni Arıyor":"A Legend Seeks You", icon:"⭐",
      text:LANG==="tr"?`Loncanın namı çok uzaklara ulaştı. Ünlü bir kahraman katılmayı öneriyor — adına yaraşır bir bedel karşılığında.`:`Word of your guild has reached far. A renowned hero offers to join — for a price worthy of their name.`,
      choices:[
        { label:LANG==="tr"?"İşe al (800A)":"Recruit them (800G)", detail:LANG==="tr"?"Güçlü, yüksek rütbeli bir maceracı":"A powerful, high-rank adventurer",
          resolve:(s)=> s.gold<800 ? {msg:LANG==="tr"?"Bedelini karşılayamadın.":"You couldn't meet their price."} :
            { gold:-800, recruitLegend:true, renown:3, msg:LANG==="tr"?`⭐ Efsanevi bir maceracı loncana katıldı!`:`⭐ A legendary adventurer joined your guild!` } },
        { label:LANG==="tr"?"Reddet":"Decline", detail:LANG==="tr"?"Fazla pahalı":"Too costly",
          resolve:(s)=>({ msg:LANG==="tr"?`⭐ Kahraman başını salladı ve başka salonlara doğru yola çıktı.`:`⭐ The hero nodded and departed for other halls.` }) },
      ] })
  },
  {
    id:"dragon_contract", weight:1, when:s=>s.renown>=20 && s.adventurers.filter(a=>a.status==="idle").length>=3,
    build:(s)=>({ title:LANG==="tr"?"Ejderhanın Ödülü":"The Dragon's Bounty", icon:"🐉",
      text:LANG==="tr"?`Dehşete düşmüş bir köy, tarlalarını yakan ejderi öldürecek loncaya tüm birikimlerini — 2000A — sunuyor. Deneyenlerden hiçbiri geri dönmedi.`:`A terrified village offers their life savings — 2000G — to any guild that will slay the wyrm burning their fields. None have returned from trying.`,
      choices:[
        { label:LANG==="tr"?"En iyilerini yolla (3+ kahraman)":"Send your best (3+ heroes)", detail:LANG==="tr"?"Şan ya da ölüm — gerçek bir sınav":"Glory or death — a true test",
          resolve:(s)=>{ const idle=s.adventurers.filter(a=>a.status==="idle"); if(idle.length<3) return {msg:LANG==="tr"?"Yeterince boşta elin yoktu.":"You hadn't enough free hands."};
            const party=idle.slice().sort((a,b)=>b.level-a.level).slice(0,3);
            const power=party.reduce((sum,a)=>sum+a.level,0);
            if(Math.random() < Math.min(0.75, 0.3+power*0.008)){
              return { gold:2000, renown:15, grantXp:{ids:party.map(p=>p.id),amount:300}, msg:LANG==="tr"?`🐉 Ejder öldürüldü! ${party.map(p=>p.name).join(", ")} efsanevi kahramanlar olarak döndü. +2000A ve ölümsüz şöhret.`:`🐉 The wyrm is slain! ${party.map(p=>p.name).join(", ")} return as heroes of legend. +2000G and undying fame.` }; }
            const fallen=pick(party); return { kill:[fallen.id], gold:400, renown:5, msg:LANG==="tr"?`🐉 Ejder düştü ama bir bedelle — ${fallen.name} ejder ateşinde yanarak diğerlerine zaferi kazandırdı.`:`🐉 The wyrm fell, but at a price — ${fallen.name} burned in dragonfire, buying victory for the others.` }; } },
        { label:LANG==="tr"?"Sözleşmeyi reddet":"Refuse the contract", detail:LANG==="tr"?"Hiçbir altın bir cana değmez":"No gold is worth a life",
          resolve:(s)=>({ msg:LANG==="tr"?`🐉 Köylüleri geri çevirdin. Ateşler gece boyunca yanmaya devam etti.`:`🐉 You turned the villagers away. The fires burned on through the night.` }) },
      ] })
  },
  {
    id:"plague_doctor", weight:1, when:s=>s.adventurers.some(a=>a.status==="injured")||s.adventurers.length>=4,
    build:(s)=>({ title:LANG==="tr"?"Maskeli Şifacı":"The Masked Healer", icon:"⚕️",
      text:LANG==="tr"?`Kuzgun maskeli bir veba doktoru kapında beliriyor. "Bu salondaki her yarayı iyileştirebilirim — üstüne halkına dinçlik veririm. Ama hünerim bir miktar altın ve bir parça güven ister."`:`A plague doctor in a raven mask appears at your gate. "I can mend every wound in this hall — and grant your people vigor besides. But my art demands a sacrifice of coin, and a measure of trust."`,
      choices:[
        { label:LANG==="tr"?"Bedelini öde (500A)":"Pay their price (500G)", detail:LANG==="tr"?"Herkesi iyileştir & kalıcı dinçlik ver":"Heal all & grant lasting vigor",
          resolve:(s)=> s.gold<500 ? {msg:LANG==="tr"?"Şifacının bedelini karşılayamadın.":"You could not meet the healer's price."} :
            { gold:-500, healAll:true, renown:2, grantXp:{ids:s.adventurers.map(a=>a.id),amount:80},
              msg:LANG==="tr"?`⚕️ Maskeli şifacı gece boyu çalıştı. Her yara kapandı; halkın daha güçlü kalktı. Sonra ortadan kayboldu.`:`⚕️ The masked healer worked through the night. Every wound closed; your people rose stronger. Then they vanished.` } },
        { label:LANG==="tr"?"Geri gönder":"Send them away", detail:LANG==="tr"?"Maskedeki bir şey içini ürpertiyor":"Something about the mask unsettles you",
          resolve:(s)=>({ msg:LANG==="tr"?`⚕️ Reddettin. Doktor eğildi ve sise karıştı. Huzursuz uyuyorsun.`:`⚕️ You refused. The doctor bowed and melted into the fog. You sleep uneasily.` }) },
      ] })
  },
  {
    id:"rival_guild", weight:1, when:s=>s.renown>=25,
    build:(s)=>({ title:LANG==="tr"?"Rakibin Meydan Okuması":"The Rival's Challenge", icon:"⚔️",
      text:LANG==="tr"?`Rakip bir lonca efendisi sırıtarak salonuna giriyor. "Namın yükseliyor. Hangi loncanın daha büyük olduğunu çözelim — şampiyonlar yarışına 600A bahis. Yoksa korkuyor musun?"`:`A rival guildmaster strides into your hall, smirking. "Your name grows loud. Let us settle which guild is greater — a wager of 600G on a contest of champions. Or are you afraid?"`,
      choices:[
        { label:LANG==="tr"?"Bahsi kabul et (600A)":"Accept the wager (600G)", detail:LANG==="tr"?"Gurur ve altın ortada":"Pride and gold on the line",
          resolve:(s)=> s.gold<600 ? {msg:LANG==="tr"?"Bahsi karşılayamadın. Rakip güldü ve gitti.":"You couldn't cover the wager. The rival laughed and left."} :
            (()=>{ const best=s.adventurers.slice().sort((a,b)=>b.level-a.level)[0];
              if(!best) return {msg:LANG==="tr"?"Gönderecek şampiyonun yoktu.":"You had no champion to send."};
              if(Math.random()<0.6) return { gold:600, renown:10, grantXp:{ids:[best.id],amount:150}, msg:LANG==="tr"?`⚔️ ${best.name} rakibin şampiyonunu yendi! +600A kazanıldı ve loncanın adı çınlıyor. (+şöhret)`:`⚔️ ${best.name} bested the rival's champion! +600G won and your guild's name rings out. (+renown)` };
              return { gold:-600, renown:1, msg:LANG==="tr"?`⚔️ Şampiyonun iyi dövüştü ama kaybetti. Bahis gitti — ama kalabalık dimdik duracak cesareti olan bir loncaya saygı duyar.`:`⚔️ Your champion fought well but lost. The wager is gone — but the crowd respects a guild with the courage to stand.` }; })() },
        { label:LANG==="tr"?"Meydan okumayı reddet":"Decline the challenge", detail:LANG==="tr"?"Oyunlarını oynamayı reddet":"Refuse to play their game",
          resolve:(s)=>({ renown:-2, msg:LANG==="tr"?`⚔️ Reddettin. Rakip lonca korkaklığını ötede beride anlatıyor — itibarın düşüyor. (−2 şöhret)`:`⚔️ You declined. The rival guild crows about your cowardice — your reputation dips. (−2 renown)` }) },
      ] })
  },
  {
    id:"ancient_relic", weight:1, when:s=>s.gold>=300,
    build:(s)=>({ title:LANG==="tr"?"Mühürlü Mahzen":"The Sealed Vault", icon:"🗝️",
      text:LANG==="tr"?`Ölmekte olan bir hazine avcısı eline tuhaf bir anahtar tutuşturuyor. "Bir mahzen... eski katedralin altında. Sayılamayacak kadar zenginlik, ama orası... korunuyor. Ben yapamadım..." Son nefesini veriyor.`:`A dying treasure-hunter presses a strange key into your hand. "A vault... beneath the old cathedral. Riches beyond counting, but it is... guarded. I could not..." He breathes his last.`,
      choices:[
        { label:LANG==="tr"?"Mahzeni aç":"Open the vault", detail:LANG==="tr"?"Bilinmeyen ödül — ya da bilinmeyen bedel":"Unknown reward — or unknown cost",
          resolve:(s)=>{ const roll=Math.random();
            if(roll<0.5) return { gold:1500, renown:6, msg:LANG==="tr"?`🗝️ Mahzen unutulmuş altınla doluydu! +1500A ve nesiller boyu anlatılacak hikâyeler.`:`🗝️ The vault brimmed with forgotten gold! +1500G and tales to last generations.` };
            if(roll<0.8) return { give:{item:"starfruit",qty:3}, renown:4, msg:LANG==="tr"?`🗝️ Altın yok — ama bir zanaatkâr için altından değerli, sandıklar dolusu nadir yıldız-metali.`:`🗝️ No gold — but crates of rare star-metal, worth more to a craftsman than coin.` };
            const idle=s.adventurers.filter(a=>a.status==="idle");
            if(idle.length){ const v=pick(idle); return { injure:[v.id], gold:300, msg:LANG==="tr"?`🗝️ Bir bekçi yaratık uyandı! ${v.name} sadece bir avuç altınla kaçarken yaralandı.`:`🗝️ A guardian construct woke! ${v.name} was hurt escaping with only a handful of gold.` }; }
            return { gold:300, msg:LANG==="tr"?`🗝️ Kapabildiğin altını kaptın ve uyanan mahzenden kaçtın.`:`🗝️ You grabbed what gold you could and fled the waking vault.` }; } },
        { label:LANG==="tr"?"Mühürle":"Seal it away", detail:LANG==="tr"?"Bazı kapılar kapalı kalmalı":"Some doors should stay shut",
          resolve:(s)=>({ msg:LANG==="tr"?`🗝️ Anahtarı sahibiyle birlikte gömdün. Aşağıda her ne uyuyorsa uyumaya devam ediyor.`:`🗝️ You buried the key with its owner. Whatever sleeps below sleeps on.` }) },
      ] })
  },
];

// ---- CHAIN PAYOFFS: fired later when a scheduled chain comes due ----
// Each returns a result patch (auto-applied) — these are the "consequences" of earlier choices.
const CHAIN_EVENTS = {
  borrower_returns: (s, data)=>{
    const loan = data.loan||200;
    if(Math.random() < 0.65){ // honest: repays double
      const back = loan*2;
      return { gold:back, renown:1, msg:LANG==="tr"?`🤝 Vendranlı tüccar sözünün eri çıktı — ${back}A, borcun iki katını geri ödedi!`:`🤝 The Vendran merchant returned, true to his word — he repaid ${back}G, double the loan!` };
    }
    return { msg:LANG==="tr"?`🤝 ${loan}A ödünç verdiğin tüccar bir daha görülmedi. Para gitti — güven üzerine acı bir ders.`:`🤝 The merchant you lent ${loan}G to was never seen again. The coin is lost — a hard lesson in trust.` };
  },
  stranger_recovers: (s)=>{
    const roll=Math.random();
    if(roll<0.45){ const g=rint(200,400); return { gold:g, renown:2, msg:LANG==="tr"?`🚪 Yabancı iyileşti — ve kendini minnettar bir soylu olarak tanıttı. ${g}A ve sıcak sözler bırakıp gitti.`:`🚪 The stranger recovered — and revealed themselves a grateful noble. They left ${g}G and warm words.` }; }
    if(roll<0.80){ return { renown:1, msg:LANG==="tr"?`🚪 Yabancı iyileşti ve şafakta usulca ayrıldı, geriye yalnızca sessiz bir teşekkür bıraktı.`:`🚪 The stranger recovered and slipped away at dawn, leaving only a quiet word of thanks.` }; }
    // sometimes it goes badly — they were carrying fever
    const victims=s.adventurers.filter(a=>a.status==="idle").slice(0,1);
    return { sicken:victims.map(v=>v.id), msg:LANG==="tr"?`🚪 Yabancının ateşi, o kaçmadan önce yayıldı. ${victims.map(v=>v.name).join(", ")||"Biri"} hastalandı.`:`🚪 The stranger's fever spread before they fled. ${victims.map(v=>v.name).join(", ")||"Someone"} fell ill.` };
  },
};

function pickWeighted(list, s){
  const elig=list.filter(e=>e.when(s)); if(!elig.length) return null;
  const total=elig.reduce((a,e)=>a+e.weight,0); let r=Math.random()*total;
  for(const e of elig){ r-=e.weight; if(r<=0) return e; } return elig[0];
}

// Apply an event result patch to the (mutable) next-state ns
function applyEventPatch(ns, res){
  if(!res) return;
  if(res.marketSet) ns.market = res.marketSet;
  if(res.gold) ns.gold = Math.max(0, ns.gold + res.gold);
  if(res.renown) ns.renown = Math.max(0, ns.renown + res.renown);
  if(res.give){ ns.inventory={...ns.inventory}; ns.inventory[res.give.item]=(ns.inventory[res.give.item]||0)+res.give.qty; }
  if(res.take){ ns.inventory={...ns.inventory}; ns.inventory[res.take.item]=Math.max(0,(ns.inventory[res.take.item]||0)-res.take.qty); if(ns.inventory[res.take.item]===0) delete ns.inventory[res.take.item]; }
  if(res.sell){ ns.inventory={...ns.inventory}; ns.inventory[res.sell.item]=Math.max(0,(ns.inventory[res.sell.item]||0)-res.sell.qty); if(ns.inventory[res.sell.item]===0) delete ns.inventory[res.sell.item]; }
  if(res.healAll){ ns.adventurers=ns.adventurers.map(a=>a.status==="injured"?{...a,status:"idle",hp:a.maxHp}:a); }
  if(res.sicken){ ns.adventurers=ns.adventurers.map(a=>res.sicken.includes(a.id)?{...a,status:"injured",injuryUntil:ns.elapsed+120,hp:Math.max(1,Math.floor(a.maxHp*0.4))}:a); }
  if(res.injure){ ns.adventurers=ns.adventurers.map(a=>res.injure.includes(a.id)?{...a,status:"injured",injuryUntil:ns.elapsed+120,hp:Math.max(1,Math.floor(a.maxHp*0.3))}:a); }
  if(res.kill){ ns.fallen=[...(ns.fallen||[])]; const dead=ns.adventurers.filter(a=>res.kill.includes(a.id));
    dead.forEach(d=>ns.fallen.unshift({name:d.name,cls:d.cls,level:d.level,day:ns.day,region:(LANG==="tr"?"kara bir gün":"a dark day at the guild"),rank:RANKS[d.rankIndex!=null?d.rankIndex:0].name}));
    ns.adventurers=ns.adventurers.filter(a=>!res.kill.includes(a.id)); }
  if(res.recruitLegend){ const rares=Object.keys(CLASSES).filter(k=>CLASSES[k].rare);
    const lg=makeAdventurer(5, pick(rares)); lg.level=Math.max(lg.level,32); lg.rankIndex=eligibleRankIndex(lg.level);
    lg.maxHp=Math.floor(lg.maxHp*1.3); lg.hp=lg.maxHp; ns.adventurers=[...ns.adventurers, lg]; }
  // grant XP to specific adventurers
  if(res.grantXp){ ns.adventurers=ns.adventurers.map(a=>res.grantXp.ids.includes(a.id)?{...a,xp:a.xp+res.grantXp.amount}:a); }
  // change a relationship score directly (event drama)
  if(res.bond){ ns.rels={...ns.rels}; bumpRel(ns.rels, res.bond.a, res.bond.b, res.bond.delta, ns.elapsed); }
  // schedule a follow-up event to fire after `days` days
  if(res.chain){ ns.pendingChains=[...(ns.pendingChains||[]), { fireDay: ns.day + res.chain.days, id: res.chain.id, data: res.chain.data||{} }]; }
  // event-granted achievement
  if(res.ach){ ns._pendingAch = ns._pendingAch || []; ns._pendingAch.push(res.ach); }
}

// pick a random idle adventurer (or any if none idle)
function randomAdv(s, preferIdle){
  const pool = preferIdle ? s.adventurers.filter(a=>a.status==="idle") : s.adventurers;
  const list = pool.length ? pool : s.adventurers;
  return list.length ? list[Math.floor(Math.random()*list.length)] : null;
}
// find a pair of adventurers with a relationship of a given type
function findBondedPair(s, predicate){
  const advs=s.adventurers; const matches=[];
  for(let i=0;i<advs.length;i++) for(let j=i+1;j<advs.length;j++){
    const score=getRel(s.rels, advs[i].id, advs[j].id);
    const rt=relType(score, advs[i], advs[j], s.rels, advs);
    if(predicate(score, rt)) matches.push([advs[i], advs[j], rt, score]);
  }
  return matches.length ? matches[Math.floor(Math.random()*matches.length)] : null;
}

// ==================== §BOSSES · BÖLGE BOSS'LARI (İLERİDE) ====================
// Plan: her bölge için 1 mini + 1 epik boss. Başarılı görev sonrası düşük
// ihtimalle "açığa çıkar", sonra sefer-tarzı ama çok zorlu bir savaşla avlanır.
// power: partinin toplam gücüyle kıyaslanır. unlockChance: her başarılı seferde açığa çıkma şansı.
// reward: { gold, renown, item(id), ach(achievement id) }
const BOSSES = [
  // ---- green_woods ----
  { id:"b_green_mini", region:"green_woods", tier:"mini", icon:"🐗", power:60, unlockChance:0.14,
    name:{en:"Old Tuskbristle",tr:"Yaşlı Yabandomuzu"}, reward:{gold:440,renown:3,item:"golden_fleece",ach:"a_first_mini"} },
  { id:"b_green_epic", region:"green_woods", tier:"epic", icon:"🌳", power:150, unlockChance:0.05,
    name:{en:"The Elder Oak",tr:"Kadim Meşe"}, reward:{gold:1200,renown:10,item:"spirit_silk",ach:"a_first_epic"} },
  // ---- rat_sewers ----
  { id:"b_rat_mini", region:"rat_sewers", tier:"mini", icon:"🐀", power:70, unlockChance:0.14,
    name:{en:"Gnawlord Skitch",tr:"Kemirgen Lordu Skitch"}, reward:{gold:480,renown:3,item:"ancient_coin"} },
  { id:"b_rat_epic", region:"rat_sewers", tier:"epic", icon:"👑", power:170, unlockChance:0.05,
    name:{en:"The Rat King",tr:"Sıçan Kral"}, reward:{gold:1300,renown:11,item:"rat_king_crown",ach:"a_ratking"} },
  // ---- goblin_hills ----
  { id:"b_goblin_mini", region:"goblin_hills", tier:"mini", icon:"👺", power:110, unlockChance:0.13,
    name:{en:"Snagtooth the Loud",tr:"Gürültücü Çengeldiş"}, reward:{gold:680,renown:4,item:"crude_gem"} },
  { id:"b_goblin_epic", region:"goblin_hills", tier:"epic", icon:"🚩", power:240, unlockChance:0.05,
    name:{en:"Warchief Grum",tr:"Savaş Reisi Grum"}, reward:{gold:1800,renown:14,item:"chieftain_banner",ach:"a_warchief"} },
  // ---- misty_marsh ----
  { id:"b_marsh_mini", region:"misty_marsh", tier:"mini", icon:"🐸", power:120, unlockChance:0.13,
    name:{en:"Bogwart the Bloated",tr:"Şişko Bataklık Kurbağası"}, reward:{gold:720,renown:4,item:"toxin_gland"} },
  { id:"b_marsh_epic", region:"misty_marsh", tier:"epic", icon:"💧", power:260, unlockChance:0.05,
    name:{en:"The Drowned Lady",tr:"Boğulmuş Leydi"}, reward:{gold:1920,renown:15,item:"drowned_locket",ach:"a_drowned"} },
  // ---- ancient_crypt ----
  { id:"b_crypt_mini", region:"ancient_crypt", tier:"mini", icon:"💀", power:180, unlockChance:0.12,
    name:{en:"Bonepiler Vex",tr:"Kemikyığan Vex"}, reward:{gold:1040,renown:5,item:"cursed_relic"} },
  { id:"b_crypt_epic", region:"ancient_crypt", tier:"epic", icon:"⚱️", power:360, unlockChance:0.045,
    name:{en:"The Lich Aldwin",tr:"Lich Aldwin"}, reward:{gold:2800,renown:18,item:"saints_finger",ach:"a_lich"} },
  // ---- orc_frontier ----
  { id:"b_orc_mini", region:"orc_frontier", tier:"mini", icon:"🪓", power:200, unlockChance:0.12,
    name:{en:"Gore-Tusk",tr:"Kan-Dişi"}, reward:{gold:1120,renown:5,item:"steel_scrap"} },
  { id:"b_orc_epic", region:"orc_frontier", tier:"epic", icon:"☠️", power:400, unlockChance:0.045,
    name:{en:"Warlord Karg",tr:"Savaş Ağası Karg"}, reward:{gold:3000,renown:19,item:"warlord_skull",ach:"a_warlord"} },
  // ---- frozen_peaks ----
  { id:"b_frost_mini", region:"frozen_peaks", tier:"mini", icon:"🦣", power:280, unlockChance:0.11,
    name:{en:"Frostmane the Shaggy",tr:"Karyeleli Tüylü"}, reward:{gold:1520,renown:6,item:"yeti_fur"} },
  { id:"b_frost_epic", region:"frozen_peaks", tier:"epic", icon:"❄️", power:520, unlockChance:0.04,
    name:{en:"The Frozen Heart",tr:"Donmuş Yürek"}, reward:{gold:4000,renown:22,item:"frozen_heart",ach:"a_frozen"} },
  // ---- dragon_valley ----
  { id:"b_dragon_mini", region:"dragon_valley", tier:"mini", icon:"🦎", power:400, unlockChance:0.10,
    name:{en:"Cinderwing Whelp",tr:"Köz-Kanat Yavrusu"}, reward:{gold:2200,renown:8,item:"dragon_scale"} },
  { id:"b_dragon_epic", region:"dragon_valley", tier:"epic", icon:"🐉", power:720, unlockChance:0.035,
    name:{en:"Vhaelmyr the Ancient",tr:"Kadim Vhaelmyr"}, reward:{gold:6400,renown:28,item:"broken_seal",ach:"a_dragon"} },
  // ---- void_citadel ----
  { id:"b_void_mini", region:"void_citadel", tier:"mini", icon:"👁️", power:560, unlockChance:0.10,
    name:{en:"The Watcher",tr:"Gözcü"}, reward:{gold:3200,renown:10,item:"cursed_relic"} },
  { id:"b_void_epic", region:"void_citadel", tier:"epic", icon:"🌌", power:1000, unlockChance:0.03,
    name:{en:"Nihil, the Unmaker",tr:"Nihil, Yok Edici"}, reward:{gold:10000,renown:40,item:"grimoire_page",ach:"a_nihil"} },
];
const BOSS_BY_REGION = (()=>{ const m={}; BOSSES.forEach(b=>{ (m[b.region]=m[b.region]||[]).push(b); }); return m; })();
function bossName(b){ return b ? (LANG==="tr"?b.name.tr:b.name.en) : ""; }

// ==================== §ACHIEVE · BAŞARIMLAR (İLERİDE) ====================
// Plan: ~60 (çoğu komik isimli) başarım. Sağ üstteki lonca ikonuna basınca
// açılan bir ekranda listelenir; koşulu sağlanınca kilidi açılır + bildirim.
// Şema taslağı (henüz kullanılmıyor):
//   { id, name:{en,tr}, desc:{en,tr}, icon, check:(state)=>bool }
const ACHIEVEMENTS = [
  // --- Kuruluş / erken oyun ---
  { id:"a_charter", icon:"📜", name:{en:"It Begins",tr:"Ve Başladı"}, desc:{en:"Sign the guild charter",tr:"Lonca fermanını imzala"}, check:s=>s.started },
  { id:"a_firsthire", icon:"🤝", name:{en:"Fresh Blood",tr:"Taze Kan"}, desc:{en:"Hire your first adventurer",tr:"İlk maceracını işe al"}, check:s=>s.adventurers.length>=1 },
  { id:"a_firstquest", icon:"🗺️", name:{en:"Off You Pop",tr:"Hadi Bakalım"}, desc:{en:"Send your first expedition",tr:"İlk seferini yolla"}, check:s=>(s.stats&&s.stats.quests>=1) },
  { id:"a_firstcraft", icon:"⚒️", name:{en:"Honest Work",tr:"Alın Teri"}, desc:{en:"Craft your first item",tr:"İlk ürününü üret"}, check:s=>(s.stats&&s.stats.crafted>=1) },
  { id:"a_firstsale", icon:"💰", name:{en:"Cha-Ching",tr:"Şıngır Şıngır"}, desc:{en:"Make your first sale",tr:"İlk satışını yap"}, check:s=>(s.stats&&s.stats.sold>=1) },
  // --- Altın kilometre taşları ---
  { id:"a_gold1k", icon:"🪙", name:{en:"Pocket Change",tr:"Cep Harçlığı"}, desc:{en:"Hold 1,000 gold",tr:"1.000 altın biriktir"}, check:s=>s.gold>=1000 },
  { id:"a_gold10k", icon:"💵", name:{en:"Comfortably Off",tr:"Eli Yüzü Düzgün"}, desc:{en:"Hold 10,000 gold",tr:"10.000 altın biriktir"}, check:s=>s.gold>=10000 },
  { id:"a_gold50k", icon:"💸", name:{en:"Filthy Rich",tr:"Kirli Zengin"}, desc:{en:"Hold 50,000 gold",tr:"50.000 altın biriktir"}, check:s=>s.gold>=50000 },
  { id:"a_gold250k", icon:"🏦", name:{en:"Break the Bank",tr:"Kasayı Patlat"}, desc:{en:"Hold 250,000 gold",tr:"250.000 altın biriktir"}, check:s=>s.gold>=250000 },
  // --- Roster boyutu ---
  { id:"a_roster5", icon:"👥", name:{en:"A Proper Crew",tr:"Adam Gibi Ekip"}, desc:{en:"Have 5 adventurers",tr:"5 maceracın olsun"}, check:s=>s.adventurers.length>=5 },
  { id:"a_roster10", icon:"👨‍👩‍👧‍👦", name:{en:"Full House",tr:"Ev Doldu"}, desc:{en:"Have 10 adventurers",tr:"10 maceracın olsun"}, check:s=>s.adventurers.length>=10 },
  { id:"a_roster15", icon:"🏟️", name:{en:"A Small Army",tr:"Ufak Bir Ordu"}, desc:{en:"Have 15 adventurers",tr:"15 maceracın olsun"}, check:s=>s.adventurers.length>=15 },
  // --- Şöhret ---
  { id:"a_renown10", icon:"⭐", name:{en:"Making a Name",tr:"Ad Yapıyoruz"}, desc:{en:"Reach 10 renown",tr:"10 şöhrete ulaş"}, check:s=>s.renown>=10 },
  { id:"a_renown40", icon:"🌟", name:{en:"Talk of the Town",tr:"Dilden Dile"}, desc:{en:"Reach 40 renown",tr:"40 şöhrete ulaş"}, check:s=>s.renown>=40 },
  { id:"a_renown80", icon:"✨", name:{en:"Legend of the Realm",tr:"Diyarın Efsanesi"}, desc:{en:"Reach 80 renown",tr:"80 şöhrete ulaş"}, check:s=>s.renown>=80 },
  { id:"a_renown150", icon:"👑", name:{en:"Living Legend",tr:"Yaşayan Efsane"}, desc:{en:"Reach 150 renown",tr:"150 şöhrete ulaş"}, check:s=>s.renown>=150 },
  // --- Günler / hayatta kalma ---
  { id:"a_day10", icon:"📅", name:{en:"Two Weeks' Notice",tr:"İki Haftalık Süre"}, desc:{en:"Survive to day 10",tr:"10. güne ulaş"}, check:s=>s.day>=10 },
  { id:"a_day30", icon:"🗓️", name:{en:"Seasoned",tr:"Pişmiş"}, desc:{en:"Survive to day 30",tr:"30. güne ulaş"}, check:s=>s.day>=30 },
  { id:"a_day100", icon:"🎂", name:{en:"Centennial",tr:"Yüzüncü Yıl"}, desc:{en:"Survive to day 100",tr:"100. güne ulaş"}, check:s=>s.day>=100 },
  // --- Bina / yükseltme ---
  { id:"a_firstupg", icon:"🔨", name:{en:"Home Improvement",tr:"Ev Tadilatı"}, desc:{en:"Upgrade any building",tr:"Herhangi bir binayı yükselt"}, check:s=>Object.values(s.buildings).some(v=>v>=1) },
  { id:"a_tier3", icon:"🏰", name:{en:"Climbing the Ranks",tr:"Basamakları Tırman"}, desc:{en:"Reach guild tier 3",tr:"Lonca kademesi 3'e ulaş"}, check:s=>BUILDINGS.treasury.levels[s.buildings.treasury].tier>=3 },
  { id:"a_tier5", icon:"👑", name:{en:"Top of the World",tr:"Zirvedeyiz"}, desc:{en:"Reach guild tier 5",tr:"Lonca kademesi 5'e ulaş"}, check:s=>BUILDINGS.treasury.levels[s.buildings.treasury].tier>=5 },
  { id:"a_monument", icon:"🗿", name:{en:"Set in Stone",tr:"Taşa Kazındı"}, desc:{en:"Build a treasury monument",tr:"Bir hazine anıtı inşa et"}, check:s=>(BUILDINGS.treasury.levels[s.buildings.treasury].renownBonus||0)>0 },
  { id:"a_maxbuild", icon:"🏛️", name:{en:"Master Builder",tr:"Usta Mimar"}, desc:{en:"Max out any building",tr:"Bir binayı sonuna kadar yükselt"}, check:s=>Object.entries(s.buildings).some(([k,v])=>v>=BUILDINGS[k].levels.length-1) },
  // --- Sefer / boss (olay tetikli, _pendingAch ile) ---
  { id:"a_first_mini", icon:"🐗", name:{en:"Boss? What Boss?",tr:"Boss mu? Ne Boss'u?"}, desc:{en:"Defeat your first mini boss",tr:"İlk mini boss'unu yen"} },
  { id:"a_first_epic", icon:"🌳", name:{en:"Giant Slayer",tr:"Dev Avcısı"}, desc:{en:"Defeat your first epic boss",tr:"İlk epik boss'unu yen"} },
  { id:"a_ratking", icon:"👑", name:{en:"Long Live the King",tr:"Çok Yaşa Kral"}, desc:{en:"Defeat the Rat King",tr:"Sıçan Kral'ı yen"} },
  { id:"a_warchief", icon:"🚩", name:{en:"Chief No More",tr:"Reislik Bitti"}, desc:{en:"Defeat Warchief Grum",tr:"Savaş Reisi Grum'u yen"} },
  { id:"a_drowned", icon:"💧", name:{en:"Still Waters",tr:"Durgun Sular"}, desc:{en:"Defeat the Drowned Lady",tr:"Boğulmuş Leydi'yi yen"} },
  { id:"a_lich", icon:"⚱️", name:{en:"Rest in Pieces",tr:"Paramparça Yat"}, desc:{en:"Defeat the Lich Aldwin",tr:"Lich Aldwin'i yen"} },
  { id:"a_warlord", icon:"☠️", name:{en:"War is Over",tr:"Savaş Bitti"}, desc:{en:"Defeat Warlord Karg",tr:"Savaş Ağası Karg'ı yen"} },
  { id:"a_frozen", icon:"❄️", name:{en:"Cold Case Closed",tr:"Dosya Kapandı"}, desc:{en:"Defeat the Frozen Heart",tr:"Donmuş Yürek'i yen"} },
  { id:"a_dragon", icon:"🐉", name:{en:"Here Be No Dragons",tr:"Ejderha Kalmadı"}, desc:{en:"Defeat Vhaelmyr the Ancient",tr:"Kadim Vhaelmyr'i yen"} },
  { id:"a_nihil", icon:"🌌", name:{en:"The End of the End",tr:"Sonun Sonu"}, desc:{en:"Defeat Nihil, the Unmaker",tr:"Nihil'i yen"} },
  { id:"a_allbosses", icon:"🏆", name:{en:"Monster Hunter",tr:"Canavar Avcısı"}, desc:{en:"Defeat every epic boss",tr:"Tüm epik boss'ları yen"}, check:s=>BOSSES.filter(b=>b.tier==="epic").every(b=>(s.bossDefeated||{})[b.id]) },
  // --- İlişkiler / anlatı ---
  { id:"a_wedding", icon:"💞", name:{en:"Matchmaker",tr:"Çöpçatan"}, desc:{en:"Host a guild wedding",tr:"Bir lonca düğünü ağırla"} },
  { id:"a_firstdeath", icon:"🕯️", name:{en:"We Hardly Knew Ye",tr:"Tanışamadık Bile"}, desc:{en:"Lose an adventurer",tr:"Bir maceracını kaybet"}, check:s=>(s.fallen&&s.fallen.length>=1) },
  { id:"a_fivedead", icon:"⚰️", name:{en:"Rough Management",tr:"Zorlu Yönetim"}, desc:{en:"Lose 5 adventurers",tr:"5 maceracı kaybet"}, check:s=>(s.fallen&&s.fallen.length>=5) },
  { id:"a_legend_hero", icon:"🎖️", name:{en:"A True Legend",tr:"Gerçek Efsane"}, desc:{en:"Raise a hero to Legend rank",tr:"Bir kahramanı Efsane rütbesine çıkar"}, check:s=>s.adventurers.some(a=>a.rankIndex>=5) },
  { id:"a_maxlevel", icon:"💯", name:{en:"Overqualified",tr:"Fazla Nitelikli"}, desc:{en:"Get a hero to level 50",tr:"Bir kahramanı 50. seviyeye çıkar"}, check:s=>s.adventurers.some(a=>a.level>=50) },
  // --- Nadir sınıflar ---
  { id:"a_rareclass", icon:"🛡️", name:{en:"Exclusive Club",tr:"Seçkin Kulüp"}, desc:{en:"Recruit any rare class",tr:"Herhangi bir nadir sınıf al"}, check:s=>s.adventurers.some(a=>CLASSES[a.cls].rare) },
  { id:"a_allrare", icon:"🎴", name:{en:"Gotta Catch 'Em All",tr:"Hepsini Topla"}, desc:{en:"Have all 5 rare classes at once",tr:"5 nadir sınıfın hepsi aynı anda"}, check:s=>{const have=new Set(s.adventurers.filter(a=>CLASSES[a.cls].rare).map(a=>a.cls));return have.size>=5;} },
  { id:"a_relic", icon:"⚜️", name:{en:"Relic Hunter",tr:"Emanet Avcısı"}, desc:{en:"Craft a class relic",tr:"Bir sınıf emaneti üret"}, check:s=>s.adventurers.some(a=>a.boon) },
  // --- Üretim / ekonomi derinliği ---
  { id:"a_craft50", icon:"🛠️", name:{en:"Little Factory",tr:"Küçük Fabrika"}, desc:{en:"Craft 50 items total",tr:"Toplam 50 ürün üret"}, check:s=>(s.stats&&s.stats.crafted>=50) },
  { id:"a_craft250", icon:"🏭", name:{en:"Industrial Revolution",tr:"Sanayi Devrimi"}, desc:{en:"Craft 250 items total",tr:"Toplam 250 ürün üret"}, check:s=>(s.stats&&s.stats.crafted>=250) },
  { id:"a_quest50", icon:"🧭", name:{en:"Frequent Flyer",tr:"Sık Yolcu"}, desc:{en:"Complete 50 expeditions",tr:"50 sefer tamamla"}, check:s=>(s.stats&&s.stats.quests>=50) },
  { id:"a_quest200", icon:"🗺️", name:{en:"Been There, Done That",tr:"Gördük Geçirdik"}, desc:{en:"Complete 200 expeditions",tr:"200 sefer tamamla"}, check:s=>(s.stats&&s.stats.quests>=200) },
  { id:"a_smith", icon:"🗡️", name:{en:"The Blacksmith Awakens",tr:"Demirci Uyanıyor"}, desc:{en:"Forge a steel weapon",tr:"Bir çelik silah döv"}, check:s=>(s.stats&&s.stats.forged) },
  // --- Komik / durum ---
  { id:"a_broke", icon:"🕳️", name:{en:"Down Bad",tr:"Dibi Gördük"}, desc:{en:"Drop below 20 gold",tr:"20 altının altına düş"}, check:s=>s.started&&s.gold<20 },
  { id:"a_hoarder", icon:"📦", name:{en:"Pack Rat",tr:"İstifçi"}, desc:{en:"Fill your warehouse",tr:"Ambarını doldur"}, check:s=>{const cap=BUILDINGS.warehouse.levels[s.buildings.warehouse].capacity;const cnt=Object.values(s.inventory||{}).reduce((a,b)=>a+b,0);return cnt>=cap;} },
  { id:"a_patrol", icon:"🛡️", name:{en:"Neighbourhood Watch",tr:"Mahalle Bekçisi"}, desc:{en:"Keep someone on patrol",tr:"Birini devriyede tut"}, check:s=>s.adventurers.some(a=>a.task==="patrol") },
  { id:"a_allrest", icon:"😴", name:{en:"Lazy Sunday",tr:"Tembel Pazar"}, desc:{en:"Have everyone resting at once",tr:"Herkes aynı anda dinlensin"}, check:s=>s.adventurers.length>=3&&s.adventurers.every(a=>a.status==="idle"&&(a.task||"rest")==="rest") },
  { id:"a_veterans", icon:"🎖️", name:{en:"The Old Guard",tr:"Eski Tüfekler"}, desc:{en:"Have 3 Veteran+ heroes",tr:"3 Kıdemli+ kahramanın olsun"}, check:s=>s.adventurers.filter(a=>a.rankIndex>=3).length>=3 },
  { id:"a_bigparty", icon:"🎉", name:{en:"The More the Merrier",tr:"Ne Çok O Kadar İyi"}, desc:{en:"Send a party of 5",tr:"5 kişilik bir parti yolla"}, check:s=>(s.stats&&s.stats.maxParty>=5) },
  { id:"a_wealthyheart", icon:"💝", name:{en:"Coin and Kin",tr:"Altın ve Dostluk"}, desc:{en:"50k gold, 10 heroes & a wedding",tr:"50b altın, 10 kahraman ve bir düğün"}, check:s=>s.gold>=50000&&s.adventurers.length>=10&&(s.achieved&&s.achieved.a_wedding) },
];
const ACH_BY_ID = (()=>{ const m={}; ACHIEVEMENTS.forEach(a=>m[a.id]=a); return m; })();
function achName(a){ return a?(LANG==="tr"?a.name.tr:a.name.en):""; }
function achDesc(a){ return a?(LANG==="tr"?a.desc.tr:a.desc.en):""; }

// ==================== §THEME · RENK TEMASI & FONT ====================
const T = {
  bg:"#1a1410", panel:"#241c15", panel2:"#2e241A", border:"#3d2f20", borderLit:"#5a4530",
  gold:"#e0a23c", goldDim:"#9a7228", ink:"#e8dcc8", inkDim:"#a89878", inkFaint:"#6b5d48",
  green:"#6fae6f", red:"#c0563f", blue:"#5b9bd5", parchment:"#d8c8a8",
};
const font = "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif";

// ==================== §ROOT · ANA BİLEŞEN & OYUN DÖNGÜSÜ ====================
const SAVE_KEY = "guildmaster_save_v1";

export default function Guildmaster(){
  const [state, setState] = useState(()=>{
    // auto-load a persisted guild if one exists (real save, survives app restarts)
    try{
      const raw = (typeof localStorage!=="undefined") && localStorage.getItem(SAVE_KEY);
      if(raw){
        const obj = JSON.parse(raw);
        if(obj && typeof obj==="object" && obj.gold!==undefined){
          obj.pendingEvent=null; obj.deathAlert=null; obj.injuryAlert=null;
          if(!obj.market) obj.market=freshMarket();
          if(!obj.pendingChains) obj.pendingChains=[];
          return obj;
        }
      }
    }catch(e){ /* corrupt save — fall through to a fresh game */ }
    return newGame();
  });
  const [tab, setTab] = useState("hall");
  // Show a "welcome back" screen on every launch when a real saved guild was loaded.
  const [showWelcome, setShowWelcome] = useState(()=>{
    try{
      const raw = (typeof localStorage!=="undefined") && localStorage.getItem(SAVE_KEY);
      if(raw){ const o=JSON.parse(raw); return !!(o && o.started && o.gold!==undefined); }
    }catch(e){}
    return false;
  });
  const [lang, setLangState] = useState(LANG); // mirror of global LANG; changing it re-renders the whole UI
  const switchLang = useCallback((l)=>{ setLang(l); setLangState(l); }, []);
  const [toast, setToast] = useState(null);
  const [deathModal, setDeathModal] = useState(null);
  const [showAch, setShowAch] = useState(false);
  const [eventModal, setEventModal] = useState(null);
  const lastDeathId = useRef(null);
  const lastEventId = useRef(null);
  const tickRef = useRef();

  // ---- auto-save: persist the guild to device storage whenever it changes ----
  useEffect(()=>{
    if(!state.started) return; // don't save the pre-game intro state
    try{
      const { pendingEvent, deathAlert, injuryAlert, ...clean } = state;
      localStorage.setItem(SAVE_KEY, JSON.stringify(clean));
    }catch(e){ /* storage full or unavailable — game still runs in memory */ }
  }, [state]);

  // watch for new deaths flagged by the tick
  useEffect(()=>{
    if(state.deathAlert && state.deathAlert.id!==lastDeathId.current){
      lastDeathId.current = state.deathAlert.id;
      setDeathModal(state.deathAlert);
      Audio.play("death");
    }
  }, [state.deathAlert]);

  // watch for pending decision events
  useEffect(()=>{
    if(state.pendingEvent && state.pendingEvent.uid!==lastEventId.current){
      lastEventId.current = state.pendingEvent.uid;
      setEventModal(state.pendingEvent);
      Audio.play("event");
    }
  }, [state.pendingEvent]);

  // watch for injuries → toast
  const lastInjuryId = useRef(null);
  useEffect(()=>{
    if(state.injuryAlert && state.injuryAlert.id!==lastInjuryId.current){
      lastInjuryId.current = state.injuryAlert.id;
      const n=state.injuryAlert.names;
      notify(LANG==="tr"?`🩸 ${n.length>1?n.length+" maceracı":n[0]} ${regionName(state.injuryAlert.region)} bölgesinde yaralandı!`:`🩸 ${n.length>1?n.length+" adventurers were":n[0]+" was"} hurt in ${regionName(state.injuryAlert.region)}!`);
    }
  }, [state.injuryAlert]);

  // resolve a big-event choice
  const resolveEvent = useCallback((choiceIdx)=>{
    setState(s=>{
      const pe=s.pendingEvent; if(!pe) return s;
      const ns={...s, adventurers:s.adventurers.map(a=>({...a})), inventory:{...s.inventory}};
      const choice=pe.choices[choiceIdx];
      const res=choice.resolve(ns);
      applyEventPatch(ns, res);
      ns.pendingEvent=null;
      if(res.msg) ns.log=[{t:ns.elapsed,msg:res.msg},...s.log].slice(0,40);
      return ns;
    });
    setEventModal(null);
  }, []);

  function newGame(){
    // founding board: guarantee a tank + healer so players aren't stranded, plus one wildcard
    const recruits = [makeAdventurer(0,"Warrior"), makeAdventurer(0,"Cleric"), makeAdventurer(0)];
    return {
      started: false, guildName: "",
      gold: STARTING_GOLD, renown: 0, day: 1, elapsed: 0,
      adventurers: [], recruits,
      inventory: {}, quests: [], crafting: [], rels: {}, fallen: [], pendingEvent: null, pendingChains: [], market: freshMarket(),
      buildings: { dormitory:0, tavern:0, tannery:0, weavery:0, kitchen:0, workshop:0, notice_board:0, treasury:0, warehouse:0 },
      lastUpkeep: 0, log: [],
      achieved: {}, stats: { quests:0, crafted:0, sold:0, forged:0, maxParty:0 },
      bossUnlocked: {}, bossDefeated: {},
    };
  }

  const notify = useCallback((msg)=>{ setToast(msg); setTimeout(()=>setToast(null), 2600); }, []);

  // ---- main game tick (1s) ----
  useEffect(()=>{
    tickRef.current = setInterval(()=>{
      setState(s=>{
        if(!s.started) return s;
        const ns = {...s};
        ns.elapsed += 1;
        // quests progress
        let logAdds = [];
        ns.quests = s.quests.map(q=>({...q}));
        const done = [];
        ns.quests.forEach(q=>{ if(ns.elapsed>=q.endAt && !q.resolved){ q.resolved=true; done.push(q); } });
        if(done.length){
          ns.adventurers = s.adventurers.map(a=>({...a}));
          ns.inventory = {...s.inventory};
          ns.rels = {...s.rels};
          const cap = BUILDINGS.warehouse.levels[ns.buildings.warehouse].capacity;
          const invCount = ()=>Object.values(ns.inventory).reduce((x,y)=>x+y,0);
          done.forEach(q=>{
            const region = REGIONS.find(r=>r.id===q.regionId);
            const party = ns.adventurers.filter(a=>q.party.includes(a.id));
            ns.stats = ns.stats || {...(s.stats||{quests:0,crafted:0,sold:0,forged:0,maxParty:0})};
            if(!q.bossId) ns.stats.quests = (ns.stats.quests||0)+1;
            ns.stats.maxParty = Math.max(ns.stats.maxParty||0, q.party.length);
            const tavernSucc = BUILDINGS.tavern.levels[ns.buildings.tavern].successBonus||0;
            // party-wide perks from classes present
            let partySuccess=0, partyLoot=0, partyInjury=0;
            party.forEach(a=>{ const m=CLASSES[a.cls].mod||{};
              partySuccess+=m.partySuccess||0; partyLoot+=m.partyLoot||0; partyInjury+=m.partyInjury||0; });
            // relationship morale: average pairwise score → small success modifier (+/- up to ~8%)
            let relBonus=0;
            if(party.length>1){
              let sum=0,pairs=0;
              for(let i=0;i<party.length;i++) for(let j=i+1;j<party.length;j++){ sum+=getRel(ns.rels,party[i].id,party[j].id); pairs++; }
              relBonus = pairs? (sum/pairs)/100*0.08 : 0; // +8% if all adore each other, −8% if all hate
            }
            // veteran team bonus: a band that has run together many times fights better
            const tTier = teamTier(ns.rels, party);
            if(tTier>0) relBonus += TEAM_TIERS[tTier].bonus;
            // ⚜️ Beastmaster's Wild Horn: a summoned beast lifts the whole party's success
            const horonBearer = party.some(a=>a.boon==="beastHorn");
            const beastBonus = horonBearer ? 0.08 : 0;
            let lootGained={}, leveled=[], injured=[], died=[], failed=0, storageFull=false;
            party.forEach(a=>{
              const cs=CLASSES[a.cls];
              let succ = 0.65 + (a.level/100) + tavernSucc + partySuccess + relBonus + beastBonus;
              if(a.cls==="LoneWolf" && party.length===1) succ += 0.22; // the wolf is devastating alone
              if(a.cls==="GoblinSlayer" && party.length===1){ succ += 0.15; if(region.id==="goblin_hills") succ += 0.30; } // born to slay goblins
              succ += posMod(a,"dangerSuccess") + (a.neg.mod.dangerSuccess||0);
              succ += (cs.atk-12)*0.005; // higher attack → better odds against danger
              succ -= region.danger*0.04;
              if(a.grief && ns.elapsed < a.grief) succ -= 0.08; // grieving lowers focus
              if(a.fatigue>=70) succ -= 0.12; else if(a.fatigue>=40) succ -= 0.05; // exhaustion dulls performance
              const ceil = region.danger>=5 ? 0.90 : region.danger>=3 ? 0.94 : 0.97; // deadly places stay risky
              const success = Math.random() < Math.max(0.2, Math.min(ceil, succ));
              if(success){
                const lootMult = posMul(a,"lootMult")*(1+partyLoot)*(a.boon==="shadowCloak"?1.3:1);
                region.loot.forEach(l=>{
                  if(l.rare) return; // rare drops handled once per expedition, below
                  let amt = Math.round(rint(l.min,l.max)*lootMult);
                  if(amt>0){
                    const room = cap - invCount();
                    if(room<=0){ storageFull=true; return; }
                    amt = Math.min(amt, room);
                    ns.inventory[l.item] = (ns.inventory[l.item]||0)+amt;
                    lootGained[l.item]=(lootGained[l.item]||0)+amt;
                  }
                });
                let xpMultRel=1;
                // mentorship: if a much higher-level ally with positive bond is present, protégé gains bonus XP
                party.forEach(other=>{ if(other.id!==a.id && other.level-a.level>=12 && getRel(ns.rels,a.id,other.id)>=10) xpMultRel=1.25; });
                const xpBase = (35+region.danger*18) * (1 + region.duration/200); // longer trips grant more growth
                const xpGain = Math.floor(xpBase*(posMul(a,"xpMult"))*((a.neg.mod.xpMult||1))*xpMultRel);
                a.xp += xpGain;
                let didLevel=false;
                while(a.xp >= xpForLevel(a.level+1) && a.level<50){ a.xp -= xpForLevel(a.level+1); a.level++; a.maxHp=Math.floor(a.maxHp*1.06); didLevel=true; }
                if(didLevel) leveled.push(a.name+" → Lv"+a.level);
              } else {
                failed++;
                const injChance = 0.12 + region.danger*0.05 + (a.neg.mod.injuryChance||0) + partyInjury - (CLASSES[a.cls].def-10)*0.004 - (a.boon==="holyArmor"?0.10:0) - (a.boon==="prayerBeads"?0.07:0);
                if(Math.random()<Math.max(0.02,injChance)){
                  // on a failed roll in dangerous regions, injury can instead become death
                  let deathChance = 0;
                  if(region.danger>=3){
                    deathChance = (region.danger-2)*0.035 + (a.neg.mod.injuryChance||0)*0.5;
                    if(a.status==="injured") deathChance += 0.05; // already hurt going in
                    deathChance += partyInjury*0.3; // tank/cleric reduce it (partyInjury is negative)
                    deathChance = Math.max(0, Math.min(0.30, deathChance));
                  }
                  if(deathChance>0 && Math.random()<deathChance){
                    if(a.boon==="boneRelic"){
                      // the Bone Relic shatters, dragging its bearer back from death — once
                      a.boon=null; a.status="injured"; a.injuryUntil=ns.elapsed+region.danger*40; a.hp=Math.max(1,Math.floor(a.maxHp*0.2));
                      injured.push(a.name);
                      logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`☠️ ${a.name} ölmeliydi — ama Kemik Emaneti parçalanıp onu ölümün eşiğinden geri çekti.`:`☠️ ${a.name} should have died — but the Bone Relic shattered and wrenched them back from death's door.`});
                    } else {
                      a.dead=true; died.push(a);
                    }
                  } else {
                    a.status="injured"; a.injuryUntil=ns.elapsed+region.danger*40;
                    a.hp=Math.max(1,Math.floor(a.maxHp*0.3));
                    injured.push(a.name);
                  }
                }
              }
              if(!a.dead && a.status!=="injured"){ a.status="idle"; a.task="rest"; }
              a.fatigue = Math.min(100, (a.fatigue||0) + 12 + region.danger*3); // expeditions tire you out
              a.questId=null;
            });
            // ---- rare drops: rolled ONCE per expedition (not per member), only if someone succeeded ----
            const anySuccess = failed < party.length;
            if(anySuccess){
              const bestLoot = Math.max(...party.filter(a=>!a.dead).map(a=>(a.pos.mod.lootMult||1)*(1+partyLoot)), 1);
              region.loot.forEach(l=>{
                if(!l.rare) return;
                const chance = (l.chance||0.12) * bestLoot;
                if(Math.random() < chance){
                  const room = cap - invCount();
                  if(room<=0){ storageFull=true; return; }
                  ns.inventory[l.item] = (ns.inventory[l.item]||0)+1;
                  lootGained[l.item]=(lootGained[l.item]||0)+1;
                }
              });
            }
            // ---- handle deaths: remove from roster, record to Hall of Legends, grief survivors ----
            if(died.length){
              ns.fallen = [...(ns.fallen||s.fallen||[])];
              const deadIds = died.map(d=>d.id);
              died.forEach(d=>{
                // who will mourn them most — their closest bond in the guild
                let closest=null,closestScore=0;
                ns.adventurers.forEach(other=>{
                  if(other.id===d.id) return;
                  const sc=getRel(ns.rels,d.id,other.id);
                  if(sc>closestScore){ closestScore=sc; closest=other; }
                });
                const eulogy = closest && closestScore>=40
                  ? (LANG==="tr"?`En çok ${closest.name} yas tutuyor, yanında savaşan dostu.`:`Mourned most by ${closest.name}, who fought beside them.`)
                  : (LANG==="tr"?`Yurdundan uzakta düştü, lonca tarafından anılıyor.`:`They fell far from home, remembered by the guild.`);
                ns.fallen.unshift({ name:d.name, cls:d.cls, level:d.level, day:ns.day, region:region.name,
                  rank:rankForLevel(d.level).name, eulogy, runs:(()=>{let m=0;ns.adventurers.forEach(o=>{if(o.id!==d.id)m=Math.max(m,getTogether(ns.rels,d.id,o.id));});return m;})() });
                // grief: close allies in the guild gain a temporary "Grieving" sorrow (deeper for closer bonds)
                ns.adventurers.forEach(other=>{
                  if(other.id!==d.id && !other.dead){
                    const sc=getRel(ns.rels,d.id,other.id);
                    if(sc>=40){ other.grief = ns.elapsed + (sc>=70?360:240); } // closer = longer grief
                  }
                });
              });
              ns.adventurers = ns.adventurers.filter(a=>!deadIds.includes(a.id));
              // flag the most notable death for a player notification
              const notable = died.slice().sort((a,b)=>b.level-a.level)[0];
              const notableFallen = ns.fallen.find(f=>f.name===notable.name);
              ns.deathAlert = { name:notable.name, cls:notable.cls, level:notable.level, region:region.name, count:died.length,
                eulogy:notableFallen?notableFallen.eulogy:"", id:uid() };
            }
            // ---- relationship changes from sharing this expedition (survivors only) ----
            const survivors = party.filter(a=>!a.dead);
            if(survivors.length>1){
              const tierBefore = teamTier(ns.rels, survivors);
              for(let i=0;i<survivors.length;i++){
                for(let j=i+1;j<survivors.length;j++){
                  const A=survivors[i], B=survivors[j];
                  bumpTogether(ns.rels, A.id, B.id, ns.elapsed); // forged a shared run
                  // bonding is slower now, and partly random — not everyone clicks
                  let delta = rint(0,2); // base 0–2, sometimes nothing happens
                  if(failed===0 && Math.random()<0.5) delta += 1; // flawless run sometimes deepens it
                  if(injured.includes(A.name)||injured.includes(B.name)) delta -= 2; // trauma strains
                  // trait chemistry nudges it either way
                  if(A.neg.name===B.neg.name) delta -= 1;
                  if(A.pos.name===B.pos.name) delta += 1;
                  if(A.neg.name==="Arrogant"||B.neg.name==="Arrogant") delta -= 1;
                  // 🦅 Hawk of Darkness: bonds fast with its own partymates, but poisons bonds between OTHERS
                  const hawkInParty = survivors.some(x=>x.cls==="Hawk");
                  if(hawkInParty){
                    if(A.cls==="Hawk"||B.cls==="Hawk") delta += 3; // the Hawk charms its companions quickly
                    else delta -= 2; // its shadow sows discord among everyone else
                  }
                  if(delta!==0){
                  const before = getRel(ns.rels,A.id,B.id);
                  const after = bumpRel(ns.rels,A.id,B.id,delta,ns.elapsed);
                  // emergent events on crossing thresholds
                  const rt=relType(after,A,B), rtBefore=relType(before,A,B);
                  if(rt && (!rtBefore || rt.type!==rtBefore.type)){
                    if(rt.type==="Romance") logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`💞 ${A.name} ile ${B.name}, ${regionName(region)} bölgesindeki vakitlerinin ardından yakınlaştı.`:`💞 ${A.name} and ${B.name} have grown close after their time in ${regionName(region)}.`});
                    else if(rt.type==="Close Friend") logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`🤝 ${A.name} ile ${B.name} artık ayrılmaz yoldaşlar.`:`🤝 ${A.name} and ${B.name} are now inseparable companions.`});
                    else if(rt.type==="Bitter Rival") logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`💢 ${A.name} ile ${B.name} artık birbirine katlanamıyor.`:`💢 ${A.name} and ${B.name} can no longer stand each other.`});
                    else if(rt.type==="Mentor") logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`🎓 ${A.level>B.level?A.name:B.name}, ${A.level>B.level?B.name:A.name}'i kanadının altına aldı.`:`🎓 ${A.level>B.level?A.name:B.name} has taken ${A.level>B.level?B.name:A.name} under their wing.`});
                  }
                  }
                }
              }
              // veteran team milestone reached?
              const tierAfter = teamTier(ns.rels, survivors);
              if(tierAfter>tierBefore && TEAM_TIERS[tierAfter]){
                const t=TEAM_TIERS[tierAfter];
                logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`${t.icon} Bu takım artık bir ${teamTierName(tierAfter)}! ${survivors.map(a=>a.name).join(", ")} tek vücut savaşıyor (birlikte +%${Math.round(t.bonus*100)} başarı).`:`${t.icon} This band has become a ${t.name}! ${survivors.map(a=>a.name).join(", ")} fight as one (+${Math.round(t.bonus*100)}% success together).`});
              }
            }
            // detailed ledger entries
            const lootStr = Object.entries(lootGained).map(([k,v])=>`${v}× ${itemName(k)}`).join(", ");
            logAdds.push({t:ns.elapsed, msg:LANG==="tr"?`${region.icon} ${regionName(region)}: ${lootStr||"eli boş"} döndü.`:`${region.icon} ${regionName(region)}: returned with ${lootStr||"nothing"}.`});
            // ---- boss may reveal itself after a normal (non-boss) run where nobody died ----
            if(!q.bossId && died.length===0){
              ns.bossUnlocked = ns.bossUnlocked || {...(s.bossUnlocked||{})};
              const candidates=(BOSS_BY_REGION[region.id]||[]).filter(b=>!ns.bossUnlocked[b.id]);
              for(const b of candidates){
                if(Math.random()<b.unlockChance){
                  ns.bossUnlocked[b.id]=true;
                  logAdds.push({t:ns.elapsed, msg:LANG==="tr"?`${b.icon} Söylentiler yayılıyor: ${regionName(region)} bölgesinde ${bossName(b)} görülmüş! Görevler ekranından avlanabilir.`:`${b.icon} Word spreads: ${bossName(b)} stalks ${regionName(region)}! Hunt it from the Quests screen.`});
                  break; // at most one reveal per run
                }
              }
            }
            if(leveled.length) logAdds.push({t:ns.elapsed, msg:`⬆️ ${leveled.join(", ")}.`});
            if(injured.length){ logAdds.push({t:ns.elapsed, msg:LANG==="tr"?`🩸 ${injured.join(", ")} yaralandı — ${regionName(region)} bölgesinde bir çatışma kötü gitti (tehlike ${region.danger}/6). İyileşiyor.`:`🩸 ${injured.join(", ")} hurt — a fight went badly in ${regionName(region)} (danger ${region.danger}/6). Recovering.`});
              ns.injuryAlert={ names:injured.slice(), region:region.name, id:uid() }; }
            died.forEach(d=>{
              logAdds.push({t:ns.elapsed, msg:LANG==="tr"?`💀 ${d.name}, Lv ${d.level} ${clsName(d.cls)}, ${regionName(region)} bölgesinde düştü. Efsaneler Salonu'nda anılacak.`:`💀 ${d.name}, Lv ${d.level} ${clsName(d.cls)}, fell in ${regionName(region)}. They will be remembered in the Hall of Legends.`});
            });
            // notify the player of significant deaths via toast-like log emphasis handled in UI
            if(storageFull) logAdds.push({t:ns.elapsed, msg:LANG==="tr"?`⚠️ Ambar dolu — bir kısım ganimet geride bırakıldı. Depoyu yükselt.`:`⚠️ Warehouse full — some loot was left behind. Upgrade storage.`});
            // ---- BOSS battle result ----
            if(q.bossId){
              const boss=BOSSES.find(b=>b.id===q.bossId);
              if(boss){
                // party power = sum of (level + attack) of survivors who returned
                const survivors=q.party.map(id=>ns.adventurers.find(a=>a.id===id)).filter(a=>a&&a.status!=="dead");
                const power=survivors.reduce((sum,a)=>sum + a.level*3 + CLASSES[a.cls].atk, 0);
                const ratio=power/boss.power;
                const winChance=Math.max(0.05,Math.min(0.95, ratio-0.35)); // need clear power edge to be safe
                const won=Math.random()<winChance;
                ns.bossUnlocked = ns.bossUnlocked || {...(s.bossUnlocked||{})};
                if(won){
                  const rw=boss.reward;
                  ns.gold=(ns.gold||0)+rw.gold;
                  ns.renown=(ns.renown||0)+(rw.renown||0);
                  if(rw.item){ ns.inventory={...ns.inventory}; ns.inventory[rw.item]=(ns.inventory[rw.item]||0)+1; }
                  ns.bossUnlocked[boss.id]=false; // defeated — must be re-revealed to fight again
                  ns.bossDefeated = {...(ns.bossDefeated||s.bossDefeated||{})}; ns.bossDefeated[boss.id]=(ns.bossDefeated[boss.id]||0)+1;
                  if(rw.ach){ ns._pendingAch = ns._pendingAch||[]; ns._pendingAch.push(rw.ach); }
                  logAdds.push({t:ns.elapsed, msg:LANG==="tr"?`🏆 ${boss.icon} ${bossName(boss)} yenildi! Ödül: +${rw.gold}A, +${rw.renown} şöhret${rw.item?`, 1× ${itemName(rw.item)}`:""}.`:`🏆 ${boss.icon} ${bossName(boss)} defeated! Reward: +${rw.gold}G, +${rw.renown} renown${rw.item?`, 1× ${itemName(rw.item)}`:""}.`});
                } else {
                  ns.bossUnlocked[boss.id]=true; // stays available to try again
                  logAdds.push({t:ns.elapsed, msg:LANG==="tr"?`💥 ${boss.icon} ${bossName(boss)} ekibini püskürttü! Daha güçlü bir kadroyla dönün.`:`💥 ${boss.icon} ${bossName(boss)} repelled your party! Return with a stronger roster.`});
                }
              }
            }
            // auto-repeat: requeue if repeats remain and all party members are still healthy & available
            if(q.repeatLeft>0){
              const stillReady = q.party.every(id=>{ const a=ns.adventurers.find(x=>x.id===id); return a && a.status==="idle"; });
              if(stillReady){
                q.party.forEach(id=>{ const a=ns.adventurers.find(x=>x.id===id); if(a){a.status="questing";a.questId=region.id;} });
                ns.quests.push({id:uid(),regionId:region.id,party:q.party,startAt:ns.elapsed,endAt:ns.elapsed+q.duration,repeatLeft:q.repeatLeft-1,duration:q.duration});
              } else {
                logAdds.push({t:ns.elapsed, msg:LANG==="tr"?`↩️ ${regionName(region)} bölgesine tekrar sefer iptal edildi — bir üye yaralı ya da meşgul.`:`↩️ Repeat run to ${regionName(region)} cancelled — a member is hurt or busy.`});
              }
            }
          });
          ns.quests = ns.quests.filter(q=>!q.resolved);
        }
        // injuries heal & grief fades
        let healed=false;
        const adv2 = (ns.adventurers||s.adventurers).map(a=>{
          let na=a;
          if(a.status==="injured" && ns.elapsed>=a.injuryUntil){ healed=true; na={...na,status:"idle",hp:a.maxHp}; }
          if(a.grief && ns.elapsed>=a.grief){ healed=true; na={...na}; delete na.grief; }
          return na;
        });
        if(healed||done.length) ns.adventurers = adv2;
        // ---- IDLE TASKS: idle adventurers work at their assigned task (processed every ~5s) ----
        if(ns.elapsed % 5 === 0){
          let assistSpeedup=0, patrolGold=0, patrolRenownAcc=0, taskChanged=false;
          const _restBonus = (BUILDINGS.dormitory.levels[(ns.buildings||s.buildings).dormitory]||{}).restBonus||0;
          const adv3=(ns.adventurers||s.adventurers).map(a=>{
            if(a.status!=="idle") return a;
            const t=a.task||"rest"; let na={...a};
            if(t==="rest"){ if(na.fatigue>0){ na.fatigue=Math.max(0,na.fatigue-(6+_restBonus)); taskChanged=true; }
              if(na.hp<na.maxHp){ na.hp=Math.min(na.maxHp,na.hp+Math.ceil(na.maxHp*0.02)); taskChanged=true; } }
            else if(t==="train"){ na.xp=(na.xp||0)+3; taskChanged=true; }
            else if(t==="assist"){ assistSpeedup+=1; }
            else if(t==="patrol"){ patrolGold+=1; patrolRenownAcc+=0.025; taskChanged=true; }
            return na;
          });
          if(taskChanged||assistSpeedup>0||patrolGold>0) ns.adventurers=adv3;
          // assisting crafters: nudge active crafts forward
          if(assistSpeedup>0 && ns.crafting && ns.crafting.length){
            ns.crafting = ns.crafting.map(c=>({...c, endAt: c.endAt - assistSpeedup})); // each assistant shaves time
          }
          // patrolling brings in petty coin & word-of-mouth
          if(patrolGold>0){ ns.gold = ns.gold + patrolGold;
            ns._patrolRenown = (ns._patrolRenown||s._patrolRenown||0) + patrolRenownAcc;
            if(ns._patrolRenown>=1){ const r=Math.floor(ns._patrolRenown); ns.renown=(ns.renown||0)+r; ns._patrolRenown-=r; }
          }
        }
        // crafting progress
        const craftDone=[];
        ns.crafting = s.crafting.map(c=>({...c}));
        ns.crafting.forEach(c=>{ if(ns.elapsed>=c.endAt && !c.resolved){ c.resolved=true; craftDone.push(c);} });
        if(craftDone.length){
          ns.inventory = ns.inventory===s.inventory ? {...s.inventory} : ns.inventory;
          craftDone.forEach(c=>{ const r=RECIPES.find(x=>x.id===c.recipeId);
            ns.stats = ns.stats || {...(s.stats||{quests:0,crafted:0,sold:0,forged:0,maxParty:0})};
            ns.stats.crafted = (ns.stats.crafted||0)+(r.qty||1);
            if(["steel_sword","steel_shield","war_axe"].includes(r.out)) ns.stats.forged=(ns.stats.forged||0)+1;
            if(r.boon){
              // class relic: equip the highest-level un-bonused hero of that class
              const candidates=ns.adventurers.filter(a=>a.cls===r.classReq && !a.boon).sort((a,b)=>b.level-a.level);
              if(candidates.length){
                const chosen=candidates[0];
                ns.adventurers=ns.adventurers.map(a=>a.id===chosen.id?{...a,boon:r.boon}:a);
                logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`⚜️ ${chosen.name} artık ${itemName(r.out)} taşıyıcısı — ${boonDesc(r.boon).toLowerCase()}.`:`⚜️ ${chosen.name} is now bearer of the ${itemName(r.out)} — ${boonDesc(r.boon).toLowerCase()}.`});
              } else {
                // no eligible hero — it sits in storage as a valuable item
                ns.inventory[r.out]=(ns.inventory[r.out]||0)+r.qty;
                logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`${itemName(r.out)} üretildi, ama henüz taşıyabilecek bir ${clsName(r.classReq)} yok — sonrası için depolandı.`:`Crafted ${itemName(r.out)}, but no ${clsName(r.classReq)} can bear it yet — stored for later.`});
              }
            } else {
              ns.inventory[r.out]=(ns.inventory[r.out]||0)+r.qty;
              logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`${r.qty}× ${itemName(r.out)} üretildi.`:`Crafted ${r.qty}× ${itemName(r.out)}.`});
            }
          });
          ns.crafting = ns.crafting.filter(c=>!c.resolved);
          Audio.play("craft");
        }
        // daily upkeep every 120s = 1 day
        if(ns.elapsed - ns.lastUpkeep >= 120){
          ns.lastUpkeep = ns.elapsed; ns.day = s.day+1;
          const dorm = BUILDINGS.dormitory.levels[ns.buildings.dormitory];
          const tav = BUILDINGS.tavern.levels[ns.buildings.tavern];
          let income=0, wages=0;
          (ns.adventurers||s.adventurers).forEach(a=>{
            income += Math.round(dorm.rentPerHead*(a.pos.mod.rentMult||1));
            income += Math.round(tav.foodPerHead*(a.neg.mod.foodMult||1));
            wages += Math.round(a.wage*(a.pos.mod.wageMult||1)*(a.neg.mod.wageMult||1));
          });
          ns.gold = s.gold + income - wages;
          logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`${ns.day}. gün: kira ve pansiyondan +${income}A, maaşlara −${wages}A.`:`Day ${ns.day}: +${income}G from rent & board, −${wages}G in wages.`});
          // ---- market drift: customer demand SHIFTS between classes (when one cools, another heats) ----
          // raw stays fixed; the three customer classes share a pool of demand that sloshes around.
          ns.market = {...(ns.market||s.market||freshMarket())};
          const custCats=["nobles","church","commoners"];
          // each class drifts toward its own fresh random "mood" target, but we then re-center them
          // so their average stays ~1.0 — a dip in one is balanced by a rise in another.
          const targets={};
          custCats.forEach(cat=>{
            const cur=(ns.market[cat]&&ns.market[cat].price)||1.0;
            const meanPull=(1.0-cur)*0.25;          // stronger pull back toward fair
            const noise=(Math.random()-0.5)*0.22;   // daily mood swing
            targets[cat]=cur+meanPull+noise;
          });
          // re-center: shift all three so their mean returns to 1.0 (demand is conserved, just redistributed)
          const avg=(targets.nobles+targets.church+targets.commoners)/3;
          custCats.forEach(cat=>{
            let next=targets[cat]-(avg-1.0);          // subtract the drift of the average
            next=Math.max(0.6, Math.min(1.5, next));  // clamp 60%–150%
            ns.market[cat]={price:next};
          });
          // raw materials: always fair, never fluctuates
          ns.market.raw={price:1.0};
          // ---- passive relationship drift: adventurers living together at the hall ----
          const home = (ns.adventurers||s.adventurers).filter(a=>a.status!=="questing");
          if(home.length>1){
            if(!(ns.rels===s.rels)) {} else ns.rels={...s.rels};
            const hawkHome = home.some(a=>a.cls==="Hawk");
            for(let i=0;i<home.length;i++) for(let j=i+1;j<home.length;j++){
              let d=passiveDrift(home[i],home[j]);
              if(hawkHome){
                if(home[i].cls==="Hawk"||home[j].cls==="Hawk") d+=2; // Hawk charms
                else d-=2; // Hawk poisons everyone else's bonds
              }
              bumpRel(ns.rels, home[i].id, home[j].id, d, ns.elapsed);
            }
          }
          // ---- rare relationship event ----
          const advs=(ns.adventurers||s.adventurers);
          if(advs.length>=2 && Math.random()<0.30){
            const A=pick(advs); let B=pick(advs.filter(x=>x.id!==A.id));
            if(B){ const sc=getRel(ns.rels,A.id,B.id);
              ns.rels = (ns.rels===s.rels)?{...s.rels}:ns.rels;
              if(sc<=-60 && Math.random()<0.5){
                bumpRel(ns.rels,A.id,B.id,-5,ns.elapsed);
                logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`💢 ${A.name} ile ${B.name} meyhanede kavga etti. Husumet derinleşiyor.`:`💢 ${A.name} and ${B.name} brawled in the tavern. The bad blood deepens.`});
              } else if(sc>=70){
                logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`💞 ${A.name} ile ${B.name} ateşin başında sessizce içki içerken görüldü.`:`💞 ${A.name} and ${B.name} were seen sharing a quiet drink by the fire.`});
              } else if(sc>=30){
                bumpRel(ns.rels,A.id,B.id,3,ns.elapsed);
                logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`😊 ${A.name} ile ${B.name} gece geç saatlere dek hikâye paylaştı.`:`😊 ${A.name} and ${B.name} swapped stories late into the night.`});
              }
            }
          }
          // ---- CHAINED EVENTS: fire any follow-ups that have come due ----
          if(ns.pendingChains && ns.pendingChains.length){
            const due = ns.pendingChains.filter(ch=>ns.day>=ch.fireDay);
            if(due.length){
              ns.pendingChains = ns.pendingChains.filter(ch=>ns.day<ch.fireDay);
              due.forEach(ch=>{ const fn=CHAIN_EVENTS[ch.id]; if(fn){ const res=fn(ns, ch.data); applyEventPatch(ns,res); if(res.msg) logAdds.push({t:ns.elapsed,msg:res.msg}); } });
            }
          }
          // ---- EVENT SYSTEM: roughly every few days something happens ----
          if(!ns.pendingEvent && Math.random()<0.40){
            const roll=Math.random();
            if(roll<0.06){ // rare legendary
              const ev=pickWeighted(LEGENDARY_EVENTS, ns);
              if(ev) ns.pendingEvent={ id:ev.id, kind:"legendary", uid:uid(), ...ev.build(ns) };
            } else if(roll<0.45){ // big decision event
              const ev=pickWeighted(BIG_EVENTS, ns);
              if(ev) ns.pendingEvent={ id:ev.id, kind:"big", uid:uid(), ...ev.build(ns) };
            } else { // small automatic event
              const ev=pickWeighted(SMALL_EVENTS, ns);
              if(ev){ const res=ev.apply(ns); applyEventPatch(ns, res); if(res.msg) logAdds.push({t:ns.elapsed,msg:res.msg}); }
            }
          }
        }
        // ---- ACHIEVEMENTS: process pending (event/boss) + auto-check conditions ----
        {
          ns.achieved = ns.achieved || {...(s.achieved||{})};
          const newly=[];
          // pending (triggered by boss/event)
          if(ns._pendingAch && ns._pendingAch.length){
            ns._pendingAch.forEach(id=>{ if(!ns.achieved[id] && ACH_BY_ID[id]){ ns.achieved[id]=ns.elapsed||1; newly.push(id); } });
            ns._pendingAch=[];
          }
          // auto-check condition-based achievements
          ACHIEVEMENTS.forEach(a=>{ if(a.check && !ns.achieved[a.id]){ try{ if(a.check(ns)){ ns.achieved[a.id]=ns.elapsed||1; newly.push(a.id); } }catch(e){} } });
          newly.forEach(id=>{ const a=ACH_BY_ID[id]; if(a) logAdds.push({t:ns.elapsed,msg:`${a.icon} ${LANG==="tr"?"Başarım açıldı":"Achievement unlocked"}: ${achName(a)}`}); });
          if(newly.length) ns._achToast=(ns.achieved&&ACH_BY_ID[newly[newly.length-1]])?ACH_BY_ID[newly[newly.length-1]]:null;
        }
        if(logAdds.length){ ns.log = [...logAdds.reverse(), ...s.log].slice(0,40); }
        return ns;
      });
    }, 1000);
    return ()=>clearInterval(tickRef.current);
  }, []);

  const api = { state, setState, notify, newGame, lang, switchLang };
  if(!state.started) return <IntroSequence onBegin={(name)=>setState(s=>({...s,started:true,guildName:name,
    log:[{t:0,msg:LANG==="tr"?`${name} loncasının fermanı imzalandı. İlk maceracılarını işe almak için İşe Alım Tahtası'na uğra.`:`The charter of ${name} is signed. Visit the Recruitment Board to hire your first adventurers.`}]}))} />;
  if(showWelcome) return <WelcomeBack guildName={state.guildName||(LANG==="tr"?"Ashford Loncası":"The Ashford Guild")} onContinue={()=>setShowWelcome(false)} />;
  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.ink,fontFamily:font}}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        button{font-family:${font};cursor:pointer;transition:transform .05s ease, filter .05s ease}
        button:active{transform:scale(.96);filter:brightness(.88)}
        button:focus-visible{outline:2px solid ${T.gold};outline-offset:2px}
      `}</style>
      <TopBar state={state} onAchievements={()=>setShowAch(true)} />
      <main style={{maxWidth:760,margin:"0 auto",padding:"12px 12px 90px",paddingBottom:"calc(90px + env(safe-area-inset-bottom, 0px))"}}>
        {tab==="hall" && <HallView {...api} setTab={setTab} />}
        {tab==="advs" && <AdventurersView {...api} />}
        {tab==="quests" && <QuestsView {...api} />}
        {tab==="craft" && <CraftView {...api} />}
        {tab==="market" && <MarketView {...api} />}
        {tab==="storage" && <StorageView {...api} />}
        {tab==="upgrades" && <UpgradesView {...api} />}
      </main>
      <NavBar tab={tab} setTab={setTab} state={state} />
      {toast && <div style={{position:"fixed",bottom:"calc(90px + env(safe-area-inset-bottom, 0px))",left:"50%",transform:"translateX(-50%)",
        background:T.panel2,border:`1px solid ${T.borderLit}`,color:T.ink,padding:"10px 18px",
        borderRadius:8,fontSize:14,zIndex:50,boxShadow:"0 6px 20px rgba(0,0,0,.5)",animation:"fadeUp .2s",maxWidth:"90%",textAlign:"center"}}>{toast}</div>}
      {deathModal && (
        <div onClick={()=>setDeathModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:70,
          display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeUp .3s"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"radial-gradient(circle at 50% 30%,#2a1816,#160e0b)",
            border:`1px solid ${T.red}`,borderRadius:14,padding:"30px 26px",maxWidth:360,textAlign:"center",
            boxShadow:"0 0 40px rgba(192,86,63,.3)"}}>
            <div style={{fontSize:46,marginBottom:14,filter:"drop-shadow(0 0 16px rgba(192,86,63,.5))"}}>💀</div>
            <div style={{fontSize:12,letterSpacing:2,textTransform:"uppercase",color:T.red,marginBottom:10}}>{t("death.fallen")}</div>
            <div style={{fontSize:18,fontWeight:700,color:T.parchment,marginBottom:6}}>{deathModal.name}</div>
            <div style={{fontSize:13,color:T.inkDim,marginBottom:4}}>Lv {deathModal.level} {CLASSES[deathModal.cls]?CLASSES[deathModal.cls].icon:""} {clsName(deathModal.cls)}</div>
            <div style={{fontSize:13,color:T.ink,lineHeight:1.5,marginBottom:deathModal.eulogy?10:20}}>
              {t("death.lostIn").replace("{region}", regionName(deathModal.region)).replace("{others}", deathModal.count>1?(LANG==="tr"?`, ${deathModal.count-1} yoldaşıyla birlikte`:`, along with ${deathModal.count-1} other${deathModal.count-1>1?"s":""}`):"")}</div>
            {deathModal.eulogy && <div style={{fontSize:12,color:"#e07a9c",fontStyle:"italic",lineHeight:1.5,marginBottom:20}}>{deathModal.eulogy}</div>}
            <button onClick={()=>setDeathModal(null)} style={{width:"100%",background:`linear-gradient(${T.gold},${T.goldDim})`,
              color:"#211705",border:"none",borderRadius:9,padding:"12px",fontWeight:700,fontSize:14,fontFamily:font}}>{t("death.honor")}</button>
          </div>
        </div>
      )}
      {eventModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:70,
          display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeUp .3s"}}>
          <div style={{background:eventModal.kind==="legendary"?"radial-gradient(circle at 50% 25%,#2a2410,#15110A)":"radial-gradient(circle at 50% 25%,#241c15,#15100A)",
            border:`1px solid ${eventModal.kind==="legendary"?T.gold:T.borderLit}`,borderRadius:14,padding:"26px 22px",maxWidth:380,width:"100%",
            boxShadow:eventModal.kind==="legendary"?"0 0 44px rgba(224,162,60,.35)":"0 10px 40px rgba(0,0,0,.6)"}}>
            <div style={{fontSize:42,textAlign:"center",marginBottom:12,filter:"drop-shadow(0 0 14px rgba(224,162,60,.4))"}}>{eventModal.icon}</div>
            {eventModal.kind==="legendary" && <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:T.gold,textAlign:"center",marginBottom:6}}>{LANG==="tr"?"Efsanevi Olay":"Legendary Event"}</div>}
            <div style={{fontSize:17,fontWeight:700,color:T.parchment,textAlign:"center",marginBottom:10}}>{eventModal.title}</div>
            <div style={{fontSize:13,color:T.ink,lineHeight:1.55,marginBottom:18,textAlign:"center",fontStyle:"italic"}}>{eventModal.text}</div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {eventModal.choices.map((ch,i)=>(
                <button key={i} onClick={()=>resolveEvent(i)} style={{textAlign:"left",background:T.panel2,
                  border:`1px solid ${T.border}`,borderRadius:9,padding:"11px 13px",cursor:"pointer"}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.gold}}>{ch.label}</div>
                  {ch.detail && <div style={{fontSize:11,color:T.inkDim,marginTop:2}}>{ch.detail}</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {showAch && <AchievementsModal achieved={state.achieved} onClose={()=>setShowAch(false)} />}
    </div>
  );
}
function Panel({children,style}){ return <div style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:14,...style}}>{children}</div>; }
function SectionTitle({children,sub}){ return (<div style={{marginBottom:10}}>
  <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:T.gold,fontWeight:700}}>{children}</div>
  {sub&&<div style={{fontSize:12,color:T.inkDim,marginTop:2}}>{sub}</div>}</div>); }
function GoldBtn({children,onClick,disabled,style}){ return (
  <button onClick={onClick} disabled={disabled} style={{background:disabled?T.border:`linear-gradient(${T.gold},${T.goldDim})`,
    color:disabled?T.inkFaint:"#211705",border:"none",borderRadius:8,padding:"9px 14px",fontWeight:700,fontSize:13,
    opacity:disabled?0.6:1,...style}}>{children}</button>); }
function GhostBtn({children,onClick,disabled,active,style}){ return (
  <button onClick={onClick} disabled={disabled} style={{background:active?T.panel2:"transparent",
    color:disabled?T.inkFaint:T.ink,border:`1px solid ${active?T.borderLit:T.border}`,borderRadius:8,padding:"8px 12px",
    fontSize:13,opacity:disabled?0.5:1,...style}}>{children}</button>); }
function Bar({pct,color,h=6}){ return (<div style={{background:"#0e0a07",borderRadius:4,height:h,overflow:"hidden"}}>
  <div style={{width:`${Math.max(0,Math.min(100,pct))}%`,height:"100%",background:color,transition:"width .3s"}}/></div>); }

function DayClock({progress}){
  // progress 0..1 toward next day; SVG ring
  const r=11, c=2*Math.PI*r, off=c*(1-progress);
  return (<svg width="30" height="30" viewBox="0 0 30 30" style={{transform:"rotate(-90deg)"}}>
    <circle cx="15" cy="15" r={r} fill="none" stroke={T.border} strokeWidth="3"/>
    <circle cx="15" cy="15" r={r} fill="none" stroke={T.gold} strokeWidth="3"
      strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{transition:"stroke-dashoffset .9s linear"}}/>
  </svg>);
}
// ==================== §UI · INTRO / KARŞILAMA ====================
function WelcomeBack({guildName,onContinue}){
  return (
    <div onClick={()=>{Audio.startMusic();onContinue();}}
      style={{minHeight:"100vh",background:"#0c0907",cursor:"pointer",
      color:T.ink,fontFamily:font,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:"32px 26px",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <style>{`
        @keyframes flicker{0%,100%{opacity:.9;transform:scale(1)}25%{opacity:.7;transform:scale(.97)}50%{opacity:1;transform:scale(1.03)}75%{opacity:.8;transform:scale(.99)}}
        @keyframes lineIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes glow{0%,100%{text-shadow:0 0 12px rgba(224,162,60,.25)}50%{text-shadow:0 0 22px rgba(224,162,60,.5)}}
        @keyframes firelight{0%,100%{opacity:.55}45%{opacity:.8}70%{opacity:.62}}
        @keyframes tapPulse{0%,100%{opacity:.45}50%{opacity:.9}}
      `}</style>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",
        ...INTRO_BG_STYLE, backgroundSize:"cover", backgroundPosition:"center top"}}/>
      <div style={{position:"absolute",left:0,right:0,top:"42%",height:"45%",pointerEvents:"none",
        background:"radial-gradient(ellipse at 50% 60%, rgba(255,140,44,.28), transparent 65%)",
        animation:"firelight 4s ease-in-out infinite"}}/>
      <div style={{fontSize:40,marginBottom:24,animation:"flicker 3s infinite",filter:"drop-shadow(0 0 18px rgba(224,162,60,.6))",position:"relative",zIndex:2}}>🕯️</div>
      <div style={{maxWidth:440,position:"relative",zIndex:2,animation:"lineIn .9s ease both",
        background:"radial-gradient(ellipse at center, rgba(12,8,5,.62), rgba(12,8,5,.32) 70%, transparent)",
        borderRadius:20,padding:"22px 18px"}}>
        <div style={{fontSize:12,letterSpacing:2,textTransform:"uppercase",color:T.inkDim,marginBottom:12,textShadow:"0 1px 8px rgba(0,0,0,.9)"}}>
          {LANG==="tr"?"Tekrar hoş geldin":"Welcome back"}</div>
        <div style={{fontSize:24,fontWeight:700,color:T.gold,lineHeight:1.3,animation:"glow 2.8s infinite",textShadow:"0 1px 10px rgba(0,0,0,.9)"}}>
          {guildName}</div>
        <div style={{fontSize:14,color:T.parchment,fontStyle:"italic",marginTop:14,textShadow:"0 1px 8px rgba(0,0,0,.9)"}}>
          {LANG==="tr"?"Salonun seni bekliyor.":"Your hall awaits."}</div>
      </div>
      <div style={{marginTop:28,fontSize:13,color:T.gold,position:"relative",zIndex:2,animation:"tapPulse 2s infinite",letterSpacing:1}}>
        {LANG==="tr"?"▸ Devam etmek için dokun":"▸ Tap to continue"}</div>
    </div>
  );
}
function IntroSequence({onBegin}){
  const lines = LANG==="tr" ? [
    "Eski lonca efendisi öldü.",
    "Ferman, borçlar ve hudut kasabası Ashford'daki harap bir salonun anahtarları artık sana kalıyor.",
    "Ocak soğuk. Kese hafif. Ama kazanılacak altın ve bulunacak yoldaş olan yere maceracılar hâlâ toplanır.",
    "Loncana bir ad ver, o senindir.",
  ] : [
    "The old guildmaster is dead.",
    "The charter, the debts, and the keys to a crumbling hall in the frontier town of Ashford now fall to you.",
    "The hearth is cold. The coffers are light. But adventurers still gather where there is coin to be earned and kin to be found.",
    "Name your guild, and it is yours.",
  ];
  const [shown,setShown]=useState(0);
  const [naming,setNaming]=useState(false);
  const [name,setName]=useState("");
  useEffect(()=>{
    if(shown<lines.length){ const t=setTimeout(()=>setShown(shown+1), shown===0?700:1500); return ()=>clearTimeout(t); }
    else { const t=setTimeout(()=>setNaming(true), 900); return ()=>clearTimeout(t); }
  },[shown]);
  const finalName=()=>{ const n=name.trim()||(LANG==="tr"?"Ashford Loncası":"The Ashford Guild"); Audio.startMusic(); onBegin(n); };
  return (
    <div style={{minHeight:"100vh",background:"#0c0907",
      color:T.ink,fontFamily:font,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:"32px 26px",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <style>{`
        @keyframes flicker{0%,100%{opacity:.9;transform:scale(1)}25%{opacity:.7;transform:scale(.97)}50%{opacity:1;transform:scale(1.03)}75%{opacity:.8;transform:scale(.99)}}
        @keyframes lineIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes glow{0%,100%{text-shadow:0 0 12px rgba(224,162,60,.25)}50%{text-shadow:0 0 22px rgba(224,162,60,.5)}}
        @keyframes firelight{0%,100%{opacity:.55}45%{opacity:.8}70%{opacity:.62}}
        @keyframes flameDance{0%,100%{transform:scaleY(1) scaleX(1);opacity:.9}33%{transform:scaleY(1.12) scaleX(.94);opacity:1}66%{transform:scaleY(.93) scaleX(1.05);opacity:.85}}
        @keyframes bannerSway{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(1deg)}}
      `}</style>

      {/* ===== GUILD HALL INTERIOR (rich background image) ===== */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",
        ...INTRO_BG_STYLE, backgroundSize:"cover", backgroundPosition:"center top"}}/>
      {/* pulsing warm fire glow over the hearth */}
      <div style={{position:"absolute",left:0,right:0,top:"42%",height:"45%",pointerEvents:"none",
        background:"radial-gradient(ellipse at 50% 60%, rgba(255,140,44,.28), transparent 65%)",
        animation:"firelight 4s ease-in-out infinite"}}/>

      {/* candle on the table, foreground */}
      <div style={{fontSize:40,marginBottom:24,animation:"flicker 3s infinite",filter:"drop-shadow(0 0 18px rgba(224,162,60,.6))",position:"relative",zIndex:2}}>🕯️</div>

      <div style={{maxWidth:440,minHeight:200,position:"relative",zIndex:2,
        background:"radial-gradient(ellipse at center, rgba(12,8,5,.62), rgba(12,8,5,.32) 70%, transparent)",
        borderRadius:20,padding:"18px 16px"}}>
        {lines.slice(0,shown).map((l,i)=>(
          <p key={i} style={{fontSize:i===lines.length-1?16:14.5,lineHeight:1.6,margin:"0 0 16px",
            color:i===lines.length-1?T.gold:T.parchment,fontStyle:i===lines.length-1?"normal":"italic",
            fontWeight:i===lines.length-1?700:400,animation:"lineIn .9s ease both",
            textShadow:"0 1px 8px rgba(0,0,0,.9)"}}>{l}</p>
        ))}
      </div>
      {naming && (
        <div style={{marginTop:18,width:"100%",maxWidth:360,animation:"lineIn .8s ease both",position:"relative",zIndex:2}}>
          <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:T.inkDim,marginBottom:9}}>{LANG==="tr"?"Loncana ad ver":"Name your guild"}</div>
          <input value={name} onChange={e=>setName(e.target.value)} maxLength={28} placeholder={LANG==="tr"?"Ashford Loncası":"The Ashford Guild"}
            onKeyDown={e=>{if(e.key==="Enter")finalName();}}
            style={{width:"100%",boxSizing:"border-box",textAlign:"center",background:"rgba(0,0,0,.45)",border:`1px solid ${T.borderLit}`,
              borderRadius:9,color:T.gold,padding:"12px 14px",fontSize:16,fontFamily:font,fontWeight:700,marginBottom:14,outline:"none"}}/>
          <button onClick={finalName} style={{width:"100%",background:`linear-gradient(${T.gold},${T.goldDim})`,
            color:"#211705",border:"none",borderRadius:9,padding:"13px",fontWeight:700,fontSize:15,fontFamily:font,
            animation:"glow 2.5s infinite",letterSpacing:.5}}>✒️ {LANG==="tr"?"Fermanı İmzala":"Sign the Charter"}</button>
          <div style={{fontSize:10,color:T.inkFaint,marginTop:10}}>{LANG==="tr"?"Eski adı korumak için boş bırak.":"Leave it blank to keep the old name."}</div>
        </div>
      )}
      {!naming && shown>=lines.length && <div style={{marginTop:10,fontSize:12,color:T.inkFaint,position:"relative",zIndex:2}}>…</div>}
    </div>
  );
}

function TopBar({state,onAchievements}){
  const tier = BUILDINGS.treasury.levels[state.buildings.treasury].tier;
  const rank = RANKS[tier];
  const DAY_LEN = 120;
  const intoDay = (state.elapsed - state.lastUpkeep);
  const progress = Math.max(0, Math.min(1, intoDay/DAY_LEN));
  const secsLeft = Math.max(0, DAY_LEN - intoDay);
  return (<header style={{position:"sticky",top:0,zIndex:40,background:`linear-gradient(${T.panel2},${T.panel})`,
    borderBottom:`1px solid ${T.border}`,padding:"10px 14px"}}>
    <div style={{maxWidth:760,margin:"0 auto",display:"flex",alignItems:"center",gap:12}}>
      <button onClick={onAchievements} title={LANG==="tr"?"Başarımlar":"Achievements"} style={{background:"none",border:"none",padding:0,display:"flex",alignItems:"center",gap:12,flex:1,textAlign:"left",cursor:"pointer"}}>
        <div style={{fontSize:22}}>🏰</div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:700,letterSpacing:.5,color:T.ink}}>{state.guildName||t("top.defaultName")}</div>
          <div style={{fontSize:11,color:rank.color}}>{t("guildrank."+tier)}</div>
        </div>
      </button>
      <div style={{textAlign:"center",minWidth:38}} title={t("top.nextPayday")+" "+fmtTime(secsLeft)}>
        <div style={{fontSize:8,color:T.inkFaint,lineHeight:1,letterSpacing:1}}>{t("top.day")}</div>
        <div style={{fontSize:20,fontWeight:700,color:T.gold,lineHeight:1.1}}>{state.day}</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{color:T.gold,fontWeight:700,fontSize:16}}>{state.gold.toLocaleString()}<span style={{fontSize:11,marginLeft:2}}>{t("top.goldUnit")}</span></div>
        <div style={{fontSize:11,color:T.inkDim}}>★ {state.renown} {t("top.renown")}</div>
      </div>
    </div>
    {/* full-width day progress toward next payday */}
    <div style={{maxWidth:760,margin:"8px auto 0",display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:5,background:"#0e0a07",borderRadius:3,overflow:"hidden",border:`1px solid ${T.border}`}}>
        <div style={{width:`${Math.round(progress*100)}%`,height:"100%",background:`linear-gradient(90deg,${T.goldDim},${T.gold})`,transition:"width .9s linear"}}/>
      </div>
      <span style={{fontSize:10,color:T.inkFaint,minWidth:64,textAlign:"right"}}>{t("top.nextPayday")}{LANG==="tr"?":":""} {fmtTime(secsLeft)}</span>
    </div>
  </header>);
}

function NavBar({tab,setTab,state}){
  const items=[["hall","🏠","tab.hall"],["advs","⚔️","tab.advs"],["quests","🗺️","tab.quests"],
    ["craft","⚒️","tab.craft"],["market","⚖️","tab.market"],["storage","🗝️","tab.store"],["upgrades","🏰","tab.build"]];
  return (<nav style={{position:"fixed",bottom:0,left:0,right:0,background:T.panel,borderTop:`1px solid ${T.border}`,zIndex:40,
    paddingBottom:"env(safe-area-inset-bottom, 0px)"}}>
    <div style={{maxWidth:760,margin:"0 auto",display:"flex"}}>
      {items.map(([k,ic,lb])=>(
        <button key={k} onClick={()=>setTab(k)} style={{flex:1,background:tab===k?T.panel2:"transparent",
          border:"none",borderTop:`2px solid ${tab===k?T.gold:"transparent"}`,padding:"8px 2px 7px",
          color:tab===k?T.gold:T.inkDim,display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:0}}>
          <span style={{fontSize:17}}>{ic}</span><span style={{fontSize:9,letterSpacing:.3,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t(lb)}</span>
        </button>))}
    </div>
  </nav>);
}

// ==================== §UI · HALL / SALON ====================
// derives the player's next suggested step from current state — guides the first loop, then retires itself
function nextStep(state){
  if(state.adventurers.length===0) return { tab:"advs", icon:"⚔️", txt:t("step.hire.txt"), cta:t("step.hire.cta") };
  if(state.quests.length===0 && state.crafting.length===0 && Object.values(state.inventory).reduce((a,b)=>a+b,0)===0)
    return { tab:"quests", icon:"🗺️", txt:t("step.disp.txt"), cta:t("step.disp.cta") };
  const hasRaw = Object.entries(state.inventory).some(([k,v])=>v>0 && ITEMS[k] && ITEMS[k].tier!=="fin");
  const hasGoods = Object.entries(state.inventory).some(([k,v])=>v>0 && ITEMS[k] && ITEMS[k].tier==="fin");
  if(hasRaw && state.crafting.length===0 && !hasGoods)
    return { tab:"craft", icon:"⚒️", txt:t("step.craft.txt"), cta:t("step.craft.cta") };
  if(hasGoods) return { tab:"market", icon:"💰", txt:t("step.sell.txt"), cta:t("step.sell.cta") };
  return null;
}

function HallView({state,setTab,setState,notify,newGame,lang,switchLang}){
  const tier = BUILDINGS.treasury.levels[state.buildings.treasury].tier;
  const cap = BUILDINGS.dormitory.levels[state.buildings.dormitory].capacity;
  const idle = state.adventurers.filter(a=>a.status==="idle").length;
  const questing = state.quests.length;
  const invCount = Object.values(state.inventory).reduce((a,b)=>a+b,0);
  const [showSave,setShowSave]=useState(false);
  const [showLegends,setShowLegends]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const empty = state.adventurers.length===0;
  const step = (state.day<=4 || empty) ? nextStep(state) : null; // guidance during early game or until first hire
  return (<div style={{animation:"fadeUp .3s"}}>
    {step ? (
      <Panel style={{marginBottom:12,background:`linear-gradient(135deg,${T.panel2},${T.panel})`,borderColor:T.borderLit}}>
        <div style={{fontSize:11,letterSpacing:1,textTransform:"uppercase",color:T.gold,marginBottom:6}}>{t("hall.gettingStarted")}</div>
        <div style={{fontSize:13,color:T.parchment,lineHeight:1.5,marginBottom:10}}>
          <span style={{fontSize:16,marginRight:6}}>{step.icon}</span>{step.txt}</div>
        <GoldBtn onClick={()=>setTab(step.tab)} style={{width:"100%"}}>{step.cta} ›</GoldBtn>
      </Panel>
    ) : (
      <Panel style={{marginBottom:12,background:`linear-gradient(135deg,${T.panel2},${T.panel})`}}>
        <div style={{fontSize:13,color:T.parchment,lineHeight:1.5,fontStyle:"italic"}}>
          {t("hall.quote")}
        </div>
      </Panel>
    )}
    {/* compact summary strip — adventurers emphasized, rest small & tappable */}
    <div style={{display:"flex",gap:8,marginBottom:12}}>
      <button onClick={()=>setTab("advs")} style={{flex:2,textAlign:"left",background:`linear-gradient(135deg,${T.panel2},${T.panel})`,border:`1px solid ${T.borderLit}`,borderRadius:10,padding:"11px 13px"}}>
        <div style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:T.gold}}>⚔️ {t("hall.adventurers")}</div>
        <div style={{fontSize:24,fontWeight:700,color:T.ink,lineHeight:1.1}}>{state.adventurers.length}<span style={{fontSize:13,color:T.inkDim}}>/{cap}</span></div>
        <div style={{fontSize:11,color:T.inkDim}}>{idle} {t("hall.idle")} · {questing} {t("hall.away")}</div>
      </button>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
        <button onClick={()=>setTab("quests")} style={{flex:1,textAlign:"left",background:T.panel,border:`1px solid ${T.border}`,borderRadius:9,padding:"7px 10px"}}>
          <div style={{fontSize:10,color:T.gold}}>🗺️ {questing}</div><div style={{fontSize:9,color:T.inkFaint}}>{t("hall.expeditions")}</div></button>
        <button onClick={()=>setTab("storage")} style={{flex:1,textAlign:"left",background:T.panel,border:`1px solid ${T.border}`,borderRadius:9,padding:"7px 10px"}}>
          <div style={{fontSize:10,color:T.gold}}>🗝️ {invCount}</div><div style={{fontSize:9,color:T.inkFaint}}>{t("hall.storage")}</div></button>
      </div>
    </div>
    <Panel style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <SectionTitle sub={t("hall.recentFirst")}>{t("hall.ledger")}</SectionTitle>
        <button onClick={()=>setShowSettings(true)} style={{background:"none",border:`1px solid ${T.border}`,color:T.inkDim,borderRadius:7,padding:"5px 9px",fontSize:13}}>⚙️</button>
      </div>
      <div style={{maxHeight:440,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
        {state.log.length===0 && <div style={{fontSize:12,color:T.inkFaint,padding:"8px 0"}}>{t("hall.ledgerEmpty")}</div>}
        {state.log.map((l,i)=>(<div key={i} style={{fontSize:12,color:T.inkDim,display:"flex",gap:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>
          <span style={{color:T.inkFaint,minWidth:42,fontSize:10}}>{fmtTime(l.t)}</span><span style={{color:T.ink}}>{l.msg}</span></div>))}
      </div>
    </Panel>
    {(state.fallen&&state.fallen.length>0) && <button onClick={()=>setShowLegends(true)} style={{width:"100%",marginBottom:12,
      background:"linear-gradient(135deg,#2a2016,#1a130d)",border:`1px solid ${T.borderLit}`,borderRadius:10,padding:13,
      textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
      <span style={{fontSize:22}}>🕯️</span>
      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:T.parchment}}>{t("ui.legends")}</div>
        <div style={{fontSize:11,color:T.inkDim}}>{state.fallen.length} {state.fallen.length>1?t("hall.fallenHeroes"):t("hall.fallenHero")}</div></div>
      <span style={{color:T.gold,fontSize:18}}>›</span>
    </button>}
    {showSettings && <SettingsModal state={state} setState={setState} notify={notify} newGame={newGame}
      lang={lang} switchLang={switchLang}
      onSave={()=>{setShowSettings(false);setShowSave(true);}} onClose={()=>setShowSettings(false)} />}
    {showSave && <SaveModal state={state} setState={setState} notify={notify} onClose={()=>setShowSave(false)} />}
    {showLegends && <LegendsModal fallen={state.fallen} onClose={()=>setShowLegends(false)} />}
  </div>);
}
function StatCard({icon,label,value,sub,onClick}){ return (
  <button onClick={onClick} style={{textAlign:"left",background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:12}}>
    <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
    <div style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:T.gold}}>{label}</div>
    <div style={{fontSize:20,fontWeight:700,color:T.ink}}>{value}</div>
    <div style={{fontSize:11,color:T.inkDim}}>{sub}</div>
  </button>); }

function SettingsModal({state,setState,notify,newGame,lang,switchLang,onSave,onClose}){
  const [sound,setSound]=useState(Audio.sfxOn);
  const [confirmNew,setConfirmNew]=useState(false);
  const [music,setMusic]=useState(Audio.musicOn);
  const Toggle=({on,set,label})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${T.border}`}}>
      <span style={{fontSize:13,color:T.ink}}>{label}</span>
      <button onClick={()=>set(!on)} style={{width:46,height:26,borderRadius:13,border:"none",position:"relative",
        background:on?T.gold:T.border,transition:"background .2s",cursor:"pointer"}}>
        <span style={{position:"absolute",top:3,left:on?23:3,width:20,height:20,borderRadius:10,background:"#fff",transition:"left .2s"}}/>
      </button>
    </div>
  );
  const LangBtn=({code,label})=>(
    <button onClick={()=>{ if(lang!==code){ switchLang(code); Audio.play("click"); } }}
      style={{flex:1,padding:"10px",borderRadius:8,fontSize:13,fontWeight:700,fontFamily:font,cursor:"pointer",
        border:`1px solid ${lang===code?T.gold:T.border}`,
        background:lang===code?T.gold:"transparent",
        color:lang===code?"#1a1206":T.inkDim}}>{label}</button>
  );
  return (<Modal title={`⚙️ ${t("ui.settings")}`} onClose={onClose}>
    <div style={{marginBottom:8}}>
      <Toggle on={sound} set={(v)=>{setSound(v);Audio.setSfx(v);if(v)Audio.play("click");}} label={`🔊 ${t("ui.sfx")}`}/>
      <Toggle on={music} set={(v)=>{setMusic(v);Audio.setMusic(v);}} label={`🎵 ${t("ui.music")}`}/>
      <div style={{fontSize:10,color:T.inkFaint,marginTop:6,marginBottom:14}}>{t("ui.musicHint")}</div>
    </div>
    <SectionTitle>{t("ui.language")}</SectionTitle>
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      <LangBtn code="tr" label="🇹🇷 Türkçe"/>
      <LangBtn code="en" label="🇬🇧 English"/>
    </div>
    <SectionTitle>{t("ui.guild")}</SectionTitle>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <GoldBtn onClick={onSave} style={{width:"100%"}}>💾 {t("ui.save")}</GoldBtn>
      {!confirmNew
        ? <GhostBtn onClick={()=>setConfirmNew(true)} style={{width:"100%"}}>🔄 {t("ui.newGuild")}</GhostBtn>
        : <div style={{background:"rgba(192,86,63,.1)",border:`1px solid ${T.red}`,borderRadius:9,padding:"12px"}}>
            <div style={{fontSize:12,color:T.parchment,marginBottom:10,textAlign:"center"}}>{t("ui.newGuildConfirm")}</div>
            <div style={{display:"flex",gap:8}}>
              <GhostBtn onClick={()=>setConfirmNew(false)} style={{flex:1}}>{t("ui.cancel")}</GhostBtn>
              <button onClick={()=>{try{localStorage.removeItem("guildmaster_save_v1");}catch(e){} setState(newGame());notify(t("ui.newGuildDone"));onClose();}} style={{flex:1,background:T.red,color:"#fff",border:"none",borderRadius:8,padding:"10px",fontWeight:700,fontSize:13,fontFamily:font}}>{t("ui.startNew")}</button>
            </div>
          </div>}
    </div>
    <div style={{fontSize:10,color:T.inkFaint,textAlign:"center",marginTop:16}}>Of Coin and Kin · {t("ui.tagline")}</div>
  </Modal>);
}
function SaveModal({state,setState,notify,onClose}){
  const [text,setText]=useState("");
  // emoji-safe base64 (handles the game's many emoji icons correctly)
  const enc=(str)=>{ const bytes=new TextEncoder().encode(str); let bin=""; bytes.forEach(b=>bin+=String.fromCharCode(b)); return btoa(bin); };
  const dec=(b64)=>{ const bin=atob(b64); const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0)); return new TextDecoder().decode(bytes); };
  const exportSave=()=>{
    // strip transient fields that hold functions or are mid-flight
    const { pendingEvent, deathAlert, injuryAlert, ...clean } = state;
    try{ setText(enc(JSON.stringify(clean))); notify("Save code ready — copy it!"); }
    catch(e){ notify(LANG==="tr"?"Kayıt kodu oluşturulamadı.":"Could not create save code."); }
  };
  const importSave=()=>{
    const clean=text.replace(/\s+/g,""); // strip spaces/newlines from copy-paste
    if(!clean){ notify(LANG==="tr"?"Önce bir kayıt kodu yapıştır.":"Paste a save code first."); return; }
    try{
      const obj=JSON.parse(dec(clean));
      if(!obj || typeof obj!=="object" || obj.gold===undefined){ notify(LANG==="tr"?"Bu geçerli bir kayda benzemiyor.":"That doesn't look like a valid save."); return; }
      obj.started=true; obj.pendingEvent=null; obj.deathAlert=null; obj.injuryAlert=null;
      if(!obj.market) obj.market=freshMarket();
      if(!obj.pendingChains) obj.pendingChains=[];
      setState(obj); notify(LANG==="tr"?"Kayıt yüklendi!":"Save loaded!"); onClose();
    }catch(e){ notify(LANG==="tr"?"Geçersiz kayıt kodu — tam kopyalandığından emin ol.":"Invalid save code — check it copied fully."); }
  };
  return (<Modal onClose={onClose} title={t("ui.save")}>
    <div style={{fontSize:12,color:T.inkDim,marginBottom:10}}>{LANG==="tr"?"Dışa Aktar loncanı bir koda çevirir. Geri yüklemek için bir kodu yapıştırıp Yükle'ye bas.":"Export copies your guild to a code. Paste a code and Load to restore."}</div>
    <div style={{display:"flex",gap:8,marginBottom:8}}>
      <GoldBtn onClick={exportSave} style={{flex:1}}>{LANG==="tr"?"Dışa Aktar":"Export"}</GoldBtn>
      <GoldBtn onClick={importSave} disabled={!text.trim()} style={{flex:1}}>{LANG==="tr"?"Yükle":"Load"}</GoldBtn>
    </div>
    <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={LANG==="tr"?"Kayıt kodu burada görünür / buraya yapıştır…":"Save code appears here / paste here…"}
      style={{width:"100%",height:120,background:"#0e0a07",border:`1px solid ${T.border}`,borderRadius:8,color:T.ink,
        padding:10,fontSize:11,fontFamily:"monospace",resize:"none"}}/>
    {text && <GhostBtn onClick={()=>{navigator.clipboard?.writeText(text);notify("Copied to clipboard.");}} style={{width:"100%",marginTop:8}}>📋 Copy code</GhostBtn>}
  </Modal>);
}
function LegendsModal({fallen,onClose}){
  return (<Modal title={`🕯️ ${t("ui.legends")}`} onClose={onClose}>
    <div style={{fontSize:12,color:T.parchment,fontStyle:"italic",lineHeight:1.5,marginBottom:16,textAlign:"center"}}>
      "Gone, but carved into the guild's memory. Each name a debt the living can never repay."</div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {fallen.map((f,i)=>{ const c=CLASSES[f.cls];
        return (<div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 13px",
          background:"linear-gradient(135deg,#221a12,#16100b)",border:`1px solid ${T.border}`,borderRadius:10}}>
          <div style={{fontSize:26,filter:"grayscale(.4) opacity(.85)",marginTop:2}}>{c?c.icon:"⚔️"}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14,color:T.parchment}}>{f.name}</div>
            <div style={{fontSize:11,color:T.inkDim}}>{rankName(f.rank)} · Lv {f.level} {clsName(f.cls)}{f.runs>=5?` · ${f.runs} ${t("legend.expeditions")}`:""}</div>
            <div style={{fontSize:11,color:T.red,marginTop:3}}>{t("legend.fellIn")} {regionName(f.region)} · {t("top.day")} {f.day}</div>
            {f.eulogy && <div style={{fontSize:11,color:"#c9a0b0",fontStyle:"italic",marginTop:4,lineHeight:1.4}}>{f.eulogy}</div>}
          </div>
          <div style={{fontSize:18,opacity:.6}}>🪦</div>
        </div>); })}
    </div>
  </Modal>);
}

function AchievementsModal({achieved,onClose}){
  const total=ACHIEVEMENTS.length;
  const got=ACHIEVEMENTS.filter(a=>achieved&&achieved[a.id]).length;
  return (<Modal title={`🏆 ${LANG==="tr"?"Başarımlar":"Achievements"} (${got}/${total})`} onClose={onClose}>
    <div style={{fontSize:12,color:T.inkDim,marginBottom:14,textAlign:"center"}}>
      {LANG==="tr"?"Loncanın hikâyesindeki kilometre taşları.":"Milestones in your guild's story."}</div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {ACHIEVEMENTS.map(a=>{ const done=achieved&&achieved[a.id];
        return (<div key={a.id} style={{display:"flex",gap:12,alignItems:"center",padding:"11px 13px",
          background:done?"linear-gradient(135deg,#2a2112,#1c140d)":"#161009",
          border:`1px solid ${done?T.gold:T.border}`,borderRadius:10,opacity:done?1:0.55}}>
          <div style={{fontSize:24,filter:done?"none":"grayscale(1) opacity(.6)"}}>{done?a.icon:"🔒"}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,color:done?T.gold:T.inkDim}}>{achName(a)}</div>
            <div style={{fontSize:11,color:T.inkDim}}>{achDesc(a)}</div>
          </div>
          {done && <div style={{fontSize:16,color:T.gold}}>✓</div>}
        </div>); })}
    </div>
  </Modal>);
}

function Modal({children,title,onClose}){ return (
  <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:60,display:"flex",
    alignItems:"flex-end",justifyContent:"center",padding:0}}>
    <div onClick={e=>e.stopPropagation()} style={{background:T.panel,border:`1px solid ${T.borderLit}`,borderRadius:"14px 14px 0 0",
      padding:18,width:"100%",maxWidth:760,maxHeight:"85vh",overflowY:"auto",animation:"fadeUp .25s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:16,fontWeight:700,color:T.gold}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.inkDim,fontSize:22,lineHeight:1}}>×</button>
      </div>{children}</div></div>); }

// ==================== §UI · ADVENTURERS / MACERACILAR ====================
function TraitChip({trait,good,onTap}){ return (
  <button onClick={onTap} style={{fontSize:10,padding:"2px 7px",borderRadius:10,border:`1px solid ${good?T.green:T.red}`,
    color:good?T.green:T.red,background:good?"rgba(111,174,111,.08)":"rgba(192,86,63,.08)",cursor:"pointer"}}>{good?"+":"–"} {traitName(trait.name)} ⓘ</button>); }

function AdvCard({a,children,onOpen}){
  const curRankIdx=a.rankIndex!=null?a.rankIndex:eligibleRankIndex(a.level);
  const rank=RANKS[curRankIdx]; const c=CLASSES[a.cls];
  const promotable=eligibleRankIndex(a.level)>curRankIdx;
  const xpNext=xpForLevel(a.level+1);
  const [tip,setTip]=useState(null);
  return (<Panel style={{marginBottom:10}}>
    <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <button onClick={onOpen} style={{fontSize:26,width:34,textAlign:"center",background:"none",border:"none",padding:0}}>{c.icon}</button>
        {c.rare && !c.unique && (()=>{ const RELMAP={holyArmor:"holy_armor",boneRelic:"bone_relic",shadowCloak:"shadow_cloak",beastHorn:"beast_horn",prayerBeads:"prayer_beads"};
          const icon = a.boon ? (ITEMS[RELMAP[a.boon]]||{}).icon : null;
          return (<div title={a.boon?boonLabel(a.boon):(LANG==="tr"?"Boş emanet yuvası":"Empty relic slot")}
            style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,
            border:`1px ${a.boon?"solid":"dashed"} ${a.boon?T.gold:T.border}`,background:a.boon?"rgba(224,162,60,.12)":"transparent",
            boxShadow:a.boon?"0 0 8px rgba(224,162,60,.4)":"none"}}>{a.boon?(icon||"⚜️"):""}</div>); })()}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <button onClick={onOpen} style={{display:"flex",justifyContent:"space-between",gap:8,width:"100%",background:"none",border:"none",padding:0,textAlign:"left"}}>
          <div style={{fontWeight:700,fontSize:14,color:T.ink}}>{a.name}</div>
          <div style={{fontSize:11,color:promotable?T.gold:rank.color,whiteSpace:"nowrap"}}>{promotable?"🎖️ ":""}{rankName(rank.name)} ›</div>
        </button>
        <div style={{fontSize:11,color:T.inkDim,marginBottom:5}}>Lv {a.level} {a.gender||"♂"} {clsName(a.cls)} {c.unique?<span style={{color:"#e0803c",fontWeight:700}}>★ {t("adv.legendary")}</span>:c.rare?<span style={{color:T.gold,fontWeight:700}}>★ {t("adv.rare")}</span>:""} · {roleName(c.role)} · {statusLabel(a)}</div>
        {a.boon && CLASS_BOONS[a.boon] && <div style={{fontSize:10,color:T.gold,fontWeight:700,marginBottom:4}}>⚜️ {boonLabel(a.boon)} — {boonDesc(a.boon)}</div>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
          <TraitChip trait={a.pos} good onTap={()=>setTip(tip==="p"?null:"p")}/>
          {a.pos2 && <TraitChip trait={a.pos2} good onTap={()=>setTip(tip==="p2"?null:"p2")}/>}
          {a.pos3 && <TraitChip trait={a.pos3} good onTap={()=>setTip(tip==="p3"?null:"p3")}/>}
          <TraitChip trait={a.neg} onTap={()=>setTip(tip==="n"?null:"n")}/>
        </div>
        {tip && <div style={{fontSize:11,color:T.parchment,background:"#0e0a07",border:`1px solid ${T.border}`,
          borderRadius:6,padding:"6px 9px",marginBottom:6}}>
          {tip==="p2"
            ? <><b style={{color:T.green}}>{traitName(a.pos2.name)}:</b> {traitDesc(a.pos2.name)}</>
            : tip==="p3"
            ? <><b style={{color:T.green}}>{traitName(a.pos3.name)}:</b> {traitDesc(a.pos3.name)}</>
            : <><b style={{color:tip==="p"?T.green:T.red}}>{tip==="p"?traitName(a.pos.name):traitName(a.neg.name)}:</b> {tip==="p"?traitDesc(a.pos.name):traitDesc(a.neg.name)}</>}</div>}
        {a.level<50 && <div style={{marginBottom:3}}><div style={{fontSize:9,color:T.inkFaint,marginBottom:2}}>XP {a.xp}/{xpNext}</div><Bar pct={a.xp/xpNext*100} color={T.blue} h={4}/></div>}
        <div><div style={{fontSize:9,color:T.inkFaint,margin:"3px 0 2px"}}>HP {a.hp}/{a.maxHp}{a.status==="injured"?" · 🩸 recovering":""}</div><Bar pct={a.hp/a.maxHp*100} color={T.red} h={4}/></div>
        {(a.fatigue||0)>0 && <div><div style={{fontSize:9,color:a.fatigue>=70?T.red:a.fatigue>=40?"#e0a23c":T.inkFaint,margin:"3px 0 2px"}}>
          Fatigue {Math.round(a.fatigue)}%{a.fatigue>=70?" · exhausted!":a.fatigue>=40?" · tiring":""}</div>
          <Bar pct={a.fatigue} color={a.fatigue>=70?T.red:a.fatigue>=40?"#e0a23c":T.inkDim} h={4}/></div>}
        {children}
      </div>
    </div>
  </Panel>);
}
function statusLabel(a){ if(a.status==="questing")return "⛏️ "+t("status.onExpedition"); if(a.status==="injured")return "🩸 "+t("status.injured"); if(a.grief)return "🕯️ "+t("status.grieving");
  const tk=a.task||"rest"; return tk==="rest"?"😴 "+t("status.resting"):tk==="train"?"🗡️ "+t("status.training"):tk==="assist"?"🔨 "+t("status.assisting"):tk==="patrol"?"🛡️ "+t("status.patrolling"):"💤 "+t("status.idle"); }

function StatRow({label,value,icon,note}){ return (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
    <span style={{fontSize:12,color:T.inkDim}}>{icon} {label}</span>
    <span style={{fontSize:13,fontWeight:700,color:T.ink}}>{value}{note&&<span style={{fontSize:10,color:T.inkFaint,fontWeight:400,marginLeft:5}}>{note}</span>}</span>
  </div>); }

function AdvDetailModal({a,rels,roster,setState,onClose,onDismiss}){
  const c=CLASSES[a.cls]; const rank=RANKS[a.rankIndex!=null?a.rankIndex:eligibleRankIndex(a.level)];
  const hpMult=(a.pos.mod.hpMult||1)*(a.neg.mod.hpMult||1);
  const [editName,setEditName]=useState(false);
  const [nm,setNm]=useState(a.name);
  const saveName=()=>{ const v=nm.trim(); if(v && setState){ setState(s=>({...s,adventurers:s.adventurers.map(x=>x.id===a.id?{...x,name:v}:x)})); } setEditName(false); };
  // gather this adventurer's relationships with others currently in the guild
  const bonds=(roster||[]).filter(o=>o.id!==a.id).map(o=>{
    const score=getRel(rels||{},a.id,o.id); return {o,score,rt:relType(score,a,o,rels,roster)};
  }).filter(b=>b.rt || Math.abs(b.score)>=8)
    .sort((x,y)=>Math.abs(y.score)-Math.abs(x.score));
  return (<Modal title={editName?t("adv.rename"):a.name} onClose={onClose}>
    {editName ? (
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input value={nm} onChange={e=>setNm(e.target.value)} maxLength={24} autoFocus
          onKeyDown={e=>{if(e.key==="Enter")saveName();}}
          style={{flex:1,minWidth:0,boxSizing:"border-box",background:"#0e0a07",border:`1px solid ${T.borderLit}`,borderRadius:8,color:T.gold,padding:"9px 11px",fontSize:14,fontFamily:font,fontWeight:700,outline:"none"}}/>
        <GoldBtn onClick={saveName} style={{padding:"8px 14px"}}>{t("adv.save")}</GoldBtn>
      </div>
    ) : (
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:38}}>{c.icon}</div>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700}}>Lv {a.level} {a.gender||""} {clsName(a.cls)}</div>
          <div style={{fontSize:12,color:rank.color}}>{rankName(rank.name)} · {roleName(c.role)}</div></div>
        {setState && <button onClick={()=>{setNm(a.name);setEditName(true);}} style={{background:"none",border:`1px solid ${T.border}`,color:T.inkDim,borderRadius:7,padding:"5px 9px",fontSize:11}}>✏️ {t("adv.rename")}</button>}
      </div>
    )}
    <div style={{fontSize:12,color:T.parchment,fontStyle:"italic",lineHeight:1.5,marginBottom:14,
      background:"#0e0a07",border:`1px solid ${T.border}`,borderRadius:8,padding:11}}>{clsDesc(a.cls)}</div>
    <SectionTitle>{t("adv.combatStats")}</SectionTitle>
    <div style={{marginBottom:14}}>
      <StatRow icon="❤️" label={t("stat.maxHp")} value={a.maxHp} note={hpMult!==1?`(${hpMult>1?"+":""}${Math.round((hpMult-1)*100)}% ${t("stat.fromTrait")})`:""}/>
      <StatRow icon="⚔️" label={t("stat.attack")} value={c.atk}/>
      <StatRow icon="🛡️" label={t("stat.defense")} value={c.def}/>
      <StatRow icon="💨" label={t("stat.speed")} value={c.spd} note={t("stat.questPace")}/>
    </div>
    <SectionTitle>{t("adv.classPerk")}</SectionTitle>
    <div style={{fontSize:12,color:T.green,marginBottom:14,background:"rgba(111,174,111,.08)",
      border:`1px solid ${T.green}`,borderRadius:8,padding:"8px 11px"}}>✦ {clsPerk(a.cls)} <span style={{color:T.inkDim}}>{t("adv.perkParty")}</span></div>
    <SectionTitle>{t("adv.traits")} {a.pos3?<span style={{color:T.gold,fontSize:10}}>★ {LANG==="tr"?"üç erdemle kutsanmış":"gifted with three virtues"}</span>:a.pos2 ? <span style={{color:T.gold,fontSize:10}}>★ {t("adv.twoVirtues")}</span>:null}</SectionTitle>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
      <div style={{fontSize:12,color:T.ink,background:"rgba(111,174,111,.08)",border:`1px solid ${T.green}`,borderRadius:8,padding:"8px 11px"}}>
        <b style={{color:T.green}}>+ {traitName(a.pos.name)}</b> — {traitDesc(a.pos.name)}</div>
      {a.pos2 && <div style={{fontSize:12,color:T.ink,background:"rgba(111,174,111,.08)",border:`1px solid ${T.green}`,borderRadius:8,padding:"8px 11px"}}>
        <b style={{color:T.green}}>+ {traitName(a.pos2.name)}</b> — {traitDesc(a.pos2.name)}</div>}
      {a.pos3 && <div style={{fontSize:12,color:T.ink,background:"rgba(111,174,111,.08)",border:`1px solid ${T.green}`,borderRadius:8,padding:"8px 11px"}}>
        <b style={{color:T.green}}>+ {traitName(a.pos3.name)}</b> — {traitDesc(a.pos3.name)}</div>}
      <div style={{fontSize:12,color:T.ink,background:"rgba(192,86,63,.08)",border:`1px solid ${T.red}`,borderRadius:8,padding:"8px 11px"}}>
        <b style={{color:T.red}}>– {traitName(a.neg.name)}</b> — {traitDesc(a.neg.name)}</div>
    </div>
    <SectionTitle sub={t("adv.relSub")}>{t("adv.relationships")}</SectionTitle>
    {bonds.length===0 ? (
      <div style={{fontSize:12,color:T.inkFaint,padding:"10px 0"}}>{t("adv.noBonds")} {t("adv.noBondsHint").replace("{name}", a.name.split(" ")[0])}</div>
    ) : (
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {bonds.map(({o,score,rt})=>{
          const label = rt? relTypeName(rt.type) : (score>0?relTypeName("Warming up"):relTypeName("Cooling off"));
          const icon = rt? rt.icon : (score>0?"·":"·");
          const col = rt? rt.color : T.inkDim;
          return (<div key={o.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",
            background:"#0e0a07",border:`1px solid ${T.border}`,borderRadius:8}}>
            <span style={{fontSize:16}}>{CLASSES[o.cls].icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700}}>{o.name}</div>
              <div style={{fontSize:10,color:col}}>{icon} {label}</div>
            </div>
            <div style={{width:54}}><Bar pct={(score+100)/2} color={score>=0?T.green:T.red} h={5}/></div>
          </div>);
        })}
      </div>
    )}
    {a.status==="injured" && <div style={{marginTop:14,fontSize:12,color:T.red,textAlign:"center"}}>🩸 {t("adv.recovering")}</div>}
    {a.grief && <div style={{marginTop:14,fontSize:12,color:"#e07a9c",textAlign:"center"}}>🕯️ {t("adv.grievingLong")}</div>}
    {onDismiss && <div style={{marginTop:18,paddingTop:14,borderTop:`1px solid ${T.border}`}}>
      <button onClick={onDismiss} style={{width:"100%",background:"none",border:`1px solid ${T.border}`,
        color:T.inkFaint,fontSize:11,padding:"9px",borderRadius:7,fontFamily:font}}>{t("adv.dismiss").replace("{name}", a.name)}</button>
    </div>}
  </Modal>);
}

function AdventurersView({state,setState,notify}){
  const tier=BUILDINGS.treasury.levels[state.buildings.treasury].tier;
  const cap=BUILDINGS.dormitory.levels[state.buildings.dormitory].capacity;
  const full=state.adventurers.length>=cap;
  const [detail,setDetail]=useState(null);
  const [confirmKick,setConfirmKick]=useState(null);
  const [sortBy,setSortBy]=useState("class");
  const hire=(r)=>{ if(state.gold<r.hireCost){notify(LANG==="tr"?"Yetersiz altın.":"Not enough gold.");return;} if(full){notify(LANG==="tr"?"Yatakhane dolu — yükselt.":"Dormitory full — upgrade it.");return;}
    setState(s=>({...s,gold:s.gold-r.hireCost,adventurers:[...s.adventurers,r],recruits:s.recruits.filter(x=>x.id!==r.id),
      log:[{t:s.elapsed,msg:LANG==="tr"?`${r.name} (${clsName(r.cls)}) işe alındı.`:`Recruited ${r.name} the ${clsName(r.cls)}.`},...s.log].slice(0,40)})); notify(LANG==="tr"?`${r.name} loncaya katıldı.`:`${r.name} joined the guild.`); };
  const refresh=()=>{ if(state.gold<20){notify(LANG==="tr"?"Adayları yenilemek 20A tutar.":"Refreshing recruits costs 20G.");return;}
    setState(s=>{ const ex=uniquesInPlay(s); const out=[];
      for(let i=0;i<3;i++){ const a=makeAdventurer(tier,null,s.renown,ex); if(CLASSES[a.cls].unique) ex.push(a.cls); out.push(a); }
      return {...s,gold:s.gold-20,recruits:out}; }); };
  const dismiss=(a)=>{ if(a.status!=="idle"){notify(LANG==="tr"?"Uzaktayken çıkarılamaz.":"Can't dismiss while they're away.");return;} setConfirmKick(a); };
  const doDismiss=(a)=>{ setState(s=>({...s,adventurers:s.adventurers.filter(x=>x.id!==a.id),
    log:[{t:s.elapsed,msg:LANG==="tr"?`${a.name} (${clsName(a.cls)}) loncadan ayrıldı.`:`${a.name} the ${clsName(a.cls)} left the guild.`},...s.log].slice(0,40)}));
    Audio.play("click"); notify(LANG==="tr"?`${a.name} loncadan ayrıldı.`:`${a.name} has left the guild.`); setConfirmKick(null); };
  const setTask=(a,task)=>{ setState(s=>({...s,adventurers:s.adventurers.map(x=>x.id===a.id?{...x,task}:x)})); Audio.play("click"); };
  const promote=(a)=>{
    const target=eligibleRankIndex(a.level);
    const cur=a.rankIndex!=null?a.rankIndex:0;
    if(target<=cur) return;
    const cost=promotionCost(cur+1);
    if(state.gold<cost){notify(LANG==="tr"?`Terfi ${cost}A tutar.`:`Promotion costs ${cost}G.`);return;}
    setState(s=>({...s,gold:s.gold-cost,
      adventurers:s.adventurers.map(x=>x.id===a.id?{...x,rankIndex:cur+1,
        maxHp:Math.floor(x.maxHp*1.12), hp:Math.floor(x.maxHp*1.12)}:x),
      log:[{t:s.elapsed,msg:LANG==="tr"?`🎖️ ${a.name}, ${rankName(cur+1)} rütbesine terfi etti! (+%12 can)`:`🎖️ ${a.name} promoted to ${rankName(cur+1)}! (+12% HP)`},...s.log].slice(0,40)}));
    notify(LANG==="tr"?`${a.name} artık ${rankName(cur+1)}!`:`${a.name} is now ${rankName(cur+1)}!`); Audio.play("promote");
  };
  // sort the roster for display (status: away/injured sink to bottom so idle actionable ones are on top)
  const classOrder=Object.keys(CLASSES);
  const sorted=[...state.adventurers].sort((a,b)=>{
    if(sortBy==="class"){ const d=classOrder.indexOf(a.cls)-classOrder.indexOf(b.cls); if(d!==0)return d; return b.level-a.level; }
    if(sortBy==="level") return b.level-a.level;
    if(sortBy==="status"){ const rank=x=>x.status==="idle"?0:x.status==="injured"?2:1; const d=rank(a)-rank(b); if(d!==0)return d; return b.level-a.level; }
    if(sortBy==="name") return a.name.localeCompare(b.name);
    return 0;
  });
  const sortOpts=[["class",t("sort.class")],["level",t("sort.level")],["status",t("sort.status")],["name",t("sort.name")]];
  return (<div style={{animation:"fadeUp .3s"}}>
    <SectionTitle sub={`${state.adventurers.length}/${cap} ${t("adv.housed")}`}>{t("adv.yours")}</SectionTitle>
    {state.adventurers.length>1 && <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
      <span style={{fontSize:10,color:T.inkFaint,textTransform:"uppercase",letterSpacing:1}}>{t("adv.sort")}</span>
      {sortOpts.map(([k,lbl])=>(
        <button key={k} onClick={()=>{setSortBy(k);Audio.play("click");}} style={{fontSize:11,padding:"5px 11px",borderRadius:6,fontFamily:font,
          background:sortBy===k?T.gold:"none",color:sortBy===k?"#211705":T.inkDim,
          border:`1px solid ${sortBy===k?T.gold:T.border}`,fontWeight:sortBy===k?700:400}}>{lbl}</button>
      ))}
    </div>}
    {state.adventurers.length===0 && <div style={{textAlign:"center",color:T.inkFaint,padding:"18px 20px",fontSize:13,
      background:T.panel,border:`1px dashed ${T.border}`,borderRadius:10,marginBottom:8}}>
      {t("adv.noneHired")}</div>}
    {sorted.map(a=>{ const canPromote=eligibleRankIndex(a.level)>(a.rankIndex!=null?a.rankIndex:0);
      const nextCost=promotionCost((a.rankIndex!=null?a.rankIndex:0)+1);
      return (<AdvCard key={a.id} a={a} onOpen={()=>setDetail(a)}>
      {a.status==="idle" && <div style={{marginTop:8}}>
        <div style={{fontSize:10,color:T.inkFaint,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{t("adv.whileAtHall")}</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["rest","😴 "+t("task.rest")],["train","🗡️ "+t("task.train")],["assist","🔨 "+t("task.assist")],["patrol","🛡️ "+t("task.patrol")]].map(([tk,lbl])=>(
            <button key={tk} onClick={()=>setTask(a,tk)} style={{flex:"1 1 21%",minWidth:62,fontSize:10,padding:"6px 4px",borderRadius:6,fontFamily:font,
              background:(a.task||"rest")===tk?T.gold:"none",color:(a.task||"rest")===tk?"#211705":T.inkDim,
              border:`1px solid ${(a.task||"rest")===tk?T.gold:T.border}`,fontWeight:(a.task||"rest")===tk?700:400}}>{lbl}</button>
          ))}
        </div>
        <div style={{fontSize:10,color:T.inkFaint,marginTop:5,lineHeight:1.45}}>
          {(a.task||"rest")==="rest"?"😴 "+t("task.restDesc"):
           (a.task||"rest")==="train"?"🗡️ "+t("task.trainDesc"):
           (a.task||"rest")==="assist"?"🔨 "+t("task.assistDesc"):
           "🛡️ "+t("task.patrolDesc")}
        </div>
      </div>}
      {canPromote && <GoldBtn onClick={()=>promote(a)} disabled={state.gold<nextCost} style={{marginTop:8,width:"100%"}}>
        🎖️ {t("adv.promoteTo")} {rankName((a.rankIndex!=null?a.rankIndex:0)+1)} — {nextCost}G</GoldBtn>}
    </AdvCard>); })}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"18px 0 8px"}}>
      <SectionTitle>{t("adv.recruitBoard")}</SectionTitle>
      <GhostBtn onClick={refresh} style={{padding:"5px 10px",fontSize:11}}>🔄 New (20G)</GhostBtn>
    </div>
    {(()=>{ const locked=Object.keys(CLASSES).filter(k=>CLASSES[k].rare && state.renown<CLASSES[k].minRenown)
        .sort((a,b)=>CLASSES[a].minRenown-CLASSES[b].minRenown);
      const unlocked=Object.keys(CLASSES).filter(k=>CLASSES[k].rare && state.renown>=CLASSES[k].minRenown);
      return (<div style={{fontSize:11,color:T.inkDim,marginBottom:10,padding:"8px 11px",borderRadius:8,background:T.panel2,border:`1px solid ${T.border}`}}>
        ★ <b style={{color:T.gold}}>Renown {state.renown}</b> — {unlocked.length>0?`rare classes can now appear: ${unlocked.map(k=>CLASSES[k].icon+" "+k).join(", ")}. `:""}
        {locked.length>0?`Next: ${CLASSES[locked[0]].icon} ${locked[0]} at ${CLASSES[locked[0]].minRenown} renown.`:(unlocked.length>0?"All rare classes unlocked!":"Earn renown by selling goods & succeeding to attract rare adventurers.")}
      </div>); })()}
    {state.recruits.map(r=>(<AdvCard key={r.id} a={r} onOpen={()=>setDetail(r)}>
      <GoldBtn onClick={()=>hire(r)} disabled={state.gold<r.hireCost||full} style={{marginTop:8,width:"100%"}}>
        {t("adv.hire")} — {r.hireCost}G {full?t("adv.full"):""}</GoldBtn>
    </AdvCard>))}
    {detail && <AdvDetailModal a={detail} rels={state.rels} roster={state.adventurers} setState={setState} onClose={()=>setDetail(null)}
      onDismiss={detail.status==="idle" ? ()=>{ setDetail(null); dismiss(detail); } : null}/>}
    {confirmKick && (
      <div onClick={()=>setConfirmKick(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:80,
        display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeUp .25s"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(135deg,#241c15,#16100b)",
          border:`1px solid ${T.red}`,borderRadius:14,padding:"24px 22px",maxWidth:340,width:"100%",textAlign:"center"}}>
          <div style={{fontSize:34,marginBottom:12}}>{CLASSES[confirmKick.cls].icon}</div>
          <div style={{fontSize:16,fontWeight:700,color:T.parchment,marginBottom:8}}>Dismiss {confirmKick.name}?</div>
          <div style={{fontSize:12,color:T.inkDim,lineHeight:1.5,marginBottom:20}}>
            They will leave the guild for good. This cannot be undone — their bonds and progress will be lost.</div>
          <div style={{display:"flex",gap:9}}>
            <GhostBtn onClick={()=>setConfirmKick(null)} style={{flex:1}}>{t("adv.keepThem")}</GhostBtn>
            <button onClick={()=>doDismiss(confirmKick)} style={{flex:1,background:T.red,color:"#fff",border:"none",
              borderRadius:9,padding:"11px",fontWeight:700,fontSize:13,fontFamily:font}}>✕ Dismiss</button>
          </div>
        </div>
      </div>
    )}
  </div>);
}

// ==================== §UI · QUESTS / GÖREVLER ====================
function QuestsView({state,setState,notify}){
  const tier=BUILDINGS.treasury.levels[state.buildings.treasury].tier;
  const slots=BUILDINGS.notice_board.levels[state.buildings.notice_board].questSlots;
  const [picking,setPicking]=useState(null);
  const available=REGIONS.filter(r=>r.tier<=tier);
  const locked=REGIONS.filter(r=>r.tier>tier);
  const idle=state.adventurers.filter(a=>a.status==="idle");

  const dispatch=(region,partyIds,repeat,bossId)=>{
    const speed=Math.min(...partyIds.map(id=>{const a=state.adventurers.find(x=>x.id===id);
      const spdBonus=1-(CLASSES[a.cls].spd-10)*0.012; // higher speed stat → shorter trips
      return posMul(a,"speedMult")*(a.neg.mod.speedMult||1)*Math.max(0.7,spdBonus);}));
    const dur=Math.round(region.duration*speed);
    const rep=bossId?1:Math.max(1,repeat||1); // bosses are one-shot, no auto-repeat
    setState(s=>({...s,
      adventurers:s.adventurers.map(a=>partyIds.includes(a.id)?{...a,status:"questing",questId:region.id}:a),
      quests:[...s.quests,{id:uid(),regionId:region.id,party:partyIds,startAt:s.elapsed,endAt:s.elapsed+dur,repeatLeft:rep-1,duration:dur,bossId:bossId||null}],
      lastParty:partyIds,
      log:[{t:s.elapsed,msg:bossId?(LANG==="tr"?`⚔️ ${partyIds.length} kişi ${regionName(region)} bölgesindeki güçlü bir düşmanı avlamaya gitti (~${fmtTime(dur)}).`:`⚔️ ${partyIds.length} set out to hunt a mighty foe in ${regionName(region)} (~${fmtTime(dur)}).`):(LANG==="tr"?`${partyIds.length} kişi ${regionName(region)} bölgesine yollandı${rep>1?` ×${rep}`:""} (~${fmtTime(dur)}${rep>1?" her biri":""}).`:`Sent ${partyIds.length} to ${regionName(region)}${rep>1?` ×${rep}`:""} (~${fmtTime(dur)}${rep>1?" each":""}).`)},...s.log].slice(0,40)}));
    setPicking(null); notify(bossId?(LANG==="tr"?`Boss avı başladı!`:`Boss hunt begins!`):(LANG==="tr"?`Sefer ${regionName(region)} bölgesine yollandı${rep>1?` (×${rep})`:""}.`:`Expedition dispatched to ${regionName(region)}${rep>1?` (×${rep})`:""}.`)); Audio.play("quest");
  };

  return (<div style={{animation:"fadeUp .3s"}}>
    <div style={{fontSize:11,color:T.inkDim,marginBottom:12,padding:"8px 11px",borderRadius:8,background:T.panel2,border:`1px solid ${T.border}`}}>
      🗺️ {t("quest.intro1")} <b style={{color:T.ink}}>{t("quest.introBold")}</b> {t("quest.intro2")}</div>
    {state.quests.length>0 && <><SectionTitle sub={`${state.quests.length}/${slots} ${t("quest.active")}`}>{t("quest.inProgress")}</SectionTitle>
      {state.quests.map(q=>{ const r=REGIONS.find(x=>x.id===q.regionId); const total=q.endAt-q.startAt; const pct=(state.elapsed-q.startAt)/total*100;
        return (<Panel key={q.id} style={{marginBottom:10}}>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:22}}>{r.icon}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:T.ink}}>{regionName(r)}</div>
              <div style={{fontSize:11,color:T.inkDim}}>{q.party.length} {t("quest.advUnit")} · <span style={{color:dangerColor(r.danger)}}>● {dangerName(r.danger)}</span>{q.repeatLeft>0?` · ↩️ ${q.repeatLeft} ${t("quest.more")}`:""}</div></div>
            <div style={{fontSize:12,color:T.gold,fontWeight:700}}>{fmtTime(q.endAt-state.elapsed)}</div>
          </div><Bar pct={pct} color={T.gold}/>
        </Panel>); })}
    </>}
    {(()=>{
      const unlocked=(state.bossUnlocked||{});
      const openBosses=BOSSES.filter(b=>unlocked[b.id] && REGIONS.find(r=>r.id===b.region && r.tier<=tier));
      if(!openBosses.length) return null;
      return (<><SectionTitle sub={LANG==="tr"?"güçlü düşmanlar açığa çıktı":"mighty foes revealed"}>{LANG==="tr"?"⚔️ Boss Avı":"⚔️ Boss Hunt"}</SectionTitle>
        {openBosses.map(b=>{ const r=REGIONS.find(x=>x.id===b.region); const epic=b.tier==="epic";
          return (<button key={b.id} onClick={()=>{ if(state.quests.length>=slots){notify(LANG==="tr"?"Tüm ilan tahtaları dolu — yükselt.":"All notice boards full — upgrade.");return;} if(idle.length===0){notify(LANG==="tr"?"Boşta maceracı yok.":"No idle adventurers.");return;} setPicking({__boss:b,region:r});}}
            style={{width:"100%",textAlign:"left",marginBottom:10,background:epic?"rgba(160,60,60,.18)":"rgba(120,90,40,.15)",border:`1px solid ${epic?T.red:T.gold}`,borderRadius:10,padding:13}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{fontSize:26}}>{b.icon}</div>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:epic?"#e88":T.gold}}>{bossName(b)}<span style={{fontSize:10,marginLeft:6,color:T.inkDim}}>{epic?(LANG==="tr"?"EPİK":"EPIC"):(LANG==="tr"?"MİNİ":"MINI")}</span></div>
                <div style={{fontSize:11,color:T.inkDim}}>{regionName(r)} · {LANG==="tr"?"güç":"power"} ~{b.power}</div>
                <div style={{fontSize:10,color:T.inkFaint,marginTop:2}}>{LANG==="tr"?"Ödül":"Reward"}: {b.reward.gold}A · ★{b.reward.renown}{b.reward.item?` · ${ITEMS[b.reward.item].icon}`:""}</div></div>
              <div style={{color:epic?T.red:T.gold,fontSize:18}}>⚔️</div>
            </div></button>); })}
      </>);
    })()}
    <SectionTitle sub={`${t("quest.tier")} ${tier} · ${idle.length} ${t("quest.idle")}`}>{t("quest.regions")}</SectionTitle>
    {available.map(r=>(<button key={r.id} onClick={()=>{ if(state.quests.length>=slots){notify(LANG==="tr"?"Tüm ilan tahtaları dolu — yükselt.":"All notice boards full — upgrade.");return;} if(idle.length===0){notify(LANG==="tr"?"Boşta maceracı yok.":"No idle adventurers.");return;} setPicking(r);}}
      style={{width:"100%",textAlign:"left",marginBottom:10,background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:13}}>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <div style={{fontSize:24}}>{r.icon}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:T.ink}}>{regionName(r)}</div>
          <div style={{fontSize:11,color:T.inkDim}}>~{fmtTime(r.duration)} · <span style={{color:dangerColor(r.danger)}}>● {dangerName(r.danger)}</span></div>
          <div style={{fontSize:10,color:T.inkFaint,marginTop:2}}>{t("quest.loot")} {r.loot.map(l=>ITEMS[l.item].icon).join(" ")}</div></div>
        <div style={{color:T.gold,fontSize:18}}>›</div>
      </div></button>))}
    {locked.map(r=>(<div key={r.id} style={{opacity:.4,marginBottom:10,background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,padding:13,
      display:"flex",gap:10,alignItems:"center"}}>
      <div style={{fontSize:24,filter:"grayscale(1)"}}>{r.icon}</div>
      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:T.ink}}>{regionName(r)}</div>
        <div style={{fontSize:11,color:T.inkDim}}>🔒 {t("quest.reachTier").replace("{n}", r.tier)}</div></div></div>))}
    {picking && <PartyPicker region={picking.__boss?picking.region:picking} boss={picking.__boss||null} idle={idle} lastParty={state.lastParty} rels={state.rels} tavernSucc={BUILDINGS.tavern.levels[state.buildings.tavern].successBonus||0} onClose={()=>setPicking(null)} onGo={(region,ids,rep)=>dispatch(region,ids,rep,picking.__boss?picking.__boss.id:null)}/>}
  </div>);
}
function PartyPicker({region,boss,idle,lastParty,rels,tavernSucc,onClose,onGo}){
  // auto-select last party members who are currently idle & available
  const preselect=(lastParty||[]).filter(id=>idle.some(a=>a.id===id));
  const [sel,setSel]=useState(preselect);
  const [repeat,setRepeat]=useState(1);
  const isSoloClass=(cls)=> cls==="LoneWolf" || cls==="GoblinSlayer";
  const toggle=(id)=>setSel(s=>{
    if(s.includes(id)) return s.filter(x=>x!==id);
    const cand=idle.find(a=>a.id===id);
    const isLone=cand && isSoloClass(cand.cls);
    const selHasLone=s.some(x=>{const a=idle.find(y=>y.id===x);return a&&isSoloClass(a.cls);});
    // solo heroes only fight alone: block adding anyone alongside, and block adding them to a non-empty party
    if(selHasLone){ return s; }
    if(isLone && s.length>0){ return s; }
    return [...s,id];
  });
  const selParty=idle.filter(a=>sel.includes(a.id));
  const est=estimateOutcome(selParty,region,tavernSucc,rels);
  const tTier = selParty.length>1 && rels ? teamTier(rels, selParty) : 0;
  // boss power estimate
  const bossPower = boss ? selParty.reduce((sum,a)=>sum + a.level*3 + CLASSES[a.cls].atk, 0) : 0;
  const bossWinPct = boss ? Math.round(Math.max(5,Math.min(95,(bossPower/boss.power-0.35)*100))) : 0;
  // relationship note for the selected party
  let relNote=null;
  if(selParty.length>1 && rels){
    let best=null,worst=null;
    for(let i=0;i<selParty.length;i++) for(let j=i+1;j<selParty.length;j++){
      const sc=getRel(rels,selParty[i].id,selParty[j].id);
      const rt=relType(sc,selParty[i],selParty[j]);
      if(rt){ if(sc>=30 && (!best||sc>best.sc)) best={a:selParty[i],b:selParty[j],sc,rt};
        if(sc<=-25 && (!worst||sc<worst.sc)) worst={a:selParty[i],b:selParty[j],sc,rt}; }
    }
    if(worst) relNote={txt:`${worst.rt.icon} ${worst.a.name.split(" ")[0]} & ${worst.b.name.split(" ")[0]}: ${relTypeName(worst.rt.type)} — ${t("pp.friction")}`,col:T.red};
    else if(best) relNote={txt:`${best.rt.icon} ${best.a.name.split(" ")[0]} & ${best.b.name.split(" ")[0]}: ${relTypeName(best.rt.type)} — ${t("pp.morale")}`,col:T.green};
  }
  return (<Modal title={boss?`${boss.icon} ${bossName(boss)}`:`${t("quest.dispatch")} — ${regionName(region)}`} onClose={onClose}>
    {boss && <div style={{marginBottom:10,padding:"9px 12px",borderRadius:9,background:boss.tier==="epic"?"rgba(192,86,63,.20)":"rgba(224,162,60,.15)",border:`1px solid ${boss.tier==="epic"?T.red:T.gold}`,textAlign:"center"}}>
      <div style={{fontSize:22}}>{boss.icon}</div>
      <div style={{fontSize:13,fontWeight:700,color:boss.tier==="epic"?"#e88":T.gold,letterSpacing:.5}}>{LANG==="tr"?"⚔️ BOSS AVI":"⚔️ BOSS HUNT"}</div>
      <div style={{fontSize:11,color:T.inkDim,marginTop:2}}>{bossName(boss)} · {regionName(region)}</div>
    </div>}
    <div style={{fontSize:12,color:T.inkDim,marginBottom:10}}>{boss?(LANG==="tr"?`Bu güçlü düşmanı alt etmek için yeterince güçlü bir kadro seç. Yenilgi ölümle sonuçlanabilir.`:`Pick a roster strong enough to bring this foe down. Defeat can be deadly.`):t("pp.intro")}</div>
    {boss && (
      <div style={{marginBottom:12,padding:"11px 13px",borderRadius:9,background:"rgba(160,60,60,.12)",border:`1px solid ${T.red}`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
          <span style={{fontSize:11,color:T.inkDim}}>{LANG==="tr"?"Ekip gücü / Boss gücü":"Party power / Boss power"}</span>
          <span style={{fontSize:13,fontWeight:700,color:bossPower>=boss.power?T.green:T.gold}}>{bossPower} / {boss.power}</span>
        </div>
        <Bar pct={Math.min(100,bossPower/boss.power*100)} color={bossPower>=boss.power?T.green:T.red} h={6}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:9}}>
          <span style={{fontSize:11,color:T.inkDim}}>{LANG==="tr"?"Tahmini zafer şansı":"Estimated win chance"}</span>
          <span style={{fontSize:13,fontWeight:700,color:outcomeColor(bossWinPct)}}>~{bossWinPct}%</span>
        </div>
        <div style={{fontSize:10,color:T.inkFaint,marginTop:8}}>{LANG==="tr"?`Ödül: ${boss.reward.gold}A · ★${boss.reward.renown} şöhret${boss.reward.item?` · 1× ${itemName(boss.reward.item)}`:""}`:`Reward: ${boss.reward.gold}G · ★${boss.reward.renown} renown${boss.reward.item?` · 1× ${itemName(boss.reward.item)}`:""}`}</div>
      </div>
    )}
    {/* live outcome estimate */}
    {!boss && (est ? (
      <div style={{marginBottom:12,padding:"11px 13px",borderRadius:9,background:"#0e0a07",border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
          <span style={{fontSize:11,color:T.inkDim}}>{t("pp.estSuccess")}</span>
          <span style={{fontSize:13,fontWeight:700,color:outcomeColor(est.success)}}>~{est.success}%</span>
        </div>
        <Bar pct={est.success} color={outcomeColor(est.success)} h={6}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:9}}>
          <span style={{fontSize:11,color:T.inkDim}}>{t("pp.injuryRisk")}</span>
          <span style={{fontSize:13,fontWeight:700,color:est.injury<=15?T.green:est.injury<=35?"#e0a23c":T.red}}>~{est.injury}%</span>
        </div>
        {est.death>0 && (
          <div style={{marginTop:10,padding:"8px 11px",borderRadius:8,background:"rgba(192,86,63,.12)",border:`1px solid ${T.red}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,color:T.red,fontWeight:700}}>💀 {t("pp.deathRisk")}</span>
              <span style={{fontSize:13,fontWeight:700,color:T.red}}>~{est.death}%</span>
            </div>
            <div style={{fontSize:10,color:T.inkDim,marginTop:4}}>{t("pp.deadly")}</div>
          </div>
        )}
        <div style={{fontSize:10,color:T.inkFaint,marginTop:8}}>
          {est.success>=75?t("pp.comfortable"):est.success>=55?t("pp.doable"):t("pp.risky")}
        </div>
        {relNote && <div style={{fontSize:11,color:relNote.col,marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`}}>{relNote.txt}</div>}
        {tTier>0 && <div style={{fontSize:11,color:T.gold,marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`,fontWeight:700}}>
          {TEAM_TIERS[tTier].icon} {teamTierName(tTier)} — {t("pp.teamBonus").replace("{p}", Math.round(TEAM_TIERS[tTier].bonus*100))}</div>}
      </div>
    ) : (
      <div style={{fontSize:11,marginBottom:12,padding:"9px 12px",borderRadius:8,background:"#0e0a07",border:`1px solid ${T.border}`,color:dangerColor(region.danger)}}>
        ● {dangerLabel(region.danger)} — {t("pp.selectToSee")}</div>
    ))}
    {preselect.length>0 && <div style={{fontSize:11,color:T.gold,marginBottom:10}}>↩️ {t("pp.preselected")}</div>}
    {idle.map(a=>{ const c=CLASSES[a.cls]; const on=sel.includes(a.id);
      const selHasLone=sel.some(x=>{const y=idle.find(z=>z.id===x);return y&&isSoloClass(y.cls);});
      const isLone=isSoloClass(a.cls);
      const locked = !on && ((selHasLone) || (isLone && sel.length>0));
      return (<button key={a.id} onClick={()=>toggle(a.id)} disabled={locked} style={{width:"100%",textAlign:"left",marginBottom:8,opacity:locked?0.4:1,
        background:on?T.panel2:T.panel,border:`1px solid ${on?T.gold:T.border}`,borderRadius:9,padding:11,display:"flex",gap:10,alignItems:"center"}}>
        <div style={{fontSize:20}}>{c.icon}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:T.ink}}>{a.name}{isLone?" 🐺":""}</div>
          <div style={{fontSize:10,color:T.inkDim}}>Lv {a.level} {clsName(a.cls)} · {roleName(c.role)} · <span style={{color:T.green}}>{isLone?(LANG==="tr"?"yalnız savaşır":"fights solo"):clsPerk(a.cls)}</span></div></div>
        <div style={{fontSize:18,color:on?T.gold:T.inkFaint}}>{locked?"🔒":on?"☑":"☐"}</div>
      </button>); })}
    {!boss && <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0 6px",padding:"10px 12px",background:T.panel2,borderRadius:9,border:`1px solid ${T.border}`}}>
      <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700}}>{t("pp.repeat")}</div>
        <div style={{fontSize:10,color:T.inkDim}}>{t("pp.repeatDesc")}</div></div>
      {[1,5,10].map(n=>(<button key={n} onClick={()=>setRepeat(n)} style={{minWidth:42,padding:"7px 0",borderRadius:7,
        border:`1px solid ${repeat===n?T.gold:T.border}`,background:repeat===n?T.panel:"transparent",
        color:repeat===n?T.gold:T.inkDim,fontWeight:700,fontSize:13}}>×{n}</button>))}
    </div>}
    <GoldBtn onClick={()=>onGo(region,sel,boss?1:repeat)} disabled={sel.length===0} style={{width:"100%",marginTop:6}}>
      {boss?(LANG==="tr"?"⚔️ Ava Çık":"⚔️ Hunt"):t("pp.send")} {sel.length>0?`${sel.length}`:""}{!boss&&repeat>1?` · ${t("pp.repeatX")} ×${repeat}`:""} ›</GoldBtn>
  </Modal>);
}

// ==================== §UI · CRAFT / ÜRETİM ====================
function CraftView({state,setState,notify}){
  const [detail,setDetail]=useState(null);
  const stationLevel=(st)=>state.buildings[st];
  const stationUnlocked=(st)=>{ const lv=BUILDINGS[st].levels[state.buildings[st]]; return !lv.locked; };
  const stationSlots=(st)=>BUILDINGS[st].levels[state.buildings[st]].slots||1;
  const stationBusy=(st)=>state.crafting.filter(c=>RECIPES.find(r=>r.id===c.recipeId).station===st).length;
  const canCraft=(r)=>r.in.every(i=>(state.inventory[i.item]||0)>=i.qty);
  const start=(r)=>{
    if(!stationUnlocked(r.station)){notify(LANG==="tr"?`Önce ${buildingName(r.station)} inşa et.`:`Build the ${buildingName(r.station)} first.`);return;}
    if(stationBusy(r.station)>=stationSlots(r.station)){notify(LANG==="tr"?`${buildingName(r.station)} meşgul — daha çok iş yuvası için yükselt.`:`${buildingName(r.station)} is busy — upgrade it for more job slots.`);return;}
    if(!canCraft(r)){notify(LANG==="tr"?"Eksik malzeme.":"Missing materials.");return;}
    const speed=BUILDINGS[r.station].levels[state.buildings[r.station]].speedMult;
    const dur=Math.round(r.time*speed);
    setState(s=>{ const inv={...s.inventory}; r.in.forEach(i=>inv[i.item]-=i.qty);
      return {...s,inventory:inv,crafting:[...s.crafting,{id:uid(),recipeId:r.id,startAt:s.elapsed,endAt:s.elapsed+dur}]}; });
    notify(LANG==="tr"?`${itemName(r.out)} üretiliyor…`:`Crafting ${itemName(r.out)}…`); Audio.play("craft");
  };
  // a recipe is visible only if it has no class requirement, OR you have that rare class in the guild
  const recipeVisible=(r)=> !r.classReq || state.adventurers.some(a=>a.cls===r.classReq);
  const byStation={tannery:[],weavery:[],kitchen:[],workshop:[]};
  RECIPES.forEach(r=>{ if(recipeVisible(r)) byStation[r.station].push(r); });
  // recipes you can make right now (station unlocked, has materials, slot free)
  const ready=RECIPES.filter(r=>recipeVisible(r)&&stationUnlocked(r.station)&&canCraft(r)&&stationBusy(r.station)<stationSlots(r.station));

  const RecipeRow=({r,compact})=>{ const unlocked=stationUnlocked(r.station); const ok=canCraft(r); const stationFree=stationBusy(r.station)<stationSlots(r.station);
    return (<Panel style={{marginBottom:8,opacity:unlocked?1:.45}}>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <button onClick={()=>setDetail(r)} style={{fontSize:22,background:"none",border:"none",padding:0,cursor:"pointer"}}>{ITEMS[r.out].icon}</button>
        <button onClick={()=>setDetail(r)} style={{flex:1,minWidth:0,background:"none",border:"none",padding:0,textAlign:"left",cursor:"pointer"}}>
          <div style={{fontWeight:700,fontSize:13,color:T.ink}}>{itemName(r.out)} {r.qty>1?`×${r.qty}`:""} <span style={{fontSize:10,color:T.inkFaint}}>ⓘ</span></div>
          <div style={{fontSize:10,color:T.inkDim,marginTop:2}}>
            {r.in.map((i,idx)=>(<span key={idx} style={{color:(state.inventory[i.item]||0)>=i.qty?T.inkDim:T.red}}>
              {ITEMS[i.item].icon}{i.qty} </span>))}
            · ⏱ {fmtTime(Math.round(r.time*(BUILDINGS[r.station].levels[state.buildings[r.station]].speedMult)))}
          </div>
          {r.boon
            ? <div style={{fontSize:10,color:T.gold,marginTop:1,fontWeight:700}}>⚜️ {clsName(r.classReq)} {LANG==="tr"?"emaneti":"relic"} · {boonDesc(r.boon)}</div>
            : <div style={{fontSize:10,color:T.goldDim,marginTop:1}}>{LANG==="tr"?"satış":"sells"} ~{ITEMS[r.out].value}{LANG==="tr"?"A":"G"}{ITEM_CAT[r.out]&&ITEM_CAT[r.out]!=="raw"?<span style={{color:T.inkFaint}}> · {MARKET_CATS[ITEM_CAT[r.out]].icon} {catName(ITEM_CAT[r.out])}</span>:""}{compact?` · ${BUILDINGS[r.station].icon}`:""}</div>}
        </button>
        <GoldBtn onClick={()=>start(r)} disabled={!unlocked||!ok||!stationFree} style={{padding:"7px 12px"}}>{LANG==="tr"?"Üret":"Craft"}</GoldBtn>
      </div>
    </Panel>); };

  return (<div style={{animation:"fadeUp .3s"}}>
    <div style={{fontSize:11,color:T.inkDim,marginBottom:12,padding:"8px 11px",borderRadius:8,background:T.panel2,border:`1px solid ${T.border}`}}>
      💰 Tap any recipe to see details. Your guild's craftsfolk turn the spoils your heroes bring home into goods to <b style={{color:T.gold}}>sell at the Market</b> — funding better gear, wages, and grander expeditions.</div>
    {ready.length>0 && <><SectionTitle sub={t("craft.readySub")}>✅ {t("craft.ready")}</SectionTitle>
      {ready.map(r=><RecipeRow key={"rdy_"+r.id} r={r} compact/>)}
      <div style={{height:6}}/></>}
    {state.crafting.length>0 && <><SectionTitle>{t("craft.bench")}</SectionTitle>
      {state.crafting.map(c=>{ const r=RECIPES.find(x=>x.id===c.recipeId); const total=c.endAt-c.startAt; const pct=(state.elapsed-c.startAt)/total*100;
        return (<Panel key={c.id} style={{marginBottom:10}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:20}}>{ITEMS[r.out].icon}</div>
            <div style={{flex:1,fontWeight:700,fontSize:13}}>{itemName(r.out)} ×{r.qty}</div>
            <div style={{color:T.gold,fontSize:12,fontWeight:700}}>{fmtTime(c.endAt-state.elapsed)}</div>
          </div><Bar pct={pct} color={T.gold}/>
        </Panel>); })}
    </>}
    {Object.entries(byStation).map(([st,recipes])=>{ const unlocked=stationUnlocked(st);
      const busy=stationBusy(st), slots=stationSlots(st);
      return (<div key={st} style={{marginBottom:18}}>
        <SectionTitle sub={unlocked?`Lv ${stationLevel(st)} · ${t("craft.jobs")} ${busy}/${slots} · ${t("craft.fasterHi")}`:t("craft.locked")}>
          {BUILDINGS[st].icon} {buildingName(st)}</SectionTitle>
        {recipes.map(r=><RecipeRow key={r.id} r={r}/>)}
      </div>); })}
    {detail && <RecipeDetailModal r={detail} state={state} onClose={()=>setDetail(null)}/>}
  </div>);
}
function RecipeDetailModal({r,state,onClose}){
  const out=ITEMS[r.out]; const st=BUILDINGS[r.station];
  const speed=st.levels[state.buildings[r.station]].speedMult;
  const inCost=r.in.reduce((a,i)=>a+ITEMS[i.item].value*i.qty,0);
  const revenue=out.value*r.qty; const margin=revenue-inCost;
  return (<Modal title={`${out.icon} ${itemName(r.out)}`} onClose={onClose}>
    <div style={{textAlign:"center",marginBottom:16}}>
      <div style={{fontSize:46,marginBottom:6}}>{out.icon}</div>
      <div style={{fontSize:16,fontWeight:700,color:T.parchment}}>{itemName(r.out)}{r.qty>1?` ×${r.qty}`:""}</div>
      <div style={{fontSize:12,color:T.gold}}>{t("craft.sellsEach").replace("{v}", out.value)}</div>
    </div>
    <SectionTitle>{t("craft.recipe")}</SectionTitle>
    <div style={{marginBottom:14}}>
      {r.in.map((i,idx)=>{ const have=state.inventory[i.item]||0;
        return (<div key={idx} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
          <span style={{fontSize:13,color:T.ink}}>{ITEMS[i.item].icon} {itemName(i.item)}</span>
          <span style={{fontSize:13,fontWeight:700,color:have>=i.qty?T.green:T.red}}>{have}/{i.qty}</span>
        </div>); })}
    </div>
    <SectionTitle>{t("craft.details")}</SectionTitle>
    <div style={{fontSize:12,color:T.inkDim,lineHeight:1.8}}>
      <div>⚒️ {t("craft.craftedAt")} <b style={{color:T.ink}}>{stationName(r.station)}</b></div>
      <div>⏱ {t("craft.takes")} <b style={{color:T.ink}}>{fmtTime(Math.round(r.time*speed))}</b> {t("craft.atLevel")}</div>
      <div>💰 {t("craft.matCost")} ~{inCost}G → {t("craft.sells")} {revenue}G <b style={{color:margin>0?T.green:T.red}}>(+{margin}G {t("craft.profit")})</b></div>
    </div>
  </Modal>);
}

// ==================== §UI · MARKET / PAZAR ====================
function MarketView({state,setState,notify}){
  const owned=Object.entries(state.inventory).filter(([k,v])=>v>0);
  const mkt=state.market||freshMarket();
  const sell=(item,qty)=>{ const have=state.inventory[item]||0; const n=Math.min(qty,have); if(n<=0)return;
    const cat=catOf(item); const price=unitPrice(item,mkt);
    const gain=price*n;
    setState(s=>{ const inv={...s.inventory}; inv[item]-=n; if(inv[item]<=0)delete inv[item];
      // selling floods the market: each unit nudges this category's price down a touch (raw prices are stable)
      const m={...(s.market||freshMarket())};
      if(cat!=="raw"){ const cur=(m[cat]&&m[cat].price)||1.0; m[cat]={price:Math.max(0.6, cur - n*0.008)}; }
      return {...s,gold:s.gold+gain,inventory:inv,market:m,renown:s.renown+Math.floor(gain/100),
        stats:{...(s.stats||{quests:0,crafted:0,sold:0,forged:0,maxParty:0}),sold:((s.stats&&s.stats.sold)||0)+1},
        log:[{t:s.elapsed,msg:LANG==="tr"?`${n}× ${itemName(item)} ${gain}A'ya satıldı.`:`Sold ${n}× ${itemName(item)} for ${gain}G.`},...s.log].slice(0,40)}; });
    notify(LANG==="tr"?`+${gain}A`:`+${gain}G`); Audio.play("sell");
  };
  const sellAll=()=>{ let gain=0; owned.forEach(([k,v])=>gain+=unitPrice(k,mkt)*v);
    if(gain<=0)return;
    setState(s=>{ const m={...(s.market||freshMarket())};
      // bulk dump depresses every category that was sold
      owned.forEach(([k,v])=>{ const cat=catOf(k); if(cat==="raw")return; const cur=(m[cat]&&m[cat].price)||1.0; m[cat]={price:Math.max(0.6,cur-v*0.008)}; });
      return {...s,gold:s.gold+gain,inventory:{},market:m,renown:s.renown+Math.floor(gain/100),
        log:[{t:s.elapsed,msg:LANG==="tr"?`Tüm stok ${gain}A'ya satıldı.`:`Sold entire stock for ${gain}G.`},...s.log].slice(0,40)}; }); notify(LANG==="tr"?`Her şey satıldı: +${gain}A`:`Sold everything: +${gain}G`); };
  const total=owned.reduce((a,[k,v])=>a+unitPrice(k,mkt)*v,0);
  return (<div style={{animation:"fadeUp .3s"}}>
    <Panel style={{marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:11,color:T.gold,letterSpacing:1.5,textTransform:"uppercase"}}>{LANG==="tr"?"Stok Değeri":"Stock Value"}</div>
        <div style={{fontSize:22,fontWeight:700,color:T.ink}}>{total.toLocaleString()}{t("top.goldUnit")}</div></div>
      <GoldBtn onClick={sellAll} disabled={total<=0}>{t("market.sellAll")}{total>0?` · ${total.toLocaleString()}${t("top.goldUnit")}`:""}</GoldBtn>
    </Panel>
    <SectionTitle sub={t("market.pricesSub")}>{t("market.pricesToday")}</SectionTitle>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
      {Object.entries(MARKET_CATS).filter(([cat])=>cat!=="raw").map(([cat,info])=>{ const p=(mkt[cat]&&mkt[cat].price)||1.0;
        const pct=Math.round(p*100); const hot=p>=1.15, cold=p<=0.85;
        return (<div key={cat} style={{flex:"1 1 30%",minWidth:96,background:T.panel,border:`1px solid ${hot?T.green:cold?T.red:T.border}`,
          borderRadius:8,padding:"7px 9px"}}>
          <div style={{fontSize:11,color:T.ink,fontWeight:700}}>{info.icon} {catName(cat)}</div>
          <div style={{fontSize:13,fontWeight:700,color:hot?T.green:cold?T.red:T.inkDim}}>
            {pct}% {hot?"▲":cold?"▼":""}</div>
        </div>); })}
    </div>
    <SectionTitle>{t("market.sellGoods")}</SectionTitle>
    {owned.length===0 && <div style={{textAlign:"center",color:T.inkFaint,padding:30,fontSize:13}}>{t("market.empty")}</div>}
    {["fin","mid","raw"].map(tg=>{ const grp=owned.filter(([k])=>ITEMS[k].tier===tg); if(!grp.length)return null;
      return (<div key={tg} style={{marginBottom:14}}>
        <div style={{fontSize:10,color:T.inkFaint,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>
          {tg==="fin"?t("tier.fin"):tg==="mid"?t("tier.mid"):t("tier.raw")}</div>
        {grp.map(([k,v])=>{ const price=unitPrice(k,mkt); const base=ITEMS[k].value; const up=price>base, down=price<base;
          return (<Panel key={k} style={{marginBottom:8}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{fontSize:20}}>{ITEMS[k].icon}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{itemName(k)}</div>
              <div style={{fontSize:11,color:T.inkDim}}>×{v} · <span style={{color:up?T.green:down?T.red:T.inkDim,fontWeight:700}}>{price}{t("top.goldUnit")}</span> {LANG==="tr"?"adet":"each"} {up?"▲":down?"▼":""}{catOf(k)!=="raw"?<span style={{color:T.inkFaint}}> · {MARKET_CATS[catOf(k)].icon} {catName(catOf(k))}</span>:""}</div></div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
              <GhostBtn onClick={()=>sell(k,1)} style={{padding:"7px 9px"}}>+1</GhostBtn>
              {v>=5 && <GhostBtn onClick={()=>sell(k,5)} style={{padding:"7px 9px"}}>+5</GhostBtn>}
              {v>=10 && <GhostBtn onClick={()=>sell(k,10)} style={{padding:"7px 9px"}}>+10</GhostBtn>}
              <GoldBtn onClick={()=>sell(k,v)} style={{padding:"7px 9px"}}>{LANG==="tr"?"Hepsi":"All"}</GoldBtn>
            </div>
          </div></Panel>); })}
      </div>); })}
  </div>);
}

// ==================== §UI · STORAGE / DEPO ====================
function StorageView({state}){
  const owned=Object.entries(state.inventory).filter(([k,v])=>v>0);
  const total=owned.reduce((a,[k,v])=>a+v,0);
  const value=owned.reduce((a,[k,v])=>a+ITEMS[k].value*v,0);
  const cap=BUILDINGS.warehouse.levels[state.buildings.warehouse].capacity;
  const pct=total/cap*100;
  const nearFull=pct>=85;
  return (<div style={{animation:"fadeUp .3s"}}>
    <Panel style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
        <div style={{fontSize:11,color:T.gold,textTransform:"uppercase",letterSpacing:1.5}}>🛢️ Warehouse</div>
        <div style={{fontSize:13,fontWeight:700,color:nearFull?T.red:T.ink}}>{total} / {cap}</div>
      </div>
      <Bar pct={pct} color={nearFull?T.red:T.gold} h={8}/>
      <div style={{fontSize:11,color:nearFull?T.red:T.inkDim,marginTop:6}}>
        {nearFull?(LANG==="tr"?"⚠️ Neredeyse dolu — seferler ganimet bırakabilir. İnşa sekmesinden yükselt.":"⚠️ Nearly full — expeditions may leave loot behind. Upgrade in the Build tab."):(LANG==="tr"?`Toplam stok değeri ${value.toLocaleString()}A`:`Total stock value ${value.toLocaleString()}G`)}</div>
    </Panel>
    <SectionTitle sub={t("store.roomSub")}>{t("store.room")}</SectionTitle>
    {owned.length===0 && <div style={{textAlign:"center",color:T.inkFaint,padding:30,fontSize:13}}>Empty. Loot from expeditions and crafted goods are stored here.</div>}
    {["raw","mid","fin"].map(tg=>{ const grp=owned.filter(([k])=>ITEMS[k].tier===tg); if(!grp.length)return null;
      return (<div key={tg} style={{marginBottom:14}}>
        <div style={{fontSize:10,color:T.inkFaint,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
          {tg==="raw"?"Raw Materials":tg==="mid"?"Refined Goods":"Finished Goods"}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(72px,1fr))",gap:8}}>
          {grp.map(([k,v])=>(<div key={k} style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 4px",textAlign:"center"}}>
            <div style={{fontSize:22}}>{ITEMS[k].icon}</div>
            <div style={{fontSize:10,color:T.ink,marginTop:3,lineHeight:1.2}}>{itemName(k)}</div>
            <div style={{fontSize:13,fontWeight:700,color:T.gold}}>×{v}</div>
          </div>))}
        </div>
      </div>); })}
  </div>);
}

// ==================== §UI · UPGRADES / İNŞA ====================
function UpgradesView({state,setState,notify}){
  const upgrade=(key)=>{ const b=BUILDINGS[key]; const cur=state.buildings[key]; const next=cur+1;
    if(next>=b.levels.length){notify(LANG==="tr"?"Zaten azami seviyede.":"Already at max level.");return;}
    const cost=b.levels[next].cost;
    if(state.gold<cost){notify(LANG==="tr"?"Yetersiz altın.":"Not enough gold.");return;}
    const rb=b.levels[next].renownBonus||0;
    setState(s=>({...s,gold:s.gold-cost,buildings:{...s.buildings,[key]:next},renown:(s.renown||0)+rb,
      log:[{t:s.elapsed,msg:rb>0?(LANG==="tr"?`${buildingName(key)} bir anıta dönüştü — loncanın şöhreti +${rb}!`:`${buildingName(key)} became a monument — guild renown +${rb}!`):(LANG==="tr"?`${buildingName(key)} Lv ${next} seviyesine yükseltildi.`:`Upgraded ${buildingName(key)} to Lv ${next}.`)},...s.log].slice(0,40)}));
    notify(rb>0?(LANG==="tr"?`Şöhret +${rb}!`:`Renown +${rb}!`):(LANG==="tr"?`${buildingName(key)} yükseltildi!`:`${buildingName(key)} upgraded!`));
  };
  return (<div style={{animation:"fadeUp .3s"}}>
    <SectionTitle sub={t("build.buildingsSub")}>{t("build.buildings")}</SectionTitle>
    {Object.entries(BUILDINGS).map(([key,b])=>{ const cur=state.buildings[key]; const next=cur+1;
      const maxed=next>=b.levels.length; const nextLv=maxed?null:b.levels[next]; const curLv=b.levels[cur];
      return (<Panel key={key} style={{marginBottom:10}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <div style={{fontSize:24}}>{b.icon}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div style={{fontWeight:700,fontSize:14,color:T.ink}}>{buildingName(key)}</div>
              <div style={{fontSize:11,color:T.gold}}>Lv {cur}{maxed?" · "+t("build.max"):""}</div>
            </div>
            <div style={{fontSize:11,color:T.inkDim,margin:"3px 0 8px"}}>{buildingDesc(key)}</div>
            <div style={{fontSize:10,color:T.inkFaint,marginBottom:8}}>{describeBuilding(key,curLv,nextLv)}</div>
            {!maxed && <GoldBtn onClick={()=>upgrade(key)} disabled={state.gold<nextLv.cost} style={{width:"100%"}}>
              {t("build.upgrade")} — {nextLv.cost.toLocaleString()}G</GoldBtn>}
          </div>
        </div>
      </Panel>); })}
  </div>);
}
function describeBuilding(key,cur,next){
  const fmt=(lv)=>{
    if(key==="dormitory")return LANG==="tr"?`kapasite ${lv.capacity}, kira ${lv.rentPerHead}A/kişi, dinlenme +${lv.restBonus||0}`:`cap ${lv.capacity}, rent ${lv.rentPerHead}G/head, rest +${lv.restBonus||0}`;
    if(key==="tavern")return LANG==="tr"?`yemek ${lv.foodPerHead}A/kişi, +%${Math.round(lv.successBonus*100)} başarı`:`food ${lv.foodPerHead}G/head, +${Math.round(lv.successBonus*100)}% success`;
    if(key==="notice_board")return LANG==="tr"?`${lv.questSlots} görev yuvası`:`${lv.questSlots} quest slots`;
    if(key==="treasury")return lv.renownBonus?(LANG==="tr"?`anıt · şöhret +${lv.renownBonus}`:`monument · renown +${lv.renownBonus}`):(LANG==="tr"?`lonca kademesi ${lv.tier}`:`guild tier ${lv.tier}`);
    if(key==="warehouse")return LANG==="tr"?`${lv.capacity} depo`:`${lv.capacity} storage`;
    if(lv.locked)return LANG==="tr"?"kilitli":"locked";
    return LANG==="tr"?`üretim hızı ×${lv.speedMult}, ${lv.slots||1} iş`:`craft speed ×${lv.speedMult}, ${lv.slots||1} job${(lv.slots||1)>1?"s":""}`;
  };
  return next?`${fmt(cur)}  →  ${fmt(next)}`:fmt(cur);
}
