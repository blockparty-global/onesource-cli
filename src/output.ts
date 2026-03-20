import { stringify } from 'yaml';
import chalk from 'chalk';

export function format(data: unknown, useYaml: boolean, useColor: boolean = true): string {
  const output = useYaml ? stringify(data) : JSON.stringify(data, null, 2);
  
  if (!useColor || !process.stdout.isTTY) {
    return output;
  }
  
  if (useYaml) {
    // Basic YAML syntax highlighting
    return output
      .replace(/^(\s*[^:\s]+):/gm, chalk.blue('$1') + ':') // Keys in blue
      .replace(/: (true|false)/g, ': ' + chalk.yellow('$1')) // Booleans in yellow
      .replace(/: (\d+(\.\d+)?)/g, ': ' + chalk.cyan('$1')) // Numbers in cyan
      .replace(/: (null)/g, ': ' + chalk.gray('$1')); // null in gray
  } else {
    // Basic JSON syntax highlighting
    return output
      .replace(/"([^"]+)":/g, chalk.blue('"$1"') + ':') // Keys in blue
      .replace(/: "((?:\\.|[^"\\])*)"(?=\s*[,\]\}])/g, ': ' + chalk.green('"$1"')) // Strings in green
      .replace(/: (true|false)(?=\s*[,\]\}])/g, ': ' + chalk.yellow('$1')) // Booleans in yellow
      .replace(/: (\d+(?:\.\d+)?)(?=\s*[,\]\}])/g, ': ' + chalk.cyan('$1')) // Numbers in cyan
      .replace(/: (null)(?=\s*[,\]\}])/g, ': ' + chalk.gray('$1')); // null in gray
  }
}

export function formatSuccess(message: string): string {
  return chalk.green('✓') + ' ' + message;
}

export function formatWarning(message: string): string {
  return chalk.yellow('⚠') + ' ' + message;
}

export function formatError(message: string): string {
  return chalk.red('✗') + ' ' + message;
}

export function formatInfo(message: string): string {
  return chalk.blue('ℹ') + ' ' + message;
}