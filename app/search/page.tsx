"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '../utils/api';
import { Content } from '../types';
import { useAuth } from '../../components/AuthProvider';
import Link from 'next/link';
import { Lock } from 'lucide-react';

function SearchResults() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const query: string = searchParams.get('q')?.toLowerCase() ?? '';
  const [results, setResults] = useState<Content[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAndFilter = async () => {
      try {
        setLoading(true);
        const data = await apiFetch('/content') as Content[] | { content: Content[] };
        
        // Normalización de respuesta
        const catalogList: Content[] = Array.isArray(data) ? data : (data.content ?? []);
        
        const filtered = catalogList.filter((item: Content) => 
          item.titulo.toLowerCase().includes(query)
        );
        
        if (isMounted) setResults(filtered);
      } catch (err: unknown) {
        console.error("Error en búsqueda:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (query) fetchAndFilter();
    return () => { isMounted = false; };
  }, [query]);

  if (loading) return <div className="text-white p-20 text-center">Buscando...</div>;

  return (
    <div className="min-h-screen bg-[#070707] text-white p-8">
      <h1 className="text-xl mb-6">Resultados para: <span className="text-red-600 font-bold">&quot;{query}&quot;</span></h1>
      
      {results.length === 0 ? (
        <p className="text-zinc-500">No se encontraron títulos relacionados.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {results.map((item: Content) => {
            const isLocked: boolean = !!(item.isPremium && user?.plan !== 'vip');
            
            return (
              <Link 
                key={item._id} 
                href={`/dashboard/watch/${item._id}`} 
                className="block group relative"
              >
                {isLocked && (
                  <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl">
                    <Lock className="w-6 h-6 text-amber-500 mb-1" />
                    <span className="text-[9px] font-bold text-amber-500 tracking-wider">SOLO VIP</span>
                  </div>
                )}
                
                <div className="aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden mb-2">
                  <img src={item.imagen} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
                <h3 className="text-xs font-bold truncate">{item.titulo}</h3>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-white p-20 text-center">Cargando...</div>}>
      <SearchResults />
    </Suspense>
  );
}