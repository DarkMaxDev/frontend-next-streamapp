"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api'; // Corregido el alias por ruta relativa limpia
import { Category, Content, Episodio } from '../../types'; // Corregido el alias por ruta relativa limpia
interface ContenidoForm extends Omit<Content, 'categorias' | '_id'> {
    linkTrailer?: string;
    categorias: string[]; 
}

export default function AdminContent() {
    const [categories, setCategories] = useState<Category[]>([]);
    
    const [nuevoEpisodio, setNuevoEpisodio] = useState<Omit<Episodio, 'numero'>>({
        titulo: '',
        url: ''
    });

    const [form, setForm] = useState<ContenidoForm>({
        titulo: '',
        descripcion: '',
        tipo: 'pelicula',
        imagen: '',
        videoUrl: '',
        linkTrailer: '',
        categorias: [],
        episodios: [],
        isPremium: false
    });

    useEffect(() => {
        apiFetch('/categories')
            .then((data) => {
                setCategories(Array.isArray(data) ? data : []);
            })
            .catch((err: unknown) => {
                console.error("Error al cargar categorías:", err);
            });
    }, []);

    const handleCategoryChange = (catId: string, checked: boolean) => {
        setForm(prev => ({
            ...prev,
            categorias: checked 
                ? [...prev.categorias, catId] 
                : prev.categorias.filter(id => id !== catId)
        }));
    };

    const agregarEpisodio = () => {
        if (!nuevoEpisodio.titulo || !nuevoEpisodio.url) {
            return alert("Por favor asigna un título y una URL válida al episodio.");
        }

        const listaActual = form.episodios || [];
        const nuevoNumero = listaActual.length + 1;

        setForm(prev => ({
            ...prev,
            episodios: [...listaActual, { numero: nuevoNumero, ...nuevoEpisodio }]
        }));

        setNuevoEpisodio({ titulo: '', url: '' });
    };

    const removerEpisodio = (index: number) => {
        const filtrados = (form.episodios || []).filter((_, i) => i !== index);
        const reestructurados = filtrados.map((ep, i) => ({ ...ep, numero: i + 1 }));
        
        setForm(prev => ({ ...prev, episodios: reestructurados }));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!form.titulo) return alert("El título es obligatorio");
        
        if (form.tipo === 'pelicula' && !form.videoUrl) {
            return alert("Las películas requieren una URL de Video base obligatoria.");
        }
        if (form.tipo !== 'pelicula' && (!form.episodios || form.episodios.length === 0)) {
            return alert("Las series o animes requieren tener al menos un episodio registrado.");
        }

        try {
            await apiFetch('/contents', {
                method: 'POST',
                body: JSON.stringify(form)
            });

            alert("¡Contenido multimedia publicado exitosamente!");
            
            setForm({
                titulo: '',
                descripcion: '',
                tipo: 'pelicula',
                imagen: '',
                videoUrl: '',
                linkTrailer: '',
                categorias: [],
                episodios: [],
                isPremium: false
            });
        } catch (error: unknown) {
            console.error("Error en la publicación del contenido:", error);
            
            const apiError = error as {
                response?: {
                    data?: {
                        msg?: string;
                    };
                };
                message?: string;
            };

            const msg = apiError.response?.data?.msg || apiError.message || "Error de conexión con el servidor";
            alert(`Error: ${msg}`);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto bg-white shadow-2xl rounded-2xl my-10 border border-gray-100 text-gray-800">
            <h1 className="text-3xl font-black mb-6 border-b pb-4 tracking-tight text-gray-900">
                Publicar Nuevo Contenido
            </h1>
            
            <form onSubmit={handleCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-widest">Título del Contenido *</label>
                        <input 
                            className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                            value={form.titulo}
                            onChange={e => setForm({...form, titulo: e.target.value})} 
                            required
                            placeholder="Ej. Chainsaw Man"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-widest">Tipo</label>
                        <select 
                            className="w-full border border-gray-200 p-3 rounded-xl outline-none bg-white cursor-pointer focus:ring-2 focus:ring-blue-500"
                            value={form.tipo}
                            onChange={e => setForm({...form, tipo: e.target.value as Content['tipo'], videoUrl: '', episodios: []})}
                        >
                            <option value="pelicula">Película</option>
                            <option value="serie">Serie</option>
                            <option value="anime">Anime</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-widest">Sinopsis / Descripción</label>
                    <textarea 
                        rows={3}
                        className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                        value={form.descripcion}
                        onChange={e => setForm({...form, descripcion: e.target.value})} 
                        placeholder="Escribe un resumen atractivo del argumento..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-widest">URL Imagen (Poster)</label>
                        <input 
                            className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                            value={form.imagen}
                            onChange={e => setForm({...form, imagen: e.target.value})} 
                            placeholder="https://m.media-amazon.com/..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-widest">Link del Tráiler (YouTube/URL)</label>
                        <input 
                            className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                            value={form.linkTrailer}
                            onChange={e => setForm({...form, linkTrailer: e.target.value})} 
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>
                </div>

                {form.tipo === 'pelicula' && (
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1 tracking-widest">URL del Video de la Película *</label>
                        <input 
                            className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                            value={form.videoUrl}
                            onChange={e => setForm({...form, videoUrl: e.target.value})} 
                            placeholder="https://ejemplo.com/videos/pelicula.mp4"
                        />
                    </div>
                )}

                {form.tipo !== 'pelicula' && (
                    <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200/60 space-y-4">
                        <p className="text-xs font-black uppercase text-zinc-500 tracking-widest border-b pb-2">
                            Gestor de Episodios Estructurados ({form.episodios?.length || 0})
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input 
                                type="text"
                                placeholder="Nombre del capítulo"
                                className="p-2.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500"
                                value={nuevoEpisodio.titulo}
                                onChange={e => setNuevoEpisodio({...nuevoEpisodio, titulo: e.target.value})}
                            />
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="URL del archivo (.mp4)"
                                    className="p-2.5 border border-gray-200 rounded-lg text-xs bg-white flex-1 outline-none focus:ring-1 focus:ring-blue-500"
                                    value={nuevoEpisodio.url}
                                    onChange={e => setNuevoEpisodio({...nuevoEpisodio, url: e.target.value})}
                                />
                                <button 
                                    type="button"
                                    onClick={agregarEpisodio}
                                    className="bg-zinc-900 text-white px-4 rounded-lg font-bold text-xs hover:bg-zinc-800 transition"
                                >
                                    + Añadir
                                </button>
                            </div>
                        </div>

                        {form.episodios && form.episodios.length > 0 && (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-2">
                                {form.episodios.map((ep, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white border p-2 rounded-lg text-xs shadow-sm">
                                        <span className="font-semibold text-gray-700 truncate max-w-[85%]">
                                            Cap {ep.numero}: {ep.titulo}
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={() => removerEpisodio(i)}
                                            className="text-red-500 font-bold hover:text-red-700 px-2"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">Asignar Categorías</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categories.length > 0 ? (
                            categories.map((cat) => (
                                <label key={cat._id} className="flex items-center group cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                        checked={form.categorias.includes(cat._id)}
                                        onChange={(e) => handleCategoryChange(cat._id, e.target.checked)}
                                    />
                                    <span className="ml-2 text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                                        {cat.nombre}
                                    </span>
                                </label>
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 italic">Cargando categorías operativas...</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center p-4 bg-amber-50 rounded-2xl border border-amber-100 transition-all hover:bg-amber-100/50">
                    <input 
                        type="checkbox" 
                        id="premium"
                        checked={form.isPremium}
                        className="h-5 w-5 text-amber-500 border-gray-300 rounded cursor-pointer"
                        onChange={e => setForm({...form, isPremium: e.target.checked})} 
                    />
                    <label htmlFor="premium" className="ml-3 text-sm font-bold text-amber-700 uppercase tracking-tight cursor-pointer">
                        Marcar como Contenido Premium ⭐
                    </label>
                </div>

                <button 
                    type="submit"
                    className="bg-blue-600 text-white p-4 w-full font-black rounded-2xl shadow-xl hover:bg-blue-700 hover:shadow-blue-200 transition-all active:scale-95 uppercase tracking-widest text-sm"
                >
                    Publicar Contenido en Catálogo
                </button>
            </form>
        </div>
    );
}