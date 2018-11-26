import os
import re
import sys
import json
import math
import random
import datetime as dt

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder)

from shared_env import *
from schemas import jurasticsearch as jsearch
from helpers.utilities import merge_two_dicts

reload(sys)
sys.setdefaultencoding('utf8')

NamedClusterTypes = [ 'acts', 'named_regulations' ]

NodeMagnificationRate = 3

NodeColor = {
    'named_regulations':        'black',
    'acts':                     'grey',
    'US Public Law':            'grey',
    'US Public Law Navigation': 'grey',
    'US Code':                  'lightgrey',
    'State Code':               'lightgrey',
    'US Code Navigation':       'lightgrey',
    'State Code Navigation':    'lightgrey',
    'Regulatory Agenda Item':   'blue',
    'Unified Regulatory Agenda':'purple',
    'Notice':                   'orange',
    'Proposed Rule':            'orange',
    'Final Rule':               'orangered',
    'Rule':                     'orangered',
    'Enforcement':              'red',
    'Enforcement Document':     'red',
    'documents':                'green'
}

def doc_name(doc_id):
    return "documents_{}".format(doc_id)

def node_name(record_id, table='named_regulations'):
    return "{}_{}".format(table, record_id)

def node_type(name):
    return "_".join(re.split(r'_', name)[0:-1])

def node_color(name, doc_dict=None):
    this_node_type = node_type(name)
    if this_node_type == 'documents':
        if doc_dict and 'category' in doc_dict:
            if doc_dict['category'] in NodeColor:
                return NodeColor[doc_dict['category']]
            else:
                return NodeColor[this_node_type]
        else:
            return NodeColor[this_node_type]
    else:
        return NodeColor[this_node_type]


class HoodGraph(object):
    
    def __init__(self):
        self.seed_docids = [ ]
        self.initialize_graph()

    def initialize_graph(self):
        self.graph = {'nodes': set(), 'edges': set()}

    def cited_records(self, klass='documents'):
        result = [ int(y[-1]) for y in [ re.split(r'_', x) for x in self.graph['nodes'] ] if y[0] == klass ]
        return result
    
    def load_documents_map(self):
        query = {
            "query":{"ids":{"values":self.cited_records('documents')}},
            "size": 1000
        }
        self.docs_map = { "documents_{}".format(x['id']):x for x in jsearch.query_records(query, 'documents') }

    def load_named_clusters(self):
        self.named_clusters = { }
        
        act_query = {
            "query":{"ids":{"values":self.cited_records('acts')}},
            "size": 1000
        }
        act_hits  = jsearch.query_records(act_query, 'acts')
        self.named_clusters.update({ "acts_{}".format(x['id']):x for x in act_hits })
        
        reg_query = {"query":{"ids":{"values":self.cited_records('named')}}}
        reg_hits  = jsearch.query_records(reg_query, 'named_regulations')
        self.named_clusters.update({ "named_regulations_{}".format(x['id']):x for x in reg_hits })

    def graph_json(self):
        nodes = [ self.node_dict(x) for x in list(self.graph['nodes']) ]
        links = [ self.edge_dict(x, nodes) for x in list(
            self.graph['edges']) if self.edge_dict(x, nodes) ]
        return {'nodes': nodes, 'links': links }

    def graph_to_d3(self, to_file=False):
        if to_file:
            json_path = "{}_hood.json".format(self.root_key)
            with open(json_path, 'w') as fh:
                json.dump(self.graph_json(), fh)
        else:
            return json.dumps(self.graph_json())

    def plot_hood_graph(self, to_file=False):
        print "Building Neighborhood Graph for {} ...".format(self.root_key)
        self.set_seed_docids()
        for doc_id in self.seed_docids:
            self.graph['nodes'].add(doc_name(doc_id))
            self.graph['edges'].add((doc_name(doc_id), self.root_key, 'implements'))
            self.expand_doc_node(doc_id)
        self.load_documents_map()
        self.load_named_clusters()
        return self.graph_to_d3(to_file)
            
    def node_dict(self, key):
        if 'documents_' in key:
            old_val = self.docs_map.get(key, {}) ## TODO ??? 
        else:
            old_val = self.named_clusters[key]

        if 'date' in old_val:
            if not old_val['date']:
                old_val.pop('date', None)
                
        old_val.pop('rule', None)
            
        if 'times_cited' in old_val and old_val['times_cited'] > 0:
            size = max(2, math.log(old_val['times_cited']))
        else:
            size = 2

        size = NodeMagnificationRate * size
            
        new_val = {
            'key':      key,
            'size':     size,
            'strength': 100,
            'x':        random.randint(0, 1200),
            'y':        random.randint(0, 1200),
            'color':    node_color(key, old_val)
        }
        if key == 'acts_1099': print old_val
        
        return merge_two_dicts(old_val, new_val)

    def edge_dict(self, edge_tuple, nodes):
        n1_matches = [ x for x in nodes if x['key'] == edge_tuple[0] ]
        n2_matches = [ x for x in nodes if x['key'] == edge_tuple[1] ]

        if n1_matches:
            n1 = n1_matches.pop()
        else:
            return None
        
        if n2_matches:
            n2 = n2_matches.pop()
        else:
            return None
        
        return {'source': nodes.index(n1),'target': nodes.index(n2), 'strength': 100}
            

