/** Package terminal launch scripts that reuse the installed Electron runtime. */

import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PRODUCT_NAME } from './electron-builder-config.mjs'

/** Placeholder in the shipped launcher templates that names the installed executable. */
const PRODUCT_NAME_PLACEHOLDER = '__PRODUCT_NAME__'

/**
 * Copy the platform launcher into the application's public command directory.
 * @param destination - Physical runtime/cli directory prepared for the application.
 * @param platform - Target Desktop operating system.
 */
export function prepareDesktopCli(destination: string, platform: 'darwin' | 'win32'): void {
  const name = platform === 'win32' ? 'dsh.cmd' : 'dsh'
  const command = join(destination, 'bin', name)
  mkdirSync(join(destination, 'bin'), { recursive: true })
  const template = readFileSync(join(import.meta.dirname, '..', 'cli', name), 'utf8')
  writeFileSync(command, template.replaceAll(PRODUCT_NAME_PLACEHOLDER, PRODUCT_NAME))
  if (platform === 'darwin') chmodSync(command, 0o755)
}
