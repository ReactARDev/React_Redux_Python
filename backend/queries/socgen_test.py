import os
import json
import sys
from lxml import etree
from dateutil import parser
from werkzeug.datastructures import MultiDict

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/..')

import schemas.jurasticsearch as jsearch
from helpers.document_helper import get_filtered_documents

distinct_document_types = jsearch.get_distinct_attribute_values('category')

document_id = 1705526
comments_date = "01/17/2017"
effective_date = None
doc = jsearch.get_record(document_id)

#json.dump(doc, open('socgen.json', 'wb'))

document = etree.Element("document")

def create_basic_doc(document, doc_dict):
    basic_fields = ['title', 'category', 'pdf_url', 'web_url']
    for field_name in basic_fields:
        field_entry = etree.SubElement(document, field_name)
        field_entry.text = doc_dict[field_name]
    publication_date = etree.SubElement(document, "publication_date")
    publication_date.text = parser.parse(doc_dict['publication_date']).strftime("%m/%d/%Y")
    sources = etree.SubElement(document, "sources")
    for a in doc_dict['agencies']:
        source = etree.SubElement(sources, "source")
        source.attrib['short_name'] = a['short_name']
        source.text = a['name']

    if 'rule' in doc_dict and 'comments_close_on' in doc_dict['rule'] and doc_dict['rule']['comments_close_on'] is not None:
        comments_date = etree.SubElement(document, "comments_close_date")
        comments_date.text = parser.parse(doc_dict['rule']['comments_close_on']).strftime("%m/%d/%Y")

    if 'rule' in doc_dict and 'effective_on' in doc_dict['rule'] and doc_dict['rule']['effective_on'] is not None:
        effective_date = etree.SubElement(document, "effective_date")
        effective_date.text = parser.parse(doc_dict['rule']['effective_on']).strftime("%m/%d/%Y")

    try:
        document.text = doc_dict['full_text']
    except KeyError:
        print(doc_dict['id'])
        document.getparent().remove(document)
    return document

doc['rule'] = {}
doc['rule']['comments_close_on'] = comments_date
doc['rule']['effective_on'] = effective_date
create_basic_doc(document, doc)
mentions = etree.SubElement(document, "mentions")
for citation in doc['citations']:
    # n.b. some docs are in lists of length 1. could this be longer?
    if type(citation) == list:
        citation = citation[0]

    mention = etree.SubElement(mentions, "mention")
    if 'id' in citation:
        mention.attrib['citation'] = citation['official_id']
        cited_doc = jsearch.get_record(citation['id'])
        create_basic_doc(mention, cited_doc)
    elif 'name' in citation:
        mention.attrib['citation'] = citation['name']
    elif 'official_id' in citation:
        mention.attrib['citation'] = citation['official_id']
    else:
        print("something went wrong for: " + str(citation))

mentioned_by = etree.SubElement(document, "mentioned_by")
params = MultiDict({"citation_id": document_id})
mentioned_by_documents, count = get_filtered_documents(params, 1)
for mentioned_by_doc in mentioned_by_documents:
    mention = etree.SubElement(mentioned_by, "mention")
    create_basic_doc(mention, mentioned_by_doc)

xml_str = etree.tostring(document, pretty_print=True)

with open('socgen.xml', 'wb') as f:
    f.write('<?xml-stylesheet type="text/xsl" href="socgen.xslt"?>' + xml_str)