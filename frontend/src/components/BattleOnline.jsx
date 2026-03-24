import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const socket = io('http://localhost:5000');

const BattleOnline = ({ pokemonTeam, onClose }) => {
    const [status, setStatus] = useState('IDLE'); // IDLE, SEARCHING, BATTLE, END
    const [gameId, setGameId] = useState(null);
    const [opponent, setOpponent] = useState(null);
    const [myHP, setMyHP] = useState(100);
    const [opHP, setOpHP] = useState(100);
    const [myTurn, setMyTurn] = useState(false);
    const [isCPU, setIsCPU] = useState(false);

    // Estados de Animación
    const [myAnim, setMyAnim] = useState('idle'); // idle, attack, hit
    const [opAnim, setOpAnim] = useState('idle');

    const activePokemon = pokemonTeam[0] || { nombre: 'Pikachu', id: 25 };
    const CPU_NAMES = ['Red_Master', 'Blue_Elite', 'Misty_Star', 'Leon_Galar', 'Cynthia_Champ', 'Gary_Oak', 'Ash_K7', 'Lance_Dragon'];

    useEffect(() => {
        // Escuchadores de Combate Real
        const matchHandler = ({ gameId, opponent, yourTurn }) => {
            setGameId(gameId);
            setOpponent(opponent);
            setMyTurn(yourTurn);
            setStatus('BATTLE');
            setIsCPU(false);
            toast.success(`⚔️ Rival Real encontrado: @${opponent.id.slice(0, 6)}!`);
        };

        socket.on('match_found', matchHandler);
        socket.on('waiting_for_opponent', () => setStatus('SEARCHING'));

        socket.on('receive_attack', ({ damage, moveName }) => {
            triggerOpAttack();
            setTimeout(() => {
                setMyHP(prev => Math.max(0, prev - damage));
                setMyAnim('hit');
                setTimeout(() => setMyAnim('idle'), 500);
                setMyTurn(true);
                toast.info(`💥 ¡Te atacaron con ${moveName}!`);
            }, 600);
        });

        // LÓGICA DE BOT (CPU) SI NO HAY GENTE 🤖
        let botTimer;
        if (status === 'SEARCHING') {
            botTimer = setTimeout(() => {
                const botName = CPU_NAMES[Math.floor(Math.random() * CPU_NAMES.length)];
                setOpponent({
                    id: `Entrenador ${botName}`,
                    pokemon: { id: Math.floor(Math.random() * 150) + 1, nombre: 'Rival' }
                });
                setIsCPU(true);
                setMyTurn(true);
                setStatus('BATTLE');
                toast.success(`⚔️ Rival encontrado: ${botName}!`);
            }, 4000);
        }

        return () => {
            socket.off('match_found');
            socket.off('waiting_for_opponent');
            socket.off('receive_attack');
            if (botTimer) clearTimeout(botTimer);
        };
    }, [status]);

    // Lógica de Animación Recibida
    const triggerOpAttack = () => {
        setOpAnim('attack');
        setTimeout(() => setOpAnim('idle'), 600);
    };

    const triggerMyAttack = () => {
        setMyAnim('attack');
        setTimeout(() => setMyAnim('idle'), 600);
    };

    // Inteligencia Artificial del Bot
    useEffect(() => {
        if (isCPU && !myTurn && status === 'BATTLE' && opHP > 0 && myHP > 0) {
            const cpuTimer = setTimeout(() => {
                triggerOpAttack();
                setTimeout(() => {
                    const damage = Math.floor(Math.random() * 15) + 5;
                    setMyHP(prev => Math.max(0, prev - damage));
                    setMyAnim('hit');
                    setTimeout(() => setMyAnim('idle'), 500);
                    setMyTurn(true);
                    toast.error(`🧨 El rival te ha lanzado un ataque de ${damage} HP!`);
                }, 600);
            }, 2000);
            return () => clearTimeout(cpuTimer);
        }
    }, [myTurn, isCPU, status, opHP, myHP]);

    const joinQueue = () => {
        if (!socket.connected) socket.connect();
        setStatus('SEARCHING');
        socket.emit('join_queue', { pokemon: activePokemon, trainerId: socket.id });
    };

    const handleAttack = () => {
        if (!myTurn) return;
        const damage = Math.floor(Math.random() * 20) + 10;

        triggerMyAttack();

        setTimeout(() => {
            if (isCPU) {
                setOpHP(prev => Math.max(0, prev - damage));
                setOpAnim('hit');
                setTimeout(() => setOpAnim('idle'), 500);
                setMyTurn(false);
            } else {
                socket.emit('send_attack', { gameId, damage, moveName: 'IMPACTRUENO' });
                setOpHP(prev => Math.max(0, prev - damage));
                setOpAnim('hit');
                setTimeout(() => setOpAnim('idle'), 500);
                setMyTurn(false);
            }
        }, 600);
    };

    // Variantes de Animación con Framer Motion
    const pokeVariants = {
        idle: { y: [0, -10, 0], scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity } },
        attack: { x: [0, 60, 0], transition: { duration: 0.4 } },
        hit: { x: [0, -10, 10, -10, 0], filter: "brightness(2) saturate(0)", transition: { duration: 0.4 } }
    };

    const opVariants = {
        idle: { y: [0, -8, 0], scale: [1, 1.03, 1], transition: { duration: 2.2, repeat: Infinity } },
        attack: { x: [0, -60, 0], transition: { duration: 0.4 } },
        hit: { x: [0, 10, -10, 10, 0], filter: "brightness(2) saturate(0)", transition: { duration: 0.4 } }
    };

    return (
        <motion.div
            className="battle-online-modal glass-card"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <div className="battle-header">
                <h2>BATTLE ARENA <span className="online-badge">ONLINE</span></h2>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="battle-content">
                {status === 'IDLE' && (
                    <div className="battle-start">
                        <button className="btn-search-online" onClick={joinQueue}>
                            BUSCAR RIVAL 🛰️
                        </button>
                    </div>
                )}

                {status === 'SEARCHING' && (
                    <div className="searching-ui">
                        <motion.div className="radar-pulse" animate={{ scale: [1, 2.5], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        <p className="glitch-text" data-text="ESCANEANDO...">ESCANEANDO RED VANGUARD...</p>
                    </div>
                )}

                {status === 'BATTLE' && (
                    <div className="battle-arena-ui">
                        {/* HP RIVAL */}
                        <div className="hp-container op-side">
                            <span className="trainer-name">{opponent.id}</span>
                            <div className="hp-track"><motion.div className="hp-fill" initial={{ width: '100%' }} animate={{ width: `${opHP}%` }} /></div>
                        </div>

                        {/* ESCENARIO DE BATALLA */}
                        <div className="battle-stage">
                            {/* Tu Pokemon */}
                            <motion.img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${activePokemon.id}.png`}
                                className="my-poke-battle"
                                variants={pokeVariants}
                                animate={myAnim}
                            />
                            {/* Pokemon Rival */}
                            <motion.img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${opponent.pokemon.id}.png`}
                                className="op-poke-battle"
                                variants={opVariants}
                                animate={opAnim}
                            />
                            {/* Sombras */}
                            <div className="shadow shadow-my" />
                            <div className="shadow shadow-op" />
                        </div>

                        {/* TU HP */}
                        <div className="hp-container my-side">
                            <span className="trainer-name">{activePokemon.nombre.toUpperCase()} (LV. 50)</span>
                            <div className="hp-track"><motion.div className="hp-fill" initial={{ width: '100%' }} animate={{ width: `${myHP}%` }} /></div>
                        </div>

                        {/* CONTROLES */}
                        <div className="battle-hud-controls">
                            <button className={`btn-vanguard-action ${!myTurn ? 'locked' : ''}`} onClick={handleAttack}>
                                ATACAR CON {activePokemon.nombre.toUpperCase()}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default BattleOnline;
