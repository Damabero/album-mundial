// FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, doc, setDoc, getDoc, getDocs, collection, addDoc  
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 USA TU CONFIG REAL (NO CAMBIAR)
const firebaseConfig = {
  apiKey: "AIzaSyB8HRUZexCNOjyy8kIWDOEx3YZnDLq3ZbE",
  authDomain: "album-mundial-ce080.firebaseapp.com",
  projectId: "album-mundial-ce080",
  storageBucket: "album-mundial-ce080.appspot.com",
  messagingSenderId: "581513198557",
  appId: "1:581513198557:web:f3d95fa1c9123d5a93d434"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// -------- ESTADO --------
let estadoStickers = {};
let seleccionados = new Set();
let saveTimeout = null;
let equipoActual = 0; // Índice del equipo actual
let chatActual = null;
let nombreChat = "";

// -------- FILTROS ALBUM --------
let filtroNumero = "";
let filtroEstado = "todos";

// -------- EQUIPOS Y ESTRUCTURA --------
const EQUIPOS = [
  // GRUPO A
  { id: 1, nombre: "México", grupo: "A" },
  { id: 2, nombre: "Sudáfrica", grupo: "A" },
  { id: 3, nombre: "Corea del Sur", grupo: "A" },
  { id: 4, nombre: "República Checa", grupo: "A" },
  // GRUPO B
  { id: 5, nombre: "Canadá", grupo: "B" },
  { id: 6, nombre: "Bosnia y Herzegovina", grupo: "B" },
  { id: 7, nombre: "Qatar", grupo: "B" },
  { id: 8, nombre: "Suiza", grupo: "B" },
  // GRUPO C
  { id: 9, nombre: "Brasil", grupo: "C" },
  { id: 10, nombre: "Marruecos", grupo: "C" },
  { id: 11, nombre: "Haití", grupo: "C" },
  { id: 12, nombre: "Escocia", grupo: "C" },
  // GRUPO D
  { id: 13, nombre: "Estados Unidos", grupo: "D" },
  { id: 14, nombre: "Paraguay", grupo: "D" },
  { id: 15, nombre: "Australia", grupo: "D" },
  { id: 16, nombre: "Turquía", grupo: "D" },
  // GRUPO E
  { id: 17, nombre: "Alemania", grupo: "E" },
  { id: 18, nombre: "Curazao", grupo: "E" },
  { id: 19, nombre: "Costa de Marfil", grupo: "E" },
  { id: 20, nombre: "Ecuador", grupo: "E" },
  // GRUPO F
  { id: 21, nombre: "Países Bajos", grupo: "F" },
  { id: 22, nombre: "Japón", grupo: "F" },
  { id: 23, nombre: "Suecia", grupo: "F" },
  { id: 24, nombre: "Túnez", grupo: "F" },
  // GRUPO G
  { id: 25, nombre: "Bélgica", grupo: "G" },
  { id: 26, nombre: "Egipto", grupo: "G" },
  { id: 27, nombre: "Irán", grupo: "G" },
  { id: 28, nombre: "Nueva Zelanda", grupo: "G" },
  // GRUPO H
  { id: 29, nombre: "España", grupo: "H" },
  { id: 30, nombre: "Cabo Verde", grupo: "H" },
  { id: 31, nombre: "Arabia Saudita", grupo: "H" },
  { id: 32, nombre: "Uruguay", grupo: "H" },
  // GRUPO I
  { id: 33, nombre: "Francia", grupo: "I" },
  { id: 34, nombre: "Senegal", grupo: "I" },
  { id: 35, nombre: "Irak", grupo: "I" },
  { id: 36, nombre: "Noruega", grupo: "I" },
  // GRUPO J
  { id: 37, nombre: "Argentina", grupo: "J" },
  { id: 38, nombre: "Argelia", grupo: "J" },
  { id: 39, nombre: "Austria", grupo: "J" },
  { id: 40, nombre: "Jordania", grupo: "J" },
  // GRUPO K
  { id: 41, nombre: "Portugal", grupo: "K" },
  { id: 42, nombre: "R.D. del Congo", grupo: "K" },
  { id: 43, nombre: "Uzbekistán", grupo: "K" },
  { id: 44, nombre: "Colombia", grupo: "K" },
  // GRUPO L
  { id: 45, nombre: "Inglaterra", grupo: "L" },
  { id: 46, nombre: "Croacia", grupo: "L" },
  { id: 47, nombre: "Ghana", grupo: "L" },
  { id: 48, nombre: "Panamá", grupo: "L" }
];

// Nombres de láminas especiales
const LAMINAS_ESPECIALES = [
  "Copa Mundial",
  "Himno Nacional",
  "Debut Histórico",
  "Gol Icónico",
  "Momento Clásico",
  "Jugador Legendario",
  "Palmarés del Equipo",
  "Uniforme Histórico",
  "Estadio Nacional",
  "Celebración Épica",
  "Récord Nacional",
  "Figura del Mundial",
  "Joven Promesa",
  "Veterano Experiente",
  "Golden Boot",
  "Mejor Defensa",
  "Portero Influyente",
  "Asistencias Plus",
  "Equipo del Torneo",
  "Momento Especial"
];

// Estructura de láminas por equipo
function obtenerLaminasEquipo(nombreEquipo) {
  return [
    `Escudo ${nombreEquipo}`,
    "Equipo Completo",
    "Jugador 1",
    "Jugador 2",
    "Jugador 3",
    "Jugador 4",
    "Jugador 5",
    "Jugador 6",
    "Jugador 7",
    "Jugador 8",
    "Jugador 9",
    "Jugador 10",
    "Jugador 11",
    "Jugador 12",
    "Jugador 13",
    "Jugador 14",
    "Jugador 15",
    "Jugador 16",
    "Jugador 17",
    "Jugador 18"
  ];
}

// Inicializar estado de stickers con la nueva estructura
function inicializarEsquema() {
  // 960 láminas para 48 equipos × 20 láminas cada uno
  for (let i = 1; i <= 960; i++) {
    estadoStickers[i] = 0; // 0 = falta, 1 = normal, >1 = duplicada
  }
  
  // Crear entrada para láminas especiales (961-980)
  LAMINAS_ESPECIALES.forEach((lamina, index) => {
    const numero = 960 + index + 1;
    estadoStickers[numero] = 0;
  });
  
  console.log("✅ Esquema de 980 láminas inicializado");
}

// Ejecutar al cargar
inicializarEsquema();

// -------- PAÍSES, DEPARTAMENTOS, CIUDADES (country-state-city) --------
let paisesLista = [];
let estadosCacheados = {}; // Caché de estados por país
let ciudadesCacheadas = {}; // Caché de ciudades por país/estado

const API_BASE = "http://localhost:3000";

async function cargarDatos() {
  try {
    console.log("🚀 Conectando al servidor de países...");
    const response = await fetch(`${API_BASE}/api/countries`);
    const result = await response.json();
    
    if (result.success && result.data) {
      paisesLista = result.data;
      console.log(`✅ Cargados ${paisesLista.length} países desde country-state-city`);
    } else {
      throw new Error("No se pudieron cargar los países");
    }
  } catch (error) {
    console.error("❌ Error cargando países:", error);
    alert("Error al conectar con el servidor. Asegúrate de ejecutar: npm start");
  }
}

async function obtenerEstados(pais) {
  try {
    // Si ya están cacheados, devolverlos
    if (estadosCacheados[pais]) {
      console.log(`📦 Estados de ${pais} obtenidos del caché`);
      return estadosCacheados[pais];
    }

    console.log(`🔍 Buscando estados de ${pais}...`);
    const response = await fetch(`${API_BASE}/api/states/${encodeURIComponent(pais)}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      estadosCacheados[pais] = result.data;
      console.log(`✅ ${result.data.length} estados de ${pais} cacheados`);
      return result.data;
    }
    
    console.error(`⚠️ No se encontraron estados para ${pais}`);
    return [];
  } catch (error) {
    console.error("❌ Error cargando estados:", error);
    return [];
  }
}

async function obtenerCiudades(pais, estado) {
  try {
    const cacheKey = `${pais}|${estado}`;
    
    // Si ya están cacheadas, devolverlas
    if (ciudadesCacheadas[cacheKey]) {
      console.log(`📦 ${ciudadesCacheadas[cacheKey].length} ciudades cacheadas`);
      return ciudadesCacheadas[cacheKey];
    }

    console.log(`🔍 Buscando ciudades de ${estado}, ${pais}...`);
    const response = await fetch(`${API_BASE}/api/cities/${encodeURIComponent(pais)}/${encodeURIComponent(estado)}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      ciudadesCacheadas[cacheKey] = result.data;
      console.log(`✅ ${result.data.length} ciudades de ${estado} cacheadas`);
      return result.data;
    }
    
    console.error(`⚠️ No se encontraron ciudades para ${estado}`);
    return [];
  } catch (error) {
    console.error("❌ Error cargando ciudades:", error);
    return [];
  }
}

window.actualizarDepartamentos = async function() {
  const paisSelect = document.getElementById("pais");
  const deptoSelect = document.getElementById("departamento");
  const ciudadSelect = document.getElementById("ciudad");
  
  const pais = paisSelect.value;
  deptoSelect.innerHTML = '<option value="">Cargando...</option>';
  ciudadSelect.innerHTML = '<option value="">Selecciona ciudad</option>';
  
  if (!pais) {
    deptoSelect.innerHTML = '<option value="">Selecciona provincia/departamento</option>';
    return;
  }
  
  const estados = await obtenerEstados(pais);
  deptoSelect.innerHTML = '<option value="">Selecciona provincia/departamento</option>';
  
  estados.forEach(estado => {
    const opt = document.createElement("option");
    opt.value = estado.nombre;
    opt.textContent = estado.nombre;
    deptoSelect.appendChild(opt);
  });
};

window.actualizarCiudades = async function() {
  const paisSelect = document.getElementById("pais");
  const deptoSelect = document.getElementById("departamento");
  const ciudadSelect = document.getElementById("ciudad");
  
  const pais = paisSelect.value;
  const estado = deptoSelect.value;
  
  ciudadSelect.innerHTML = '<option value="">Cargando...</option>';
  
  if (!pais || !estado) {
    ciudadSelect.innerHTML = '<option value="">Selecciona ciudad</option>';
    return;
  }
  
  const ciudades = await obtenerCiudades(pais, estado);
  ciudadSelect.innerHTML = '<option value="">Selecciona ciudad</option>';
  
  if (ciudades.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "No hay ciudades disponibles";
    opt.disabled = true;
    ciudadSelect.appendChild(opt);
    return;
  }
  
  ciudades.forEach(ciudad => {
    const opt = document.createElement("option");
    opt.value = ciudad;
    opt.textContent = ciudad;
    ciudadSelect.appendChild(opt);
  });
};

function cargarPaises() {
  // Si no hay países cargados, cargar primero
  if (paisesLista.length === 0) {
    cargarDatos().then(() => {
      const paisSelect = document.getElementById("pais");
      if (!paisSelect) return;
      
      paisSelect.innerHTML = '<option value="">Selecciona país</option>';
      
      paisesLista.forEach(pais => {
        const opt = document.createElement("option");
        opt.value = pais;
        opt.textContent = pais;
        paisSelect.appendChild(opt);
      });
    });
    return;
  }
  
  const paisSelect = document.getElementById("pais");
  if (!paisSelect || paisesLista.length === 0) return;
  
  paisSelect.innerHTML = '<option value="">Selecciona país</option>';
  
  paisesLista.forEach(pais => {
    const opt = document.createElement("option");
    opt.value = pais;
    opt.textContent = pais;
    paisSelect.appendChild(opt);
  });
}

// -------- TABS --------
window.mostrarTab = function(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.style.display = "none");
  document.getElementById(tabId).style.display = "block";

  // Cargar países cuando se abre el tab de registro
  if (tabId === "registro-form") {
    cargarPaises();
  }

  // Cargar información de cuenta cuando se abre ese tab
  if (tabId === "cuenta") {
    cargarInformacionCuenta();
  }

  if (tabId === "album") {
    cargarSelectEquipos();
    generarEstampillas();
  }
  if (tabId === "intercambios") cargarMisIntercambios();
  if (tabId === "progreso") cargarUsuarios();
  if (tabId === "chat") cargarChats();
  if (tabId === "inicio") cargarInicio();
};

