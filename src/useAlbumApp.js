import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth, db } from "./firebase";
import { EQUIPOS, createInitialStickerState, getAllCollectionStickers, getTeamStickers } from "./data";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const TOTAL_LAMINAS = EQUIPOS.length * 20; // 48 equipos x 20 figuras = 960

export function useAlbumApp() {
  const [currentTab, setCurrentTab] = useState("inicio");
  const [authUser, setAuthUser] = useState(null);
  const [displayName, setDisplayName] = useState("Usuario");
  const [stickerState, setStickerState] = useState(createInitialStickerState);
  const [progressReady, setProgressReady] = useState(false);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [countries, setCountries] = useState([]);
  const [registerStates, setRegisterStates] = useState([]);
  const [registerCities, setRegisterCities] = useState([]);
  const [accountStates, setAccountStates] = useState([]);
  const [accountCities, setAccountCities] = useState([]);
  const [homeStats, setHomeStats] = useState({ usuarios: "-", intercambios: "-", paises: "-" });
  const [matches, setMatches] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatName, setChatName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    usuario: "",
    email: "",
    password: "",
    pais: "",
    departamento: "",
    ciudad: ""
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [accountForm, setAccountForm] = useState({
    usuario: "",
    email: "",
    pais: "",
    departamento: "",
    ciudad: ""
  });

  const statesCacheRef = useRef({});
  const citiesCacheRef = useRef({});
  const saveTimeoutRef = useRef(null);

  const progressStats = useMemo(() => {
    let obtenidas = 0;
    let faltantes = 0;
    let duplicadas = 0;

    for (let index = 1; index <= TOTAL_LAMINAS; index += 1) {
      const value = stickerState[index];
      if (value === 0) faltantes += 1;
      else {
        obtenidas += 1;
        if (value > 1) duplicadas += 1;
      }
    }

    return {
      obtenidas,
      faltantes,
      duplicadas,
      porcentaje: Math.round((obtenidas / TOTAL_LAMINAS) * 100)
    };
  }, [stickerState]);

  const currentTeam = EQUIPOS[currentTeamIndex];
  const isGlobalSearch = filterText.trim().length > 0;

  const filteredStickers = useMemo(() => {
    const search = filterText.trim().toLowerCase();
    const baseItems = search
      ? getAllCollectionStickers()
      : currentTeam
        ? getTeamStickers(currentTeam.nombre).map((lamina, index) => ({
            numero: currentTeamIndex * 20 + 1 + index,
            lamina,
            equipo: currentTeam.nombre,
            grupo: currentTeam.grupo
          }))
        : [];

    return baseItems
      .map((item) => ({
        ...item,
        valor: stickerState[item.numero]
      }))
      .filter((item) => {
        if (search) {
          const matchesSearch =
            item.numero.toString().includes(search) ||
            item.lamina.toLowerCase().includes(search) ||
            item.equipo.toLowerCase().includes(search);
          if (!matchesSearch) return false;
        }

        if (filterStatus === "obtenidos" && item.valor === 0) return false;
        if (filterStatus === "faltantes" && item.valor !== 0) return false;
        if (filterStatus === "repetidos" && item.valor <= 1) return false;
        return true;
      });
  }, [currentTeam, currentTeamIndex, filterStatus, filterText, stickerState]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthUser(null);
        setDisplayName("Usuario");
        setCurrentTab("inicio");
        setProgressReady(false);
        setStickerState(createInitialStickerState());
        setConversations([]);
        setMessages([]);
        setChatTarget(null);
        setChatName("");
        await loadCountries();
        return;
      }

      setAuthUser(user);
      setCurrentTab("inicio");
      await hydrateUserSession(user.uid, user.email);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser || !progressReady) return undefined;

    window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      saveProgress(stickerState);
    }, 500);

    return () => window.clearTimeout(saveTimeoutRef.current);
  }, [authUser, progressReady, stickerState]);

  useEffect(() => {
    if (currentTab === "registro-form" || currentTab === "cuenta") loadCountries();
    if (currentTab === "cuenta" && authUser) loadAccountInformation();
    if (currentTab === "intercambios" && authUser) loadMatches();
    if (currentTab === "chat" && authUser) loadConversations();
    if (currentTab === "inicio") loadHomeStats();
  }, [authUser, currentTab]);

  useEffect(() => {
    if (currentTab === "chat" && authUser && chatTarget) loadMessages(chatTarget);
  }, [authUser, chatTarget, currentTab]);

  async function hydrateUserSession(uid, email) {
    try {
      const userDoc = await getDoc(doc(db, "usuarios", uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const userName = userData.usuario || userData.nombre || email;
      const nextStickerState = createInitialStickerState();

      (userData.obtenidas || []).forEach((numero) => {
        nextStickerState[Number(numero)] = 1;
      });

      (userData.duplicadas || []).forEach((numero) => {
        nextStickerState[Number(numero)] = 2;
      });

      setDisplayName(userName);
      setAccountForm({
        usuario: userData.usuario || userData.nombre || "",
        email: email || "",
        pais: userData.pais || "",
        departamento: userData.departamento || "",
        ciudad: userData.ciudad || ""
      });
      setStickerState(nextStickerState);
      setProgressReady(true);
      await loadHomeStats();
    } catch (error) {
      console.error(error);
      alert("No se pudo cargar la sesion del usuario.");
    }
  }

  async function loadCountries() {
    if (countries.length > 0) return;

    try {
      const response = await fetch(`${API_BASE}/api/countries`);
      const result = await response.json();
      if (result.success) setCountries(result.data);
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor de paises.");
    }
  }

  async function fetchStates(country) {
    if (!country) return [];
    if (statesCacheRef.current[country]) return statesCacheRef.current[country];

    try {
      const response = await fetch(`${API_BASE}/api/states/${encodeURIComponent(country)}`);
      const result = await response.json();
      const states = result.success ? result.data : [];
      statesCacheRef.current[country] = states;
      return states;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async function fetchCities(country, state) {
    if (!country || !state) return [];
    const cacheKey = `${country}|${state}`;
    if (citiesCacheRef.current[cacheKey]) return citiesCacheRef.current[cacheKey];

    try {
      const response = await fetch(
        `${API_BASE}/api/cities/${encodeURIComponent(country)}/${encodeURIComponent(state)}`
      );
      const result = await response.json();
      const cities = result.success ? result.data : [];
      citiesCacheRef.current[cacheKey] = cities;
      return cities;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async function loadAccountInformation() {
    if (!authUser) return;

    try {
      const userDoc = await getDoc(doc(db, "usuarios", authUser.uid));
      if (!userDoc.exists()) return;

      const data = userDoc.data();
      const states = await fetchStates(data.pais || "");
      const cities = await fetchCities(data.pais || "", data.departamento || "");

      setAccountStates(states);
      setAccountCities(cities);
      setAccountForm({
        usuario: data.usuario || data.nombre || "",
        email: authUser.email || "",
        pais: data.pais || "",
        departamento: data.departamento || "",
        ciudad: data.ciudad || ""
      });
    } catch (error) {
      console.error(error);
      alert("No se pudo cargar la informacion de la cuenta.");
    }
  }

  async function saveProgress(nextState) {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, "usuarios", auth.currentUser.uid);
      const snapshot = await getDoc(userRef);
      const baseData = snapshot.exists() ? snapshot.data() : {};
      const duplicadas = [];
      const necesita = [];
      const obtenidas = [];

      for (let index = 1; index <= TOTAL_LAMINAS; index += 1) {
        const value = nextState[index];
        if (value === 0) necesita.push(index.toString());
        else {
          obtenidas.push(index.toString());
          if (value > 1) duplicadas.push(index.toString());
        }
      }

      await setDoc(userRef, { ...baseData, duplicadas, necesita, obtenidas });
    } catch (error) {
      console.error(error);
    }
  }

  async function loadHomeStats() {
    try {
      const usuariosSnap = await getDocs(collection(db, "usuarios"));
      const conversacionesSnap = await getDocs(collection(db, "conversaciones"));
      const countriesSet = new Set();

      usuariosSnap.forEach((userDoc) => {
        const data = userDoc.data();
        if (data.pais) countriesSet.add(data.pais);
      });

      setHomeStats({
        usuarios: usuariosSnap.size,
        intercambios: conversacionesSnap.size,
        paises: countriesSet.size
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function loadMatches() {
    if (!authUser) return;

    try {
      const myDoc = await getDoc(doc(db, "usuarios", authUser.uid));
      if (!myDoc.exists()) return setMatches([]);

      const me = myDoc.data();
      const usersSnapshot = await getDocs(collection(db, "usuarios"));
      const nextMatches = [];

      usersSnapshot.forEach((userDoc) => {
        if (userDoc.id === authUser.uid) return;

        const other = userDoc.data();
        if (other.ciudad !== me.ciudad) return;

        const yoDoy = (me.duplicadas || []).filter((sticker) => (other.necesita || []).includes(sticker));
        const otroDa = (other.duplicadas || []).filter((sticker) => (me.necesita || []).includes(sticker));

        if (yoDoy.length > 0 && otroDa.length > 0) {
          nextMatches.push({
            id: userDoc.id,
            usuario: other.usuario || other.nombre || "Usuario",
            ciudad: other.ciudad,
            yoDoy,
            otroDa
          });
        }
      });

      setMatches(nextMatches);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los intercambios.");
    }
  }

  async function loadConversations() {
    if (!authUser) return;

    setLoadingChats(true);
    try {
      const snapshot = await getDocs(collection(db, "conversaciones"));
      const nextConversations = [];

      snapshot.forEach((conversationDoc) => {
        const data = conversationDoc.data();
        if (data.usuarios?.includes(authUser.uid)) {
          const otherIndex = data.usuarios[0] === authUser.uid ? 1 : 0;
          nextConversations.push({
            id: conversationDoc.id,
            uid: data.usuarios[otherIndex],
            nombre: data.nombres?.[otherIndex] || "Usuario",
            ultimaActividad: data.ultimaActividad || 0
          });
        }
      });

      nextConversations.sort((a, b) => b.ultimaActividad - a.ultimaActividad);
      setConversations(nextConversations);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingChats(false);
    }
  }

  async function loadMessages(targetUid) {
    if (!authUser || !targetUid) return;

    try {
      const snapshot = await getDocs(collection(db, "chats"));
      const nextMessages = [];

      snapshot.forEach((messageDoc) => {
        const message = messageDoc.data();
        const belongsToChat =
          (message.from === authUser.uid && message.to === targetUid) ||
          (message.from === targetUid && message.to === authUser.uid);

        if (belongsToChat) nextMessages.push(message);
      });

      nextMessages.sort((a, b) => a.fecha - b.fecha);
      setMessages(nextMessages);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    const { usuario, email, password, pais, departamento, ciudad } = registerForm;
    if (!usuario || !email || !password || !pais || !departamento || !ciudad) {
      return alert("Completa todos los campos.");
    }

    try {
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "usuarios", credentials.user.uid), {
        usuario,
        email,
        nombre: usuario,
        pais,
        departamento,
        ciudad,
        duplicadas: [],
        necesita: Array.from({ length: TOTAL_LAMINAS }, (_, index) => `${index + 1}`),
        obtenidas: []
      });

      setRegisterForm({
        usuario: "",
        email: "",
        password: "",
        pais: "",
        departamento: "",
        ciudad: ""
      });
      setRegisterStates([]);
      setRegisterCities([]);
      alert("Registro exitoso.");
    } catch (error) {
      console.error(error);
      alert(`Error en el registro: ${error.message}`);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      return alert("Completa email y contrasena.");
    }

    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      setLoginForm({ email: "", password: "" });
    } catch (error) {
      console.error(error);
      alert(`Error al iniciar sesion: ${error.message}`);
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  async function handleSaveAccount(event) {
    event.preventDefault();
    if (!authUser) return;
    const { pais, departamento, ciudad } = accountForm;
    if (!pais || !departamento || !ciudad) {
      return alert("Completa todos los campos de ubicacion.");
    }

    try {
      await setDoc(doc(db, "usuarios", authUser.uid), { pais, departamento, ciudad }, { merge: true });
      alert("Cambios guardados.");
      setCurrentTab("album");
    } catch (error) {
      console.error(error);
      alert("No se pudieron guardar los cambios.");
    }
  }

  async function handleRegisterCountryChange(country) {
    const states = await fetchStates(country);
    setRegisterStates(states);
    setRegisterCities([]);
    setRegisterForm((prev) => ({ ...prev, pais: country, departamento: "", ciudad: "" }));
  }

  async function handleRegisterStateChange(state) {
    const cities = await fetchCities(registerForm.pais, state);
    setRegisterCities(cities);
    setRegisterForm((prev) => ({ ...prev, departamento: state, ciudad: "" }));
  }

  async function handleAccountCountryChange(country) {
    const states = await fetchStates(country);
    setAccountStates(states);
    setAccountCities([]);
    setAccountForm((prev) => ({ ...prev, pais: country, departamento: "", ciudad: "" }));
  }

  async function handleAccountStateChange(state) {
    const cities = await fetchCities(accountForm.pais, state);
    setAccountCities(cities);
    setAccountForm((prev) => ({ ...prev, departamento: state, ciudad: "" }));
  }

  function changeSticker(numero, amount) {
    setStickerState((prev) => ({
      ...prev,
      [numero]: Math.max(0, (prev[numero] || 0) + amount)
    }));
  }

  function clearAll() {
    if (window.confirm("Quieres limpiar todas las laminas?")) {
      setStickerState(createInitialStickerState());
    }
  }

  function fillAll() {
    if (!window.confirm("Quieres completar todas las laminas?")) return;
    const nextState = createInitialStickerState();
    Object.keys(nextState).forEach((key) => {
      nextState[key] = 1;
    });
    setStickerState(nextState);
  }

  function clearCurrentTeam() {
    if (!currentTeam || !window.confirm(`Quieres limpiar las laminas de ${currentTeam.nombre}?`)) return;
    const initialNumber = currentTeamIndex * 20 + 1;
    setStickerState((prev) => {
      const next = { ...prev };
      for (let index = 0; index < 20; index += 1) next[initialNumber + index] = 0;
      return next;
    });
  }

  function fillCurrentTeam() {
    if (!currentTeam || !window.confirm(`Quieres completar las laminas de ${currentTeam.nombre}?`)) return;
    const initialNumber = currentTeamIndex * 20 + 1;
    setStickerState((prev) => {
      const next = { ...prev };
      for (let index = 0; index < 20; index += 1) next[initialNumber + index] = 1;
      return next;
    });
  }

  async function openChatFromMatch(uid, nombre) {
    if (!authUser) return;

    try {
      const myUserDoc = await getDoc(doc(db, "usuarios", authUser.uid));
      const myName = myUserDoc.exists()
        ? myUserDoc.data().usuario || myUserDoc.data().nombre || authUser.email
        : authUser.email;
      const conversationId = [authUser.uid, uid].sort().join("_");

      await setDoc(
        doc(db, "conversaciones", conversationId),
        {
          usuarios: [authUser.uid, uid],
          nombres: [myName, nombre],
          ultimaActividad: Date.now(),
          creadaEn: Date.now()
        },
        { merge: true }
      );

      setChatTarget(uid);
      setChatName(nombre);
      setCurrentTab("chat");
      await loadConversations();
      await loadMessages(uid);
    } catch (error) {
      console.error(error);
      alert("No se pudo abrir el chat.");
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!authUser || !chatTarget || !messageText.trim()) return;

    try {
      await addDoc(collection(db, "chats"), {
        from: authUser.uid,
        to: chatTarget,
        texto: messageText.trim(),
        fecha: Date.now()
      });

      const conversationId = [authUser.uid, chatTarget].sort().join("_");
      await setDoc(doc(db, "conversaciones", conversationId), { ultimaActividad: Date.now() }, { merge: true });

      setMessageText("");
      await loadMessages(chatTarget);
      await loadConversations();
    } catch (error) {
      console.error(error);
      alert("No se pudo enviar el mensaje.");
    }
  }

  return {
    TOTAL_LAMINAS,
    currentTab,
    setCurrentTab,
    authUser,
    displayName,
    currentTeamIndex,
    setCurrentTeamIndex,
    filterText,
    setFilterText,
    filterStatus,
    setFilterStatus,
    countries,
    registerStates,
    registerCities,
    accountStates,
    accountCities,
    homeStats,
    matches,
    conversations,
    messages,
    chatTarget,
    setChatTarget,
    chatName,
    setChatName,
    messageText,
    setMessageText,
    loadingChats,
    registerForm,
    setRegisterForm,
    loginForm,
    setLoginForm,
    accountForm,
    setAccountForm,
    progressStats,
    currentTeam,
    isGlobalSearch,
    filteredStickers,
    handleRegister,
    handleLogin,
    handleLogout,
    handleSaveAccount,
    handleRegisterCountryChange,
    handleRegisterStateChange,
    handleAccountCountryChange,
    handleAccountStateChange,
    changeSticker,
    clearAll,
    fillAll,
    clearCurrentTeam,
    fillCurrentTeam,
    openChatFromMatch,
    sendMessage
  };
}
