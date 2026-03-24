/**
 * Maobai Learning Engine — engine.js
 * Core: Word Fetcher · SM-2 SRS Scheduler · Session Builder · Exercise Factory
 *
 * HOW TO USE:
 *   <script src="engine/engine.js"></script>
 *   <script src="engine/exercises.js"></script>
 *   <script src="engine/ui.js"></script>
 *   const session = await MaobaiEngine.buildSession({ level: 3, lesson: 5 });
 *   MaobaiUI.startSession(session);
 */

const MaobaiEngine = (() => {

  // ─────────────────────────────────────────────
  // CONFIG — change these without touching logic
  // ─────────────────────────────────────────────
  const CFG = {
    supabaseUrl:    'https://cuiznbvvlqtwcoocehnd.supabase.co',
    supabaseKey:    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1aXpuYnZ2bHF0d2Nvb2NlaG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzI0NTUsImV4cCI6MjA4OTI0ODQ1NX0.QXAjvDdvih1ue1W8BaoqBfBr_fUJb9W5FYFZSC_JI8w',

    // Energy & Hearts
    ENERGY_MAX:     25,
    ENERGY_REGEN_MS: 3 * 60 * 1000,   // 1 energy per 3 min = 25 in 1.25h
    HEART_MAX:      5,
    HEART_REGEN_MS: 30 * 60 * 1000,   // 1 heart per 30 min
    ENERGY_PER_EXERCISE: 1,
    HEART_PER_MISTAKE:   1,
    ENERGY_AD_REWARD:    15,
    HEART_AD_REWARD:     1,

    // Rewards
    XP_PER_EXERCISE:     2,
    DIAMONDS_PER_LESSON: 10,

    // 3-4 NEW words per lesson — keeps each session focused and fully learnable.
    // Grammar point introduced every 2 lessons via word_type='grammar' words from DB.
    WORDS_PER_LESSON: { 1:3, 2:3, 3:4, 4:4, 5:4, 6:4 },

    // Grammar word introduced every N lessons
    GRAMMAR_EVERY_N_LESSONS: 2,

    // Total lessons per level — more lessons now because fewer words each:
    //   HSK1: ~150 ÷ 3 = 50 | HSK2: ~150 ÷ 3 = 50 | HSK3: ~300 ÷ 4 = 75
    //   HSK4: ~600 ÷ 4 = 150 | HSK5: ~1300 ÷ 4 = 325 | HSK6: ~2500 ÷ 4 = 625
    LESSONS_PER_LEVEL: { 1:50, 2:50, 3:75, 4:150, 5:325, 6:625 },

    // 20 exercises per lesson total
    EXERCISES_PER_LESSON: 20,

    // 70/30 split: ~14 exercises on OLD (review) words, ~6 on NEW words this lesson.
    // New words get: intro → gap_fill → hanzi_to_english → audio → translate → english_to_hanzi
    // Review words get the remaining 14 slots cycling through all unlocked types.
    NEW_WORD_EXERCISES:    6,
    REVIEW_WORD_EXERCISES: 14,

    // Which exercise types unlock at which lesson number (within any level)
    EXERCISE_UNLOCK_AT_LESSON: {
      'word_intro':       1,
      'gap_fill':         1,
      'hanzi_to_english': 1,
      'english_to_hanzi': 2,
      'word_order':       3,
      'negation':         4,
      'question_builder': 5,
      'error_correction': 7,
      'audio_choice':     2,
      'read_true_false':  6,
      'translate_cn_en':  3,
      'translate_en_cn':  4,
    },

    // SRS review intervals in ms (SM-2 base schedule)
    SRS_INTERVALS_MS: [
      0,
      1  * 24*60*60*1000,   // 1 day
      3  * 24*60*60*1000,   // 3 days
      7  * 24*60*60*1000,   // 7 days
      14 * 24*60*60*1000,   // 14 days
      30 * 24*60*60*1000,   // 30 days
    ],

    // UI language (future: swap to any locale file)
    UI_LANG: 'en',
  };

  // ─────────────────────────────────────────────
  // INTERNAL STATE
  // ─────────────────────────────────────────────
  let _sb   = null;  // supabase client
  let _uid  = null;  // current user id
  let _exerciseRegistry = {}; // registered exercise type handlers

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  async function init() {
    // reuse existing supabase client if dashboard already created one
    _sb = window._sb || window._supabaseClient ||
          window.supabase?.createClient(CFG.supabaseUrl, CFG.supabaseKey);
    if (!_sb) throw new Error('[Engine] Supabase client not found. Include supabase-js before engine.js');

    const { data: { session } } = await _sb.auth.getSession();
    _uid = session?.user?.id || null;
    _startEnergyRegen();
    _startHeartRegen();
    return { userId: _uid };
  }

  // ─────────────────────────────────────────────
  // STORAGE HELPERS  (localStorage + Supabase)
  // ─────────────────────────────────────────────
  function lk(k) { return `${k}_${_uid}`; }   // user-scoped key

  function lsGet(k, fallback = null) {
    try { const v = localStorage.getItem(lk(k)); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }

  function lsSet(k, v) {
    try { localStorage.setItem(lk(k), JSON.stringify(v)); } catch {}
  }

  // Write to Supabase async — never blocks UI
  async function sbUpsert(table, row, conflictCol = 'user_id') {
    if (!_uid) return;
    try { await _sb.from(table).upsert({ user_id: _uid, ...row }, { onConflict: conflictCol }); }
    catch (e) { console.warn('[Engine] Supabase upsert failed', e); }
  }

  // ─────────────────────────────────────────────
  // WORD FETCHER
  // Fetches words from Supabase for a given level + lesson range.
  // Uses localStorage cache (5-min TTL) so repeated calls are instant.
  // Falls back to cache if offline (VIP users).
  // ─────────────────────────────────────────────
  async function fetchWords({ level, lessonIds = null }) {
    const cacheKey = `word_cache_l${level}`;
    const cacheTs  = lsGet(`word_cache_ts_l${level}`, 0);
    const fresh    = (Date.now() - cacheTs) < 5 * 60 * 1000;

    if (fresh) {
      const cached = lsGet(cacheKey, null);
      if (cached) return cached;
    }

    try {
      let q = _sb.from('words').select('*').eq('hsk_level', level);
      if (lessonIds?.length) q = q.in('lesson_id', lessonIds);
      const { data, error } = await q;
      if (error) throw error;
      // Cache result
      lsSet(cacheKey, data);
      lsSet(`word_cache_ts_l${level}`, Date.now());
      return data;
    } catch (e) {
      console.warn('[Engine] Fetch failed, using cache', e);
      return lsGet(cacheKey, []);
    }
  }

  // Fetch words for a single lesson (by lesson_id string like "3-5")
  async function fetchLessonWords(lessonId) {
    const level = parseInt(lessonId.split('-')[0]);
    const all   = await fetchWords({ level });
    return all.filter(w => w.lesson_id === lessonId);
  }

  // Fetch distractors — same level words NOT in current lesson (for MC options)
  async function fetchDistractors(level, excludeIds, count = 6) {
    const all = await fetchWords({ level });
    const pool = all.filter(w => !excludeIds.includes(w.id));
    return _shuffle(pool).slice(0, count);
  }

  // ─────────────────────────────────────────────
  // SRS — SM-2 ALGORITHM
  // score: 0=wrong, 1=hard, 2=good, 3=easy
  // ─────────────────────────────────────────────
  function getSRS() { return lsGet('srs', {}); }
  function saveSRS(srs) { lsSet('srs', srs); }

  function getSRSEntry(wordId) {
    const srs = getSRS();
    return srs[wordId] || { interval: 0, easeFactor: 2.5, repetitions: 0, nextReview: 0, correctCount: 0, wrongCount: 0 };
  }

  /**
   * Update SRS after answering.
   * score: 0=wrong, 1=hard, 2=good, 3=easy
   * Returns updated entry with new nextReview timestamp.
   */
  function updateSRS(wordId, score) {
    const srs   = getSRS();
    const entry = getSRSEntry(wordId);
    const now   = Date.now();

    if (score === 0) {
      // Wrong: reset repetitions, keep ease factor, review tomorrow
      entry.repetitions = 0;
      entry.interval    = CFG.SRS_INTERVALS_MS[1];
      entry.wrongCount  = (entry.wrongCount || 0) + 1;
    } else {
      entry.correctCount = (entry.correctCount || 0) + 1;
      if (entry.repetitions === 0) {
        entry.interval = CFG.SRS_INTERVALS_MS[1];
      } else if (entry.repetitions === 1) {
        entry.interval = CFG.SRS_INTERVALS_MS[2];
      } else {
        // SM-2: new_interval = old_interval * easeFactor
        entry.interval = Math.round(entry.interval * entry.easeFactor);
      }
      // Adjust ease factor: ef' = ef + (0.1 - (3-score)*(0.08+(3-score)*0.02))
      const q  = score; // 1,2,3
      entry.easeFactor = Math.max(1.3, entry.easeFactor + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02)));
      entry.repetitions++;
    }

    entry.nextReview = now + entry.interval;
    entry.lastSeen   = now;
    srs[wordId] = entry;
    saveSRS(srs);

    // Sync to Supabase async
    if (_uid) {
      sbUpsert('user_progress', {
        word_id:      wordId,
        interval:     entry.interval,
        ease_factor:  entry.easeFactor,
        repetitions:  entry.repetitions,
        next_review:  new Date(entry.nextReview).toISOString(),
        last_seen:    new Date(now).toISOString(),
        correct_count: entry.correctCount,
        wrong_count:   entry.wrongCount,
      }, 'user_id,word_id');
    }

    return entry;
  }

  // Classify a word's SRS state
  function wordSRSState(wordId) {
    const entry = getSRSEntry(wordId);
    if (!entry.lastSeen)              return 'new';
    if (entry.nextReview <= Date.now()) return 'due';
    return 'learned';
  }

  // ─────────────────────────────────────────────
  // SESSION BUILDER
  // Builds an ordered list of exercise objects for one lesson.
  // context: { level, lessonNum, lessonId, mode: 'new'|'review' }
  // ─────────────────────────────────────────────
  async function buildSession({ level, lessonNum, lessonId, mode = 'new' }) {
    await init();

    // ── Fetch this lesson's NEW words ──
    const newWords = await fetchLessonWords(lessonId);
    if (!newWords.length) throw new Error(`[Engine] No words found for lesson ${lessonId}`);

    // ── Fetch REVIEW words from previous lessons (SRS-due first, then recent) ──
    // Pull all words for this level up to previous lessons
    const allLevelWords = await fetchWords({ level });
    const newIds        = new Set(newWords.map(w => w.id));
    const srs           = getSRS();
    const now           = Date.now();

    // Classify prior words by SRS state
    const priorWords  = allLevelWords.filter(w => !newIds.has(w.id));
    const due         = _shuffle(priorWords.filter(w => srs[w.id]?.nextReview <= now));
    const seen        = _shuffle(priorWords.filter(w => srs[w.id] && srs[w.id].nextReview > now));
    const unseen      = _shuffle(priorWords.filter(w => !srs[w.id]));

    // Priority: due → recently learned → unseen — pick enough for REVIEW slots
    const reviewPool  = [...due, ...seen, ...unseen].slice(0, CFG.REVIEW_WORD_EXERCISES * 2);

    // Distractors for MC options (words from same level, not in lesson)
    const allWords    = [...newWords, ...reviewPool];
    const distractors = await fetchDistractors(level, allWords.map(w => w.id), 10);

    const unlockedTypes = _getUnlockedTypes(lessonNum);

    // Is this a grammar lesson? (every GRAMMAR_EVERY_N_LESSONS lessons)
    const isGrammarLesson = lessonNum % CFG.GRAMMAR_EVERY_N_LESSONS === 0;

    // Build exercise sequence — 20 total: 6 new + 14 review
    const exercises = await _buildExerciseSequence(
      newWords, reviewPool, distractors, unlockedTypes, mode, isGrammarLesson
    );

    return {
      sessionId:    `${lessonId}-${Date.now()}`,
      lessonId,
      level,
      lessonNum,
      mode,
      isGrammarLesson,
      words:          newWords,
      reviewWords:    reviewPool.slice(0, CFG.REVIEW_WORD_EXERCISES),
      exercises,
      totalExercises: exercises.length,
      xpAvailable:    exercises.length * CFG.XP_PER_EXERCISE,
      diamondsAvailable: CFG.DIAMONDS_PER_LESSON,
    };
  }

  async function _buildExerciseSequence(newWords, reviewWords, distractors, unlockedTypes, mode, isGrammarLesson) {
    const exercises = [];

    // ── PART 1: NEW WORDS (6 exercises) — fixed psychological order ──
    // Each new word gets: intro → gap_fill → hanzi_to_english → audio → translate_cn_en → english_to_hanzi
    const newWordTypes = [
      'word_intro',        // see the word in context, no pressure
      'gap_fill',          // first active use — fill the blank
      'hanzi_to_english',  // meaning recall
      'audio_choice',      // hear it
      'translate_cn_en',   // full sentence translation
      'english_to_hanzi',  // hardest — reverse recall
    ].filter(t => unlockedTypes.includes(t));

    // Spread across new words (if 3 new words and 6 slots: each word gets 2 type slots)
    const shuffledNew = _shuffle([...newWords]);
    for (let i = 0; i < newWordTypes.length && i < CFG.NEW_WORD_EXERCISES; i++) {
      const type    = newWordTypes[i];
      const word    = shuffledNew[i % shuffledNew.length];
      const handler = _exerciseRegistry[type];
      if (!handler) continue;
      const ex = await handler.build(word, [...newWords, ...reviewWords], distractors);
      if (ex) exercises.push({ ...ex, type, wordId: word.id, index: exercises.length, isNew: true });
    }

    // ── PART 2: REVIEW WORDS (14 exercises) — varied types, SRS-driven ──
    // Cycle through all unlocked types to keep it varied. Never repeat same (word+type) pair.
    const reviewTypes = [
      'gap_fill',
      'hanzi_to_english',
      'audio_choice',
      'english_to_hanzi',
      'translate_cn_en',
      'gap_fill',
      'hanzi_to_english',
      'translate_en_cn',
      'word_order',
      'negation',
      'audio_choice',
      'translate_cn_en',
      'question_builder',
      'error_correction',
    ].filter(t => unlockedTypes.includes(t));

    // Grammar lesson bonus: replace 2 review slots with grammar-focused types
    const effectiveReviewTypes = isGrammarLesson
      ? ['word_order', 'negation', 'question_builder', 'error_correction', ...reviewTypes].slice(0, CFG.REVIEW_WORD_EXERCISES)
      : reviewTypes.slice(0, CFG.REVIEW_WORD_EXERCISES);

    const shuffledReview = reviewWords.length > 0
      ? _shuffle([...reviewWords])
      : _shuffle([...newWords]); // fallback: first lesson has no prior words

    let rIdx = 0;
    for (let i = 0; i < effectiveReviewTypes.length; i++) {
      const type    = effectiveReviewTypes[i];
      const word    = shuffledReview[rIdx % shuffledReview.length];
      rIdx++;
      const handler = _exerciseRegistry[type];
      if (!handler) continue;
      const ex = await handler.build(word, [...newWords, ...shuffledReview], distractors);
      if (ex) exercises.push({ ...ex, type, wordId: word.id, index: exercises.length, isNew: false });
    }

    // Final: interleave new and review so they're not all new first, all review last.
    // Pattern: new, review, review, new, review, review, review...
    // (naturally achieved since we just concatenated; UI shows progress bar so order is transparent)

    return exercises;
  }

  // Which exercise types are available at lesson N
  function _getUnlockedTypes(lessonNum) {
    return Object.entries(CFG.EXERCISE_UNLOCK_AT_LESSON)
      .filter(([, unlockAt]) => lessonNum >= unlockAt)
      .map(([type]) => type);
  }

  // ─────────────────────────────────────────────
  // EXERCISE REGISTRY
  // Register a new exercise type handler:
  //   MaobaiEngine.registerExercise('my_type', { build, validate, score })
  // build(word, lessonWords, distractors) → exercise object
  // validate(userAnswer, exercise) → { correct: bool, score: 0-3 }
  // ─────────────────────────────────────────────
  function registerExercise(type, handler) {
    _exerciseRegistry[type] = handler;
    console.log(`[Engine] Registered exercise type: ${type}`);
  }

  // ─────────────────────────────────────────────
  // ANSWER PROCESSING
  // Call this after user answers. Returns result + updates SRS + XP + hearts
  // ─────────────────────────────────────────────
  async function processAnswer(exercise, userAnswer) {
    const handler = _exerciseRegistry[exercise.type];
    if (!handler) throw new Error(`[Engine] No handler for type: ${exercise.type}`);

    const { correct, score } = handler.validate(userAnswer, exercise);

    // Update SRS
    const srsEntry = updateSRS(exercise.wordId, correct ? score : 0);

    // XP always awarded (even for wrong — learning still happens)
    const xpGained = correct ? CFG.XP_PER_EXERCISE : 1;
    await _addXP(xpGained);

    // Hearts on wrong answer
    let heartLost = false;
    if (!correct) {
      heartLost = await _loseHeart();
    }

    return {
      correct,
      score,
      xpGained,
      heartLost,
      srsEntry,
      correctAnswer: exercise.correctAnswer,
      explanation:   exercise.explanation || null,
    };
  }

  // ─────────────────────────────────────────────
  // LESSON COMPLETION
  // Call when all exercises in a session are done
  // ─────────────────────────────────────────────
  async function completeLesson({ lessonId, level, correctCount, totalCount }) {
    const diamonds = CFG.DIAMONDS_PER_LESSON;
    _addDiamonds(diamonds);

    // Mark lesson complete in localStorage
    const doneKey = 'completed_lessons';
    const done    = lsGet(doneKey, []);
    if (!done.includes(lessonId)) { done.push(lessonId); lsSet(doneKey, done); }

    // Supabase
    if (_uid) {
      await sbUpsert('user_lessons', {
        lesson_id:       lessonId,
        hsk_level:       level,
        status:          'completed',
        completed_at:    new Date().toISOString(),
        score:           Math.round((correctCount / totalCount) * 100),
        diamonds_earned: diamonds,
      }, 'user_id,lesson_id');
    }

    return { diamonds, xpTotal: totalCount * CFG.XP_PER_EXERCISE };
  }

  // ─────────────────────────────────────────────
  // ENERGY SYSTEM
  // ─────────────────────────────────────────────
  function getEnergy() {
    const saved  = lsGet('energy', CFG.ENERGY_MAX);
    const ts     = lsGet('energy_ts', Date.now());
    const elapsed = Date.now() - ts;
    const regen  = Math.floor(elapsed / CFG.ENERGY_REGEN_MS);
    const current = Math.min(CFG.ENERGY_MAX, saved + regen);
    if (regen > 0) {
      lsSet('energy', current);
      lsSet('energy_ts', ts + regen * CFG.ENERGY_REGEN_MS);
    }
    return current;
  }

  function consumeEnergy(amount = CFG.ENERGY_PER_EXERCISE) {
    const current = getEnergy();
    if (current < amount) return false;
    lsSet('energy', current - amount);
    lsSet('energy_ts', Date.now());
    return true;
  }

  function addEnergyAd() {
    const current = getEnergy();
    lsSet('energy', Math.min(CFG.ENERGY_MAX, current + CFG.ENERGY_AD_REWARD));
  }

  function _startEnergyRegen() {
    setInterval(() => {
      const e = getEnergy(); // triggers regen calc + saves
      window.dispatchEvent(new CustomEvent('engine:energyUpdate', { detail: { energy: e } }));
    }, 30000);
  }

  // ─────────────────────────────────────────────
  // HEART SYSTEM
  // ─────────────────────────────────────────────
  function getHearts() {
    const saved   = lsGet('hearts', CFG.HEART_MAX);
    const ts      = lsGet('heart_ts', Date.now());
    const elapsed = Date.now() - ts;
    const regen   = Math.floor(elapsed / CFG.HEART_REGEN_MS);
    const current = Math.min(CFG.HEART_MAX, saved + regen);
    if (regen > 0) {
      lsSet('hearts', current);
      lsSet('heart_ts', ts + regen * CFG.HEART_REGEN_MS);
    }
    return current;
  }

  async function _loseHeart() {
    const h = getHearts();
    if (h > 0) {
      lsSet('hearts', h - 1);
      window.dispatchEvent(new CustomEvent('engine:heartUpdate', { detail: { hearts: h - 1 } }));
      return true;
    }
    return false;
  }

  function addHeartAd() {
    const h = getHearts();
    lsSet('hearts', Math.min(CFG.HEART_MAX, h + CFG.HEART_AD_REWARD));
    window.dispatchEvent(new CustomEvent('engine:heartUpdate', { detail: { hearts: getHearts() } }));
  }

  function _startHeartRegen() {
    setInterval(() => {
      const h = getHearts();
      window.dispatchEvent(new CustomEvent('engine:heartUpdate', { detail: { hearts: h } }));
    }, 60000);
  }

  // ─────────────────────────────────────────────
  // XP + DIAMONDS
  // ─────────────────────────────────────────────
  async function _addXP(amount) {
    const current = lsGet('xp', 0);
    const newXP   = current + amount;
    lsSet('xp', newXP);
    window.dispatchEvent(new CustomEvent('engine:xpUpdate', { detail: { xp: newXP, gained: amount } }));

    // Sync leaderboard
    if (_uid) {
      try {
        const { data: row } = await _sb.from('leaderboard').select('xp').eq('user_id', _uid).maybeSingle();
        const lbXP = (row?.xp || 0) + amount;
        await _sb.from('leaderboard').upsert({ user_id: _uid, xp: lbXP }, { onConflict: 'user_id' });
      } catch {}
    }
  }

  function _addDiamonds(amount) {
    const current = lsGet('diamonds', 0);
    lsSet('diamonds', current + amount);
    window.dispatchEvent(new CustomEvent('engine:diamondsUpdate', { detail: { diamonds: current + amount } }));
  }

  // ─────────────────────────────────────────────
  // LESSON NAVIGATION — completed lessons list
  // ─────────────────────────────────────────────
  function getCompletedLessons() { return lsGet('completed_lessons', []); }

  function isLessonComplete(lessonId) { return getCompletedLessons().includes(lessonId); }

  function getCurrentPosition() {
    return {
      level:  lsGet('user_level',  1),
      lesson: lsGet('user_lesson', 1),
    };
  }

  function setCurrentPosition(level, lessonNum) {
    lsSet('user_level',  level);
    lsSet('user_lesson', lessonNum);
  }

  // Build lessonId string from level + lessonNum (e.g. level=3, num=5 → "3-5")
  function makeLessonId(level, lessonNum) { return `${level}-${lessonNum}`; }

  // ─────────────────────────────────────────────
  // UTILITY
  // ─────────────────────────────────────────────
  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Highlight target word inside a sentence (returns HTML string)
  function highlightWord(sentence, word) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return sentence.replace(new RegExp(escaped, 'g'),
      `<span class="eng-word-highlight">${word}</span>`);
  }

  // TTS using browser SpeechSynthesis
  function speak(text, lang = 'zh-CN', rate = 0.85) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = lang;
    utt.rate  = rate;
    // Prefer a Chinese voice if available
    const voices = window.speechSynthesis.getVoices();
    const cn = voices.find(v => v.lang === 'zh-CN' || v.lang === 'zh-TW');
    if (cn) utt.voice = cn;
    window.speechSynthesis.speak(utt);
  }

  // Translate index (for future multi-language UI)
  const _i18n = {
    en: {
      correct:      '✓ Correct!',
      wrong:        '✗ Incorrect',
      tapToReveal:  'Tap to reveal',
      checkAnswer:  'Check Answer',
      next:         'Next →',
      noEnergy:     'Out of energy! Watch an ad to get +15 energy.',
      noHearts:     'No hearts left! Watch an ad or wait 30 min.',
      lessonDone:   'Lesson Complete! 🎉',
    }
  };
  function t(key) { return (_i18n[CFG.UI_LANG] || _i18n.en)[key] || key; }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────
  return {
    // Core
    init,
    buildSession,
    processAnswer,
    completeLesson,

    // Exercise plug-in system
    registerExercise,

    // Resources
    getEnergy,
    consumeEnergy,
    addEnergyAd,
    getHearts,
    addHeartAd,

    // Navigation
    getCompletedLessons,
    isLessonComplete,
    getCurrentPosition,
    setCurrentPosition,
    makeLessonId,
    fetchLessonWords,
    fetchWords,

    // SRS
    updateSRS,
    getSRSEntry,
    wordSRSState,

    // Utils (exposed for exercises.js and ui.js)
    highlightWord,
    speak,
    shuffle: _shuffle,
    t,
    CFG,
  };
})();
/**
 * Maobai Learning Engine — exercises.js
 * All 10 exercise type handlers.
 *
 * Each handler has:
 *   build(word, lessonWords, distractors) → exercise object
 *   validate(userAnswer, exercise)        → { correct: bool, score: 0-3 }
 *
 * Exercise object shape (always includes):
 *   { type, wordId, prompt, correctAnswer, explanation?, uiHint }
 *   + type-specific fields
 *
 * To add a new exercise type in the future:
 *   MaobaiEngine.registerExercise('my_type', { build, validate });
 *   Add a renderer in ui.js renderExercise() switch.
 *   Done — no other files need changing.
 */

