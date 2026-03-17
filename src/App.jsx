import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AuthPage from './components/AuthPage';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import TodoPage from './components/TodoPage';
import {
  authApi,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
  todoApi,
} from './lib/api';

function App() {
  const [todos, setTodos] = useState([]);
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState('checking');
  const [appError, setAppError] = useState('');
  const isAuthenticated = authState === 'authenticated';
  const isCheckingAuth = authState === 'checking';
  const publicRouteAccess = isCheckingAuth ? null : !isAuthenticated;

  useEffect(() => {
    async function bootstrapSession() {
      const token = getStoredToken();

      if (!token) {
        setAuthState('guest');
        return;
      }

      try {
        const [me, remoteTodos] = await Promise.all([
          authApi.getMe(token),
          todoApi.list(token),
        ]);
        setUser(me);
        setTodos(remoteTodos);
        setAuthState('authenticated');
      } catch (error) {
        clearStoredToken();
        setUser(null);
        setTodos([]);
        setAuthState('guest');
        setAppError(error.message);
      }
    }

    bootstrapSession();
  }, []);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const stats = {
    total: todos.length,
    completed: completedCount,
    pending: todos.length - completedCount,
  };

  const handleLogin = async (payload) => {
    setAppError('');
    const authResult = await authApi.login(payload);
    setStoredToken(authResult.token);

    const nextUser = authResult.user.email ? authResult.user : await authApi.getMe(authResult.token);
    const remoteTodos = await todoApi.list(authResult.token);

    setUser(nextUser);
    setTodos(remoteTodos);
    setAuthState('authenticated');
  };

  const handleRegister = async (payload) => {
    setAppError('');
    const authResult = await authApi.register(payload);
    setStoredToken(authResult.token);

    const nextUser = authResult.user.email ? authResult.user : await authApi.getMe(authResult.token);
    setUser(nextUser);
    setTodos([]);
    setAuthState('authenticated');
  };

  const handleAddTodo = async (title) => {
    const token = getStoredToken();
    const nextTodo = await todoApi.create({ title }, token);
    setTodos((current) => [nextTodo, ...current]);
  };

  const handleToggleTodo = async (id) => {
    const target = todos.find((todo) => todo.id === id);
    if (!target) return;

    const token = getStoredToken();
    const updatedTodo = await todoApi.update(id, { completed: !target.completed }, token);

    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, ...updatedTodo } : todo,
      ),
    );
  };

  const handleDeleteTodo = async (id) => {
    const token = getStoredToken();
    await todoApi.remove(id, token);
    setTodos((current) => current.filter((todo) => todo.id !== id));
  };

  const handleBulkComplete = async (ids, completed) => {
    const token = getStoredToken();
    await todoApi.bulkComplete(ids, completed, token);
    setTodos((current) =>
      current.map((todo) =>
        ids.includes(todo.id) ? { ...todo, completed } : todo,
      ),
    );
  };

  const handleLogout = () => {
    clearStoredToken();
    setTodos([]);
    setUser(null);
    setAuthState('guest');
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute isAllowed={publicRouteAccess} redirectTo="/todos">
            <AuthPage
              mode="login"
              title="Return to a calmer list."
              subtitle="Sign in to pick up where your priorities left off."
              buttonLabel="Sign In"
              alternateLabel="Need an account?"
              alternateHref="/register"
              alternateCta="Create one"
              onSubmit={handleLogin}
              appError={appError}
            />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute isAllowed={publicRouteAccess} redirectTo="/todos">
            <AuthPage
              mode="register"
              title="Build a ritual, not a backlog."
              subtitle="Create an account to organize work with a sharper daily rhythm."
              buttonLabel="Create Account"
              alternateLabel="Already registered?"
              alternateHref="/login"
              alternateCta="Sign in"
              onSubmit={handleRegister}
              appError={appError}
            />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/todos"
        element={
          <ProtectedRoute isAllowed={isAuthenticated} isLoading={isCheckingAuth}>
            <TodoPage
              todos={todos}
              user={user}
              stats={stats}
              onAddTodo={handleAddTodo}
              onToggleTodo={handleToggleTodo}
              onDeleteTodo={handleDeleteTodo}
              onBulkComplete={handleBulkComplete}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
