const { query } = require('../config/conexion');

const obtenerAsignatura = async () => {
  try {
    const sql = `
      SELECT 
      a.asignatura_id,
      a.nombre
      FROM
      asignatura a
      ORDER BY a.nombre ASC
    `;
    
    const asignaturas = await query(sql);
    return asignaturas;
  } catch (error) {
    console.error('Error al obtener asignaturas:', error);
    throw error;
  }
};

const mostrarTabla = async (req, res) => {
  try {
    const asignatura = await obtenerAsignatura();
    
    // Obtener mensaje de éxito si existe
    const success = req.query.success === 'true';
    const message = req.query.message || '';
    
    res.render('asignaturaHome', { 
      administrador: req.session.administrador,
      asignatura: asignatura,
      busqueda: '',
      success: success,
      message: message
    });
  } catch (error) {
    console.error('Error al mostrar dashboard:', error);
    res.status(500).render('error', { 
      message: 'Error al cargar la información',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
    });
  }
};

// Nueva función para añadir una asignatura
const anadirAsignatura = async (req, res) => {
  try {
    const { nombre } = req.body;

    // Validar que el nombre no esté vacío
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la asignatura es obligatorio'
      });
    }

    // Insertar la nueva asignatura
    const sql = `
      INSERT INTO asignatura (nombre)
      VALUES ($1)
      RETURNING asignatura_id
    `;

    const result = await query(sql, [nombre.trim()]);
    
    if (result && result.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Asignatura añadida correctamente',
        asignatura_id: result[0].asignatura_id,
        nombre: nombre
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Error al añadir la asignatura'
      });
    }
  } catch (error) {
    console.error('Error al añadir asignatura:', error);
    
    // Manejar error de duplicado (código UNIQUE_VIOLATION en PostgreSQL)
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una asignatura con ese nombre'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud'
    });
  }
};

// Nueva función para eliminar una asignatura
const eliminarAsignatura = async (req, res) => {
  try {
    const asignaturaId = req.params.id;

    // Validar que se proporcione un ID válido
    if (!asignaturaId || isNaN(parseInt(asignaturaId))) {
      return res.status(400).json({
        success: false,
        message: 'ID de asignatura no válido'
      });
    }

    // Eliminar la asignatura
    const sql = `
      DELETE FROM asignatura
      WHERE asignatura_id = $1
      RETURNING nombre
    `;

    const result = await query(sql, [asignaturaId]);
    
    if (result && result.length > 0) {
      return res.status(200).json({
        success: true,
        message: `La asignatura "${result[0].nombre}" ha sido eliminada correctamente`
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'No se encontró la asignatura especificada'
      });
    }
  } catch (error) {
    console.error('Error al eliminar asignatura:', error);
    
    // Manejar errores de integridad referencial (cuando la asignatura está siendo utilizada)
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar esta asignatura porque está siendo utilizada en el sistema'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud'
    });
  }
};

module.exports = {
  mostrarTabla,
  obtenerAsignatura,
  anadirAsignatura,
  eliminarAsignatura
};