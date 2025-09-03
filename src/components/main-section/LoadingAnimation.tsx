"use client"

function LoadingAnimation() {
  return (
    <>
      <div className="flex justify-center items-end gap-3 h-7 mt-4">
        <span className="dot" role="presentation" />
        <span className="dot delay-150" />
        <span className="dot delay-300" />
      </div>
      <style jsx>{`
        .dot {
          width: 1rem;
          height: 1rem;
          background-color: rgb(156 156 156);
          border-radius: 9999px;
          animation: bounce 1s infinite ease-in-out;
        }
        .delay-150 {
          animation-delay: 0.15s;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </>
  );
}

export default LoadingAnimation;
