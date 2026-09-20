import Link from "next/link";
import { redirect } from "next/navigation";
import { Coffee } from "lucide-react";
import { getCurrentOwner } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  if (await getCurrentOwner()) redirect("/admin");

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link href="/" className="brand brand-dark">
          <span className="brand-mark">
            <Coffee size={18} />
          </span>
          <span>BLA BLA</span>
        </Link>
        <p className="eyebrow">Само за тимот</p>
        <h1>Уреди го менито.</h1>
        <p className="muted">
          Производите, цените и достапноста се објавуваат веднаш.
        </p>
        <LoginForm />
        <Link className="text-link" href="/">
          ← Назад кон веб-страницата
        </Link>
      </section>
    </main>
  );
}
