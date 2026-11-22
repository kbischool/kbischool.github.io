import { h, field, mount, toast } from "../lib/dom.js";
import { auth } from "../lib/firebase.js";
import { applyActionCode, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, signOut } from "firebase/auth";
import { input, select, msg, busy, friendlyAuthError, loadNg, rolePicker } from "./common.js";
import { registerTeacher, registerParent, registerStudent, publicSchools, DEFAULT_STRUCTURE } from "../lib/data.js";
import { validPhone } from "../lib/dates.js";
import { dateSelect } from "../lib/datepick.js";
import { APP_NAME, SINGLE_SCHOOL, SCHOOL_NAME } from "../lib/config.js";

const CONSENT_VERSION = "draft-1";
const card = (...k) => h("div", { class: "card authcard" }, h("div", { class: "auth-brand" }, h("img", { src: `${import.meta.env.BASE_URL}assets/icons/logo.webp`, width: 40, height: 42, alt: "" }), h("span", {}, APP_NAME)), ...k);

/** Verification email whose link returns to the portal; falls back to Firebase's plain page if the address is not an authorised domain. */
async function sendVerification(user) {
  const url = location.origin + location.pathname;
  try { await sendEmailVerification(user, { url, handleCodeInApp: false }); }
  catch (e) { if (e?.code === "auth/unauthorized-continue-uri" || e?.code === "auth/invalid-continue-uri") await sendEmailVerification(user); else throw e; }
}
const consentBox = () => h("label", { class: "chk consent" }, h("input", { type: "checkbox", id: "consent" }),
  h("span", {}, "I have read the ", h("a", { href: "../privacy.html", target: "_blank", rel: "noopener" }, "privacy notice (draft)"), " and agree that the school may process this information to run the service, in line with the Nigeria Data Protection Act 2023."));

export function authView(kind) {
  const isLogin = kind === "login";
  const email = input({ id: "em", type: "email", autocomplete: "email", required: true, inputmode: "email" });
  const pw = input({ id: "pw", type: "password", autocomplete: isLogin ? "current-password" : "new-password", required: true });
  const out = h("p", { role: "alert", hidden: true });
  const go = h("button", { class: "btn btn-primary btn-block", type: "submit" }, isLogin ? "Log in" : "Create account");
  const form = h("form", { novalidate: true, onsubmit: async (e) => {
    e.preventDefault(); msg(out, "");
    if (!email.value.trim() || !pw.value) return msg(out, "Enter your email and password.");
    if (!isLogin && pw.value.length < 8) return msg(out, "Choose a password with at least 8 characters.");
    busy(go, true, "");
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email.value.trim(), pw.value);
      else { const c = await createUserWithEmailAndPassword(auth, email.value.trim(), pw.value); await sendVerification(c.user); }
    } catch (err) { msg(out, friendlyAuthError(err)); busy(go, false, ""); go.textContent = isLogin ? "Log in" : "Create account"; }
  } }, field("Email", email), field("Password", pw, isLogin ? null : "At least 8 characters."), out, go);
  const google = h("button", { class: "btn btn-block", type: "button", onclick: async () => {
    msg(out, ""); try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err) { msg(out, friendlyAuthError(err)); }
  } }, "Continue with Google");
  return card(h("h1", {}, isLogin ? "Log in" : "Create your account"),
    h("p", { class: "muted" }, isLogin ? `Sign in to the ${SCHOOL_NAME} portal.` : "Create an account with your email. Next you choose whether you are a parent, a student or a teacher."),
    form, h("div", { class: "or" }, "or"), google,
    h("p", { class: "links" }, isLogin ? [h("a", { href: "#/forgot" }, "Forgot password?"), " · ", h("a", { href: "#/register" }, "Create an account")] : [h("a", { href: "#/login" }, "I already have an account")]),
    isLogin ? servicesBlock() : null);
}

/** Other KBI services, one tap from the sign-in page. */
const SERVICES = [["Fees & Accounts", "Pay and track school fees", "https://school-fee-portal-4f0e6.web.app/"], ["E-learning", "Lessons and class resources", "https://kbischools.com.ng/lms"], ["CBT", "Computer-based tests", "https://kbischools.com.ng/signin/#/"]];
const servicesBlock = () => h("div", { class: "services" }, h("h2", {}, "Other KBI services"),
  SERVICES.map(([t, d, u]) => h("a", { href: u, target: "_blank", rel: "noopener noreferrer" }, t, h("span", {}, d))), h("a", { href: "../" }, "KBI Schools website", h("span", {}, "Back to the main site")));

