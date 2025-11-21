import type { Occurrence } from '@domain/types'

export const initialOccurrences: Occurrence[] = [
  {
    id: '1',
    title: 'Rampa com inclinação excessiva',
    latitude: -23.561732,
    longitude: -46.656609,
    level: 'amarelo',
    disabilityTypes: ['motora'],
    category: 'edificios_publicos',
    problemType: 'rampa_inadequada',
    photoUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><rect width='100%' height='100%' fill='%23F9FAFB'/><rect x='12' y='12' width='296' height='176' rx='8' fill='%23E5E7EB'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%230B74DE'>Rampa com inclinação excessiva</text></svg>",
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Calçada quebrada',
    latitude: -23.560812,
    longitude: -46.654102,
    level: 'vermelho',
    disabilityTypes: ['visual', 'motora'],
    category: 'calcadas',
    problemType: 'calcada_quebrada',
    photoUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><rect width='100%' height='100%' fill='%23F9FAFB'/><rect x='12' y='12' width='296' height='176' rx='8' fill='%23E5E7EB'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%23A61222'>Calçada quebrada</text></svg>",
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Sinalização tátil adequada',
    latitude: -23.55995,
    longitude: -46.6592,
    level: 'verde',
    disabilityTypes: ['visual'],
    category: 'meios_transporte',
    problemType: 'outro',
    photoUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><rect width='100%' height='100%' fill='%23F9FAFB'/><rect x='12' y='12' width='296' height='176' rx='8' fill='%23E5E7EB'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%23137B39'>Sinalização tátil adequada</text></svg>",
    createdAt: new Date().toISOString()
  }
]