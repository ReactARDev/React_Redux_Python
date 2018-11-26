import boto3

from settings import API_ENV, MOCK_S3_DATASTORE

PDF_S3_BUCKET_NAME = 'jurispect-document-pdfs'
FULL_XML_S3_BUCKET_NAME  = 'jurispect-document-xmls'
IMAGE_S3_BUCKET_NAME = 'jurispect-document-images'

## Supported attributes:
# 'id','title','summary_text','category','pdf_url','web_url','publication_date','provenance','meta_table',
# 'topics','agencies','dockets','acts','cfr_parts','act_mentions','usc_mentions','cfr_mentions',
# 'reg_mentions','concept_mentions','concept_ids','person_mentions','place_mentions','org_mentions','acronym_mentions',
# 'publaw_mentions','important_dates','rule', 'agency_update', 'cfr_parts', 'regulations', 'full_text', 
class Document:

    def __init__(self, params):
        if params.get('refresh'):
            doc = params # TODO: fetch with id
        else:
            doc = params ## assume the input is a jurastic doc
        self.__data = doc

    def __getattr__(self, name):
        return self.__data.get(name, None)

    def local_pdf_path(self):
        parsed_pdf_path = self.full_path + ".pdf"
        stored_api_env = 'development' if API_ENV == 'local' else API_ENV
        return MOCK_S3_DATASTORE + '/' + stored_api_env + '/pdf/' + parsed_pdf_path

    def get_local_full_text_path(self, text_path):
        stored_api_env = 'development' if API_ENV == 'local' else API_ENV
        return MOCK_S3_DATASTORE + '/' + stored_api_env + '/full_text/' + text_path

    # NB: if no session is passed in, use the main boto session as a fallback
    def image_content(self, s3_resource=None):
        if API_ENV in ['testing', 'local']:
            return open('./test/fixtures/test-image.jpg', 'rb').read()
        else:
            if not s3_resource: s3_resource = boto3.resource('s3')

            if hasattr(self, 'mainstream_news') and self.mainstream_news['image_hash'] is not None:
                s3_object = s3_resource.Object(IMAGE_S3_BUCKET_NAME, self.mainstream_news['image_hash'])
                return s3_object.get()["Body"].read()
            else:
                return None

    # NB: if no session is passed in, use the main boto session as a fallback
    def pdf_content(self, s3_resource=None):
        if API_ENV in ['testing', 'local']:
            pdf_path = self.local_pdf_path()
            try:
                return open(pdf_path, 'rb').read()
            except: # load sample if not existing
                return open('./assets/fr-sample.pdf', 'rb').read()
        else:
            if not s3_resource: s3_resource = boto3.resource('s3')

            path = self.pdf_hash

            s3_object = s3_resource.Object(PDF_S3_BUCKET_NAME, path)
            return s3_object.get()["Body"].read()

    def xml_content(self, s3_resource=None):
        if API_ENV in ['testing', 'local']:
            # n.b. return canned response for tests
            if API_ENV == 'testing':
                return open('./test/fixtures/fed_doc.html', 'rb').read().decode("utf-8")
            else:
                full_path = self.get_local_full_text_path(self.full_xml)
                return open(full_path, 'r').read().decode("utf-8")

        else:
            # if no session was passed in, use the main boto session as a fallback
            if not s3_resource:
                s3_resource = boto3.resource('s3')

            path = self.full_xml_hash
            s3_object = s3_resource.Object(FULL_XML_S3_BUCKET_NAME, path)
            return s3_object.get()["Body"].read().decode("utf-8")