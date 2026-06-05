"use client";
import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import Link from 'next/link';
import { LogOut, Lock, Film, Tv, Sparkles } from 'lucide-react';
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
        const data = await apiFetch('/content') as Content[] | ApiResponse;
        const catalogList: Content[] = Array.isArray(data) ? data : (data.content ?? []);
        if (isMounted) setContents(catalogList);
      } catch (err: unknown) {
        if (isMounted) setError("No se pudo conectar con el catálogo en este momento.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCatalog();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] tracking-[0.2em] font-black text-zinc-400">PREPARANDO CATÁLOGO</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-red-600 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header con Perfil Estilizado */}
        <header className="flex justify-between items-center border-b border-zinc-800/60 pb-8 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              Descubrir
            </h1>
            <p className="text-zinc-500 text-xs mt-1">
              Sesión activa: <span className="text-zinc-300 font-medium">{user?.username || 'Usuario'}</span>
            </p>
          </div>
          <button 
            onClick={logout}
            className="group bg-zinc-900 border border-zinc-800/80 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-300 flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 transition-colors" /> 
            Cerrar Sesión
          </button>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 mb-6">
            {error}
          </div>
        )}

        {/* Grid de Contenido Moderno */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {contents.map((item: Content) => {
            const isLocked: boolean = !!(item.isPremium && user?.plan !== 'vip');

            return (
              <Link 
                key={item._id}
                href={`/dashboard/watch/${item._id}`}
                className={`group relative bg-zinc-900/40 border border-zinc-800/40 rounded-2xl overflow-hidden transition-all duration-500 ${
                  isLocked ? 'cursor-default' : 'hover:scale-[1.03] hover:shadow-2xl hover:shadow-red-950/20 hover:border-zinc-700'
                }`}
              >
                {/* Overlay Bloqueado para No VIP */}
                {isLocked && (
                  <div className="absolute inset-0 z-20 bg-zinc-950/85 backdrop-blur-[3px] flex flex-col items-center justify-center p-4 text-center">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl mb-2">
                      <Lock className="w-5 h-5 text-amber-500" />
                    </div>
                    <span className="text-[10px] font-black text-amber-400 tracking-widest uppercase">Pase Premium</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5">Requiere suscripción VIP</span>
                  </div>
                )}

                {/* Contenedor del Póster */}
                <div className="aspect-[2/3] w-full bg-zinc-950 overflow-hidden relative">
                  <img 
                    src={item.imagen} 
                    alt={item.titulo} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    loading="lazy"
                  />
                  
                  {/* Degradado Cinematográfico */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />
                  
                  {/* Insignia de Formato */}
                  <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md flex items-center gap-1.5">
                    {item.tipo === 'pelicula' ? (
                      <Film className="w-3 h-3 text-red-400" />
                    ) : (
                      <Tv className="w-3 h-3 text-blue-400" />
                    )}
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                      {item.tipo === 'anime' ? 'Anime' : item.tipo === 'serie' ? 'Serie' : 'Cine'}
                    </span>
                  </div>

                  {item.isPremium && (
                    <div className="absolute top-3 right-3 z-10 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 p-1 rounded-md">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </div>
                  )}
                </div>

                {/* Pie de la Tarjeta */}
                <div className="p-4">
                  <h3 className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors truncate">
                    {item.titulo}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
        
      </div>
    </div>
  );
}