DROP DATABASE IF EXISTS profesores;
CREATE DATABASE profesores;
\c profesores

CREATE TABLE genero (
  genero_id   SERIAL PRIMARY KEY,
  descripcion VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE grado_academico (
  grado_id    SERIAL PRIMARY KEY,
  descripcion VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE puesto (
  puesto_id   SERIAL PRIMARY KEY,
  descripcion VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE asignatura (
  asignatura_id SERIAL PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE estado_profesor (
  estado_id   SERIAL PRIMARY KEY,
  descripcion VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE rol (
  rol_id     SERIAL PRIMARY KEY,
  nombre_rol VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE profesor (
  profesor_id           SERIAL PRIMARY KEY,
  numero_trabajador     VARCHAR(20) NOT NULL UNIQUE,
  nombre                VARCHAR(50) NOT NULL,
  apellido_paterno      VARCHAR(50) NOT NULL,
  apellido_materno      VARCHAR(50) NOT NULL,
  genero_id             INTEGER NOT NULL,
  rfc                   CHAR(13) NOT NULL UNIQUE,
  curp                  CHAR(18) NOT NULL UNIQUE,
  grado_id              INTEGER NOT NULL,
  antiguedad_unam       INTEGER NOT NULL,
  antiguedad_carrera    INTEGER NOT NULL,
  correo_institucional  VARCHAR(100) NOT NULL UNIQUE,
  telefono_casa         VARCHAR(15),
  telefono_celular      VARCHAR(15),
  direccion             VARCHAR(255),
  estado_id             INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT fk_profesor_genero
    FOREIGN KEY (genero_id)
    REFERENCES genero (genero_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_profesor_grado
    FOREIGN KEY (grado_id)
    REFERENCES grado_academico (grado_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_profesor_estado
    FOREIGN KEY (estado_id)
    REFERENCES estado_profesor (estado_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE categoria_profesor (
  categoria_id   SERIAL PRIMARY KEY,
  profesor_id    INTEGER NOT NULL,
  puesto_id      INTEGER NOT NULL,
  asignatura_id  INTEGER NOT NULL,
  fecha_inicio   DATE,
  fecha_fin      DATE,
  CONSTRAINT fk_catprofesor_profesor
    FOREIGN KEY (profesor_id)
    REFERENCES profesor (profesor_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_catprofesor_puesto
    FOREIGN KEY (puesto_id)
    REFERENCES puesto (puesto_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_catprofesor_asignatura
    FOREIGN KEY (asignatura_id)
    REFERENCES asignatura (asignatura_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT uq_catprofesor
    UNIQUE (profesor_id, puesto_id, asignatura_id, fecha_inicio)
);


CREATE TABLE usuario_app (
  usuario_id     SERIAL PRIMARY KEY,
  usuario        VARCHAR(50) NOT NULL UNIQUE,
  contrasena     CHAR(60) NOT NULL,
  correo         VARCHAR(100) NOT NULL UNIQUE,
  rol_id         INTEGER NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_usuario_rol
    FOREIGN KEY (rol_id)
    REFERENCES rol (rol_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);


INSERT INTO genero (descripcion) VALUES
  ('Masculino'),
  ('Femenino'),
  ('Otro');

INSERT INTO grado_academico (descripcion) VALUES
  ('Licenciatura'),
  ('Maestría'),
  ('Doctorado'),
  ('Posdoctorado');

INSERT INTO puesto (descripcion) VALUES
  ('Interino'),
  ('Definitivo'),
  ('Tiempo completo');

INSERT INTO asignatura (nombre) VALUES
  ('Asignatura A'),
  ('Asignatura B'),
  ('Asignatura C');

INSERT INTO estado_profesor (descripcion) VALUES
  ('Activo'),
  ('Retirado'),
  ('Incapacitado'),
  ('Otro');

INSERT INTO rol (nombre_rol) VALUES
  ('administrador'),
  ('visitante');


INSERT INTO profesor (
  numero_trabajador, nombre, apellido_paterno, apellido_materno,
  genero_id, rfc, curp, grado_id,
  antiguedad_unam, antiguedad_carrera,
  correo_institucional, telefono_casa, telefono_celular, direccion, estado_id
) VALUES
  ('0001','Luis','Hernández','Hernández', 1,'HHEL810101XXX','HEHL810101HNLLNS09',3,5,5,'luis.hernandez@unam.mx','5550001111','5512345678','Calle Falsa 123, CDMX',1),
  ('0002','María','Pérez','Gómez',     2,'PEGM900202YYY','PEGM900202MDFRRS05',2,3,3,'maria.perez@unam.mx','5550002222','5598765432','Av Reforma 456, CDMX',1),
  ('0003','Jorge','López','Ramírez',    1,'LORJ850303ZZZ','LORJ850303HDFPRM07',1,2,2,'jorge.lopez@unam.mx','5550003333','5534567890','Insurgentes Sur 789, CDMX',2);


INSERT INTO categoria_profesor (
  profesor_id, puesto_id, asignatura_id, fecha_inicio, fecha_fin
) VALUES
  (1,2,1,'2020-01-01', NULL),
  (1,3,2,'2022-09-01', NULL),
  (2,1,1,'2023-02-01','2023-12-31'),
  (2,2,3,'2024-01-15', NULL),
  (3,1,2,'2018-05-10','2023-05-10');


INSERT INTO usuario_app (
  usuario, contrasena, correo, rol_id, activo
) VALUES
  ('admin', 'admin123',      'admin@unam.mx',      1, TRUE),
  ('visita','user123',       'visitante@unam.mx',  2, TRUE);
