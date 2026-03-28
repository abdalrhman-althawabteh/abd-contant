import type { VideoInfo } from './youtube'

export interface HistoryItem {
  videoInfo: VideoInfo
  analyzedAt: string
}

const STORAGE_KEY = 'abd-content-history'

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveToHistory(videoInfo: VideoInfo): void {
  if (typeof window === 'undefined') return
  const history = getHistory()
  const existing = history.findIndex((item) => item.videoInfo.id === videoInfo.id)
  if (existing !== -1) history.splice(existing, 1)
  history.unshift({ videoInfo, analyzedAt: new Date().toISOString() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)))
}

export function removeFromHistory(videoId: string): void {
  if (typeof window === 'undefined') return
  const history = getHistory().filter((item) => item.videoInfo.id !== videoId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
