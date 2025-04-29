const { verificarAdministrador } = require('../config/querys');

// Función para mostrar el formulario de login
const mostrarFormularioLogin = (req, res) => {
    // Verificar si ya hay una sesión activa
    if (req.session && req.session.administrador) {
        return res.redirect('/administradorhome');
    }
    
    // Pasar mensaje de error si existe
    const errorMsg = req.session.errorMsg || '';
    // Limpiar mensaje de error después de usarlo
    req.session.errorMsg = '';
    
    res.render('administradorLogin', { errorMsg });
};

// Función para procesar el login
const procesarLogin = async (req, res) => {
    try {
        const username = req.body.username || req.body.usuario; 
        const password = req.body.password || req.body.contrasena;
        
        console.log('Datos recibidos para login:', { username });
        console.log('Nombres de los campos en req.body:', Object.keys(req.body));
        
        if (!username || !password) {
            req.session.errorMsg = 'Por favor introduce usuario y contraseña';
            return res.redirect('/administradorLogin');
        }
        
        // Verificar las credenciales
        const admin = await verificarAdministrador(username, password);
        console.log('Resultado verificación admin:', admin ? 'Autenticado' : 'No autenticado');
        
        if (admin) {
            // Aqui guardamos los datos en sesión
            req.session.administrador = {
                id: admin.usuario_id,
                usuario: admin.usuario,
                correo: admin.correo,
                rol: admin.rol_id
            };

            console.log('Datos de administrador guardados en sesión:', req.session.administrador);

            // Asegurarnos de que la sesión se guarde antes de redirigir
            req.session.save((err) => {
                if (err) {
                    console.error('Error al guardar la sesión:', err);
                    req.session.errorMsg = 'Error interno, por favor intenta nuevamente';
                    return res.redirect('/administradorLogin');
                }
                
                console.log('Sesión guardada correctamente, redirigiendo a administradorhome');
                console.log('Datos completos de la sesión:', req.session);
                return res.redirect('/administradorhome');
            });
        } else {
            // Credenciales inválidas
            console.log('Credenciales inválidas');
            req.session.errorMsg = 'Usuario o contraseña incorrectos';
            return res.redirect('/administradorLogin');
        }
    } catch (error) {
        console.error('Error en el login:', error);
        req.session.errorMsg = 'Error al procesar la solicitud';
        return res.redirect('/administradorLogin');
    }
};

// Función para cerrar sesión
const cerrarSesion = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/');
    });
};

// Middleware para verificar si el usuario está autenticado
const verificarAutenticacion = (req, res, next) => {
    console.log('Verificando autenticación, datos de sesión:', req.session);
    if (req.session && req.session.administrador) {
        console.log('Usuario autenticado:', req.session.administrador.usuario);
        return next();
    } else {
        console.log('Usuario no autenticado, redirigiendo a login');
        req.session.errorMsg = 'Debes iniciar sesión para acceder';
        return res.redirect('/administradorLogin');
    }
};

module.exports = {
    mostrarFormularioLogin,
    procesarLogin,
    cerrarSesion,
    verificarAutenticacion
};