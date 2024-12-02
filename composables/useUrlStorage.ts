import { openDB, type IDBPDatabase } from 'idb'

export interface UrlSet {
  id?: string
  name: string
  urls: string[]
  createdAt: number
  updatedAt: number
}

export function useUrlStorage() {
  const db = ref<IDBPDatabase | null>(null)

  async function initDB() {
    if (!db.value) {
      db.value = await openDB('screenshot-tool', 1, {
        upgrade(db) {
          const store = db.createObjectStore('urlSets', {
            keyPath: 'id',
            autoIncrement: true,
          })
          store.createIndex('name', 'name')
          store.createIndex('updatedAt', 'updatedAt')
        },
      })
    }
    return db.value
  }

  async function saveUrlSet(name: string, urls: string[]): Promise<UrlSet> {
    const database = await initDB()
    const timestamp = Date.now()
    const urlSet: UrlSet = {
      name,
      urls,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const id = await database.add('urlSets', urlSet)
    return { ...urlSet, id: id.toString() }
  }

  async function getUrlSets(): Promise<UrlSet[]> {
    const database = await initDB()
    const sets = await database.getAllFromIndex('urlSets', 'updatedAt')
    return sets.map(set => ({
      ...set,
      id: set.id?.toString()
    }))
  }

  async function getUrlSet(id: string | number): Promise<UrlSet | undefined> {
    const database = await initDB()
    const set = await database.get('urlSets', typeof id === 'string' ? parseInt(id) : id)
    return set ? { ...set, id: set.id?.toString() } : undefined
  }

  async function deleteUrlSet(id: string | number): Promise<void> {
    const database = await initDB()
    await database.delete('urlSets', typeof id === 'string' ? parseInt(id) : id)
  }

  async function updateUrlSet(id: string | number, urls: string[]): Promise<UrlSet> {
    const database = await initDB()
    const numericId = typeof id === 'string' ? parseInt(id) : id
    const existing = await database.get('urlSets', numericId)

    if (!existing) {
      throw new Error('URL set not found')
    }

    const updated: UrlSet = {
      ...existing,
      id: existing.id?.toString(),
      urls,
      updatedAt: Date.now(),
    }

    await database.put('urlSets', { ...updated, id: numericId }) // Use numeric ID for database operation
    return updated // Return with string ID
  }

  return {
    saveUrlSet,
    getUrlSets,
    getUrlSet,
    deleteUrlSet,
    updateUrlSet,
  }
}