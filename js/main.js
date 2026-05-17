/* ============================================================
   STEM Math Lomdah — main.js
   ============================================================ */

'use strict';

/* ─── Globals ───────────────────────────────────────────── */
const TOTAL_SCREENS = 6;
let currentScreen = 0;

const CORRECT_ANSWERS = { timer1: 60, timer2: 40, timer3: 105 };
let attemptCount = 0;
const MAX_ATTEMPTS = 2;
const IFRAME_URL =
  'https://lomdot.education.gov.il/metodica/%D7%AA%D7%A9%D7%A4%D7%95/stem/%D7%9E%D7%AA%D7%9E%D7%98%D7%99%D7%A7%D7%94/simulations/time-management.html';

/* ─── Scale canvas to viewport ─────────────────────────── */
function scaleApp() {
  const app = document.getElementById('app');
  const scaleX = window.innerWidth  / 1920;
  const scaleY = window.innerHeight / 1080;
  const scale  = Math.min(scaleX, scaleY);

  app.style.transform = `scale(${scale})`;
  app.style.left = `${(window.innerWidth  - 1920 * scale) / 2}px`;
  app.style.top  = `${(window.innerHeight - 1080 * scale) / 2}px`;
}

window.addEventListener('resize', scaleApp);
scaleApp();

/* ─── Navigation ────────────────────────────────────────── */
function goTo(n) {
  if (n < 0 || n >= TOTAL_SCREENS) return;

  // עצור את כל הוידאו לפני מעבר מסך — אין ניגון ברקע
  document.querySelectorAll('video').forEach(v => v.pause());

  const screens = document.querySelectorAll('.screen');
  screens[currentScreen].classList.remove('active');
  currentScreen = n;
  screens[currentScreen].classList.add('active');

  resetScreenState();
  if (n === 5) enterFrame6();
}

/** Reset transient UI state when changing screen */
function resetScreenState() {
  // סגור את כל הפופ-אפים ואפס כל כפתורי העזרה
  closeAllPopups();

  // ── מסך 3 (Q1) — אפס רק אם השאלה טרם הושלמה ──────────
  if (!screen3Done) {
    attemptCount = 0;

    const submitBtn   = document.getElementById('submit-btn');
    const tryAgainMsg = document.getElementById('try-again-msg');
    const feedbackOk  = document.getElementById('feedback-correct');
    const feedbackFail= document.getElementById('feedback-incorrect');
    const nextS3      = document.getElementById('next-s3');

    if (submitBtn)    { submitBtn.disabled = false; submitBtn.classList.add('hidden'); }
    if (tryAgainMsg)  tryAgainMsg.classList.add('hidden');
    if (feedbackOk)   feedbackOk.classList.add('hidden');
    if (feedbackFail) feedbackFail.classList.add('hidden');
    if (nextS3)       nextS3.classList.add('hidden');

    ['timer1', 'timer2', 'timer3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = ''; el.classList.remove('correct', 'incorrect'); }
    });
  }

  // ── מסך 4 (Q2, Frame 5) — אפס רק אם השאלה טרם הושלמה ─
  if (!screen4Done) {
    attemptCountS4 = 0;

    const submitBtnS4   = document.getElementById('submit-btn-s4');
    const tryAgainS4    = document.getElementById('try-again-msg-s4');
    const feedbackS4Ok  = document.getElementById('feedback-s4-correct');
    const feedbackS4Err = document.getElementById('feedback-s4-incorrect');
    const nextS4        = document.getElementById('next-s4');
    const timerS4el     = document.getElementById('timer-s4');

    if (submitBtnS4)   { submitBtnS4.disabled = false; submitBtnS4.classList.add('hidden'); }
    if (tryAgainS4)    tryAgainS4.classList.add('hidden');
    if (feedbackS4Ok)  feedbackS4Ok.classList.add('hidden');
    if (feedbackS4Err) feedbackS4Err.classList.add('hidden');
    if (nextS4)        nextS4.classList.add('hidden');
    if (timerS4el)     { timerS4el.value = ''; timerS4el.classList.remove('correct', 'incorrect'); }
  }

  // כשחוזרים למסך 0 — מאפסים טלפון, הודעות, חץ וידאו
  const phoneDiv = document.getElementById('frame1-phone');
  const notif1   = document.getElementById('notif-1');
  const notif2   = document.getElementById('notif-2');
  const nextBtn0 = document.getElementById('next-s0');
  const playBtn0 = document.getElementById('play-btn-s0');
  const noaVid   = document.getElementById('noa-video');

  if (noaVideoWatched) {
    // כבר צפתה — מציג מצב סופי: טלפון + הודעה 2 + חץ, ללא Play
    if (phoneDiv) phoneDiv.classList.remove('hidden');
    if (notif1)   notif1.classList.add('hidden');
    if (notif2)   notif2.classList.remove('hidden');
    if (nextBtn0) nextBtn0.classList.remove('hidden');
    if (playBtn0) playBtn0.style.display = 'none';
  } else {
    // טרם צפתה — מאפס הכל למצב התחלתי
    if (phoneDiv) phoneDiv.classList.add('hidden');
    if (notif1)   notif1.classList.remove('hidden');
    if (notif2)   notif2.classList.add('hidden');
    if (nextBtn0) nextBtn0.classList.add('hidden');
    if (playBtn0) playBtn0.style.display = '';
  }
  if (noaVid) { noaVid.pause(); noaVid.currentTime = 0; }

  // ── Screen 5 (Frame 6): WhatsApp messages ─────────────────
  // אם עדיין לא נצפה — ודא שכל ההודעות מוסתרות
  if (!frame6Seen) {
    ['ofri-m1', 'ofri-m2', 'ofri-m3', 'ofri-m4'].forEach(id =>
      document.getElementById(id)?.classList.add('hidden'));
  }

  // עצור גם את וידאו אלכס ואפס כפתור Play שלו
  const alexVid  = document.getElementById('alex-video');
  const playBtn1 = document.getElementById('play-btn');
  const nextS1   = document.getElementById('next-s1');
  if (alexVid)  { alexVid.pause(); alexVid.currentTime = 0; }
  if (playBtn1) playBtn1.style.display = '';
  // אם כבר צפתה בסרטון — החץ נשאר גלוי; אחרת נסתר עד סיום
  if (nextS1) {
    if (alexVideoWatched) {
      nextS1.classList.remove('hidden');
    } else {
      nextS1.classList.add('hidden');
    }
  }
}

