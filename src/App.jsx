import React, { useState, useEffect } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import { collection, query, onSnapshot, updateDoc, doc, addDoc, deleteDoc, serverTimestamp, orderBy, where } from 'firebase/firestore';
import { db, auth, provider } from './firebase.js';
import { signInWithPopup, signOut } from 'firebase/auth';
import Todo from './Todo.jsx';
import logo from '/logo-todolist.png';

const style = {
  bg: 'min-h-screen flex flex-col items-center justify-around bg-gradient-to-r from-[#e1eec3] to-[#f05053] px-4',
  container: 'mt-6 p-6 rounded-lg shadow-xl w-full max-w-md backdrop-blur-md bg-white/20 border border-white/30 mx-4',
  heading: 'text-3xl font-bold text-center mb-4 select-none pointer-events-none',
  form: 'flex justify-between mb-2 gap-2',
  input: 'flex-grow border h-12 border-gray-300 p-2 rounded mb-4 bg-red-100 w-full focus:outline-none focus:border-red-500 transition-colors duration-200',
  addBtn: 'bg-red-500 h-12 w-12 text-white p-2 rounded hover:bg-red-600 transition-colors duration-200 border border-white-100 cursor-pointer',
  footer: 'text-center text-bold text-white select-none my-6',
  p: 'text-md',
  a: 'cursor-pointer text-bold text-red-600 hover:text-red-500 transition-colors duration-200',
  filter: 'flex items-center justify-between mb-6',
  options: 'w-full bg-red-100 text-black border border-red-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors duration-200',
  displayName: 'text-lg font-semibold text-center select-none pointer-events-none',
  loginBox: 'w-full flex justify-center mt-4 mb-2 px-4',
  loginBtn: 'flex items-center justify-center bg-white text-black p-3 rounded-lg hover:bg-red-600 transition duration-200 shadow-lg border border-white/30',
  logoutBtn: 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200 shadow-lg border border-white/30',
  googleicon: 'w-6 h-6 mr-2',
  loggedInStyle: 'w-full flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-md mt-4 max-w-md mx-4',
  logoWrapper: 'w-full max-w-md flex items-center justify-center p-4',
  logo: 'h-10 w-auto',
  logoname: 'text-2xl font-bold text-black select-none pointer-events-none',
  quote: 'text-center text-md italic text-gray-800 max-w-md mx-auto select-none pointer-events-none',
  copyright: 'text-sm text-gray-600 mt-4 select-none pointer-events-none',
};

function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);

  const createTodo = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please log in with Google to add a task!');
    if (!input) return alert('Please enter a task');

    await addDoc(collection(db, 'todos'), {
      text: input,
      done: false,
      pinned: false,
      createdAt: serverTimestamp(),
      uid: user.uid,
    });
    setInput('');
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'todos'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const todosArray = [];
      querySnapshot.forEach((doc) => {
        todosArray.push({ ...doc.data(), id: doc.id });
      });
      todosArray.sort((a, b) => b.pinned - a.pinned);
      setTodos(todosArray);
    });
    return () => unsubscribe();
  }, [user]);

  const deleteTodo = async (id) => await deleteDoc(doc(db, 'todos', id));

  const toggleComplete = async (todo) => {
    await updateDoc(doc(db, 'todos', todo.id), {
      done: !todo.done,
    });
  };

  const togglePin = async (todo) => {
    await updateDoc(doc(db, 'todos', todo.id), {
      pinned: !todo.pinned,
    });
  };

  const getFilteredTodos = () => {
    let filtered = [...todos];
    switch (filter) {
      case 'completed':
        filtered = filtered.filter((todo) => todo.done);
        break;
      case 'incomplete':
        filtered = filtered.filter((todo) => !todo.done);
        break;
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
    }
    return filtered.sort((a, b) => b.pinned - a.pinned);
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setTodos([]);
      setInput('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setUser(user || null));
    return () => unsubscribe();
  }, []);

  return (
    <div className={style.bg}>
      {!user && (
      <>
      <div className={style.logoWrapper}>
        <img src={logo} alt="Logo" className={style.logo} />
        <h3 className={style.logoname}>doItBro</h3>
      </div>
      
      <blockquote className={style.quote}>
        “The bro who helps you get stuff done.”
      </blockquote>
      </>
      )}

      <div className={style.loginBox}>
        {user ? (
          <div className={style.loggedInStyle}>
            <div className={style.displayName}>👋 Welcome, {user.displayName}</div>
            <button className={style.logoutBtn} onClick={logout}>Log out</button>
          </div>
        ) : (
          <button onClick={loginWithGoogle} className={style.loginBtn}>
            <img src="/google-icon.svg" alt="Google" className={style.googleicon} />
            Login with Google
          </button>
        )}
      </div>

      <div className={style.container}>
        <h3 className={style.heading}>Your Todo List</h3>
        <div className={style.filter}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={style.options}>
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
            onChange={(e) => setInput(e.target.value)}
            className={style.input}
            placeholder="Add a new task..."
          />
          <button type="submit" className={style.addBtn}><AiOutlinePlus size={30} /></button>
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
        <p className={style.p}>
          Made by <a className={style.a} href="https://www.linkedin.com/in/yashvanths/" target="_blank" rel="noopener noreferrer">Yashvanth S</a>
        </p>
        <p>
          Found a bug? <a className={style.a} href="https://forms.gle/UJGtM3Z9v9gCyVgMA" target="_blank" rel="noopener noreferrer">Report it here</a>
        </p>

        <p className={style.copyright}>
          © {new Date().getFullYear()} doItBro. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;
