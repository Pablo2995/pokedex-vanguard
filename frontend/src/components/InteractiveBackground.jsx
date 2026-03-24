import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const GeometricBackground = () => {
    // Generamos 15 formas geométricas 3D (Cojines, Cubos, Esferas)
    const shapes = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            type: ['sphere', 'cube', 'prism'][Math.floor(Math.random() * 3)],
            size: Math.random() * 150 + 50,
            x: Math.random() * 100,
            y: Math.random() * 100,
            color: ['#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#fbbf24'][Math.floor(Math.random() * 5)],
            duration: Math.random() * 20 + 10,
            rotate: Math.random() * 360
        }));
    }, []);

    return (
        <div className="vanguard-3d-bg">
            {/* Capa de Profundidad 1: Gradiente Base Multicolor */}
            <div className="bg-depth-gradient" />

            {/* Capa de Profundidad 2: Formas 3D en Movimiento */}
            {shapes.map(shape => (
                <motion.div
                    key={shape.id}
                    className={`bg-3d-shape ${shape.type}-shape`}
                    initial={{
                        x: `${shape.x}vw`,
                        y: `${shape.y}vh`,
                        rotate: 0,
                        opacity: 0.15
                    }}
                    animate={{
                        y: [`${shape.y}vh`, `${shape.y + (Math.random() * 20 - 10)}vh`],
                        x: [`${shape.x}vw`, `${shape.x + (Math.random() * 20 - 10)}vw`],
                        rotate: [shape.rotate, shape.rotate + 360],
                        opacity: [0.1, 0.25, 0.1]
                    }}
                    transition={{
                        duration: shape.duration,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                    style={{
                        width: shape.size,
                        height: shape.size,
                        '--shape-color': shape.color,
                        filter: `drop-shadow(0 20px 40px ${shape.color}44)`
                    }}
                />
            ))}

            {/* Capa de Profundidad 3: Grid de Perspectiva 3D (Tron) */}
            <div className="bg-perspective-grid" />

            {/* Capa de Profundidad 4: Partículas de Luz de contraste */}
            <div className="bg-stardust-particles" />
        </div>
    );
};

export default GeometricBackground;
