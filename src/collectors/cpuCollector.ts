import * as fs from 'fs';
import * as os from 'os';
import { CpuInfo } from './types';

let previousUsage: number = 0;
let previousTime: number = Date.now();

export function collectCpu(): CpuInfo {
  const cpus = os.cpus();
  const currentTime = Date.now();
  let podOverall = 0;
  let cores: number[] = [];
  let containerCpuCoreCount = 1;

  try {
    const quotaStr = fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_quota_us', 'utf8').trim();
    const periodStr = fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_period_us', 'utf8').trim();
    const quota = parseInt(quotaStr);
    const period = parseInt(periodStr);

    if (quota > 0 && period > 0) {
      containerCpuCoreCount = quota / period;
    }

    const usageStr = fs.readFileSync('/sys/fs/cgroup/cpuacct/cpuacct.usage', 'utf8').trim();
    const currentUsage = parseInt(usageStr);

    if (previousUsage > 0 && previousTime > 0) {
      const usageDelta = currentUsage - previousUsage;
      const timeDelta = (currentTime - previousTime) * 1000000;
      
      if (timeDelta > 0) {
        podOverall = ((usageDelta / timeDelta) / containerCpuCoreCount) * 100;
      }
    }
    previousUsage = currentUsage;

  } catch (e) {
    podOverall = 0;
  }

  previousTime = currentTime;

  const formattedOverall = isNaN(podOverall) ? 0 : Math.max(0, Math.min(100, Math.round(podOverall * 10) / 10));

  cores = new Array(Math.ceil(containerCpuCoreCount)).fill(formattedOverall);

  return {
    overall: formattedOverall,
    cores: cores,
    model: cpus[0]?.model ?? 'Unknown', 
    speedMHz: cpus[0]?.speed ?? 0,
  };
}
