import { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { retrieveShare } from '../utils/api';

const CODE_LENGTH = 6;

export default function ReceivePage() {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const code = digits.join('');
  const isComplete = code.length === CODE_LENGTH && /^\d{6}$/.test(code);

  const handleChange = useCallback((index, value) => {
    // Accept only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    setError('');

    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    // Auto-advance to next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }, [digits]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (pasted.length === 0) return;

    setError('');
    const newDigits = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    // Focus the next empty input or the last one
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!isComplete || loading) return;

    setError('');
    setLoading(true);

    try {
      const result = await retrieveShare(code);
      navigate('/content', {
        state: {
          content: result.content,
          contentType: result.contentType,
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
  }, [code, isComplete, loading, navigate]);

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
          Receive something
        </h1>
        <p className="text-charcoal-light text-sm mt-1.5">
          Enter the 6-digit code from the sender.
        </p>
      </div>

      {/* Code input */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <fieldset>
          <legend className="sr-only">Enter 6-digit share code</legend>
          <div className="flex gap-2.5 sm:gap-3 justify-center" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
                aria-label={`Digit ${i + 1}`}
                className="w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl sm:text-3xl font-semibold
                           bg-white border border-warm-grey rounded-lg
                           text-charcoal tabular-nums
                           focus:border-burnt-orange focus:outline-none focus:ring-2 focus:ring-burnt-orange/20
                           transition-colors duration-150"
              />
            ))}
          </div>
        </fieldset>

        {/* Error message */}
        {error && (
          <div className="px-3 py-2.5 bg-error-light rounded-lg text-error text-sm text-center" role="alert">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          id="btn-open-share"
          disabled={!isComplete || loading}
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
              Looking up…
            </span>
          ) : (
            'Open share'
          )}
        </button>
      </form>
    </div>
  );
}
