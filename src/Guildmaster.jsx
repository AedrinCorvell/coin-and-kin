import React, { useState, useEffect, useRef, useCallback } from "react";
/* ============================================================================
   GUILDMASTER — "Of Coin and Kin"  ·  tek dosyalık kaynak
   ----------------------------------------------------------------------------
   İÇİNDEKİLER  (bir bölümü aramak için başlıktaki §etiketini ara: örn. "§DATA")
   ----------------------------------------------------------------------------
   §I18N          Dil sistemi, STR sözlüğü, t()  (~satır 36)
   §AUDIO         Tone.js müzik/ses motoru  (~satır 237)
   §DATA          Sınıflar, özellikler, bölgeler, eşyalar  (~satır 356)
   §I18N-DATA     İçerik çevirileri (TR_ITEM, TR_REGION, ...)  (~satır 586)
   §DATA-MARKET   Alıcı grupları & tüccar fiyatları  (~satır 780)
   §DATA-REQUESTS İstek Panosu, diyar haberleri  (~satır 829)
   §RENOWN        Şöhret unvanları, arma, lakap  (~satır 863)
   §HELPERS       Genel yardımcılar  (~satır 992)
   §LOGIC         İlişkiler, takım, maceracı üretimi, sonuç tahmini  (~satır 1066)
   §EVENTS        Küçük/büyük/efsanevi/zincir olaylar, emeklilik  (~satır 1220)
   §CHRONICLE     Kahraman günlüğü, seviye atlama, eğitmenler  (~satır 1582)
   §BOSSES        Bölge boss'ları  (~satır 1663)
   §CRISES        Diyar Krizleri (end game) & lonca efsaneleri  (~satır 1717)
   §ACHIEVE       Başarımlar  (~satır 1814)
   §THEME         Renk teması, font, SAVE_KEY  (~satır 1906)
   §TICK          Oyun döngüsü stepGame() + kapalıyken ilerleme catchUp()  (~satır 1925)
   §ROOT          Ana Guildmaster() bileşeni  (~satır 1922)
   §UI            Ekranlar: Intro, Salon, Maceracılar, Görevler, Krizler, Ticaret (İstek Panosu + Tüccarlar), Depo, Geliştirmeler  (~satır 2758)
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
  "tab.requests":  { en:"Trade",   tr:"Ticaret" },
  "tab.market":    { en:"Merchants",  tr:"Tüccarlar" },
  "tab.store":     { en:"Store",      tr:"Depo" },
  "tab.build":     { en:"Upgrades",   tr:"Geliştirmeler" },
  // ---- hall / dashboard ----
  "hall.adventurers": { en:"Adventurers", tr:"Maceracılar" },
  "hall.expeditions": { en:"Expeditions", tr:"Seferler" },
  "hall.storage":     { en:"Storage",     tr:"Depo" },
  "hall.itemsHeld":   { en:"items held",  tr:"eşya var" },
  "hall.idle":        { en:"idle",        tr:"boşta" },
  "hall.away":        { en:"away",        tr:"görevde" },
  "hall.tapDispatch": { en:"tap to dispatch", tr:"sefere yolla" },
  "hall.inProgress":  { en:"in progress",  tr:"devam ediyor" },
  "hall.ledger":      { en:"Guild Ledger", tr:"Lonca Defteri" },
  "tut.title":        { en:"Getting Started", tr:"Nereden Başlamalı" },
  "tut.done":         { en:"You've learned the ropes! Good luck, Guildmaster.", tr:"Temelleri öğrendin! Bol şans, Lonca Efendisi." },
  "tut.hire":         { en:"Hire your first adventurer", tr:"İlk maceracını işe al" },
  "tut.hireHow":      { en:"Open ⚔️ Adventurers → tap a recruit to hire them.", tr:"⚔️ Maceracılar'ı aç → bir adayı işe almak için dokun." },
  "tut.quest":        { en:"Send them on an expedition", tr:"Onları sefere yolla" },
  "tut.questHow":     { en:"Open 🗺️ Quests → pick a region → choose a party → dispatch.", tr:"🗺️ Görevler'i aç → bir bölge seç → ekip kur → yolla." },
  "tut.sell":         { en:"Sell loot to the Merchants", tr:"Ganimeti Tüccarlar'a sat" },
  "tut.sellHow":      { en:"Loot fills your storage. Open 📋 Trade → ⚖️ Merchants to turn it into gold.", tr:"Ganimet depona dolar. 📋 Ticaret → ⚖️ Tüccarlar'dan altına çevir." },
  "tut.upgrade":      { en:"Upgrade a building", tr:"Bir binayı yükselt" },
  "tut.upgradeHow":   { en:"Open 🏰 Upgrades → raise the Guild Charter to unlock new regions.", tr:"🏰 Geliştirmeler'i aç → yeni bölgeler için Lonca Ruhsatı'nı yükselt." },
  "tut.craft":        { en:"Fill a request", tr:"Bir isteği karşıla" },
  "tut.craftHow":     { en:"Open 📋 Trade → Request Board → deliver what a buyer asked for. Pays far better than merchants.", tr:"📋 Ticaret → İstek Panosu → bir alıcının istediği malı teslim et. Tüccardan çok daha iyi öder." },
  "tut.hide":         { en:"Hide guide", tr:"Rehberi gizle" },
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
  "step.craft.txt": { en:"Someone on the request board wants what you're carrying.", tr:"İstek panosunda elindeki mallara talip olan var." },
  "step.craft.cta": { en:"Look", tr:"Bak" },
  "step.sell.txt":  { en:"Sell surplus loot to the merchants for gold.", tr:"Fazla ganimeti tüccarlara satıp altına çevir." },
  "step.sell.cta":  { en:"Sell", tr:"Sat" },
  // ---- common buttons / labels ----
  "ui.settings":   { en:"Settings",      tr:"Ayarlar" },
  "ui.colorblind": { en:"Colorblind mode", tr:"Renk körü modu" },
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
  "adv.housed":       { en:"housed · tap a card for full stats", tr:"loncada · ayrıntılar için karta dokun" },
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
  "quest.reachTier":  { en:"Reach guild tier {n} (raise the Guild Charter)", tr:"Lonca kademesi {n}'e ulaş (Lonca Ruhsatı'nı yükselt)" },
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
  // ---- market view ----
  "market.sellAll":   { en:"Sell All", tr:"Hepsini Sat" },
  "market.pricesToday":{ en:"Buyers' Mood Today", tr:"Bugün Alıcıların Havası" },
  "market.pricesSub": { en:"Affects trophies and leftover goods — prices shift daily", tr:"Ganimet hatıraları ve eski mallar için geçerli — fiyatlar her gün oynar" },
  "market.sellGoods": { en:"Sell Goods", tr:"Mal Sat" },
  "market.empty":     { en:"Storeroom is empty. Send heroes on expeditions to gather goods.", tr:"Satacak bir şey yok. Önce kahramanlarını sefere yollayıp ganimet topla." },
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
  "task.patrol":      { en:"Patrol", tr:"Devriye" },
  "task.restDesc":    { en:"Recovers fatigue & slowly heals.", tr:"Yorgunluğu giderir ve yavaşça iyileşir." },
  "task.trainDesc":   { en:"Slowly gains XP — safe leveling, but tiring. Rests on their own when worn out, then returns.", tr:"Yavaşça TP kazanır — güvenli ama yorucu. Bitkin düşünce kendiliğinden dinlenir, sonra geri döner." },
  "task.patrolDesc":  { en:"Earns a trickle of gold & renown — but tiring. Rests on their own when worn out, then returns.", tr:"Azar azar altın ve şöhret kazandırır — ama yorucu. Bitkin düşünce kendiliğinden dinlenir, sonra geri döner." },
  "quest.dispatch":   { en:"Dispatch", tr:"Sefere Yolla" },
  "legend.expeditions":{ en:"expeditions", tr:"sefer" },
  "legend.fellIn":    { en:"Fell in", tr:"Düştüğü yer:" },
  "build.max":        { en:"MAX", tr:"AZAMİ" },
  "build.upgrade":    { en:"Upgrade", tr:"Yükselt" },
  "status.onExpedition":{ en:"On expedition", tr:"Seferde" },
  "status.injured":   { en:"Injured", tr:"Yaralı" },
  "status.grieving":  { en:"Grieving", tr:"Yas tutuyor" },
  "status.resting":   { en:"Resting", tr:"Dinleniyor" },
  "status.training":  { en:"Training", tr:"Antrenmanda" },
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
    // first: prefer the bundled copy, so audio works offline inside the app
    if(!window.Tone){
      try{
        const mod = await import("tone");
        window.Tone = mod.default || mod;
      }catch(e){ /* not bundled — fall back to the network copy below */ }
    }
    // then: fall back to the network copy for the browser preview
    if(!window.Tone){
      await new Promise((res)=>{
        const sc=document.createElement("script");
        sc.src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js";
        sc.onload=res; sc.onerror=res; document.head.appendChild(sc);
      });
    }
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
  Paladin: { hp: 140, atk: 16, def: 16, spd: 7, icon: "🛡️", role:"Holy Guardian", rare:true, minRenown:40,
    desc: "An elite, blessed warrior. Both shields the party and lifts its fighting spirit — the finest protector a guild can field.",
    perk:"−9% injury & +5% success", mod:{ partyInjury:-0.09, partySuccess:0.05 } },
  Necromancer: { hp: 85, atk: 24, def: 7, spd: 10, icon: "💀", role:"Dark Caster", rare:true, minRenown:90,
    desc: "Wields forbidden magic of devastating power. Greatly raises success, but the dead they raise sometimes carry off extra spoils.",
    perk:"+12% success & +8% loot", mod:{ partySuccess:0.12, partyLoot:0.08 } },
  Assassin: { hp: 88, atk: 22, def: 8, spd: 18, icon: "🥷", role:"Shadow Blade", rare:true, minRenown:65,
    desc: "Strikes from the dark and vanishes. Blistering speed brings the party home fast, and rich, hand-picked loot.",
    perk:"+15% loot & 10% faster", mod:{ partyLoot:0.15, speedMult:0.90 } },
  Beastmaster: { hp: 110, atk: 17, def: 11, spd: 13, icon: "🐺", role:"Wild Warden", rare:true, minRenown:140,
    desc: "Commands loyal beasts on the hunt. A rare all-rounder that boosts every facet of an expedition.",
    perk:"+6% success, loot & −4% injury", mod:{ partySuccess:0.06, partyLoot:0.06, partyInjury:-0.04 } },
  Monk: { hp: 90, atk: 15, def: 9, spd: 16, icon: "☯️", role:"Battle Healer", rare:true, minRenown:110,
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
  { name: "Tireless", desc: "Expeditions tire them 40% less", mod: { fatigueMult: 0.6 } },
  { name: "Sociable", desc: "Warms to housemates quickly", mod: { relDrift: 1 } },
];
const NEGATIVE_TRAITS = [
  { name: "Reckless", desc: "+15% injury risk", mod: { injuryChance: 0.15 } },
  { name: "Greedy", desc: "Wages +20%", mod: { wageMult: 1.20 } },
  { name: "Arrogant", desc: "-10% XP", mod: { xpMult: 0.90 } },
  { name: "Drunkard", desc: "Never pays the bar tab", mod: { foodMult: 0 } },
  { name: "Frail", desc: "-15% HP", mod: { hpMult: 0.85 } },
  { name: "Slow", desc: "Quests 12% slower", mod: { speedMult: 1.12 } },
  { name: "Cowardly", desc: "-10% danger success", mod: { dangerSuccess: -0.10 } },
  { name: "Clumsy", desc: "+7% injury risk", mod: { injuryChance: 0.07 } },
  { name: "Lazy", desc: "-7% XP", mod: { xpMult: 0.93 } },
  { name: "Sickly", desc: "-8% HP", mod: { hpMult: 0.92 } },
  { name: "Sluggish", desc: "Quests 6% slower", mod: { speedMult: 1.06 } },
  { name: "Glutton", desc: "Eats the pantry bare — pays half for board", mod: { foodMult: 0.5 } },
  { name: "Demanding", desc: "Wages +10%", mod: { wageMult: 1.10 } },
  { name: "Timid", desc: "-5% danger success", mod: { dangerSuccess: -0.05 } },
  { name: "Restless", desc: "Expeditions tire them 40% more", mod: { fatigueMult: 1.4 } },
  { name: "Hothead", desc: "Quarrels with housemates", mod: { relDrift: -1.5 } },
  { name: "Lightfingered", desc: "Coins sometimes go missing on payday", mod: { thief: true } },
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
  // ⚜️ class relics — earned from special requests when that rare class is in your guild; equipping grants a permanent boon
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
  "Frontline Tank":"Ön Saf", "Scout":"İzci", "Damage Dealer":"Yıkım Ustası", "Hunter":"Avcı", "Healer":"Şifacı",
  "Holy Guardian":"Kutsal Muhafız", "Dark Caster":"Kara Büyücü", "Shadow Blade":"Gölge Hançeri", "Beast Lord":"Canavar Efendisi",
  "Wild Warden":"Vahşi Muhafız", "Battle Healer":"Savaşçı Şifacı", "Lone Slayer":"Yalnız Katil", "Dark Falcon":"Kara Şahin", "Dragon-Blooded":"Ejderha Kanlı", "Goblin Bane":"Goblin Belası",
};
const TR_TRAIT = {
  Brave:"Cesur", Loyal:"Sadık", Genius:"Dâhi", Tough:"Dayanıklı", Lucky:"Şanslı", Swift:"Çevik",
  Charming:"Cazibeli", Hardy:"Sağlam", Studious:"Çalışkan", Nimble:"Atik", Scavenger:"Çöpçü",
  Frugal:"Tutumlu", Bold:"Atılgan", Cheerful:"Neşeli", Tireless:"Yorulmaz", Sociable:"Sosyal",
  Restless:"Huzursuz", Hothead:"Kavgacı", Lightfingered:"Eli Uzun",
  Reckless:"Pervasız", Greedy:"Açgözlü", Arrogant:"Kibirli", Drunkard:"Ayyaş", Frail:"Cılız", Slow:"Yavaş",
  Cowardly:"Korkak", Clumsy:"Sakar", Lazy:"Tembel", Sickly:"Hastalıklı", Sluggish:"Ağır", Glutton:"Obur",
  Demanding:"Talepkâr", Timid:"Ürkek",
  Restrained:"Dizginlenmiş", Unbound:"Zincirsiz", LoneWolfCurse:"Yalnız Kurt", Discordant:"Fesatçı", Cursed:"Lanetli", Obsessed:"Takıntılı", Vigilant:"Tetikte",
};
function itemName(id){ if(LANG==="tr" && TR_ITEM[id]) return TR_ITEM[id]; return (ITEMS[id]&&ITEMS[id].name)||id; }
function regionName(r){ const id=typeof r==="string"?r:(r&&r.id); if(LANG==="tr" && TR_REGION[id]) return TR_REGION[id]; if(typeof r==="string"){ const byName=REGIONS.find(x=>x.name===r); if(byName){ if(LANG==="tr" && TR_REGION[byName.id]) return TR_REGION[byName.id]; return byName.name; } } const reg=typeof r==="object"?r:REGIONS.find(x=>x.id===id); return (reg&&reg.name)||r||id; }
// where does an item come from? (for request hints) — boss reward > craftable > region loot
function itemSource(item){
  const regs=REGIONS.filter(r=>Array.isArray(r.loot)&&r.loot.some(l=>l.item===item));
  if(regs.length) return (LANG==="tr"?`${regs.map(r=>regionName(r)).slice(0,2).join(", ")} seferlerinden`:`from ${regs.map(r=>regionName(r)).slice(0,2).join(", ")}`);
  const boss=BOSSES.find(b=>b.reward&&b.reward.item===item);
  if(boss) return (LANG==="tr"?`${bossName(boss)} (boss) düşürür`:`dropped by ${bossName(boss)} (boss)`);
  return null;
}
function clsName(c){ if(LANG==="tr" && TR_CLASS[c]) return TR_CLASS[c]; return c; }
function roleName(rl){ if(LANG==="tr" && TR_ROLE[rl]) return TR_ROLE[rl]; return rl; }
const TRAIT_EN = { Restrained:"Restrained", Unbound:"Unbound", LoneWolfCurse:"Lone Wolf", Discordant:"Discordant", Cursed:"Cursed", Obsessed:"Obsessed", Vigilant:"Vigilant" };
const TRAIT_DESC_EN = { Restrained:"The dragon within is chained — danger no longer seeks him", Unbound:"The curse is broken — can now join a party", LoneWolfCurse:"Only takes expeditions solo", Discordant:"Sows discord among others", Cursed:"+10% injury risk — draws danger", Obsessed:"Cares only for goblins", Vigilant:"−8% injury risk" };
function traitName(n){ if(LANG==="tr" && TR_TRAIT[n]) return TR_TRAIT[n]; return TRAIT_EN[n]||n; }
const TR_BUILDING = {
  dormitory:"Yatakhane", tavern:"Meyhane",
  dorm_rooms:"Yeni Odalar", dorm_beds:"İyi Yataklar", dorm_comfort:"Döşenmiş Odalar",
  tav_meals:"Kaliteli Yemekler", tav_cellar:"Dolu Kiler", tav_bard:"Ozan Köşesi", dorm_bath:"Hamam",
  training:"Talim Alanı", train_dummies:"Talim Kuklaları", train_mentor:"Kıdemli Eğitmen",
  infirmary:"Şifahane", inf_ward:"Revir", inf_herbs:"Merhem Dolabı",
  stables:"Ahır", stable_horses:"Atlar", stable_carts:"Yük Arabaları", watch_tower:"Gözcü Kulesi",
  guild:"Lonca Yönetimi", warehouse:"Ambar", notice_board:"İlan Tahtası", treasury:"Lonca Ruhsatı",
  guild_accountant:"Muhasebeci", guild_herald:"Tellal", monuments:"Anıtlar",
};
function buildingName(id){ if(LANG==="tr" && TR_BUILDING[id]) return TR_BUILDING[id]; return (BUILDINGS[id]&&BUILDINGS[id].name)||(BUILDING_GROUPS[id]&&BUILDING_GROUPS[id].name)||id; }
const TR_BUILDING_DESC = {
  dormitory:"Maceracılar burada konaklar ve sana kira öder.",
  tavern:"Maceracılar karnını burada doyurur, parasını da sana bırakır.",
  dorm_rooms:"Daha çok oda, loncada daha çok maceracı barındırabilmek demek.",
  dorm_beds:"Dinlenen kahramanlar yorgunluğu çok daha çabuk atar.",
  dorm_comfort:"Döşeli, sıcak odalar için maceracılar daha yüksek kira öder.",
  tav_meals:"Tok karnına yola çıkanlar seferlerde daha başarılı olur.",
  tav_cellar:"İyi bira ve dolu bir kiler — maceracılar parasını senin tezgâhında harcar.",
  tav_bard:"Ateş başında türküler — birbirini seven kahramanlar daha çabuk kaynaşır (birbirine diş bileyenleri barıştıramaz).",
  dorm_bath:"Sıcak bir banyo — dinlenen kahramanların yaraları daha çabuk kapanır.",
  training:"Toy acemilerin pişkin kıdemlilere dönüştüğü yer.",
  train_dummies:"Daha çok kukla: aynı anda daha çok kişi talim yapar ve daha hızlı öğrenir.",
  train_mentor:"Yaşlı bir kurt akılda kalan dersler verir — her seferden daha fazla TP.",
  infirmary:"Yaralıları toparlar, ayağa kaldırır.",
  inf_ward:"Düzgün yatak ve sargı bezi — yaralılar daha çabuk iyileşir.",
  inf_herbs:"Yola merhem ve sargı — seferlerde daha az yaralanma.",
  stables:"Uzun yollar için at ve araba.",
  stable_horses:"Yürümek yerine at sırtında — seferler daha kısa sürer.",
  stable_carts:"Taşıyacak daha çok yer — eve daha çok ganimet döner.",
  watch_tower:"Daha çok nöbet yeri: aynı anda daha çok kişi devriye gezer, her biri biraz daha fazla kazanır.",
  warehouse:"Ganimetlerin durduğu yer. Ambar dolarsa seferden dönenler getirdiklerini bırakmak zorunda kalır.",
  notice_board:"Ne kadar çok ilan tahtası olursa, aynı anda o kadar çok sefer yürütebilirsin.",
  guild:"Bir loncayı ayakta tutan evrak, para ve itibar işleri.",
  treasury:"Lonca kademesini yükseltir; yeni bölgeleri ve daha iyi adayları açar.",
  guild_accountant:"Keskin bir kalem — maaşlara giden paradan kırpar.",
  guild_herald:"Loncanın adını meydanlarda duyurur — daha çok ve daha nadir aday gelir.",
  monuments:"Diyarın dört bir yanında loncanın şöhretini yayan görkemli eserler.",
};
function buildingDesc(id){ if(LANG==="tr" && TR_BUILDING_DESC[id]) return TR_BUILDING_DESC[id]; return (BUILDINGS[id]&&BUILDINGS[id].desc)||(BUILDING_GROUPS[id]&&BUILDING_GROUPS[id].desc)||""; }
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
  Tireless:"Seferlerde %40 daha az yorulur", Sociable:"Ev arkadaşlarına çabuk ısınır",
  Restless:"Seferlerde %40 daha çok yorulur", Hothead:"Ev arkadaşlarıyla didişir", Lightfingered:"Maaş gününde kasadan para eksilebilir",
  Reckless:"+%15 yaralanma riski", Greedy:"Maaş +%20", Arrogant:"−%10 TP", Drunkard:"Meyhane hesabını hiç ödemez",
  Frail:"−%15 can", Slow:"Görevler %12 daha yavaş", Cowardly:"−%10 tehlike başarısı", Clumsy:"+%7 yaralanma riski",
  Lazy:"−%7 TP", Sickly:"−%8 can", Sluggish:"Görevler %6 daha yavaş", Glutton:"Kileri boşaltır — pansiyonun yarısını öder",
  Demanding:"Maaş +%10", Timid:"−%5 tehlike başarısı",
  Restrained:"İçindeki ejder zincire vurulmuş — artık tehlikeyi çekmiyor", Unbound:"Laneti kırıldı — artık ekiplerle sefere çıkabilir", LoneWolfCurse:"Sadece yalnız sefere çıkar", Discordant:"Diğerlerinin arasını bozar", Cursed:"+%10 yaralanma riski — tehlikeyi çeker", Obsessed:"Sadece goblinleri umursar", Vigilant:"−%8 yaralanma riski",
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

// ⚜️ CLASS RELICS — earned via special requests on the board when a rare-class hero has no relic yet.
const RELIC_REQUESTS = [
  { cls:"Paladin",     boon:"holyArmor",   item:"holy_armor",   group:"church",    need:[{item:"yeti_fur",qty:2},{item:"silver_ore",qty:4},{item:"saints_finger",qty:1}] },
  { cls:"Monk",        boon:"prayerBeads", item:"prayer_beads", group:"church",    need:[{item:"crude_gem",qty:4},{item:"spirit_silk",qty:1},{item:"saints_finger",qty:1}] },
  { cls:"Necromancer", boon:"boneRelic",   item:"bone_relic",   group:"nobles",    need:[{item:"bone",qty:8},{item:"cursed_relic",qty:3},{item:"grimoire_page",qty:1}] },
  { cls:"Assassin",    boon:"shadowCloak", item:"shadow_cloak", group:"nobles",    need:[{item:"toxin_gland",qty:4},{item:"spirit_silk",qty:2},{item:"void_shard",qty:1}] },
  { cls:"Beastmaster", boon:"beastHorn",   item:"beast_horn",   group:"commoners", need:[{item:"yeti_fur",qty:3},{item:"dragon_scale",qty:1},{item:"warlord_skull",qty:1}] },
];

// permanent boons granted when a class relic is earned (applied to one hero of that class)
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

// ==================== §DATA-REQUESTS · İSTEK PANOSU ====================
// Every 3 days nobles, church and commoners each post 5 requests for materials.
// Filling one pays well above merchant price; each fill also raises that group's favor (+2% future pay, max +50%).
const REQ_GROUPS = ["nobles","church","commoners"];
const REQ_REFRESH_DAYS = 3;
const REQ_POOLS = {
  nobles:   ["crude_gem","silver_ore","gold_ore","frost_crystal","yeti_fur","wolf_pelt","dragon_scale","fire_essence","golden_fleece","giant_pearl","ancient_coin","spirit_silk","ember_honey","dragon_truffle","starfruit"],
  church:   ["herb","wood","bone","slime","toxin_gland","cursed_relic","silver_ore","frost_crystal","void_shard","spirit_silk","giant_pearl","ember_honey","starfruit"],
  commoners:["herb","wood","wolf_pelt","rat_tail","scrap_iron","slime","iron_ore","goblin_ear","bog_iron","bone","orc_tusk","steel_scrap","yeti_fur","toxin_gland","ember_honey","dragon_truffle"],
};
const REQ_MULT = { nobles:[1.9,2.3], church:[1.35,1.6], commoners:[1.5,1.8] };
// 🌍 realm happenings that colour a whole 3-day board
const OMENS = [
  { id:"famine",     mult:{commoners:1.6},             tr:"🌾 Kuzey köylerinde kıtlık var — Halk bu dönem çok daha cömert ödüyor.", en:"🌾 Famine in the northern villages — the Commoners pay far more this cycle." },
  { id:"wedding",    mult:{nobles:1.5},                tr:"💍 Bir dük kızını evlendiriyor — Soylular lükse para saçıyor.", en:"💍 A duke marries off his daughter — the Nobles are throwing coin at luxury." },
  { id:"rite",       mult:{church:1.6},                tr:"🕯️ Kilise büyük bir ayin hazırlıyor — istekleri için cömert davranıyor.", en:"🕯️ The Church prepares a great rite — and pays generously for it." },
  { id:"war",        mult:{commoners:1.3,nobles:1.3},  tr:"⚔️ Sınırda savaş davulları çalıyor — herkes erzak ve maden istifliyor.", en:"⚔️ War drums on the border — everyone is hoarding supplies and ore." },
  { id:"plague",     mult:{church:1.4,commoners:1.3},  tr:"🤒 Kasabada salgın var — şifacılar da halk da malzemeye muhtaç.", en:"🤒 Plague in town — healers and common folk alike need supplies." },
  { id:"tournament", mult:{nobles:1.4},                tr:"🏇 Başkentte büyük turnuva var — soylular gösteriş peşinde.", en:"🏇 A grand tournament in the capital — the Nobles want to show off." },
];
const TR_REQ = {
  nobles:{ desc:"Lüks ve nadir mallara en yüksek parayı öder." },
  church:{ desc:"Biraz az öder ama her teslimat loncana şöhret kazandırır." },
  commoners:{ desc:"Gündelik mallar — kolay bulunur, istikrarlı kazanç." },
};
const REQ_DESC_EN = {
  nobles:"Pays the most for luxuries and rare goods.",
  church:"Pays a little less, but every delivery earns your guild renown.",
  commoners:"Everyday goods — easy to find, steady income.",
};
function reqDesc(g){ return LANG==="tr" ? TR_REQ[g].desc : REQ_DESC_EN[g]; }
const favorMult = (f)=> 1 + Math.min(0.5, (f||0)*0.02);
function reqReward(r, favor, ti, lm){ return Math.round((r.base||0) * favorMult(favor) * (1+0.04*(ti||0)) * (lm||1)); }
function reqRenown(r, tier){ return r.group==="church" ? 1+((tier||0)>=3?1:0) : 0; }
// ==================== §RENOWN · ŞÖHRET UNVANLARI ====================
// Renown is lifetime fame (never lost by spending). Spending draws on renown − renownSpent.
const RENOWN_TITLES = [
  { min:0,   tr:"Adı Duyulmamış",     en:"Unheard Of" },
  { min:25,  tr:"Mahallede Bilinen",  en:"Locally Known" },
  { min:75,  tr:"Bölgede Tanınan",    en:"Known in the Region" },
  { min:150, tr:"Diyarda Söz Edilen", en:"Talk of the Realm" },
  { min:300, tr:"Krallığın Gözdesi",  en:"Favored of the Crown" },
  { min:500, tr:"Efsanevi",           en:"Legendary" },
];
function titleIndex(renown){ let i=0; RENOWN_TITLES.forEach((t,k)=>{ if((renown||0)>=t.min) i=k; }); return i; }
function titleName(i){ const t=RENOWN_TITLES[i]||RENOWN_TITLES[0]; return LANG==="tr"?t.tr:t.en; }
// storied trophies are the only merchant sales that spread your name
function trophyRenown(item){ return (ITEMS[item]&&ITEMS[item].tier==="raw"&&CUSTOMER_OF[item]) ? Math.max(1,Math.floor(ITEMS[item].value/60)) : 0; }
function spendable(s){ return Math.max(0,(s.renown||0)-(s.renownSpent||0)); }
const CRESTS = ["🏰","🦁","🐉","🦅","🐺","🌙","⚔️","🌹","🦉","🔥","🐗","⚓"];
const EPITHETS = [["Demir Yumruk","Iron Fist"],["Yorulmaz","the Tireless"],["Kara Kurt","the Black Wolf"],["Gümüş Dil","Silver-Tongue"],
  ["Ejder Avcısı","Dragonbane"],["Fırtına","the Storm"],["Gölge","the Shadow"],["Yaşlı Tilki","the Old Fox"],["Aslan Yürek","Lionheart"],
  ["Şanslı","the Lucky"],["Kanlı Kalkan","Bloodshield"],["Sessiz","the Silent"]];
