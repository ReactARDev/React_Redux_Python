import datetime as dt

def elastic_date_filter(date_type='publication_date', from_date=None, to_date=None):
    date_filter = {date_type: {}}
    if not from_date and not to_date: return None
    if from_date: date_filter[date_type]["gte"] = elastic_date_string(from_date)
    if to_date:   date_filter[date_type]["lte"] = elastic_date_string(to_date)
    return date_filter

def add_elastic_list_filter(items, xpath, filters):
    if items: filters.append(elastic_list_filter(items, xpath))

def elastic_list_filter(items, xpath):
    if len(items) == 1:
        return es_filter(items[0], xpath)
    elif len(items) > 1:
        return es_filter(items, xpath)

def add_aggregation_filter(attr, xpath, params, results):
    add_elastic_list_filter(safe_getlist(attr, params), xpath, results)

def add_date_agg_filter(flag, xpath, params, results):
    attr = params.get(flag, None)
    if attr.match('_to'):
        direction = 'to'
    else:
        direction = 'from'
    results.append({ "range" : { xpath : { direction : attr }}})

# prevent empty strings from sneaking in
def safe_getlist(name, params):
    try:
        return [x for x in params.getlist(name) if x]
    except ValueError:
        return []

def elastic_date_string(js_date_string):
    return dt.datetime.strptime(js_date_string, "%m/%d/%Y").strftime("%Y-%m-%d")

def es_filter(item, xpath):
    if type(item) is list:
        return {"terms": {xpath: item}}
    else:
        return {"term": {xpath: item}}
