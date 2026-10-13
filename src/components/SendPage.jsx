import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createShare } from '../utils/api';

const MAX_LENGTH = 10000;

export default function SendPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const charCount = content.length;
  const isEmpty = content.trim().length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (isEmpty || loading) return;

    setError('');
    setLoading(true);

    try {
      const result = await createShare(content);
      navigate('/code', {
        state: {
          code: result.code,
          expiresAt: result.expiresAt,
        },
        replace: true,
      });
    } catch (err) {
      if (err.name === 'ApiError') {
        setError(err.message);
      } else {
        setError("Couldn't connect. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-charcoal-light/70 hover:text-charcoal transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M10 4L6 8l4 4" />
        </svg>
        Back
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
          Send something
        </h1>
        <p className="text-charcoal-light text-sm mt-1.5">
          Paste text or a link. Get a code.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label htmlFor="share-content" className="sr-only">
            Content to share
          </label>
          <textarea
            id="share-content"
            value={content}
            onChange={(e) => {
              if (e.target.value.length <= MAX_LENGTH) {
                setContent(e.target.value);
                setError('');
              }
            }}
            placeholder="Paste your text or URL here…"
            rows={6}
            maxLength={MAX_LENGTH}
            autoFocus
            className="w-full px-4 py-3 bg-white border border-warm-grey rounded-lg
                       text-charcoal text-base leading-relaxed
                       placeholder:text-warm-grey
                       resize-y min-h-[120px] max-h-[320px]
                       focus:border-burnt-orange focus:outline-none focus:ring-2 focus:ring-burnt-orange/20
                       transition-colors duration-150"
          />
          {/* Character counter */}
          <div className="flex justify-end mt-1.5">
            <span
              className={`text-xs tabular-nums ${
                charCount > MAX_LENGTH * 0.9
                  ? 'text-error'
                  : 'text-charcoal-light/40'
              }`}
            >
              {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-3 py-2.5 bg-error-light rounded-lg text-error text-sm" role="alert">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          id="btn-generate"
          disabled={isEmpty || loading}
          className="w-full py-3.5 px-6 bg-burnt-orange text-white font-semibold text-base rounded-lg
                     hover:bg-burnt-orange-hover active:scale-[0.98]
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                     transition-all duration-150 ease-out"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating…
            </span>
          ) : (
            'Generate code'
          )}
        </button>
      </form>
    </div>
  );
}
