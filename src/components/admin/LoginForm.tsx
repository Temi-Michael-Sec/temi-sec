"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/admin/auth-actions";
import { labelClass, inputClass, errorClass, buttonPrimary } from "./styles";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      {state.error && (
        <p className={errorClass} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonPrimary}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
