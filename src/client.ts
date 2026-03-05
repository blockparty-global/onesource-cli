import { resolveEndpointUrl } from './endpoints.js';

function getApiKey(): string {
  const key = process.env.ONESOURCE_API_KEY || process.env.MACH10_API_KEY;
  if (!key) {
    console.error('Error: ONESOURCE_API_KEY environment variable is required.');
    console.error('Set it with: export ONESOURCE_API_KEY=your_key_here');
    process.exit(1);
  }
  return key;
}

export async function query(
  gql: string,
  variables?: Record<string, unknown>
): Promise<unknown> {
  const endpoint = resolveEndpointUrl();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bp-token': getApiKey(),
    },
    body: JSON.stringify({ query: gql, variables }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`HTTP ${res.status}: ${res.statusText}`);
    if (body) console.error(body);
    process.exit(1);
  }

  const json = await res.json();

  if (json.errors) {
    const messages = json.errors.map((e: { message: string }) => e.message).join('\n');
    console.error(`GraphQL Error:\n${messages}`);
    process.exit(1);
  }

  return json;
}
