import { Command } from 'commander';
import { query } from '../client.js';
import { format } from '../output.js';
import { ValidationError, handleError } from '../errors.js';
import {
  validateHash,
  validateAddress,
  validatePagination,
  validateTransactionStatus,
  validateOrderDirection,
  validatePositiveInteger,
} from '../validation.js';
import type {
  TransactionResponse,
  TransactionsListResponse,
  TransactionOptions,
  TransactionsOptions,
} from '../types.js';

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
    .alias('tx')
    .description('Get a single transaction by hash')
    .option('--yaml', 'Output as YAML instead of JSON')
    .action(async (hash: string, opts: TransactionOptions) => {
      try {
        validateHash(hash);
        const result = await query<TransactionResponse['data']>(GET_TRANSACTION, { hash });
        console.log(format(result, !!opts.yaml));
      } catch (error) {
        handleError(error);
      }
    });

  program
    .command('transactions')
    .alias('txs')
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
    .action(async (opts: TransactionsOptions & { first: string }) => {
      try {
        const pagination = validatePagination(opts.first, opts.after);
        
        // Validate addresses if provided
        if (opts.from) validateAddress(opts.from);
        if (opts.to) validateAddress(opts.to);
        
        // Validate order direction if provided
        if (opts.order) validateOrderDirection(opts.order);
        
        // Validate status if provided
        if (opts.status) validateTransactionStatus(opts.status);

        const variables: {
          first: number;
          after?: string;
          orderBy?: string;
          orderDirection?: string;
          where?: Record<string, string | number | { gte?: number; lte?: number }>;
        } = {
          first: pagination.first,
        };
        if (pagination.after) variables.after = pagination.after;
        if (opts.orderBy) variables.orderBy = opts.orderBy;
        if (opts.order) variables.orderDirection = opts.order;

        const where: Record<string, string | number | { gte?: number; lte?: number }> = {};
        if (opts.from) where.from = opts.from;
        if (opts.to) where.to = opts.to;
        if (opts.status) {
          where.status = opts.status;
        }
        if (opts.blockMin || opts.blockMax) {
          const range: Record<string, number> = {};
          if (opts.blockMin) {
            range.gte = validatePositiveInteger(opts.blockMin, 'Minimum block number');
          }
          if (opts.blockMax) {
            range.lte = validatePositiveInteger(opts.blockMax, 'Maximum block number');
          }
          where.blockNumber = range;
        }
        if (Object.keys(where).length > 0) variables.where = where;

        const result = await query<TransactionsListResponse['data']>(GET_TRANSACTIONS, variables);
        console.log(format(result, !!opts.yaml));
      } catch (error) {
        handleError(error);
      }
    });
}
