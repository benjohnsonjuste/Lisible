export default function Banner({ title, subtitle, imageUrl }) {
  return (
    <div className="relative w-full h-[60vh] md:h-[70vh]">
      <img
        src={imageUrl}
        alt={title}
        className="object-cover w-full h-full"
      />
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-6xl text-white font-bold">{title}</h1>
        {subtitle && <p className="mt-4 text-lg md:text-2xl text-white">{subtitle}</p>}
      </div>
    </div>
  );
}