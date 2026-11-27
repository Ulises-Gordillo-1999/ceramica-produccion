import { runAutoSeed } from './autoSeed';

async function seed() {
  console.log('🌱 Iniciando seed y migración de Cerámica Producción (2 Turnos: Mañana y Tarde)...');
  const res = await runAutoSeed();
  if (!res.success) {
    console.error('❌ Error en seed:', res.message);
    process.exit(1);
  }
  console.log(`✅ ${res.message}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error ejecutando seed:', err);
  process.exit(1);
});
