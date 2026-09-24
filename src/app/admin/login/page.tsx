import Logo from "@/components/ui/Logo";
import LoginForm from "./LoginForm";

const ERRORES: Record<string, string> = {
  "no-autorizado": "Esa cuenta no tiene acceso al panel.",
  "link-invalido": "El link expiró o no es válido. Pedí uno nuevo.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1>
        <Logo mic className="text-4xl" />
      </h1>
      <p className="zocalo mt-2 mb-6 w-fit px-3 pr-6 font-display text-sm font-bold uppercase tracking-widest">
        Panel de control
      </p>
      {error && ERRORES[error] && (
        <p className="mb-4 rounded-md border border-error/50 bg-error/10 px-3 py-2 text-sm">{ERRORES[error]}</p>
      )}
      <LoginForm />
    </div>
  );
}
