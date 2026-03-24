import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { toast } from 'sonner';
import './PokemonModifier.css';

const PokemonModifier = ({ pokemon, isOpen, onClose }) => {
    const { team, updatePokemonStats } = useStore();
    const [stats, setStats] = useState({
        ataque: pokemon.ataque,
        defensa: pokemon.defensa,
        velocidad: pokemon.velocidad,
        nivel: pokemon.nivel
    });

    if (!isOpen) return null;

    const handleSave = () => {
        updatePokemonStats(pokemon.uid, stats);
        toast.success(`¡${pokemon.nombre} ha sido modificado con éxito!`, {
            icon: '🔧'
        });
        onClose();
    };

    const adjustStat = (stat, amount) => {
        setStats(prev => ({
            ...prev,
            [stat]: Math.max(1, prev[stat] + amount)
        }));
    };

    return (
        <motion.div
            className="modifier-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="modifier-content glass-panel"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
            >
                <div className="modifier-header">
                    <h2>🔧 Laboratorio de Modificación: {pokemon.nombre}</h2>
                    <button className="close-btn" onClick={onClose}>✖</button>
                </div>

                <div className="modifier-body">
                    <div className="poke-preview">
                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`} alt={pokemon.nombre} />
                        <div className="poke-status">
                            {pokemon.isShiny && <span className="shiny-tag">✨ Shiny</span>}
                            {pokemon.isAlfa && <span className="alfa-tag">🔴 Alfa</span>}
                        </div>
                    </div>

                    <div className="stats-editor">
                        {['nivel', 'ataque', 'defensa', 'velocidad'].map(stat => (
                            <div key={stat} className="stat-control">
                                <label>{stat.toUpperCase()}</label>
                                <div className="control-group">
                                    <button onClick={() => adjustStat(stat, -1)}>-</button>
                                    <span className="stat-val">{stats[stat]}</span>
                                    <button onClick={() => adjustStat(stat, 1)}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modifier-actions">
                    <button className="save-btn" onClick={handleSave}>Aplicar Cambios</button>
                    <button className="cancel-btn" onClick={onClose}>Cancelar</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PokemonModifier;