/* ─── Init ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNoaVideo();        // Screen 0: Frame 1 fullscreen background video
  initAlexVideo();       // Screen 1: Alex influencer video
  initHelpButtons();     // כל המסכים: help popup toggle (data-popup attribute)
  initSubmitButton();    // Screen 3: show submit only when all fields filled
  initSubmitButtonS4();  // Screen 4: show submit only when field filled
  initKeyboard();
});

/* ─── Screen 0: Noa fullscreen video ───────────────────── */
/*
   מצב א: Play overlay מלא-מסך → לחיצה → וידאו מתנגן.
   מצב ב: וידאו נגמר → טלפון מופיע + הודעה 1 ("הדו"ח השבועי זמין").
   מצב ג: אחרי 2 שניות → הודעה 2 מחליפה הודעה 1 + חץ ניווט מופיע.
   אין replay לוידאו זה.
*/
function initNoaVideo() {
  const noaVideo = document.getElementById('noa-video');
  const playBtn  = document.getElementById('play-btn-s0');

  if (!noaVideo) return;

  function revealPhone() {
    const phoneDiv = document.getElementById('frame1-phone');
    const notif1   = document.getElementById('notif-1');
    const notif2   = document.getElementById('notif-2');
    const nextBtn  = document.getElementById('next-s0');

    // מצב ב: טלפון + הודעה 1
    if (phoneDiv) phoneDiv.classList.remove('hidden');

    // מצב ג: אחרי 3 שניות — הודעה 2 מחליפה + חץ
    setTimeout(() => {
      if (notif1)  notif1.classList.add('hidden');
      if (notif2)  notif2.classList.remove('hidden');
      if (nextBtn) nextBtn.classList.remove('hidden');
      noaVideoWatched = true;   // סימון: הסרטון נצפה עד הסוף
    }, 3000);
  }

  // לחיצה על Play overlay → מתחיל את הוידאו
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      noaVideo.play()
        .then(() => {
          playBtn.style.display = 'none';
        })
        .catch(err => {
          console.warn('noa-video play failed:', err);
          playBtn.style.display = 'none';
          revealPhone();
        });
    });
  }

  // סיום הוידאו → הצגת טלפון + הודעות
  noaVideo.addEventListener('ended', revealPhone);

  // קובץ חסר → מדלג ישירות לטלפון
  noaVideo.addEventListener('error', () => {
    console.warn('noa-video could not load — skipping to phone state');
    if (playBtn) playBtn.style.display = 'none';
    revealPhone();
  });
}

