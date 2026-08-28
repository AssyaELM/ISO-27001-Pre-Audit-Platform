import Image from "next/image";
import type { CSSProperties } from "react";
import styles from "./normcore-logo.module.css";

type NormCoreLogoProps = {
  width?: number;
  height?: number;
  alt?: string;
  priority?: boolean;
  className?: string;
};

export function NormCoreLogo({ width = 180, height = 49, alt = "NormCore", priority = false, className = "" }: NormCoreLogoProps) {
  return (
    <span
      className={`${styles.frame} ${className}`.trim()}
      style={{ "--logo-width": `${width}px`, "--logo-height": `${height}px` } as CSSProperties}
    >
      <Image className={styles.image} src="/images/normcore-logo.png" width={width} height={height} alt={alt} priority={priority} />
    </span>
  );
}
