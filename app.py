from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/geojson")
def geojson():
    geojson_path = os.path.join(BASE_DIR, "static", "areas.geojson")

    with open(geojson_path, encoding="utf-8") as f:
        data = json.load(f)

    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
