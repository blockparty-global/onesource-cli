import { Command } from 'commander';
import { query } from '../client.js';
import { format } from '../output.js';
import { ValidationError, handleError } from '../errors.js';
import {
  validateHash,
  validatePagination,
  validateOrderDirection,
  validatePositiveInteger,
  validateBlockNumber,
} from '../validation.js';
import type { BlockResponse, BlocksListResponse, BlockOptions, BlocksOptions } from '../types.js';

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
    .alias('b')
    .description('Get a single block by number or hash')
    .option('--hash <hash>', 'Look up block by hash instead of number')
    .option('--yaml', 'Output as YAML instead of JSON')
    .action(async (number: string | undefined, opts: BlockOptions) => {
      try {
        const variables: { number?: string; hash?: string } = {};
        if (opts.hash) {
          validateHash(opts.hash);
          variables.hash = opts.hash;
        } else if (number) {
          validateBlockNumber(number);
          variables.number = number;
        } else {
          throw new ValidationError('Please provide a block number or --hash option');
        }
        const result = await query<BlockResponse['data']>(GET_BLOCK, variables);
        console.log(format(result, !!opts.yaml));
      } catch (error) {
        handleError(error);
      }
    });

  program
    .command('blocks')
    .alias('bs')
    .description('List blocks with optional filters')
    .option('--number-min <n>', 'Minimum block number')
    .option('--number-max <n>', 'Maximum block number')
    .option('--first <n>', 'Page size', '10')
    .option('--after <cursor>', 'Pagination cursor')
    .option(
      '--order-by <field>',
      'Sort field (NUMBER, TIMESTAMP, TRANSACTION_COUNT, SIZE, GAS_USED)'
    )
    .option('--order <dir>', 'Sort direction (ASC, DESC)')
    .option('--yaml', 'Output as YAML instead of JSON')
    .action(async (opts: BlocksOptions & { first: string }) => {
      try {
        const firstNum = parseInt(opts.first, 10);
        if (isNaN(firstNum) || firstNum <= 0) {
          throw new ValidationError('Page size must be a positive number', 'first');
        }

        const variables: {
          first: number;
          after?: string;
          orderBy?: string;
          orderDirection?: string;
          where?: Record<string, { gte?: number; lte?: number }>;
        } = {
          first: firstNum,
        };
        if (opts.after) variables.after = opts.after;
        if (opts.orderBy) variables.orderBy = opts.orderBy;
        if (opts.order) variables.orderDirection = opts.order;

        const where: Record<string, { gte?: number; lte?: number }> = {};
        if (opts.numberMin || opts.numberMax) {
          const range: Record<string, number> = {};
          if (opts.numberMin) {
            const min = parseInt(opts.numberMin, 10);
            if (isNaN(min))
              throw new ValidationError('Minimum block number must be a valid number', 'numberMin');
            range.gte = min;
          }
          if (opts.numberMax) {
            const max = parseInt(opts.numberMax, 10);
            if (isNaN(max))
              throw new ValidationError('Maximum block number must be a valid number', 'numberMax');
            range.lte = max;
          }
          where.number = range;
        }
        if (Object.keys(where).length > 0) variables.where = where;

        const result = await query<BlocksListResponse['data']>(GET_BLOCKS, variables);
        console.log(format(result, !!opts.yaml));
      } catch (error) {
        handleError(error);
      }
    });
}
