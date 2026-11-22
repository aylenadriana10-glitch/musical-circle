
let pantalla = "inicio";
let puntos = 0;

const lineas = [220, 325, 430];
let circulos = [];
let efectos = [];

const lineaImpacto = 120;
const margenImpacto = 32;
const radioClic = 26;

// ESCALA GENERAL DEL JUEGO
const ESCALA_JUEGO = 1.15;
const CENTRO_X = 370;
const CENTRO_Y = 345;
// ADAPTACION A PANTALLA COMPLETA
let escalaPantalla = 1;
let desplazamientoX = 0;
let desplazamientoY = 0;

// MUSICA
let musicaJuego;
let bpm = 103.4;
let duracionPulso = 60 / bpm;
let intervaloNotas = duracionPulso * 2;

// VIDEO
let videoChica;
let videoListo = false;
let videoIniciado = false;

// RELOJ
let tiempoPrimerGolpe = 0.86 + duracionPulso * 8;
let tiempoSiguienteGolpe = 0;
let tiempoCancionAnterior = 0;
let tiempoTotalCancion = 0;

// PATRON DE LINEAS
const patronLineas = [0, 1, 2, 1, 0, 2, 1, 2];
let indicePatron = 0;

// SECUENCIAS DE CIRCULOS
// Cada grupo tiene cinco circulos.
// La secuencia de 54 segundos conserva los 15 circulos.

let secuencias = [
  { inicio: 30, cantidad: 5, separacion: 0.35, cicloCreado: -1 },
  { inicio: 32, cantidad: 5, separacion: 0.35, cicloCreado: -1 },
  { inicio: 34, cantidad: 5, separacion: 0.35, cicloCreado: -1 },
  { inicio: 36, cantidad: 5, separacion: 0.35, cicloCreado: -1 },
  { inicio: 38, cantidad: 5, separacion: 0.35, cicloCreado: -1 },
  { inicio: 41, cantidad: 5, separacion: 0.35, cicloCreado: -1 },

  { inicio: 54, cantidad: 15, separacion: 0.35, cicloCreado: -1 },

  { inicio: 145, cantidad: 5, separacion: 0.35, cicloCreado: -1 },
  { inicio: 148, cantidad: 5, separacion: 0.35, cicloCreado: -1 },
  { inicio: 150, cantidad: 5, separacion: 0.35, cicloCreado: -1 },
  { inicio: 152, cantidad: 5, separacion: 0.35, cicloCreado: -1 },
  { inicio: 154, cantidad: 5, separacion: 0.35, cicloCreado: -1 },
  { inicio: 156, cantidad: 5, separacion: 0.35, cicloCreado: -1 },
  { inicio: 158, cantidad: 5, separacion: 0.35, cicloCreado: -1 }
];

// VELOCIDADES POR TRAMO
// 2.3 = normal
// 2.7 = rapida
// 1.8 = medio lenta

const secciones = [
  { inicio: 0, fin: 15, velocidad: 2.3 },
  { inicio: 15, fin: 30, velocidad: 2.7 },
  { inicio: 30, fin: 45, velocidad: 2.3 },
  { inicio: 45, fin: 54, velocidad: 2.3 },
  { inicio: 54, fin: 60, velocidad: 2.3 },
  { inicio: 60, fin: 92, velocidad: 2.7 },
  { inicio: 92, fin: 114, velocidad: 1.8 },
  { inicio: 114, fin: 145, velocidad: 2.7 },
  { inicio: 145, fin: 160, velocidad: 2.3 },
  { inicio: 160, fin: 215, velocidad: 2.7 },
  { inicio: 215, fin: 230, velocidad: 1.8 },
  { inicio: 230, fin: 246, velocidad: 2.7 },
  { inicio: 246, fin: 251, velocidad: 2.3 }
];


// ==========================================
// CONFIGURACION
// ==========================================

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textAlign(CENTER, CENTER);

  videoChica = createVideo("chica.mp4", () => {
    videoListo = true;
    videoChica.volume(0);
    videoChica.elt.muted = true;

    if (videoIniciado) videoChica.loop();
  });

  videoChica.hide();

  musicaJuego = new Audio("cancion juego.mp3");
  musicaJuego.volume = 0.5;
  musicaJuego.loop = true;

  tiempoSiguienteGolpe = tiempoPrimerGolpe;

  describe("Juego musical interactivo con tres lineas y circulos.");
}

// ==========================================
// VELOCIDAD MUSICAL
// ==========================================

