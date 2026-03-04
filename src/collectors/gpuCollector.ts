import { GpuInfo } from './types';
import { execFileAsync } from '../utils/exec';

let detected: boolean | undefined;
let lastGpuInfo: GpuInfo[] | null = null; 

function toNumberOrNull(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = parseFloat(value);
  return Number.isNaN(n) ? null : n;
}

async function collectNvidia(): Promise<GpuInfo[]> {
  const output = await execFileAsync('nvidia-smi', [
    '--query-gpu=name,memory.total,memory.used,temperature.gpu,utilization.gpu',
    '--format=csv,noheader,nounits',
  ]);

  const gpuLines = output.trim().split('\n').filter(line => line.trim() !== '');
  
  return gpuLines.map(line => {
    const parts = line.trim().split(',').map(s => s.trim());
    return {
      name: parts[0] || 'NVIDIA GPU', 
      vendor: 'NVIDIA',
      vramTotalMB: toNumberOrNull(parts[1]),
      vramUsedMB: toNumberOrNull(parts[2]),
      temperatureC: toNumberOrNull(parts[3]),
      coreUsage: toNumberOrNull(parts[4]),
    };
  });
}

export async function detectGpu(): Promise<boolean> {
  try {
    await execFileAsync(
      'nvidia-smi',
      ['--query-gpu=name', '--format=csv,noheader'],
      2000,
    );
    detected = true;
  } catch {
    detected = false;
  }
  return detected;
}

export async function collectGpu(): Promise<GpuInfo[] | null> {
  if (detected === undefined) {
    await detectGpu();
  }

  if (!detected) {
    return null;
  }

  try {
    const infoArray = await collectNvidia();
    lastGpuInfo = infoArray;
    return infoArray;
  } catch {
    return lastGpuInfo;
  }
}
