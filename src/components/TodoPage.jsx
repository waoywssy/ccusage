import { useMemo, useState } from 'react';

function TodoPage({
  todos,
  user,
  stats,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onBulkComplete,
  onLogout,
}) {
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  const visibleTodos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return todos.filter((todo) => {
      const matchesQuery = normalizedQuery
        ? todo.title.toLowerCase().includes(normalizedQuery)
        : true;
      const matchesFilter =
        filter === 'all' ||
        (filter === 'open' && !todo.completed) ||
        (filter === 'done' && todo.completed);

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, todos]);

  const selectedVisibleCount = selectedIds.filter((id) =>
    visibleTodos.some((todo) => todo.id === id),
  ).length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      await onAddTodo(trimmed);
      setTitle('');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  const selectAllVisible = () => {
    setSelectedIds(visibleTodos.map((todo) => todo.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkMarkComplete = async () => {
    if (!selectedIds.length) return;

    setIsBulkSaving(true);
    try {
      await onBulkComplete(selectedIds, true);
      setSelectedIds([]);
    } finally {
      setIsBulkSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3ecdf] px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <header className="grid gap-6 rounded-[2rem] bg-ink px-8 py-8 text-sand shadow-card lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.35em] text-gold">Todo Console</p>
            <div>
              <h1 className="font-display text-5xl leading-none sm:text-6xl">A list with pulse.</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-sand/70">
                Capture tasks fast, clear them with intent, and keep the day moving in one quiet flow.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-sand/70">
              <span className="rounded-full border border-sand/20 px-4 py-2">{user.name}</span>
              <span>{user.email}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ['Total', stats.total],
              ['Done', stats.completed],
              ['Open', stats.pending],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.5rem] border border-sand/15 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-sand/60">{label}</p>
                <p className="mt-3 font-display text-4xl">{value}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.86fr_1.14fr]">
          <aside className="rounded-[2rem] border border-ink/10 bg-white/80 p-6 shadow-card backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-ember">New Entry</p>
                <h2 className="mt-2 font-display text-3xl">Add a fresh task</h2>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="text-sm font-semibold text-ink/50 transition hover:text-ember"
              >
                Sign out
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <textarea
                rows="5"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Write the next thing that matters..."
                className="w-full rounded-[1.5rem] border border-ink/10 bg-sand/70 px-4 py-4 text-base outline-none transition focus:border-ember focus:bg-white"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center rounded-full bg-ember px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : 'Add Todo'}
              </button>
            </form>
          </aside>

          <section className="rounded-[2rem] border border-ink/10 bg-white/70 p-6 shadow-card">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-moss">Task Archive</p>
                <h2 className="mt-2 font-display text-3xl">Today&apos;s stack</h2>
              </div>
              <p className="text-sm text-ink/50">Search, filter, and complete a batch when the sprint closes.</p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search todos..."
                className="w-full rounded-full border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ember"
              />
              <div className="flex flex-wrap gap-2">
                {[
                  ['all', 'All'],
                  ['open', 'Open'],
                  ['done', 'Done'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                      filter === value
                        ? 'bg-ink text-sand'
                        : 'border border-ink/10 bg-white text-ink/60 hover:border-ember hover:text-ember'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-ink/10 bg-sand/60 p-4">
              <p className="text-sm text-ink/60">
                {selectedVisibleCount} selected of {visibleTodos.length} visible
              </p>
              <button
                type="button"
                onClick={selectAllVisible}
                className="rounded-full border border-ink/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/60 transition hover:border-ember hover:text-ember"
              >
                Select visible
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-full border border-ink/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/60 transition hover:border-ember hover:text-ember"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={!selectedIds.length || isBulkSaving}
                onClick={handleBulkMarkComplete}
                className="rounded-full bg-moss px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBulkSaving ? 'Updating...' : 'Complete selected'}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {visibleTodos.map((todo) => (
                <article
                  key={todo.id}
                  className={`grid gap-4 rounded-[1.5rem] border px-5 py-4 transition sm:grid-cols-[auto_1fr_auto] sm:items-center ${
                    todo.completed
                      ? 'border-moss/20 bg-moss/10'
                      : 'border-ink/10 bg-sand/50 hover:-translate-y-0.5 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(todo.id)}
                      onChange={() => toggleSelection(todo.id)}
                      className="h-5 w-5 rounded border-ink/20 text-ember focus:ring-ember"
                      aria-label="Select todo"
                    />
                    <button
                      type="button"
                      onClick={() => onToggleTodo(todo.id)}
                      className={`h-11 w-11 rounded-full border text-sm font-semibold transition ${
                        todo.completed
                          ? 'border-moss bg-moss text-white'
                          : 'border-ink/15 bg-white text-ink hover:border-ember hover:text-ember'
                      }`}
                      aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {todo.completed ? 'Done' : 'Open'}
                    </button>
                  </div>

                  <div>
                    <h3
                      className={`text-lg font-medium ${
                        todo.completed ? 'text-ink/45 line-through' : 'text-ink'
                      }`}
                    >
                      {todo.title}
                    </h3>
                    <p className="mt-1 text-sm text-ink/45">
                      {todo.completed ? 'Completed and archived for the day.' : 'Awaiting completion.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteTodo(todo.id)}
                    className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/55 transition hover:border-ember hover:text-ember"
                  >
                    Delete
                  </button>
                </article>
              ))}

              {!visibleTodos.length && (
                <div className="rounded-[1.5rem] border border-dashed border-ink/15 bg-white/60 px-5 py-10 text-center">
                  <p className="font-display text-3xl">No matching tasks</p>
                  <p className="mt-2 text-sm text-ink/50">
                    Adjust the search term or switch the current filter.
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

export default TodoPage;
