import { useEffect, useState, useRef } from "react";
import { EQUIPOS } from "./data";
import { useAlbumApp } from "./useAlbumApp";

function TeamSelector({ teams, currentIndex, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const currentTeam = teams[currentIndex];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="team-selector" ref={dropdownRef}>
      <button 
        className="team-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="team-flag">{currentTeam.bandera}</span>
        <span className="team-name">{currentTeam.grupo}. {currentTeam.nombre}</span>
        <span className="team-arrow">{isOpen ? "▲" : "▼"}</span>
      </button>
      
      {isOpen && (
        <div className="team-selector-dropdown">
          {teams.map((team, index) => (
            <button
              key={team.id}
              className={`team-option ${index === currentIndex ? "active" : ""}`}
              onClick={() => {
                onChange(index);
                setIsOpen(false);
              }}
            >
              <span className="team-flag">{team.bandera}</span>
              <span className="team-option-text">{team.grupo}. {team.nombre}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const app = useAlbumApp();
  const [trophyMissing, setTrophyMissing] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [chatListOpen, setChatListOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!event.target.closest(".user-menu")) {
        setUserMenuOpen(false);
      }

      if (!event.target.closest(".topbar-panel") && !event.target.closest(".mobile-menu-toggle")) {
        setMobileNavOpen(false);
      }
    }

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  function renderHome() {
    return (
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Album Mundial 2026</p>
          <h1>
            Convierte tu coleccion
            <br />
            en una experiencia
            <br />
            digna de final.
          </h1>
          <p className="hero-text">
            Registra tus laminas, descubre intercambios por ciudad y conversa con
            otros coleccionistas desde una interfaz pensada para crecer contigo.
          </p>
          <div className="hero-actions">
            {app.authUser ? (
              <>
                <button className="primary-button" onClick={() => app.setCurrentTab("album")}>
                  Abrir album
                </button>
                <button className="ghost-button" onClick={() => app.setCurrentTab("intercambios")}>
                  Ver intercambios
                </button>
              </>
            ) : (
              <>
                <button className="primary-button" onClick={() => app.setCurrentTab("registro-form")}>
                  Crear cuenta
                </button>
                <button className="ghost-button" onClick={() => app.setCurrentTab("login-form")}>
                  Iniciar sesion
                </button>
              </>
            )}
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-trophy-card">
            <div className="hero-trophy-copy">
              <span className="hero-kicker">Pieza central</span>
              <h3>La copa como protagonista del album</h3>
            </div>

            <div className={`hero-trophy-stage ${trophyMissing ? "is-fallback" : ""}`}>
              {!trophyMissing && (
                <img
                  src="/copa-mundial.png"
                  alt="Copa del Mundo"
                  className="hero-trophy-image"
                  onError={() => setTrophyMissing(true)}
                />
              )}
              {trophyMissing && (
                <div className="hero-trophy-fallback">
                  <span>Copa PNG</span>
                  <strong>Agrega `copa-mundial.png` en la raiz del proyecto o dentro de `public/`.</strong>
                </div>
              )}
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-card">
              <span>Usuarios activos</span>
              <strong>{app.homeStats.usuarios}</strong>
            </div>
            <div className="hero-card">
              <span>Conversaciones</span>
              <strong>{app.homeStats.intercambios}</strong>
            </div>
            <div className="hero-card">
              <span>Paises representados</span>
              <strong>{app.homeStats.paises}</strong>
            </div>
            <div className="hero-card">
              <span>Progreso personal</span>
              <strong>{app.authUser ? `${app.progressStats.porcentaje}%` : "Explora"}</strong>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderAuth(isRegister) {
    const formState = isRegister ? app.registerForm : app.loginForm;

    return (
      <section className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">{isRegister ? "Nueva cuenta" : "Bienvenido de vuelta"}</p>
          <h2>{isRegister ? "Crea tu perfil coleccionista" : "Inicia sesion"}</h2>
          <form onSubmit={isRegister ? app.handleRegister : app.handleLogin} className="form-grid">
            {isRegister && (
              <input
                value={formState.usuario}
                onChange={(event) =>
                  app.setRegisterForm((prev) => ({ ...prev, usuario: event.target.value }))
                }
                placeholder="Nombre de usuario"
              />
            )}
            <input
              type="email"
              value={formState.email}
              onChange={(event) =>
                isRegister
                  ? app.setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                  : app.setLoginForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="Correo electronico"
            />
            <input
              type="password"
              value={formState.password}
              onChange={(event) =>
                isRegister
                  ? app.setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                  : app.setLoginForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="Contrasena"
            />

            {isRegister && (
              <>
                <select
                  value={app.registerForm.pais}
                  onChange={(event) => app.handleRegisterCountryChange(event.target.value)}
                >
                  <option value="">Selecciona pais</option>
                  {app.countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <select
                  value={app.registerForm.departamento}
                  onChange={(event) => app.handleRegisterStateChange(event.target.value)}
                >
                  <option value="">Selecciona provincia/departamento</option>
                  {app.registerStates.map((state) => (
                    <option key={state.isoCode || state.nombre} value={state.nombre}>
                      {state.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={app.registerForm.ciudad}
                  onChange={(event) =>
                    app.setRegisterForm((prev) => ({ ...prev, ciudad: event.target.value }))
                  }
                >
                  <option value="">Selecciona ciudad</option>
                  {app.registerCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </>
            )}

            <button type="submit" className="primary-button full-width">
              {isRegister ? "Registrarme" : "Entrar"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  function renderAccount() {
    return (
      <section className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">Perfil</p>
          <h2>Informacion de cuenta</h2>
          <form onSubmit={app.handleSaveAccount} className="form-grid">
            <input value={app.accountForm.usuario} readOnly />
            <input value={app.accountForm.email} readOnly />
            <select
              value={app.accountForm.pais}
              onChange={(event) => app.handleAccountCountryChange(event.target.value)}
            >
              <option value="">Selecciona pais</option>
              {app.countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <select
              value={app.accountForm.departamento}
              onChange={(event) => app.handleAccountStateChange(event.target.value)}
            >
              <option value="">Selecciona provincia/departamento</option>
              {app.accountStates.map((state) => (
                <option key={state.isoCode || state.nombre} value={state.nombre}>
                  {state.nombre}
                </option>
              ))}
            </select>
            <select
              value={app.accountForm.ciudad}
              onChange={(event) =>
                app.setAccountForm((prev) => ({ ...prev, ciudad: event.target.value }))
              }
            >
              <option value="">Selecciona ciudad</option>
              {app.accountCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <button type="submit" className="primary-button full-width">
              Guardar cambios
            </button>
          </form>
        </div>
      </section>
    );
  }

  function renderAlbum() {
    return (
      <section className="page-shell">
        <div className="section-header">
          <div>
            <p className="eyebrow">Coleccion</p>
            <h2>
              {app.isGlobalSearch
                ? "Busqueda global"
                : app.currentTeam
                  ? `${app.currentTeam.bandera} ${app.currentTeam.nombre}`
                  : "Album"}
            </h2>
          </div>
          <div className="header-badge">
            {app.progressStats.obtenidas}/{app.TOTAL_LAMINAS}
          </div>
        </div>

        {/* Navegacion de equipos */}
        <div className="team-navigation">
          <button
            className="nav-button"
            onClick={() => app.setCurrentTeamIndex((prev) => Math.max(0, prev - 1))}
            disabled={app.currentTeamIndex === 0}
            aria-label="Equipo anterior"
          >
            <span className="nav-icon">&larr;</span>
            <span className="nav-text">Anterior</span>
          </button>
          
          <TeamSelector 
            teams={EQUIPOS}
            currentIndex={app.currentTeamIndex}
            onChange={app.setCurrentTeamIndex}
          />
          
          <button
            className="nav-button"
            onClick={() => app.setCurrentTeamIndex((prev) => Math.min(EQUIPOS.length - 1, prev + 1))}
            disabled={app.currentTeamIndex === EQUIPOS.length - 1}
            aria-label="Equipo siguiente"
          >
            <span className="nav-text">Siguiente</span>
            <span className="nav-icon">&rarr;</span>
          </button>
        </div>

        {/* Filtros de busqueda */}
        <div className="search-filters">
          <div className="search-input-wrapper">
            <input
              value={app.filterText}
              onChange={(event) => app.setFilterText(event.target.value)}
              placeholder="Buscar por numero, jugador o equipo..."
            />
          </div>
          <div className="filter-controls">
            <select value={app.filterStatus} onChange={(event) => app.setFilterStatus(event.target.value)}>
              <option value="todos">Todos</option>
              <option value="obtenidos">Obtenidos</option>
              <option value="faltantes">Faltantes</option>
              <option value="repetidos">Repetidos</option>
            </select>
            {(app.filterText || app.filterStatus !== "todos") && (
              <button
                className="clear-filters-button"
                onClick={() => {
                  app.setFilterText("");
                  app.setFilterStatus("todos");
                }}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Grid de laminas */}
        <div className="sticker-grid">
          {app.filteredStickers.length === 0 ? (
            <div className="empty-state">No hay laminas que coincidan con los filtros.</div>
          ) : (
            app.filteredStickers.map((item) => (
              <article
                key={item.numero}
                className={`sticker-card ${item.valor === 0 ? "missing" : item.valor > 1 ? "duplicate" : "owned"}`}
              >
                <span className="sticker-number">#{item.numero}</span>
                <strong>{item.lamina}</strong>
                {app.isGlobalSearch && (
                  <span className="sticker-meta">
                    {item.grupo}. {item.equipo}
                  </span>
                )}
                <div className="sticker-controls">
                  <button onClick={() => app.changeSticker(item.numero, -1)}>-</button>
                  <span>{item.valor}</span>
                  <button onClick={() => app.changeSticker(item.numero, 1)}>+</button>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Acciones de equipo */}
        <div className="team-actions">
          <div className="team-actions-group">
            <span className="actions-label">Equipo actual:</span>
            <button className="action-button danger" onClick={app.clearCurrentTeam}>Limpiar</button>
            <button className="action-button success" onClick={app.fillCurrentTeam}>Completar</button>
          </div>
          <div className="team-actions-group">
            <span className="actions-label">Todo el album:</span>
            <button className="action-button danger" onClick={app.clearAll}>Limpiar todo</button>
            <button className="action-button success" onClick={app.fillAll}>Completar todo</button>
          </div>
        </div>
      </section>
    );
  }

  function renderProgress() {
    return (
      <section className="page-shell">
        <div className="section-header progress-header">
          <div>
            <p className="eyebrow">Rendimiento</p>
            <h2>Tu progreso</h2>
            <p className="progress-intro">
              Una vista general de tu coleccion para detectar rapido lo que ya
              aseguraste, lo que aun falta y el margen de intercambio que tienes disponible.
            </p>
          </div>
          <div className="progress-badge">
            <span>Avance total</span>
            <strong>{app.progressStats.porcentaje}%</strong>
          </div>
        </div>

        <div className="progress-grid">
          <div className="metric-card progress-card progress-card-owned">
            <div className="progress-card-top">
              <span className="progress-card-label">Obtenidas</span>
              <span className="progress-card-icon">✓</span>
            </div>
            <strong>{app.progressStats.obtenidas}</strong>
            <p className="progress-card-copy">Laminas que ya hacen parte de tu album.</p>
          </div>
          <div className="metric-card progress-card progress-card-missing">
            <div className="progress-card-top">
              <span className="progress-card-label">Faltantes</span>
              <span className="progress-card-icon">!</span>
            </div>
            <strong>{app.progressStats.faltantes}</strong>
            <p className="progress-card-copy">Las que aun necesitas para cerrar la coleccion.</p>
          </div>
          <div className="metric-card progress-card progress-card-duplicate">
            <div className="progress-card-top">
              <span className="progress-card-label">Duplicadas</span>
              <span className="progress-card-icon">×</span>
            </div>
            <strong>{app.progressStats.duplicadas}</strong>
            <p className="progress-card-copy">Tu reserva actual para futuros intercambios.</p>
          </div>
        </div>
      </section>
    );
  }

  function renderMatches() {
    return (
      <section className="page-shell">
        <div className="section-header">
          <div>
            <p className="eyebrow">Intercambios</p>
            <h2>Coincidencias en tu ciudad</h2>
          </div>
          <div className="header-badge">{app.matches.length}</div>
        </div>

        <div className="matches-grid">
          {app.matches.length === 0 ? (
            <div className="empty-state">No hay intercambios disponibles en tu ciudad.</div>
          ) : (
            app.matches.map((match) => (
              <article key={match.id} className="match-card">
                <div className="match-top">
                  <strong>{match.usuario}</strong>
                  <span>{match.ciudad}</span>
                </div>
                <p>
                  <span>Tu entregas:</span> {match.yoDoy.join(", ")}
                </p>
                <p>
                  <span>Tu recibes:</span> {match.otroDa.join(", ")}
                </p>
                <button
                  className="primary-button full-width"
                  onClick={() => app.openChatFromMatch(match.id, match.usuario)}
                >
                  Abrir chat
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    );
  }

  function renderChat() {
    return (
      <section className="page-shell chat-shell">
        <div className={`chat-sidebar ${chatListOpen ? "is-open" : ""}`}>
          <div className="section-header compact">
            <div>
              <p className="eyebrow">Chat</p>
              <h2>Conversaciones</h2>
            </div>
          </div>
          <div className="chat-list">
            {app.loadingChats ? (
              <div className="empty-state">Cargando chats...</div>
            ) : app.conversations.length === 0 ? (
              <div className="empty-state">No hay chats aun.</div>
            ) : (
              app.conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={`chat-list-item ${app.chatTarget === conversation.uid ? "active" : ""}`}
                  onClick={() => {
                    app.setChatTarget(conversation.uid);
                    app.setChatName(conversation.nombre);
                    setChatListOpen(false);
                  }}
                >
                  <span>{conversation.nombre.slice(0, 1).toUpperCase()}</span>
                  <div className="chat-list-copy">
                    <strong>{formatChatPrimaryLabel(conversation.nombre)}</strong>
                    <small className="chat-list-secondary">
                      {formatChatSecondaryLabel(conversation.nombre)}
                    </small>
                    <small>Ultima actividad reciente</small>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="chat-main">
          <div className="section-header compact">
            <div>
              <p className="eyebrow">Conversacion</p>
              <h2>{app.chatName || "Selecciona un chat"}</h2>
            </div>
            <button
              className="ghost-button chat-mobile-toggle"
              onClick={() => setChatListOpen((prev) => !prev)}
              type="button"
            >
              {chatListOpen ? "Ocultar chats" : "Ver chats"}
            </button>
          </div>

          <div className="chat-messages">
            {!app.chatTarget ? (
              <div className="empty-state">Selecciona una conversacion para empezar.</div>
            ) : app.messages.length === 0 ? (
              <div className="empty-state">Aun no hay mensajes.</div>
            ) : (
              app.messages.map((message, index) => (
                <div
                  key={`${message.fecha}-${index}`}
                  className={`message-bubble ${message.from === app.authUser.uid ? "sent" : "received"}`}
                >
                  <p>{message.texto}</p>
                  <small>
                    {new Date(message.fecha).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </small>
                </div>
              ))
            )}
          </div>

          <form className="chat-form" onSubmit={app.sendMessage}>
            <input
              value={app.messageText}
              onChange={(event) => app.setMessageText(event.target.value)}
              placeholder="Escribe un mensaje..."
            />
            <button className="primary-button" type="submit">
              Enviar
            </button>
          </form>
        </div>
      </section>
    );
  }

  function formatChatPrimaryLabel(value) {
    if (!value) return "Usuario";
    if (!value.includes("@")) return value;
    return value.split("@")[0];
  }

  function formatChatSecondaryLabel(value) {
    if (!value || !value.includes("@")) return value || "Sin correo";
    return value;
  }

  function renderTab() {
    if (app.currentTab === "login-form") return renderAuth(false);
    if (app.currentTab === "registro-form") return renderAuth(true);
    if (app.currentTab === "cuenta") return renderAccount();
    if (app.currentTab === "album") return renderAlbum();
    if (app.currentTab === "progreso") return renderProgress();
    if (app.currentTab === "intercambios") return renderMatches();
    if (app.currentTab === "chat") return renderChat();
    return renderHome();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-mark" onClick={() => app.setCurrentTab("inicio")}>
          Album Mundial
        </button>

        <button
          className="ghost-button mobile-menu-toggle"
          type="button"
          onClick={() => setMobileNavOpen((prev) => !prev)}
        >
          {mobileNavOpen ? "Cerrar" : "Menu"}
        </button>

        <div className={`topbar-panel ${mobileNavOpen ? "is-open" : ""}`}>
          <nav className="main-nav">
            <button onClick={() => { app.setCurrentTab("album"); setMobileNavOpen(false); }}>Album</button>
            <button onClick={() => { app.setCurrentTab("progreso"); setMobileNavOpen(false); }}>Progreso</button>
            <button onClick={() => { app.setCurrentTab("intercambios"); setMobileNavOpen(false); }}>Intercambios</button>
            <button onClick={() => { app.setCurrentTab("chat"); setMobileNavOpen(false); }}>Chat</button>
          </nav>

          <div className="user-actions">
            {app.authUser ? (
              <div className="user-menu">
                <button
                  className="ghost-button user-menu-trigger"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                >
                  <span className="menu-trigger-icon">👤</span>
                  {app.displayName}
                  <span className="menu-trigger-caret">{userMenuOpen ? "▴" : "▾"}</span>
                </button>

                {userMenuOpen && (
                  <div className="user-menu-dropdown">
                    <button
                      className="user-menu-item"
                      onClick={() => {
                        app.setCurrentTab("cuenta");
                        setUserMenuOpen(false);
                        setMobileNavOpen(false);
                      }}
                    >
                      <span className="user-menu-icon">⚙</span>
                      Informacion de cuenta
                    </button>
                    <button
                      className="user-menu-item"
                      onClick={() => {
                        setTheme((prev) => (prev === "light" ? "dark" : "light"));
                        setUserMenuOpen(false);
                      }}
                    >
                      <span className="user-menu-icon">{theme === "light" ? "🌙" : "☀"}</span>
                      {theme === "light" ? "Modo oscuro" : "Modo claro"}
                    </button>
                    <button
                      className="user-menu-item user-menu-danger"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setMobileNavOpen(false);
                        app.handleLogout();
                      }}
                    >
                      <span className="user-menu-icon">↩</span>
                      Cerrar sesion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="ghost-button" onClick={() => { app.setCurrentTab("login-form"); setMobileNavOpen(false); }}>
                  Iniciar sesion
                </button>
                <button className="primary-button" onClick={() => { app.setCurrentTab("registro-form"); setMobileNavOpen(false); }}>
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="content-shell">{renderTab()}</main>
    </div>
  );
}

export default App;
