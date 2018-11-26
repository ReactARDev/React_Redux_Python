import os
import sys
import json
import flask
from flask import request

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder)

import hood_graph as hood

reload(sys)
sys.setdefaultencoding('utf8')

app = flask.Flask(__name__)

@app.route("/")
def index():
    return flask.render_template("citations.html", reg_id=37, data_route='reg_data')

@app.route("/regulation_graph/<int:reg_id>")
def regulation_hood_graph(reg_id):
    return flask.render_template("citations.html", doc_id=reg_id, data_route='reg_data')

@app.route("/reg_data/<int:reg_id>")
def regulation_data(reg_id):
    return hood.RegulationHoodGraph(reg_id).plot_hood_graph(False)

@app.route("/citation_graph/<int:doc_id>")
def citation_hood_graph(doc_id):
    return flask.render_template("citations.html", doc_id=doc_id, data_route='citation_data')

@app.route("/citation_data/<int:doc_id>")
def citation_data(doc_id):
    return hood.DocumentHoodGraph(doc_id).plot_hood_graph(False)

@app.route("/act_graph/<int:act_id>")
def act_hood_graph(act_id):
    return flask.render_template("citations.html", doc_id=act_id, data_route='act_data')

@app.route("/act_data/<int:act_id>")
def act_data(act_id):
    return hood.ActHoodGraph(act_id).plot_hood_graph(False)

if __name__ == "__main__":
    app.debug = True
    app.run(port=8000)
