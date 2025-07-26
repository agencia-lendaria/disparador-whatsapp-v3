import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string): string {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '')
  
  // Adiciona o código do país se não estiver presente
  if (!cleaned.startsWith('55') && cleaned.length === 11) {
    return `55${cleaned}`
  }
  
  return cleaned
}

export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  
  // Verifica se é um número brasileiro válido
  if (cleaned.startsWith('55')) {
    return cleaned.length === 13 && cleaned[4] === '9'
  }
  
  return cleaned.length === 11 && cleaned[2] === '9'
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'sent':
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/20'
    case 'running':
      return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20'
    case 'failed':
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20'
    case 'paused':
      return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/20'
    case 'scheduled':
      return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/20'
    default:
      return 'text-muted-foreground bg-accent/10'
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'scheduled':
      return 'Agendada'
    case 'running':
      return 'Executando'
    case 'paused':
      return 'Pausada'
    case 'completed':
      return 'Concluída'
    case 'failed':
      return 'Falhou'
    case 'pending':
      return 'Pendente'
    case 'sent':
      return 'Enviado'
    default:
      return status
  }
}