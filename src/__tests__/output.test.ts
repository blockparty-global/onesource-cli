import { describe, it, expect } from 'vitest';
import { format } from '../output.js';

describe('output', () => {
  describe('format', () => {
    const testData = {
      name: 'test',
      value: 42,
      nested: {
        array: [1, 2, 3],
        boolean: true,
      },
    };

    it('should format as JSON when useYaml is false', () => {
      const result = format(testData, false);
      expect(result).toBe(JSON.stringify(testData, null, 2));
    });

    it('should format as YAML when useYaml is true', () => {
      const result = format(testData, true);
      expect(result).toContain('name: test');
      expect(result).toContain('value: 42');
      expect(result).toContain('array:');
      expect(result).toContain('- 1');
      expect(result).toContain('- 2');
      expect(result).toContain('- 3');
      expect(result).toContain('boolean: true');
    });

    it('should handle null and undefined values', () => {
      const nullData = { value: null, missing: undefined };
      const jsonResult = format(nullData, false);
      const yamlResult = format(nullData, true);

      expect(jsonResult).toContain('null');
      expect(yamlResult).toContain('null');
    });

    it('should handle empty objects and arrays', () => {
      const emptyData = { object: {}, array: [] };
      expect(() => format(emptyData, false)).not.toThrow();
      expect(() => format(emptyData, true)).not.toThrow();
    });
  });
});
