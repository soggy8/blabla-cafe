export function PoweredBy() {
  return (
    <a
      className="powered-by"
      href="https://estada.dev"
      target="_blank"
      rel="noopener"
      aria-label="Powered by ESTADA"
    >
      <span>Powered by</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="estada-logo" src="/estada-logo.svg" alt="" width={151} height={21} />
    </a>
  );
}
