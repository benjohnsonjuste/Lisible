export default function AppIcon({ src, alt, size = 32 }) {
  return (
    <img src={src} alt={alt} width={size} height={size} className="inline-block" />
  );
}
