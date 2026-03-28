/**
 * Maobai Learning Engine v4 — engine.js 
 * Upgraded with Memory-First Supabase Sync, Deep Mistake Tracking, 
 * and Variable Rewards (Mystery Chests) for ultimate retention!
 */

// ═══════════════════════════════════════════════════════════
// PART 1: CORE ENGINE
// ═══════════════════════════════════════════════════════════
const MaobaiEngine = (() => {

  const CFG = {
    supabaseUrl:    'https://cuiznbvvlqtwcoocehnd.supabase.co',
    supabaseKey:    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1aXpuYnZ2bHF0d2Nvb2NlaG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzI0NTUsImV4cCI6MjA4OTI0ODQ1NX0.QXAjvDdvih1ue1W8BaoqBfBr_fUJb9W5FYFZSC_JI8w',

    // Resources
    ENERGY_MAX:          25,
    ENERGY_REGEN_MS:     3 * 60 * 1000,
    HEART_MAX:           5,
    HEART_REGEN_MS:      30 * 60 * 1000,
    ENERGY_AD_REWARD:    15,
    HEART_AD_REWARD:     1,

    // Lesson structure
    EXERCISES_PER_LESSON:   15,   
    NEW_WORD_EXERCISES:      5,   
    REVIEW_WORD_EXERCISES:  10,   
    WORDS_PER_LESSON:    { 1:3, 2:3, 3:4, 4:4, 5:4, 6:4 },
    LESSONS_PER_LEVEL:   { 1:50, 2:50, 3:75, 4:150, 5:325, 6:625 },

    // Checkpoints & Rewards
    CHECKPOINT_EVERY: 5,
    XP_PER_LESSON:        20,
    XP_PER_CHECKPOINT:    30,
    DIAMONDS_PER_LESSON:  10,
    DIAMONDS_CHECKPOINT:  20,
    CHEST_DROP_CHANCE:    0.25, // 25% chance for a mystery chest on checkpoints

    // SRS intervals (ms)
    SRS_INTERVALS_MS:[
      0,
      1  * 24*60*60*1000,   // 1 day
      3  * 24*60*60*1000,   // 3 days
      7  * 24*60*60*1000,   // 7 days
      14 * 24*60*60*1000,   // 14 days
      30 * 24*60*60*1000,   // 30 days
    ],

    EXERCISE_UNLOCK: {
      'word_intro':        1,
      'select_image':      1,   
      'word_meaning':      1,   
      'tap_what_you_hear': 2,   
      'select_translation':3,   
      'word_bank_build':   4,   
      'word_order':        8,   
      'gap_fill':          2,   
      'select_meaning':    1,   
    },
  };

  let _sb  = null;
  let _uid = null;
  let _exerciseRegistry = {};
  
  // High-Speed Memory Cache
  let _memorySRS = null;
  let _memoryMistakes = null;

  // ── INIT ──
  async function init() {
    _sb = window._sb || window._supabaseClient ||
          (window.supabase ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey) : null);
    if (!_sb) throw new Error('Supabase client not found');
    const { data: { session } } = await _sb.auth.getSession();
    _uid = session?.user?.id || null;
    
    // Load data into high-speed memory on boot
    if (_uid && !_memorySRS) {
      await _loadUserData();
    }
    
    _startRegens();
    return { userId: _uid };
  }

  // ── MEMORY & STORAGE ──
  const lk = k => `${k}_${_uid}`;
  function lsGet(k, fb = null) {
    try { const v = localStorage.getItem(lk(k)); return v !== null ? JSON.parse(v) : fb; } catch { return fb; }
  }
  function lsSet(k, v) { try { localStorage.setItem(lk(k), JSON.stringify(v)); } catch {} }

  async function sbUpsert(table, row, conflict = 'user_id') {
    if (!_uid || !_sb) return;
    try { await _sb.from(table).upsert({ user_id: _uid, ...row }, { onConflict: conflict }); } catch {}
  }

  // Fetch SRS & Mistakes into memory once to keep UI ultra-fast
  async function _loadUserData() {
    _memorySRS = {};
    _memoryMistakes = {};
    try {
      const [srsRes, misRes] = await Promise.all([
        _sb.from('user_srs_items').select('*').eq('user_id', _uid),
        _sb.from('user_mistakes').select('*').eq('user_id', _uid).eq('is_resolved', false)
      ]);
      
      if (srsRes.data) {
        srsRes.data.forEach(row => {
          _memorySRS[row.word_id] = {
            interval: row.interval,
            easeFactor: row.ease_factor,
            repetitions: row.repetitions,
            nextReview: new Date(row.next_review_at).getTime(),
            lastSeen: new Date(row.last_seen_at).getTime(),
            correctCount: 0, wrongCount: 0 // Local session counters
          };
        });
      }
      
      if (misRes.data) {
        misRes.data.forEach(row => {
           _memoryMistakes[row.word_id] = row.fail_count;
        });
      }
    } catch(e) {
      console.warn('Failed to load remote data, falling back to local');
      _memorySRS = lsGet('srs', {});
      _memoryMistakes = lsGet('mistake_words', {});
    }
  }

  // ── WORD FETCHER ──
  async function fetchWords(level) {
    const ck = `wcache_l${level}`, ct = `wcache_ts_l${level}`;
    const ts = lsGet(ct, 0);
    if (Date.now() - ts < 300000) { const c = lsGet(ck, null); if (c) return c; }
    try {
      const { data, error } = await _sb.from('words').select('*').eq('hsk_level', level);
      if (error) throw error;
      lsSet(ck, data); lsSet(ct, Date.now());
      return data;
    } catch { return lsGet(ck,[]); }
  }

  async function fetchLessonWords(lessonId) {
    const level = parseInt(lessonId.split('-')[0]);
    const all = await fetchWords(level);
    return all.filter(w => w.lesson_id === lessonId);
  }

  async function fetchLearnedWords(level, upToLesson) {
    const all = await fetchWords(level);
    const learned =[];
    for (let i = 1; i < upToLesson; i++) {
      const lid = `${level}-${i}`;
      learned.push(...all.filter(w => w.lesson_id === lid));
    }
    return learned;
  }

  // ── SRS — SM-2 ALGORITHM (Memory-First Sync) ──
  function getSRS() { return _memorySRS || lsGet('srs', {}); }
  function saveSRS(srs) { _memorySRS = srs; lsSet('srs', srs); } // Local storage as backup

  function getSRSEntry(wordId) {
    return getSRS()[wordId] || { interval: 0, easeFactor: 2.5, repetitions: 0, nextReview: 0, correctCount: 0, wrongCount: 0 };
  }

  function updateSRS(wordId, score, errorType = 'reading') {
    const srs   = getSRS();
    const entry = getSRSEntry(wordId);
    const now   = Date.now();
    
    if (score === 0) {
      entry.repetitions = 0;
      entry.interval    = CFG.SRS_INTERVALS_MS[1];
      entry.wrongCount  = (entry.wrongCount || 0) + 1;
      _recordMistake(wordId, errorType); // Log detailed mistake
    } else {
      entry.correctCount = (entry.correctCount || 0) + 1;
      entry.interval = entry.repetitions === 0 ? CFG.SRS_INTERVALS_MS[1]
                     : entry.repetitions === 1 ? CFG.SRS_INTERVALS_MS[2]
                     : Math.min(Math.round(entry.interval * entry.easeFactor), CFG.SRS_INTERVALS_MS[5]);
      entry.easeFactor = Math.max(1.3, entry.easeFactor + 0.1 - (3 - score) * (0.08 + (3 - score) * 0.02));
      entry.repetitions++;
      if (entry.correctCount >= 2) _clearMistake(wordId); // Resolved!
    }
    
    entry.nextReview = now + entry.interval;
    entry.lastSeen   = now;
    srs[wordId] = entry;
    saveSRS(srs); // Sync to High-Speed Memory
    
    // Async background sync to Supabase (Does not block UI)
    if (_uid && _sb) {
      _sb.from('user_srs_items').upsert({
        user_id: _uid,
        word_id: wordId,
        interval: entry.interval,
        ease_factor: entry.easeFactor,
        repetitions: entry.repetitions,
        next_review_at: new Date(entry.nextReview).toISOString(),
        last_seen_at: new Date(now).toISOString()
      }, { onConflict: 'user_id,word_id' }).then();
    }
    return entry;
  }

  // ── DEEP MISTAKE TRACKING ──
  function getMistakeWords() { return _memoryMistakes || lsGet('mistake_words', {}); }

  function _recordMistake(wordId, errorType = 'reading') {
    const mistakes = getMistakeWords();
    mistakes[wordId] = (mistakes[wordId] || 0) + 1; // Increment fail count
    _memoryMistakes = mistakes;
    lsSet('mistake_words', mistakes); // Backup

    // Background sync to Supabase user_mistakes table
    if (_uid && _sb) {
      _sb.from('user_mistakes').upsert({
        user_id: _uid,
        word_id: wordId,
        error_type: errorType,
        fail_count: mistakes[wordId],
        last_failed_at: new Date().toISOString(),
        is_resolved: false
      }, { onConflict: 'user_id,word_id' }).then();
    }
  }

  function _clearMistake(wordId) {
    const mistakes = getMistakeWords();
    delete mistakes[wordId];
    _memoryMistakes = mistakes;
    lsSet('mistake_words', mistakes);

    // Background sync to mark resolved
    if (_uid && _sb) {
      _sb.from('user_mistakes').update({ is_resolved: true })
         .eq('user_id', _uid).eq('word_id', wordId).then();
    }
  }

  function prioritiseByMistakes(words) {
    const mistakes = getMistakeWords();
    return [...words].sort((a, b) => (mistakes[b.id] || 0) - (mistakes[a.id] || 0));
  }

  // ── SESSION BUILDER ──
  async function buildSession({ level, lessonNum, lessonId, mode = 'new' }) {
    await init();

    const isCheckpoint = lessonNum % CFG.CHECKPOINT_EVERY === 0 && mode !== 'review';
    if (isCheckpoint) return await _buildCheckpointSession({ level, lessonNum, lessonId });

    const newWords = await fetchLessonWords(lessonId);
    if (!newWords.length) throw new Error(`No words found for lesson ${lessonId}.`);

    const learnedWords = await fetchLearnedWords(level, lessonNum);
    const srs  = getSRS();
    const now  = Date.now();
    const newIds = new Set(newWords.map(w => w.id));
    const prior  = learnedWords.filter(w => !newIds.has(w.id));

    const mistakes    = prioritiseByMistakes(prior.filter(w => getMistakeWords()[w.id]));
    const due         = _shuffle(prior.filter(w => !getMistakeWords()[w.id] && srs[w.id]?.nextReview <= now));
    const learned     = _shuffle(prior.filter(w => !getMistakeWords()[w.id] && srs[w.id] && srs[w.id].nextReview > now));
    const reviewPool  =[...mistakes, ...due, ...learned].slice(0, 20);

    const allLevel   = await fetchWords(level);
    const usedIds    = new Set([...newWords.map(w => w.id), ...reviewPool.map(w => w.id)]);
    const distractors = _shuffle(allLevel.filter(w => !usedIds.has(w.id))).slice(0, 12);

    const unlockedTypes = _getUnlockedTypes(lessonNum);
    const exercises = await _buildExercises(newWords, reviewPool, learnedWords, distractors, unlockedTypes, mode);

    return {
      sessionId:      `${lessonId}-${Date.now()}`,
      lessonId, level, lessonNum, mode,
      isCheckpoint:   false,
      words:          newWords,
      reviewWords:    reviewPool.slice(0, 8),
      exercises,
      totalExercises: exercises.length,
      xpReward:       CFG.XP_PER_LESSON,
      diamonds:       CFG.DIAMONDS_PER_LESSON,
    };
  }

  async function _buildCheckpointSession({ level, lessonNum, lessonId }) {
    const start = lessonNum - CFG.CHECKPOINT_EVERY + 1;
    const allLevel = await fetchWords(level);
    const checkpointWords =[];
    for (let i = start; i <= lessonNum; i++) {
      checkpointWords.push(...allLevel.filter(w => w.lesson_id === `${level}-${i}`));
    }
    const distractors = _shuffle(allLevel.filter(w => !checkpointWords.some(cw => cw.id === w.id))).slice(0, 12);
    const unlockedTypes = _getUnlockedTypes(lessonNum);

    const exercises = [];
    const types =['select_image','word_meaning','tap_what_you_hear','select_meaning','gap_fill',
                   'select_translation','word_bank_build','word_meaning','select_image','tap_what_you_hear',
                   'gap_fill','select_translation','word_meaning','select_image','word_order',
                   'select_meaning','word_bank_build','gap_fill','tap_what_you_hear','word_meaning']
                   .filter(t => unlockedTypes.includes(t));

    const pool = _shuffle([...checkpointWords]);
    let wi = 0;
    for (let i = 0; i < Math.min(types.length, 20); i++) {
      const word = pool[wi % pool.length]; wi++;
      const handler = _exerciseRegistry[types[i]];
      if (!handler) continue;
      const ex = await handler.build(word, checkpointWords, distractors);
      if (ex) exercises.push({ ...ex, type: types[i], wordId: word.id, index: exercises.length });
    }

    return {
      sessionId:      `${lessonId}-cp-${Date.now()}`,
      lessonId, level, lessonNum,
      isCheckpoint:   true,
      checkpointRange:`Lessons ${lessonNum - CFG.CHECKPOINT_EVERY + 1}–${lessonNum}`,
      words:          checkpointWords,
      reviewWords:    checkpointWords,
      exercises,
      totalExercises: exercises.length,
      xpReward:       CFG.XP_PER_CHECKPOINT,
      diamonds:       CFG.DIAMONDS_CHECKPOINT,
    };
  }

  async function _buildExercises(newWords, reviewPool, learnedWords, distractors, unlockedTypes, mode) {
    const exercises =[];
    const newDrillTypes = ['select_image','word_meaning','select_meaning','tap_what_you_hear']
      .filter(t => unlockedTypes.includes(t));

    for (let i = 0; i < newWords.length && exercises.length < CFG.NEW_WORD_EXERCISES; i++) {
      const word = newWords[i];
      const introHandler = _exerciseRegistry['word_intro'];
      if (introHandler && exercises.length < CFG.NEW_WORD_EXERCISES) {
        const ex = await introHandler.build(word, [...newWords, ...reviewPool], distractors);
        if (ex) exercises.push({ ...ex, type: 'word_intro', wordId: word.id, index: exercises.length, isNew: true });
      }
      if (newDrillTypes.length > 0 && exercises.length < CFG.NEW_WORD_EXERCISES) {
        const type = newDrillTypes[i % newDrillTypes.length];
        const handler = _exerciseRegistry[type];
        if (handler) {
          const ex = await handler.build(word, [...newWords, ...reviewPool], distractors);
          if (ex) exercises.push({ ...ex, type, wordId: word.id, index: exercises.length, isNew: true });
        }
      }
    }

    const reviewTypeQueue =[
      'select_image','word_meaning','tap_what_you_hear','gap_fill','select_meaning',
      'select_translation','word_bank_build','select_image','word_meaning','word_order',
    ].filter(t => unlockedTypes.includes(t));

    const fallbackPool = reviewPool.length > 0 ? reviewPool : newWords;
    const shuffledReview = _shuffle([...fallbackPool]);
    let ri = 0, typeI = 0;

    while (exercises.length < CFG.EXERCISES_PER_LESSON) {
      if (typeI >= reviewTypeQueue.length * 4) break; 
      const type    = reviewTypeQueue[typeI % reviewTypeQueue.length]; typeI++;
      const word    = shuffledReview[ri % shuffledReview.length]; ri++;
      const handler = _exerciseRegistry[type];
      if (!handler) continue;
      const ex = await handler.build(word, [...newWords, ...shuffledReview], distractors);
      if (ex) exercises.push({ ...ex, type, wordId: word.id, index: exercises.length, isNew: false });
    }

    return exercises;
  }

  function _getUnlockedTypes(lessonNum) {
    return Object.entries(CFG.EXERCISE_UNLOCK)
      .filter(([, n]) => lessonNum >= n)
      .map(([t]) => t);
  }

  // ── ANSWER PROCESSING ──
  async function processAnswer(exercise, userAnswer) {
    const handler = _exerciseRegistry[exercise.type];
    if (!handler) return { correct: false, score: 0, xpGained: 0, heartLost: false };
    const { correct, score } = handler.validate(userAnswer, exercise);
    
    // Auto-detect error type based on the exercise they failed
    let errorType = 'reading';
    if (exercise.type === 'tap_what_you_hear') errorType = 'listening';
    else if (exercise.type === 'select_translation' || exercise.type === 'word_bank_build') errorType = 'translation';
    else if (exercise.type === 'word_order' || exercise.type === 'gap_fill') errorType = 'grammar';

    updateSRS(exercise.wordId, correct ? score : 0, errorType);
    
    let heartLost = false;
    if (!correct) heartLost = await _loseHeart();
    return { correct, score, xpGained: 0, heartLost, correctAnswer: exercise.correctAnswer, explanation: exercise.explanation };
  }

  // ── LESSON COMPLETION & VARIABLE REWARDS ──
  async function completeLesson({ lessonId, level, lessonNum, correctCount, totalCount, isCheckpoint }) {
    const xp       = isCheckpoint ? CFG.XP_PER_CHECKPOINT : CFG.XP_PER_LESSON;
    const diamonds = isCheckpoint ? CFG.DIAMONDS_CHECKPOINT : CFG.DIAMONDS_PER_LESSON;
    let chestDropped = false;

    await _addXP(xp);
    _addDiamonds(diamonds);

    // Skinner Box: 25% Chance to drop a Mystery Chest on Checkpoints!
    if (isCheckpoint && Math.random() < CFG.CHEST_DROP_CHANCE) {
      chestDropped = true;
      if (_uid && _sb) {
         // Read-then-write fallback to increment inventory
         _sb.from('user_inventory').select('mystery_chests').eq('user_id', _uid).maybeSingle()
           .then(({data}) => {
              const current = data?.mystery_chests || 0;
              _sb.from('user_inventory').upsert({
                user_id: _uid, mystery_chests: current + 1
              }, { onConflict: 'user_id' }).then();
           });
      }
    }

    const nextLesson = lessonNum + 1;
    setCurrentPosition(level, nextLesson);

    const done = lsGet('completed_lessons',[]);
    if (!done.includes(lessonId)) { done.push(lessonId); lsSet('completed_lessons', done); }

    if (_uid && _sb) {
      await sbUpsert('user_lessons', {
        lesson_id: lessonId, hsk_level: level,
        status: 'completed', completed_at: new Date().toISOString(),
        score: Math.round((correctCount / totalCount) * 100),
        diamonds_earned: diamonds, xp_earned: xp,
      }, 'user_id,lesson_id');
    }

    const today = new Date().toDateString();
    if (lsGet('lesson_day', '') !== today) { lsSet('lesson_day', today); lsSet('lessons_today', 0); }
    lsSet('lessons_today', (lsGet('lessons_today', 0)) + 1);

    const totalLessons = CFG.LESSONS_PER_LEVEL[level] || 50;
    if (nextLesson > totalLessons) {
      lsSet(`hsk_exam_pending_${level}`, true);
      localStorage.setItem(`hsk_exam_pending_${_uid}`, String(level));
    }

    return { xp, diamonds, score: Math.round((correctCount / totalCount) * 100), chestDropped };
  }

  // ── ENERGY & HEARTS ──
  function getEnergy() {
    const saved = lsGet('energy', CFG.ENERGY_MAX);
    const ts    = lsGet('energy_ts', Date.now());
    const regen = Math.floor((Date.now() - ts) / CFG.ENERGY_REGEN_MS);
    const cur   = Math.min(CFG.ENERGY_MAX, (isNaN(saved) ? CFG.ENERGY_MAX : saved) + regen);
    if (regen > 0) { lsSet('energy', cur); lsSet('energy_ts', Date.now() - ((Date.now() - ts) % CFG.ENERGY_REGEN_MS)); }
    return cur;
  }
  function consumeEnergy(n = 1) {
    const e = getEnergy(); if (e < n) return false;
    lsSet('energy', e - n); lsSet('energy_ts', Date.now()); return true;
  }
  function addEnergyAd() { lsSet('energy', Math.min(CFG.ENERGY_MAX, getEnergy() + CFG.ENERGY_AD_REWARD)); }

  function getHearts() {
    const saved = lsGet('hearts', CFG.HEART_MAX);
    const ts    = lsGet('heart_ts', Date.now());
    const regen = Math.floor((Date.now() - ts) / CFG.HEART_REGEN_MS);
    const cur   = Math.min(CFG.HEART_MAX, (isNaN(saved) ? CFG.HEART_MAX : saved) + regen);
    if (regen > 0) { lsSet('hearts', cur); lsSet('heart_ts', Date.now() - ((Date.now() - ts) % CFG.HEART_REGEN_MS)); }
    return cur;
  }
  async function _loseHeart() {
    const h = getHearts(); if (h <= 0) return false;
    lsSet('hearts', h - 1);
    window.dispatchEvent(new CustomEvent('engine:heartUpdate', { detail: { hearts: h - 1 } }));
    return true;
  }
  function addHeartAd() {
    lsSet('hearts', Math.min(CFG.HEART_MAX, getHearts() + CFG.HEART_AD_REWARD));
    window.dispatchEvent(new CustomEvent('engine:heartUpdate', { detail: { hearts: getHearts() } }));
  }

  async function _addXP(amount) {
    const cur = lsGet('xp', 0);
    const newXP = cur + amount;
    lsSet('xp', newXP);
    window.dispatchEvent(new CustomEvent('engine:xpUpdate', { detail: { xp: newXP, gained: amount } }));
    if (_uid && _sb) {
      try {
        const { data: row } = await _sb.from('leaderboard').select('xp').eq('user_id', _uid).maybeSingle();
        await _sb.from('leaderboard').upsert({ user_id: _uid, xp: (row?.xp || 0) + amount }, { onConflict: 'user_id' });
      } catch {}
    }
  }
  function _addDiamonds(n) {
    lsSet('diamonds', (lsGet('diamonds', 0)) + n);
    window.dispatchEvent(new CustomEvent('engine:diamondsUpdate', { detail: { diamonds: lsGet('diamonds', 0) } }));
  }

  function _startRegens() {
    setInterval(() => {
      window.dispatchEvent(new CustomEvent('engine:energyUpdate', { detail: { energy: getEnergy() } }));
      window.dispatchEvent(new CustomEvent('engine:heartUpdate', { detail: { hearts: getHearts() } }));
    }, 30000);
  }

  function getCurrentPosition() { return { level: lsGet('user_level', 1), lesson: lsGet('user_lesson', 1) }; }
  function setCurrentPosition(level, lesson) { lsSet('user_level', level); lsSet('user_lesson', lesson); }
  function makeLessonId(level, n) { return `${level}-${n}`; }
  function isLessonComplete(lessonId) { return (lsGet('completed_lessons',[])).includes(lessonId); }
  function isCheckpointLesson(n) { return n % CFG.CHECKPOINT_EVERY === 0; }

  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function highlightWord(sentence, word) {
    if (!sentence || !word) return sentence || '';
    const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return sentence.replace(new RegExp(esc, 'g'), `<span class="word-hl">${word}</span>`);
  }
  function speak(text, lang = 'zh-CN', rate = 0.85) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang; utt.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const cn = voices.find(v => v.lang.startsWith('zh'));
    if (cn) utt.voice = cn;
    window.speechSynthesis.speak(utt);
  }
  function registerExercise(type, handler) { _exerciseRegistry[type] = handler; }

  return {
    init, buildSession, processAnswer, completeLesson,
    registerExercise,
    getEnergy, consumeEnergy, addEnergyAd,
    getHearts, addHeartAd,
    getCurrentPosition, setCurrentPosition, makeLessonId,
    isLessonComplete, isCheckpointLesson,
    fetchWords, fetchLessonWords,
    updateSRS, getSRSEntry, getMistakeWords,
    highlightWord, speak, shuffle: _shuffle,
    CFG,
  };
})();

