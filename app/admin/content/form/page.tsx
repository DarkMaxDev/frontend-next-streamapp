"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../utils/api';
import { Episodio, Temporada } from '../../../types';
import { ArrowLeft, Save, Film, Tv, Flame, Plus, Trash2, X, Sparkles, Loader2 } from 'lucide-react';

interface CategoriaDB {
  _id: string;
  nombre: string;
}

interface ContentFetchResponse {
  _id?: string;
  titulo: string;
  descripcion: string;
  tipo: 'anime' | 'pelicula' | 'serie';
  imagen?: string;
  videoUrl?: string;
  linkTrailer?: string;
  isPremium?: boolean;
  status?: 'en_emision' | 'finalizada';
  episodios?: Episodio[];
  temporadas?: Temporada[];
  categorias?: (string | CategoriaDB)[];
}

// Interfaz auxiliar para interceptar respuestas envueltas del Backend de manera tipada
interface WrappedBackendResponse {
  data?: ContentFetchResponse;
  content?: ContentFetchResponse;
  serie?: ContentFetchResponse;
}

function FormularioInterno({ editId }: { editId: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de los campos
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoriaDB[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [tipo, setTipo] = useState<'anime' | 'pelicula' | 'serie'>('pelicula');
  const [titulo, setTitulo] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [imagen, setImagen] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [linkTrailer, setLinkTrailer] = useState<string>('');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [status, setStatus] = useState<'en_emision' | 'finalizada'>('en_emision');
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [nuevoEpisodioData, setNuevoEpisodioData] = useState<{ [key: number]: Omit<Episodio, 'numero'> }>({});

  useEffect(() => {
    let activo = true;

    const inicializarFormulario = async () => {
      console.log("=== DIAGNÓSTICO FORMULARIO ===");
      console.log("ID recibido de la URL (editId):", editId);

      if (editId) {
        setLoadingData(true);
      }
      
      try {
        console.log("Solicitando categorías a /categories...");
        const cats = await apiFetch('/categories') as CategoriaDB[];
        if (activo) setCategoriasDisponibles(cats || []);
        console.log("Categorías cargadas con éxito:", cats?.length || 0);

        if (editId) {
          console.log(`Solicitando datos del contenido a: /content/${editId}`);
          const item = await apiFetch(`/content/${editId}`) as ContentFetchResponse & WrappedBackendResponse;
          
          console.log("Datos crudos recibidos del backend:", item);

          if (!item || Object.keys(item).length === 0) {
            throw new Error("El backend respondió, pero el objeto de la serie vino vacío.");
          }
          
          if (item && activo) {
            console.log("=== ANALIZANDO PROPIEDADES INYECTADAS ===");

            // 1. EXTRAER EL OBJETO REAL
            let datosReales: ContentFetchResponse = item;
            
            if (item && typeof item === 'object') {
              if (item.data) {
                datosReales = item.data;
                console.log("-> 📦 Datos detectados dentro de la propiedad '.data'");
              } else if (item.content) {
                datosReales = item.content;
                console.log("-> 📦 Datos detectados dentro de la propiedad '.content'");
              } else if (item.serie) {
                datosReales = item.serie;
                console.log("-> 📦 Datos detectados dentro de la propiedad '.serie'");
              }
            }

            console.log("-> Objeto real tras desenvolvimiento:", datosReales);
            console.log("-> Titulo real:", datosReales?.titulo);
            console.log("-> Tipo real:", datosReales?.tipo);

            // 2. INYECTAR EN LOS ESTADOS
            const tipoNormalizado = String(datosReales?.tipo || 'pelicula').trim().toLowerCase() as 'anime' | 'pelicula' | 'serie';

            setTitulo(datosReales?.titulo || '');
            setDescripcion(datosReales?.descripcion || '');
            setTipo(tipoNormalizado);
            setImagen(datosReales?.imagen || '');
            setLinkTrailer(datosReales?.linkTrailer || '');
            setIsPremium(datosReales?.isPremium || false);
            setStatus(datosReales?.status || 'en_emision');
            setVideoUrl(datosReales?.videoUrl || '');
            
            if (datosReales?.temporadas && Array.isArray(datosReales.temporadas)) {
              setTemporadas(datosReales.temporadas);
            } else if (datosReales?.episodios && Array.isArray(datosReales.episodios) && tipoNormalizado !== 'pelicula') {
              console.warn("⚠️ Agrupando episodios sueltos en Temporada 1.");
              setTemporadas([{ numero: 1, episodios: datosReales.episodios }]);
            } else {
              setTemporadas([]);
            }

            if (datosReales?.categorias && Array.isArray(datosReales.categorias)) {
              const ids = datosReales.categorias
                .filter(c => c !== null && c !== undefined)
                .map((c) => (typeof c === 'object' && '_id' in c ? c._id : String(c)));
              setCategoriasSeleccionadas(ids);
            }
            
            console.log("=> ¡Todos los estados locales de React han sido actualizados!");
          }
        }
      } catch (err) { 
        // Capturamos el error de manera limpia y estricta sin usar ': any'
        const errorMessage = err instanceof Error ? err.message : 'Revisa la consola (F12) para más detalles.';
        console.error("❌ ERROR CRÍTICO EN INICIALIZARFORMULARIO:", err);
        
        if (activo) {
          setMessage({ 
            type: 'error', 
            text: `Error al sincronizar datos: ${errorMessage}` 
          });
        }
      } finally {
        if (activo) setLoadingData(false);
      }
    };

    inicializarFormulario();
    return () => { activo = false; };
  }, [editId]);

  const handleCheckboxChange = (id: string) => {
    setCategoriasSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]
    );
  };

  const handleAddTemporada = () => {
    const nuevoNumero = temporadas.length + 1;
    setTemporadas([...temporadas, { numero: nuevoNumero, episodios: [] }]);
  };

  const handleRemoveTemporada = (indexTemp: number) => {
    const filtradas = temporadas.filter((_, i) => i !== indexTemp);
    setTemporadas(filtradas.map((t, i) => ({ ...t, numero: i + 1 })));
  };

  const handleAddEpisodioATemporada = (numeroTemporada: number) => {
    const data = nuevoEpisodioData[numeroTemporada];
    if (!data || !data.titulo || !data.url) {
      alert("Por favor, llena el título y la URL del capítulo.");
      return;
    }

    setTemporadas(prev => prev.map(temp => {
      if (temp.numero === numeroTemporada) {
        return {
          ...temp,
          episodios: [...temp.episodios, { 
            numero: temp.episodios.length + 1, 
            titulo: data.titulo, 
            url: data.url, 
            createdAt: new Date().toISOString()
          }]
        };
      }
      return temp;
    }));

    setNuevoEpisodioData(prev => ({ ...prev, [numeroTemporada]: { titulo: '', url: '' } }));
  };

  const handleRemoveEpisodioDeTemporada = (numeroTemporada: number, indexEpisodio: number) => {
    setTemporadas(prev => prev.map(temp => {
      if (temp.numero === numeroTemporada) {
        const filtrados = temp.episodios.filter((_, i) => i !== indexEpisodio);
        return { ...temp, episodios: filtrados.map((ep, i) => ({ ...ep, numero: i + 1 })) };
      }
      return temp;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categoriasSeleccionadas.length === 0) {
      alert("Selecciona al menos una categoría.");
      return;
    }

    setLoading(true);
    const payload: ContentFetchResponse = {
      titulo,
      descripcion,
      tipo,
      imagen,
      linkTrailer: linkTrailer || undefined,
      categorias: categoriasSeleccionadas,
      isPremium,
      status: tipo !== 'pelicula' ? status : undefined
    };

    if (tipo === 'pelicula') {
      payload.videoUrl = videoUrl;
      payload.temporadas = [];
      payload.episodios = [];
    } else {
      payload.temporadas = temporadas;
      payload.episodios = temporadas.flatMap(t => t.episodios);
    }

    try {
      if (editId) {
        await apiFetch(`/content/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/content', { method: 'POST', body: JSON.stringify(payload) });
      }
      router.push('/admin/content');
      router.refresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error de comunicación con el servidor al guardar.' });
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-10 bg-[#0a0a0a] min-h-screen text-white flex flex-col items-center justify-center gap-4">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-zinc-400 font-medium tracking-wide animate-pulse">Sincronizando información de la obra...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col gap-2">
        <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-500 font-semibold tracking-wide transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> VOLVER AL LISTADO
        </Link>
        <h1 className="text-3xl font-black mt-1 tracking-tight text-white flex items-center gap-3">
          {editId ? (
            <>
              <span className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xl">✏️</span>
              Editando: <span className="text-zinc-300 font-extrabold">{titulo || 'Cargando...'}</span>
            </>
          ) : (
            <>
              <span className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xl">➕</span>
              Registrar Nuevo Contenido
            </>
          )}
        </h1>
      </div>

      {message && (
        <div className="p-4 rounded-xl text-sm border bg-red-950/40 text-red-400 border-red-500/20 backdrop-blur-md">
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-zinc-950 border border-white/5 p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        
        {/* Fila superior de selectores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">Formato</label>
            <div className="relative">
              <select 
                value={tipo}
                onChange={(e) => setTipo(e.target.value as 'anime' | 'pelicula' | 'serie')}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 text-sm outline-none text-white focus:border-red-500/50 transition-colors cursor-pointer appearance-none"
              >
                <option value="pelicula">🎬 Película</option>
                <option value="serie">📺 Serie de TV</option>
                <option value="anime">💥 Anime Japonés</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">Acceso del Usuario</label>
            <div className="flex gap-2 h-[48px] bg-zinc-900 border border-white/10 p-1 rounded-xl">
              <button
                type="button" onClick={() => setIsPremium(false)}
                className={`flex-1 h-full rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-200 ${!isPremium ? 'bg-zinc-800 text-white border border-white/10 shadow-md' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                Free
              </button>
              <button
                type="button" onClick={() => setIsPremium(true)}
                className={`flex-1 h-full rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5 ${isPremium ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                Premium <Sparkles className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">Estado de Emisión</label>
            <select
              disabled={tipo === 'pelicula'}
              value={status}
              onChange={(e) => setStatus(e.target.value as 'en_emision' | 'finalizada')}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 text-sm outline-none text-white focus:border-red-500/50 transition-colors disabled:opacity-20 cursor-pointer"
            >
              <option value="en_emision">🟢 En Emisión</option>
              <option value="finalizada">🔴 Finalizada</option>
            </select>
          </div>
        </div>

        {/* Fila de Textos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">Título de la Obra</label>
            <input 
              type="text" required placeholder="Ej: Bleach TYBW"
              value={titulo} onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-red-500/50 text-white transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">URL del Póster</label>
            <input 
              type="url" required placeholder="https://imagen.com/poster.jpg"
              value={imagen} onChange={(e) => setImagen(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-red-500/50 text-white font-mono transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">Sinopsis / Descripción</label>
          <textarea 
            rows={4} required placeholder="Escribe la sinopsis oficial de la producción..."
            value={descripcion} 
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-red-500/50 text-white resize-none transition-colors leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">URL del Tráiler</label>
            <input 
              type="url" placeholder="https://youtube.com/embed/..."
              value={linkTrailer} onChange={(e) => setLinkTrailer(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-red-500/50 text-white font-mono transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">Categorías Asignadas</label>
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-3.5 max-h-[110px] overflow-y-auto grid grid-cols-2 gap-2 scrollbar-none">
              {categoriasDisponibles.map((cat) => (
                <label key={cat._id} className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-pointer select-none hover:text-white transition-colors">
                  <input 
                    type="checkbox"
                    checked={categoriasSeleccionadas.includes(cat._id)}
                    onChange={() => handleCheckboxChange(cat._id)}
                    className="rounded border-white/10 bg-zinc-950 text-red-600 focus:ring-0 w-4 h-4"
                  />
                  {cat.nombre}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Sección condicional avanzada */}
        {tipo === 'pelicula' ? (
          <div className="border-t border-white/5 pt-6 space-y-2 animate-fade-in">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-red-500" /> Streaming URL (Película)
            </label>
            <input 
              type="url" required placeholder="https://servidor-video.com/movie.mp4"
              value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-red-500/50 text-white font-mono transition-colors"
            />
          </div>
        ) : (
          <div className="border-t border-white/5 pt-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-red-500" /> Temporadas y Capítulos semanales
              </h3>
              <button
                type="button" onClick={handleAddTemporada}
                className="bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs px-4 py-2.5 rounded-xl text-red-400 hover:text-red-500 transition-all font-bold flex items-center gap-1 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir Temporada
              </button>
            </div>

            <div className="space-y-6">
              {temporadas.map((temp, indexTemp) => (
                <div key={temp.numero} className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl space-y-4 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" /> Temporada {temp.numero}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTemporada(indexTemp)} 
                      className="text-xs text-zinc-500 hover:text-red-400 font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Eliminar Temp.
                    </button>
                  </div>

                  {temp.episodios && temp.episodios.length > 0 && (
                    <div className="text-xs divide-y divide-white/5 bg-black/30 border border-white/5 rounded-xl p-2 max-h-48 overflow-y-auto space-y-0.5 scrollbar-none">
                      {temp.episodios.map((ep, idxEp) => (
                        <div key={idxEp} className="flex items-center justify-between p-2.5 hover:bg-white/[0.02] rounded-lg transition-colors">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-zinc-300 font-mono">
                              Cap {ep.numero}: <strong className="text-white font-sans">{ep.titulo}</strong>
                            </span>
                            {ep.createdAt && (
                              <span className="text-[10px] text-zinc-500 font-medium">
                                Lanzado: {new Date(ep.createdAt).toLocaleDateString()} a las {new Date(ep.createdAt).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveEpisodioDeTemporada(temp.numero, idxEp)} 
                            className="text-zinc-500 hover:text-red-500 p-1 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-zinc-950/50 p-3 rounded-xl border border-white/5">
                    <div className="space-y-1.5">
                      <input 
                        type="text" placeholder="Título del capítulo semanal"
                        value={nuevoEpisodioData[temp.numero]?.titulo || ''}
                        onChange={(e) => setNuevoEpisodioData(prev => ({ ...prev, [temp.numero]: { ...(prev[temp.numero] || { titulo: '', url: '' }), titulo: e.target.value } }))}
                        className="w-full bg-zinc-900 border border-white/5 rounded-lg p-2.5 text-xs text-white outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <input 
                        type="url" placeholder="URL (.mp4 / embed)"
                        value={nuevoEpisodioData[temp.numero]?.url || ''}
                        onChange={(e) => setNuevoEpisodioData(prev => ({ ...prev, [temp.numero]: { ...(prev[temp.numero] || { titulo: '', url: '' }), url: e.target.value } }))}
                        className="w-full bg-zinc-900 border border-white/5 rounded-lg p-2.5 text-xs text-white font-mono outline-none focus:border-zinc-700"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleAddEpisodioATemporada(temp.numero)} 
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider p-2.5 h-[38px] rounded-lg transition-colors shadow-md shadow-red-950/20"
                    >
                      Agregar Capítulo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer del Formulario */}
        <div className="flex justify-end gap-3 border-t border-white/5 pt-6">
          <button 
            type="button" 
            onClick={() => router.push('/admin/content')} 
            className="bg-transparent hover:bg-white/5 border border-white/5 text-zinc-400 hover:text-white font-bold px-6 py-3 rounded-xl text-sm transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-black px-7 py-3 rounded-xl text-sm transition-all shadow-lg shadow-red-950/30 active:scale-95 inline-flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editId ? 'Actualizar Registro' : 'Dar de Alta'}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormularioContenidoConParametros() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  return <FormularioInterno key={editId} editId={editId} />;
}

export default function FormularioContenido() {
  return (
    <div className="p-6 md:p-12 bg-[#0a0a0a] min-h-screen text-zinc-100 antialiased selection:bg-red-600 selection:text-white">
      <Suspense fallback={
        <div className="p-10 bg-[#0a0a0a] min-h-screen text-white flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <p className="text-sm text-zinc-500 font-medium tracking-wide">Cargando componentes del sistema...</p>
        </div>
      }>
        <FormularioContenidoConParametros />
      </Suspense>
    </div>
  );
}