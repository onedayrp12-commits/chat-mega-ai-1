const $ = id => document.getElementById(id);
$('load').addEventListener('click', async () => {
  const base = $('api').value.trim().replace(/\/$/, '');
  const token = $('token').value.trim();
  $('status').textContent = 'جارٍ الاتصال...';
  try {
    const r = await fetch(`${base}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    if (!r.ok) throw new Error(r.status === 401 ? 'رمز الإدارة غير صحيح.' : 'تعذر الاتصال بالخادم.');
    $('chats').textContent = data.chats;
    $('service').textContent = 'متصل ✓';
    $('status').textContent = `بدأ التشغيل: ${new Date(data.startedAt).toLocaleString('ar-EG')}`;
  } catch (e) { $('status').textContent = e.message || 'حدث خطأ.'; $('service').textContent = 'غير متصل'; }
});
