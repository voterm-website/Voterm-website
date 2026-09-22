  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();
  if (!res.ok || !data.status) throw new Error(data.message || 'Could not verify payment.');

  const tx = data.data;
  if (tx.status !== 'success') return { ok: false, status: tx.status };
  if (Number.isFinite(expectedAmount) && Number(tx.amount) !== Math.round(expectedAmount * 100)) throw new Error('Payment amount could not be verified.');

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
