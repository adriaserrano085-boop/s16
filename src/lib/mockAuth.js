export const signIn = async (email, password) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (!email || !password) {
                resolve({ error: { message: 'Por favor, introduce correo y contraseña.' } });
                return;
            }

            // Mock user logic based on email
            let role = 'jugador';
            if (email.includes('staff')) role = 'staff';
            if (email.includes('familia')) role = 'familia';
            if (email.includes('admin')) role = 'admin';

            // Simulating succesful login
            resolve({
                data: {
                    user: {
                        id: 'mock-user-id',
                        email,
                        role,
                    },
                },
                error: null,
            });
        }, 1000); // Simulate network delay
    });
};
