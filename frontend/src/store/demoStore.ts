import { create } from 'zustand'
import type { DemoStore, Vertical, DemoPrompt, DemoSession, SandboxStatus } from '@/types'
export const useDemoStore = create<DemoStore>((set) => ({
  selectedVertical: 'edtech', selectedPrompt: null, currentSession: null,
  streamBuffer: '', isStreaming: false, sandboxStatus: null,
  setVertical: (v: Vertical) => set({ selectedVertical: v, selectedPrompt: null }),
  setPrompt: (p: DemoPrompt) => set({ selectedPrompt: p }),
  setSession: (s: DemoSession | null) => set({ currentSession: s }),
  appendStream: (c: string) => set((st) => ({ streamBuffer: st.streamBuffer + c })),
  resetStream: () => set({ streamBuffer: '', isStreaming: false }),
  setStreaming: (b: boolean) => set({ isStreaming: b }),
  setSandboxStatus: (s: SandboxStatus | null) => set({ sandboxStatus: s }),
}))
