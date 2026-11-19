import React, { useMemo, useState } from 'react';
import {
  Headphones, Volume2, Play, CheckCircle2, RotateCcw,
  Keyboard, Captions, Mic, ChevronRight
} from 'lucide-react';

const STORAGE_KEY = 'ntc-hsk1-listen-stats';

function readStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      done: Number(saved?.done) || 0,
      correct: Number(saved?.correct) || 0,
      byLesson: saved?.byLesson && typeof saved.byLesson === 'object' ? saved.byLesson : {}
    };
  } catch {
    return { done: 0, correct: 0, byLesson: {} };
  }
}

const normalizeAnswer = (value) =>
  String(value || '')
    .normalize('NFKC')
    .replace(/[，。！？、,.!?\s]/g, '')
    .toLowerCase();

export default function HSKListeningPractice({ words = [], lessons = [] }) {
  const safeWords = Array.isArray(words) ? words : [];
  const safeLessons = Array.isArray(lessons) ? lessons : [];
  const firstLessonId = safeLessons[0]?.id ?? 1;

  const [lessonId, setLessonId] = useState(firstLessonId);
  const [mode, setMode] = useState('choose');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [stats, setStats] = useState(readStats);

  const lesson = safeLessons.find((item) => Number(item.id) === Number(lessonId)) || safeLessons[0];

  // Ưu tiên đúng thứ tự wordIds trong dữ liệu bài học; nếu thiếu thì dùng lesson trên từng từ.
  const items = useMemo(() => {
    if (!lesson) return [];
    if (Array.isArray(lesson.wordIds) && lesson.wordIds.length) {
      const byId = new Map(safeWords.map((word) => [word.id, word]));
      const ordered = lesson.wordIds.map((id) => byId.get(id)).filter(Boolean);
      if (ordered.length) return ordered;
    }
    return safeWords.filter((word) => Number(word.lesson) === Number(lesson.id));
  }, [lesson, safeWords]);

  const item = items.length ? items[index % items.length] : null;

  const speak = (text, rate = 0.82) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setFeedback({ ok: false, text: 'Trình duyệt này chưa hỗ trợ giọng đọc tiếng Trung.' });
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    const voices = window.speechSynthesis.getVoices?.() || [];
    const chineseVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith('zh'));
    if (chineseVoice) utterance.voice = chineseVoice;
    window.speechSynthesis.speak(utterance);
  };

  const options = useMemo(() => {
    if (!item) return [];
    const distractors = safeWords.filter((word) =>
      word.id !== item.id &&
      word.meaning !== item.meaning &&
      word.han !== item.han
    );
    const seed = Math.abs(Number(String(item.id).replace(/\D/g, '')) || index + 1);
    const chosen = [];
    for (let step = 0; step < distractors.length && chosen.length < 3; step += 1) {
      const candidate = distractors[(seed + step * 17) % distractors.length];
      if (candidate && !chosen.some((word) => word.id === candidate.id)) chosen.push(candidate);
    }
    return [item, ...chosen].sort((a, b) => a.han.localeCompare(b.han, 'zh-CN'));
  }, [item, safeWords, index]);

  const saveStats = (nextStats) => {
    setStats(nextStats);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStats));
    } catch {
      // Không chặn việc luyện tập nếu trình duyệt không cho ghi storage.
    }
  };

  const resetQuestion = () => {
    setAnswer('');
    setFeedback(null);
    setShowHint(false);
  };

  const changeLesson = (nextId) => {
    setLessonId(Number(nextId));
    setIndex(0);
    resetQuestion();
  };

  const next = () => {
    if (!items.length) return;
    setIndex((currentIndex) => (currentIndex + 1) % items.length);
    resetQuestion();
  };

  const check = (value) => {
    if (!item || !String(value).trim()) return;
    const isCorrect = mode === 'write'
      ? normalizeAnswer(value) === normalizeAnswer(item.han)
      : value === item.id;

    const nextStats = {
      ...stats,
      done: stats.done + 1,
      correct: stats.correct + (isCorrect ? 1 : 0),
      byLesson: {
        ...stats.byLesson,
        [lesson.id]: (Number(stats.byLesson[lesson.id]) || 0) + (isCorrect ? 1 : 0)
      }
    };
    saveStats(nextStats);
    setAnswer(value);
    setFeedback({
      ok: isCorrect,
      text: isCorrect ? 'Chính xác! Bạn làm tốt lắm.' : 'Chưa chính xác. Hãy nghe lại và thử lần nữa.'
    });
  };

  const retry = () => {
    setFeedback(null);
    if (mode === 'write') setAnswer('');
  };

  if (!safeLessons.length || !lesson) {
    return <div className="empty-card"><b>Chưa có dữ liệu bài học HSK 1.</b></div>;
  }

  if (!item) {
    return <div className="empty-card"><b>Bài học này chưa có mục từ để luyện nghe.</b></div>;
  }

  return (
    <>
      <div className="page-intro">
        <div className="eyebrow"><Headphones size={14} /> NGHE HIỂU · HSK 1</div>
        <h1>Luyện nghe theo giáo trình</h1>
        <p>Nghe từ vựng theo thứ tự từng bài, chọn đáp án hoặc chép chữ Hán. Âm thanh sử dụng giọng tiếng Trung tổng hợp của trình duyệt.</p>
      </div>

      <div className="listen-hero hsk-listen-hero">
        <div className="listen-art">
          <div className="listen-headphones">🎧</div>
          <div><span>HSK 1 · {safeLessons.length} BÀI</span><b>听力练习</b><small>Luyện nghe từ vựng</small></div>
        </div>
        <div className="hsk-listen-stats">
          <div><small>LƯỢT TRẢ LỜI</small><b>{stats.done}</b></div>
          <div><small>TRẢ LỜI ĐÚNG</small><b>{stats.correct}</b></div>
          <div><small>TỈ LỆ ĐÚNG</small><b>{stats.done ? Math.round(stats.correct / stats.done * 100) : 0}%</b></div>
        </div>
      </div>

      <div className="hsk-listen-layout">
        <section className="hsk-listen-main">
          <div className="hsk-listen-select">
            <label>Chọn bài học</label>
            <select value={lesson.id} onChange={(event) => changeLesson(event.target.value)}>
              {safeLessons.map((entry) => (
                <option key={entry.id} value={entry.id}>Bài {entry.id} · {entry.topic || entry.title}</option>
              ))}
            </select>
            <h3>{lesson.title}</h3>
            <p>{lesson.translation}</p>
            <small>{items.length} mục từ theo danh sách của bài học</small>
          </div>

          <div className="hsk-mode-tabs">
            <button className={mode === 'choose' ? 'active' : ''} onClick={() => { setMode('choose'); resetQuestion(); }}>
              <Captions size={16} /> Nghe chọn từ
            </button>
            <button className={mode === 'write' ? 'active' : ''} onClick={() => { setMode('write'); resetQuestion(); }}>
              <Keyboard size={16} /> Nghe chép chữ
            </button>
            <button className={mode === 'shadow' ? 'active' : ''} onClick={() => { setMode('shadow'); resetQuestion(); }}>
              <Mic size={16} /> Shadowing
            </button>
          </div>

          <div className="hsk-listen-card">
            <div className="hsk-listen-card-head">
              <span className="tag">BÀI {lesson.id} · TỪ {index + 1}/{items.length}</span>
              <button className="icon-btn" onClick={() => { setIndex(0); resetQuestion(); }} title="Làm lại bài">
                <RotateCcw size={16} />
              </button>
            </div>

            <div className="hsk-audio-orb">
              <button onClick={() => speak(item.han, 0.78)} aria-label="Phát âm từ tiếng Trung">
                <Play size={28} fill="currentColor" />
              </button>
              <small>Nhấn để nghe tiếng Trung</small>
            </div>

            {mode === 'choose' && (
              <>
                <h3>Nghe và chọn từ đúng</h3>
                <p className="hsk-prompt">Bạn nghe được từ tiếng Trung nào?</p>
                <div className="hsk-options">
                  {options.map((option) => (
                    <button
                      key={option.id}
                      className={answer === option.id ? (feedback?.ok ? 'correct' : 'incorrect') : ''}
                      disabled={!!feedback}
                      onClick={() => check(option.id)}
                    >
                      <b>{option.han}</b><span>{option.meaning}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {mode === 'write' && (
              <>
                <h3>Nghe và viết lại chữ Hán</h3>
                <p className="hsk-prompt">Nghe âm thanh, sau đó nhập chữ Hán bạn nghe được.</p>
                <input
                  className="hsk-write-input"
                  value={answer}
                  onChange={(event) => { setAnswer(event.target.value); setFeedback(null); }}
                  placeholder="Nhập chữ Hán..."
                  disabled={!!feedback?.ok}
                />
                <button className="primary-btn" disabled={!answer.trim() || !!feedback?.ok} onClick={() => check(answer)}>
                  Kiểm tra đáp án
                </button>
              </>
            )}

            {mode === 'shadow' && (
              <>
                <h3>Nghe và luyện nhại</h3>
                <p className="hsk-prompt">Nghe 2–3 lần, sau đó nhắc lại thành tiếng và chú ý thanh điệu.</p>
                <div className="hsk-shadow-reveal">
                  {showHint
                    ? <><strong>{item.han}</strong><span>{item.pin}</span><small>{item.meaning}</small></>
                    : <strong>••••</strong>}
                </div>
                <button className="secondary-btn" onClick={() => setShowHint((value) => !value)}>
                  {showHint ? 'Ẩn gợi ý' : 'Hiện chữ và pinyin'}
                </button>
                <button className="primary-btn" onClick={() => speak(item.han, 0.68)}>Nghe chậm</button>
              </>
            )}

            {feedback && (
              <div className={`hsk-feedback ${feedback.ok ? 'good' : 'bad'}`}>
                <b>{feedback.text}</b>
                <p>Đáp án: {item.han} · {item.pin} · {item.meaning}</p>
                {!feedback.ok && <button className="secondary-btn" onClick={retry}>Thử lại</button>}
              </div>
            )}

            <div className="hsk-listen-controls">
              <button className="secondary-btn" onClick={() => speak(item.han, 1)}>
                <Volume2 size={17} /> Nghe tốc độ thường
              </button>
              <button className="primary-btn" onClick={next}>
                Từ tiếp theo <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <aside className="hsk-listen-side">
          <h3>Danh sách từ trong bài</h3>
          {items.map((word, itemIndex) => (
            <button
              key={word.id}
              className={`hsk-queue-row ${itemIndex === index ? 'active' : ''}`}
              onClick={() => { setIndex(itemIndex); resetQuestion(); }}
            >
              <span>{itemIndex + 1}</span>
              <div><b>{word.han}</b><small>{word.pin}</small></div>
              <Volume2
                size={16}
                onClick={(event) => { event.stopPropagation(); speak(word.han); }}
              />
            </button>
          ))}
          <div className="hsk-source-note">
            Từ nghe được lấy từ danh sách từ vựng của từng bài trong dữ liệu giáo trình. Âm thanh là giọng đọc TTS, không phải bản thu âm gốc đi kèm sách.
          </div>
        </aside>
      </div>
    </>
  );
}