function obtenerVelocidadMusical(tiempo) {
  let duracion = musicaJuego.duration || 251;
  let t = tiempo % duracion;

  for (let i = 0; i < secciones.length; i++) {
    let actual = secciones[i];

    if (t >= actual.inicio && t < actual.fin) {

      // Desaceleracion progresiva del final
      if (t >= 246) {
        let progreso = constrain((t - 246) / 5, 0, 1);
        progreso = progreso * progreso * (3 - 2 * progreso);
        return lerp(2.3, 1.2, progreso);
      }

      // Transiciones suaves entre velocidades
      let transicion = 0.6;
      let resultado = actual.velocidad;

      if (i > 0 && t < actual.inicio + transicion) {
        let anterior = secciones[i - 1];
        let progreso = constrain(
          (t - actual.inicio) / transicion,
          0,
          1
        );

        resultado = lerp(anterior.velocidad, actual.velocidad, progreso);
      }

      if (i < secciones.length - 1 && t > actual.fin - transicion) {
        let siguiente = secciones[i + 1];
        let progreso = constrain(
          (t - (actual.fin - transicion)) / transicion,
          0,
          1
        );

        resultado = lerp(actual.velocidad, siguiente.velocidad, progreso);
      }

      return resultado;
    }
  }

  return 2.3;
}


function obtenerTiempoViaje(tiempoGolpe) {
  let velocidad = obtenerVelocidadMusical(tiempoGolpe);
  return (680 - lineaImpacto) / (velocidad * 60);
}



// ==========================================
// DIBUJO PRINCIPAL
// ==========================================

function draw() {
  background("#24002F");

  escalaPantalla = min(width / 900, height / 650);
  escalaPantalla *= 0.85;

  desplazamientoX = width - 900 * escalaPantalla;
  desplazamientoY = (height - 650 * escalaPantalla) / 2;

  // Dibujar el juego
  push();

  translate(desplazamientoX, desplazamientoY);
  scale(escalaPantalla);

  push();

  translate(CENTRO_X, CENTRO_Y);
  scale(ESCALA_JUEGO);
  translate(-CENTRO_X, -CENTRO_Y);

  if (pantalla === "inicio") dibujarInicio();
  if (pantalla === "juego") dibujarJuego();
  if (pantalla === "final") dibujarFinal();

  pop();
  pop();

  // Dibujar el video por separado
  dibujarPanel();
}


// ==========================================
// VIDEO LATERAL
// ==========================================

function dibujarPanel() {
  let ancho = 200 * escalaPantalla;
  let alto = height;

  let x = width - ancho;
  let y = 0;

  imageMode(CORNER);

  noStroke();
  fill("#24002F");
  rect(x, y, ancho, alto);

  if (videoListo) {
    image(videoChica, x, y, ancho, alto);
  }

  stroke("#00BFFF");
  strokeWeight(3);
  line(x, y, x, alto);
}


function dibujarInicio() {
  fill("#00BFFF");
  noStroke();

  textFont("Vineta BT");
  textSize(39);
  text("MUSICAL CIRCLE", 350, 85);

  stroke("#00BFFF");
  strokeWeight(3);

  for (let y of [220, 300, 380]) {
    line(100, y, 600, y);
  }

  dibujarBoton("JUGAR", 350, 465);

  fill("#FFFFFF");
  noStroke();

  textSize(13);
  text("COMO JUGAR", 350, 535);

  textSize(10);
  text("ESPERA A QUE LOS CIRCULOS", 350, 560);
  text("LLEGUEN A LA ZONA BLANCA", 350, 580);
  text("Y HAZ CLIC A TIEMPO", 350, 600);
}


// ==========================================
// RELOJ DE LA CANCION
// ==========================================

function obtenerTiempoCancion() {
  let actual = musicaJuego.currentTime;

  if (actual < tiempoCancionAnterior) {
    tiempoTotalCancion += musicaJuego.duration -
      tiempoCancionAnterior + actual;

    tiempoSiguienteGolpe = tiempoTotalCancion + tiempoPrimerGolpe;
  } else {
    tiempoTotalCancion += actual - tiempoCancionAnterior;
  }

  tiempoCancionAnterior = actual;
  return tiempoTotalCancion;
}


// ==========================================
// PUNTAJE
// ==========================================

