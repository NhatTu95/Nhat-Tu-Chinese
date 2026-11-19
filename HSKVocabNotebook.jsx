import React, { useMemo, useState } from 'react';
import {
  Search, Bookmark, Volume2, CheckCircle2, BookOpen,
  RotateCcw, Filter
} from 'lucide-react';

const STORAGE_KEY = 'ntc-hsk1-mastered';

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function categoryLabel(category) {
  const labels = {
    core: 'Từ chính',
    phrase: 'Cụm từ',
    related: 'Từ liên quan',
    supplementary: 'Từ bổ sung',
    proper: 'Tên riêng'
  };
  return labels[category] || 'Khác';
}

export default function HSKVocabNotebook({
  words = [],
  lessons = [],
  saved = [],
  onToggleSave,
  speak
}) {
  const [tab, setTab] = useState('library');
  const [query, setQuery] = useState('');
  const [lessonId, setLessonId] = useState('all');
  const [category, setCategory] = useState('all');
  const [mastered, setMastered] = useState(() => readStorage(STORAGE_KEY, []));
  const [reviewIndex, setReviewIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const safeWords = Array.isArray(words) ? words : [];
  const safeLessons = Array.isArray(lessons) ? lessons : [];
  const safeSaved = Array.isArray(saved) ? saved : [];
  const masteredSet = useMemo(() => new Set(mastered), [mastered]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return safeWords.filter((word) => {
      const matchesLesson = lessonId === 'all' || String(word.lesson) === lessonId;
      const matchesCategory = category === 'all' || word.category === category;
      const searchable = [
        word.han, word.pin, word.meaning, word.type, word.hanviet
      ].filter(Boolean).join(' ').toLocaleLowerCase();
      return matchesLesson && matchesCategory && (!q || searchable.includes(q));
    });
  }, [safeWords, query, lessonId, category]);

  const savedWords = useMemo(() => {
    const savedIds = new Set(safeSaved.map((item) => item.id).filter(Boolean));
    const savedHan = new Set(safeSaved.map((item) => item.han).filter(Boolean));
    return filtered.filter((word) => savedIds.has(word.id) || savedHan.has(word.han));
  }, [filtered, safeSaved]);

  const visibleWords = tab === 'saved' ? savedWords : filtered;
  const reviewWords = (tab === 'saved' ? savedWords : filtered)
    .filter((word) => !masteredSet.has(word.id));
  const current = reviewWords.length
    ? reviewWords[reviewIndex % reviewWords.length]
    : null;

  const speakText = (text) => {
    if (typeof speak === 'function') {
      speak(text);
      return;
    }
    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  };

  const toggleMastered = (word) => {
    setMastered((currentMastered) => {
      const next = currentMastered.includes(word.id)
        ? currentMastered.filter((id) => id !== word.id)
        : [...currentMastered, word.id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Keep the current session usable if browser storage is unavailable.
      }
      return next;
    });
  };

  const resetFilters = () => {
    setQuery('');
    setLessonId('all');
    setCategory('all');
  };

  const moveReview = (direction) => {
    if (!reviewWords.length) return;
    setReviewIndex((index) => (index + direction + reviewWords.length) % reviewWords.length);
    setFlipped(false);
  };

  const isSaved = (word) =>
    safeSaved.some((item) => item.id === word.id || item.han === word.han);

  return (
    <>
      <div className="page-intro">
        <div className="eyebrow"><BookOpen size={14} /> HỌC LIỆU GIÁO TRÌNH</div>
        <h1>Sổ từ vựng HSK 1</h1>
        <p>Tra cứu 205 mục từ theo bài học, phân loại, lưu từ và ôn tập bằng Flashcard.</p>
      </div>

      <div className="hsk-vocab-stats">
        <div><small>TỔNG MỤC TỪ</small><b>{safeWords.length}</b></div>
        <div><small>ĐÃ LƯU</small><b>{safeSaved.length}</b></div>
        <div><small>ĐÃ ĐÁNH DẤU THUỘC</small><b>{mastered.length}</b></div>
        <div><small>TIẾN ĐỘ TOÀN BỘ</small><b>{Math.round(mastered.length / Math.max(safeWords.length, 1) * 100)}%</b></div>
      </div>

      <div className="hsk-tabs">
        <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>Kho từ HSK 1</button>
        <button className={tab === 'saved' ? 'active' : ''} onClick={() => setTab('saved')}>Từ đã lưu ({safeSaved.length})</button>
        <button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}>Ôn Flashcard</button>
      </div>

      {tab !== 'review' ? (
        <>
          <div className="hsk-filters">
            <label className="search-box">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm chữ Hán, pinyin, nghĩa..."
              />
            </label>
            <label className="hsk-select">
              <Filter size={16} />
              <select value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
                <option value="all">Tất cả bài học</option>
                {safeLessons.map((lesson) => (
                  <option key={lesson.id} value={String(lesson.id)}>
                    Bài {lesson.id} · {lesson.topic || lesson.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="hsk-select">
              <Filter size={16} />
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">Tất cả nhóm từ</option>
                <option value="core">Từ chính</option>
                <option value="phrase">Cụm từ</option>
                <option value="related">Từ liên quan</option>
                <option value="supplementary">Từ bổ sung</option>
                <option value="proper">Tên riêng</option>
              </select>
            </label>
          </div>

          <div className="hsk-word-grid">
            {visibleWords.map((word) => (
              <article className="hsk-word-card" key={word.id}>
                <div className="hsk-word-top">
                  <span className="tag">
                    {word.category === 'core' ? `Bài ${word.lesson}` : categoryLabel(word.category)}
                  </span>
                  <button
                    className={`icon-btn ${isSaved(word) ? 'bookmarked' : ''}`}
                    onClick={() => onToggleSave?.(word)}
                    title={isSaved(word) ? 'Bỏ lưu từ' : 'Lưu từ'}
                    aria-label={isSaved(word) ? 'Bỏ lưu từ' : 'Lưu từ'}
                  >
                    <Bookmark size={17} />
                  </button>
                </div>
                <div className="hsk-word-han">{word.han}</div>
                <div className="hsk-word-pin">
                  {word.pin}
                  <button onClick={() => speakText(word.han)} aria-label={`Nghe ${word.han}`}>
                    <Volume2 size={16} />
                  </button>
                </div>
                <div className="hsk-word-meaning">{word.meaning}</div>
                <div className="hsk-word-foot">
                  <small>{word.type}</small>
                  <button
                    className={masteredSet.has(word.id) ? 'mastered' : ''}
                    onClick={() => toggleMastered(word)}
                  >
                    {masteredSet.has(word.id)
                      ? <><CheckCircle2 size={14} /> Đã thuộc</>
                      : 'Đánh dấu đã thuộc'}
                  </button>
                </div>
              </article>
            ))}
            {visibleWords.length === 0 && (
              <div className="empty-card">
                <div>📖</div>
                <b>{tab === 'saved' ? 'Không có từ đã lưu phù hợp' : 'Không tìm thấy từ phù hợp'}</b>
                <p>Thử đổi từ khóa, bài học hoặc nhóm từ.</p>
                <button className="secondary-btn" onClick={resetFilters}>Xóa bộ lọc</button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="hsk-review-wrap">
          {current ? (
            <>
              <div className="hsk-review-count">
                Còn {reviewWords.length} từ cần ôn · Đã thuộc {mastered.length}/{safeWords.length}
              </div>
              <button className="hsk-flashcard" onClick={() => setFlipped((value) => !value)}>
                <small>{flipped ? 'NGHĨA TIẾNG VIỆT' : 'CHỮ HÁN'}</small>
                <strong>{flipped ? current.meaning : current.han}</strong>
                <span>{flipped ? current.pin : 'Chạm để lật thẻ'}</span>
                <em>Bài {current.lesson} · {categoryLabel(current.category)}</em>
              </button>
              <div className="hsk-review-actions">
                <button className="secondary-btn" onClick={() => speakText(current.han)}>
                  <Volume2 size={17} /> Nghe
                </button>
                <button className="secondary-btn" onClick={() => moveReview(1)}>
                  <RotateCcw size={17} /> Ôn lại sau
                </button>
                <button className="primary-btn" onClick={() => { toggleMastered(current); moveReview(1); }}>
                  <CheckCircle2 size={17} /> Đã thuộc
                </button>
              </div>
            </>
          ) : (
            <div className="empty-card">
              <div>🎉</div>
              <b>Bạn đã thuộc toàn bộ từ trong phạm vi đang chọn!</b>
              <p>Hãy đổi bộ lọc hoặc bỏ đánh dấu một số từ để ôn lại.</p>
            </div>
          )}
        </div>
      )}

      <div className="hsk-source-note">
        Nguồn: bảng “Từ mới” và “Từ bổ sung” của Giáo trình chuẩn HSK 1. Tiến độ học được lưu trên trình duyệt của thiết bị này.
      </div>
    </>
  );
}
