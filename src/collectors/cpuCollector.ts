import * as fs from 'fs';
import * as os from 'os';
import { CpuInfo } from './types';

let previousUsage: number = 0;
let previousTime: number = Date.now();

let containerCpuCoreCount: number | null = null;
let logicalCores: number = 1;
let cachedModel: string = 'Unknown';
let cachedSpeed: number = 0;

export function collectCpu(): CpuInfo {
  const currentTime = Date.now();
  let podOverall = 0;

  if (containerCpuCoreCount === null) {
    const quota = parseInt(fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_quota_us', 'utf8').trim(), 10);
    const period = parseInt(fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_period_us', 'utf8').trim(), 10);
    containerCpuCoreCount = quota / period;
    logicalCores = Math.ceil(containerCpuCoreCount);

    const cpus = os.cpus();
    cachedModel = cpus[0]?.model ?? 'Unknown';
    cachedSpeed = cpus[0]?.speed ?? 0;
  }

  const currentUsage = parseInt(fs.readFileSync('/sys/fs/cgroup/cpuacct/cpuacct.usage', 'utf8').trim(), 10);

  if (previousUsage > 0) {
    const usageDelta = currentUsage - previousUsage;
    const timeDelta = (currentTime - previousTime) * 1000000; 
    
    podOverall = ((usageDelta / timeDelta) / containerCpuCoreCount!) * 100;
  }
  
  previousUsage = currentUsage;
  previousTime = currentTime;

  const formattedOverall = Math.max(0, Math.min(100, Math.round(podOverall * 10) / 10));

  return {
    overall: formattedOverall,
    cores: new Array(logicalCores).fill(formattedOverall),
    model: cachedModel, 
    speedMHz: cachedSpeed, 
  };
}
