const express = require('express');
const path = require('path');
const session = require('express-session');
const indexRouter = require('./routes/index');
const administradorLoginRouter = require('./routes/administradorLogin');
const sugerenciasRouter = require('./routes/sugerencias');
const visitanteRouter = require('./routes/visitante');
const contactoRouter = require('./routes/contacto');

const app = express();
const PORT = process.env.PORT || 3000;

// Configura la ubicación de las vistas
app.set('views', __dirname + '/views');

// Configura el motor de plantillas
app.set('view engine', 'ejs');

// Configuración de la sesión
app.use(session({
    secret: 'me_gustan_las_cookie',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // true si usas HTTPS, creo que en render si mete https, luego checo
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Configura la carpeta de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para hacer disponible la información de sesión en las vistas
app.use((req, res, next) => {
    res.locals.administrador = req.session.administrador || null;
    next();
});

// Rutas
app.use('/', indexRouter);
app.use('/administradorLogin', administradorLoginRouter);
app.use('/sugerencias', sugerenciasRouter);
app.use('/visitante', visitanteRouter);
app.use('/contacto', contactoRouter);

// Agregar rutas protegidas para el administrador
const administradorRoutes = require('./routes/administradorhome');
const { verificarAutenticacion } = require('./controllers/administradorLoginController');
app.use('/administradorhome', verificarAutenticacion, administradorRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});