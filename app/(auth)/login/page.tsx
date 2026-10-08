"use client";

import {
  ArrowRight,
  Chrome,
  Mail,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const nextPath = () => {
    const value = new URL(window.location.href).searchParams.get("next");
    return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
  };
  const callbackUrl = () => {
    const callback = new URL("/auth/callback", window.location.origin);
    const next = nextPath();
    if (next !== "/") callback.searchParams.set("next", next);
    return callback.toString();
  };
  const sendLink = async (formData: FormData) => {
    setState("sending");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: String(formData.get("email")),
        options: { emailRedirectTo: callbackUrl() },
      });
      if (error) throw error;
      setState("sent");
    } catch {
      setState("error");
    }
  };
  const google = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl() },
      });
      if (error) throw error;
    } catch {
      setState("error");
    }
  };
  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand">
          <span className="brand-mark">
            <WalletCards />
          </span>
          <span>
            Brunnel<span>Finanças</span>
          </span>
        </div>
        <div>
          <h1>Clareza para decidir o mês juntos.</h1>
          <p>
            Renda, compromissos, faturas e reserva numa visão que não conta
            dinheiro duas vezes.
          </p>
        </div>
        <span>
          <ShieldCheck size={18} />
          Cada família acessa somente os próprios dados.
        </span>
      </section>
      <section className="login-form">
        <div>
          <h2>Entrar</h2>
          <p>
            Receba um link seguro no seu e-mail. Não é necessário decorar senha.
          </p>
          {state === "sent" ? (
            <div className="login-success">
              <Mail size={22} />
              <h3>Confira seu e-mail</h3>
              <p>
                Se o endereço puder receber acesso, enviaremos um link válido
                por tempo limitado.
              </p>
              <button
                className="button button-quiet"
                onClick={() => setState("idle")}
              >
                Usar outro e-mail
              </button>
            </div>
          ) : (
            <>
              <form action={sendLink}>
                <label>
                  E-mail
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="voce@exemplo.com"
                  />
                </label>
                <button
                  className="button button-primary"
                  disabled={state === "sending"}
                >
                  {state === "sending" ? (
                    "Enviando…"
                  ) : (
                    <>
                      Enviar link de acesso <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
              <div className="login-divider">
                <span>ou</span>
              </div>
              <button className="button google-button" onClick={google}>
                <Chrome size={18} />
                Continuar com Google
              </button>
              {state === "error" && (
                <p className="inline-error" role="alert">
                  Não foi possível iniciar o acesso. Confira a conexão e tente
                  novamente.
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