class DocumentHoodGraph(HoodGraph):

    def __init__(self, doc_id):
        super(DocumentHoodGraph, self).__init__()
        self.root_key = node_name(doc_id, 'documents')
        self.doc_id   = doc_id

    def set_seed_docids(self):
        self.seed_docids = [ self.doc_id ]

    def expand_doc_node(self, doc_id):
        
        doc = jsearch.get_record(doc_id)
    
        for k in doc['children']:
            self.graph['nodes'].add(doc_name(k['id']))
            self.graph['edges'].add((doc_name(k['id']), doc_name(doc_id), 'is_part_of'))

        cites = doc['cited_associations']
    
        for d in cites['citation_ids']:
            self.graph['nodes'].add(doc_name(d))
            self.graph['edges'].add((doc_name(doc_id), doc_name(d), 'cites'))

        for a in cites['act_ids']:
            self.graph['nodes'].add(node_name(a, 'acts'))
            self.graph['edges'].add((doc_name(doc_id), node_name(a, 'acts'), 'references'))

        for r in cites['named_regulation_ids']:
            self.graph['nodes'].add(node_name(r, 'named_regulations'))
            self.graph['edges'].add((doc_name(doc_id), node_name(r, 'named_regulations'), 'references'))

        incoming = doc['incoming_citation_ids']
        
        if not incoming:
            return None
        
        for d in incoming[0:25]:
            self.graph['nodes'].add(doc_name(d))
            self.graph['edges'].add((doc_name(d), doc_name(doc_id), 'is_cited_by'))
            

class RegulationHoodGraph(HoodGraph):

    def __init__(self, reg_id): ## NB: "Regulation Z"
        super(RegulationHoodGraph, self).__init__()
        self.reg_id   = reg_id
        self.root_key = node_name(reg_id, 'named_regulations')
    
    def set_seed_docids(self):
        data = jsearch.get_record(self.reg_id, 'named_regulations')
        if not data['doc_ids']:
            print "Seed Neighborhood not found for {} ...".format(self.root_key)
            return False
        self.seed_docids = data['doc_ids']

    def expand_doc_node(self, doc_id):
        
        doc = jsearch.get_record(doc_id)
    
        for k in doc['children']:
            self.graph['nodes'].add(doc_name(k['id']))
            self.graph['edges'].add((doc_name(k['id']), doc_name(doc_id), 'is_part_of'))

        cites = doc['cited_associations']
    
        for a in cites['act_ids']:
            self.graph['nodes'].add(node_name(a, 'acts'))
            self.graph['edges'].add((doc_name(doc_id), node_name(a, 'acts'), 'references'))

        for r in cites['named_regulation_ids']:
            self.graph['nodes'].add(node_name(r, 'named_regulations'))
            self.graph['edges'].add((doc_name(doc_id), node_name(r, 'named_regulations'), 'references'))
            
        incoming = doc['incoming_citation_ids']
        
        if not incoming:
            return None
        
        for d in incoming[0:25]:
            self.graph['nodes'].add(doc_name(d))
            self.graph['edges'].add((doc_name(d), doc_name(doc_id), 'is_cited_by'))


class ActHoodGraph(HoodGraph):

    def __init__(self, act_id): ## NB: "Dodd-Frank"
        super(ActHoodGraph, self).__init__()
        self.act_id   = act_id
        self.root_key = node_name(act_id, 'acts')
    
    def set_seed_docids(self):
        data = jsearch.get_record(self.act_id, 'acts')
        if not data['doc_ids']:
            print "Seed Neighborhood not found for {} ...".format(self.root_key)
            return False
        self.seed_docids = data['doc_ids']

    def expand_doc_node(self, doc_id):
        
        doc = jsearch.get_record(doc_id)

        for k in doc['children']:
            self.graph['nodes'].add(doc_name(k['id']))
            self.graph['edges'].add((doc_name(k['id']), doc_name(doc_id), 'is_part_of'))

        cites = doc['cited_associations']
    
        for a in cites['act_ids']:
            self.graph['nodes'].add(node_name(a, 'acts'))
            self.graph['edges'].add((doc_name(doc_id), node_name(a, 'acts'), 'references'))

        for r in cites['named_regulation_ids']:
            self.graph['nodes'].add(node_name(r, 'named_regulations'))
            self.graph['edges'].add((doc_name(doc_id), node_name(r, 'named_regulations'), 'references'))

        incoming = doc['incoming_citation_ids']
        
        if not incoming:
            return None
        
        for d in incoming[0:25]:
            self.graph['nodes'].add(doc_name(d))
            self.graph['edges'].add((doc_name(d), doc_name(doc_id), 'is_cited_by'))

