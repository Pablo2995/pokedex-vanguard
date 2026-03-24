import React from 'react';
import PokemonCard from './PokemonCard';

const PokemonList = ({ pokemon, loading, error }) => {
    if (loading) {
        return (
            <div className="state-container">
                <div className="pokeball-spinner">
                    <div className="pokeball-top" />
                    <div className="pokeball-center" />
                    <div className="pokeball-bottom" />
                </div>
                <p className="state-text">Cargando Pokémon...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="state-container">
                <div className="error-icon">⚡</div>
                <p className="state-text error-text">{error}</p>
                <p className="state-subtext">
                    Asegúrate de que el backend (Node.js) y MySQL estén en ejecución.
                </p>
            </div>
        );
    }

    if (pokemon.length === 0) {
        return (
            <div className="state-container">
                <div className="error-icon">🔍</div>
                <p className="state-text">No se encontraron Pokémon</p>
                <p className="state-subtext">Intenta con otro nombre o tipo de filtro.</p>
            </div>
        );
    }

    return (
        <div className="pokemon-grid">
            {pokemon.map((p) => (
                <PokemonCard key={p.id} pokemon={p} />
            ))}
        </div>
    );
};

export default PokemonList;
