import factory
from factory.fuzzy import FuzzyChoice, FuzzyText, FuzzyInteger
from models import *

class BaseFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        abstract = True
        sqlalchemy_session = db_session_users


class UserFactory(BaseFactory):
    class Meta:
        model = User

    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    email = factory.Sequence(lambda n: "user%d@test.com" % n)
    password = FuzzyText()
    company = FuzzyChoice(["jurispect", "frb"])
    industry = FuzzyChoice(["banking", "fintech", "law firm", "payments", "other"])
    discipline = FuzzyChoice(["compliance", "risk", "legal", "business", "other"])
    level = FuzzyChoice(["researcher", "enterprise", "exec", "other"])
    roles = []

class UserTagFactory(BaseFactory):
    class Meta:
        model = UserTag

    name = factory.fuzzy.FuzzyText()
    provenance = "user"

class SystemTagFactory(BaseFactory):
    class Meta:
        model = UserTag

    name = factory.fuzzy.FuzzyText()
    provenance = "system"
    topic_table = FuzzyChoice(["topics", "lda_topics"])
    topic_id = FuzzyInteger(100)
    active_suggestion = True

class UserFolderFactory(BaseFactory):
    class Meta:
        model = UserFolder

    name = factory.fuzzy.FuzzyText()

class UserSharedFolderFactory(BaseFactory):
    class Meta:
        model = UserSharedFolder

class UserFolderDocFactory(BaseFactory):
    class Meta:
        model = UserFolderDocument

    doc_id = FuzzyInteger(100)

class UserTeamFactory(BaseFactory):
    class Meta:
        model = Team

class UserTeamMemberFactory(BaseFactory):
    class Meta:
        model = TeamMember
