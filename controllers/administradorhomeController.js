const { query } = require('../config/conexion');
const exceljs = require('exceljs');
const path = require('path');
const fs = require('fs');

// Información de los profes 
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

// BUsacmos por termino 
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

// obtenemos las categorias, tabla dependiente de la bd 
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

// Mostramos la tabla, basicamente para la ruta 
const mostrarTabla = async (req, res) => {
  try {
    const profesores = await obtenerProfesores();
    const visitantes = await obtenerVisitantes();
    
    // Para cada profesor, obtenemos sus categorías
    for (const profesor of profesores) {
      profesor.categorias = await obtenerCategoriasPorProfesor(profesor.profesor_id);
    }
    
    // debbug 
    const success = req.query.success === 'true';
    const message = req.query.message || '';
    
    res.render('administradorhome', { 
      administrador: req.session.administrador,
      profesores: profesores,
      visitantes: visitantes,
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

// Generar excell con toda la info
const generarExcelProfesores = async (profesores) => {
  // Para cada profesor, obtenemos sus categorías otra vez
  for (const profesor of profesores) {
    profesor.categorias = await obtenerCategoriasPorProfesor(profesor.profesor_id);
  }
  
  // Crear un nuevo libro de Excel
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Profesores');
  
  // Encabezado 
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

// Descargamos el excell
const descargarExcel = async (req, res) => {
  try {
    let profesores;
    const { termino } = req.query;
    
    if (termino && termino.trim() !== '') {
      // Si la profesora presiono la lupa de busqueda, solo se descargan los datos filtrados
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
    
    // Enviar archivo al administrador
    res.download(excelFilePath, 'profesores.xlsx', (err) => {
      if (err) {
        console.error('Error al enviar archivo:', err);
      }
      
      // Eliminamos el archivo para no tener problemas de espacio en render 
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
    
    // Obtener los visitantes también
    const visitantes = await obtenerVisitantes();
    
    // Para cada profesor, obtenemos sus categorías
    for (const profesor of profesores) {
      profesor.categorias = await obtenerCategoriasPorProfesor(profesor.profesor_id);
    }
    
    res.render('administradorhome', { 
      administrador: req.session.administrador,
      profesores: profesores,
      visitantes: visitantes, 
      busqueda: termino,
      success: false, 
      message: ''
    });
  } catch (error) {
    console.error('Error al buscar profesores:', error);
    res.status(500).render('error', { 
      message: 'Error al buscar profesores',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
    });
  }
};

// Función para eliminar un profesor por ID
const eliminarProfesor = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID de profesor no proporcionado' });
    }
    
    // Primero obtenemos los datos 
    const sqlGetProfesor = `
      SELECT 
        p.nombre, p.apellido_paterno, p.apellido_materno, p.numero_trabajador
      FROM 
        profesor p
      WHERE 
        p.profesor_id = $1
    `;
    
    const profesorData = await query(sqlGetProfesor, [id]);
    
    if (profesorData.length === 0) {
      return res.status(404).json({ success: false, message: 'Profesor no encontrado' });
    }
    
    // On delete cascade, debemos eliminar el profesor 
    const sqlDeleteProfesor = `DELETE FROM profesor WHERE profesor_id = $1`;
    await query(sqlDeleteProfesor, [id]);
    
    // Registrar la eliminación
    const profesor = profesorData[0];
    console.log(`Profesor eliminado: ${profesor.nombre} ${profesor.apellido_paterno} ${profesor.apellido_materno} (${profesor.numero_trabajador})`);
    
    // Responder con éxito
    return res.json({ 
      success: true, 
      message: `Profesor ${profesor.nombre} ${profesor.apellido_paterno} ${profesor.apellido_materno} eliminado correctamente` 
    });
  } catch (error) {
    console.error('Error al eliminar profesor:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar profesor', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
};

const obtenerVisitantes = async () => {
  try {
    const sql = `
      SELECT 
        u.usuario_id,
        u.usuario,
        u.correo,
        r.nombre_rol AS rol,
        TO_CHAR(u.fecha_creacion, 'DD/MM/YYYY') AS fecha_creacion,
        u.activo
      FROM 
        usuario_app u
        JOIN rol r ON u.rol_id = r.rol_id
      WHERE
        r.nombre_rol = 'visitante'
      ORDER BY u.usuario
    `;
    
    const visitantes = await query(sql);
    return visitantes;
  } catch (error) {
    console.error('Error al obtener visitantes:', error);
    throw error;
  }
};

// Función para eliminar un visitante por ID
const eliminarVisitante = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID de visitante no proporcionado' });
    }
    
    // Primero obtenemos los datos del visitante
    const sqlGetVisitante = `
      SELECT 
        u.usuario, u.correo
      FROM 
        usuario_app u
      WHERE 
        u.usuario_id = $1
    `;
    
    const visitanteData = await query(sqlGetVisitante, [id]);
    
    if (visitanteData.length === 0) {
      return res.status(404).json({ success: false, message: 'Visitante no encontrado' });
    }
    
    // Eliminar el visitante
    const sqlDeleteVisitante = `DELETE FROM usuario_app WHERE usuario_id = $1`;
    await query(sqlDeleteVisitante, [id]);
    
    // Registrar la eliminación
    const visitante = visitanteData[0];
    console.log(`Visitante eliminado: ${visitante.usuario} (${visitante.correo})`);
    
    // Responder con éxito
    return res.json({ 
      success: true, 
      message: `Visitante ${visitante.usuario} eliminado correctamente` 
    });
  } catch (error) {
    console.error('Error al eliminar visitante:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar visitante', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
};

const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, 'profesores-' + Date.now() + path.extname(file.originalname));
  }
});

// SOLO EXCELLLLLLLL
const fileFilter = (req, file, cb) => {
  const extname = path.extname(file.originalname).toLowerCase();
  if (extname === '.xlsx' || extname === '.xls') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
  }
};

// Configurar el middleware de carga
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
}).single('archivo');

