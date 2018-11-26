from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Text, Boolean, Index
from coaster.sqlalchemy import TimestampMixin

class UserFollowedEntity(TimestampMixin, BaseUsers):
    __tablename__ = 'user_followed_entities'

    id = Column(BigInteger, Sequence('user_followed_entity_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'))

    # tracks whether a user is "following" this entity or not
    following = Column(Boolean)

    # n.b. this is a polymorphic association to any of a constrained list of tables and then the
    # id for the entry in that table we are referring to
    entity_id = Column(BigInteger)
    entity_type = Column(Text)

    def __init__(self, params):
        self.user_id = params['user_id']
        self.entity_id = params['entity_id']
        self.entity_type = params['entity_type']
        self.following = params.get('following', True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'entity_id': self.entity_id,
            'entity_type': self.entity_type,
            'following': self.following
        }

Index("user_id_following_entity_type_index", UserFollowedEntity.user_id, UserFollowedEntity.following,
      UserFollowedEntity.entity_type)
