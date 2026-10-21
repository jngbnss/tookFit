// 백엔드와 같은 규칙으로 먼저 검사해 빠르게 안내한다. 최종 검증은 백엔드가 한다.

export function validatePassword(pw: string): string | null {
  if (pw.length < 8 || pw.length > 64) return "비밀번호는 8~64자로 입력해주세요.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "비밀번호에 영문과 숫자를 모두 넣어주세요.";
  return null;
}

export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : "이메일 형식을 확인해주세요.";
}

export function validatePhone(phone: string, required = false): string | null {
  if (!phone.trim()) return required ? "휴대폰 번호를 입력해주세요." : null;
  return /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.trim()) ? null : "휴대폰 번호를 정확히 입력해주세요.";
}