// -------- MENU DE USUARIO --------
window.toggleUserMenu = function() {
  const dropdown = document.getElementById("user-dropdown");
  dropdown.classList.toggle("show");
  
  // Cerrar al hacer clic afuera
  document.addEventListener("click", function(event) {
    if (!event.target.closest(".navbar-user-menu")) {
      dropdown.classList.remove("show");
    }
  });
};

// -------- AUTH --------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Ocultar botones de login/registro
    document.getElementById("navbar-auth-tabs").style.display = "none";
    
    // Mostrar menú de usuario
    const userMenu = document.getElementById("navbar-user-menu");
    userMenu.style.display = "block";
    
    // Obtener nombre de usuario
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    const userName = userDoc.exists() ? (userDoc.data().usuario || userDoc.data().nombre || user.email) : user.email;
    document.getElementById("username-display").textContent = userName;
    
    mostrarTab("inicio");
    await cargarMiProgreso(user.uid);
    generarEstampillas();

  } else {
    // Mostrar botones de login/registro
    document.getElementById("navbar-auth-tabs").style.display = "flex";
    
    // Ocultar menú de usuario
    document.getElementById("navbar-user-menu").style.display = "none";
    
    mostrarTab("inicio");
    await cargarDatos();
    cargarPaises();
  }
});

