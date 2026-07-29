type R = { ok: true } | { ok: false; issues: string[] };
function f(): R { return { ok: false, issues: ["a"] }; }
function g() {
  const r = f();
  if (r.ok === false) {
    console.log(r.issues);
  }
}
function h() {
  const r = f();
  if (r.ok) {
  } else {
    console.log(r.issues);
  }
}
