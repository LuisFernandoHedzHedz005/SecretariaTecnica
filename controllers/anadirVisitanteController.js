const { query } = require('../config/conexion');

// Función para mostrar el formulario de añadir visitante
const mostrarFormulario = (req, res) => {
  try {
    res.render('anadirVisitante', {
      administrador: req.session.administrador
    });
  } catch (error) {
    console.error('Error al mostrar formulario de visitante:', error);
    res.status(500).render('error', {
      message: 'Error al cargar el formulario',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
    });
  }
};

// Función para guardar un nuevo visitante
const guardarVisitante = async (req, res) => {
    try {
      const { usuario, contrasena, correo } = req.body;
      
      // Validaciones básicas
      if (!usuario || !contrasena || !correo) {
        return res.status(400).render('anadirVisitante', { 
          administrador: req.session.administrador,
          error: 'Todos los campos son obligatorios',
          formData: req.body
        });
      }
      
      // Verificar si el usuario ya existe
      const existeUsuario = await query('SELECT usuario_id FROM usuario_app WHERE usuario = $1', [usuario]);
      if (existeUsuario.length > 0) {
        return res.status(400).render('anadirVisitante', { 
          administrador: req.session.administrador,
          error: 'El nombre de usuario ya está en uso',
          formData: req.body
        });
      }
      
      // Verificar si el correo ya existe
      const existeCorreo = await query('SELECT usuario_id FROM usuario_app WHERE correo = $1', [correo]);
      if (existeCorreo.length > 0) {
        return res.status(400).render('anadirVisitante', { 
          administrador: req.session.administrador,
          error: 'El correo electrónico ya está en uso',
          formData: req.body
        });
      }
      
      // Obtener el ID del rol 'visitante'
      const rolResult = await query('SELECT rol_id FROM rol WHERE nombre_rol = $1', ['visitante']);
      if (rolResult.length === 0) {
        return res.status(500).render('anadirVisitante', { 
          administrador: req.session.administrador,
          error: 'Error al obtener el rol de visitante',
          formData: req.body
        });
      }
      
      const rolId = rolResult[0].rol_id;
      
      // Insertar el nuevo visitante
      const sqlInsert = `
        INSERT INTO usuario_app (usuario, contrasena, correo, rol_id, fecha_creacion, activo)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, TRUE)
        RETURNING usuario_id
      `;
      
      const result = await query(sqlInsert, [usuario, contrasena, correo, rolId]);
      
      if (result.length > 0) {
        // Redirigir a la página de inicio del administrador con un mensaje de éxito
        return res.redirect('/administradorhome?success=true&message=' + encodeURIComponent(`Visitante ${usuario} creado correctamente`));
      } else {
        throw new Error('No se pudo crear el visitante');
      }
    } catch (error) {
      console.error('Error al guardar visitante:', error);
      res.status(500).render('anadirVisitante', { 
        administrador: req.session.administrador,
        error: 'Error al guardar el visitante: ' + (error.message || 'Error desconocido'),
        formData: req.body
      });
    }
  };

module.exports = {
  mostrarFormulario,
  guardarVisitante
};