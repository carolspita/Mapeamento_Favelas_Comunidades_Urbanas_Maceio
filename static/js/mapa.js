const map = L.map("map").setView([-9.6498, -35.7089], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(map);

let areasLayer = null;
let abairramentoLayer = null;
let camadaSelecionada = null;
let filtroGrotaAtivo = false;
let abairramentoVisivel = false;

const areasGrota = ["Vale do Reginaldo", "Recanto Nabal"];

// ===============================
// ESTILOS
// ===============================
function estiloAreas(feature) {
    if (filtroGrotaAtivo && areasGrota.includes(feature.properties.nm_fcu)) {
        return { color: "#16a34a", weight: 3, fillOpacity: 0.6 };
    }
    return { color: "#2563eb", weight: 2, fillOpacity: 0.4 };
}

const estiloAbairramento = {
    color: "#dc2626",
    weight: 1,
    fillOpacity: 0
};

// ===============================
// ÁREAS (COMUNIDADES)
// ===============================
fetch("/geojson/areas")
    .then(r => r.json())
    .then(data => {

        areasLayer = L.geoJSON(data, {
            style: estiloAreas,
            onEachFeature: (feature, layer) => {
                const p = feature.properties;

                layer.bindTooltip(p.nm_fcu || "Sem nome");

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
                        p.area_km2 ? `${p.area_km2.toFixed(2)} km²` : "—";
                });
            }
        }).addTo(map);

        // SELECT
        const select = document.getElementById("areaSelect");
        data.features.forEach((f, i) => {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = f.properties.nm_fcu;
            select.appendChild(opt);
        });

        select.addEventListener("change", e => {
            if (e.target.value !== "") {
                areasLayer.getLayers()[e.target.value].fire("click");
            }
        });
    });

// ===============================
// ABAIRRAMENTO (BOTÃO)
// ===============================
document.getElementById("btnAbairramento").addEventListener("click", () => {

    if (!abairramentoLayer) {
        fetch("/geojson/abairramento")
            .then(r => r.json())
            .then(data => {
                abairramentoLayer = L.geoJSON(data, {
                    style: estiloAbairramento
                }).addTo(map);
                abairramentoVisivel = true;
            });
    } else {
        if (abairramentoVisivel) {
            map.removeLayer(abairramentoLayer);
        } else {
            abairramentoLayer.addTo(map);
        }
        abairramentoVisivel = !abairramentoVisivel;
    }
});

// ===============================
// GROTAS
// ===============================
document.getElementById("btnGrotaNoGrau").addEventListener("click", () => {
    filtroGrotaAtivo = !filtroGrotaAtivo;
    areasLayer.eachLayer(l => areasLayer.resetStyle(l));
});

// ===============================
// LIMPAR
// ===============================
document.getElementById("btnLimparFiltros").addEventListener("click", () => {
    filtroGrotaAtivo = false;
    camadaSelecionada = null;

    areasLayer.eachLayer(l => areasLayer.resetStyle(l));

    map.setView([-9.6498, -35.7089], 12);

    document.getElementById("areaSelect").value = "";
    document.getElementById("info-nome").innerText = "—";
    document.getElementById("info-populacao").innerText = "—";
    document.getElementById("info-domicilios").innerText = "—";
    document.getElementById("info-area").innerText = "—";
});
