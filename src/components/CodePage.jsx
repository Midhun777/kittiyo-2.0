import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

export default function CodePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const code = location.state?.code;
  const expiresAt = location.state?.expiresAt;

  // Redirect home if accessed directly without state
  useEffect(() => {
    if (!code || !expiresAt) {
      navigate('/', { replace: true });
    }
  }, [code, expiresAt, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const expiryTime = new Date(expiresAt).getTime();

    function updateTimer() {
      const remaining = Math.max(0, expiryTime - Date.now());
      setTimeLeft(remaining);

      if (remaining <= 0) {
        return;
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopy = useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / insecure contexts
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silently fail — user can manually select and copy
      }
      document.body.removeChild(textArea);
    }
  }, [code]);

  if (!code) return null;

  const expired = timeLeft !== null && timeLeft <= 0;
  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60000) : 0;
  const seconds = timeLeft !== null ? Math.floor((timeLeft % 60000) / 1000) : 0;

  return (
    <div className="space-y-8 text-center">
      {/* Header */}
      <div className="space-y-2 pt-4">
        <div className="flex items-center justify-center gap-2 text-olive" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
          Your code is ready
        </h1>
        <p className="text-charcoal-light text-sm">
          Enter this code on the other device.
        </p>
      </div>

      {/* Code display */}
      <div className="space-y-4">
        <div
          className="bg-white border border-warm-grey rounded-xl py-6 px-4 select-all"
          aria-label={`Share code: ${code.split('').join(' ')}`}
        >
          <span className="font-display text-5xl sm:text-6xl tracking-[0.25em] text-charcoal tabular-nums">
            {code}
          </span>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          id="btn-copy-code"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-charcoal
                     bg-white border border-warm-grey rounded-lg
                     hover:border-charcoal-light hover:bg-ivory-warm
                     active:scale-[0.98] transition-all duration-150"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy code
            </>
          )}
        </button>
      </div>

      {/* Timer */}
      <div className="space-y-2">
        {expired ? (
          <p className="text-error text-sm font-medium">
            This code has expired.
          </p>
        ) : (
          <>
            {/* Progress ring */}
            <div className="flex items-center justify-center gap-2">
              <span
                className={`text-2xl font-semibold tabular-nums ${
                  timeLeft !== null && timeLeft < 60000
                    ? 'text-error'
                    : 'text-charcoal'
                }`}
              >
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
            <p className="text-xs text-charcoal-light/50">
              remaining
            </p>
          </>
        )}
      </div>

      {/* Decorative divider */}
      <div className="paper-edge pt-6">
        <Link
          to="/send"
          id="btn-new-share"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-burnt-orange hover:text-burnt-orange-hover transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create another share
        </Link>
      </div>
    </div>
  );
}
