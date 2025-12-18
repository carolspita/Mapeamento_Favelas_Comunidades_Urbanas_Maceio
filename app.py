from flask import Flask, render_template, jsonify
import os
import json
import pandas as pd

app = Flask(__name__)

# ===============================
# CAMINHOS BASE
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

AREAS_GEOJSON = os.path.join(DATA_DIR, "areas.geojson")
ABAIRRAMENTO_GEOJSON = os.path.join(DATA_DIR, "Abairramento_Maceio.geojson")

POPULACAO_XLSX = os.path.join(DATA_DIR, "populacao.xlsx")
DOMICILIOS_XLSX = os.path.join(DATA_DIR, "domicilios.xlsx")
AREA_XLSX = os.path.join(DATA_DIR, "area_km2.xlsx")


# ===============================
# FUNÇÕES AUXILIARES
# ===============================
def carregar_geojson(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Arquivo não encontrado: {path}")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def carregar_tabela(path, coluna_valor):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Arquivo não encontrado: {path}")

    df = pd.read_excel(path)
    df.columns = df.columns.str.strip()

    return dict(zip(df["cd_fcu"].astype(str), df[coluna_valor]))


# ===============================
# ROTAS
# ===============================
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/geojson/areas")
def geojson_areas():
    areas = carregar_geojson(AREAS_GEOJSON)

    pop = carregar_tabela(
        POPULACAO_XLSX,
        "População residente em favelas e comunidades urbanas (Pessoas)"
    )
    dom = carregar_tabela(
        DOMICILIOS_XLSX,
        "Domicílios em favelas e comunidades urbanas (Domicílios)"
    )
    area = carregar_tabela(
        AREA_XLSX,
        "Área territorial de favelas e comunidades urbanas (Quilômetros quadrados)"
    )

    for feature in areas["features"]:
        cd = str(feature["properties"].get("cd_fcu"))

        feature["properties"]["populacao"] = pop.get(cd)
        feature["properties"]["domicilios"] = dom.get(cd)
        feature["properties"]["area_km2"] = area.get(cd)

    return jsonify(areas)


@app.route("/geojson/abairramento")
def geojson_abairramento():
    return jsonify(carregar_geojson(ABAIRRAMENTO_GEOJSON))


# ===============================
# START
# ===============================
if __name__ == "__main__":
    app.run(debug=True)
