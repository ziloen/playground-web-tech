import type { EntityTable, Table } from 'dexie'
import { Dexie } from 'dexie'

interface Todo {
  id: string
  _v: number
  title: string
  completed: boolean
  createdAt: number
  updatedAt: number
  recurrence?: {
    composite: 'replace' | 'add'
    day:
      | 'monday'
      | 'tuesday'
      | 'wednesday'
      | 'thursday'
      | 'friday'
      | 'saturday'
      | 'sunday'
      | 'everyday'
    count: number
    lastDate: number
    currentCount: number
  }
}

interface Settings {
  id: string
  showBadge: boolean
}

class MyTodoAppDB extends Dexie {
  todos!: EntityTable<Todo, 'id'>
  settings!: EntityTable<Settings, 'id'>

  constructor() {
    super('MyTodoApp')
    this.version(1).stores({
      todos: 'id, _v, title, completed, createdAt, updatedAt',
      settings: 'id',
    })
  }
}

export const db = /* #__PURE__ */ new MyTodoAppDB()
