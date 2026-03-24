import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './SalonFama.css';

const API_URL = 'http://localhost:5000/pokemon';

const TYPE_COLORS = {
    Normal: '#A8A77A', Fuego: '#EE8130', Agua: '#6390F0', Planta: '#7AC74C',
    'Eléctrico': '#F7D02C', Hielo: '#96D9D6', Lucha: '#C22E28', Veneno: '#A33EA1',
    Tierra: '#E2BF65', Volador: '#A98FF3', 'Psíquico': '#F95587', Bicho: '#A6B91A',
    Roca: '#B6A136', Fantasma: '#735797', 'Dragón': '#6F35FC', Siniestro: '#705746',
    Acero: '#B7B7CE', Hada: '#D685AD',
};

const MEDAL_ICONS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

const POKEMON_ID_MAP = {
    bulbasaur: 1, ivysaur: 2, venusaur: 3, charmander: 4, charmeleon: 5, charizard: 6, squirtle: 7, wartortle: 8, blastoise: 9,
    caterpie: 10, metapod: 11, butterfree: 12, weedle: 13, kakuna: 14, beedrill: 15, pidgey: 16, pidgeotto: 17, pidgeot: 18,
    rattata: 19, raticate: 20, spearow: 21, fearow: 22, ekans: 23, arbok: 24, pikachu: 25, raichu: 26, sandshrew: 27, sandslash: 28,
    nidorina: 30, nidoqueen: 31, nidorino: 33, nidoking: 34, clefairy: 35, clefable: 36, vulpix: 37, ninetales: 38, jigglypuff: 39,
    wigglytuff: 40, zubat: 41, golbat: 42, oddish: 43, gloom: 44, vileplume: 45, paras: 46, parasect: 47, venonat: 48, venomoth: 49,
    diglett: 50, dugtrio: 51, meowth: 52, persian: 53, psyduck: 54, golduck: 55, mankey: 56, primeape: 57, growlithe: 58, arcanine: 59,
    poliwag: 60, poliwhirl: 61, poliwrath: 62, abra: 63, kadabra: 64, alakazam: 65, machop: 66, machoke: 67, machamp: 68,
    bellsprout: 69, weepinbell: 70, victreebel: 71, tentacool: 72, tentacruel: 73, geodude: 74, graveler: 75, golem: 76,
    ponyta: 77, rapidash: 78, slowpoke: 79, slowbro: 80, magnemite: 81, magneton: 82, doduo: 84, dodrio: 85, seel: 86, dewgong: 87,
    grimer: 88, muk: 89, shellder: 90, cloyster: 91, gastly: 92, haunter: 93, gengar: 94, onix: 95, drowzee: 96, hypno: 97,
    krabby: 98, kingler: 99, voltorb: 100, electrode: 101, exeggcute: 102, exeggutor: 103, cubone: 104, marowak: 105,
    hitmonlee: 106, hitmonchan: 107, lickitung: 108, koffing: 109, weezing: 110, rhyhorn: 111, rhydon: 112, chansey: 113,
    tangela: 114, kangaskhan: 115, horsea: 116, seadra: 117, goldeen: 118, seaking: 119, staryu: 120, starmie: 121,
    scyther: 123, jynx: 124, electabuzz: 125, magmar: 126, pinsir: 127, tauros: 128, magikarp: 129, gyarados: 130,
    lapras: 131, ditto: 132, eevee: 133, vaporeon: 134, jolteon: 135, flareon: 136, porygon: 137, omanyte: 138, omastar: 139,
    kabuto: 140, kabutops: 141, aerodactyl: 142, snorlax: 143, articuno: 144, zapdos: 145, moltres: 146, dratini: 147,
    dragonair: 148, dragonite: 149, mewtwo: 150, mew: 151,
    chikorita: 152, bayleef: 153, meganium: 154, cyndaquil: 155, quilava: 156, typhlosion: 157, totodile: 158, croconaw: 159,
    feraligatr: 160, crobat: 169, espeon: 196, umbreon: 197, tyranitar: 248, lugia: 249, 'ho-oh': 250, celebi: 251,
    treecko: 252, grovyle: 253, sceptile: 254, torchic: 255, combusken: 256, blaziken: 257, mudkip: 258, marshtomp: 259, swampert: 260,
    gardevoir: 282, breloom: 286, slaking: 289, shedinja: 292, hariyama: 297, aggron: 306, medicham: 308, manectric: 310,
    flygon: 330, altaria: 334, absol: 359, salamence: 373, metagross: 376, regirock: 377, regice: 378, registeel: 379,
    latias: 380, latios: 381, kyogre: 382, groudon: 383, rayquaza: 384, deoxys: 386,
    torterra: 389, infernape: 392, empoleon: 395, staraptor: 398, luxray: 405, roserade: 407, rampardos: 409, bastiodon: 411,
    garchomp: 445, lucario: 448, toxicroak: 454, weavile: 461, electivire: 466, magmortar: 467, togekiss: 468, glaceon: 471,
    leafeon: 470, gallade: 475, garchomp: 445, giratina: 487, darkrai: 491, arceus: 493,
    serperior: 497, emboar: 500, samurott: 503, krookodile: 530, darmanitan: 555, zoroark: 571, hydreigon: 635, volcarona: 637,
    reshiram: 643, zekrom: 644, kyurem: 646, genesect: 649,
};

