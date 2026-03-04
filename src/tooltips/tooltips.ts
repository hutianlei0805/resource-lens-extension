import { CpuInfo, MemoryInfo, GpuInfo } from '../collectors/types';

function table(rows: [string, string][]): string {
  let content = '| | |\n|---|---|\n';
  for (const [k, v] of rows) content += `| **${k}** | ${v} |\n`;
  return content;
}

function formatGB(bytes: number): string {
  return (bytes / 1024 / 1024 / 1024).toFixed(1);
}

export function buildCpuTooltip(cpu: CpuInfo): string {
  return table([
    ['Model', cpu.model],
    ['Cores', String(cpu.cores.length)],
    ['Speed', `${cpu.speedMHz} MHz`],
  ]);
}

export function buildMemoryTooltip(mem: MemoryInfo): string {
  return table([
    ['Total', `${formatGB(mem.totalBytes)} GB`],
    ['Used', `${formatGB(mem.usedBytes)} GB`],
    ['Free', `${formatGB(mem.freeBytes)} GB`],
  ]);
}

export function buildGpuTooltip(gpus: GpuInfo[]): string {
  if (gpus.length === 0) {
    return table([['Status', 'No GPU detected']]);
  }

  const rows: [string, string][] = [];

  gpus.forEach((gpu, index) => {
    const prefix = gpus.length > 1 ? `GPU ${index} ` : '';

    rows.push([`${prefix}Name`, gpu.name]);
    
    if (gpu.coreUsage !== null) {
      rows.push([`${prefix}Core Usage`, `${gpu.coreUsage.toFixed(1)}%`]);
    }
    
    if (gpu.vramTotalMB !== null && gpu.vramUsedMB !== null) {
      rows.push([
        `${prefix}VRAM`,
        `${(gpu.vramUsedMB / 1024).toFixed(1)}/${(gpu.vramTotalMB / 1024).toFixed(1)} GB`,
      ]);
    } else if (gpu.vramUsedMB !== null) {
      rows.push([`${prefix}VRAM Used`, `${(gpu.vramUsedMB / 1024).toFixed(1)} GB`]);
    }
    
    if (gpu.temperatureC !== null) {
      rows.push([`${prefix}Temperature`, `${gpu.temperatureC}\u00B0C`]);
    }
  });

  return table(rows);
}
