export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // No ejecutar durante la fase de compilación estática si la base de datos no está disponible
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return;
    }

    if (!process.env.DATABASE_URL) {
      return;
    }

    try {
      const { ensureDatabaseSeeded } = await import('@/db/autoSeed');
      await ensureDatabaseSeeded();
    } catch (err) {
      console.warn('⚠️ [INSTRUMENTATION] Auto-seed en inicio del servidor:', err);
    }
  }
}
