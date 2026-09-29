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
      <span className="estada-mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="estada-icon" src="/estada-icon.svg" alt="" width={237} height={226} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="estada-logo" src="/estada-logo.svg" alt="" width={151} height={21} />
      </span>
    </a>
  );
}
