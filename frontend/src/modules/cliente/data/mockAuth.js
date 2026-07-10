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
      redirectPath: "/owner-finanzas" // O la ruta que maneje el owner en tu App.jsx
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
    error: "Credenciales incorrectas. Usa cliente@test.com o owner@test.com con clave 123" 
  };
};