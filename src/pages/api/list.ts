import type { APIRoute } from 'astro';
import { getRecentAfter } from '../../db';
import { auth } from '../../auth-server';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to') ?? undefined;
  const maximumParam = url.searchParams.get('maximum');
  const maximum = maximumParam ? parseInt(maximumParam) : undefined;

  const errResp = new Response('error', { status: 400 });

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || !from) return errResp;

  const resp = await getRecentAfter(session.user.id, { from, to, maximum });

  return new Response(JSON.stringify(resp), { status: 200 });
};
