const { query } = require('../config/conexion');

// Función para obtener todos los profesores con información completa
const obtenerProfesores = async () => {
  try {
    const sql = `
      SELECT 
        p.profesor_id,
        p.numero_trabajador,
        p.nombre,
        p.apellido_paterno,
        p.apellido_materno,
        g.descripcion AS genero,
        p.rfc,
        p.curp,
        ga.descripcion AS grado_academico,
        p.antiguedad_unam,
        p.antiguedad_carrera,
        p.correo_institucional,
        p.telefono_casa,
        p.telefono_celular,
        p.direccion,
        ep.descripcion AS estado
      FROM 
        profesor p
        JOIN genero g ON p.genero_id = g.genero_id
        JOIN grado_academico ga ON p.grado_id = ga.grado_id
        JOIN estado_profesor ep ON p.estado_id = ep.estado_id
      ORDER BY p.apellido_paterno, p.apellido_materno, p.nombre
    `;
    
    const profesores = await query(sql);
    return profesores;
  } catch (error) {
    console.error('Error al obtener profesores:', error);
    throw error;
  }
};

// Función para obtener las categorías de un profesor
const obtenerCategoriasPorProfesor = async (profesorId) => {
  try {
    const sql = `
      SELECT 
        cp.categoria_id,
        p.descripcion AS puesto,
        a.nombre AS asignatura,
        TO_CHAR(cp.fecha_inicio, 'DD/MM/YYYY') AS fecha_inicio,
        TO_CHAR(cp.fecha_fin, 'DD/MM/YYYY') AS fecha_fin
      FROM 
        categoria_profesor cp
        JOIN puesto p ON cp.puesto_id = p.puesto_id
        JOIN asignatura a ON cp.asignatura_id = a.asignatura_id
      WHERE 
        cp.profesor_id = $1
      ORDER BY cp.fecha_inicio DESC
    `;
    
    const categorias = await query(sql, [profesorId]);
    return categorias;
  } catch (error) {
    console.error(`Error al obtener categorías del profesor ${profesorId}:`, error);
    throw error;
  }
};

// Función para mostrar la página principal del visitante con la tabla de profesores
const mostrarTabla = async (req, res) => {
  try {
    const profesores = await obtenerProfesores();
    
    // Para cada profesor, obtenemos sus categorías
    for (const profesor of profesores) {
      profesor.categorias = await obtenerCategoriasPorProfesor(profesor.profesor_id);
    }
    
    res.render('visitantehome', { 
      visitante: req.session.visitante,
      profesores: profesores
    });
  } catch (error) {
    console.error('Error al mostrar la Tabla:', error);
    res.status(500).render('error', { 
      message: 'Error al cargar la información de profesores',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
    });
  }
};

// Ruta para buscar profesores por nombre/apellido
const buscarProfesores = async (req, res) => {
  try {
    const { termino } = req.query;
    
    if (!termino || termino.trim() === '') {
      return res.redirect('/visitantehome');
    }
    
    const sql = `
      SELECT 
        p.profesor_id,
        p.numero_trabajador,
        p.nombre,
        p.apellido_paterno,
        p.apellido_materno,
        g.descripcion AS genero,
        p.rfc,
        p.curp,
        ga.descripcion AS grado_academico,
        p.antiguedad_unam,
        p.antiguedad_carrera,
        p.correo_institucional,
        p.telefono_casa,
        p.telefono_celular,
        p.direccion,
        ep.descripcion AS estado
      FROM 
        profesor p
        JOIN genero g ON p.genero_id = g.genero_id
        JOIN grado_academico ga ON p.grado_id = ga.grado_id
        JOIN estado_profesor ep ON p.estado_id = ep.estado_id
      WHERE 
        p.nombre ILIKE $1 OR 
        p.apellido_paterno ILIKE $1 OR 
        p.apellido_materno ILIKE $1 OR
        p.numero_trabajador ILIKE $1
      ORDER BY p.apellido_paterno, p.apellido_materno, p.nombre
    `;
    
    const searchTerm = `%${termino}%`;
    const profesores = await query(sql, [searchTerm]);
    
    // Para cada profesor, obtenemos sus categorías
    for (const profesor of profesores) {
      profesor.categorias = await obtenerCategoriasPorProfesor(profesor.profesor_id);
    }
    
    res.render('visitantehome', { 
      visitante: req.session.visitante,
      profesores: profesores,
      busqueda: termino
    });
  } catch (error) {
    console.error('Error al buscar profesores:', error);
    res.status(500).render('error', { 
      message: 'Error al buscar profesores',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
    });
  }
};

// Exportar funciones del controlador
module.exports = {
  mostrarTabla,
  buscarProfesores
};