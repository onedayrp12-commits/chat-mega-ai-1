import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(x => x.trim()) : true }));
app.use(express.json({ limit: '1mb' }));
const stats = { chats: 0, startedAt: new Date().toISOString() };

app.get('/health', (_req, res) => res.json({ ok: true, service: 'MeGa AI API' }));
app.post('/api/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ error: 'message_required', message: 'اكتب رسالتك أولاً.' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'ai_provider_not_configured', message: 'خدمة الذكاء الاصطناعي غير مهيأة.' });
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-12) : [];
  const contents = [...history.filter(x => ['user','model'].includes(x.role) && typeof x.text === 'string').map(x => ({ role: x.role, parts: [{ text: x.text.slice(0, 6000) }] })), { role: 'user', parts: [{ text: message.slice(0, 12000) }] }];
  try {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
    const upstream = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: 'أنت MeGa AI، مساعد ذكي مفيد ومحترم. أجب باللغة العربية ما لم يطلب المستخدم لغة أخرى. كن واضحاً ودقيقاً.' }] }, contents, generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } }) });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(502).json({ error: 'ai_provider_error', message: data?.error?.message || 'تعذر الحصول على رد من مزود الذكاء الاصطناعي.' });
    const answer = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!answer) return res.status(502).json({ error: 'empty_ai_response', message: 'لم يصل رد صالح من محرك الذكاء الاصطناعي.' });
    stats.chats += 1;
    return res.json({ answer, model });
  } catch (error) {
    console.error('AI request failed:', error);
    return res.status(502).json({ error: 'upstream_unavailable', message: 'حدث خطأ أثناء الاتصال بمحرك الذكاء الاصطناعي.' });
  }
});
app.get('/api/admin/stats', (req, res) => {
  const token = process.env.ADMIN_TOKEN;
  if (!token || req.get('authorization') !== `Bearer ${token}`) return res.status(401).json({ error: 'unauthorized' });
  res.json({ chats: stats.chats, startedAt: stats.startedAt, service: 'MeGa AI API' });
});
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`MeGa AI API listening on ${port}`));
