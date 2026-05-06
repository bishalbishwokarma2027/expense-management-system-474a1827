import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";
import logo from "@/assets/expense-tracker-logo.png";

const LOVABLE_PROJECT_ID = "310bd86f-93f1-43f7-8612-8e02c10e4069";
const LOVABLE_PREVIEW_ORIGIN = `https://id-preview--${LOVABLE_PROJECT_ID}.lovable.app`;
const OAUTH_BROKER_ORIGIN = "https://oauth.lovable.app";

const createOAuthState = () => {
  if (window.crypto?.getRandomValues) {
    return Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const signInWithGoogleOnExternalHost = () => {
  const state = createOAuthState();
  const redirectUri = `${LOVABLE_PREVIEW_ORIGIN}/auth?google_oauth_bridge=1&target_origin=${encodeURIComponent(
    window.location.origin
  )}`;
  const params = new URLSearchParams({
    provider: "google",
    project_id: LOVABLE_PROJECT_ID,
    redirect_uri: redirectUri,
    state,
    prompt: "select_account",
  });

  const popup = window.open(
    `${OAUTH_BROKER_ORIGIN}/initiate?${params.toString()}`,
    "expense-tracker-google-login",
    "width=520,height=680,left=120,top=80"
  );

  return new Promise<{ access_token: string; refresh_token: string }>((resolve, reject) => {
    if (!popup) {
      reject(new Error("Popup was blocked. Please allow popups and try again."));
      return;
    }

    const cleanup = () => {
      window.removeEventListener("message", handleMessage);
      window.clearInterval(closeWatcher);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== LOVABLE_PREVIEW_ORIGIN) return;

      const data = event.data as {
        type?: string;
        response?: {
          state?: string;
          error?: string;
          error_description?: string;
          access_token?: string;
          refresh_token?: string;
        };
      };

      if (data?.type !== "expense_tracker_google_oauth") return;

      const response = data.response;
      if (response?.state !== state) {
        cleanup();
        popup.close();
        reject(new Error("Google sign-in state did not match. Please try again."));
        return;
      }

      if (response.error) {
        cleanup();
        popup.close();
        reject(new Error(response.error_description || response.error));
        return;
      }

      if (!response.access_token || !response.refresh_token) {
        cleanup();
        popup.close();
        reject(new Error("Google sign-in did not return a session. Please try again."));
        return;
      }

      cleanup();
      popup.close();
      resolve({ access_token: response.access_token, refresh_token: response.refresh_token });
    };

    const closeWatcher = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error("Google sign-in was cancelled."));
      }
    }, 500);

    window.addEventListener("message", handleMessage);
  });
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: "Account created!", description: "You are now signed in." });
      }
    } catch (error: unknown) {
      toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const isLovableHosted = window.location.hostname.endsWith(".lovable.app");

      if (isLovableHosted) {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
          extraParams: { prompt: "select_account" },
        });

        if (result.error) throw result.error;
        if (result.redirected) return;
      } else {
        const tokens = await signInWithGoogleOnExternalHost();
        const { error } = await supabase.auth.setSession(tokens);
        if (error) throw error;
      }
    } catch (error: unknown) {
      toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={logo} alt="Expense Tracker logo" className="h-14 w-14 rounded-xl object-contain" />
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Expense Tracker</h1>
          </div>
          <p className="text-muted-foreground">Track your expenses smartly</p>
        </div>

        <div className="glass-card p-6 rounded-xl border border-border bg-card">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {isLogin ? <LogIn className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          {(
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Button>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
