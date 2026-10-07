import type { User } from "../data/auth";

interface Props {
  onOpenSimulator?: () => void;
  currentUser?: User | null;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  onSwitchToCitizenView?: () => void;
}

export default function Header({
  onOpenSimulator,
  currentUser,
  onOpenLogin,
  onSwitchToCitizenView,
}: Props) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Left — Title + Nav */}
      <div className="flex items-center gap-8">
        <div>
          <h1 className="text-sm font-bold text-primary leading-tight">VMC AI Complaint</h1>
          <h1 className="text-sm font-bold text-primary leading-tight">Dashboard</h1>
        </div>
        <nav className="hidden lg:flex items-center gap-6 text-sm">
          <span className="font-medium text-gray-900 border-b-2 border-primary pb-0.5">Control Center</span>
          <span className="text-gray-400">Vadodara Municipal Corp</span>
        </nav>
      </div>

      {/* Right — Simulator CTA + Search + Icons */}
      <div className="flex items-center gap-4">
        {onOpenSimulator && (
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all"
            title="Open AI IVR Call Simulator"
          >
            <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 00-3 3v4.5a3 3 0 006 0V4.5a3 3 0 00-3-3z" />
            </svg>
            <span>Test Call Simulator</span>
          </button>
        )}
        <div className="relative hidden md:block">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            placeholder="Quick search..."
            className="w-48 bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors relative">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {onSwitchToCitizenView && (
          <button
            onClick={onSwitchToCitizenView}
            className="hidden sm:flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
            title="Preview Public Citizen Portal"
          >
            <span>Citizen Portal</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </button>
        )}

        {currentUser ? (
          <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-gray-400 capitalize">{currentUser.role.replace("_", " ")}</p>
            </div>
            <div
              className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold shadow-xs"
              title={`${currentUser.name} (${currentUser.role})`}
            >
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "OP"}
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
