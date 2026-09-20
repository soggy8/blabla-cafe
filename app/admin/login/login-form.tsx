"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const initialState: { error?: string } = {};
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="admin-form">
      <label>
        Е-пошта
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Лозинка
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
        />
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button className="button button-solid" type="submit" disabled={pending}>
        {pending ? "Се најавува..." : "Најави се"}
      </button>
    </form>
  );
}
