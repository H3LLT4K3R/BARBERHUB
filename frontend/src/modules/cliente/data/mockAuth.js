// frontend/src/modules/cliente/data/mockAuth.js

export const authenticateUser = (email, password) => {
  // Base de datos simulada
  const MOCK_USERS = [
    {
      email: "cliente@test.com",
      password: "123",
      role: "cliente",
      nombre: "Luis Méndez",
      redirectPath: "/explorar"  
    },
    {
      email: "owner@test.com",
      password: "123",
      role: "owner",
      nombre: "Dueño Barbería",
      redirectPath: "/owner-finanzas" 
    },
    // NUEVO: Cuenta de Barbero
    {
      email: "barbero@test.com",
      password: "123",
      role: "barbero",
      nombre: "Barbero Principal",
      redirectPath: "/barbero/inicio" // Coincide con tu BarberoLayout
    }
  ];

  const user = MOCK_USERS.find(u => u.email === email && u.password === password);

  if (user) {
    return {
      success: true,
      // Simulamos la respuesta de tu backend real
      data: {
        token: "mock-jwt-token-12345", 
        user: { 
          email: user.email, 
          nombre: user.nombre, 
          role: user.role 
        }
      },
      redirect: user.redirectPath
    };
  }

  return { 
    success: false, 
    // Actualizamos también el mensaje de error para incluir al barbero
    error: "Credenciales incorrectas. Usa cliente@test.com, owner@test.com o barbero@test.com con clave 123" 
  };
};