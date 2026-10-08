"use client";

import { Copy, Mail } from "lucide-react";
import { useState } from "react";
import {
  createHouseholdInvitationAction,
  type InvitationActionResult,
} from "@/lib/actions/households";

export function InviteMemberForm() {
  const [result, setResult] = useState<InvitationActionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (formData: FormData) => {
    setCopied(false);
    setResult(await createHouseholdInvitationAction(formData));
  };

  const copyLink = async () => {
    if (!result?.inviteUrl) return;
    await navigator.clipboard.writeText(result.inviteUrl);
    setCopied(true);
  };

  return (
    <>
      <form action={submit}>
        <label>
          E-mail
          <input
            name="email"
            type="email"
            required
            placeholder="nome@exemplo.com"
            autoComplete="email"
          />
        </label>
        <button className="button button-primary">
          <Mail size={17} />
          Enviar convite
        </button>
      </form>
      {result && (
        <p
          className={result.ok ? "inline-success" : "inline-error"}
          role="status"
        >
          {result.message}
        </p>
      )}
      {result?.inviteUrl && (
        <div className="invite-link-result">
          <label>
            Link seguro
            <input value={result.inviteUrl} readOnly />
          </label>
          <button type="button" className="copy-link" onClick={copyLink}>
            <Copy size={16} />
            {copied ? "Link copiado" : "Copiar link seguro"}
          </button>
        </div>
      )}
    </>
  );
}
