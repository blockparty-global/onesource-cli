import { describe, it, expect } from 'vitest';
import { ValidationError } from '../errors.js';
import {
  validateAddress,
  validateHash,
  validatePositiveInteger,
  validateBlockNumber,
  validatePagination,
  validateTransactionStatus,
  validateOrderDirection,
  validateNetwork,
} from '../validation.js';

describe('validation', () => {
  describe('validateAddress', () => {
    it('should accept valid Ethereum addresses', () => {
      const validAddresses = [
        '0x742a4A7fCe727d7b6AF6d4E4D1FCDBe63A1F9c37',
        '0x742a4A7fCe727d7b6AF6d4E4D1FCDBe63A1F9c37',
        '0x0000000000000000000000000000000000000000',
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      ];

      validAddresses.forEach(address => {
        expect(() => validateAddress(address)).not.toThrow();
      });
    });

    it('should reject invalid addresses', () => {
      const invalidAddresses = [
        '',
        '0x742a4A7fCe727d7b6AF6d4E4D1FCDBe63A1F9c3', // too short
        '0x742a4A7fCe727d7b6AF6d4E4D1FCDBe63A1F9c377', // too long
        '742a4A7fCe727d7b6AF6d4E4D1FCDBe63A1F9c37', // missing 0x
        '0xGGGa4A7fCe727d7b6AF6d4E4D1FCDBe63A1F9c37', // invalid hex
      ];

      invalidAddresses.forEach(address => {
        expect(() => validateAddress(address)).toThrow(ValidationError);
      });
    });
  });

  describe('validateHash', () => {
    it('should accept valid transaction/block hashes', () => {
      const validHashes = [
        '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      ];

      validHashes.forEach(hash => {
        expect(() => validateHash(hash)).not.toThrow();
      });
    });

    it('should reject invalid hashes', () => {
      const invalidHashes = [
        '',
        '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b2206', // too short
        '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060a1', // too long
        '5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060', // missing 0x
        '0xGG504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060', // invalid hex
      ];

      invalidHashes.forEach(hash => {
        expect(() => validateHash(hash)).toThrow(ValidationError);
      });
    });
  });

  describe('validatePositiveInteger', () => {
    it('should accept valid positive integers', () => {
      expect(() => validatePositiveInteger('0', 'test')).not.toThrow();
      expect(() => validatePositiveInteger('1', 'test')).not.toThrow();
      expect(() => validatePositiveInteger('999999', 'test')).not.toThrow();
    });

    it('should return parsed integer', () => {
      expect(validatePositiveInteger('42', 'test')).toBe(42);
      expect(validatePositiveInteger('0', 'test')).toBe(0);
    });

    it('should reject invalid inputs', () => {
      expect(() => validatePositiveInteger('', 'test')).toThrow(ValidationError);
      expect(() => validatePositiveInteger('   ', 'test')).toThrow(ValidationError);
      expect(() => validatePositiveInteger('-1', 'test')).toThrow(ValidationError);
      expect(() => validatePositiveInteger('abc', 'test')).toThrow(ValidationError);
      expect(() => validatePositiveInteger('1.5', 'test')).toThrow(ValidationError);
    });
  });

  describe('validateBlockNumber', () => {
    it('should accept latest keyword', () => {
      expect(() => validateBlockNumber('latest')).not.toThrow();
    });

    it('should accept valid block numbers', () => {
      expect(() => validateBlockNumber('0')).not.toThrow();
      expect(() => validateBlockNumber('123456')).not.toThrow();
    });

    it('should reject invalid inputs', () => {
      expect(() => validateBlockNumber('')).toThrow(ValidationError);
      expect(() => validateBlockNumber('-1')).toThrow(ValidationError);
      expect(() => validateBlockNumber('abc')).toThrow(ValidationError);
    });
  });

  describe('validatePagination', () => {
    it('should return default values when no input provided', () => {
      const result = validatePagination();
      expect(result).toEqual({ first: 10, after: undefined });
    });

    it('should validate and return custom pagination', () => {
      const result = validatePagination('20', 'eyJjdXJzb3IiOiIxMjM0NTYifQ==');
      expect(result).toEqual({ first: 20, after: 'eyJjdXJzb3IiOiIxMjM0NTYifQ==' });
    });

    it('should reject invalid page sizes', () => {
      expect(() => validatePagination('0')).toThrow(ValidationError);
      expect(() => validatePagination('-1')).toThrow(ValidationError);
      expect(() => validatePagination('101')).toThrow(ValidationError);
      expect(() => validatePagination('abc')).toThrow(ValidationError);
    });

    it('should reject invalid cursor format', () => {
      expect(() => validatePagination('10', 'invalid-cursor!')).toThrow(ValidationError);
    });
  });

  describe('validateTransactionStatus', () => {
    it('should accept valid statuses', () => {
      expect(() => validateTransactionStatus('SUCCESS')).not.toThrow();
      expect(() => validateTransactionStatus('FAILED')).not.toThrow();
    });

    it('should reject invalid statuses', () => {
      expect(() => validateTransactionStatus('PENDING')).toThrow(ValidationError);
      expect(() => validateTransactionStatus('success')).toThrow(ValidationError);
      expect(() => validateTransactionStatus('')).toThrow(ValidationError);
    });
  });

  describe('validateOrderDirection', () => {
    it('should accept valid order directions', () => {
      expect(() => validateOrderDirection('ASC')).not.toThrow();
      expect(() => validateOrderDirection('DESC')).not.toThrow();
      expect(() => validateOrderDirection('asc')).not.toThrow();
      expect(() => validateOrderDirection('desc')).not.toThrow();
    });

    it('should reject invalid order directions', () => {
      expect(() => validateOrderDirection('UP')).toThrow(ValidationError);
      expect(() => validateOrderDirection('DOWN')).toThrow(ValidationError);
      expect(() => validateOrderDirection('')).toThrow(ValidationError);
    });
  });

  describe('validateNetwork', () => {
    it('should accept valid networks', () => {
      expect(() => validateNetwork('BTIC')).not.toThrow();
      expect(() => validateNetwork('ETH')).not.toThrow();
      expect(() => validateNetwork('ETHEREUM')).not.toThrow();
      expect(() => validateNetwork('btic')).not.toThrow();
    });

    it('should reject invalid networks', () => {
      expect(() => validateNetwork('POLYGON')).toThrow(ValidationError);
      expect(() => validateNetwork('BSC')).toThrow(ValidationError);
      expect(() => validateNetwork('')).toThrow(ValidationError);
    });
  });
});