(function () {

  const E = MaobaiEngine; // alias

  // ─────────────────────────────────────────────
  // SHARED HELPERS
  // ─────────────────────────────────────────────

  function pick(arr, n) {
    return E.shuffle(arr).slice(0, n);
  }

  // Build 4 MC options: 1 correct + 3 distractors, shuffled
  function mcOptions(correctLabel, pool, labelFn, n = 3) {
    const wrongs = pick(pool, n).map(w => ({ label: labelFn(w), correct: false }));
    const all = E.shuffle([{ label: correctLabel, correct: true }, ...wrongs]);
    return all;
  }

  // Score based on attempt speed / confidence (for now: correct=3 always, can extend)
  function scoreCorrect() { return 3; }

  // ─────────────────────────────────────────────
  // TYPE 1 — WORD INTRODUCTION
  // Show new word, pinyin, highlighted in example sentence. No question to answer —
  // user just reads and taps "Got it". Always scores as correct (SRS: easy).
  // ─────────────────────────────────────────────
  E.registerExercise('word_intro', {
    build(word) {
      return {
        type:          'word_intro',
        wordId:        word.id,
        word:          word.zh,
        pinyin:        word.pinyin,
        english:       word.english,
        wordType:      word.word_type,
        sentenceZh:    word.example_zh,
        sentencePinyin: word.example_pinyin,
        sentenceEn:    word.example_en,
        // Highlight target word in the example sentence
        sentenceZhHighlighted: E.highlightWord(word.example_zh, word.zh),
        prompt:        'New Word',
        correctAnswer: 'seen',
        uiHint:        'intro',
      };
    },
    validate(userAnswer) {
      // Always correct — this is introduction, not a test
      return { correct: true, score: 2 };
    },
  });

  // ─────────────────────────────────────────────
  // TYPE 2 — GAP FILL (SENTENCE COMPLETION)
  // Show sentence with target word blanked out.
  // Show 4 word choices (Chinese characters). User picks correct one.
  // ─────────────────────────────────────────────
  E.registerExercise('gap_fill', {
    build(word, lessonWords, distractors) {
      const pool     = [...lessonWords, ...distractors].filter(w => w.id !== word.id);
      const sentence = word.example_zh.replace(word.zh, '___');
      const options  = mcOptions(word.zh, pool, w => w.zh, 3);

      return {
        type:          'gap_fill',
        wordId:        word.id,
        sentenceZh:    sentence,
        sentenceEn:    word.example_en,
        options,
        correctAnswer: word.zh,
        explanation:   `The full sentence: ${word.example_zh}\n(${word.example_en})`,
        prompt:        'Choose the word that fits the blank',
        uiHint:        'multiple_choice',
      };
    },
    validate(userAnswer, exercise) {
      const correct = userAnswer === exercise.correctAnswer;
      return { correct, score: correct ? scoreCorrect() : 0 };
    },
  });

  // ─────────────────────────────────────────────
  // TYPE 3A — HANZI TO ENGLISH (meaning recall)
  // Show the Chinese word. Pick the correct English meaning.
  // ─────────────────────────────────────────────
  E.registerExercise('hanzi_to_english', {
    build(word, lessonWords, distractors) {
      const pool    = [...lessonWords, ...distractors].filter(w => w.id !== word.id);
      const options = mcOptions(word.english, pool, w => w.english, 3);

      return {
        type:          'hanzi_to_english',
        wordId:        word.id,
        // Show word IN CONTEXT — sentence with word highlighted
        sentenceZhHighlighted: E.highlightWord(word.example_zh, word.zh),
        word:          word.zh,
        pinyin:        word.pinyin,
        options,
        correctAnswer: word.english,
        explanation:   `${word.zh} (${word.pinyin}) = ${word.english}`,
        prompt:        'What does the highlighted word mean?',
        uiHint:        'multiple_choice',
      };
    },
    validate(userAnswer, exercise) {
      const correct = userAnswer === exercise.correctAnswer;
      return { correct, score: correct ? scoreCorrect() : 0 };
    },
  });

  // ─────────────────────────────────────────────
  // TYPE 3B — ENGLISH TO HANZI (reverse recall)
  // Show English meaning. Pick the correct Chinese character.
  // ─────────────────────────────────────────────
  E.registerExercise('english_to_hanzi', {
    build(word, lessonWords, distractors) {
      const pool    = [...lessonWords, ...distractors].filter(w => w.id !== word.id);
      const options = mcOptions(word.zh, pool, w => w.zh, 3);

      return {
        type:          'english_to_hanzi',
        wordId:        word.id,
        sentenceEn:    word.example_en,
        english:       word.english,
        options,
        correctAnswer: word.zh,
        explanation:   `${word.english} = ${word.zh} (${word.pinyin})`,
        prompt:        'Which character matches the English meaning?',
        uiHint:        'multiple_choice',
      };
    },
    validate(userAnswer, exercise) {
      const correct = userAnswer === exercise.correctAnswer;
      return { correct, score: correct ? scoreCorrect() : 0 };
    },
  });

  // ─────────────────────────────────────────────
  // TYPE 4 — WORD ORDER (pattern completion)
  // Show shuffled Chinese words/characters. User drags/taps to correct order.
  // The sentence tokens come from the example sentence.
  // ─────────────────────────────────────────────
  E.registerExercise('word_order', {
    build(word) {
      // Tokenise by Chinese words (split on common punctuation + spaces)
      // Simple approach: split example into segments of 1-3 chars + particles
      const raw    = word.example_zh.replace(/[，。！？、：；""''（）]/g, '');
      const tokens = _segmentChinese(raw);
      const shuffled = E.shuffle([...tokens]);

      return {
        type:          'word_order',
        wordId:        word.id,
        tokens:        shuffled,
        correctTokens: tokens,
        correctAnswer: tokens.join(''),
        sentenceEn:    word.example_en,
        wordHighlight: word.zh,
        prompt:        'Arrange the words in the correct order',
        uiHint:        'drag_order',
        explanation:   `Correct order: ${tokens.join(' ')} — ${word.example_en}`,
      };
    },
    validate(userAnswer, exercise) {
      // userAnswer: array of tokens in user's order, or joined string
      const ans     = Array.isArray(userAnswer) ? userAnswer.join('') : userAnswer;
      const correct = ans === exercise.correctAnswer;
      return { correct, score: correct ? scoreCorrect() : 0 };
    },
  });

  // Simple Chinese sentence segmenter — splits into chunks recognisable as words
  function _segmentChinese(text) {
    // Attempt to split by known 2-char patterns then single chars
    // A full segmenter (jieba) is overkill; this is good enough for example sentences
    const result = [];
    let i = 0;
    while (i < text.length) {
      // Try 4-char chunk first (compound words), then 3, then 2, then 1
      let pushed = false;
      for (const len of [4, 3, 2]) {
        if (i + len <= text.length) {
          result.push(text.slice(i, i + len));
          i += len;
          pushed = true;
          break;
        }
      }
      if (!pushed) { result.push(text[i]); i++; }
    }
    // Recombine very short solo chars with previous (avoid 1-char tokens for very short segs)
    return result.filter(Boolean);
  }

  // ─────────────────────────────────────────────
  // TYPE 5 — NEGATION BUILDER
  // Show an affirmative sentence. User must choose the correct negative form
  // using 不 or 没有 (displayed as 4 options).
  // ─────────────────────────────────────────────
  E.registerExercise('negation', {
    build(word) {
      const affirm = word.example_zh;

      // Build negation: insert 不/没 before the verb
      // Rules: 有 → 没有, verb in past/completed context → 没, else 不
      const useMei = affirm.includes('了') || affirm.includes('过') || word.zh === '有';
      const neg    = useMei
        ? _insertNegation(affirm, '没')
        : _insertNegation(affirm, '不');

      const neg2   = useMei
        ? _insertNegation(affirm, '不')
        : _insertNegation(affirm, '没');

      // Distractors: wrong negation positions or wrong negators
      const options = E.shuffle([
        { label: neg,   correct: true },
        { label: neg2,  correct: false },
        // Wrong position
        { label: '不' + affirm, correct: false },
        { label: affirm.replace(word.zh, word.zh + '不'), correct: false },
      ]).slice(0, 4);

      return {
        type:          'negation',
        wordId:        word.id,
        affirmative:   affirm,
        sentenceEn:    word.example_en,
        options,
        correctAnswer: neg,
        prompt:        'Make this sentence negative',
        uiHint:        'multiple_choice',
        explanation:   `Use ${useMei ? '没/没有' : '不'} to negate action/state sentences.\n→ ${neg}`,
      };
    },
    validate(userAnswer, exercise) {
      const correct = userAnswer === exercise.correctAnswer;
      return { correct, score: correct ? scoreCorrect() : 0 };
    },
  });

  function _insertNegation(sentence, neg) {
    // Find the first verb-like character after a subject (first 1-2 chars)
    // Simplified: insert after the first 1-2 characters
    if (sentence.length <= 2) return neg + sentence;
    const cutPoint = sentence.length > 4 ? 2 : 1;
    return sentence.slice(0, cutPoint) + neg + sentence.slice(cutPoint);
  }

  // ─────────────────────────────────────────────
  // TYPE 6 — QUESTION BUILDER
  // Show a statement. Show 4 question forms — user picks the grammatically
  // correct question that matches the statement's meaning.
  // ─────────────────────────────────────────────
  E.registerExercise('question_builder', {
    build(word) {
      const statement = word.example_zh;

      // Generate question forms
      const questions = _generateQuestions(statement, word);

      return {
        type:          'question_builder',
        wordId:        word.id,
        statement,
        sentenceEn:    word.example_en,
        options:       questions,
        correctAnswer: questions.find(q => q.correct)?.label || questions[0].label,
        prompt:        'Which question matches this statement?',
        uiHint:        'multiple_choice',
        explanation:   `The correct question form uses the right question word for the context.`,
      };
    },
    validate(userAnswer, exercise) {
      const correct = userAnswer === exercise.correctAnswer;
      return { correct, score: correct ? scoreCorrect() : 0 };
    },
  });

  function _generateQuestions(statement, word) {
    // Map common patterns to question words
    const qWords = ['吗', '呢', '什么', '谁', '哪', '怎么', '为什么', '几'];
    const isYesNo     = !statement.includes('什么') && !statement.includes('谁');
    const correctQ    = isYesNo ? statement.replace(/。$/, '') + '吗？' : statement.replace(/[^？]+/, '') + '？';

    return E.shuffle([
      { label: correctQ,                          correct: true  },
      { label: '是不是' + statement,               correct: false },
      { label: statement.replace(/。$/, '') + '呢？',correct: false },
      { label: '你' + statement.replace(/[^。]+。/, '') + '什么？', correct: false },
    ]).slice(0, 4);
  }

  // ─────────────────────────────────────────────
  // TYPE 7 — ERROR CORRECTION
  // Show a grammatically wrong sentence (with a subtle error injected).
  // Show 4 options: the corrected sentence + 3 wrong variants.
  // ─────────────────────────────────────────────
  E.registerExercise('error_correction', {
    build(word, lessonWords) {
      const correct = word.example_zh;
      const error   = _injectError(correct, word);

      // Distractor corrections
      const other = E.shuffle(lessonWords.filter(w => w.id !== word.id)).slice(0, 2);
      const options = E.shuffle([
        { label: correct, correct: true },
        { label: _injectError(correct, word, 'swap'),  correct: false },
        { label: other[0]?.example_zh || _injectError(correct, word, 'add'), correct: false },
        { label: _injectError(correct, word, 'remove'), correct: false },
      ]);

      return {
        type:          'error_correction',
        wordId:        word.id,
        errorSentence: error,
        sentenceEn:    word.example_en,
        options,
        correctAnswer: correct,
        prompt:        'Find the correct sentence (one below has a grammar error)',
        uiHint:        'multiple_choice',
        explanation:   `Correct: ${correct}`,
      };
    },
    validate(userAnswer, exercise) {
      const correct = userAnswer === exercise.correctAnswer;
      return { correct, score: correct ? scoreCorrect() : 0 };
    },
  });

  function _injectError(sentence, word, mode = 'neg') {
    if (mode === 'swap') {
      // Swap two adjacent characters
      const i = Math.floor(sentence.length / 2);
      return sentence.slice(0, i) + sentence[i + 1] + sentence[i] + sentence.slice(i + 2);
    }
    if (mode === 'add') {
      // Add 的 in wrong place
      return sentence.slice(0, 2) + '的' + sentence.slice(2);
    }
    if (mode === 'remove') {
      // Remove a character
      const i = Math.max(1, Math.floor(sentence.length * 0.4));
      return sentence.slice(0, i) + sentence.slice(i + 1);
    }
    // Default: misplace negation
    return '不' + sentence;
  }

  // ─────────────────────────────────────────────
  // TYPE 8 — AUDIO CHOICE
  // Two sub-modes alternate:
  //   8a: Hear sentence, TYPE what you heard (short answer)
  //   8b: Hear sentence, PICK which of 4 written sentences matches
  // Uses browser SpeechSynthesis.
  // ─────────────────────────────────────────────
  E.registerExercise('audio_choice', {
    build(word, lessonWords) {
      const mode = Math.random() > 0.5 ? 'listen_pick' : 'listen_write';

      if (mode === 'listen_pick') {
        const pool = E.shuffle(lessonWords.filter(w => w.id !== word.id)).slice(0, 3);
        const options = E.shuffle([
          { label: word.example_zh, correct: true },
          ...pool.map(w => ({ label: w.example_zh, correct: false })),
        ]);

        return {
          type:          'audio_choice',
          subMode:       'listen_pick',
          wordId:        word.id,
          audioText:     word.example_zh,
          options,
          correctAnswer: word.example_zh,
          prompt:        '🔊 Listen, then choose the sentence you heard',
          uiHint:        'audio_multiple_choice',
          explanation:   `You heard: ${word.example_zh}\n(${word.example_en})`,
        };
      } else {
        return {
          type:          'audio_choice',
          subMode:       'listen_write',
          wordId:        word.id,
          audioText:     word.example_zh,
          correctAnswer: word.example_zh,
          prompt:        '🔊 Listen and type what you hear (in Pinyin or Hanzi)',
          uiHint:        'audio_text_input',
          explanation:   `The sentence was: ${word.example_zh} (${word.example_en})`,
          // Accept pinyin as correct too (loose match)
          acceptPinyin:  word.example_pinyin,
        };
      }
    },
    validate(userAnswer, exercise) {
      if (exercise.subMode === 'listen_pick') {
        const correct = userAnswer === exercise.correctAnswer;
        return { correct, score: correct ? scoreCorrect() : 0 };
      } else {
        // Listen-write: fuzzy match — accept if >70% characters match
        const a = (userAnswer || '').trim().toLowerCase().replace(/\s/g, '');
        const b = exercise.correctAnswer.replace(/[，。！？]/g, '').toLowerCase();
        const p = (exercise.acceptPinyin || '').toLowerCase().replace(/\s/g, '');

        const hanziMatch  = _similarity(a, b) >= 0.7;
        const pinyinMatch = _similarity(a, p) >= 0.7;
        const correct     = hanziMatch || pinyinMatch;
        return { correct, score: correct ? 2 : 0 }; // max score 2 for typed answers
      }
    },
  });

  // Levenshtein-based similarity score 0-1
  function _similarity(a, b) {
    if (!a || !b) return 0;
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return (maxLen - _levenshtein(a, b)) / maxLen;
  }

  function _levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[a.length][b.length];
  }

  // ─────────────────────────────────────────────
  // TYPE 9 — READ TRUE / FALSE
  // AI generates a short 3-4 sentence passage using the lesson words.
  // Shows 4 statements about the passage; user picks True or False for each.
  // The AI call is made once per lesson and cached.
  // ─────────────────────────────────────────────
  E.registerExercise('read_true_false', {
    async build(word, lessonWords) {
      // Use up to 5 words from the lesson for context
      const contextWords = [word, ...E.shuffle(lessonWords.filter(w => w.id !== word.id)).slice(0, 4)];
      const cacheKey     = `rtf_cache_${contextWords.map(w => w.id).join('-')}`;

      // Check localStorage cache first
      let data = null;
      try { data = JSON.parse(localStorage.getItem(cacheKey)); } catch {}

      if (!data) {
        data = await _generateReadingPassage(contextWords);
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
      }

      return {
        type:          'read_true_false',
        wordId:        word.id,
        passage:       data.passage,
        passageEn:     data.passageEn,
        statements:    data.statements, // [{ text, isTrue }]
        correctAnswer: data.statements.map(s => s.isTrue ? 'true' : 'false'),
        prompt:        'Read the passage and mark each statement True or False',
        uiHint:        'true_false',
        explanation:   data.passageEn,
      };
    },
    validate(userAnswer, exercise) {
      // userAnswer: array of 'true'/'false' strings
      if (!Array.isArray(userAnswer)) return { correct: false, score: 0 };
      const correct = exercise.correctAnswer.every((a, i) => a === userAnswer[i]);
      const partialScore = exercise.correctAnswer.filter((a, i) => a === userAnswer[i]).length;
      const score = partialScore === exercise.correctAnswer.length ? 3
                  : partialScore >= 2 ? 2
                  : partialScore >= 1 ? 1 : 0;
      return { correct, score };
    },
  });

  async function _generateReadingPassage(words) {
    const wordList = words.map(w => `${w.zh} (${w.english})`).join(', ');
    const prompt   = `Create a very short Chinese reading comprehension exercise for HSK learners.

Words to use: ${wordList}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "passage": "3-4 sentence Chinese passage using the vocabulary above",
  "passageEn": "English translation of the passage",
  "statements": [
    { "text": "Chinese statement about the passage", "isTrue": true },
    { "text": "Chinese statement about the passage", "isTrue": false },
    { "text": "Chinese statement about the passage", "isTrue": true },
    { "text": "Chinese statement about the passage", "isTrue": false }
  ]
}`;

    try {
      const res  = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages:   [{ role: 'user', content: prompt }],
        }),
      });
      const json = await res.json();
      const raw  = json.content?.find(c => c.type === 'text')?.text || '';
      return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.warn('[Engine] AI passage generation failed, using fallback', e);
      return _fallbackPassage(words);
    }
  }

  function _fallbackPassage(words) {
    const w = words[0];
    return {
      passage:   w.example_zh,
      passageEn: w.example_en,
      statements: [
        { text: w.example_zh, isTrue: true },
        { text: '这个句子是错误的。', isTrue: false },
        { text: `${w.zh}出现在这段文字中。`, isTrue: true },
        { text: '这段文字不包含任何动词。', isTrue: false },
      ],
    };
  }

  // ─────────────────────────────────────────────
  // TYPE 10A — TRANSLATE CN → EN
  // Show Chinese sentence. User types English translation (or picks from 4 options).
  // ─────────────────────────────────────────────
  E.registerExercise('translate_cn_en', {
    build(word, lessonWords) {
      // Multiple choice variant (avoids needing perfect NLP scoring for typed)
      const pool    = E.shuffle(lessonWords.filter(w => w.id !== word.id)).slice(0, 3);
      const options = E.shuffle([
        { label: word.example_en, correct: true },
        ...pool.map(w => ({ label: w.example_en, correct: false })),
      ]);

      return {
        type:          'translate_cn_en',
        wordId:        word.id,
        sentenceZhHighlighted: E.highlightWord(word.example_zh, word.zh),
        sentenceZh:    word.example_zh,
        options,
        correctAnswer: word.example_en,
        prompt:        'Translate the Chinese sentence to English',
        uiHint:        'multiple_choice',
        explanation:   `${word.example_zh} = ${word.example_en}`,
      };
    },
    validate(userAnswer, exercise) {
      const correct = userAnswer === exercise.correctAnswer;
      return { correct, score: correct ? scoreCorrect() : 0 };
    },
  });

  // ─────────────────────────────────────────────
  // TYPE 10B — TRANSLATE EN → CN
  // Show English sentence. User picks correct Chinese translation from 4 options.
  // ─────────────────────────────────────────────
  E.registerExercise('translate_en_cn', {
    build(word, lessonWords) {
      const pool    = E.shuffle(lessonWords.filter(w => w.id !== word.id)).slice(0, 3);
      const options = E.shuffle([
        { label: word.example_zh, correct: true },
        ...pool.map(w => ({ label: w.example_zh, correct: false })),
      ]);

      return {
        type:          'translate_en_cn',
        wordId:        word.id,
        sentenceEn:    word.example_en,
        options,
        correctAnswer: word.example_zh,
        prompt:        'Translate the English sentence to Chinese',
        uiHint:        'multiple_choice',
        explanation:   `${word.example_en} = ${word.example_zh} (${word.example_pinyin})`,
      };
    },
    validate(userAnswer, exercise) {
      const correct = userAnswer === exercise.correctAnswer;
      return { correct, score: correct ? scoreCorrect() : 0 };
    },
  });

})();
/**
 * Maobai Learning Engine — ui.js
 * Renders any exercise object to the DOM.
 * Handles energy wall, heart wall, answer feedback, session progress.
 *
 * Expects a <div id="lesson-root"> in the page.
 * Dispatches custom events for the page to react to:
 *   engine:sessionComplete  — { xpTotal, diamonds, correctCount, totalCount }
 *   engine:energyEmpty      — show ad wall
 *   engine:heartsEmpty      — show heart wall
 */

