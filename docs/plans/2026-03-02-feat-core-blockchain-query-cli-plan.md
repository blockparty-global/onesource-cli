---
title: "feat: Core blockchain query CLI"
type: feat
date: 2026-03-02
---

# Core Blockchain Query CLI

Build a minimal, CLI-native tool for querying the OneSource/Mach10 blockchain API — replacing MCP overhead with direct shell access for the four proven, reliable endpoints.

## Motivation

Per the "CLI Is All You Need" thesis: agents trained on shell usage are better served by composable CLIs than bloated MCP schemas. The OneSource MCP server (`onesource-claude/plugins/mcp-mach10`) already proves these four queries work reliably. This CLI extracts that value into a zero-ceremony shell tool.

## Proposed Solution

A single Node.js CLI (`onesource`) with four subcommands that hit the existing GraphQL endpoint, authenticate via API key, and return structured output (JSON default, YAML with `--yaml` flag).

### Usage

```bash
# Setup
export ONESOURCE_API_KEY=your_key_here

# Single lookups
onesource transaction <hash>
onesource block <number>
onesource block --hash <block_hash>

# List queries with filters
onesource transactions --from <addr> --first 10
onesource transactions --block-min 20000000 --block-max 20000100
onesource blocks --first 5 --order-by TIMESTAMP --order DESC

# Output format
onesource block 20000000 --yaml
onesource block 20000000 | jq '.data.block.gasUsed'
```

### API Details (proven in MCP server)

| Config | Value |
|--------|-------|
| Endpoint | `https://api-sre-dash.onesource.io/graphql` |
| Auth header | `x-bp-token: <api_key>` |
| Env var | `ONESOURCE_API_KEY` (also accepts `MACH10_API_KEY`) |
| Method | POST with `Content-Type: application/json` |

## Acceptance Criteria

- [x] `onesource transaction <hash>` — fetches single transaction by hash
- [x] `onesource transactions` — lists transactions with filter/pagination flags
- [x] `onesource block <number>` — fetches single block by number (or `--hash`)
- [x] `onesource blocks` — lists blocks with filter/pagination flags
- [x] JSON output by default (standard GraphQL `{ data: { ... } }` envelope)
- [x] `--yaml` flag converts output to YAML
- [x] API key read from `ONESOURCE_API_KEY` env var (falls back to `MACH10_API_KEY`)
- [x] Clear error messages for missing API key, network failures, GraphQL errors
- [x] `onesource --help` and per-command help
- [x] Pipe-friendly: no color/spinners by default, clean stdout for `jq`

## MVP

### Project structure

```
onesource-cli/
  package.json
  tsconfig.json
  src/
    cli.ts              # Entry point, arg parsing (Commander)
    client.ts           # GraphQL client (fetch-based, no heavy deps)
    commands/
      transaction.ts    # transaction + transactions subcommands
      block.ts          # block + blocks subcommands
    output.ts           # JSON/YAML formatter
```

### package.json

```json
{
  "name": "onesource-cli",
  "version": "0.1.0",
  "description": "CLI for querying OneSource blockchain data",
  "type": "module",
  "bin": { "onesource": "./dist/cli.js" },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli.ts",
    "start": "node dist/cli.js"
  },
  "dependencies": {
    "commander": "^13.0.0",
    "yaml": "^2.7.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  },
  "engines": { "node": ">=18" }
}
```

**Dependency rationale:**
- `commander` — standard CLI framework, tiny, well-known to agents
- `yaml` — YAML serialization for `--yaml` flag
- No `graphql-request` — use native `fetch()` (Node 18+) to keep deps minimal
- `tsx` for dev, `tsc` for build — matches MCP server pattern

### src/client.ts

```typescript
const ENDPOINT = process.env.ONESOURCE_API_ENDPOINT
  || 'https://api-sre-dash.onesource.io/graphql';

function getApiKey(): string {
  const key = process.env.ONESOURCE_API_KEY || process.env.MACH10_API_KEY;
  if (!key) {
    console.error('Error: ONESOURCE_API_KEY environment variable is required.');
    process.exit(1);
  }
  return key;
}

export async function query(
  gql: string,
  variables?: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bp-token': getApiKey(),
    },
    body: JSON.stringify({ query: gql, variables }),
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${res.statusText}`);
    process.exit(1);
  }
  return res.json();
}
```

### src/commands/block.ts

```typescript
// GET_BLOCK query — exact same proven query from MCP server
const GET_BLOCK = `
  query GetBlock($number: BlockNumber, $hash: BlockHash) {
    block(number: $number, hash: $hash) {
      number hash timestamp transactionCount
      gasUsed gasLimit difficulty size confirmations
    }
  }
`;