// -------- REGISTRO --------
window.registro = async () => {
  const usuario = document.getElementById("usuario-register").value.trim();
  const email = document.getElementById("email-register").value.trim();
  const password = document.getElementById("password-register").value.trim();

  const paisSelect = document.getElementById("pais");
  const deptoSelect = document.getElementById("departamento");
  const ciudadSelect = document.getElementById("ciudad");

  const pais = paisSelect.options[paisSelect.selectedIndex].text;
  const departamento = deptoSelect.options[deptoSelect.selectedIndex].text;
  const ciudad = ciudadSelect.value;

  if (!usuario || !email || !password || !paisSelect.value || !deptoSelect.value || !ciudadSelect.value) {
    alert("Completa todos los campos");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "usuarios", cred.user.uid), {
      usuario,
      email,
      nombre: usuario,
      pais,
      departamento,
      ciudad,
      duplicadas: [],
      necesita: [],
      obtenidas: 0
    });
    
    alert("¡Registro exitoso! Redirigiendo...");
  } catch (error) {
    alert("Error en el registro: " + error.message);
  }
};

// -------- LOGIN --------
window.login = async () => {
  const email = document.getElementById("email-login").value.trim();
  const password = document.getElementById("password-login").value.trim();

  if (!email || !password) {
    alert("Completa email y contraseña");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Error al iniciar sesión: " + error.message);
  }
};

