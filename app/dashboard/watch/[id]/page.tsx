"use client";
import { useEffect, useState, use } from 'react'; // <--- Importamos 'use'
import { apiFetch } from '../../../utils/api';
import { Lock } from 'lucide-react';
import { Content, Episodio } from '../../../types';
import { useAuth } from '../../../../components/AuthProvider';

interface ApiResponse {
  content?: Content;
}

interface ApiError {
  response?: { status?: number; data?: { msg?: string } };
  message?: string;
}

// Recibimos params como Promise
export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // <--- Desempaquetamos la promesa aquí
  const { user, loading: authLoading } = useAuth();
  
  const [data, setData] = useState<Content | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [activeEpisode, setActiveEpisode] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const isLocked = !authLoading && !!(data?.isPremium && user?.plan !== 'vip');

  useEffect(() => {
    if (authLoading || !id) return;

    const loadContent = async () => {
      try {
        setLoading(true);
        const res = (await apiFetch(`/content/${id}`)) as ApiResponse;
        const media = res?.content || null;
        
        if (!media) throw new Error("Contenido no encontrado.");

        setData(media);
        if (media.tipo !== 'pelicula' && media.episodios && media.episodios.length > 0) {
          setCurrentUrl(media.episodios[0].url);
          setActiveEpisode(media.episodios[0].numero);
        } else {
          setCurrentUrl(media.videoUrl || '');
        }
      } catch (err: unknown) {
        const apiError = err as ApiError;
        setError(apiError.response?.data?.msg || "Error al cargar contenido.");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [id, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center text-white">
        <p>Cargando información...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex items-center justify-center">
        {error}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white flex flex-col lg:flex-row">
      {/* Si el Navbar está en el layout principal, no hace falta ponerlo aquí.
         Si quieres que el Navbar aparezca solo en esta página, impórtalo y úsalo arriba:
         <Navbar /> 
      */}
      <div className="flex-1 p-8 bg-[#0e0e0e]">
        {isLocked ? (
          <div className="aspect-video bg-zinc-950 flex flex-col items-center justify-center border border-zinc-800">
            <Lock className="w-16 h-16 text-amber-500 mb-4" />
            <h2 className="text-xl font-bold">Contenido Premium</h2>
          </div>
        ) : (
          <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-800">
            {currentUrl ? (
              <iframe src={currentUrl} className="w-full h-full" allowFullScreen title="video" />
            ) : (
              <div className="flex items-center justify-center h-full">No hay video disponible</div>
            )}
          </div>
        )}
      </div>

      <div className="w-full lg:w-[400px] bg-[#0f0f0f] border-l border-zinc-800">
        {data?.episodios?.map((ep: Episodio) => (
          <button
            key={ep.numero}
            onClick={() => { setCurrentUrl(ep.url); setActiveEpisode(ep.numero); }}
            className={`w-full p-4 border-b border-zinc-800 text-left ${activeEpisode === ep.numero ? 'bg-red-900/20 text-red-500' : 'hover:bg-zinc-800'}`}
          >
            Episodio {ep.numero}
          </button>
        ))}
      </div>
    </main>
  );
}