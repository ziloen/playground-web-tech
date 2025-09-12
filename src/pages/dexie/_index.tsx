import { useLiveQuery } from 'dexie-react-hooks'
import { v7 } from 'uuid'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '~/components/Select'
import OcticonInfinity16 from '~icons/octicon/infinity-16'
import { db } from './_db'

export default function DexiePage() {
  const [newTask, setNewTask] = useState('')
  const todos = useLiveQuery(() => db.todos.orderBy('createdAt').toArray(), [])

  if (!todos) return <div>Loading...</div>

  const recurrenceItems = [
    'none',
    'everyday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ].map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }))

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
              id: v7(),
              _v: 0,
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

        <Select defaultValue="none" items={recurrenceItems}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {recurrenceItems
              .map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <SelectItemText>
                    {item.label}
                  </SelectItemText>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </form>

      <ul className="ps-2 grid gap-2">
        {todos.map((todo, i) => (
          <li
            key={todo.id}
            className={clsx(
              'relative bg-dark-gray-700 px-4 py-3',
              todo.completed && 'line-through opacity-75',
            )}
          >
            <span
              onClick={() => {
                db.todos.where({ id: todo.id }).modify((todo) => {
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

            <OcticonInfinity16
              width={14}
              height={14}
              className="absolute start-1 top-1 opacity-50"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