// -------- LOGOUT --------
window.logout = async () => {
  await signOut(auth);
  location.reload();
};

// -------- INFORMACIÓN DE CUENTA --------
async function cargarInformacionCuenta() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    if (!userDoc.exists()) return;

    const data = userDoc.data();

    // Llenar los campos con la información actual
    document.getElementById("cuenta-usuario").value = data.usuario || data.nombre || "";
    document.getElementById("cuenta-email").value = user.email || "";

    // Cargar los países primero
    if (paisesLista.length === 0) {
      await cargarDatos();
    }

    const paisSelect = document.getElementById("cuenta-pais");
    paisSelect.innerHTML = '<option value="">Selecciona país</option>';
    paisesLista.forEach(pais => {
      const opt = document.createElement("option");
      opt.value = pais;
      opt.textContent = pais;
      paisSelect.appendChild(opt);
    });

    // Establecer el país actual
    paisSelect.value = data.pais || "";

    // Cargar departamentos
    const estados = await obtenerEstados(data.pais);
    const deptoSelect = document.getElementById("cuenta-departamento");
    deptoSelect.innerHTML = '<option value="">Selecciona provincia/departamento</option>';
    estados.forEach(estado => {
      const opt = document.createElement("option");
      opt.value = estado.nombre;
      opt.textContent = estado.nombre;
      deptoSelect.appendChild(opt);
    });
    deptoSelect.value = data.departamento || "";

    // Cargar ciudades
    const ciudades = await obtenerCiudades(data.pais, data.departamento);
    const ciudadSelect = document.getElementById("cuenta-ciudad");
    ciudadSelect.innerHTML = '<option value="">Selecciona ciudad</option>';
    ciudades.forEach(ciudad => {
      const opt = document.createElement("option");
      opt.value = ciudad;
      opt.textContent = ciudad;
      ciudadSelect.appendChild(opt);
    });
    ciudadSelect.value = data.ciudad || "";

  } catch (error) {
    console.error("Error cargando información de cuenta:", error);
    alert("Error al cargar la información de cuenta");
  }
}

window.actualizarDepartamentosEdicion = async function() {
  const paisSelect = document.getElementById("cuenta-pais");
  const deptoSelect = document.getElementById("cuenta-departamento");
  const ciudadSelect = document.getElementById("cuenta-ciudad");

  const pais = paisSelect.value;
  deptoSelect.innerHTML = '<option value="">Cargando...</option>';
  ciudadSelect.innerHTML = '<option value="">Selecciona ciudad</option>';

  if (!pais) {
    deptoSelect.innerHTML = '<option value="">Selecciona provincia/departamento</option>';
    return;
  }

  const estados = await obtenerEstados(pais);
  deptoSelect.innerHTML = '<option value="">Selecciona provincia/departamento</option>';

  estados.forEach(estado => {
    const opt = document.createElement("option");
    opt.value = estado.nombre;
    opt.textContent = estado.nombre;
    deptoSelect.appendChild(opt);
  });
};

window.actualizarCiudadesEdicion = async function() {
  const paisSelect = document.getElementById("cuenta-pais");
  const deptoSelect = document.getElementById("cuenta-departamento");
  const ciudadSelect = document.getElementById("cuenta-ciudad");

  const pais = paisSelect.value;
  const estado = deptoSelect.value;

  ciudadSelect.innerHTML = '<option value="">Cargando...</option>';

  if (!pais || !estado) {
    ciudadSelect.innerHTML = '<option value="">Selecciona ciudad</option>';
    return;
  }

  const ciudades = await obtenerCiudades(pais, estado);
  ciudadSelect.innerHTML = '<option value="">Selecciona ciudad</option>';

  if (ciudades.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "No hay ciudades disponibles";
    opt.disabled = true;
    ciudadSelect.appendChild(opt);
    return;
  }

  ciudades.forEach(ciudad => {
    const opt = document.createElement("option");
    opt.value = ciudad;
    opt.textContent = ciudad;
    ciudadSelect.appendChild(opt);
  });
};

