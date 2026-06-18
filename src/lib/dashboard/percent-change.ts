// Convenção única de variação percentual entre dois períodos/turnos: sem
// denominador (anterior <= 0), não tem variação válida pra mostrar.
export function percentChange(atual: number, anterior: number): number | null {
  return anterior > 0 ? ((atual - anterior) / anterior) * 100 : null;
}
