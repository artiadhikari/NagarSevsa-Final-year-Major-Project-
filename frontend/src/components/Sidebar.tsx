import type { User } from "../data/auth";

export type Page = "overview" | "live_feed" | "ward_status" | "employees" | "audit_log" | "new_complaint";

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
  currentUser?: User | null;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({
  activePage,
  onNavigate,
  currentUser,
  onOpenLogin,
  onLogout,
}: Props) {
  const navItems: { icon: string; label: string; page: Page }[] = [
    { icon: "grid", label: "Overview", page: "overview" },
    { icon: "radio", label: "Live Feed", page: "live_feed" },
    { icon: "map", label: "Ward Status", page: "ward_status" },
    { icon: "users", label: "Employees", page: "employees" },
    { icon: "clipboard", label: "Audit Log", page: "audit_log" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 flex flex-col z-30">
      {/* Logo — dark navy header */}
      <div className="px-4 py-5 flex items-center gap-3 bg-[#0a1e3d]">
        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-tight">Automated Call</p>
          <p className="text-white text-sm font-semibold leading-tight">Center</p>
          <p className="text-blue-300/60 text-[10px]">Vadodara Municipal Corp</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 mt-4 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
              activePage === item.page
                ? "bg-primary text-white font-medium"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-6 space-y-3">
        {currentUser ? (
          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Logged In</span>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                {currentUser.role.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-800 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{currentUser.email}</p>
            {currentUser.role === "ward_officer" && (
              <div className="mt-1.5 pt-1.5 border-t border-gray-200/60 flex items-center justify-between text-[10px]">
                <span className="text-gray-500">Assigned Ward:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-150">
                  Ward {currentUser.ward || "12"}
                </span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-primary hover:text-primary text-gray-700 text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Officer Sign In
          </button>
        )}
      </div>
    </aside>
  );
}

function NavIcon({ name }: { name: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const icons: Record<string, any> = {
    grid: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
      </svg>
    ),
    radio: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.302m5.302 0a3.75 3.75 0 010 5.302m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    map: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0-8.25a1.5 1.5 0 01-3 0V12m3-5.25V15m6-8.25V15m0-8.25a1.5 1.5 0 013 0V12m-3-5.25V15M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    users: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    clipboard: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
    search: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  };
  return icons[name] ?? null;
}
