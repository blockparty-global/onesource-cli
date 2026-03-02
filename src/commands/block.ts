import { Command } from 'commander';
import { query } from '../client.js';
import { format } from '../output.js';

const GET_BLOCK = `
  query GetBlock($number: BlockNumber, $hash: BlockHash) {
    block(number: $number, hash: $hash) {
      number
      hash
      timestamp
      transactionCount
      gasUsed
      gasLimit
      difficulty
      size
      confirmations
    }
  }
`;

const GET_BLOCKS = `
  query GetBlocks(
    $first: Int
    $after: Cursor
    $where: BlockFilter
    $orderBy: BlockOrderBy
    $orderDirection: OrderDirection
  ) {
    blocks(
      first: $first
      after: $after
      where: $where
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      totalCount
      pageInfo { hasNextPage endCursor count }
      entries {
        number
        hash
        timestamp
        transactionCount
        gasUsed
        gasLimit
        difficulty
        size
        confirmations
      }
    }
  }
`;

export function registerBlockCommands(program: Command) {
  program
    .command('block [number]')
    .description('Get a single block by number or hash')
    .option('--hash <hash>', 'Look up block by hash instead of number')
    .option('--yaml', 'Output as YAML instead of JSON')
    .action(async (number: string | undefined, opts: { hash?: string; yaml?: boolean }) => {
      const variables: Record<string, unknown> = {};
      if (opts.hash) {
        variables.hash = opts.hash;
      } else if (number) {
        variables.number = number;
      } else {
        console.error('Error: provide a block number or --hash');
        process.exit(1);
      }
      const result = await query(GET_BLOCK, variables);
      console.log(format(result, !!opts.yaml));
    });

  program
    .command('blocks')
    .description('List blocks with optional filters')
    .option('--number-min <n>', 'Minimum block number')
    .option('--number-max <n>', 'Maximum block number')
    .option('--first <n>', 'Page size', '10')
    .option('--after <cursor>', 'Pagination cursor')
    .option('--order-by <field>', 'Sort field (NUMBER, TIMESTAMP, TRANSACTION_COUNT, SIZE, GAS_USED)')
    .option('--order <dir>', 'Sort direction (ASC, DESC)')
    .option('--yaml', 'Output as YAML instead of JSON')
    .action(async (opts: {
      numberMin?: string;
      numberMax?: string;
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
      if (opts.numberMin || opts.numberMax) {
        const range: Record<string, number> = {};
        if (opts.numberMin) range.gte = parseInt(opts.numberMin, 10);
        if (opts.numberMax) range.lte = parseInt(opts.numberMax, 10);
        where.number = range;
      }
      if (Object.keys(where).length > 0) variables.where = where;

      const result = await query(GET_BLOCKS, variables);
      console.log(format(result, !!opts.yaml));
    });
}
