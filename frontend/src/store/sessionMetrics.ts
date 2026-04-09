import { create } from 'zustand'

interface SessionMetrics {
  threatsBlocked: number
  checksPassed: number
  autoRemediations: number
  scenariosRun: number
  addThreat: () => void
  addChecks: (count: number) => void
  addRemediation: (count: number) => void
  addScenario: () => void
  reset: () => void
}

export const useSessionMetrics = create<SessionMetrics>((set) => ({
  threatsBlocked: 0,
  checksPassed: 0,
  autoRemediations: 0,
  scenariosRun: 0,
  addThreat: () => set((s) => ({ threatsBlocked: s.threatsBlocked + 1 })),
  addChecks: (count: number) => set((s) => ({ checksPassed: s.checksPassed + count })),
  addRemediation: (count: number) => set((s) => ({ autoRemediations: s.autoRemediations + count })),
  addScenario: () => set((s) => ({ scenariosRun: s.scenariosRun + 1 })),
  reset: () => set({ threatsBlocked: 0, checksPassed: 0, autoRemediations: 0, scenariosRun: 0 }),
}))
