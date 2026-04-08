from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, func
from app.core.database import Base


class MicrowaveLinkBudget(Base):
    __tablename__ = "microwave_link_budgets"

    id = Column(Integer, primary_key=True, index=True)

    vendor = Column(String, nullable=True)
    site_name_s1 = Column(String, nullable=True, index=True)
    site_name_s2 = Column(String, nullable=True, index=True)
    state_province = Column(String, nullable=True)
    township = Column(String, nullable=True)
    zone = Column(String, nullable=True)
    region = Column(String, nullable=True)
    ring_id_span_name = Column(String, nullable=True)
    media_type = Column(String, nullable=True)
    link_id = Column(String, nullable=True, index=True)
    revise = Column(String, nullable=True)
    site_name_s1_ip = Column(String, nullable=True)
    site_name_s2_ip = Column(String, nullable=True)
    site_name_s1_port = Column(String, nullable=True)
    site_name_s2_port = Column(String, nullable=True)
    link_class = Column(String, nullable=True)
    model = Column(String, nullable=True)
    status = Column(String, nullable=True)
    active = Column(Boolean, nullable=True)
    protocol = Column(String, nullable=True)
    comment = Column(String, nullable=True)
    status_1 = Column(String, nullable=True)
    type = Column(String, nullable=True)
    bandwidth = Column(String, nullable=True)
    planning_capacity = Column(String, nullable=True)

    latitude_s1 = Column(Float, nullable=True)
    latitude_s2 = Column(Float, nullable=True)
    longitude_s1 = Column(Float, nullable=True)
    longitude_s2 = Column(Float, nullable=True)

    true_azimuth_s1 = Column(Float, nullable=True)
    true_azimuth_s2 = Column(Float, nullable=True)

    tower_height_s1 = Column(Float, nullable=True)
    tower_height_s2 = Column(Float, nullable=True)

    tr_antenna_model_s1 = Column(String, nullable=True)
    tr_antenna_model_s2 = Column(String, nullable=True)

    tr_antenna_diameter_s1 = Column(Float, nullable=True)
    tr_antenna_diameter_s2 = Column(Float, nullable=True)

    tr_antenna_height_s1 = Column(Float, nullable=True)
    tr_antenna_height_s2 = Column(Float, nullable=True)

    frequency_mhz = Column(Float, nullable=True)
    polarization = Column(String, nullable=True)
    path_length_km = Column(Float, nullable=True)

    radio_model_s1 = Column(String, nullable=True)
    radio_model_s2 = Column(String, nullable=True)

    design_frequency_1_s1 = Column(Float, nullable=True)
    design_frequency_1_s2 = Column(Float, nullable=True)
    design_frequency_2_s1 = Column(Float, nullable=True)
    design_frequency_2_s2 = Column(Float, nullable=True)
    design_frequency_3_s1 = Column(Float, nullable=True)
    design_frequency_3_s2 = Column(Float, nullable=True)
    design_frequency_4_s1 = Column(Float, nullable=True)
    design_frequency_4_s2 = Column(Float, nullable=True)

    tx_power_dbm_s1 = Column(Float, nullable=True)
    tx_power_dbm_s2 = Column(Float, nullable=True)

    rx_threshold_level_dbm_s1 = Column(Float, nullable=True)
    rx_threshold_level_dbm_s2 = Column(Float, nullable=True)

    radio_file_name_s1 = Column(String, nullable=True)
    radio_file_name_s2 = Column(String, nullable=True)

    receive_signal_dbm_s1 = Column(Float, nullable=True)
    receive_signal_dbm_s2 = Column(Float, nullable=True)

    thermal_fade_margin_db_s1 = Column(Float, nullable=True)
    thermal_fade_margin_db_s2 = Column(Float, nullable=True)

    effective_fade_margin_db_s1 = Column(Float, nullable=True)
    effective_fade_margin_db_s2 = Column(Float, nullable=True)

    annual_multipath_availability_s1 = Column(Float, nullable=True)
    annual_multipath_availability_s2 = Column(Float, nullable=True)

    annual_rain_availability_s1 = Column(Float, nullable=True)
    annual_rain_availability_s2 = Column(Float, nullable=True)

    atpc_1_s1 = Column(String, nullable=True)
    atpc_1_s2 = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)