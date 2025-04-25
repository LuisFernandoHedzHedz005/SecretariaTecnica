const {verificarVisitante} = require('../config/querys');
const session = require('express-session');

// Función para mostrar el formulario de login
const mostrarFormularioLogin = (req, res) => {
    // Verificar si ya hay una sesión activa
    if (req.session && req.session.visitante) {
        return res.redirect('/visitantehome'); 
    }
    // Pasar mensaje de error si existe
    const errorMsg = req.session.errorMsg || '';
    // Limpiar mensaje de error después de usarlo
    req.session.errorMsg = '';
    
    res.render('visitanteLogin', { errorMsg });
};

// Función para procesar el login
const procesarLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            req.session.errorMsg = 'Por favor introduce usuario y contraseña';
            return res.redirect('/visitanteLogin');
        }
        
        // Verificar las credenciales
        const visitante= await verificarVisitante(username, password);
        
        if (visitante) {
            // Aqui guardamos los datos
            req.session.visitante = {
                id: visitante.usuario_id,
                usuario: visitante.usuario,
                correo: visitante.correo,
                rol: visitante.rol_id
            };

            return res.redirect('/visitantehome');
        } else {
            // Credenciales inválidas
            req.session.errorMsg = 'Usuario o contraseña incorrectos';
            return res.redirect('/visitanteLogin');
        }
    } catch (error) {
        console.error('Error en el login:', error);
        req.session.errorMsg = 'Error al procesar la solicitud';
        return res.redirect('/visitanteLogin');
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
const verificarAutenticacionV = (req, res, next) => {
    if (req.session && req.session.visitante) {
        return next();
    } else {
        req.session.errorMsg = 'Debes iniciar sesión para acceder';
        return res.redirect('/visitanteLogin');
    }
};

module.exports = {
    mostrarFormularioLogin,
    procesarLogin,
    cerrarSesion,
    verificarAutenticacionV
};