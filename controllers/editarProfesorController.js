const { query, pool, getClient } = require('../config/conexion');

const editarProfesorController = {
  mostrarFormulario: async (req, res) => {
    try {
      const profesorId = req.params.id;

      // Carga el profesor
      const profesores = await query(
        'SELECT * FROM profesor WHERE profesor_id = ?',
        [profesorId]
      );
      if (profesores.length === 0) {
        req.session.errorMsg = 'Profesor no encontrado';
        return res.redirect('/administradorhome');
      }
      const profesor = profesores[0];

      // Carga sus categorías y datos para los selects
      const categorias = await query(
        'SELECT * FROM categoria_profesor WHERE profesor_id = ?',
        [profesorId]
      );
      const generos     = await query('SELECT genero_id, descripcion FROM genero ORDER BY descripcion');
      const grados      = await query('SELECT grado_id, descripcion FROM grado_academico ORDER BY descripcion');
      const estados     = await query('SELECT estado_id, descripcion FROM estado_profesor ORDER BY descripcion');
      const puestos     = await query('SELECT puesto_id, descripcion FROM puesto ORDER BY descripcion');
      const asignaturas = await query('SELECT asignatura_id, nombre     FROM asignatura ORDER BY nombre');

      res.render('editarProfesor', {
        profesor,
        categorias,
        generos,
        grados,
        estados,
        puestos,
        asignaturas,
        errorMsg:   req.session.errorMsg   || null,
        successMsg: req.session.successMsg || null
      });

      // Limpiar mensajes de la sesión
      req.session.errorMsg   = null;
      req.session.successMsg = null;

    } catch (error) {
      console.error('Error al cargar el formulario de edición:', error);
      req.session.errorMsg = 'Error al cargar el formulario de edición';
      res.redirect('/administradorhome');
    }
  },

  actualizarProfesor: async (req, res) => {
    console.log('BODY:', req.body);
    const profesorId = req.params.id;
    const client     = await getClient();

    try {
      // Extrae campos del body (puestos[], asignaturas[], fechas_inicio[], fechas_fin[])
      const {
        numero_trabajador, nombre, apellido_paterno, apellido_materno,
        genero_id, rfc, curp, grado_id,
        antiguedad_unam, antiguedad_carrera,
        correo_institucional, telefono_casa, telefono_celular,
        direccion, estado_id,
        puestos = [], asignaturas = [], fechas_inicio = [], fechas_fin = []
      } = req.body;

      // Validaciones básicas
      if (!numero_trabajador || !nombre || !apellido_paterno || !apellido_materno) {
        req.session.errorMsg = 'Todos los campos obligatorios deben llenarse.';
        return res.redirect(`/administradorhome/editarProfesor/${profesorId}`);
      }

      await client.query('BEGIN');

      // Actualiza datos del profesor
      await client.query(
        `UPDATE profesor SET
           numero_trabajador    = $1,
           nombre               = $2,
           apellido_paterno     = $3,
           apellido_materno     = $4,
           genero_id            = $5,
           rfc                  = $6,
           curp                 = $7,
           grado_id             = $8,
           antiguedad_unam      = $9,
           antiguedad_carrera   = $10,
           correo_institucional = $11,
           telefono_casa        = $12,
           telefono_celular     = $13,
           direccion            = $14,
           estado_id            = $15
         WHERE profesor_id = $16`,
        [
          numero_trabajador, nombre, apellido_paterno, apellido_materno,
          genero_id, rfc, curp, grado_id,
          antiguedad_unam, antiguedad_carrera,
          correo_institucional,
          telefono_casa || null,
          telefono_celular || null,
          direccion || null,
          estado_id,
          profesorId
        ]
      );

      // Reemplaza sus categorías
      await client.query('DELETE FROM categoria_profesor WHERE profesor_id = $1', [profesorId]);
      for (let i = 0; i < puestos.length; i++) {
        const puesto     = puestos[i];
        const asignatura = asignaturas[i];
        if (!puesto || !asignatura) continue;

        await client.query(
          `INSERT INTO categoria_profesor
             (profesor_id, puesto_id, asignatura_id, fecha_inicio, fecha_fin)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            profesorId,
            puesto,
            asignatura,
            fechas_inicio[i] || null,
            fechas_fin[i]    || null
          ]
        );
      }

      await client.query('COMMIT');
      req.session.successMsg = 'Profesor actualizado correctamente.';
      res.redirect('/administradorhome');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al actualizar profesor:', error);

      // Detecta violaciones de unicidad
      let msg = 'Error al actualizar el profesor.';
      if (error.code === '23505') {
        if (error.constraint.includes('numero_trabajador')) msg = 'El número de trabajador ya existe.';
        else if (error.constraint.includes('rfc'))          msg = 'El RFC ya existe.';
        else if (error.constraint.includes('curp'))         msg = 'El CURP ya existe.';
        else if (error.constraint.includes('correo_institucional'))
          msg = 'El correo institucional ya existe.';
      }
      req.session.errorMsg = msg;
      res.redirect(`/administradorhome/editarProfesor/${profesorId}`);

    } finally {
      client.release();
    }
  }
};

module.exports = editarProfesorController;
