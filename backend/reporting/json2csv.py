import os
import re
import sys
import csv
import json

def unpack_current_node(node, depth=0):
    kids = [ x for x in node.keys() if 'by_' in x ]
    if not kids:
        if node.get('key_as_string', False):
            key = node['key_as_string']
        else:
            key = node['key']
        count = node['doc_count']
        return [ ( key, count ) ]
    elif len(kids) > 1:
        print "WARNING: ambiguous bucket node: {}".format(node.keys())
        return [ ]
    else:
        if depth <= len(cols) and kids[0] not in cols: cols.append(kids[0])
        rows = [ ]
        if depth == 0:
            key = None
        elif node.get('key_as_string', False):
            key = node['key_as_string']
        else:
            key = node['key']
        for n in node[kids[0]]["buckets"]:
            for x in unpack_current_node(n, depth+1):
                new_list = [ ]
                if key: new_list.append(key)
                for y in x: new_list.append(y)
                rows.append( tuple(new_list) )
        return rows

cols   = [ ]
data   = json.load(open(sys.argv[1]))
result = unpack_current_node(data["aggregations"]["filtered_documents"])
cols.append('count')

headers = [ re.sub('by_','',x) for x in cols ]
with open('agg.csv', 'wb') as csvfile:
    aggwriter = csv.writer(csvfile, quotechar='|', quoting=csv.QUOTE_MINIMAL)
    aggwriter.writerow(headers)
    for row in result: aggwriter.writerow(list(row))
