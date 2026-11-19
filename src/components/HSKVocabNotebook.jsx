import React, { useEffect, useMemo, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { Search, Bookmark, Volume2, CheckCircle2, BookOpen, RotateCcw, Filter, ChevronRight, Play, Pause, PenLine, SkipBack, SkipForward, Eye } from 'lucide-react';

const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const isHan = (value) => /\p{Script=Han}/u.test(value);

const RADICALS = {
  '打':['扌','手','Thủ','tay; hành động bằng tay'], '电':['田','Điền','ruộng; thành phần giản hóa của 電'], '话':['讠','言','Ngôn','lời nói; ngôn ngữ'],
  '你':['亻','人','Nhân','người'], '他':['亻','人','Nhân','người'], '们':['亻','人','Nhân','người'], '做':['亻','人','Nhân','người'],
  '好':['女','女','Nữ','phụ nữ'], '妈':['女','女','Nữ','phụ nữ'], '姐':['女','女','Nữ','phụ nữ'], '她':['女','女','Nữ','phụ nữ'],
  '我':['戈','戈','Qua','vũ khí qua'], '是':['日','日','Nhật','mặt trời; ngày'], '明':['日','日','Nhật','mặt trời'], '时':['日','日','Nhật','thời gian'],
  '不':['一','一','Nhất','nét ngang'], '一':['一','一','Nhất','một'], '三':['一','一','Nhất','một'], '二':['二','二','Nhị','hai'],
  '中':['丨','丨','Cổn','nét sổ'], '国':['囗','囗','Vi','khung bao'], '回':['囗','囗','Vi','khung bao'], '四':['囗','囗','Vi','khung bao'],
  '水':['水','水','Thủy','nước'], '没':['氵','水','Thủy','nước'], '河':['氵','水','Thủy','nước'], '喝':['口','口','Khẩu','miệng'],
  '吃':['口','口','Khẩu','miệng'], '吗':['口','口','Khẩu','miệng'], '叫':['口','口','Khẩu','miệng'], '听':['口','口','Khẩu','miệng'],
  '看':['目','目','Mục','mắt'], '见':['见','見','Kiến','nhìn thấy'], '眼':['目','目','Mục','mắt'],
  '学':['子','子','Tử','con; học tập'], '生':['生','生','Sinh','sinh ra; sự sống'], '字':['子','子','Tử','con; chữ'], '家':['宀','宀','Miên','mái nhà'], '客':['宀','宀','Miên','mái nhà'],
  '安':['宀','宀','Miên','mái nhà'], '有':['月','月','Nguyệt','trăng; phần thịt trong một số chữ'], '月':['月','月','Nguyệt','mặt trăng'],
  '木':['木','木','Mộc','cây; gỗ'], '本':['木','木','Mộc','cây; gỗ'], '林':['木','木','Mộc','cây; gỗ'], '来':['木','木','Mộc','thành phần chữ'],
  '人':['人','人','Nhân','người'], '个':['人','人','Nhân','người'], '今':['人','人','Nhân','thành phần chữ'], '会':['人','人','Nhân','người'],
  '女':['女','女','Nữ','phụ nữ'], '子':['子','子','Tử','con'], '儿':['儿','儿','Nhi','trẻ nhỏ'], '男':['田','田','Điền','ruộng'],
  '买':['乙','乙','Ất','nét móc'], '卖':['十','十','Thập','mười'], '钱':['钅','金','Kim','kim loại'], '饭':['饣','食','Thực','ăn uống'],
  '茶':['艹','艸','Thảo','cỏ; thực vật'], '花':['艹','艸','Thảo','cỏ; thực vật'], '菜':['艹','艸','Thảo','cỏ; thực vật'],
  '书':['乙','乙','Ất','nét móc'], '写':['冖','冖','Mịch','che phủ'], '读':['讠','言','Ngôn','lời nói'], '请':['讠','言','Ngôn','lời nói'],
  '爱':['爫','爪','Trảo','móng vuốt; bàn tay'], '想':['心','心','Tâm','trái tim; tâm trí'], '忙':['忄','心','Tâm','trái tim; tâm trí'],
  '大':['大','大','Đại','to lớn'], '太':['大','大','Đại','to lớn'], '天':['大','大','Đại','to lớn'], '小':['小','小','Tiểu','nhỏ'],
  '多':['夕','夕','Tịch','buổi tối'], '少':['小','小','Tiểu','nhỏ'], '高':['高','高','Cao','cao'], '上':['一','一','Nhất','nét ngang'], '下':['一','一','Nhất','nét ngang'],
  '开':['廾','廾','Củng','hai tay nâng'], '门':['门','門','Môn','cửa'], '问':['门','門','Môn','cửa'], '间':['门','門','Môn','cửa'],
  '车':['车','車','Xa','xe'], '东':['一','一','Nhất','nét ngang'], '西':['覀','襾','Á','che phủ'], '北':['匕','匕','Chủy','cái thìa'],
  '雨':['雨','雨','Vũ','mưa'], '风':['风','風','Phong','gió'], '气':['气','气','Khí','khí'], '云':['二','二','Nhị','hai'],
};

const PINYIN_SYLLABLES = new Set(('a ai an ang ao e ei en eng er o ou ba bai ban bang bao bei ben beng bi bian biao bie bin bing bo bu pa pai pan pang pao pei pen peng pi pian piao pie pin ping po pu ma mai man mang mao me mei men meng mi mian miao mie min ming miu mo mou mu fa fan fang fei fen feng fo fou fu da dai dan dang dao de dei den deng di dia dian diao die ding diu dong dou du duan dui dun duo ta tai tan tang tao te teng ti tian tiao tie ting tong tou tu tuan tui tun tuo na nai nan nang nao ne nei nen neng ni nian niang niao nie nin ning niu nong nou nu nuan nuo nü nüe la lai lan lang lao le lei leng li lia lian liang liao lie lin ling liu long lou lu luan lun luo lü lüe ga gai gan gang gao ge gei gen geng gong gou gu gua guai guan guang gui gun guo ka kai kan kang kao ke ken keng kong kou ku kua kuai kuan kuang kui kun kuo ha hai han hang hao he hei hen heng hong hou hu hua huai huan huang hui hun huo ji jia jian jiang jiao jie jin jing jiong jiu ju juan jue jun qi qia qian qiang qiao qie qin qing qiong qiu qu quan que qun xi xia xian xiang xiao xie xin xing xiong xiu xu xuan xue xun zha zhai zhan zhang zhao zhe zhei zhen zheng zhi zhong zhou zhu zhua zhuai zhuan zhuang zhui zhun zhuo cha chai chan chang chao che chen cheng chi chong chou chu chua chuai chuan chuang chui chun chuo sha shai shan shang shao she shei shen sheng shi shou shu shua shuai shuan shuang shui shun shuo re ren reng ri rong rou ru rua ruan rui run ruo za zai zan zang zao ze zei zen zeng zi zong zou zu zuan zui zun zuo ca cai can cang cao ce cen ceng ci cong cou cu cuan cui cun cuo sa sai san sang sao se sen seng si song sou su suan sui sun suo ya yan yang yao ye yi yin ying yo yong you yu yuan yue yun wa wai wan wang wei wen weng wo wu yue yun').split(' '));
const PINYIN_PLAIN = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ü/g, 'v');
function splitPinyinToken(token) {
  const original = String(token || '');
  const plain = PINYIN_PLAIN(original);
  const memo = new Map();
  const solve = (i) => {
    if (i === plain.length) return [];
    if (memo.has(i)) return memo.get(i);
    // Longest-first segmentation handles common syllables such as dian-hua and ke-qi.
    for (let j = Math.min(plain.length, i + 6); j > i; j--) {
      const part = plain.slice(i, j);
      if (PINYIN_SYLLABLES.has(part)) {
        const rest = solve(j);
        if (rest) { const result = [original.slice(i, j), ...rest]; memo.set(i, result); return result; }
      }
    }
    memo.set(i, null); return null;
  };
  return solve(0) || [original];
}
function getCharacterReading(word, index, characterCount) {
  const tokens = String(word?.pin || '').trim().split(/\s+/).filter(Boolean);
  const syllables = tokens.flatMap(splitPinyinToken);
  if (syllables.length === characterCount) return syllables[index] || '';
  if (tokens.length === characterCount) return tokens[index] || '';
  return '';
}

