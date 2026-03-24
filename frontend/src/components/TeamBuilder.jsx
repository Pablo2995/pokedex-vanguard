import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import './TeamBuilder.css';

const API_URL = 'http://localhost:5000/pokemon';
const DEFAULT_TRAINER = 1;

/**
 * TeamBuilder — Apartado 1 CRUD
 * Muestra el equipo del Entrenador consultando la base de datos.
 * Permite ENTRENAR (UPDATE) y LIBERAR (DELETE).
 */
const TeamBuilder = ({ isOpen, onClose }) => {
    const [equipo, setEquipo] = useState([]);
    const [loading, setLoading] = useState(false);
    // Para recargar los datos cuando hay cambios (capturar, entrenar, liberar)
    const [refreshKey, setRefreshKey] = useState(0);

    // Cargar equipo desde API (BD)
    useEffect(() => {
        if (!isOpen) return;
        const fetchTeam = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`${API_URL}/entrenadores/${DEFAULT_TRAINER}/equipo`);
                setEquipo(data);
            } catch (err) {
                console.error(err);
                toast.error('Error al cargar el equipo desde la base de datos');
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, [isOpen, refreshKey]);

    /**
     * ENTRENAR (UPDATE)
     * Sube el nivel y recalcula estadísticas en BD. Verifica evolución.
     */
    const handleEntrenar = async (capturaId, nombre) => {
        try {
            toast.loading(`Entrenando a ${nombre}...`, { id: `tr-${capturaId}` });
            const { data } = await axios.put(`${API_URL}/entrenar/${capturaId}`);

            toast.success(data.message, { id: `tr-${capturaId}`, icon: '⚡' });
            if (data.evoluciono) {
                toast(`¡Increíble! ${nombre} evolucionó a ${data.nueva_especie.nombre}`, {
                    icon: '🌟',
                    duration: 5000
                });
            }
            // Recargar equipo
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            toast.error(err.response?.data?.error || `Error al entrenar a ${nombre}`, { id: `tr-${capturaId}` });
        }
    };

    /**
     * LIBERAR (DELETE)
     * Borra el registro de pokemon_entrenador
     */
    const handleLiberar = async (capturaId, nombre) => {
        if (!window.confirm(`¿Seguro que quieres liberar a ${nombre}?`)) return;

        try {
            const { data } = await axios.delete(`${API_URL}/liberar/${capturaId}`);
            toast.success(data.message, { icon: '🕊️' });
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            toast.error(err.response?.data?.error || `Error al liberar a ${nombre}`);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className="team-builder-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="team-builder-content glass-panel"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
            >
                <div className="team-header">
                    <h2>Tu Equipo / Caja de PC</h2>
                    <span className="team-count">{equipo.length} Pokémon</span>
                    <button className="close-btn" onClick={onClose}>✖</button>
                </div>

                <div className="team-db-list">
                    {loading ? (
                        <p className="team-loading">Recibiendo datos (SELECT)...</p>
                    ) : equipo.length === 0 ? (
                        <div className="team-empty">
                            <p>No tienes ningún Pokémon capturado.</p>
                            <span>Usa el botón "Capturar" en la Pokédex.</span>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {equipo.map((p) => (
                                <motion.div
                                    key={p.captura_id}
                                    className="team-db-item"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0, x: -100 }}
                                    layout
                                >
                                    <div className="db-item-img">
                                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id_pokemon}.png`} alt={p.nombre} />
                                    </div>
                                    <div className="db-item-info">
                                        <span className="db-item-name">{p.apodo || p.nombre}</span>
                                        <span className="db-item-level">Nv. {p.nivel}</span>
                                        <span className="db-item-type">{p.tipo_principal}</span>
                                    </div>

                                    <div className="db-item-actions">
                                        <button
                                            className="db-btn btn-entrenar"
                                            id={`btn-entrenar-${p.captura_id}`}
                                            onClick={() => handleEntrenar(p.captura_id, p.apodo || p.nombre)}
                                            title="Entrenar (UPDATE)"
                                        >
                                            ⚡ Entrenar
                                        </button>
                                        <button
                                            className="db-btn btn-liberar"
                                            id={`btn-liberar-${p.captura_id}`}
                                            onClick={() => handleLiberar(p.captura_id, p.apodo || p.nombre)}
                                            title="Liberar (DELETE)"
                                        >
                                            🗑️ Liberar
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default TeamBuilder;
