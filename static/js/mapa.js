const map = L.map('map').setView([-9.6498, -35.7089], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let geojsonLayer;
let camadaSelecionada = null;
let filtroGrotaAtivo = false;

const areasGrota = ["Vale do Reginaldo", "Recanto Nabal"];

function isGrota(feature) {
    return areasGrota.includes(feature.properties.nm_fcu);
}

function estiloBase(feature) {
    if (filtroGrotaAtivo && isGrota(feature)) {
        return { color: "#16a34a", weight: 3, fillOpacity: 0.6 };
    }
    return { color: "#2563eb", weight: 2, fillOpacity: 0.3 };
}

fetch("/geojson")
    .then(res => res.json())
    .then(data => {

        geojsonLayer = L.geoJSON(data, {
            style: estiloBase,

            onEachFeature: function (feature, layer) {
                const props = feature.properties;
                const nome = props.nm_fcu || "Área sem nome";

                layer.bindTooltip(nome, { sticky: true });

                layer.on({
                    mouseover: e => {
                        if (camadaSelecionada === e.target) return;
                        e.target.setStyle({
                            color: "#f97316",
                            weight: 3,
                            fillOpacity: 0.5
                        });
                    },

                    mouseout: e => {
                        if (camadaSelecionada === e.target) return;
                        geojsonLayer.resetStyle(e.target);
                    },

                    click: e => {
                        if (camadaSelecionada) {
                            geojsonLayer.resetStyle(camadaSelecionada);
                        }

                        camadaSelecionada = e.target;

                        e.target.setStyle({
                            color: "#f97316",
                            weight: 3,
                            fillOpacity: 0.5
                        });

                        map.fitBounds(e.target.getBounds(), { padding: [20, 20] });

                        document.getElementById("info-nome").innerText = nome;
                        document.getElementById("info-populacao").innerText =
                            props.populacao ?? "Não disponível";
                        document.getElementById("info-domicilios").innerText =
                            props.domicilios ?? "Não disponível";
                        document.getElementById("info-area").innerText =
                            props.area_km2 ? props.area_km2.toFixed(2) + " km²" : "Não disponível";
                    }
                });
            }
        }).addTo(map);

        const select = document.getElementById("areaSelect");

        data.features.forEach((f, i) => {
            const opt = document.createElement("option");
            opt.value = i;
            opt.text = f.properties.nm_fcu;
            select.appendChild(opt);
        });

        select.addEventListener("change", function () {
            if (this.value === "") return;
            geojsonLayer.getLayers()[this.value].fire("click");
        });
    });

document.getElementById("btnGrotaNoGrau").addEventListener("click", function () {
    filtroGrotaAtivo = !filtroGrotaAtivo;

    geojsonLayer.eachLayer(l => geojsonLayer.resetStyle(l));

    if (camadaSelecionada) {
        camadaSelecionada.setStyle({
            color: "#f97316",
            weight: 3,
            fillOpacity: 0.5
        });
    }

    this.innerText = filtroGrotaAtivo
        ? "Remover filtro Grota no Grau"
        : "Filtrar Grota no Grau";
});

document.getElementById("btnLimparFiltros").addEventListener("click", function () {
    filtroGrotaAtivo = false;
    camadaSelecionada = null;

    geojsonLayer.eachLayer(l => geojsonLayer.resetStyle(l));

    document.getElementById("areaSelect").value = "";
    document.getElementById("btnGrotaNoGrau").innerText = "Filtrar Grota no Grau";

    map.setView([-9.6498, -35.7089], 12);

    document.getElementById("info-nome").innerText = "-";
    document.getElementById("info-populacao").innerText = "-";
    document.getElementById("info-domicilios").innerText = "-";
    document.getElementById("info-area").innerText = "-";
});
