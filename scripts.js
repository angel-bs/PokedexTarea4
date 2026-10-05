import * as pokeApi from "./pokeApi/api.js";

const PAGE_SIZE = 8;
const MAX_POKEMON = 151;
const SPRITE = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const STAT_NAMES = {
    hp: "PS", attack: "Ataque", defense: "Defensa",
    "special-attack": "Ataq. esp.", "special-defense": "Def. esp.", speed: "Velocidad"
};

window.addEventListener("load", function () {
    const $ = (id) => document.getElementById(id);
    const form1 = $("form1"), list = $("list"), detail = $("detail");
    const btnPrev = $("btnPrev"), btnNext = $("btnNext");
    const art = $("art"), crtInfo = $("crtInfo");

    let all = [];
    let visible = [];
    let offset = 0;
    let current = 1;

    const idFromUrl = (url) => Number(url.split("/").filter(Boolean).pop());

    const showMessage = (text) => { detail.innerHTML = `<p>${text}</p>`; };

    $("keypad").innerHTML = Array.from({ length: 10 }, (_, i) => `<button type="button" data-id="${i + 1}">${i + 1}</button>`).join("");

    const loadSpecies = async (id) => {
        try {
            const r = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
            const s = await r.json();
            const flavor = s.flavor_text_entries.find((f) => f.language.name === "es");
            const genus = s.genera.find((g) => g.language.name === "es");
            return {
                text: flavor ? flavor.flavor_text.replace(/\s+/g, " ") : "Sin registro disponible.",
                genus: genus ? genus.genus.replace(/^Pokémon\s*/i, "") : "—"
            };
        } catch { return { text: "Sin registro disponible.", genus: "—" }; }
    };

    const renderDetail = (p, sp) => {
        const num = String(p.id).padStart(3, "0");
        const types = p.types.map((t) => `<span class="tag t-${t.type.name}">${t.type.name}</span>`).join("");
        const stats = p.stats.map((s) => `
            <div class="stat ${s.base_stat >= 100 ? "stat-hi" : ""}">
                <span>${STAT_NAMES[s.stat.name] || s.stat.name}</span>
                <div class="track"><span style="width:${Math.min(s.base_stat / 255 * 100, 100)}%"></span></div>
                <b>${s.base_stat}</b>
            </div>`).join("");
        detail.innerHTML = `
            <div class="data-head"><h2><span class="num">#${num}</span> ${p.name}</h2><div class="tags">${types}</div></div>
            <div class="facts">
                <div><small>Especie</small>${sp.genus}</div>
                <div><small>Altura</small>${p.height / 10} m</div>
                <div><small>Peso</small>${p.weight / 10} kg</div>
            </div>
            <p class="lore"><small>Registro oficial Kanto</small>${sp.text}</p>
            ${stats}`;

        const src = p.sprites.other["official-artwork"].front_default || p.sprites.front_default;
        art.src = src; art.alt = p.name; art.hidden = false;
        crtInfo.textContent = `ID: #${num} · ${p.name}`;
    };

    const loadPokemon = async (idOrName) => {
        showMessage("Cargando…");
        try {
            const key = String(idOrName).trim().toLowerCase();
            const pokemon = await pokeApi.getPokemonById(key);
            if (pokemon.id > MAX_POKEMON) throw new Error("Fuera de la primera generación");
            current = pokemon.id;
            const sp = await loadSpecies(pokemon.id);
            renderDetail(pokemon, sp);
            markActive();
        } catch (e) {
            art.hidden = true;
            crtInfo.textContent = "Sin señal";
            showMessage('<span class="err">Solo están disponibles los Pokémon del 1 al 151. Revisa el número o el nombre.</span>');
        }
    };

    const markActive = () => {
        list.querySelectorAll(".row").forEach((r) => r.classList.toggle("active", Number(r.dataset.id) === current));
        $("btnPrevPoke").disabled = current <= 1;
        $("btnNextPoke").disabled = current >= MAX_POKEMON;
    };

    const renderList = () => {
        const page = visible.slice(offset, offset + PAGE_SIZE);
        list.innerHTML = page.length ? page.map((p) => `
            <button type="button" class="row" data-id="${p.id}">
                <img src="${SPRITE(p.id)}" alt="" loading="lazy">
                <span class="n">#${String(p.id).padStart(3, "0")}</span>
                <span class="nm">${p.name}</span>
            </button>`).join("") : '<p class="empty">No hay Pokémon con ese filtro.</p>';
        const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
        $("pageInfo").textContent = `Pág. ${Math.floor(offset / PAGE_SIZE) + 1} / ${pages}`;
        $("count").textContent = `${visible.length} especies`;
        btnPrev.disabled = offset === 0;
        btnNext.disabled = offset + PAGE_SIZE >= visible.length;
        markActive();
    };

    const loadList = async () => {
        try {
            const data = await pokeApi.getAllPokemons(MAX_POKEMON, 0);
            all = data.results.map((r) => ({ id: idFromUrl(r.url), name: r.name }));
            visible = all;
            renderList();
        } catch (e) {
            list.innerHTML = '<p class="err">No se pudo cargar la lista. Revisa tu conexión.</p>';
        }
    };

    // Filtros por tipo
    $("filters").addEventListener("click", async function ($e) {
        const btn = $e.target.closest(".f");
        if (!btn) return;
        this.querySelectorAll(".f").forEach((b) => b.classList.toggle("active", b === btn));
        const type = btn.dataset.type;
        offset = 0;
        if (!type) { visible = all; renderList(); return; }
        try {
            const r = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
            const ids = new Set((await r.json()).pokemon.map((x) => idFromUrl(x.pokemon.url)));
            visible = all.filter((p) => ids.has(p.id));
        } catch { visible = all; }
        renderList();
    });

    form1.addEventListener("submit", function ($e) {
        $e.preventDefault();
        loadPokemon(new FormData(this).get("pokedex-number"));
    });

    const pick = ($e) => {
        const el = $e.target.closest("[data-id]");
        if (el) loadPokemon(el.dataset.id);
    };
    list.addEventListener("click", pick);
    $("keypad").addEventListener("click", pick);

    $("btnPrevPoke").addEventListener("click", () => loadPokemon(Math.max(1, current - 1)));
    $("btnNextPoke").addEventListener("click", () => loadPokemon(Math.min(MAX_POKEMON, current + 1)));
    btnPrev.addEventListener("click", () => { offset = Math.max(0, offset - PAGE_SIZE); renderList(); });
    btnNext.addEventListener("click", () => { offset += PAGE_SIZE; renderList(); });

    loadList();
    loadPokemon(25);
});