function StrokePractice({ word }) {
  const hostRef = useRef(null);
  const writerRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [strokeCount, setStrokeCount] = useState(0);
  const [step, setStep] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Mở thẻ để xem bộ thủ và luyện viết.');
  const [playing, setPlaying] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const chars = useMemo(() => Array.from(String(word?.han || '')).filter(isHan), [word?.han]);
  const currentChar = chars[charIndex] || '';
  const radical = RADICALS[currentChar];
  const currentReading = getCharacterReading(word, charIndex, chars.length);

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
          .catch(() => { if (alive) { setError('Không tải được dữ liệu nét. Vui lòng kiểm tra kết nối Internet.'); setLoading(false); } });
      },
      onLoadCharDataSuccess: (data) => {
        if (!alive) return;
        setStrokeCount(data?.strokes?.length || 0); setLoading(false);
        setMessage(`Chữ ${currentChar} có ${data?.strokes?.length || 0} nét. Chọn Phát lại để xem thứ tự viết.`);
      }
    });
    writerRef.current = writer;
    return () => { alive = false; try { writer.cancelAnimation(); writer.cancelQuiz(); } catch {} writerRef.current = null; };
  }, [expanded, currentChar]);

  const replay = () => { const w = writerRef.current; if (!w) return; w.cancelQuiz(); w.showCharacter(); setStep(-1); setQuizDone(false); setPlaying(true); setMessage('Đang phát hoạt ảnh…'); w.animateCharacter({ onComplete: () => { setPlaying(false); setMessage('Đã viết xong chữ mẫu.'); } }); };
  const pause = () => { try { writerRef.current?.pauseAnimation(); setPlaying(false); setMessage('Đã tạm dừng.'); } catch {} };
  const resume = () => { try { writerRef.current?.resumeAnimation(); setPlaying(true); setMessage('Đang tiếp tục…'); } catch {} };
  const showStep = (next) => { const w = writerRef.current; if (!w || !strokeCount) return; w.cancelAnimation(); w.cancelQuiz(); w.showCharacter(); const n = Math.max(0, Math.min(strokeCount - 1, next)); setStep(n); setPlaying(false); w.animateStroke(n, { onComplete: () => setMessage(`Nét ${n + 1}/${strokeCount}.`) }); };
  const practice = () => { const w = writerRef.current; if (!w) return; w.cancelAnimation(); w.showCharacter(); setQuizDone(false); setMessage('Hãy viết trực tiếp lên khung chữ bằng ngón tay hoặc chuột.'); w.quiz({ onMistake: (s) => setMessage(`Chưa đúng nét ${s?.strokeNum ?? ''}. Hãy thử lại.`), onCorrectStroke: (s) => setMessage(`Chính xác nét ${s?.strokeNum ?? ''}!`), onComplete: () => { setQuizDone(true); setMessage('Hoàn thành! Bạn đã viết đúng chữ này.'); } }); };
  const changeChar = (delta) => { setCharIndex((v) => Math.max(0, Math.min(chars.length - 1, v + delta))); setMessage('Đang chuyển chữ…'); };

  return <section className="radical-stroke-card">
    <button type="button" className="radical-stroke-toggle" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
      <span><PenLine size={17}/><b>{expanded ? 'Thu gọn học bộ thủ & luyện viết' : 'Học bộ thủ & luyện viết'}</b></span>
      <ChevronRight size={18} className={expanded ? 'radical-chevron open' : 'radical-chevron'}/>
    </button>
    {expanded && <div className="radical-stroke-content">
      <div className="radical-section-title"><span>01</span><b>PHÂN TÍCH BỘ THỦ</b><small>{chars.length > 1 ? `Chữ ${charIndex + 1}/${chars.length}` : 'Cấu tạo chữ'}</small></div>
      <div className="radical-info-grid">
        <div className="radical-character"><strong>{currentChar}</strong><small>{currentReading || 'Chưa tách được Pinyin riêng'}</small></div>
        <div className="radical-detail">
          {radical ? <><div className="radical-symbol">{radical[0]}</div><div className="radical-name-wrap"><small className="radical-name-label">TÊN BỘ THỦ</small><b>Bộ {radical[2]}</b>{currentReading && <small className="radical-character-reading">Đọc: {currentReading}</small>}</div></> : <><div className="radical-symbol muted">?</div><div><b>Chưa có dữ liệu bộ thủ</b>{currentReading && <small>Đọc: {currentReading}</small>}<small>Chữ này vẫn có thể xem hoạt ảnh thứ tự nét bên dưới.</small></div></>}
        </div>
      </div>
      <div className="radical-divider"/>
      <div className="radical-section-title"><span>02</span><b>HOẠT ẢNH & LUYỆN VIẾT</b><small>{strokeCount ? `${strokeCount} nét` : loading ? 'Đang tải' : 'Thứ tự nét'}</small></div>
      <div className="radical-practice-layout">
        <div className="stroke-canvas-wrap"><div ref={hostRef} className="stroke-canvas"/><small>Chữ mẫu · viết theo thứ tự nét</small></div>
        <div className="radical-practice-side">
          <strong className="radical-current-char">{currentChar}</strong>
          <b>{strokeCount ? `${strokeCount} nét` : loading ? 'Đang tải dữ liệu…' : 'Chữ Hán mẫu'}</b>
          <small>{word.meaning}</small>
          <button type="button" className="radical-main-action" onClick={practice} disabled={!strokeCount}><PenLine size={15}/> Tự viết & kiểm tra</button>
          {quizDone && <span className="stroke-success"><CheckCircle2 size={15}/> Hoàn thành</span>}
        </div>
      </div>
      {loading && <p className="stroke-status">Đang tải dữ liệu thứ tự nét…</p>}
      {error && <p className="stroke-status error">{error}</p>}
      {!loading && !error && <div className="radical-controls">
        <button type="button" onClick={replay} disabled={!strokeCount}><Play size={15}/> Phát lại</button>
        {playing ? <button type="button" onClick={pause}><Pause size={15}/> Tạm dừng</button> : <button type="button" onClick={resume} disabled={!strokeCount}><Play size={15}/> Tiếp tục</button>}
        <button type="button" onClick={() => showStep(step <= 0 ? 0 : step - 1)} disabled={!strokeCount}><SkipBack size={15}/> Nét trước</button>
        <button type="button" onClick={() => showStep(step < 0 ? 0 : step + 1)} disabled={!strokeCount || step >= strokeCount - 1}><SkipForward size={15}/> Nét tiếp</button>
        <button type="button" onClick={() => { writerRef.current?.showCharacter(); setStep(-1); setPlaying(false); }} disabled={!strokeCount}><Eye size={15}/> Hiện mẫu</button>
      </div>}
      <p className="stroke-status" aria-live="polite">{message}</p>
      {chars.length > 1 && <div className="radical-char-navigation"><button type="button" onClick={() => changeChar(-1)} disabled={charIndex === 0}><SkipBack size={15}/> Chữ trước</button><span>{charIndex + 1} / {chars.length}</span><button type="button" onClick={() => changeChar(1)} disabled={charIndex >= chars.length - 1}>Chữ tiếp theo <SkipForward size={15}/></button></div>}
      <small className="stroke-note">Dữ liệu hoạt ảnh được tải trực tuyến từ Hanzi Writer; cần kết nối Internet. Bộ thủ hiển thị theo dữ liệu có sẵn trong bảng tra cứu.</small>
    </div>}
  </section>;
}