window.guardarCambiosCuenta = async function() {
  const user = auth.currentUser;
  if (!user) return;

  const pais = document.getElementById("cuenta-pais").value;
  const departamento = document.getElementById("cuenta-departamento").value;
  const ciudad = document.getElementById("cuenta-ciudad").value;

  if (!pais || !departamento || !ciudad) {
    alert("Completa todos los campos de ubicación");
    return;
  }

  try {
    await setDoc(doc(db, "usuarios", user.uid), {
      pais,
      departamento,
      ciudad
    }, { merge: true });

    alert("¡Cambios guardados exitosamente!");
    mostrarTab("album");
  } catch (error) {
    console.error("Error guardando cambios:", error);
    alert("Error al guardar los cambios");
  }
};
function autoGuardar() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(guardarProgreso, 1000);
}

async function guardarProgreso() {
  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "usuarios", user.uid));
  const base = snap.data();

  let duplicadas = [];
  let necesita = [];
  let obtenidas = [];

  // Iterar sobre todas las 980 láminas (números del 1 al 980)
  for (let i = 1; i <= 980; i++) {
    const valor = estadoStickers[i];

    if (valor === 0) {
      necesita.push(i.toString());
    } else {
      obtenidas.push(i.toString());
      if (valor > 1) {
        duplicadas.push(i.toString());
      }
    }
  }

  await setDoc(doc(db, "usuarios", user.uid), {
    ...base,
    duplicadas,
    necesita,
    obtenidas
  });

  console.log(`✅ Progreso guardado: ${obtenidas.length} láminas obtenidas`);
}

// -------- CARGAR MI PROGRESO --------
async function cargarMiProgreso(uid) {
  try {
    const snap = await getDoc(doc(db, "usuarios", uid));
    if (!snap.exists()) return;

    const datos = snap.data();
    
    // Reinicializar todas como faltantes
    for (let i = 1; i <= 980; i++) {
      estadoStickers[i] = 0;
    }

    // Cargar láminas faltantes
    if (datos.necesita && Array.isArray(datos.necesita)) {
      datos.necesita.forEach(numero => {
        estadoStickers[parseInt(numero)] = 0;
      });
    }

    // Cargar láminas obtenidas (sin duplicados)
    if (datos.obtenidas && Array.isArray(datos.obtenidas)) {
      datos.obtenidas.forEach(numero => {
        const num = parseInt(numero);
        if (!estadoStickers[num]) {
          estadoStickers[num] = 1;
        }
      });
    }

    // Cargar láminas duplicadas
    if (datos.duplicadas && Array.isArray(datos.duplicadas)) {
      datos.duplicadas.forEach(numero => {
        const num = parseInt(numero);
        const actual = estadoStickers[num] || 0;
        estadoStickers[num] = Math.max(2, actual);
      });
    }

    console.log(`✅ Progreso cargado: ${datos.obtenidas ? datos.obtenidas.length : 0} láminas`);
  } catch (error) {
    console.error("❌ Error cargando progreso:", error);
  }
}

// -------- ALBUM --------
// -------- NAVEGACIÓN DE EQUIPOS --------
window.equipoAnterior = function() {
  if (equipoActual > 0) {
    equipoActual--;
    const select = document.getElementById("selectEquipo");
    select.value = equipoActual.toString();
    generarEstampillas();
  }
};

window.equipoSiguiente = function() {
  if (equipoActual < EQUIPOS.length - 1) {
    equipoActual++;
    const select = document.getElementById("selectEquipo");
    select.value = equipoActual.toString();
    generarEstampillas();
  }
};

window.cambiarEquipo = function(index) {
  equipoActual = parseInt(index);
  generarEstampillas();
};

// -------- GENERAR ESTAMPILLAS --------
function generarEstampillas() {
  const cont = document.getElementById("estampillas");
  if (!cont) return;

  cont.innerHTML = "";

  // Obtener equipo actual
  const equipo = EQUIPOS[equipoActual];
  if (!equipo) return;

  // Actualizar nombre del equipo
  document.getElementById("nombreEquipo").textContent = `${equipo.grupo}. ${equipo.nombre}`;

  // Obtener láminas del equipo actual
  const laminas = obtenerLaminasEquipo(equipo.nombre);
  let estampillasAMostrar = [];

  // Calcular el número inicial de lámina para este equipo (continuidad)
  const numeroInicial = equipoActual * 20 + 1;

  // Aplicar filtros
  laminas.forEach((lamina, index) => {
    const numero = numeroInicial + index; // Número continuo del 1 al 960
    const valor = estadoStickers[numero];

    // Filtro por búsqueda (número o nombre)
    if (filtroNumero) {
      const busqueda = filtroNumero.toLowerCase();
      if (!numero.toString().includes(busqueda) && !lamina.toLowerCase().includes(busqueda)) {
        return;
      }
    }

    // Filtro por estado
    if (filtroEstado !== "todos") {
      if (filtroEstado === "obtenidos" && valor === 0) return;
      if (filtroEstado === "faltantes" && valor !== 0) return;
      if (filtroEstado === "repetidos" && valor <= 1) return;
    }

    estampillasAMostrar.push({ numero, lamina, valor });
  });

  // Mostrar mensaje si no hay estampillas
  if (estampillasAMostrar.length === 0) {
    cont.innerHTML = '<div style="text-align: center; padding: 30px; color: #666; font-size: 16px;">No hay láminas que coincidan con los filtros</div>';
    return;
  }

  // Generar estampillas filtradas
  estampillasAMostrar.forEach(item => {
    const valor = item.valor;
    let clase = "falta";
    if (valor === 1) clase = "normal";
    if (valor > 1) clase = "duplicada";

    cont.innerHTML += `
      <div class="sticker ${clase}" title="${item.lamina}">
        <div style="font-size: 12px; font-weight: 700; margin-bottom: 5px;">#${item.numero}</div>
        <div style="font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 5px;">${item.lamina}</div>
        <div>
          <button onclick="cambiarValor(${item.numero}, -1)">-</button>
          <span>${valor}</span>
          <button onclick="cambiarValor(${item.numero}, 1)">+</button>
        </div>
      </div>
    `;
  });
}

