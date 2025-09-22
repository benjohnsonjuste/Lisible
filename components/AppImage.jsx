export default function AppImage({ src, alt, className }) {
  return (
    <img src={src} alt={alt} className={`rounded shadow ${className}`} />
  );
}
