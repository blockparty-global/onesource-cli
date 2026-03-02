#!/usr/bin/env node
import { program } from 'commander';
import { registerBlockCommands } from './commands/block.js';
import { registerTransactionCommands } from './commands/transaction.js';

program
  .name('onesource')
  .description('CLI for querying OneSource blockchain data')
  .version('0.1.0');

registerBlockCommands(program);
registerTransactionCommands(program);

program.parse();
