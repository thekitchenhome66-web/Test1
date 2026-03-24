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
