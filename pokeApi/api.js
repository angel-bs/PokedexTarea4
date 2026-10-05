const BASE = "https://pokeapi.co/api/v2";

let request = async (path) => {
    let response = await fetch(BASE + path);
    if (!response.ok) {
        throw new Error("No se encontró el recurso (" + response.status + ")");
    }
    return await response.json();
};

let getAllPokemons = async (limit = 20, offset = 0) => {
    return await request("/pokemon?limit=" + limit + "&offset=" + offset);
};

let getPokemonById = async (id) => {
    return await request("/pokemon/" + String(id).toLowerCase().trim());
};

let getPokemonsAbility = async (abilityName) => {
    return await request("/ability/" + String(abilityName).toLowerCase().trim());
};

let getPokemonType = async (typeName) => {
    return await request("/type/" + String(typeName).toLowerCase().trim());
};

let getPokemonAbility = async (id, abilityName) => {
    let pokemon = await getPokemonById(id);
    let name = String(abilityName).toLowerCase().trim();
    return pokemon.abilities.find((a) => a.ability.name === name);
};

export { getAllPokemons, getPokemonById, getPokemonsAbility, getPokemonType, getPokemonAbility };