// ═══════════════════════════════════════════════════════════
// PART 2: EXERCISE TYPES (Unchanged)
// ═══════════════════════════════════════════════════════════
(function() {
  const E = MaobaiEngine;
  function shuffle(a) { return E.shuffle(a); }
  const EMOJI_MAP = {
    '水':'💧','茶':'🍵','咖啡':'☕','米饭':'🍚','面条':'🍜','鱼':'🐟','肉':'🥩','菜':'🥬',
    '苹果':'🍎','鸡蛋':'🥚','面包':'🍞','汤':'🍲',
    '猫':'🐱','狗':'🐶','鸟':'🐦','马':'🐴','牛':'🐮',
    '书':'📖','手机':'📱','电脑':'💻','电视':'📺','照片':'📸',
    '家':'🏠','学校':'🏫','医院':'🏥','商店':'🏪','饭店':'🍽️',
    '车':'🚗','飞机':'✈️','火车':'🚂','公共汽车':'🚌',
    '钱':'💰','衣服':'👕','裤子':'👖','鞋':'👟',
    '爸爸':'👨','妈妈':'👩','朋友':'👫','老师':'👨‍🏫','学生':'🧑‍🎓',
    '医生':'👨‍⚕️','工人':'👷',
    '大':'📏','小':'🔬','多':'➕','少':'➖','好':'😊','不好':'😞',
    '今天':'📅','明天':'📆','昨天':'📅','现在':'⏰','早上':'🌅','晚上':'🌙',
    '冷':'🥶','热':'🥵','高兴':'😄','累':'😴','饿':'🤤',
    '中国':'🇨🇳','北京':'🏙️','上海':'🌆',
    '你好':'👋','谢谢':'🙏','对不起':'😔','没关系':'🤝',
    '一':'1️⃣','二':'2️⃣','三':'3️⃣','四':'4️⃣','五':'5️⃣',
    '六':'6️⃣','七':'7️⃣','八':'8️⃣','九':'9️⃣','十':'🔟',
  };
  function getEmoji(word) { return EMOJI_MAP[word.zh] || null; }
  function pick(arr, n) { return shuffle(arr).slice(0, n); }
  function mcOptions4(correctVal, pool, fn) {
    const wrongs = pick(pool, 3).map(w => ({ label: fn(w), correct: false }));
    return shuffle([{ label: correctVal, correct: true }, ...wrongs]);
  }

  E.registerExercise('word_intro', {
    build(word) {
      return {
        type: 'word_intro', wordId: word.id, uiHint: 'intro',
        word: word.zh, pinyin: word.pinyin, english: word.english,
        wordType: word.word_type || '',
        sentenceZh: word.example_zh, sentencePinyin: word.example_pinyin,
        sentenceEn: word.example_en,
        sentenceZhHL: E.highlightWord(word.example_zh, word.zh),
        prompt: 'New Word', correctAnswer: 'seen', explanation: '',
      };
    },
    validate() { return { correct: true, score: 2 }; },
  });

  E.registerExercise('select_image', {
    build(word, lessonWords, distractors) {
      const emoji = getEmoji(word);
      if (!emoji) return _buildSelectMeaning(word, lessonWords, distractors);
      const pool = shuffle([...lessonWords, ...distractors].filter(w => w.id !== word.id && getEmoji(w)));
      const options4 =[];
      options4.push({ id: word.id, emoji: emoji, label: word.english, correct: true });
      for (const w of pool) {
        if (options4.length >= 4) break;
        const e = getEmoji(w);
        if (e) options4.push({ id: w.id, emoji: e, label: w.english, correct: false });
      }
      for (const w of distractors) {
        if (options4.length >= 4) break;
        options4.push({ id: w.id, emoji: '❓', label: w.english, correct: false });
      }
      return {
        type: 'select_image', wordId: word.id, uiHint: 'select_image',
        word: word.zh, pinyin: word.pinyin, options: shuffle(options4),
        correctAnswer: word.english, prompt: 'Select the correct image',
        explanation: `${word.zh} (${word.pinyin}) = "${word.english}"\n${word.example_zh}\n→ ${word.example_en}`,
      };
    },
    validate(ans, ex) { return { correct: ans === ex.correctAnswer, score: 3 }; },
  });

  E.registerExercise('word_meaning', {
    build(word, lessonWords, distractors) {
      const pool = shuffle([...lessonWords, ...distractors].filter(w => w.id !== word.id));
      const options = mcOptions4(word.zh, pool, w => w.zh);
      return {
        type: 'word_meaning', wordId: word.id, uiHint: 'word_meaning',
        english: word.english,
        optionsWithPinyin: options.map(o => {
          const match = [...lessonWords, ...distractors, word].find(w => w.zh === o.label);
          return { ...o, pinyin: match?.pinyin || '' };
        }),
        options, correctAnswer: word.zh, prompt: 'Select the correct translation',
        explanation: `"${word.english}" = ${word.zh} (${word.pinyin})\n${word.example_zh}\n→ ${word.example_en}`,
      };
    },
    validate(ans, ex) { return { correct: ans === ex.correctAnswer, score: 3 }; },
  });

  function _buildSelectMeaning(word, lessonWords, distractors) {
    const pool = shuffle([...lessonWords, ...distractors].filter(w => w.id !== word.id));
    const options = mcOptions4(word.english, pool, w => w.english);
    return {
      type: 'select_meaning', wordId: word.id, uiHint: 'select_meaning',
      word: word.zh, pinyin: word.pinyin, options, correctAnswer: word.english,
      prompt: 'What does this mean?',
      explanation: `${word.zh} (${word.pinyin}) = "${word.english}"\n${word.example_zh}\n→ ${word.example_en}`,
    };
  }
  E.registerExercise('select_meaning', {
    build(word, lessonWords, distractors) { return _buildSelectMeaning(word, lessonWords, distractors); },
    validate(ans, ex) { return { correct: ans === ex.correctAnswer, score: 3 }; },
  });

  E.registerExercise('tap_what_you_hear', {
    build(word, lessonWords, distractors) {
      const pool = shuffle([...lessonWords, ...distractors].filter(w => w.id !== word.id));
      const wrong = pick(pool, 3);
      const options = shuffle([word, ...wrong]);
      return {
        type: 'tap_what_you_hear', wordId: word.id, uiHint: 'tap_what_you_hear',
        audioText: word.zh,
        options: options.map(w => ({ zh: w.zh, pinyin: w.pinyin, correct: w.id === word.id })),
        correctAnswer: word.zh, prompt: 'Tap what you hear',
        explanation: `You heard: ${word.zh} (${word.pinyin}) = "${word.english}"\n${word.example_zh}\n→ ${word.example_en}`,
      };
    },
    validate(ans, ex) { return { correct: ans === ex.correctAnswer, score: 3 }; },
  });

  E.registerExercise('gap_fill', {
    build(word, lessonWords, distractors) {
      const sentence = word.example_zh;
      if (!sentence || !sentence.includes(word.zh)) return _buildSelectMeaning(word, lessonWords, distractors);
      const blanked = sentence.replace(word.zh, '___');
      const pool = shuffle([...lessonWords, ...distractors].filter(w => w.id !== word.id));
      const options = mcOptions4(word.zh, pool, w => w.zh);
      return {
        type: 'gap_fill', wordId: word.id, uiHint: 'gap_fill',
        sentenceZh: blanked, sentenceEn: word.example_en, options,
        correctAnswer: word.zh, prompt: 'Fill in the blank',
        explanation: `✅ ${word.zh} (${word.pinyin}) = "${word.english}"\nFull sentence: ${word.example_zh}\n→ ${word.example_en}`,
      };
    },
    validate(ans, ex) { return { correct: ans === ex.correctAnswer, score: 3 }; },
  });

  E.registerExercise('select_translation', {
    build(word, lessonWords, distractors) {
      const answer = word.example_en;
      const answerWords = answer.replace(/[.,?!]/g, '').split(' ').filter(Boolean);
      const distWords = shuffle([...distractors].map(w => w.english.split(' ')[0])).slice(0, 4);
      const allTiles = shuffle([...answerWords, ...distWords]);
      return {
        type: 'select_translation', wordId: word.id, uiHint: 'word_bank',
        sentenceZh: word.example_zh, sentenceZhHL: E.highlightWord(word.example_zh, word.zh),
        tiles: allTiles, correctAnswer: answerWords.join(' '), prompt: 'Translate this sentence',
        explanation: `${word.example_zh}\n→ "${word.example_en}"\nKey: ${word.zh} (${word.pinyin}) = ${word.english}`,
      };
    },
    validate(ans, ex) {
      const clean = s => s.toLowerCase().replace(/[.,?!]/g, '').trim();
      return { correct: clean(ans) === clean(ex.correctAnswer), score: 2 };
    },
  });

  E.registerExercise('word_bank_build', {
    build(word, lessonWords, distractors) {
      const answer = word.example_zh.replace(/[，。！？]/g, '');
      const tokens = _tokenise(answer);
      const distTokens = shuffle([...distractors].flatMap(w => _tokenise(w.zh))).slice(0, 3);
      const allTiles = shuffle([...tokens, ...distTokens]);
      return {
        type: 'word_bank_build', wordId: word.id, uiHint: 'word_bank_cn',
        sentenceEn: word.example_en, tiles: allTiles, correctAnswer: tokens.join(''),
        prompt: 'Write in Chinese',
        explanation: `"${word.example_en}"\n→ ${word.example_zh} (${word.example_pinyin})\nKey: ${word.zh} (${word.pinyin}) = ${word.english}`,
      };
    },
    validate(ans, ex) { return { correct: ans.replace(/\s/g,'') === ex.correctAnswer.replace(/\s/g,''), score: 2 }; },
  });

  E.registerExercise('word_order', {
    build(word, lessonWords, distractors) {
      const sentence = word.example_zh.replace(/[，。！？]/g, '');
      const tokens = _tokenise(sentence);
      if (tokens.length < 3) return _buildSelectMeaning(word, lessonWords, distractors);
      return {
        type: 'word_order', wordId: word.id, uiHint: 'word_order',
        tiles: shuffle([...tokens]), correctTokens: tokens, correctAnswer: tokens.join(''),
        sentenceEn: word.example_en, prompt: 'Arrange the words in the correct order',
        explanation: `Correct: ${tokens.join(' ')}\n→ "${word.example_en}"\nKey: ${word.zh} = ${word.english}`,
      };
    },
    validate(ans, ex) {
      const a = Array.isArray(ans) ? ans.join('') : ans;
      return { correct: a === ex.correctAnswer, score: 3 };
    },
  });

  function _tokenise(text) {
    if (!text) return [];
    const result =[];
    let i = 0;
    while (i < text.length) {
      if (i + 1 < text.length) { result.push(text.slice(i, i + 2)); i += 2; }
      else { result.push(text[i]); i++; }
    }
    return result.filter(Boolean);
  }
})();

