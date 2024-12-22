import type { APIRoute } from "astro";
import { createNote } from "../../db";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { date, text } = await request.json();
  const resp = await createNote({ date, text });

  if (resp.length !== 1)
    return new Response("error", {
      status: 400,
    });

  return new Response(JSON.stringify(resp[0]), {
    status: 200,
  });
};