function epithetText(i){ const e=EPITHETS[i]; return e ? (LANG==="tr"?e[0]:e[1]) : ""; }
function heroName(a){ if(a.storyTitle) return `${a.name} «${LANG==="tr"?a.storyTitle.tr:a.storyTitle.en}»`; return a.epithet!=null && EPITHETS[a.epithet] ? `${a.name} «${epithetText(a.epithet)}»` : a.name; }
// tier of the easiest region an item drops in (99 = nowhere)
function itemTier(item){ let t=99; REGIONS.forEach(r=>{ if((r.loot||[]).some(l=>l.item===item)) t=Math.min(t,r.tier); }); return t; }
function itemRegion(item){ let best=null; REGIONS.forEach(r=>{ if((r.loot||[]).some(l=>l.item===item) && (!best||r.tier<best.tier)) best=r; }); return best; }
function isRareLoot(item){ return REGIONS.some(r=>(r.loot||[]).some(l=>l.item===item && l.rare)); }
function genRequests(st, day, prev){
  const tier = BUILDINGS.treasury.levels[(st.buildings&&st.buildings.treasury)||0].tier;
  const shuffle=(a)=>{ const b=[...a]; for(let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; };
  const used=new Set(); const list=[];
  // groups with the fewest open options choose first, so each gets its own goods
  const order=[...REQ_GROUPS].sort((a,b)=>REQ_POOLS[a].filter(x=>itemTier(x)<=tier).length-REQ_POOLS[b].filter(x=>itemTier(x)<=tier).length);
  order.forEach(g=>{
    const pool=REQ_POOLS[g].filter(x=>itemTier(x)<99 && !CUSTOMER_OF[x]);
    const open=shuffle(pool.filter(x=>itemTier(x)<=tier && !isRareLoot(x)));
    const openRare=shuffle(pool.filter(x=>itemTier(x)<=tier && isRareLoot(x)));
    const locked=shuffle(pool.filter(x=>itemTier(x)>tier && itemTier(x)<=tier+2)); // a taste of what lies ahead
    const picks=[];
    const take=(arr,n,lk)=>{ for(const x of arr){ if(picks.length>=5||n<=0) break; if(used.has(x)) continue; used.add(x); picks.push({item:x,locked:lk}); n--; } };
    take(locked,2,true);
    if(Math.random()<0.4) take(openRare,1,false);
    take(open,5,false);
    take(openRare,5,false);
    take(locked,5,true);
    const [lo,hi]=REQ_MULT[g];
    picks.forEach(({item,locked:lk})=>{
      const v=ITEMS[item].value; const it=Math.min(itemTier(item),5);
      let qty;
      if(isRareLoot(item)) qty = 1 + (it>=3 && Math.random()<0.3 ? 1 : 0);
      else { const target=(30+25*Math.max(tier,it))*(0.7+Math.random()*0.7); qty=Math.max(2,Math.min(15,Math.round(target/v))); }
      const base=Math.round(v*qty*(lo+Math.random()*(hi-lo))*(lk?1.15:1));
      list.push({ id:uid(), group:g, need:[{item,qty}], base, done:false });
    });
  });
  // ⚜️ special relic requests for rare-class heroes who don't carry their relic yet
  RELIC_REQUESTS.forEach(rr=>{
    const wants=(st.adventurers||[]).some(a=>a.cls===rr.cls && !a.boon);
    const owned=((st.inventory||{})[rr.item]||0)>0;
    if(wants && !owned) list.push({ id:uid(), group:rr.group, need:rr.need.map(n=>({...n})), base:0, relic:rr.cls, done:false });
  });
  const favor = (prev&&prev.favor) ? {...prev.favor} : {nobles:0,church:0,commoners:0};
  // half the time, something is happening in the realm
  let omen=null;
  if(Math.random()<0.5){ const o=pick(OMENS); omen=o.id;
    list.forEach(r=>{ const m=o.mult[r.group]; if(m && !r.relic){ r.base=Math.round(r.base*m); r.boost=m; } }); }
  return { list, nextDay: day + REQ_REFRESH_DAYS, favor, bonusPaid:{}, omen };
}


const BUILDINGS = {
  // 🏰 Guild Management
  treasury:{ name:"Guild Charter", group:"guild", icon:"📜", desc:"Raises guild tier, unlocking new regions & better recruits.", levels:[
    {cost:0,tier:0},{cost:800,tier:1},{cost:2500,tier:2},{cost:6000,tier:3},{cost:14000,tier:4},{cost:30000,tier:5} ]},
  notice_board:{ name:"Notice Board", group:"guild", icon:"📌", desc:"More boards = more quests at once.", levels:[
    {cost:0,questSlots:2},{cost:600,questSlots:3},{cost:1800,questSlots:4},{cost:4500,questSlots:6} ]},
  warehouse:{ name:"Warehouse", group:"guild", icon:"🛢️", desc:"Storage space for loot. Expeditions can't store more once it's full.", levels:[
    {cost:0,capacity:40},{cost:350,capacity:80},{cost:1000,capacity:150},{cost:2800,capacity:280},{cost:7000,capacity:500} ]},
  guild_accountant:{ name:"Bookkeeper", group:"guild", icon:"🧮", desc:"A sharp quill trims what you pay out in wages.", levels:[
    {cost:0,wageMult:1},{cost:500,wageMult:0.95},{cost:1500,wageMult:0.9},{cost:4000,wageMult:0.85} ]},
  guild_herald:{ name:"Town Crier", group:"guild", icon:"📯", desc:"Spreads word of your guild — more candidates, and rarer ones.", levels:[
    {cost:0,recruitSlots:3,rareBoost:0},{cost:400,recruitSlots:4,rareBoost:15},{cost:1400,recruitSlots:4,rareBoost:30},{cost:4000,recruitSlots:5,rareBoost:50} ]},
  monuments:{ name:"Monuments", group:"guild", icon:"🗿", needTier:5, desc:"Grand works that spread your guild's fame across the realm.", levels:[
    {cost:0,renownBonus:0},{cost:60000,renownBonus:20},{cost:120000,renownBonus:50},{cost:250000,renownBonus:100} ]},
  // 🛏️ Dormitory — split into three separate upgrade lines
  dorm_rooms:{ name:"More Rooms", group:"dormitory", icon:"🚪", desc:"More rooms = more adventurers can live at the guild.", levels:[
    {cost:0,capacity:3},{cost:150,capacity:5},{cost:450,capacity:7},{cost:1200,capacity:10},{cost:3000,capacity:14},{cost:6500,capacity:20},{cost:13000,capacity:24} ]},
  dorm_beds:{ name:"Good Beds", group:"dormitory", icon:"🛏️", desc:"Resting heroes shake off fatigue much faster.", levels:[
    {cost:0,restBonus:0},{cost:90,restBonus:2},{cost:270,restBonus:4},{cost:720,restBonus:6},{cost:1800,restBonus:9},{cost:3900,restBonus:12},{cost:7800,restBonus:16} ]},
  dorm_comfort:{ name:"Furnished Rooms", group:"dormitory", icon:"🕯️", desc:"Warm, furnished rooms command higher rent.", levels:[
    {cost:0,rentPerHead:7},{cost:110,rentPerHead:11},{cost:320,rentPerHead:15},{cost:840,rentPerHead:24},{cost:2100,rentPerHead:40},{cost:4500,rentPerHead:55},{cost:9100,rentPerHead:72} ]},
  dorm_bath:{ name:"Bathhouse", group:"dormitory", icon:"🛁", desc:"A hot bath heals resting heroes faster.", levels:[
    {cost:0,healBonus:0},{cost:200,healBonus:0.01},{cost:600,healBonus:0.02},{cost:1600,healBonus:0.03},{cost:4000,healBonus:0.05} ]},
  // 🍺 Tavern
  tav_meals:{ name:"Quality Meals", group:"tavern", icon:"🍲", desc:"Well-fed heroes do better on expeditions.", levels:[
    {cost:0,successBonus:0},{cost:150,successBonus:0.03},{cost:450,successBonus:0.06},{cost:1200,successBonus:0.10},{cost:3100,successBonus:0.15} ]},
  tav_cellar:{ name:"Stocked Cellar", group:"tavern", icon:"🍺", desc:"Good ale keeps heroes spending at your bar.", levels:[
    {cost:0,foodPerHead:6},{cost:120,foodPerHead:10},{cost:380,foodPerHead:14},{cost:1000,foodPerHead:22},{cost:2600,foodPerHead:35} ]},
  tav_bard:{ name:"Bard's Corner", group:"tavern", icon:"🪕", desc:"Songs by the fire — heroes who like each other bond faster (it can't make enemies friends).", levels:[
    {cost:0,relBonus:0},{cost:180,relBonus:0.5},{cost:550,relBonus:1},{cost:1500,relBonus:1.5},{cost:3800,relBonus:2} ]},
  // 🎯 Training Yard
  train_dummies:{ name:"Training Dummies", group:"training", icon:"🎯", desc:"More dummies: more heroes can train at once, and they learn faster.", levels:[
    {cost:0,trainXp:3,trainSlots:2},{cost:150,trainXp:4,trainSlots:3},{cost:450,trainXp:5,trainSlots:4},{cost:1300,trainXp:7,trainSlots:5},{cost:3500,trainXp:9,trainSlots:6} ]},
  train_mentor:{ name:"Veteran Instructor", group:"training", icon:"🧔", desc:"An old hand teaches lessons that stick — more XP from every expedition.", levels:[
    {cost:0,xpBonus:0},{cost:400,xpBonus:0.05},{cost:1200,xpBonus:0.10},{cost:3200,xpBonus:0.15},{cost:8000,xpBonus:0.20} ]},
  // 🩹 Infirmary
  inf_ward:{ name:"Sick Ward", group:"infirmary", icon:"🩹", desc:"Proper beds and bandages — the injured are back on their feet sooner.", levels:[
    {cost:0,injuryMult:1},{cost:200,injuryMult:0.85},{cost:650,injuryMult:0.7},{cost:1800,injuryMult:0.55},{cost:4500,injuryMult:0.4} ]},
  inf_herbs:{ name:"Herb Cabinet", group:"infirmary", icon:"🌿", desc:"Salves packed for the road — fewer injuries on expeditions.", levels:[
    {cost:0,injuryCut:0},{cost:300,injuryCut:0.02},{cost:900,injuryCut:0.04},{cost:2500,injuryCut:0.06} ]},
  // 🐎 Stables
  stable_horses:{ name:"Horses", group:"stables", icon:"🐎", desc:"Riding beats walking — expeditions finish sooner.", levels:[
    {cost:0,speedMult:1},{cost:300,speedMult:0.95},{cost:900,speedMult:0.9},{cost:2400,speedMult:0.85},{cost:6000,speedMult:0.8} ]},
  stable_carts:{ name:"Pack Carts", group:"stables", icon:"🛒", desc:"More room to haul — more loot comes home.", levels:[
    {cost:0,lootBonus:0},{cost:250,lootBonus:0.05},{cost:800,lootBonus:0.10},{cost:2200,lootBonus:0.15},{cost:5500,lootBonus:0.20} ]},
  // 🗼 Watchtower
  watch_tower:{ name:"Watchtower", icon:"🗼", desc:"More watch posts: more heroes can patrol at once, and each earns a little more.", levels:[
    {cost:0,patrolGold:1,patrolSlots:2},{cost:200,patrolGold:1.4,patrolSlots:3},{cost:600,patrolGold:1.8,patrolSlots:4},{cost:1700,patrolGold:2.1,patrolSlots:5},{cost:4200,patrolGold:2.5,patrolSlots:6} ]},
};
const BUILDING_GROUPS = {
  guild:{ name:"Guild Management", icon:"🏰", desc:"The paperwork, coin and reputation that keep a guild running." },
  dormitory:{ name:"Dormitory", icon:"🛏️", desc:"Adventurers lodge here and pay you rent." },
  tavern:{ name:"Tavern", icon:"🍺", desc:"Adventurers eat and drink here — and leave their coin with you." },
  training:{ name:"Training Yard", icon:"🎯", desc:"Where green recruits become hardened veterans." },
  infirmary:{ name:"Infirmary", icon:"🩹", desc:"Patches up the wounded and keeps them on their feet." },
  stables:{ name:"Stables", icon:"🐎", desc:"Horses and carts for the long roads." },
};
// current level data of one upgrade line (safe for old/missing saves)
function bLv(b,key){ const L=BUILDINGS[key].levels; return L[Math.max(0,Math.min((b&&b[key])||0, L.length-1))]; }
const STARTING_GOLD = 650;
const SAVE_VERSION = 2; // bump when the save format changes; older saves are migrated on load

// ==================== §HELPERS · GENEL YARDIMCILAR ====================
const rint = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];
const uid = ()=>Math.random().toString(36).slice(2,9);
const rankForLevel = (lvl)=>{ let r=RANKS[0]; for(const rk of RANKS){ if(lvl>=rk.minLevel) r=rk; } return r; };
const xpForLevel = (lvl)=>Math.floor(14*Math.pow(lvl,1.25)); // seviye atlama 2 kat hızlı (eskiden 28)
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
const dangerColor = (d)=> d<=1?T.green : d<=2?"#b8c45b" : d<=3?T.gold : d<=4?"#d98a3c" : T.red;

// Estimate party success & injury for a region — must mirror the tick resolution formula.
// ==== ONE source of truth for expedition odds — used by the real dice roll AND the on-screen estimate ====
function partyContext(party, s){
  let partySuccess=0, partyLoot=0, partyInjury=0;
  party.forEach(a=>{ const m=CLASSES[a.cls].mod||{}; partySuccess+=m.partySuccess||0; partyLoot+=m.partyLoot||0; partyInjury+=m.partyInjury||0; });
  let relBonus=0;
  if(party.length>1){ let sum=0,pairs=0;
    for(let i=0;i<party.length;i++) for(let j=i+1;j<party.length;j++){ sum+=getRel(s.rels||{},party[i].id,party[j].id); pairs++; }
    relBonus = pairs? (sum/pairs)/100*0.08 : 0; // +8% if all adore each other, −8% if all hate
    const tt=teamTier(s.rels||{}, party); if(tt>0) relBonus += TEAM_TIERS[tt].bonus; } // veteran band
  const beastBonus = party.some(a=>a.boon==="beastHorn") ? 0.08 : 0; // ⚜️ Wild Horn
  const tavernSucc = (bLv(s.buildings,"tav_meals").successBonus||0) + legendMod(s).succ;
  return { partySuccess, partyLoot, partyInjury, relBonus, beastBonus, tavernSucc };
}
function memberOdds(a, party, region, ctx, s){
  const cs=CLASSES[a.cls];
  let succ = 0.65 + (a.level/100) + ctx.tavernSucc + ctx.partySuccess + ctx.relBonus + ctx.beastBonus;
  if(a.cls==="LoneWolf" && party.length===1) succ += 0.22; // the wolf is devastating alone
  if(a.cls==="GoblinSlayer" && party.length===1){ succ += 0.15; if(region.id==="goblin_hills") succ += 0.30; }
  succ += posMod(a,"dangerSuccess") + (a.neg.mod.dangerSuccess||0);
  succ += (cs.atk-12)*0.005 - region.danger*0.04;
  if(a.grief && (s.elapsed||0) < a.grief) succ -= 0.08; // grieving lowers focus
  if(a.fatigue>=70) succ -= 0.12; else if(a.fatigue>=40) succ -= 0.05; // exhaustion dulls performance
  succ += (a.bonusSucc||0) + (a.goblinMastery && region.id==="goblin_hills" ? 0.15 : 0); // earned through personal stories
  const ceil = region.danger>=5 ? 0.90 : region.danger>=3 ? 0.94 : 0.97; // deadly places stay risky
  succ = Math.max(0.2, Math.min(ceil, succ));
  const inj = Math.max(0.02, legendMod(s).injury - (bLv(s.buildings,"inf_herbs").injuryCut||0) + 0.12 + region.danger*0.05 + (a.neg.mod.injuryChance||0)
    + ctx.partyInjury - (cs.def-10)*0.004 - (a.boon==="holyArmor"?0.10:0) - (a.boon==="prayerBeads"?0.07:0) - (a.bonusInj||0));
  let dc=0; // on a failed + injured roll in dangerous places, injury may become death
  if(region.danger>=3){ dc=(region.danger-2)*0.035 + (a.neg.mod.injuryChance||0)*0.5; if(a.status==="injured") dc+=0.05; dc+=ctx.partyInjury*0.3; dc=Math.max(0,Math.min(0.30,dc)); }
  return { succ, inj, dc };
}
function estimateOutcome(party, region, s){
  if(!party.length) return null;
  const ctx=partyContext(party, s);
  let succSum=0, pNoInj=1, pNoDeath=1;
  party.forEach(a=>{ const o=memberOdds(a,party,region,ctx,s); succSum+=o.succ; const pInj=(1-o.succ)*o.inj; pNoInj*=1-pInj;
    pNoDeath*=1-pInj*(a.boon==="boneRelic"?0:o.dc); });
  return { success:Math.round(succSum/party.length*100), injury:Math.round((1-pNoInj)*100), death:Math.round((1-pNoDeath)*100), relBonus:ctx.relBonus };
}
const outcomeColor=(pct)=> pct>=75?T.green : pct>=55?T.gold : T.red;

// ==================== §LOGIC · İLİŞKİLER & OYUN MANTIĞI ====================
// Stored in state.rels keyed by sorted pair "idA|idB" → { score:-100..100, met:elapsed }
const relKey=(a,b)=>[a,b].sort().join("|");
function getRel(rels,a,b){ return rels[relKey(a,b)]?.score||0; }
const REL_SPEED = 1.6; // ilişkilerin organik (sefer + salon) artış/düşüş hızı çarpanı
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
        if(hasOtherRomance(a,b)||hasOtherRomance(b,a)) return {type:"Close Friend", icon:"🤝", color:T.green};
      }
      return {type:"Romance", icon:"💞", color:"#e07a9c"};
    }
    return {type:"Close Friend", icon:"🤝", color:T.green};
  }
  if(score>=30) return {type:"Friend", icon:"😊", color:T.green};
  if(score<=-60) return {type:"Bitter Rival", icon:"💢", color:T.red};
  if(score<=-25) return {type:"Rival", icon:"😠", color:"#d98a3c"};
  // mentorship: big level gap + positive-ish
  if(score>=10 && Math.abs(a.level-b.level)>=12){
    const mentor=a.level>b.level?a:b, prot=a.level>b.level?b:a;
    return {type:"Mentor", icon:"🎓", color:"#5b9bd5", mentor:mentor.id, protege:prot.id};
  }
  return null; // neutral / acquaintance
}
// Trait compatibility: clashing traits drift apart, complementary drift together
// 🧪 hidden chemistry between two people: fixed for the pair, from −1 (grate on each other) to +1 (instant click)
function chemistry(aId,bId){ const k=aId<bId?aId+"|"+bId:bId+"|"+aId; let h=2166136261; for(let i=0;i<k.length;i++){ h^=k.charCodeAt(i); h=Math.imul(h,16777619); }
  const u=((h>>>0)%10000)/10000; return Math.max(-1,Math.min(1,(u-0.42)*2.2)); } // slightly more clicks than clashes
function passiveDrift(a,b){
  let d=0.04 + chemistry(a.id,b.id)*0.35; // living together: those who click warm up, those who don't start to grate
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
// hiring gets steeply pricier with experience: a seasoned hero is never cheap to replace
function hireCostFor(level, rare){ return Math.round((30 + level*10) * Math.pow(1.09, level) * (rare?2:1) / 5) * 5; }
function makeAdventurer(tier, forceClass, renown=0, exclude, noVeteran){
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
      hireCost: Math.max(3000, Math.round(hireCostFor(level,true)*0.8)), wage: 20 + level*3 };
  }
  const pos = pick(POSITIVE_TRAITS);
  const neg = pick(NEGATIVE_TRAITS);
  // rare classes are gifted: they get a SECOND positive trait (different from the first)
  let pos2=null;
  if(base.rare){ do{ pos2=pick(POSITIVE_TRAITS); } while(pos2.name===pos.name); }
  // the board mostly brings greenhorns; now and then a seasoned mercenary turns up (expensive!)
  const veteran = !noVeteran && tier>=1 && Math.random() < 0.10 + tier*0.02; // no mercenaries on the founding board
  const bonus = base.rare ? rint(4,10) : 0;
  const level = Math.min(48, veteran ? 12 + tier*5 + rint(0,6) + bonus : 1 + rint(0, tier*2) + bonus);
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
    veteran: veteran || undefined,
    hireCost: hireCostFor(level, base.rare), wage: 3 + level*2 + (base.rare?4:0) };
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
    return { restAll:15, msg: LANG==="tr"?`🎵 Gezgin bir ozan bu gece loncada keyifleri yükseltti. Evdekilerin yorgunluğu azaldı.`:`🎵 A wandering bard lifted spirits at the hall tonight. Those at home feel rested.` }; } },
  { id:"lost_purse", weight:7, when:s=>true, apply:(s)=>{ const g=rint(10,35);
    return { gold:-g, msg: LANG==="tr"?`💸 Dikkatsiz bir kâtip ${g}A'yı kaybetti. Gitti.`:`💸 A careless clerk misplaced ${g}G. It is gone.` }; } },
  { id:"market_demand", weight:9, when:s=>!!(s.requests&&s.requests.list&&s.requests.list.some(r=>!r.done&&!r.relic)), apply:(s)=>{
    const groups=[...new Set(s.requests.list.filter(r=>!r.done&&!r.relic).map(r=>r.group))]; const g=pick(groups);
    const flavor= LANG==="tr"?{nobles:`👑 Soylu bir düğün yaklaşıyor — Soylular açık isteklerine %25 fazla ödeyecek.`,
      church:`⛪ Kutsal bir bayram yaklaşıyor — Kilise açık isteklerine %25 fazla ödeyecek.`,
      commoners:`🏘️ Kasabaya panayır kuruldu — Halk açık isteklerine %25 fazla ödeyecek.`}:{nobles:`👑 A noble wedding approaches — the Nobles will pay 25% more on open requests.`,
      church:`⛪ A holy feast draws near — the Church will pay 25% more on open requests.`,
      commoners:`🏘️ A fair comes to town — the Commoners will pay 25% more on open requests.`};
    return { reqBoost:{group:g,mult:1.25}, msg:flavor[g] }; } },
  { id:"market_glut", weight:6, when:s=>!!(s.requests&&s.requests.list&&s.requests.list.some(r=>!r.done&&!r.relic)), apply:(s)=>{
    const groups=[...new Set(s.requests.list.filter(r=>!r.done&&!r.relic).map(r=>r.group))]; const g=pick(groups);
    const flavor= LANG==="tr"?{nobles:`👑 Soylular bu mevsim kese ağzını sıkıyor — açık isteklerinin ödülü %15 düştü.`,
      church:`⛪ Kilise'nin kasası dibe vurdu — açık isteklerinin ödülü %15 düştü.`,
      commoners:`🏘️ Halk için çetin bir mevsim — açık isteklerinin ödülü %15 düştü.`}:{nobles:`👑 The Nobles tighten their purses — their open requests pay 15% less.`,
      church:`⛪ The Church's coffers run low — their open requests pay 15% less.`,
      commoners:`🏘️ A hard season for the Commoners — their open requests pay 15% less.`};
    return { reqBoost:{group:g,mult:0.85}, msg:flavor[g] }; } },
  { id:"stray_recruit", weight:5, when:s=>true, apply:(s)=>{
    return { msg: LANG==="tr"?`🚪 Bir yolcu loncayı sordu ve yoluna gitti. Salonunun namı yayılıyor.`:`🚪 A traveler asked about the guild and moved on. Word of your hall spreads.`, renown:1 }; } },
  { id:"rats", weight:6, when:s=>rsum(s.inventory)>5, apply:(s)=>{
    const owned=Object.keys(s.inventory).filter(k=>s.inventory[k]>0); const it=pick(owned);
    const lost=Math.min(s.inventory[it], rint(1,3));
    return { take:{item:it,qty:lost}, msg: LANG==="tr"?`🐀 Fareler depoya girdi — ${lost}× ${itemName(it)} kayboldu.`:`🐀 Rats got into the storeroom — lost ${lost}× ${itemName(it)}.` }; } },
  { id:"fair_weather", weight:7, when:s=>s.quests.length>0, apply:(s)=>{
    return { hasten:20, msg: LANG==="tr"?`☀️ Yollarda hava güzel — yoldaki ekipler 20 saniye erken dönecek.`:`☀️ Fair weather on the roads — parties on the road will return 20s early.` }; } },
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
    id:"retirement", weight:9, when:s=>s.adventurers.some(a=>retireEligible(a,s.day)),
    build:(s)=>{ const a=s.adventurers.filter(x=>retireEligible(x,s.day)).sort((x,y)=>y.level-x.level)[0];
      const full=(s.mentors||[]).length>=3; const tales=(a.chronicle||[]).length;
      const ren=5+Math.floor(a.level/5);
      const ch=[];
      if(!full) ch.push({ label:LANG==="tr"?"Eğitmen olarak kalsın":"Keep them on as a trainer", detail:LANG==="tr"?`Seferlere çıkmaz; talime +2 TP, seferlere +%5 TP. Yarım maaş alır.`:`No more expeditions; +2 training XP, +5% expedition XP. Draws half wages.`,
        resolve:(s)=>({ retire:{id:a.id,mode:"mentor"}, msg:LANG==="tr"?`🎓 ${a.name} kılıcını astı ve artık gençleri yetiştiriyor.`:`🎓 ${a.name} hung up the sword and now trains the young.` }) });
      ch.push({ label:LANG==="tr"?"Onurlu bir veda":"An honorable farewell", detail:LANG==="tr"?`+${ren} şöhret · Efsaneler Salonu'nda anılır`:`+${ren} renown · remembered in the Hall of Legends`,
        resolve:(s)=>({ retire:{id:a.id,mode:"farewell"}, renown:ren, msg:LANG==="tr"?`🏡 ${a.name} için bütün lonca kadeh kaldırdı. Emekliliği hak etmişti.`:`🏡 The whole guild raised a cup to ${a.name}. A rest well earned.` }) });
      ch.push({ label:LANG==="tr"?"Biraz daha kal":"Stay a little longer", detail:LANG==="tr"?"Kabul eder — ama bir süre sonra yine sorar":"They'll agree — but they'll ask again",
        resolve:(s)=>({ stay:a.id, msg:LANG==="tr"?`⚔️ ${a.name} iç çekti ama bir süre daha kalmayı kabul etti.`:`⚔️ ${a.name} sighed, but agreed to stay a while longer.` }) });
      return { title:LANG==="tr"?"Yorgun Bir Kılıç":"A Weary Blade", icon:"🏡", _a:a.id,
        text:LANG==="tr"?`${a.name} (Lv ${a.level} ${clsName(a.cls)}) ${a.runs||0} seferden sonra bir akşam yanına geliyor. "Dizlerim eskisi gibi değil, Lonca Efendisi. Belki artık bırakma zamanıdır."${tales>3?" Günlüğünde anlatacak çok hikâyesi var.":""}`
          :`${a.name} (Lv ${a.level} ${clsName(a.cls)}) comes to you one evening after ${a.runs||0} expeditions. "My knees aren't what they were, Guildmaster. Perhaps it's time I set the sword down."${tales>3?" Their story is a long one.":""}`,
        choices:ch };
    }
  },
  {
    id:"traveling_merchant", weight:10, when:s=>s.gold>=100,
    build:(s)=>{
      const wanted=((s.requests&&s.requests.list)||[]).filter(r=>!r.done&&!r.relic).map(r=>r.need[0].item).filter(it=>ITEMS[it]&&!CUSTOMER_OF[it]);
      const item=(wanted.length&&Math.random()<0.65)?pick(wanted):pick(Object.keys(ITEMS).filter(k=>ITEMS[k].tier==="raw"&&!CUSTOMER_OF[k]&&itemTier(k)<99));
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
              const hero=pick(idle); if(Math.random()<0.7) return { gold:reward, renown:2, story:[{id:hero.id,tr:"Söylentideki gizli zulayı buldu.",en:"Found the rumored hidden cache."}], msg:LANG==="tr"?`🗺️ ${hero.name} zulayı buldu! +${reward}A ve şan.`:`🗺️ ${hero.name} found the cache! +${reward}G and glory.` };
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
                story:[{id:winner.id,tr:`Avludaki düelloda ${loser.name}'i yendi.`,en:`Bested ${loser.name} in a duel in the yard.`},{id:loser.id,tr:`Düelloda ${winner.name}'e yenildi.`,en:`Lost a duel to ${winner.name}.`}],
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
                story:[{id:A.id,tr:`Lonca salonunda ${B.name} ile evlendi.`,en:`Married ${B.name} in the guild hall.`},{id:B.id,tr:`Lonca salonunda ${A.name} ile evlendi.`,en:`Married ${A.name} in the guild hall.`}],
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
            resolve:(s)=>({ leave:[leaver.id], renown:-2, msg:LANG==="tr"?`🚪 ${leaver.name} loncayı temelli terk etti, kinleri de sırları da yanında götürdü. (−2 şöhret)`:`🚪 ${leaver.name} left the guild for good, taking grudges and secrets alike. (−2 renown)` }) },
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
        { label:LANG==="tr"?"İşe al (6000A)":"Recruit them (6000G)", detail:LANG==="tr"?"Güçlü, yüksek rütbeli bir maceracı":"A powerful, high-rank adventurer",
          resolve:(s)=> s.gold<6000 ? {msg:LANG==="tr"?"Bedelini karşılayamadın.":"You couldn't meet their price."} :
            { gold:-6000, recruitLegend:true, renown:3, msg:LANG==="tr"?`⭐ Efsanevi bir maceracı loncana katıldı!`:`⭐ A legendary adventurer joined your guild!` } },
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
              return { gold:2000, renown:15, grantXp:{ids:party.map(p=>p.id),amount:300}, story:party.map(p=>({id:p.id,tr:"Köyleri yakan ejderi öldürdü.",en:"Slew the dragon that burned the villages."})), msg:LANG==="tr"?`🐉 Ejder öldürüldü! ${party.map(p=>p.name).join(", ")} efsanevi kahramanlar olarak döndü. +2000A ve ölümsüz şöhret.`:`🐉 The wyrm is slain! ${party.map(p=>p.name).join(", ")} return as heroes of legend. +2000G and undying fame.` }; }
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

// ==================== §CHRONICLE · KAHRAMAN GÜNLÜĞÜ ====================
// evaluate a text builder in both languages so the story survives a language switch
function bothLang(fn){ const L=LANG; let tr,en; try{ LANG="tr"; tr=fn(); LANG="en"; en=fn(); } finally { LANG=L; } return {tr,en}; }
// add a line to a hero's life story (mutates the given hero copy). Keeps the first line + latest 15.
function chron(a, day, fn){ if(!a) return; const e={d:day||1, ...bothLang(fn)}; const c=[...(a.chronicle||[]), e]; a.chronicle = c.length>16 ? [c[0], ...c.slice(-15)] : c; }
function chronText(e){ return (LANG==="tr"?e.tr:e.en) || e.tr || e.en || ""; }
// level a hero up as far as their XP allows; returns levels gained
function levelUpHero(a, day){ let n=0;
  while(a.xp >= xpForLevel(a.level+1) && a.level<50){ a.xp -= xpForLevel(a.level+1); a.level++; a.maxHp=Math.floor(a.maxHp*1.06); a.wage=(a.wage||0)+1; n++;
    if(a.level%10===0){ const lv=a.level; chron(a, day, ()=>LANG==="tr"?`${lv}. seviyeye ulaştı.`:`Reached level ${lv}.`); } }
  return n; }
// 🎓 retired mentors: each adds training & expedition XP
// how many heroes may hold a duty at once, and how many already do (resting-to-return counts)
function taskSlots(s, tk){ return tk==="patrol" ? (bLv(s.buildings,"watch_tower").patrolSlots||2) : tk==="train" ? (bLv(s.buildings,"train_dummies").trainSlots||2) : 999; }
function taskUsed(s, tk, exceptId){ return (s.adventurers||[]).filter(a=>a.id!==exceptId && ((a.task===tk && a.status!=="questing") || a.autoRest===tk)).length; }
function mentorBonus(s){ const n=((s&&s.mentors)||[]).length; return { trainXp:n*2, xpMult:1+n*0.05 }; }
function retireEligible(a, day){ return a && !a.unique && a.status==="idle" && a.level>=25 && (a.runs||0)>=30 && (day||0)>=(a.retireAsk||0); }