// Mapeo entre nombres de tablas y sus columnas ID correspondientes
// Como estamos usando catalogos, es necesario el mapeo
const idColumnMappings = {
  'genero': 'genero_id',
  'grado_academico': 'grado_id',
  'puesto': 'puesto_id',
  'asignatura': 'asignatura_id',
  'estado_profesor': 'estado_id'
};

// Mapeo entre nombres de columnas en Excel y sus equivalentes en la base de datos
const excelToDbMappings = {
  'Género': 'genero',
  'Grado Académico': 'grado_academico',
  'Estado': 'estado_profesor'
};

// Obtener ID
const encontrarIdEnCatalogo = async (tabla, campo, valor) => {
  // Usar el mapeo para obtener el nombre correcto de la columna ID
  const idColumn = idColumnMappings[tabla] || `${tabla}_id`;
  
  const sql = `SELECT ${idColumn} FROM ${tabla} WHERE descripcion ILIKE $1`;
  try {
    const result = await query(sql, [valor]);
    
    if (result.length > 0) {
      return result[0][idColumn];
    }
    console.warn(`No se encontró el valor "${valor}" en la tabla "${tabla}"`);
    return null;
  } catch (error) {
    console.error(`Error al buscar en la tabla ${tabla}:`, error);
    throw new Error(`Error al buscar ${valor} en la tabla ${tabla}: ${error.message}`);
  }
};

// Función auxiliar para encontrar ID de asignatura
const encontrarAsignaturaId = async (nombre) => {
  const sql = `SELECT asignatura_id FROM asignatura WHERE nombre ILIKE $1`;
  try {
    const result = await query(sql, [nombre]);
    
    if (result.length > 0) {
      return result[0].asignatura_id;
    }
    console.warn(`No se encontró la asignatura "${nombre}"`);
    return null;
  } catch (error) {
    console.error(`Error al buscar asignatura ${nombre}:`, error);
    throw new Error(`Error al buscar asignatura ${nombre}: ${error.message}`);
  }
};

