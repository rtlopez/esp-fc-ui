
type RcControlsProps = {
  w: number,
  h: number,
  px: number,
  py: number,
  pr: number,
}

const scale = (width: number, pos: number, rad: number, sw: number) => {
  pos = (Math.max(-1, Math.min(1, pos)) + 1) * 0.5
  return ((width - 2 * (rad + sw)) * pos) + rad + sw
}

const RcControls: React.FC<RcControlsProps> = ({ w, h, px, py, pr }) => {
  const sw = 3
  const x = scale(w, px, pr, sw)
  const y = scale(h, -py, pr, sw)
  return (
    <svg width={w} height={h}>
      <rect
        x="0"
        y="0"
        width={w}
        height={h}
        fill="none"
        stroke="#ccc"
      />
      <circle
        cx={x}
        cy={y}
        r={pr}
        fill="none"
        stroke="#fc9d3e"
        strokeWidth={sw}
      />
    </svg>
  );
};

export default RcControls;
