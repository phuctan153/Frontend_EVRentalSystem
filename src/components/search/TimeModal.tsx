import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TimeSelection, getDateAfterDays } from "../../models/SearchModel";
import { closeModal } from "../../controller/SearchController";
import { usePolicy } from "../../hooks/usePolicy";

type Props = {
  current: TimeSelection ;
  onSave: (val: TimeSelection) => void;
};

export default function TimeModal({ current, onSave }: Props) {
  const [startDate, setStartDate] = useState(current.startDate);
  const [endDate, setEndDate] = useState(current.endDate);
  const [startTime, setStartTime] = useState(current.startTime);
  const [endTime, setEndTime] = useState(current.endTime);
  const [minStart, setMinStart] = useState<number>(0);
  const [maxStart, setMaxStart] = useState<number>(0);
  const [maxEnd, setMaxEnd] = useState<number>(0);
  const { fetchPolicyDay } = usePolicy();



  useEffect(() => {
    const fetchData =async () => {
      const data = await fetchPolicyDay();
      setMinStart(Number(data.minStartDay));
      setMaxStart(Number(data.maxStartDay));
      setMaxEnd(Number(data.maxEndDay) + minStart);
    }
    fetchData()
    const nextDay = new Date(startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setEndDate(nextDay.toISOString().slice(0, 10));
  }, [fetchPolicyDay, minStart, startDate]);



  const minStartDate = useMemo(() => getDateAfterDays(minStart), [minStart]);
  const maxStartDate = useMemo(() => getDateAfterDays(maxStart), [maxStart]);
  const maxEndDate = useMemo(() => getDateAfterDays(maxEnd), [maxEnd]);


  const minEndDate = useMemo(() => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }, [startDate]);

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    setEndTime(newStartTime);
  };

  const handleSave = async () => {
    if (startDate < minStartDate) {
      alert(`Ngày nhận xe phải từ ${minStartDate} trở đi`);
      return;
    }

    if (startDate > maxStartDate) {
      alert(`Ngày nhận xe không được quá ${maxStartDate}`);
      return;
    }

    if (endDate <= startDate) {
      alert("Ngày trả xe phải sau ngày nhận xe");
      return;
    }

    if (endDate > maxEndDate) {
      alert(`Ngày trả xe không được quá ${maxEndDate}`);
      return;
    }

    const payload: TimeSelection = {
      mode: "day",
      startDate,
      endDate,
      startTime,
      endTime,
    };
    onSave(payload);
    closeModal("timeModal");
  };

  const displaySummary = useMemo(() => {
    return `Khoảng: ${startDate} ${startTime} → ${endDate} ${startTime}`;
  }, [startDate, endDate, startTime]);

  return (
    <div className="modal fade" id="timeModal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Thời gian</h5>
            <button
              id="timeModalClose"
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Đóng"
            />
          </div>

          <div className="modal-body">
            <DayModeForm
              startDate={startDate}
              endDate={endDate}
              startTime={startTime}
              endTime={endTime}
              minStartDate={minStartDate}
              maxStartDate={maxStartDate}
              minEndDate={minEndDate}
              maxEndDate={maxEndDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onStartTimeChange={handleStartTimeChange}
              onEndTimeChange={setEndTime}
            />
          </div>

          <div className="modal-footer">
            <div className="text-muted small me-auto">{displaySummary}</div>
            <button className="btn btn-secondary" data-bs-dismiss="modal">
              Hủy
            </button>
            <button className="btn btn-success" onClick={handleSave}>
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= SUB-COMPONENTS =============

type DayModeFormProps = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  minStartDate: string;
  maxStartDate: string;
  minEndDate: string;
  maxEndDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onStartTimeChange: (val: string) => void;
  onEndTimeChange: (val: string) => void;
};

function DayModeForm({
  startDate,
  endDate,
  startTime,
  endTime,
  minStartDate,
  maxStartDate,
  minEndDate,
  maxEndDate,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: DayModeFormProps) {
  return (
    <>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small">Ngày nhận</label>
          <input
            type="date"
            className="form-control"
            min={minStartDate}
            max={maxStartDate}
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label small">Ngày trả</label>
          <input
            type="date"
            className="form-control"
            min={minEndDate}
            max={maxEndDate}
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
          <small className="text-muted">Tối thiểu 1 ngày sau ngày nhận</small>
        </div>
      </div>
      <div className="row g-3 mt-2">
        <div className="col-md-6">
          <label className="form-label small">Giờ nhận</label>
          <input
            type="time"
            className="form-control"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label small">Giờ trả</label>
          <input
            type="time"
            className="form-control"
            value={startTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            disabled
          />
        </div>
      </div>
    </>
  );
}