// Función auxiliar para procesar la cadena de categorías y crear registros
const procesarCategorias = async (categoriaTexto, profesorId) => {
  // Si no hay texto de categorías, no hacer nada
  if (!categoriaTexto) return [];

  // Dividir las diferentes categorías (separadas por punto y coma)
  const categorias = categoriaTexto.split(';').map(cat => cat.trim()).filter(cat => cat);
  const categoriasInsertadas = [];

  for (const categoria of categorias) {
    try {
      // "Puesto - Asignatura (FechaInicio a FechaFin)" o "Puesto - Asignatura (FechaInicio )"
      //Expresion regular
      const matchCategoria = categoria.match(/(.+?)\s+-\s+(.+?)\s+\((.+?)\)/);
      
      if (matchCategoria) {
        const puesto = matchCategoria[1].trim();
        const asignatura = matchCategoria[2].trim();
        const fechasTexto = matchCategoria[3].trim();
        
        // Buscar IDs en catálogos
        const puestoId = await encontrarIdEnCatalogo('puesto', 'descripcion', puesto);
        const asignaturaId = await encontrarAsignaturaId(asignatura);
        
        if (!puestoId || !asignaturaId) {
          console.warn(`No se encontró el puesto "${puesto}" o asignatura "${asignatura}" en los catálogos`);
          continue;
        }
        
        // Procesar fechas
        let fechaInicio = null;
        let fechaFin = null;
        
        if (fechasTexto.includes(' a ')) {
          // Formato "FechaInicio a FechaFin"
          const [inicio, fin] = fechasTexto.split(' a ').map(f => f.trim());
          fechaInicio = inicio === 'null' ? null : formatearFecha(inicio);
          fechaFin = fin === 'null' ? null : formatearFecha(fin);
        } else {
          // Solo fecha de inicio
          fechaInicio = fechasTexto === 'null' ? null : formatearFecha(fechasTexto);
        }
        
        // Insertar en la tabla categoria_profesor
        const sqlInsertCategoria = `
          INSERT INTO categoria_profesor 
            (profesor_id, puesto_id, asignatura_id, fecha_inicio, fecha_fin)
          VALUES 
            ($1, $2, $3, $4, $5)
          ON CONFLICT (profesor_id, puesto_id, asignatura_id, fecha_inicio)
          DO NOTHING
          RETURNING categoria_id
        `;
        
        const result = await query(sqlInsertCategoria, [
          profesorId,
          puestoId,
          asignaturaId,
          fechaInicio,
          fechaFin
        ]);
        
        if (result.length > 0) {
          categoriasInsertadas.push(result[0].categoria_id);
        }
      } else {
        console.warn(`Formato de categoría inválido: ${categoria}`);
      }
    } catch (error) {
      console.error(`Error al procesar categoría: ${categoria}`, error);
      throw new Error(`Error al procesar categoría "${categoria}": ${error.message}`);
    }
  }
  
  return categoriasInsertadas;
};

// Función auxiliar para formatear fecha de DD/MM/YYYY a YYYY-MM-DD para PostgreSQL
const formatearFecha = (fechaStr) => {
  if (!fechaStr || fechaStr === 'null') return null;
  
  // Formato esperado DD/MM/YYYY
  const partes = fechaStr.split('/');
  if (partes.length === 3) {
    // Asegurarse de que los componentes tengan el formato correcto
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    const anio = partes[2].length === 2 ? `20${partes[2]}` : partes[2];
    
    return `${anio}-${mes}-${dia}`;
  }
  
  return fechaStr; // SI todo falla, devolvemos el original
};

