import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const KNOWN_ENDPOINTS: Record<string, { url: string; description: string }> = {
  ethereum: {
    url: 'https://api-sre-dash.onesource.io/graphql',
    description: 'Ethereum mainnet (default)',
  },
  blockticity: {
    url: 'https://api-blockticity.onesource.io/graphql',
    description: 'Blockticity (BTIC) Avalanche L1 subnet',
  },
};

export const DEFAULT_ENDPOINT = 'ethereum';

const CONFIG_DIR = join(homedir(), '.onesource');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

interface Config {
  endpoint?: string; // name or URL
}

function readConfig(): Config {
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
}

export function getActiveEndpointName(): string {
  return process.env.ONESOURCE_API_ENDPOINT
    ? 'custom (env)'
    : readConfig().endpoint ?? DEFAULT_ENDPOINT;
}

export function resolveEndpointUrl(): string {
  if (process.env.ONESOURCE_API_ENDPOINT) {
    return process.env.ONESOURCE_API_ENDPOINT;
  }

  const configured = readConfig().endpoint ?? DEFAULT_ENDPOINT;
  const known = KNOWN_ENDPOINTS[configured];
  return known ? known.url : configured; // treat as raw URL if not a known name
}

export function setEndpoint(nameOrUrl: string): void {
  writeConfig({ ...readConfig(), endpoint: nameOrUrl });
}
