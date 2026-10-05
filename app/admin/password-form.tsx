"use client";

import { useActionState } from "react";
import { changePasswordAction } from "./actions";

export function PasswordForm() {
  const initialState: { error?: string; success?: boolean } = {};
  const [state, action, pending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={action} className="admin-form password-form">
      <label>
        Тековна лозинка
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <div className="field-row">
        <label>
          Нова лозинка
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
        <label>
          Повтори нова лозинка
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
      </div>
      <p className="admin-hint">
        Најмалку 12 знаци. По промената, сите други уреди се одјавуваат.
      </p>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? (
        <p className="form-success">Лозинката е променета.</p>
      ) : null}
      <button className="button button-solid" type="submit" disabled={pending}>
        {pending ? "Се зачувува..." : "Промени лозинка"}
      </button>
    </form>
  );
}
