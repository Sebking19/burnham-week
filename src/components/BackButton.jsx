import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
      aria-label="Go back"
      className="w-11 h-11 -ml-2 rounded-lg flex items-center justify-center text-[#1B2A5B] hover:bg-[#4C7CF0]/10 shrink-0"
    >
      <ChevronLeft size={30} />
    </button>
  );
}