import os
import sys
import jwt
import requests
import random
import datetime as dt

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/../')

from shared_env import *

from schemas import base_users
from models import *
from app import app, db_session_users
from schemas import jurasticsearch as jsearch

reload(sys)  
sys.setdefaultencoding('utf8')

BuildName  = { 'reference': 'koala', 'hypothesis': 'koala' }
SearchVersion = { 'reference': 0, 'hypothesis': 1 }

def search_engine_name(side='reference'):
    return "{}-{}".format(BuildName[side], SearchVersion[side])

HypothesisName = search_engine_name('hypothesis')
ReferenceName  = search_engine_name('reference')

QueryText = { q.id:q.query for q in db_session_users.query(SearchRegressionQuery).all() }

def search_results(query_id, side='reference'):
    return db_session_users.query(SearchAssessmentResult).filter_by(
        query_id=query_id, build=BuildName[side], version=SearchVersion[side]).scalar()

def average_score(scores):
    if scores:
        return round(reduce(lambda x, y: x + y, scores) / len(scores), 4)
    else:
        return 0.0

def result_list(doc_ids, docs):
    result = ''
    for d in docs:
        if d['id'] in doc_ids:
            result += "    * {} {} {}\n".format(d['id'], d['category'], d['title'][0:100])
    return result
    
score_fn  = "{}_v_{}_scores".format(HypothesisName, ReferenceName)

score_report = open(score_fn, 'w')

for fh in [ score_report ]:
    fh.write('==========================================================================================')
    fh.write("\n")
    fh.write("               Evaluating Regressions from {} to {}".format(ReferenceName, HypothesisName))
    fh.write("\n")
    fh.write('==========================================================================================')
    fh.write("\n")

for q in db_session_users.query(SearchRegressionQuery).all():

    hyp = search_results(q.id, 'hypothesis')
    ref = search_results(q.id, 'reference')

    ## Doc id comparisons:
    regressions_1  = len( set(ref.doc_ids[0:1]) - set(hyp.doc_ids[0:1]) )
    regressions_5  = len( set(ref.doc_ids[0:5]) - set(hyp.doc_ids[0:5]) )
    regressions_20 = len( set(ref.doc_ids[0:20]) - set(hyp.doc_ids[0:20]) )

    ## Score comparisons:
    ref_1  = average_score(ref.scores[0:1])
    hyp_1  = average_score(hyp.scores[0:1])
    ref_5  = average_score(ref.scores[0:5])
    hyp_5  = average_score(hyp.scores[0:5])
    ref_20 = average_score(ref.scores[0:20])
    hyp_20 = average_score(hyp.scores[0:20])
    
    score_report.write("{} {}".format(q.id, QueryText[q.id]))
    score_report.write("\n")
    score_report.write("  hyp_count: {}, ref_count: {}".format(len(hyp.doc_ids), len(ref.doc_ids)))
    score_report.write("\n")
    score_report.write("    regressions @ 1:\t{}".format(regressions_1))
    score_report.write("\n")
    score_report.write("    regressions @ 5:\t{}".format(regressions_5))
    score_report.write("\n")
    score_report.write("    regressions @ 20:\t{}".format(regressions_20))
    score_report.write("\n")
    score_report.write("\tref/hyp @1:\t{}\t{}".format(ref_1, hyp_1))
    score_report.write("\n")
    score_report.write("\tref/hyp @5:\t{}\t{}".format(ref_5, hyp_5))
    score_report.write("\n")
    score_report.write("\tref/hyp @20:\t{}\t{}".format(ref_20, hyp_20))
    score_report.write("\n")
    
    for fh in [ score_report ]:
        fh.write('-----------------------------------------------------------------------------------------')
        fh.write("\n")
        
    r1  = set(ref.doc_ids[0:1]) - set(hyp.doc_ids[0:1])
    r5  = set(ref.doc_ids[0:5]) - set(hyp.doc_ids[0:5])
    r20 = set(ref.doc_ids[0:20]) - set(hyp.doc_ids[0:20])
    
    p1  = set(hyp.doc_ids[0:1]) - set(ref.doc_ids[0:1])
    p5  = set(hyp.doc_ids[0:5]) - set(ref.doc_ids[0:5])
    p20 = set(hyp.doc_ids[0:20]) - set(ref.doc_ids[0:20])

    print '-----------------------------------------------------------------------------------------'
    print "{} {}".format(q.id, QueryText[q.id])
    print '-----------------------------------------------------------------------------------------'
    
    print "\nRegressions @ 1:"
    print result_list(r1, ref.results['documents'])
    print "Progressions @ 1:"
    print result_list(p1, hyp.results['documents'])
    print "Regressions @ 5:"
    print result_list(r5, ref.results['documents'])
    print "Progressions @ 5:"
    print result_list(p5, hyp.results['documents'])
    #print "Regressions @ 20:"
    #print result_list(r20, ref.results['documents'])
    #print "Progressions @ 20:"
    #print result_list(p20, hyp.results['documents'])