// -------- CAMBIAR VALOR DE ESTAMPILLA --------
window.cambiarValor = function(numero, cantidad) {
  const valorActual = estadoStickers[numero] || 0;
  const nuevoValor = Math.max(0, valorActual + cantidad);
  estadoStickers[numero] = nuevoValor;
  
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    guardarProgreso();
  }, 500);
  
  generarEstampillas();
};

// -------- LIMPIAR TODO Y COMPLETAR TODO --------
window.limpiarTodo = function() {
  if (confirm("¿Estás seguro de que deseas limpiar todas las láminas?")) {
    Object.keys(estadoStickers).forEach(key => {
      estadoStickers[key] = 0;
    });
    guardarProgreso();
    generarEstampillas();
  }
};

window.completarTodo = function() {
  if (confirm("¿Estás seguro de que deseas completar todas las láminas?")) {
    Object.keys(estadoStickers).forEach(key => {
      estadoStickers[key] = 1;
    });
    guardarProgreso();
    generarEstampillas();
  }
};

// -------- LIMPIAR Y COMPLETAR EQUIPO ACTUAL --------
window.limpiarEquipoActual = function() {
  const equipo = EQUIPOS[equipoActual];
  if (!equipo) return;

  if (confirm(`¿Limpiar todas las láminas de ${equipo.nombre}?`)) {
    const numeroInicial = equipoActual * 20 + 1;
    for (let i = 0; i < 20; i++) {
      estadoStickers[numeroInicial + i] = 0;
    }
    guardarProgreso();
    generarEstampillas();
  }
};

window.completarEquipoActual = function() {
  const equipo = EQUIPOS[equipoActual];
  if (!equipo) return;

  if (confirm(`¿Completar todas las láminas de ${equipo.nombre}?`)) {
    const numeroInicial = equipoActual * 20 + 1;
    for (let i = 0; i < 20; i++) {
      estadoStickers[numeroInicial + i] = 1;
    }
    guardarProgreso();
    generarEstampillas();
  }
};

// -------- CARGAR SELECTOR DE EQUIPOS --------
function cargarSelectEquipos() {
  const select = document.getElementById("selectEquipo");
  if (!select) return;

  select.innerHTML = '<option value="">-- Selecciona un equipo --</option>';
  
  EQUIPOS.forEach((equipo, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.text = `${equipo.grupo}. ${equipo.nombre}`;
    select.appendChild(option);
  });

  select.value = equipoActual;
}

// Cargar selector cuando se abre el tab
document.addEventListener("DOMContentLoaded", function() {
  setTimeout(() => cargarSelectEquipos(), 500);
});



// -------- FUNCIONES DE FILTROS --------
window.aplicarFiltros = function() {
  filtroNumero = document.getElementById("search-numero").value.toLowerCase();
  filtroEstado = document.getElementById("filter-estado").value;
  generarEstampillas();
};

window.limpiarFiltros = function() {
  document.getElementById("search-numero").value = "";
  document.getElementById("filter-estado").value = "todos";
  filtroNumero = "";
  filtroEstado = "todos";
  generarEstampillas();
};

