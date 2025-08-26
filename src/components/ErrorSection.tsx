type ErrorSectionProps = {
  error: string;
  cooldown: number | undefined;
  onLoginClick: () => void;
};

function ErrorSection({ error, cooldown, onLoginClick }: ErrorSectionProps) {
  return (
    <div className={`flex flex-col ${error.startsWith("To continue using") ? "gap-8" : "gap-2"}`}>
      <p className="text-2xl/10 text-center whitespace-pre-line px-4 md:px-0">{error}</p>

      {error.startsWith("To continue using") && (
        <button
          onClick={onLoginClick}
          className="hover:bg-[var(--hover-2)] border border-[var(--border)] rounded-full h-12 flex items-center justify-center"
        >
          Login
        </button>
      )}

      {(cooldown && cooldown > 0) && (
        <p className="text-2xl/10 text-center whitespace-pre-line px-4 md:px-0">
          Try again in 0:{String(cooldown).padStart(2, "0")} 🙏
        </p>
      )}
    </div>
  );
}

export default ErrorSection;
