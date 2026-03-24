import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { toast } from 'sonner';
import './AdventureMode.css';

const AdventureMode = ({ allPokemon, onClose }) => {
    const {
        team, inventory, gameState, useItem, receiveItem, setWeather, setTime,
        applyDamage, consumeSta, recoverSta, setStatus, addExp, healTeam, addToTeam
    } = useStore();

    const [actionState, setActionState] = useState('exploring'); // exploring, battle, npc
    const [log, setLog] = useState(['Te adentras en el mundo PokéMod. Presiona Explorar para comenzar.']);

    // Battle State
    const [activeFighterId, setActiveFighterId] = useState(team[0]?.uid || null);
    const [enemy, setEnemy] = useState(null);
    const [isDefending, setIsDefending] = useState(false);
    const [isCharging, setIsCharging] = useState(false);

    const player = team.find(p => p.uid === activeFighterId);

    const addLog = (msg) => {
        setLog(prev => [msg, ...prev].slice(0, 6));
    };

    // --- CICLO DÍA/NOCHE Y CLIMA ---
    const updateEnvironment = () => {
        const weathers = ['Clear', 'Rain', 'Storm', 'Fog'];
        if (Math.random() < 0.2) setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
        if (Math.random() < 0.1) setTime(gameState.time === 'Day' ? 'Night' : 'Day');
    };

    // --- ACCIONES DE EXPLORACIÓN ---
    const handleExplore = () => {
        if (!player || player.currentHp <= 0) {
            toast.error("Tu Pokémon activo no puede luchar. Cámbialo o ve al Centro Pokémon.");
            return;
        }

        updateEnvironment();
        const roll = Math.random();

        if (roll < 0.55) {
            // ENCUENTRO SALVAJE
            const rand = allPokemon[Math.floor(Math.random() * allPokemon.length)];
            const isShiny = Math.random() < 0.05;
            const isAlfa = Math.random() < 0.1;
            const levelMod = isAlfa ? 5 : 0;

            const wildInstance = {
                ...rand,
                nivel: Math.max(1, player.nivel + Math.floor(Math.random() * 5) - 2 + levelMod),
                maxHp: Math.floor((rand.defensa * 2 + 20) * (isAlfa ? 1.5 : 1)),
                currentHp: Math.floor((rand.defensa * 2 + 20) * (isAlfa ? 1.5 : 1)),
                currentSta: 10,
                status: 'Healthy',
                isShiny,
                isAlfa
            };
            setEnemy(wildInstance);
            setActionState('battle');
            addLog(`¡Un ${wildInstance.nombre}${isShiny ? ' ✨' : ''}${isAlfa ? ' 🔴' : ''} salvaje apareció!`);
        } else if (roll < 0.75) {
            // ENCONTRAR OBJETO
            const items = ['potions', 'pokeballs', 'antidotes', 'energyDrinks'];
            const found = items[Math.floor(Math.random() * items.length)];
            receiveItem(found, 1);
            addLog(`¡Encontraste 1 ${found} en el suelo!`);
        } else {
            addLog("Caminas un rato pero no encuentras nada interesante.");
        }
    };

    // --- LÓGICA DE COMBATE ---
    const processFighterTurn = (fighter, target, isPlayer) => {
        if (fighter.status === 'Sleeping') {
            if (Math.random() < 0.4) {
                isPlayer ? setStatus(fighter.uid, 'Healthy') : setEnemy(prev => ({ ...prev, status: 'Healthy' }));
                addLog(`💤 ${fighter.nombre} se despertó.`);
            } else {
                addLog(`💤 ${fighter.nombre} sigue durmiendo...`);
                return false;
            }
        }
        if (fighter.status === 'Paralyzed' && Math.random() < 0.25) {
            addLog(`⚡ ${fighter.nombre} está paralizado y no puede moverse.`);
            return false;
        }
        return true;
    };

    const applyStatusEffects = (fighter, isPlayer) => {
        if (fighter.status === 'Poisoned') {
            const dmg = Math.floor(fighter.maxHp * 0.12);
            isPlayer ? applyDamage(fighter.uid, dmg) : setEnemy(prev => ({ ...prev, currentHp: Math.max(0, prev.currentHp - dmg) }));
            addLog(`🦠 El veneno resta vida a ${fighter.nombre}.`);
        }
        if (fighter.status === 'Burned') {
            const dmg = Math.floor(fighter.maxHp * 0.06);
            isPlayer ? applyDamage(fighter.uid, dmg) : setEnemy(prev => ({ ...prev, currentHp: Math.max(0, prev.currentHp - dmg) }));
            addLog(`🔥 La quemadura daña a ${fighter.nombre}.`);
        }
    };

    const enemyTurn = () => {
        if (!enemy || enemy.currentHp <= 0) return;

        setTimeout(() => {
            if (!processFighterTurn(enemy, player, false)) {
                applyStatusEffects(enemy, false);
                return;
            }

            const dmg = Math.max(2, Math.floor((enemy.ataque * 0.6) - (isDefending ? player.defensa * 0.9 : player.defensa * 0.4)));
            applyDamage(player.uid, dmg);
            addLog(`💢 ${enemy.nombre} atacó causando ${dmg} de daño.`);

            if (Math.random() < 0.1) {
                const statuses = ['Poisoned', 'Paralyzed', 'Burned', 'Sleeping'];
                const s = statuses[Math.floor(Math.random() * statuses.length)];
                setStatus(player.uid, s);
                addLog(`⚠️ ¡${player.nombre} ahora está ${s}!`);
            }

            applyStatusEffects(enemy, false);
            setIsDefending(false);
        }, 1200);
    };

    const handleAttack = () => {
        if (player.currentSta < 1) { toast.error("Sin energía (STA)"); return; }
        if (!processFighterTurn(player, enemy, true)) { enemyTurn(); return; }

        let dmg = Math.max(1, Math.floor(player.ataque * 1.1 - enemy.defensa * 0.5));
        if (gameState.weather === 'Rain' && player.tipo_principal === 'Agua') dmg *= 1.2;

        consumeSta(player.uid, 1);
        setEnemy(prev => ({ ...prev, currentHp: Math.max(0, prev.currentHp - dmg) }));
        addLog(`⚔️ ${player.nombre} atacó a ${enemy.nombre} (-${dmg} HP).`);

        if (enemy.currentHp - dmg <= 0) {
            addLog(`🏆 ¡Victoria! Ganas 50 EXP.`);
            addExp(player.uid, 50);
            setTimeout(() => { setActionState('exploring'); setEnemy(null); }, 1000);
        } else {
            enemyTurn();
        }
    };

    const handleDefend = () => {
        setIsDefending(true);
        recoverSta(player.uid, 3);
        addLog(`🛡️ ${player.nombre} se defiende y recupera energía.`);
        enemyTurn();
    };

    const handleCharged = () => {
        if (player.currentSta < 4) { toast.error("Necesitas 4 STA para Ataque Cargado"); return; }
        if (isCharging) {
            setIsCharging(false);
            const dmg = Math.floor(player.ataque * 2.5);
            consumeSta(player.uid, 4);
            setEnemy(prev => ({ ...prev, currentHp: Math.max(0, prev.currentHp - dmg) }));
            addLog(`💥 ¡EXPLOSIÓN! ${player.nombre} liberó toda su energía.`);
            if (enemy.currentHp - dmg <= 0) {
                addExp(player.uid, 80);
                setTimeout(() => { setActionState('exploring'); setEnemy(null); }, 1000);
            } else { enemyTurn(); }
        } else {
            setIsCharging(true);
            addLog(`⏳ ${player.nombre} está cargando un ataque devastador...`);
            enemyTurn();
        }
    };

    const handleCatch = () => {
        const item = inventory.modballs > 0 ? 'modballs' : (inventory.pokeballs > 0 ? 'pokeballs' : null);
        if (!item) { toast.error("No tienes Pokéballs"); return; }

        useItem(item);
        addLog(`🎯 ¡Lanzaste una ${item}!`);

        const catchRate = (1 - (enemy.currentHp / enemy.maxHp)) + (enemy.status !== 'Healthy' ? 0.3 : 0) + (item === 'modballs' ? 0.4 : 0);

        if (Math.random() < catchRate) {
            addLog(`🎉 ¡Captura con éxito!`);
            addToTeam(enemy);
            setTimeout(() => { setActionState('exploring'); setEnemy(null); }, 1000);
        } else {
            addLog(`❌ El Pokémon escapó de la bola.`);
            enemyTurn();
        }
    };

    const handleHeal = () => {
        if (useItem('potions')) {
            applyDamage(player.uid, -40);
            addLog(`🧪 Usaste Poción en ${player.nombre}.`);
            enemyTurn();
        }
    };

    const handleAntidote = () => {
        if (useItem('antidotes')) {
            setStatus(player.uid, 'Healthy');
            addLog(`💊 Curaste los estados de ${player.nombre}.`);
            enemyTurn();
        }
    };

    if (team.length === 0) {
        return (
            <div className="adventure-mode-overlay">
                <div className="adventure-content glass-panel">
                    <h2>⚠️ ¡Atención Entrenador!</h2>
                    <p>Necesitas al menos 1 Pokémon en tu equipo para iniciar el Modo Aventura.</p>
                    <button className="battle-btn" onClick={onClose}>Volver a la Pokédex</button>
                </div>
            </div>
        );
    }

    return (
        <motion.div className="adventure-mode-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="adventure-content glass-panel">
                <div className="rpg-top">
                    <span>🌍 Clima: <b>{gameState.weather}</b> | Horario: <b>{gameState.time}</b></span>
                    <button onClick={onClose}>Abandonar</button>
                </div>

                <div className="rpg-stage">
                    {actionState === 'battle' && enemy && (
                        <div className="battle-arena-rpg">
                            <div className="enemy-hud">
                                <div className="p-info">{enemy.nombre} {enemy.isShiny && '✨'} {enemy.isAlfa && '🔴'} - Nv {enemy.nivel}</div>
                                <div className="hp-bar"><div className="fill" style={{ width: `${(enemy.currentHp / enemy.maxHp) * 100}%` }} /></div>
                                <div className="status-tag">{enemy.status !== 'Healthy' && enemy.status}</div>
                            </div>
                            <img className={`enemy-img ${enemy.isAlfa ? 'alfa' : ''}`} src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${enemy.id}.png`} alt="enemy" />

                            <img className="player-img" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${player.id}.png`} alt="player" />
                            <div className="player-hud">
                                <div className="p-info">{player.nombre} - Nv {player.nivel}</div>
                                <div className="hp-bar"><div className="fill" style={{ width: `${(player.currentHp / player.maxHp) * 100}%` }} /></div>
                                <div className="sta-bar"><div className="fill" style={{ width: `${(player.currentSta / player.maxSta) * 100}%` }} /></div>
                                <div className="exp-bar"><div className="fill" style={{ width: `${(player.exp / player.expToNext) * 100}%`, background: '#f59e0b' }} /></div>
                                <div className="status-tag">{player.status !== 'Healthy' && player.status}</div>
                            </div>
                        </div>
                    )}
                    {actionState === 'exploring' && <div className="exploring-view">🌿 Caminando por la hierba alta...</div>}
                </div>

                <div className="rpg-log">
                    {log.map((m, i) => <div key={i} className="log-line">{m}</div>)}
                </div>

                <div className="rpg-actions">
                    {actionState === 'exploring' ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-rpg exp" onClick={handleExplore}>🌿 Explorar Zona</button>
                            <button className="btn-rpg npc" onClick={() => { healTeam(); addLog("👩‍⚕️ Visitaste la Clínica: ¡Equipo restaurado!"); toast.success("Equipo sanado."); }} style={{ background: '#ec4899' }}>🏥 Clínica</button>
                        </div>
                    ) : (
                        <div className="battle-menu">
                            <button onClick={handleAttack} disabled={isCharging}>⚔️ Atacar (1 STA)</button>
                            <button onClick={handleDefend}>🛡️ Defender (+3 STA)</button>
                            <button onClick={handleCharged} className={isCharging ? 'charging' : ''}>{isCharging ? '💥 ¡LANZAR!' : '⏳ Cargar (4 STA)'}</button>
                            <button onClick={handleHeal}>🧪 Poción ({inventory.potions})</button>
                            <button onClick={handleAntidote}>💊 Antídoto ({inventory.antidotes})</button>
                            <button onClick={handleCatch}>🎯 Capturar ({inventory.pokeballs + inventory.modballs})</button>
                            <button onClick={() => { setActionState('exploring'); setEnemy(null); }}>🏃 Huir</button>
                        </div>
                    )}
                </div>

                <div className="rpg-team">
                    {team.map(p => (
                        <div key={p.uid} className={`team-p ${p.uid === player?.uid ? 'active' : ''}`} onClick={() => setActiveFighterId(p.uid)}>
                            <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`} alt="p" />
                            <div className="mini-hp"><div className="fill" style={{ width: `${(p.currentHp / p.maxHp) * 100}%` }} /></div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default AdventureMode;
