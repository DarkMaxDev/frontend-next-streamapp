"use client";
import { useEffect, useState, use } from 'react';
import { apiFetch } from './../../utils/api';
import { Lock } from 'lucide-react';
import { Content, Episodio } from './../../types';
import { useAuth } from '../../../components/AuthProvider';

interface ApiResponse {
  content?: Content;
}

interface ApiError {
  response?: { data?: { msg?: string } };
  message?: string;
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth(); // Eliminamos refreshUser de aquí
  
  const [data, setData] = useState<Content | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [activeEpisode, setActiveEpisode] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // isLocked es seguro ahora: si data es null, es false.
  const isLocked = !!(data?.isPremium && user?.plan !== 'vip');

  useEffect(() => {
    // Si la autenticación no ha terminado, no hacemos nada.
    if (authLoading) return;

    let isMounted = true;

    const loadContent = async () => {
      try {
        setLoading(true);
        // Ya no llamamos a refreshUser aquí, confiamos en el AuthProvider
        const res = (await apiFetch(`/content/${id}`)) as ApiResponse;
        
        if (!res?.content) throw new Error("Contenido no encontrado.");

        if (isMounted) {
          const media = res.content;
          setData(media);
          
          if (media.tipo !== 'pelicula' && media.episodios?.length && media.episodios.length > 0) {
            setCurrentUrl(media.episodios[0].url);
            setActiveEpisode(media.episodios[0].numero);
          } else {
            setCurrentUrl(media.videoUrl || '');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const apiErr = err as ApiError;
          setError(apiErr.response?.data?.msg || "Error al cargar contenido.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) loadContent();
    return () => { isMounted = false; };
  }, [id, authLoading]); // Dependencias limpias

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 text-center">{error}</div>;
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0e0e0e]">
        {isLocked ? (
          <div className="w-full max-w-3xl aspect-video bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center">
            <Lock className="w-16 h-16 text-amber-500 mb-4" />
            <h2 className="text-xl font-bold">Contenido Premium</h2>
          </div>
        ) : (
          <div className="w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-800">
            {currentUrl ? (
              <iframe src={currentUrl} className="w-full h-full" allowFullScreen title="video" />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">Video no disponible</div>
            )}
          </div>
        )}
      </div>

      <div className={`w-full lg:w-[400px] bg-[#0f0f0f] border-l border-zinc-800 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
        {data?.episodios?.map((ep: Episodio) => (
          <button
            key={ep.numero}
            onClick={() => { setCurrentUrl(ep.url); setActiveEpisode(ep.numero); }}
            className={`w-full p-4 border-b border-zinc-800 text-left transition-colors ${
              activeEpisode === ep.numero ? 'bg-red-900/20 text-red-500' : 'hover:bg-zinc-800'
            }`}
          >
            Episodio {ep.numero}: {ep.titulo}
          </button>
        ))}
      </div>
    </main>
  );
}