// ⚰️ when a hero dies the guild pays their family; losing a famous hero also dents the guild's name
function bloodPrice(ns, dead){ let gold=0, ren=0;
  dead.forEach(d=>{ const st=(ns.stories||{})[d.cls]; if(STORY_HEROES[d.cls] && (!st || st.stage<3)){ const f=(ns.fallen||[]).find(x=>x.name===d.name);
    if(f) f.chronicle=[...(f.chronicle||[]), {d:ns.day, tr:"Hikâyesi yarım kaldı.", en:"Their story was left unfinished."}]; } });
  dead.forEach(d=>{ gold += Math.round(d.level*d.level*2); ren += Math.max(0,(d.rankIndex||0)-2)*2; });
  ns.gold=(ns.gold||0)-gold; ns.renown=Math.max(0,(ns.renown||0)-ren); // may go into debt
  if(!gold && !ren) return "";
  return LANG==="tr" ? `⚰️ Ailelerine ${gold}A tazminat ödendi${ren?`; ünlü bir kahramanı kaybetmek loncanın adına gölge düşürdü (−${ren} şöhret)`:""}.`
                     : `⚰️ ${gold}G paid to the families${ren?`; losing a famed hero darkens the guild's name (−${ren} renown)`:""}.`; }
// Apply an event result patch to the (mutable) next-state ns
function applyEventPatch(ns, res){
  if(!res) return;
  if(res.marketSet) ns.market = res.marketSet;
  if(res.gold) ns.gold = res.gold>0 ? ns.gold + res.gold : Math.max(Math.min(ns.gold,0), ns.gold + res.gold); // events never push you into debt, nor erase it
  if(res.renown) ns.renown = Math.max(0, ns.renown + res.renown);
  if(res.give){ ns.inventory={...ns.inventory}; ns.inventory[res.give.item]=(ns.inventory[res.give.item]||0)+res.give.qty; }
  if(res.take){ ns.inventory={...ns.inventory}; ns.inventory[res.take.item]=Math.max(0,(ns.inventory[res.take.item]||0)-res.take.qty); if(ns.inventory[res.take.item]===0) delete ns.inventory[res.take.item]; }
  if(res.sell){ ns.inventory={...ns.inventory}; ns.inventory[res.sell.item]=Math.max(0,(ns.inventory[res.sell.item]||0)-res.sell.qty); if(ns.inventory[res.sell.item]===0) delete ns.inventory[res.sell.item]; }
  if(res.healAll){ ns.adventurers=ns.adventurers.map(a=>a.status==="injured"?{...a,status:"idle",hp:a.maxHp}:a); }
  if(res.sicken){ ns.adventurers=ns.adventurers.map(a=>res.sicken.includes(a.id)?{...a,status:"injured",injuryUntil:ns.elapsed+120,hp:Math.max(1,Math.floor(a.maxHp*0.4))}:a); }
  if(res.injure){ ns.adventurers=ns.adventurers.map(a=>res.injure.includes(a.id)?{...a,status:"injured",injuryUntil:ns.elapsed+120,hp:Math.max(1,Math.floor(a.maxHp*0.3))}:a); }
  if(res.kill){ ns.fallen=[...(ns.fallen||[])]; const dead=ns.adventurers.filter(a=>res.kill.includes(a.id));
    { const bp=bloodPrice(ns, dead); if(bp && res.msg) res.msg += " " + bp; }
    dead.forEach(d=>ns.fallen.unshift({name:d.name,cls:d.cls,level:d.level,day:ns.day,region:(LANG==="tr"?"kara bir gün":"a dark day at the guild"),rank:RANKS[d.rankIndex!=null?d.rankIndex:0].name,
      chronicle:[...(d.chronicle||[]),{d:ns.day,tr:"Lonca uğruna canını verdi.",en:"Gave their life for the guild."}]}));
    ns.adventurers=ns.adventurers.filter(a=>!res.kill.includes(a.id)); }
  if(res.recruitLegend){ const rares=Object.keys(CLASSES).filter(k=>CLASSES[k].rare && !CLASSES[k].unique);
    const lg=makeAdventurer(5, pick(rares)); lg.level=Math.max(lg.level,32); lg.rankIndex=eligibleRankIndex(lg.level);
    lg.maxHp=Math.floor(lg.maxHp*1.3); lg.hp=lg.maxHp; ns.adventurers=[...ns.adventurers, lg]; }
  // grant XP to specific adventurers
  if(res.grantXp){ ns.adventurers=ns.adventurers.map(a=>{ if(!res.grantXp.ids.includes(a.id)) return a; const na={...a,xp:a.xp+res.grantXp.amount}; levelUpHero(na, ns.day); return na; }); }
  if(res.story){ ns.adventurers=ns.adventurers.map(a=>{ const st=res.story.find(x=>x.id===a.id); if(!st) return a; const na={...a}; na.chronicle=[...(a.chronicle||[]),{d:ns.day,tr:st.tr,en:st.en}].slice(-16); return na; }); }
  if(res.leave){ ns.retired=[...(ns.retired||[])]; ns.adventurers.filter(a=>res.leave.includes(a.id)).forEach(d=>{
      const c=[...(d.chronicle||[]), {d:ns.day, tr:"Kırgın, loncadan ayrılıp gitti.", en:"Left the guild, bitter."}];
      ns.retired.unshift({ name:d.name, cls:d.cls, level:d.level, day:ns.day, kind:"left", chronicle:c }); });
    ns.adventurers=ns.adventurers.filter(a=>!res.leave.includes(a.id)); }
  if(res.retire){ const r=res.retire; const a=ns.adventurers.find(x=>x.id===r.id);
    if(a){ const c=[...(a.chronicle||[])];
      if(r.mode==="mentor"){ c.push({d:ns.day, tr:"Kılıcını astı; artık lonca eğitmeni.", en:"Hung up the sword; now trains the guild."});
        ns.mentors=[...(ns.mentors||[]), { name:a.name, cls:a.cls, level:a.level, day:ns.day, wage:a.wage, chronicle:c }]; }
      else { c.push({d:ns.day, tr:"Onurlu bir törenle emekli oldu.", en:"Retired with full honors."});
        ns.retired=[{ name:a.name, cls:a.cls, level:a.level, day:ns.day, kind:"retired", chronicle:c }, ...(ns.retired||[])]; }
      ns.adventurers=ns.adventurers.filter(x=>x.id!==r.id); } }
  if(res.stay){ ns.adventurers=ns.adventurers.map(a=>a.id===res.stay?{...a,retireAsk:ns.day+15}:a); }
  if(res.reqBoost && ns.requests && Array.isArray(ns.requests.list)){ const b=res.reqBoost;
    ns.requests={...ns.requests, list:ns.requests.list.map(r=>(!r.done && !r.relic && r.group===b.group)?{...r,base:Math.round(r.base*b.mult)}:r)}; }
  if(res.hasten){ ns.quests=(ns.quests||[]).map(q=>q.resolved?q:{...q,endAt:Math.max(ns.elapsed+1,q.endAt-res.hasten)}); }
  if(res.restAll){ ns.adventurers=ns.adventurers.map(a=>a.status!=="questing"&&(a.fatigue||0)>0?{...a,fatigue:Math.max(0,a.fatigue-res.restAll)}:a); }
  // change a relationship score directly (event drama)
  if(res.bond){ ns.rels={...ns.rels}; bumpRel(ns.rels, res.bond.a, res.bond.b, res.bond.delta, ns.elapsed); }
  // schedule a follow-up event to fire after `days` days
  if(res.chain){ ns.pendingChains=[...(ns.pendingChains||[]), { fireDay: ns.day + res.chain.days, id: res.chain.id, data: res.chain.data||{} }]; }
  // event-granted achievement
  if(res.ach){ ns._pendingAch = ns._pendingAch || []; ns._pendingAch.push(res.ach); }
  // personal stories: change one hero, several bonds, and advance the story
  if(res.heroMod){ const hm=res.heroMod; ns.adventurers=ns.adventurers.map(a=>{ if(a.id!==hm.id) return a; const na={...a,...(hm.set||{})};
      Object.entries(hm.add||{}).forEach(([k,v])=>{ na[k]=(na[k]||0)+v; }); return na; }); }
  if(res.bonds){ ns.rels={...ns.rels}; res.bonds.forEach(b=>bumpRel(ns.rels,b.a,b.b,b.delta,ns.elapsed)); }
  if(res.storyStep){ const {cls,path}=res.storyStep; const prev=(ns.stories||{})[cls]||{stage:0,path:[]}; const h=(ns.adventurers||[]).find(a=>a.cls===cls);
    ns.stories={...(ns.stories||{}), [cls]:{stage:(prev.stage||0)+1, lastDay:ns.day, path:[...(prev.path||[]),path], fallenAt:(ns.fallen||[]).length, runsAt:h?(h.runs||0):0}};
    if(((prev.stage||0)+1)>=3){ ns._pendingAch=[...(ns._pendingAch||[]),"a_story"]; } }
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
// ==================== §CRISES · DİYAR KRİZLERİ (END GAME) ====================
// Four realm-shaking crises. Each unlocks under its own conditions, has 3 stages that need a big,
// well-built party, runs on a deadline (frozen while the app is closed) and can kill heroes.
const HEALER_CLASSES = ["Cleric","Paladin","Monk"];
const TANK_CLASSES = ["Warrior","Paladin","Beastmaster","Dragonborn"];
const SOLO_CLASSES = ["LoneWolf","GoblinSlayer"];
const CRISES = [
  { id:"undead", icon:"🧟", gold:8000, renown:40,
    name:{tr:"Ölüler Ordusu", en:"The Army of the Dead"},
    intro:{tr:"Lich Aldwin'in küllerinden bir fısıltı yükseldi. Antik Lahit'in altında binlerce ölü uyanıyor ve köyler birer birer sessizleşiyor.", en:"A whisper rose from Lich Aldwin's ashes. Beneath the Ancient Crypt, thousands of dead are stirring — and village after village falls silent."},
    hint:{tr:"Lich Aldwin'i yen ve lonca kademesi 4'e ulaş", en:"Defeat Lich Aldwin and reach guild tier 4"},
    unlock:(s)=> ((s.bossDefeated||{}).b_crypt_epic||0)>0 && guildTier(s)>=4,
    legend:{ id:"holy_seal", icon:"🕯️", name:{tr:"Kutsal Mühür",en:"The Holy Seal"}, desc:{tr:"Tüm seferlerde yaralanma riski −%5",en:"−5% injury risk on every expedition"} },
    escalate:(ns)=>{ ns.renown=Math.max(0,(ns.renown||0)-6); const v=(ns.adventurers||[]).filter(a=>a.status==="idle"); let who="";
      if(v.length){ const h=pick(v); who=h.name; ns.adventurers=ns.adventurers.map(a=>a.id===h.id?{...a,status:"injured",injuryUntil:ns.elapsed+180,hp:Math.max(1,Math.floor(a.maxHp*0.4))}:a); }
      return LANG==="tr"?`🧟 Ölüler bir köyü daha yuttu. Korku loncaya kadar sızdı${who?` — ${who} hastalandı`:""}. (−6 şöhret)`:`🧟 The dead swallowed another village. Dread seeps into the hall${who?` — ${who} fell ill`:""}. (−6 renown)`; },
    stages:[
      { name:{tr:"Mezarlık Yolu",en:"The Cemetery Road"}, text:{tr:"Köylüleri tahliye edecek bir öncü birlik lazım.",en:"A vanguard must clear the road so the villagers can flee."}, party:6, avg:28, healers:1, tanks:1, power:810, duration:180, days:15 },
      { name:{tr:"Kemik Kuşatması",en:"The Bone Siege"}, text:{tr:"Ölüler kasabanın surlarına dayandı. Geri püskürtülmeleri gerek.",en:"The dead are at the walls. They must be thrown back."}, party:6, avg:31, healers:2, tanks:1, power:980, duration:240, days:15 },
      { name:{tr:"Lich'in Kalbi",en:"The Lich's Heart"}, text:{tr:"Lahdin en derinindeki kalp parçalanmadıkça ölüler hep geri dönecek.",en:"Until the heart in the crypt's depths is shattered, the dead will keep rising."}, party:6, avg:34, healers:2, tanks:2, power:1120, duration:300, days:15 },
    ] },
  { id:"dragon", icon:"🐉", gold:12000, renown:45,
    name:{tr:"Kızıl Ejderin Uyanışı", en:"The Crimson Wyrm Wakes"},
    intro:{tr:"Vhaelmyr'in ölümü dağların altındaki çok daha yaşlı bir şeyi uyandırdı. Gökyüzü kızıla boyanıyor; kervanlar küle dönüyor.", en:"Vhaelmyr's death woke something far older beneath the mountains. The sky turns red, and the caravans turn to ash."},
    hint:{tr:"Kadim Vhaelmyr'i yen", en:"Defeat Vhaelmyr the Ancient"},
    unlock:(s)=> ((s.bossDefeated||{}).b_dragon_epic||0)>0,
    legend:{ id:"dragon_heart", icon:"❤️‍🔥", name:{tr:"Ejder Kalbi",en:"The Dragon's Heart"}, desc:{tr:"Tüm seferlerde +%5 başarı",en:"+5% success on every expedition"} },
    escalate:(ns)=>{ const lost=Math.round(Math.max(0,ns.gold||0)*0.12); ns.gold=(ns.gold||0)-lost;
      return LANG==="tr"?`🐉 Kızıl ejder ticaret yolunu yaktı. Kervanlarınla birlikte ${lost}A kül oldu.`:`🐉 The crimson wyrm burned the trade road. ${lost}G went up in smoke with your caravans.`; },
    stages:[
      { name:{tr:"Kül Yağmuru",en:"Rain of Ash"}, text:{tr:"Yanan köylerden sağ kalanları çıkarmak için ateşin içine girmek gerek.",en:"Someone must walk into the fire and pull the survivors out."}, party:6, avg:32, healers:1, tanks:2, power:1060, duration:240, days:15 },
      { name:{tr:"Yavrular",en:"The Brood"}, text:{tr:"Ejderin yavruları vadiye yayıldı. Yuvayı bul ve temizle.",en:"The wyrm's brood has spread through the valley. Find the nest and burn it out."}, party:6, avg:36, healers:1, tanks:2, power:1250, duration:270, days:15 },
      { name:{tr:"Kızıl Zirve",en:"The Crimson Peak"}, text:{tr:"Ejder zirvesinde bekliyor. Bu bir avdan çok, bir efsanenin sonu.",en:"The wyrm waits on its peak. This is less a hunt than the end of a legend."}, party:7, avg:40, healers:2, tanks:2, power:1440, duration:330, days:15 },
    ] },
  { id:"throne", icon:"👑", gold:10000, renown:45,
    name:{tr:"Taht Kavgası", en:"War of the Crown"},
    intro:{tr:"Kral öldü ve üç vâris tahta göz dikti. Loncan artık o kadar ünlü ki, hangi tarafı tutacağın krallığın kaderini belirleyebilir.", en:"The king is dead and three heirs eye the throne. Your guild is so renowned now that whichever side you back may decide the realm's fate."},
    hint:{tr:"\"Krallığın Gözdesi\" unvanına ve lonca kademesi 4'e ulaş", en:"Become \"Favored of the Crown\" and reach guild tier 4"},
    unlock:(s)=> titleIndex(s.renown)>=4 && guildTier(s)>=4,
    legend:{ id:"royal_charter", icon:"📜", name:{tr:"Kraliyet Fermanı",en:"The Royal Charter"}, desc:{tr:"İstek ödülleri +%15, maaşlar −%10",en:"+15% request pay, −10% wages"} },
    escalate:(ns)=>{ const R=ns.requests; if(R&&R.favor){ ns.requests={...R,favor:{...R.favor,nobles:Math.max(0,(R.favor.nobles||0)-6)}}; } ns.renown=Math.max(0,(ns.renown||0)-4);
      return LANG==="tr"?`👑 Kararsızlığın saraya kötü göründü. Soylular sana sırt çeviriyor. (Soylu itibarı −6, −4 şöhret)`:`👑 Your hesitation looked bad at court. The Nobles turn their backs. (Noble favor −6, −4 renown)`; },
    stages:[
      { name:{tr:"Soyluların Desteği",en:"The Nobles' Backing"}, text:{tr:"Vârisini seçmeden önce soyluların güvenini kazanmalısın — ve onu saraya güvenle götürmelisin.",en:"Before you can back an heir, the Nobles must trust you — and the heir must reach the palace alive."}, party:6, avg:28, healers:1, tanks:1, power:880, duration:180, days:15, favor:6 },
      { name:{tr:"Altın Kılıçtan Keskindir",en:"Gold Cuts Deeper"}, text:{tr:"Ordular satın alınabilir. Kasandan büyük bir rüşvet, sınırdaki paralı askerleri tarafına çekebilir.",en:"Armies can be bought. A great bribe from your coffers can turn the border mercenaries."}, party:6, avg:31, healers:1, tanks:1, power:1060, duration:240, days:15, cost:12000 },
      { name:{tr:"Taç Giyme Savaşı",en:"The Coronation Battle"}, text:{tr:"Rakip vârisler son bir kez saldıracak. Taç giyme günü kan dökülecek.",en:"The rival heirs will strike one last time. Blood will be spilled on coronation day."}, party:7, avg:34, healers:2, tanks:2, power:1250, duration:300, days:15 },
    ] },
  { id:"void", icon:"🌌", gold:20000, renown:80,
    name:{tr:"Boşluk Yarığı", en:"The Void Rift"},
    intro:{tr:"Nihil yok oldu ama bıraktığı yara kapanmadı. Gökyüzünde bir yarık açılıyor ve diyarın kendisi içine çekiliyor. Bu, loncanın son ve en büyük sınavı.", en:"Nihil is gone, but the wound it left never closed. A rift is tearing open the sky and the realm itself is being pulled in. This is your guild's last and greatest trial."},
    hint:{tr:"Nihil'i yen ve en az bir krizi çöz", en:"Defeat Nihil and resolve at least one other crisis"},
    unlock:(s)=> ((s.bossDefeated||{}).b_void_epic||0)>0 && ["undead","dragon","throne"].some(k=>((s.crises||{})[k]||{}).status==="won"),
    legend:{ id:"void_compass", icon:"🧭", name:{tr:"Boşluk Pusulası",en:"The Void Compass"}, desc:{tr:"Seferler %15 daha kısa, +%10 ganimet",en:"Expeditions 15% shorter, +10% loot"} },
    escalate:(ns)=>{ ns.adventurers=(ns.adventurers||[]).map(a=>a.status!=="questing"?{...a,fatigue:Math.min(100,(a.fatigue||0)+35)}:a); ns.renown=Math.max(0,(ns.renown||0)-8);
      return LANG==="tr"?`🌌 Yarık genişledi. Loncada kimse doğru dürüst uyuyamıyor; herkes bitkin. (−8 şöhret)`:`🌌 The rift widened. No one in the hall can sleep; everyone is exhausted. (−8 renown)`; },
    stages:[
      { name:{tr:"Yarığın Kıyısı",en:"The Rift's Edge"}, text:{tr:"Yarıktan dökülen yaratıkları durdurmadan yaklaşmak bile imkânsız.",en:"Nothing can get near the rift until the things pouring out of it are stopped."}, party:8, avg:38, healers:2, tanks:2, power:1620, duration:300, days:15 },
      { name:{tr:"Hiçliğin İçinde",en:"Into the Nothing"}, text:{tr:"Ekip yarığın içine girmeli. Orada yukarı ve aşağı yok; sadece cesaret var.",en:"The party must step inside the rift. There is no up or down there — only nerve."}, party:8, avg:41, healers:2, tanks:2, power:1880, duration:360, days:15 },
      { name:{tr:"Yaranın Mühürlenmesi",en:"Sealing the Wound"}, text:{tr:"Yarık ancak içeriden mühürlenebilir. Herkes geri dönmeyebilir.",en:"The rift can only be sealed from within. Not everyone may come back."}, party:8, avg:44, healers:2, tanks:2, power:2120, duration:420, days:15 },
    ] },
];
const CRISIS_BY_ID = Object.fromEntries(CRISES.map(c=>[c.id,c]));
function guildTier(s){ return BUILDINGS.treasury.levels[Math.min((s.buildings&&s.buildings.treasury)||0,BUILDINGS.treasury.levels.length-1)].tier; }
function crisisName(C){ return LANG==="tr"?C.name.tr:C.name.en; }
function crisisL(o){ return o ? (LANG==="tr"?o.tr:o.en) : ""; }
// permanent bonuses from resolved crises
function legendMod(s){ const cr=(s&&s.crises)||{}; const won=(id)=>(cr[id]||{}).status==="won";
  return { injury: won("undead")?-0.05:0, succ: won("dragon")?0.05:0, reqPay: won("throne")?1.15:1, wage: won("throne")?0.9:1,
    speed: won("void")?0.85:1, loot: won("void")?1.1:1 }; }
function bossSupplies(b){ return Math.round((b.reward.gold||0)*0.15/10)*10; }
function crisisSupplies(C){ return Math.round(C.gold*0.1/100)*100; }
function isSoloHero(a){ return !!a && (a.cls==="LoneWolf"||a.cls==="GoblinSlayer") && !a.curseBroken; }
function heroCrisisPower(a){ const c=CLASSES[a.cls]||{atk:12,def:10}; return a.level*3 + c.atk + c.def + (a.rankIndex||0)*5; }
// requirement checklist + odds for a crisis stage with a given party
function crisisOdds(C, stIdx, party, s, esc){
  const st=C.stages[stIdx];
  const n=party.length, avg=n?party.reduce((x,a)=>x+a.level,0)/n:0;
  const healers=party.filter(a=>HEALER_CLASSES.includes(a.cls)).length, tanks=party.filter(a=>TANK_CLASSES.includes(a.cls)).length;
  const reqs=[
    { ok:n>=st.party, tr:`En az ${st.party} kişi (${n})`, en:`At least ${st.party} heroes (${n})` },
    { ok:avg>=st.avg, tr:`Ortalama seviye ${st.avg}+ (${Math.floor(avg)})`, en:`Average level ${st.avg}+ (${Math.floor(avg)})` },
    { ok:healers>=st.healers, tr:`${st.healers} şifacı — Rahip/Şövalye/Keşiş (${healers})`, en:`${st.healers} healer(s) — Cleric/Paladin/Monk (${healers})` },
    { ok:tanks>=st.tanks, tr:`${st.tanks} ön saf — Savaşçı/Şövalye/Canavar Efendisi (${tanks})`, en:`${st.tanks} frontliner(s) — Warrior/Paladin/Beastmaster (${tanks})` },
  ];
  if(st.favor) reqs.push({ ok:((s.requests&&s.requests.favor&&s.requests.favor.nobles)||0)>=st.favor, tr:`Soylu itibarı ${st.favor}+`, en:`Noble favor ${st.favor}+` });
  reqs.push({ ok:(s.gold||0)>=crisisSupplies(C)+(st.cost||0), tr:`${crisisSupplies(C).toLocaleString()}A erzak (yola çıkarken ödenir)`, en:`${crisisSupplies(C).toLocaleString()}G supplies (paid on departure)` });
  if(st.cost) reqs.push({ ok:(s.gold||0)>=st.cost+crisisSupplies(C), tr:`${st.cost.toLocaleString()}A rüşvet (yola çıkarken ödenir)`, en:`${st.cost.toLocaleString()}G bribe (paid on departure)` });
  let bonus=0;
  if(n>1){ let sum=0,pairs=0; for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){ sum+=getRel(s.rels||{},party[i].id,party[j].id); pairs++; } bonus+=pairs?(sum/pairs)/100*0.08:0;
    const tt=teamTier(s.rels||{},party); if(tt>0) bonus+=TEAM_TIERS[tt].bonus; }
  if(party.some(a=>a.boon==="beastHorn")) bonus+=0.08;
  if(C.id==="dragon" && party.some(a=>a.dragonVoice)) bonus+=0.20; // the Crimson Voice
  bonus += (bLv(s.buildings,"tav_meals").successBonus||0) + legendMod(s).succ;
  const fatiguePen = party.reduce((x,a)=>x+((a.fatigue||0)>=70?0.12:(a.fatigue||0)>=40?0.05:0),0)/(n||1);
  const power=Math.round(party.reduce((x,a)=>x+heroCrisisPower(a),0)*(1+bonus-fatiguePen));
  const need=Math.round(st.power*(1+0.08*(esc||0)));
  const win=Math.max(0.05,Math.min(0.9, power/need-0.35));
  const deathFail=Math.max(0.04, 0.22 - healers*0.03 - (party.some(a=>a.boon==="prayerBeads")?0.03:0));
  return { reqs, ok:reqs.every(r=>r.ok), power, need, win, deathFail, deathWin:Math.max(0,0.04-healers*0.01) };
}


// ==================== §STORIES · ÖZEL KAHRAMAN HİKÂYELERİ ====================
// Each unique hero has a 3-chapter personal story. A chapter fires (as a decision event) when:
//   enough days have passed (5 after joining, 10 between chapters) + its own trigger + the hero is at home.
// Then a 35% daily roll, so it never lands on a predictable tick. Never while the app is closed.
const SL=(h,tr,en)=>({id:h.id,tr,en});
const STORY_HEROES = {
  LoneWolf: {
    hints:[{tr:"Tehlikeli yerlerden yalnız döndükçe, bir şey onun izini sürüyor…",en:"Each time he returns alone from dangerous lands, something follows his trail…"},
           {tr:"Gölgeler bir bedel istiyor — bir kayıp, ya da çok fazla sefer…",en:"The shadows want a price — a loss, or too many roads…"},
           {tr:"Gölgelerin kaynağı uzakta değil. Yeterince güçlendiğinde…",en:"The source of the shadows is near. Once he is strong enough…"}],
    chapters:[
      { gap:5, when:(s,h)=>(h.soloDanger||0)>=3,
        build:(s,h)=>{ const n=h.name; return { icon:"🐺", title:LANG==="tr"?"Gece Ziyaretçisi":"The Night Visitor",
          text:LANG==="tr"?`${n} tek başına döndüğü o gece, salonun kapısında kimse bir şey görmedi. Ama sabah eşikte kan, avluda yanmış otlar vardı. ${n} bütün gece kapının önünde, kılıcı elinde oturmuş. Ne olduğunu sormaya kimse cesaret edemedi.`
                          :`The night ${n} came back alone, no one saw anything at the door. But by morning there was blood on the threshold and scorched grass in the yard. ${n} had sat outside all night, sword in hand. No one dared to ask.`,
          choices:[
            { label:LANG==="tr"?"Onunla konuş":"Talk to him", detail:LANG==="tr"?"Belki anlatır, belki anlatmaz":"He may tell you, or he may not",
              resolve:()=>({ storyStep:{cls:"LoneWolf",path:"talk"}, story:[SL(h,"Bir gece lonca efendisine geçmişinden bir parça anlattı.","One night he told the guildmaster a piece of his past.")],
                msg:LANG==="tr"?`🐺 ${n} uzun süre sustu. Sonra ateşe bakarak, peşindeki şeylerin onu asla bırakmayacağını söyledi. Bunu ilk kez birine anlatıyordu.`:`🐺 ${n} was silent a long while. Then, staring into the fire, he said the things that hunt him will never let go. It was the first time he had told anyone.` }) },
            { label:LANG==="tr"?"Kapılara nöbetçi koy (300A)":"Post guards at the gates (300G)", detail:LANG==="tr"?"Salonu koru — o da bunu görecek":"Protect the hall — he will notice",
              resolve:(st)=> st.gold<300 ? { storyStep:{cls:"LoneWolf",path:"alone"}, msg:LANG==="tr"?`🐺 Nöbetçilere verecek altın yoktu. ${n} yine tek başına bekledi.`:`🐺 There was no gold for guards. ${n} kept watch alone again.` } :
                ({ gold:-300, storyStep:{cls:"LoneWolf",path:"guard"}, story:[SL(h,"Lonca, onun için kapılarına nöbetçi dikti.","The guild posted guards at its gates for him.")],
                msg:LANG==="tr"?`🐺 Nöbetçiler sabaha kadar ateş yaktı. ${n} hiçbir şey söylemedi, ama o gece ilk kez kılıcını kınına koyup uyudu.`:`🐺 The guards kept fires burning till dawn. ${n} said nothing — but that night, for the first time, he sheathed his sword and slept.` }) },
            { label:LANG==="tr"?"Karışma":"Stay out of it", detail:LANG==="tr"?"Onun meselesi — yalnızlık onu daha da sertleştirir":"His business — solitude hardens him further",
              resolve:()=>({ storyStep:{cls:"LoneWolf",path:"alone"}, heroMod:{id:h.id,add:{bonusSucc:0.03}}, story:[SL(h,"Gölgelerle yine tek başına yüzleşti.","He faced the shadows alone, again.")],
                msg:LANG==="tr"?`🐺 Kimse bir şey sormadı. ${n} de bir şey anlatmadı. Ertesi gün kılıcını her zamankinden uzun biledi.`:`🐺 No one asked. ${n} told no one. The next day he sharpened his blade longer than ever.` }) },
          ] }; } },
      { gap:10, when:(s,h,st)=>(s.fallen||[]).length>(st.fallenAt||0) || (h.runs||0)>=(st.runsAt||0)+12,
        build:(s,h)=>{ const n=h.name; return { icon:"🐺", title:LANG==="tr"?"Gölgenin Bedeli":"The Shadow's Price",
          text:LANG==="tr"?`${n} kapını çalıyor. "Onlar benim yüzümden geliyor. Burada kaldıkça bu salona kan sızacak. Gitmeme izin ver — ya da gidip onları kökünden kazımama."`
                          :`${n} knocks at your door. "They come because of me. As long as I stay, blood will seep into this hall. Let me leave — or let me go and root them out."`,
          choices:[
            { label:LANG==="tr"?"Kal. Bu yükü birlikte taşırız.":"Stay. We carry this together.", detail:LANG==="tr"?"Lonca onu bırakmaz":"The guild won't let him go",
              resolve:()=>({ storyStep:{cls:"LoneWolf",path:"stay"}, heroMod:{id:h.id,add:{bonusInj:0.04}}, story:[SL(h,"Lonca onu bırakmadı; o da bunu unutmadı.","The guild would not let him go — and he never forgot it.")],
                msg:LANG==="tr"?`🐺 ${n} uzun süre sana baktı. Sonra başını eğdi. Bu, ondan duyabileceğin en büyük teşekkürdü.`:`🐺 ${n} looked at you for a long time. Then he bowed his head. It was the greatest thanks you would ever get from him.` }) },
            { label:LANG==="tr"?"Git ve onları avla":"Go and hunt them", detail:LANG==="tr"?"Döner — ama nasıl döner?":"He'll come back — but how?",
              resolve:(st)=>({ storyStep:{cls:"LoneWolf",path:"hunt"}, heroMod:{id:h.id,set:{status:"injured",injuryUntil:st.elapsed+400,hp:1},add:{bonusSucc:0.05}},
                story:[SL(h,"Gölgelerin peşine düştü; kanlar içinde ama ayakta döndü.","He went after the shadows and came back bloodied, but standing.")],
                msg:LANG==="tr"?`🐺 ${n} üç gün sonra döndü; zırhı paramparça, gözleri her zamankinden karanlık. "Birkaçını buldum," dedi yalnızca. "Hepsini değil."`:`🐺 ${n} returned three days later, armour in pieces, eyes darker than ever. "I found some of them," was all he said. "Not all."` }) },
          ] }; } },
      { gap:10, when:(s,h)=>h.level>=35 || guildTier(s)>=4,
        build:(s,h,st)=>{ const n=h.name; const bonded=(st.path||[]).some(p=>p==="talk"||p==="guard"||p==="stay");
          const ch=[];
          if(bonded) ch.push({ label:LANG==="tr"?"Loncayla birlikte savaşsın":"Fight alongside the guild", detail:LANG==="tr"?"Yoldaşları yanında — ama onlar da tehlikeye girer":"His comrades at his side — but they share the danger",
            resolve:(ss)=>{ const others=ss.adventurers.filter(a=>a.id!==h.id&&a.status==="idle"); const hurt=others.length?[pick(others).id]:[];
              return { storyStep:{cls:"LoneWolf",path:"together"}, injure:hurt, renown:15, heroMod:{id:h.id,set:{curseBroken:true,neg:{name:"Unbound",desc:"",mod:{}},storyTitle:{tr:"Şafağın Kılıcı",en:"Sword of the Dawn"}}},
                story:[SL(h,"Gölgeleri loncasıyla birlikte yendi. Laneti kırıldı; artık yalnız savaşmak zorunda değil.","He defeated the shadows together with his guild. The curse is broken — he no longer has to fight alone.")],
                msg:LANG==="tr"?`🌅 Harabede güneş doğduğunda gölgeler dağılmıştı. ${n} yoldaşlarına döndü ve — loncada ilk kez — gülümsedi. Laneti kırıldı: artık bir ekiple sefere çıkabilir.`:`🌅 When the sun rose over the ruin, the shadows were gone. ${n} turned to his comrades and — for the first time in the guild — smiled. The curse is broken: he can now join a party.` }; } });
          ch.push({ label:LANG==="tr"?"Yalnız gitsin":"Let him go alone", detail:LANG==="tr"?"Onun yolu bu — ama geri dönmeyebilir":"It is his way — but he may not return",
            resolve:()=>{ if(Math.random()<0.25) return { storyStep:{cls:"LoneWolf",path:"fallen"}, kill:[h.id],
                msg:LANG==="tr"?`⚰️ ${n} geri dönmedi. Haftalar sonra bir avcı, harabenin eşiğinde toprağa saplanmış kara bir kılıç gördüğünü anlattı. Gölgeler bir daha görülmedi.`:`⚰️ ${n} never came back. Weeks later a hunter spoke of a black sword driven into the earth at the ruin's threshold. The shadows were never seen again.` };
              return { storyStep:{cls:"LoneWolf",path:"undying"}, renown:10, heroMod:{id:h.id,add:{bonusSucc:0.08},set:{storyTitle:{tr:"Ölümsüz Kurt",en:"The Undying Wolf"}}},
                story:[SL(h,"Kara Şafak'tan tek başına döndü. Artık ona Ölümsüz Kurt diyorlar.","He came back alone from the Black Dawn. Now they call him the Undying Wolf.")],
                msg:LANG==="tr"?`🐺 ${n} bir hafta sonra döndü, tek başına. Ne olduğunu anlatmadı. Ama o günden beri peşinde hiçbir gölge yok — ve meyhanede ona "Ölümsüz Kurt" diyorlar.`:`🐺 ${n} came back a week later, alone. He never said what happened. But no shadow has followed him since — and in the tavern they call him "the Undying Wolf".` }; } });
          return { icon:"🐺", title:LANG==="tr"?"Kara Şafak":"The Black Dawn",
            text:LANG==="tr"?`Gölgelerin kaynağı nihayet bulundu: kuzeyde, haritalarda adı geçmeyen bir harabe. ${n} zırhını kuşanıyor. "Bu son kez," diyor. "Ya ben biterim, ya onlar."`
                            :`The source of the shadows has finally been found: a ruin in the north that no map names. ${n} straps on his armour. "This is the last time," he says. "Either I end, or they do."`,
            choices:ch }; } },
    ] },
  Hawk: {
    hints:[{tr:"Etrafında dostlar toplandıkça hayalleri büyüyor…",en:"As friends gather around him, his dreams grow…"},
           {tr:"Loncanın adı yayıldıkça onun hırsı da büyüyecek…",en:"As the guild's name spreads, so will his ambition…"},
           {tr:"Biri ona çok yakınlaştığında ya da lonca zirveye yaklaştığında, karar anı gelecek…",en:"When someone grows very close to him, or the guild nears its peak, the moment of choice will come…"}],
    chapters:[
      { gap:5, when:(s,h)=>s.adventurers.filter(o=>o.id!==h.id && getRel(s.rels||{},h.id,o.id)>=30).length>=2,
        build:(s,h)=>{ const n=h.name; const friends=s.adventurers.filter(o=>o.id!==h.id && getRel(s.rels||{},h.id,o.id)>=30);
          return { icon:"🦅", title:LANG==="tr"?"Bir Krallık Hayali":"A Dream of a Kingdom",
          text:LANG==="tr"?`Ateşin başında ${n} bir şey anlatıyor; herkes susmuş dinliyor. "Bir gün kendi kalem olacak. Kendi bayrağım, kendi yasalarım. Ve bu odadaki herkes orada bir yer bulacak." Sonra sana dönüyor: "Lonca efendisi… sen de inanıyor musun?"`
                          :`By the fire, ${n} is telling a story and everyone has fallen silent. "One day I will have my own castle. My own banner, my own laws. And everyone in this room will have a place there." Then he turns to you: "Guildmaster… do you believe it too?"`,
          choices:[
            { label:LANG==="tr"?"Hayaline ortak ol (500A)":"Back his dream (500G)", detail:LANG==="tr"?"Ona altın ve güven ver":"Give him gold and trust",
              resolve:(st)=> st.gold<500 ? { storyStep:{cls:"Hawk",path:"ground"}, msg:LANG==="tr"?`🦅 Kasada 500A yoktu. ${n} anlayışla gülümsedi — ama bir şeyler not etti.`:`🦅 The coffers didn't hold 500G. ${n} smiled kindly — but took note.` } :
                ({ gold:-500, renown:5, storyStep:{cls:"Hawk",path:"back"}, bonds:friends.map(f=>({a:h.id,b:f.id,delta:8})), story:[SL(h,"Lonca, onun krallık hayaline ilk altını koydu.","The guild put the first gold into his dream of a kingdom.")],
                  msg:LANG==="tr"?`🦅 ${n} keseyi tartmadan aldı. "Bunu unutmayacağım," dedi. Gözlerinde bir şey parladı — minnet mi, hırs mı, kestiremedin.`:`🦅 ${n} took the purse without weighing it. "I won't forget this," he said. Something flashed in his eyes — gratitude or ambition, you couldn't tell.` }) },
            { label:LANG==="tr"?"Ayaklarını yere bastır":"Keep his feet on the ground", detail:LANG==="tr"?"Önce lonca, sonra krallıklar":"The guild first, kingdoms later",
              resolve:()=>({ storyStep:{cls:"Hawk",path:"ground"}, story:[SL(h,"Lonca efendisi onun hayaline gülümsedi ama ortak olmadı.","The guildmaster smiled at his dream, but did not share in it.")],
                msg:LANG==="tr"?`🦅 ${n} gülümsedi. "Haklısın," dedi. Ama o gece ateş sönene kadar kimseyle konuşmadı.`:`🦅 ${n} smiled. "You're right," he said. But he spoke to no one until the fire died.` }) },
          ] }; } },
      { gap:10, when:(s)=>titleIndex(s.renown)>=2,
        build:(s,h,st)=>{ const n=h.name; const f=s.adventurers.filter(o=>o.id!==h.id).sort((x,y)=>getRel(s.rels||{},h.id,y.id)-getRel(s.rels||{},h.id,x.id))[0];
          const fn=f?f.name:(LANG==="tr"?"Biri":"Someone"); const backed=(st.path||[]).includes("back");
          return { icon:"🦅", title:LANG==="tr"?"Hırsın Gölgesi":"The Shadow of Ambition",
          text:LANG==="tr"?`Loncanın adı yayıldıkça ${n}'in çevresi de genişliyor. Bazıları artık senden çok ona bakıyor. ${fn} bir gece yanına gelip fısıldıyor: "Bizi kendi işleri için topluyor. Ne yapacağız?"`
                          :`As the guild's name spreads, so does ${n}'s circle. Some now look to him more than to you. One night ${fn} comes to you and whispers: "He's gathering us for his own ends. What do we do?"`,
          choices:[
            { label:LANG==="tr"?"Göz yum":"Look the other way", detail:LANG==="tr"?"Güçlü bir lider loncaya da güç katar":"A strong leader strengthens the guild too",
              resolve:()=>({ storyStep:{cls:"Hawk",path:"blind"}, heroMod:{id:h.id,add:{bonusSucc:0.05}}, bonds:f?[{a:h.id,b:f.id,delta:10}]:[], story:[SL(h,"Lonca efendisi onun yükselişine göz yumdu.","The guildmaster let his rise go unchecked.")],
                msg:LANG==="tr"?`🦅 Hiçbir şey yapmadın. ${n}'in gölgesi biraz daha uzadı.`:`🦅 You did nothing. ${n}'s shadow grew a little longer.` }) },
            { label:LANG==="tr"?"Onunla yüzleş":"Confront him", detail:LANG==="tr"?"Kimin loncası olduğunu hatırlat":"Remind him whose guild this is",
              resolve:()=> backed ? ({ storyStep:{cls:"Hawk",path:"loyal"}, heroMod:{id:h.id,set:{redeemed:true}}, story:[SL(h,"Lonca efendisiyle yüzleşti ve ona sadakat yemini etti.","He was confronted by the guildmaster, and swore loyalty.")],
                  msg:LANG==="tr"?`🦅 ${n} uzun süre sustu. Sonra kılıcını önüne koydu: "Bana inanan ilk kişi sendin. Bunu unutmadım." O günden sonra insanları birbirine düşürmeyi bıraktı.`:`🦅 ${n} was silent a long while. Then he laid his sword before you: "You were the first to believe in me. I haven't forgotten." From that day he stopped setting people against each other.` })
                : ({ storyStep:{cls:"Hawk",path:"rift"}, bonds:f?[{a:h.id,b:f.id,delta:-10}]:[], story:[SL(h,"Lonca efendisiyle yüzleşti; aralarında bir şey kırıldı.","He was confronted by the guildmaster; something broke between them.")],
                  msg:LANG==="tr"?`🦅 "Ben kimseye hesap vermem," dedi ${n} soğuk bir sesle. Kapıyı arkasından çarpmadı — bu, çarpmasından daha korkutucuydu.`:`🦅 "I answer to no one," ${n} said coldly. He didn't slam the door behind him — which was worse than if he had.` }) },
          ] }; } },
      { gap:10, when:(s,h)=>s.adventurers.some(o=>o.id!==h.id && getRel(s.rels||{},h.id,o.id)>=70) || guildTier(s)>=4,
        build:(s,h,st)=>{ const n=h.name; const loyal=!!h.redeemed;
          const close=s.adventurers.filter(o=>o.id!==h.id && getRel(s.rels||{},h.id,o.id)>=50).sort((x,y)=>getRel(s.rels||{},h.id,y.id)-getRel(s.rels||{},h.id,x.id)).slice(0,2);
          const fn=close.length?close.map(c=>c.name).join(LANG==="tr"?" ve ":" and "):"";
          if(loyal) return { icon:"🦅", title:LANG==="tr"?"Taç mı, Yoldaşlar mı":"Crown or Comrades",
            text:LANG==="tr"?`Bir soylu ailesi ${n}'e bir kale ve unvan teklif ediyor. Hayali gerçek oluyor. Ama önce sana geliyor: "Gidersem lonca bir kılıç kaybeder. Kalırsam bir hayalimi. Sen ne dersin?"`
                            :`A noble house offers ${n} a castle and a title. His dream is coming true. But he comes to you first: "If I go, the guild loses a sword. If I stay, I lose a dream. What do you say?"`,
            choices:[
              { label:LANG==="tr"?"Krallığını burada kur":"Build your kingdom here", detail:LANG==="tr"?"Loncanın kanatlarından biri olsun":"Let him be one of the guild's wings",
                resolve:()=>({ storyStep:{cls:"Hawk",path:"eagle"}, renown:20, heroMod:{id:h.id,add:{bonusSucc:0.08},set:{storyTitle:{tr:"Loncanın Kartalı",en:"Eagle of the Guild"}}},
                  story:[SL(h,"Bir kaleyi reddetti; krallığını loncada kurdu.","He turned down a castle and built his kingdom in the guild.")],
                  msg:LANG==="tr"?`🦅 ${n} teklifi reddetti. "Benim kalem burası," dedi, salonun çatısına bakarak. O günden beri ona "Loncanın Kartalı" diyorlar.`:`🦅 ${n} declined the offer. "This is my castle," he said, looking up at the hall's roof. Since that day they call him "the Eagle of the Guild".` }) },
              { label:LANG==="tr"?"Onu uğurla":"Send him off with honour", detail:LANG==="tr"?"Hayalini yaşasın — loncanın dostu olarak":"Let him live his dream — as the guild's friend",
                resolve:()=>({ storyStep:{cls:"Hawk",path:"lord"}, renown:30, gold:2000, retire:{id:h.id,mode:"farewell"},
                  msg:LANG==="tr"?`🦅 ${n} kalesine giderken loncanın sancağını da yanında götürdü. Yola çıkarken bir kese bıraktı: 2000A. "İlk vergim," dedi gülerek.`:`🦅 ${n} carried the guild's banner with him to his castle. He left a purse behind: 2000G. "My first tax," he laughed.` }) },
            ] };
          return { icon:"🦅", title:LANG==="tr"?"Gece Yarısı Mektubu":"The Midnight Letter",
            text:LANG==="tr"?`Bir gece ${n} ortadan kayboluyor. Masasında bir mektup: "Kendi krallığımı kuracağım. Benimle gelmek isteyenler gelebilir."${fn?` Ve gerçekten de, ${fn} çantalarını topluyor.`:""}`
                            :`One night ${n} vanishes. On his table, a letter: "I am going to build my own kingdom. Whoever wishes may follow."${fn?` And indeed, ${fn} ${close.length>1?"are":"is"} packing.`:""}`,
            choices:[
              { label:LANG==="tr"?"Onu durdurmaya çalış":"Try to stop him", detail:LANG==="tr"?"Belki dinler — belki de dinlemez":"He may listen — or he may not",
                resolve:(ss)=>{ if(Math.random()<0.5) return { storyStep:{cls:"Hawk",path:"returned"}, heroMod:{id:h.id,set:{redeemed:true,storyTitle:{tr:"Dönen Şahin",en:"The Returning Hawk"}}},
                    story:[SL(h,"Gitmek üzereyken lonca efendisi onu yolda yakaladı. Döndü.","On the road out, the guildmaster caught up with him. He came back.")],
                    msg:LANG==="tr"?`🦅 Onu şehrin kapısında yakaladın. Uzun süre konuştunuz. Şafakta ${n} atını geri çevirdi. Bir daha kimseyi birbirine düşürmedi.`:`🦅 You caught him at the city gate. You talked for a long time. At dawn ${n} turned his horse around. He never set anyone against each other again.` };
                  const lost=Math.round(Math.max(0,ss.gold||0)*0.12);
                  return { storyStep:{cls:"Hawk",path:"betrayal"}, leave:[h.id,...close.map(c=>c.id)], gold:-lost, renown:-10,
                    msg:LANG==="tr"?`🦅 Yetişemedin. Sabah ${n}${fn?` ve ${fn}`:""} gitmişti — kasadan ${lost}A ile birlikte. Ozanlar yıllar sonra yükselen bir şahinin şarkısını söyleyecek. Senin adın o şarkıda geçmeyecek. (−10 şöhret)`:`🦅 You were too late. By morning ${n}${fn?` and ${fn}`:""} were gone — along with ${lost}G from the coffers. Years from now bards will sing of a rising hawk. Your name won't be in that song. (−10 renown)` }; } },
              { label:LANG==="tr"?"Gitmesine izin ver":"Let him go", detail:LANG==="tr"?"Zorla tutulan kanat kırılır":"A wing held by force will break",
                resolve:()=>({ storyStep:{cls:"Hawk",path:"gone"}, leave:[h.id,...close.slice(0,1).map(c=>c.id)], renown:-5,
                  msg:LANG==="tr"?`🦅 Gitmelerine izin verdin. Kapı kapandığında salon hiç olmadığı kadar sessizdi.`:`🦅 You let them go. When the door closed, the hall was quieter than it had ever been.` }) },
            ] }; } },
    ] },
  Dragonborn: {
    hints:[{tr:"Karlı zirveler onu çağırıyor…",en:"The snowy peaks are calling him…"},
           {tr:"Ejderlerin vadisi onu bekliyor…",en:"The valley of dragons awaits him…"},
           {tr:"Kızıl bir ses uyanmak üzere…",en:"A crimson voice is about to wake…"}],
    chapters:[
      { gap:5, when:(s,h)=>(h.visited||[]).includes("frozen_peaks"),
        build:(s,h)=>{ const n=h.name; return { icon:"🐲", title:LANG==="tr"?"Dağın Sesi":"The Mountain's Voice",
          text:LANG==="tr"?`${n} Donmuş Zirveler'den döndüğünden beri uyumuyor. "Dağlarda bir ses duydum," diyor. "Kanımın içinden konuşuyordu. Ve benim adımı biliyordu." Haritada, zirvelerin ardında unutulmuş bir tapınak var.`
                          :`${n} hasn't slept since returning from the Frozen Peaks. "I heard a voice in the mountains," he says. "It spoke from inside my blood. And it knew my name." On the map, beyond the peaks, lies a forgotten temple.`,
          choices:[
            { label:LANG==="tr"?"Tapınağı araştırsın":"Let him seek the temple", detail:LANG==="tr"?"Sesin izini sürsün":"Let him follow the voice",
              resolve:()=>({ storyStep:{cls:"Dragonborn",path:"seek"}, grantXp:{ids:[h.id],amount:300}, story:[SL(h,"Unutulmuş bir tapınakta kanındaki sesin izini sürdü.","He followed the voice in his blood to a forgotten temple.")],
                msg:LANG==="tr"?`🐲 ${n} tapınaktan, duvarlarına kazınmış eski kelimelerle döndü. Okuyamıyor — ama söyleyebiliyor.`:`🐲 ${n} came back from the temple with ancient words carved on its walls. He can't read them — but he can speak them.` }) },
            { label:LANG==="tr"?"Unutmasını söyle":"Tell him to forget it", detail:LANG==="tr"?"Bazı sesler dinlenmemeli":"Some voices are best ignored",
              resolve:()=>({ storyStep:{cls:"Dragonborn",path:"deny"}, heroMod:{id:h.id,set:{fatigue:0}}, story:[SL(h,"İçindeki sesi duymazdan gelmeye çalıştı.","He tried to ignore the voice within.")],
                msg:LANG==="tr"?`🐲 ${n} başını salladı. Ama gece yarısı, avluda, kimsenin anlamadığı bir dilde mırıldandığı duyuldu.`:`🐲 ${n} nodded. But at midnight he was heard in the yard, murmuring in a tongue no one understood.` }) },
          ] }; } },
      { gap:10, when:(s,h)=>(h.visited||[]).includes("dragon_valley"),
        build:(s,h)=>{ const n=h.name; return { icon:"🐲", title:LANG==="tr"?"Ejderin Yuvası":"The Wyrm's Lair",
          text:LANG==="tr"?`Ejderha Vadisi'nde ${n} yaşlı bir ejderhanın kafatasının önünde diz çökmüş bulundu. Kafatası konuşmuş — en azından o öyle söylüyor. "Ruhumu sana bırakıyorum," demiş. "Ya al, ya göm."`
                          :`In Dragon Valley, ${n} was found kneeling before the skull of an ancient dragon. The skull spoke — or so he says. "I leave you my soul," it said. "Take it, or bury it."`,
          choices:[
            { label:LANG==="tr"?"Ruhu kucaklasın":"Let him embrace it", detail:LANG==="tr"?"Daha fazla güç — ve daha fazla ateş":"More power — and more fire",
              resolve:()=>({ storyStep:{cls:"Dragonborn",path:"embrace"}, heroMod:{id:h.id,add:{bonusSucc:0.06}}, story:[SL(h,"Kadim bir ejderin ruhunu içine aldı.","He took an ancient dragon's soul into himself.")],
                msg:LANG==="tr"?`🐲 ${n}'in gözleri bir anlığına altın rengine döndü. Sesi artık daha derin. Salon onun yanında biraz daha sıcak.`:`🐲 For a moment ${n}'s eyes turned gold. His voice is deeper now. The hall feels a little warmer near him.` }) },
            { label:LANG==="tr"?"Ruhu bastırsın":"Let him bury it", detail:LANG==="tr"?"İnsan tarafı ağır bassın":"Let his human side win",
              resolve:()=>({ storyStep:{cls:"Dragonborn",path:"suppress"}, heroMod:{id:h.id,set:{neg:{name:"Restrained",desc:"",mod:{}}}}, story:[SL(h,"İçindeki ejderi zincire vurdu.","He chained the dragon within.")],
                msg:LANG==="tr"?`🐲 ${n} kafatasını vadiye gömdü. Döndüğünde daha sessizdi — ama ilk kez, tehlike onu eskisi kadar çekmiyor gibiydi. (Lanetli özelliği kalktı.)`:`🐲 ${n} buried the skull in the valley. He came back quieter — but for the first time, danger no longer seemed drawn to him. (His Cursed trait is gone.)` }) },
          ] }; } },
      { gap:10, when:(s)=>((s.bossDefeated||{}).b_dragon_epic||0)>0 || ((s.crises||{}).dragon||{status:"locked"}).status!=="locked",
        build:(s,h,st)=>{ const n=h.name; const suppressed=(st.path||[]).includes("suppress");
          const ch=[
            { label:LANG==="tr"?"Ejderle konuşsun":"Let him speak to the wyrm", detail:LANG==="tr"?"Belki savaşmadan bitirmenin bir yolu vardır":"Perhaps it can be ended without a war",
              resolve:()=>({ storyStep:{cls:"Dragonborn",path:"voice"}, heroMod:{id:h.id,add:{bonusSucc:0.06},set:{dragonVoice:true,storyTitle:{tr:"Kızıl Ses",en:"The Crimson Voice"}}},
                story:[SL(h,"Kızıl ejderle kendi dilinde konuştu.","He spoke with the crimson wyrm in its own tongue.")],
                msg:LANG==="tr"?`🐲 ${n} dağa çıktı ve ejderle günlerce konuştu. Ne konuştuklarını kimse bilmiyor. Ama Kızıl Ejder krizinde onun sesi orduların yapamadığını yapacak. (O krizde ekibin gücü +%20)`:`🐲 ${n} climbed the mountain and spoke with the wyrm for days. No one knows what was said. But in the Crimson Wyrm crisis his voice will do what armies cannot. (+20% party power in that crisis)` }) },
            { label:LANG==="tr"?"Onu öldürsün":"Let him slay it", detail:LANG==="tr"?"Kan bağı kılıçtan güçlü değildir":"Blood is no stronger than steel",
              resolve:()=>({ storyStep:{cls:"Dragonborn",path:"slayer"}, renown:20, heroMod:{id:h.id,add:{bonusSucc:0.05},set:{storyTitle:{tr:"Kanından Dönen",en:"Kinslayer"}}},
                story:[SL(h,"Kendi kanından olanı reddetti ve ona kılıç kaldırdı.","He rejected his own kin and raised his sword against it.")],
                msg:LANG==="tr"?`🐲 ${n} dağdan yanık bir pelerin ve kırık bir dişle döndü. "Kardeşim değildi," dedi. Kimse sesindeki titremeyi duymamış gibi yaptı.`:`🐲 ${n} came down the mountain with a scorched cloak and a broken tooth. "It was no brother of mine," he said. Everyone pretended not to hear his voice shake.` }) },
          ];
          if(suppressed) ch.push({ label:LANG==="tr"?"İnsan kalsın":"Let him stay human", detail:LANG==="tr"?"Sesi duymazdan gelsin":"Let him ignore the call",
              resolve:()=>({ storyStep:{cls:"Dragonborn",path:"warden"}, heroMod:{id:h.id,add:{bonusInj:0.06},set:{storyTitle:{tr:"Dağların Bekçisi",en:"Warden of the Mountains"}}},
                story:[SL(h,"Kızıl çağrıya kulak tıkadı ve insan kaldı.","He closed his ears to the crimson call and stayed human.")],
                msg:LANG==="tr"?`🐲 ${n} pencereleri kapattı ve o gece loncayla birlikte yemek yedi. Dağ bir süre daha seslendi, sonra sustu.`:`🐲 ${n} shut the windows and ate supper with the guild that night. The mountain called a while longer, then fell silent.` }) });
          return { icon:"🐲", title:LANG==="tr"?"İki Ruh":"Two Souls",
            text:LANG==="tr"?`Kızıl ejderin sesi dağlardan geliyor ve ${n} onu anlıyor. "Bana kardeşim diyor," diye fısıldıyor. "Ona katılmamı istiyor. Ya da onu susturmamı."`
                            :`The crimson wyrm's voice rolls down from the mountains, and ${n} understands it. "It calls me brother," he whispers. "It wants me to join it. Or to silence it."`,
            choices:ch }; } },
    ] },
  GoblinSlayer: {
    hints:[{tr:"Goblin Tepeleri'ndeki avları birinin dikkatini çekecek…",en:"His hunts in the Goblin Hills will catch someone's attention…"},
           {tr:"Tepelerin gürültücü reisi düştüğünde ya da çok uzun bir avdan sonra…",en:"When the noisy chief of the hills falls, or after a very long hunt…"},
           {tr:"Savaş Reisi Grum düştüğünde son yuva açığa çıkacak…",en:"When Warchief Grum falls, the last warren will be revealed…"}],
    chapters:[
      { gap:5, when:(s,h)=>(h.goblinRuns||0)>=10,
        build:(s,h)=>{ const n=h.name; return { icon:"🪓", title:LANG==="tr"?"Yanmış Köy":"The Burned Village",
          text:LANG==="tr"?`Kapına küllere bulanmış bir kız geliyor. Köyü goblinler yüzünden yanmış. ${n} onu dinliyor, sonra tek bir soru soruyor: "Kaç tane?" Kız bilmiyor. ${n} kılıcını biliyor.`
                          :`A girl covered in ash comes to your door. Goblins burned her village. ${n} listens, then asks one question: "How many?" She doesn't know. ${n} is already sharpening his blade.`,
          choices:[
            { label:LANG==="tr"?"Köyü korusun":"Let him guard the village", detail:LANG==="tr"?"Geride kalanları koru":"Protect those who remain",
              resolve:()=>({ storyStep:{cls:"GoblinSlayer",path:"protect"}, renown:5, story:[SL(h,"Yanmış bir köyün kalanını korudu.","He guarded what was left of a burned village.")],
                msg:LANG==="tr"?`🪓 ${n} üç gece köyün çitinde nöbet tuttu. Sonra hiçbir şey söylemeden döndü. Kız arkasından el salladı; o dönüp bakmadı. Ama adımları bir an yavaşladı.`:`🪓 ${n} kept watch at the village fence for three nights. Then he left without a word. The girl waved after him; he didn't look back. But his steps slowed, just for a moment.` }) },
            { label:LANG==="tr"?"Yuvaya saldırsın":"Let him strike the nest", detail:LANG==="tr"?"Kökünden kazı":"Tear it out by the roots",
              resolve:()=>({ storyStep:{cls:"GoblinSlayer",path:"hunt"}, gold:300, story:[SL(h,"Köyü yakan yuvayı kökünden kazıdı.","He tore out the nest that burned the village.")],
                msg:LANG==="tr"?`🪓 ${n} döndüğünde kılıcı da zırhı da simsiyahtı. Köyün verdiği keseyi masaya bıraktı. "Benim işim goblinler," dedi. "Para değil." (+300A)`:`🪓 When ${n} returned, his blade and armour were black. He dropped the village's purse on the table. "My work is goblins," he said. "Not coin." (+300G)` }) },
          ] }; } },
      { gap:10, when:(s,h)=>((s.bossDefeated||{}).b_goblin_mini||0)>0 || (h.goblinRuns||0)>=25,
        build:(s,h)=>{ const n=h.name; const m=s.adventurers.filter(o=>o.id!==h.id).sort((x,y)=>y.level-x.level)[0]; const mn=m?m.name:(LANG==="tr"?"biri":"someone");
          return { icon:"🪓", title:LANG==="tr"?"Yaşlı Avcının Sözü":"The Old Hunter's Word",
          text:LANG==="tr"?`Meyhanede tek gözlü, yaşlı bir avcı ${n}'in masasına oturuyor. "Senin gibiydim," diyor. "Sonra bir gün etrafıma baktım ve kimse kalmamıştı. Bir bira içer misin?" ${n} kadehe bakıyor. Uzun süre.`
                          :`In the tavern, an old one-eyed hunter sits down at ${n}'s table. "I was like you," he says. "Then one day I looked around and there was no one left. Will you have an ale?" ${n} stares at the cup. For a long time.`,
          choices:[
            { label:LANG==="tr"?"Otursun, içsin":"Let him sit and drink", detail:LANG==="tr"?"Bir masa, bir kadeh, bir başlangıç":"A table, a cup, a beginning",
              resolve:()=>({ storyStep:{cls:"GoblinSlayer",path:"warm"}, bonds:m?[{a:h.id,b:m.id,delta:20}]:[], story:[SL(h,"Yaşlı bir avcıyla, sonra da loncadan biriyle aynı masaya oturdu.","He shared a table with an old hunter — and then with someone from the guild.")],
                msg:LANG==="tr"?`🪓 ${n} birasını yarıya kadar içti. Konuşmadı ama kalkmadı da. Ertesi akşam ${mn} onun masasına oturduğunda, onu kovmadı.`:`🪓 ${n} drank half his ale. He didn't speak, but he didn't leave either. The next evening, when ${mn} sat down at his table, he didn't send them away.` }) },
            { label:LANG==="tr"?"Avına dönsün":"Back to the hunt", detail:LANG==="tr"?"Goblinler beklemez":"Goblins don't wait",
              resolve:()=>({ storyStep:{cls:"GoblinSlayer",path:"cold"}, heroMod:{id:h.id,set:{goblinMastery:true}}, story:[SL(h,"Bir masaya oturmak yerine yeniden ava çıktı.","Instead of sitting down, he went back to the hunt.")],
                msg:LANG==="tr"?`🪓 ${n} kalktı. "Goblinler beklemez," dedi. Yaşlı avcı arkasından başını iki yana salladı. (Goblin Tepeleri'nde +%15 başarı)`:`🪓 ${n} stood up. "Goblins don't wait," he said. The old hunter shook his head behind him. (+15% success in the Goblin Hills)` }) },
          ] }; } },
      { gap:10, when:(s)=>((s.bossDefeated||{}).b_goblin_epic||0)>0,
        build:(s,h,st)=>{ const n=h.name; const warm=(st.path||[]).includes("warm"); const ch=[];
          if(warm) ch.push({ label:LANG==="tr"?"Yanına yoldaş alsın":"Let him take companions", detail:LANG==="tr"?"İlk kez yalnız olmayacak — ama onlar da risk altında":"For once he won't be alone — but they share the risk",
            resolve:(ss)=>{ const others=ss.adventurers.filter(a=>a.id!==h.id&&a.status==="idle"); const hurt=others.length?[pick(others).id]:[];
              return { storyStep:{cls:"GoblinSlayer",path:"breaker"}, injure:hurt, renown:15, heroMod:{id:h.id,add:{bonusInj:0.05},set:{curseBroken:true,neg:{name:"Unbound",desc:"",mod:{}},storyTitle:{tr:"Yuva Yıkan",en:"Warren-Breaker"}}},
                story:[SL(h,"Son yuvayı yoldaşlarıyla birlikte yıktı. Artık yalnız avlanmıyor.","He brought down the last warren with his companions. He no longer hunts alone.")],
                msg:LANG==="tr"?`🪓 Son yuva çöktüğünde ${n} ve yoldaşları tozun içinden çıktı. Biri şaka yaptı. ${n} gülmedi — ama dudağının kenarı kıpırdadı. Artık ekiplerle sefere çıkabilir.`:`🪓 When the last warren collapsed, ${n} and his companions walked out of the dust. Someone cracked a joke. ${n} didn't laugh — but the corner of his mouth twitched. He can now join a party.` }; } });
          ch.push({ label:LANG==="tr"?"Yalnız bitirsin":"Let him finish it alone", detail:LANG==="tr"?"Nasıl başladıysa öyle bitsin":"End it the way it began",
            resolve:()=>({ storyStep:{cls:"GoblinSlayer",path:"nightmare"}, renown:10, heroMod:{id:h.id,add:{bonusSucc:0.04},set:{goblinMastery:true,storyTitle:{tr:"Goblin Kâbusu",en:"The Goblin Nightmare"}}},
              story:[SL(h,"Son yuvaya tek başına girdi ve tek başına çıktı.","He went into the last warren alone and came out alone.")],
              msg:LANG==="tr"?`🪓 ${n} yuvaya tek başına girdi. Üç gün sonra çıktığında tepelerde tek bir goblin sesi kalmamıştı. Goblin anneler artık çocuklarını onun adıyla korkutuyor.`:`🪓 ${n} went into the warren alone. When he came out three days later, not one goblin voice remained in the hills. Goblin mothers now frighten their young with his name.` }) });
          return { icon:"🪓", title:LANG==="tr"?"Son Yuva":"The Last Warren",
            text:LANG==="tr"?`Savaş Reisi Grum düştü, ama tepelerin altında daha derin, daha eski bir yuva var. ${n} haritayı masaya seriyor. "Bu, sonuncusu," diyor. Sesinde ilk kez yorgunluk var.`
                            :`Warchief Grum has fallen, but beneath the hills lies a deeper, older warren. ${n} spreads the map on the table. "This is the last one," he says. For the first time, there is weariness in his voice.`,
            choices:ch }; } },
    ] },
};
// daily check: returns a story event for the first unique hero whose next chapter is due (or null)
function storyCheck(s){
  for(const cls of Object.keys(STORY_HEROES)){
    const h=(s.adventurers||[]).find(a=>a.cls===cls && a.status==="idle"); if(!h) continue;
    const st=(s.stories||{})[cls]||{stage:0}; if(st.stage>=3) continue;
    const ch=STORY_HEROES[cls].chapters[st.stage];
    const since=st.stage===0 ? (s.day-(h.joinDay??s.day)) : (s.day-(st.lastDay||0));
    if(since<ch.gap) continue;
    let ok=false; try{ ok=ch.when(s,h,st); }catch(e){ ok=false; }
    if(!ok || Math.random()>=0.35) continue;
    return { id:"story_"+cls, kind:"story", uid:uid(), ...ch.build(s,h,st) };
  }
  return null;
}

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
  { id:"a_firstcraft", icon:"📋", name:{en:"Honest Work",tr:"Alın Teri"}, desc:{en:"Fill your first request",tr:"İlk isteği karşıla"}, check:s=>(s.stats&&s.stats.requests>=1) },
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
  { id:"a_renown10", icon:"⭐", name:{en:"Making a Name",tr:"Ad Yapıyoruz"}, desc:{en:"Become Locally Known",tr:"Mahallede Bilinen ol"}, check:s=>titleIndex(s.renown)>=1 },
  { id:"a_renown40", icon:"🌟", name:{en:"Talk of the Town",tr:"Dilden Dile"}, desc:{en:"Become Known in the Region",tr:"Bölgede Tanınan ol"}, check:s=>titleIndex(s.renown)>=2 },
  { id:"a_renown80", icon:"✨", name:{en:"Legend of the Realm",tr:"Diyarın Efsanesi"}, desc:{en:"Become the Talk of the Realm",tr:"Diyarda Söz Edilen ol"}, check:s=>titleIndex(s.renown)>=3 },
  { id:"a_renown150", icon:"👑", name:{en:"Living Legend",tr:"Yaşayan Efsane"}, desc:{en:"Become Favored of the Crown",tr:"Krallığın Gözdesi ol"}, check:s=>titleIndex(s.renown)>=4 },
  { id:"a_renown500", icon:"🏛️", name:{en:"Sung by Bards",tr:"Ozanların Dilinde"}, desc:{en:"Become Legendary",tr:"Efsanevi bir lonca ol"}, check:s=>titleIndex(s.renown)>=5 },
  { id:"a_spend", icon:"🎁", name:{en:"Cashing In",tr:"Şanını Harcamak"}, desc:{en:"Spend fame in the Fame Vault",tr:"Şöhret Hazinesi'nden bir şey al"}, check:s=>(s.renownSpent||0)>0 },
  { id:"a_crest", icon:"🛡️", name:{en:"Under Our Banner",tr:"Sancağımız Altında"}, desc:{en:"Raise a new guild crest",tr:"Yeni bir lonca arması seç"}, check:s=>(s.crests||[]).length>1 },
  { id:"a_epithet", icon:"🏷️", name:{en:"What's in a Name",tr:"Adı Çıkmış"}, desc:{en:"Give a hero an epithet",tr:"Bir kahramana lakap tak"}, check:s=>s.adventurers.some(a=>a.epithet!=null) },
  { id:"a_omen", icon:"🔥", name:{en:"Opportunist",tr:"Fırsatçı"}, desc:{en:"Fill 5 requests boosted by realm news",tr:"Diyar haberleriyle değerlenmiş 5 isteği karşıla"}, check:s=>((s.stats&&s.stats.omenFills)||0)>=5 },
  { id:"a_chronicle", icon:"📖", name:{en:"Quite a Tale",tr:"Anlatacak Çok Şeyi Var"}, desc:{en:"A hero with 10 lines in their life story",tr:"Hayat hikâyesinde 10 satır olan bir kahraman"}, check:s=>s.adventurers.some(a=>(a.chronicle||[]).length>=10) },
  { id:"a_retire", icon:"🏡", name:{en:"A Rest Well Earned",tr:"Hak Edilmiş Huzur"}, desc:{en:"Give a hero an honorable farewell",tr:"Bir kahramanı onurla emekliye ayır"}, check:s=>(s.retired||[]).some(r=>r.kind==="retired") },
  { id:"a_academy", icon:"🎓", name:{en:"The Academy",tr:"Akademi"}, desc:{en:"Have 3 retired trainers",tr:"3 emekli eğitmenin olsun"}, check:s=>(s.mentors||[]).length>=3 },
  { id:"a_away", icon:"🕯️", name:{en:"It Runs Itself",tr:"Kendi Kendine Dönüyor"}, desc:{en:"Come back after an hour or more away",tr:"Bir saatten uzun süre sonra geri dön"}, check:s=>!!(s.stats&&s.stats.longAway) },
  { id:"a_crisis_undead", icon:"🧟", name:{en:"Let the Dead Rest",tr:"Ölüler Huzur Bulsun"}, desc:{en:"End the Army of the Dead",tr:"Ölüler Ordusu krizini sona erdir"}, check:s=>((s.crises||{}).undead||{}).status==="won" },
  { id:"a_crisis_dragon", icon:"🐉", name:{en:"Wyrmslayers",tr:"Ejder Avcıları"}, desc:{en:"End the Crimson Wyrm",tr:"Kızıl Ejder krizini sona erdir"}, check:s=>((s.crises||{}).dragon||{}).status==="won" },
  { id:"a_crisis_throne", icon:"👑", name:{en:"Kingmakers",tr:"Kral Yapıcılar"}, desc:{en:"End the War of the Crown",tr:"Taht Kavgası krizini sona erdir"}, check:s=>((s.crises||{}).throne||{}).status==="won" },
  { id:"a_crisis_void", icon:"🌌", name:{en:"Sealers of the Rift",tr:"Yarığı Mühürleyenler"}, desc:{en:"Seal the Void Rift",tr:"Boşluk Yarığı'nı mühürle"}, check:s=>((s.crises||{}).void||{}).status==="won" },
  { id:"a_finale", icon:"🌅", name:{en:"The Legend of the Guild",tr:"Loncanın Efsanesi"}, desc:{en:"Resolve all four realm crises",tr:"Dört diyar krizinin hepsini çöz"}, check:s=>CRISES.every(C=>((s.crises||{})[C.id]||{}).status==="won") },
  { id:"a_story", icon:"📜", name:{en:"A Tale Worth Telling",tr:"Anlatmaya Değer"}, desc:{en:"Complete a legendary hero's personal story",tr:"Bir efsanevi kahramanın kişisel hikâyesini tamamla"}, check:s=>Object.values(s.stories||{}).some(x=>x.stage>=3) },
  { id:"a_allstories", icon:"📚", name:{en:"The Four Legends",tr:"Dört Efsane"}, desc:{en:"Complete all four personal stories",tr:"Dört kişisel hikâyenin hepsini tamamla"}, check:s=>Object.keys(STORY_HEROES).every(c=>((s.stories||{})[c]||{}).stage>=3) },
  { id:"a_debt", icon:"💸", name:{en:"Living on Credit",tr:"Veresiye Hayat"}, desc:{en:"Fall into debt",tr:"Borca gir"}, check:s=>s.gold<0 },
  { id:"a_thief", icon:"🪙", name:{en:"In Plain Sight",tr:"Göz Göre Göre"}, desc:{en:"Keep a hero who stole from you 10 times",tr:"Kasadan 10 kez çalan birini loncada tut"}, check:s=>s.adventurers.some(a=>(a.thefts||0)>=10) },
  // --- Günler / hayatta kalma ---
  { id:"a_day10", icon:"📅", name:{en:"Two Weeks' Notice",tr:"İki Haftalık Süre"}, desc:{en:"Survive to day 10",tr:"10. güne ulaş"}, check:s=>s.day>=10 },
  { id:"a_day30", icon:"🗓️", name:{en:"Seasoned",tr:"Pişmiş"}, desc:{en:"Survive to day 30",tr:"30. güne ulaş"}, check:s=>s.day>=30 },
  { id:"a_day100", icon:"🎂", name:{en:"Centennial",tr:"Yüzüncü Yıl"}, desc:{en:"Survive to day 100",tr:"100. güne ulaş"}, check:s=>s.day>=100 },
  // --- Bina / yükseltme ---
  { id:"a_firstupg", icon:"🔨", name:{en:"Home Improvement",tr:"Ev Tadilatı"}, desc:{en:"Upgrade any building",tr:"Herhangi bir binayı yükselt"}, check:s=>Object.values(s.buildings).some(v=>v>=1) },
  { id:"a_tier3", icon:"🏰", name:{en:"Climbing the Ranks",tr:"Basamakları Tırman"}, desc:{en:"Reach guild tier 3",tr:"Lonca kademesi 3'e ulaş"}, check:s=>BUILDINGS.treasury.levels[s.buildings.treasury].tier>=3 },
  { id:"a_tier5", icon:"👑", name:{en:"Top of the World",tr:"Zirvedeyiz"}, desc:{en:"Reach guild tier 5",tr:"Lonca kademesi 5'e ulaş"}, check:s=>BUILDINGS.treasury.levels[s.buildings.treasury].tier>=5 },
  { id:"a_monument", icon:"🗿", name:{en:"Set in Stone",tr:"Taşa Kazındı"}, desc:{en:"Raise a guild monument",tr:"Bir lonca anıtı dik"}, check:s=>((s.buildings&&s.buildings.monuments)||0)>0 },
  { id:"a_maxbuild", icon:"🏛️", name:{en:"Master Builder",tr:"Usta Mimar"}, desc:{en:"Max out every upgrade of one building group",tr:"Bir yapı grubunun bütün geliştirmelerini sonuna kadar yükselt"}, check:s=>Object.keys(BUILDING_GROUPS).some(g=>{ const ks=Object.keys(BUILDINGS).filter(k=>BUILDINGS[k].group===g); return ks.length>0 && ks.every(k=>(s.buildings[k]||0)>=BUILDINGS[k].levels.length-1); }) },
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
  { id:"a_allrare", icon:"🎴", name:{en:"Gotta Catch 'Em All",tr:"Hepsini Topla"}, desc:{en:"Have all 5 rare classes at once",tr:"5 nadir sınıfın hepsi aynı anda"}, check:s=>{const have=new Set(s.adventurers.filter(a=>CLASSES[a.cls].rare&&!CLASSES[a.cls].unique).map(a=>a.cls));return have.size>=5;} },
  { id:"a_relic", icon:"⚜️", name:{en:"Relic Hunter",tr:"Emanet Avcısı"}, desc:{en:"Earn a class relic",tr:"Bir sınıf emaneti kazan"}, check:s=>s.adventurers.some(a=>a.boon) },
  // --- İstek panosu / ekonomi derinliği ---
  { id:"a_craft50", icon:"🤝", name:{en:"Trusted Supplier",tr:"Güvenilir Tedarikçi"}, desc:{en:"Fill 25 requests",tr:"25 isteği karşıla"}, check:s=>(s.stats&&s.stats.requests>=25) },
  { id:"a_craft250", icon:"🏦", name:{en:"Merchant Prince",tr:"Tüccar Prensi"}, desc:{en:"Fill 100 requests",tr:"100 isteği karşıla"}, check:s=>(s.stats&&s.stats.requests>=100) },
  { id:"a_quest50", icon:"🧭", name:{en:"Frequent Flyer",tr:"Sık Yolcu"}, desc:{en:"Complete 50 expeditions",tr:"50 sefer tamamla"}, check:s=>(s.stats&&s.stats.quests>=50) },
  { id:"a_quest200", icon:"🗺️", name:{en:"Been There, Done That",tr:"Gördük Geçirdik"}, desc:{en:"Complete 200 expeditions",tr:"200 sefer tamamla"}, check:s=>(s.stats&&s.stats.quests>=200) },
  { id:"a_smith", icon:"🌟", name:{en:"Everyone's Favorite",tr:"Herkesin Gözdesi"}, desc:{en:"Max out favor with any buyer group",tr:"Bir alıcı grubunun gözdesi ol (en üst itibar)"}, check:s=>!!(s.requests&&s.requests.favor&&Object.values(s.requests.favor).some(f=>f>=25)) },
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
let T = {
  bg:"#1a1410", panel:"#241c15", panel2:"#2e241A", border:"#3d2f20", borderLit:"#5a4530",
  gold:"#e0a23c", goldDim:"#9a7228", ink:"#e8dcc8", inkDim:"#a89878", inkFaint:"#6b5d48",
  green:"#6fae6f", red:"#c0563f", blue:"#5b9bd5", parchment:"#d8c8a8",
};
// colorblind-friendly overrides (red-green): green→teal/cyan, red→amber-orange, blue→brighter
const T_NORMAL = { green:"#6fae6f", red:"#c0563f", blue:"#5b9bd5" };
const T_CB     = { green:"#4db8ff", red:"#ff9500", blue:"#c77dff" };
function applyColorblind(on){
  const src = on ? T_CB : T_NORMAL;
  T.green = src.green; T.red = src.red; T.blue = src.blue;
}
try{ if(typeof localStorage!=="undefined" && localStorage.getItem("guildmaster_cb")==="1") applyColorblind(true); }catch(e){}
const font = "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif";

// ==================== §ROOT · ANA BİLEŞEN & OYUN DÖNGÜSÜ ====================
const SAVE_KEY = "guildmaster_save_v1";

// ==================== §TICK · OYUN DÖNGÜSÜ ====================
// One second of game time. `offline` = simulated while the app was closed (gentler: no deaths).
function stepGame(s, offline){
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
      const ctx = partyContext(party, ns);
      const { partyLoot, partyInjury } = ctx;
      let lootGained={}, leveled=[], injured=[], died=[], failed=0, storageFull=false;
      party.forEach(a=>{
        const cs=CLASSES[a.cls];
        const odds = memberOdds(a, party, region, ctx, ns);
        const success = Math.random() < odds.succ;
          a.runs=(a.runs||0)+1;
          if(!(a.visited||[]).includes(region.id)) a.visited=[...(a.visited||[]), region.id];
          if(region.id==="goblin_hills") a.goblinRuns=(a.goblinRuns||0)+1;
          if(party.length===1 && region.danger>=3 && success) a.soloDanger=(a.soloDanger||0)+1;
          if(a.runs===1) chron(a, ns.day, ()=>LANG==="tr"?`İlk seferine çıktı: ${regionName(region)}.`:`First expedition: ${regionName(region)}.`);
          else if(region.tier>(a.bestTier??0)) chron(a, ns.day, ()=>LANG==="tr"?`İlk kez ${regionName(region)} bölgesine ayak bastı.`:`Set foot in ${regionName(region)} for the first time.`);
          if(region.tier>(a.bestTier??-1)) a.bestTier=region.tier;
          if([25,50,100,200].includes(a.runs)){ const n=a.runs; chron(a, ns.day, ()=>LANG==="tr"?`${n}. seferini tamamladı.`:`Completed expedition number ${n}.`); }
        if(success){
          const lootMult = posMul(a,"lootMult")*(1+partyLoot)*(a.boon==="shadowCloak"?1.3:1)*(1+(bLv(ns.buildings,"stable_carts").lootBonus||0))*legendMod(ns).loot;
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
          const xpBase = (35+region.danger*18) * (1 + region.duration/200) * (1+(bLv(ns.buildings,"train_mentor").xpBonus||0)) * mentorBonus(ns).xpMult; // longer trips grant more growth
          const xpGain = Math.floor(xpBase*(posMul(a,"xpMult"))*((a.neg.mod.xpMult||1))*xpMultRel);
          a.xp += xpGain;
                const didLevel = levelUpHero(a, ns.day)>0;
          if(didLevel) leveled.push(a.name+" → Lv"+a.level);
        } else {
          failed++;
          if(Math.random()<odds.inj){
            // on a failed roll in dangerous regions, injury can instead become death
            const deathChance = odds.dc;
            if(deathChance>0 && Math.random()<deathChance){
              if(a.boon==="boneRelic"){
                // the Bone Relic shatters, dragging its bearer back from death — once
                chron(a, ns.day, ()=>LANG==="tr"?`${regionName(region)} bölgesinde ölümden döndü — Kemik Emaneti onun yerine parçalandı.`:`Cheated death in ${regionName(region)} — the Bone Relic shattered in their place.`);
                a.boon=null; a.status="injured"; a.injuryUntil=ns.elapsed+Math.round(region.danger*40*(bLv(ns.buildings,"inf_ward").injuryMult||1)); a.hp=Math.max(1,Math.floor(a.maxHp*0.2));
                injured.push(a.name);
                logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`☠️ ${a.name} ölmeliydi — ama Kemik Emaneti parçalanıp onu ölümün eşiğinden geri çekti.`:`☠️ ${a.name} should have died — but the Bone Relic shattered and wrenched them back from death's door.`});
              } else {
                if(offline){ a.status="injured"; a.injuryUntil=ns.elapsed+Math.round(region.danger*80); a.hp=1; injured.push(a.name); }
                      else { a.dead=true; died.push(a); }
              }
            } else {
              a.status="injured"; a.injuryUntil=ns.elapsed+Math.round(region.danger*40*(bLv(ns.buildings,"inf_ward").injuryMult||1));
              a.hp=Math.max(1,Math.floor(a.maxHp*0.3));
              if(region.danger>=3) chron(a, ns.day, ()=>LANG==="tr"?`${regionName(region)} bölgesinde ağır yaralandı.`:`Badly wounded in ${regionName(region)}.`);
              injured.push(a.name);
            }
          }
        }
        if(!a.dead && a.status!=="injured"){ a.status="idle"; a.task="rest"; }
        a.fatigue = Math.min(100, (a.fatigue||0) + (12 + region.danger*3)*posMul(a,"fatigueMult")*(a.neg.mod.fatigueMult||1)); // expeditions tire you out
        a.questId=null;
      });
      // ---- rare drops: rolled ONCE per expedition (not per member), only if someone succeeded ----
      const anySuccess = failed < party.length;
      if(anySuccess){
        const bestLoot = Math.max(...party.filter(a=>!a.dead).map(a=>posMul(a,"lootMult")*(1+partyLoot)), 1);
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
            chronicle:[...(d.chronicle||[]), {d:ns.day, ...bothLang(()=>LANG==="tr"?`${regionName(region)} bölgesinde düştü.`:`Fell in ${regionName(region)}.`)}],
            rank:rankForLevel(d.level).name, eulogy, runs:(()=>{let m=0;ns.adventurers.forEach(o=>{if(o.id!==d.id)m=Math.max(m,getTogether(ns.rels,d.id,o.id));});return m;})() });
          // grief: close allies in the guild gain a temporary "Grieving" sorrow (deeper for closer bonds)
          ns.adventurers.forEach(other=>{
            if(other.id!==d.id && !other.dead){
              const sc=getRel(ns.rels,d.id,other.id);
              if(sc>=40){ other.grief = ns.elapsed + (sc>=70?360:240); chron(other, ns.day, ()=>LANG==="tr"?`${d.name}'in ölümünün yasını tuttu.`:`Mourned the death of ${d.name}.`); } // closer = longer grief
            }
          });
        });
        ns.adventurers = ns.adventurers.filter(a=>!deadIds.includes(a.id));
        { const bp=bloodPrice(ns, died); if(bp) logAdds.push({t:ns.elapsed,msg:bp}); }
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
            const chem=chemistry(A.id,B.id);
            let delta = rint(-1,2) + (chem>0.45?1:chem<-0.45?-2:chem<-0.15?-1:0); // shared roads amplify whatever is between them
            if(failed===0 && Math.random()<0.5) delta += 1; // flawless run sometimes deepens it
            if(injured.includes(A.name)||injured.includes(B.name)) delta -= 2; // trauma strains
            // trait chemistry nudges it either way
            if(A.neg.name===B.neg.name) delta -= 1;
            if(A.pos.name===B.pos.name) delta += 1;
            if(A.neg.name==="Arrogant"||B.neg.name==="Arrogant") delta -= 1;
            // 🦅 Hawk of Darkness: bonds fast with its own partymates, but poisons bonds between OTHERS
            const hawkInParty = survivors.some(x=>x.cls==="Hawk"); const hawkPoisons = survivors.some(x=>x.cls==="Hawk"&&!x.redeemed);
            if(hawkInParty){
              if(A.cls==="Hawk"||B.cls==="Hawk") delta += 3; // the Hawk charms its companions quickly
              else if(hawkPoisons) delta -= 2; // its shadow sows discord among everyone else (unless redeemed)
            }
            if(delta!==0){
            const before = getRel(ns.rels,A.id,B.id);
            const after = bumpRel(ns.rels,A.id,B.id,delta*REL_SPEED,ns.elapsed);
            // emergent events on crossing thresholds
            const rt=relType(after,A,B), rtBefore=relType(before,A,B);
            if(rt && (!rtBefore || rt.type!==rtBefore.type)){
              if(rt.type==="Romance") logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`💞 ${A.name} ile ${B.name}, ${regionName(region)} bölgesindeki vakitlerinin ardından yakınlaştı.`:`💞 ${A.name} and ${B.name} have grown close after their time in ${regionName(region)}.`});
              else if(rt.type==="Close Friend") logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`🤝 ${A.name} ile ${B.name} artık ayrılmaz yoldaşlar.`:`🤝 ${A.name} and ${B.name} are now inseparable companions.`});
              else if(rt.type==="Bitter Rival") logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`💢 ${A.name} ile ${B.name} artık birbirine katlanamıyor.`:`💢 ${A.name} and ${B.name} can no longer stand each other.`});
              else if(rt.type==="Mentor") logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`🎓 ${A.level>B.level?A.name:B.name}, ${A.level>B.level?B.name:A.name}'i kanadının altına aldı.`:`🎓 ${A.level>B.level?A.name:B.name} has taken ${A.level>B.level?B.name:A.name} under their wing.`});
              if(rt.type==="Romance"){ chron(A,ns.day,()=>LANG==="tr"?`${B.name} ile aşk yaşamaya başladı.`:`Fell in love with ${B.name}.`); chron(B,ns.day,()=>LANG==="tr"?`${A.name} ile aşk yaşamaya başladı.`:`Fell in love with ${A.name}.`); }
              else if(rt.type==="Close Friend"){ chron(A,ns.day,()=>LANG==="tr"?`${B.name} ile can dostu oldu.`:`Became sworn friends with ${B.name}.`); chron(B,ns.day,()=>LANG==="tr"?`${A.name} ile can dostu oldu.`:`Became sworn friends with ${A.name}.`); }
              else if(rt.type==="Bitter Rival"){ chron(A,ns.day,()=>LANG==="tr"?`${B.name} ile ezeli rakip oldu.`:`Became bitter rivals with ${B.name}.`); chron(B,ns.day,()=>LANG==="tr"?`${A.name} ile ezeli rakip oldu.`:`Became bitter rivals with ${A.name}.`); }
              else if(rt.type==="Mentor"){ const M=A.level>B.level?A:B, P=M===A?B:A; chron(M,ns.day,()=>LANG==="tr"?`${P.name}'i kanatları altına aldı.`:`Took ${P.name} under their wing.`); chron(P,ns.day,()=>LANG==="tr"?`${M.name}'in öğrencisi oldu.`:`Became ${M.name}'s protégé.`); }
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
            survivors.forEach(sv=>chron(sv, ns.day, ()=>LANG==="tr"?`${bossName(boss)} yenildi — o da oradaydı.`:`Was there when ${bossName(boss)} fell.`));
            // ⚜️ epic bosses sometimes hoard a class relic
            if(boss.tier==="epic" && Math.random()<0.12){
              const cands=ns.adventurers.filter(a=>!a.boon && RELIC_REQUESTS.some(rr=>rr.cls===a.cls)).sort((x,y)=>y.level-x.level);
              if(cands.length){ const h=cands[0]; const rr=RELIC_REQUESTS.find(x=>x.cls===h.cls);
                ns.adventurers=ns.adventurers.map(a=>{ if(a.id!==h.id) return a; const na={...a,boon:rr.boon}; chron(na, ns.day, ()=>LANG==="tr"?`${bossName(boss)}'in hazinesinden ${itemName(rr.item)} ona kaldı.`:`Claimed the ${itemName(rr.item)} from ${bossName(boss)}'s hoard.`); return na; });
                logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`⚜️ ${bossName(boss)}'in hazinesinden ${itemName(rr.item)} çıktı! ${h.name} artık onun taşıyıcısı — ${boonDesc(rr.boon).toLowerCase()}.`:`⚜️ The ${itemName(rr.item)} turned up in ${bossName(boss)}'s hoard! ${h.name} now bears it — ${boonDesc(rr.boon).toLowerCase()}.`}); } }
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
        const stillReady = q.party.every(id=>{ const a=ns.adventurers.find(x=>x.id===id); return a && a.status==="idle" && (a.fatigue||0)<90; });
        const exhausted = q.party.some(id=>{ const a=ns.adventurers.find(x=>x.id===id); return a && a.status==="idle" && (a.fatigue||0)>=90; });
        if(stillReady){
          q.party.forEach(id=>{ const a=ns.adventurers.find(x=>x.id===id); if(a){a.status="questing";a.questId=region.id;} });
          ns.quests.push({id:uid(),regionId:region.id,party:q.party,startAt:ns.elapsed,endAt:ns.elapsed+q.duration,repeatLeft:q.repeatLeft-1,duration:q.duration});
        } else {
          logAdds.push({t:ns.elapsed, msg: exhausted
            ? (LANG==="tr"?`😴 Ekip bitkin düştü — ${regionName(region)} seferleri durduruldu, herkes dinlenmeye çekildi.`:`😴 The party is exhausted — runs to ${regionName(region)} halted, everyone is resting.`)
            : (LANG==="tr"?`↩️ ${regionName(region)} bölgesine tekrar sefer iptal edildi — bir üye yaralı ya da meşgul.`:`↩️ Repeat run to ${regionName(region)} cancelled — a member is hurt or busy.`)});
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
    let patrolGold=0, patrolRenownAcc=0, patrolCount=0, taskChanged=false;
    const _restBonus = bLv(ns.buildings||s.buildings,"dorm_beds").restBonus||0;
    const adv3=(ns.adventurers||s.adventurers).map(a=>{
      if(a.status==="injured" && (a.fatigue||0)>0){ taskChanged=true; return {...a, fatigue:Math.max(0,a.fatigue-(6+_restBonus))}; } // bed rest
      if(a.status!=="idle") return a;
      const t=a.task||"rest"; let na={...a};
      const workTire=(base)=>{ na.fatigue=Math.min(100,(na.fatigue||0)+base*posMul(na,"fatigueMult")*(na.neg.mod.fatigueMult||1));
        if(na.fatigue>=90){ na.autoRest=t; na.task="rest"; } };
      if(t==="rest"){ if(na.fatigue>0){ na.fatigue=Math.max(0,na.fatigue-(6+_restBonus)); taskChanged=true; }
        if(na.autoRest && na.fatigue<=10){ na.task=na.autoRest; na.autoRest=null; taskChanged=true; } // rested — back to work
        if(na.hp<na.maxHp){ na.hp=Math.min(na.maxHp,na.hp+Math.ceil(na.maxHp*(0.02+(bLv(ns.buildings||s.buildings,"dorm_bath").healBonus||0)))); taskChanged=true; } }
            else if(t==="train"){ na.xp=(na.xp||0)+(bLv(ns.buildings||s.buildings,"train_dummies").trainXp||3)+mentorBonus(s).trainXp; taskChanged=true; workTire(2);
              const gained=levelUpHero(na, ns.day); if(gained) logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`⬆️ ${na.name} talimde Lv ${na.level} oldu.`:`⬆️ ${na.name} reached Lv ${na.level} in training.`}); }
      else if(t==="patrol"){ patrolGold+=(bLv(ns.buildings||s.buildings,"watch_tower").patrolGold||1); patrolCount++; taskChanged=true; workTire(3); }
      return na;
    });
    if(taskChanged||patrolGold>0) ns.adventurers=adv3;
    // word of mouth: a few patrols help, a crowd adds nothing more (max ~6 renown per real hour)
    patrolRenownAcc = 0.003*Math.min(3,patrolCount);
    // patrolling brings in petty coin & word-of-mouth
    if(patrolGold>0){ const acc=(ns._patrolGold||s._patrolGold||0)+patrolGold; const whole=Math.floor(acc); ns._patrolGold=acc-whole; ns.gold = ns.gold + whole;
      ns._patrolRenown = (ns._patrolRenown||s._patrolRenown||0) + patrolRenownAcc;
      if(ns._patrolRenown>=1){ const r=Math.floor(ns._patrolRenown); ns.renown=(ns.renown||0)+r; ns._patrolRenown-=r; }
    }
  }
  // daily upkeep every 120s = 1 day
  if(ns.elapsed - ns.lastUpkeep >= 120){
    ns.lastUpkeep = ns.elapsed; ns.day = s.day+1;
    const dorm = bLv(ns.buildings,"dorm_comfort");
    const tav = bLv(ns.buildings,"tav_cellar");
    let income=0, wages=0, stolen=0;
    (ns.adventurers||s.adventurers).forEach(a=>{
      income += Math.round(dorm.rentPerHead*posMul(a,"rentMult"));
      income += Math.round(tav.foodPerHead*(a.neg.mod.foodMult??1));
      wages += Math.round(a.wage*posMul(a,"wageMult")*(a.neg.mod.wageMult||1)*(bLv(ns.buildings,"guild_accountant").wageMult||1)*legendMod(ns).wage);
            if(a.neg.mod.thief && Math.random()<0.35){ const st=rint(4,10)+Math.floor(a.level/2); stolen+=st;
              ns.adventurers=(ns.adventurers===s.adventurers?s.adventurers.map(x=>({...x})):ns.adventurers);
              const me=ns.adventurers.find(x=>x.id===a.id); if(me){ me.thefts=(me.thefts||0)+1; if(me.thefts===1||me.thefts%5===0){ const n=me.thefts; chron(me,ns.day,()=>LANG==="tr"?(n===1?"Kasadan ilk kez para aşırdı.":`Kasadan ${n}. kez para aşırdı.`):(n===1?"Pinched coin from the coffers for the first time.":`Pinched from the coffers for the ${n}th time.`)); } }
        logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`🪙 Kasadan ${st}A eksik çıktı… ${a.name} gözlerini kaçırıyor.`:`🪙 ${st}G went missing from the coffers… ${a.name} won't meet your eye.`}); }
    });
          (ns.mentors||[]).forEach(m=>{ wages += Math.round((m.wage||10)*0.5); });
          ns.gold = s.gold + income - wages - stolen;
          // 💸 in debt: creditors talk, and the guild's name suffers every payday until it's paid off
          if(ns.gold<0){ const pen=Math.min(10, 1+Math.floor(-ns.gold/1000)); ns.renown=Math.max(0,(ns.renown||0)-pen);
            logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`💸 Lonca borçta (${ns.gold}A). Alacaklılar kapıda, dedikodu yayılıyor: −${pen} şöhret. Borç kapanana kadar her gün tekrarlanır.`:`💸 The guild is in debt (${ns.gold}G). Creditors at the door, rumours spreading: −${pen} renown. Repeats every day until it's paid off.`}); }
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
    // ---- request board: fresh requests every 3 days ----
    if(!ns.requests || !Array.isArray(ns.requests.list) || ns.day >= (ns.requests.nextDay||0)){
      ns.requests = genRequests(ns, ns.day, ns.requests);
            logAdds.push({t:ns.elapsed,msg:LANG==="tr"?"📋 İstek panosuna yeni istekler asıldı — soylular, kilise ve halk seni bekliyor.":"📋 New requests are pinned to the board — nobles, church and commoners await."});
            { const om=OMENS.find(o=>o.id===ns.requests.omen); if(om) logAdds.push({t:ns.elapsed,msg:LANG==="tr"?om.tr:om.en}); }
    }
    // ---- passive relationship drift: adventurers living together at the hall ----
    const home = (ns.adventurers||s.adventurers).filter(a=>a.status!=="questing");
    if(home.length>1){
      if(!(ns.rels===s.rels)) {} else ns.rels={...s.rels};
      const hawkHome = home.some(a=>a.cls==="Hawk"); const hawkPoison = home.some(a=>a.cls==="Hawk"&&!a.redeemed);
      for(let i=0;i<home.length;i++) for(let j=i+1;j<home.length;j++){
        let d=passiveDrift(home[i],home[j]); if(d>0) d+=(bLv(ns.buildings,"tav_bard").relBonus||0)*0.25; // songs help friendships along, but can't make enemies like each other
        d=d
          + posMod(home[i],"relDrift") + posMod(home[j],"relDrift") + (home[i].neg.mod.relDrift||0) + (home[j].neg.mod.relDrift||0);
        if(hawkHome){
          if(home[i].cls==="Hawk"||home[j].cls==="Hawk") d+=2; // Hawk charms
          else if(hawkPoison) d-=2; // Hawk poisons everyone else's bonds (unless redeemed)
        }
        bumpRel(ns.rels, home[i].id, home[j].id, d*REL_SPEED, ns.elapsed);
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
    if(!offline && !ns.pendingEvent){ const sev=storyCheck(ns); if(sev) ns.pendingEvent=sev; }
  if(!ns.pendingEvent && Math.random()<0.40){
      const roll=offline ? 1 : Math.random(); // while away, only small self-resolving events happen
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
  // ---- ⚠️ REALM CRISES: unlocks, deadlines, stage results ----
  CRISES.forEach(C=>{
    const prevC=(ns.crises||{})[C.id]; let c=prevC||{status:"locked"}; let touched=false;
    if(c.status==="locked" && C.unlock(ns)){ c={status:"available",stage:0,esc:0}; touched=true;
      logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`⚠️ DİYAR KRİZİ: ${C.icon} ${crisisName(C)}! Görevler ekranında seni bekliyor.`:`⚠️ REALM CRISIS: ${C.icon} ${crisisName(C)}! It awaits you on the Quests screen.`}); }
    if(c.status==="lost" && ns.day>=(c.returnDay||0)){ c={status:"available",stage:0,esc:0,returned:true}; touched=true;
      logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`⚠️ ${C.icon} ${crisisName(C)} geri döndü — bu kez daha hazırlıklı ol.`:`⚠️ ${C.icon} ${crisisName(C)} has returned — be readier this time.`}); }
    if(c.status==="active"){
      if(offline){ c={...c, deadlineAt:(c.deadlineAt||0)+1, run:c.run?{...c.run,endAt:c.run.endAt+1}:null}; touched=true; }
      else if(c.run && ns.elapsed>=c.run.endAt){
        touched=true; c={...c}; const run=c.run; c.run=null;
        ns.adventurers=(ns.adventurers===s.adventurers?s.adventurers.map(a=>({...a})):ns.adventurers.map(a=>({...a})));
        const party=ns.adventurers.filter(a=>run.party.includes(a.id));
        const st=C.stages[run.stage];
        const odds=crisisOdds(C, run.stage, party, ns, c.esc);
        const won=Math.random()<odds.win;
        const died=[];
        party.forEach(a=>{
          a.status="idle"; a.questId=null; a.task="rest";
          a.fatigue=Math.min(100,(a.fatigue||0)+45);
          const dc = won ? odds.deathWin : odds.deathFail;
          if(Math.random()<dc){
            if(a.boon==="boneRelic"){ a.boon=null; a.status="injured"; a.injuryUntil=ns.elapsed+300; a.hp=1;
              chron(a, ns.day, ()=>LANG==="tr"?`${crisisName(C)} sırasında ölümden döndü — Kemik Emaneti parçalandı.`:`Cheated death during ${crisisName(C)} — the Bone Relic shattered.`); }
            else { a.dead=true; died.push(a); }
          } else if(!won || Math.random()<0.3){ a.status="injured"; a.injuryUntil=ns.elapsed+Math.round(240*(bLv(ns.buildings,"inf_ward").injuryMult||1)); a.hp=Math.max(1,Math.floor(a.maxHp*0.25)); }
          if(!a.dead){ a.xp=(a.xp||0)+(won?600:150); levelUpHero(a, ns.day);
            chron(a, ns.day, ()=>won?(LANG==="tr"?`${crisisName(C)}: "${crisisL(st.name)}" aşamasında savaştı ve kazandı.`:`${crisisName(C)}: fought and won at "${crisisL(st.name)}".`)
                                   :(LANG==="tr"?`${crisisName(C)}: "${crisisL(st.name)}" aşamasında geri püskürtüldü.`:`${crisisName(C)}: thrown back at "${crisisL(st.name)}".`)); }
        });
        if(died.length){
          ns.fallen=[...(ns.fallen||[])];
          died.forEach(d=>{ ns.fallen.unshift({ name:d.name, cls:d.cls, level:d.level, day:ns.day, region:(LANG==="tr"?C.name.tr:C.name.en), rank:rankForLevel(d.level).name, crisis:C.id,
              eulogy: LANG==="tr"?`${crisisName(C)} sırasında, diyar için düştü.`:`Fell for the realm during ${crisisName(C)}.`,
              chronicle:[...(d.chronicle||[]), {d:ns.day, ...bothLang(()=>LANG==="tr"?`${crisisName(C)} sırasında düştü.`:`Fell during ${crisisName(C)}.`)}] });
            ns.adventurers.forEach(o=>{ if(o.id!==d.id && !o.dead && getRel(ns.rels||{},d.id,o.id)>=40){ o.grief=ns.elapsed+360; chron(o, ns.day, ()=>LANG==="tr"?`${d.name}'in ölümünün yasını tuttu.`:`Mourned the death of ${d.name}.`); } }); });
          ns.adventurers=ns.adventurers.filter(a=>!a.dead);
          { const bp=bloodPrice(ns, died); if(bp) logAdds.push({t:ns.elapsed,msg:bp}); }
          const nb=died.slice().sort((x,y)=>y.level-x.level)[0];
          ns.deathAlert={ name:nb.name, cls:nb.cls, level:nb.level, region:(LANG==="tr"?C.name.tr:C.name.en), count:died.length, eulogy:LANG==="tr"?`${crisisName(C)} sırasında, diyar için düştü.`:`Fell for the realm during ${crisisName(C)}.`, id:uid() };
        }
        const deadTxt = died.length ? (LANG==="tr"?` Kayıplar: ${died.map(d=>d.name).join(", ")}.`:` Lost: ${died.map(d=>d.name).join(", ")}.`) : "";
        if(won){
          c.stage=run.stage+1;
          (c.heroes=c.heroes||[]); party.forEach(a=>{ if(!c.heroes.includes(a.name)) c.heroes.push(a.name); });
          if(c.stage>=C.stages.length){
            c.status="won"; c.wonDay=ns.day; c.deadlineAt=null;
            ns.gold=(ns.gold||0)+C.gold; ns.renown=(ns.renown||0)+C.renown;
            ns.adventurers.filter(a=>run.party.includes(a.id)).forEach(a=>chron(a, ns.day, ()=>LANG==="tr"?`${crisisName(C)} krizini sona erdirenlerden biri oldu.`:`Was among those who ended ${crisisName(C)}.`));
            ns._pendingAch=[...(ns._pendingAch||[]), "a_crisis_"+C.id];
            logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`🏆 ${C.icon} ${crisisName(C)} SONA ERDİ! +${C.gold}A, +${C.renown} şöhret ve bir lonca efsanesi: ${C.legend.icon} ${C.legend.name.tr} — ${C.legend.desc.tr}.${deadTxt}`:`🏆 ${C.icon} ${crisisName(C)} IS OVER! +${C.gold}G, +${C.renown} renown and a guild legend: ${C.legend.icon} ${C.legend.name.en} — ${C.legend.desc.en}.${deadTxt}`});
          } else {
            c.deadlineAt=ns.elapsed+C.stages[c.stage].days*120;
            logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`⚔️ ${C.icon} ${crisisName(C)}: "${crisisL(st.name)}" kazanıldı! Sıradaki aşama: "${crisisL(C.stages[c.stage].name)}".${deadTxt}`:`⚔️ ${C.icon} ${crisisName(C)}: "${crisisL(st.name)}" won! Next stage: "${crisisL(C.stages[c.stage].name)}".${deadTxt}`});
          }
        } else {
          logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`💥 ${C.icon} ${crisisName(C)}: "${crisisL(st.name)}" başarısız oldu. Ekip yaralı döndü.${deadTxt} Süre işlemeye devam ediyor.`:`💥 ${C.icon} ${crisisName(C)}: "${crisisL(st.name)}" failed. The party came back wounded.${deadTxt} The clock is still running.`});
        }
      }
      else if(!c.run && c.deadlineAt && ns.elapsed>=c.deadlineAt){
        touched=true; c={...c, esc:(c.esc||0)+1};
        const msg=C.escalate(ns); logAdds.push({t:ns.elapsed,msg});
        if(c.esc>=3){ c={status:"lost", returnDay:ns.day+15}; ns.renown=Math.max(0,(ns.renown||0)-20);
          logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`☠️ ${C.icon} ${crisisName(C)} kontrolden çıktı. Diyar bu kez kaybetti (−20 şöhret). Kriz 15 gün sonra geri dönecek.`:`☠️ ${C.icon} ${crisisName(C)} spiralled out of control. The realm lost this time (−20 renown). It will return in 15 days.`}); }
        else { c.deadlineAt=ns.elapsed+6*120;
          logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`⚠️ ${crisisName(C)} büyüyor (${c.esc}/3). Düşman güçlendi; 6 gün içinde harekete geç.`:`⚠️ ${crisisName(C)} is growing (${c.esc}/3). The enemy is stronger; act within 6 days.`}); }
      }
    }
    if(touched){ ns.crises={...(ns.crises||{}), [C.id]:c}; }
  });
  if(!ns.finaleSeen && CRISES.every(C=>((ns.crises||{})[C.id]||{}).status==="won")){ ns.finaleSeen=true; ns.finale=true; ns.renown=(ns.renown||0)+100;
    ns._pendingAch=[...(ns._pendingAch||[]),"a_finale"]; }
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
    if(newly.length){ const last=ACH_BY_ID[newly[newly.length-1]]; if(last) ns._achToast={id:uid(), ach:last, count:newly.length}; }
  }
  { const ti=titleIndex(ns.renown);
    if(ti>=3 && !ns.uniqueOffered){ ns.uniqueOffered=true; const ex=uniquesInPlay(ns); const pool=Object.keys(STORY_HEROES).filter(c=>!ex.includes(c));
      if(pool.length){ const u=makeAdventurer(guildTier(ns), pick(pool), ns.renown, ex); ns.recruits=[u, ...(ns.recruits||[])];
        logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`⭐ Ünün diyarın öbür ucuna ulaştı. Efsanevi biri — ${u.name} — aday panosunda seni bekliyor!`:`⭐ Your fame has reached the far ends of the realm. A legend — ${u.name} — awaits you on the recruit board!`}); } }
    if(ti>(ns.titleSeen||0)){ ns.titleSeen=ti;
      logAdds.push({t:ns.elapsed,msg:LANG==="tr"?`🎺 Loncanın adı yayılıyor! Artık "${titleName(ti)}" bir lonca olarak anılıyorsun.`:`🎺 Your name spreads! The guild is now "${titleName(ti)}".`}); } }
  if(logAdds.length){ ns.log = [...logAdds.reverse(), ...s.log].slice(0,40); }
  return ns;
}
// Runs as many game seconds as real time has passed (handles the app being closed or backgrounded).
const OFFLINE_CAP = 8*3600; // at most 8 hours of catch-up
function catchUp(s){
  if(!s.started) return s;
  const now=Date.now();
  const last=s.realTime||now;
  let steps=Math.round((now-last)/1000);
  if(!(steps>=1)) return s.realTime? s : {...s, realTime:now};
  if(steps<=3){ let ns=s; for(let k=0;k<steps;k++) ns=stepGame(ns,false); return {...ns, realTime:last+steps*1000}; }
  // away for a while — fast-forward and prepare a "while you were away" report
  steps=Math.min(steps, OFFLINE_CAP);
  const before={ gold:s.gold, day:s.day, quests:(s.stats&&s.stats.quests)||0, lv:s.adventurers.reduce((a,x)=>a+x.level,0),
    inv:Object.values(s.inventory||{}).reduce((a,b)=>a+b,0), renown:s.renown||0 };
  let ns=s;
  for(let k=0;k<steps;k++) ns=stepGame(ns,true);
  const prev=s._away;
  const away={ secs:steps+((prev&&prev.secs)||0), gold:ns.gold-before.gold+((prev&&prev.gold)||0), days:ns.day-before.day+((prev&&prev.days)||0),
    quests:((ns.stats&&ns.stats.quests)||0)-before.quests+((prev&&prev.quests)||0),
    levels:ns.adventurers.reduce((a,x)=>a+x.level,0)-before.lv+((prev&&prev.levels)||0),
    loot:Math.max(0,Object.values(ns.inventory||{}).reduce((a,b)=>a+b,0)-before.inv)+((prev&&prev.loot)||0),
    renown:(ns.renown||0)-before.renown+((prev&&prev.renown)||0), id:uid() };
  const stats2 = steps>=3600 ? {...(ns.stats||{}), longAway:true} : ns.stats;
  return {...ns, stats:stats2, realTime:now, _away: steps>=60 ? away : prev };
}

