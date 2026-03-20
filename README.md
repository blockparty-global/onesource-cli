# onesource-cli

CLI for querying OneSource blockchain data. Supports multiple networks, five commands, typed responses, custom error handling, and native `fetch()`.

## Install

```bash
git clone git@github.com:blockparty-global/onesource-cli.git
cd onesource-cli
npm install
npm run build
```

To make the `onesource` command available globally:

```bash
npm link
```

## Configuration

Set your API key as an environment variable:

```bash
export ONESOURCE_API_KEY=your_key_here
```

Also accepts `MACH10_API_KEY`.

## Endpoints

The CLI supports multiple OneSource API endpoints. Switch between them with the `endpoint` command:

```bash
onesource endpoint                  # show current endpoint and list available
onesource endpoint ethereum         # switch to Ethereum mainnet
onesource endpoint blockticity      # switch to Blockticity (BTIC) Avalanche L1 subnet
```

| Name | URL | Description |
|------|-----|-------------|
| `ethereum` | `https://api-sre-dash.onesource.io/graphql` | Ethereum mainnet (default) |
| `blockticity` | `https://api-blockticity.onesource.io/graphql` | Blockticity (BTIC) Avalanche L1 subnet |

You can also set a custom endpoint URL directly:

```bash
onesource endpoint https://custom.example.com/graphql
```

The selection persists in `~/.onesource/config.json`. The `ONESOURCE_API_ENDPOINT` environment variable takes priority over saved config if set.

## Usage

All commands support short aliases for convenience.

### endpoint (alias: `ep`)

Show or set the active API endpoint.

```bash
onesource endpoint                  # show current and list all
onesource endpoint ethereum         # switch to Ethereum
onesource endpoint blockticity      # switch to Blockticity
onesource endpoint --list           # same as no args
```

### block (alias: `b`)

Fetch a single block by number or hash. (Ethereum endpoint)

```bash
onesource block 20000000
onesource block --hash 0xd24fd73f794058a3807db926d8898c6481e902b7edb91ce0d479d6760f276183
onesource block 20000000 --yaml
```

### blocks (alias: `bs`)

List blocks with optional filters and pagination. (Ethereum endpoint)

```bash
onesource blocks --first 5
onesource blocks --first 5 --order-by TIMESTAMP --order DESC
onesource blocks --number-min 20000000 --number-max 20000010
```

Options:

| Flag | Description |
|------|-------------|
| `--number-min <n>` | Minimum block number |
| `--number-max <n>` | Maximum block number |
| `--first <n>` | Page size (default: 10) |
| `--after <cursor>` | Pagination cursor |
| `--order-by <field>` | NUMBER, TIMESTAMP, TRANSACTION_COUNT, SIZE, GAS_USED |
| `--order <dir>` | ASC or DESC |

### transaction (alias: `tx`)

Fetch a single transaction by hash. (Ethereum endpoint)

```bash
onesource transaction 0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060
```

### transactions (alias: `txs`)

List transactions with optional filters and pagination. (Ethereum endpoint)

```bash
onesource transactions --first 5
onesource transactions --from 0xa1e4380a3b1f749673e270229993ee55f35663b4
onesource transactions --block-min 20000000 --block-max 20000100
onesource transactions --status SUCCESS --order-by VALUE --order DESC
```

Options:

| Flag | Description |
|------|-------------|
| `--from <address>` | Filter by sender |
| `--to <address>` | Filter by recipient |
| `--block-min <n>` | Minimum block number |
| `--block-max <n>` | Maximum block number |
| `--status <s>` | SUCCESS or FAILED |
| `--first <n>` | Page size (default: 10) |
| `--after <cursor>` | Pagination cursor |
| `--order-by <field>` | BLOCK_NUMBER, TIMESTAMP, VALUE, HASH, GAS, NONCE |
| `--order <dir>` | ASC or DESC |

### nft

Fetch NFT metadata by contract address and token ID. (Blockticity endpoint)

```bash
onesource endpoint blockticity
onesource nft 0x7D1955F814f25Ec2065C01B9bFc0AcC29B3f2926 842909
onesource nft 0x7D1955F814f25Ec2065C01B9bFc0AcC29B3f2926 862909 --yaml
onesource nft 0x7D1955F814f25Ec2065C01B9bFc0AcC29B3f2926 842909 --network BTIC
```

Options:

| Flag | Description |
|------|-------------|
| `--network <name>` | Network name (default: BTIC) |
| `--yaml` | Output as YAML |

## Output

JSON by default (standard GraphQL `{ data: { ... } }` envelope). Add `--yaml` to any command for YAML output.

When running in a terminal, output is syntax-highlighted with colors. Colors are automatically disabled when piping to another command or when using `--no-color`:

```bash
onesource block 20000000 | jq '.data.block.gasUsed'
onesource transactions --first 3 | jq '.data.transactions.entries[].hash'
onesource nft 0x7D1955F814f25Ec2065C01B9bFc0AcC29B3f2926 842909 | jq '.data.nft.metadata.attributes'
```

## Global Options

| Flag | Description |
|------|-------------|
| `-v, --verbose` | Enable verbose output |
| `--no-color` | Disable colored output |

## Development

```bash
npx tsx src/cli.ts block 20000000   # run without building
npm run build                        # compile to dist/
node dist/cli.js block 20000000      # run compiled
npm test                             # run tests (watch mode)
npm run test:run                     # run tests once
npm run lint                         # lint with ESLint
npm run format                       # format with Prettier
npm run check                        # full quality check (lint + format + test + build)
```
