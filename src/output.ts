import { stringify } from 'yaml';

export function format(data: unknown, useYaml: boolean): string {
  return useYaml ? stringify(data) : JSON.stringify(data, null, 2);
}