// ═══════════════════════════════════════════════════════════
// PART 3: UI RENDERER (Unchanged, handles chest drops)
// ═══════════════════════════════════════════════════════════
const MaobaiUI = (() => {
  const E = MaobaiEngine;
  let _session, _idx, _correct, _root, _answered;

  async function startSession(session) {
    _session = session; _idx = 0; _correct = 0; _answered = false;
    _root = document.getElementById('lesson-root');
    _updateProgress(); _render(_session.exercises[0]);
  }

  function _updateProgress() {
    const pct = Math.round((_idx / (_session?.totalExercises || 1)) * 100);
    const fill = document.getElementById('lesson-progress-fill');
    if (fill) fill.style.width = pct + '%';
    const lbl = document.getElementById('lesson-progress-label');
    if (lbl) lbl.textContent = `${_idx} / ${_session.totalExercises}`;
    const he = document.getElementById('hud-hearts');
    if (he) he.textContent = '❤️'.repeat(E.getHearts()) + '🖤'.repeat(Math.max(0, E.CFG.HEART_MAX - E.getHearts()));
    const en = document.getElementById('hud-energy');
    if (en) en.textContent = `⚡${E.getEnergy()}`;
  }

  function _render(ex) {
    _answered = false;
    if (!ex) { _finish(); return; }
    if (!E.consumeEnergy(1)) { _showEnergyWall(); return; }
    if (E.getHearts() <= 0)  { _showHeartWall();  return; }

    _root.innerHTML = '';
    _root.style.animation = 'none'; void _root.offsetWidth;
    _root.style.animation = 'exIn .3s ease both';

    switch (ex.uiHint) {
      case 'intro':         _renderIntro(ex);        break;
      case 'select_image':  _renderSelectImage(ex);  break;
      case 'word_meaning':  _renderWordMeaning(ex);  break;
      case 'select_meaning':_renderSelectMeaning(ex);break;
      case 'tap_what_you_hear': _renderTapHear(ex);  break;
      case 'gap_fill':      _renderGapFill(ex);      break;
      case 'word_bank':     _renderWordBank(ex, 'en');break;
      case 'word_bank_cn':  _renderWordBank(ex, 'cn');break;
      case 'word_order':    _renderWordOrder(ex);    break;
      default:              _renderSelectMeaning(ex);break;
    }
  }

  function _renderIntro(ex) {
    _root.innerHTML = `
      <div class="ex-card ex-intro">
        <div class="ex-badge badge-new">✨ New Word</div>
        <div class="intro-center">
          <button class="btn-audio" onclick="MaobaiEngine.speak('${_esc(ex.word)}')">🔊</button>
          <div class="intro-zh">${ex.word}</div>
          <div class="intro-py">${ex.pinyin}</div>
          <div class="intro-en">${ex.english}</div>
          ${ex.wordType ? `<div class="intro-type">${ex.wordType}</div>` : ''}
        </div>
        <div class="intro-sep"></div>
        <div class="intro-ctx-label">In a sentence:</div>
        <div class="intro-ctx-zh" onclick="MaobaiEngine.speak('${_esc(ex.sentenceZh)}')">${ex.sentenceZhHL}</div>
        <div class="intro-ctx-py">${ex.sentencePinyin || ''}</div>
        <div class="intro-ctx-en">${ex.sentenceEn || ''}</div>
        <button class="btn-got-it" onclick="MaobaiUI._gotIt()">Got it →</button>
      </div>`;
    setTimeout(() => E.speak(ex.word), 500);
  }

  function _renderSelectImage(ex) {
    const grid = ex.options.slice(0, 4).map((o, i) => `
      <button class="img-option" data-correct="${o.correct}" data-label="${_esc(o.label)}" onclick="MaobaiUI._imgPick(this)">
        <span class="img-emoji">${o.emoji}</span><span class="img-label">${o.label}</span>
      </button>`).join('');
    _root.innerHTML = `
      <div class="ex-card">
        <div class="ex-badge badge-img">🖼️ Select the correct image</div>
        <div class="ex-word-display" onclick="MaobaiEngine.speak('${_esc(ex.word)}')">
          <span class="ex-zh">${ex.word}</span><span class="ex-py">${ex.pinyin}</span><span class="audio-hint">🔊</span>
        </div>
        <div class="img-grid">${grid}</div>${_feedbackSlot()}${_checkBtn('MaobaiUI._checkImageSelection()')}
      </div>`;
    setTimeout(() => E.speak(ex.word), 400);
  }

  function _renderWordMeaning(ex) {
    const opts = (ex.optionsWithPinyin || ex.options).slice(0, 4).map((o, i) => `
      <button class="mc-opt" data-correct="${o.correct}" data-label="${_esc(o.label)}" onclick="MaobaiUI._mcPick(this)">
        <span class="mc-py">${o.pinyin || ''}</span><span class="mc-zh">${o.label}</span>
      </button>`).join('');
    _root.innerHTML = `
      <div class="ex-card"><div class="ex-badge badge-mc">🔤 Select the correct translation</div>
        <div class="ex-english-prompt">${ex.english}</div>
        <div class="mc-options">${opts}</div>${_feedbackSlot()}${_checkBtn('MaobaiUI._checkMC()')}
      </div>`;
  }

  function _renderSelectMeaning(ex) {
    const opts = ex.options.slice(0, 4).map(o => `
      <button class="mc-opt" data-correct="${o.correct}" data-label="${_esc(o.label)}" onclick="MaobaiUI._mcPick(this)">
        <span class="mc-en">${o.label}</span>
      </button>`).join('');
    _root.innerHTML = `
      <div class="ex-card"><div class="ex-badge badge-mc">💬 What does this mean?</div>
        <div class="ex-word-display" onclick="MaobaiEngine.speak('${_esc(ex.word)}')">
          <span class="ex-zh">${ex.word}</span><span class="ex-py">${ex.pinyin}</span><span class="audio-hint">🔊</span>
        </div>
        <div class="mc-options">${opts}</div>${_feedbackSlot()}${_checkBtn('MaobaiUI._checkMC()')}
      </div>`;
    setTimeout(() => E.speak(ex.word), 400);
  }

  function _renderTapHear(ex) {
    const opts = ex.options.map(o => `
      <button class="hear-opt" data-correct="${o.correct}" data-zh="${_esc(o.zh)}" onclick="MaobaiUI._hearPick(this)">
        <span class="hear-py">${o.pinyin}</span><span class="hear-zh">${o.zh}</span>
      </button>`).join('');
    _root.innerHTML = `
      <div class="ex-card"><div class="ex-badge badge-audio">🔊 Tap what you hear</div>
        <div class="audio-btns-row">
          <button class="btn-play-big" onclick="MaobaiEngine.speak('${_esc(ex.audioText)}')"><span class="play-icon">▶</span> Play</button>
          <button class="btn-play-slow" onclick="MaobaiEngine.speak('${_esc(ex.audioText)}','zh-CN',0.5)"><span class="play-icon">🐢</span> Slow</button>
        </div>
        <div class="hear-opts">${opts}</div>${_feedbackSlot()}${_checkBtn('MaobaiUI._checkHear()')}
      </div>`;
    setTimeout(() => E.speak(ex.audioText), 500);
  }

  function _renderGapFill(ex) {
    const opts = ex.options.map(o => `
      <button class="mc-opt mc-opt-zh" data-correct="${o.correct}" data-label="${_esc(o.label)}" onclick="MaobaiUI._mcPick(this)">${o.label}</button>
    `).join('');
    _root.innerHTML = `
      <div class="ex-card"><div class="ex-badge badge-fill">📝 Fill in the blank</div>
        <div class="gap-sentence" onclick="MaobaiEngine.speak('${_esc(ex.sentenceZh.replace('___', ''))}')">
          ${ex.sentenceZh} <span class="audio-hint">🔊</span>
        </div>
        <div class="gap-en">${ex.sentenceEn}</div>
        <div class="mc-options">${opts}</div>${_feedbackSlot()}${_checkBtn('MaobaiUI._checkMC()')}
      </div>`;
  }

  function _renderWordBank(ex, dir) {
    const prompt = dir === 'cn'
      ? `<div class="wb-prompt-en">${ex.sentenceEn}</div>`
      : `<div class="wb-prompt-zh" onclick="MaobaiEngine.speak('${_esc(ex.sentenceZh)}')">${ex.sentenceZhHL} <span class="audio-hint">🔊</span></div>`;
    const tiles = ex.tiles.map((t, i) => `<button class="wb-tile" data-word="${_esc(t)}" data-idx="${i}" onclick="MaobaiUI._wbTilePick(this)">${t}</button>`).join('');
    _root.innerHTML = `
      <div class="ex-card"><div class="ex-badge badge-wb">${dir === 'cn' ? '✍️ Write in Chinese' : '🌐 Translate this sentence'}</div>
        ${prompt}
        <div class="wb-answer" id="wb-answer"><div class="wb-answer-placeholder">Tap words below to build your answer</div></div>
        <div class="wb-divider"></div><div class="wb-bank" id="wb-bank">${tiles}</div>
        ${_feedbackSlot()}${_checkBtn('MaobaiUI._checkWordBank()')}
      </div>`;
  }

  function _renderWordOrder(ex) {
    const tiles = ex.tiles.map((t, i) => `<button class="wo-tile" data-word="${_esc(t)}" onclick="MaobaiUI._woTilePick(this)">${t}</button>`).join('');
    _root.innerHTML = `
      <div class="ex-card"><div class="ex-badge badge-order">🔀 Arrange the words</div>
        <div class="wo-en">${ex.sentenceEn}</div>
        <div class="wo-answer" id="wo-answer"><div class="wo-placeholder">Tap words to arrange</div></div>
        <div class="wb-divider"></div><div class="wo-bank" id="wo-bank">${tiles}</div>
        ${_feedbackSlot()}${_checkBtn('MaobaiUI._checkWordOrder()')}
      </div>`;
  }

  function _checkBtn(fn) { return `<button class="btn-check" id="btn-check" onclick="${fn}">Check</button>`; }
  function _feedbackSlot() { return `<div class="feedback-box" id="feedback-box" style="display:none"></div>`; }

  function _imgPick(btn) { if(_answered)return; document.querySelectorAll('.img-option').forEach(b => b.classList.remove('img-selected')); btn.classList.add('img-selected'); _activateCheckBtn(); }
  function _checkImageSelection() {
    if(_answered)return; const sel = _root.querySelector('.img-option.img-selected');
    if(!sel){ _solveItWarning('Select an image first'); return; }
    const correct = sel.dataset.correct === 'true';
    document.querySelectorAll('.img-option').forEach(b => { if(b.dataset.correct === 'true') b.classList.add('img-correct'); else if(b === sel) b.classList.add('img-wrong'); b.disabled = true; });
    _submitAnswer(correct ? sel.dataset.label : '__wrong__', correct);
  }

  function _mcPick(btn) { if(_answered)return; document.querySelectorAll('.mc-opt').forEach(b => b.classList.remove('mc-selected')); btn.classList.add('mc-selected'); _activateCheckBtn(); }
  function _checkMC() {
    if(_answered)return; const sel = _root.querySelector('.mc-opt.mc-selected');
    if(!sel){ _solveItWarning('Select an answer first'); return; }
    const correct = sel.dataset.correct === 'true';
    document.querySelectorAll('.mc-opt').forEach(b => { if(b.dataset.correct === 'true') b.classList.add('mc-correct'); else if(b === sel && !correct) b.classList.add('mc-wrong'); b.disabled = true; });
    _submitAnswer(correct ? sel.dataset.label : '__wrong__', correct);
  }

  function _hearPick(btn) { if(_answered)return; document.querySelectorAll('.hear-opt').forEach(b => b.classList.remove('hear-selected')); btn.classList.add('hear-selected'); _activateCheckBtn(); }
  function _checkHear() {
    if(_answered)return; const sel = _root.querySelector('.hear-opt.hear-selected');
    if(!sel){ _solveItWarning('Tap a word first'); return; }
    const correct = sel.dataset.correct === 'true';
    document.querySelectorAll('.hear-opt').forEach(b => { if(b.dataset.correct === 'true') b.classList.add('hear-correct'); else if(b === sel && !correct) b.classList.add('hear-wrong'); b.disabled = true; });
    _submitAnswer(correct ? sel.dataset.zh : '__wrong__', correct);
  }

  function _wbTilePick(btn) {
    if(_answered)return; const ans = document.getElementById('wb-answer'), bank = document.getElementById('wb-bank');
    if(btn.classList.contains('wb-in-answer')){ btn.classList.remove('wb-in-answer'); bank.appendChild(btn); }
    else { btn.classList.add('wb-in-answer'); const placeholder = ans.querySelector('.wb-answer-placeholder'); if(placeholder) placeholder.remove(); ans.appendChild(btn); }
    _activateCheckBtn();
  }
  function _checkWordBank() {
    if(_answered)return; const ans = document.getElementById('wb-answer'), tiles =[...ans.querySelectorAll('.wb-tile')].map(b => b.dataset.word);
    if(tiles.length === 0){ _solveItWarning('Build your answer first'); return; }
    _submitAnswer(tiles.join(' '), null); 
  }

  function _woTilePick(btn) {
    if(_answered)return; const ans = document.getElementById('wo-answer'), bank = document.getElementById('wo-bank');
    if(btn.classList.contains('wo-in-answer')){ btn.classList.remove('wo-in-answer'); bank.appendChild(btn); }
    else { btn.classList.add('wo-in-answer'); const placeholder = ans.querySelector('.wo-placeholder'); if(placeholder) placeholder.remove(); ans.appendChild(btn); }
    _activateCheckBtn();
  }
  function _checkWordOrder() {
    if(_answered)return; const ans = document.getElementById('wo-answer'), tiles =[...ans.querySelectorAll('.wo-tile')].map(b => b.dataset.word);
    if(tiles.length === 0){ _solveItWarning('Arrange the words first'); return; }
    _submitAnswer(tiles.join(''), null);
  }

  async function _submitAnswer(userAnswer, preComputed) {
    if (_answered) return; _answered = true;
    const ex = _session.exercises[_idx];
    let correct, score;
    if (preComputed !== null && preComputed !== undefined) { correct = preComputed; score = correct ? 3 : 0; } 
    else { const result = E.processAnswer ? await E.processAnswer(ex, userAnswer) : { correct: false, score: 0 }; correct = result.correct; score = result.score; }
    
    if (correct) _correct++;
    else if (E.getHearts() > 0) { await E._loseHeartPublic?.(); }
    _showFeedback(correct, ex.explanation); _updateProgress();
  }

  function _showFeedback(correct, explanation) {
    const fb = document.getElementById('feedback-box'); if (!fb) return;
    fb.style.display = 'block'; fb.className = `feedback-box ${correct ? 'fb-ok' : 'fb-fail'}`;
    const explanationHtml = explanation ? `<div class="fb-explain">${explanation.replace(/\n/g, '<br>')}</div>` : '';
    fb.innerHTML = `<div class="fb-top"><span class="fb-icon">${correct ? '✓' : '✕'}</span><span class="fb-text">${correct ? 'Correct!' : 'Incorrect'}</span></div>${!correct ? explanationHtml : ''}<button class="btn-continue" onclick="MaobaiUI._next()">Continue →</button>`;
    const chk = document.getElementById('btn-check'); if (chk) chk.style.display = 'none';
  }

  function _solveItWarning(msg) {
    const card = _root.querySelector('.ex-card'); if(card){ card.style.animation='shake .35s ease'; setTimeout(()=>card.style.animation='',400); }
    let w = document.getElementById('solve-warn');
    if(!w){ w=document.createElement('div'); w.id='solve-warn'; w.className='solve-warn'; const chk=document.getElementById('btn-check'); if(chk)chk.parentNode.insertBefore(w,chk); }
    w.textContent='⚠️ '+msg; clearTimeout(w._t); w._t=setTimeout(()=>w.remove(),2500);
  }
  function _activateCheckBtn() { const btn = document.getElementById('btn-check'); if(btn) btn.classList.add('btn-check-ready'); }
  function _gotIt() { if(_answered)return; _answered=true; const ex=_session.exercises[_idx]; E.updateSRS(ex.wordId, 2); _correct++; _next(); }
  function _next() { _idx++; _answered=false; if(_idx>=_session.totalExercises){_finish();return;} _updateProgress(); _render(_session.exercises[_idx]); }

  async function _finish() {
    const result = await E.completeLesson({
      lessonId:     _session.lessonId,
      level:        _session.level,
      lessonNum:    _session.lessonNum,
      correctCount: _correct,
      totalCount:   _session.totalExercises,
      isCheckpoint: _session.isCheckpoint,
    });
    
    const accuracy = Math.round((_correct / _session.totalExercises) * 100);
    const isCheckpoint = _session.isCheckpoint;

    _root.innerHTML = `
      <div class="ex-card session-done">
        <div class="done-emoji">${isCheckpoint ? '🏆' : '🎉'}</div>
        <div class="done-title">${isCheckpoint ? 'Checkpoint Complete!' : 'Lesson Complete!'}</div>
        ${isCheckpoint ? `<div class="done-sub">${_session.checkpointRange}</div>` : ''}
        ${result.chestDropped ? `<div style="background:var(--gold-soft);border:1px solid var(--gold);padding:10px;border-radius:12px;margin:10px 0;color:var(--gold);font-weight:bold;animation:shake 1s ease">🎁 Mystery Chest Found!</div>` : ''}
        <div class="done-stats">
          <div class="done-stat"><div class="ds-val ds-green">${_correct}/${_session.totalExercises}</div><div class="ds-lbl">Correct</div></div>
          <div class="done-stat"><div class="ds-val ds-gold">+${result.xp}</div><div class="ds-lbl">XP</div></div>
          <div class="done-stat"><div class="ds-val ds-blue">+${result.diamonds}💎</div><div class="ds-lbl">Diamonds</div></div>
        </div>
        <div class="done-accuracy"><div class="acc-bar-wrap"><div class="acc-bar" style="width:${accuracy}%"></div></div><div class="acc-label">${accuracy}% accuracy</div></div>
        <button class="btn-got-it" onclick="history.back()">Back to Lessons →</button>
      </div>`;
    window.dispatchEvent(new CustomEvent('engine:sessionComplete', { detail: { ...result, correctCount: _correct, totalCount: _session.totalExercises } }));
  }

  function _showEnergyWall() { _root.innerHTML = `<div class="ex-card wall-card"><div class="wall-emoji">⚡</div><div class="wall-title">Out of Energy</div><div class="wall-sub">Watch a short ad to get +${E.CFG.ENERGY_AD_REWARD} energy.</div><button class="btn-got-it btn-gold" onclick="MaobaiUI._adEnergy()">📺 Watch Ad (+${E.CFG.ENERGY_AD_REWARD} ⚡)</button><button class="btn-secondary" onclick="history.back()">← Leave</button></div>`; }
  function _showHeartWall() { _root.innerHTML = `<div class="ex-card wall-card"><div class="wall-emoji">❤️</div><div class="wall-title">No Hearts Left</div><div class="wall-sub">Watch an ad to get 1 heart back.</div><button class="btn-got-it btn-rose" onclick="MaobaiUI._adHeart()">📺 Watch Ad (+1 ❤️)</button><button class="btn-secondary" onclick="history.back()">← Leave</button></div>`; }
  function _adEnergy() { E.addEnergyAd(); _updateProgress(); _render(_session.exercises[_idx]); }
  function _adHeart()  { E.addHeartAd();  _updateProgress(); _render(_session.exercises[_idx]); }
  function _esc(s) { return String(s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

  return {
    startSession, _gotIt, _next,
    _imgPick, _checkImageSelection, _mcPick, _checkMC, _hearPick, _checkHear, _wbTilePick, _checkWordBank, _woTilePick, _checkWordOrder,
    _adEnergy, _adHeart
  };
})();
