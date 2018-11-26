from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, Text, ForeignKey
from sqlalchemy.orm import relationship
from coaster.sqlalchemy import TimestampMixin

class UserContributorPoint(TimestampMixin, BaseUsers):
    __tablename__ = 'user_contributor_points'

    id = Column(BigInteger, Sequence('user_contributor_point_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)
    contributor_point_type_id = Column(BigInteger, ForeignKey('contributor_point_types.id'), index=True)
    num_points = Column(BigInteger)

    # n.b. for cases where an admin assigns arbitrary points to a user (in this case contributor_point_type_id
    # would be null or a common admin-specific value
    notes = Column(Text)

    user = relationship("User", back_populates="user_contributor_points")
    contributor_point_type = relationship("ContributorPointType", back_populates="user_contributor_points")

    def __init__(self, params={}, num_points=None, notes=None, user_id=None, contributor_point_type_id=None):
        self.num_points = num_points or params.get('num_points', None)
        self.notes = notes or params.get('notes', None)
        self.user_id = user_id or params.get('user_id', None)
        self.contributor_point_type_id = contributor_point_type_id or params.get('contributor_point_type_id', None)

    def to_dict(self):
        return {
            'id': self.id,
            'num_points': self.num_points,
            'notes': self.notes,
            'user_id': self.user_id,
            'contributor_point_type_id': self.contributor_point_type_id
        }
