const { query } = require('../config/conexion');
const exceljs = require('exceljs');
const path = require('path');
const fs = require('fs');

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

// Función para buscar profesores por término
const buscarProfesoresPorTermino = async (termino) => {
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
      WHERE 
        p.nombre ILIKE $1 OR 
        p.apellido_paterno ILIKE $1 OR 
        p.apellido_materno ILIKE $1 OR
        p.numero_trabajador ILIKE $1
      ORDER BY p.apellido_paterno, p.apellido_materno, p.nombre
    `;
    
    const searchTerm = `%${termino}%`;
    const profesores = await query(sql, [searchTerm]);
    return profesores;
  } catch (error) {
    console.error('Error al buscar profesores:', error);
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

// Función para mostrar la página principal del administrador con la tabla de profesores
const mostrarDashboard = async (req, res) => {
  try {
    const profesores = await obtenerProfesores();
    
    // Para cada profesor, obtenemos sus categorías
    for (const profesor of profesores) {
      profesor.categorias = await obtenerCategoriasPorProfesor(profesor.profesor_id);
    }
    
    res.render('administradorhome', { 
      administrador: req.session.administrador,
      profesores: profesores,
      busqueda: ''
    });
  } catch (error) {
    console.error('Error al mostrar dashboard:', error);
    res.status(500).render('error', { 
      message: 'Error al cargar la información de profesores',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
    });
  }
};

// Función genérica para generar Excel con datos de profesores
const generarExcelProfesores = async (profesores) => {
  // Para cada profesor, obtenemos sus categorías
  for (const profesor of profesores) {
    profesor.categorias = await obtenerCategoriasPorProfesor(profesor.profesor_id);
  }
  
  // Crear un nuevo libro de Excel
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Profesores');
  
  // Definir las columnas para el encabezado
  worksheet.columns = [
    { header: 'ID', key: 'profesor_id', width: 5 },
    { header: 'No. Trabajador', key: 'numero_trabajador', width: 15 },
    { header: 'Nombre', key: 'nombre_completo', width: 30 },
    { header: 'Género', key: 'genero', width: 10 },
    { header: 'RFC', key: 'rfc', width: 15 },
    { header: 'CURP', key: 'curp', width: 20 },
    { header: 'Grado Académico', key: 'grado_academico', width: 15 },
    { header: 'Antigüedad UNAM', key: 'antiguedad_unam', width: 15 },
    { header: 'Antigüedad Carrera', key: 'antiguedad_carrera', width: 20 },
    { header: 'Correo Institucional', key: 'correo_institucional', width: 30 },
    { header: 'Teléfono Casa', key: 'telefono_casa', width: 15 },
    { header: 'Teléfono Celular', key: 'telefono_celular', width: 15 },
    { header: 'Dirección', key: 'direccion', width: 40 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Categorías', key: 'categorias_texto', width: 50 }
  ];
  
  // Estilo para el encabezado
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };
  
  // Agregar datos de profesores
  profesores.forEach(profesor => {
    // Crear un texto con las categorías del profesor
    const categoriaTexto = profesor.categorias.map(cat => 
      `${cat.puesto} - ${cat.asignatura} (${cat.fecha_inicio} ${cat.fecha_fin ? ' a ' + cat.fecha_fin : ''})`
    ).join('; ');
    
    // Agregar fila con los datos
    worksheet.addRow({
      profesor_id: profesor.profesor_id,
      numero_trabajador: profesor.numero_trabajador,
      nombre_completo: `${profesor.nombre} ${profesor.apellido_paterno} ${profesor.apellido_materno}`,
      genero: profesor.genero,
      rfc: profesor.rfc,
      curp: profesor.curp,
      grado_academico: profesor.grado_academico,
      antiguedad_unam: profesor.antiguedad_unam,
      antiguedad_carrera: profesor.antiguedad_carrera,
      correo_institucional: profesor.correo_institucional,
      telefono_casa: profesor.telefono_casa,
      telefono_celular: profesor.telefono_celular,
      direccion: profesor.direccion,
      estado: profesor.estado,
      categorias_texto: categoriaTexto
    });
  });

  return workbook;
};

// Función para generar y descargar el Excel con la información de profesores
const descargarExcel = async (req, res) => {
  try {
    let profesores;
    const { termino } = req.query;
    
    if (termino && termino.trim() !== '') {
      // Si hay un término de búsqueda, usamos los datos filtrados
      profesores = await buscarProfesoresPorTermino(termino);
    } else {
      // Si no hay término de búsqueda, obtenemos todos los profesores
      profesores = await obtenerProfesores();
    }
    
    const workbook = await generarExcelProfesores(profesores);
    
    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Guardar archivo
    const excelFilePath = path.join(tempDir, 'profesores.xlsx');
    await workbook.xlsx.writeFile(excelFilePath);
    
    // Enviar archivo al cliente
    res.download(excelFilePath, 'profesores.xlsx', (err) => {
      if (err) {
        console.error('Error al enviar archivo:', err);
      }
      
      // Eliminar archivo temporal después de la descarga
      fs.unlink(excelFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error al eliminar archivo temporal:', unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error('Error al generar Excel:', error);
    res.status(500).send('Error al generar el archivo Excel');
  }
};

// Ruta para buscar profesores por nombre/apellido
const buscarProfesores = async (req, res) => {
  try {
    const { termino } = req.query;
    
    if (!termino || termino.trim() === '') {
      return res.redirect('/administradorhome');
    }
    
    const profesores = await buscarProfesoresPorTermino(termino);
    
    // Para cada profesor, obtenemos sus categorías
    for (const profesor of profesores) {
      profesor.categorias = await obtenerCategoriasPorProfesor(profesor.profesor_id);
    }
    
    res.render('administradorhome', { 
      administrador: req.session.administrador,
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
  mostrarDashboard,
  descargarExcel,
  buscarProfesores
};