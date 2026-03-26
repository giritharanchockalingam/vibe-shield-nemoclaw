export type Vertical = 'edtech' | 'retail' | 'manufacturing' | 'travel'
export const VERTICALS: Record<Vertical, { label: string; icon: string; color: string }> = {
  edtech:        { label: 'EdTech',       icon: '🎓', color: '#7085ff' },
  retail:        { label: 'Retail',        icon: '🛍️', color: '#4fc87a' },
  manufacturing: { label: 'Manufacturing', icon: '🏭', color: '#f59e0b' },
  travel:        { label: 'Travel',        icon: '✈️', color: '#06b6d4' },
}
export type AgentType = 'coding' | 'research' | 'planning'
export type DemoSessionStatus = 'idle' | 'running' | 'complete' | 'error'
export interface DemoSession { id: string; client_id?: string; vertical: Vertical; agent_type: AgentType; prompt: string; output: string; status: DemoSessionStatus; tokens_used?: number; duration_ms?: number; created_at: string }
export interface DemoPrompt { id: string; vertical: Vertical; agent_type: AgentType; title: string; prompt: string; expected_wow_moment: string; tags: string[] }
export interface Client { id: string; name: string; vertical: Vertical; contact_name?: string; contact_email?: string; created_at: string }
export interface StreamChunk { type: 'token' | 'tool_call' | 'tool_result' | 'done' | 'error' | 'governance'; content: string; metadata?: Record<string, unknown> }
export interface PolicyRule { host: string; port: number; action: 'allow' | 'deny'; triggered?: boolean; purpose?: string }
export interface NemoClawComponent { status: string; type: string; commands?: string[]; policy_file?: string; isolation?: string[]; provider?: string; credentials?: string }
export interface SandboxStatus {
  name: string
  status: 'running' | 'stopped' | 'error'
  model: string
  nemoclaw_version?: string
  components?: Record<string, NemoClawComponent>
  policies: PolicyRule[]
  stats?: { total_events: number; blocked: number; allowed: number; block_rate: string }
  active_sessions: number
}
export interface DemoStore { selectedVertical: Vertical; selectedPrompt: DemoPrompt | null; currentSession: DemoSession | null; streamBuffer: string; isStreaming: boolean; sandboxStatus: SandboxStatus | null; setVertical: (v: Vertical) => void; setPrompt: (p: DemoPrompt) => void; setSession: (s: DemoSession | null) => void; appendStream: (c: string) => void; resetStream: () => void; setStreaming: (b: boolean) => void; setSandboxStatus: (s: SandboxStatus | null) => void }
