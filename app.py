from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

DATA_FILE = 'voti.json'

def carica_dati():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w') as f:
            json.dump([], f)
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def salva_dati(dati):
    with open(DATA_FILE, 'w') as f:
        json.dump(dati, f, indent=4)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/aggiungi', methods=['POST'])
def aggiungi():
    dati = carica_dati()
    nuovo = request.json
    dati.append(nuovo)
    salva_dati(dati)
    return jsonify({'status': 'ok'})

@app.route('/voti')
def voti():
    return jsonify(carica_dati())

if __name__ == '__main__':
    app.run(debug=True)
