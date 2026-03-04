import * as fs from 'fs';
import * as os from 'os';

let previousUsage: number = 0;
let previousTime: number = Date.now();

export function collectCpu(): any {
    try {
        const quota = parseInt(fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_quota_us', 'utf8'));
        const period = parseInt(fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_period_us', 'utf8'));
        const cpuLimit = quota > 0 ? quota / period : os.cpus().length;

        const currentUsage = parseInt(fs.readFileSync('/sys/fs/cgroup/cpuacct.usage', 'utf8'));
        const currentTime = Date.now();

        const usageDelta = currentUsage - previousUsage;
        const timeDelta = (currentTime - previousTime) * 1000000;

        let overall = (usageDelta / timeDelta) / cpuLimit * 100;
        overall = Math.min(100, Math.round(overall * 10) / 10);

        previousUsage = currentUsage;
        previousTime = currentTime;

        return {
            overall: isNaN(overall) ? 0 : overall,
            cores: [overall], 
            model: `Pod Limit: ${cpuLimit} Core(s)`,
            speedMHz: os.cpus()[0]?.speed ?? 0,
        };
    } catch (e) {
        return { overall: 0, cores: [], model: 'Fallback Mode', speedMHz: 0 };
    }
}
