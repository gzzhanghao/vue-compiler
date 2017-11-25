import HashSum from 'hash-sum'

const idCache = Object.create(null)

/**
 * Generate unique id for specific file
 * @param {string} content
 * @return {string} Hash sum for the file path
 */
export default function GenId(content) {
  if (!idCache[content]) {
    idCache[content] = `data-v-${HashSum(content)}`
  }
  return idCache[content]
}