function dibujarPuntaje() {
  textFont("Vineta BT");
  textSize(22);

  if (puntos >= 1000) {
    let mezcla = (sin(frameCount * 0.12) + 1) / 2;
    let colorMarcador = lerpColor(
      color("#FF007A"),
      color("#00BFFF"),
      mezcla
    );

    fill(colorMarcador);

    text(
      "SCORE: " + puntos,
      350 + random(-2.5, 2.5),
      55 + random(-2.5, 2.5)
    );
  } else {
    fill("#FFFFFF");
    text("SCORE: " + puntos, 350, 55);
  }
}


// ==========================================
// JUEGO
// ==========================================

function dibujarJuego() {
  let tiempoActual = obtenerTiempoCancion();
  let duracion = musicaJuego.duration || 251;
  let tiempoLocal = tiempoActual % duracion;
  let ciclo = floor(tiempoActual / duracion);

  dibujarPuntaje();

  // Zona de impacto
  noStroke();
  fill(255, 255, 255, 35);
  rect(lineaImpacto - margenImpacto, 190, margenImpacto * 2, 270);

  // Lineas de juego
  stroke("#00BFFF");
  strokeWeight(3);

  for (let y of lineas) {
    line(40, y, 660, y);
  }

  // Linea de impacto
  stroke("#FFFFFF");
  strokeWeight(7);
  line(lineaImpacto, 190, lineaImpacto, 460);

  stroke("#00BFFF");
  strokeWeight(2);
  line(lineaImpacto, 190, lineaImpacto, 460);

  // Crear notas normales
  while (
    tiempoActual >= tiempoSiguienteGolpe -
    obtenerTiempoViaje(tiempoSiguienteGolpe)
  ) {
    if (!esTiempoDeSecuencia(tiempoSiguienteGolpe)) {
      nuevoCirculo(tiempoSiguienteGolpe);
    } else {
      indicePatron++;
    }

    tiempoSiguienteGolpe += intervaloNotas;
  }

  // Crear secuencias especiales
  for (let secuencia of secuencias) {
    let momentoCreacion = secuencia.inicio -
      obtenerTiempoViaje(secuencia.inicio);

    if (
      tiempoLocal >= momentoCreacion &&
      secuencia.cicloCreado !== ciclo
    ) {
      let lineaElegida =
        patronLineas[indicePatron % patronLineas.length];

      for (let i = 0; i < secuencia.cantidad; i++) {
        nuevoCirculo(
          ciclo * duracion +
          secuencia.inicio +
          i * secuencia.separacion,
          lineaElegida
        );
      }

      indicePatron++;
      secuencia.cicloCreado = ciclo;
    }
  }

  // Dibujar circulos
  for (let i = circulos.length - 1; i >= 0; i--) {
    let c = circulos[i];

    c.x = lineaImpacto +
      (c.tiempoGolpe - tiempoActual) * 60 * c.velocidad;

    fill("#FF007A");
    stroke("#00BFFF");
    strokeWeight(3);
    circle(c.x, c.y, 40);

    if (c.x < lineaImpacto - margenImpacto) {
      terminarPartida();
      break;
    }
  }

  dibujarEfectos();
}


// ==========================================
// EVITAR NOTAS NORMALES EN LAS SECUENCIAS
// ==========================================

function esTiempoDeSecuencia(tiempo) {
  let duracion = musicaJuego.duration || 251;
  let tiempoLocal = tiempo % duracion;

  for (let secuencia of secuencias) {
    let fin = secuencia.inicio +
      (secuencia.cantidad - 1) * secuencia.separacion;

    if (
      tiempoLocal >= secuencia.inicio - 0.8 &&
      tiempoLocal <= fin + 0.8
    ) {
      return true;
    }
  }

  return false;
}


// ==========================================
// CREAR CIRCULOS
// ==========================================

function nuevoCirculo(tiempoGolpe, lineaForzada = null) {
  let lineaElegida;

  if (lineaForzada !== null) {
    lineaElegida = lineaForzada;
  } else {
    lineaElegida =
      patronLineas[indicePatron % patronLineas.length];

    indicePatron++;
  }

  circulos.push({
    x: 680,
    y: lineas[lineaElegida],
    tiempoGolpe: tiempoGolpe,
    velocidad: obtenerVelocidadMusical(tiempoGolpe)
  });
}


// ==========================================
// EFECTOS AL ACERTAR
// ==========================================

