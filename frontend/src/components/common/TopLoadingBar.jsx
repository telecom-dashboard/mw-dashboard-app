import { useLoading } from "../../context/LoadingContext";

function TopLoadingBar() {
  const { isLoading } = useLoading();

  return (
    <div
      style={{
        ...barWrap,
        opacity: isLoading ? 1 : 0,
      }}
    >
      <div style={barTrack}>
        <div style={barInner} />
      </div>
    </div>
  );
}

const barWrap = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: 3,
  overflow: "hidden",
  pointerEvents: "none",
  transition: "opacity 0.25s ease",
};

const barTrack = {
  width: "100%",
  height: "100%",
  background: "transparent",
};

const barInner = {
  width: "30%",
  height: "100%",
  background: "linear-gradient(90deg, #38bdf8, #2563eb)",
  borderRadius: 999,
  boxShadow: "0 0 8px rgba(37,99,235,0.45)",
  animation: "topLoadingSlide 1s ease-in-out infinite",
};

export default TopLoadingBar;