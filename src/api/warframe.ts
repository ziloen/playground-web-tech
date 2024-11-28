import type { LiteralUnion } from 'type-fest'

type News = {
  id: string
  message: string
  link: string
  imageLink: string
  priority: boolean
  date: string
  eta: string
  update: false
  primeAccess: boolean
  stream: boolean
  translations: Record<string, string>
  asString: string
}

type Alert = {
  id: string
  activation: string
  startString: string
  expiry: string
  active: boolean
  mission: {
    description: string
    node: string
    nodeKey: string
    type: string
    typeKey: string
    faction: string
    factionKey: string
    reward: unknown
    minEnemyLevel: number
    maxEnemyLevel: number
    maxWaveNum: number
    nightmare: boolean
    archwingRequired: boolean
    isSharkwing: boolean
    levelOverride: string
    enemySpec: string
    advancedSpawners: []
    requiredItems: []
    levelAuras: []
  }
  eta: string
  rewardTypes: LiteralUnion<'other', string>[]
  tag: LiteralUnion<'LotusGift', string>
}

export type WorldState = {
  alerts: Alert[]
  news: News[]
  timestamp: string
}

export function getWorldStateApi(): Promise<WorldState> {
  return fetch('https://api.warframestat.us/pc').then((res) => res.json())
}
