import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
    persist(
        (set, get) => ({
            team: [],
            inventory: {
                pokeballs: 5,
                potions: 5,
                antidotes: 2,
                energyDrinks: 2,
                modballs: 1
            },
            gameState: {
                weather: 'Clear',
                time: 'Day'
            },

            // Acciones de Equipo
            addToTeam: (pokemon) => {
                const currentTeam = get().team;
                if (currentTeam.length >= 6) {
                    return { error: 'El equipo ya está lleno (máximo 6 Pokémon).' };
                }
                const newPoke = {
                    ...pokemon,
                    uid: Date.now(),
                    currentHp: pokemon.defensa * 2 + 20,
                    maxHp: pokemon.defensa * 2 + 20,
                    currentSta: 10,
                    maxSta: 10,
                    status: 'Healthy', // Healthy, Poisoned, Paralyzed, Sleeping, Burned
                    exp: 0,
                    expToNext: 100,
                    isShiny: Math.random() < 0.05,
                    isAlfa: false
                };
                set({ team: [...currentTeam, newPoke] });
                return { success: true };
            },
            removeFromTeam: (uid) => {
                set({ team: get().team.filter((p) => p.uid !== uid) });
            },
            clearTeam: () => set({ team: [] }),

            // Sistema de EXP y Niveles
            addExp: (uid, amount) => {
                set({
                    team: get().team.map(p => {
                        if (p.uid === uid) {
                            let newExp = p.exp + amount;
                            let newLevel = p.nivel;
                            let newExpToNext = p.expToNext;

                            while (newExp >= newExpToNext) {
                                newExp -= newExpToNext;
                                newLevel++;
                                newExpToNext = Math.floor(newExpToNext * 1.2);
                            }

                            return {
                                ...p,
                                nivel: newLevel,
                                exp: newExp,
                                expToNext: newExpToNext,
                                maxHp: p.maxHp + 5,
                                currentHp: p.currentHp + 5,
                                ataque: p.ataque + 2,
                                defensa: p.defensa + 2,
                                velocidad: p.velocidad + 1
                            };
                        }
                        return p;
                    })
                });
            },

            // Stamina y Estados
            consumeSta: (uid, amount) => {
                set({
                    team: get().team.map(p => p.uid === uid ? { ...p, currentSta: Math.max(0, p.currentSta - amount) } : p)
                });
            },
            recoverSta: (uid, amount) => {
                set({
                    team: get().team.map(p => p.uid === uid ? { ...p, currentSta: Math.min(p.maxSta, p.currentSta + amount) } : p)
                });
            },
            setStatus: (uid, status) => {
                set({
                    team: get().team.map(p => p.uid === uid ? { ...p, status } : p)
                });
            },

            // Mundo
            setWeather: (weather) => set(state => ({ gameState: { ...state.gameState, weather } })),
            setTime: (time) => set(state => ({ gameState: { ...state.gameState, time } })),

            // Objetos
            useItem: (itemType) => {
                const inv = get().inventory;
                if (inv[itemType] > 0) {
                    set({ inventory: { ...inv, [itemType]: inv[itemType] - 1 } });
                    return true;
                }
                return false;
            },
            receiveItem: (itemType, amount = 1) => {
                const inv = get().inventory;
                set({ inventory: { ...inv, [itemType]: (inv[itemType] || 0) + amount } });
            },

            // Salud
            healTeam: () => {
                set({
                    team: get().team.map(p => ({
                        ...p,
                        currentHp: p.maxHp,
                        currentSta: p.maxSta,
                        status: 'Healthy'
                    }))
                });
            },
            applyDamage: (uid, amount) => {
                set({
                    team: get().team.map(p => p.uid === uid ? { ...p, currentHp: Math.max(0, p.currentHp - amount) } : p)
                });
            },
            updatePokemonStats: (uid, newStats) => {
                set({
                    team: get().team.map(p => p.uid === uid ? { ...p, ...newStats } : p)
                });
            }
        }),
        {
            name: 'pokemod-rpg-storage',
        }
    )
);
