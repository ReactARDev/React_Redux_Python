import os
import sys

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/schemas')

from schemas.base_users import *
from schemas.document import Document

