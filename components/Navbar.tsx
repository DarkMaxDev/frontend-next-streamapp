"use client";
import { useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import dynamic from 'next/dynamic';

// Importamos dinámicamente el componente de auth desactivando SSR
const DynamicAuth = dynamic(() => import("./DynamicAuth"), {
  ssr: false,
  loading: () => <span className="text-xs text-zinc-500">Cargando...</span>
});

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md p-5 flex justify-between items-center border-b border-white/5 transition-all duration-300">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-black text-red-600 tracking-tighter">
          STREAMAPP
        </Link>
      </div>

      <form onSubmit={handleSearch} className="relative hidden md:flex items-center">
        <input
          type="text"
          placeholder="Buscar títulos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-zinc-900/50 border border-zinc-800 text-white text-xs px-4 py-2 rounded-full w-64 focus:outline-none focus:border-red-600"
        />
        <button type="submit" className="absolute right-3 text-zinc-500">
          <Search className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="flex items-center gap-5 min-h-[40px]">
        <DynamicAuth />
      </div>
    </nav>
  );
}