/* ─── Screen 1: Alex video ──────────────────────────────── */
/*
   פעם ראשונה: חץ "הבא" מופיע רק אחרי שהסרטון נגמר.
   פעמים הבאות: חץ "הבא" מופיע מיד (alexVideoWatched = true).
*/
let alexVideoWatched = false;
let noaVideoWatched  = false;
let frame6Seen       = false;

/* Resume-state flags for question screens.
   Once true, resetScreenState() skips resetting that screen
   so the learner cannot re-answer after navigating forward. */
let screen3Done = false;  // Screen 3 (Q1 — timer inputs)
let screen4Done = false;  // Screen 4 (Q2 — single timer input)

function initAlexVideo() {
  const playBtn   = document.getElementById('play-btn');
  const alexVideo = document.getElementById('alex-video');
  const nextBtn   = document.getElementById('next-s1');

  if (!playBtn || !alexVideo) return;

  playBtn.addEventListener('click', () => {
    alexVideo.play()
      .then(() => {
        playBtn.style.display = 'none';
      })
      .catch(err => {
        console.warn('Alex video play failed:', err);
        playBtn.style.display = 'none';
        if (nextBtn) nextBtn.classList.remove('hidden');
      });
  });

  alexVideo.addEventListener('ended', () => {
    alexVideoWatched = true;
    setTimeout(() => {
      if (nextBtn) nextBtn.classList.remove('hidden');
      playBtn.style.display = '';   // כפתור Play חוזר לצפייה חוזרת
    }, 400);
  });
}

/* ─── Help Popup — כל המסכים ───────────────────────────────
   כל כפתור עזרה מכיל data-popup="<popup-id>" שמצביע על
   אלמנט הפופ-אפ שלו. פופ-אפ יחיד פעיל בכל רגע.
─────────────────────────────────────────────────────── */
function initHelpButtons() {
  document.querySelectorAll('.help-btn[data-popup]').forEach(btn => {
    btn.addEventListener('click', () => toggleHelpPopup(btn));
  });
}

function toggleHelpPopup(btn) {
  const popupId = btn.dataset.popup;
  const popup = document.getElementById(popupId);
  if (!popup) return;
  const isOpen = !popup.classList.contains('hidden');

  // סגור את כל הפופ-אפים ואפס כל כפתורי עזרה
  closeAllPopups();

  if (!isOpen) {
    popup.classList.remove('hidden');
    btn.classList.add('is-open');
  }
}

function closeAllPopups() {
  document.querySelectorAll('.help-popup').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.help-btn').forEach(b => b.classList.remove('is-open'));
}

/* ─── Screen 3: Submit button — גלוי רק כשכל השדות מלאים ── */
function initSubmitButton() {
  ['timer1', 'timer2', 'timer3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateSubmitVisibility);
  });
}

function updateSubmitVisibility() {
  const btn = document.getElementById('submit-btn');
  if (!btn || btn.disabled) return;
  const allFilled = ['timer1', 'timer2', 'timer3'].every(id => {
    const el = document.getElementById(id);
    return el && el.value.trim() !== '' && !isNaN(parseInt(el.value, 10));
  });
  btn.classList.toggle('hidden', !allFilled);
}