const MaobaiUI = (() => {

  const E   = MaobaiEngine;
  let _session     = null;
  let _currentIdx  = 0;
  let _correctCount = 0;
  let _root        = null;
  let _answered    = false;   // prevent double-tap

  // ─────────────────────────────────────────────
  // START SESSION
  // ─────────────────────────────────────────────
  async function startSession(session) {
    _session      = session;
    _currentIdx   = 0;
    _correctCount = 0;
    _answered     = false;
    _root = document.getElementById('lesson-root');
    if (!_root) throw new Error('[UI] #lesson-root not found');

    _renderProgress();
    await _renderExercise(_session.exercises[0]);
  }

  // ─────────────────────────────────────────────
  // PROGRESS BAR
  // ─────────────────────────────────────────────
  function _renderProgress() {
    const pct = Math.round((_currentIdx / _session.totalExercises) * 100);
    const bar = document.getElementById('lesson-progress-fill');
    if (bar) bar.style.width = pct + '%';
    const label = document.getElementById('lesson-progress-label');
    if (label) label.textContent = `${_currentIdx} / ${_session.totalExercises}`;

    // Update hearts & energy in header
    const heartsEl = document.getElementById('hud-hearts');
    if (heartsEl) heartsEl.textContent = '❤️'.repeat(E.getHearts()) + '🖤'.repeat(E.CFG.HEART_MAX - E.getHearts());
    const energyEl = document.getElementById('hud-energy');
    if (energyEl) energyEl.textContent = `⚡ ${E.getEnergy()}`;
  }

  // ─────────────────────────────────────────────
  // RENDER EXERCISE (router)
  // ─────────────────────────────────────────────
  async function _renderExercise(exercise) {
    _answered = false;
    if (!exercise) { _finishSession(); return; }

    // Check energy BEFORE rendering
    if (!E.consumeEnergy(E.CFG.ENERGY_PER_EXERCISE)) {
      _showEnergyWall();
      return;
    }
    if (E.getHearts() === 0) {
      _showHeartWall();
      return;
    }

    _root.innerHTML = '';
    _root.style.animation = 'none';
    void _root.offsetWidth; // reflow
    _root.style.animation = 'exerciseFadeIn .35s ease both';

    switch (exercise.uiHint) {
      case 'intro':              _renderIntro(exercise);           break;
      case 'multiple_choice':    _renderMC(exercise);              break;
      case 'drag_order':         _renderDragOrder(exercise);       break;
      case 'audio_multiple_choice': _renderAudioMC(exercise);      break;
      case 'audio_text_input':   _renderAudioWrite(exercise);      break;
      case 'true_false':         _renderTrueFalse(exercise);       break;
      default:                   _renderMC(exercise);              break;
    }
  }

  // ─────────────────────────────────────────────
  // RENDERER: WORD INTRO
  // ─────────────────────────────────────────────
  function _renderIntro(ex) {
    _root.innerHTML = `
      <div class="ex-card ex-intro">
        <div class="ex-type-badge">New Word</div>

        <div class="intro-word-wrap">
          <button class="audio-btn" onclick="MaobaiEngine.speak('${_esc(ex.word)}')">🔊</button>
          <div class="intro-hanzi">${ex.word}</div>
          <div class="intro-pinyin">${ex.pinyin}</div>
          <div class="intro-english">${ex.english}</div>
          <div class="intro-type-badge">${ex.wordType || ''}</div>
        </div>

        <div class="intro-divider"></div>

        <div class="intro-sentence-label">In context:</div>
        <div class="intro-sentence-zh" onclick="MaobaiEngine.speak('${_esc(ex.sentenceZh)}')">${ex.sentenceZhHighlighted}</div>
        <div class="intro-sentence-py">${ex.sentencePinyin}</div>
        <div class="intro-sentence-en">${ex.sentenceEn}</div>

        <button class="btn-primary btn-got-it" onclick="MaobaiUI._submitAnswer('seen')">Got it →</button>
      </div>
    `;
  }

  // ─────────────────────────────────────────────
  // RENDERER: MULTIPLE CHOICE (shared by many types)
  // ─────────────────────────────────────────────
  function _renderMC(ex) {
    const contextHtml = _buildContextHtml(ex);

    _root.innerHTML = `
      <div class="ex-card">
        <div class="ex-type-badge">${_typeBadge(ex.type)}</div>
        <div class="ex-prompt">${ex.prompt}</div>
        ${contextHtml}
        <div class="mc-options" id="mc-options">
          ${ex.options.map((o, i) => `
            <button class="mc-option" data-idx="${i}" data-label="${_esc(o.label)}"
              onclick="MaobaiUI._mcPick(this, ${o.correct})">
              ${o.label}
            </button>
          `).join('')}
        </div>
        <div class="ex-feedback" id="ex-feedback" style="display:none"></div>
        <button class="btn-primary btn-next" id="btn-next" style="display:none"
          onclick="MaobaiUI._next()">Next →</button>
      </div>
    `;
  }

  function _buildContextHtml(ex) {
    let html = '';
    if (ex.sentenceZhHighlighted) {
      html += `<div class="ex-sentence-zh" onclick="MaobaiEngine.speak('${_esc(ex.sentenceZh || '')}')">
        ${ex.sentenceZhHighlighted} <span class="audio-inline">🔊</span>
      </div>`;
    } else if (ex.sentenceZh) {
      html += `<div class="ex-sentence-zh" onclick="MaobaiEngine.speak('${_esc(ex.sentenceZh)}')">
        ${ex.sentenceZh} <span class="audio-inline">🔊</span>
      </div>`;
    }
    if (ex.word && !ex.sentenceZhHighlighted) {
      html += `<div class="ex-big-word" onclick="MaobaiEngine.speak('${_esc(ex.word)}')">${ex.word}</div>`;
    }
    if (ex.english && ex.type === 'english_to_hanzi') {
      html += `<div class="ex-english-context">${ex.english}</div>`;
    }
    if (ex.sentenceEn && (ex.type === 'translate_cn_en' || ex.type === 'translate_en_cn')) {
      html += `<div class="ex-sentence-en">${ex.sentenceEn}</div>`;
    }
    if (ex.affirmative) {
      html += `<div class="ex-sentence-zh">${ex.affirmative}</div>`;
    }
    if (ex.errorSentence) {
      html += `<div class="ex-sentence-zh error-sentence">⚠️ ${ex.errorSentence}</div>`;
    }
    if (ex.statement) {
      html += `<div class="ex-sentence-zh">${ex.statement}</div>`;
    }
    return html;
  }

  window.MaobaiUI = window.MaobaiUI || {};

  function _mcPick(btn, isCorrect) {
    if (_answered) return;
    _answered = true;

    // Style all options
    document.querySelectorAll('.mc-option').forEach(b => {
      b.disabled = true;
      if (b === btn) {
        b.classList.add(isCorrect ? 'mc-correct' : 'mc-wrong');
      } else if (b.dataset.label === _session.exercises[_currentIdx].correctAnswer) {
        b.classList.add('mc-correct'); // reveal correct
      }
    });

    _showFeedback(isCorrect, _session.exercises[_currentIdx].explanation);
    _processAnswer(isCorrect ? 'correct' : btn.dataset.label);
  }

  // ─────────────────────────────────────────────
  // RENDERER: DRAG ORDER
  // ─────────────────────────────────────────────
  function _renderDragOrder(ex) {
    _root.innerHTML = `
      <div class="ex-card">
        <div class="ex-type-badge">${_typeBadge(ex.type)}</div>
        <div class="ex-prompt">${ex.prompt}</div>
        <div class="ex-sentence-en">${ex.sentenceEn}</div>

        <div class="drag-answer-zone" id="drag-answer"></div>
        <div class="drag-divider"></div>
        <div class="drag-token-bank" id="drag-bank">
          ${ex.tokens.map((t, i) => `
            <button class="drag-token" data-token="${_esc(t)}" data-idx="${i}"
              onclick="MaobaiUI._dragTokenPick(this)">
              ${t}
            </button>
          `).join('')}
        </div>

        <div class="ex-feedback" id="ex-feedback" style="display:none"></div>
        <button class="btn-primary btn-check" id="btn-check" onclick="MaobaiUI._checkOrder('${_esc(ex.correctAnswer)}')">
          Check Order
        </button>
        <button class="btn-primary btn-next" id="btn-next" style="display:none"
          onclick="MaobaiUI._next()">Next →</button>
      </div>
    `;
  }

  function _dragTokenPick(btn) {
    if (_answered) return;
    const zone = document.getElementById('drag-answer');
    const bank = document.getElementById('drag-bank');

    if (btn.classList.contains('token-in-zone')) {
      // Move back to bank
      btn.classList.remove('token-in-zone');
      bank.appendChild(btn);
    } else {
      // Move to answer zone
      btn.classList.add('token-in-zone');
      zone.appendChild(btn);
    }
  }

  function _checkOrder(correctAnswer) {
    if (_answered) return;
    const zone   = document.getElementById('drag-answer');
    const tokens = Array.from(zone.querySelectorAll('.drag-token')).map(b => b.dataset.token);
    const joined = tokens.join('');
    _submitAnswer(joined);
  }

  // ─────────────────────────────────────────────
  // RENDERER: AUDIO MULTIPLE CHOICE
  // ─────────────────────────────────────────────
  function _renderAudioMC(ex) {
    _root.innerHTML = `
      <div class="ex-card">
        <div class="ex-type-badge">🔊 Listen</div>
        <div class="ex-prompt">${ex.prompt}</div>
        <button class="audio-play-btn" onclick="MaobaiEngine.speak('${_esc(ex.audioText)}')">
          <span class="audio-play-icon">▶</span> Play
        </button>
        <div class="mc-options" id="mc-options">
          ${ex.options.map((o, i) => `
            <button class="mc-option mc-option-text" data-idx="${i}" data-label="${_esc(o.label)}"
              onclick="MaobaiUI._mcPick(this, ${o.correct})">
              ${o.label}
            </button>
          `).join('')}
        </div>
        <div class="ex-feedback" id="ex-feedback" style="display:none"></div>
        <button class="btn-primary btn-next" id="btn-next" style="display:none"
          onclick="MaobaiUI._next()">Next →</button>
      </div>
    `;
    // Auto-play after short delay
    setTimeout(() => E.speak(ex.audioText), 400);
  }

  // ─────────────────────────────────────────────
  // RENDERER: AUDIO WRITE
  // ─────────────────────────────────────────────
  function _renderAudioWrite(ex) {
    _root.innerHTML = `
      <div class="ex-card">
        <div class="ex-type-badge">🔊 Listen & Write</div>
        <div class="ex-prompt">${ex.prompt}</div>
        <button class="audio-play-btn" onclick="MaobaiEngine.speak('${_esc(ex.audioText)}')">
          <span class="audio-play-icon">▶</span> Play Again
        </button>
        <input type="text" class="text-input" id="text-input"
          placeholder="Type what you heard…"
          onkeydown="if(event.key==='Enter') MaobaiUI._submitAnswer(this.value)" />
        <div class="ex-feedback" id="ex-feedback" style="display:none"></div>
        <button class="btn-primary btn-check" onclick="MaobaiUI._submitAnswer(document.getElementById('text-input').value)">
          Check
        </button>
        <button class="btn-primary btn-next" id="btn-next" style="display:none"
          onclick="MaobaiUI._next()">Next →</button>
      </div>
    `;
    setTimeout(() => E.speak(ex.audioText), 400);
  }

  // ─────────────────────────────────────────────
  // RENDERER: TRUE / FALSE
  // ─────────────────────────────────────────────
  function _renderTrueFalse(ex) {
    _root.innerHTML = `
      <div class="ex-card">
        <div class="ex-type-badge">📖 Read</div>
        <div class="ex-prompt">${ex.prompt}</div>

        <div class="tf-passage" onclick="MaobaiEngine.speak('${_esc(ex.passage)}')">
          ${ex.passage} <span class="audio-inline">🔊</span>
        </div>
        <div class="tf-passage-en">${ex.passageEn}</div>

        <div class="tf-statements" id="tf-statements">
          ${ex.statements.map((s, i) => `
            <div class="tf-row" data-idx="${i}" data-correct="${s.isTrue}">
              <div class="tf-text">${s.text}</div>
              <div class="tf-btns">
                <button class="tf-btn tf-true"  data-val="true"  onclick="MaobaiUI._tfPick(this)">✓ True</button>
                <button class="tf-btn tf-false" data-val="false" onclick="MaobaiUI._tfPick(this)">✗ False</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="ex-feedback" id="ex-feedback" style="display:none"></div>
        <button class="btn-primary btn-check" id="btn-check" onclick="MaobaiUI._checkTrueFalse()">
          Check Answers
        </button>
        <button class="btn-primary btn-next" id="btn-next" style="display:none"
          onclick="MaobaiUI._next()">Next →</button>
      </div>
    `;
  }

  function _tfPick(btn) {
    if (_answered) return;
    const row = btn.closest('.tf-row');
    row.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('tf-selected'));
    btn.classList.add('tf-selected');
  }

  function _checkTrueFalse() {
    if (_answered) return;
    const rows    = document.querySelectorAll('.tf-row');
    const answers = Array.from(rows).map(r => {
      const sel = r.querySelector('.tf-btn.tf-selected');
      return sel ? sel.dataset.val : null;
    });
    if (answers.includes(null)) {
      // Prompt to answer all
      const fb = document.getElementById('ex-feedback');
      fb.style.display = 'block';
      fb.className = 'ex-feedback fb-warning';
      fb.textContent = 'Please answer all statements first.';
      return;
    }
    _submitAnswer(answers);
  }

  // ─────────────────────────────────────────────
  // ANSWER SUBMISSION + FEEDBACK
  // ─────────────────────────────────────────────
  async function _submitAnswer(userAnswer) {
    if (_answered && userAnswer !== 'seen') return;
    _answered = true;

    const exercise = _session.exercises[_currentIdx];
    const result   = await E.processAnswer(exercise, userAnswer);

    if (result.correct) _correctCount++;
    _showFeedback(result.correct, result.explanation, result);

    // Update HUD
    _renderProgress();

    // Show next button
    const btnNext = document.getElementById('btn-next');
    if (btnNext) {
      btnNext.style.display = 'block';
      if (exercise.uiHint === 'intro') {
        // Auto-advance intro after 1.5s
        setTimeout(() => _next(), 1500);
      }
    }
  }

  function _showFeedback(correct, explanation, result) {
    const fb = document.getElementById('ex-feedback');
    if (!fb) return;
    fb.style.display  = 'block';
    fb.className      = `ex-feedback ${correct ? 'fb-correct' : 'fb-wrong'}`;

    const hearts = result?.heartLost ? `<span class="fb-heart-lost">-1 ❤️</span>` : '';
    const xp     = result?.xpGained  ? `<span class="fb-xp">+${result.xpGained} XP</span>` : '';

    fb.innerHTML = `
      <div class="fb-header">
        <span class="fb-icon">${correct ? '✓' : '✗'}</span>
        <span class="fb-label">${correct ? 'Correct!' : 'Incorrect'}</span>
        ${xp}${hearts}
      </div>
      ${explanation ? `<div class="fb-explanation">${explanation}</div>` : ''}
    `;
  }

  // ─────────────────────────────────────────────
  // ADVANCE TO NEXT
  // ─────────────────────────────────────────────
  function _next() {
    _currentIdx++;
    _answered = false;
    if (_currentIdx >= _session.totalExercises) {
      _finishSession();
    } else {
      _renderProgress();
      _renderExercise(_session.exercises[_currentIdx]);
    }
  }

  // ─────────────────────────────────────────────
  // SESSION COMPLETE
  // ─────────────────────────────────────────────
  async function _finishSession() {
    const result = await E.completeLesson({
      lessonId:     _session.lessonId,
      level:        _session.level,
      correctCount: _correctCount,
      totalCount:   _session.totalExercises,
    });

    _root.innerHTML = `
      <div class="ex-card session-complete">
        <div class="complete-emoji">🎉</div>
        <div class="complete-title">Lesson Complete!</div>
        <div class="complete-stats">
          <div class="cs-row">
            <span class="cs-label">Correct</span>
            <span class="cs-val cs-green">${_correctCount} / ${_session.totalExercises}</span>
          </div>
          <div class="cs-row">
            <span class="cs-label">XP Earned</span>
            <span class="cs-val cs-gold">+${result.xpTotal}</span>
          </div>
          <div class="cs-row">
            <span class="cs-label">Diamonds</span>
            <span class="cs-val cs-blue">+${result.diamonds} 💎</span>
          </div>
        </div>
        <button class="btn-primary" onclick="history.back()">Continue →</button>
      </div>
    `;

    window.dispatchEvent(new CustomEvent('engine:sessionComplete', {
      detail: { ...result, correctCount: _correctCount, totalCount: _session.totalExercises }
    }));
  }

  // ─────────────────────────────────────────────
  // WALLS — Energy & Hearts
  // ─────────────────────────────────────────────
  function _showEnergyWall() {
    _root.innerHTML = `
      <div class="ex-card wall-card">
        <div class="wall-icon">⚡</div>
        <div class="wall-title">Out of Energy</div>
        <div class="wall-sub">Watch a short ad to get +${E.CFG.ENERGY_AD_REWARD} energy and continue.</div>
        <button class="btn-primary btn-ad" onclick="MaobaiUI._watchAdEnergy()">
          📺 Watch Ad (+${E.CFG.ENERGY_AD_REWARD} ⚡)
        </button>
        <button class="btn-secondary" onclick="history.back()">Leave Lesson</button>
      </div>
    `;
    window.dispatchEvent(new CustomEvent('engine:energyEmpty'));
  }

  function _showHeartWall() {
    _root.innerHTML = `
      <div class="ex-card wall-card">
        <div class="wall-icon">❤️</div>
        <div class="wall-title">No Hearts Left</div>
        <div class="wall-sub">Watch an ad to get 1 heart, or wait 30 minutes for regen.</div>
        <button class="btn-primary btn-ad" onclick="MaobaiUI._watchAdHeart()">
          📺 Watch Ad (+1 ❤️)
        </button>
        <button class="btn-secondary" onclick="history.back()">Leave Lesson</button>
      </div>
    `;
    window.dispatchEvent(new CustomEvent('engine:heartsEmpty'));
  }

  // Ad reward handlers — replace with real ad SDK calls
  function _watchAdEnergy() {
    E.addEnergyAd();
    _renderProgress();
    _renderExercise(_session.exercises[_currentIdx]);
  }

  function _watchAdHeart() {
    E.addHeartAd();
    _renderProgress();
    _renderExercise(_session.exercises[_currentIdx]);
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  function _typeBadge(type) {
    const map = {
      word_intro:        '✨ New Word',
      gap_fill:          '📝 Fill the Gap',
      hanzi_to_english:  '🔤 Meaning',
      english_to_hanzi:  '汉 Characters',
      word_order:        '🔀 Word Order',
      negation:          '🚫 Negation',
      question_builder:  '❓ Question',
      error_correction:  '🔍 Find the Error',
      audio_choice:      '🔊 Listening',
      read_true_false:   '📖 Reading',
      translate_cn_en:   '🌐 Translate →EN',
      translate_en_cn:   '🌐 Translate →中',
    };
    return map[type] || type;
  }

  function _esc(s) {
    return String(s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // ─────────────────────────────────────────────
  // PUBLIC
  // ─────────────────────────────────────────────
  const publicApi = {
    startSession,
    // expose internals for inline onclick handlers
    _submitAnswer,
    _mcPick,
    _dragTokenPick,
    _checkOrder,
    _tfPick,
    _checkTrueFalse,
    _next,
    _watchAdEnergy,
    _watchAdHeart,
  };

  window.MaobaiUI = publicApi;
  return publicApi;

})();