function crearEfecto(x, y) {
  for (let i = 0; i < 12; i++) {
    let angulo = random(TWO_PI);
    let fuerza = random(1, 4);

    efectos.push({
      tipo: "particula",
      x: x,
      y: y,
      vx: cos(angulo) * fuerza,
      vy: sin(angulo) * fuerza,
      vida: 1
    });
  }

  efectos.push({ tipo: "texto", x: x, y: y - 10, vida: 1 });
  efectos.push({ tipo: "anillo", x: x, y: y, vida: 1 });
}


function dibujarEfectos() {
  for (let i = efectos.length - 1; i >= 0; i--) {
    let e = efectos[i];
    e.vida -= 0.035;

    if (e.tipo === "particula") {
      e.x += e.vx;
      e.y += e.vy;

      noStroke();
      fill(0, 191, 255, 255 * e.vida);
      circle(e.x, e.y, 7 * e.vida + 2);
    }

    if (e.tipo === "texto") {
      noStroke();
      fill(255, 255, 255, 255 * e.vida);

      textFont("Vineta BT");
      textSize(17);
      text("+10", e.x, e.y - (1 - e.vida) * 35);
    }

    if (e.tipo === "anillo") {
      noFill();
      stroke(255, 0, 122, 255 * e.vida);
      strokeWeight(3);

      circle(e.x, e.y, 40 + (1 - e.vida) * 65);
    }

    if (e.vida <= 0) {
      efectos.splice(i, 1);
    }
  }
}


// ==========================================
// BOTONES
// ==========================================

function dibujarBoton(textoBoton, x, y) {
  rectMode(CENTER);
  noStroke();

  fill("#00BFFF");
  rect(x - 8, y + 8, 220, 60);

  fill("#080808");
  rect(x, y, 220, 60);

  fill("#FFFFFF");
  textFont("Vineta BT");
  textSize(textoBoton === "JUGAR DE NUEVO" ? 14 : 22);
  text(textoBoton, x, y);

  rectMode(CORNER);
}


// ==========================================
// FINALIZAR PARTIDA
// ==========================================

function terminarPartida() {
  if (pantalla !== "juego") return;

  pantalla = "final";
  musicaJuego.pause();
  musicaJuego.currentTime = 0;
}


function dibujarFinal() {
  background("#24002F");
  noStroke();

  textFont("Vineta BT");

  fill("#FF007A");
  textSize(40);
  text("GAME OVER", 350, 250);

  fill("#FFFFFF");
  textSize(25);
  text("SCORE: " + puntos, 350, 320);

  dibujarBoton("JUGAR DE NUEVO", 350, 420);
}


// ==========================================
// INTERACCIONES
// ==========================================
function mousePressed() {

  // Convertir coordenadas de pantalla a coordenadas del juego
  let mx = (mouseX - desplazamientoX) / escalaPantalla;
  let my = (mouseY - desplazamientoY) / escalaPantalla;

  // Deshacer la escala interna del juego
  mx = (mx - CENTRO_X) / ESCALA_JUEGO + CENTRO_X;
  my = (my - CENTRO_Y) / ESCALA_JUEGO + CENTRO_Y;

  if (pantalla === "inicio" || pantalla === "final") {

    let botonY = pantalla === "inicio" ? 465 : 420;

    if (
      mx > 240 && mx < 460 &&
      my > botonY - 30 && my < botonY + 30
    ) {
      iniciarPartida();
    }

  } else if (pantalla === "juego") {

    for (let i = circulos.length - 1; i >= 0; i--) {
      let c = circulos[i];

      let distancia = dist(mx, my, c.x, c.y);
      let estaEnZona = abs(c.x - lineaImpacto) <= margenImpacto;

      if (distancia < radioClic && estaEnZona) {
        puntos += 10;
        crearEfecto(c.x, c.y);
        circulos.splice(i, 1);
        return;
      }
    }
  }
}

// ==========================================
// INICIAR O REINICIAR
// ==========================================

function iniciarPartida() {
  puntos = 0;
  circulos = [];
  efectos = [];
  indicePatron = 0;

  tiempoCancionAnterior = 0;
  tiempoTotalCancion = 0;
  tiempoSiguienteGolpe = tiempoPrimerGolpe;

  for (let secuencia of secuencias) {
    secuencia.cicloCreado = -1;
  }

  pantalla = "juego";

  musicaJuego.currentTime = 0;

  musicaJuego.play().catch(error => {
    console.error("No se pudo reproducir la musica:", error);
  });

  videoIniciado = true;

  if (videoListo) {
    videoChica.loop();
  }
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
