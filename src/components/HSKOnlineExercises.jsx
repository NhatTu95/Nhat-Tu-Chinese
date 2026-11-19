import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ClipboardList, Clock3, RotateCcw, Trophy, Volume2, ChevronLeft, ChevronRight, Lightbulb, History, XCircle } from 'lucide-react';

const STORAGE_KEY = 'nhattu-hsk1-exercise-history-v1';
const SENTENCES = [
  { vi:'Xin chào, bạn khỏe không?', han:'你好，你好吗？', pin:'Nǐ hǎo, nǐ hǎo ma？', options:['你好，你好吗？','再见，明天见。','谢谢你。'] },
  { vi:'Tôi là học sinh.', han:'我是学生。', pin:'Wǒ shì xuésheng.', options:['我是老师。','我是学生。','他是医生。'] },
  { vi:'Nhà tôi có ba người.', han:'我家有三个人。', pin:'Wǒ jiā yǒu sān ge rén.', options:['我家有三个人。','我有三个朋友。','他家有四个人。'] },
  { vi:'Hôm nay tôi đi học.', han:'今天我去上学。', pin:'Jīntiān wǒ qù shàngxué.', options:['明天我去中国。','今天我去上学。','今天我不工作。'] },
  { vi:'Bạn thích uống trà không?', han:'你喜欢喝茶吗？', pin:'Nǐ xǐhuan hē chá ma?', options:['你喜欢喝茶吗？','你想吃米饭吗？','你去哪儿？'] },
  { vi:'Cô ấy là giáo viên tiếng Trung.', han:'她是中文老师。', pin:'Tā shì Zhōngwén lǎoshī.', options:['她是中国学生。','她是中文老师。','他是我的朋友。'] },
  { vi:'Ngày mai gặp lại.', han:'明天见。', pin:'Míngtiān jiàn.', options:['昨天见。','明天见。','再说一次。'] },
  { vi:'Cảm ơn bạn.', han:'谢谢你。', pin:'Xièxie nǐ.', options:['对不起。','不客气。','谢谢你。'] },
];

function readHistory() {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function normalize(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, ''); }
function makeQuestions(words, lesson, mode, count) {
  const pool = words.filter(w => lesson === 'all' || Number(w.lesson) === Number(lesson));
  const source = pool.length ? pool : words;
  const questions = [];
  const addChoice = (word, kind) => {
    const others = shuffle(source.filter(w => w.id !== word.id));
    let prompt, answer, options, label;
    if (kind === 'meaning') { prompt = word.han; answer = word.meaning; options = [word.meaning, ...others.slice(0,3).map(w=>w.meaning)]; label = 'Chọn nghĩa tiếng Việt'; }
    else if (kind === 'han') { prompt = word.meaning; answer = word.han; options = [word.han, ...others.slice(0,3).map(w=>w.han)]; label = 'Chọn Hán tự đúng'; }
    else { prompt = word.han; answer = word.pin; options = [word.pin, ...others.slice(0,3).map(w=>w.pin)]; label = 'Chọn phiên âm Pinyin'; }
    return { id:`${word.id}-${kind}`, type:'choice', kind, prompt, answer, options:shuffle([...new Set(options)]), label, explanation:`${word.han} · ${word.pin} · ${word.meaning}` };
  };
  const kinds = mode === 'mixed' ? ['meaning','han','pinyin','write'] : [mode];
  const sentenceMode = mode === 'translate';
  if (sentenceMode) {
    return shuffle(SENTENCES).slice(0, Math.min(count, SENTENCES.length)).map((s,i)=>({id:`sentence-${i}`,type:'choice',kind:'translate',prompt:s.vi,answer:s.han,options:shuffle(s.options),label:'Chọn câu tiếng Trung tương ứng',explanation:`${s.han} · ${s.pin}`}));
  }
  const shuffled = shuffle(source);
  let i = 0;
  while (questions.length < count && i < count * 5) {
    const word = shuffled[i % shuffled.length]; const kind = kinds[questions.length % kinds.length];
    if (kind === 'write' || kind === 'pinyin-write') questions.push({id:`${word.id}-write`,type:'input',kind:kind==='pinyin-write'?'pinyin':'write',prompt:kind==='pinyin-write'?word.han:word.meaning,answer:kind==='pinyin-write'?word.pin:word.han,label:kind==='pinyin-write'?'Viết Pinyin có dấu thanh':'Viết Hán tự tương ứng',explanation:`${word.han} · ${word.pin}`});
    else questions.push(addChoice(word, kind === 'hanzi' ? 'han' : kind));
    i++;
  }
  return questions.slice(0,count);
}

