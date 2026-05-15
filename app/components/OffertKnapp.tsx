"use client";
import { useState } from "react";
import OffertModal from "@/app/components/OffertModal";

type Props = {
  label?: string;
  variant?: "primary" | "outline" | "small";
};

export default function OffertKnapp({ label = "Få offert", variant = "primary" }: Props) {
  const [open, setOpen] = useState(false);

  const className =
    variant === "outline"
      ? "inline-block border border-gray-200 text-[#1a1a1a] text-sm font-medium px-6 py-2.5 rounded-full hover:border-[#2D7A4F] transition-colors w-full text-center"
      : variant === "small"
      ? "inline-block bg-[#2D7A4F] text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[#225f3d] transition-colors"
      : "inline-block bg-[#2D7A4F] text-white text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-[#225f3d] transition-colors w-full text-center";

  return (
    <>
      <OffertModal open={open} onClose={() => setOpen(false)} />
      <button onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
    </>
  );
}