export function forgotView() {
  const email = input({ id: "fe", type: "email", autocomplete: "email" }); const out = h("p", { role: "status", hidden: true });
  return card(h("h1", {}, "Reset your password"), h("p", { class: "muted" }, "We will email you a link to choose a new password."),
    h("form", { novalidate: true, onsubmit: async (e) => { e.preventDefault(); try { await sendPasswordResetEmail(auth, email.value.trim()); msg(out, "If that email has an account, a reset link is on its way. Check your inbox and spam folder.", "ok"); } catch (err) { msg(out, friendlyAuthError(err)); } } },
      field("Email", email), out, h("button", { class: "btn btn-primary btn-block", type: "submit" }, "Send reset link")),
    h("p", { class: "links" }, h("a", { href: "#/login" }, "Back to log in")));
}

/** Landing page for the verification link. The code is only used when the person taps the button, so a mail scanner or link preview that merely opens the page cannot use it up. */
export function emailActionView(oobCode, onDone) {
  const out = h("p", { role: "status", hidden: true });
  const go = h("button", { class: "btn btn-primary btn-block", type: "button", onclick: async () => {
    busy(go, true, "Confirm my email");
    try { await applyActionCode(auth, oobCode); msg(out, "Your email is verified.", "ok"); go.hidden = true; mount(host, card(h("h1", {}, "Email verified"), h("p", {}, "Thank you. You can now open the portal."), h("button", { class: "btn btn-primary btn-block", type: "button", onclick: onDone }, "Continue to the portal"))); }
    catch (e) { busy(go, false, "Confirm my email"); msg(out, e?.code === "auth/expired-action-code" || e?.code === "auth/invalid-action-code" ? "This link has expired or was already used. Go back to the portal and press \"I have verified my email\"; if that does not work, log in and ask for a new link." : friendlyAuthError(e)); }
  } }, "Confirm my email");
  const host = h("div", {});
  mount(host, card(h("h1", {}, "Confirm your email"), h("p", {}, "Press the button to finish verifying your email address."), out, go, h("p", { class: "links" }, h("a", { href: location.pathname }, "Back to the portal"))));
  return host;
}

export function verifyView(user, onDone) {
  const out = h("p", { role: "status", hidden: true });
  let done = false, timer = null;
  const check = async (manual) => {
    if (done) return;
    try { await user.reload(); } catch (e) { if (manual) msg(out, friendlyAuthError(e)); return; }
    if (user.emailVerified) { done = true; window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); try { await user.getIdToken(true); } catch (e) { /* the page reloads next */ } onDone(); }
    else if (manual) msg(out, "Not verified yet. Open the newest email from us and tap its link. If the link says it has expired or was already used, you may be verified already: wait a few seconds and this page continues by itself.", "error");
  };
  const onVisible = () => { if (document.visibilityState === "visible") check(false); };
  timer = window.setInterval(() => check(false), 4000);
  document.addEventListener("visibilitychange", onVisible);
  return card(h("h1", {}, "Check your email"), h("p", {}, "We sent a verification link to ", h("strong", {}, user.email), ". Open the newest email and tap the link. This page continues by itself once you are verified."),
    h("p", { class: "muted" }, "Sent it more than once? Only the newest link works. If a link says it has expired or was already used, come back here and press the first button."),
    out,
    h("div", { class: "stack" },
      h("button", { class: "btn btn-primary", type: "button", onclick: () => check(true) }, "I have verified my email"),
      h("button", { class: "btn", type: "button", onclick: async () => { try { await sendVerification(user); msg(out, "Sent again. Use only the newest email. Check your inbox and spam folder.", "ok"); } catch (e) { msg(out, friendlyAuthError(e)); } } }, "Send the link again"),
      h("button", { class: "btn", type: "button", onclick: () => { done = true; window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); signOut(auth); } }, "Use a different account")));
}

export function waitingView(kind, user) {
  const t = { pending: ["Waiting for approval", "Your school's admin must approve you before you can see any school data. Ask them to open Teachers and approve your request."],
    rejected: ["Request not approved", "Your school's admin did not approve this request. Speak to them if you think this is a mistake."],
    removed: ["Admin access removed", "The platform owner has replaced the admin of this school. Contact the platform owner if you think this is a mistake."],
    school: ["School waiting for verification", "The platform owner has not verified your school yet. Teachers can find your school only after it is verified. You can set up classes and subjects meanwhile."] }[kind];
  return card(h("h1", {}, t[0]), h("p", {}, t[1]), h("button", { class: "btn", type: "button", onclick: () => signOut(auth) }, "Log out"));
}

