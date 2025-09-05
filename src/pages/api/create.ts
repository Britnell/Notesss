import type { APIRoute } from 'astro';
import { createNote } from '../../db';
import { auth } from '../../auth-server';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { date, text, userId } = await request.json();

  const errResp = new Response('error', {
    status: 400,
  });

  // TODO - zod check

  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session || session?.user.id !== userId) return errResp;

  // TODO - check note date does not exist

  const resp = await createNote({ date, text, userId, updated: Date.now() }).catch(() => {
    return null;
  });
  if (!resp) return errResp;

  return new Response(JSON.stringify(resp), {
    status: 200,
  });
};