// Función principal para procesar el archivo Excel y cargar datos
const procesarExcel = async (filePath) => {
  const workbook = new exceljs.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.getWorksheet(1); 
  const resultados = {
    profesoresImportados: 0,
    profesoresActualizados: 0,
    errores: []
  };
  
  // Procesar cada fila (excepto la primera que son los encabezados)
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    
    try {
      // Si la fila está vacía o no tiene número de trabajador, la saltamos
      const numeroTrabajador = row.getCell(2).text.trim();
      if (!numeroTrabajador) continue;
      
      // Extraer datos de la fila
      const profesorId = row.getCell(1).value;
      const nombreCompleto = row.getCell(3).text.trim();
      const genero = row.getCell(4).text.trim();
      const rfc = row.getCell(5).text.trim();
      const curp = row.getCell(6).text.trim();
      const gradoAcademico = row.getCell(7).text.trim();
      const antiguedadUNAM = parseInt(row.getCell(8).value) || 0;
      const antiguedadCarrera = parseInt(row.getCell(9).value) || 0;
      const correoInstitucional = row.getCell(10).text.trim();
      const telefonoCasa = row.getCell(11).text.trim();
      const telefonoCelular = row.getCell(12).text.trim();
      const direccion = row.getCell(13).text.trim();
      const estado = row.getCell(14).text.trim();
      const categorias = row.getCell(15).text.trim();
      
      // Procesar el nombre completo para obtener nombre y apellidos
      let nombre = '';
      let apellidoPaterno = '';
      let apellidoMaterno = '';
      
      const nombrePartes = nombreCompleto.split(' ');
      if (nombrePartes.length >= 3) {
        //último elemento como apellido materno
        apellidoMaterno = nombrePartes.pop();
        //penúltimo elemento como apellido paterno
        apellidoPaterno = nombrePartes.pop();
        // El resto es el nombre
        nombre = nombrePartes.join(' ');
      } else if (nombrePartes.length === 2) {
        nombre = nombrePartes[0];
        apellidoPaterno = nombrePartes[1];
        apellidoMaterno = '';
      } else {
        nombre = nombreCompleto;
        apellidoPaterno = '';
        apellidoMaterno = '';
      }
      
      // Mapear nombres del Excel a nombres de tablas en la BD
      const generoTabla = excelToDbMappings['Género'] || 'genero';
      const gradoTabla = excelToDbMappings['Grado Académico'] || 'grado_academico';
      const estadoTabla = excelToDbMappings['Estado'] || 'estado_profesor';
      
      // Buscar IDs en tablas catálogo usando los nombres mapeados
      const generoId = await encontrarIdEnCatalogo(generoTabla, 'descripcion', genero);
      const gradoId = await encontrarIdEnCatalogo(gradoTabla, 'descripcion', gradoAcademico);
      const estadoId = await encontrarIdEnCatalogo(estadoTabla, 'descripcion', estado);
      
      if (!generoId) {
        resultados.errores.push(`Fila ${i}: Género "${genero}" no encontrado en el catálogo`);
        continue;
      }
      
      if (!gradoId) {
        resultados.errores.push(`Fila ${i}: Grado académico "${gradoAcademico}" no encontrado en el catálogo`);
        continue;
      }
      
      if (!estadoId) {
        resultados.errores.push(`Fila ${i}: Estado "${estado}" no encontrado en el catálogo`);
        continue;
      }
      
      // Verificar si el profesor ya existe (por número de trabajador)
      const sqlCheckProfesor = `SELECT profesor_id FROM profesor WHERE numero_trabajador = $1`;
      const profesorExistente = await query(sqlCheckProfesor, [numeroTrabajador]);
      
      let nuevoProfesorId;
      
      if (profesorExistente.length > 0) {
        // Actualizar profesor existente
        nuevoProfesorId = profesorExistente[0].profesor_id;
        
        const sqlUpdateProfesor = `
          UPDATE profesor SET
            nombre = $1,
            apellido_paterno = $2,
            apellido_materno = $3,
            genero_id = $4,
            rfc = $5,
            curp = $6,
            grado_id = $7,
            antiguedad_unam = $8,
            antiguedad_carrera = $9,
            correo_institucional = $10,
            telefono_casa = $11,
            telefono_celular = $12,
            direccion = $13,
            estado_id = $14
          WHERE profesor_id = $15
          RETURNING profesor_id
        `;
        
        await query(sqlUpdateProfesor, [
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          generoId,
          rfc,
          curp,
          gradoId,
          antiguedadUNAM,
          antiguedadCarrera,
          correoInstitucional,
          telefonoCasa,
          telefonoCelular,
          direccion,
          estadoId,
          nuevoProfesorId
        ]);
        
        resultados.profesoresActualizados++;
      } else {
        // Insertar nuevo profesor
        const sqlInsertProfesor = `
          INSERT INTO profesor (
            numero_trabajador, nombre, apellido_paterno, apellido_materno,
            genero_id, rfc, curp, grado_id, antiguedad_unam, antiguedad_carrera,
            correo_institucional, telefono_casa, telefono_celular, direccion, estado_id
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          )
          RETURNING profesor_id
        `;
        
        const resultInsert = await query(sqlInsertProfesor, [
          numeroTrabajador,
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          generoId,
          rfc,
          curp,
          gradoId,
          antiguedadUNAM,
          antiguedadCarrera,
          correoInstitucional,
          telefonoCasa,
          telefonoCelular,
          direccion,
          estadoId
        ]);
        
        nuevoProfesorId = resultInsert[0].profesor_id;
        resultados.profesoresImportados++;
      }
      
      // Procesar categorías
      try {
        await procesarCategorias(categorias, nuevoProfesorId);
      } catch (error) {
        resultados.errores.push(`Fila ${i}: Error al procesar categorías: ${error.message}`);
      }
      
    } catch (error) {
      console.error(`Error al procesar fila ${i}:`, error);
      resultados.errores.push(`Fila ${i}: ${error.message}`);
    }
  }
  
  return resultados;
};

// Para la ruta
const mostrarFormularioImportacion = (req, res) => {
  res.render('importarProfesores', {
    administrador: req.session.administrador,
    success: false,
    message: '',
    errors: []
  });
};

