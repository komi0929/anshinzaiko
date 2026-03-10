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
          const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
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
          const defaultLocations = ["冷蔵庫A", "冷蔵庫B", "冷凍庫", "乾物棚", "その他"];
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
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
    } finally {
      setLoading(false);
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
              もう在庫管理で悩まない。<br />
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
              <p className="text-sm text-[var(--color-text-secondary)]">かんたん在庫管理</p>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold mb-2">
              {isSignup ? "はじめての方はこちら ✨" : "おかえりなさい 🍳"}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {isSignup
                ? "お店のアカウントをつくりましょう"
                : "メールアドレスとパスワードでログインしてください"}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">お店の名前</label>
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
                <label className="block text-sm font-medium mb-1.5">メールアドレス</label>
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
                <label className="block text-sm font-medium mb-1.5">パスワード</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input pr-10"
                    placeholder="6文字以上で入力してね"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                  "ログインする"
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
            <a href="/terms" className="underline">利用規約</a>
            と
            <a href="/privacy" className="underline">プライバシーポリシー</a>
            に同意したものとみなされます
          </p>
        </motion.div>
      </div>
    </div>
  );
}
