"use client";
import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import Link from 'next/link';
import { LogOut, Lock, Film, Tv } from 'lucide-react';
import { Content } from '../types';
import { useAuth } from '../../components/AuthProvider';

interface ApiResponse {
  content: Content[];
}

export default function DashboardPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { logout, user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchCatalog = async () => {
      try {
        setLoading(true);
        // Tipamos la respuesta como ApiResponse
        const data = await apiFetch('/content') as Content[] | ApiResponse;
        
        // Normalizamos la respuesta si es un array directo o un objeto con propiedad content
        const catalogList: Content[] = Array.isArray(data) ? data : (data.content ?? []);
        
        if (isMounted) setContents(catalogList);
      } catch (err: unknown) {
        if (isMounted) setError("No se pudo conectar con el catálogo.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCatalog();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex items-center justify-center">
        <p className="text-xs tracking-widest font-bold animate-pulse">CARGANDO CATÁLOGO...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white p-8">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Catálogo</h1>
          <p className="text-zinc-500 text-xs">Bienvenido, {user?.username || 'Usuario'}</p>
        </div>
        <button 
          onClick={logout}
          className="bg-zinc-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-800 transition"
        >
          <LogOut className="w-3 h-3 inline mr-2" /> Salir
        </button>
      </header>

      {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {contents.map((item: Content) => {
          const isLocked: boolean = !!(item.isPremium && user?.plan !== 'vip');

          return (
            <Link 
              key={item._id}
              href={`/dashboard/watch/${item._id}`}
              className={`group relative bg-zinc-900 rounded-2xl overflow-hidden transition-all ${
                isLocked ? 'cursor-default' : 'hover:scale-[1.02]'
              }`}
            >
              {isLocked && (
                <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center">
                  <Lock className="w-6 h-6 text-amber-500 mb-1" />
                  <span className="text-[9px] font-bold text-amber-500 tracking-wider">SOLO VIP</span>
                </div>
              )}
              
              <div className="aspect-[2/3] w-full bg-zinc-950 overflow-hidden">
                <img src={item.imagen} alt={item.titulo} className="w-full h-full object-cover" />
              </div>

              <div className="p-3">
                <h3 className="font-bold text-xs truncate">{item.titulo}</h3>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}