import { FaRegTrashAlt, FaThumbtack } from 'react-icons/fa'


const style = {
  li: 'flex justify-between bg-red-500 p-4 my-2 border border-white/30 p-4 rounded-lg',
  row: 'flex items-center gap-4',
  input: 'h-6 w-6 rounded border border-red-800 cursor-pointer accent-red-500',
  text: 'text-lg font-semibold cursor-pointer select-none pointer-events-none',
  textDone: 'text-lg font-semibold line-through text-gray-800 cursor-pointer select-none pointer-events-none',
  btns: 'flex items-center gap-2',
  pin: 'bg-red-300 text-black p-2 rounded cursor-pointer transition-colors duration-200 select-none hover:bg-white',
  unpin: 'hover:bg-white text-black p-2 select-none rounded cursor-pointer transition-colors duration-200',
}

const Todo = ({todo, toggleComplete, deleteTodo, togglePin}) => {
  return (
    <li className={style.li}>
        <div className={style.row}>
            <input onChange={() => toggleComplete(todo)} className={style.input} type="checkbox" checked={todo.done ? 'checked' : ''} />
            <p onClick={() => toggleComplete(todo)} className={todo.done ? style.textDone : style.text}>{todo.text}</p>
        </div>
        <div className={style.btns}>
          <button onClick={() => togglePin(todo)} className={todo.pinned ? style.pin : style.unpin}>
            < FaThumbtack />
          </button>
          <button onClick={() => deleteTodo(todo.id)}>
            <FaRegTrashAlt />
          </button>
        </div>
    </li>
  )
}

export default Todo