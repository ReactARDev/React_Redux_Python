from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, Text
from sqlalchemy.orm import relationship
from coaster.sqlalchemy import TimestampMixin

class ContributorPointType(TimestampMixin, BaseUsers):
    __tablename__ = 'contributor_point_types'

    ONBOARDING_FREQUENCY = 'onboarding'
    WEEKLY_FREQUENCY = 'weekly'
    ANYTIME_FREQUENCY = 'anytime'

    id = Column(BigInteger, Sequence('contributor_point_type_id_seq'), primary_key=True)
    short_name = Column(Text, index=True)
    point_group_name = Column(Text, index=True)  # n.b. this would be the grouping mechanism
    description = Column(Text)  # n.b. this would be the description of this individual point

    frequency = Column(Text)  # n.b. one-time, weekly, monthly, unlimited
    points_per_action = Column(BigInteger)
    actions_per_week = Column(BigInteger)
    points_per_month = Column(BigInteger)

    user_contributor_points = relationship("UserContributorPoint", back_populates="contributor_point_type")

    def __init__(self, params={}, point_group_name=None, description=None, frequency=None, points_per_action=None,
                 actions_per_week=None, points_per_month=None, short_name=None):
        self.short_name = short_name or params.get('short_name', None)
        self.point_group_name = point_group_name or params.get('point_group_name', None)
        self.description = description or params.get('description', None)
        self.frequency = frequency or params.get('frequency', None)
        self.points_per_action = points_per_action or params.get('points_per_action', None)
        self.actions_per_week = actions_per_week or params.get('actions_per_week', None)
        self.points_per_month = points_per_month or params.get('points_per_month', None)

    def to_dict(self):
        return {
            'id': self.id,
            'point_group_name': self.point_group_name,
            'description': self.description,
            'frequency': self.frequency,
            'points_per_action': self.points_per_action,
            'actions_per_week': self.actions_per_week,
            'points_per_month': self.points_per_month,
        }
