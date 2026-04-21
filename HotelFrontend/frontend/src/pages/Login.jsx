import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login, error, loading } = useLogin();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    const normalizedEmail = email.trim();
    if (!normalizedEmail) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(normalizedEmail)) e.email = "Invalid email format";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const res = await login(email, password);
    if (!res?.user) return;
    navigate(res.user.role === "kitchen" ? "/kitchen" : "/", { replace: true });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gray-50">
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-left { animation: slideInLeft 0.7s ease-out; }
        .animate-slide-right { animation: slideInRight 0.7s ease-out; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        .input-focus:focus-within { box-shadow: 0 0 0 3px rgba(197, 63, 255, 0.1); }
        .gradient-accent { background: linear-gradient(135deg, #C53FFF 0%, #2563EB 100%); }
      `}</style>

      {/* LEFT BRAND PANEL - Premium with Dashboard Colors */}
      <div className="hidden md:flex flex-col justify-between px-16 py-14 bg-gradient-to-br from-[#1A2640] via-[#1F2F4D] to-[#1A2640] text-white overflow-hidden relative">
        {/* Decorative gradient elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#C53FFF]/15 to-transparent rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-[#FFCC00]/10 to-transparent rounded-full blur-3xl -ml-36 -mb-36"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-bl from-[#2563EB]/10 to-transparent rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="animate-slide-left">
            <h1 className="text-5xl font-bold mb-2">
            Hotel Friday<span className="text-[#FFCC00] ml-1">Inn</span>
            </h1>
            <p className="text-sm text-gray-400 font-light">
              Hotel Management System
            </p>
          </div>

          <div className="mt-20 space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {[
              { 
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: "Real-time Dashboard", 
                desc: "Live analytics & reporting",
                color: "#2563EB"
              },
              { 
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                ),
                title: "Booking Management", 
                desc: "Seamless reservation handling",
                color: "#C53FFF"
              },
              { 
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: "Enterprise Security", 
                desc: "Role-based access control",
                color: "#10B981"
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 group cursor-pointer transition-transform hover:translate-x-1">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: item.color + "20", color: item.color }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-[#FFCC00] transition-colors">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-gray-500">
          <p className="font-light">© 2026 Hotel Friday Inn. All rights reserved.</p>
        </div>
      </div>

      {/* RIGHT LOGIN PANEL - Clean Professional */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-right">

          {/* HEADER */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-gray-600 mt-2 font-light">
              Sign in to your Friday Inn account
            </p>
          </div>

          {/* CARD */}
          <form
            onSubmit={submit}
            noValidate
            className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8 space-y-4"
          >

            {/* EMAIL INPUT */}
            <div className="">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium placeholder-gray-400 focus:outline-none transition-all duration-200 ${
                  errors.email
                    ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-gray-300 bg-gray-50/50 focus:border-[#C53FFF] focus:bg-white focus:ring-2 focus:ring-[#C53FFF]/20"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* PASSWORD INPUT */}
            <div className="">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 text-sm font-medium placeholder-gray-400 focus:outline-none transition-all duration-200 ${
                    errors.password
                      ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-gray-300 bg-gray-50/50 focus:border-[#C53FFF] focus:bg-white focus:ring-2 focus:ring-[#C53FFF]/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#C53FFF] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-50/80 border border-red-300/50 rounded-lg">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* SIGN IN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white uppercase text-xs tracking-wider bg-gradient-to-r from-[#C53FFF] via-[#2563EB] to-[#2563EB] hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

          </form>

          {/* FOOTER */}
          <p className="text-center text-xs text-gray-600 mt-6 font-light">
            Authorized personnel only
          </p>

          {/* ACCENT LINE */}
          <div className="mt-8 h-1 rounded-full gradient-accent opacity-40"></div>
        </div>
      </div>
    </div>
  );
}
