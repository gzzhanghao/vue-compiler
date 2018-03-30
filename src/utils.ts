import { Dictionary } from './types/lib'

const hashsum = require('hash-sum')

const idCache: Dictionary = Object.create(null)

export function genId(content: string): string {
  if (!idCache[content]) {
    idCache[content] = `data-v-${hashsum(content)}`
  }
  return idCache[content]
}
