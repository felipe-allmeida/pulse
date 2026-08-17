import { fileURLToPath } from 'node:url';

/**
 * Absolute path of the generated assistant projects file.
 *
 * Shared by the generator and the drift test so the two can never disagree
 * about where the file lives — a mismatch there would make the test pass
 * against a stale copy while the generator wrote somewhere else.
 *
 * Node-only (it imports `node:url`): keep it out of anything the browser
 * bundle can reach.
 */
export const ASSISTANT_PROJECTS_PATH = fileURLToPath(
  new URL('../../../../src/Pulse.Api/Assistant/projects.generated.md', import.meta.url),
);
