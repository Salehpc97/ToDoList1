import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [session, setSession] = useState(null);
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchTodos();
    }
  }, [session]);

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching todos:', error);
    } else {
      setTodos(data);
    }
  };

  const addTodo = async () => {
    if (task.trim() === '') return;

    const { data, error } = await supabase
      .from('todos')
      .insert([{ task, user_id: session.user.id }])
      .select();

    if (error) {
      console.error('Error adding todo:', error);
    } else {
      setTodos([...todos, ...data]);
      setTask('');
    }
  };

  const toggleComplete = async (id, is_complete) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_complete: !is_complete })
      .eq('id', id);

    if (error) {
      console.error('Error updating todo:', error);
    } else {
      fetchTodos();
    }
  };

  const deleteTodo = async (id) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
    } else {
      fetchTodos();
    }
  };

  if (!session) {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '50px' }}>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '50px' }}>
      <h1>Todo List</h1>
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Add a new task"
          style={{ flexGrow: 1, padding: '10px', marginRight: '10px' }}
        />
        <button onClick={addTodo} style={{ padding: '10px 20px' }}>Add</button>
      </div>
      <ul>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '10px',
              textDecoration: todo.is_complete ? 'line-through' : 'none',
            }}
          >
            <span style={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => toggleComplete(todo.id, todo.is_complete)}>
              {todo.task}
            </span>
            <button onClick={() => deleteTodo(todo.id)} style={{ padding: '5px 10px', background: 'red', color: 'white', border: 'none' }}>Delete</button>
          </li>
        ))}
      </ul>
      <button onClick={() => supabase.auth.signOut()} style={{ marginTop: '20px', padding: '10px 20px' }}>
        Sign Out
      </button>
    </div>
  );
}

export default App;