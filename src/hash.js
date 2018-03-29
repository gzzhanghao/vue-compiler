import hashsum from 'hash-sum'

const idCache = Object.create(null)

/**
 * Generate unique id for specific file
 * @param {string} content
 * @return {string} Hash sum for the file path
 */
export default function hash(content) {
  if (!idCache[content]) {
    idCache[content] = `data-v-${hashsum(content)}`
  }
  return idCache[content]
}
