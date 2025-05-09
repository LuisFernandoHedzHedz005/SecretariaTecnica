const express = require('express');
const path = require('path');
const session = require('express-session');
// connect-pg-simple
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./config/conexion');
const indexRouter = require('./routes/index');
const administradorLoginRouter = require('./routes/administradorLogin');
const visitanteLoginRouter = require('./routes/visitanteLogin');
const sugerenciasRouter = require('./routes/sugerencias');
const contactoRouter = require('./routes/contacto');
const administradorRoutes = require('./routes/administradorhome');
const visitanteRoutes = require('./routes/visitantehome');
const anadirProfesorRouter = require('./routes/anadirProfesor');
const editarProfesorRouter = require('./routes/editarProfesor');
const asignaturaHomeRouter = require('./routes/asignaturaHome');
const graficasRouter = require('./routes/graficas');

const app = express();
const PORT = process.env.PORT || 3000; // PORT=10000 al menos en render

// Configura la ubicación de las vistas
app.set('views', __dirname + '/views');

// Configura el motor de plantillas
app.set('view engine', 'ejs');

const isProduction = process.env.NODE_ENV === 'production';

// Configuración de la sesión con PostgreSQL
app.use(session({
    store: new pgSession({
        pool: pool,                 
        tableName: 'session',       // Nombre de la tabla para las sesiones
        createTableIfMissing: true  // Crear la tabla si no existe
    }),
    secret: process.env.SESSION_SECRET || 'me_gustan_las_cookie',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: isProduction ? 'auto' : false,  // True en producción con HTTPS, false en desarrollo
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        sameSite: 'lax'  // Ayuda con problemas de cookies en redirecciones
    },
    proxy: isProduction 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura la carpeta de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para hacer disponible la información de sesión en las vistas
app.use((req, res, next) => {
    res.locals.administrador = req.session.administrador || null;
    next();
});

app.use((req, res, next) => {
    res.locals.visitante = req.session.visitante || null;
    next();
});

// Middleware para debug de sesiones
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    next();
});

// Rutas
app.use('/', indexRouter);
app.use('/administradorLogin', administradorLoginRouter);
app.use('/sugerencias', sugerenciasRouter);
app.use('/visitanteLogin', visitanteLoginRouter);
app.use('/contacto', contactoRouter);

// Agregar rutas protegidas para el administrador
const { verificarAutenticacion } = require('./controllers/administradorLoginController');
app.use('/administradorhome', verificarAutenticacion, administradorRoutes);

// Agregar rutas protegidas para el visitante
const { verificarAutenticacionV } = require('./controllers/visitanteLoginController');
app.use('/visitantehome', verificarAutenticacionV, visitanteRoutes);

// Agregar ruta para añadir profesor
app.use('/administradorhome/anadirProfesor', verificarAutenticacion, anadirProfesorRouter);

// Agregar ruta para editar profesor
app.use('/administradorhome/editarProfesor', verificarAutenticacion, editarProfesorRouter);
// Agregar ruta para asignatura
app.use('/asignaturaHome', verificarAutenticacion, asignaturaHomeRouter);
// Agregar ruta para importar profesores
app.use('/importarProfesores', verificarAutenticacion, administradorRoutes);
app.use('/administradorhome/descargarPlantilla', verificarAutenticacion, administradorRoutes);
// Agregar ruta para graficas
app.use('/graficas', verificarAutenticacion, graficasRouter);
// Agregar ruta para eliminar todos los profesores
app.use('/administradorhome/eliminarTodosProfesores', verificarAutenticacion, administradorRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});