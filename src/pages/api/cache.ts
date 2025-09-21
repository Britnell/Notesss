import type { APIRoute } from 'astro';
import { checkCache, getRecentAfter } from '../../db';
import { auth } from '../../auth-server';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const from = new URL(request.url).searchParams.get('from');

  const errResp = new Response('error', {
    status: 400,
  });

  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session || !from) return errResp;

  const resp = await checkCache(session?.user.id, from, 3);
  if (!resp) return errResp;

  return new Response(JSON.stringify(resp), {
    status: 200,
  });
};
