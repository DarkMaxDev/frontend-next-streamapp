"use client";
import { useAuth } from "./AuthProvider";
import Link from "next/link";

export default function DynamicAuth() {
  const { user, logout, loading } = useAuth();

  // En lugar de un texto plano, usamos un mini contenedor animado que mantenga la estructura estética
  if (loading) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-12 h-6 bg-zinc-800 rounded-md" />
        <div className="w-20 h-4 bg-zinc-800 rounded-md" />
      </div>
    );
  }

  return user ? (
    <>
      {user.role === 'admin' && (
        <Link href="/admin/users" className="text-[11px] bg-white/10 px-3 py-1.5 rounded text-zinc-200 hover:bg-white/20 transition-all font-bold tracking-wider">
          ADMIN
        </Link>
      )}
      <span className="text-xs text-zinc-300">
        Hola, <strong className="font-black text-white">{user.username}</strong>
      </span>
      <button 
        onClick={logout} 
        className="text-xs text-zinc-500 hover:text-red-500 font-medium transition-colors"
      >
        Salir
      </button>
    </>
  ) : (
    <Link href="/login" className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded font-bold transition-all shadow-md shadow-red-900/20">
      Entrar
    </Link>
  );
}