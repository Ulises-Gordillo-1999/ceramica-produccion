import { SignJWT } from 'jose';

async function testFullProduction() {
  const baseUrl = 'https://ceramica.upgrade-informatica.com';
  const jwtSecret = '0cf5eb7b649f6017657cc45726e8b56a3603596cedae839817fd15f90bfb9743';
  const secretBytes = new TextEncoder().encode(jwtSecret);

  console.log('🚀 === DIAGNÓSTICO EN VIVO DE PRODUCCIÓN ===');
  console.log('URL Base:', baseUrl);

  // 1. Crear un token JWT firmado de prueba con rol ADMIN
  const token = await new SignJWT({
    id: 1,
    name: 'Administrador General',
    username: 'admin',
    email: 'admin@ceramica-planta.com',
    role: 'ADMIN',
    defaultShift: 'MANANA',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretBytes);

  console.log('🔑 Token JWT firmado generado correctamente.');

  // 2. Rutas protegidas a evaluar
  const protectedRoutes = [
    { path: '/dashboard', label: 'Dashboard de Control en Vivo' },
    { path: '/capataz', label: 'Planilla de Carga de Planta (Mobile First)' },
    { path: '/catalogo', label: 'Catálogo de Ladrillos y Pesos' },
    { path: '/usuarios', label: 'Gestión de Usuarios RBAC' },
    { path: '/estadisticas', label: 'Estadísticas y Comparativas Térmicas' },
  ];

  for (const r of protectedRoutes) {
    try {
      const res = await fetch(`${baseUrl}${r.path}`, {
        headers: {
          Cookie: `ceramica_prod_session=${token}`,
        },
        redirect: 'manual',
      });

      if (res.status === 200) {
        const html = await res.text();
        console.log(`✅ [HTTP 200 OK] ${r.label} (${r.path}) - ${html.length} bytes recibidos`);
      } else if (res.status === 307 || res.status === 302) {
        console.log(`⚠️ [HTTP ${res.status} Redirect] ${r.label} -> Location: ${res.headers.get('location')}`);
      } else {
        console.log(`❌ [HTTP ${res.status}] ${r.label}`);
      }
    } catch (e) {
      console.error(`❌ [ERROR de Red] ${r.path}:`, e.message);
    }
  }

  // 3. Probar sin token (debe redirigir a /login)
  console.log('\n🛡️ Verificando protección del Middleware RBAC (acceso no autenticado):');
  const anonRes = await fetch(`${baseUrl}/dashboard`, { redirect: 'manual' });
  console.log(`   /dashboard sin sesión -> HTTP ${anonRes.status} (Esperado: 307) - Location: ${anonRes.headers.get('location')}`);

  console.log('\n🏁 === FIN DEL DIAGNÓSTICO EN VIVO ===');
}

testFullProduction();
