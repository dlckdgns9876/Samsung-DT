import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * 초보 육아 웹 – 성장/건강 (React)
 * - 로컬스토리지에 성장 기록 저장/불러오기
 * - Canvas 자체 렌더링(차트/미니 썸네일)
 * - MPH(부모 키 기반 성인 키 예측)
 * - 내보내기/불러오기/전체 초기화
 */
export default function GrowthHealth() {
  /** ========== 유틸 ========== */
  const LS_KEY = "growth_records_v1";
  const PREVIEW_KEY = "growth_preview_png";
  const PREVIEW_META_KEY = "growth_preview_meta";
  const MPH_KEY = "parent_height_info_v1";

  const fmt = (n, d = 2) => (n ?? "").toString() === "" ? "" : Number(n).toFixed(d);
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const num = (v) => (v === "" || v == null) ? null : Number(v);

  function seed8weeks() {
    const base = new Date();
    base.setDate(base.getDate() - 7 * 7);
    const rows = [];
    let w = 6.2, h = 62.0, head = 40.5;
    for (let i = 0; i < 8; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i * 7);
      w += (Math.random() * 0.25 + 0.05);
      h += (Math.random() * 0.6 + 0.2);
      head += (Math.random() * 0.15 + 0.03);
      rows.push({
        date: d.toISOString().slice(0, 10),
        weight: +w.toFixed(2),
        height: +h.toFixed(1),
        head: +head.toFixed(1),
      });
    }
    return rows;
  }

  function loadRows() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return seed8weeks();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return seed8weeks();
      return arr.map((r) => ({
        date: r.date,
        weight: num(r.weight),
        height: num(r.height),
        head: num(r.head),
      }));
    } catch (_) {
      return seed8weeks();
    }
  }

  function saveRows(next) {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    setLastSaved(new Date());
  }

  /** ========== 상태 ========== */
  const [rows, setRows] = useState(() => loadRows());
  const [metric, setMetric] = useState("weight");
  const [lastSaved, setLastSaved] = useState(() => new Date());

  // 입력폼 상태
  const [dateInput, setDateInput] = useState(() => todayStr());
  const [wInput, setWInput] = useState("");
  const [hInput, setHInput] = useState("");
  const [hdInput, setHdInput] = useState("");

  // MPH 상태
  const [momH, setMomH] = useState("");
  const [dadH, setDadH] = useState("");
  const [sex, setSex] = useState("boy");

  // 캔버스 ref
  const chartRef = useRef(null);
  const tooltipRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const previewImgRef = useRef(null);

  /** ========== MPH 저장/불러오기 ========== */
  useEffect(() => {
    // 초기 로드
    const s = JSON.parse(localStorage.getItem(MPH_KEY) || "{}");
    if (s.mom != null) setMomH(s.mom);
    if (s.dad != null) setDadH(s.dad);
    if (s.sex === "girl") setSex("girl");
  }, []);

  useEffect(() => {
    const state = { mom: num(momH), dad: num(dadH), sex };
    localStorage.setItem(MPH_KEY, JSON.stringify(state));
  }, [momH, dadH, sex]);

  /** ========== 파생 데이터 ========== */
  const sortedRowsDesc = useMemo(() => {
    const c = [...rows];
    c.sort((a, b) => (a.date < b.date ? 1 : -1));
    return c;
  }, [rows]);

  /** ========== 차트 렌더링 ========== */
  const getDataForMetric = (list, m) =>
    list
      .filter((r) => r[m] != null)
      .slice()
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .map((r) => ({ x: new Date(r.date).getTime(), y: Number(r[m]), date: r.date }));

  useEffect(() => {
    drawAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, metric]);

  function drawAll() {
    const canvas = chartRef.current;
    if (!canvas) return;
    drawChart(canvas, rows, metric);
    drawPreviewAndSave(rows, metric);
  }

  function drawChart(canvas, list, m) {
    const tooltip = tooltipRef.current;
    const data = getDataForMetric(list, m);
    const ctx = canvas.getContext("2d");
    const cssW = canvas.clientWidth;
    const cssH = 320;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.height = cssH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const pad = { l: 44, r: 16, t: 16, b: 28 };
    const W = cssW - pad.l - pad.r;
    const H = cssH - pad.t - pad.b;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);

    if (!data.length) {
      ctx.fillStyle = "#6b7280";
      ctx.fillText("데이터가 없습니다.", pad.l, pad.t + 20);
      return;
    }

    const xs = data.map((d) => d.x);
    const ys = data.map((d) => d.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const rangeX = maxX - minX || 1;
    const minY = Math.floor(Math.min(...ys) * 0.98);
    const maxY = Math.ceil(Math.max(...ys) * 1.02);
    const rangeY = maxY - minY || 1;

    const xToPx = (x) => pad.l + ((x - minX) / rangeX) * W;
    const yToPx = (y) => pad.t + (1 - (y - minY) / rangeY) * H;

    // grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (i / 5) * H;
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + W, y);
    }
    ctx.stroke();

    // line
    ctx.beginPath();
    data.forEach((p, idx) => {
      const x = xToPx(p.x);
      const y = yToPx(p.y);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#2563eb";
    ctx.stroke();

    // dots
    ctx.fillStyle = "#2563eb";
    data.forEach((p) => {
      const x = xToPx(p.x);
      const y = yToPx(p.y);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // y labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px system-ui";
    for (let i = 0; i <= 5; i++) {
      const v = minY + (i / 5) * rangeY;
      const y = pad.t + (1 - i / 5) * H + 4;
      ctx.fillText(v.toFixed(m === "weight" ? 2 : 1), 6, y);
    }

    // x labels
    [minX, minX + rangeX / 2, maxX].forEach((x) => {
      const d = new Date(x);
      const s = `${d.getMonth() + 1}/${d.getDate()}`;
      const tx = xToPx(x) - 10;
      const ty = pad.t + H + 18;
      ctx.fillText(s, tx, ty);
    });

    // hover
    const pts = data.map((p) => ({ x: xToPx(p.x), y: yToPx(p.y), raw: p }));
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      let nearest = null, best = 99999;
      pts.forEach((pt) => {
        const d = Math.abs(pt.x - mx);
        if (d < best) { best = d; nearest = pt; }
      });
      if (!tooltip) return;
      if (nearest && best < 30) {
        tooltip.style.opacity = 1;
        tooltip.style.left = nearest.x + "px";
        tooltip.style.top = nearest.y + "px";
        tooltip.textContent = `${nearest.raw.date} • ${nearest.raw.y}${m === "weight" ? "kg" : "cm"}`;
      } else {
        tooltip.style.opacity = 0;
      }
    };
    const onLeave = () => { if (tooltip) tooltip.style.opacity = 0; };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    // cleanup (다시 그릴 때 중복 방지)
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }

  function drawPreviewAndSave(list, m) {
    const c = previewCanvasRef.current;
    const img = previewImgRef.current;
    if (!c || !img) return;

    const data = getDataForMetric(list, m);
    const ctx = c.getContext("2d");
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#f8fafc");
    g.addColorStop(1, "#eef2ff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (data.length) {
      const xs = data.map((d) => d.x);
      const ys = data.map((d) => d.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const rangeX = maxX - minX || 1;
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const rangeY = (maxY - minY) || 1;
      const x = (v) => ((v - minX) / rangeX) * (W - 20) + 10;
      const y = (v) => (1 - (v - minY) / rangeY) * (H - 20) + 10;

      // area
      ctx.beginPath();
      data.forEach((p, i) => {
        const xp = x(p.x), yp = y(p.y);
        if (i === 0) ctx.moveTo(xp, yp);
        else ctx.lineTo(xp, yp);
      });
      ctx.lineTo(x(maxX), H - 10);
      ctx.lineTo(x(minX), H - 10);
      ctx.closePath();
      ctx.fillStyle = "rgba(37,99,235,0.14)";
      ctx.fill();

      // line
      ctx.beginPath();
      data.forEach((p, i) => {
        const xp = x(p.x), yp = y(p.y);
        if (i === 0) ctx.moveTo(xp, yp);
        else ctx.lineTo(xp, yp);
      });
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#2563eb";
      ctx.stroke();
    }

    const url = c.toDataURL("image/png");
    localStorage.setItem(PREVIEW_KEY, url);
    localStorage.setItem(PREVIEW_META_KEY, JSON.stringify({ metric: m, updated: new Date().toISOString() }));
    img.src = url;
  }

  /** ========== 이벤트 핸들러 ========== */
  const onAdd = () => {
    const d = dateInput || todayStr();
    const w = num(wInput);
    const h = num(hInput);
    const hd = num(hdInput);
    if (w == null && h == null && hd == null) {
      alert("적어도 하나의 값을 입력하세요.");
      return;
    }
    setRows((prev) => {
      const i = prev.findIndex((r) => r.date === d);
      const rec = { date: d, weight: w, height: h, head: hd };
      const next = i >= 0 ? prev.map((r, idx) => (idx === i ? { ...r, ...rec } : r)) : [...prev, rec];
      saveRows(next);
      return next;
    });
    setWInput("");
    setHInput("");
    setHdInput("");
  };

  const onDelete = (idx) => {
    setRows((prev) => {
      const next = prev.slice();
      next.splice(idx, 1);
      saveRows(next);
      return next;
    });
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "growth_records.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const arr = JSON.parse(r.result);
        if (Array.isArray(arr)) {
          setRows(arr);
          saveRows(arr);
        } else alert("형식이 올바르지 않습니다.");
      } catch (err) {
        alert("JSON 파싱 오류");
      }
    };
    r.readAsText(file);
  };

  const onClear = () => {
    if (!window.confirm("모든 기록을 삭제할까요?")) return;
    setRows(() => {
      const next = [];
      saveRows(next);
      return next;
    });
  };

  /** ========== MPH 계산 ========== */
  const mphPredict = (mom, dad, s) => {
    if (!Number.isFinite(mom) || !Number.isFinite(dad)) return null;
    const base = s === "boy" ? (dad + mom + 13) / 2 : (dad + mom - 13) / 2;
    return { base, low: base - 8.5, high: base + 8.5 };
  };
  const mph = useMemo(() => mphPredict(num(momH), num(dadH), sex), [momH, dadH, sex]);

  return (
    <div className="container growth-page">
      <style>{css}</style>
        {/* Hero */}
        <section className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: 6, fontSize: 26, lineHeight: 1.2 }}>성장/건강 기록</h2>
            <div className="muted">체중·키·머리둘레를 기록하고 그래프로 확인하세요. (로컬 저장)</div>
          </div>
          <div className="badge" id="lastSaved">마지막 저장: {lastSaved.toLocaleString()}</div>
        </section>

        <section className="grid">
          {/* 그래프 */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3>그래프</h3>
              <div className="seg" role="tablist" aria-label="지표 선택">
                <button id="tab-weight" className={metric === "weight" ? "active" : ""} data-metric="weight" onClick={() => setMetric("weight")}>체중(kg)</button>
                <button id="tab-height" className={metric === "height" ? "active" : ""} data-metric="height" onClick={() => setMetric("height")}>키(cm)</button>
                <button id="tab-head" className={metric === "head" ? "active" : ""} data-metric="head" onClick={() => setMetric("head")}>머리둘레(cm)</button>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <canvas ref={chartRef} id="chart" style={{ width: "100%", height: 320, borderRadius: 12, background: "#fff" }} />
              <div ref={tooltipRef} id="tooltip" className="tooltip" />
            </div>
            <div style={{ marginTop: 12 }} className="preview-wrap">
              <img ref={previewImgRef} id="previewImg" alt="홈 미리보기 썸네일" style={{ height: 56, border: "1px solid var(--line)", borderRadius: 10, background: "#f8fafc" }} />
              <div className="hint">그래프가 그려질 때마다 <strong>홈</strong> 썸네일을 자동 생성합니다.</div>
            </div>
            <canvas ref={previewCanvasRef} id="previewCanvas" width={560} height={100} style={{ display: "none" }} />
          </div>

          {/* 기록 추가 / 데이터 */}
          <div className="card">
            <h3>기록 추가</h3>
            <div className="row">
              <input type="date" className="input" style={{ flex: "1 0 140px" }} value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
              <input type="number" step="0.01" placeholder="체중(kg)" className="input" style={{ flex: "1 0 120px" }} value={wInput} onChange={(e) => setWInput(e.target.value)} />
              <input type="number" step="0.1" placeholder="키(cm)" className="input" style={{ flex: "1 0 120px" }} value={hInput} onChange={(e) => setHInput(e.target.value)} />
              <input type="number" step="0.1" placeholder="머리둘레(cm)" className="input" style={{ flex: "1 0 120px" }} value={hdInput} onChange={(e) => setHdInput(e.target.value)} />
              <button className="btn primary" onClick={onAdd}>추가</button>
            </div>

            {/* MPH (접기/펼치기) */}
            <details className="mph" open>
              <summary><strong>부모 키 기반 성인 키 예측 (MPH)</strong> <span className="muted" style={{ fontWeight: 400 }}>· 간단 참고치</span></summary>
              <div className="row" style={{ marginTop: 8 }}>
                <input type="number" step="0.1" placeholder="엄마 키 (cm)" className="input" style={{ flex: "1 0 140px" }} value={momH} onChange={(e) => setMomH(e.target.value)} />
                <input type="number" step="0.1" placeholder="아빠 키 (cm)" className="input" style={{ flex: "1 0 140px" }} value={dadH} onChange={(e) => setDadH(e.target.value)} />
              </div>
              <div className="row" style={{ alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <div className="seg" role="tablist" aria-label="아기 성별">
                  <button id="sex-boy" className={sex === "boy" ? "active" : ""} data-sex="boy" onClick={() => setSex("boy")}>남아</button>
                  <button id="sex-girl" className={sex === "girl" ? "active" : ""} data-sex="girl" onClick={() => setSex("girl")}>여아</button>
                </div>
                <span className="hint">공식: 남아 (엄+부+13)÷2 · 여아 (엄+부−13)÷2 · 범위 ±8.5cm</span>
              </div>
              <div id="predBox" className="box" style={{ marginTop: 10, minHeight: 56 }}>
                {mph ? (
                  <div>
                    <div><strong>예상 성인 키:</strong> {mph.base.toFixed(1)} cm <span className="muted">(범위 {mph.low.toFixed(1)} ~ {mph.high.toFixed(1)} cm)</span></div>
                    <div className="hint" style={{ marginTop: 6 }}>* 영양, 수면, 운동, 건강, 사춘기 시기 등으로 오차가 발생할 수 있어요.</div>
                  </div>
                ) : (
                  "부모 키와 성별을 입력하면 예측이 표시됩니다."
                )}
              </div>
            </details>

            <div style={{ marginTop: 14 }} className="row">
              <button className="btn" onClick={onExport}>JSON 내보내기</button>
              <label className="btn">JSON 불러오기
                <input type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => onImport(e.target.files?.[0])} />
              </label>
              <button className="btn" onClick={onClear}>전체 초기화</button>
            </div>
          </div>

          {/* 표 */}
          <div className="card">
            <h3>기록표</h3>
            <div className="table-responsive">
              <table className="record-table" aria-describedby="표 설명">
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>날짜</th>
                    <th>체중(kg)</th>
                    <th>키(cm)</th>
                    <th>머리둘레(cm)</th>
                    <th style={{ width: 80 }}>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRowsDesc.map((r, i) => (
                    <tr key={`${r.date}-${i}`}>
                      <td>{r.date}</td>
                      <td>{fmt(r.weight)}</td>
                      <td>{fmt(r.height, 1)}</td>
                      <td>{fmt(r.head, 1)}</td>
                      <td>
                        <button className="btn" onClick={() => onDelete(i)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="hint" style={{marginTop: '8px'}}>* 최근 날짜가 위에 오도록 정렬됩니다.</div>
          </div>
        </section>
    </div>
  );
}

const css = `
.growth-page .grid { display: grid; gap: 16px; }
@media (min-width:900px) { .growth-page .grid { grid-template-columns: 1.2fr .8fr; } }
.growth-page .row { display: flex; gap: 8px; flex-wrap: wrap; }
.growth-page .input { width: 100%; }
`;