// -------- INTERCAMBIOS --------
async function cargarMisIntercambios() {
  const cont = document.getElementById("matches");
  if (!cont) return;

  cont.innerHTML = "Buscando intercambios...";

  const user = auth.currentUser;
  if (!user) return;

  const miSnap = await getDoc(doc(db, "usuarios", user.uid));
  if (!miSnap.exists()) return;

  const mi = miSnap.data();

  const snapshot = await getDocs(collection(db, "usuarios"));

  let resultados = [];

  snapshot.forEach(docu => {
    if (docu.id === user.uid) return;

    const otro = docu.data();

    // 📍 FILTRO POR CIUDAD
    if (otro.ciudad !== mi.ciudad) return;

    const yoDoy = mi.duplicadas.filter(x => otro.necesita.includes(x));
    const otroDa = otro.duplicadas.filter(x => mi.necesita.includes(x));

    if (yoDoy.length > 0 && otroDa.length > 0) {
      resultados.push({
        id: docu.id,
        usuario: otro.usuario || otro.nombre || "Usuario",
        ciudad: otro.ciudad,
        yoDoy,
        otroDa
      });
    }
  });

  // 🎯 RENDER
  cont.innerHTML = "";

  if (resultados.length === 0) {
    cont.innerHTML = `
      <div class="intercambios-empty">
        <span>😴 No hay intercambios disponibles en tu ciudad</span>
      </div>
    `;
    return;
  }

  resultados.forEach(r => {
    cont.innerHTML += `
      <div class="intercambio-card">
        <div class="intercambio-header">
          <div class="intercambio-usuario">${r.usuario}</div>
          <div class="intercambio-count">${r.yoDoy.length + r.otroDa.length} intercambio(s)</div>
        </div>
        
        <div class="intercambio-body">
          <div class="intercambio-seccion">
            <span class="intercambio-label">Puedes dar:</span>
            <span class="intercambio-numeros" style="color: #51cf66;">${r.yoDoy.join(", ")}</span>
          </div>
          
          <div class="intercambio-seccion">
            <span class="intercambio-label">Puedes recibir:</span>
            <span class="intercambio-numeros" style="color: #2196f3;">${r.otroDa.join(", ")}</span>
          </div>
        </div>
        
        <button class="intercambio-btn" onclick="abrirChatDesdeMatch('${r.id}', '${r.usuario}')">
          💬 Chatear
        </button>
      </div>
    `;
  });
}

// -------- PROGRESO --------
async function cargarUsuarios() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    // Calcular estadísticas del usuario
    let obtenidas = 0;
    let faltantes = 0;
    let duplicadas = 0;

    for (let i = 1; i <= 980; i++) {
      const valor = estadoStickers[i];
      
      if (valor === 0) {
        faltantes++;
      } else {
        obtenidas++;
        if (valor > 1) {
          duplicadas++;
        }
      }
    }

    // Calcular porcentaje
    const totalLaminas = 980;
    const porcentaje = Math.round((obtenidas / totalLaminas) * 100);

    // Actualizar elementos del DOM
    document.getElementById("total-obtenidas").textContent = obtenidas;
    document.getElementById("total-faltantes").textContent = faltantes;
    document.getElementById("total-duplicadas").textContent = duplicadas;
    document.getElementById("porcentaje-progreso").textContent = `${porcentaje}%`;
    
    const progressBar = document.getElementById("progress-bar");
    progressBar.style.width = `${porcentaje}%`;
    progressBar.textContent = `${porcentaje}%`;

    console.log(`✅ Progreso actualizado: ${obtenidas}/980 (${porcentaje}%)`);
  } catch (error) {
    console.error("❌ Error cargando progreso:", error);
  }
}

// -------- CARGAR ESTADÍSTICAS INICIO --------
async function cargarInicio() {
  try {
    // Obtener el número de usuarios
    const usuariosSnap = await getDocs(collection(db, "usuarios"));
    const totalUsuarios = usuariosSnap.size;
    document.getElementById("stat-usuarios").textContent = totalUsuarios;
    
    // Obtener número de conversaciones (intercambios realizados)
    const conversacionesSnap = await getDocs(collection(db, "conversaciones"));
    const totalIntercambios = conversacionesSnap.size;
    document.getElementById("stat-intercambios").textContent = totalIntercambios;
    
    // Obtener países representados
    let paisesSet = new Set();
    usuariosSnap.forEach(doc => {
      const datos = doc.data();
      if (datos.pais) paisesSet.add(datos.pais);
    });
    document.getElementById("stat-paises").textContent = paisesSet.size;
    
    console.log("✅ Estadísticas del inicio cargadas");
  } catch (error) {
    console.error("❌ Error cargando estadísticas:", error);
  }
}

// -------- ABRIR CHAT DESDE MATCH --------
window.abrirChatDesdeMatch = async function(uid, nombre) {
  const user = auth.currentUser;
  if (!user) return;

  // Obtener el nombre de usuario del perfil actual
  const miUser = await getDoc(doc(db, "usuarios", user.uid));
  const miNombre = miUser.exists() ? (miUser.data().usuario || miUser.data().nombre || user.email) : user.email;

  // Crear o actualizar conversación en Firestore
  const conversacionId = [user.uid, uid].sort().join("_");
  
  await setDoc(doc(db, "conversaciones", conversacionId), {
    usuarios: [user.uid, uid],
    nombres: [miNombre, nombre],
    ultimaActividad: Date.now(),
    creadaEn: Date.now()
  }, { merge: true });

  chatActual = uid;
  nombreChat = nombre;

  mostrarTab("chat");
  cargarMensajes();
};

