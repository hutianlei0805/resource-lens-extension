import * as vscode from 'vscode';
import { CpuInfo, MemoryInfo, GpuInfo } from './collectors/types';
import {
  buildCpuTooltip,
  buildMemoryTooltip,
  buildGpuTooltip,
} from './tooltips/tooltips';

export class StatusBarManager {
  private cpuItem: vscode.StatusBarItem;
  private memItem: vscode.StatusBarItem;
  private gpuItem: vscode.StatusBarItem;
  private cpuTooltip: vscode.MarkdownString;
  private memTooltip: vscode.MarkdownString;
  private gpuTooltip: vscode.MarkdownString;
  private lastTexts = { cpu: '', mem: '', gpu: '' };

  constructor() {
    this.cpuItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      -100,
    );
    this.memItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      -101,
    );
    this.gpuItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      -102,
    );
    this.cpuTooltip = new vscode.MarkdownString();
    this.memTooltip = new vscode.MarkdownString();
    this.gpuTooltip = new vscode.MarkdownString();
    this.cpuItem.tooltip = this.cpuTooltip;
    this.memItem.tooltip = this.memTooltip;
    this.gpuItem.tooltip = this.gpuTooltip;
  }

  private formatFixed(val: number, padLen: number): string {
    return val.toFixed(1).padStart(padLen, '\u2007');
  }

  private updateItem(
    item: vscode.StatusBarItem,
    key: keyof typeof this.lastTexts,
    text: string | null,
    tooltipContent: string | null,
    tooltipObj: vscode.MarkdownString,
  ): void {
    if (text !== null && tooltipContent !== null) {
      if (text !== this.lastTexts[key]) {
        item.text = text;
        this.lastTexts[key] = text;
      }
      tooltipObj.value = tooltipContent;
      item.show();
    } else {
      this.lastTexts[key] = '';
      tooltipObj.value = '';
      item.hide();
    }
  }

  update(
    cpu: CpuInfo | null,
    mem: MemoryInfo | null,
    gpu: GpuInfo[] | null,
  ): void {
    const config = vscode.workspace.getConfiguration('resourceLens');

    this.updateItem(
      this.cpuItem,
      'cpu',
      cpu && config.get<boolean>('showCpu', true)
        ? `$(chip) ${this.formatFixed(cpu.overall, 5)}%`
        : null,
      cpu ? buildCpuTooltip(cpu) : null,
      this.cpuTooltip,
    );

    let memText: string | null = null;
    if (mem && config.get<boolean>('showMemory', true)) {
      const totalStr = (mem.totalBytes / 1024 / 1024 / 1024).toFixed(1);
      const usedStr = this.formatFixed(mem.usedBytes / 1024 / 1024 / 1024, totalStr.length);
      memText = `$(server) ${usedStr}/${totalStr} GB`;
    }

    this.updateItem(
      this.memItem,
      'mem',
      memText,
      mem ? buildMemoryTooltip(mem) : null,
      this.memTooltip,
    );

    let gpuText: string | null = null;
    if (gpu && gpu.length > 0 && config.get<boolean>('showGpu', true)) {
      let totalUsedMB = 0;
      let totalMaxMB = 0;
      let hasUsed = false;
      let hasMax = false;

      for (const g of gpu) {
        if (g.vramUsedMB !== null) {
          totalUsedMB += g.vramUsedMB;
          hasUsed = true;
        }
        if (g.vramTotalMB !== null) {
          totalMaxMB += g.vramTotalMB;
          hasMax = true;
        }
      }

      if (hasUsed && hasMax) {
        const totalStr = (totalMaxMB / 1024).toFixed(1);
        const usedStr = this.formatFixed(totalUsedMB / 1024, totalStr.length);
        gpuText = `$(graph-line) ${usedStr}/${totalStr} GB`;
      } else if (hasUsed) {
        gpuText = `$(graph-line) ${(totalUsedMB / 1024).toFixed(1)} GB`;
      } else {
        gpuText = `$(graph-line) N/A`;
      }
    }

    this.updateItem(
      this.gpuItem,
      'gpu',
      gpuText,
      gpu && gpu.length > 0 ? buildGpuTooltip(gpu) : null,
      this.gpuTooltip,
    );
  }

  dispose(): void {
    this.cpuItem.dispose();
    this.memItem.dispose();
    this.gpuItem.dispose();
  }
}