export default function Guildmaster(){
  const [state, setState] = useState(()=>{
    // auto-load a persisted guild if one exists (real save, survives app restarts)
    try{
      const raw = (typeof localStorage!=="undefined") && localStorage.getItem(SAVE_KEY);
      if(raw){
        const obj = JSON.parse(raw);
        if(obj && typeof obj==="object" && obj.gold!==undefined){
          obj.pendingEvent=null; obj.deathAlert=null; obj.injuryAlert=null; obj._achToast=null;
          if(!obj.market) obj.market=freshMarket();
          if(!obj.pendingChains) obj.pendingChains=[];
          // ---- migrate older saves: fill in fields added by later updates ----
          if(!obj.achieved) obj.achieved={};
          if(!obj.stats) obj.stats={quests:0,crafted:0,sold:0,forged:0,maxParty:0};
          if(!obj.bossUnlocked) obj.bossUnlocked={};
          if(!obj.bossDefeated) obj.bossDefeated={};
          if(!Array.isArray(obj.savedParties)) obj.savedParties=[null,null,null];
          if(!obj.inventory) obj.inventory={};
          if(!obj.rels) obj.rels={};
          if(!Array.isArray(obj.fallen)) obj.fallen=[];
          if(!Array.isArray(obj.log)) obj.log=[];
          if(!Array.isArray(obj.quests)) obj.quests=[];
          delete obj.crafting; // crafting system removed
          if(!obj.buildings) obj.buildings=newGame().buildings;
          { const b=obj.buildings;
            if((b.treasury||0)>5){ b.monuments=Math.max(b.monuments||0,b.treasury-5); b.treasury=5; }
            if(b.dorm_rooms===undefined){ const d=b.dormitory||0; b.dorm_rooms=d; b.dorm_beds=d; b.dorm_comfort=d; }
            if(b.tav_meals===undefined){ const tv=b.tavern||0; b.tav_meals=tv; b.tav_cellar=tv; }
            ["dormitory","tavern","tannery","weavery","kitchen","workshop"].forEach(k=>{ delete b[k]; });
            Object.keys(BUILDINGS).forEach(k=>{ if(typeof b[k]!=="number") b[k]=0; b[k]=Math.min(b[k],BUILDINGS[k].levels.length-1); }); }
          obj.adventurers=(Array.isArray(obj.adventurers)?obj.adventurers:[]).map(a=>a&&a.task==="assist"?{...a,task:"rest"}:a);
          if(!obj.requests || !Array.isArray(obj.requests.list)) obj.requests=genRequests(obj, obj.day||1, null);
          if(!Array.isArray(obj.adventurers)) obj.adventurers=[];
          if(!Array.isArray(obj.recruits)) obj.recruits=[];
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

  // ---- auto-save: persist the guild to device storage (throttled to ~5s) ----
  const lastSaveRef = useRef(0);
  const saveWarnRef = useRef(0);
  useEffect(()=>{
    if(!state.started) return; // don't save the pre-game intro state
    const now = Date.now();
    const doSave = ()=>{
      try{
        const { pendingEvent, deathAlert, injuryAlert, _achToast, _away, ...clean } = state;
        clean.saveVersion = SAVE_VERSION;
        localStorage.setItem(SAVE_KEY, JSON.stringify(clean));
        lastSaveRef.current = Date.now();
      }catch(e){ // storage full or unavailable — the game keeps running in memory, but the player must know
        lastSaveRef.current = Date.now();
        if(Date.now()-(saveWarnRef.current||0) > 60000){ saveWarnRef.current=Date.now();
          notify(LANG==="tr"?"⚠️ Oyun kaydedilemedi! Cihaz hafızası dolu olabilir. Ayarlar → Loncayı Kaydet ile kayıt kodunu yedekle.":"⚠️ Could not save! Device storage may be full. Back up your save code via Settings → Save / Load."); } }
    };
    if(now - lastSaveRef.current >= 5000){ doSave(); return; }
    const id = setTimeout(doSave, 5000 - (now - lastSaveRef.current));
    return ()=>clearTimeout(id);
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

  // watch for unlocked achievements → toast
  const lastAchId = useRef(null);
  useEffect(()=>{
    const at=state._achToast;
    if(at && at.id!==lastAchId.current){
      lastAchId.current = at.id;
      const extra = at.count>1 ? (LANG==="tr"?` (+${at.count-1} daha)`:` (+${at.count-1} more)`) : "";
      notify(`🏆 ${LANG==="tr"?"Başarım":"Achievement"}: ${at.ach.icon} ${achName(at.ach)}${extra}`);
      Audio.play("levelup");
    }
  }, [state._achToast]);

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
    const recruits = [makeAdventurer(0,"Warrior",0,null,true), makeAdventurer(0,"Cleric",0,null,true), makeAdventurer(0,null,0,null,true)];
    return {
      started: false, guildName: "",
      gold: STARTING_GOLD, renown: 0, day: 1, elapsed: 0,
      adventurers: [], recruits,
      inventory: {}, quests: [], rels: {}, fallen: [], pendingEvent: null, pendingChains: [], market: freshMarket(),
      buildings: Object.fromEntries(Object.keys(BUILDINGS).map(k=>[k,0])),
      requests: genRequests({buildings:{treasury:0},adventurers:[],inventory:{}}, 1, null),
      lastUpkeep: 0, log: [],
      achieved: {}, stats: { quests:0, requests:0, sold:0, maxParty:0 },
      bossUnlocked: {}, bossDefeated: {}, savedParties: [null,null,null],
    };
  }

  const notify = useCallback((msg)=>{ setToast(msg); setTimeout(()=>setToast(null), 2600); }, []);

  // ---- main game tick (1s) ----
  useEffect(()=>{
    tickRef.current = setInterval(()=>{
      setState(s=>catchUp(s));
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
        {tab==="requests" && <RequestsView {...api} />}
        {tab==="storage" && <StorageView {...api} />}
        {tab==="upgrades" && <UpgradesView {...api} />}
      </main>
      <NavBar tab={tab} setTab={setTab} state={state} />
      {toast && <div style={{position:"fixed",bottom:"calc(90px + env(safe-area-inset-bottom, 0px))",left:"50%",transform:"translateX(-50%)",
        background:T.panel2,border:`1px solid ${T.borderLit}`,color:T.ink,padding:"10px 18px",
        borderRadius:8,fontSize:14,zIndex:50,boxShadow:"0 6px 20px rgba(0,0,0,.5)",animation:"fadeUp .2s",maxWidth:"90%",textAlign:"center"}}>{toast}</div>}
      {!showWelcome && state.finale && (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:80,display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeUp .6s"}}>
        <div style={{background:"radial-gradient(circle at 50% 20%,#3a2a12,#120c08)",border:`1px solid ${T.gold}`,borderRadius:16,padding:"30px 24px",maxWidth:380,textAlign:"center",boxShadow:"0 0 50px rgba(224,162,60,.35)"}}>
          <div style={{fontSize:48,marginBottom:10}}>🌅</div>
          <div style={{fontSize:12,letterSpacing:3,textTransform:"uppercase",color:T.gold,marginBottom:12}}>{LANG==="tr"?"Loncanın Efsanesi":"The Legend of the Guild"}</div>
          <div style={{fontSize:13,color:T.parchment,lineHeight:1.7,fontStyle:"italic",marginBottom:14}}>{LANG==="tr"
            ?`Ölüler toprağa döndü. Kızıl ejder sustu. Taç doğru başa kondu ve gökyüzündeki yara kapandı. Bir zamanlar çatısı akan o eski salon, artık diyarın kalbi. Ozanlar ${state.guildName||"loncanın"} adını yüzyıllarca söyleyecek — ve bu şarkılarda düşenlerin her birinin adı geçecek.`
            :`The dead returned to the earth. The crimson wyrm fell silent. The crown found the right head, and the wound in the sky was sealed. The old hall with the leaking roof is now the heart of the realm. Bards will sing of ${state.guildName||"the guild"} for centuries — and every fallen name will be in those songs.`}</div>
          <div style={{fontSize:12,color:T.inkDim,marginBottom:18}}>{LANG==="tr"?"+100 şöhret. Lonca yaşamaya devam ediyor; hikâye bitmek zorunda değil.":"+100 renown. The guild lives on; the story doesn't have to end."}</div>
          <GoldBtn onClick={()=>setState(s=>({...s,finale:false}))} style={{width:"100%"}}>{LANG==="tr"?"Salona dön":"Return to the hall"}</GoldBtn>
        </div></div>)}
      {!showWelcome && state._away && (()=>{ const w=state._away; const h=Math.floor(w.secs/3600), m=Math.floor((w.secs%3600)/60);
        const dur = LANG==="tr" ? `${h>0?h+" saat ":""}${m} dakika` : `${h>0?h+"h ":""}${m}m`;
        const row=(ic,txt)=>(<div style={{display:"flex",gap:10,alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:18}}>{ic}</span><span style={{fontSize:13,color:T.ink}}>{txt}</span></div>);
        return (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:65,display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeUp .3s"}}>
          <div style={{background:T.panel,border:`1px solid ${T.gold}`,borderRadius:14,padding:"24px 22px",maxWidth:360,width:"100%"}}>
            <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:T.gold,textAlign:"center"}}>🕯️ {LANG==="tr"?"Sen Yokken":"While You Were Away"}</div>
            <div style={{fontSize:12,color:T.inkDim,textAlign:"center",margin:"6px 0 12px"}}>{LANG==="tr"?`${dur} boyunca lonca kendi başının çaresine baktı.`:`For ${dur}, the guild fended for itself.`}</div>
            {w.days>0 && row("📅", LANG==="tr"?`${w.days} gün geçti`:`${w.days} days passed`)}
            {row("💰", LANG==="tr"?`Altın: ${w.gold>=0?"+":""}${w.gold}A`:`Gold: ${w.gold>=0?"+":""}${w.gold}G`)}
            {w.quests>0 && row("🗺️", LANG==="tr"?`${w.quests} sefer tamamlandı`:`${w.quests} expeditions completed`)}
            {w.loot>0 && row("🎒", LANG==="tr"?`Ambara ${w.loot} parça ganimet girdi`:`${w.loot} pieces of loot stored`)}
            {w.levels>0 && row("⬆️", LANG==="tr"?`Kahramanlar toplam ${w.levels} seviye atladı`:`Heroes gained ${w.levels} levels in total`)}
            {w.renown>0 && row("⭐", LANG==="tr"?`+${w.renown} şöhret`:`+${w.renown} renown`)}
            <div style={{fontSize:11,color:T.inkFaint,marginTop:10,lineHeight:1.5}}>{LANG==="tr"?"Ayrıntılar kayıt defterinde. Sen yokken kimse ölmez — en kötü ihtimalle ağır yaralı döner.":"Details are in the ledger. No one dies while you're away — at worst they come home badly hurt."}</div>
            <GoldBtn onClick={()=>setState(s=>({...s,_away:null}))} style={{width:"100%",marginTop:14}}>{LANG==="tr"?"Loncaya dön":"Back to the guild"}</GoldBtn>
          </div></div>); })()}
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
            {eventModal.kind==="story" && <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#c9a0e0",textAlign:"center",marginBottom:6}}>📜 {LANG==="tr"?"Kişisel Hikâye":"Personal Story"}</div>}
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
function TutorialPanel({state,onHide}){
  const st=state.stats||{};
  const steps=[
    { key:"hire",    done:(state.adventurers||[]).length>0 },
    { key:"quest",   done:(st.quests||0)>0 },
    { key:"craft",   done:(st.requests||0)>0 },
    { key:"sell",    done:(st.sold||0)>0 },
    { key:"upgrade", done:Object.values(state.buildings||{}).some(v=>v>=1) },
  ];
  const allDone=steps.every(s=>s.done);
  const firstOpen=steps.find(s=>!s.done);
  return (<Panel style={{marginBottom:12,border:`1px solid ${T.gold}`,background:"linear-gradient(135deg,#2a2112,#1c140d)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:allDone?0:10}}>
      <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:T.gold,fontWeight:700}}>📖 {t("tut.title")}</div>
      <button onClick={onHide} style={{background:"none",border:`1px solid ${T.border}`,color:T.inkFaint,borderRadius:6,padding:"3px 8px",fontSize:10}}>{t("tut.hide")}</button>
    </div>
    {allDone ? <div style={{fontSize:12,color:T.green,marginTop:8}}>✓ {t("tut.done")}</div> :
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {steps.map(s=>(<div key={s.key} style={{opacity:s.done?0.5:1}}>
          <div style={{fontSize:12,color:s.done?T.inkFaint:T.ink,fontWeight:s.done?400:700,textDecoration:s.done?"line-through":"none"}}>
            {s.done?"✓":(s===firstOpen?"▸":"○")} {t("tut."+s.key)}</div>
          {s===firstOpen && <div style={{fontSize:11,color:T.gold,marginLeft:16,marginTop:2}}>{t("tut."+s.key+"How")}</div>}
        </div>))}
      </div>}
  </Panel>);
}
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
    "Ashford'un sınır kasabasında, çatısı akan eski bir lonca salonu var.",
    "Eski lonca efendisi geçen kış öldü. Geriye borçlar, soğumuş bir şömine ve birkaç boş yatak kaldı.",
    "Yine de bu kasabaya macera arayanlar hiç eksik olmaz. Onlara bir çatı, sıcak bir yemek ve bir sefer ver; gerisini kendileri halleder.",
    "Loncana bir ad ver. Artık o senin.",
  ] : [
    "On the edge of the border town of Ashford stands an old guild hall with a leaking roof.",
    "The old guildmaster died last winter, leaving behind debts, a cold hearth and a few empty beds.",
    "Still, adventurers never run short in a town like this. Give them a roof, a hot meal and a quest — they'll do the rest.",
    "Name your guild. It's yours now.",
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
        <div style={{fontSize:22}}>{state.crest||"🏰"}</div>
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
        <div style={{color:state.gold<0?T.red:T.gold,fontWeight:700,fontSize:16}}>{state.gold<0?"💸 ":""}{state.gold.toLocaleString()}<span style={{fontSize:11,marginLeft:2}}>{t("top.goldUnit")}</span></div>
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
    ["requests","📋","tab.requests"],["storage","🗝️","tab.store"],["upgrades","🏰","tab.build"]];
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
  const invTotal = Object.values(state.inventory).reduce((a,b)=>a+b,0);
  if(state.quests.length===0 && invTotal===0)
    return { tab:"quests", icon:"🗺️", txt:t("step.disp.txt"), cta:t("step.disp.cta") };
  const rq = state.requests && Array.isArray(state.requests.list) ? state.requests.list : [];
  if(rq.some(r=>!r.done && r.need.every(n=>(state.inventory[n.item]||0)>=n.qty)))
    return { tab:"requests", icon:"📋", txt:t("step.craft.txt"), cta:t("step.craft.cta") };
  if(invTotal>0) return { tab:"requests", icon:"💰", txt:t("step.sell.txt"), cta:t("step.sell.cta") };
  return null;
}

function HallView({state,setTab,setState,notify,newGame,lang,switchLang}){
  const tier = BUILDINGS.treasury.levels[state.buildings.treasury].tier;
  const cap = bLv(state.buildings,"dorm_rooms").capacity;
  const idle = state.adventurers.filter(a=>a.status==="idle").length;
  const questing = state.quests.length;
  const invCount = Object.values(state.inventory).reduce((a,b)=>a+b,0);
  const [showSave,setShowSave]=useState(false);
  const [showLegends,setShowLegends]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [showShop,setShowShop]=useState(false);
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
          {state.motto ? `"${state.motto}"` : t("hall.quote")}
        </div>
      </Panel>
    )}
    {!state.tutorialHidden && <TutorialPanel state={state} onHide={()=>setState(s=>({...s,tutorialHidden:true}))} />}
    {(()=>{ const ti=titleIndex(state.renown); const nx=RENOWN_TITLES[ti+1];
      const pct = nx ? ((state.renown-RENOWN_TITLES[ti].min)/(nx.min-RENOWN_TITLES[ti].min))*100 : 100;
      return (<Panel style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:T.gold}}>⭐ {LANG==="tr"?"Loncanın Şöhreti":"Guild Fame"}</div>
            <div style={{fontSize:15,fontWeight:700,color:T.parchment}}>{titleName(ti)}</div>
            <div style={{fontSize:11,color:T.inkDim}}>★ {state.renown} · {LANG==="tr"?`harcanabilir ${spendable(state)}`:`${spendable(state)} to spend`}{nx?(LANG==="tr"?` · sıradaki: ${nx.tr} (${nx.min})`:` · next: ${nx.en} (${nx.min})`):""}</div>
          </div>
          <GhostBtn onClick={()=>setShowShop(true)} style={{fontSize:12,padding:"8px 10px"}}>🎁 {LANG==="tr"?"Şöhret Hazinesi":"Fame Vault"}</GhostBtn>
        </div>
        <div style={{marginTop:8}}><Bar pct={pct} color={T.gold} h={5}/></div>
        {ti>0 && <div style={{fontSize:10,color:T.green,marginTop:6}}>{LANG==="tr"?`Unvan etkisi: adaylar +${ti} seviyeyle gelir, istek ödülleri +%${ti*4}`:`Title perks: recruits arrive +${ti} levels, request pay +${ti*4}%`}</div>}
      </Panel>); })()}
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
    {((state.fallen||[]).length+(state.retired||[]).length+(state.mentors||[]).length+CRISES.filter(C=>((state.crises||{})[C.id]||{}).status==="won").length>0) && <button onClick={()=>setShowLegends(true)} style={{width:"100%",marginBottom:12,
      background:"linear-gradient(135deg,#2a2016,#1a130d)",border:`1px solid ${T.borderLit}`,borderRadius:10,padding:13,
      textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
      <span style={{fontSize:22}}>🕯️</span>
      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:T.parchment}}>{t("ui.legends")}</div>
        <div style={{fontSize:11,color:T.inkDim}}>{(state.fallen||[]).length} {(state.fallen||[]).length===1?t("hall.fallenHero"):t("hall.fallenHeroes")}{((state.retired||[]).length+(state.mentors||[]).length)>0?(LANG==="tr"?` · ${(state.retired||[]).length+(state.mentors||[]).length} emekli`:` · ${(state.retired||[]).length+(state.mentors||[]).length} retired`):""}</div></div>
      <span style={{color:T.gold,fontSize:18}}>›</span>
    </button>}
    {showSettings && <SettingsModal state={state} setState={setState} notify={notify} newGame={newGame}
      lang={lang} switchLang={switchLang}
      onSave={()=>{setShowSettings(false);setShowSave(true);}} onClose={()=>setShowSettings(false)} />}
    {showSave && <SaveModal state={state} setState={setState} notify={notify} onClose={()=>setShowSave(false)} />}
    {showShop && <FameShop state={state} setState={setState} notify={notify} onClose={()=>setShowShop(false)} />}
    {showLegends && <LegendsModal fallen={state.fallen||[]} retired={state.retired||[]} mentors={state.mentors||[]} crises={state.crises||{}} onClose={()=>setShowLegends(false)} />}
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
  const [cb,setCb]=useState(()=>{ try{ return localStorage.getItem("guildmaster_cb")==="1"; }catch(e){ return false; } });
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
      <Toggle on={cb} set={(v)=>{ setCb(v); applyColorblind(v); try{ localStorage.setItem("guildmaster_cb", v?"1":"0"); }catch(e){} setState(s=>({...s})); }} label={`👁️ ${t("ui.colorblind")}`}/>
      <div style={{display:"flex",gap:6,marginTop:8,marginBottom:4}}>
        <div style={{flex:1,textAlign:"center",padding:"6px 0",borderRadius:6,background:"#0e0a07",border:`1px solid ${T.green}`,color:T.green,fontSize:11,fontWeight:700}}>✔ {LANG==="tr"?"iyi":"good"}</div>
        <div style={{flex:1,textAlign:"center",padding:"6px 0",borderRadius:6,background:"#0e0a07",border:`1px solid ${T.gold}`,color:T.gold,fontSize:11,fontWeight:700}}>● {LANG==="tr"?"orta":"fair"}</div>
        <div style={{flex:1,textAlign:"center",padding:"6px 0",borderRadius:6,background:"#0e0a07",border:`1px solid ${T.red}`,color:T.red,fontSize:11,fontWeight:700}}>✖ {LANG==="tr"?"kötü":"bad"}</div>
      </div>
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
    try{ setText(enc(JSON.stringify(clean))); notify(LANG==="tr"?"Kayıt kodu hazır — kopyala!":"Save code ready — copy it!"); }
    catch(e){ notify(LANG==="tr"?"Kayıt kodu oluşturulamadı.":"Could not create save code."); }
  };
  const importSave=()=>{
    const clean=text.replace(/\s+/g,""); // strip spaces/newlines from copy-paste
    if(!clean){ notify(LANG==="tr"?"Önce bir kayıt kodu yapıştır.":"Paste a save code first."); return; }
    try{
      const obj=JSON.parse(dec(clean));
      if(!obj || typeof obj!=="object" || obj.gold===undefined){ notify(LANG==="tr"?"Bu geçerli bir kayda benzemiyor.":"That doesn't look like a valid save."); return; }
      obj.started=true; obj.pendingEvent=null; obj.deathAlert=null; obj.injuryAlert=null; obj._away=null; obj.realTime=Date.now(); // no catch-up for an imported save
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
    {text && <GhostBtn onClick={()=>{navigator.clipboard?.writeText(text);notify(LANG==="tr"?"Panoya kopyalandı.":"Copied to clipboard.");}} style={{width:"100%",marginTop:8}}>📋 {LANG==="tr"?"Kodu kopyala":"Copy code"}</GhostBtn>}
  </Modal>);
}
function EpithetPicker({a,setState}){
  const [open,setOpen]=useState(false);
  const [sp,setSp]=useState(null);
  return (<div style={{marginTop:14}}>
    <button onClick={()=>setOpen(!open)} style={{width:"100%",background:"none",border:`1px dashed ${T.border}`,color:T.inkDim,borderRadius:8,padding:"8px",fontSize:12,fontFamily:font}}>
      🏷️ {a.epithet!=null?(LANG==="tr"?`Lakabı: «${epithetText(a.epithet)}» — değiştir (★8)`:`Epithet: «${epithetText(a.epithet)}» — change (★8)`):(LANG==="tr"?"Lakap ver (★8)":"Give an epithet (★8)")}</button>
    {open && <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
      {EPITHETS.map((e,i)=>(<button key={i} onClick={()=>{ setState(s=>{ if(spendable(s)<8){ setSp(false); return s; }
          const advs=s.adventurers.map(x=>{ if(x.id!==a.id) return x; const nx={...x,epithet:i}; chron(nx,s.day,()=>LANG==="tr"?`Lonca ona «${epithetText(i)}» lakabını verdi.`:`The guild named them «${epithetText(i)}».`); return nx; });
          setSp(true); return {...s, adventurers:advs, renownSpent:(s.renownSpent||0)+8, stats:{...(s.stats||{}), epithets:((s.stats&&s.stats.epithets)||0)+1}}; }); setOpen(false); }}
        style={{fontSize:11,padding:"5px 9px",borderRadius:14,border:`1px solid ${a.epithet===i?T.gold:T.border}`,background:"none",color:T.ink,fontFamily:font}}>{LANG==="tr"?e[0]:e[1]}</button>))}
    </div>}
    {sp===false && <div style={{fontSize:11,color:T.red,marginTop:6}}>{LANG==="tr"?"Yeterli şöhretin yok.":"Not enough renown."}</div>}
  </div>);
}
function FameShop({state,setState,notify,onClose}){
  const sp=spendable(state);
  const [motto,setMotto]=useState(state.motto||"");
  const spend=(cost,fn,msg)=>{ if(spendable(state)<cost){ notify(LANG==="tr"?"Yeterli şöhretin yok.":"Not enough renown."); return; }
    setState(s=>{ if(spendable(s)<cost) return s; const ns=fn({...s, renownSpent:(s.renownSpent||0)+cost, stats:{...(s.stats||{}), fameSpent:((s.stats&&s.stats.fameSpent)||0)+cost}});
      return {...ns, log:[{t:s.elapsed,msg},...ns.log].slice(0,40)}; });
    notify(msg); Audio.play("sell"); };
  const owned=state.crests||["🏰"];
  const Item=({icon,title,desc,cost,onBuy,disabled})=>(<div style={{display:"flex",gap:10,alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
    <div style={{fontSize:22,width:30,textAlign:"center"}}>{icon}</div>
    <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:T.ink}}>{title}</div><div style={{fontSize:11,color:T.inkDim}}>{desc}</div></div>
    <GoldBtn onClick={onBuy} disabled={disabled||sp<cost} style={{padding:"7px 10px",fontSize:12,minWidth:58}}>★{cost}</GoldBtn></div>);
  const home=state.adventurers.filter(a=>a.status!=="questing");
  return (<Modal title={`🎁 ${LANG==="tr"?"Şöhret Hazinesi":"Fame Vault"}`} onClose={onClose}>
    <div style={{fontSize:12,color:T.inkDim,textAlign:"center",marginBottom:12,lineHeight:1.5}}>{LANG==="tr"?`Şöhretini harcamak ünvanını düşürmez — sadece "harcanabilir" kısmı azalır.`:`Spending fame never lowers your title — only the spendable part goes down.`}<br/>
      <b style={{color:T.gold}}>★ {sp} {LANG==="tr"?"harcanabilir":"to spend"}</b></div>
    <SectionTitle sub={LANG==="tr"?"Bir kez al, istediğin zaman değiştir":"Buy once, switch any time"}>🛡️ {LANG==="tr"?"Lonca Arması":"Guild Crest"}</SectionTitle>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
      {CRESTS.map(c=>{ const has=owned.includes(c); const on=(state.crest||"🏰")===c;
        return (<button key={c} onClick={()=>{ if(has){ setState(s=>({...s,crest:c})); return; }
            spend(10, s=>({...s,crests:[...(s.crests||["🏰"]),c],crest:c}), LANG==="tr"?`🛡️ Yeni lonca arması: ${c}`:`🛡️ New guild crest: ${c}`); }}
          style={{width:46,height:46,fontSize:22,borderRadius:9,background:on?T.panel2:"transparent",border:`1px solid ${on?T.gold:T.border}`,position:"relative",opacity:has||sp>=10?1:0.45}}>
          {c}{!has && <span style={{position:"absolute",bottom:1,right:3,fontSize:8,color:T.gold}}>★10</span>}</button>); })}
    </div>
    <SectionTitle sub={LANG==="tr"?"Salonun girişine kazınır":"Carved above the hall's door"}>📜 {LANG==="tr"?"Lonca Sözü":"Guild Motto"}</SectionTitle>
    <div style={{display:"flex",gap:6,marginBottom:14}}>
      <input value={motto} maxLength={80} onChange={e=>setMotto(e.target.value)} placeholder={LANG==="tr"?"Örn: Önce yoldaş, sonra altın.":"e.g. Comrades first, gold second."}
        style={{flex:1,background:"#0e0a07",border:`1px solid ${T.border}`,borderRadius:8,color:T.ink,padding:"8px 10px",fontSize:12,fontFamily:font}}/>
      <GoldBtn onClick={()=>{ const m=motto.trim(); if(!m) return; spend(5, s=>({...s,motto:m}), LANG==="tr"?`📜 Yeni lonca sözü: "${m}"`:`📜 New guild motto: "${m}"`); }} disabled={!motto.trim()||sp<5} style={{padding:"7px 10px",fontSize:12}}>★5</GoldBtn>
    </div>
    <SectionTitle sub={LANG==="tr"?"Bir kerelik işler":"One-off favors"}>✨ {LANG==="tr"?"Lonca Hizmetleri":"Guild Favors"}</SectionTitle>
    <Item icon="🍖" cost={15} title={LANG==="tr"?"Büyük Ziyafet":"Grand Feast"} desc={LANG==="tr"?"Evdeki herkesin yorgunluğu sıfırlanır, aralarındaki bağlar ısınır.":"Everyone at home is fully rested, and bonds between them warm."}
      disabled={home.length===0} onBuy={()=>spend(15, s=>{ const ns={...s, adventurers:s.adventurers.map(a=>a.status!=="questing"?{...a,fatigue:0}:a), rels:{...s.rels}};
        const hm=ns.adventurers.filter(a=>a.status!=="questing"); for(let i=0;i<hm.length;i++) for(let j=i+1;j<hm.length;j++) bumpRel(ns.rels,hm[i].id,hm[j].id,3,s.elapsed); return ns; },
        LANG==="tr"?"🍖 Lonca salonunda büyük bir ziyafet verildi. Herkes dinç, herkes keyifli.":"🍖 A grand feast filled the hall. Everyone is rested and merry.")}/>
    <Item icon="🕯️" cost={6} title={LANG==="tr"?"Anma Töreni":"Memorial Rite"} desc={LANG==="tr"?"Yas tutanların acısı hafifler, yeniden odaklanırlar.":"Those in mourning find peace and focus again."}
      disabled={!state.adventurers.some(a=>a.grief && state.elapsed<a.grief)} onBuy={()=>spend(6, s=>({...s, adventurers:s.adventurers.map(a=>({...a,grief:0}))}),
        LANG==="tr"?"🕯️ Düşenler için mumlar yakıldı. Yas tutanlar biraz olsun huzur buldu.":"🕯️ Candles were lit for the fallen. The grieving found some peace.")}/>
    <Item icon="📜" cost={20} title={LANG==="tr"?"Kraliyet Beratı":"Royal Writ"} desc={LANG==="tr"?"İstek panosu hemen yenilenir (itibarın korunur).":"The request board refreshes right now (favor is kept)."}
      onBuy={()=>spend(20, s=>({...s, requests:genRequests(s, s.day, s.requests)}), LANG==="tr"?"📜 Bir kraliyet beratıyla panoya yeni istekler asıldı.":"📜 A royal writ pinned fresh requests to the board.")}/>
    <Item icon="📯" cost={12} title={LANG==="tr"?"Tellala Bahşiş":"Tip the Crier"} desc={LANG==="tr"?"Aday panosu yenilenir; açtığın nadir sınıflardan biri mutlaka gelir.":"The recruit board refreshes with at least one rare class you've unlocked."}
      onBuy={()=>spend(12, s=>{ const tier=BUILDINGS.treasury.levels[s.buildings.treasury].tier; const ex=uniquesInPlay(s);
        const rares=Object.keys(CLASSES).filter(k=>CLASSES[k].rare && !CLASSES[k].unique && (s.renown||0)>=CLASSES[k].minRenown);
        const out=[]; const n=bLv(s.buildings,"guild_herald").recruitSlots||3;
        for(let i=0;i<n;i++){ const a = (i===0 && rares.length) ? makeAdventurer(tier,pick(rares),s.renown,ex) : makeAdventurer(tier,null,s.renown,ex); if(CLASSES[a.cls].unique) ex.push(a.cls); out.push(a); }
        return {...s, recruits:out}; }, LANG==="tr"?"📯 Tellal meydanda loncanı öve öve bitiremedi. Yeni adaylar kapıda.":"📯 The crier sang your praises in the square. New candidates are at the door.")}/>
    <div style={{fontSize:11,color:T.inkFaint,marginTop:12,lineHeight:1.5}}>🏷️ {LANG==="tr"?"Kahramanlarına lakap takmak için onların kartını aç (★8).":"To give a hero an epithet, open their card (★8)."}</div>
  </Modal>);
}
function Chronicle({list,compact}){
  const L=(list||[]).slice().reverse();
  if(!L.length) return <div style={{fontSize:12,color:T.inkFaint,padding:"6px 0"}}>{LANG==="tr"?"Henüz anlatılacak bir şey yok. Hikâyeler seferlerde yazılır.":"Nothing to tell yet. Stories are written on the road."}</div>;
  return (<div style={{borderLeft:`2px solid ${T.goldDim}`,paddingLeft:10,display:"flex",flexDirection:"column",gap:compact?3:6}}>
    {L.map((e,i)=>(<div key={i} style={{fontSize:compact?11:12,color:T.ink,lineHeight:1.4}}>
      <span style={{color:T.goldDim,fontSize:10}}>{LANG==="tr"?"Gün":"Day"} {e.d} · </span>{chronText(e)}</div>))}
  </div>);
}
function LegendsModal({fallen,retired,mentors,crises,onClose}){
  const [open,setOpen]=useState(null);
  return (<Modal title={`🕯️ ${t("ui.legends")}`} onClose={onClose}>
    <div style={{fontSize:12,color:T.parchment,fontStyle:"italic",lineHeight:1.5,marginBottom:16,textAlign:"center"}}>
      {LANG==="tr"?"Gittiler, ama loncanın hafızasına kazındılar. Her isim, yaşayanların asla ödeyemeyeceği bir borç."
       :"Gone, but carved into the guild's memory. Each name a debt the living can never repay."}</div>
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
            {f.chronicle && f.chronicle.length>0 && <button onClick={()=>setOpen(open==="f"+i?null:"f"+i)} style={{marginTop:6,background:"none",border:`1px solid ${T.border}`,color:T.inkDim,borderRadius:6,padding:"3px 8px",fontSize:10}}>📖 {open==="f"+i?(LANG==="tr"?"Gizle":"Hide"):(LANG==="tr"?"Hikâyesi":"Their story")}</button>}
            {open==="f"+i && <div style={{marginTop:8}}><Chronicle list={f.chronicle} compact/></div>}
          </div>
          <div style={{fontSize:18,opacity:.6}}>🪦</div>
        </div>); })}
      {fallen.length===0 && <div style={{fontSize:12,color:T.inkFaint,textAlign:"center"}}>{LANG==="tr"?"Henüz kimseyi kaybetmedin.":"You have lost no one yet."}</div>}
    </div>
    {crises && CRISES.some(C=>(crises[C.id]||{}).status==="won") && <div style={{marginTop:20}}>
      <SectionTitle>⚔️ {LANG==="tr"?"Kriz Kahramanları":"Heroes of the Crises"}</SectionTitle>
      {CRISES.filter(C=>(crises[C.id]||{}).status==="won").map(C=>{ const c=crises[C.id];
        return (<div key={C.id} style={{padding:"10px 12px",background:T.panel,border:`1px solid ${T.gold}`,borderRadius:10,marginBottom:8}}>
          <div style={{fontWeight:700,fontSize:13,color:T.gold}}>{C.icon} {crisisName(C)} <span style={{fontSize:10,color:T.inkFaint,fontWeight:400}}>· {t("top.day")} {c.wonDay}</span></div>
          <div style={{fontSize:11,color:T.inkDim,marginTop:3,lineHeight:1.5}}>{(c.heroes||[]).join(", ")}</div>
        </div>); })}
    </div>}
    {(mentors.length>0 || retired.length>0) && <div style={{marginTop:20}}>
      <SectionTitle>🏡 {LANG==="tr"?"Kılıcını Asanlar":"Those Who Laid Down the Sword"}</SectionTitle>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {[...mentors.map(m=>({...m,kind:"mentor"})), ...retired].map((r,i)=>{ const c=CLASSES[r.cls];
          const tag = r.kind==="mentor"?(LANG==="tr"?"🎓 Lonca eğitmeni":"🎓 Guild trainer"):r.kind==="left"?(LANG==="tr"?"🚪 Loncadan ayrıldı":"🚪 Left the guild"):(LANG==="tr"?"🏡 Emekli":"🏡 Retired");
          return (<div key={"r"+i} style={{padding:"10px 12px",background:T.panel,border:`1px solid ${T.border}`,borderRadius:10}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{fontSize:22}}>{c?c.icon:"⚔️"}</div>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:T.parchment}}>{r.name}</div>
                <div style={{fontSize:11,color:T.inkDim}}>Lv {r.level} {clsName(r.cls)} · {tag} · {t("top.day")} {r.day}</div></div>
              {r.chronicle && r.chronicle.length>0 && <button onClick={()=>setOpen(open==="r"+i?null:"r"+i)} style={{background:"none",border:`1px solid ${T.border}`,color:T.inkDim,borderRadius:6,padding:"3px 8px",fontSize:10}}>📖</button>}
            </div>
            {open==="r"+i && <div style={{marginTop:8}}><Chronicle list={r.chronicle} compact/></div>}
          </div>); })}
      </div></div>}
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
    alignItems:"center",justifyContent:"center",
    padding:`14px 12px calc(14px + env(safe-area-inset-bottom)) 12px`,boxSizing:"border-box"}}>
    <div onClick={e=>e.stopPropagation()} style={{background:T.panel,border:`1px solid ${T.borderLit}`,borderRadius:14,
      padding:18,width:"100%",maxWidth:760,maxHeight:"100%",overflowY:"auto",boxSizing:"border-box",
      WebkitOverflowScrolling:"touch",animation:"fadeUp .25s"}}>
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
          <div style={{fontWeight:700,fontSize:14,color:T.ink}}>{heroName(a)}{a.veteran?<span style={{fontSize:10,color:T.gold,marginLeft:6,fontWeight:400}}>🪖 {LANG==="tr"?"Paralı Asker":"Mercenary"}</span>:null}</div>
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
          {LANG==="tr"?"Yorgunluk":"Fatigue"} {Math.round(a.fatigue)}%{a.fatigue>=70?(LANG==="tr"?" · bitkin!":" · exhausted!"):a.fatigue>=40?(LANG==="tr"?" · yoruluyor":" · tiring"):""}</div>
          <Bar pct={a.fatigue} color={a.fatigue>=70?T.red:a.fatigue>=40?"#e0a23c":T.inkDim} h={4}/></div>}
        {children}
      </div>
    </div>
  </Panel>);
}
function statusLabel(a){ if(a.status==="questing")return "⛏️ "+t("status.onExpedition"); if(a.status==="injured")return "🩸 "+t("status.injured"); if(a.grief)return "🕯️ "+t("status.grieving");
  const tk=a.task||"rest"; if(tk==="rest"&&a.autoRest) return "😴 "+t("status.resting")+(LANG==="tr"?` (sonra ${a.autoRest==="patrol"?"devriyeye":"talime"} döner)`:` (then back to ${a.autoRest==="patrol"?"patrol":"training"})`); return tk==="rest"?"😴 "+t("status.resting"):tk==="train"?"🗡️ "+t("status.training"):tk==="patrol"?"🛡️ "+t("status.patrolling"):"💤 "+t("status.idle"); }

