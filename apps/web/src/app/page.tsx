export default function HomePage() {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }}>BigTank</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--color-text-light)', marginTop: '0.5rem' }}>
          Chaussures grandes tailles au Sénégal
        </p>
        <p style={{ color: 'var(--color-accent)', marginTop: '0.25rem' }}>EU 46+ / US 12+</p>
      </header>

      <section style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-white)', borderRadius: '12px' }}>
        <h2>Bientôt disponible</h2>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-light)' }}>
          La marketplace N°1 pour acheter et vendre des chaussures grandes tailles au Sénégal.
        </p>
        <p style={{ marginTop: '0.5rem', color: 'var(--color-text-light)' }}>
          Paiement par Wave, Orange Money et Free Money.
        </p>
      </section>
    </main>
  );
}
