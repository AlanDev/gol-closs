export default function Credito({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-xs text-tenue ${className}`}>
      Desarrollado por{" "}
      <a
        href="https://www.linkedin.com/in/alan-quenardelle-aaa63b268/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-texto underline underline-offset-2 hover:text-cesped"
      >
        Alan Quenardelle
      </a>
    </p>
  );
}
