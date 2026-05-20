import { ImageOff } from "lucide-react";

type Props = {
  className?: string;
  text?: string;
};

export default function BildPlatshallare({ className = "", text = "Bild kommer snart" }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
      style={{
        background: "linear-gradient(135deg, #e8f5ee 0%, rgba(45,122,79,0.35) 100%)",
      }}
    >
      <ImageOff className="w-8 h-8 text-[#2D7A4F] opacity-50" />
      <p className="text-xs text-[#2D7A4F] opacity-60 font-medium">{text}</p>
    </div>
  );
}
