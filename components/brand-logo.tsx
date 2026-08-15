import Image from "next/image";

export function BrandLogo({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      className={`brand-logo ${className}`.trim()}
      src="/libang-libu-logo.png"
      alt="Libang Libu Travel"
      width={1055}
      height={509}
      priority={priority}
    />
  );
}
