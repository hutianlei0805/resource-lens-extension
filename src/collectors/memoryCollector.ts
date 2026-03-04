import * as fs from 'fs';
import * as os from 'os';
import { MemoryInfo } from './types';

export function collectMemory(): MemoryInfo {
  const limitPath = '/sys/fs/cgroup/memory/memory.limit_in_bytes';
  const usagePath = '/sys/fs/cgroup/memory/memory.usage_in_bytes';

  const limitStr = fs.readFileSync(limitPath, 'utf8').trim();
  const usageStr = fs.readFileSync(usagePath, 'utf8').trim();

  let totalBytes = parseInt(limitStr);
  const usedBytes = parseInt(usageStr);

  const freeBytes = Math.max(0, totalBytes - usedBytes);

  return { totalBytes, usedBytes, freeBytes };
}