/* ─── Screen 3: Answer Validation — 2 ניסיונות ────────────
   ניסיון 1 + שגוי  → הודעת "נסו שוב" inline בלבד
   ניסיון 2 + שגוי  → feedback-incorrect + מילוי תשובות נכונות
   נכון (כל ניסיון) → feedback-correct
   אחרי feedback: כפתור מושבת
─────────────────────────────────────────────────────── */
function checkAnswers() {
  if (attemptCount >= MAX_ATTEMPTS) return;

  const t1 = parseInt(document.getElementById('timer1').value, 10);
  const t2 = parseInt(document.getElementById('timer2').value, 10);
  const t3 = parseInt(document.getElementById('timer3').value, 10);

  if (isNaN(t1) || isNaN(t2) || isNaN(t3)) {
    highlightEmptyFields(t1, t2, t3);
    return;
  }

  attemptCount++;

  const isCorrect =
    t1 === CORRECT_ANSWERS.timer1 &&
    t2 === CORRECT_ANSWERS.timer2 &&
    t3 === CORRECT_ANSWERS.timer3;

  if (isCorrect) {
    colorInput('timer1', true);
    colorInput('timer2', true);
    colorInput('timer3', true);
    // מסתיר "נסו שוב" אם הופיע בניסיון קודם
    const msgOk = document.getElementById('try-again-msg');
    if (msgOk) msgOk.classList.add('hidden');
    showFeedback('correct');
    disableSubmit();
    return;
  }

  // תשובה שגויה
  if (attemptCount >= MAX_ATTEMPTS) {
    // ניסיון 2 שגוי — feedback מלא + מילוי תשובות נכונות
    // מסתיר את הודעת "נסו שוב" שהופיעה בניסיון 1
    const tryAgainMsg = document.getElementById('try-again-msg');
    if (tryAgainMsg) tryAgainMsg.classList.add('hidden');
    colorInput('timer1', t1 === CORRECT_ANSWERS.timer1);
    colorInput('timer2', t2 === CORRECT_ANSWERS.timer2);
    colorInput('timer3', t3 === CORRECT_ANSWERS.timer3);
    prefillAnswers();
    showFeedback('incorrect');
    disableSubmit();
  } else {
    // ניסיון 1 שגוי — הודעה inline בלבד, השדות נאפסים לניסיון חוזר
    const msg = document.getElementById('try-again-msg');
    if (msg) msg.classList.remove('hidden');
    // איפוס צבעי השדות לכניסה מחדש
    ['timer1', 'timer2', 'timer3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('correct', 'incorrect');
    });
  }
}

function disableSubmit() {
  screen3Done = true;  // נועל את מסך 3 — לא יאופס בחזרה
  const btn = document.getElementById('submit-btn');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('hidden');
  }
  // נועל את שדות הקלט — לא ניתן לערוך אחרי חשיפת התשובה
  ['timer1', 'timer2', 'timer3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
  const nextBtn = document.getElementById('next-s3');
  if (nextBtn) nextBtn.classList.remove('hidden');
}

function colorInput(id, isCorrect) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('correct', 'incorrect');
  el.classList.add(isCorrect ? 'correct' : 'incorrect');
}

function highlightEmptyFields(t1, t2, t3) {
  if (isNaN(t1)) shakeInput('timer1');
  if (isNaN(t2)) shakeInput('timer2');
  if (isNaN(t3)) shakeInput('timer3');
}

function shakeInput(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake 0.4s ease';
}

function showFeedback(type) {
  const correct   = document.getElementById('feedback-correct');
  const incorrect = document.getElementById('feedback-incorrect');
  correct.classList.add('hidden');
  incorrect.classList.add('hidden');
  const panel = type === 'correct' ? correct : incorrect;
  panel.classList.remove('hidden');
}

function prefillAnswers() {
  for (const [id, val] of Object.entries(CORRECT_ANSWERS)) {
    const el = document.getElementById(id);
    if (el) {
      el.value = val;
      el.classList.remove('correct', 'incorrect');
      el.classList.add('correct');
    }
  }
}

/* ─── Zoom Modal ────────────────────────────────────────── */
function openZoom() {
  const modal = document.getElementById('zoom-modal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeZoom() {
  const modal = document.getElementById('zoom-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('zoom-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeZoom();
});

/* ─── Keyboard Navigation ───────────────────────────────── */
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        // Presentation convention: right/up = next slide (regardless of RTL)
        goTo(currentScreen + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        goTo(currentScreen - 1);
        break;
      case 'Escape':
        closeZoom();
        closeAllPopups();
        break;
    }
  });
}

/* ─── Screen 4 (Frame 5): Answer Validation ────────────────
   שאלה יחידה: פרק בסדרה = 40% × 105 = 42 דקות.
   מנגנון זהה לScreen 3 אך עם שדה יחיד ופידבק בפאנל שמאל.
─────────────────────────────────────────────────────── */
const CORRECT_ANSWER_S4 = 42;
let attemptCountS4 = 0;

