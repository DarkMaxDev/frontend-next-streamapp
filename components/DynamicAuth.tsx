"use client";
import { useAuth } from "./AuthProvider";
import Link from "next/link";

export default function DynamicAuth() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return <span className="text-xs text-zinc-500">Cargando...</span>;
  }

  return user ? (
    <>
      {user.role === 'admin' && (
        <Link href="/admin/users" className="text-[11px] bg-white/10 px-3 py-1.5 rounded text-zinc-200 hover:bg-white/20 transition-all">
          ADMIN
        </Link>
      )}
      <span className="text-xs text-white">Hola, <strong className="font-bold">{user.username}</strong></span>
      <button onClick={logout} className="text-xs text-zinc-400 hover:text-red-500 transition-colors">
        Salir
      </button>
    </>
  ) : (
    <Link href="/login" className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded font-bold transition-all">
      Entrar
    </Link>
  );
}