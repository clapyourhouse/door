// Door Travel: "Ask a person". Stores the question and (optionally) pings a webhook.
import { adminClient, cleanTurns, corsHeaders, envInt, json, normLang, userFromRequest } from '../_shared/http.ts';

const FREE_LIMIT = envInt('HANDOFF_FREE_LIMIT', 2);
const PASS_DAILY_LIMIT = envInt('HANDOFF_PASS_DAILY_LIMIT', 3);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const admin = adminClient();
  const user = await userFromRequest(admin, req);
  if (!user) return json({ error: 'unauthorized' }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'bad_request' }, 400); }

  const question = String(body.question ?? '').trim().slice(0, 1000);
  if (!question) return json({ error: 'bad_request' }, 400);
  const lang = normLang(body.lang);
  const context = cleanTurns(body.context, 6, 600);

  const { data: city } = await admin.from('cities').select('id,name_ja,name_en')
    .eq('id', String(body.city_id ?? '')).maybeSingle();
  if (!city) return json({ error: 'unknown_city' }, 400);

  const { data: res, error } = await admin.rpc('register_handoff', {
    p_user: user.id, p_city: city.id, p_lang: lang, p_question: question, p_context: context,
    p_free_limit: FREE_LIMIT, p_pass_daily_limit: PASS_DAILY_LIMIT,
  });
  if (error || !res) return json({ error: 'server_error' }, 500);
  if (!res.allowed) return json({ error: res.reason }, 429);

  const hook = Deno.env.get('NOTIFY_WEBHOOK_URL');
  if (hook) {
    try {
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `[Door] New question (${city.name_en}, ${lang}): ${question.slice(0, 200)}` }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (e) { console.error('notify failed', e instanceof Error ? e.message : e); }
  }

  return json({ id: res.id, handoff_remaining: res.handoff_remaining });
});
