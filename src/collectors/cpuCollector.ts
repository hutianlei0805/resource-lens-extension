import * as fs from 'fs';
import * as os from 'os';
import { CpuInfo } from './types';

interface CpuTick {
  idle: number;
  total: number;
}

let previousTicks: CpuTick[] | null = null;
let previousUsage: number = 0;
let previousTime: number = Date.now();

function snapshot(): CpuTick[] {
  return os.cpus().map((cpu) => {
    const { user, nice, sys, idle, irq } = cpu.times;
    const total = user + nice + sys + idle + irq;
    return { idle, total };
  });
}

export function collectCpu(): CpuInfo {
  const cpus = os.cpus();
  const currentTicks = snapshot();
  const currentTime = Date.now();

  let podOverall = 0;
  let cores: number[] = [];

  try {
    let cpuLimit = cpus.length;
    const quotaStr = fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_quota_us', 'utf8').trim();
    const periodStr = fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_period_us', 'utf8').trim();
    const quota = parseInt(quotaStr);
    const period = parseInt(periodStr);

    if (quota > 0 && period > 0) {
      cpuLimit = quota / period;
    }

    const usageStr = fs.readFileSync('/sys/fs/cgroup/cpuacct.usage', 'utf8').trim();
    const currentUsage = parseInt(usageStr);

    if (previousUsage > 0 && previousTime > 0) {
      const usageDelta = currentUsage - previousUsage;
      const timeDelta = (currentTime - previousTime) * 1000000; // 毫秒转纳秒
      
      if (timeDelta > 0) {
        podOverall = ((usageDelta / timeDelta) / cpuLimit) * 100;
      }
    }
    previousUsage = currentUsage;

  } catch (e) {
    podOverall = 0;
  }

  previousTime = currentTime;
  previousTicks = currentTicks; 

  const formattedOverall = isNaN(podOverall) ? 0 : Math.max(0, Math.min(100, Math.round(podOverall * 10) / 10));


  cores = new Array(cpus.length).fill(formattedOverall);

  return {
    overall: formattedOverall,
    cores: cores,
    model: `Pod Limit: ${cpus.length} Host Cores (Cgroup Limit)`, 
    speedMHz: cpus[0]?.speed ?? 0,
  };
}
