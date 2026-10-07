import { useState } from "react";
import { login, DEMO_CREDENTIALS } from "../data/auth";
import type { User } from "../data/auth";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const finalEmail = customEmail || email;
    const finalPass = customPass || password;

    if (!finalEmail || !finalPass) {
      setError("Please provide email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { user } = await login(finalEmail, finalPass);
      onLoginSuccess(user);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to log in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleSubmit(undefined, demoEmail, demoPass);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-slide-in">
        {/* Header */}
        <div className="bg-[#0a1e3d] text-white px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Municipal Officer Authentication</h3>
            <p className="text-xs text-blue-200/70 mt-0.5">Vadodara Municipal Corporation</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Quick 1-Click Login for Viva Demo */}
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              Quick Officer Accounts
            </p>
            <div className="space-y-2">
              {DEMO_CREDENTIALS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleQuickLogin(demo.email, demo.password)}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 text-left transition-all text-xs"
                >
                  <div>
                    <span className="font-semibold text-gray-800 block">{demo.roleName}</span>
                    <span className="text-[10px] text-gray-400">{demo.email}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${demo.badge}`}>
                    {demo.role.replace("_", " ")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-2 text-[10px] uppercase font-bold text-gray-400 absolute">
              Or Custom Sign In
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Official Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@vmc.gov.in"
                className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
