export function phoneToEmail(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '')
  return `${cleaned}@kh-invoice.app`
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === 'KHR') {
    return new Intl.NumberFormat('km-KH', {
      style: 'currency',
      currency: 'KHR',
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function statusColor(status: string): string {
  switch (status) {
    case 'paid':
      return '#16a34a'
    case 'partial':
      return '#d97706'
    case 'unpaid':
      return '#dc2626'
    default:
      return '#6b7280'
  }
}