function initSubmitButtonS4() {
  const el = document.getElementById('timer-s4');
  if (el) el.addEventListener('input', updateSubmitVisibilityS4);
}

function updateSubmitVisibilityS4() {
  const btn = document.getElementById('submit-btn-s4');
  if (!btn || btn.disabled) return;
  const el = document.getElementById('timer-s4');
  const filled = el && el.value.trim() !== '' && !isNaN(parseInt(el.value, 10));
  btn.classList.toggle('hidden', !filled);
}

function checkAnswersS4() {
  if (attemptCountS4 >= MAX_ATTEMPTS) return;

  const t = parseInt(document.getElementById('timer-s4').value, 10);
  if (isNaN(t)) { shakeInput('timer-s4'); return; }

  attemptCountS4++;
  const isCorrect = (t === CORRECT_ANSWER_S4);

  if (isCorrect) {
    colorInput('timer-s4', true);
    document.getElementById('try-again-msg-s4')?.classList.add('hidden');
    showFeedbackS4('correct');
    disableSubmitS4();
    return;
  }

  if (attemptCountS4 >= MAX_ATTEMPTS) {
    // ניסיון 2 שגוי — פידבק מלא + מילוי תשובה נכונה
    document.getElementById('try-again-msg-s4')?.classList.add('hidden');
    colorInput('timer-s4', false);
    // prefill תשובה נכונה
    const el = document.getElementById('timer-s4');
    if (el) { el.value = CORRECT_ANSWER_S4; el.classList.remove('correct', 'incorrect'); el.classList.add('correct'); }
    showFeedbackS4('incorrect');
    disableSubmitS4();
  } else {
    // ניסיון 1 שגוי — הודעה inline בלבד
    document.getElementById('try-again-msg-s4')?.classList.remove('hidden');
    document.getElementById('timer-s4')?.classList.remove('correct', 'incorrect');
  }
}

function showFeedbackS4(type) {
  document.getElementById('feedback-s4-correct').classList.add('hidden');
  document.getElementById('feedback-s4-incorrect').classList.add('hidden');
  const panel = type === 'correct'
    ? document.getElementById('feedback-s4-correct')
    : document.getElementById('feedback-s4-incorrect');
  panel.classList.remove('hidden');
}

function disableSubmitS4() {
  screen4Done = true;  // נועל את מסך 4 — לא יאופס בחזרה
  const btn = document.getElementById('submit-btn-s4');
  if (btn) { btn.disabled = true; btn.classList.add('hidden'); }
  // נועל את שדה הקלט — לא ניתן לערוך אחרי חשיפת התשובה
  const timerEl = document.getElementById('timer-s4');
  if (timerEl) timerEl.disabled = true;
  const nextBtn = document.getElementById('next-s4');
  if (nextBtn) nextBtn.classList.remove('hidden');
}

/* ─── Screen 5 (Frame 6): Ofri WhatsApp animation ───────────
   ביקור ראשון: כל הודעה מופיעה בתורה עם float-in + צליל.
   ביקור חוזר:  כל ההודעות מופיעות מיד, ללא אנימציה.
─────────────────────────────────────────────────────── */
function enterFrame6() {
  const msgIds = ['ofri-m1', 'ofri-m2', 'ofri-m3', 'ofri-m4'];

  if (frame6Seen) {
    // ביקור חוזר — הצג הכל מיד
    msgIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.animation = 'none'; el.classList.remove('hidden'); }
    });
    return;
  }

  // ביקור ראשון — אנימציית float-in בתורה
  msgIds.forEach(id => document.getElementById(id)?.classList.add('hidden'));

  const delays = [600, 2100, 3600, 5100]; // ms per message

  msgIds.forEach((id, i) => {
    setTimeout(() => {
      if (currentScreen !== 5) return; // המשתמש עזב את המסך
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('hidden');
      // reset ← play animation
      el.style.animation = 'none';
      el.offsetHeight;   // force reflow
      el.style.animation = 'floatIn 0.6s ease forwards';
      // צליל WhatsApp
      new Audio('audio/whatsapp_message_3.mp3').play().catch(() => {});
    }, delays[i]);
  });

  frame6Seen = true;
}

/* ─── CSS animation for shake ───────────────────────────── */
(function injectShakeCSS() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-6px); }
      40%       { transform: translateX(6px); }
      60%       { transform: translateX(-4px); }
      80%       { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(style);
})();
