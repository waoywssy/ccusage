import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const fieldsByMode = {
  login: [
    { name: 'email', type: 'email', label: 'Email Address', placeholder: 'mila@example.com' },
    { name: 'password', type: 'password', label: 'Password', placeholder: 'Enter your password' },
  ],
  register: [
    { name: 'email', type: 'email', label: 'Email Address', placeholder: 'mila@example.com' },
    { name: 'password', type: 'password', label: 'Password', placeholder: 'Create a password' },
  ],
};

function AuthPage({
  mode,
  title,
  subtitle,
  buttonLabel,
  alternateLabel,
  alternateHref,
  alternateCta,
  onSubmit,
  appError,
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fields = fieldsByMode[mode];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onSubmit(form);
      navigate('/todos');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-sand px-6 py-10 text-ink">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(217,72,31,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(77,107,87,0.18),_transparent_30%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between rounded-[2rem] border border-ink/10 bg-ink px-8 py-10 text-sand shadow-card sm:px-10">
          <div className="space-y-6">
            <span className="inline-flex w-fit rounded-full border border-sand/20 px-4 py-2 text-xs uppercase tracking-[0.35em] text-sand/70">
              Daily Focus System
            </span>
            <div className="space-y-4">
              <h1 className="max-w-lg font-display text-5xl leading-[0.95] sm:text-6xl">
                {title}
              </h1>
              <p className="max-w-md text-base leading-7 text-sand/70">{subtitle}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['03', 'curated views'],
              ['12', 'focus slots'],
              ['24h', 'momentum retained'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-[1.5rem] border border-sand/15 bg-sand/5 p-5">
                <p className="font-display text-3xl">{value}</p>
                <p className="mt-2 text-sm uppercase tracking-[0.2em] text-sand/60">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-xl rounded-[2rem] border border-ink/10 bg-white/80 p-8 shadow-card backdrop-blur sm:p-10"
          >
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-ember">Workspace Access</p>
              <h2 className="font-display text-4xl leading-tight text-ink">
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </h2>
            </div>

            <div className="mt-8 space-y-5">
              {fields.map((field) => (
                <label key={field.name} className="block space-y-2">
                  <span className="text-sm font-medium text-ink/80">{field.label}</span>
                  <input
                    required
                    name={field.name}
                    type={field.type}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full rounded-2xl border border-ink/10 bg-sand/60 px-4 py-3 text-base text-ink outline-none transition focus:border-ember focus:bg-white"
                  />
                </label>
              ))}
            </div>

            {(errorMessage || appError) && (
              <div className="mt-5 rounded-2xl border border-ember/20 bg-ember/10 px-4 py-3 text-sm text-ember">
                {errorMessage || appError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.25em] text-sand transition hover:bg-ember disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : buttonLabel}
            </button>

            <p className="mt-6 text-center text-sm text-ink/60">
              {alternateLabel}{' '}
              <Link to={alternateHref} className="font-semibold text-ember transition hover:text-ink">
                {alternateCta}
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

export default AuthPage;
