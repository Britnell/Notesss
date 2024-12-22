import type { APIRoute } from "astro";
import { updateNote } from "../../db";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { text, date } = await request.json();

  const resp = await updateNote({ text, date });
  console.log(resp);

  return new Response(JSON.stringify(resp), {
    status: 200,
  });
};
