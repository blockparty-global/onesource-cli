import { Command } from 'commander';
import {
  KNOWN_ENDPOINTS,
  DEFAULT_ENDPOINT,
  getActiveEndpointName,
  resolveEndpointUrl,
  setEndpoint,
} from '../endpoints.js';

export function registerEndpointCommands(parent: Command): void {
  const cmd = parent
    .command('endpoint [name]')
    .description('Show or set the active API endpoint')
    .option('--list', 'List all known endpoints')
    .action((name: string | undefined, opts: { list?: boolean }) => {
      if (opts.list || !name) {
        showEndpoints();
        return;
      }

      // Validate: known name or URL
      const isKnown = name in KNOWN_ENDPOINTS;
      const isUrl = name.startsWith('http://') || name.startsWith('https://');

      if (!isKnown && !isUrl) {
        const names = Object.keys(KNOWN_ENDPOINTS).join(', ');
        console.error(`Unknown endpoint: ${name}`);
        console.error(`Known endpoints: ${names}`);
        console.error('Or provide a full URL (https://...)');
        process.exit(1);
      }

      setEndpoint(name);
      const url = isKnown ? KNOWN_ENDPOINTS[name].url : name;
      console.log(`Endpoint set to: ${name}`);
      console.log(`URL: ${url}`);
    });
}

function showEndpoints(): void {
  const active = getActiveEndpointName();
  const activeUrl = resolveEndpointUrl();

  console.log(`Active: ${active}`);
  console.log(`URL:    ${activeUrl}`);
  console.log();
  console.log('Available endpoints:');

  for (const [name, info] of Object.entries(KNOWN_ENDPOINTS)) {
    const marker = name === active ? ' (active)' : '';
    console.log(`  ${name}${marker}`);
    console.log(`    ${info.description}`);
    console.log(`    ${info.url}`);
  }

  if (process.env.ONESOURCE_API_ENDPOINT) {
    console.log();
    console.log(`Note: ONESOURCE_API_ENDPOINT env var is set and takes priority.`);
  }
}
