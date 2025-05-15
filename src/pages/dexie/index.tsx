import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './_db'

export default function DexiePage() {
  const [newTask, setNewTask] = useState('')
  const todos = useLiveQuery(() => db.todos.orderBy('createdAt').toArray(), [])

  if (!todos) return <div>Loading...</div>

  return (
    <div>
      <h1>Todo App</h1>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (!newTask.trim()) return

          try {
            await db.todos.add({
              title: newTask.trim(),
              id: crypto.randomUUID(),
              _v: 1,
              completed: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            })
            setNewTask('')
          } catch (error) {
            console.error('Error adding task:', error)
          }
        }}
      >
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.currentTarget.value)}
          placeholder="What needs to be done?"
        />

        <button type="submit">Add task</button>
      </form>

      <ul>
        {todos.map((todo, i) => (
          <li key={todo.id} className={clsx(todo.completed && 'line-through opacity-75')}>
            <span
              onClick={() => {
                db.todos.where('id').equals(todo.id).modify((todo) => {
                  todo.completed = !todo.completed
                  todo.updatedAt = Date.now()
                  todo._v++
                })
              }}
            >
              {todo.title}
            </span>

            <button
              onClick={() => {
                db.todos.delete(todo.id)
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
