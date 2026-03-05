const map = L.map("map", {
    center: [-9.6498, -35.7089],
    zoom: 12
});

let marcadorBusca = null;

/* ===============================
   BARRA DE PESQUISA (ENDEREÇOS)
=============================== */

const geocoder = L.Control.geocoder({
    geocoder: L.Control.Geocoder.nominatim({
        geocodingQueryParams: {
            countrycodes: "br",
            viewbox: "-35.85,-9.75,-35.60,-9.45",
            bounded: 1
        }
    }),
    placeholder: "Buscar rua, bairro ou local...",
    defaultMarkGeocode: false
})
.on("markgeocode", function (e) {

    if (marcadorBusca) {
        map.removeLayer(marcadorBusca);
    }

    map.fitBounds(e.geocode.bbox);

    marcadorBusca = L.marker(e.geocode.center)
        .addTo(map)
        .bindPopup(e.geocode.name)
        .openPopup();
})
.addTo(map);

/* ===============================
   CAMADAS BASE
=============================== */

const baseOSM = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "© OpenStreetMap" }
).addTo(map);

const baseEsri = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri" }
);

const baseGoogle = L.tileLayer(
    "http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    { attribution: "Google" }
);

const baseCarto = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    { attribution: "© CARTO" }
);

const baseMaps = {
    "🗺️ Mapa Padrão": baseOSM,
    "🌎 Satélite ESRI": baseEsri,
    "🛰️ Google Satélite": baseGoogle,
    "📖 Carto Claro": baseCarto
};

L.control.layers(baseMaps, null, { collapsed: false }).addTo(map);

/* ===============================
   VARIÁVEIS
=============================== */

let areasLayer = null;
let abairramentoLayer = null;
let camadaSelecionada = null;
let filtroGrotaAtivo = false;
let abairramentoVisivel = false;

let crasLayer = null;
let crasVisivel = false;

let escolasmunicipaisLayer = null;
let escolasmunicipaisVisivel = false;

let creasLayer = null;
let creasVisivel = false;

let restaurantepopularLayer = null;
let restaurantepopularVisivel = false;

let gigantinhosLayer = null;
let gigantinhosVisivel = false;

const areasGrota = ["Vale do Reginaldo", "Recanto Nabal"];

/* ===============================
   CONTADOR DE EQUIPAMENTOS
=============================== */

function atualizarContagemEquipamentos() {

    let total = 0;

    if (crasLayer && crasVisivel) total += crasLayer.getLayers().length;
    if (escolasmunicipaisLayer && escolasmunicipaisVisivel) total += escolasmunicipaisLayer.getLayers().length;
    if (creasLayer && creasVisivel) total += creasLayer.getLayers().length;
    if (restaurantepopularLayer && restaurantepopularVisivel) total += restaurantepopularLayer.getLayers().length;
    if (gigantinhosLayer && gigantinhosVisivel) total += gigantinhosLayer.getLayers().length;

    const contador = document.getElementById("contador-equipamentos");

    if (contador) contador.innerText = total;
}

/* ===============================
   BOTÕES
=============================== */

const btnGrotaNoGrau = document.getElementById("btnGrotaNoGrau");
const btnAbairramento = document.getElementById("btnAbairramento");
const btnCRAS = document.getElementById("btnCRAS");
const btnEscolasMunicipais = document.getElementById("btnEscolasMunicipais");
const btnCREAS = document.getElementById("btnCREAS");
const btnRestaurantePopular = document.getElementById("btnRestaurantePopular");
const btnGigantinhos = document.getElementById("btnGigantinhos");

/* ===============================
   AJUDA VISUAL
=============================== */

function alternarBotaoAtivo(botao, ativo) {
    if (ativo) botao.classList.add("ativo");
    else botao.classList.remove("ativo");
}

/* ===============================
   ESTILOS
=============================== */