const importarProfesores = (req, res) => {
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      // Error de multer
      return res.render('importarProfesores', {
        administrador: req.session.administrador,
        success: false,
        message: '',
        errors: [`Error en la carga del archivo: ${err.message}`]
      });
    } else if (err) {
      // Otro tipo de error
      return res.render('importarProfesores', {
        administrador: req.session.administrador,
        success: false,
        message: '',
        errors: [`Error: ${err.message}`]
      });
    }
    
    // Si no hay archivo
    if (!req.file) {
      return res.render('importarProfesores', {
        administrador: req.session.administrador,
        success: false,
        message: '',
        errors: ['No se ha seleccionado ningún archivo']
      });
    }
    
    try {
      // Procesar el archivo Excel
      const resultados = await procesarExcel(req.file.path);
      
      // Eliminar el archivo temporal
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error al eliminar archivo temporal:', unlinkErr);
        }
      });
      
      // Preparar mensaje de resultados
      let mensaje = `Importación completada: ${resultados.profesoresImportados} profesores nuevos, ${resultados.profesoresActualizados} profesores actualizados.`;
      
      // Renderizar vista con resultados
      res.render('importarProfesores', {
        administrador: req.session.administrador,
        success: resultados.errores.length === 0,
        message: mensaje,
        errors: resultados.errores
      });
      
    } catch (error) {
      console.error('Error al procesar el archivo Excel:', error);
      
      // Eliminar el archivo temporal si existe
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, () => {});
      }
      
      res.render('importarProfesores', {
        administrador: req.session.administrador,
        success: false,
        message: '',
        errors: [`Error al procesar el archivo: ${error.message}`]
      });
    }
  });
};

const descargarPlantilla = async (req, res) => {
  try {
    // Crear un nuevo libro de Excel
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla_Profesores');
    
    // Configurar columnas con sus encabezados
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 5 },
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
      { header: 'Categorías', key: 'categorias', width: 50 }
    ];
    
    // Estilo para el encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Ejemplo de fila con datos de muestra
    worksheet.addRow({
      id: '',
      numero_trabajador: '0017',
      nombre_completo: 'Luis Hernández Hernández',
      genero: 'Masculino',
      rfc: 'HHEL810101XXX',
      curp: 'HEHL810101HNLLNS09',
      grado_academico: 'Doctorado',
      antiguedad_unam: '5',
      antiguedad_carrera: '5',
      correo_institucional: 'luis.hernandez@unam.mx',
      telefono_casa: '5550001111',
      telefono_celular: '5512345678',
      direccion: 'Calle Falsa 123, CDMX',
      estado: 'Activo',
      categorias: 'Tiempo completo - Asignatura B (01/09/2022 ); Definitivo - Asignatura A (01/01/2020 )'
    });
    
    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Guardar archivo
    const excelFilePath = path.join(tempDir, 'plantilla_profesores.xlsx');
    await workbook.xlsx.writeFile(excelFilePath);
    
    // Enviar archivo al administrador
    res.download(excelFilePath, 'plantilla_profesores.xlsx', (err) => {
      if (err) {
        console.error('Error al enviar archivo:', err);
      }
      
      // Eliminamos el archivo para no tener problemas de espacio
      fs.unlink(excelFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error al eliminar archivo temporal:', unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error('Error al generar plantilla Excel:', error);
    res.status(500).send('Error al generar la plantilla de Excel');
  }
};

const eliminarTodosProfesores = async (req, res) => {
  try {
      // Primero obtenemos la cantidad de registros que vamos a eliminar para reportar
      const countProfesoresQuery = 'SELECT COUNT(*) as total FROM profesor';
      const profesoresCount = await query(countProfesoresQuery);
      const totalProfesores = parseInt(profesoresCount[0].total);
      
      // 1. Eliminamos primero las categorías de profesores
      // Aunque tenemos ON DELETE CASCADE, lo hacemos explícitamente para mayor control
      const deleteCategoriasQuery = 'DELETE FROM categoria_profesor';
      await query(deleteCategoriasQuery);
      
      // 2. Eliminamos los profesores
      const deleteProfesoresQuery = 'DELETE FROM profesor';
      await query(deleteProfesoresQuery);
      
      console.log(`Eliminación masiva: Se han eliminado ${totalProfesores} profesores y todas sus categorías asociadas`);
      
      return res.json({
          success: true,
          message: `Se han eliminado correctamente ${totalProfesores} profesores y todas sus categorías asociadas`,
          totalEliminados: totalProfesores
      });
      
  } catch (error) {
      console.error('Error al eliminar todos los profesores:', error);
      return res.status(500).json({
          success: false,
          message: 'Error al eliminar los profesores',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
      });
  }
};


// Exportar
module.exports = {
  mostrarTabla,
  descargarExcel,
  buscarProfesores,
  eliminarProfesor,
  eliminarVisitante,
  mostrarFormularioImportacion,
  importarProfesores,
  descargarPlantilla,
  eliminarTodosProfesores
};