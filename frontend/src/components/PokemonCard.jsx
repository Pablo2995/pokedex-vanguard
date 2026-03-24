import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import './PokemonCard.css';

const API_URL = 'http://localhost:5000/pokemon';

const TYPE_COLORS = {
    Normal: '#A8A77A', Fuego: '#EE8130', Agua: '#6390F0', Planta: '#7AC74C',
    'Eléctrico': '#F7D02C', Hielo: '#96D9D6', Lucha: '#C22E28', Veneno: '#A33EA1',
    Tierra: '#E2BF65', Volador: '#A98FF3', 'Psíquico': '#F95587', Bicho: '#A6B91A',
    Roca: '#B6A136', Fantasma: '#735797', 'Dragón': '#6F35FC', Siniestro: '#705746',
    Acero: '#B7B7CE', Hada: '#D685AD',
};

const DEFAULT_TRAINER_ID = 1;

const StatItem = ({ label, value, color, iv = 0 }) => (
    <div className="card-stat-row">
        <span className="card-stat-label">{label}</span>
        <div className="card-stat-bar-track">
            <motion.div
                className="card-stat-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((value / 180) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ background: color }}
            />
            {iv > 0 && <div className="iv-glow" title={`IV: ${iv}`} style={{ width: `${(iv / 31) * 100}%` }} />}
        </div>
        <span className="card-stat-value">{value} <small style={{ fontSize: '0.55rem', opacity: 0.6 }}>+{iv}</small></span>
    </div>
);

const DetailsModal = ({ pokemon, color, onClose }) => {
    return (
        <motion.div className="details-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="details-modal glass-card" layoutId={`card-${pokemon.id}`} onClick={e => e.stopPropagation()}>
                <div className="details-header" style={{ '--accent': color }}>
                    <button className="close-details" onClick={onClose}>✕</button>
                    <div className="details-id">DNA-LINK: {String(pokemon.id).padStart(4, '0')}</div>
                    <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                        alt={pokemon.nombre}
                        className="details-img"
                    />
                    {pokemon.shiny && <div className="shiny-sparkle">✨</div>}
                </div>
                <div className="details-body">
                    <h2 className="details-name">{pokemon.nombre} {pokemon.shiny && '✨'}</h2>
                    <div className="details-type" style={{ background: color }}>{pokemon.tipo_principal}</div>

                    <div className="details-grid">
                        <div className="details-section">
                            <h3>👤 TRAINER LOG</h3>
                            <p>Capturado bajo clima {pokemon.factor_clima || '☀️'}. Potencial genético verificado.</p>
                        </div>
                        <div className="details-section">
                            <h3>🧬 GENETIC SPECS (IVs)</h3>
                            <StatItem label="ATK" value={pokemon.ataque} color={color} iv={pokemon.iv_ataque} />
                            <StatItem label="DEF" value={pokemon.defensa} color={color} iv={pokemon.iv_defensa} />
                            <StatItem label="SPD" value={pokemon.velocidad} color="#38bdf8" iv={pokemon.iv_velocidad} />
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const PokemonCard = ({ pokemon, onRefresh, extraContext }) => {
    const [imgError, setImgError] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const mainColor = TYPE_COLORS[pokemon.tipo_principal] || '#555';
    const imageUrl = imgError
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;

    const handleCapturar = async (e) => {
        e.stopPropagation();
        setCapturing(true);
        try {
            const res = await axios.post(`${API_URL}/capturar`, {
                id_entrenador: DEFAULT_TRAINER_ID,
                id_pokemon: pokemon.id,
                clima_actual: extraContext?.clima || 'Normal'
            });

            if (res.data.isShiny) {
                toast.success(res.data.message, { duration: 5000, icon: '✨' });
            } else {
                toast.success(res.data.message);
            }
            if (onRefresh) onRefresh();
        } catch (err) {
            toast.error(err.response?.data?.error || 'No se pudo capturar');
        } finally {
            setTimeout(() => setCapturing(false), 800);
        }
    };

    return (
        <>
            <motion.div
                className={`poke-card-luxury glass-card ${pokemon.shiny ? 'shiny-card' : ''}`}
                layoutId={`card-${pokemon.id}`}
                onClick={() => setShowDetails(true)}
                whileHover={{ y: -8 }}
            >
                {pokemon.shiny && <div className="shiny-badge">✨ SHINY</div>}

                <div className="poke-card-header">
                    <span className="poke-id">#{String(pokemon.id).padStart(3, '0')}</span>
                    <span className="poke-level">LV.{pokemon.nivel}</span>
                </div>

                <div className="poke-img-container" style={{ '--accent-glow': pokemon.shiny ? '#fbbf24' : mainColor }}>
                    <AnimatePresence>
                        {capturing && (
                            <motion.div className="capture-vfx" initial={{ scale: 0 }} animate={{ scale: 2 }} exit={{ scale: 4 }} />
                        )}
                    </AnimatePresence>
                    <motion.img
                        src={imageUrl}
                        className={`poke-img ${pokemon.shiny ? 'shiny-filter' : ''}`}
                        onError={() => setImgError(true)}
                    />
                </div>

                <div className="poke-info">
                    <h3 className="poke-name">{pokemon.nombre}</h3>
                    <div className="poke-type-badge" style={{ backgroundColor: `${mainColor}22`, color: mainColor }}>
                        {pokemon.tipo_principal}
                    </div>

                    <div className="poke-stats">
                        <StatItem label="ATK" value={pokemon.ataque} color={mainColor} iv={pokemon.iv_ataque} />
                        <StatItem label="DEF" value={pokemon.defensa} color={mainColor} iv={pokemon.iv_defensa} />
                    </div>

                    <button className="btn-capture-luxury" onClick={handleCapturar} disabled={capturing} style={{ '--btn-color': pokemon.shiny ? '#fbbf24' : mainColor }}>
                        {capturing ? 'CAPTURANDO...' : 'CAPTURAR'}
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {showDetails && <DetailsModal pokemon={pokemon} color={mainColor} onClose={() => setShowDetails(false)} />}
            </AnimatePresence>
        </>
    );
};

export default PokemonCard;
