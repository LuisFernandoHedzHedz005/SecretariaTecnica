const { query, pool } = require('./conexion'); 

const verificarAdministrador = async (usuario, contrasena) => {
    try {
        console.log(`Verificando administrador: ${usuario}`);
        // Ajustar la consulta según tu estructura de base de datos
        const sqlQuery = `
            SELECT * FROM usuario_app 
            WHERE usuario = $1 
            AND contrasena = $2 
            AND activo = true
            AND rol_id = 1`;
        
        const resultado = await query(sqlQuery, [usuario, contrasena]);
        console.log('Resultado de verificación:', resultado);
        
        // Verificar si se encontró un usuario
        if (resultado && resultado.length > 0) {
            return resultado[0]; // Devolver los datos del administrador
        } else {
            return null; // No se encontró ningún administrador con esas credenciales
        }
    } catch (error) {
        console.error('Error en verificarAdministrador:', error);
        throw error;
    }
};

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

async function verificarVisitante(usuario, contrasena) {
    try {
        const rows = await query('SELECT * FROM usuario_app WHERE usuario = $1 AND contrasena = $2 AND rol_id = 2 AND activo = TRUE', [usuario, contrasena]);
        console.log('Resultado de verificación:', rows);
        if(rows && rows.length > 0) {
            return rows[0];
        }
        return null;
    } catch (error) {
        console.error('Error al verificar visitante:', error);
        return null;
    }
}

async function verificarContrasenaVisitante(usuario, contrasena) {
    try {
        const visitante = await verificarVisitante(usuario, contrasena);
        console.log('Visitante encontrado:', visitante);
        return visitante !== null;
    } catch (error) {
        console.error('Error al verificar contraseña:', error);
        return false;
    }
}

module.exports = {
    verificarAdministrador,
    verificarContrasenaAdmin,
    verificarVisitante,
    verificarContrasenaVisitante
};