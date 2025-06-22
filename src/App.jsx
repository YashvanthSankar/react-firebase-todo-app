import React, { useState, useEffect, use } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import { SiGoogle } from 'react-icons/si';
import Todo from './Todo.jsx';
import { collection, query, onSnapshot, updateDoc, doc, addDoc, deleteDoc, serverTimestamp, orderBy, where } from 'firebase/firestore';
import { db, auth, provider } from './firebase.js';
import { signInWithPopup, signOut } from 'firebase/auth';

const style = {
  bg: 'min-h-screen flex flex-col items-center justify-around bg-gradient-to-r from-[#e1eec3] to-[#f05053]',
  container: 'mt-6 mx-4 p-6 rounded-lg shadow-xl w-full max-w-md backdrop-blur-md bg-white/20 border border-white/30',
  heading: 'text-3xl font-bold text-center mb-4 select-none pointer-events-none',
  form: 'flex justify-between mb-2 gap-2',
  input: 'flex-grow border h-12 border-gray-300 p-2 rounded mb-4 bg-red-100 w-full focus:outline-none focus:border-red-500 transition-colors duration-200',
  addBtn: 'bg-red-500 h-12 w-12 text-white p-2 rounded hover:bg-red-600 transition-colors duration-200 border border-white-100 cursor-pointer',
  footer: 'text-center text-bold text-white select-none my-6',
  p: 'text-md',
  a: 'cursor-pointer text-bold text-red-600 hover:text-red-500 transition-colors duration-200',
  filter: 'flex items-center justify-between mb-6',
  options: 'w-full bg-red-100 text-black border border-red-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors duration-200',
  displayName: ' text-lg font-semibold text-center select-none pointer-events-none',
  loginBox: 'w-full flex justify-center mt-4 mb-2 mx-4',
  loginBtn: 'flex items-center justify-center bg-white text-black p-3 rounded-lg hover:bg-red-600 transition duration-200 shadow-lg border border-white/30',
  logoutBtn: 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200 shadow-lg border border-white/30',
  googleicon: 'w-6 h-6 mr-2',
  loggedInStyle: 'w-full flex justify-between items-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-md mt-4 max-w-md mx-auto',
};

function App() {
  const [todos, setTodos] = useState([]); // state to manage todos
  const [input, setInput] = useState(''); // state to manage input field
  const [filter, setFilter] = useState('all'); // state to manage filter
  const [user, setUser] = useState(null); // state to manage user authentication

  // create a new todo
  const createTodo = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please log in with Google to add a task!');
      return;
    }

    if(!input)
    {
      alert('Please enter a task');
      return;
    }
    await addDoc(collection(db, 'todos'), {
      text: input,
      done: false,
      pinned: false,
      createdAt: serverTimestamp(),
      uid: user?.uid, // store user ID with the todo
    });
    setInput(''); // clear input field after adding todo
  }

  // read todos from firestore
  useEffect(() => {
    if (!user) return; // if user is not logged in, do not fetch todos
    // This is where you would typically fetch todos from a database or API
    const q = query(collection(db, 'todos'), where('uid','==',user.uid), orderBy('createdAt', 'desc')); // filter todos by user ID
    const unsubscribe = onSnapshot(q, (querySnapshot) => {  
      const todosArray = [];
      querySnapshot.forEach((doc) => {
        todosArray.push({...doc.data(), id: doc.id });
      });
      todosArray.sort((a, b) => b.pinned - a.pinned);

      setTodos(todosArray);
    });
    return () => unsubscribe();

  }, [user]);

  //delete a todo
  const deleteTodo = async (id) => {
    await deleteDoc(doc(db, 'todos', id));
  }

  // toggle the completion status of a todo
  const toggleComplete = async (todo) => {
    await updateDoc(doc(db, 'todos', todo.id), {
      done: !todo.done,
    });
  }

  // filter todos based on the selected filter
  const getFilteredTodos = () => {
    let filtered = [...todos];

    switch (filter) {
      case 'completed':
        filtered = filtered.filter(todo => todo.done);
        break;
      case 'incomplete':
        filtered = filtered.filter(todo => !todo.done);
        break;
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      default:
        break;
    }

    // pin to top
    filtered.sort((a, b) => (b.pinned === true) - (a.pinned === true));

    return filtered;
  };

  // toggle pin status of a todo
  const togglePin = async (todo) => {
    await updateDoc(doc(db, 'todos', todo.id), {
      pinned: !todo.pinned,
    });
  };

  // Google login function
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('User signed in:', result.user);
      setUser(result.user); // Set user state on successful login
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };
  // Google logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null); // Clear user state on sign out
      setTodos([]); // Clear todos on sign out
      setInput(''); // Clear input field on sign out
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {   
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user); // Set user state when authenticated
      } else {
        setUser(null); // Clear user state when not authenticated
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);


  return (
    <div className={style.bg}>
      <div className={style.loginBox}>
        {user ? (
          <div className={style.loggedInStyle}><div className={style.displayName}>
              👋 Welcome, {user.displayName}
            </div>
            <button className={style.logoutBtn} onClick={logout}>
              Log out
            </button>
          </div>
        ) : (
          <button onClick={loginWithGoogle} className={style.loginBtn}>
            <img src="/google-icon.svg" alt="Google" className={style.googleicon} />
            Login with Google
          </button>
        )}
      </div>

      <div className={style.container}>
        <h3 className={style.heading}>Todo List</h3>
        <div className={style.filter}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={style.options}>
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="incomplete">Incomplete</option>
          <option value="newest">Sort by Date (Newest First)</option>
          <option value="oldest">Sort by Date (Oldest First)</option>
        </select>
        </div>
        <form className={style.form} onSubmit={createTodo}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value) } 
              className={style.input}  
              placeholder='Add a new task...'
            />
            <button type='submit'
              className={style.addBtn}>
              <AiOutlinePlus size={30}/>
            </button>
        </form>
        <ul>
          {getFilteredTodos().map((todo, index) => (
            <Todo 
              key={index} 
              todo={todo} 
              toggleComplete={toggleComplete}
              deleteTodo={deleteTodo} 
              togglePin={togglePin}
              />
          ))}
        </ul>
        
      </div>


      <footer className={style.footer}>
        <p className={style.p}>Made by <a className={style.a} href="https://www.linkedin.com/in/yashvanths/" target='_blank'>Yashvanth S</a></p>
        <p>Found a bug? <a className={style.a} href="https://forms.gle/your-form-id" target="_blank" rel="noopener noreferrer">Report it here</a></p>
      </footer>
    </div>
  )
}

export default App
