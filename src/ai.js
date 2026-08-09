// AI week-menu generation via an OpenAI-compatible endpoint. The key lives in a
// Worker secret (AICDKS_API_KEY) and is only ever used server-side; prompts
// contain recipe titles/tags and day names — never emails, tokens or IDs the
// model doesn't need.

const AI_BASE = 'https://api.aicdks.com/v1';
const AI_MODEL = 'glm-5.2';

function draftPrompt({ recipes, avoidTitles, dayLabels }) {
  const box = recipes.map((r) => `- [${r.id}] ${r.title}${r.tags ? ` (tags: ${r.tags})` : ''}${r.favorite ? ' ★favourite' : ''}`).join('\n');
  return `You plan family dinners for one week (${dayLabels.join(', ')}).

Recipe box (pick from here by id when possible; favourites are starred):
${box || '(empty)'}

${avoidTitles.length ? `Planned in the last two weeks (avoid repeating unless the box is small): ${avoidTitles.join('; ')}` : ''}

Rules:
- Return STRICT JSON only, no markdown fences, matching:
  {"week":[7 picks, one per day in order],"alternates":[5-8 extra picks]}
- A pick is either {"recipe_id":"<id from the box>"} or, when the box has too few suitable recipes, {"new":{"title":"...","ingredients":["qty ingredient", ...],"steps":["...", ...]}}
- Aim for variety across the week (protein/cuisine); prefer favourites once or twice; family-friendly weeknight dinners, nothing extravagant.
- New recipes: 5-12 ingredients with quantities for a family of 4, 3-8 concise steps.
- Never invent a recipe_id that is not in the box.`;
}

function validPick(p, ids) {
  if (!p || typeof p !== 'object') return null;
  if (typeof p.recipe_id === 'string' && ids.has(p.recipe_id)) return { recipe_id: p.recipe_id };
  const n = p.new;
  if (n && typeof n === 'object' && typeof n.title === 'string' && n.title.trim() && Array.isArray(n.ingredients) && Array.isArray(n.steps)) {
    const ingredients = n.ingredients.map((s) => String(s).trim()).filter(Boolean).slice(0, 30).map((s) => s.slice(0, 300));
    const steps = n.steps.map((s) => String(s).trim()).filter(Boolean).slice(0, 20).map((s) => s.slice(0, 1000));
    if (ingredients.length) return { new: { title: n.title.trim().slice(0, 200), ingredients, steps } };
  }
  return null;
}

async function completeOnce(key, prompt, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${AI_BASE}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.7,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
  const data = await res.json();
  return String(data.choices?.[0]?.message?.content || '');
}

// Returns {week:[7 picks], alternates:[...]} or throws. Bounded wall time: two
// attempts of at most 20 s each, so the user never waits more than ~40 s.
export async function generateWeekDraft(env, { recipes, avoidTitles, dayLabels }) {
  const key = env.AICDKS_API_KEY;
  if (!key) throw new Error('AI is not configured');
  const prompt = draftPrompt({ recipes, avoidTitles, dayLabels });
  let text;
  try {
    text = await completeOnce(key, prompt, 20_000);
  } catch {
    text = await completeOnce(key, prompt, 20_000);
  }
  const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = jsonText.indexOf('{');
  const end = jsonText.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI returned no JSON');
  const parsed = JSON.parse(jsonText.slice(start, end + 1));
  const ids = new Set(recipes.map((r) => r.id));
  const week = (Array.isArray(parsed.week) ? parsed.week : []).map((p) => validPick(p, ids)).filter(Boolean);
  const alternates = (Array.isArray(parsed.alternates) ? parsed.alternates : []).map((p) => validPick(p, ids)).filter(Boolean);
  if (week.length < 7) throw new Error('AI draft incomplete');
  return { week: week.slice(0, 7), alternates: alternates.slice(0, 10) };
}
