export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=3600');

  const today = new Date().toISOString().substring(0, 10);

  // Source 1: datos.gov.co — API oficial Superfinanciera
  try {
    const url = `https://www.datos.gov.co/resource/32sa-8pi3.json?$where=vigenciadesde<='${today}'&$order=vigenciadesde DESC&$limit=1`;
    const r = await fetch(url);
    if (r.ok) {
      const d = await r.json();
      if (d && d[0] && d[0].valor) {
        const trm = parseFloat(d[0].valor);
        if (trm > 100) {
          return res.json({ trm, source: 'datos.gov.co', fecha: d[0].vigenciadesde, ok: true });
        }
      }
    }
  } catch (e1) { console.warn('datos.gov.co failed', e1.message); }

  // Source 2: dolar-colombia.com (fallback)
  try {
    const r2 = await fetch('https://www.dolar-colombia.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (r2.ok) {
      const html = await r2.text();
      const m = html.match(/1\s+USD\s*=\s*([\d,\.]+)\s*COP/i);
      if (m) {
        const trm = parseFloat(m[1].replace(/,/g, ''));
        if (trm > 100) {
          return res.json({ trm, source: 'dolar-colombia.com', ok: true });
        }
      }
    }
  } catch (e2) { console.warn('dolar-colombia failed', e2.message); }

  return res.status(500).json({ ok: false, error: 'All sources failed' });
}