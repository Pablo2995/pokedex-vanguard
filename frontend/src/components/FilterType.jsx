import React from 'react';

const TYPES = [
    { label: 'Todos los tipos', value: '' },
    { label: 'Normal', value: 'Normal' },
    { label: 'Fuego', value: 'Fuego' },
    { label: 'Agua', value: 'Agua' },
    { label: 'Planta', value: 'Planta' },
    { label: 'Eléctrico', value: 'Eléctrico' },
    { label: 'Hielo', value: 'Hielo' },
    { label: 'Lucha', value: 'Lucha' },
    { label: 'Veneno', value: 'Veneno' },
    { label: 'Tierra', value: 'Tierra' },
    { label: 'Volador', value: 'Volador' },
    { label: 'Psíquico', value: 'Psíquico' },
    { label: 'Bicho', value: 'Bicho' },
    { label: 'Roca', value: 'Roca' },
    { label: 'Fantasma', value: 'Fantasma' },
    { label: 'Dragón', value: 'Dragón' },
    { label: 'Siniestro', value: 'Siniestro' },
    { label: 'Acero', value: 'Acero' },
    { label: 'Hada', value: 'Hada' },
];

const FilterType = ({ value, onChange }) => {
    return (
        <div className="select-wrapper">
            <svg className="select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <select
                id="type-filter"
                className="type-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                        {t.label}
                    </option>
                ))}
            </select>
            <span className="select-arrow">▾</span>
        </div>
    );
};

export default FilterType;