/** After verification, before a profile exists: choose a role and complete it. */
export function onboardingView(user, onDone) {
  const host = h("div", {});   const pick = () => mount(host, card(h("h1", {}, "Who are you?"),
    h("div", { class: "stack" },
      h("button", { class: "btn btn-primary", type: "button", onclick: () => parentForm("parent") }, "I am a parent"),
      h("button", { class: "btn btn-primary", type: "button", onclick: () => parentForm("student") }, "I am a student"),
      h("button", { class: "btn", type: "button", onclick: () => teacherForm() }, `I am a teacher at ${SCHOOL_NAME}`),
      h("button", { class: "btn btn-quiet", type: "button", onclick: () => signOut(auth) }, "Log out"))));
  const personal = (nameHint = "Surname first, e.g. ADEBAYO Temitope") => {
    const name = input({ id: "pn", placeholder: nameHint, autocomplete: "name" }); const phone = input({ id: "pp", type: "tel", placeholder: "08031234567 or +2348031234567", autocomplete: "tel" }); const dob = dateSelect({ id: "pd", label: "Date of birth", from: new Date().getFullYear() - 80, to: new Date().getFullYear() - 16 });
    return { name, phone, dob, el: [field("Full name (surname first)", name), field("Phone number", phone), field("Date of birth", dob)] };
  };
  const checkPersonal = (p, out) => {
    if (!p.name.value.trim()) return msg(out, "Enter your full name."), null;
    if (!validPhone(p.phone.value)) return msg(out, "Enter a valid Nigerian phone number."), null;
    const dob = p.dob.value; if (!dob) return msg(out, p.dob.partial ? "Choose the day, month and year of your date of birth." : "Choose your date of birth."), null;
    if (!document.getElementById("consent").checked) return msg(out, "Please tick the consent box to continue."), null;
    return { name: p.name.value.trim(), phone: p.phone.value.replace(/[\s-]/g, ""), dob };
  };
  const consent = () => ({ version: CONSENT_VERSION, at: new Date().toISOString() });
  const back = h("button", { class: "btn btn-quiet", type: "button", onclick: pick }, "Back");

  async function teacherForm() {
    const schools = await publicSchools().catch(() => []); const out = h("p", { role: "alert", hidden: true });
    const chosen = schools[0];
    if (!chosen) return mount(host, card(h("h1", {}, "Not ready yet"), h("p", { class: "muted" }, `${SCHOOL_NAME} has not been set up on the portal yet. Please try again later or contact the school office.`), back));
    const picker = rolePicker(chosen.structure || DEFAULT_STRUCTURE);
    const p = personal(); const go = h("button", { class: "btn btn-primary", type: "submit" }, "Send request");
    mount(host, card(h("h1", {}, "Join as a teacher"), h("form", { novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); msg(out, "");
      const r = picker.get(); if (!r.classTeacher && !r.assignments.length) return msg(out, "Choose a class you are class teacher for, or subjects and classes you teach.");
      const a = checkPersonal(p, out); if (!a) return;
      busy(go, true, "Send request");
      try { await registerTeacher({ user, teacher: a, schoolId: chosen.id, requested: { classTeacher: r.classTeacher, assignments: r.assignments }, consent: consent() }); onDone(); }
      catch (err) { msg(out, friendlyAuthError(err)); busy(go, false, "Send request"); }
    } }, h("p", { class: "muted" }, `Your request goes to the school admin at ${SCHOOL_NAME}. You see school data once they approve you.`), h("h2", {}, "Your roles"), picker.el, h("h2", {}, "Your details"), p.el, consentBox(), out, h("div", { class: "stack" }, go, back))));
  }

  function parentForm(role = "parent") {
    const isStudent = role === "student";
    const out = h("p", { role: "alert", hidden: true }); const name = input({ id: "pn", autocomplete: "name" }); const phone = input({ id: "pp", type: "tel" });
    const go = h("button", { class: "btn btn-primary", type: "submit" }, "Continue");
    mount(host, card(h("h1", {}, isStudent ? "Student" : "Parent"), h("p", { class: "muted" }, isStudent ? "You will link your own record with your admission number and the access code from the school on the next screen." : "You will link your child with the school's access code on the next screen."),
      h("form", { novalidate: true, onsubmit: async (e) => {
        e.preventDefault(); if (!name.value.trim()) return msg(out, "Enter your name."); if (!document.getElementById("consent").checked) return msg(out, "Please tick the consent box to continue.");
        busy(go, true, "Continue"); try { await (isStudent ? registerStudent : registerParent)({ user, name: name.value.trim(), phone: phone.value.replace(/[\s-]/g, ""), consent: consent() }); onDone(); } catch (err) { msg(out, friendlyAuthError(err)); busy(go, false, "Continue"); }
      } }, field(isStudent ? "Your full name" : "Your name", name), field("Phone (optional)", phone), consentBox(), out, h("div", { class: "stack" }, go, back))));
  }
  pick(); return host;
}