function estiloAreas(feature) {

    if (filtroGrotaAtivo && areasGrota.includes(feature.properties.nm_fcu)) {
        return { color: "#dc2626", weight: 3, fillOpacity: 0.6 };
    }

    return { color: "#2563eb", weight: 2, fillOpacity: 0.4 };
}

const estiloAbairramento = {
    color: "#dc2626",
    weight: 1,
    fillOpacity: 0
};

/* ===============================
   ÁREAS
=============================== */

fetch("/geojson/areas")
    .then(r => r.json())
    .then(data => {

        const comunidadesUnicas = new Set();

        data.features.forEach(f => {
            const nome = f.properties?.nm_fcu;
            if (nome) comunidadesUnicas.add(nome);
        });

        const totalComunidades = comunidadesUnicas.size;

        const contador = document.getElementById("contador-comunidades");
        if (contador) contador.innerText = totalComunidades;

        areasLayer = L.geoJSON(data, {
            style: estiloAreas,

            onEachFeature: (feature, layer) => {

                const p = feature.properties || {};

                layer.bindTooltip(p.nm_fcu || "Sem nome");

                layer.on("mouseover", () => {
                    layer.setStyle({ color: "#f97316", weight: 3, fillOpacity: 0.6 });
                });

                layer.on("mouseout", () => {
                    if (camadaSelecionada !== layer) {
                        areasLayer.resetStyle(layer);
                    }
                });

                layer.on("click", () => {

                    if (camadaSelecionada) {
                        areasLayer.resetStyle(camadaSelecionada);
                    }

                    camadaSelecionada = layer;

                    layer.setStyle({ color: "#f97316", weight: 3 });

                    map.fitBounds(layer.getBounds(), { padding: [20, 20] });

                    document.getElementById("info-nome").innerText = p.nm_fcu || "—";
                    document.getElementById("info-populacao").innerText = p.populacao ?? "—";
                    document.getElementById("info-domicilios").innerText = p.domicilios ?? "—";
                    document.getElementById("info-area").innerText =
                        p.area_km2 ? `${Number(p.area_km2).toFixed(2)} km²` : "—";
                });
            }
        }).addTo(map);

        const select = document.getElementById("areaSelect");
        const inputBusca = document.getElementById("areaSearch");

        const mapaComunidades = new Map();

        areasLayer.eachLayer(layer => {

            const nome = layer.feature?.properties?.nm_fcu;
            if (!nome) return;

            if (!mapaComunidades.has(nome)) {
                mapaComunidades.set(nome, layer);
            }

        });

        function atualizarSelectComFiltro(filtroTexto) {

            select.innerHTML = '<option value="">Selecione uma área</option>';

            const texto = filtroTexto.toLowerCase();

            [...mapaComunidades.keys()]
                .filter(nome => nome.toLowerCase().includes(texto))
                .sort((a, b) => a.localeCompare(b))
                .forEach(nome => {

                    const opt = document.createElement("option");
                    opt.value = nome;
                    opt.textContent = nome;
                    select.appendChild(opt);

                });
        }

        atualizarSelectComFiltro("");

        inputBusca.addEventListener("input", e => {
            atualizarSelectComFiltro(e.target.value);
        });

        select.addEventListener("change", e => {

            const nome = e.target.value;
            if (!nome) return;

            const layer = mapaComunidades.get(nome);
            if (layer) layer.fire("click");

        });

    });

/* ===============================
   ABAIRRAMENTO
=============================== */

btnAbairramento.addEventListener("click", () => {

    if (!abairramentoLayer) {

        fetch("/geojson/abairramento")
            .then(r => r.json())
            .then(data => {

                abairramentoLayer = L.geoJSON(data, {
                    style: estiloAbairramento,

                    onEachFeature: (feature, layer) => {

                        const nomeBairro =
                            feature.properties.BAIRRO ||
                            feature.properties.bairro ||
                            "Bairro não identificado";

                        layer.bindTooltip(nomeBairro);

                        layer.on("mouseover", () => {
                            layer.setStyle({ color: "#b91c1c", weight: 3 });
                        });

                        layer.on("mouseout", () => {
                            abairramentoLayer.resetStyle(layer);
                        });
                    }
                }).addTo(map);

                abairramentoVisivel = true;
                alternarBotaoAtivo(btnAbairramento, true);
            });

    } else {

        if (abairramentoVisivel) map.removeLayer(abairramentoLayer);
        else abairramentoLayer.addTo(map);

        abairramentoVisivel = !abairramentoVisivel;
        alternarBotaoAtivo(btnAbairramento, abairramentoVisivel);
    }
});

