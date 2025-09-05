import type { APIRoute } from 'astro';
import { exec } from '../../db';

export const prerender = false;

export const GET: APIRoute = async () => {
  const x = await exec(` 
    select * from notes
`);
  console.log(' /db ', x);

  return new Response(
    JSON.stringify({
      greeting: 'Hello',
    }),
  );
};
