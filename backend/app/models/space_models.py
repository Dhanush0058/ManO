from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text, Float, ForeignKey
from app.models.database import Base, utcnow

class SpaceEvent(Base):
    __tablename__ = 'space_events'

    event_id = Column(String(100), primary_key=True, index=True)
    source_id = Column(String(100), nullable=False)
    satellite_name = Column(String(255), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utcnow)
    detection_description = Column(Text, nullable=False)
    affected_measurement = Column(String(100), nullable=False)
    observed_value = Column(String(100), nullable=False)
    expected_baseline = Column(String(100), nullable=False)
    detection_method = Column(String(100), nullable=False)
    detection_confidence = Column(Float, nullable=True)
    evidence_reference = Column(String(255), nullable=True)
    review_status = Column(String(50), default='unreviewed')
    is_confirmed_incident = Column(Integer, default=0)

class SpaceIncident(Base):
    __tablename__ = 'space_incidents'

    incident_id = Column(String(100), primary_key=True, index=True)
    event_id = Column(String(100), ForeignKey('space_events.event_id', ondelete='CASCADE'), nullable=False)
    satellite_name = Column(String(255), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utcnow)
    data_source = Column(String(255), nullable=False)
    observed_event = Column(Text, nullable=False)
    supporting_evidence = Column(Text, nullable=False)
    possible_explanations = Column(Text, nullable=False)
    preliminary_severity = Column(String(50), default='Unknown')
    severity_reasoning = Column(Text, nullable=True)
    uncertainties = Column(Text, nullable=False)
    recommended_next_steps = Column(Text, nullable=False)
    voice_briefing_text = Column(Text, nullable=True)
    review_status = Column(String(50), default='unreviewed')
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    operator_notes = Column(Text, nullable=True)
    outbound_call_dispatched = Column(Integer, default=0)
    outbound_call_sid = Column(String(100), nullable=True)
