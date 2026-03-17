import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ isAllowed, isLoading, children }) {
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sand px-6 text-ink">
        <div className="rounded-[2rem] border border-ink/10 bg-white/80 px-8 py-6 shadow-card">
          <p className="text-sm uppercase tracking-[0.3em] text-ember">Loading session</p>
          <h1 className="mt-3 font-display text-4xl">Checking access...</h1>
        </div>
      </main>
    );
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function PublicOnlyRoute({ isAllowed, redirectTo, children }) {
  if (isAllowed === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sand px-6 text-ink">
        <div className="rounded-[2rem] border border-ink/10 bg-white/80 px-8 py-6 shadow-card">
          <p className="text-sm uppercase tracking-[0.3em] text-ember">Loading session</p>
          <h1 className="mt-3 font-display text-4xl">Preparing workspace...</h1>
        </div>
      </main>
    );
  }

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