/* ===============================
   GROTAS
=============================== */

btnGrotaNoGrau.addEventListener("click", () => {

    filtroGrotaAtivo = !filtroGrotaAtivo;

    areasLayer.eachLayer(l => areasLayer.resetStyle(l));

    alternarBotaoAtivo(btnGrotaNoGrau, filtroGrotaAtivo);
});

/* ===============================
   FUNÇÃO GENÉRICA
=============================== */

function criarLayerPontos(url, tooltipPadrao, callbackSetLayer) {

    fetch(url)
        .then(r => r.json())
        .then(data => {

            const layer = L.geoJSON(data, {

                pointToLayer: (feature, latlng) => {

                    const icon = L.icon({
                        iconUrl: "https://unpkg.com/leaflet@1.9/dist/images/marker-icon.png",
                        shadowUrl: "https://unpkg.com/leaflet@1.9/dist/images/marker-shadow.png",
                        iconSize: [28, 45],
                        iconAnchor: [14, 45],
                        popupAnchor: [0, -38],
                        shadowSize: [45, 45]
                    });

                    return L.marker(latlng, { icon });
                },

                onEachFeature: (feature, layer) => {

                    const props = feature.properties || {};
                    const nome = props.NOME || props.Nome || props.name || tooltipPadrao;

                    layer.bindTooltip(nome);
                }

            }).addTo(map);

            callbackSetLayer(layer);

            atualizarContagemEquipamentos();

        });
}

/* ===============================
   CRAS
=============================== */

btnCRAS.addEventListener("click", () => {

    if (!crasLayer) {

        criarLayerPontos("/geojson/cras", "CRAS", layer => {
            crasLayer = layer;
            crasVisivel = true;
            alternarBotaoAtivo(btnCRAS, true);
            atualizarContagemEquipamentos();
        });

    } else {

        if (crasVisivel) map.removeLayer(crasLayer);
        else crasLayer.addTo(map);

        crasVisivel = !crasVisivel;
        alternarBotaoAtivo(btnCRAS, crasVisivel);
        atualizarContagemEquipamentos();
    }
});

/* ===============================
   ESCOLAS
=============================== */

btnEscolasMunicipais.addEventListener("click", () => {

    if (!escolasmunicipaisLayer) {

        criarLayerPontos("/geojson/escolasmunicipais", "ESCOLA", layer => {
            escolasmunicipaisLayer = layer;
            escolasmunicipaisVisivel = true;
            alternarBotaoAtivo(btnEscolasMunicipais, true);
            atualizarContagemEquipamentos();
        });

    } else {

        if (escolasmunicipaisVisivel) map.removeLayer(escolasmunicipaisLayer);
        else escolasmunicipaisLayer.addTo(map);

        escolasmunicipaisVisivel = !escolasmunicipaisVisivel;
        alternarBotaoAtivo(btnEscolasMunicipais, escolasmunicipaisVisivel);
        atualizarContagemEquipamentos();
    }
});

/* ===============================
   CREAS
=============================== */

btnCREAS.addEventListener("click", () => {

    if (!creasLayer) {

        criarLayerPontos("/geojson/creas", "CREAS", layer => {
            creasLayer = layer;
            creasVisivel = true;
            alternarBotaoAtivo(btnCREAS, true);
            atualizarContagemEquipamentos();
        });

    } else {

        if (creasVisivel) map.removeLayer(creasLayer);
        else creasLayer.addTo(map);

        creasVisivel = !creasVisivel;
        alternarBotaoAtivo(btnCREAS, creasVisivel);
        atualizarContagemEquipamentos();
    }
});

