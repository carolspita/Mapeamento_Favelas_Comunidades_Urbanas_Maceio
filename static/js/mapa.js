// ===============================
// MAPA BASE
// ===============================
const map = L.map('map').setView([-9.6498, -35.7089], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// ===============================
// VARIÁVEIS GLOBAIS
// ===============================
let geojsonLayer;
let todasAreas = [];
let filtroGrotaAtivo = false;

// ===============================
// CARREGA GEOJSON
// ===============================
fetch("/geojson")
    .then(res => res.json())
    .then(data => {

        todasAreas = data.features;

        geojsonLayer = L.geoJSON(todasAreas, {
            style: estiloPadrao,
            onEachFeature: onEachFeature
        }).addTo(map);

        preencherSelect();
    });

// ===============================
// ESTILOS
// ===============================
function estiloPadrao() {
    return {
        color: "#2563eb",
        weight: 2,
        fillOpacity: 0.3
    };
}

function estiloGrota() {
    return {
        color: "#16a34a",
        weight: 3,
        fillOpacity: 0.6
    };
}

// ===============================
// FEATURE EVENTS
// ===============================
function onEachFeature(feature, layer) {
    const nome = feature.properties.nm_fcu || "Área sem nome";

    layer.bindTooltip(nome, { sticky: true });

    layer.on({
        mouseover: e => {
            e.target.setStyle({
                color: "#f97316",
                weight: 3,
                fillOpacity: 0.5
            });
        },
        mouseout: e => {
            geojsonLayer.resetStyle(e.target);
        }
    });
}

// ===============================
// SELECT DE ÁREAS
// ===============================
function preencherSelect() {
    const select = document.getElementById("areaSelect");

    todasAreas.forEach((feature, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.text = feature.properties.nm_fcu;
        select.appendChild(option);
    });

    select.addEventListener("change", function () {
        if (this.value === "") return;

        const layer = geojsonLayer.getLayers()[this.value];
        map.fitBounds(layer.getBounds());
    });
}

// ===============================
// FILTRO GROTA NO GRAU
// ===============================
function filtrarGrotaNoGrau() {

    geojsonLayer.clearLayers();

    if (!filtroGrotaAtivo) {

        const filtradas = todasAreas.filter(f =>
            f.properties.nm_fcu === "Vale do Reginaldo" ||
            f.properties.nm_fcu === "Recanto Nabal"
        );

        geojsonLayer.addData(filtradas);
        geojsonLayer.setStyle(estiloGrota);

        if (filtradas.length > 0) {
            map.fitBounds(geojsonLayer.getBounds());
        }

        filtroGrotaAtivo = true;

    } else {

        geojsonLayer.addData(todasAreas);
        geojsonLayer.setStyle(estiloPadrao);

        filtroGrotaAtivo = false;
    }
}

// ===============================
// EVENTOS (SEM onclick)
// ===============================
document.addEventListener("DOMContentLoaded", function () {

    const btnGrota = document.getElementById("btnGrotaNoGrau");

    btnGrota.addEventListener("click", filtrarGrotaNoGrau);

});
