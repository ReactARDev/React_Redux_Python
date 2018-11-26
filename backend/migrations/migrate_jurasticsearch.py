import json
import os
import sys

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder)
sys.path.append(this_folder + '/../')

import schemas.jurasticsearch as jsearch

from settings import API_ENV, BUILD_INDEX_NAME

if __name__ == "__main__":
    
    print('-*-*-*-*-*-*-*-*-*-*-*-*-* building mappers and analyzers *-*-*-*-*-*-*-*-*-*-*-*-*-')
    print('  -----> configuring jurispect index ...')
    config = json.loads( open(this_folder + '/jurasticsearch.json').read() )
    jsearch.client.indices.create(index=BUILD_INDEX_NAME, body=config)
