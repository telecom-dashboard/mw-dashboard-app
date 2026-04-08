from typing import Optional
from pydantic import BaseModel, ConfigDict


class MicrowaveLinkBudgetBase(BaseModel):
    vendor: Optional[str] = None
    site_name_s1: Optional[str] = None
    site_name_s2: Optional[str] = None
    state_province: Optional[str] = None
    township: Optional[str] = None
    zone: Optional[str] = None
    region: Optional[str] = None
    ring_id_span_name: Optional[str] = None
    media_type: Optional[str] = None
    link_id: Optional[str] = None
    revise: Optional[str] = None
    site_name_s1_ip: Optional[str] = None
    site_name_s2_ip: Optional[str] = None
    site_name_s1_port: Optional[str] = None
    site_name_s2_port: Optional[str] = None
    link_class: Optional[str] = None
    model: Optional[str] = None
    status: Optional[str] = None
    active: Optional[bool] = None
    protocol: Optional[str] = None
    comment: Optional[str] = None
    status_1: Optional[str] = None
    type: Optional[str] = None
    bandwidth: Optional[str] = None
    planning_capacity: Optional[str] = None

    latitude_s1: Optional[float] = None
    latitude_s2: Optional[float] = None
    longitude_s1: Optional[float] = None
    longitude_s2: Optional[float] = None
    true_azimuth_s1: Optional[float] = None
    true_azimuth_s2: Optional[float] = None
    tower_height_s1: Optional[float] = None
    tower_height_s2: Optional[float] = None

    tr_antenna_model_s1: Optional[str] = None
    tr_antenna_model_s2: Optional[str] = None
    tr_antenna_diameter_s1: Optional[float] = None
    tr_antenna_diameter_s2: Optional[float] = None
    tr_antenna_height_s1: Optional[float] = None
    tr_antenna_height_s2: Optional[float] = None

    frequency_mhz: Optional[float] = None
    polarization: Optional[str] = None
    path_length_km: Optional[float] = None
    radio_model_s1: Optional[str] = None
    radio_model_s2: Optional[str] = None

    design_frequency_1_s1: Optional[float] = None
    design_frequency_1_s2: Optional[float] = None
    design_frequency_2_s1: Optional[float] = None
    design_frequency_2_s2: Optional[float] = None
    design_frequency_3_s1: Optional[float] = None
    design_frequency_3_s2: Optional[float] = None
    design_frequency_4_s1: Optional[float] = None
    design_frequency_4_s2: Optional[float] = None

    tx_power_dbm_s1: Optional[float] = None
    tx_power_dbm_s2: Optional[float] = None
    rx_threshold_level_dbm_s1: Optional[float] = None
    rx_threshold_level_dbm_s2: Optional[float] = None

    radio_file_name_s1: Optional[str] = None
    radio_file_name_s2: Optional[str] = None

    receive_signal_dbm_s1: Optional[float] = None
    receive_signal_dbm_s2: Optional[float] = None
    thermal_fade_margin_db_s1: Optional[float] = None
    thermal_fade_margin_db_s2: Optional[float] = None
    effective_fade_margin_db_s1: Optional[float] = None
    effective_fade_margin_db_s2: Optional[float] = None

    annual_multipath_availability_s1: Optional[float] = None
    annual_multipath_availability_s2: Optional[float] = None
    annual_rain_availability_s1: Optional[float] = None
    annual_rain_availability_s2: Optional[float] = None

    atpc_1_s1: Optional[str] = None
    atpc_1_s2: Optional[str] = None


class MicrowaveLinkBudgetCreate(MicrowaveLinkBudgetBase):
    pass


class MicrowaveLinkBudgetUpdate(MicrowaveLinkBudgetBase):
    pass


class MicrowaveLinkBudgetRead(MicrowaveLinkBudgetBase):
    id: int

    model_config = ConfigDict(from_attributes=True)