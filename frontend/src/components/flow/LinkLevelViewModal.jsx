import React, { memo } from "react";

function Item({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-800">{value || "-"}</div>
    </div>
  );
}

const MemoItem = memo(Item);

function LinkLevelViewModal({ open, data, onClose }) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Link View</h2>
            <p className="text-sm text-slate-500">{data.link_id || "-"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(90vh-72px)] overflow-auto p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MemoItem label="Link ID" value={data.link_id} />
            <MemoItem label="Vendor" value={data.vendor} />
            <MemoItem label="Status" value={data.status} />
            <MemoItem label="Protocol" value={data.protocol} />

            <MemoItem label="Site Name S1" value={data.site_name_s1} />
            <MemoItem label="Site Name S2" value={data.site_name_s2} />
            <MemoItem label="NE IP" value={data.site_name_s1_ip} />
            <MemoItem label="FE IP" value={data.site_name_s2_ip} />

            <MemoItem label="TX Power S1" value={data.tx_power_dbm_s1} />
            <MemoItem label="RSL S1" value={data.receive_signal_dbm_s1} />
            <MemoItem label="Bandwidth" value={data.bandwidth} />
            <MemoItem label="Planning Capacity" value={data.planning_capacity} />

            <MemoItem label="ATPC S1" value={data.atpc_1_s1} />
            <MemoItem label="Frequency MHz" value={data.frequency_mhz} />
            <MemoItem label="Path Length KM" value={data.path_length_km} />
            <MemoItem label="Polarization" value={data.polarization} />

            <MemoItem label="Design Frequency S1" value={data.design_frequency_1_s1} />
            <MemoItem label="Design Frequency S2" value={data.design_frequency_1_s2} />
            <MemoItem label="Radio File Name S1" value={data.radio_file_name_s1} />
            <MemoItem label="Type" value={data.type} />

            <MemoItem label="Tower Height S1" value={data.tower_height_s1} />
            <MemoItem label="Tower Height S2" value={data.tower_height_s2} />
            <MemoItem label="TR Antenna Diameter S1" value={data.tr_antenna_diameter_s1} />
            <MemoItem label="TR Antenna Diameter S2" value={data.tr_antenna_diameter_s2} />

            <MemoItem label="TR Antenna Height S1" value={data.tr_antenna_height_s1} />
            <MemoItem label="TR Antenna Height S2" value={data.tr_antenna_height_s2} />
            <MemoItem label="True Azimuth S1" value={data.true_azimuth_s1} />
            <MemoItem label="True Azimuth S2" value={data.true_azimuth_s2} />

            <MemoItem label="Latitude S1" value={data.latitude_s1} />
            <MemoItem label="Longitude S1" value={data.longitude_s1} />
            <MemoItem label="Latitude S2" value={data.latitude_s2} />
            <MemoItem label="Longitude S2" value={data.longitude_s2} />

            <MemoItem label="Township" value={data.township} />
            <MemoItem label="Zone" value={data.zone} />
            <MemoItem label="Region" value={data.region} />
            <MemoItem label="Revise" value={data.revise} />

            <MemoItem label="Site S1 Port" value={data.site_name_s1_port} />
            <MemoItem label="Site S2 Port" value={data.site_name_s2_port} />
            <MemoItem label="Management IP" value={data.management_ip} />
            <MemoItem label="Login URL" value={data.login_url} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(LinkLevelViewModal);