export default function HSKVocabNotebook({ words = [], lessons = [], saved = [], onToggleSave, speak }) {
  const [tab, setTab] = useState('library');
  const [q, setQ] = useState('');
  const [lesson, setLesson] = useState('all');
  const [mastered, setMastered] = useState(() => load('ntc-hsk1-mastered', []));
  const [reviewIndex, setReviewIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [wordPage, setWordPage] = useState(0);
  const [pageSize, setPageSize] = useState(2);
  const safeWords = Array.isArray(words) ? words : [];
  const safeSaved = Array.isArray(saved) ? saved : [];
  const list = useMemo(() => safeWords.filter((w) => (lesson === 'all' || String(w.lesson) === lesson) && (!q || [w.han, w.pin, w.meaning, w.type].some((x) => String(x || '').toLowerCase().includes(q.toLowerCase())))), [safeWords, lesson, q]);
  const shown = tab === 'saved' ? list.filter((w) => safeSaved.some((s) => s.han === w.han || s.id === w.id)) : list;
  const review = shown.filter((w) => !mastered.includes(w.id));
  const current = review.length ? review[reviewIndex % review.length] : null;
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
  const pageWords = shown.slice(wordPage * pageSize, (wordPage + 1) * pageSize);
  const changeFilter = (setter) => (value) => { setter(value); setWordPage(0); };
  const mark = (w) => { const next = mastered.includes(w.id) ? mastered.filter((x) => x !== w.id) : [...mastered, w.id]; setMastered(next); try { localStorage.setItem('ntc-hsk1-mastered', JSON.stringify(next)); } catch {} };
  const say = (text) => { if (speak) speak(text); else if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; u.rate = .82; window.speechSynthesis.speak(u); } };
  return <>
    <div className="page-intro"><div className="eyebrow"><BookOpen size={14}/> HỌC LIỆU GIÁO TRÌNH</div><h1>Sổ từ vựng HSK 1</h1><p>Tra cứu từ vựng, nghe phát âm, xem hoạt ảnh thứ tự nét và tự luyện viết chữ Hán.</p></div>
    <div className="hsk-vocab-stats"><div><small>TỔNG MỤC TỪ</small><b>{safeWords.length}</b></div><div><small>ĐÃ LƯU</small><b>{safeSaved.length}</b></div><div><small>ĐÃ ĐÁNH DẤU THUỘC</small><b>{mastered.length}</b></div><div><small>TIẾN ĐỘ</small><b>{Math.round(mastered.length / Math.max(safeWords.length, 1) * 100)}%</b></div></div>
    <div className="hsk-tabs"><button className={tab === 'library' ? 'active' : ''} onClick={() => { setTab('library'); setWordPage(0); }}>Kho từ HSK 1</button><button className={tab === 'saved' ? 'active' : ''} onClick={() => { setTab('saved'); setWordPage(0); }}>Từ đã lưu ({safeSaved.length})</button><button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}>Ôn Flashcard</button></div>
    {tab !== 'review' ? <><div className="hsk-filters"><label className="search-box"><Search size={17}/><input value={q} onChange={(e) => changeFilter(setQ)(e.target.value)} placeholder="Tìm chữ Hán, pinyin, nghĩa..."/></label><label className="hsk-select"><Filter size={16}/><select value={lesson} onChange={(e) => changeFilter(setLesson)(e.target.value)}><option value="all">Tất cả bài học</option>{lessons.map((l) => <option key={l.id} value={String(l.id)}>Bài {l.id} · {l.topic || l.title}</option>)}</select></label></div>
      <div className="hsk-word-page-tools"><label>Hiển thị <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setWordPage(0); }}><option value={2}>2 từ / lượt</option><option value={3}>3 từ / lượt</option></select></label><span>{shown.length ? `${wordPage * pageSize + 1}–${Math.min((wordPage + 1) * pageSize, shown.length)} / ${shown.length} từ` : '0 từ'}</span></div>
      <div className="hsk-word-grid">{pageWords.map((w) => <article className="hsk-word-card" key={w.id}><div className="hsk-word-top"><span className="tag">{w.category === 'core' ? `Bài ${w.lesson}` : w.category === 'proper' ? 'Tên riêng' : 'Bổ sung'}</span><button className={`icon-btn ${safeSaved.some((s) => s.han === w.han) ? 'bookmarked' : ''}`} onClick={() => onToggleSave?.(w)} title="Lưu từ"><Bookmark size={17}/></button></div><div className="hsk-word-han">{w.han}</div><div className="hsk-word-pin">{w.pin}<button onClick={() => say(w.han)} aria-label={`Nghe ${w.han}`}><Volume2 size={16}/></button></div><div className="hsk-word-meaning">{w.meaning}</div><div className="hsk-word-foot"><small>{w.type}</small><button className={mastered.includes(w.id) ? 'mastered' : ''} onClick={() => mark(w)}>{mastered.includes(w.id) ? <><CheckCircle2 size={14}/> Đã thuộc</> : 'Đánh dấu đã thuộc'}</button></div><StrokePractice word={w}/></article>)}{shown.length === 0 && <div className="empty-card"><div>📖</div><b>{tab === 'saved' ? 'Bạn chưa lưu từ nào' : 'Không tìm thấy từ phù hợp'}</b><p>Thử đổi từ khóa hoặc chọn bài học khác.</p></div>}</div>{shown.length > pageSize && <div className="hsk-word-pagination"><button type="button" className="secondary-btn" onClick={() => setWordPage((v) => Math.max(0, v - 1))} disabled={wordPage === 0}><SkipBack size={15}/> Trở về</button><b>Trang {wordPage + 1}/{pageCount}</b><button type="button" className="primary-btn" onClick={() => setWordPage((v) => Math.min(pageCount - 1, v + 1))} disabled={wordPage >= pageCount - 1}>Tiếp theo <SkipForward size={15}/></button></div>}
    </> : <div className="hsk-review-wrap">{current ? <><div className="hsk-review-count">Còn {review.length} từ cần ôn · Tiến độ đã thuộc {mastered.length}/{safeWords.length}</div><button className="hsk-flashcard" onClick={() => setFlipped(!flipped)}><small>{flipped ? 'NGHĨA TIẾNG VIỆT' : 'CHỮ HÁN'}</small><strong>{flipped ? current.meaning : current.han}</strong><span>{flipped ? current.pin : 'Chạm để lật thẻ'}</span><em>Bài {current.lesson}</em></button><div className="hsk-review-actions"><button className="secondary-btn" onClick={() => say(current.han)}><Volume2 size={17}/> Nghe</button><button className="secondary-btn" onClick={() => setFlipped(false)}><PenLine size={17}/> Luyện viết trong kho từ</button><button className="secondary-btn" onClick={() => { setFlipped(false); setReviewIndex((reviewIndex + 1) % review.length); }}><RotateCcw size={17}/> Ôn lại sau</button><button className="primary-btn" onClick={() => { mark(current); setFlipped(false); setReviewIndex(0); }}><CheckCircle2 size={17}/> Đã thuộc</button></div></> : <div className="empty-card"><div>🎉</div><b>Bạn đã đánh dấu thuộc toàn bộ từ đang lọc!</b><p>Chọn bộ lọc khác hoặc bỏ đánh dấu một số từ để ôn lại.</p></div>}</div>}
    <div className="hsk-source-note">Nguồn từ vựng: Giáo trình chuẩn HSK 1. Tiến độ học được lưu trên trình duyệt của thiết bị này.</div>
  </>;
}
