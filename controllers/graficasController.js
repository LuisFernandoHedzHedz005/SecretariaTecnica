const { query } = require('../config/conexion');

const mostrarGraficas = async (req, res) => {
  try {
    // Consulta para gráfica de género
    const datosGenero = await query(`
      SELECT g.descripcion, COUNT(p.profesor_id) as cantidad
      FROM profesor p
      JOIN genero g ON p.genero_id = g.genero_id
      GROUP BY g.descripcion
      ORDER BY g.descripcion
    `);

    // Consulta para gráfica de grado académico
    const datosGradoAcademico = await query(`
      SELECT ga.descripcion, COUNT(p.profesor_id) as cantidad
      FROM profesor p
      JOIN grado_academico ga ON p.grado_id = ga.grado_id
      GROUP BY ga.descripcion
      ORDER BY ga.descripcion
    `);

    // Consulta para gráfica de puesto
    const datosPuesto = await query(`
      SELECT pu.descripcion, COUNT(DISTINCT cp.profesor_id) as cantidad
      FROM categoria_profesor cp
      JOIN puesto pu ON cp.puesto_id = pu.puesto_id
      GROUP BY pu.descripcion
      ORDER BY pu.descripcion
    `);

    // Consulta para gráfica de antiguedad
    const datosAntiguedad = await query(`
      SELECT 
        CASE 
          WHEN antiguedad_unam BETWEEN 0 AND 10 THEN '0-10 años'
          WHEN antiguedad_unam BETWEEN 11 AND 20 THEN '11-20 años'
          WHEN antiguedad_unam BETWEEN 21 AND 30 THEN '21-30 años'
          ELSE 'Más de 30 años'
        END as rango_antiguedad,
        COUNT(profesor_id) as cantidad
      FROM profesor
      GROUP BY rango_antiguedad
      ORDER BY rango_antiguedad
    `);

    // Verificar por defecto si hay datos 
    const hayDatosGenero = datosGenero && datosGenero.rows && datosGenero.rows.length > 0;
    const hayDatosGrado = datosGradoAcademico && datosGradoAcademico.rows && datosGradoAcademico.rows.length > 0;
    const hayDatosPuesto = datosPuesto && datosPuesto.rows && datosPuesto.rows.length > 0;
    const hayDatosAntiguedad = datosAntiguedad && datosAntiguedad.rows && datosAntiguedad.rows.length > 0;

    // datos falsosen caso de no haber datos
    const datosGraficasGenero = hayDatosGenero ? {
      labels: datosGenero.rows.map(row => row.descripcion),
      valores: datosGenero.rows.map(row => parseInt(row.cantidad))
    } : {
      labels: ['Masculino', 'Femenino', 'Otro'],
      valores: [0, 0, 0]
    };

    const datosGraficasGrado = hayDatosGrado ? {
      labels: datosGradoAcademico.rows.map(row => row.descripcion),
      valores: datosGradoAcademico.rows.map(row => parseInt(row.cantidad))
    } : {
      labels: ['Licenciatura', 'Maestría', 'Doctorado', 'Posdoctorado'],
      valores: [0, 0, 0, 0]
    };

    const datosGraficasPuesto = hayDatosPuesto ? {
      labels: datosPuesto.rows.map(row => row.descripcion),
      valores: datosPuesto.rows.map(row => parseInt(row.cantidad))
    } : {
      labels: ['Interino', 'Definitivo', 'Tiempo completo'],
      valores: [0, 0, 0]
    };

    const datosGraficasAntiguedad = hayDatosAntiguedad ? {
      labels: datosAntiguedad.rows.map(row => row.rango_antiguedad),
      valores: datosAntiguedad.rows.map(row => parseInt(row.cantidad))
    } : {
      labels: ['0-10 años', '11-20 años', '21-30 años', 'Más de 30 años'],
      valores: [0, 0, 0, 0]
    };

    // debug
    const success = req.query.success === 'true';
    const message = req.query.message || '';
    
    // mas debug
    console.log('RAW datosGenero:', datosGenero);
    
    // mas verificaciones para debug
    if (datosGenero && !datosGenero.rows && Array.isArray(datosGenero)) {
      const datosGraficasGeneroCorregido = {
        labels: datosGenero.map(row => row.descripcion),
        valores: datosGenero.map(row => parseInt(row.cantidad))
      };
      console.log('Datos de género (corregido):', datosGraficasGeneroCorregido);
      
      // Aplicar la misma corrección a los demás conjuntos de datos
      const datosGraficasGradoCorregido = datosGradoAcademico && Array.isArray(datosGradoAcademico) ? {
        labels: datosGradoAcademico.map(row => row.descripcion),
        valores: datosGradoAcademico.map(row => parseInt(row.cantidad))
      } : datosGraficasGrado;
      
      const datosGraficasPuestoCorregido = datosPuesto && Array.isArray(datosPuesto) ? {
        labels: datosPuesto.map(row => row.descripcion),
        valores: datosPuesto.map(row => parseInt(row.cantidad))
      } : datosGraficasPuesto;
      
      const datosGraficasAntiguedadCorregido = datosAntiguedad && Array.isArray(datosAntiguedad) ? {
        labels: datosAntiguedad.map(row => row.rango_antiguedad),
        valores: datosAntiguedad.map(row => parseInt(row.cantidad))
      } : datosGraficasAntiguedad;
      
      res.render('graficas', {
        success: success,
        message: message,
        datosGenero: JSON.stringify(datosGraficasGeneroCorregido),
        datosGradoAcademico: JSON.stringify(datosGraficasGradoCorregido),
        datosPuesto: JSON.stringify(datosGraficasPuestoCorregido),
        datosAntiguedad: JSON.stringify(datosGraficasAntiguedadCorregido)
      });
    } else {
      console.log('Datos de género:', datosGraficasGenero);
      console.log('Datos de grado académico:', datosGraficasGrado);
      console.log('Datos de puesto:', datosGraficasPuesto);
      console.log('Datos de antigüedad:', datosGraficasAntiguedad);
      
      res.render('graficas', {
        success: success,
        message: message,
        datosGenero: JSON.stringify(datosGraficasGenero),
        datosGradoAcademico: JSON.stringify(datosGraficasGrado),
        datosPuesto: JSON.stringify(datosGraficasPuesto),
        datosAntiguedad: JSON.stringify(datosGraficasAntiguedad)
      });
    }
    
  } catch (error) {
    console.error('Error al mostrar dashboard:', error);
    res.status(500).render('error', { 
      message: 'Error al cargar la información',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
    });
  }
};

module.exports = {
  mostrarGraficas
};