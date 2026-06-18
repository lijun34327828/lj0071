import type { Package } from '../../shared/types.js';

export const PACKAGES: Package[] = [
  {
    id: 'times-10',
    name: '10次卡',
    type: 'times',
    hours: 10,
    durationDays: 365,
    price: 880,
  },
  {
    id: 'times-30',
    name: '30次卡',
    type: 'times',
    hours: 30,
    durationDays: 365,
    price: 2280,
  },
  {
    id: 'monthly-1',
    name: '月度卡',
    type: 'monthly',
    hours: 30,
    durationDays: 30,
    price: 598,
  },
  {
    id: 'monthly-3',
    name: '季度卡',
    type: 'monthly',
    hours: 90,
    durationDays: 90,
    price: 1580,
  },
];

export function getPackageById(id: string): Package | undefined {
  return PACKAGES.find((p) => p.id === id);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
