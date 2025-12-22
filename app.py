from flask import Flask, render_template, jsonify
import os
import json
import pandas as pd
import geopandas as gpd

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

    # ---------- Carrega GeoJSON em GeoDataFrame ----------
    areas_gdf = gpd.read_file(AREAS_GEOJSON)
    bairros_gdf = gpd.read_file(ABAIRRAMENTO_GEOJSON)

    # ---------- Garante mesmo sistema de coordenadas ----------
    if areas_gdf.crs != bairros_gdf.crs:
        bairros_gdf = bairros_gdf.to_crs(areas_gdf.crs)

    # ---------- Seleciona áreas que INTERSECTAM abairramento ----------
    # IMPORTANTE → NÃO RECORTA MAIS, apenas filtra
    filtradas = gpd.sjoin(
        areas_gdf,
        bairros_gdf[["geometry"]],
        predicate="intersects",
        how="inner"
    )

    filtradas = filtradas.drop(columns=["index_right"], errors="ignore")

    # ---------- Carrega tabelas ----------
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

    # ---------- Adiciona atributos ----------
    def add_values(row):
        cd = str(row.get("cd_fcu"))
        row["populacao"] = pop.get(cd)
        row["domicilios"] = dom.get(cd)
        row["area_km2"] = area.get(cd)
        return row

    filtradas = filtradas.apply(add_values, axis=1)

    # ---------- Retorna GeoJSON ----------
    return jsonify(json.loads(filtradas.to_json()))


@app.route("/geojson/abairramento")
def geojson_abairramento():
    return jsonify(carregar_geojson(ABAIRRAMENTO_GEOJSON))

@app.route("/geojson/cras")
def geojson_cras():
    return jsonify(carregar_geojson(os.path.join(DATA_DIR, "CRAS.geojson")))

@app.route("/geojson/escolasmunicipais")
def geojson_escolasmunicipais():
    return jsonify(carregar_geojson(os.path.join(DATA_DIR, "escolasmunicipais.geojson")))

@app.route("/geojson/creas")
def geojson_creas():
    return jsonify(carregar_geojson(os.path.join(DATA_DIR, "CREAS.geojson")))

@app.route("/geojson/restaurantepopular")
def geojson_restaurantepopular():
    return jsonify(carregar_geojson(os.path.join(DATA_DIR, "restaurantepopular.geojson")))
# ===============================
# START
# ===============================
if __name__ == "__main__":
    app.run(debug=True)
