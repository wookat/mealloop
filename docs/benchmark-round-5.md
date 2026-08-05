# Benchmark Round 5 — staples list & saved reusable menus

Date: 2026-08-05. Scope: close the two highest-value remaining gaps from the round-4 competitor re-experience (Plan to Eat "Staples List" and "Menus").

## Shipped (production-verified, see PR #3 round-5 comment)

| Gap (vs competitors) | Fix | Evidence |
|---|---|---|
| Plan to Eat has a Staples List (recurring items) | `/app/staples` (migration `0003`): add/delete auto-categorized staples; every "Add week's ingredients" appends missing staples (case-insensitive, idempotent) | Live: "milk" → Dairy & Eggs, flows into list once; second click adds 0 |
| Plan to Eat "Menus" / Samsung Food plan library (reusable plans) | Named menus: save a non-empty week (`POST /app/menus`, entries stored per weekday), apply onto any empty week (`/app/menus/apply`), delete with confirm | Live: saved "Test Week Menu", applied to a later week on matching weekdays, delete cancel is a no-op |

Local: `npm run check` + `npm test` 7/7. Regression on tags/favorites/filter passed; console clean; no P0/P1.

## Updated position vs acceptance bar

With staples and reusable menus shipped, the previously "behind" rows (staples/pantry, reusable plans) from benchmark-round-4 move to at-par. Remaining secondary gaps: custom grocery categories/stores, metric display toggle, Snacks meal slot, native apps/AI plans (out of web-first v1 scope).

## Round-6 candidates
1. Custom category editing / re-categorization of grocery items.
2. Snacks meal slot (household setting).
3. Servings scaling on planned recipes.
