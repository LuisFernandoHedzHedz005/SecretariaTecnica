const { verificarAdministrador } = require('../config/querys');
const session = require('express-session');

// Función para mostrar el formulario de login
const mostrarFormularioLogin = (req, res) => {
    // Verificar si ya hay una sesión activa
    if (req.session && req.session.administrador) {
        return res.redirect('/administradorhome'); // Redirigir a la pagina buena 
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
        const { username, password } = req.body;
        if (!username || !password) {
            req.session.errorMsg = 'Por favor introduce usuario y contraseña';
            return res.redirect('/administradorLogin');
        }
        
        // Verificar las credenciales
        const admin = await verificarAdministrador(username, password);
        
        if (admin) {
            // Aqui guardamos los datos
            req.session.administrador = {
                id: admin.usuario_id,
                usuario: admin.usuario,
                correo: admin.correo,
                rol: admin.rol_id
            };

            return res.redirect('/administradorhome');
        } else {
            // Credenciales inválidas
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
    if (req.session && req.session.administrador) {
        return next();
    } else {
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