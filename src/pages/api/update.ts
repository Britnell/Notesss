import type { APIRoute } from "astro";
import { updateNote } from "../../db";
import { auth } from "../../auth-server";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { text, id, userId } = await request.json();

  const errResp = new Response("error", {
    status: 400,
  });

  // todo zod check

  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session || session?.user.id !== userId) return errResp;

  const resp = await updateNote({ text, userId, id });

  return new Response(JSON.stringify(resp), {
    status: 200,
  });
};
