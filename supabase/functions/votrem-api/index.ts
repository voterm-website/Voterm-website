const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const clean = (value: unknown, max = 5000) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const getSecretKey = () => {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const map = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (map) {
    try { return JSON.parse(map).default; } catch (_) {}
  }
  return '';
};

const supabaseUrl = () => Deno.env.get('SUPABASE_URL') || '';

async function insertRow(table: string, row: Record<string, unknown>) {
  const key = getSecretKey();
  if (!key || !supabaseUrl()) throw new Error('Supabase server configuration is incomplete.');
  const res = await fetch(`${supabaseUrl()}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Database write failed: ${res.status}`);
}

async function sendEmail(subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const to = Deno.env.get('VOTREM_NOTIFICATION_EMAIL') || 'voiceontherockevangelical@gmail.com';
  const from = Deno.env.get('VOTREM_FROM_EMAIL') || 'VOTREM Website <onboarding@resend.dev>';
  if (!apiKey) return { skipped: true };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Email service failed: ${res.status}`);
  return { skipped: false };
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

async function submitForm(body: any) {
  const formType = clean(body.formType, 80);
  const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
  const honeypot = clean(body.website, 200);
  if (honeypot) return { ok: true };
  if (!formType) throw new Error('Form type is required.');

  const safePayload: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    safePayload[clean(key, 100)] = clean(value, 5000);
  }

  await insertRow('form_submissions', { form_type: formType, payload: safePayload });

  const summary = Object.entries(safePayload)
    .filter(([key]) => !/health/i.test(key))
    .map(([key, value]) => `<tr><td style="padding:6px;font-weight:700">${escapeHtml(key)}</td><td style="padding:6px">${escapeHtml(value)}</td></tr>`)
    .join('');

  await sendEmail(
    `VOTREM Website — New ${formType}`,
    `<h2>New VOTREM website submission</h2><p><strong>Form:</strong> ${escapeHtml(formType)}</p><table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">${summary}</table><p style="font-size:12px;color:#666">Sensitive health information, when present, is stored in the secure database but intentionally omitted from this email alert.</p>`
  );

  return { ok: true, message: 'Submission received.' };
}

async function initializePayment(body: any) {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!secret) throw new Error('Payment gateway is not configured yet.');
  const amount = Math.round(Number(body.amount) * 100);
  if (!Number.isFinite(amount) || amount < 100) throw new Error('Invalid payment amount.');
  const email = clean(body.email, 200);
  if (!email || !email.includes('@')) throw new Error('A valid email is required for payment.');
  const reference = `VOTREM-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: String(amount), email, currency: 'NGN', reference,
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
      metadata: {
        donor_name: clean(body.name, 200), donor_phone: clean(body.phone, 80), cause: clean(body.cause, 200),
      },
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.status) throw new Error(data.message || 'Could not initialize payment.');

  await insertRow('donations', {
    reference, amount_kobo: amount, currency: 'NGN', cause: clean(body.cause, 200),
    donor_name: clean(body.name, 200), donor_email: email, donor_phone: clean(body.phone, 80),
    status: 'initiated', gateway: 'paystack'
  });

  return { ok: true, authorization_url: data.data.authorization_url, access_code: data.data.access_code, reference };
}

async function verifyPayment(body: any) {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!secret) throw new Error('Payment gateway is not configured yet.');
  const reference = clean(body.reference, 120);
  if (!reference) throw new Error('Payment reference is required.');

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();
  if (!res.ok || !data.status) throw new Error(data.message || 'Could not verify payment.');

  const tx = data.data;
  if (tx.status !== 'success') return { ok: false, status: tx.status };

  const key = getSecretKey();
  await fetch(`${supabaseUrl()}/rest/v1/donations?reference=eq.${encodeURIComponent(reference)}`, {
    method: 'PATCH',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString(), gateway_response: tx }),
  });

  await sendEmail(
    `VOTREM Website — Donation Received (${reference})`,
    `<h2>Donation payment received</h2><p><strong>Reference:</strong> ${escapeHtml(reference)}</p><p><strong>Amount:</strong> ₦${(Number(tx.amount) / 100).toLocaleString()}</p><p><strong>Email:</strong> ${escapeHtml(tx.customer?.email)}</p><p><strong>Status:</strong> Successful</p>`
  );

  return { ok: true, status: 'success', reference };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const body = await req.json();
    switch (body.action) {
      case 'submit_form': return json(await submitForm(body));
      case 'initialize_payment': return json(await initializePayment(body));
      case 'verify_payment': return json(await verifyPayment(body));
      default: return json({ error: 'Unknown action' }, 400);
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Request failed.' }, 400);
  }
});

