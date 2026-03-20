#!/usr/bin/env node
import { program } from 'commander';
import { registerBlockCommands } from './commands/block.js';
import { registerTransactionCommands } from './commands/transaction.js';
import { registerEndpointCommands } from './commands/endpoint.js';
import { registerNftCommands } from './commands/nft.js';

program
  .name('onesource')
  .description('CLI for querying OneSource blockchain data')
  .version('0.1.0')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--no-color', 'Disable colored output');

registerEndpointCommands(program);
registerBlockCommands(program);
registerTransactionCommands(program);
registerNftCommands(program);

program.parse();
