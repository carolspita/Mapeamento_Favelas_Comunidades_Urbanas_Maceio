const map = L.map("map").setView([-9.6498, -35.7089], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(map);

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


const areasGrota = ["Vale do Reginaldo", "Recanto Nabal"];

// ===============================
// ESTILOS
// ===============================
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

// ===============================
// ÁREAS FCU
// ===============================
fetch("/geojson/areas")
    .then(r => r.json())
    .then(data => {

        areasLayer = L.geoJSON(data, {
            style: estiloAreas,

            onEachFeature: (feature, layer) => {
                const p = feature.properties;

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
                        p.area_km2 ? `${p.area_km2.toFixed(2)} km²` : "—";
                });
            }
        }).addTo(map);

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
// ABAIRRAMENTO
// ===============================
document.getElementById("btnAbairramento").addEventListener("click", () => {

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
// CAMADA DE CRAS
// ===============================

document.getElementById("btnCRAS").addEventListener("click", () => {

    if (!crasLayer) {
        fetch("/geojson/cras")
            .then(r => r.json())
            .then(data => {

                crasLayer = L.geoJSON(data, {
                    pointToLayer: (feature, latlng) => {

                    const googleMarker = L.icon({
                        iconUrl: "https://unpkg.com/leaflet@1.9/dist/images/marker-icon.png",
                        shadowUrl: "https://unpkg.com/leaflet@1.9/dist/images/marker-shadow.png",
                        iconSize: [28, 45],
                        iconAnchor: [14, 45],
                        popupAnchor: [0, -38],
                        shadowSize: [45, 45]
                    });

                    return L.marker(latlng, { icon: googleMarker });
                },

                    onEachFeature: (feature, layer) => {
                        const props = feature.properties || {};
                        const nome = props.NOME || props.Nome || props.name || "CRAS";

                        layer.bindTooltip(nome, { permanent: false });
                    }
                }).addTo(map);

                crasVisivel = true;
            });
    } else {
        if (crasVisivel) {
            map.removeLayer(crasLayer);
        } else {
            crasLayer.addTo(map);
        }

        crasVisivel = !crasVisivel;
    }
});
// ===============================
// CAMADA DE ESCOLAS MUNICIPAIS
// ===============================

document.getElementById("btnEscolasMunicipais").addEventListener("click", () => {

    if (!escolasmunicipaisLayer) {
        fetch("/geojson/escolasmunicipais")
            .then(r => r.json())
            .then(data => {

                escolasmunicipaisLayer = L.geoJSON(data, {
                    pointToLayer: (feature, latlng) => {

                    const googleMarker = L.icon({
                        iconUrl: "https://unpkg.com/leaflet@1.9/dist/images/marker-icon.png",
                        shadowUrl: "https://unpkg.com/leaflet@1.9/dist/images/marker-shadow.png",
                        iconSize: [28, 45],
                        iconAnchor: [14, 45],
                        popupAnchor: [0, -38],
                        shadowSize: [45, 45]
                    });

                    return L.marker(latlng, { icon: googleMarker });
                },

                    onEachFeature: (feature, layer) => {
                        const props = feature.properties || {};
                        const nome = props.NOME || props.Nome || props.name || "ESCOLA";

                        layer.bindTooltip(nome, { permanent: false });
                    }
                }).addTo(map);

                escolasmunicipaisVisivel = true;
            });
    } else {
        if (escolasmunicipaisVisivel) {
            map.removeLayer(escolasmunicipaisLayer);
        } else {
            escolasmunicipaisLayer.addTo(map);
        }

        escolasmunicipaisVisivel = !escolasmunicipaisVisivel;
    }
});

// ============================================
// CAMADA DE RESTAURANTES POPULARES
// ============================================

document.getElementById("btnRestaurantePopular").addEventListener("click", () => {

    if (!restaurantepopularLayer) {
        fetch("/geojson/restaurantepopular")
            .then(r => r.json())
            .then(data => {

                restaurantepopularLayer = L.geoJSON(data, {
                    pointToLayer: (feature, latlng) => {

                    const googleMarker = L.icon({
                        iconUrl: "https://unpkg.com/leaflet@1.9/dist/images/marker-icon.png",
                        shadowUrl: "https://unpkg.com/leaflet@1.9/dist/images/marker-shadow.png",
                        iconSize: [28, 45],
                        iconAnchor: [14, 45],
                        popupAnchor: [0, -38],
                        shadowSize: [45, 45]
                    });

                    return L.marker(latlng, { icon: googleMarker });
                },

                    onEachFeature: (feature, layer) => {
                        const props = feature.properties || {};
                        const nome = props.NOME || props.Nome || props.name || "ESCOLA";

                        layer.bindTooltip(nome, { permanent: false });
                    }
                }).addTo(map);

                restaurantepopularVisivel = true;
            });
    } else {
        if (restaurantepopularVisivel) {
            map.removeLayer(restaurantepopularLayer);
        } else {
            restaurantepopularLayer.addTo(map);
        }

        restaurantepopularVisivel = !restaurantepopularVisivel;
    }
});

// ===============================
// CAMADA DE CREAS
// ===============================

document.getElementById("btnCREAS").addEventListener("click", () => {

    if (!creasLayer) {
        fetch("/geojson/creas")
            .then(r => r.json())
            .then(data => {

                creasLayer = L.geoJSON(data, {
                    pointToLayer: (feature, latlng) => {

                    const googleMarker = L.icon({
                        iconUrl: "https://unpkg.com/leaflet@1.9/dist/images/marker-icon.png",
                        shadowUrl: "https://unpkg.com/leaflet@1.9/dist/images/marker-shadow.png",
                        iconSize: [28, 45],
                        iconAnchor: [14, 45],
                        popupAnchor: [0, -38],
                        shadowSize: [45, 45]
                    });

                    return L.marker(latlng, { icon: googleMarker });
                },

                    onEachFeature: (feature, layer) => {
                        const props = feature.properties || {};
                        const nome = props.NOME || props.Nome || props.name || "CREAS";

                        layer.bindTooltip(nome, { permanent: false });
                    }
                }).addTo(map);

                creasVisivel = true;
            });
    } else {
        if (creasVisivel) {
            map.removeLayer(creasLayer);
        } else {
            creasLayer.addTo(map);
        }

        creasVisivel = !creasVisivel;
    }
});

// ===============================
// LIMPAR
// ===============================
document.getElementById("btnLimparFiltros").addEventListener("click", () => {
    filtroGrotaAtivo = false;
    camadaSelecionada = null;

    // Resetar estilo das áreas
    areasLayer.eachLayer(l => areasLayer.resetStyle(l));

    // Resetar zoom
    map.setView([-9.6498, -35.7089], 12);

    // Resetar select
    document.getElementById("areaSelect").value = "";

    // Resetar cards
    document.getElementById("info-nome").innerText = "—";
    document.getElementById("info-populacao").innerText = "—";
    document.getElementById("info-domicilios").innerText = "—";
    document.getElementById("info-area").innerText = "—";

    // 🔴 Remover camada de abairramento caso esteja ativa
    if (abairramentoLayer && abairramentoVisivel) {
        map.removeLayer(abairramentoLayer);
        abairramentoVisivel = false;
    }

    // 🔴 Remover camada de CRAS caso esteja ativa
    if (crasLayer && crasVisivel) {
    map.removeLayer(crasLayer);
    crasVisivel = false;
    }
    // 🔴 Remover camada de ESCOLAS MUNICIPAIS caso esteja ativa
    if (escolasmunicipaisLayer && escolasmunicipaisVisivel) {
    map.removeLayer(escolasmunicipaisLayer);
    escolasmunicipaisVisivel = false;
    }

    // 🔴 Remover camada de CRAS caso esteja ativa
    if (creasLayer && creasVisivel) {
    map.removeLayer(creasLayer);
    creasVisivel = false;
    }

    // 🔴 Remover camada de CRAS caso esteja ativa
    if (restaurantepopularLayer && restaurantepopularVisivel) {
    map.removeLayer(restaurantepopularLayer);
    restaurantepopularVisivel = false;
    }
});
