const db = require('../config/conexion');

exports.mostrarFormulario = async (req, res) => {
    try {
        // Obtener datos para los selectores del formulario
        const generos = await db.query('SELECT genero_id, descripcion FROM genero ORDER BY descripcion');
        const grados = await db.query('SELECT grado_id, descripcion FROM grado_academico ORDER BY descripcion');
        const estados = await db.query('SELECT estado_id, descripcion FROM estado_profesor ORDER BY descripcion');
        const puestos = await db.query('SELECT puesto_id, descripcion FROM puesto ORDER BY descripcion');
        const asignaturas = await db.query('SELECT asignatura_id, nombre FROM asignatura ORDER BY nombre');

        res.render('anadirProfesor', {
            generos,
            grados,
            estados,
            puestos,
            asignaturas,
            errorMsg: req.session.errorMsg || null,
            successMsg: req.session.successMsg || null
        });
        
        // Limpiar mensajes de la sesión
        req.session.errorMsg = null;
        req.session.successMsg = null;
    } catch (error) {
        console.error('Error al cargar el formulario para añadir profesor:', error);
        req.session.errorMsg = 'Error al cargar el formulario. Por favor, inténtelo de nuevo.';
        res.redirect('/administradorhome');
    }
};

exports.agregarProfesor = async (req, res) => {
    // Iniciar una transacción para garantizar que las operaciones sean atómicas
    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            numero_trabajador,
            nombre,
            apellido_paterno,
            apellido_materno,
            genero_id,
            rfc,
            curp,
            grado_id,
            antiguedad_unam,
            antiguedad_carrera,
            correo_institucional,
            telefono_casa,
            telefono_celular,
            direccion,
            estado_id,
            // Categorías
            puestos,
            asignaturas,
            fechas_inicio,
            fechas_fin
        } = req.body;

        // Validaciones básicas
        if (!numero_trabajador || !nombre || !apellido_paterno || !apellido_materno || !rfc || !curp || !correo_institucional) {
            req.session.errorMsg = 'Todos los campos marcados con * son obligatorios.';
            return res.redirect('/administradorhome/anadirProfesor');
        }

        // Insertar profesor
        const profesorResult = await client.query(
            `INSERT INTO profesor (
                numero_trabajador, nombre, apellido_paterno, apellido_materno, 
                genero_id, rfc, curp, grado_id, antiguedad_unam, antiguedad_carrera, 
                correo_institucional, telefono_casa, telefono_celular, direccion, estado_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
            RETURNING profesor_id`,
            [
                numero_trabajador, nombre, apellido_paterno, apellido_materno, 
                genero_id, rfc, curp, grado_id, antiguedad_unam, antiguedad_carrera, 
                correo_institucional, telefono_casa || null, telefono_celular || null, direccion || null, estado_id
            ]
        );
        
        const profesor_id = profesorResult.rows[0].profesor_id;
        
        // Insertar categorías (si existen)
        if (puestos && puestos.length > 0) {
            // Si puestos es un array (múltiples categorías)
            if (Array.isArray(puestos)) {
                for (let i = 0; i < puestos.length; i++) {
                    if (puestos[i] && asignaturas[i]) {
                        await client.query(
                            `INSERT INTO categoria_profesor (
                                profesor_id, puesto_id, asignatura_id, fecha_inicio, fecha_fin
                            ) VALUES ($1, $2, $3, $4, $5)`,
                            [
                                profesor_id, 
                                puestos[i], 
                                asignaturas[i], 
                                fechas_inicio[i] || null, 
                                fechas_fin[i] || null
                            ]
                        );
                    }
                }
            } else {
                // Si solo hay una categoría
                await client.query(
                    `INSERT INTO categoria_profesor (
                        profesor_id, puesto_id, asignatura_id, fecha_inicio, fecha_fin
                    ) VALUES ($1, $2, $3, $4, $5)`,
                    [
                        profesor_id, 
                        puestos, 
                        asignaturas, 
                        fechas_inicio || null, 
                        fechas_fin || null
                    ]
                );
            }
        }
        
        await client.query('COMMIT');
        
        req.session.successMsg = 'Profesor agregado exitosamente.';
        res.redirect('/administradorhome');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al agregar profesor:', error);
        
        let errorMsg = 'Error al agregar profesor.';
        
        // Manejo de errores específicos
        if (error.code === '23505') { // Código para violación de restricción única
            if (error.constraint === 'profesor_numero_trabajador_key') {
                errorMsg = 'El número de trabajador ya existe en el sistema.';
            } else if (error.constraint === 'profesor_rfc_key') {
                errorMsg = 'El RFC ya existe en el sistema.';
            } else if (error.constraint === 'profesor_curp_key') {
                errorMsg = 'El CURP ya existe en el sistema.';
            } else if (error.constraint === 'profesor_correo_institucional_key') {
                errorMsg = 'El correo institucional ya existe en el sistema.';
            } else {
                errorMsg = 'Ya existe un registro con esos datos.';
            }
        }
        
        req.session.errorMsg = errorMsg;
        res.redirect('/administradorhome/anadirProfesor');
    } finally {
        client.release();
    }
};