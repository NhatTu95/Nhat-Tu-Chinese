import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
const app=express();app.use(cors());app.use(express.json({limit:'1mb'}));
app.get('/api/health',(_,res)=>res.json({ok:true,service:'Nhật Tu Chinese API'}));
app.post('/api/translate',async(req,res)=>{
 const {text,source='vi'}=req.body||{};
 if(!text||typeof text!=='string')return res.status(400).json({error:'Vui lòng nhập nội dung cần dịch.'});
 if(!process.env.GEMINI_API_KEY)return res.status(503).json({error:'Chưa cấu hình GEMINI_API_KEY.'});
 try{
  const direction=source==='vi'?'tiếng Việt sang tiếng Trung giản thể':'tiếng Trung sang tiếng Việt';
  const prompt=`Bạn là trợ lý dạy tiếng Trung cho người Việt. Hãy dịch nội dung sau từ ${direction}. Trả về JSON hợp lệ với đúng các khóa: han (bản dịch chữ Hán; nếu dịch sang tiếng Việt thì ghi bản dịch tiếng Việt), pin (pinyin có dấu thanh nếu đầu ra là tiếng Trung, nếu không để chuỗi rỗng), note (giải thích ngắn bằng tiếng Việt về cách dùng hoặc sắc thái). Không thêm markdown. Nội dung: ${text}`;
  const model=process.env.GEMINI_MODEL||'gemini-2.0-flash';
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json'}})});
  const data=await r.json();if(!r.ok)throw new Error(data.error?.message||'Gemini API trả về lỗi.');
  const raw=data.candidates?.[0]?.content?.parts?.[0]?.text;if(!raw)throw new Error('Không nhận được nội dung dịch.');
  res.json(JSON.parse(raw));
 }catch(e){res.status(502).json({error:e.message||'Không thể dịch lúc này.'});}
});

app.post('/api/chat',async(req,res)=>{
 const {messages=[]}=req.body||{};
 if(!Array.isArray(messages)||!messages.length)return res.status(400).json({error:'Hội thoại chưa có nội dung.'});
 if(!process.env.GEMINI_API_KEY)return res.status(503).json({error:'Chưa cấu hình GEMINI_API_KEY trong tệp .env.'});
 try{
  const history=messages.slice(-16).map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:String(m.content||'').slice(0,4000)}]}));
  const system=`Bạn là gia sư tiếng Trung thân thiện, kiên nhẫn, chuyên dạy người Việt từ HSK 1 đến HSK 9. Mục tiêu là giúp người học giao tiếp thực tế. Trả lời chủ yếu bằng tiếng Việt, dùng chữ Hán giản thể và pinyin có dấu thanh. Khi người học viết tiếng Trung: sửa lỗi nhẹ nhàng, nêu câu đúng, pinyin, nghĩa tiếng Việt và giải thích ngắn điểm ngữ pháp/từ vựng. Khi phù hợp, hỏi lại một câu tiếng Trung để người học phản xạ. Điều chỉnh độ khó theo trình độ; nếu chưa rõ thì bắt đầu HSK 1. Không bịa thông tin từ điển; nói rõ khi chưa chắc. Giữ câu trả lời gọn, dễ học.`;
  const model=process.env.GEMINI_MODEL||'gemini-2.0-flash';
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:history,generationConfig:{temperature:0.7,maxOutputTokens:900}})});
  const data=await r.json();if(!r.ok)throw new Error(data.error?.message||'Gemini API trả về lỗi.');
  const reply=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('').trim();if(!reply)throw new Error('Gia sư chưa tạo được câu trả lời.');
  res.json({reply});
 }catch(e){res.status(502).json({error:e.message||'Không thể kết nối gia sư AI.'});}
});

const port=process.env.PORT||3001;app.listen(port,()=>console.log(`Nhật Tu Chinese API: http://localhost:${port}`));
