-- ─────────────────────────────────────────────────────────────
--  RE-FIX: Sistema de LOGROS (Achievements)
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS logros_entrenador;
DROP TABLE IF EXISTS logros;
-- 1. Tabla de LOGROS (Achievements)
CREATE TABLE logros (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    puntos INT DEFAULT 10,
    icono VARCHAR(20) DEFAULT '🏆'
);
-- 2. Tabla intermedia (Tipos compatibles con entrenadores.id)
CREATE TABLE logros_entrenador (
    id_entrenador INT UNSIGNED,
    id_logro INT UNSIGNED,
    fecha_obtencion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_entrenador, id_logro),
    CONSTRAINT fk_logros_entrenador FOREIGN KEY (id_entrenador) REFERENCES entrenadores(id) ON DELETE CASCADE,
    CONSTRAINT fk_id_logro FOREIGN KEY (id_logro) REFERENCES logros(id) ON DELETE CASCADE
);
-- Inserción de logros iniciales
INSERT INTO logros (nombre, descripcion, puntos, icono)
VALUES (
        'Compañero Real',
        'Captura tu primer Pokémon de verdad',
        50,
        '🎒'
    ),
    (
        'Entrenador Novato V2',
        'Sube a un Pokémon al nivel 30 (Elite)',
        100,
        '⚡'
    ),
    (
        'Mercader Atómico',
        'Intercambia un Pokémon de forma segura',
        200,
        '🔄'
    );
-- 3. Trigger Pro
DROP TRIGGER IF EXISTS tr_primera_captura;
DELIMITER // CREATE TRIGGER tr_primera_captura
AFTER
INSERT ON pokemon_entrenador FOR EACH ROW BEGIN IF (
        SELECT COUNT(*)
        FROM pokemon_entrenador
        WHERE id_entrenador = NEW.id_entrenador
    ) = 1 THEN
INSERT IGNORE INTO logros_entrenador (id_entrenador, id_logro)
VALUES (NEW.id_entrenador, 1);
END IF;
END // DELIMITER;