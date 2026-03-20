import { ValidationError } from './errors.js';

/**
 * Validates Ethereum address format
 */
export function validateAddress(address: string): void {
  if (!address) {
    throw new ValidationError('Address is required');
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new ValidationError(
      `Invalid address format: ${address}. Expected 42-character hex string starting with '0x'`,
      'address'
    );
  }
}

/**
 * Validates transaction or block hash format
 */
export function validateHash(hash: string): void {
  if (!hash) {
    throw new ValidationError('Hash is required');
  }
  
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    throw new ValidationError(
      `Invalid hash format: ${hash}. Expected 66-character hex string starting with '0x'`,
      'hash'
    );
  }
}

/**
 * Validates and parses a positive integer
 */
export function validatePositiveInteger(value: string, fieldName: string): number {
  if (!value || value.trim() === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  
  // Check for decimal points before parsing
  if (value.includes('.')) {
    throw new ValidationError(
      `${fieldName} must be a whole number, got: ${value}`,
      fieldName
    );
  }
  
  const num = parseInt(value, 10);
  if (isNaN(num) || num.toString() !== value.trim()) {
    throw new ValidationError(
      `${fieldName} must be a valid number, got: ${value}`,
      fieldName
    );
  }
  
  if (num < 0) {
    throw new ValidationError(
      `${fieldName} must be a positive number, got: ${num}`,
      fieldName
    );
  }
  
  return num;
}

/**
 * Validates block number (can be positive integer or 'latest')
 */
export function validateBlockNumber(value: string): void {
  if (!value || value.trim() === '') {
    throw new ValidationError('Block number is required', 'blockNumber');
  }
  
  if (value === 'latest') {
    return; // 'latest' is valid
  }
  
  validatePositiveInteger(value, 'Block number');
}

/**
 * Validates pagination parameters
 */
export function validatePagination(first?: string, after?: string): { first: number; after?: string } {
  const firstNum = first ? validatePositiveInteger(first, 'Page size (first)') : 10;
  
  if (firstNum === 0) {
    throw new ValidationError(
      `Page size must be greater than 0, got: ${firstNum}`,
      'first'
    );
  }
  
  if (firstNum > 100) {
    throw new ValidationError(
      `Page size cannot exceed 100, got: ${firstNum}`,
      'first'
    );
  }
  
  if (after && !/^[a-zA-Z0-9+/]+=*$/.test(after)) {
    throw new ValidationError(
      `Invalid cursor format: ${after}. Expected base64-encoded string`,
      'after'
    );
  }
  
  return { first: firstNum, after };
}

/**
 * Validates transaction status
 */
export function validateTransactionStatus(status: string): void {
  const validStatuses = ['SUCCESS', 'FAILED'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError(
      `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
      'status'
    );
  }
}

/**
 * Validates order direction
 */
export function validateOrderDirection(order: string): void {
  const validOrders = ['ASC', 'DESC'];
  if (!validOrders.includes(order.toUpperCase())) {
    throw new ValidationError(
      `Invalid order direction: ${order}. Must be one of: ${validOrders.join(', ')}`,
      'order'
    );
  }
}

/**
 * Validates network name for NFTs
 */
export function validateNetwork(network: string): void {
  const validNetworks = ['BTIC', 'ETH', 'ETHEREUM'];
  if (!validNetworks.includes(network.toUpperCase())) {
    throw new ValidationError(
      `Invalid network: ${network}. Must be one of: ${validNetworks.join(', ')}`,
      'network'
    );
  }
}