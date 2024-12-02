// composables/useUrlStorage.ts
import { openDB, type IDBPDatabase } from 'idb'

interface UrlSet {
  id?: string
  name: string
  urls: string[]
  createdAt: number
  updatedAt: number
}

interface UrlStorage {
  db: IDBPDatabase | null
  saveUrlSet: (name: string, urls: string[]) => Promise<UrlSet>
  getUrlSets: () => Promise<UrlSet[]>
  getUrlSet: (id: number) => Promise<UrlSet | undefined>
  deleteUrlSet: (id: number) => Promise<void>
  updateUrlSet: (id: number, urls: string[]) => Promise<UrlSet>
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
    return { ...urlSet, id }
  }

  async function getUrlSets(): Promise<UrlSet[]> {
    const database = await initDB()
    return database.getAllFromIndex('urlSets', 'updatedAt')
  }

  async function getUrlSet(id: number): Promise<UrlSet | undefined> {
    const database = await initDB()
    return database.get('urlSets', id)
  }

  async function deleteUrlSet(id: number): Promise<void> {
    const database = await initDB()
    await database.delete('urlSets', id)
  }

  async function updateUrlSet(id: number, urls: string[]): Promise<UrlSet> {
    const database = await initDB()
    const existing = await database.get('urlSets', id)
    if (!existing) {
      throw new Error('URL set not found')
    }

    const updated: UrlSet = {
      ...existing,
      urls,
      updatedAt: Date.now(),
    }
    await database.put('urlSets', updated)
    return updated
  }

  return {
    saveUrlSet,
    getUrlSets,
    getUrlSet,
    deleteUrlSet,
    updateUrlSet,
  }
}