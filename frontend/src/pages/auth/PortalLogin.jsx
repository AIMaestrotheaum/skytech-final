import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../api/auth";

export default function Login() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      /*
       * Store authentication information
       */
      if (rememberMe) {
        localStorage.setItem(
          "skytech_token",
          data.access_token
        );

        localStorage.setItem(
          "skytech_role",
          data.role
        );

        localStorage.setItem(
          "skytech_user",
          data.name
        );
      } else {
        sessionStorage.setItem(
          "skytech_token",
          data.access_token
        );

        sessionStorage.setItem(
          "skytech_role",
          data.role
        );

        sessionStorage.setItem(
          "skytech_user",
          data.name
        );
      }

      /*
       * Role-based navigation
       */
      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/portal/dashboard");
      }
    } catch (err) {
      setError(
        err.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col md:flex-row bg-[#f7f9fb]">

      {/* =====================================================
          LEFT BRAND / IMAGE AREA
      ====================================================== */}

      <div className="hidden md:flex md:w-1/2 lg:w-7/12 relative bg-[#000000] flex-col justify-between overflow-hidden min-h-screen">

        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCfr8DHjoQRAL2wTrTFwRnsxlKaMgR-IJII1dPjS0xx5QQnCHedBCkgGQ-9qxy8Rr08FTat44KiuHzWYv8FkOwiQSE6X272u7Kkq1GFIfwNY47aDOjAJhQh1YYRR78ogRi59TH3Z9_5bDXqjYJ0bCAreSSmM25IyNCHva_t-RKhOIMXH9sZPRQJuMlag8TUNuCY3asce0myYcsDTvF2jr3vx-F1t95vISSs_0qE6_mGdAcam2r90bpq')",
          }}
        />

        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#c5c6cd 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        <div className="relative z-10 flex flex-col h-full justify-between p-16 text-white">

          {/* Logo */}
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight flex items-center gap-3">
              <span className="text-[48px]">
                ⚡
              </span>

              SKYTECH
            </h1>

            <p className="mt-2 text-xs font-mono uppercase tracking-[0.2em] text-[#3cd7ff]">
              Industrial Portal
            </p>
          </div>

          {/* Value proposition */}
          <div className="max-w-md">
            <p className="text-2xl font-semibold mb-4">
              Precision Energy Management.
            </p>

            <p className="text-lg leading-relaxed text-gray-300">
              Secure access to real-time analytics,
              predictive maintenance alerts, and
              comprehensive asset health tracking
              across your entire grid infrastructure.
            </p>

            <div className="mt-10 flex gap-6">

              <div className="flex items-center gap-2">
                <span>🔒</span>

                <span className="text-xs font-mono tracking-widest">
                  SOC2 TYPE II
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span>⚡</span>

                <span className="text-xs font-mono tracking-widest">
                  99.99% UPTIME
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* =====================================================
          RIGHT LOGIN AREA
      ====================================================== */}

      <div className="w-full md:w-1/2 lg:w-5/12 min-h-screen bg-[#f7f9fb] flex items-center justify-center relative overflow-y-auto">

        {/* Mobile logo */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-center md:hidden bg-white/90 backdrop-blur-sm z-20 border-b border-gray-200">

          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-3xl">
              ⚡
            </span>

            SKYTECH
          </h1>

        </div>

        {/* Login container */}
        <div className="w-full max-w-md px-4 py-20 md:p-10 relative z-10">

          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-10 relative overflow-hidden">

            {/* Top accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-[#0266ff]" />

            {/* Heading */}
            <div className="mb-10">

              <h2 className="text-2xl font-semibold text-[#191c1e] mb-2">
                Welcome Back
              </h2>

              <p className="text-base text-[#44474d]">
                Please authenticate to access the portal.
              </p>

            </div>

            {/* =================================================
                LOGIN TABS
            ================================================== */}

            <div className="flex border-b border-gray-300 mb-10">

              <button
                type="button"
                onClick={() => {
                  setActiveTab("customer");
                  setError("");
                }}
                className={`flex-1 pb-4 text-xs font-mono tracking-widest transition-colors ${
                  activeTab === "customer"
                    ? "border-b-2 border-[#0266ff] text-[#191c1e]"
                    : "border-b-2 border-transparent text-[#44474d]"
                }`}
              >
                Customer Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("admin");
                  setError("");
                }}
                className={`flex-1 pb-4 text-xs font-mono tracking-widest transition-colors ${
                  activeTab === "admin"
                    ? "border-b-2 border-[#0266ff] text-[#191c1e]"
                    : "border-b-2 border-transparent text-[#44474d]"
                }`}
              >
                Admin Login
              </button>

            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* =================================================
                LOGIN FORM
            ================================================== */}

            <form
              onSubmit={handleLogin}
              className="space-y-6"
            >

              {/* Email */}
              <div>

                <label
                  htmlFor="username"
                  className="block text-base font-semibold text-[#191c1e] mb-2"
                >
                  Email / Username
                </label>

                <div className="relative">

                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    👤
                  </div>

                  <input
                    id="username"
                    name="username"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder={
                      activeTab === "admin"
                        ? "admin@skytech.com"
                        : "customer@skytech.com"
                    }
                    required
                    className="block w-full pl-12 pr-4 py-3 bg-[#f7f9fb] border border-gray-300 rounded text-[#191c1e] focus:outline-none focus:ring-1 focus:ring-[#000000] focus:border-[#000000]"
                  />

                </div>
              </div>

              {/* Password */}
              <div>

                <div className="flex justify-between items-center mb-2">

                  <label
                    htmlFor="password"
                    className="block text-base font-semibold text-[#191c1e]"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-mono text-[#0266ff] hover:underline"
                    onClick={() =>
                      setError(
                        "Password reset will be connected next."
                      )
                    }
                  >
                    Forgot Password?
                  </button>

                </div>

                <div className="relative">

                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    🔑
                  </div>

                  <input
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="••••••••"
                    required
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    className="block w-full pl-12 pr-14 py-3 bg-[#f7f9fb] border border-gray-300 rounded text-[#191c1e] focus:outline-none focus:ring-1 focus:ring-[#000000] focus:border-[#000000]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-900"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword
                      ? "🙈"
                      : "👁️"}
                  </button>

                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center">

                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 cursor-pointer"
                />

                <label
                  htmlFor="remember-me"
                  className="ml-3 text-base text-[#44474d] cursor-pointer"
                >
                  Remember this device
                </label>

              </div>

              {/* Submit */}
              <div className="pt-2">

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-3 py-3 px-6 bg-black text-white font-semibold rounded shadow-sm hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >

                  {loading ? (
                    <>
                      <span>⏳</span>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <span>🔒</span>
                      Secure Login
                    </>
                  )}

                </button>

              </div>

            </form>

            {/* =================================================
                CUSTOMER REGISTRATION
            ================================================== */}

            {activeTab === "customer" && (
              <div className="mt-7 text-center">

                <p className="text-sm text-[#44474d]">
                  Don't have a customer account?
                </p>

                <Link
                  to="/portal/register"
                  className="inline-block mt-2 text-[#0266ff] font-semibold hover:underline"
                >
                  Create Customer Account →
                </Link>

              </div>
            )}

            {/* =================================================
                SUPPORT
            ================================================== */}

            <div className="mt-8 pt-4 border-t border-gray-200 text-center">

              <p className="text-xs font-mono text-[#44474d]">

                Need help accessing your account?

                <button
                  type="button"
                  onClick={() =>
                    setError(
                      "Contact Support will be connected next."
                    )
                  }
                  className="text-[#0266ff] hover:underline ml-2"
                >
                  Contact Support
                </button>

              </p>

            </div>

          </div>

          {/* Copyright */}
          <div className="mt-4 text-center">

            <p className="text-[10px] font-mono text-gray-400">
              © 2024 SKYTECH ELECTRICALS
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}