window.enviarMensaje = async function() {
  const input = document.getElementById("mensaje");
  const texto = input.value.trim();

  if (!texto) {
    alert("Escribe un mensaje");
    return;
  }

  if (!chatActual) {
    alert("Selecciona un chat primero");
    return;
  }

  try {
    const user = auth.currentUser;
    
    await addDoc(collection(db, "chats"), {
      from: user.uid,
      to: chatActual,
      texto: texto,
      fecha: Date.now()
    });

    // Actualizar última actividad de la conversación
    const conversacionId = [user.uid, chatActual].sort().join("_");
    await setDoc(doc(db, "conversaciones", conversacionId), {
      ultimaActividad: Date.now()
    }, { merge: true });

    input.value = "";

    // Recargar mensajes y lista de chats
    cargarMensajes();
    cargarChats();

  } catch (err) {
    console.error(err);
    alert("Error enviando mensaje");
  }
};

async function cargarMensajes() {
  const box = document.getElementById("chatBox");
  const titulo = document.getElementById("chatTitulo");
  
  if (!box || !chatActual) return;

  titulo.textContent = `Chat con ${nombreChat}`;
  box.innerHTML = "";
  box.classList.remove("chat-empty");

  const snapshot = await getDocs(collection(db, "chats"));

  let mensajes = [];

  snapshot.forEach(docu => {
    const msg = docu.data();

    if (
      (msg.from === auth.currentUser.uid && msg.to === chatActual) ||
      (msg.from === chatActual && msg.to === auth.currentUser.uid)
    ) {
      mensajes.push(msg);
    }
  });

  // 🔥 ORDENAR POR FECHA
  mensajes.sort((a, b) => a.fecha - b.fecha);

  if (mensajes.length === 0) {
    box.innerHTML = '<div class="chat-empty"><span>Aún no hay mensajes. ¡Sé el primero en escribir!</span></div>';
    return;
  }

  mensajes.forEach(msg => {
    const esEnviado = msg.from === auth.currentUser.uid;
    const claseEstilo = esEnviado ? "sent" : "received";
    
    const fecha = new Date(msg.fecha);
    const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    box.innerHTML += `
      <div class="chat-message ${claseEstilo}">
        ${msg.texto}
        <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">${hora}</div>
      </div>
    `;
  });

  box.scrollTop = box.scrollHeight;
}

// -------- CARGAR LISTA DE CHATS --------
async function cargarChats() {
  const listaCont = document.getElementById("chatList");
  if (!listaCont) return;

  const user = auth.currentUser;
  if (!user) return;

  listaCont.innerHTML = '<div class="chat-list-empty">Cargando chats...</div>';

  const snapshot = await getDocs(collection(db, "conversaciones"));
  let conversaciones = [];

  snapshot.forEach(docu => {
    const conv = docu.data();
    // Si el usuario actual está en esta conversación
    if (conv.usuarios && conv.usuarios.includes(user.uid)) {
      conversaciones.push({
        id: docu.id,
        data: conv
      });
    }
  });

  // Ordenar por última actividad
  conversaciones.sort((a, b) => (b.data.ultimaActividad || 0) - (a.data.ultimaActividad || 0));

  if (conversaciones.length === 0) {
    listaCont.innerHTML = '<div class="chat-list-empty">No hay chats aún</div>';
    return;
  }

  listaCont.innerHTML = "";
  conversaciones.forEach(conv => {
    // Obtener el nombre del otro usuario
    const indice = conv.data.usuarios[0] === user.uid ? 1 : 0;
    const nombreOtro = conv.data.nombres[indice];
    const idOtro = conv.data.usuarios[indice];

    // Obtener la primera letra del nombre para el avatar
    const inicial = nombreOtro.charAt(0).toUpperCase();

    // Obtener último mensaje
    const ultimoMensaje = "Última actividad hace poco";

    const claseActiva = chatActual === idOtro ? "active" : "";

    listaCont.innerHTML += `
      <div class="chat-user ${claseActiva}" onclick="seleccionarChat('${idOtro}', '${nombreOtro}')">
        <div class="chat-user-avatar">${inicial}</div>
        <div class="chat-user-info">
          <div class="chat-user-name">${nombreOtro}</div>
          <div class="chat-user-preview">${ultimoMensaje}</div>
        </div>
      </div>
    `;
  });
}

// -------- SELECCIONAR CHAT DE LA LISTA --------
window.seleccionarChat = function(uid, nombre) {
  chatActual = uid;
  nombreChat = nombre;
  
  // Marcar como activo
  document.querySelectorAll(".chat-user").forEach(el => el.classList.remove("active"));
  event.currentTarget.classList.add("active");
  
  cargarMensajes();
};

// INIT
generarEstampillas();