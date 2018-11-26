from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Boolean, Index
from coaster.sqlalchemy import TimestampMixin

class UserTopic(TimestampMixin, BaseUsers):
    __tablename__ = 'user_topics'

    id = Column(BigInteger, Sequence('user_topic_id_seq'), primary_key=True)
    topic_id = Column(BigInteger)
    user_id  = Column(BigInteger, ForeignKey('users.id'))

    # tracks whether a user is "following" a topic or not
    following = Column(Boolean)

    def __init__(self, params={}, topic_id=None, user_id=None, following=None):
        self.topic_id  = topic_id or params['topic_id']
        self.user_id = user_id or params['user_id']
        self.following = following or params.get('following', False)

    def to_dict(self):
        return {
            "id": self.id,
            "topic_id": self.topic_id,
            "user_id": self.user_id,
            "following": self.following,
        }
Index("user_id_following_topic_index", UserTopic.user_id, UserTopic.following)