/* ===============================
   RESTAURANTE
=============================== */

btnRestaurantePopular.addEventListener("click", () => {

    if (!restaurantepopularLayer) {

        criarLayerPontos("/geojson/restaurantepopular", "Restaurante", layer => {
            restaurantepopularLayer = layer;
            restaurantepopularVisivel = true;
            alternarBotaoAtivo(btnRestaurantePopular, true);
            atualizarContagemEquipamentos();
        });

    } else {

        if (restaurantepopularVisivel) map.removeLayer(restaurantepopularLayer);
        else restaurantepopularLayer.addTo(map);

        restaurantepopularVisivel = !restaurantepopularVisivel;
        alternarBotaoAtivo(btnRestaurantePopular, restaurantepopularVisivel);
        atualizarContagemEquipamentos();
    }
});

/* ===============================
   GIGANTINHOS
=============================== */

btnGigantinhos.addEventListener("click", () => {

    if (!gigantinhosLayer) {

        criarLayerPontos("/geojson/gigantinhos", "Gigantinho", layer => {
            gigantinhosLayer = layer;
            gigantinhosVisivel = true;
            alternarBotaoAtivo(btnGigantinhos, true);
            atualizarContagemEquipamentos();
        });

    } else {

        if (gigantinhosVisivel) map.removeLayer(gigantinhosLayer);
        else gigantinhosLayer.addTo(map);

        gigantinhosVisivel = !gigantinhosVisivel;
        alternarBotaoAtivo(btnGigantinhos, gigantinhosVisivel);
        atualizarContagemEquipamentos();
    }
});

/* ===============================
   LIMPAR
=============================== */

document.getElementById("btnLimparFiltros").addEventListener("click", () => {

    filtroGrotaAtivo = false;
    camadaSelecionada = null;

    areasLayer.eachLayer(l => areasLayer.resetStyle(l));

    map.setView([-9.6498, -35.7089], 12);

    if (marcadorBusca) {
        map.removeLayer(marcadorBusca);
        marcadorBusca = null;
    }

    document.getElementById("areaSelect").value = "";
    document.getElementById("areaSearch").value = "";

    document
        .getElementById("areaSearch")
        .dispatchEvent(new Event("input"));

    document.getElementById("info-nome").innerText = "—";
    document.getElementById("info-populacao").innerText = "—";
    document.getElementById("info-domicilios").innerText = "—";
    document.getElementById("info-area").innerText = "—";

    if (abairramentoLayer && abairramentoVisivel) {
        map.removeLayer(abairramentoLayer);
        abairramentoVisivel = false;
    }

    if (crasLayer && crasVisivel) {
        map.removeLayer(crasLayer);
        crasVisivel = false;
    }

    if (escolasmunicipaisLayer && escolasmunicipaisVisivel) {
        map.removeLayer(escolasmunicipaisLayer);
        escolasmunicipaisVisivel = false;
    }

    if (creasLayer && creasVisivel) {
        map.removeLayer(creasLayer);
        creasVisivel = false;
    }

    if (restaurantepopularLayer && restaurantepopularVisivel) {
        map.removeLayer(restaurantepopularLayer);
        restaurantepopularVisivel = false;
    }

    if (gigantinhosLayer && gigantinhosVisivel) {
        map.removeLayer(gigantinhosLayer);
        gigantinhosVisivel = false;
    }

    alternarBotaoAtivo(btnGrotaNoGrau, false);
    alternarBotaoAtivo(btnAbairramento, false);
    alternarBotaoAtivo(btnCRAS, false);
    alternarBotaoAtivo(btnEscolasMunicipais, false);
    alternarBotaoAtivo(btnCREAS, false);
    alternarBotaoAtivo(btnRestaurantePopular, false);
    alternarBotaoAtivo(btnGigantinhos, false);

    atualizarContagemEquipamentos();

});