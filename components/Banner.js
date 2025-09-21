export default function Banner({ title, subtitle, imageUrl }) {
  return (
    <div className="relative w-full h-[70vh]">
      <img
        src={imageUrl}
        alt={title}
        className="object-cover w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80 flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-6xl text-white font-bold text-center px-4">
          {title}
        </h1>
        <p className="text-white text-lg md:text-2xl mt-4 text-center px-4">
          {subtitle}
        </p>
      </div>
    </div>
  );
}