// GET_BLOCKS query with pagination/filter support
const GET_BLOCKS = `
  query GetBlocks(
    $first: Int, $after: Cursor,
    $where: BlockFilter,
    $orderBy: BlockOrderBy, $orderDirection: OrderDirection
  ) {
    blocks(first: $first, after: $after, where: $where,
           orderBy: $orderBy, orderDirection: $orderDirection) {
      totalCount
      pageInfo { hasNextPage endCursor count }
      entries {
        number hash timestamp transactionCount
        gasUsed gasLimit difficulty size confirmations
      }
    }
  }
`;
```

### src/commands/transaction.ts

```typescript
// GET_TRANSACTION — exact same proven query from MCP server
const GET_TRANSACTION = `
  query GetTransaction($hash: TransactionHash!) {
    transaction(hash: $hash) {
      hash timestamp
      from { address } to { address }
      value { raw formatted decimals }
      gas { limit price used feeCap tipCap }
      nonce confirmations status
      block { number hash timestamp }
      contractCreated { address name }
    }
  }
`;

// GET_TRANSACTIONS with pagination/filter/stats
const GET_TRANSACTIONS = `
  query GetTransactions(
    $first: Int, $after: Cursor,
    $where: TransactionFilter,
    $orderBy: TransactionOrderBy, $orderDirection: OrderDirection
  ) {
    transactions(first: $first, after: $after, where: $where,
                 orderBy: $orderBy, orderDirection: $orderDirection) {
      totalCount
      pageInfo { hasNextPage endCursor count }
      entries {
        hash timestamp
        from { address } to { address }
        value { raw formatted decimals }
        gas { limit price used }
        nonce confirmations status
        block { number }
      }
      stats {
        totalCount totalValue { raw formatted decimals }
        averageGasPrice averageGasUsed uniqueAddresses
      }
    }
  }
`;
```

### src/output.ts

```typescript
import { stringify } from 'yaml';

export function format(data: unknown, useYaml: boolean): string {
  return useYaml ? stringify(data) : JSON.stringify(data, null, 2);
}
```

### src/cli.ts (entry point)

```typescript
#!/usr/bin/env node
import { program } from 'commander';
// Register subcommands from commands/block.ts and commands/transaction.ts
// Each prints format(result, options.yaml) to stdout
```

### CLI flags per subcommand

**`onesource transaction <hash>`** — no additional flags needed

**`onesource transactions`**:
- `--from <address>` — filter by sender
- `--to <address>` — filter by recipient
- `--block-min <n>` / `--block-max <n>` — block range
- `--status <SUCCESS|FAILED>` — filter by status
- `--first <n>` — page size (default 10)
- `--after <cursor>` — pagination cursor
- `--order-by <field>` — BLOCK_NUMBER, TIMESTAMP, VALUE, etc.
- `--order <ASC|DESC>` — sort direction

**`onesource block <number>`**:
- `--hash <hash>` — lookup by hash instead of number

**`onesource blocks`**:
- `--number-min <n>` / `--number-max <n>` — block range
- `--first <n>` — page size (default 10)
- `--after <cursor>` — pagination cursor
- `--order-by <field>` — NUMBER, TIMESTAMP, etc.
- `--order <ASC|DESC>` — sort direction

**Global flags** (all commands):
- `--yaml` — output as YAML instead of JSON

## Future Phases (not in scope)

- **Phase 2**: `address`, `contract`, `token` commands (once API is fully stable for those)
- **Phase 3**: `nft` command
- **Phase 4**: `--raw` flag for custom GraphQL passthrough
- **Phase 5**: `npm install -g onesource-cli` distribution, `onesource config` for persistent API key
- **Phase 6**: Shell completions, `--table` output format, `--fields` for field selection

## References

- MCP server source: `/Users/rickmanelius/git/onesource/onesource-claude/plugins/mcp-mach10/server/`
- Proven queries: `server/src/graphql/queries.ts`
- Client pattern: `server/src/graphql/client.ts` (auth header: `x-bp-token`)
- Type definitions: `server/src/types.ts`
- API status: block/blocks, transaction/transactions are "Reliable" per MCP README
- CLI philosophy: `context/cli-is-all-you-need.md`
