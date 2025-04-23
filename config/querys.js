const { query, pool } = require('./conexion'); 

async function verificarAdministrador(usuario, contrasena) {
    console.log('Usuario recibido:', usuario);
    try {
        const rows = await query('SELECT * FROM usuario_app WHERE usuario = ? AND contrasena = ? AND rol_id = 1 AND activo = TRUE', [usuario, contrasena]);
        console.log('Resultado de verificación:', rows);
        if(rows && rows.length > 0) {
            return rows[0];
        }
        return null;
    } catch (error) {
        console.error('Error al verificar administrador:', error);
        return null;
    }
}

async function verificarContrasenaAdmin(usuario, contrasena) {
    try {
        const admin = await verificarAdministrador(usuario, contrasena);
        console.log('Administrador encontrado:', admin);
        return admin !== null;
    } catch (error) {
        console.error('Error al verificar contraseña:', error);
        return false;
    }
}

module.exports = {
    verificarAdministrador,
    verificarContrasenaAdmin
};