function StatRow({label,value,icon,note}){ return (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
    <span style={{fontSize:12,color:T.inkDim}}>{icon} {label}</span>
    <span style={{fontSize:13,fontWeight:700,color:T.ink}}>{value}{note&&<span style={{fontSize:10,color:T.inkFaint,fontWeight:400,marginLeft:5}}>{note}</span>}</span>
  </div>); }

function AdvDetailModal({a,rels,roster,setState,stories,onClose,onDismiss}){
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
  return (<Modal title={editName?t("adv.rename"):heroName(a)} onClose={onClose}>
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
    {STORY_HEROES[a.cls] && (roster||[]).some(x=>x.id===a.id) && (()=>{ const st=(stories||{})[a.cls]||{stage:0}; const hint=STORY_HEROES[a.cls].hints[Math.min(st.stage,2)];
      return (<div style={{marginTop:14,padding:"10px 12px",borderRadius:9,border:"1px solid #8a6aa8",background:"rgba(150,110,190,.08)"}}>
        <div style={{fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:"#c9a0e0",fontWeight:700}}>📜 {LANG==="tr"?"Kişisel Hikâye":"Personal Story"} · {Math.min(st.stage,3)}/3</div>
        <div style={{fontSize:12,color:T.ink,marginTop:4,fontStyle:"italic",lineHeight:1.5}}>{st.stage>=3?(LANG==="tr"?"Hikâyesi tamamlandı.":"Their story is complete."):(LANG==="tr"?hint.tr:hint.en)}</div></div>); })()}
    {setState && !a.storyTitle && (roster||[]).some(x=>x.id===a.id) && <EpithetPicker a={a} setState={setState}/>}
    <div style={{marginTop:16}}><SectionTitle sub={LANG==="tr"?"Loncadaki hayatından satırlar":"Lines from their life at the guild"}>📖 {LANG==="tr"?"Hayat Hikâyesi":"Life Story"}</SectionTitle>
      <Chronicle list={a.chronicle}/></div>
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
  const cap=bLv(state.buildings,"dorm_rooms").capacity;
  const full=state.adventurers.length>=cap;
  const [detail,setDetail]=useState(null);
  const [confirmKick,setConfirmKick]=useState(null);
  const [sortBy,setSortBy]=useState("class");
  const hire=(r)=>{ if(state.gold<r.hireCost){notify(LANG==="tr"?"Yetersiz altın.":"Not enough gold.");return;} if(full){notify(LANG==="tr"?"Yatakhane dolu — yükselt.":"Dormitory full — upgrade it.");return;}
    setState(s=>({...s,gold:s.gold-r.hireCost,adventurers:[...s.adventurers,{...r,joinDay:s.day,chronicle:[{d:s.day,...bothLang(()=>LANG==="tr"?`${s.guildName||"Lonca"} loncasına katıldı.`:`Joined ${s.guildName||"the guild"}.`)}]}],recruits:s.recruits.filter(x=>x.id!==r.id),
      log:[{t:s.elapsed,msg:LANG==="tr"?`${r.name} (${clsName(r.cls)}) işe alındı.`:`Recruited ${r.name} the ${clsName(r.cls)}.`},...s.log].slice(0,40)})); notify(LANG==="tr"?`${r.name} loncaya katıldı.`:`${r.name} joined the guild.`); };
  const refresh=()=>{ if(state.gold<20){notify(LANG==="tr"?"Adayları yenilemek 20A tutar.":"Refreshing recruits costs 20G.");return;}
    setState(s=>{ const ex=uniquesInPlay(s); const out=[];
      const hd=bLv(s.buildings,"guild_herald");
      const fameLv=titleIndex(s.renown);
      for(let i=0;i<(hd.recruitSlots||3);i++){ const a=makeAdventurer(tier,null,(s.renown||0)+(hd.rareBoost||0),ex);
        if(fameLv>0 && !CLASSES[a.cls].unique){ a.level+=fameLv; a.maxHp=Math.floor(a.maxHp*(1+fameLv*0.06)); a.hp=a.maxHp; a.hireCost=hireCostFor(a.level,CLASSES[a.cls].rare); a.wage+=fameLv*2; } if(CLASSES[a.cls].unique) ex.push(a.cls); out.push(a); }
      return {...s,gold:s.gold-20,recruits:out}; }); };
  const dismiss=(a)=>{ if(a.status!=="idle"){notify(LANG==="tr"?"Uzaktayken çıkarılamaz.":"Can't dismiss while they're away.");return;} setConfirmKick(a); };
  const doDismiss=(a)=>{ setState(s=>({...s,adventurers:s.adventurers.filter(x=>x.id!==a.id),
    log:[{t:s.elapsed,msg:LANG==="tr"?`${a.name} (${clsName(a.cls)}) loncadan ayrıldı.`:`${a.name} the ${clsName(a.cls)} left the guild.`},...s.log].slice(0,40)}));
    Audio.play("click"); notify(LANG==="tr"?`${a.name} loncadan ayrıldı.`:`${a.name} has left the guild.`); setConfirmKick(null); };
  const setTask=(a,task)=>{
    if(task!=="rest" && a.task!==task && a.autoRest!==task && taskUsed(state,task,a.id)>=taskSlots(state,task)){
      notify(task==="patrol"?(LANG==="tr"?`Devriye dolu (${taskSlots(state,task)}/${taskSlots(state,task)}) — Gözcü Kulesi'ni yükselt.`:`Patrol is full — upgrade the Watchtower.`):(LANG==="tr"?`Talim alanı dolu (${taskSlots(state,task)}/${taskSlots(state,task)}) — Talim Kuklaları'nı yükselt.`:`Training is full — upgrade the Training Dummies.`)); return; }
    setState(s=>({...s,adventurers:s.adventurers.map(x=>x.id===a.id?{...x,task,autoRest:null}:x)})); Audio.play("click"); };
  const promote=(a)=>{
    const target=eligibleRankIndex(a.level);
    const cur=a.rankIndex!=null?a.rankIndex:0;
    if(target<=cur) return;
    const cost=promotionCost(cur+1);
    if(state.gold<cost){notify(LANG==="tr"?`Terfi ${cost}A tutar.`:`Promotion costs ${cost}G.`);return;}
    setState(s=>({...s,gold:s.gold-cost,
      adventurers:s.adventurers.map(x=>{ if(x.id!==a.id) return x; const nx={...x,rankIndex:cur+1,
        maxHp:Math.floor(x.maxHp*1.12), hp:Math.floor(x.maxHp*1.12)}; chron(nx,s.day,()=>LANG==="tr"?`${rankName(cur+1)} rütbesine terfi etti.`:`Promoted to ${rankName(cur+1)}.`); return nx; }),
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
          {[["rest","😴 "+t("task.rest")],["train","🗡️ "+t("task.train")],["patrol","🛡️ "+t("task.patrol")]].map(([tk,lbl])=>{
            const mine=(a.task||"rest")===tk||a.autoRest===tk; const cap=taskSlots(state,tk); const used=taskUsed(state,tk,a.id)+(mine?1:0); const full=tk!=="rest"&&!mine&&used>=cap;
            return (<button key={tk} onClick={()=>setTask(a,tk)} style={{flex:"1 1 28%",minWidth:62,fontSize:10,padding:"6px 4px",borderRadius:6,fontFamily:font,opacity:full?0.45:1,
              background:(a.task||"rest")===tk?T.gold:"none",color:(a.task||"rest")===tk?"#211705":T.inkDim,
              border:`1px solid ${(a.task||"rest")===tk?T.gold:T.border}`,fontWeight:(a.task||"rest")===tk?700:400}}>{lbl}{tk!=="rest"?` ${used}/${cap}`:""}</button>); })}
        </div>
        <div style={{fontSize:10,color:T.inkFaint,marginTop:5,lineHeight:1.45}}>
          {(a.task||"rest")==="rest"?"😴 "+t("task.restDesc"):
           (a.task||"rest")==="train"?"🗡️ "+t("task.trainDesc"):
           "🛡️ "+t("task.patrolDesc")}
        </div>
      </div>}
      {canPromote && <GoldBtn onClick={()=>promote(a)} disabled={state.gold<nextCost} style={{marginTop:8,width:"100%"}}>
        🎖️ {t("adv.promoteTo")} {rankName((a.rankIndex!=null?a.rankIndex:0)+1)} — {nextCost}{t("top.goldUnit")}</GoldBtn>}
    </AdvCard>); })}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"18px 0 8px"}}>
      <SectionTitle>{t("adv.recruitBoard")}</SectionTitle>
      <GhostBtn onClick={refresh} style={{padding:"5px 10px",fontSize:11}}>🔄 {LANG==="tr"?"Yenile (20A)":"New (20G)"}</GhostBtn>
    </div>
    {(()=>{ const locked=Object.keys(CLASSES).filter(k=>CLASSES[k].rare && !CLASSES[k].unique && state.renown<CLASSES[k].minRenown)
        .sort((a,b)=>CLASSES[a].minRenown-CLASSES[b].minRenown);
      const unlocked=Object.keys(CLASSES).filter(k=>CLASSES[k].rare && !CLASSES[k].unique && state.renown>=CLASSES[k].minRenown);
      return (<div style={{fontSize:11,color:T.inkDim,marginBottom:10,padding:"8px 11px",borderRadius:8,background:T.panel2,border:`1px solid ${T.border}`}}>
        ★ <b style={{color:T.gold}}>{LANG==="tr"?`${state.renown} şöhret`:`Renown ${state.renown}`}</b> — {unlocked.length>0?(LANG==="tr"?`nadir sınıflar artık çıkabilir: ${unlocked.map(k=>CLASSES[k].icon+" "+clsName(k)).join(", ")}. `:`rare classes can now appear: ${unlocked.map(k=>CLASSES[k].icon+" "+clsName(k)).join(", ")}. `):""}
        {locked.length>0?(LANG==="tr"?`Sıradaki: ${CLASSES[locked[0]].icon} ${clsName(locked[0])} — ${CLASSES[locked[0]].minRenown} şöhrette.`:`Next: ${CLASSES[locked[0]].icon} ${clsName(locked[0])} at ${CLASSES[locked[0]].minRenown} renown.`):(unlocked.length>0?(LANG==="tr"?"Tüm nadir sınıflar açıldı!":"All rare classes unlocked!"):(LANG==="tr"?"Mal satıp seferlerde başarılı olarak şöhret kazan, nadir maceracıları çek.":"Earn renown by selling goods & succeeding to attract rare adventurers."))}
      </div>); })()}
    {state.recruits.map(r=>(<AdvCard key={r.id} a={r} onOpen={()=>setDetail(r)}>
      <GoldBtn onClick={()=>hire(r)} disabled={state.gold<r.hireCost||full} style={{marginTop:8,width:"100%"}}>
        {t("adv.hire")} — {r.hireCost}{t("top.goldUnit")} {full?t("adv.full"):""}</GoldBtn>
    </AdvCard>))}
    {detail && <AdvDetailModal a={state.adventurers.find(x=>x.id===detail.id)||detail} rels={state.rels} roster={state.adventurers} setState={setState} stories={state.stories} onClose={()=>setDetail(null)}
      onDismiss={detail.status==="idle" ? ()=>{ setDetail(null); dismiss(detail); } : null}/>}
    {confirmKick && (
      <div onClick={()=>setConfirmKick(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:80,
        display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeUp .25s"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(135deg,#241c15,#16100b)",
          border:`1px solid ${T.red}`,borderRadius:14,padding:"24px 22px",maxWidth:340,width:"100%",textAlign:"center"}}>
          <div style={{fontSize:34,marginBottom:12}}>{CLASSES[confirmKick.cls].icon}</div>
          <div style={{fontSize:16,fontWeight:700,color:T.parchment,marginBottom:8}}>{LANG==="tr"?`${confirmKick.name} kovulsun mu?`:`Dismiss ${confirmKick.name}?`}</div>
          <div style={{fontSize:12,color:T.inkDim,lineHeight:1.5,marginBottom:20}}>
            {LANG==="tr"?"Loncayı sonsuza dek terk edecek. Bu geri alınamaz — bağları ve tüm ilerlemesi kaybolacak.":"They will leave the guild for good. This cannot be undone — their bonds and progress will be lost."}</div>
          <div style={{display:"flex",gap:9}}>
            <GhostBtn onClick={()=>setConfirmKick(null)} style={{flex:1}}>{t("adv.keepThem")}</GhostBtn>
            <button onClick={()=>doDismiss(confirmKick)} style={{flex:1,background:T.red,color:"#fff",border:"none",
              borderRadius:9,padding:"11px",fontWeight:700,fontSize:13,fontFamily:font}}>✕ {LANG==="tr"?"Kov":"Dismiss"}</button>
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
    const dur=Math.round(region.duration*speed*(bLv(state.buildings,"stable_horses").speedMult||1)*legendMod(state).speed);
    const rep=bossId?1:Math.max(1,repeat||1); // bosses are one-shot, no auto-repeat
    const sup=bossId?bossSupplies(BOSSES.find(b=>b.id===bossId)):0;
    if(sup && state.gold<sup){ notify(LANG==="tr"?`Av için ${sup}A erzak gerekiyor.`:`The hunt needs ${sup}G in supplies.`); return; }
    setState(s=>({...s, gold:s.gold-sup,
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
    <CrisisSection state={state} setState={setState} notify={notify}/>
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
    {picking && <PartyPicker gstate={state} region={picking.__boss?picking.region:picking} boss={picking.__boss||null} idle={idle} lastParty={state.lastParty} rels={state.rels} tavernSucc={(bLv(state.buildings,"tav_meals").successBonus||0)+legendMod(state).succ} savedParties={state.savedParties||[]} onSaveParty={(slot,ids)=>setState(s=>{const sp=[...(s.savedParties||[null,null,null])];sp[slot]=ids;return{...s,savedParties:sp};})} onClearParty={(slot)=>setState(s=>{const sp=[...(s.savedParties||[null,null,null])];sp[slot]=null;return{...s,savedParties:sp};})} onClose={()=>setPicking(null)} onGo={(region,ids,rep)=>dispatch(region,ids,rep,picking.__boss?picking.__boss.id:null)}/>}
  </div>);
}
function PartyPicker({region,boss,idle,lastParty,rels,tavernSucc,gstate,savedParties,onSaveParty,onClearParty,onClose,onGo}){
  // auto-select last party members who are currently idle & available
  const preselect=(lastParty||[]).filter(id=>idle.some(a=>a.id===id));
  const [sel,setSel]=useState(preselect);
  const [repeat,setRepeat]=useState(1);
  const isSoloClass=(a)=> isSoloHero(a);
  // load a saved party: keep only members still idle & available
  const loadParty=(ids)=>{ if(!ids) return; setSel(ids.filter(id=>idle.some(a=>a.id===id && a.fatigue<90))); };
  const toggle=(id)=>setSel(s=>{
    if(s.includes(id)) return s.filter(x=>x!==id);
    const cand=idle.find(a=>a.id===id);
    if(cand && cand.fatigue>=90) return s; // too exhausted to march
    const isLone=cand && isSoloClass(cand);
    const selHasLone=s.some(x=>{const a=idle.find(y=>y.id===x);return a&&isSoloClass(a);});
    // solo heroes only fight alone: block adding anyone alongside, and block adding them to a non-empty party
    if(selHasLone){ return s; }
    if(isLone && s.length>0){ return s; }
    return [...s,id];
  });
  const selParty=idle.filter(a=>sel.includes(a.id));
  const est=estimateOutcome(selParty,region,gstate);
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
        <div style={{fontSize:11,color:T.gold,marginTop:8}}>🎒 {LANG==="tr"?`Erzak: ${bossSupplies(boss)}A (yola çıkarken ödenir)`:`Supplies: ${bossSupplies(boss)}G (paid on departure)`}</div>
        <div style={{fontSize:10,color:T.inkFaint,marginTop:4}}>{LANG==="tr"?`Ödül: ${boss.reward.gold}A · ★${boss.reward.renown} şöhret${boss.reward.item?` · 1× ${itemName(boss.reward.item)}`:""}`:`Reward: ${boss.reward.gold}G · ★${boss.reward.renown} renown${boss.reward.item?` · 1× ${itemName(boss.reward.item)}`:""}`}</div>
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
    {!boss && (()=>{ const slots=savedParties&&savedParties.length?savedParties:[null,null,null];
      return (<div style={{marginBottom:12}}>
        <div style={{fontSize:10,letterSpacing:1,textTransform:"uppercase",color:T.inkFaint,marginBottom:6}}>{LANG==="tr"?"Kayıtlı Ekipler":"Saved Parties"}</div>
        <div style={{display:"flex",gap:6}}>
          {[0,1,2].map(i=>{ const ids=slots[i]; const filled=ids&&ids.length;
            return (<div key={i} style={{flex:1,display:"flex",flexDirection:"column",gap:3}}>
              <button onClick={()=>{ if(filled) loadParty(ids); else if(sel.length) onSaveParty(i,sel); }}
                style={{padding:"7px 4px",borderRadius:7,border:`1px ${filled?"solid":"dashed"} ${filled?T.gold:T.border}`,
                background:filled?"rgba(224,162,60,.10)":"transparent",color:filled?T.gold:T.inkFaint,fontSize:10,fontWeight:700,lineHeight:1.2}}>
                {filled?`${LANG==="tr"?"Ekip":"Party"} ${i+1}`:`＋ ${LANG==="tr"?"Kaydet":"Save"} ${i+1}`}
                <div style={{fontSize:8,color:T.inkFaint,fontWeight:400}}>{filled?`${ids.length} ${LANG==="tr"?"kişi":"heroes"}`:(sel.length?(LANG==="tr"?"seçileni kaydet":"save current"):(LANG==="tr"?"boş":"empty"))}</div>
              </button>
              {filled?<button onClick={()=>onClearParty(i)} style={{fontSize:8,color:T.inkFaint,background:"none",border:"none",padding:0}}>✕ {LANG==="tr"?"sil":"clear"}</button>:null}
            </div>); })}
        </div>
      </div>); })()}
    {idle.map(a=>{ const c=CLASSES[a.cls]; const on=sel.includes(a.id);
      const selHasLone=sel.some(x=>{const y=idle.find(z=>z.id===x);return y&&isSoloClass(y);});
      const isLone=isSoloClass(a);
      const tooTired = a.fatigue>=90;
      const locked = !on && (tooTired || (selHasLone) || (isLone && sel.length>0));
      return (<button key={a.id} onClick={()=>toggle(a.id)} disabled={locked} style={{width:"100%",textAlign:"left",marginBottom:8,opacity:locked?0.4:1,
        background:on?T.panel2:T.panel,border:`1px solid ${on?T.gold:T.border}`,borderRadius:9,padding:11,display:"flex",gap:10,alignItems:"center"}}>
        <div style={{fontSize:20}}>{c.icon}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:T.ink}}>{a.name}{isLone?" 🐺":""}</div>
          <div style={{fontSize:10,color:T.inkDim}}>Lv {a.level} {clsName(a.cls)} · {roleName(c.role)} · <span style={{color:tooTired?T.red:T.green}}>{tooTired?(LANG==="tr"?"çok yorgun":"too exhausted"):isLone?(LANG==="tr"?"yalnız savaşır":"fights solo"):clsPerk(a.cls)}</span></div></div>
        <div style={{fontSize:18,color:on?T.gold:T.inkFaint}}>{locked?(tooTired?"😴":"🔒"):on?"☑":"☐"}</div>
      </button>); })}
    {!boss && <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0 6px",padding:"10px 12px",background:T.panel2,borderRadius:9,border:`1px solid ${T.border}`}}>
      <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700}}>{t("pp.repeat")}</div>
        <div style={{fontSize:10,color:T.inkDim}}>{t("pp.repeatDesc")}</div></div>
      {[1,5,10].map(n=>(<button key={n} onClick={()=>setRepeat(n)} style={{minWidth:42,padding:"7px 0",borderRadius:7,
        border:`1px solid ${repeat===n?T.gold:T.border}`,background:repeat===n?T.panel:"transparent",
        color:repeat===n?T.gold:T.inkDim,fontWeight:700,fontSize:13}}>×{n}</button>))}
    </div>}
    <div style={{position:"sticky",bottom:-18,background:T.panel,paddingTop:8,paddingBottom:4,marginTop:6,boxShadow:`0 -10px 14px -6px ${T.panel}`}}>
      <GoldBtn onClick={()=>onGo(region,sel,boss?1:repeat)} disabled={sel.length===0} style={{width:"100%"}}>
        {boss?(LANG==="tr"?"⚔️ Ava Çık":"⚔️ Hunt"):t("pp.send")} {sel.length>0?`${sel.length}`:""}{!boss&&repeat>1?` · ${t("pp.repeatX")} ×${repeat}`:""} ›</GoldBtn>
    </div>
  </Modal>);
}

