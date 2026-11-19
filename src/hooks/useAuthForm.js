import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, resetPassword, getAuthError } from "../services/authService";
const emailRegex = /\S+@\S+\.\S+/;

export function useAuthForm() {
  const navigate = useNavigate();

  const [panel, setPanel]         = useState("login");
  const [subView, setSubView]     = useState("main");
  const [animating, setAnimating] = useState(false);

  // Campos
  const [name, setName]                   = useState("");
  const [lastName, setLastName]           = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [phone, setPhone]                 = useState("");
  const [birthDate, setBirthDate]         = useState("");
  const [gender, setGender]               = useState("");
  const [relation, setRelation]           = useState("");
  const [stateValue, setStateValue]       = useState("");
  const [parish, setParish]               = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [toast, setToast]     = useState(null);

  const isRegister = panel === "register";

  const toastStyle = useMemo(() => ({
    animation: "toastIn .3s ease both",
    backdropFilter: "blur(20px)",
    background: toast?.type === "error"
      ? "rgba(215,68,104,0.15)"
      : "rgba(84,174,182,0.15)",
    border: toast?.type === "error"
      ? "1px solid rgba(215,68,104,0.30)"
      : "1px solid rgba(84,174,182,0.30)",
    color: toast?.type === "error" ? "#d74468" : "#54aeb6",
  }), [toast]);

  const resetForms = () => {
    setName(""); setLastName(""); setEmail(""); setPassword("");
    setPhone(""); setBirthDate(""); setGender(""); setRelation("");
    setStateValue(""); setParish(""); setTermsAccepted(false);
    setErrors({}); setShowPw(false);
  };

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const switchPanel = (next) => {
    if (animating || next === panel) return;
    setAnimating(true);
    resetForms();
    setSubView("main");
    setPanel(next);
    setTimeout(() => setAnimating(false), 700);
  };

  const validateLogin = () => {
    const e = {};
    if (!email) e.email = "Ingresa tu correo";
    else if (!emailRegex.test(email)) e.email = "Correo inválido";
    if (!password) e.password = "Ingresa tu contraseña";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    return e;
  };

  const validateRegister = () => {
    const e = {};
    if (!name.trim()) e.name = "Ingresa tu nombre";
    if (!lastName.trim()) e.lastName = "Ingresa tu apellido";
    if (!email) e.email = "Ingresa tu correo";
    else if (!emailRegex.test(email)) e.email = "Correo inválido";
    if (!password) e.password = "Ingresa tu contraseña";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    if (!phone || phone.length !== 9) e.phone = "Ingresa 9 dígitos";
    if (!birthDate) e.birthDate = "Ingresa tu fecha de nacimiento";
    if (!gender) e.gender = "Selecciona tu género";
    if (!relation) e.relation = "Selecciona tu relación";
    if (relation === "miembro") {
      if (!stateValue) e.stateValue = "Selecciona un estado";
      if (!parish) e.parish = "Selecciona un barrio";
    }
    if (!termsAccepted) e.termsAccepted = "Debes aceptar los términos";
    return e;
  };

  // ── LOGIN NORMAL → siempre va a "/" sin importar el rol ──────
  const handleLogin = async () => {
    const e = validateLogin();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await loginUser(email, password);
      navigate("/"); // siempre home — los portales tienen su propio login
    } catch (err) {
      showToast(getAuthError(err?.code));
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTRO ─────────────────────────────────────────────────
  const handleRegister = async () => {
    const e = validateRegister();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await registerUser({
        email, password, name, lastName,
        phone, birthDate, gender, relation,
        stateValue, parish,
      });
      navigate("/");
    } catch (err) {
      console.error("❌ Error registro:", err);
      if (err?.code === "phone/already-in-use") {
        setErrors({ phone: "Este número ya está registrado." });
      } else {
        showToast(getAuthError(err?.code));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── RECUPERAR CONTRASEÑA ──────────────────────────────────────
  const handleReset = async () => {
    if (!email) { setErrors({ email: "Ingresa tu correo" }); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setSubView("success");
    } catch (err) {
      showToast(getAuthError(err?.code));
    } finally {
      setLoading(false);
    }
  };

  return {
    // UI
    panel, isRegister, subView, setSubView,
    toast, toastStyle, loading, errors, setErrors,
    showPw, setShowPw,
    // Acciones
    switchPanel, resetForms, showToast,
    handleLogin, handleRegister, handleReset,
    // Campos login
    email, setEmail,
    password, setPassword,
    // Campos registro
    name, setName,
    lastName, setLastName,
    phone, setPhone,
    birthDate, setBirthDate,
    gender, setGender,
    relation, setRelation,
    stateValue, setStateValue,
    parish, setParish,
    termsAccepted, setTermsAccepted,
  };
}