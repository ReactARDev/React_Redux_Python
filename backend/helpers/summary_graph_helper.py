import os
import sys
import datetime
import StringIO
import random
from models import *
from helpers.aggregation_helper import aggregation_query
from helpers.agency_helper import get_followed_agency_ids_with_backoff
import schemas.jurasticsearch as jsearch
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/..')

def summary_email_graph(params, make_response):    
    user_id = params.get('user_id')
    date_from = params.get('from_date') # 'YYYY-MM-DD' format
    date_to = params.get('to_date') # 'YYYY-MM-DD' format
    
    followed_agency_ids = get_followed_agency_ids_with_backoff(user_id)
    buckets = [tuple(['terms', term]) for term in ['agencies.id', 'category']]
    
    query = {'aggs': {'filtered_documents': {'filter': {'bool': {'must': [{'range': {'publication_date': {'gte': date_from, 'lte': date_to }}}, {'terms': {'agencies.id': followed_agency_ids}}, {'terms': {'category': ['Agency Update', 'SRO Update', 'Enforcement Document', 'Enforcement Action', 'Enforcement', 'Final Rule', 'Proposed Rule', 'Notice', 'Presidential Document']}}]}}, 'aggs': {'by_category': {'terms': {'field': 'category', 'size': 500}, 'aggs': {'by_day': {'date_histogram': {'field': 'publication_date', 'interval': 'day', 'format': 'MM-dd'}}}}}}}}

    # elastic search results
    results = jsearch.count_records(query, 'documents')
    # format ES data for graph
    types = results['aggregations']['filtered_documents']['by_category']['buckets']
    
    docCountByType = {}
    maxNumOfDays = 0
    maxDays = []
    for typ in types:
        days = [x['key_as_string'] for x in typ['by_day']['buckets']]
        if len(days) > maxNumOfDays:
            maxNumOfDays = len(days)
            maxDays = days
    for typ in types:
        typObj = {}
        for obj in typ['by_day']['buckets']:
            typObj[obj['key_as_string']] = obj['doc_count']
        x = []
        y = []
        for day in maxDays:
            x.append(day)
            if day in typObj:
                val = typObj[day]
                y.append(val)

            else:
                y.append(0)

        docType = {
            'x': x,
            'y': y
        }
        docCountByType[typ['key']] = docType

    # format data for graph
    ydata = []
    labels = []
    for docType in docCountByType:
        ydata.append(docCountByType[docType]['y'])
        labels.append(docType)
        
    plt.style.use('dark_background')
    
    fig, ax = plt.subplots()
    ax.stackplot(maxDays, ydata, 
        baseline='zero', 
        colors=("#F0CB69","#5FB6E5",'#E54D25',"#6D53DC","#7E149D", "#B8E986", "#719683"), 
        interpolate=True
    )
    
    for label in ax.get_xticklabels():
        label.set_rotation(45)
    # https://stackoverflow.com/questions/4700614/how-to-put-the-legend-out-of-the-plot
    plt.legend(labels, loc='best')
    
    # recommendation from: https://gist.github.com/liuyxpp/1250396
    canvas = FigureCanvas(fig)
    png_output = StringIO.StringIO()
    canvas.print_png(png_output)
    response = make_response(png_output.getvalue())
    response.headers['Content-Type'] = 'image/png'
    
    return response
