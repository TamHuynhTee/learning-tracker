<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules

- Learning Tracker ("Sổ Học Tập") is UI-first: all data comes from the sample array in `src/lib/resources.ts`. Do not add backend imports (no Lovable Cloud, no `@/integrations/supabase/*`) until the user connects their own external Supabase project for Auth + database. Why: the user explicitly deferred the backend and will BYO Supabase.
- All UI copy is Vietnamese, including status labels Chưa học / Đang học / Hoàn thành. Why: the user requested a Vietnamese-language app.
- Tailwind v4 CSS-first: design tokens live in `src/styles.css` (`@theme inline` + oklch); never hardcode color utilities in components.
- TanStack Start file-based routing: pages live in `src/routes/` (e.g. `resources.index.tsx` = `/resources`, `resources.$resourceId.tsx` = `/resources/:id`); never create `src/pages/` or `src/App.tsx`.
