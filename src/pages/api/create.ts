import type { APIRoute } from "astro";
import { createNote } from "../../db";
import { auth } from "../../auth-server";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { date, text, userId } = await request.json();

  const errResp = new Response("error", {
    status: 400,
  });

  // todo zod check

  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session || session?.user.id !== userId) return errResp;

  const resp = await createNote({ date, text, userId });
  if (resp.length !== 1) return errResp;

  return new Response(JSON.stringify(resp[0]), {
    status: 200,
  });
};
