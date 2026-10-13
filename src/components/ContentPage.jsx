import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

export default function ContentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const content = location.state?.content;
  const contentType = location.state?.contentType;
  const expiresAt = location.state?.expiresAt;

  // Redirect home if accessed directly without state
  useEffect(() => {
    if (!content) {
      navigate('/', { replace: true });
    }
  }, [content, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const expiryTime = new Date(expiresAt).getTime();

    function updateTimer() {
      const remaining = Math.max(0, expiryTime - Date.now());
      setTimeLeft(remaining);
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silently fail
      }
      document.body.removeChild(textArea);
    }
  }, [content]);

  const isUrl = contentType === 'url';

  // Validate the URL is safe before allowing "Open link"
  const isSafeUrl = (() => {
    if (!isUrl) return false;
    try {
      const url = new URL(content);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  })();

  if (!content) return null;

  const expired = timeLeft !== null && timeLeft <= 0;
  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60000) : 0;
  const seconds = timeLeft !== null ? Math.floor((timeLeft % 60000) / 1000) : 0;

  return (
    <div className="space-y-6">
      {/* Home link — clears state when leaving */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-charcoal-light/70 hover:text-charcoal transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M10 4L6 8l4 4" />
        </svg>
        Home
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-charcoal">
            {isUrl ? 'Shared link' : 'Shared text'}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${expired ? 'bg-error' : 'bg-olive'}`}></span>
            <span className={`text-xs tabular-nums ${expired ? 'text-error' : 'text-charcoal-light/50'}`}>
              {expired
                ? 'Expired'
                : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} remaining`}
            </span>
          </div>
        </div>
      </div>

      {/* Content display */}
      <div className="bg-white border border-warm-grey rounded-lg p-4 sm:p-5">
        {isUrl ? (
          <p className="text-charcoal break-all text-base leading-relaxed">{content}</p>
        ) : (
          <pre className="text-charcoal text-base leading-relaxed whitespace-pre-wrap break-words font-sans">
            {content}
          </pre>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          id="btn-copy-content"
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4
                     text-sm font-medium text-charcoal
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
              Copy
            </>
          )}
        </button>

        {isSafeUrl && (
          <a
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            id="btn-open-link"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4
                       text-sm font-medium text-white
                       bg-burnt-orange rounded-lg
                       hover:bg-burnt-orange-hover
                       active:scale-[0.98] transition-all duration-150"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open link
          </a>
        )}
      </div>

      {/* Receive another */}
      <div className="paper-edge pt-5">
        <Link
          to="/receive"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-burnt-orange hover:text-burnt-orange-hover transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Receive another
        </Link>
      </div>
    </div>
  );
}
