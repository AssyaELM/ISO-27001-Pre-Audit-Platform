type MockupCropProps = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
  alt?: string;
  priority?: boolean;
};

export function MockupCrop({ src, x, y, width, height, className = "", alt = "", priority = false }: MockupCropProps) {
  return (
    <span
      className={`mockup-crop ${className}`.trim()}
      style={{ aspectRatio: `${width} / ${height}` }}
      aria-hidden={alt ? undefined : true}
    >
      {/* This approved raster sprite must preserve its exact pixels and crop coordinates. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        fetchPriority={priority ? "high" : "auto"}
        draggable={false}
        style={{
          width: `${(1586 / width) * 100}%`,
          maxWidth: "none",
          height: "auto",
          left: `${(-x / width) * 100}%`,
          top: `${(-y / height) * 100}%`,
        }}
      />
    </span>
  );
}
