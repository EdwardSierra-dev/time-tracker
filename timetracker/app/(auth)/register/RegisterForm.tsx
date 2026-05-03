"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ALLOWED_EMAIL_DOMAINS } from "@/lib/constants";

interface Props {
  countries: string[];
}

export function RegisterForm({ countries }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate Rhiscom corporate email domain
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (!emailDomain || !ALLOWED_EMAIL_DOMAINS.includes(emailDomain as typeof ALLOWED_EMAIL_DOMAINS[number])) {
      setError("Solo se permiten correos corporativos de Rhiscom (rhiscom.cl o rhiscom.com)");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, country }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Ocurrió un error inesperado. Intenta nuevamente.");
        return;
      }

      setShowSuccess(true);
    } catch (err) {
      setError("Ocurrió un error inesperado. Intenta nuevamente.");
      console.error("[RegisterForm] Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="full-name"
          label="Nombre completo"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ana Martínez"
          autoComplete="name"
          required
        />
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          required
        />
        <Select
          id="country"
          label="País"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Selecciona tu país"
          required
        >
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Input
          id="password"
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          required
        />
        <Input
          id="confirm-password"
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          required
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full mt-2">
          Crear cuenta
        </Button>

        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </form>

      <Modal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Registro exitoso"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">
            Te has registrado exitosamente. Ya puedes iniciar sesión con tu cuenta.
          </p>
          <div className="flex justify-end">
            <Link href="/login">
              <Button onClick={() => setShowSuccess(false)}>
                Ir al inicio de sesión
              </Button>
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
