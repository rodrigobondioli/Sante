import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ERROS_PT: Record<string, string> = {
  "Invalid login credentials": "Email ou senha incorretos.",
  "Email not confirmed": "Confirme seu email antes de entrar.",
  "User already registered": "Este email já está cadastrado.",
  "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
  "over_email_send_rate_limit": "Muitas tentativas. Aguarde alguns minutos.",
  "For security purposes, you can only request this after 60 seconds": "Por segurança, aguarde 60 segundos antes de tentar novamente.",
  "Invalid email": "Email inválido.",
  "Signup requires a valid password": "Defina uma senha para continuar.",
  "Token has expired or is invalid": "Link expirado. Solicite um novo.",
  "New password should be different from the old password": "A nova senha deve ser diferente da atual.",
  "Unable to validate email address: invalid format": "Formato de email inválido.",
  "Email link is invalid or has expired": "Link inválido ou expirado. Solicite um novo.",
  "User not found": "Usuário não encontrado.",
};

export function traduzirErro(mensagem: string): string {
  for (const [en, pt] of Object.entries(ERROS_PT)) {
    if (mensagem.includes(en)) return pt;
  }
  return "Algo deu errado. Tente novamente.";
}