const getImageUrl = (nombre) => {
    const key = nombre.toLowerCase();
    const id = POKEMON_ID_MAP[key] || 1;
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
};

/**
 * SalonFama — Apartado 2: Vista SQL vista_top_competitivo
 * Muestra el Top 10 Pokémon por suma de estadísticas base (ataque+defensa+velocidad)
 */
const SalonCard = ({ poke, index }) => {
    const [imgErr, setImgErr] = useState(false);
    const color = TYPE_COLORS[poke.tipo_principal] || '#555';

    return (
        <motion.div
            key={poke.id}
            className="salon-card"
            style={{ '--type-color': color }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            whileHover={{ scale: 1.02, x: 6 }}
        >
            {/* Ranking */}
            <div className="salon-rank">
                <span className="salon-medal">{MEDAL_ICONS[index]}</span>
                <span className="salon-rank-num">#{poke.ranking}</span>
            </div>

            {/* Imagen */}
            <div className="salon-img-wrap">
                <img
                    src={imgErr
                        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${POKEMON_ID_MAP[poke.nombre.toLowerCase()] || 1}.png`
                        : getImageUrl(poke.nombre)}
                    alt={poke.nombre}
                    className="salon-img"
                    onError={() => setImgErr(true)}
                />
            </div>

            {/* Info */}
            <div className="salon-info">
                <h3 className="salon-name">{poke.nombre}</h3>
                <span className="salon-type" style={{ background: color }}>
                    {poke.tipo_principal}
                </span>
                <span className="salon-level">Nv.{poke.nivel}</span>
            </div>

            {/* Stats */}
            <div className="salon-stats">
                <div className="salon-stat">
                    <span className="salon-stat-label">ATQ</span>
                    <span className="salon-stat-val">{poke.ataque}</span>
                </div>
                <div className="salon-stat">
                    <span className="salon-stat-label">DEF</span>
                    <span className="salon-stat-val">{poke.defensa}</span>
                </div>
                <div className="salon-stat">
                    <span className="salon-stat-label">VEL</span>
                    <span className="salon-stat-val">{poke.velocidad}</span>
                </div>
                <div className="salon-stat salon-total">
                    <span className="salon-stat-label">TOTAL</span>
                    <span className="salon-stat-val salon-total-val">{poke.total_base}</span>
                </div>
            </div>
        </motion.div>
    );
};

const SalonFama = ({ onClose }) => {
    const [topPokemon, setTopPokemon] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSalon = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${API_URL}/salon-fama`);
                setTopPokemon(data);
            } catch (err) {
                setError('Error al cargar el Salón de la Fama');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSalon();
    }, []);

    return (
        <motion.div
            className="salon-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                className="salon-modal"
                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 40 }}
                transition={{ type: 'spring', damping: 20 }}
            >
                {/* Header del modal */}
                <div className="salon-header">
                    <div className="salon-title-wrap">
                        <span className="salon-trophy">🏆</span>
                        <div>
                            <h2 className="salon-title">Salón de la Fama</h2>
                            <p className="salon-subtitle">
                                Vista SQL: <code>vista_top_competitivo</code> · Top 10 por estadísticas totales
                            </p>
                        </div>
                    </div>
                    <button className="salon-close" onClick={onClose}>✕</button>
                </div>

                {/* Contenido */}
                <div className="salon-content">
                    {loading && (
                        <div className="salon-loading">
                            <div className="pokeball-spinner">
                                <div className="pokeball-top" />
                                <div className="pokeball-bottom" />
                                <div className="pokeball-center" />
                            </div>
                            <p>Cargando datos de la vista SQL...</p>
                        </div>
                    )}

                    {error && (
                        <div className="salon-error">
                            <span>❌</span>
                            <p>{error}</p>
                            <p className="salon-error-hint">¿Está el backend corriendo? ¿Existe la vista en MySQL?</p>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="salon-list">
                            {topPokemon.map((poke, index) => (
                                <SalonCard key={poke.id} poke={poke} index={index} />
                            ))}
                        </div>
                    )}
                </div>


                {/* Footer explicativo */}
                <div className="salon-footer">
                    <p>
                        📊 Los datos provienen de la <strong>vista SQL <code>vista_top_competitivo</code></strong> que
                        ordena los Pokémon por <code>(ataque + defensa + velocidad)</code> usando <code>RANK() OVER</code>
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SalonFama;
