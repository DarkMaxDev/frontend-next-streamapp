"use client";
import { useEffect, useState, use } from 'react';
import { apiFetch } from '../../../utils/api';
import { Lock, Film, Tv, Calendar, Tag, Info, UserCheck } from 'lucide-react';
import { Content, Episodio } from '../../../types';
import { useAuth } from '../../../../components/AuthProvider';
import Link from 'next/link';

// Definimos la estructura estricta para las categorías pobladas de MongoDB
interface CategoriaObjeto {
  _id: string;
  nombre: string;
}

interface ApiResponse {
  content?: Content;
  data?: Content;
}

interface ApiError {
  response?: { status?: number; data?: { msg?: string } };
  message?: string;
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  
  const [data, setData] = useState<Content | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [activeEpisode, setActiveEpisode] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

 useEffect(() => {
  // Si aún está cargando la autenticación, esperamos
  if (authLoading || !id) return;

  // Si el usuario NO está autenticado, evitamos la petición síncrona directa
  if (!user) {
    if (loading) { // Validamos si realmente necesita cambiar a false para no hacer renders infinitos
      const timer = setTimeout(() => {
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }
    return;
  }

    const loadContent = async () => {
      try {
        setLoading(true);
        const res = (await apiFetch(`/content/${id}`)) as ApiResponse;
        
        let media: Content | null = null;
        if (res) {
          if (res.content) media = res.content;
          else if (res.data) media = res.data;
        }
        
        if (!media) throw new Error("No se pudo localizar el recurso multimedia solicitado.");

        setData(media);
        if (media.tipo !== 'pelicula' && media.episodios && media.episodios.length > 0) {
          setCurrentUrl(media.episodios[0].url);
          setActiveEpisode(media.episodios[0].numero);
        } else {
          setCurrentUrl(media.videoUrl || '');
        }
      } catch (err: unknown) {
        const apiError = err as ApiError;
        setError(apiError.response?.data?.msg || "Ocurrió un error al procesar el archivo de video.");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [id, authLoading, user]);

  // 1. Estado de carga inicial
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white gap-3">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] tracking-widest text-zinc-500 font-bold">VERIFICANDO CREDENCIALES...</p>
      </div>
    );
  }

  // 2. VISTA PARA USUARIOS NO REGISTRADOS (Reemplaza la redirección automática)
  if (!user) {
    return (
      <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 antialiased">
        <div className="max-w-md w-full bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl text-center space-y-6 backdrop-blur-md shadow-2xl">
          <div className="w-14 h-14 bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center rounded-2xl mx-auto shadow-inner">
            <UserCheck className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Contenido Restringido
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Para disfrutar de este video, películas y tus animes favoritos de nuestro catálogo, necesitas formar parte de la plataforma.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <Link 
              href="/register" 
              className="block w-full text-center bg-red-600 text-white p-3.5 rounded-xl font-bold hover:bg-red-700 transition-all text-xs uppercase tracking-wider shadow-lg shadow-red-600/10 active:scale-[0.98] transform"
            >
              Crear una cuenta gratis
            </Link>
            <Link 
              href="/login" 
              className="block w-full text-center bg-zinc-900 text-zinc-300 p-3.5 rounded-xl font-bold hover:bg-zinc-800 hover:text-white transition-all text-xs uppercase tracking-wider border border-zinc-800/80 active:scale-[0.98] transform"
            >
              Iniciar Sesión
            </Link>
          </div>

          <div className="pt-4 border-t border-zinc-800/60">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium underline">
              Volver a la cartelera principal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3. Vista de error de la API (Solo para logeados que tengan problemas con el contenido)
  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl max-w-md">
          <p className="text-sm text-red-400 font-medium">{error}</p>
          <Link href="/" className="inline-block mt-4 text-xs font-bold text-zinc-400 hover:text-white underline">
            Regresar al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  // Comprobación de Plan Premium
  const isLocked = !!(data?.isPremium && user?.plan !== 'vip');

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 antialiased pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link href="/" className="text-xs text-zinc-500 hover:text-red-500 transition-colors font-medium">
          ← Volver a la cartelera
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA Y CENTRAL: Video + Ficha Técnica */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="w-full aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800/60 shadow-2xl relative">
            {isLocked ? (
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-3">
                  <Lock className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-lg font-black text-zinc-200">Contenido Exclusivo VIP</h2>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">Tu plan actual no cuenta con los permisos necesarios para reproducir esta obra.</p>
              </div>
            ) : currentUrl ? (
              <iframe 
                src={currentUrl} 
                className="w-full h-full border-0" 
                allowFullScreen 
                title={data?.titulo || "Streaming Video Player"} 
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 bg-zinc-950">
                <Film className="w-8 h-8 mb-2 stroke-[1.5]" />
                <span className="text-xs font-medium">El archivo multimedia no está disponible transitoriamente</span>
              </div>
            )}
          </div>

          {/* FICHA TÉCNICA */}
          <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-300 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border border-zinc-700/50">
                  {data?.tipo === 'pelicula' ? <Film className="w-3 h-3 text-red-400" /> : <Tv className="w-3 h-3 text-blue-400" />}
                  {data?.tipo === 'anime' ? 'Anime' : data?.tipo === 'serie' ? 'Serie de TV' : 'Película'}
                </span>

                {data?.tipo !== 'pelicula' && data?.status && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${
                    data.status === 'en_emision' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
                  }`}>
                    <Calendar className="w-3 h-3" />
                    {data.status === 'en_emision' ? 'En Emisión' : 'Finalizada'}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight">
                {data?.titulo}
              </h2>
              {data?.tipo !== 'pelicula' && activeEpisode && (
                <p className="text-xs text-red-500 font-bold mt-0.5 tracking-wide">
                  Reproduciendo ahora: Capítulo {activeEpisode}
                </p>
              )}
            </div>

            {data?.categorias && data.categorias.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center pt-1">
                <Tag className="w-3 h-3 text-zinc-500 mr-1" />
                {data.categorias.map((cat: string | CategoriaObjeto, i: number) => {
                  const nombreCat = typeof cat === 'object' && cat !== null ? cat.nombre : String(cat);
                  return (
                    <span key={i} className="text-[11px] font-medium text-zinc-400 bg-zinc-800/40 border border-zinc-800 px-2 py-0.5 rounded-md">
                      {nombreCat}
                    </span>
                  );
                })}
              </div>
            )}

            <hr className="border-zinc-800/60" />

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-zinc-500" /> Sinopsis Oficial
              </h4>
              <p className="text-zinc-300 text-sm leading-relaxed font-light">
                {data?.descripcion || "No se ha proporcionado una descripción detallada para esta producción."}
              </p>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: Selector de Capítulos */}
        <div className="lg:col-span-1">
          {data?.tipo === 'pelicula' ? (
            <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-2xl p-6 text-center text-zinc-500 text-xs">
              <Film className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
              Esta producción se presenta en formato largometraje único. No requiere selección de episodios.
            </div>
          ) : (
            <div className={`bg-zinc-900/30 border border-zinc-800/60 rounded-2xl overflow-hidden backdrop-blur-sm ${
              isLocked ? 'opacity-30 pointer-events-none select-none' : ''
            }`}>
              <div className="p-4 bg-zinc-900/60 border-b border-zinc-800/80">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  Índice de Capítulos
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {data?.episodios?.length || 0} episodios disponibles
                </p>
              </div>

              <div className="divide-y divide-zinc-800/50 max-h-[500px] overflow-y-auto custom-scrollbar">
                {data?.episodios && data.episodios.length > 0 ? (
                  data.episodios.map((ep: Episodio) => {
                    const isCurrent = activeEpisode === ep.numero;
                    return (
                      <button
                        key={ep.numero}
                        onClick={() => { setCurrentUrl(ep.url); setActiveEpisode(ep.numero); }}
                        className={`w-full p-4 text-left transition-all duration-200 flex flex-col gap-0.5 ${
                          isCurrent 
                            ? 'bg-red-950/20 text-red-400 border-l-2 border-red-600 pl-3' 
                            : 'hover:bg-zinc-800/40 text-zinc-300 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold font-mono text-zinc-400">EPISODIO {ep.numero}</span>
                        <span className="text-xs font-semibold line-clamp-1">{ep.titulo}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs text-zinc-600 italic">
                    Próximamente se añadirán los capítulos de la temporada.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}