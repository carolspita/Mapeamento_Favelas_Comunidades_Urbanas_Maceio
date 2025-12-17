from flask import Flask, render_template, jsonify
import json
import os
import pandas as pd

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DADOS_DIR = os.path.join(BASE_DIR, "dados")

AREAS_GEOJSON = os.path.join(DADOS_DIR, "areas.geojson")
POPULACAO_XLSX = os.path.join(DADOS_DIR, "populacao.xlsx")
DOMICILIOS_XLSX = os.path.join(DADOS_DIR, "domicilios.xlsx")
AREA_XLSX = os.path.join(DADOS_DIR, "area_km2.xlsx")


def carregar_tabela(path, coluna_valor):
    df = pd.read_excel(path)
    df = df.rename(columns=lambda x: x.strip())
    return dict(zip(df["cd_fcu"], df[coluna_valor]))


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/geojson")
def geojson():
    if not os.path.exists(AREAS_GEOJSON):
        raise FileNotFoundError(f"Arquivo não encontrado: {AREAS_GEOJSON}")

    with open(AREAS_GEOJSON, encoding="utf-8") as f:
        areas = json.load(f)

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
        cd = feature["properties"].get("cd_fcu")

        feature["properties"]["populacao"] = pop.get(cd)
        feature["properties"]["domicilios"] = dom.get(cd)
        feature["properties"]["area_km2"] = area.get(cd)

    return jsonify(areas)


if __name__ == "__main__":
    app.run(debug=True)
