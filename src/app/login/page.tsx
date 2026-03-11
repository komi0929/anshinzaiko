"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChefHat, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  const [storeName, setStoreName] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (isSignup) {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Create store with a random token
          const token =
            crypto.randomUUID().replace(/-/g, "") +
            crypto.randomUUID().replace(/-/g, "");
          const { data: store, error: storeError } = await supabase
            .from("stores")
            .insert({
              name: storeName || "マイ店舗",
              staff_token: token,
            })
            .select()
            .single();

          if (storeError) throw storeError;

          // Link admin to store
          await supabase.from("store_admins").insert({
            store_id: store.id,
            user_id: data.user.id,
          });

          // Create default locations
          const defaultLocations = [
            "冷蔵庫A",
            "冷蔵庫B",
            "冷凍庫",
            "乾物棚",
            "その他",
          ];
          for (let i = 0; i < defaultLocations.length; i++) {
            await supabase.from("locations").insert({
              store_id: store.id,
              name: defaultLocations[i],
              sort_order: i,
            });
          }
        }

        router.push("/dashboard");
        router.refresh();
      } else {
        // Sign in
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) throw signInError;

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Googleログインに失敗しました";
      setError(message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Hero Image */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <Image
          src="/images/dashboard_hero.png"
          alt="Kitchen"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white px-12"
          >
            <h2 className="text-5xl font-extrabold mb-4">あんしん在庫</h2>
            <p className="text-xl text-white/80 max-w-md mx-auto leading-relaxed">
              もう在庫管理で悩まない。
              <br />
              かんたん操作で、毎日のお仕事がもっとラクに♪
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--color-surface-dim)]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-brand-orange)] to-[var(--color-brand-orange-dark)] flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl">あんしん在庫</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">
                かんたん在庫管理
              </p>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold mb-2">
              {isSignup ? "はじめての方はこちら ✨" : "おかえりなさい 🍳"}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {isSignup
                ? "お店のアカウントをつくりましょう"
                : "お好きな方法でログインしてください"}
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all mb-5"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Googleで{isSignup ? "登録" : "ログイン"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">
                または
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    お店の名前
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="例: カフェ ABC"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  メールアドレス
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="mail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  パスワード
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input pr-10"
                    placeholder="6文字以上で入力してね"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSignup ? (
                  "アカウントをつくる"
                ) : (
                  "メールでログイン"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError(null);
                }}
                className="text-sm text-[var(--color-brand-orange)] hover:underline font-medium"
              >
                {isSignup
                  ? "すでにアカウントをお持ちの方はこちら"
                  : "はじめての方は新規登録へ ✨"}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
            ご利用にあたり
            <a href="/terms" className="underline">
              利用規約
            </a>
            と
            <a href="/privacy" className="underline">
              プライバシーポリシー
            </a>
            に同意したものとみなされます
          </p>
        </motion.div>
      </div>
    </div>
  );
}
