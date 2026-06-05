"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../utils/api';
import { Episodio } from '../../../types';

interface CategoriaDB {
  _id: string;
  nombre: string;
}

// Interface estricta para el tipado de la respuesta del Backend sin usar 'any'
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
  categorias?: (string | CategoriaDB)[];
}

function FormularioContenidoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados del Formulario
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
  
  // Estado de episodios
  const [episodios, setEpisodios] = useState<Episodio[]>([]);
  const [nuevoEpisodio, setNuevoEpisodio] = useState<Omit<Episodio, 'numero'>>({ titulo: '', url: '' });

  // Carga inicial unificada de Categorías y Datos de Edición si aplican
  useEffect(() => {
    let activo = true;

    const cargarDatosIniciales = async () => {
      if (editId) setLoadingData(true);
      try {
        // 1. Traer categorías disponibles de manera limpia
        const cats = await apiFetch('/categories') as CategoriaDB[];
        if (activo) setCategoriasDisponibles(cats || []);

        // 2. Traer contenido si estamos editando
        if (editId) {
          const item = await apiFetch(`/content/${editId}`) as ContentFetchResponse;
          
          if (item && activo) {
            setTitulo(item.titulo || '');
            setDescripcion(item.descripcion || '');
            setTipo(item.tipo || 'pelicula');
            setImagen(item.imagen || '');
            setLinkTrailer(item.linkTrailer || '');
            setIsPremium(item.isPremium || false);
            setStatus(item.status || 'en_emision');
            setVideoUrl(item.videoUrl || '');
            
            // Si episodios viene corrupto o no existe en la BD, forzamos un arreglo vacío seguro
            setEpisodios(Array.isArray(item.episodios) ? item.episodios : []);

            // CONTROL DE ERRORES CRUCIAL PARA CATEGORÍAS CORRUPTAS O BORRADAS
            if (item.categorias && Array.isArray(item.categorias)) {
              const ids = item.categorias
                .filter(cat => cat !== null && cat !== undefined) // Filtramos nulos que tiran el sistema
                .map((cat) => {
                  if (typeof cat === 'object' && '_id' in cat) {
                    return cat._id;
                  }
                  return String(cat);
                });
              setCategoriasSeleccionadas(ids);
            } else {
              setCategoriasSeleccionadas([]);
            }
          }
        }
      } catch (err: unknown) {
        console.error("=== ERROR DETECTADO EN EL FORMULARIO ===");
        console.error("Objeto de error completo:", err);
        
        let errorMsg = 'No se pudieron sincronizar los datos de la serie de forma segura.';
        
        // 🛡️ Validación estricta de la estructura del error sin usar 'any'
        if (err && typeof err === 'object') {
          const axiosError = err as { 
            response?: { 
              data?: { 
                msg?: string 
              } 
            }; 
            message?: string 
          };

          if (axiosError.response?.data?.msg) {
            errorMsg = axiosError.response.data.msg;
          } else if (axiosError.message) {
            errorMsg = `Error de red: ${axiosError.message}`;
          }
        }
        
        if (activo) setMessage({ type: 'error', text: errorMsg });
      } finally {
        if (activo) setLoadingData(false);
      }
    };

    cargarDatosIniciales();

    return () => {
      activo = false;
    };
  }, [editId]);

  const handleCheckboxChange = (id: string) => {
    setCategoriasSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]
    );
  };

  const handleAddEpisodio = () => {
    if (!nuevoEpisodio.titulo || !nuevoEpisodio.url) {
      alert("Introduce el título y la URL del capítulo.");
      return;
    }
    const numero = episodios.length + 1;
    setEpisodios([...episodios, { numero, ...nuevoEpisodio }]);
    setNuevoEpisodio({ titulo: '', url: '' });
  };

  const handleRemoveEpisodio = (index: number) => {
    const filtrados = episodios.filter((_, i) => i !== index);
    setEpisodios(filtrados.map((ep, i) => ({ ...ep, numero: i + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categoriasSeleccionadas.length === 0) {
      alert("Selecciona al menos una categoría.");
      return;
    }

    setLoading(true);
    setMessage(null);

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
      payload.episodios = [];
    } else {
      payload.episodios = episodios;
      payload.videoUrl = ''; 
    }

    try {
      if (editId) {
        await apiFetch(`/content/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/content', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.push('/admin/content');
    } catch (err: unknown) {
      let mensajeError = "Ocurrió un problema guardando en la BD.";
      if (err && typeof err === 'object') {
        const errorObj = err as { message?: string };
        if (errorObj.message) mensajeError = errorObj.message;
      }
      setMessage({ type: 'error', text: mensajeError });
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-10 bg-[#141414] min-h-screen text-white flex items-center justify-center">
        <p className="text-sm text-gray-400 italic animate-pulse">Cargando datos multimedia...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-[#141414] min-h-screen text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div>
          <Link href="/admin/content" className="text-xs text-gray-400 hover:text-blue-400 transition">← Volver al Listado del Catálogo</Link>
          <h1 className="text-2xl font-black mt-2">
            {editId ? `✏️ Editando: ${titulo || 'Cargando...'}` : "➕ Registrar Nuevo Contenido"}
          </h1>
        </div>

        {message && (
          <div className="p-4 rounded-xl text-sm border bg-red-500/10 text-red-400 border-red-500/20">
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Formato</label>
              <select 
                value={tipo}
                onChange={(e) => setTipo(e.target.value as 'anime' | 'pelicula' | 'serie')}
                className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl p-3.5 text-sm outline-none text-white focus:border-blue-500"
              >
                <option value="pelicula">🎬 Película</option>
                <option value="serie">📺 Serie de TV</option>
                <option value="anime">💥 Anime Japonés</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Acceso</label>
              <div className="flex gap-2 h-12 items-center">
                <button
                  type="button" onClick={() => setIsPremium(false)}
                  className={`flex-1 h-full rounded-xl text-xs font-bold border transition ${!isPremium ? 'bg-zinc-800 text-white border-white/20' : 'bg-transparent text-gray-500 border-white/5'}`}
                >
                  Free
                </button>
                <button
                  type="button" onClick={() => setIsPremium(true)}
                  className={`flex-1 h-full rounded-xl text-xs font-bold border transition ${isPremium ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-transparent text-gray-500 border-white/5'}`}
                >
                  Premium ⭐
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Estado</label>
              <select
                disabled={tipo === 'pelicula'}
                value={status}
                onChange={(e) => setStatus(e.target.value as 'en_emision' | 'finalizada')}
                className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl p-3.5 text-sm outline-none text-white focus:border-blue-500 disabled:opacity-30"
              >
                <option value="en_emision">🟢 En Emisión</option>
                <option value="finalizada">🔴 Finalizada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Título de la Obra</label>
              <input 
                type="text" required placeholder="Ej: Bleach TYBW"
                value={titulo} onChange={(e) => setTitulo(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-blue-500 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">URL del Póster</label>
              <input 
                type="url" required placeholder="https://imagen.com/poster.jpg"
                value={imagen} onChange={(e) => setImagen(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-blue-500 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Sinopsis / Descripción</label>
            <textarea 
              rows={3} required placeholder="Escribe la sinopsis oficial de la obra..."
              value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-blue-500 text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">URL del Tráiler</label>
              <input 
                type="url" placeholder="https://youtube.com/embed/..."
                value={linkTrailer} onChange={(e) => setLinkTrailer(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-blue-500 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Categorías</label>
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 max-h-32 overflow-y-auto grid grid-cols-2 gap-2">
                {categoriasDisponibles.map((cat) => (
                  <label key={cat._id} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none hover:text-white">
                    <input 
                      type="checkbox"
                      checked={categoriasSeleccionadas.includes(cat._id)}
                      onChange={() => handleCheckboxChange(cat._id)}
                      className="rounded border-white/10 bg-zinc-900 text-blue-600 focus:ring-0"
                    />
                    {cat.nombre}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {tipo === 'pelicula' ? (
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <h3 className="text-sm font-bold mb-3 text-blue-400">🎬 URL de Video (Película)</h3>
              <input 
                type="url" required={tipo === 'pelicula'} placeholder="https://storage.com/movie.mp4"
                value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3.5 text-sm outline-none focus:border-blue-500 text-white font-mono"
              />
            </div>
          ) : (
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-purple-400 flex justify-between items-center">
                <span>📺 Gestor de Capítulos ({episodios.length})</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-lg border border-white/5">
                <input 
                  type="text" placeholder="Nombre (Ej: Capítulo 12)"
                  value={nuevoEpisodio.titulo} onChange={(e) => setNuevoEpisodio({...nuevoEpisodio, titulo: e.target.value})}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-purple-500"
                />
                <div className="flex gap-2">
                  <input 
                    type="url" placeholder="https://storage.com/cap-12.mp4"
                    value={nuevoEpisodio.url} onChange={(e) => setNuevoEpisodio({...nuevoEpisodio, url: e.target.value})}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono outline-none focus:border-purple-500"
                  />
                  <button
                    type="button" onClick={handleAddEpisodio}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 rounded-lg text-xs"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {episodios.map((ep, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/[0.03] p-2.5 rounded-lg text-xs border border-white/5">
                    <span className="text-gray-300 truncate max-w-xl">
                      <span className="text-purple-400 font-mono font-bold mr-2">EP {ep.numero}</span> 
                      {ep.titulo}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveEpisodio(idx)} 
                      className="text-red-400 hover:text-red-500 font-bold px-2 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/content')}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold p-4 rounded-xl text-sm transition"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              className={`flex-[2] font-black p-4 rounded-xl transition disabled:opacity-50 text-sm tracking-wide ${
                editId ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {loading ? "Guardando..." : editId ? "✏️ Actualizar Obra" : "💾 Registrar Contenido"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default function FormularioContenido() {
  return (
    <Suspense fallback={<div className="p-10 text-white bg-[#141414] min-h-screen">Cargando Formulario...</div>}>
      <FormularioContenidoContent />
    </Suspense>
  );
}