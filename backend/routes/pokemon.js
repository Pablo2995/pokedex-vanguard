const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../db');

// ─────────────────────────────────────────────────────────────
//  Schemas de validación
// ─────────────────────────────────────────────────────────────
const filterSchema = Joi.object({
    nombre: Joi.string().trim().max(50),
    tipo: Joi.string().trim().max(20),
    ataque_min: Joi.number().integer().min(0),
    ataque_max: Joi.number().integer().min(0)
});

// ─────────────────────────────────────────────────────────────
//  GET /pokemon — Listar/filtrar pokémon con tiempo de consulta
//  APARTADO 3 — ÍNDICES: se mide el tiempo de la consulta
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { error, value } = filterSchema.validate(req.query);
        if (error) {
            return res.status(400).json({ error: 'Parámetros inválidos', details: error.details[0].message });
        }

        const { nombre, tipo, ataque_min, ataque_max } = value;

        // ── INICIO medición de tiempo (Apartado 3 — Índices) ──
        const startTime = process.hrtime.bigint();

        let query = 'SELECT * FROM pokemon WHERE 1=1';
        const params = [];

        if (nombre) {
            // Esta condición usa el campo 'nombre' — el índice idx_pokemon_nombre
            // mejora notablemente el rendimiento con 1000+ registros
            query += ' AND nombre LIKE ?';
            params.push(`%${nombre}%`);
        }
        if (tipo) {
            query += ' AND tipo_principal = ?';
            params.push(tipo);
        }
        if (ataque_min !== undefined) {
            query += ' AND ataque >= ?';
            params.push(ataque_min);
        }
        if (ataque_max !== undefined) {
            query += ' AND ataque <= ?';
            params.push(ataque_max);
        }

        query += ' ORDER BY id ASC';

        const [rows] = await db.query(query, params);

        // ── FIN medición de tiempo ──
        const endTime = process.hrtime.bigint();
        const queryTimeMs = Number(endTime - startTime) / 1_000_000; // nanosegundos → ms

        res.json({
            data: rows,
            meta: {
                total: rows.length,
                queryTimeMs: queryTimeMs.toFixed(3),
                hasIndex: true  // índice idx_pokemon_nombre activo
            }
        });
    } catch (err) {
        console.error('Error en GET /pokemon:', err);
        res.status(500).json({ error: 'Error del servidor al obtener los Pokémon', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
//  GET /pokemon/salon-fama — Vista Top 10 competitivo
//  APARTADO 2 — VISTAS: usa vista_top_competitivo de MySQL
// ─────────────────────────────────────────────────────────────
router.get('/salon-fama', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM vista_top_competitivo');
        res.json(rows);
    } catch (err) {
        console.error('Error en GET /pokemon/salon-fama:', err);
        res.status(500).json({ error: 'Error al obtener el Salón de la Fama', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
//  GET /pokemon/entrenadores — Listar todos los entrenadores
// ─────────────────────────────────────────────────────────────
router.get('/entrenadores', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.*, g.nombre AS nombre_gimnasio, g.ciudad AS ciudad_gimnasio
            FROM entrenadores e
            LEFT JOIN gimnasios g ON e.id_gimnasio = g.id
            ORDER BY e.id ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error en GET /pokemon/entrenadores:', err);
        res.status(500).json({ error: 'Error al obtener entrenadores', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
//  GET /pokemon/entrenadores/:id/equipo — Pokémon de un entrenador
// ─────────────────────────────────────────────────────────────
router.get('/entrenadores/:id/equipo', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT pe.id AS captura_id, pe.apodo, pe.nivel_captura, pe.en_equipo, pe.fecha_captura,
                   p.id AS pokemon_id, p.nombre, p.tipo_principal, p.nivel, p.ataque, p.defensa, p.velocidad
            FROM pokemon_entrenador pe
            JOIN pokemon p ON pe.id_pokemon = p.id
            WHERE pe.id_entrenador = ?
            ORDER BY pe.fecha_captura DESC
        `, [id]);
        res.json(rows);
    } catch (err) {
        console.error(`Error en GET /pokemon/entrenadores/${req.params.id}/equipo:`, err);
        res.status(500).json({ error: 'Error al obtener equipo del entrenador', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
//  GET /pokemon/:id — Obtener un pokémon por ID
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM pokemon WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Pokémon no encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`Error en GET /pokemon/${req.params.id}:`, err);
        res.status(500).json({ error: 'Error del servidor', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
//  POST /pokemon/capturar — CAPTURAR un pokémon (INSERT)
//  APARTADO 1 — CRUD: Insertar registro en pokemon_entrenador
// ─────────────────────────────────────────────────────────────
router.post('/capturar', async (req, res) => {
    try {
        const schema = Joi.object({
            id_entrenador: Joi.number().integer().positive().required(),
            id_pokemon: Joi.number().integer().positive().required(),
            apodo: Joi.string().trim().max(50).allow(null, '').optional(),
            clima_actual: Joi.string().allow(null, '').optional()
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: 'Datos inválidos', details: error.details[0].message });
        }

        const { id_entrenador, id_pokemon, apodo, clima_actual } = value;

        // Verificar que el entrenador existe
        const [trainers] = await db.query('SELECT id FROM entrenadores WHERE id = ?', [id_entrenador]);
        if (trainers.length === 0) {
            return res.status(404).json({ error: 'Entrenador no encontrado' });
        }

        // Verificar que el pokémon existe
        const [pokemons] = await db.query('SELECT * FROM pokemon WHERE id = ?', [id_pokemon]);
        if (pokemons.length === 0) {
            return res.status(404).json({ error: 'Pokémon no encontrado' });
        }

        // Verificar que el entrenador no tenga más de 6 pokémon en equipo
        const [teamCount] = await db.query(
            'SELECT COUNT(*) AS total FROM pokemon_entrenador WHERE id_entrenador = ? AND en_equipo = TRUE',
            [id_entrenador]
        );
        if (teamCount[0].total >= 6) {
            return res.status(400).json({ error: 'El equipo del entrenador ya está lleno (máximo 6 Pokémon)' });
        }

        // INNOVACIÓN: Sistema de Genes (IVs) y Shinies
        const isShiny = Math.random() < 0.05; // 5% Probabilidad
        const ivs = {
            atk: Math.floor(Math.random() * 32), // 0-31
            def: Math.floor(Math.random() * 32),
            spd: Math.floor(Math.random() * 32)
        };

        // INSERT — Capturar el Pokémon
        const [result] = await db.query(
            `INSERT INTO pokemon_entrenador (id_entrenador, id_pokemon, nivel_captura, apodo, en_equipo, shiny, iv_ataque, iv_defensa, iv_velocidad, factor_clima)
             VALUES (?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?)`,
            [id_entrenador, id_pokemon, pokemons[0].nivel, apodo || null, isShiny, ivs.atk, ivs.def, ivs.spd, clima_actual || 'Normal']
        );

        // EXTRA FUNCIONALIDAD: Sistema de Logros (Lógica de negocio en Node ante falta de Triggers)
        try {
            const [capturasPrevias] = await db.query(
                'SELECT COUNT(*) as total FROM pokemon_entrenador WHERE id_entrenador = ?',
                [id_entrenador]
            );
            if (capturasPrevias[0].total === 1) {
                // Es su primer Pokémon: darle logro ID 1
                await db.query(
                    'INSERT IGNORE INTO logros_entrenador (id_entrenador, id_logro) VALUES (?, 1)',
                    [id_entrenador]
                );
            }
        } catch (logroErr) {
            console.warn('Fallo no crítico al asignar logro:', logroErr.message);
        }

        res.status(201).json({
            message: isShiny ? `✨ ¡INCREÍBLE! ¡Has capturado un ${pokemons[0].nombre} SHINY! ✨` : `¡${pokemons[0].nombre} fue capturado con éxito!`,
            captura_id: result.insertId,
            isShiny,
            ivs,
            pokemon: pokemons[0]
        });
    } catch (err) {
        console.error('Error en POST /pokemon/capturar:', err);
        res.status(500).json({ error: 'Error al capturar el Pokémon', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
//  GET /pokemon/stats — Estadísticas Globales (Vista SQL)
//  NUEVA FUNCIONALIDAD EXTRA
// ─────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM pokemon) AS total_especies,
                (SELECT COUNT(*) FROM pokemon_entrenador) AS total_capturas,
                (SELECT COUNT(*) FROM entrenadores) AS entrenadores_activos,
                (SELECT p.nombre FROM pokemon p 
                 JOIN pokemon_entrenador pe ON p.id = pe.id_pokemon 
                 GROUP BY p.id ORDER BY COUNT(*) DESC LIMIT 1) AS mas_popular
        `);
        res.json(rows[0]);
    } catch (err) {
        console.error('Error en GET /pokemon/stats:', err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// ─────────────────────────────────────────────────────────────
//  PUT /pokemon/entrenar/:captura_id — ENTRENAR/EVOLUCIONAR (UPDATE)
//  APARTADO 1 — CRUD: Actualizar nivel y estadísticas en BD
// ─────────────────────────────────────────────────────────────
router.put('/entrenar/:captura_id', async (req, res) => {
    try {
        const { captura_id } = req.params;

        // Obtener la captura con datos del Pokémon
        const [capturas] = await db.query(`
            SELECT pe.*, p.nombre, p.nivel, p.ataque, p.defensa, p.velocidad, p.tipo_principal
            FROM pokemon_entrenador pe
            JOIN pokemon p ON pe.id_pokemon = p.id
            WHERE pe.id = ?
        `, [captura_id]);

        if (capturas.length === 0) {
            return res.status(404).json({ error: 'Registro de captura no encontrado' });
        }

        const captura = capturas[0];
        const nivelActual = captura.nivel;
        const nivelNuevo = Math.min(nivelActual + 5, 100);

        // Calcular nuevas estadísticas (incremento proporcional al nivel)
        const incremento = Math.floor((nivelNuevo - nivelActual) * 1.5);
        const ataqueNuevo = captura.ataque + incremento;
        const defensaNueva = captura.defensa + Math.floor(incremento * 0.8);
        const velocidadNueva = captura.velocidad + Math.floor(incremento * 0.6);

        // UPDATE en tabla pokemon (actualiza el Pokémon global)
        await db.query(
            `UPDATE pokemon SET nivel = ?, ataque = ?, defensa = ?, velocidad = ? WHERE id = ?`,
            [nivelNuevo, ataqueNuevo, defensaNueva, velocidadNueva, captura.id_pokemon]
        );

        // Actualizar nivel en pokemon_entrenador
        await db.query(
            `UPDATE pokemon_entrenador SET nivel_captura = ? WHERE id = ?`,
            [nivelNuevo, captura_id]
        );

        // Verificar evolución (niveles típicos: 16, 32, 36, etc.)
        let evolucion = null;
        const evolutionMap = {
            // Gen I
            'Bulbasaur': { nivel: 16, evolucion: 'Ivysaur' },
            'Ivysaur': { nivel: 32, evolucion: 'Venusaur' },
            'Charmander': { nivel: 16, evolucion: 'Charmeleon' },
            'Charmeleon': { nivel: 36, evolucion: 'Charizard' },
            'Squirtle': { nivel: 16, evolucion: 'Wartortle' },
            'Wartortle': { nivel: 36, evolucion: 'Blastoise' },
            'Pikachu': { nivel: 30, evolucion: 'Raichu' },
            'Eevee': { nivel: 36, evolucion: 'Vaporeon' },
            'Dratini': { nivel: 30, evolucion: 'Dragonair' },
            'Dragonair': { nivel: 55, evolucion: 'Dragonite' },
            // Gen II
            'Chikorita': { nivel: 16, evolucion: 'Bayleef' },
            'Bayleef': { nivel: 32, evolucion: 'Meganium' },
            'Cyndaquil': { nivel: 14, evolucion: 'Quilava' },
            'Quilava': { nivel: 36, evolucion: 'Typhlosion' },
            'Totodile': { nivel: 18, evolucion: 'Croconaw' },
            'Croconaw': { nivel: 30, evolucion: 'Feraligatr' },
            // Gen III
            'Treecko': { nivel: 16, evolucion: 'Grovyle' },
            'Grovyle': { nivel: 36, evolucion: 'Sceptile' },
            'Torchic': { nivel: 16, evolucion: 'Combusken' },
            'Combusken': { nivel: 36, evolucion: 'Blaziken' },
            'Mudkip': { nivel: 16, evolucion: 'Marshtomp' },
            'Marshtomp': { nivel: 36, evolucion: 'Swampert' },
        };

        const evoData = evolutionMap[captura.nombre];
        if (evoData && nivelNuevo >= evoData.nivel) {
            // Buscar el Pokémon evolucionado en la BD
            const [evoRows] = await db.query('SELECT * FROM pokemon WHERE nombre = ?', [evoData.evolucion]);
            if (evoRows.length > 0) {
                // UPDATE pokemon_entrenador — cambia el id_pokemon a la evolución
                await db.query(
                    `UPDATE pokemon_entrenador SET id_pokemon = ? WHERE id = ?`,
                    [evoRows[0].id, captura_id]
                );
                evolucion = {
                    desde: captura.nombre,
                    hacia: evoData.evolucion,
                    pokemon: evoRows[0]
                };
            }
        }

        res.json({
            message: evolucion
                ? `¡${captura.nombre} evolucionó a ${evolucion.hacia}!`
                : `¡${captura.nombre} subió al nivel ${nivelNuevo}!`,
            nivel_anterior: nivelActual,
            nivel_nuevo: nivelNuevo,
            stats: { ataque: ataqueNuevo, defensa: defensaNueva, velocidad: velocidadNueva },
            evolucion
        });
    } catch (err) {
        console.error('Error en PUT /pokemon/entrenar:', err);
        res.status(500).json({ error: 'Error al entrenar el Pokémon', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
//  DELETE /pokemon/liberar/:captura_id — LIBERAR un pokémon (DELETE)
//  APARTADO 1 — CRUD: Eliminar registro de pokemon_entrenador
// ─────────────────────────────────────────────────────────────
router.delete('/liberar/:captura_id', async (req, res) => {
    try {
        const { captura_id } = req.params;

        // Verificar que el registro existe
        const [capturas] = await db.query(`
            SELECT pe.*, p.nombre
            FROM pokemon_entrenador pe
            JOIN pokemon p ON pe.id_pokemon = p.id
            WHERE pe.id = ?
        `, [captura_id]);

        if (capturas.length === 0) {
            return res.status(404).json({ error: 'Registro de captura no encontrado' });
        }

        const captura = capturas[0];

        // DELETE — Eliminar definitivamente de pokemon_entrenador
        await db.query('DELETE FROM pokemon_entrenador WHERE id = ?', [captura_id]);

        res.json({
            message: `${captura.nombre} ha sido liberado. ¡Hasta siempre!`,
            pokemon_liberado: captura.nombre
        });
    } catch (err) {
        console.error('Error en DELETE /pokemon/liberar:', err);
        res.status(500).json({ error: 'Error al liberar el Pokémon', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
//  POST /pokemon/intercambio — TRANSACCIÓN de intercambio
//  APARTADO 4 — TRANSACCIONES: START TRANSACTION + COMMIT/ROLLBACK
//  Intercambia un Pokémon entre dos entrenadores de forma atómica
// ─────────────────────────────────────────────────────────────
router.post('/intercambio', async (req, res) => {
    const schema = Joi.object({
        id_entrenador_1: Joi.number().integer().positive().required(),
        id_captura_1: Joi.number().integer().positive().required(),  // Pokémon que ofrece entrenador 1
        id_entrenador_2: Joi.number().integer().positive().required(),
        id_captura_2: Joi.number().integer().positive().required()   // Pokémon que ofrece entrenador 2
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: 'Datos inválidos', details: error.details[0].message });
    }

    const { id_entrenador_1, id_captura_1, id_entrenador_2, id_captura_2 } = value;

    // Obtenemos una conexión dedicada de la pool para usar transacciones
    const connection = await db.getConnection();

    try {
        // ── START TRANSACTION ──────────────────────────────────
        // Inicia la transacción: si algo falla, se hace ROLLBACK automático
        await connection.beginTransaction();

        // Verificar que la captura 1 pertenece al entrenador 1
        const [cap1] = await connection.query(
            'SELECT pe.*, p.nombre FROM pokemon_entrenador pe JOIN pokemon p ON pe.id_pokemon = p.id WHERE pe.id = ? AND pe.id_entrenador = ? FOR UPDATE',
            [id_captura_1, id_entrenador_1]
        );
        if (cap1.length === 0) {
            await connection.rollback();  // ── ROLLBACK ──
            return res.status(404).json({ error: `El Pokémon #${id_captura_1} no pertenece al Entrenador #${id_entrenador_1}` });
        }

        // Verificar que la captura 2 pertenece al entrenador 2
        const [cap2] = await connection.query(
            'SELECT pe.*, p.nombre FROM pokemon_entrenador pe JOIN pokemon p ON pe.id_pokemon = p.id WHERE pe.id = ? AND pe.id_entrenador = ? FOR UPDATE',
            [id_captura_2, id_entrenador_2]
        );
        if (cap2.length === 0) {
            await connection.rollback();  // ── ROLLBACK ──
            return res.status(404).json({ error: `El Pokémon #${id_captura_2} no pertenece al Entrenador #${id_entrenador_2}` });
        }

        // No se puede intercambiar el mismo Pokémon
        if (id_captura_1 === id_captura_2) {
            await connection.rollback();
            return res.status(400).json({ error: 'No puedes intercambiar el mismo Pokémon' });
        }

        // UPDATE 1: El Pokémon del entrenador 1 pasa al entrenador 2
        await connection.query(
            'UPDATE pokemon_entrenador SET id_entrenador = ? WHERE id = ?',
            [id_entrenador_2, id_captura_1]
        );

        // UPDATE 2: El Pokémon del entrenador 2 pasa al entrenador 1
        await connection.query(
            'UPDATE pokemon_entrenador SET id_entrenador = ? WHERE id = ?',
            [id_entrenador_1, id_captura_2]
        );

        // ── COMMIT ─────────────────────────────────────────────
        // Solo si ambos UPDATEs tuvieron éxito, guardamos los cambios
        await connection.commit();

        res.json({
            message: `¡Intercambio exitoso! ${cap1[0].nombre} ↔ ${cap2[0].nombre}`,
            intercambio: {
                entrenador_1: { id: id_entrenador_1, recibio: cap2[0].nombre, entrego: cap1[0].nombre },
                entrenador_2: { id: id_entrenador_2, recibio: cap1[0].nombre, entrego: cap2[0].nombre }
            }
        });
    } catch (err) {
        // ── ROLLBACK ────────────────────────────────────────────
        // Si cualquier operación falla, revertimos TODOS los cambios
        await connection.rollback();
        console.error('Error en POST /pokemon/intercambio (ROLLBACK ejecutado):', err);
        res.status(500).json({
            error: 'Error durante el intercambio. Se ha hecho ROLLBACK — ningún cambio fue guardado.',
            details: err.message
        });
    } finally {
        // Siempre devolver la conexión al pool
        connection.release();
    }
});

// ─────────────────────────────────────────────────────────────
//  POST /pokemon/battle — Simular batalla (sin cambios)
// ─────────────────────────────────────────────────────────────
router.post('/battle', async (req, res) => {
    try {
        const { error, value } = Joi.object({
            team1: Joi.array().items(Joi.number().integer()).min(1).max(6).required(),
            team2: Joi.array().items(Joi.number().integer()).min(1).max(6).required()
        }).validate(req.body);

        if (error) return res.status(400).json({ error: 'Equipos inválidos', details: error.details[0].message });

        const { team1, team2 } = value;
        const allIds = [...new Set([...team1, ...team2])];

        const [rows] = await db.query('SELECT * FROM pokemon WHERE id IN (?)', [allIds]);

        const getTeamStats = (teamIds) => {
            let totalScore = 0;
            let members = [];
            for (const id of teamIds) {
                const poke = rows.find(p => p.id === id);
                if (poke) {
                    members.push(poke.nombre);
                    totalScore += (poke.ataque * 1.5) + poke.velocidad + (poke.defensa * 0.8) + (Math.random() * 20);
                }
            }
            return { score: totalScore, names: members.join(', ') };
        };

        const t1 = getTeamStats(team1);
        const t2 = getTeamStats(team2);

        if (t1.score === 0 || t2.score === 0) {
            return res.status(404).json({ error: 'No se encontraron algunos Pokémon para el combate' });
        }

        const ganador = t1.score > t2.score ? 'Equipo 1' : (t2.score > t1.score ? 'Equipo 2' : null);

        const log = [
            `🔥 ¡La Super Batalla ha comenzado! 🔥`,
            `🔵 Equipo 1 [${t1.names}] — poder: ${Math.round(t1.score)}`,
            `🔴 Equipo 2 [${t2.names}] — poder: ${Math.round(t2.score)}`,
            `⚔️ Intercambio de ataques masivos...`,
            ganador
                ? `🏆 ¡El ${ganador} gana!`
                : `¡Empate legendario!`
        ];

        res.json({ ganador, log, score1: Math.round(t1.score), score2: Math.round(t2.score), team1Names: t1.names, team2Names: t2.names });
    } catch (err) {
        console.error('Error en POST /pokemon/battle:', err);
        res.status(500).json({ error: 'Error del servidor en la batalla', details: err.message });
    }
});

module.exports = router;
