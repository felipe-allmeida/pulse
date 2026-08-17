/**
 * Writes `src/Pulse.Api/Assistant/projects.generated.md` from `projects.ts`.
 *
 * Run with `pnpm gen:assistant` after editing project content. The output is
 * committed, and `assistant-profile.test.ts` fails when it no longer matches
 * the source — so forgetting to run this breaks CI rather than silently
 * shipping an assistant that contradicts the site.
 *
 * It is not wired into `pnpm build` on purpose: the build must not reach out
 * of `web/` and rewrite C# source as a side effect.
 */
import { writeFileSync } from 'node:fs';
import { projects } from '../src/content/projects';
import { ASSISTANT_PROJECTS_PATH } from '../src/lib/aio/assistant-profile-path';
import { renderAssistantProjects } from '../src/lib/aio/assistant-profile';

const body = renderAssistantProjects(projects);
writeFileSync(ASSISTANT_PROJECTS_PATH, body, 'utf8');
console.log(`wrote ${ASSISTANT_PROJECTS_PATH} — ${projects.length} projects, ${body.length} chars`);
