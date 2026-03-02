# onesource-cli

CLI for querying OneSource blockchain data. Four commands, two deps, native `fetch()`.

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

Also accepts `MACH10_API_KEY`. Optionally override the endpoint:

```bash
export ONESOURCE_API_ENDPOINT=https://api-sre-dash.onesource.io/graphql  # default
```

## Usage

### block

Fetch a single block by number or hash.

```bash
onesource block 20000000
onesource block --hash 0xd24fd73f794058a3807db926d8898c6481e902b7edb91ce0d479d6760f276183
onesource block 20000000 --yaml
```

### blocks

List blocks with optional filters and pagination.

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

### transaction

Fetch a single transaction by hash.

```bash
onesource transaction 0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060
```

### transactions

List transactions with optional filters and pagination.

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

## Output

JSON by default (standard GraphQL `{ data: { ... } }` envelope). Add `--yaml` to any command for YAML output.

Pipe-friendly — no colors or spinners:

```bash
onesource block 20000000 | jq '.data.block.gasUsed'
onesource transactions --first 3 | jq '.data.transactions.entries[].hash'
```

## Development

```bash
npx tsx src/cli.ts block 20000000   # run without building
npm run build                        # compile to dist/
node dist/cli.js block 20000000      # run compiled
```
