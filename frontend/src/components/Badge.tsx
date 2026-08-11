interface BadgeProps {
  text: string;
  color: "green" | "yellow" | "red" | "blue" | "gray";
}

const colorClasses: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-slate-100 text-slate-600",
};

export default function Badge({ text, color }: BadgeProps) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorClasses[color]}`}>
      {text}
    </span>
  );
}