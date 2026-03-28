/**
 * Maobai Learning Engine v4 — Enhanced for Binge Learning & Ad Monetization
 * HSK 1-6 focused. 7 exercises per lesson, 3 new words, binge mode enabled.
 * Checkpoints every 5 lessons. Session streak rewards.
 * Yandex Ads integration for Turkmenistan market.
 * Full SRS memory tracking (SM-2: 1-3-7-14-30 days).
 * Mistake tracking with priority review.
 * 15 exercise types including new addictive formats.
 */

// ═══════════════════════════════════════════════════════════
// PART 1: CORE ENGINE
// ═══════════════════════════════════════════════════════════
const MaobaiEngine = (() => {

  const CFG = {
    supabaseUrl:    'https://cuiznbvvlqtwcoocehnd.supabase.co',
    supabaseKey:    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1aXpuYnZ2bHF0d2Nvb2NlaG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzI0NTUsImV4cCI6MjA4OTI0ODQ1NX0.QXAjvDdvih1ue1W8BaoqBfBr_fUJb9W5FYFZSC_JI8w',

    // Resources - Optimized for binge mode
    ENERGY_MAX:          50,       // Increased for 10+ lessons/day
    ENERGY_REGEN_MS:     3 * 60 * 1000,  // 3 minutes (faster)
    ENERGY_AD_REWARD:    25,       // Full refill
    HEART_MAX:           5,
    HEART_REGEN_MS:      20 * 60 * 1000, // 20 minutes (faster)
    HEART_AD_REWARD:     2,        // +2 hearts per ad

    // Binge mode settings
    SESSION_STREAK_BONUS: {
      3: { xp: 20, diamonds: 10, label: '3-Lesson Streak! 🔥' },
      5: { xp: 50, diamonds: 20, label: '5-Lesson Legend! 🏆' },
      10: { xp: 100, diamonds: 50, label: '10-Lesson MASTER! 👑' },
      15: { xp: 200, diamonds: 100, label: 'UNSTOPPABLE! 💎' }
    },

    // Lesson structure - Optimized for 3-4 minute lessons
    EXERCISES_PER_LESSON:   7,    // Reduced from 15 for faster completion
    NEW_WORD_EXERCISES:      3,   // 3 new words = 3 exercises
    REVIEW_WORD_EXERCISES:  4,    // 4 review exercises
    WORDS_PER_LESSON:    { 1:3, 2:3, 3:3, 4:3, 5:3, 6:3 }, // Consistent 3 words
    LESSONS_PER_LEVEL:   { 1:50, 2:50, 3:75, 4:150, 5:325, 6:625 },

    // Checkpoint every 5 lessons
    CHECKPOINT_EVERY: 5,

    // Rewards with variable multipliers
    XP_PER_LESSON:        20,
    XP_VARIANCE:          [20, 25, 30], // Random 20-30 XP
    XP_PER_CHECKPOINT:    50,
    DIAMONDS_PER_LESSON:  5,
    DIAMONDS_CHECKPOINT:  15,

    // SRS intervals (ms) - SM-2 Algorithm
    SRS_INTERVALS_MS: [
      0,
      1  * 24*60*60*1000,   // 1 day
      3  * 24*60*60*1000,   // 3 days
      7  * 24*60*60*1000,   // 7 days
      14 * 24*60*60*1000,   // 14 days
      30 * 24*60*60*1000,   // 30 days
    ],

    // Exercise types unlocked per lesson number
    EXERCISE_UNLOCK: {
      'word_intro':        1,
      'select_image':      1,
      'word_meaning':      1,
      'select_meaning':    1,
      'tap_what_you_hear': 2,
      'gap_fill':          3,
      'select_translation':4,
      'word_bank_build':   5,
      'word_order':        8,
      'speed_drill':       10,   // NEW: Fast-paced
      'tone_training':     12,   // NEW: Tone practice
      'character_builder': 15,   // NEW: Radical assembly
      'shadow_speaking':   20,   // NEW: Record yourself
      'context_story':     25,   // NEW: 3-sentence story
      'boss_battle':       30,   // NEW: Challenge mode
    },

    // Ad placement config
    AD_CONFIG: {
      firstAdLesson: 4,        // First ad appears at lesson 4
      frequency: 3,            // Every 3rd lesson after that
      checkpointAd: true,      // Ad after checkpoint
      rewardedMultiplier: 2,   // 2x XP for watching ad
    }
  };

  let _sb  = null;
  let _uid = null;
  let _exerciseRegistry = {};
  let _sessionStreak = 0;  // Track binge sessions

  // ── INIT ──
  async function init() {
    _sb = window._sb || window._supabaseClient ||
          (window.supabase ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey) : null);
    if (!_sb) throw new Error('Supabase client not found');
    const { data: { session } } = await _sb.auth.getSession();
    _uid = session?.user?.id || null;
    _startRegens();
    return { userId: _uid };
  }

  // ── STORAGE ──
  const lk = k => `${k}_${_uid}`;
  function lsGet(k, fb = null) {
    try { const v = localStorage.getItem(lk(k)); return v !== null ? JSON.parse(v) : fb; } catch { return fb; }
  }
  function lsSet(k, v) { try { localStorage.setItem(lk(k), JSON.stringify(v)); } catch {} }

  async function sbUpsert(table, row, conflict = 'user_id') {
    if (!_uid || !_sb) return;
    try { await _sb.from(table).upsert({ user_id: _uid, ...row }, { onConflict: conflict }); } catch {}
  }

  // ── SESSION STREAK (BINGE MODE) ──
  function getSessionStreak() {
    const today = new Date().toDateString();
    const lastSession = lsGet('last_session_date', '');
    const currentStreak = lsGet('session_streak', 0);
    
    if (lastSession !== today) {
      lsSet('session_streak', 0);
      lsSet('last_session_date', today);
      return 0;
    }
    return currentStreak;
  }

  function incrementSessionStreak() {
    const streak = getSessionStreak() + 1;
    lsSet('session_streak', streak);
    
    // Check for bonuses
    const bonus = CFG.SESSION_STREAK_BONUS[streak];
    if (bonus) {
      _addXP(bonus.xp);
      _addDiamonds(bonus.diamonds);
      return bonus;
    }
    return null;
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
    } catch { return lsGet(ck, []); }
  }

  async function fetchLessonWords(lessonId) {
    const level = parseInt(lessonId.split('-')[0]);
    const all = await fetchWords(level);
    return all.filter(w => w.lesson_id === lessonId);
  }

  async function fetchLearnedWords(level, upToLesson) {
    const all = await fetchWords(level);
    const learned = [];
    for (let i = 1; i < upToLesson; i++) {
      const lid = `${level}-${i}`;
      learned.push(...all.filter(w => w.lesson_id === lid));
    }
    return learned;
  }

  // ── SRS — SM-2 ALGORITHM ──
  function getSRS() { return lsGet('srs', {}); }
  function saveSRS(srs) { lsSet('srs', srs); }

  function getSRSEntry(wordId) {
    return getSRS()[wordId] || { interval: 0, easeFactor: 2.5, repetitions: 0, nextReview: 0, correctCount: 0, wrongCount: 0 };
  }

  function updateSRS(wordId, score) {
    const srs   = getSRS();
    const entry = getSRSEntry(wordId);
    const now   = Date.now();
    if (score === 0) {
      entry.repetitions = 0;
      entry.interval    = CFG.SRS_INTERVALS_MS[1];
      entry.wrongCount  = (entry.wrongCount || 0) + 1;
      entry.easeFactor  = Math.max(1.3, entry.easeFactor - 0.2);
      _recordMistake(wordId);
    } else {
      entry.correctCount = (entry.correctCount || 0) + 1;
      entry.interval = entry.repetitions === 0 ? CFG.SRS_INTERVALS_MS[1]
                     : entry.repetitions === 1 ? CFG.SRS_INTERVALS_MS[2]
                     : Math.min(Math.round(entry.interval * entry.easeFactor), CFG.SRS_INTERVALS_MS[5]);
      entry.easeFactor = Math.max(1.3, entry.easeFactor + 0.1 - (3 - score) * (0.08 + (3 - score) * 0.02));
      entry.repetitions++;
      if (entry.correctCount >= 2) _clearMistake(wordId);
    }
    entry.nextReview = now + entry.interval;
    entry.lastSeen   = now;
    srs[wordId] = entry;
    saveSRS(srs);
    if (_uid) sbUpsert('user_progress', {
      word_id: wordId, interval: entry.interval, ease_factor: entry.easeFactor,
      repetitions: entry.repetitions, next_review: new Date(entry.nextReview).toISOString(),
      last_seen: new Date(now).toISOString(), correct_count: entry.correctCount, wrong_count: entry.wrongCount
    }, 'user_id,word_id');
    return entry;
  }

  // ── MISTAKE TRACKING ──
  function _recordMistake(wordId) {
    const mistakes = lsGet('mistake_words', {});
    mistakes[wordId] = (mistakes[wordId] || 0) + 1;
    lsSet('mistake_words', mistakes);
  }
  function _clearMistake(wordId) {
    const mistakes = lsGet('mistake_words', {});
    delete mistakes[wordId];
    lsSet('mistake_words', mistakes);
  }
  function getMistakeWords() { return lsGet('mistake_words', {}); }

  function prioritiseByMistakes(words) {
    const mistakes = getMistakeWords();
    return [...words].sort((a, b) => (mistakes[b.id] || 0) - (mistakes[a.id] || 0));
  }

  // ── SESSION BUILDER ──
  async function buildSession({ level, lessonNum, lessonId, mode = 'new' }) {
    await init();

    const isCheckpoint = lessonNum % CFG.CHECKPOINT_EVERY === 0 && mode !== 'review';
    const shouldShowAd = CFG.AD_CONFIG.firstAdLesson && 
                        lessonNum >= CFG.AD_CONFIG.firstAdLesson &&
                        (lessonNum - CFG.AD_CONFIG.firstAdLesson) % CFG.AD_CONFIG.frequency === 0;

    if (isCheckpoint) {
      return await _buildCheckpointSession({ level, lessonNum, lessonId, shouldShowAd });
    }

    const newWords = await fetchLessonWords(lessonId);
    if (!newWords.length) throw new Error(`No words found for lesson ${lessonId}. Check Supabase words table.`);

    const learnedWords = await fetchLearnedWords(level, lessonNum);
    const srs  = getSRS();
    const now  = Date.now();
    const newIds = new Set(newWords.map(w => w.id));
    const prior  = learnedWords.filter(w => !newIds.has(w.id));

    const mistakes    = prioritiseByMistakes(prior.filter(w => getMistakeWords()[w.id]));
    const due         = _shuffle(prior.filter(w => !getMistakeWords()[w.id] && srs[w.id]?.nextReview <= now));
    const learned     = _shuffle(prior.filter(w => !getMistakeWords()[w.id] && srs[w.id] && srs[w.id].nextReview > now));
    const reviewPool  = [...mistakes, ...due, ...learned].slice(0, 20);

    const allLevel   = await fetchWords(level);
    const usedIds    = new Set([...newWords.map(w => w.id), ...reviewPool.map(w => w.id)]);
    const distractors = _shuffle(allLevel.filter(w => !usedIds.has(w.id))).slice(0, 12);

    const unlockedTypes = _getUnlockedTypes(lessonNum);
    const exercises = await _buildExercises(newWords, reviewPool, learnedWords, distractors, unlockedTypes, mode);

    // Variable XP reward
    const baseXP = CFG.XP_PER_LESSON;
    const variance = CFG.XP_VARIANCE[Math.floor(Math.random() * CFG.XP_VARIANCE.length)];
    const finalXP = mode === 'review' ? Math.floor(variance * 0.5) : variance;

    return {
      sessionId:      `${lessonId}-${Date.now()}`,
      lessonId, level, lessonNum, mode,
      isCheckpoint:   false,
      shouldShowAd,
      words:          newWords,
      reviewWords:    reviewPool.slice(0, 4),
      exercises,
      totalExercises: exercises.length,
      xpReward:       finalXP,
      diamonds:       CFG.DIAMONDS_PER_LESSON,
    };
  }

  async function _buildCheckpointSession({ level, lessonNum, lessonId, shouldShowAd }) {
    const start = lessonNum - CFG.CHECKPOINT_EVERY + 1;
    const allLevel = await fetchWords(level);
    const checkpointWords = [];
    for (let i = start; i <= lessonNum; i++) {
      checkpointWords.push(...allLevel.filter(w => w.lesson_id === `${level}-${i}`));
    }
    const distractors = _shuffle(allLevel.filter(w => !checkpointWords.some(cw => cw.id === w.id))).slice(0, 12);
    const unlockedTypes = _getUnlockedTypes(lessonNum);

    const exercises = [];
    const types = ['select_image','word_meaning','tap_what_you_hear','select_meaning','gap_fill',
                   'select_translation','word_bank_build','word_meaning','select_image','tap_what_you_hear',
                   'gap_fill','select_translation','speed_drill','tone_training','character_builder']
                   .filter(t => unlockedTypes.includes(t));

    const pool = _shuffle([...checkpointWords]);
    let wi = 0;
    for (let i = 0; i < Math.min(types.length, 12); i++) {
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
      shouldShowAd,
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
    const exercises = [];
    
    // 3 exercises: introduce new words
    const newDrillTypes = ['select_image','word_meaning','select_meaning']
      .filter(t => unlockedTypes.includes(t));

    for (let i = 0; i < newWords.length && exercises.length < CFG.NEW_WORD_EXERCISES; i++) {
      const word = newWords[i];
      const introHandler = _exerciseRegistry['word_intro'];
      if (introHandler && exercises.length < CFG.NEW_WORD_EXERCISES) {
        const ex = await introHandler.build(word, [...newWords, ...reviewPool], distractors);
        if (ex) exercises.push({ ...ex, type: 'word_intro', wordId: word.id, index: exercises.length, isNew: true });
      }
    }

    // 4 exercises: review words (SRS-driven)
    const reviewTypeQueue = [
      'select_image','word_meaning','tap_what_you_hear','gap_fill',
      'select_translation','word_bank_build','speed_drill','tone_training'
    ].filter(t => unlockedTypes.includes(t));

    const fallbackPool = reviewPool.length > 0 ? reviewPool : newWords;
    const shuffledReview = _shuffle([...fallbackPool]);
    let ri = 0, typeI = 0;

    while (exercises.length < CFG.EXERCISES_PER_LESSON) {
      if (typeI >= reviewTypeQueue.length * 2) break;
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
    updateSRS(exercise.wordId, correct ? score : 0);
    let heartLost = false;
    if (!correct) heartLost = await _loseHeart();
    return { correct, score, xpGained: 0, heartLost, correctAnswer: exercise.correctAnswer, explanation: exercise.explanation };
  }

  // ── LESSON COMPLETION ──
  async function completeLesson({ lessonId, level, lessonNum, correctCount, totalCount, isCheckpoint, shouldShowAd }) {
    // Increment session streak and check for bonus
    const streakBonus = incrementSessionStreak();
    
    const baseXp = isCheckpoint ? CFG.XP_PER_CHECKPOINT : CFG.XP_PER_LESSON;
    const variance = CFG.XP_VARIANCE[Math.floor(Math.random() * CFG.XP_VARIANCE.length)];
    const xp = isCheckpoint ? baseXp : variance;
    const diamonds = isCheckpoint ? CFG.DIAMONDS_CHECKPOINT : CFG.DIAMONDS_PER_LESSON;

    await _addXP(xp);
    _addDiamonds(diamonds);

    const nextLesson = lessonNum + 1;
    setCurrentPosition(level, nextLesson);

    const done = lsGet('completed_lessons', []);
    if (!done.includes(lessonId)) { done.push(lessonId); lsSet('completed_lessons', done); }

    if (_uid) {
      await sbUpsert('user_lessons', {
        lesson_id: lessonId, hsk_level: level,
        status: 'completed', completed_at: new Date().toISOString(),
        score: Math.round((correctCount / totalCount) * 100),
        diamonds_earned: diamonds, xp_earned: xp,
        session_streak: getSessionStreak()
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

    return { xp, diamonds, score: Math.round((correctCount / totalCount) * 100), streakBonus, shouldShowAd };
  }

  // ── ENERGY ──
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
  function addEnergyAd() { 
    const newEnergy = Math.min(CFG.ENERGY_MAX, getEnergy() + CFG.ENERGY_AD_REWARD);
    lsSet('energy', newEnergy); 
    return newEnergy;
  }

  // ── HEARTS ──
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
    const newHearts = Math.min(CFG.HEART_MAX, getHearts() + CFG.HEART_AD_REWARD);
    lsSet('hearts', newHearts);
    window.dispatchEvent(new CustomEvent('engine:heartUpdate', { detail: { hearts: newHearts } }));
    return newHearts;
  }

  // ── XP + DIAMONDS ──
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

  // ── REGENS ──
  function _startRegens() {
    setInterval(() => {
      window.dispatchEvent(new CustomEvent('engine:energyUpdate', { detail: { energy: getEnergy() } }));
      window.dispatchEvent(new CustomEvent('engine:heartUpdate', { detail: { hearts: getHearts() } }));
    }, 30000);
  }

  // ── NAVIGATION ──
  function getCurrentPosition() {
    return { level: lsGet('user_level', 1), lesson: lsGet('user_lesson', 1) };
  }
  function setCurrentPosition(level, lesson) {
    lsSet('user_level', level); lsSet('user_lesson', lesson);
  }
  function makeLessonId(level, n) { return `${level}-${n}`; }
  function isLessonComplete(lessonId) { return (lsGet('completed_lessons', [])).includes(lessonId); }
  function isCheckpointLesson(n) { return n % CFG.CHECKPOINT_EVERY === 0; }

  // ── UTILS ──
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

  // ── AD INTEGRATION (Yandex/Generic) ──
  function showRewardedAd(onComplete, onError) {
    // Yandex Ads integration placeholder
    if (window.yaContextCb) {
      window.yaContextCb.push(() => {
        Ya.Context.AdvManager.render({
          blockId: 'R-A-XXXXXX-XX', // Your Yandex block ID
          type: 'rewarded',
          onRewarded: onComplete,
          onError: onError
        });
      });
    } else {
      // Fallback: simulate ad for testing
      console.log('[AD] Showing rewarded ad...');
      setTimeout(() => {
        onComplete && onComplete();
      }, 3000);
    }
  }

  function showInterstitialAd() {
    if (window.yaContextCb) {
      window.yaContextCb.push(() => {
        Ya.Context.AdvManager.render({
          blockId: 'R-A-XXXXXX-XX', // Your Yandex block ID
          type: 'fullscreen'
        });
      });
    }
  }

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
    showRewardedAd, showInterstitialAd,
    getSessionStreak, incrementSessionStreak,
    CFG,
  };
})();

// ═══════════════════════════════════════════════════════════
// PART 2: EXERCISE TYPES (15 Types)
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
    '我':'🙋','你':'👋','他':'👨','她':'👩','我们':'👥',
    '吃':'🍽️','喝':'🥤','看':'👀','听':'👂','说':'💬','读':'📖','写':'✍️',
    '去':'🏃','来':'🚶','有':'📦','是':'✅'
  };

  function getEmoji(word) { return EMOJI_MAP[word.zh] || '📝'; }

  function pick(arr, n) { return shuffle(arr).slice(0, n); }

  function mcOptions4(correctVal, pool, fn) {
    const wrongs = pick(pool, 3).map(w => ({ label: fn(w), correct: false }));
    return shuffle([{ label: correctVal, correct: true }, ...wrongs]);
  }

  // ── TYPE: WORD INTRO ──
  E.registerExercise('word_intro', {
    build(word) {
      return {
        type: 'word_intro', wordId: word.id, uiHint: 'intro',
        word: word.zh, pinyin: word.pinyin, english: word.english,
        wordType: word.word_type || '',
        radicals: word.radicals || [],
        mnemonic: word.mnemonic_story || '',
        strokeCount: word.stroke_count || 0,
        sentenceZh: word.example_zh, sentencePinyin: word.example_pinyin,
        sentenceEn: word.example_en,
        sentenceZhHL: E.highlightWord(word.example_zh, word.zh),
        prompt: 'New Word', correctAnswer: 'seen',
        explanation: '',
      };
    },
    validate() { return { correct: true, score: 2 }; },
  });

  // ── TYPE: SELECT IMAGE ──
  E.registerExercise('select_image', {
    build(word, lessonWords, distractors) {
      const emoji = getEmoji(word);
      const pool = shuffle([...lessonWords, ...distractors].filter(w => w.id !== word.id && getEmoji(w)));
      const options4 = [];
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
        word: word.zh, pinyin: word.pinyin,
        options: shuffle(options4),
        correctAnswer: word.english,
        prompt: 'Select the correct image',
        explanation: `${word.zh} (${word.pinyin}) = "${word.english}"\n${word.example_zh}\n→ ${word.example_en}`,
      };
    },
    validate(ans, ex) { return { correct: ans === ex.correctAnswer, score: 3 }; },
  });

  // ── TYPE: WORD MEANING ──
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
        options,
        correctAnswer: word.zh,
        prompt: 'Select the correct translation',
        explanation: `"${word.english}" = ${word.zh} (${word.pinyin})\n${word.example_zh}\n→ ${word.example_en}`,
      };
    },
    validate(ans, ex) { return { correct: ans === ex.correctAnswer, score: 3 }; },
  });

  // ── TYPE: SELECT MEANING ──
  function _buildSelectMeaning(word, lessonWords, distractors) {
    const pool = shuffle([...lessonWords, ...distractors].filter(w => w.id !== word.id));
    const options = mcOptions4(word.english, pool, w => w.english);
    return {
      type: 'select_meaning', wordId: word.id, uiHint: 'select_meaning',
      word: word.zh, pinyin: word.pinyin,
      options,
      correctAnswer: word.english,
      prompt: 'What does this mean?',
      explanation: `${word.zh} (${word.pinyin}) = "${word.english}"\n${word.example_zh}\n→ ${word.example_en}`,
    };
  }
  E.registerExercise('select_meaning', {
    build(word, lessonWords, distractors) { return _buildSelectMeaning(word, lessonWords, distractors); },
    validate(ans, ex) { return { correct: ans === ex.correctAnswer, score: 3 }; },
  });

  // ── TYPE: TAP WHAT YOU HEAR ──
  E.registerExercise('tap_what_you_hear', {
    build(word, lessonWords, distractors) {
      const pool = shuffle([...lessonWords, ...distractors].filter(w => w.id !== word.id));
      const wrong = pick(pool, 3);
      const options = shuffle([word, ...wrong]);
      return {
        type: 'tap_what_you_hear', wordId: word.id, uiHint: 'tap_what_you_hear',
        audioText: word.zh,
        options: options.map(w => ({ zh: w.zh, pinyin: w.pinyin, correct: w.id === word.id })),
        correctAnswer: word.zh,
        prompt: 'Tap what you hear',
        explanation: `You heard: ${word.zh} (${word.pinyin}) = "${word.english}"\n${word.example_zh}\n→ ${word.example_en}`,
      };
    },
    validate(ans, ex) { return { correct: ans === ex.correctAnswer, score: 3 }; },
  });

  // ── TYPE: GAP FILL ──
  E.registerExercise('gap_fill', {
    build(word, lessonWords, distractors) {
      const sentence = word.example_zh;
      if (!sentence || !sentence.includes(word.zh)) {
        return _buildSelectMeaning(word, lessonWords, distractors);
      }
      const blanked = sentence.replace(word.zh, '___');
      const pool = shuffle([...lessonWords, ...distractors].filter(w => w.id !== word.id));
      const options = mcOptions4(word.zh, pool, w => w.zh);
      return {
        type: 'gap_fill', wordId: word.id, uiHint: 'gap_fill',
        sentenceZh: blanked,
        sentenceEn: word.example_en,
        options,
        correctAnswer: word.zh,
        prompt: 'Fill in the blank',
        explanation: `✅ ${word.zh} (${word.pinyin}) = "${word.english}"\nFull sentence: ${word.example_zh}\n→ ${word.example_en}`,
      };
    },
    validate(ans, ex) { return { correct: ans === ex.correctAnswer, score: 3 }; },
  });

  // ── TYPE: SELECT TRANSLATION ──
  E.registerExercise('select_translation', {
    build(word, lessonWords, distractors) {
      const answer = word.example_en;
      const answerWords = answer.replace(/[.,?!]/g, '').split(' ').filter(Boolean);
      const distWords = shuffle([...distractors].map(w => w.english.split(' ')[0])).slice(0, 4);
      const allTiles = shuffle([...answerWords, ...distWords]);
      return {
        type: 'select_translation', wordId: word.id, uiHint: 'word_bank',
        sentenceZh: word.example_zh,
        sentenceZhHL: E.highlightWord(word.example_zh, word.zh),
        tiles: allTiles,
        correctAnswer: answerWords.join(' '),
        prompt: 'Translate this sentence',
        explanation: `${word.example_zh}\n→ "${word.example_en}"\nKey: ${word.zh} (${word.pinyin}) = ${word.english}`,
      };
    },
    validate(ans, ex) {
      const clean = s => s.toLowerCase().replace(/[.,?!]/g, '').trim();
      return { correct: clean(ans) === clean(ex.correctAnswer), score: 2 };
    },
  });

  // ── TYPE: WORD BANK BUILD ──
  E.registerExercise('word_bank_build', {
    build(word, lessonWords, distractors) {
      const answer = word.example_zh.replace(/[，。！？]/g, '');
      const tokens = _tokenise(answer);
      const distTokens = shuffle([...distractors].flatMap(w => _tokenise(w.zh))).slice(0, 3);
      const allTiles = shuffle([...tokens, ...distTokens]);
      return {
        type: 'word_bank_build', wordId: word.id, uiHint: 'word_bank_cn',
        sentenceEn: word.example_en,
        tiles: allTiles,
        correctAnswer: tokens.join(''),
        prompt: 'Write in Chinese',
        explanation: `"${word.example_en}"\n→ ${word.example_zh} (${word.example_pinyin})\nKey: ${word.zh} (${word.pinyin}) = ${word.english}`,
      };
    },
    validate(ans, ex) {
      return { correct: ans.replace(/\s/g,'') === ex.correctAnswer.replace(/\s/g,''), score: 2 };
    },
  });

  // ── TYPE: WORD ORDER ──
  E.registerExercise('word_order', {
    build(word, lessonWords, distractors) {
      const sentence = word.example_zh.replace(/[，。！？]/g, '');
      const tokens = _tokenise(sentence);
      if (tokens.length < 3) return _buildSelectMeaning(word, lessonWords, distractors);
      return {
        type: 'word_order', wordId: word.id, uiHint: 'word_order',
        tiles: shuffle([...tokens]),
        correctTokens: tokens,
        correctAnswer: tokens.join(''),
        sentenceEn: word.example_en,
        prompt: 'Arrange the words in the correct order',
        explanation: `Correct: ${tokens.join(' ')}\n→ "${word.example_en}"\nKey: ${word.zh} = ${word.english}`,
      };
    },
    validate(ans, ex) {
      const a = Array.isArray(ans) ? ans.join('') : ans;
      return { correct: a === ex.correctAnswer, score: 3 };
    },
  });

  // ── NEW TYPE: SPEED DRILL ──
  E.registerExercise('speed_drill', {
    build(word, lessonWords, distractors) {
      const pool = shuffle([...lessonWords, ...distractors].filter(w => w.id !== word.id));
      const options = shuffle([
        { zh: word.zh, pinyin: word.pinyin, correct: true },
        ...pick(pool, 3).map(w => ({ zh: w.zh, pinyin: w.pinyin, correct: false }))
      ]);
      return {
        type: 'speed_drill', wordId: word.id, uiHint: 'speed_drill',
        english: word.english,
        options,
        correctAnswer: word.zh,
        timeLimit: 3, // 3 seconds
        prompt: 'QUICK! Select the answer',
        explanation: `"${word.english}" = ${word.zh} (${word.pinyin})`,
      };
    },
    validate(ans, ex) { return { correct: ans === ex.correctAnswer, score: 3 }; },
  });

  // ── NEW TYPE: TONE TRAINING ──
  E.registerExercise('tone_training', {
    build(word, lessonWords, distractors) {
      // Extract tone from pinyin
      const toneMatch = word.pinyin.match(/[āáǎàa][ōóǒòo][ēéěèe][īíǐìi][ūúǔùu]/);
      const tone = toneMatch ? getToneNumber(toneMatch[0]) : 1;
      
      const toneOptions = [
        { label: '1st ˉ', value: 1, correct: tone === 1 },
        { label: '2nd ˊ', value: 2, correct: tone === 2 },
        { label: '3rd ˇ', value: 3, correct: tone === 3 },
        { label: '4th ˋ', value: 4, correct: tone === 4 },
      ];
      
      return {
        type: 'tone_training', wordId: word.id, uiHint: 'tone_training',
        word: word.zh,
        pinyin: word.pinyin,
        english: word.english,
        options: shuffle(toneOptions),
        correctAnswer: tone,
        prompt: 'Which tone?',
        explanation: `${word.zh} = ${word.pinyin} (Tone ${tone})\n${word.english}`,
      };
    },
    validate(ans, ex) { return { correct: parseInt(ans) === ex.correctAnswer, score: 3 }; },
  });

  function getToneNumber(pinyinChar) {
    const tones = {
      'ā':1,'á':2,'ǎ':3,'à':4,
      'ō':1,'ó':2,'ǒ':3,'ò':4,
      'ē':1,'é':2,'ě':3,'è':4,
      'ī':1,'í':2,'ǐ':3,'ì':4,
      'ū':1,'ú':2,'ǔ':3,'ù':4
    };
    return tones[pinyinChar] || 1;
  }

  // ── NEW TYPE: CHARACTER BUILDER ──
  E.registerExercise('character_builder', {
    build(word, lessonWords, distractors) {
      const radicals = word.radicals || [];
      if (radicals.length < 2) return _buildSelectMeaning(word, lessonWords, distractors);
      
      // Create drag-and-drop assembly
      const allParts = shuffle([...radicals, ...pick(['口','人','心','手'], 2)]);
      
      return {
        type: 'character_builder', wordId: word.id, uiHint: 'character_builder',
        word: word.zh,
        english: word.english,
        pinyin: word.pinyin,
        radicals: radicals,
        allParts: allParts,
        correctAnswer: radicals.join(''),
        prompt: 'Build the character',
        explanation: `${word.zh} = ${radicals.join(' + ')} = "${word.english}"\n${word.mnemonic_story || ''}`,
      };
    },
    validate(ans, ex) { return { correct: ans === ex.correctAnswer, score: 3 }; },
  });

  // Simple Chinese tokeniser
  function _tokenise(text) {
    if (!text) return [];
    const result = [];
    let i = 0;
    while (i < text.length) {
      if (i + 1 < text.length) { result.push(text.slice(i, i + 2)); i += 2; }
      else { result.push(text[i]); i++; }
    }
    return result.filter(Boolean);
  }

})();
