export type AccessibilityLevel = 'verde' | 'amarelo' | 'vermelho'

export type DisabilityType = 'motora' | 'visual' | 'auditiva' | 'multipla'

export type LocationCategory = 'calcadas' | 'edificios_publicos' | 'meios_transporte'

export type ProblemType =
  | 'calcada_quebrada'
  | 'buraco'
  | 'desnivel'
  | 'obstaculo'
  | 'falta_rampa'
  | 'rampa_inadequada'
  | 'acesso_bloqueado'
  | 'banheiro_inacessivel'
  | 'ponto_sem_rampa'
  | 'onibus_sem_elevador'
  | 'estacao_sem_acesso'
  | 'outro'

export interface Evaluation {
  userId: string
  rating: number
  comment?: string
  createdAt: string
}

export interface Occurrence {
  id: string
  title: string
  description?: string
  latitude: number
  longitude: number
  level: AccessibilityLevel
  disabilityTypes: DisabilityType[]
  category: LocationCategory
  problemType: ProblemType
  problemOtherText?: string
  photoUrl?: string
  createdAt: string
  createdBy?: string
  evaluations?: Evaluation[]
}