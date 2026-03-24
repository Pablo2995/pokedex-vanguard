import React from 'react';

const SearchBar = ({ value, onChange }) => {
    return (
        <div className="search-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
                id="search-input"
                type="text"
                className="search-input"
                placeholder="Buscar Pokémon por nombre..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete="off"
            />
            {value && (
                <button className="search-clear" onClick={() => onChange('')} title="Limpiar búsqueda">
                    ✕
                </button>
            )}
        </div>
    );
};

export default SearchBar;
