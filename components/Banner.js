export default function Banner({ title, subtitle, imageUrl }) {
  return (
    <div className="relative w-full max-h-[70vh]">
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70 flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl sm:text-4xl md:text-6xl text-white font-bold text-center">
          {title}
        </h1>
        <p className="mt-2 sm:mt-4 text-white text-base sm:text-lg md:text-2xl text-center">
          {subtitle}
        </p>
      </div>
    </div>
  );
}