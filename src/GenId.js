import HashSum from 'hash-sum'

const idCache = Object.create(null)

/**
 * Generate unique id for specific file
 * @param {string} filePath
 * @return {string} Hash sum for the file path
 */
export default function GenId(filePath) {
  if (!idCache[filePath]) {
    idCache[filePath] = HashSum(filePath)
  }
  return idCache[filePath]
}
