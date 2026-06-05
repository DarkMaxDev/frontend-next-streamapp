"use client";
import { useEffect, useState } from 'react';
import { apiFetch } from './utils/api';
import Link from 'next/link';
import { Play, Info, Award } from 'lucide-react';
import { Category, Content } from './types';
import Navbar from '../components/Navbar';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Content | null>(null);
  const [recommendations, setRecommendations] = useState<Content[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

useEffect(() => {
    const loadCatalog = async () => {
      try {
        const data = await apiFetch('/categories') as Category[];
        setCategories(data);
        
        // 1. Aplanamos la lista de todos los contenidos
        const rawFlatList = data.flatMap((c: Category) => c.contents || []);
        
        // 2. Filtramos para eliminar duplicados comparando sus _id únicos
        const uniqueFlatList = rawFlatList.filter((content, index, self) =>
          self.findIndex((c) => c._id === content._id) === index
        );
        
        if (uniqueFlatList.length > 0) {
          // Seleccionar uno aleatorio para el banner principal
          setFeatured(uniqueFlatList[Math.floor(Math.random() * uniqueFlatList.length)]);
          
          // 3. Barajamos la lista que ya sabemos que es 100% única
          const shuffled = [...uniqueFlatList].sort(() => 0.5 - Math.random());
          setRecommendations(shuffled.slice(0, 6));
        }
      } catch (err) {
        console.error("Error al sincronizar catálogo:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="tracking-[0.2em] text-red-600 font-black text-xl animate-pulse">STREAMAPP</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#141414] text-white pb-24 overflow-x-hidden antialiased selection:bg-red-600 selection:text-white">
      <Navbar />

      {/* Hero Showcase Banner */}
      <div 
        className="relative h-[85vh] w-full flex flex-col justify-end pb-24 px-4 sm:px-8 md:px-16 bg-cover bg-center transition-all duration-1000 ease-in-out"
        style={{ 
          backgroundImage: `linear-gradient(to top, #141414 5%, rgba(20,20,20,0.7) 30%, rgba(20,20,20,0) 70%, rgba(0,0,0,0.6) 100%), url(${featured?.imagen || 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=1600'})` 
        }}
      >
        <div className="max-w-2xl z-10 space-y-4 md:space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-red-500 bg-red-900/20 px-2.5 py-0.5 rounded border border-red-500/30">
              {featured?.tipo || 'Original'}
            </span>
            {featured?.isPremium && (
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/30 px-2.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> VIP
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-xl max-w-xl leading-tight">
            {featured?.titulo || "Cargando Novedades"}
          </h1>
          
          <p className="text-zinc-200 text-sm sm:text-base drop-shadow-md line-clamp-3 leading-relaxed max-w-xl font-normal">
            {featured?.descripcion || "Explora el catálogo definitivo lleno de producciones exclusivas de cine, anime y series sin límites."}
          </p>
          
          <div className="flex gap-3 pt-3">
            <Link 
              href={`/dashboard/watch/${featured?._id}`}
              className="flex items-center gap-2.5 bg-white text-black font-semibold px-7 py-2.5 rounded hover:bg-white/80 transition duration-200 shadow-md active:scale-95 transform text-sm md:text-base"
            >
              <Play className="fill-current w-5 h-5" /> Reproducir
            </Link>
            <button className="flex items-center gap-2.5 bg-zinc-500/30 backdrop-blur-md text-white font-semibold px-7 py-2.5 rounded hover:bg-zinc-500/50 transition duration-200 text-sm md:text-base border border-zinc-500/20">
              <Info className="w-5 h-5" /> Más información
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor de Listas */}
      <div className="px-4 sm:px-8 md:px-16 space-y-14 -mt-16 relative z-30">
        
        {/* RECOMENDACIONES (Formato horizontal premium) */}
        {recommendations.length > 0 && (
          <div className="relative">
            <h2 className="text-lg md:text-xl font-semibold mb-3.5 text-zinc-100 tracking-tight pl-1">
              Recomendados para ti
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {recommendations.map((item) => (
                <Link 
                  key={item._id}
                  href={`/dashboard/watch/${item._id}`}
                  className="group relative bg-zinc-900 rounded-md overflow-hidden border border-zinc-800/40 hover:border-zinc-700/80 transition-all duration-300 aspect-[16/9] shadow-lg hover:scale-105 active:scale-98 cursor-pointer"
                >
                  <img 
                    src={item.imagen} 
                    alt={item.titulo} 
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                  />
                  {item.isPremium && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-md z-10">
                      VIP
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                    <p className="text-xs font-semibold text-white truncate w-full">{item.titulo}</p>
                    <p className="text-[10px] text-zinc-400 capitalize mt-0.5">{item.tipo}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FILAS DINÁMICAS POR CATEGORÍA */}
        {categories.map((cat) => (
          <div key={cat._id} className="relative group/row">
            <h2 className="text-lg md:text-xl font-semibold mb-3.5 text-zinc-200 hover:text-white transition-colors duration-200 cursor-pointer inline-flex items-center gap-1 tracking-tight pl-1">
              {cat.nombre} <span className="text-[10px] text-cyan-400 opacity-0 group-hover/row:opacity-100 transition-all duration-300 transform translate-x-[-5px] group-hover/row:translate-x-0 font-normal">Explorar todo ›</span>
            </h2>
            
            <div className="flex gap-3 overflow-x-auto pb-5 pt-1 -my-1 scrollbar-none scroll-smooth mask-linear-edge">
              {cat.contents && cat.contents.length > 0 ? (
                cat.contents.map((item) => (
                  <Link
                    key={item._id}
                    href={`/dashboard/watch/${item._id}`}
                    className="w-[220px] sm:w-[260px] md:w-[290px] aspect-[16/9] bg-zinc-900 rounded-md relative overflow-hidden group hover:scale-105 border border-zinc-800/40 hover:border-zinc-700/80 transition-all duration-300 shadow-md flex-shrink-0 cursor-pointer"
                  >
                    {item.imagen ? (
                      <img 
                        src={item.imagen} 
                        alt={item.titulo} 
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 bg-zinc-800 text-center">
                        <span className="text-zinc-400 text-xs font-medium tracking-tight line-clamp-2">{item.titulo}</span>
                      </div>
                    )}

                    {item.isPremium && (
                      <span className="absolute top-2 right-2 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow z-10">VIP</span>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-3">
                      <p className="text-xs font-semibold truncate w-full text-white">{item.titulo}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-zinc-500 text-xs italic pl-1 py-2">Próximamente más títulos disponibles.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}