import { useEffect, useMemo, useRef, useState } from "react";
import { EQUIPOS, createInitialStickerState, getAllCollectionStickers, getTeamStickers, getTotalStickers } from "./data";
import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const TOTAL_LAMINAS = getTotalStickers();

// Calcula el numero inicial de lamina para un equipo dado su indice
function getTeamStartNumber(teamIndex) {
  let startNumber = 1;
  for (let i = 0; i < teamIndex; i++) {
    startNumber += getTeamStickers(EQUIPOS[i].nombre).length;
  }
  return startNumber;
}

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
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [profileForm, setProfileForm] = useState({
    usuario: "",
    pais: "",
    departamento: "",
    ciudad: ""
  });
  const [profileStates, setProfileStates] = useState([]);
  const [profileCities, setProfileCities] = useState([]);
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
    const teamStartNumber = getTeamStartNumber(currentTeamIndex);
    const baseItems = search
      ? getAllCollectionStickers()
      : currentTeam
        ? getTeamStickers(currentTeam.nombre).map((lamina, index) => ({
            numero: teamStartNumber + index,
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

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
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

      setAuthUser(session.user);
      setCurrentTab("inicio");
      await hydrateUserSession(session.user.id, session.user.email);
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        hydrateUserSession(session.user.id, session.user.email);
      } else {
        loadCountries();
      }
    });

    return () => subscription.unsubscribe();
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
      // Load user profile
      const { data: userData, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", uid)
        .single();

      // Check if user needs to complete their profile (no country/city set)
      const needsCompletion = !userData || !userData.pais || !userData.ciudad;
      
      if (needsCompletion) {
        setNeedsProfileCompletion(true);
        setProfileForm({
          usuario: userData?.usuario || userData?.nombre || email?.split("@")[0] || "",
          pais: "",
          departamento: "",
          ciudad: ""
        });
        await loadCountries();
        setAuthUser({ id: uid, email });
        return;
      }

      const userName = userData?.usuario || userData?.nombre || email;
      
      // Load sticker state
      const { data: stickerData } = await supabase
        .from("sticker_states")
        .select("stickers")
        .eq("user_id", uid)
        .single();

      const nextStickerState = stickerData?.stickers || createInitialStickerState();

      setNeedsProfileCompletion(false);
      setDisplayName(userName);
      setAccountForm({
        usuario: userData?.usuario || userData?.nombre || "",
        email: email || "",
        pais: userData?.pais || "",
        departamento: userData?.departamento || "",
        ciudad: userData?.ciudad || ""
      });
      setStickerState(nextStickerState);
      setProgressReady(true);
      await loadHomeStats();
    } catch (error) {
      console.error(error);
      // If user doesn't exist yet, they need to complete profile
      setNeedsProfileCompletion(true);
      setProfileForm({
        usuario: email?.split("@")[0] || "",
        pais: "",
        departamento: "",
        ciudad: ""
      });
      await loadCountries();
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
      // Fallback countries list
      setCountries([
        { name: "Mexico" },
        { name: "Colombia" },
        { name: "Argentina" },
        { name: "Peru" },
        { name: "Chile" },
        { name: "Ecuador" },
        { name: "Venezuela" },
        { name: "Guatemala" },
        { name: "Cuba" },
        { name: "Bolivia" },
        { name: "Honduras" },
        { name: "Paraguay" },
        { name: "El Salvador" },
        { name: "Nicaragua" },
        { name: "Costa Rica" },
        { name: "Panama" },
        { name: "Uruguay" },
        { name: "Puerto Rico" },
        { name: "Spain" },
        { name: "United States" }
      ]);
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
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (!data) return;

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
    if (!authUser) return;

    try {
      await supabase
        .from("sticker_states")
        .upsert({
          user_id: authUser.id,
          stickers: nextState,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
    } catch (error) {
      console.error(error);
    }
  }

  async function loadHomeStats() {
    try {
      const { data: usuarios, count: usuariosCount } = await supabase
        .from("usuarios")
        .select("pais", { count: "exact" });

      const { count: conversacionesCount } = await supabase
        .from("conversaciones")
        .select("*", { count: "exact", head: true });

      const countriesSet = new Set();
      (usuarios || []).forEach((user) => {
        if (user.pais) countriesSet.add(user.pais);
      });

      setHomeStats({
        usuarios: usuariosCount || 0,
        intercambios: conversacionesCount || 0,
        paises: countriesSet.size
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function loadMatches() {
    if (!authUser) return;

    try {
      // Get my profile
      const { data: myProfile } = await supabase
        .from("usuarios")
        .select("ciudad")
        .eq("id", authUser.id)
        .single();

      if (!myProfile) return setMatches([]);

      // Get my stickers
      const { data: myStickerData } = await supabase
        .from("sticker_states")
        .select("stickers")
        .eq("user_id", authUser.id)
        .single();

      const myStickers = myStickerData?.stickers || {};

      // Calculate my needs and duplicates
      const myNeeds = [];
      const myDuplicates = [];
      for (let i = 1; i <= TOTAL_LAMINAS; i++) {
        const val = myStickers[i] || 0;
        if (val === 0) myNeeds.push(i);
        if (val > 1) myDuplicates.push(i);
      }

      // Get other users in same city
      const { data: otherUsers } = await supabase
        .from("usuarios")
        .select("id, usuario, nombre, ciudad")
        .eq("ciudad", myProfile.ciudad)
        .neq("id", authUser.id);

      if (!otherUsers || otherUsers.length === 0) return setMatches([]);

      // Get their stickers
      const { data: otherStickers } = await supabase
        .from("sticker_states")
        .select("user_id, stickers")
        .in("user_id", otherUsers.map(u => u.id));

      const stickersMap = {};
      (otherStickers || []).forEach(s => {
        stickersMap[s.user_id] = s.stickers || {};
      });

      const nextMatches = [];
      otherUsers.forEach((other) => {
        const theirStickers = stickersMap[other.id] || {};
        
        // What they can give me (my needs that they have duplicates of)
        const theyGiveMe = myNeeds.filter(n => (theirStickers[n] || 0) > 1);
        
        // What I can give them (my duplicates that they need)
        const iGiveThem = myDuplicates.filter(n => (theirStickers[n] || 0) === 0);

        if (theyGiveMe.length > 0 && iGiveThem.length > 0) {
          nextMatches.push({
            id: other.id,
            usuario: other.usuario || other.nombre || "Usuario",
            ciudad: other.ciudad,
            yoDoy: iGiveThem,
            otroDa: theyGiveMe
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
      const { data, error } = await supabase
        .from("conversaciones")
        .select("*")
        .contains("usuarios", [authUser.id])
        .order("ultima_actividad", { ascending: false });

      const nextConversations = [];
      (data || []).forEach((conv) => {
        const otherIndex = conv.usuarios[0] === authUser.id ? 1 : 0;
        nextConversations.push({
          id: conv.id,
          uid: conv.usuarios[otherIndex],
          nombre: conv.nombres?.[otherIndex] || "Usuario",
          ultimaActividad: conv.ultima_actividad || 0
        });
      });

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
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(`and(from_user.eq.${authUser.id},to_user.eq.${targetUid}),and(from_user.eq.${targetUid},to_user.eq.${authUser.id})`)
        .order("fecha", { ascending: true });

      const nextMessages = (data || []).map(msg => ({
        from: msg.from_user,
        to: msg.to_user,
        texto: msg.texto,
        fecha: msg.fecha
      }));

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            usuario,
            nombre: usuario
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        await supabase
          .from("usuarios")
          .insert({
            id: data.user.id,
            usuario,
            email,
            nombre: usuario,
            pais,
            departamento,
            ciudad
          });

        // Create initial sticker state
        await supabase
          .from("sticker_states")
          .insert({
            user_id: data.user.id,
            stickers: createInitialStickerState()
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
        alert("Registro exitoso. Por favor revisa tu email para confirmar tu cuenta.");
      }
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
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      });

      if (error) throw error;
      setLoginForm({ email: "", password: "" });
    } catch (error) {
      console.error(error);
      alert(`Error al iniciar sesion: ${error.message}`);
    }
  }

  async function handleGoogleLogin() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error(error);
      alert(`Error al iniciar sesion con Google: ${error.message}`);
    }
  }

  async function handleLogout() {
    // Reset state immediately - don't wait for Supabase
    setAuthUser(null);
    setDisplayName("");
    setNeedsProfileCompletion(false);
    setProgressReady(false);
    setStickerState(createInitialStickerState());
    setCurrentTab("inicio");
    setAccountForm({ usuario: "", email: "", pais: "", departamento: "", ciudad: "" });
    
    // Try to sign out from Supabase in background
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  }

  // Profile completion handlers (for Google login users)
  async function handleProfileCountryChange(country) {
    const states = await fetchStates(country);
    setProfileStates(states);
    setProfileCities([]);
    setProfileForm(prev => ({ ...prev, pais: country, departamento: "", ciudad: "" }));
  }

  async function handleProfileStateChange(stateName) {
    const cities = await fetchCities(profileForm.pais, stateName);
    setProfileCities(cities);
    setProfileForm(prev => ({ ...prev, departamento: stateName, ciudad: "" }));
  }

  async function handleCompleteProfile(event) {
    event.preventDefault();
    if (!authUser) return;
    
    const { usuario, pais, departamento, ciudad } = profileForm;
    if (!usuario || !pais || !departamento || !ciudad) {
      return alert("Completa todos los campos para continuar.");
    }

    try {
      // Check if user profile exists
      const { data: existingUser } = await supabase
        .from("usuarios")
        .select("id")
        .eq("id", authUser.id)
        .single();

      if (existingUser) {
        // Update existing profile
        await supabase
          .from("usuarios")
          .update({ usuario, nombre: usuario, pais, departamento, ciudad })
          .eq("id", authUser.id);
      } else {
        // Create new profile
        await supabase
          .from("usuarios")
          .insert({
            id: authUser.id,
            usuario,
            email: authUser.email,
            nombre: usuario,
            pais,
            departamento,
            ciudad
          });

        // Create initial sticker state
        await supabase
          .from("sticker_states")
          .insert({
            user_id: authUser.id,
            stickers: createInitialStickerState()
          });
      }

      setNeedsProfileCompletion(false);
      setDisplayName(usuario);
      setAccountForm({
        usuario,
        email: authUser.email,
        pais,
        departamento,
        ciudad
      });
      setStickerState(createInitialStickerState());
      setProgressReady(true);
      setCurrentTab("inicio");
      await loadHomeStats();
    } catch (error) {
      console.error(error);
      alert(`Error al guardar el perfil: ${error.message}`);
    }
  }

  async function handleSaveAccount(event) {
    event.preventDefault();
    if (!authUser) return;
    const { pais, departamento, ciudad } = accountForm;
    if (!pais || !departamento || !ciudad) {
      return alert("Completa todos los campos de ubicacion.");
    }

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ pais, departamento, ciudad })
        .eq("id", authUser.id);

      if (error) throw error;
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
    const teamStickers = getTeamStickers(currentTeam.nombre);
    const initialNumber = getTeamStartNumber(currentTeamIndex);
    setStickerState((prev) => {
      const next = { ...prev };
      for (let index = 0; index < teamStickers.length; index += 1) next[initialNumber + index] = 0;
      return next;
    });
  }

  function fillCurrentTeam() {
    if (!currentTeam || !window.confirm(`Quieres completar las laminas de ${currentTeam.nombre}?`)) return;
    const teamStickers = getTeamStickers(currentTeam.nombre);
    const initialNumber = getTeamStartNumber(currentTeamIndex);
    setStickerState((prev) => {
      const next = { ...prev };
      for (let index = 0; index < teamStickers.length; index += 1) next[initialNumber + index] = 1;
      return next;
    });
  }

  async function openChatFromMatch(uid, nombre) {
    if (!authUser) return;

    try {
      const { data: myProfile } = await supabase
        .from("usuarios")
        .select("usuario, nombre")
        .eq("id", authUser.id)
        .single();

      const myName = myProfile?.usuario || myProfile?.nombre || authUser.email;
      const conversationId = [authUser.id, uid].sort().join("_");

      // Check if conversation exists
      const { data: existing } = await supabase
        .from("conversaciones")
        .select("id")
        .eq("id", conversationId)
        .single();

      if (!existing) {
        await supabase
          .from("conversaciones")
          .insert({
            id: conversationId,
            usuarios: [authUser.id, uid],
            nombres: [myName, nombre],
            ultima_actividad: Date.now(),
            creada_en: Date.now()
          });
      } else {
        await supabase
          .from("conversaciones")
          .update({ ultima_actividad: Date.now() })
          .eq("id", conversationId);
      }

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
      await supabase
        .from("chats")
        .insert({
          from_user: authUser.id,
          to_user: chatTarget,
          texto: messageText.trim(),
          fecha: Date.now()
        });

      const conversationId = [authUser.id, chatTarget].sort().join("_");
      await supabase
        .from("conversaciones")
        .update({ ultima_actividad: Date.now() })
        .eq("id", conversationId);

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
    needsProfileCompletion,
    profileForm,
    setProfileForm,
    profileStates,
    profileCities,
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
    handleGoogleLogin,
    handleLogout,
    handleCompleteProfile,
    handleProfileCountryChange,
    handleProfileStateChange,
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
    loadMatches,
    loadConversations,
    loadMessages,
    openChatFromMatch,
    sendMessage
  };
}