// ==================== §UI · CRISES / DİYAR KRİZLERİ ====================
function CrisisSection({state,setState,notify}){
  const [pick,setPick]=useState(null);
  const tier=guildTier(state); const cr=state.crises||{};
  const anyOpen=CRISES.some(C=>(cr[C.id]||{}).status && (cr[C.id]||{}).status!=="locked");
  if(tier<3 && !anyOpen) return null;
  const won=CRISES.filter(C=>(cr[C.id]||{}).status==="won");
  const start=(C)=>setState(s=>{ const c=(s.crises||{})[C.id]; if(!c||c.status!=="available") return s;
    return {...s, crises:{...(s.crises||{}), [C.id]:{...c,status:"active",stage:0,esc:0,deadlineAt:s.elapsed+C.stages[0].days*120,startDay:s.day}},
      log:[{t:s.elapsed,msg:LANG==="tr"?`⚠️ ${C.icon} ${crisisName(C)} ile yüzleşmeye karar verdin. Saat işliyor.`:`⚠️ You chose to face ${C.icon} ${crisisName(C)}. The clock is ticking.`},...s.log].slice(0,40)}; });
  return (<div style={{marginBottom:6}}>
    <SectionTitle sub={LANG==="tr"?"Loncanın en büyük sınavları — zor, tehlikeli, kalabalık ekip ister":"Your guild's greatest trials — hard, deadly, and they need a big party"}>⚠️ {LANG==="tr"?"Diyar Krizleri":"Realm Crises"}</SectionTitle>
    {won.length>0 && <div style={{fontSize:11,color:T.green,marginBottom:8}}>🏅 {LANG==="tr"?"Lonca efsaneleri":"Guild legends"}: {won.map(C=>`${C.legend.icon} ${crisisL(C.legend.name)} (${crisisL(C.legend.desc)})`).join(" · ")}</div>}
    {CRISES.map(C=>{ const c=cr[C.id]||{status:"locked"};
      const base={marginBottom:10,borderRadius:10,padding:13};
      if(c.status==="locked") return (<div key={C.id} style={{...base,opacity:.45,background:T.panel,border:`1px dashed ${T.border}`,display:"flex",gap:10,alignItems:"center"}}>
        <div style={{fontSize:24,filter:"grayscale(1)"}}>{C.icon}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:T.ink}}>{crisisName(C)}</div><div style={{fontSize:11,color:T.inkDim}}>🔒 {crisisL(C.hint)}</div></div></div>);
      if(c.status==="won") return (<div key={C.id} style={{...base,background:"rgba(111,174,111,.08)",border:`1px solid ${T.green}`,display:"flex",gap:10,alignItems:"center"}}>
        <div style={{fontSize:24}}>{C.icon}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:T.green}}>✓ {crisisName(C)}</div>
          <div style={{fontSize:11,color:T.inkDim}}>{LANG==="tr"?`${c.wonDay}. gün sona erdi`:`Ended on day ${c.wonDay}`} · {C.legend.icon} {crisisL(C.legend.name)}</div></div></div>);
      if(c.status==="lost") return (<div key={C.id} style={{...base,background:T.panel,border:`1px solid ${T.red}`,display:"flex",gap:10,alignItems:"center",opacity:.7}}>
        <div style={{fontSize:24}}>{C.icon}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:T.red}}>☠️ {crisisName(C)}</div>
          <div style={{fontSize:11,color:T.inkDim}}>{LANG==="tr"?`Kaybedildi. ${Math.max(1,(c.returnDay||0)-state.day)} gün sonra geri dönecek.`:`Lost. Returns in ${Math.max(1,(c.returnDay||0)-state.day)} days.`}</div></div></div>);
      const stIdx=c.stage||0; const st=C.stages[Math.min(stIdx,C.stages.length-1)];
      const daysLeft=c.deadlineAt?Math.max(0,Math.ceil((c.deadlineAt-state.elapsed)/120)):null;
      return (<div key={C.id} style={{...base,background:"linear-gradient(135deg,#2a1414,#1a0e0b)",border:`1px solid ${T.red}`,boxShadow:"0 0 18px rgba(192,86,63,.18)"}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <div style={{fontSize:28}}>{C.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:15,color:"#f0a090"}}>{crisisName(C)}</div>
            <div style={{fontSize:12,color:T.inkDim,lineHeight:1.5,margin:"3px 0 8px"}}>{crisisL(C.intro)}</div>
            {c.status==="available" ? (<>
              <div style={{fontSize:11,color:T.inkFaint,marginBottom:8}}>{LANG==="tr"?`3 aşama · her aşama ${st.party}+ kişilik ekip ister · başlayınca her aşama için ${st.days} gün süren olur`:`3 stages · each needs a ${st.party}+ party · once begun, you get ${st.days} days per stage`}</div>
              <GoldBtn onClick={()=>start(C)} style={{width:"100%",background:`linear-gradient(#d0604a,#8a3020)`,color:"#fff"}}>⚔️ {LANG==="tr"?"Krizle yüzleş":"Face the crisis"}</GoldBtn>
            </>) : (<>
              <div style={{display:"flex",gap:4,marginBottom:6}}>{C.stages.map((x,i)=>(<div key={i} style={{flex:1,height:6,borderRadius:3,background:i<stIdx?T.green:i===stIdx?T.gold:T.border}}/>))}</div>
              <div style={{fontSize:13,fontWeight:700,color:T.parchment}}>{LANG==="tr"?`Aşama ${stIdx+1}/3`:`Stage ${stIdx+1}/3`}: {crisisL(st.name)}</div>
              <div style={{fontSize:11,color:T.inkDim,margin:"2px 0 6px"}}>{crisisL(st.text)}</div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:8}}>
                <span style={{color:(daysLeft!=null&&daysLeft<=2)?T.red:T.gold}}>⏳ {c.run?(LANG==="tr"?"Ekip sahada":"Party in the field"):(LANG==="tr"?`${daysLeft} gün kaldı`:`${daysLeft} days left`)}</span>
                <span style={{color:(c.esc||0)>0?T.red:T.inkFaint}}>{LANG==="tr"?"Tırmanma":"Escalation"} {"●".repeat(c.esc||0)}{"○".repeat(3-(c.esc||0))}</span>
              </div>
              {c.run ? (<div><Bar pct={(state.elapsed-c.run.startAt)/(c.run.endAt-c.run.startAt)*100} color={T.red}/>
                  <div style={{fontSize:11,color:T.inkDim,marginTop:4}}>{c.run.party.length} {LANG==="tr"?"kahraman savaşıyor":"heroes fighting"} · {fmtTime(c.run.endAt-state.elapsed)}</div></div>)
                : <GoldBtn onClick={()=>setPick(C.id)} style={{width:"100%"}}>{LANG==="tr"?"Ekibi kur":"Assemble the party"} ›</GoldBtn>}
            </>)}
          </div>
        </div>
      </div>); })}
    {pick && <CrisisPicker C={CRISIS_BY_ID[pick]} state={state} setState={setState} notify={notify} onClose={()=>setPick(null)}/>}
  </div>);
}
function CrisisPicker({C,state,setState,notify,onClose}){
  const c=(state.crises||{})[C.id]||{}; const stIdx=c.stage||0; const st=C.stages[stIdx];
  const pool=state.adventurers.filter(a=>a.status==="idle" && !isSoloHero(a)).sort((a,b)=>b.level-a.level);
  const [sel,setSel]=useState([]);
  const party=pool.filter(a=>sel.includes(a.id));
  const odds=crisisOdds(C, stIdx, party, state, c.esc);
  const toggle=(id)=>setSel(x=>x.includes(id)?x.filter(y=>y!==id):[...x,id]);
  const go=()=>{ if(!odds.ok){ notify(LANG==="tr"?"Ekip koşulları karşılamıyor.":"The party doesn't meet the requirements."); return; }
    setState(s=>{ const cc=(s.crises||{})[C.id]; if(!cc||cc.status!=="active"||cc.run) return s;
      const pay=(st.cost||0)+crisisSupplies(C); if(s.gold<pay) return s;
      const ids=party.map(a=>a.id);
      return {...s, gold:s.gold-pay,
        adventurers:s.adventurers.map(a=>ids.includes(a.id)?{...a,status:"questing",questId:"crisis_"+C.id}:a),
        crises:{...s.crises,[C.id]:{...cc, run:{party:ids, stage:stIdx, startAt:s.elapsed, endAt:s.elapsed+st.duration}}},
        log:[{t:s.elapsed,msg:LANG==="tr"?`⚔️ ${ids.length} kahraman ${C.icon} ${crisisName(C)} — "${crisisL(st.name)}" için yola çıktı. Geri dönmeyenler olabilir.`:`⚔️ ${ids.length} heroes set out for ${C.icon} ${crisisName(C)} — "${crisisL(st.name)}". Not all may return.`},...s.log].slice(0,40)}; });
    notify(LANG==="tr"?"Ekip yola çıktı!":"The party marches!"); onClose(); };
  const pct=Math.round(odds.win*100);
  return (<Modal title={`${C.icon} ${crisisL(st.name)}`} onClose={onClose}>
    <div style={{fontSize:12,color:T.inkDim,marginBottom:10,lineHeight:1.5}}>{crisisL(st.text)}</div>
    <div style={{padding:"10px 12px",borderRadius:9,background:"rgba(160,60,60,.12)",border:`1px solid ${T.red}`,marginBottom:10}}>
      {odds.reqs.map((r,i)=>(<div key={i} style={{fontSize:12,color:r.ok?T.green:T.red,marginBottom:2}}>{r.ok?"✓":"✗"} {LANG==="tr"?r.tr:r.en}</div>))}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}><span style={{fontSize:11,color:T.inkDim}}>{LANG==="tr"?"Ekip gücü / Gereken":"Party power / Needed"}</span>
        <span style={{fontSize:13,fontWeight:700,color:odds.power>=odds.need?T.green:T.gold}}>{odds.power} / {odds.need}</span></div>
      <Bar pct={Math.min(100,odds.power/odds.need*100)} color={odds.power>=odds.need?T.green:T.red} h={6}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}><span style={{fontSize:11,color:T.inkDim}}>{LANG==="tr"?"Zafer şansı":"Win chance"}</span>
        <span style={{fontSize:13,fontWeight:700,color:outcomeColor(pct)}}>~{pct}%</span></div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:11,color:T.red}}>💀 {LANG==="tr"?"Kişi başı ölüm riski (yenilgide / zaferde)":"Death risk per hero (loss / win)"}</span>
        <span style={{fontSize:12,fontWeight:700,color:T.red}}>~{Math.round(odds.deathFail*100)}% / ~{Math.round(odds.deathWin*100)}%</span></div>
      <div style={{fontSize:10,color:T.inkFaint,marginTop:6,lineHeight:1.4}}>{LANG==="tr"?"Şifacılar, Dua Boncukları ve Kemik Emaneti ölüm riskini azaltır. Ekip bağları, Vahşi Boynuz ve Kaliteli Yemekler gücü artırır. Yorgun kahramanlar zayıf düşer. Yalnız Kurt ve Goblin Katili ekiplere katılmaz.":"Healers, Prayer Beads and the Bone Relic cut the death risk. Bonds, the Wild Horn and Quality Meals raise power. Tired heroes fight worse. The Lone Wolf and Goblin Slayer won't join a party."}</div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:300,overflowY:"auto",marginBottom:12}}>
      {pool.length===0 && <div style={{fontSize:12,color:T.inkFaint}}>{LANG==="tr"?"Boşta kimse yok.":"No one is free."}</div>}
      {pool.map(a=>{ const on=sel.includes(a.id); const role=HEALER_CLASSES.includes(a.cls)?"🩹":TANK_CLASSES.includes(a.cls)?"🛡️":"";
        return (<button key={a.id} onClick={()=>toggle(a.id)} style={{display:"flex",gap:9,alignItems:"center",padding:"8px 10px",borderRadius:8,textAlign:"left",
          background:on?T.panel2:"transparent",border:`1px solid ${on?T.gold:T.border}`,color:T.ink,fontFamily:font}}>
          <span style={{fontSize:18}}>{CLASSES[a.cls].icon}</span>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700}}>{heroName(a)} {role}{a.boon?" ⚜️":""}</div>
            <div style={{fontSize:10,color:(a.fatigue||0)>=40?"#e0a23c":T.inkDim}}>Lv {a.level} {clsName(a.cls)} · {LANG==="tr"?"güç":"power"} {heroCrisisPower(a)}{(a.fatigue||0)>=40?` · ${LANG==="tr"?"yorgun":"tired"} ${Math.round(a.fatigue)}%`:""}</div></div>
          <span style={{fontSize:16,color:on?T.gold:T.inkFaint}}>{on?"✓":"○"}</span></button>); })}
    </div>
    <GoldBtn onClick={go} disabled={!odds.ok} style={{width:"100%",background:odds.ok?`linear-gradient(#d0604a,#8a3020)`:undefined,color:odds.ok?"#fff":undefined}}>⚔️ {LANG==="tr"?"Yola çık":"March"} {party.length>0?`(${party.length})`:""}</GoldBtn>
  </Modal>);
}
// ==================== §UI · REQUESTS / İSTEK PANOSU ====================
function RequestsView(props){
  const [view,setView]=useState("board");
  return (<div>
    <div style={{display:"flex",gap:6,marginBottom:12}}>
      <GhostBtn active={view==="board"} onClick={()=>setView("board")} style={{flex:1,fontWeight:view==="board"?700:400}}>📋 {LANG==="tr"?"İstek Panosu":"Request Board"}</GhostBtn>
      <GhostBtn active={view==="merchants"} onClick={()=>setView("merchants")} style={{flex:1,fontWeight:view==="merchants"?700:400}}>⚖️ {LANG==="tr"?"Tüccarlar":"Merchants"}</GhostBtn>
    </div>
    {view==="board" ? <RequestBoard {...props}/> : <MarketView {...props}/>}
  </div>);
}
function RequestBoard({state,setState,notify}){
  const rq=state.requests||{list:[],favor:{},nextDay:state.day+REQ_REFRESH_DAYS};
  const tier=BUILDINGS.treasury.levels[state.buildings.treasury].tier;
  const have=(it)=>state.inventory[it]||0;
  const isLocked=(r)=>r.need.some(n=>itemTier(n.item)>tier);
  const canFill=(r)=>!r.done && r.need.every(n=>have(n.item)>=n.qty);
  const daysLeft=Math.max(1,(rq.nextDay||0)-state.day);
  const gU=t("top.goldUnit");
  const fill=(r)=>{
    if(!canFill(r)) return;
    const favor=(rq.favor||{})[r.group]||0;
    const gold=r.relic?0:reqReward(r,favor,titleIndex(state.renown),legendMod(state).reqPay);
    const ren=reqRenown(r,tier);
    setState(s=>{
      const R=s.requests; if(!R) return s;
      const cur=R.list.find(x=>x.id===r.id); if(!cur||cur.done) return s;
      if(!cur.need.every(n=>(s.inventory[n.item]||0)>=n.qty)) return s;
      const inv={...s.inventory}; cur.need.forEach(n=>{ inv[n.item]-=n.qty; if(inv[n.item]<=0) delete inv[n.item]; });
      const list=R.list.map(x=>x.id===cur.id?{...x,done:true}:x);
      const fav={...(R.favor||{})}; fav[cur.group]=Math.min(25,(fav[cur.group]||0)+1);
      let gold2=gold, renown2=ren, adventurers=s.adventurers;
      const logs=[];
      const gName=catName(cur.group);
      if(cur.relic){
        const rr=RELIC_REQUESTS.find(x=>x.cls===cur.relic);
        const cands=s.adventurers.filter(a=>a.cls===rr.cls && !a.boon).sort((a,b)=>b.level-a.level);
        if(cands.length){ const ch=cands[0]; adventurers=s.adventurers.map(a=>{ if(a.id!==ch.id) return a; const na={...a,boon:rr.boon}; chron(na,s.day,()=>LANG==="tr"?`${catName(cur.group)} ona ${itemName(rr.item)} armağan etti.`:`Was gifted the ${itemName(rr.item)} by the ${catName(cur.group)}.`); return na; });
          logs.push(LANG==="tr"?`⚜️ ${gName} sözünü tuttu: ${ch.name} artık ${itemName(rr.item)} taşıyıcısı — ${boonDesc(rr.boon).toLowerCase()}.`:`⚜️ The ${gName} kept their word: ${ch.name} now bears the ${itemName(rr.item)} — ${boonDesc(rr.boon).toLowerCase()}.`);
        } else { inv[rr.item]=(inv[rr.item]||0)+1;
          logs.push(LANG==="tr"?`⚜️ ${itemName(rr.item)} teslim alındı ve ambara kondu.`:`⚜️ Received the ${itemName(rr.item)} — stored in the warehouse.`); }
      } else {
        logs.push(LANG==="tr"?`📋 ${gName} isteği karşılandı: ${cur.need.map(n=>`${n.qty}× ${itemName(n.item)}`).join(", ")} → +${gold}A${ren>0?`, +${ren} şöhret`:""}.`:`📋 Filled a ${gName} request: ${cur.need.map(n=>`${n.qty}× ${itemName(n.item)}`).join(", ")} → +${gold}G${ren>0?`, +${ren} renown`:""}.`);
      }
      // bonus when every regular request of a group is done this cycle
      const bonusPaid={...(R.bonusPaid||{})};
      const grp=list.filter(x=>x.group===cur.group && !x.relic);
      if(!cur.relic && grp.length && grp.every(x=>x.done) && !bonusPaid[cur.group]){
        const bonus=Math.round(grp.reduce((a,x)=>a+x.base,0)*0.25); bonusPaid[cur.group]=true;
        gold2+=bonus; renown2+=2;
        logs.push(LANG==="tr"?`🎉 ${gName} bu dönemki bütün isteklerinden memnun kaldı! Teşekkür hediyesi: +${bonus}A, +2 şöhret.`:`🎉 The ${gName} are delighted — every request filled! Thank-you gift: +${bonus}G, +2 renown.`);
      }
      const stats={...(s.stats||{}),requests:((s.stats&&s.stats.requests)||0)+1,omenFills:((s.stats&&s.stats.omenFills)||0)+(cur.boost?1:0)};
      return {...s,inventory:inv,adventurers,gold:s.gold+gold2,renown:(s.renown||0)+renown2,stats,
        requests:{...R,list,favor:fav,bonusPaid},
        log:[...logs.reverse().map(m=>({t:s.elapsed,msg:m})),...s.log].slice(0,40)};
    });
    notify(r.relic?(LANG==="tr"?"⚜️ Emanet kazanıldı!":"⚜️ Relic earned!"):`+${gold}${gU}`); Audio.play("sell");
  };
  const readyCount=rq.list.filter(canFill).length;
  return (<div style={{animation:"fadeUp .3s"}}>
    <Panel style={{marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
      <div>
        <div style={{fontSize:11,color:T.gold,letterSpacing:1.5,textTransform:"uppercase"}}>📋 {LANG==="tr"?"İstek Panosu":"Request Board"}</div>
        <div style={{fontSize:12,color:T.inkDim,marginTop:3}}>{LANG==="tr"?"Tüccara satmaktan çok daha kârlı. Her teslimat o grubun gözünde itibarını artırır. 🔒 kilitli bölgelerden gelen istekler, ilerledikçe ulaşacağın ödüllerdir.":"Pays far better than merchants. Every delivery raises your favor with that group. 🔒 requests from closed regions show what awaits as you grow."}</div>
      </div>
      <div style={{textAlign:"right",minWidth:78}}>
        <div style={{fontSize:10,color:T.inkFaint}}>{LANG==="tr"?"Yenilenmesine":"Refreshes in"}</div>
        <div style={{fontSize:15,fontWeight:700,color:T.ink}}>{daysLeft} {LANG==="tr"?"gün":(daysLeft>1?"days":"day")}</div>
        {readyCount>0 && <div style={{fontSize:10,color:T.green,fontWeight:700}}>✓ {readyCount} {LANG==="tr"?"hazır":"ready"}</div>}
      </div>
    </Panel>
    {(()=>{ const om=OMENS.find(o=>o.id===rq.omen); return om ? <Panel style={{marginBottom:12,border:`1px solid ${T.gold}`,background:"linear-gradient(135deg,#2a2112,#1c140d)"}}>
      <div style={{fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:T.gold,marginBottom:4}}>🌍 {LANG==="tr"?"Diyardan Haberler":"News of the Realm"}</div>
      <div style={{fontSize:12,color:T.ink,lineHeight:1.5}}>{LANG==="tr"?om.tr:om.en}</div></Panel> : null; })()}
    {REQ_GROUPS.map(g=>{
      const items=rq.list.filter(r=>r.group===g);
      const regular=items.filter(r=>!r.relic);
      const doneN=regular.filter(r=>r.done).length;
      const favor=(rq.favor||{})[g]||0; const fm=Math.round((favorMult(favor)-1)*100);
      return (<div key={g} style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
          <div style={{fontSize:13,fontWeight:700,color:T.gold}}>{MARKET_CATS[g].icon} {catName(g)} <span style={{fontSize:11,color:T.inkFaint,fontWeight:400}}>· {doneN}/{regular.length}</span></div>
          <div style={{fontSize:10,color:fm>0?T.green:T.inkFaint}}>{LANG==="tr"?"İtibar":"Favor"} {favor}/25{fm>0?(LANG==="tr"?` · ödül +%${fm}`:` · pay +${fm}%`):""}</div>
        </div>
        <div style={{fontSize:11,color:T.inkDim,marginBottom:8}}>{reqDesc(g)}</div>
        {items.length===0 && <div style={{fontSize:11,color:T.inkFaint}}>{LANG==="tr"?"Şu an istek yok.":"No requests right now."}</div>}
        {items.map(r=>{ const ok=canFill(r); const gold=reqReward(r,favor,titleIndex(state.renown),legendMod(state).reqPay); const ren=reqRenown(r,tier);
          const rr=r.relic?RELIC_REQUESTS.find(x=>x.cls===r.relic):null;
          return (<Panel key={r.id} style={{marginBottom:7,padding:10,opacity:r.done?0.45:1,
            border:`1px solid ${r.relic?T.gold:ok?T.green:T.border}`,background:r.relic?"linear-gradient(135deg,#2a2112,#1c140d)":T.panel}}>
            {!rr && isLocked(r) && !r.done && (()=>{ const reg=itemRegion(r.need[0].item); const rt=itemTier(r.need[0].item);
              return <div style={{fontSize:10,color:T.inkFaint,marginBottom:5}}>🔒 {LANG==="tr"?`${reg?regionName(reg):""} henüz kapalı — Lonca Ruhsatı'nı kademe ${rt}'e yükselt`:`${reg?regionName(reg):""} is still closed — raise the Guild Charter to tier ${rt}`}</div>; })()}
            {rr && <div style={{fontSize:11,color:T.gold,fontWeight:700,marginBottom:5}}>⚜️ {LANG==="tr"?`Özel istek — karşılığında ${clsName(rr.cls)} için ${itemName(rr.item)}`:`Special request — rewards the ${itemName(rr.item)} for your ${clsName(rr.cls)}`}
              <div style={{fontSize:10,color:T.inkDim,fontWeight:400}}>{boonDesc(rr.boon)}</div></div>}
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{flex:1,minWidth:0}}>
                {r.need.map(n=>{ const h=have(n.item); const enough=h>=n.qty; const src=itemSource(n.item);
                  return (<div key={n.item} style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
                    <span style={{fontSize:18}}>{ITEMS[n.item].icon}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.ink}}>{n.qty}× {itemName(n.item)}</div>
                      <div style={{fontSize:10,color:enough?T.green:T.inkFaint}}>{LANG==="tr"?"Elinde":"Have"}: {h}/{n.qty}{!enough&&src?<span style={{color:T.inkFaint}}> · {src}</span>:""}</div>
                    </div></div>); })}
              </div>
              <div style={{textAlign:"right",minWidth:84}}>
                {!r.relic && <div style={{fontSize:14,fontWeight:700,color:T.gold}}>{r.boost?"🔥 ":""}+{gold}{gU}</div>}
                {!r.relic && ren>0 && <div style={{fontSize:10,color:T.inkDim}}>+{ren} {LANG==="tr"?"şöhret":"renown"}</div>}
                {r.done ? <div style={{fontSize:12,color:T.green,fontWeight:700,marginTop:4}}>✓ {LANG==="tr"?"Teslim edildi":"Delivered"}</div>
                  : <GoldBtn onClick={()=>fill(r)} disabled={!ok} style={{padding:"7px 10px",marginTop:4,fontSize:12}}>{LANG==="tr"?"Teslim Et":"Deliver"}</GoldBtn>}
              </div>
            </div>
          </Panel>); })}
      </div>); })}
  </div>);
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
      return {...s,gold:s.gold+gain,inventory:inv,market:m,renown:s.renown+trophyRenown(item)*n,
        stats:{...(s.stats||{quests:0,sold:0,maxParty:0}),sold:((s.stats&&s.stats.sold)||0)+1},
        log:[{t:s.elapsed,msg:LANG==="tr"?`${n}× ${itemName(item)} ${gain}A'ya satıldı.`:`Sold ${n}× ${itemName(item)} for ${gain}G.`},...s.log].slice(0,40)}; });
    notify(LANG==="tr"?`+${gain}A`:`+${gain}G`); Audio.play("sell");
  };
  const sellAll=()=>{ let gain=0; owned.forEach(([k,v])=>gain+=unitPrice(k,mkt)*v);
    if(gain<=0)return;
    setState(s=>{ const m={...(s.market||freshMarket())};
      // bulk dump depresses every category that was sold
      owned.forEach(([k,v])=>{ const cat=catOf(k); if(cat==="raw")return; const cur=(m[cat]&&m[cat].price)||1.0; m[cat]={price:Math.max(0.6,cur-v*0.008)}; });
      return {...s,gold:s.gold+gain,inventory:{},market:m,renown:s.renown+owned.reduce((a,[k,v])=>a+trophyRenown(k)*v,0),
        log:[{t:s.elapsed,msg:LANG==="tr"?`Tüm stok ${gain}A'ya satıldı.`:`Sold entire stock for ${gain}G.`},...s.log].slice(0,40)}; }); notify(LANG==="tr"?`Her şey satıldı: +${gain}A`:`Sold everything: +${gain}G`); };
  const total=owned.reduce((a,[k,v])=>a+unitPrice(k,mkt)*v,0);
  const hasMoodGoods=owned.some(([k])=>catOf(k)!=="raw");
  return (<div style={{animation:"fadeUp .3s"}}>
    <div style={{fontSize:12,color:T.inkDim,marginBottom:10,lineHeight:1.5}}>⚖️ {LANG==="tr"?"Gezgin tüccarlar her şeyi alır ama pazarlık yapmaz. Daha iyi fiyat için önce İstek Panosu'na bak.":"Travelling merchants buy anything, but they don't haggle. Check the Request Board first for better prices."}</div>
    <Panel style={{marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:11,color:T.gold,letterSpacing:1.5,textTransform:"uppercase"}}>{LANG==="tr"?"Stok Değeri":"Stock Value"}</div>
        <div style={{fontSize:22,fontWeight:700,color:T.ink}}>{total.toLocaleString()}{t("top.goldUnit")}</div></div>
      <GoldBtn onClick={sellAll} disabled={total<=0}>{t("market.sellAll")}{total>0?` · ${total.toLocaleString()}${t("top.goldUnit")}`:""}</GoldBtn>
    </Panel>
    {hasMoodGoods && <><SectionTitle sub={t("market.pricesSub")}>{t("market.pricesToday")}</SectionTitle>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
      {Object.entries(MARKET_CATS).filter(([cat])=>cat!=="raw").map(([cat,info])=>{ const p=(mkt[cat]&&mkt[cat].price)||1.0;
        const pct=Math.round(p*100); const hot=p>=1.15, cold=p<=0.85;
        return (<div key={cat} style={{flex:"1 1 30%",minWidth:96,background:T.panel,border:`1px solid ${hot?T.green:cold?T.red:T.border}`,
          borderRadius:8,padding:"7px 9px"}}>
          <div style={{fontSize:11,color:T.ink,fontWeight:700}}>{info.icon} {catName(cat)}</div>
          <div style={{fontSize:13,fontWeight:700,color:hot?T.green:cold?T.red:T.inkDim}}>
            {pct}% {hot?"▲":cold?"▼":""}</div>
        </div>); })}
    </div></>}
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
        <div style={{fontSize:11,color:T.gold,textTransform:"uppercase",letterSpacing:1.5}}>🛢️ {LANG==="tr"?"Ambar":"Warehouse"}</div>
        <div style={{fontSize:13,fontWeight:700,color:nearFull?T.red:T.ink}}>{total} / {cap}</div>
      </div>
      <Bar pct={pct} color={nearFull?T.red:T.gold} h={8}/>
      <div style={{fontSize:11,color:nearFull?T.red:T.inkDim,marginTop:6}}>
        {nearFull?(LANG==="tr"?"⚠️ Neredeyse dolu — seferler ganimet bırakabilir. Geliştirmeler sekmesinden yükselt.":"⚠️ Nearly full — expeditions may leave loot behind. Upgrade in the Upgrades tab."):(LANG==="tr"?`Toplam stok değeri ${value.toLocaleString()}A`:`Total stock value ${value.toLocaleString()}G`)}</div>
    </Panel>
    <SectionTitle sub={t("store.roomSub")}>{t("store.room")}</SectionTitle>
    {owned.length===0 && <div style={{textAlign:"center",color:T.inkFaint,padding:30,fontSize:13}}>{LANG==="tr"?"Boş. Seferlerden gelen ganimetler burada durur.":"Empty. Loot from expeditions is stored here."}</div>}
    {["raw","mid","fin"].map(tg=>{ const grp=owned.filter(([k])=>ITEMS[k].tier===tg); if(!grp.length)return null;
      return (<div key={tg} style={{marginBottom:14}}>
        <div style={{fontSize:10,color:T.inkFaint,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
          {t("tier."+tg)}</div>
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
  const gTier=BUILDINGS.treasury.levels[state.buildings.treasury].tier;
  const upgrade=(key)=>{ const b=BUILDINGS[key]; const cur=state.buildings[key]||0; const next=cur+1;
    if(b.needTier && gTier<b.needTier){notify(LANG==="tr"?`Önce lonca kademesi ${b.needTier} gerekir.`:`Requires guild tier ${b.needTier}.`);return;}
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
    {Object.entries(BUILDINGS).map(([key,b],idx,arr)=>{ const cur=state.buildings[key]||0; const next=cur+1;
      const maxed=next>=b.levels.length; const nextLv=maxed?null:b.levels[next]; const curLv=b.levels[cur];
      const newGroup=b.group && (idx===0 || arr[idx-1][1].group!==b.group);
      return (<React.Fragment key={key}>
      {newGroup && <div style={{margin:"14px 0 6px"}}>
        <div style={{fontSize:13,fontWeight:700,color:T.gold}}>{BUILDING_GROUPS[b.group].icon} {buildingName(b.group)}</div>
        <div style={{fontSize:11,color:T.inkDim}}>{buildingDesc(b.group)}</div>
        {b.group==="training" && (state.mentors||[]).length>0 && <div style={{fontSize:11,color:T.green,marginTop:3}}>🎓 {LANG==="tr"?"Eğitmenler":"Trainers"}: {(state.mentors||[]).map(m=>m.name).join(", ")} ({LANG==="tr"?`talim +${mentorBonus(state).trainXp} TP, sefer +%${Math.round((mentorBonus(state).xpMult-1)*100)} TP`:`training +${mentorBonus(state).trainXp} XP, expeditions +${Math.round((mentorBonus(state).xpMult-1)*100)}% XP`})</div>}</div>}
      <Panel style={{marginBottom:10,marginLeft:b.group?10:0,borderLeft:b.group?`3px solid ${T.goldDim}`:undefined}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <div style={{fontSize:24}}>{b.icon}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div style={{fontWeight:700,fontSize:14,color:T.ink}}>{buildingName(key)}</div>
              <div style={{fontSize:11,color:T.gold}}>Lv {cur}{maxed?" · "+t("build.max"):""}</div>
            </div>
            <div style={{fontSize:11,color:T.inkDim,margin:"3px 0 8px"}}>{buildingDesc(key)}</div>
            <div style={{fontSize:10,color:T.inkFaint,marginBottom:8}}>{describeBuilding(key,curLv,nextLv)}</div>
            {!maxed && b.needTier && gTier<b.needTier && <div style={{fontSize:11,color:T.inkFaint,marginBottom:6}}>🔒 {LANG==="tr"?`Lonca kademesi ${b.needTier} gerekir`:`Requires guild tier ${b.needTier}`}</div>}
            {!maxed && <GoldBtn onClick={()=>upgrade(key)} disabled={state.gold<nextLv.cost || (b.needTier && gTier<b.needTier)} style={{width:"100%"}}>
              {t("build.upgrade")} — {nextLv.cost.toLocaleString()}{t("top.goldUnit")}</GoldBtn>}
          </div>
        </div>
      </Panel></React.Fragment>); })}
  </div>);
}
function describeBuilding(key,cur,next){
  const fmt=(lv)=>{
    if(key==="dorm_rooms")return LANG==="tr"?`${lv.capacity} kişilik yer`:`room for ${lv.capacity}`;
    if(key==="dorm_beds")return LANG==="tr"?`dinlenme +${lv.restBonus||0}`:`rest +${lv.restBonus||0}`;
    if(key==="dorm_comfort")return LANG==="tr"?`kira ${lv.rentPerHead}A/kişi`:`rent ${lv.rentPerHead}G/head`;
    if(key==="tav_meals")return LANG==="tr"?`+%${Math.round(lv.successBonus*100)} sefer başarısı`:`+${Math.round(lv.successBonus*100)}% expedition success`;
    if(key==="tav_bard")return LANG==="tr"?`günlük dostluk +${lv.relBonus}`:`daily bonding +${lv.relBonus}`;
    if(key==="dorm_bath")return LANG==="tr"?`dinlenirken iyileşme +%${Math.round(lv.healBonus*100)}`:`resting heal +${Math.round(lv.healBonus*100)}%`;
    if(key==="train_dummies")return LANG==="tr"?`${lv.trainSlots} kişi talim yapabilir, ${lv.trainXp} TP / 5 sn`:`${lv.trainSlots} can train, ${lv.trainXp} XP per 5s`;
    if(key==="train_mentor")return LANG==="tr"?`seferden +%${Math.round(lv.xpBonus*100)} TP`:`+${Math.round(lv.xpBonus*100)}% expedition XP`;
    if(key==="inf_ward")return LANG==="tr"?`iyileşme süresi %${Math.round(lv.injuryMult*100)}`:`recovery time ${Math.round(lv.injuryMult*100)}%`;
    if(key==="inf_herbs")return LANG==="tr"?`yaralanma −%${Math.round(lv.injuryCut*100)}`:`injury −${Math.round(lv.injuryCut*100)}%`;
    if(key==="stable_horses")return LANG==="tr"?`sefer süresi %${Math.round(lv.speedMult*100)}`:`trip time ${Math.round(lv.speedMult*100)}%`;
    if(key==="stable_carts")return LANG==="tr"?`ganimet +%${Math.round(lv.lootBonus*100)}`:`loot +${Math.round(lv.lootBonus*100)}%`;
    if(key==="watch_tower")return LANG==="tr"?`${lv.patrolSlots} kişi devriye gezebilir, gelir ×${lv.patrolGold}`:`${lv.patrolSlots} can patrol, income ×${lv.patrolGold}`;
    if(key==="tav_cellar")return LANG==="tr"?`yemek-içki ${lv.foodPerHead}A/kişi`:`food & ale ${lv.foodPerHead}G/head`;
    if(key==="notice_board")return LANG==="tr"?`${lv.questSlots} görev yuvası`:`${lv.questSlots} quest slots`;
    if(key==="treasury")return LANG==="tr"?`lonca kademesi ${lv.tier}`:`guild tier ${lv.tier}`;
    if(key==="monuments")return LANG==="tr"?`şöhret +${lv.renownBonus}`:`renown +${lv.renownBonus}`;
    if(key==="guild_accountant")return LANG==="tr"?`maaşlar %${Math.round(lv.wageMult*100)}`:`wages ${Math.round(lv.wageMult*100)}%`;
    if(key==="guild_herald")return LANG==="tr"?`${lv.recruitSlots} aday${lv.rareBoost?`, nadir şansı +${lv.rareBoost}`:""}`:`${lv.recruitSlots} candidates${lv.rareBoost?`, rare chance +${lv.rareBoost}`:""}`;
    if(key==="warehouse")return LANG==="tr"?`${lv.capacity} depo`:`${lv.capacity} storage`;
    return "";
  };
  return next?`${fmt(cur)}  →  ${fmt(next)}`:fmt(cur);
}
