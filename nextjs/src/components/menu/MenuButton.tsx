interface MenuButtonProps {
  id?: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const MenuButton = ({ id, label, icon, onClick, className }: MenuButtonProps) => {
  return (
    <button
      id={id}
      aria-label={label}
      onClick={onClick}
      className={`w-full h-16 bg-[var(--bg-2)] rounded-xl px-6 flex items-center hover-1 shrink-0 ${className || ""}`}
    >
      {icon}
      <span className="pl-6 text-xl">{label}</span>
    </button>
  );
};

export default MenuButton;