export default function HSKOnlineExercises({ words = [], lessons = [] }) {
  const [history,setHistory] = useState(readHistory);
  const [lesson,setLesson] = useState('all');
  const [mode,setMode] = useState('mixed');
  const [count,setCount] = useState(20);
  const [questions,setQuestions] = useState([]);
  const [answers,setAnswers] = useState({});
  const [index,setIndex] = useState(0);
  const [submitted,setSubmitted] = useState(false);
  const [startedAt,setStartedAt] = useState(0);
  const [showHistory,setShowHistory] = useState(false);

  useEffect(()=>{ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch {} },[history]);
  const current = questions[index];
  const answered = Object.keys(answers).length;
  const score = useMemo(()=>questions.reduce((sum,q)=>sum+(normalize(answers[q.id])===normalize(q.answer)?1:0),0),[questions,answers]);
  const start = () => {
    const next = makeQuestions(words,lesson,mode,Number(count));
    setQuestions(next); setAnswers({}); setIndex(0); setSubmitted(false); setStartedAt(Date.now());
  };
  const submit = () => {
    if (!questions.length || submitted) return;
    const points = questions.reduce((sum,q)=>sum+(normalize(answers[q.id])===normalize(q.answer)?1:0),0);
    const record = { id:Date.now(), date:new Date().toLocaleString('vi-VN'), lesson:lesson==='all'?'Tất cả bài':`Bài ${lesson}`, mode, total:questions.length, correct:points, percent:Math.round(points/questions.length*100), seconds:Math.max(0,Math.round((Date.now()-startedAt)/1000)) };
    setHistory(prev=>[record,...prev].slice(0,30)); setSubmitted(true);
  };
  const reset = () => { setQuestions([]); setAnswers({}); setIndex(0); setSubmitted(false); };
  const speak = (value) => { if (!window.speechSynthesis) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(value); utterance.lang='zh-CN'; utterance.rate=.82; window.speechSynthesis.speak(utterance); };

  return <div className="online-exam">
    <div className="exam-hero">
      <div className="exam-hero-icon"><ClipboardList size={25}/></div>
      <div><span className="exam-eyebrow">NHẬT TU CHINESE · HSK 1</span><h1>Luyện tập trực tuyến</h1><p>Ôn tập kiến thức từ Bài 1 đến Bài 15 · Không cần đăng nhập</p></div>
    </div>
    {!questions.length ? <div className="exam-layout">
      <section className="exam-panel exam-config">
        <div className="exam-panel-title"><BookOpen size={19}/><div><b>Thiết lập bài luyện</b><small>Chọn phạm vi và dạng bài muốn ôn</small></div></div>
        <label className="exam-field">Phạm vi bài học
          <select value={lesson} onChange={e=>setLesson(e.target.value)}><option value="all">Tất cả Bài 1–15</option>{lessons.map(l=><option key={l.id} value={l.id}>Bài {l.id} · {l.title}</option>)}</select>
        </label>
        <label className="exam-field">Dạng bài tập
          <select value={mode} onChange={e=>setMode(e.target.value)}>
            <option value="mixed">Tổng hợp nhiều dạng</option><option value="meaning">Chọn nghĩa tiếng Việt</option><option value="han">Chọn Hán tự</option><option value="pinyin">Chọn Pinyin</option><option value="pinyin-write">Viết Pinyin có dấu</option><option value="write">Viết Hán tự</option><option value="translate">Dịch câu Việt – Trung</option>
          </select>
        </label>
        <label className="exam-field">Số lượng câu hỏi
          <select value={count} onChange={e=>setCount(Number(e.target.value))}><option value={10}>10 câu</option><option value={20}>20 câu</option><option value={40}>40 câu</option><option value={60}>60 câu</option></select>
        </label>
        <button className="exam-start-btn" onClick={start}>Bắt đầu làm bài <ChevronRight size={18}/></button>
        <div className="exam-local-note"><CheckCircle2 size={16}/> Kết quả được lưu trên trình duyệt của thiết bị này.</div>
      </section>
      <section className="exam-panel exam-overview">
        <div className="exam-panel-title"><Trophy size={19}/><div><b>Tiến độ luyện tập</b><small>Thống kê các lần làm bài gần đây</small></div></div>
        <div className="exam-stats"><div><strong>{history.length}</strong><span>Lần đã làm</span></div><div><strong>{history.length?`${Math.round(history.reduce((a,b)=>a+b.percent,0)/history.length)}%`:'—'}</strong><span>Điểm trung bình</span></div><div><strong>{history.reduce((a,b)=>a+b.correct,0)}</strong><span>Câu trả lời đúng</span></div></div>
        <button className="exam-history-toggle" onClick={()=>setShowHistory(!showHistory)}><History size={16}/> {showHistory?'Ẩn lịch sử':'Xem lịch sử làm bài'} <ChevronRight size={16}/></button>
        {showHistory&&<div className="exam-history">{history.length?history.map(r=><div className="exam-history-row" key={r.id}><div><b>{r.lesson}</b><small>{r.date} · {r.total} câu</small></div><strong className={r.percent>=80?'good':r.percent>=50?'mid':'low'}>{r.percent}%</strong></div>):<p>Chưa có kết quả. Hãy bắt đầu bài luyện đầu tiên!</p>}</div>}
        <div className="exam-tip"><Lightbulb size={18}/><span><b>Mẹo ôn tập:</b> Nên luyện từng bài trước, sau đó làm đề tổng hợp để củng cố từ vựng và Pinyin.</span></div>
      </section>
    </div> : <section className="exam-panel exam-quiz">
      {!submitted ? <>
        <div className="quiz-topline"><span>{lesson==='all'?'Ôn tập tổng hợp':`Bài ${lesson}`} · Câu {index+1}/{questions.length}</span><span>{answered}/{questions.length} đã trả lời</span></div>
        <div className="quiz-progress"><i style={{width:`${((index+1)/questions.length)*100}%`}}/></div>
        <div className="quiz-question"><span>{current.label}</span><h2>{current.prompt}</h2>{current.kind==='pinyin'&&<button className="quiz-sound" onClick={()=>speak(current.prompt)}><Volume2 size={17}/> Nghe phát âm</button>}</div>
        {current.type==='choice' ? <div className="quiz-options">{current.options.map((option,i)=><button key={`${current.id}-${i}`} className={`quiz-option ${answers[current.id]===option?'selected':''}`} onClick={()=>setAnswers(prev=>({...prev,[current.id]:option}))}><span>{String.fromCharCode(65+i)}</span>{option}</button>)}</div> : <input className="quiz-answer-input" value={answers[current.id]||''} onChange={e=>setAnswers(prev=>({...prev,[current.id]:e.target.value}))} placeholder={current.kind==='pinyin'?'Nhập Pinyin có dấu thanh...':'Nhập Hán tự...'}/>}
        <div className="quiz-controls"><button className="exam-secondary-btn" onClick={()=>setIndex(Math.max(0,index-1))} disabled={index===0}><ChevronLeft size={17}/> Câu trước</button>{index<questions.length-1?<button className="exam-next-btn" onClick={()=>setIndex(index+1)}>Câu tiếp theo <ChevronRight size={17}/></button>:<button className="exam-submit-btn" onClick={submit}>Nộp bài <CheckCircle2 size={17}/></button>}</div>
        <div className="quiz-bottom-actions"><button onClick={reset}><XCircle size={15}/> Thoát bài</button>{index<questions.length-1&&<button onClick={submit}>Nộp bài sớm</button>}</div>
      </> : <div className="exam-result">
        <div className="result-medal"><Trophy size={34}/></div><span className="exam-eyebrow">HOÀN THÀNH BÀI LUYỆN</span><h2>{Math.round(score/questions.length*100)} điểm</h2><p>Bạn trả lời đúng {score}/{questions.length} câu hỏi.</p>
        <div className="result-review">{questions.map((q,i)=>{const correct=normalize(answers[q.id])===normalize(q.answer);return <div className="review-row" key={q.id}><div className="review-mark">{correct?<CheckCircle2 size={18}/>:<XCircle size={18}/>}</div><div className="review-body"><b>Câu {i+1}. {q.prompt}</b><small>Bạn trả lời: {answers[q.id]||'Chưa trả lời'}</small>{!correct&&<small className="review-correct">Đáp án: {q.answer}</small>}<small className="review-explain">{q.explanation}</small></div></div>})}</div>
        <div className="result-actions"><button className="exam-secondary-btn" onClick={reset}><ChevronLeft size={17}/> Về trang luyện tập</button><button className="exam-next-btn" onClick={start}><RotateCcw size={17}/> Làm đề mới</button></div>
      </div>}
    </section>}
  </div>;
}
