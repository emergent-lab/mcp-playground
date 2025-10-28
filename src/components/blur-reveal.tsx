import styles from "./blur-reveal.module.css";

const DEFAULT_BLUR = 10;
const DEFAULT_DURATION = 2000;

type BlurRevealProps = {
  children: React.ReactNode;
  blur?: number;
  duration?: number;
};

export function BlurReveal({
  children,
  duration = DEFAULT_DURATION,
  blur = DEFAULT_BLUR,
}: BlurRevealProps) {
  return (
    <div
      className={styles.root}
      style={
        {
          "--duration-clip": `${duration}ms`,
          "--duration": `${duration + duration / 2}ms`,
          "--blur": `${blur}px`,
        } as React.CSSProperties
      }
    >
      <div className={styles.banner}>{children}</div>
      <Effects />
    </div>
  );
}

function Effects() {
  return (
    <div
      className="-ml-8 absolute inset-0 grid"
      style={{ placeItems: "center center" }}
    >
      <div aria-hidden className={styles.blur} style={{ gridArea: "1 / 1" }} />
      <svg className={styles.noise} style={{ gridArea: "1 / 1" }}>
        <filter id="noise">
          <feTurbulence
            baseFrequency="1"
            numOctaves="4"
            stitchTiles="stitch"
            type="fractalNoise"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect filter="url(#noise)" height="100%" width="100%" />
      </svg>
    </div>
  );
}
