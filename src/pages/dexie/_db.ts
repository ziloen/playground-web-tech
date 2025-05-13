import type { Table } from 'dexie'
import { Dexie } from 'dexie'

interface Todo {
  id: string
  _v: number
  title: string
  completed: boolean
  createdAt: number
  updatedAt: number
}

class MyTodoAppDB extends Dexie {
  todos!: Table<Todo, string>

  constructor() {
    super('MyTodoApp')
    this.version(1).stores({
      todos: 'id, _v, title, completed, createdAt, updatedAt',
    })
  }
}

export const db = /* #__PURE__ */ new MyTodoAppDB()
