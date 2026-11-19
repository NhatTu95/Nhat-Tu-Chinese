import React, { useEffect, useMemo, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { Search, Bookmark, Volume2, CheckCircle2, BookOpen, RotateCcw, Filter, ChevronRight, Play, Pause, PenLine, SkipBack, SkipForward, Eye } from 'lucide-react';

const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const isHan = (value) => /\p{Script=Han}/u.test(value);

function StrokePractice({ word, onSpeak }) {
  const hostRef = useRef(null);
  const writerRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [strokeCount, setStrokeCount] = useState(0);
  const [step, setStep] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Mở phần luyện viết để xem mẫu và thứ tự nét.');
  const [playing, setPlaying] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const chars = useMemo(() => Array.from(String(word?.han || '')).filter(isHan), [word?.han]);
  const currentChar = chars[charIndex] || '';

  useEffect(() => {
    if (!expanded || !hostRef.current || !currentChar) return undefined;
    let alive = true;
    setLoading(true); setError(''); setStrokeCount(0); setStep(-1); setPlaying(false); setQuizDone(false);
    hostRef.current.innerHTML = '';
    const writer = HanziWriter.create(hostRef.current, currentChar, {
      width: 220, height: 220, padding: 12, showOutline: true, showCharacter: true,
      strokeAnimationSpeed: 1, delayBetweenStrokes: 260, drawingWidth: 18,
      strokeColor: '#087f5b', radicalColor: '#087f5b', outlineColor: '#d7e5dc',
      drawingColor: '#087f5b', highlightColor: '#e8ad36',
      charDataLoader: (char, done) => {
        fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`)
          .then((res) => { if (!res.ok) throw new Error('missing'); return res.json(); })
          .then((data) => { if (alive) done(data); })
          .catch(() => { if (alive) { setError('Không tải được dữ liệu nét cho chữ này. Hãy kiểm tra Internet hoặc thử chữ khác.'); setLoading(false); } });
      },
      onLoadCharDataSuccess: (data) => {
        if (!alive) return;
        setStrokeCount(data?.strokes?.length || 0); setLoading(false);
        setMessage(`Chữ ${currentChar} có ${data?.strokes?.length || 0} nét. Nhấn Phát để xem cách viết.`);
      }
    });
    writerRef.current = writer;
    return () => { alive = false; try { writer.cancelAnimation(); writer.cancelQuiz(); } catch {} writerRef.current = null; };
  }, [expanded, currentChar]);

  const replay = () => {
    const writer = writerRef.current; if (!writer) return;
    writer.cancelQuiz(); writer.showCharacter(); setStep(-1); setQuizDone(false); setPlaying(true);
    setMessage('Đang phát hoạt ảnh thứ tự nét…');
    writer.animateCharacter({ onComplete: () => { setPlaying(false); setMessage('Đã viết xong! Bạn có thể phát lại hoặc tự luyện.'); } });
  };
  const pause = () => { try { writerRef.current?.pauseAnimation(); setPlaying(false); setMessage('Đã tạm dừng hoạt ảnh. Nhấn Tiếp tục để xem tiếp.'); } catch {} };
  const resume = () => { try { writerRef.current?.resumeAnimation(); setPlaying(true); setMessage('Đang tiếp tục hoạt ảnh…'); } catch {} };
  const showStep = (next) => {
    const writer = writerRef.current; if (!writer || !strokeCount) return;
    writer.cancelAnimation(); writer.cancelQuiz(); writer.showCharacter();
    const bounded = Math.max(0, Math.min(strokeCount - 1, next)); setStep(bounded); setPlaying(false);
    writer.animateStroke(bounded, { onComplete: () => setMessage(`Đang xem nét ${bounded + 1}/${strokeCount}.`) });
  };
  const practice = () => {
    const writer = writerRef.current; if (!writer) return;
    writer.cancelAnimation(); writer.showCharacter(); setQuizDone(false); setMessage('Hãy viết trực tiếp lên mẫu bằng chuột hoặc ngón tay.');
    writer.quiz({ onMistake: (s) => setMessage(`Chưa đúng nét ${s?.strokeNum ?? ''}. Hãy thử lại nhé.`), onCorrectStroke: (s) => setMessage(`Chính xác! Bạn đã viết đúng nét ${s?.strokeNum ?? ''}.`), onComplete: () => { setQuizDone(true); setMessage('Hoàn thành! Bạn đã viết đúng toàn bộ chữ này.'); } });
  };
  const nextChar = () => { if (charIndex < chars.length - 1) setCharIndex((v) => v + 1); };

  return <div className="stroke-inline">
    <button type="button" className="stroke-toggle" onClick={() => setExpanded((v) => !v)}>
      <PenLine size={16}/>{expanded ? 'Thu gọn luyện viết' : 'Xem mẫu & luyện viết từng nét'}<ChevronRight size={16} className={expanded ? 'stroke-chevron open' : 'stroke-chevron'}/>
    </button>
    {expanded && <div className="stroke-panel">
      <div className="stroke-heading"><div><b>LUYỆN VIẾT HÁN TỰ</b><small>{word.han} · {word.pin}</small></div><span>{chars.length > 1 ? `Chữ ${charIndex + 1}/${chars.length}` : 'Chữ mẫu'}</span></div>
      <div className="stroke-workspace"><div ref={hostRef} className="stroke-canvas"/><div className="stroke-meta"><strong>{currentChar}</strong><span>{strokeCount ? `${strokeCount} nét` : loading ? 'Đang tải…' : 'Chưa có dữ liệu'}</span><small>{word.meaning}</small></div></div>
      {loading && <p className="stroke-status">Đang tải dữ liệu thứ tự nét…</p>}
      {error && <p className="stroke-status error">{error}</p>}
      {!loading && !error && <>
        <div className="stroke-controls">
          <button type="button" onClick={replay} disabled={!strokeCount}><Play size={15}/> Phát lại</button>
          {playing ? <button type="button" onClick={pause}><Pause size={15}/> Tạm dừng</button> : <button type="button" onClick={resume} disabled={!strokeCount}><Play size={15}/> Tiếp tục</button>}
          <button type="button" onClick={() => showStep(step <= 0 ? 0 : step - 1)} disabled={!strokeCount}><SkipBack size={15}/> Nét trước</button>
          <button type="button" onClick={() => showStep(step < 0 ? 0 : step + 1)} disabled={!strokeCount || step >= strokeCount - 1}><SkipForward size={15}/> Nét tiếp</button>
          <button type="button" onClick={() => { writerRef.current?.showCharacter(); setStep(-1); setPlaying(false); }} disabled={!strokeCount}><Eye size={15}/> Hiện mẫu</button>
        </div>
        <div className="stroke-controls practice-controls">
          <button type="button" className="stroke-practice-btn" onClick={practice}><PenLine size={15}/> Tự viết & kiểm tra</button>
          {quizDone && <span className="stroke-success"><CheckCircle2 size={15}/> Đã viết đúng</span>}
          {chars.length > 1 && <button type="button" onClick={nextChar} disabled={charIndex >= chars.length - 1}>Chữ tiếp theo <ChevronRight size={15}/></button>}
        </div>
      </>}
      <p className="stroke-status" aria-live="polite">{message}</p>
      <small className="stroke-note">Dữ liệu thứ tự nét được tải trực tuyến từ Hanzi Writer. Cần kết nối Internet. Khi tự viết, dùng chuột hoặc chạm trực tiếp trên vùng chữ mẫu.</small>
    </div>}
  </div>;
}

export default function HSKVocabNotebook({ words = [], lessons = [], saved = [], onToggleSave, speak }) {
  const [tab, setTab] = useState('library');
  const [q, setQ] = useState('');
  const [lesson, setLesson] = useState('all');
  const [mastered, setMastered] = useState(() => load('ntc-hsk1-mastered', []));
  const [reviewIndex, setReviewIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const safeWords = Array.isArray(words) ? words : [];
  const safeSaved = Array.isArray(saved) ? saved : [];
  const list = useMemo(() => safeWords.filter((w) => (lesson === 'all' || String(w.lesson) === lesson) && (!q || [w.han, w.pin, w.meaning, w.type].some((x) => String(x || '').toLowerCase().includes(q.toLowerCase())))), [safeWords, lesson, q]);
  const shown = tab === 'saved' ? list.filter((w) => safeSaved.some((s) => s.han === w.han || s.id === w.id)) : list;
  const review = shown.filter((w) => !mastered.includes(w.id));
  const current = review.length ? review[reviewIndex % review.length] : null;
  const mark = (w) => { const next = mastered.includes(w.id) ? mastered.filter((x) => x !== w.id) : [...mastered, w.id]; setMastered(next); try { localStorage.setItem('ntc-hsk1-mastered', JSON.stringify(next)); } catch {} };
  const say = (text) => { if (speak) speak(text); else if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; u.rate = .82; window.speechSynthesis.speak(u); } };
  return <>
    <div className="page-intro"><div className="eyebrow"><BookOpen size={14}/> HỌC LIỆU GIÁO TRÌNH</div><h1>Sổ từ vựng HSK 1</h1><p>Tra cứu từ vựng, nghe phát âm, xem hoạt ảnh thứ tự nét và tự luyện viết chữ Hán.</p></div>
    <div className="hsk-vocab-stats"><div><small>TỔNG MỤC TỪ</small><b>{safeWords.length}</b></div><div><small>ĐÃ LƯU</small><b>{safeSaved.length}</b></div><div><small>ĐÃ ĐÁNH DẤU THUỘC</small><b>{mastered.length}</b></div><div><small>TIẾN ĐỘ</small><b>{Math.round(mastered.length / Math.max(safeWords.length, 1) * 100)}%</b></div></div>
    <div className="hsk-tabs"><button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>Kho từ HSK 1</button><button className={tab === 'saved' ? 'active' : ''} onClick={() => setTab('saved')}>Từ đã lưu ({safeSaved.length})</button><button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}>Ôn Flashcard</button></div>
    {tab !== 'review' ? <><div className="hsk-filters"><label className="search-box"><Search size={17}/><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm chữ Hán, pinyin, nghĩa..."/></label><label className="hsk-select"><Filter size={16}/><select value={lesson} onChange={(e) => setLesson(e.target.value)}><option value="all">Tất cả bài học</option>{lessons.map((l) => <option key={l.id} value={String(l.id)}>Bài {l.id} · {l.topic || l.title}</option>)}</select></label></div>
      <div className="hsk-word-grid">{shown.map((w) => <article className="hsk-word-card" key={w.id}><div className="hsk-word-top"><span className="tag">{w.category === 'core' ? `Bài ${w.lesson}` : w.category === 'proper' ? 'Tên riêng' : 'Bổ sung'}</span><button className={`icon-btn ${safeSaved.some((s) => s.han === w.han) ? 'bookmarked' : ''}`} onClick={() => onToggleSave?.(w)} title="Lưu từ"><Bookmark size={17}/></button></div><div className="hsk-word-han">{w.han}</div><div className="hsk-word-pin">{w.pin}<button onClick={() => say(w.han)} aria-label={`Nghe ${w.han}`}><Volume2 size={16}/></button></div><div className="hsk-word-meaning">{w.meaning}</div><div className="hsk-word-foot"><small>{w.type}</small><button className={mastered.includes(w.id) ? 'mastered' : ''} onClick={() => mark(w)}>{mastered.includes(w.id) ? <><CheckCircle2 size={14}/> Đã thuộc</> : 'Đánh dấu đã thuộc'}</button></div><StrokePractice word={w}/></article>)}{shown.length === 0 && <div className="empty-card"><div>📖</div><b>{tab === 'saved' ? 'Bạn chưa lưu từ nào' : 'Không tìm thấy từ phù hợp'}</b><p>Thử đổi từ khóa hoặc chọn bài học khác.</p></div>}</div>
    </> : <div className="hsk-review-wrap">{current ? <><div className="hsk-review-count">Còn {review.length} từ cần ôn · Tiến độ đã thuộc {mastered.length}/{safeWords.length}</div><button className="hsk-flashcard" onClick={() => setFlipped(!flipped)}><small>{flipped ? 'NGHĨA TIẾNG VIỆT' : 'CHỮ HÁN'}</small><strong>{flipped ? current.meaning : current.han}</strong><span>{flipped ? current.pin : 'Chạm để lật thẻ'}</span><em>Bài {current.lesson}</em></button><div className="hsk-review-actions"><button className="secondary-btn" onClick={() => say(current.han)}><Volume2 size={17}/> Nghe</button><button className="secondary-btn" onClick={() => setFlipped(false)}><PenLine size={17}/> Luyện viết trong kho từ</button><button className="secondary-btn" onClick={() => { setFlipped(false); setReviewIndex((reviewIndex + 1) % review.length); }}><RotateCcw size={17}/> Ôn lại sau</button><button className="primary-btn" onClick={() => { mark(current); setFlipped(false); setReviewIndex(0); }}><CheckCircle2 size={17}/> Đã thuộc</button></div></> : <div className="empty-card"><div>🎉</div><b>Bạn đã đánh dấu thuộc toàn bộ từ đang lọc!</b><p>Chọn bộ lọc khác hoặc bỏ đánh dấu một số từ để ôn lại.</p></div>}</div>}
    <div className="hsk-source-note">Nguồn từ vựng: Giáo trình chuẩn HSK 1. Tiến độ học được lưu trên trình duyệt của thiết bị này.</div>
  </>;
}
