import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { useStore } from './store';

import SearchBar from './components/SearchBar';
import FilterType from './components/FilterType';
import PokemonList from './components/PokemonList';
import BattleArena from './components/BattleArena';
import TeamBuilder from './components/TeamBuilder';
import AdventureMode from './components/AdventureMode';
import SalonFama from './components/SalonFama';
import Intercambio from './components/Intercambio';
import BattleOnline from './components/BattleOnline';
import InteractiveBackground from './components/InteractiveBackground';
import './index.css';

const API_URL = 'http://localhost:5000/pokemon';

const CLIMAS = [
    { id: 'Normal', icon: '☀️', color: '#fbbf24' },
    { id: 'Lluvia', icon: '🌧️', color: '#3b82f6' },
    { id: 'Tormenta', icon: '⚡', color: '#a855f7' },
    { id: 'Nieve', icon: '❄️', color: '#94a3b8' }
];

function App() {
    const [pokemon, setPokemon] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');

    // Nueva Mecánica: Clima
    const [clima, setClima] = useState(CLIMAS[0]);

    // Modales
    const [showArena, setShowArena] = useState(false);
    const [showTeamBuilder, setShowTeamBuilder] = useState(false);
    const [showAdventure, setShowAdventure] = useState(false);
    const [showSalon, setShowSalon] = useState(false);
    const [showIntercambio, setShowIntercambio] = useState(false);
    const [showOnline, setShowOnline] = useState(false);

    const [stats, setStats] = useState(null);
    const [queryTimeMs, setQueryTimeMs] = useState(null);

    const { team } = useStore();

    const fetchStats = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/stats`);
            setStats(data);
        } catch (err) { console.error(err); }
    };

    const fetchPokemon = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (searchTerm.trim()) params.nombre = searchTerm.trim();
            if (selectedType) params.tipo = selectedType;

            const { data } = await axios.get(API_URL, { params });
            if (data.data) {
                setPokemon(data.data);
                setQueryTimeMs(data.meta?.queryTimeMs ?? null);
            } else {
                setPokemon(data);
                setQueryTimeMs(null);
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedType]);

    useEffect(() => {
        const timer = setTimeout(fetchPokemon, 400);
        fetchStats();
        return () => clearTimeout(timer);
    }, [fetchPokemon]);

    // Lógica para cambiar clima aleatoriamente (Inovación!)
    useEffect(() => {
        const interval = setInterval(() => {
            const nuevo = CLIMAS[Math.floor(Math.random() * CLIMAS.length)];
            setClima(nuevo);
        }, 30000); // Cambia cada 30 segundos
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="app">
            <InteractiveBackground />
            <Toaster position="top-right" richColors theme="dark" />

            {/* Partículas de Clima */}
            {clima.id === 'Lluvia' && <div className="weather-overlay rain" />}
            {clima.id === 'Tormenta' && <div className="weather-overlay lightning" />}
            {clima.id === 'Nieve' && <div className="weather-overlay snow" />}

            <nav className="side-hud">
                <div className="hud-logo">⬤</div>
                <div className="hud-actions">
                    <button className="hud-btn" onClick={() => setShowTeamBuilder(true)}>
                        🎒 <span className="hud-badge">{team.length}</span>
                    </button>
                    <button className="hud-btn" onClick={() => setShowArena(true)}>⚔️</button>
                    <button className="hud-btn" onClick={() => setShowAdventure(true)}>🌿</button>
                    <button className="hud-btn" onClick={() => setShowIntercambio(true)}>🔄</button>
                    <button className="hud-btn" onClick={() => setShowOnline(true)}>🌐</button>
                    <button className="hud-btn" onClick={() => setShowSalon(true)}>🏆</button>
                </div>
            </nav>

            <div className="main-content-layout">
                <header className="app-header-compact">
                    <div className="header-text">
                        <h1 className="app-title">Pokédex <span className="title-alt">Vanguard</span></h1>
                        <div className="header-stats-row">
                            {stats && (
                                <>
                                    <span>Total: <b>{stats.total_capturas}</b></span>
                                    <span>•</span>
                                    <span className="weather-pill" style={{ borderColor: clima.color, color: clima.color }}>
                                        {clima.icon} CLIMA: {clima.id.toUpperCase()}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="controls-hud">
                    <SearchBar value={searchTerm} onChange={setSearchTerm} />
                    <FilterType value={selectedType} onChange={setSelectedType} />
                    <div className="perf-stats">
                        {queryTimeMs && <span className="stat-pill highlight">⚡ {queryTimeMs}ms</span>}
                        <span className="stat-pill">{pokemon.length} Pokémon</span>
                    </div>
                </div>

                <main className="app-main">
                    <PokemonList
                        pokemon={pokemon}
                        loading={loading}
                        error={error}
                        onRefresh={fetchPokemon}
                        extraContext={{ clima: clima.id }} // Pasamos clima para las capturas
                    />
                </main>
            </div>

            <AnimatePresence>
                {showArena && <BattleArena allPokemon={pokemon} onClose={() => setShowArena(false)} />}
                <TeamBuilder isOpen={showTeamBuilder} onClose={() => setShowTeamBuilder(false)} />
                {showAdventure && <AdventureMode allPokemon={pokemon} onClose={() => setShowAdventure(false)} />}
                {showSalon && <SalonFama onClose={() => setShowSalon(false)} />}
                {showIntercambio && <Intercambio onClose={() => setShowIntercambio(false)} />}
                {showOnline && <BattleOnline pokemonTeam={team.length > 0 ? team : pokemon.slice(0, 1)} onClose={() => setShowOnline(false)} />}
            </AnimatePresence>
        </div>
    );
}

export default App;
