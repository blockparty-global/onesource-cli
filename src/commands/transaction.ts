import { Command } from 'commander';
import { query } from '../client.js';
import { format } from '../output.js';

const GET_TRANSACTION = `
  query GetTransaction($hash: TransactionHash!) {
    transaction(hash: $hash) {
      hash
      timestamp
      from { address }
      to { address }
      value { raw formatted decimals }
      gas { limit price used feeCap tipCap }
      nonce
      confirmations
      status
      block { number hash timestamp }
      contractCreated { address name }
    }
  }
`;

const GET_TRANSACTIONS = `
  query GetTransactions(
    $first: Int
    $after: Cursor
    $where: TransactionFilter
    $orderBy: TransactionOrderBy
    $orderDirection: OrderDirection
  ) {
    transactions(
      first: $first
      after: $after
      where: $where
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      totalCount
      pageInfo { hasNextPage endCursor count }
      entries {
        hash
        timestamp
        from { address }
        to { address }
        value { raw formatted decimals }
        gas { limit price used }
        nonce
        confirmations
        status
        block { number }
      }
      stats {
        totalCount
        totalValue { raw formatted decimals }
        averageGasPrice
        averageGasUsed
        uniqueAddresses
      }
    }
  }
`;

export function registerTransactionCommands(program: Command) {
  program
    .command('transaction <hash>')
    .description('Get a single transaction by hash')
    .option('--yaml', 'Output as YAML instead of JSON')
    .action(async (hash: string, opts: { yaml?: boolean }) => {
      const result = await query(GET_TRANSACTION, { hash });
      console.log(format(result, !!opts.yaml));
    });

  program
    .command('transactions')
    .description('List transactions with optional filters')
    .option('--from <address>', 'Filter by sender address')
    .option('--to <address>', 'Filter by recipient address')
    .option('--block-min <n>', 'Minimum block number')
    .option('--block-max <n>', 'Maximum block number')
    .option('--status <status>', 'Filter by status (SUCCESS, FAILED)')
    .option('--first <n>', 'Page size', '10')
    .option('--after <cursor>', 'Pagination cursor')
    .option('--order-by <field>', 'Sort field (BLOCK_NUMBER, TIMESTAMP, VALUE, HASH, GAS, NONCE)')
    .option('--order <dir>', 'Sort direction (ASC, DESC)')
    .option('--yaml', 'Output as YAML instead of JSON')
    .action(async (opts: {
      from?: string;
      to?: string;
      blockMin?: string;
      blockMax?: string;
      status?: string;
      first: string;
      after?: string;
      orderBy?: string;
      order?: string;
      yaml?: boolean;
    }) => {
      const variables: Record<string, unknown> = {
        first: parseInt(opts.first, 10),
      };
      if (opts.after) variables.after = opts.after;
      if (opts.orderBy) variables.orderBy = opts.orderBy;
      if (opts.order) variables.orderDirection = opts.order;

      const where: Record<string, unknown> = {};
      if (opts.from) where.from = opts.from;
      if (opts.to) where.to = opts.to;
      if (opts.status) where.status = opts.status;
      if (opts.blockMin || opts.blockMax) {
        const range: Record<string, number> = {};
        if (opts.blockMin) range.gte = parseInt(opts.blockMin, 10);
        if (opts.blockMax) range.lte = parseInt(opts.blockMax, 10);
        where.blockNumber = range;
      }
      if (Object.keys(where).length > 0) variables.where = where;

      const result = await query(GET_TRANSACTIONS, variables);
      console.log(format(result, !!opts.yaml));
    });
}
