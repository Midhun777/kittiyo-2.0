import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="text-center space-y-10">
      {/* Wordmark */}
      <header className="space-y-3 pt-8">
        <h1 className="font-display text-4xl sm:text-5xl text-charcoal tracking-tight">
          LabDrop
        </h1>
        <p className="text-charcoal-light text-base sm:text-lg italic">
          Move words. Not apps.
        </p>
      </header>

      {/* Decorative divider */}
      <div className="flex items-center justify-center gap-3 text-warm-grey" aria-hidden="true">
        <span className="w-8 h-px bg-warm-grey-light"></span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 8h12M10 4l4 4-4 4" />
        </svg>
        <span className="w-8 h-px bg-warm-grey-light"></span>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          to="/send"
          id="action-send"
          className="block w-full py-4 px-6 bg-burnt-orange text-white font-semibold text-base rounded-lg
                     hover:bg-burnt-orange-hover active:scale-[0.98]
                     transition-all duration-150 ease-out
                     focus-visible:outline-burnt-orange"
        >
          Send something
        </Link>

        <Link
          to="/receive"
          id="action-receive"
          className="block w-full py-4 px-6 bg-white text-charcoal font-semibold text-base rounded-lg
                     border border-warm-grey
                     hover:border-charcoal-light hover:bg-ivory-warm active:scale-[0.98]
                     transition-all duration-150 ease-out"
        >
          Receive with a code
        </Link>
      </div>

      {/* Privacy note */}
      <div className="paper-edge pt-6 mt-8">
        <p className="text-xs text-charcoal-light/70 leading-relaxed max-w-xs mx-auto">
          Shares expire after 10 minutes. No accounts, no tracking.
          <br />
          <span className="text-charcoal-light/50 mt-1 inline-block">
            Don't share passwords or sensitive personal information.
            This tool is for quickly moving text between devices.
          </span>
        </p>
      </div>
    </div>
  );
}
