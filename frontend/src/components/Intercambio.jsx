import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import './Intercambio.css';

const API_URL = 'http://localhost:5000/pokemon';

/**
 * Intercambio — Apartado 4: Transacciones
 * Permite seleccionar dos entrenadores y sus Pokémon para intercambiarlos.
 * El backend usa START TRANSACTION / COMMIT / ROLLBACK para garantizar
 * que el intercambio es atómico: o se completa del todo o no se guarda nada.
 */
const Intercambio = ({ onClose }) => {
    const [entrenadores, setEntrenadores] = useState([]);
    const [loadingEntrenadores, setLoadingEntrenadores] = useState(true);

    const [entrenador1, setEntrenador1] = useState('');
    const [equipo1, setEquipo1] = useState([]);
    const [pokemon1, setPokemon1] = useState('');

    const [entrenador2, setEntrenador2] = useState('');
    const [equipo2, setEquipo2] = useState([]);
    const [pokemon2, setPokemon2] = useState('');

    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1 = selección, 2 = confirmación, 3 = resultado

    // Cargar entrenadores al montar
    useEffect(() => {
        const fetchEntrenadores = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/entrenadores`);
                setEntrenadores(data);
            } catch (err) {
                console.error('Error cargando entrenadores:', err);
                toast.error('No se pudieron cargar los entrenadores');
            } finally {
                setLoadingEntrenadores(false);
            }
        };
        fetchEntrenadores();
    }, []);

    // Cargar equipo del entrenador 1
    useEffect(() => {
        if (!entrenador1) { setEquipo1([]); setPokemon1(''); return; }
        const fetch = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/entrenadores/${entrenador1}/equipo`);
                setEquipo1(data);
                setPokemon1('');
            } catch (err) {
                console.error(err);
                toast.error('Error cargando equipo del Entrenador 1');
            }
        };
        fetch();
    }, [entrenador1]);

    // Cargar equipo del entrenador 2
    useEffect(() => {
        if (!entrenador2) { setEquipo2([]); setPokemon2(''); return; }
        const fetch = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/entrenadores/${entrenador2}/equipo`);
                setEquipo2(data);
                setPokemon2('');
            } catch (err) {
                console.error(err);
                toast.error('Error cargando equipo del Entrenador 2');
            }
        };
        fetch();
    }, [entrenador2]);

    const puedeConfirmar =
        entrenador1 && entrenador2 &&
        pokemon1 && pokemon2 &&
        entrenador1 !== entrenador2;

    const handleConfirmar = () => {
        if (!puedeConfirmar) return;
        setStep(2);
    };

    /**
     * Ejecutar el intercambio — llama al endpoint POST /pokemon/intercambio
     * El backend ejecuta START TRANSACTION y hace COMMIT o ROLLBACK
     */
    const handleIntercambiar = async () => {
        setLoading(true);
        try {
            const { data } = await axios.post(`${API_URL}/intercambio`, {
                id_entrenador_1: parseInt(entrenador1),
                id_captura_1: parseInt(pokemon1),
                id_entrenador_2: parseInt(entrenador2),
                id_captura_2: parseInt(pokemon2),
            });
            setResultado({ success: true, data });
            setStep(3);
            toast.success(data.message, { icon: '🔄' });
        } catch (err) {
            const msg = err.response?.data?.error || 'Error durante el intercambio';
            setResultado({ success: false, error: msg });
            setStep(3);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setEntrenador1(''); setEquipo1([]); setPokemon1('');
        setEntrenador2(''); setEquipo2([]); setPokemon2('');
        setResultado(null);
        setStep(1);
    };

    const poke1Info = equipo1.find(p => String(p.captura_id) === String(pokemon1));
    const poke2Info = equipo2.find(p => String(p.captura_id) === String(pokemon2));
    const entrenador1Info = entrenadores.find(e => String(e.id) === String(entrenador1));
    const entrenador2Info = entrenadores.find(e => String(e.id) === String(entrenador2));

    return (
        <motion.div
            className="intercambio-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                className="intercambio-modal"
                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 40 }}
                transition={{ type: 'spring', damping: 20 }}
            >
                {/* Header */}
                <div className="intercambio-header">
                    <div>
                        <h2 className="intercambio-title">🔄 Intercambio de Pokémon</h2>
                        <p className="intercambio-subtitle">
                            Transacción atómica: <code>START TRANSACTION</code> · <code>COMMIT</code> · <code>ROLLBACK</code>
                        </p>
                    </div>
                    <button className="intercambio-close" onClick={onClose}>✕</button>
                </div>

                {/* Indicador de pasos */}
                <div className="intercambio-steps">
                    {['Selección', 'Confirmación', 'Resultado'].map((label, i) => (
                        <div key={i} className={`step-dot ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
                            <span className="step-num">{step > i + 1 ? '✓' : i + 1}</span>
                            <span className="step-label">{label}</span>
                        </div>
                    ))}
                </div>

                <div className="intercambio-body">

                    {/* ─── PASO 1: Selección ─── */}
                    {step === 1 && (
                        <div className="intercambio-seleccion">
                            {loadingEntrenadores ? (
                                <p className="intercambio-loading">Cargando entrenadores...</p>
                            ) : (
                                <div className="intercambio-cols">
                                    {/* Entrenador 1 */}
                                    <div className="intercambio-col">
                                        <h3>👤 Entrenador 1</h3>
                                        <select
                                            className="intercambio-select"
                                            value={entrenador1}
                                            onChange={e => setEntrenador1(e.target.value)}
                                            id="select-entrenador-1"
                                        >
                                            <option value="">— Seleccionar entrenador —</option>
                                            {entrenadores
                                                .filter(e => String(e.id) !== String(entrenador2))
                                                .map(e => (
                                                    <option key={e.id} value={e.id}>{e.nombre}</option>
                                                ))
                                            }
                                        </select>

                                        {equipo1.length > 0 && (
                                            <>
                                                <label className="intercambio-label">Pokémon a ofrecer:</label>
                                                <div className="intercambio-pokemon-list">
                                                    {equipo1.map(p => (
                                                        <div
                                                            key={p.captura_id}
                                                            className={`intercambio-poke-item ${String(pokemon1) === String(p.captura_id) ? 'selected' : ''}`}
                                                            onClick={() => setPokemon1(p.captura_id)}
                                                            id={`poke1-${p.captura_id}`}
                                                        >
                                                            <span className="intercambio-poke-name">
                                                                {p.apodo || p.nombre}
                                                            </span>
                                                            <span className="intercambio-poke-level">Nv.{p.nivel}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {equipo1.length === 0 && (
                                                    <p className="intercambio-empty">Este entrenador no tiene Pokémon capturados.</p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="intercambio-divider">⇄</div>

                                    {/* Entrenador 2 */}
                                    <div className="intercambio-col">
                                        <h3>👤 Entrenador 2</h3>
                                        <select
                                            className="intercambio-select"
                                            value={entrenador2}
                                            onChange={e => setEntrenador2(e.target.value)}
                                            id="select-entrenador-2"
                                        >
                                            <option value="">— Seleccionar entrenador —</option>
                                            {entrenadores
                                                .filter(e => String(e.id) !== String(entrenador1))
                                                .map(e => (
                                                    <option key={e.id} value={e.id}>{e.nombre}</option>
                                                ))
                                            }
                                        </select>

                                        {equipo2.length > 0 && (
                                            <>
                                                <label className="intercambio-label">Pokémon a ofrecer:</label>
                                                <div className="intercambio-pokemon-list">
                                                    {equipo2.map(p => (
                                                        <div
                                                            key={p.captura_id}
                                                            className={`intercambio-poke-item ${String(pokemon2) === String(p.captura_id) ? 'selected' : ''}`}
                                                            onClick={() => setPokemon2(p.captura_id)}
                                                            id={`poke2-${p.captura_id}`}
                                                        >
                                                            <span className="intercambio-poke-name">
                                                                {p.apodo || p.nombre}
                                                            </span>
                                                            <span className="intercambio-poke-level">Nv.{p.nivel}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {equipo2.length === 0 && (
                                                    <p className="intercambio-empty">Este entrenador no tiene Pokémon capturados.</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                className="intercambio-btn"
                                disabled={!puedeConfirmar}
                                onClick={handleConfirmar}
                                id="btn-confirmar-intercambio"
                            >
                                Revisar Intercambio →
                            </button>
                        </div>
                    )}

                    {/* ─── PASO 2: Confirmación ─── */}
                    {step === 2 && (
                        <div className="intercambio-confirmacion">
                            <p className="intercambio-confirm-title">¿Confirmas el intercambio?</p>
                            <div className="intercambio-confirm-preview">
                                <div className="confirm-side">
                                    <div className="confirm-trainer">{entrenador1Info?.nombre}</div>
                                    <div className="confirm-gives">entrega</div>
                                    <div className="confirm-pokemon">
                                        {poke1Info?.apodo || poke1Info?.nombre}
                                        <span>Nv.{poke1Info?.nivel}</span>
                                    </div>
                                </div>
                                <div className="confirm-arrow">⇄</div>
                                <div className="confirm-side">
                                    <div className="confirm-trainer">{entrenador2Info?.nombre}</div>
                                    <div className="confirm-gives">entrega</div>
                                    <div className="confirm-pokemon">
                                        {poke2Info?.apodo || poke2Info?.nombre}
                                        <span>Nv.{poke2Info?.nivel}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="intercambio-transaction-info">
                                <h4>⚙️ Funcionamiento de la transacción</h4>
                                <ol>
                                    <li><code>START TRANSACTION</code> — Se inicia la transacción</li>
                                    <li><code>UPDATE</code> — Pokémon de entrenador 1 pasa al 2</li>
                                    <li><code>UPDATE</code> — Pokémon de entrenador 2 pasa al 1</li>
                                    <li><code>COMMIT</code> — Si todo OK, se guardan los cambios</li>
                                    <li><code>ROLLBACK</code> — Si hay error, NO se guarda nada</li>
                                </ol>
                            </div>

                            <div className="intercambio-confirm-btns">
                                <button className="intercambio-btn intercambio-btn-secondary" onClick={() => setStep(1)}>
                                    ← Volver
                                </button>
                                <button
                                    className="intercambio-btn"
                                    onClick={handleIntercambiar}
                                    disabled={loading}
                                    id="btn-ejecutar-intercambio"
                                >
                                    {loading ? '⏳ Ejecutando transacción...' : '✅ Confirmar Intercambio'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ─── PASO 3: Resultado ─── */}
                    {step === 3 && resultado && (
                        <div className="intercambio-resultado">
                            {resultado.success ? (
                                <>
                                    <div className="resultado-icon resultado-success">✅</div>
                                    <h3 className="resultado-title">{resultado.data.message}</h3>
                                    <div className="resultado-info">
                                        <div className="resultado-side">
                                            <strong>{resultado.data.intercambio.entrenador_1.id === parseInt(entrenador1) ? entrenador1Info?.nombre : entrenador2Info?.nombre}</strong>
                                            <span>⬅ recibió: {resultado.data.intercambio.entrenador_1.recibio}</span>
                                            <span>➡ entregó: {resultado.data.intercambio.entrenador_1.entrego}</span>
                                        </div>
                                        <div className="resultado-side">
                                            <strong>{resultado.data.intercambio.entrenador_2.id === parseInt(entrenador2) ? entrenador2Info?.nombre : entrenador1Info?.nombre}</strong>
                                            <span>⬅ recibió: {resultado.data.intercambio.entrenador_2.recibio}</span>
                                            <span>➡ entregó: {resultado.data.intercambio.entrenador_2.entrego}</span>
                                        </div>
                                    </div>
                                    <p className="resultado-commit">✔ <code>COMMIT</code> ejecutado — cambios guardados en BD</p>
                                </>
                            ) : (
                                <>
                                    <div className="resultado-icon resultado-error">❌</div>
                                    <h3 className="resultado-title">Error en el intercambio</h3>
                                    <p className="resultado-error-msg">{resultado.error}</p>
                                    <p className="resultado-rollback">↩ <code>ROLLBACK</code> ejecutado — ningún cambio fue guardado</p>
                                </>
                            )}
                            <button className="intercambio-btn" onClick={handleReset} id="btn-nuevo-intercambio">
                                🔄 Nuevo Intercambio
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Intercambio;
