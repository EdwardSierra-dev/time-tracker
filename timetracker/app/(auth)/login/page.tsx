import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-600">TimeTracker</h1>
          <p className="mt-1 text-sm text-gray-500">Gestión de horas y proyectos</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
