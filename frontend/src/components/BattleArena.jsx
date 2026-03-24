import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import { useStore } from '../store';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import './BattleArena.css';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const BattleArena = ({ allPokemon, onClose }) => {
    const { team } = useStore();
    const [enemyTeam, setEnemyTeam] = useState([]);
    const [battleResult, setBattleResult] = useState(null);
    const [isBattling, setIsBattling] = useState(false);

    const generateRandomTeam = () => {
        if (allPokemon.length === 0) return;
        let randomTeam = [];
        for (let i = 0; i < 6; i++) {
            const randomPoke = allPokemon[Math.floor(Math.random() * allPokemon.length)];
            randomTeam.push(randomPoke);
        }
        setEnemyTeam(randomTeam);
    };

    const handleBattle = async () => {
        if (team.length === 0 || enemyTeam.length === 0) return;
        setIsBattling(true);
        setBattleResult(null);
        try {
            const { data } = await axios.post('http://localhost:5000/pokemon/battle', {
                team1: team.map(p => p.id),
                team2: enemyTeam.map(p => p.id)
            });
            setTimeout(() => {
                setBattleResult(data);
                setIsBattling(false);
            }, 1500);
        } catch (error) {
            console.error('Error in battle:', error);
            setIsBattling(false);
        }
    };

    const getAveragedStats = (teamArray) => {
        if (!teamArray || teamArray.length === 0) return { nivel: 0, ataque: 0, defensa: 0, velocidad: 0 };
        const sum = teamArray.reduce((acc, curr) => ({
            nivel: acc.nivel + curr.nivel,
            ataque: acc.ataque + curr.ataque,
            defensa: acc.defensa + curr.defensa,
            velocidad: acc.velocidad + curr.velocidad
        }), { nivel: 0, ataque: 0, defensa: 0, velocidad: 0 });

        return {
            nivel: sum.nivel / teamArray.length,
            ataque: sum.ataque / teamArray.length,
            defensa: sum.defensa / teamArray.length,
            velocidad: sum.velocidad / teamArray.length
        };
    };

    const getRadarData = () => {
        const p1 = getAveragedStats(team);
        const p2 = getAveragedStats(enemyTeam);

        return {
            labels: ['Nivel Promedio', 'Ataque Promedio', 'Defensa Promedio', 'Vel. Promedio'],
            datasets: [
                team.length > 0 && {
                    label: 'Tu Equipo',
                    data: [p1.nivel, p1.ataque, p1.defensa, p1.velocidad],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                },
                enemyTeam.length > 0 && {
                    label: 'Rival Aleatorio',
                    data: [p2.nivel, p2.ataque, p2.defensa, p2.velocidad],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                }
            ].filter(Boolean),
        };
    };

    const TeamPreview = ({ currentTeam, label, isEnemy }) => (
        <div className="fighter-select team-preview-box">
            <h3>{label}</h3>
            {isEnemy && currentTeam.length === 0 && (
                <button className="generate-btn" onClick={generateRandomTeam}>
                    🎲 Generar Rival
                </button>
            )}

            <div className="mini-team-grid">
                {currentTeam.map((p, idx) => (
                    <motion.div key={idx} initial={{ scale: 0 }} animate={{ scale: 1 }} className="mini-sprite">
                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`} alt={p.nombre} title={p.nombre} />
                    </motion.div>
                ))}
            </div>
            {currentTeam.length === 0 && !isEnemy && <p>¡Ve a la Pokédex y añade Pokémon a tu equipo!</p>}
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="battle-arena">
            <button className="close-arena" onClick={onClose}>✖ Cerrar Arena</button>
            <h2 className="arena-title">⚔️ Arena de Combate 6v6 ⚔️</h2>

            <div className="fighters-container">
                <TeamPreview currentTeam={team} label={`Tu Equipo (${team.length}/6)`} isEnemy={false} />
                <div className="vs-badge">VS</div>
                <TeamPreview currentTeam={enemyTeam} label={`Equipo Rival (${enemyTeam.length}/6)`} isEnemy={true} />
            </div>

            {(team.length > 0 || enemyTeam.length > 0) && (
                <div className="radar-container">
                    <Radar data={getRadarData()} options={{ scale: { ticks: { display: false } } }} />
                </div>
            )}

            <button
                className={`battle-btn ${(team.length === 0 || enemyTeam.length === 0 || isBattling) ? 'disabled' : ''}`}
                onClick={handleBattle}
                disabled={team.length === 0 || enemyTeam.length === 0 || isBattling}
            >
                {isBattling ? 'Combatiendo...' : '¡INICIAR COMBATE 6V6!'}
            </button>

            <AnimatePresence>
                {battleResult && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="battle-results">
                        <h3>Resultados del Combate</h3>
                        <div className="battle-log">
                            {battleResult.log.map((line, idx) => (
                                <motion.p
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.5 }}
                                    className={line.includes('🏆') ? 'winner-text' : ''}
                                >
                                    {line}
                                </motion.p>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default BattleArena;
