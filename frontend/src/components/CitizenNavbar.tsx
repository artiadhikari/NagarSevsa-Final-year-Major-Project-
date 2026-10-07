import type { User } from "../data/auth";

interface Props {
  currentUser: User | null;
  onOpenLogin: () => void;
  onOpenSimulator: () => void;
  onGoToDashboard?: () => void;
  onLogout?: () => void;
}

export default function CitizenNavbar({
  currentUser,
  onOpenLogin,
  onOpenSimulator,
  onGoToDashboard,
  onLogout,
}: Props) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        {/* Left: Brand / Crest */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#0a1e3d] text-white flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 tracking-tight leading-none">
                Vadodara Municipal Corporation
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Official Portal
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Automated AI Civic Grievance Redressal System</p>
          </div>
        </div>

        {/* Center: Toll-Free Helpline Badge */}
        <div className="hidden lg:flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>24/7 AI IVR Helpline:</span>
          <span className="font-mono font-bold">1800-233-1000</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 bg-[#0a1e3d] hover:bg-[#15325b] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-all border border-blue-900"
            title="Open Voice Call Simulator (for Demonstration)"
          >
            <svg className="w-3.5 h-3.5 animate-pulse text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 00-3 3v4.5a3 3 0 006 0V4.5a3 3 0 00-3-3z" />
            </svg>
            <span className="hidden sm:inline">Test Call Simulator</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onGoToDashboard}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs"
              >
                <span>Officer Dashboard</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <button
                onClick={onLogout}
                className="px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                title="Logout"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 border border-gray-300 hover:border-primary hover:text-primary text-gray-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all bg-white"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              <span>Officer Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
